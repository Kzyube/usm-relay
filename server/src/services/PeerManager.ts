import { v4 as uuidv4 } from 'uuid';
import type { WebSocket } from 'ws';
import type { Peer, ConnectionState } from '../types/index.js';
import { logger } from '../logger/index.js';

export class PeerManager {
  private readonly peers = new Map<string, Peer>();

  /** Register a new peer on connection. */
  public addPeer(socket: WebSocket, ip?: string, userAgent?: string): Peer {
    const peer: Peer = {
      peerId: uuidv4(),
      socket,
      roomId: null,
      connectionState: 'CONNECTED',
      lastHeartbeat: Date.now(),
      createdAt: Date.now(),
      ip,
      userAgent,
    };
    this.peers.set(peer.peerId, peer);
    logger.info({ peerId: peer.peerId, ip }, 'Peer connected');
    return peer;
  }

  /** Remove a peer on disconnection. */
  public removePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    this.peers.delete(peerId);
    logger.info({ peerId, roomId: peer.roomId }, 'Peer removed');
  }

  /** Lookup a peer by ID. */
  public getPeer(peerId: string): Peer | undefined {
    return this.peers.get(peerId);
  }

  /** Update the heartbeat timestamp for a peer. */
  public refreshHeartbeat(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.lastHeartbeat = Date.now();
    }
  }

  /** Set a peer's connection state. */
  public setConnectionState(peerId: string, state: ConnectionState): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.connectionState = state;
    }
  }

  /** Assign a peer to a room. */
  public assignRoom(peerId: string, roomId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.roomId = roomId;
    }
  }

  /** Clear a peer's room assignment. */
  public clearRoom(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.roomId = null;
    }
  }

  /** Find all peers that have missed their heartbeat deadline. */
  public findStalePeers(timeoutMs: number): Peer[] {
    const cutoff = Date.now() - timeoutMs;
    return [...this.peers.values()].filter(
      (p) => p.lastHeartbeat < cutoff && p.connectionState !== 'DISCONNECTED',
    );
  }

  /** Get total number of active peers. */
  public count(): number {
    return this.peers.size;
  }

  /** Get all active peers (for iteration). */
  public getAll(): Peer[] {
    return [...this.peers.values()];
  }
}
