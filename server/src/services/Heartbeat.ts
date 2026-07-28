import type { PeerManager } from './PeerManager.js';
import type { RoomManager } from './RoomManager.js';
import { config } from '../config/index.js';
import { logger } from '../logger/index.js';

export class HeartbeatSystem {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly peerManager: PeerManager;
  private readonly roomManager: RoomManager;

  constructor(peerManager: PeerManager, roomManager: RoomManager) {
    this.peerManager = peerManager;
    this.roomManager = roomManager;
  }

  /** Starts the heartbeat interval. */
  public start(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.tick();
    }, config.PING_INTERVAL_MS);

    logger.info('Heartbeat system started');
  }

  /** Stops the heartbeat interval. */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** The core tick loop: ping all peers and disconnect stale ones. */
  private tick(): void {
    const peers = this.peerManager.getAll();

    // 1. Identify stale peers
    const stalePeers = this.peerManager.findStalePeers(config.PING_TIMEOUT_MS);
    
    if (stalePeers.length > 0) {
      logger.warn({ count: stalePeers.length }, 'Disconnecting stale peers');
      for (const peer of stalePeers) {
        // Mark as disconnected
        this.peerManager.setConnectionState(peer.peerId, 'STALE');
        
        // Remove from room if in one
        if (peer.roomId) {
          const room = this.roomManager.removePeerFromAnyRoom(peer.peerId, peer.roomId);
          if (room) {
            // Notify remaining peer if necessary (handled by event system later)
            // For now, just remove from room logic
          }
        }

        // Force close socket
        peer.socket.terminate();
        
        // Remove from memory
        this.peerManager.removePeer(peer.peerId);
      }
    }

    // 2. Ping remaining peers
    const pingMessage = JSON.stringify({
      type: 'PING',
      timestamp: Date.now(),
      requestId: 'SYSTEM',
    });

    for (const peer of peers) {
      if (peer.connectionState === 'CONNECTED' && peer.socket.readyState === 1) { // 1 = OPEN
        peer.socket.send(pingMessage);
      }
    }
  }
}
