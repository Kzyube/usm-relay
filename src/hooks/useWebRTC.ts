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
const CHUNK_SIZE = 64 * 1024; // 64 KB

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'WAITING_FOR_PEER' | 'PEER_CONNECTED' | 'TRANSFERRING' | 'COMPLETE' | 'ERROR';

interface TransferProgress {
  fileName: string;
  progress: number; // 0 to 100
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

  const ws = useRef<WebSocket | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const myPeerId = useRef<string | null>(null);
  const targetPeerId = useRef<string | null>(null);
  const roomIdRef = useRef<string | null>(null);

  // Wrapper to keep both state and ref in sync
  const setRoomId = useCallback((id: string | null) => {
    roomIdRef.current = id;
    setRoomIdState(id);
  }, []);

  // Receiving state
  const receiveBuffer = useRef<ArrayBuffer[]>([]);
  const receivedSize = useRef<number>(0);
  const expectedFile = useRef<FileMetadata | null>(null);

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
    if (ws.current) return;

    setConnectionState('CONNECTING');
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      onOpen();
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("WebSocket connection failed. If you are on an iPhone/iOS, make sure Local Network Access is allowed in Settings, or try using the public internet link instead of a local IP.");
      setConnectionState('ERROR');
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
            // We are the receiver
            setRoomId(msg.payload.roomId);
            const otherPeers = msg.payload.peers.filter((p: string) => p !== myPeerId.current);
            if (otherPeers.length > 0) {
              targetPeerId.current = otherPeers[0];
            }
            // Wait for data channel onopen to set PEER_CONNECTED
            break;

          case 'PEER_JOINED':
            // We are the sender
            targetPeerId.current = msg.payload.peerId;
            // Wait for data channel onopen to set PEER_CONNECTED

            // Initiator creates offer
            if (pc.current && targetPeerId.current) {
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
    channel.bufferedAmountLowThreshold = 65536; // 64 KB

    channel.onopen = () => {
      setConnectionState('PEER_CONNECTED');
    };

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const metadata = JSON.parse(event.data);
        expectedFile.current = metadata;
        receiveBuffer.current = [];
        receivedSize.current = 0;
        setProgress({ fileName: metadata.name, progress: 0 });
        setConnectionState('TRANSFERRING');
      } else {
        receiveBuffer.current.push(event.data);
        receivedSize.current += event.data.byteLength;

        if (expectedFile.current) {
          const percent = Math.floor((receivedSize.current / expectedFile.current.size) * 100);
          setProgress({ fileName: expectedFile.current.name, progress: percent });

          if (receivedSize.current === expectedFile.current.size) {
            setConnectionState('COMPLETE');
            downloadFile(receiveBuffer.current, expectedFile.current);
          }
        }
      }
    };
  };

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

  const createRoom = useCallback(() => {
    initWebRTC();
    initWebSocket(() => {
      dataChannel.current = pc.current!.createDataChannel('fileTransfer');
      setupDataChannel(dataChannel.current);
      sendWsMessage('CREATE_ROOM', {});
    });
  }, [initWebRTC, initWebSocket]);

  const joinRoom = useCallback((id: string) => {
    setRoomId(id);
    initWebRTC();
    initWebSocket(() => {
      sendWsMessage('JOIN_ROOM', { roomId: id });
    });
  }, [initWebRTC, initWebSocket]);

  const sendFile = useCallback(async (file: File) => {
    if (!dataChannel.current || dataChannel.current.readyState !== 'open') {
      setError('Data channel not open');
      return;
    }

    setConnectionState('TRANSFERRING');
    setProgress({ fileName: file.name, progress: 0 });

    const metadata: FileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type
    };

    // Send metadata first
    dataChannel.current.send(JSON.stringify(metadata));

    let offset = 0;
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result || !dataChannel.current) return;

      dataChannel.current.send(e.target.result as ArrayBuffer);
      offset += (e.target.result as ArrayBuffer).byteLength;

      const percent = Math.floor((offset / file.size) * 100);
      setProgress({ fileName: file.name, progress: percent });

      if (offset < file.size) {
        if (dataChannel.current.bufferedAmount > dataChannel.current.bufferedAmountLowThreshold) {
          dataChannel.current.onbufferedamountlow = () => {
            dataChannel.current!.onbufferedamountlow = null;
            readSlice(offset);
          };
        } else {
          readSlice(offset);
        }
      } else {
        setConnectionState('COMPLETE');
      }
    };

    const readSlice = (o: number) => {
      const slice = file.slice(o, o + CHUNK_SIZE);
      reader.readAsArrayBuffer(slice);
    };

    readSlice(0);

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
    sendFile
  };
}
