import type { WebSocket } from 'ws';
import type { ServerMessage, ServerMessageType } from '../types/index.js';
import { ErrorCodeType } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

/** Send a structured JSON message to a specific socket. */
export function sendMessage<T>(
  socket: WebSocket,
  type: ServerMessageType,
  payload: T,
  replyToRequestId?: string,
): void {
  if (socket.readyState !== 1) return; // WebSocket.OPEN is 1

  const msg: ServerMessage<T> = {
    type,
    payload,
    timestamp: Date.now(),
    requestId: replyToRequestId || uuidv4(),
  };

  socket.send(JSON.stringify(msg));
}

/** Send a standardized error message. */
export function sendError(
  socket: WebSocket,
  code: ErrorCodeType,
  message: string,
  replyToRequestId?: string,
  details?: string,
): void {
  sendMessage(
    socket,
    'ERROR',
    { code, message, details },
    replyToRequestId,
  );
}
