import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoute } from './routes/health.js';

export function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  app.register(cors);
  app.register(healthRoute);

  return app;
}
