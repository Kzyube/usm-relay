import { z } from 'zod';
import { config } from '../config/index.js';

// Base schema that all incoming messages must match
export const baseMessageSchema = z.object({
  type: z.string(),
  timestamp: z.number().int().positive(),
  requestId: z.string().uuid(),
  senderId: z.string().uuid().optional(),
  roomId: z.string().optional(),
});

// CREATE_ROOM payload
export const createRoomSchema = baseMessageSchema.extend({
  type: z.literal('CREATE_ROOM'),
  payload: z.object({
    maxPeers: z.number().int().min(2).max(10).optional().default(config.MAX_ROOM_SIZE),
  }).optional(),
});

// JOIN_ROOM payload
export const joinRoomSchema = baseMessageSchema.extend({
  type: z.literal('JOIN_ROOM'),
  payload: z.object({
    roomId: z.string().min(1).max(20),
  }),
});

// SDP payload (Offer/Answer)
const sdpSchema = z.object({
  sdp: z.object({
    type: z.enum(['offer', 'answer', 'pranswer', 'rollback']),
    sdp: z.string(),
  }),
  targetPeerId: z.string().uuid(),
});

export const offerSchema = baseMessageSchema.extend({
  type: z.literal('OFFER'),
  payload: sdpSchema,
});

export const answerSchema = baseMessageSchema.extend({
  type: z.literal('ANSWER'),
  payload: sdpSchema,
});

// ICE Candidate payload
export const iceCandidateSchema = baseMessageSchema.extend({
  type: z.literal('ICE_CANDIDATE'),
  payload: z.object({
    candidate: z.object({
      candidate: z.string(),
      sdpMid: z.string().nullable(),
      sdpMLineIndex: z.number().nullable(),
      usernameFragment: z.string().optional().nullable(),
    }),
    targetPeerId: z.string().uuid(),
  }),
});

// Simple actions
export const pongSchema = baseMessageSchema.extend({
  type: z.literal('PONG'),
});

export const leaveRoomSchema = baseMessageSchema.extend({
  type: z.literal('LEAVE_ROOM'),
});

// Master parser that routes to the correct schema
export function parseIncomingMessage(rawStr: string) {
  // 1. Initial JSON parse check
  let rawJson;
  try {
    rawJson = JSON.parse(rawStr);
  } catch (err) {
    throw new Error('Malformed JSON');
  }

  // 2. Base structure check
  const base = baseMessageSchema.safeParse(rawJson);
  if (!base.success) {
    throw new Error('Missing base message fields (type, timestamp, requestId)');
  }

  // 3. Strict payload validation based on type
  switch (base.data.type) {
    case 'CREATE_ROOM':
      return createRoomSchema.parse(rawJson);
    case 'JOIN_ROOM':
      return joinRoomSchema.parse(rawJson);
    case 'OFFER':
      return offerSchema.parse(rawJson);
    case 'ANSWER':
      return answerSchema.parse(rawJson);
    case 'ICE_CANDIDATE':
      return iceCandidateSchema.parse(rawJson);
    case 'PONG':
      return pongSchema.parse(rawJson);
    case 'LEAVE_ROOM':
      return leaveRoomSchema.parse(rawJson);
    default:
      throw new Error(`Unsupported message type: ${base.data.type}`);
  }
}
