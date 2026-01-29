import { config } from 'dotenv';
import { buildServer } from './server.js';

config();

const server = await buildServer();
const port = Number(process.env.PORT ?? 4001);

server.listen({ port, host: '0.0.0.0' }).catch((err) => {
  server.log.error(err, 'failed to start auth-service');
  process.exit(1);
});
