/**
 * server/app.js
 *
 * Creates and configures the Express application.
 * Does NOT start the server — that's index.js's responsibility.
 *
 * Middleware is registered in a deliberate order.
 * Every incoming request flows top-to-bottom through this file:
 *
 *   Security → CORS → Body Parser → Logger → Routes → 404 → Error Handler
 *
 * If any middleware calls next(error), the request skips all remaining
 * regular middleware and lands directly in the error handler at the bottom.
 */

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

// Patches Express so async errors are forwarded to errorHandler automatically.
// Without this you'd need try/catch in every async controller.
//require('express-async-errors');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');
const { notFound }     = require('./middleware/notFound');

// Routes  (more will be uncommented as we build each module)
const authRoutes  = require('./routes/authRoutes');
 const userRoutes  = require('./routes/userRoutes');   // Module 3
const skillRoutes = require('./routes/skillRoutes');  // Module 4
const matchRoutes = require('./routes/matchRoutes');  // Module 5

const app = express();

// ── 1. Security Headers ───────────────────────────────────────────────────
// helmet() automatically sets ~15 HTTP headers that defend against
// common attacks: XSS, clickjacking, MIME sniffing, etc.
app.use(helmet());

// ── 2. CORS ───────────────────────────────────────────────────────────────
// Without this, the browser blocks any request from
// localhost:5173 (React) to localhost:5000 (Express).
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,       // Allow Authorization header / cookies
    optionsSuccessStatus: 200,
  })
);

// ── 3. Body Parsers ───────────────────────────────────────────────────────
// Parses incoming JSON → req.body becomes a usable JS object.
// limit:'10kb' stops someone sending a 100MB payload to crash the server.
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── 4. HTTP Request Logger ────────────────────────────────────────────────
// Logs each request in dev: "POST /api/auth/login 200 18ms"
// Skipped in production to keep logs clean.
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── 5. Health Check ───────────────────────────────────────────────────────
// A dedicated route that answers "is the server alive?"
// Deployment platforms (Render, Railway, AWS) ping this to monitor uptime.
// It lives directly in app.js so it always responds, even if routes break.
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillSync API is running ✅',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ── 6. API Routes ─────────────────────────────────────────────────────────
// All routes are prefixed with /api/ to clearly separate
// API calls from any static files you might serve later.
app.use('/api/auth', authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/skills',  skillRoutes);
app.use('/api/matches', matchRoutes);

// ── 7. Catch-all: 404 ─────────────────────────────────────────────────────
// Any request that didn't match a route above lands here.
// Must come AFTER all routes.
app.use(notFound);

// ── 8. Global Error Handler ───────────────────────────────────────────────
// Receives errors forwarded by next(error) from anywhere in the app.
// Must come LAST — after routes AND the 404 handler.
app.use(errorHandler);

module.exports = app;