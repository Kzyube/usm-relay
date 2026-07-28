import { WebSocketServer } from 'ws';
import * as http from 'http';
import { config } from './config/index.js';
import { logger } from './logger/index.js';
import { PeerManager } from './services/PeerManager.js';
import { RoomManager } from './services/RoomManager.js';
import { HeartbeatSystem } from './services/Heartbeat.js';
import { parseIncomingMessage } from './validators/index.js';
import { sendMessage, sendError } from './utils/messages.js';

// ─────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────

const peerManager = new PeerManager();
const roomManager = new RoomManager();
const heartbeat = new HeartbeatSystem(peerManager, roomManager);

// Basic HTTP Server for Health Checks (required by Heroku/Render/DigitalOcean)
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// Attach WebSocket server to HTTP server
const wss = new WebSocketServer({ 
  server, 
  maxPayload: config.MAX_PAYLOAD_SIZE_BYTES 
});

heartbeat.start();

// ─────────────────────────────────────────────
// Connection Handling
// ─────────────────────────────────────────────

wss.on('connection', (socket, request) => {
  const ip = request.socket.remoteAddress;
  const userAgent = request.headers['user-agent'];

  // Optional: Origin validation could go here
  
  // Register peer
  const peer = peerManager.addPeer(socket, ip, userAgent);

  // Send SERVER_INFO upon connection
  sendMessage(socket, 'SERVER_INFO', { 
    version: '1.0.0', 
    peerId: peer.peerId 
  });

  // Handle incoming messages
  socket.on('message', (data) => {
    try {
      // 1. Validation & Parsing
      const rawString = data.toString();
      const parsed = parseIncomingMessage(rawString);
      
      // Update heartbeat on any valid message
      peerManager.refreshHeartbeat(peer.peerId);

      // 2. Routing
      switch (parsed.type) {
        case 'PONG':
          // Heartbeat refreshed above, nothing else to do
          break;

        case 'CREATE_ROOM': {
          const room = roomManager.createRoom(
            peer.peerId, 
            parsed.payload?.maxPeers, 
            parsed.payload?.password, 
            parsed.payload?.selfDestruct
          );
          peerManager.assignRoom(peer.peerId, room.roomId);
          sendMessage(socket, 'ROOM_CREATED', { roomId: room.roomId, peerId: peer.peerId }, parsed.requestId);
          break;
        }

        case 'JOIN_ROOM': {
          const roomId = parsed.payload.roomId;
          try {
            const room = roomManager.joinRoom(roomId, peer.peerId, parsed.payload?.password);
            peerManager.assignRoom(peer.peerId, roomId);
            
            // Tell the joiner who is in the room
            sendMessage(socket, 'ROOM_JOINED', { 
              roomId, 
              peerId: peer.peerId, 
              peers: Array.from(room.peers) 
            }, parsed.requestId);

            // Notify others in the room
            for (const otherPeerId of room.peers) {
              if (otherPeerId !== peer.peerId) {
                const otherPeer = peerManager.getPeer(otherPeerId);
                if (otherPeer) {
                  sendMessage(otherPeer.socket, 'PEER_JOINED', { peerId: peer.peerId });
                }
              }
            }
          } catch (err: any) {
            let errorMsg = 'Room is full, closed, or does not exist.';
            if (err.message === 'INVALID_PASSWORD') errorMsg = 'Invalid password.';
            sendError(socket, err.message || 'ROOM_NOT_FOUND', errorMsg, parsed.requestId);
          }
          break;
        }

        case 'LEAVE_ROOM': {
          if (!peer.roomId) {
            sendError(socket, 'NOT_IN_ROOM', 'You are not in a room.', parsed.requestId);
            break;
          }
          
          const roomId = peer.roomId;
          const room = roomManager.leaveRoom(roomId, peer.peerId);
          peerManager.clearRoom(peer.peerId);

          if (room) {
             // Notify others
             for (const otherPeerId of room.peers) {
               const otherPeer = peerManager.getPeer(otherPeerId);
               if (otherPeer) {
                 sendMessage(otherPeer.socket, 'PEER_LEFT', { peerId: peer.peerId });
               }
             }
          }
          break;
        }

        case 'OFFER':
        case 'ANSWER':
        case 'ICE_CANDIDATE': {
          if (!peer.roomId) {
            sendError(socket, 'NOT_IN_ROOM', 'Must be in a room to send WebRTC signals.', parsed.requestId);
            break;
          }
          
          const targetId = parsed.payload.targetPeerId;
          const targetPeer = peerManager.getPeer(targetId);
          
          if (!targetPeer || targetPeer.roomId !== peer.roomId) {
            sendError(socket, 'PEER_NOT_FOUND', 'Target peer is not in this room.', parsed.requestId);
            break;
          }

          // Relay the message exactly as it came, just swapping the senderId
          sendMessage(targetPeer.socket, parsed.type as 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE', parsed.payload, parsed.requestId);
          break;
        }
        
        case 'TRANSFER_COMPLETE': {
          if (!peer.roomId) break;
          const room = roomManager.getRoom(peer.roomId);
          if (room && room.selfDestruct) {
             roomManager.destroyRoom(peer.roomId);
             logger.info({ roomId: peer.roomId }, 'Room self-destructed upon transfer completion.');
          }
          break;
        }
      }
      
    } catch (err: any) {
      logger.warn({ peerId: peer.peerId, error: err.message }, 'Invalid message received');
      sendError(socket, 'INVALID_MESSAGE', err.message);
    }
  });

  // Handle disconnects
  socket.on('close', () => {
    peerManager.setConnectionState(peer.peerId, 'DISCONNECTED');
    if (peer.roomId) {
      const room = roomManager.leaveRoom(peer.roomId, peer.peerId);
      if (room) {
        // Notify remaining peers
        for (const otherPeerId of room.peers) {
          const otherPeer = peerManager.getPeer(otherPeerId);
          if (otherPeer) {
             sendMessage(otherPeer.socket, 'PEER_DISCONNECTED', { peerId: peer.peerId });
          }
        }
      }
    }
    peerManager.removePeer(peer.peerId);
  });
});

// ─────────────────────────────────────────────
// Startup
// ─────────────────────────────────────────────

server.listen(config.PORT, () => {
  logger.info(`🚀 Signaling server running on port ${config.PORT} in ${config.NODE_ENV} mode.`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully.');
  heartbeat.stop();
  roomManager.destroy();
  server.close(() => {
    process.exit(0);
  });
});
