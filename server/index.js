
const dns = require('node:dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);
const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const { connectDB } = require('./config/db');
const socketAuth = require('./socket/socketAuth');
const { initSocketHandler } = require('./socket/socketHandler');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  
  
  
  
  const httpServer = http.createServer(app);

  
  const io = new Server(httpServer, {
    
    
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:5173',
      methods:     ['GET', 'POST'],
      credentials: true,
    },

    
    
    
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  
  
  
  
  io.use(socketAuth);

  
  
  
  initSocketHandler(io);

  
  httpServer.listen(PORT, () => {
    
    
    
    
    
    
    
  });
};

start();
