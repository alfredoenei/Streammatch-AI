import axios from 'axios';
import { StreamingPlatform } from '../types/user';

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
   * Obtiene la disponibilidad filtrada por las plataformas del usuario.
   */
  async getAvailability(imdbId: string, region: string, userPlatforms: string[]) {
    if (!this.api_key) return { isAvailable: false, links: [] };
    
    // v23.0: Circuit Breaker active?
    if (Date.now() < this.lockedUntil) {
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
        this.lockedUntil = Date.now() + 60000; // Bloqueo de 60s
        console.error('🛑 [WATCHMODE] 429 Too Many Requests. Entrando en modo Circuit Breaker (60s).');
      } else {
        console.error(`❌ [WATCHMODE] Error para ${imdbId}:`, error.message);
      }
      return { isAvailable: false, sources: [] };
    }
  }

  private async _fetchSourcesWithCache(imdbId: string, region: string): Promise<IWatchmodeSource[]> {
    const cacheKey = `${imdbId}:${region}`;
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      console.log(`♻️ [WATCHMODE] Usando caché para ${cacheKey}`);
      return cached.sources;
    }

    console.log(`📡 [WATCHMODE] Consultando disponibilidad real para ${imdbId} (${region})`);
    const resp = await axios.get(`${this.base_url}/title/${imdbId}/sources/`, {
      params: { 
        apiKey: this.api_key,
        regions: region
      }
    });

    const sources = Array.isArray(resp.data) ? resp.data : [];
    this.cache.set(cacheKey, { timestamp: Date.now(), sources });
    
    return sources;
  }
}

export const watchmodeService = new WatchmodeService();
export default watchmodeService;
