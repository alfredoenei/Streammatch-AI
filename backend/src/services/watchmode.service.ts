import axios from 'axios';
import { StreamingPlatform } from '../types/user';
import { WatchmodeCache, CircuitBreaker } from '../models/SystemCache';

/**
 * Watchmode Service v14.1 — The Conserje
 * 
 * Rol: Proveedor de disponibilidad real y deep linking.
 * Estrategia: Caché agresiva (24h) y mapeo determinista por Source ID.
 */

interface IWatchmodeSource {
  source_id: number;
  name: string;
  type: string;
  web_url: string;
  format: string;
}

interface ICachedAvailability {
  timestamp: number;
  sources: IWatchmodeSource[];
}

class WatchmodeService {
  private readonly api_key = process.env.WATCHMODE_API_KEY;
  private readonly base_url = 'https://api.watchmode.com/v1';
  private cache: Map<string, ICachedAvailability> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 Horas
  private lockedUntil: number = 0; // v23.0 Circuit Breaker
  private requestQueue: Promise<any> = Promise.resolve(); // v27.0 Prevención de Bursts

  // Mapeo Determinista: ID Watchmode -> Key de nuestra plataforma
  private readonly PLATFORM_MAP: Record<number, string> = {
    203: 'netflix',
    387: 'hbo_max',
    372: 'disney_plus',
    26: 'amazon_prime',
    371: 'apple_tv',
    464: 'skyshowtime',
    456: 'movistar_plus',
    332: 'filmin', // ID estimado para Filmin ES
  };

  /**
   * v28.0: Cola de Trabajo Concurrente (X2)
   * Permite procesar 2 películas simultáneamente respetando el límite de 2 req/s.
   */
  private async _enqueueRequest<T>(task: () => Promise<T>): Promise<T> {
    const workerDelay = 1050; // 1.05s por trabajador individual = ~1.9 req/s total
    
    this.requestQueue = this.requestQueue.then(async () => {
      const result = await task();
      await new Promise(r => setTimeout(r, workerDelay));
      return result;
    }).catch(async () => {
      await new Promise(r => setTimeout(r, workerDelay));
      return task();
    });

    return this.requestQueue;
  }

  // Slots para trabajadores paralelos
  private workerA: Promise<any> = Promise.resolve();
  private workerB: Promise<any> = Promise.resolve();
  private workerToggle = false;

  private _distributeRequest<T>(task: () => Promise<T>): Promise<T> {
    const workerDelay = 1050; // Cada trabajador espera 1s, alternándose = 2 req/s
    
    const selectedWorker = this.workerToggle ? 'workerA' : 'workerB';
    this.workerToggle = !this.workerToggle;

    this[selectedWorker] = this[selectedWorker].then(async () => {
      const res = await task();
      await new Promise(r => setTimeout(r, workerDelay));
      return res;
    });

    return this[selectedWorker];
  }

  /**
   * Helper privado para chequear el Circuit Breaker de MongoDB
   */
  private async _isLocked(): Promise<boolean> {
    if (Date.now() < this.lockedUntil) return true; // Caché en memoria rápida
    try {
      const cb = await CircuitBreaker.findOne({ serviceId: 'watchmode' });
      if (cb && Date.now() < cb.lockedUntil) {
        this.lockedUntil = cb.lockedUntil;
        return true;
      }
    } catch (e) {}
    return false;
  }

  private async _setLock() {
    this.lockedUntil = Date.now() + 60000; // 60s
    try {
      await CircuitBreaker.findOneAndUpdate(
        { serviceId: 'watchmode' },
        { lockedUntil: this.lockedUntil },
        { upsert: true }
      );
    } catch (e) {}
  }

  /**
   * Obtiene la disponibilidad filtrada por las plataformas del usuario.
   */
  async getAvailability(imdbId: string, region: string, userPlatforms: string[]) {
    if (!this.api_key) return { isAvailable: false, sources: [] };
    
    // v26.0: Persistent Circuit Breaker
    const isLocked = await this._isLocked();
    if (isLocked) {
      console.warn('⚡ [WATCHMODE] Circuit Breaker activo. Saltando petición por saturación (429).');
      return { isAvailable: false, sources: [] };
    }

    try {
      const allSources = await this._fetchSourcesWithCache(imdbId, region);
      
      // Filtrar por suscripción/gratis y por las plataformas que tiene el usuario
      const filteredSources = allSources.filter(s => 
        (s.type === 'sub' || s.type === 'free') && 
        userPlatforms.includes(this.PLATFORM_MAP[s.source_id] || '')
      );

      return {
        isAvailable: filteredSources.length > 0,
        sources: filteredSources.map(s => ({
          platform: this.PLATFORM_MAP[s.source_id],
          url: s.web_url,
          name: s.name
        }))
      };
    } catch (error: any) {
      if (error?.response?.status === 429) {
        await this._setLock();
        console.error('🛑 [WATCHMODE] 429 Too Many Requests. Entrando en modo Circuit Breaker (60s).');
      } else {
        console.error(`❌ [WATCHMODE] Error para ${imdbId}:`, error.message);
      }
      return { isAvailable: false, sources: [] };
    }
  }

  private async _fetchSourcesWithCache(imdbId: string, region: string): Promise<IWatchmodeSource[]> {
    const cacheKey = `${imdbId}:${region}`;
    
    // 1. Memoria Local Rápida
    const cachedMem = this.cache.get(cacheKey);
    if (cachedMem && (Date.now() - cachedMem.timestamp < this.CACHE_TTL)) {
      return cachedMem.sources;
    }

    // 2. Caché Persistente en MongoDB (v26.0)
    try {
      const cachedMongo = await WatchmodeCache.findOne({ cacheKey });
      if (cachedMongo) {
        console.log(`♻️ [WATCHMODE Mongo] Usando caché para ${cacheKey}`);
        this.cache.set(cacheKey, { timestamp: Date.now(), sources: cachedMongo.sources });
        return cachedMongo.sources;
      }
    } catch (e) {}

    console.log(`📡 [WATCHMODE] Consultando disponibilidad real para ${imdbId} (${region})`);
    
    const exec = async () => {
      const resp = await axios.get(`${this.base_url}/title/${imdbId}/sources/`, {
        params: { 
          apiKey: this.api_key,
          regions: region
        }
      });
      return Array.isArray(resp.data) ? resp.data : [];
    };

    const sources = await this._distributeRequest(exec);

    
    // Guardar en Memoria
    this.cache.set(cacheKey, { timestamp: Date.now(), sources });
    
    // Guardar en persistencia (Fire and forget)
    WatchmodeCache.create({ cacheKey, sources }).catch(() => {});
    
    return sources;
  }
}

export const watchmodeService = new WatchmodeService();
export default watchmodeService;
