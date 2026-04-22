import { Router } from 'express';
import { CircuitBreaker } from '../models/SystemCache';

const router = Router();

router.get('/health', async (req, res) => {
  const checkKey = (key?: string) => {
    if (!key) return 'MISSING';
    return `PRESENT (${key.substring(0, 4)}...${key.substring(key.length - 4)})`;
  };

  const watchmodeCB = await CircuitBreaker.findOne({ serviceId: 'watchmode' });
  const isLocked = watchmodeCB && Date.now() < watchmodeCB.lockedUntil;

  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    keys: {
      openai: checkKey(process.env.OPENAI_API_KEY),
      tmdb: checkKey(process.env.TMDB_API_KEY),
      trakt: checkKey(process.env.TRAKT_CLIENT_ID),
      watchmode: checkKey(process.env.WATCHMODE_API_KEY)
    },
    services: {
      watchmode: {
        isLocked,
        lockedUntil: watchmodeCB?.lockedUntil ? new Date(watchmodeCB.lockedUntil).toISOString() : null,
        remainingLock: isLocked ? Math.round((watchmodeCB.lockedUntil - Date.now()) / 1000) : 0
      }
    }
  });
});

export default router;
