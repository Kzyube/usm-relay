import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(8080),
  CLIENT_ORIGIN: z.string().default('*'),
  MAX_ROOM_SIZE: z.string().transform(Number).default(2),
  ROOM_TIMEOUT_MS: z.string().transform(Number).default(600000), // 10 minutes
  PING_INTERVAL_MS: z.string().transform(Number).default(30000), // 30 seconds
  PING_TIMEOUT_MS: z.string().transform(Number).default(10000), // 10 seconds
  MAX_PAYLOAD_SIZE_BYTES: z.string().transform(Number).default(10240), // 10KB
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const config = _env.data;
