import { v4 as uuidv4 } from 'uuid';
import type { Room, RoomStatus } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from '../logger/index.js';

export class RoomManager {
  private readonly rooms = new Map<string, Room>();
  private totalRoomsCreated = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start automatic cleanup every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  /** Create a new room and assign the creator as owner. */
  public createRoom(ownerId: string, maxPeers = config.MAX_ROOM_SIZE): Room {
    const room: Room = {
      roomId: uuidv4().substring(0, 8).toUpperCase(), // Short, readable room code
      ownerId,
      peers: new Set([ownerId]),
      status: 'WAITING',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      maxPeers,
      expiresAt: Date.now() + config.ROOM_TIMEOUT_MS,
    };
    this.rooms.set(room.roomId, room);
    this.totalRoomsCreated++;
    logger.info({ roomId: room.roomId, ownerId }, 'Room created');
    return room;
  }

  /** Add a peer to an existing room. Returns null if the room is full or not found. */
  public joinRoom(roomId: string, peerId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn({ roomId, peerId }, 'Join failed: room not found');
      return null;
    }
    if (room.peers.size >= room.maxPeers) {
      logger.warn({ roomId, peerId }, 'Join failed: room full');
      return null;
    }
    if (room.status === 'CLOSED') {
      logger.warn({ roomId, peerId }, 'Join failed: room closed');
      return null;
    }
    room.peers.add(peerId);
    room.lastActivity = Date.now();
    room.expiresAt = Date.now() + config.ROOM_TIMEOUT_MS;

    // Transition to READY when max peers joined
    if (room.peers.size >= room.maxPeers) {
      room.status = 'READY';
    }
    logger.info({ roomId, peerId, peerCount: room.peers.size }, 'Peer joined room');
    return room;
  }

  /** Remove a peer from a room. Destroys the room if it becomes empty. */
  public leaveRoom(roomId: string, peerId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.peers.delete(peerId);
    room.lastActivity = Date.now();
    logger.info({ roomId, peerId, remaining: room.peers.size }, 'Peer left room');

    if (room.peers.size === 0) {
      // Do not destroy the room immediately! 
      // This allows mobile users (like iOS Safari) to reconnect if their 
      // app goes to the background temporarily.
      // The room will be cleaned up automatically when it expires.
      return null;
    }

    // If peer count drops below max, go back to waiting
    if (room.status === 'READY' && room.peers.size < room.maxPeers) {
      room.status = 'WAITING';
    }
    return room;
  }

  /** Get a room by ID. */
  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /** Update the room's status. */
  public setStatus(roomId: string, status: RoomStatus): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = status;
      room.lastActivity = Date.now();
    }
  }

  /** Get the other peer in a 2-peer room. Returns undefined if not applicable. */
  public getOtherPeer(roomId: string, peerId: string): string | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    for (const id of room.peers) {
      if (id !== peerId) return id;
    }
    return undefined;
  }

  /** Remove a peer from whatever room they are in. */
  public removePeerFromAnyRoom(peerId: string, roomId: string | null): Room | null {
    if (!roomId) return null;
    return this.leaveRoom(roomId, peerId);
  }

  /** Forcibly destroy a room and clean up its state. */
  public destroyRoom(roomId: string): void {
    if (this.rooms.has(roomId)) {
      this.rooms.delete(roomId);
      logger.info({ roomId }, 'Room destroyed');
    }
  }

  /** Periodic cleanup: remove expired and empty rooms. */
  public cleanup(): void {
    const now = Date.now();
    let removed = 0;
    for (const [roomId, room] of this.rooms) {
      if (room.expiresAt < now || room.peers.size === 0) {
        this.rooms.delete(roomId);
        removed++;
      }
    }
    if (removed > 0) {
      logger.info({ removed }, 'Cleanup: expired rooms removed');
    }
  }

  /** Get total active room count. */
  public count(): number {
    return this.rooms.size;
  }

  /** Get all-time rooms created stat. */
  public totalCreated(): number {
    return this.totalRoomsCreated;
  }

  /** Stop the cleanup interval on shutdown. */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
