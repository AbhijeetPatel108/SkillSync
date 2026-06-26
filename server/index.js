/**
 * server/index.js
 *
 * This is the ENTRY POINT — the very first file Node.js runs.
 *
 * Its only three jobs:
 *   1. Load environment variables (must happen before anything else)
 *   2. Connect to MongoDB
 *   3. Start the HTTP server
 *
 * All Express configuration (middleware, routes) lives in app.js.
 * Keeping them separate means app.js can be imported in tests
 * without accidentally opening a port.
 */
const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");
const PORT = process.env.PORT || 5000;

// ── Step 2: Connect to DB, then start listening ──────────────────────────
// If connectDB() throws, the process exits inside that function.
// The server only starts after a successful DB connection.
const start = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  🚀  SkillSync API`);
    console.log(`  ENV  : ${process.env.NODE_ENV || 'development'}`);
    console.log(`  PORT : ${PORT}`);
    console.log(`  URL  : http://localhost:${PORT}/api/health`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
};

start();
