import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { dataStore } from './services/store.js';
import { authRouter } from './routes/auth.js';
import { teamsRouter } from './routes/teams.js';
import { contestRouter } from './routes/contest.js';
import { roundsRouter } from './routes/rounds.js';
import { leaderboardRouter } from './routes/leaderboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for LAN & local connections
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-team-number']
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/contest', contestRouter);
app.use('/api/rounds', roundsRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'CODE//LOCK Server',
    version: '2026.1',
    serverTime: Date.now(),
    mongoConnected: dataStore.getIsMongoConnected()
  });
});

async function bootstrap() {
  const isConnected = await connectDB();
  dataStore.setMongoConnected(isConnected);
  await dataStore.seedDefaults();

  // Listen on 0.0.0.0 for LAN access
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(` CODE//LOCK 2026 EVENT SERVER`);
    console.log(` Local:   http://localhost:${PORT}`);
    console.log(` LAN:     http://0.0.0.0:${PORT}`);
    console.log(` DB Mode: ${isConnected ? 'MongoDB Active' : 'Offline Embedded Resilient Mode'}`);
    console.log(`===============================================`);
  });
}

bootstrap().catch(err => {
  console.error('[FATAL] Failed to start server:', err);
  process.exit(1);
});
