import { config } from 'dotenv';
import { buildServer } from './server.js';

config();

const server = await buildServer();

const port = Number(process.env.PORT ?? 4000);

server.listen({ port, host: '0.0.0.0' }).catch((err) => {
  server.log.error(err, 'failed to start api-gateway');
  process.exit(1);
});
