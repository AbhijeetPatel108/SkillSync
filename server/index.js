/**
 * server/index.js
 *
 * Entry point — the first file Node.js runs.
 *
 * MODULE 7 CHANGE:
 *   Socket.IO cannot attach directly to an Express app object.
 *   It requires the underlying Node.js HTTP server instance.
 *
 *   Before (Modules 1–6):
 *     app.listen(PORT)
 *     → Express creates an HTTP server internally and starts it.
 *       We had no reference to that server object.
 *
 *   After (Module 7):
 *     const httpServer = http.createServer(app)
 *     const io = new Server(httpServer, { ... })
 *     httpServer.listen(PORT)
 *     → We create the HTTP server explicitly so we can pass it to Socket.IO.
 *       Express still handles all HTTP requests as before — nothing changes
 *       for the existing REST API.
 *
 * Everything else in this file is identical to the Module 1–6 version.
 */
const dns = require('node:dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);
const dotenv = require('dotenv');

// Load .env BEFORE importing anything that reads process.env
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');

const app       = require('./app');
const connectDB = require('./config/db');
const socketAuth    = require('./socket/socketAuth');
const { initSocketHandler } = require('./socket/socketHandler');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // ── Create the raw HTTP server from the Express app ────────────────────────
  // http.createServer(app) wraps the Express app in a Node HTTP server.
  // Express will still handle all HTTP routing — this is transparent to it.
  // We need the httpServer reference to pass to Socket.IO below.
  const httpServer = http.createServer(app);

  // ── Initialise Socket.IO ───────────────────────────────────────────────────
  const io = new Server(httpServer, {
    // CORS for Socket.IO is configured separately from the Express CORS.
    // The frontend React app at localhost:5173 must be explicitly allowed.
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:5173',
      methods:     ['GET', 'POST'],
      credentials: true,
    },

    // pingTimeout: how long to wait for a pong response before disconnecting.
    // pingInterval: how often to send a ping to check the connection is alive.
    // These are sensible production defaults.
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  // ── Register socket authentication middleware ──────────────────────────────
  // socketAuth runs on every connection attempt BEFORE the connection event.
  // If it calls next(error), the connection is refused — the client receives
  // a connect_error event and the socket never appears in io.sockets.
  io.use(socketAuth);

  // ── Register all event handlers ───────────────────────────────────────────
  // initSocketHandler receives the io instance and registers
  // join_room, send_message, typing, mark_read, disconnect on io.on('connection').
  initSocketHandler(io);

  // ── Start the HTTP server (handles BOTH Express HTTP + Socket.IO WS) ───────
  httpServer.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  🚀  SkillSync API`);
    console.log(`  ENV  : ${process.env.NODE_ENV || 'development'}`);
    console.log(`  PORT : ${PORT}`);
    console.log(`  REST : http://localhost:${PORT}/api/health`);
    console.log(`  WS   : ws://localhost:${PORT}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
};

start();
