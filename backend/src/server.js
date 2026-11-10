import http from 'node:http';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { configureSockets } from './sockets/socket.js';
import { startWorker } from './jobs/worker.js';

const app = createApp();
const server = http.createServer(app);
const io = configureSockets(server);

app.set('io', io);

connectDatabase()
  .then(() => {
    startWorker(io);
    server.listen(env.port, env.host, () => {
      console.log(`Emergency API listening on http://${env.host}:${env.port}`);
    });
  })
  .catch((e) => {
    console.error(`Database connection failed: ${e.message}`);
    process.exit(1);
  });
