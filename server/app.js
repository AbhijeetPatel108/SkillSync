

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');






const { errorHandler } = require('./middleware/errorHandler');
const { notFound }     = require('./middleware/notFound');


const authRoutes   = require('./routes/authRoutes');
const userRoutes   = require('./routes/userRoutes');
const skillRoutes  = require('./routes/skillRoutes');
const matchRoutes  = require('./routes/matchRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes   = require('./routes/chatRoutes');   

const app = express();




app.use(helmet());




app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,       
    optionsSuccessStatus: 200,
  })
);




app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));




if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}





app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillSync API is running ✅',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});




app.use('/api/auth',    authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/skills',  skillRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat',    chatRoutes);    




app.use(notFound);




app.use(errorHandler);

module.exports = app;
