import { useState, useEffect, useRef, useCallback } from 'react';

const isLocalNetwork = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname.startsWith('192.168.') || 
   window.location.hostname.startsWith('10.'));

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
  (isLocalNetwork 
    ? `ws://${window.location.hostname}:8080` 
    : 'wss://dry-tundra-73460-088c768155ac.herokuapp.com');
const SEND_CHUNK_SIZE = 64 * 1024; // 64 KB is optimal for SCTP
const READ_BLOCK_SIZE = 4 * 1024 * 1024; // Read 4MB from disk at once

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'WAITING_FOR_PEER' | 'PEER_CONNECTED' | 'WAITING_TO_ACCEPT' | 'TRANSFERRING' | 'COMPLETE' | 'ERROR';

interface TransferProgress {
  fileName: string;
  progress: number; // 0 to 100
  speed?: string; // MB/s string
  eta?: number; // seconds remaining
}

interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

export function useWebRTC() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  const [roomId, setRoomIdState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<TransferProgress | null>(null);

  const fileHandle = useRef<any>(null);
  const writableStream = useRef<any>(null);

  const ws = useRef<WebSocket | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const myPeerId = useRef<string | null>(null);
  const targetPeerId = useRef<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const isInitiator = useRef<boolean>(false);
  const isCancelled = useRef<boolean>(false);

  const cancelTransfer = useCallback(() => {
    isCancelled.current = true;
    if (dataChannel.current && dataChannel.current.readyState === 'open') {
      dataChannel.current.send(JSON.stringify({ type: 'CANCEL' }));
    }
    setConnectionState('PEER_CONNECTED');
    setProgress(null);
    if (writableStream.current) {
       try { writableStream.current.abort(); } catch(e) {}
       writableStream.current = null;
    }
  }, []);

  // Wrapper to keep both state and ref in sync
  const setRoomId = useCallback((id: string | null) => {
    roomIdRef.current = id;
    setRoomIdState(id);
  }, []);

  // Receiving state
  const receiveBuffer = useRef<ArrayBuffer[]>([]);
  const receivedSize = useRef<number>(0);
  const expectedFile = useRef<FileMetadata | null>(null);

  // Analytics state for receiver
  const lastSpeedCalcTime = useRef<number>(0);
  const bytesSinceLastCalc = useRef<number>(0);
  const currentSpeed = useRef<string>("0.00");
  const currentEta = useRef<number>(0);
  const lastProgressUpdate = useRef<number>(0);

  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  const sendWsMessage = (type: string, payload?: any, additionalBaseProps: any = {}) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    const msg = {
      type,
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
      ...additionalBaseProps,
    };
    if (payload) {
      msg.payload = payload;
    }
    ws.current.send(JSON.stringify(msg));
  };

  const initWebSocket = useCallback((onOpen: () => void) => {
    if (ws.current) {
      if (ws.current.readyState === WebSocket.OPEN) {
        onOpen();
      } else if (ws.current.readyState === WebSocket.CONNECTING) {
        const existingOnOpen = ws.current.onopen;
        ws.current.onopen = (ev) => {
          if (existingOnOpen) existingOnOpen.call(ws.current!, ev);
          onOpen();
        };
      }
      return;
    }

    setConnectionState('CONNECTING');
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      onOpen();
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      // On iOS, backgrounding the app throws an error and closes WS. We will rely on onclose to reconnect.
    };

    ws.current.onclose = () => {
      setConnectionState('DISCONNECTED');
      // If we had a room, try to reconnect after a short delay
      if (roomIdRef.current) {
        setTimeout(() => {
          if (connectionState !== 'CONNECTING' && connectionState !== 'PEER_CONNECTED') {
            initWebSocket(() => {
              // Try to rejoin our existing room
              if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ type: 'JOIN_ROOM', payload: { roomId: roomIdRef.current } }));
              }
            });
          }
        }, 2000);
      }
    };

    ws.current.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'SERVER_INFO':
            myPeerId.current = msg.payload.peerId;
            break;

          case 'ROOM_CREATED':
            setRoomId(msg.payload.roomId);
            setConnectionState('WAITING_FOR_PEER');
            break;

          case 'ROOM_JOINED':
            // We joined an existing room
            setRoomId(msg.payload.roomId);
            const otherPeers = msg.payload.peers.filter((p: string) => p !== myPeerId.current);
            roomIdRef.current = msg.payload.roomId;
            setRoomIdState(msg.payload.roomId);
            
            // If we reconnected as the sender (initiator), and the receiver is here, initiate offer
            if (isInitiator.current && otherPeers.length > 0) {
              targetPeerId.current = otherPeers[0];
              if (pc.current) {
                const offer = await pc.current.createOffer();
                await pc.current.setLocalDescription(offer);
                sendWsMessage('OFFER', { sdp: pc.current.localDescription, targetPeerId: targetPeerId.current }, { roomId: roomIdRef.current });
              }
            } else if (!isInitiator.current && otherPeers.length > 0) {
              // We are the receiver, just set the target peer ID and wait for their offer
              targetPeerId.current = otherPeers[0];
            }
            break;

          case 'PEER_JOINED':
            targetPeerId.current = msg.payload.peerId;
            // Wait for data channel onopen to set PEER_CONNECTED

            // Initiator creates offer
            if (isInitiator.current && pc.current && targetPeerId.current) {
              const offer = await pc.current.createOffer();
              await pc.current.setLocalDescription(offer);
              sendWsMessage('OFFER', { sdp: pc.current.localDescription, targetPeerId: targetPeerId.current }, { roomId: roomIdRef.current });
            }
            break;

          case 'OFFER':
            if (pc.current && targetPeerId.current) {
              await pc.current.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));

              // Apply pending candidates
              for (const candidate of pendingCandidates.current) {
                await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
              }
              pendingCandidates.current = [];

              const answer = await pc.current.createAnswer();
              await pc.current.setLocalDescription(answer);
              sendWsMessage('ANSWER', { sdp: pc.current.localDescription, targetPeerId: targetPeerId.current }, { roomId: roomIdRef.current });
            }
            break;

          case 'ANSWER':
            if (pc.current) {
              await pc.current.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));

              // Apply pending candidates
              for (const candidate of pendingCandidates.current) {
                await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
              }
              pendingCandidates.current = [];
            }
            break;

          case 'ICE_CANDIDATE':
            if (pc.current && msg.payload.candidate) {
              if (pc.current.remoteDescription) {
                await pc.current.addIceCandidate(new RTCIceCandidate(msg.payload.candidate));
              } else {
                pendingCandidates.current.push(msg.payload.candidate);
              }
            }
            break;

          case 'PING':
            sendWsMessage('PONG');
            break;

          case 'ERROR':
            console.error('Server error:', msg.payload.message);
            setError(msg.payload.message);
            setConnectionState('ERROR');
            break;
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    ws.current.onclose = () => {
      setConnectionState('DISCONNECTED');
      ws.current = null;
    };
  }, [setRoomId]);

  const initWebRTC = useCallback(() => {
    pc.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });

    pc.current.onicecandidate = (event) => {
      if (event.candidate && ws.current && roomIdRef.current && targetPeerId.current) {
        sendWsMessage('ICE_CANDIDATE', { candidate: event.candidate, targetPeerId: targetPeerId.current }, { roomId: roomIdRef.current });
      }
    };

    pc.current.ondatachannel = (event) => {
      const channel = event.channel;
      setupDataChannel(channel);
    };
  }, [roomId]);

  const setupDataChannel = (channel: RTCDataChannel) => {
    dataChannel.current = channel;
    channel.binaryType = 'arraybuffer';
    channel.bufferedAmountLowThreshold = 8 * 1024 * 1024; // 8 MB backpressure threshold

    channel.onopen = () => {
      setConnectionState('PEER_CONNECTED');
    };

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'CANCEL') {
            setConnectionState('PEER_CONNECTED');
            setProgress(null);
            receiveBuffer.current = [];
            receivedSize.current = 0;
            return;
          }
          
          if (msg.type === 'METADATA') {
            expectedFile.current = msg as FileMetadata;
            receiveBuffer.current = [];
            receivedSize.current = 0;
            
            lastSpeedCalcTime.current = Date.now();
            bytesSinceLastCalc.current = 0;
            currentSpeed.current = "0.00";
            currentEta.current = 0;
            lastProgressUpdate.current = Date.now();
            setProgress({ fileName: msg.name, progress: 0, speed: "0.00", eta: 0 });
            setConnectionState('WAITING_TO_ACCEPT');
            return;
          }
          
          // Legacy check
          if (msg.name && !msg.type) {
            expectedFile.current = msg as FileMetadata;
            receiveBuffer.current = [];
            receivedSize.current = 0;
            lastSpeedCalcTime.current = Date.now();
            bytesSinceLastCalc.current = 0;
            currentSpeed.current = "0.00";
            currentEta.current = 0;
            lastProgressUpdate.current = Date.now();
            setProgress({ fileName: msg.name, progress: 0, speed: "0.00", eta: 0 });
            setConnectionState('TRANSFERRING');
            channel.send(JSON.stringify({ type: 'OFFSET', value: 0 }));
          }
        } catch (e) {
          console.error("Error parsing data channel string message", e);
        }
      } else {
        receivedSize.current += event.data.byteLength;
        bytesSinceLastCalc.current += event.data.byteLength;

        if (writableStream.current) {
          writableStream.current.write(event.data).catch((e: any) => console.error("Write error:", e));
        } else {
          receiveBuffer.current.push(event.data);
        }

        if (expectedFile.current) {
          const now = Date.now();
          
          if (now - lastSpeedCalcTime.current >= 500) {
             const seconds = (now - lastSpeedCalcTime.current) / 1000;
             const speedBps = bytesSinceLastCalc.current / seconds;
             currentSpeed.current = (speedBps / (1024 * 1024)).toFixed(2);
             const remainingBytes = expectedFile.current.size - receivedSize.current;
             currentEta.current = speedBps > 0 ? Math.ceil(remainingBytes / speedBps) : 0;
             
             lastSpeedCalcTime.current = now;
             bytesSinceLastCalc.current = 0;
          }

          if (now - lastProgressUpdate.current > 100 || receivedSize.current === expectedFile.current.size) {
             const percent = Math.floor((receivedSize.current / expectedFile.current.size) * 100);
             setProgress({ 
               fileName: expectedFile.current.name, 
               progress: percent,
               speed: currentSpeed.current,
               eta: currentEta.current
             });
             lastProgressUpdate.current = now;
          }

          if (receivedSize.current === expectedFile.current.size) {
             setConnectionState('COMPLETE');
             sendWsMessage('TRANSFER_COMPLETE');
             if (writableStream.current) {
                writableStream.current.close().catch((e: any) => console.error("Close err:", e)).then(() => {
                   writableStream.current = null;
                   fileHandle.current = null;
                });
             } else {
                downloadFile(receiveBuffer.current, expectedFile.current);
             }
          }
        }
      }
    };
  };

  const acceptTransfer = useCallback(async () => {
    if (!expectedFile.current || !dataChannel.current) return;
    
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: expectedFile.current.name
        });
        fileHandle.current = handle;
        writableStream.current = await handle.createWritable();
      } catch (err: any) {
        if (err.name === 'AbortError') {
           cancelTransfer();
           return;
        }
        console.warn("FileSystem API failed, falling back to RAM", err);
      }
    }
    
    setConnectionState('TRANSFERRING');
    dataChannel.current.send(JSON.stringify({ type: 'OFFSET', value: 0 }));
  }, [cancelTransfer]);

  const downloadFile = (buffers: ArrayBuffer[], metadata: FileMetadata) => {
    const blob = new Blob(buffers, { type: metadata.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = metadata.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const createRoom = useCallback((password?: string, selfDestruct?: boolean) => {
    isInitiator.current = true;
    initWebRTC();
    initWebSocket(() => {
      dataChannel.current = pc.current!.createDataChannel('fileTransfer');
      setupDataChannel(dataChannel.current);
      sendWsMessage('CREATE_ROOM', { password, selfDestruct });
    });
  }, [initWebRTC, initWebSocket]);

  const joinRoom = useCallback((id: string, password?: string) => {
    isInitiator.current = false;
    setError(null);
    setRoomId(id);
    initWebRTC();
    initWebSocket(() => {
      sendWsMessage('JOIN_ROOM', { roomId: id, password });
    });
  }, [initWebRTC, initWebSocket]);

  const sendFile = useCallback(async (file: File) => {
    if (!dataChannel.current || dataChannel.current.readyState !== 'open') {
      setError('Data channel not open');
      return;
    }

    isCancelled.current = false;
    setConnectionState('TRANSFERRING');
    setProgress({ fileName: file.name, progress: 0 });

    const metadata = {
      type: 'METADATA',
      name: file.name,
      size: file.size,
      fileType: file.type
    };

    // Send metadata first
    dataChannel.current.send(JSON.stringify(metadata));

    try {
      const offset = await new Promise<number>((resolve, reject) => {
        const handler = (e: MessageEvent) => {
          if (typeof e.data === 'string') {
            try {
              const msg = JSON.parse(e.data);
              if (msg.type === 'OFFSET') {
                dataChannel.current!.removeEventListener('message', handler);
                resolve(msg.value);
              } else if (msg.type === 'CANCEL') {
                dataChannel.current!.removeEventListener('message', handler);
                reject(new Error("CANCELLED"));
              }
            } catch {}
          }
        };
        dataChannel.current!.addEventListener('message', handler);
        setTimeout(() => {
           dataChannel.current?.removeEventListener('message', handler);
           resolve(0);
        }, 3000);
      });

      let currentOffset = offset;
      let lastProgressUpdate = Date.now();
      let lastSpeedCalcTime = Date.now();
      let bytesSinceLastCalc = 0;
      let currentSpeed = "0.00";
      let currentEta = 0;
      
      while (currentOffset < file.size) {
        if (isCancelled.current) throw new Error("CANCELLED");
        if (!dataChannel.current || dataChannel.current.readyState !== 'open') break;
        
        // Read a large block from disk
        const sliceEnd = Math.min(currentOffset + READ_BLOCK_SIZE, file.size);
        const blockSlice = file.slice(currentOffset, sliceEnd);
        const arrayBuffer = await blockSlice.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        let blockOffset = 0;
        
        // Send block in smaller 64KB SCTP-friendly chunks
        while (blockOffset < uint8Array.byteLength) {
          if (isCancelled.current) throw new Error("CANCELLED");
          if (!dataChannel.current || dataChannel.current.readyState !== 'open') break;
          
          if (dataChannel.current.bufferedAmount > 16 * 1024 * 1024) {
            await new Promise<void>(resolve => {
              if (!dataChannel.current) { resolve(); return; }
              dataChannel.current.onbufferedamountlow = () => {
                if (dataChannel.current) dataChannel.current.onbufferedamountlow = null;
                resolve();
              };
            });
          }
          
          if (isCancelled.current) throw new Error("CANCELLED");
          
          const chunkEnd = Math.min(blockOffset + SEND_CHUNK_SIZE, uint8Array.byteLength);
          const chunk = uint8Array.subarray(blockOffset, chunkEnd);
          
          dataChannel.current.send(chunk);
          
          blockOffset += chunk.byteLength;
          currentOffset += chunk.byteLength;
          bytesSinceLastCalc += chunk.byteLength;
          
          const now = Date.now();
          
          if (now - lastSpeedCalcTime >= 500) {
             const seconds = (now - lastSpeedCalcTime) / 1000;
             const speedBps = bytesSinceLastCalc / seconds;
             currentSpeed = (speedBps / (1024 * 1024)).toFixed(2);
             const remainingBytes = file.size - currentOffset;
             currentEta = speedBps > 0 ? Math.ceil(remainingBytes / speedBps) : 0;
             
             lastSpeedCalcTime = now;
             bytesSinceLastCalc = 0;
          }

          if (now - lastProgressUpdate > 100 || currentOffset >= file.size) {
            const percent = Math.floor((currentOffset / file.size) * 100);
            setProgress({ 
              fileName: file.name, 
              progress: percent,
              speed: currentSpeed,
              eta: currentEta
            });
            lastProgressUpdate = now;
          }
        }
      }
      
      if (currentOffset >= file.size && !isCancelled.current) {
        setConnectionState('COMPLETE');
        sendWsMessage('TRANSFER_COMPLETE');
      }
    } catch (err: any) {
      if (err.message === "CANCELLED") {
        setConnectionState('PEER_CONNECTED');
        setProgress(null);
      } else {
        console.error("Transfer error:", err);
        setError("File transfer failed");
      }
    }
  }, []);

  // Update onicecandidate if targetPeerId changes
  useEffect(() => {
    if (pc.current) {
      pc.current.onicecandidate = (event) => {
        if (event.candidate && ws.current && roomIdRef.current && targetPeerId.current) {
          sendWsMessage('ICE_CANDIDATE', { candidate: event.candidate, targetPeerId: targetPeerId.current }, { roomId: roomIdRef.current });
        }
      };
    }
  }, [roomId]);

  // Cleanup on unmount (solves React Strict Mode ghost connections)
  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      if (pc.current) {
        pc.current.close();
        pc.current = null;
      }
      setConnectionState('DISCONNECTED');
      setRoomIdState(null);
      roomIdRef.current = null;
      targetPeerId.current = null;
      myPeerId.current = null;
    };
  }, []);

  return {
    connectionState,
    roomId,
    error,
    progress,
    createRoom,
    joinRoom,
    sendFile,
    acceptTransfer,
    cancelTransfer
  };
}
