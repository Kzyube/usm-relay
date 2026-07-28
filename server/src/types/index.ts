import type { WebSocket } from 'ws';

// ─────────────────────────────────────────────
// Peer
// ─────────────────────────────────────────────

export type ConnectionState =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'STALE';

export interface Peer {
  peerId: string;
  socket: WebSocket;
  roomId: string | null;
  connectionState: ConnectionState;
  lastHeartbeat: number;
  createdAt: number;
  userAgent?: string;
  ip?: string;
}

// ─────────────────────────────────────────────
// Room
// ─────────────────────────────────────────────

export type RoomStatus = 'WAITING' | 'READY' | 'TRANSFERRING' | 'CLOSED';

export interface Room {
  roomId: string;
  ownerId: string;
  peers: Set<string>; // set of peerIds
  status: RoomStatus;
  createdAt: number;
  lastActivity: number;
  maxPeers: number;
  expiresAt: number;
  password?: string;
  selfDestruct?: boolean;
}

// ─────────────────────────────────────────────
// Messages (Client → Server)
// ─────────────────────────────────────────────

export type ClientMessageType =
  | 'CREATE_ROOM'
  | 'JOIN_ROOM'
  | 'OFFER'
  | 'ANSWER'
  | 'ICE_CANDIDATE'
  | 'PONG'
  | 'LEAVE_ROOM'
  | 'TRANSFER_READY'
  | 'TRANSFER_COMPLETE'
  | 'TRANSFER_CANCELLED';

// ─────────────────────────────────────────────
// Messages (Server → Client)
// ─────────────────────────────────────────────

export type ServerMessageType =
  | 'ROOM_CREATED'
  | 'ROOM_JOINED'
  | 'PEER_JOINED'
  | 'PEER_LEFT'
  | 'PEER_DISCONNECTED'
  | 'OFFER'
  | 'ANSWER'
  | 'ICE_CANDIDATE'
  | 'PING'
  | 'ERROR'
  | 'SERVER_INFO'
  | 'TRANSFER_READY'
  | 'TRANSFER_COMPLETE'
  | 'TRANSFER_CANCELLED';

export interface BaseMessage {
  type: ClientMessageType | ServerMessageType;
  timestamp: number;
  requestId: string;
  senderId?: string;
  roomId?: string;
}

export interface ClientMessage<T = unknown> extends BaseMessage {
  type: ClientMessageType;
  payload: T;
}

export interface ServerMessage<T = unknown> extends BaseMessage {
  type: ServerMessageType;
  payload: T;
}

// ─────────────────────────────────────────────
// Payloads
// ─────────────────────────────────────────────

export interface CreateRoomPayload {
  maxPeers?: number;
  password?: string;
  selfDestruct?: boolean;
}

export interface JoinRoomPayload {
  roomId: string;
  password?: string;
}

export interface SDPPayload {
  sdp: Record<string, any>;
  targetPeerId: string;
}

export interface IceCandidatePayload {
  candidate: Record<string, any>;
  targetPeerId: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: string;
}

export interface RoomCreatedPayload {
  roomId: string;
  peerId: string;
}

export interface RoomJoinedPayload {
  roomId: string;
  peerId: string;
  peers: string[];
}

export interface PeerJoinedPayload {
  peerId: string;
}

// ─────────────────────────────────────────────
// Server Statistics
// ─────────────────────────────────────────────

export interface ServerStats {
  activePeers: number;
  activeRooms: number;
  uptimeSeconds: number;
  totalRoomsCreated: number;
  totalPeersConnected: number;
}

// ─────────────────────────────────────────────
// Error Codes
// ─────────────────────────────────────────────

export const ErrorCode = {
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  ROOM_CLOSED: 'ROOM_CLOSED',
  PEER_NOT_FOUND: 'PEER_NOT_FOUND',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  RATE_LIMITED: 'RATE_LIMITED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  NOT_IN_ROOM: 'NOT_IN_ROOM',
  ORIGIN_REJECTED: 'ORIGIN_REJECTED',
  DUPLICATE_REQUEST: 'DUPLICATE_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
