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

  // v36.3: Live Watchmode Probe
  let watchmodeProbe = 'NOT_TESTED';
  let orchestrationTrace = 'NOT_TESTED';

  if (process.env.WATCHMODE_API_KEY) {
    try {
      // Sonda básica
      const probeResponse = await fetch(`https://api.watchmode.com/v1/title/tt2306299/sources/?apiKey=${process.env.WATCHMODE_API_KEY}&regions=ES`);
      if (probeResponse.ok) {
        const data = await probeResponse.json();
        watchmodeProbe = `OK (${data.length} sources found for Vikings in ES)`;
        
        // v36.4: Traza de Orquestación Interna
        const testPlatforms = ['netflix', 'hbo_max', 'amazon_prime'];
        // Importación dinámica para evitar problemas de hoisting si fuera necesario, 
        // pero aquí podemos usar las instancias importadas.
        const { watchmodeService } = await import('../services/watchmode.service');
        const internalResult = await watchmodeService.getAvailability('tt2306299', 'ES', testPlatforms);
        orchestrationTrace = `INTERNAL_MAP: ${internalResult.isAvailable ? 'SUCCESS' : 'FAILED'} (Found: ${internalResult.sources.map(s => s.name).join(', ')})`;
      } else {
        watchmodeProbe = `ERROR (${probeResponse.status}: ${probeResponse.statusText})`;
      }
    } catch (e: any) {
      watchmodeProbe = `EXCEPTION (${e.message})`;
      orchestrationTrace = `TRACE_ERROR: ${e.message}`;
    }
  }

  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'production',
    probe: {
      watchmode: watchmodeProbe,
      trace: orchestrationTrace
    },
    keys: {
      openai: checkKey(process.env.OPENAI_API_KEY),
      tmdb: checkKey(process.env.TMDB_API_KEY),
      trakt: checkKey(process.env.TRAKT_CLIENT_ID),
      watchmode: checkKey(process.env.WATCHMODE_API_KEY),
      groq: checkKey(process.env.GROQ_API_KEY)
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
