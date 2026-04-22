import { Router } from 'express';
import axios from 'axios';
import { CircuitBreaker } from '../models/SystemCache';
import { User } from '../models/User';
import { watchmodeService } from '../services/watchmode.service';
import { identityResolver } from '../services/identity.resolver';

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
      const probeResponse = await axios.get(`https://api.watchmode.com/v1/title/tt2306299/sources/?apiKey=${process.env.WATCHMODE_API_KEY}&regions=ES`);
      if (probeResponse.status === 200) {
        const data = probeResponse.data;
        watchmodeProbe = `OK (${data.length} sources found for Vikings in ES)`;
        
        // v36.5: Traza con Datos Reales de Base de Datos
        const realUser = await User.findOne();
        
        if (realUser) {
           const realPlatforms = realUser.streamingPlatforms || [];
           const realRegion = realUser.region || 'ES';
           
           // v36.7: Traza de Resolución de Identidad
           const idResult = await identityResolver.resolveSingle('Juego de Tronos', 2011, 'tv');
           const idStatus = idResult?.imdbId ? `RESOLVED (${idResult.imdbId})` : 'FAILED';
           
           const internalResult = idResult?.imdbId 
             ? await watchmodeService.getAvailability(idResult.imdbId, realRegion, realPlatforms as string[])
             : { isAvailable: false, sources: [] };
             
           orchestrationTrace = `USER_TRACE (${realUser.email}): ${internalResult.isAvailable ? 'SUCCESS' : 'FAILED'} (Region: ${realRegion}, Id: ${idStatus}, Found: ${internalResult.sources.map(s => s.name).join(', ')})`;
        } else {
           orchestrationTrace = 'TRACE_ERROR: No users found in DB';
        }
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
