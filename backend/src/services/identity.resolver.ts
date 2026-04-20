import traktService from './trakt.service';
import omdbService from './omdb.service';
import { IMediaIdentity } from '../types/tmdb.types';

/**
 * Identity Resolver v14.1 — The Orchestrator
 * 
 * Rol: Coordina Trakt -> OMDb fallback con control de concurrencia.
 */
class IdentityResolver {
  private readonly BATCH_SIZE = 3;

  /**
   * Resuelve una lista de títulos a identidades verificadas.
   */
  async resolveBatch(
    selection: { title: string; year: number; type: 'movie' | 'tv' }[]
  ): Promise<IMediaIdentity[]> {
    console.log(`🆔 [RESOLVER v14.3] Iniciando resolución de ${selection.length} títulos...`);
    
    // Procesamiento por lotes (Batching) para evitar 429
    const results: IMediaIdentity[] = [];
    
    for (let i = 0; i < selection.length; i += this.BATCH_SIZE) {
      const batch = selection.slice(i, i + this.BATCH_SIZE);
      const batchPromises = batch.map(q => this.resolveSingle(q.title, q.year, q.type));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((res) => {
        if (res.status === 'fulfilled' && res.value) {
          results.push(res.value);
        }
      });

      if (i + this.BATCH_SIZE < selection.length) {
        // Pequeño respiro entre lotes
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`✅ [RESOLVER] Resolución completada: ${results.length}/${selection.length} éxitos.`);
    return results;
  }

  /**
   * Lógica de una sola resolución: Trakt -> (Timeout/Error) -> OMDb.
   */
  async resolveSingle(
    title: string, 
    year: number, 
    type: 'movie' | 'tv'
  ): Promise<IMediaIdentity | null> {
    try {
      // 1. Intentar con Trakt (v14.3: El tipo es obligatorio y estricto)
      const identity = await traktService.searchTitle(title, year, type);
      
      if (identity) {
        return identity;
      }

      // 2. Fallback a OMDb
      console.log(`🛡️ [FALLBACK] Trakt no encontró "${title}". Probando OMDb...`);
      return await omdbService.searchTitle(title, year, type);
      
    } catch (error) {
      console.warn(`🛡️ [RESILIENCE] Trakt falló para "${title}". Disparando OMDb...`);
      return await omdbService.searchTitle(title, year, type);
    }
  }
}

export const identityResolver = new IdentityResolver();
export default identityResolver;
