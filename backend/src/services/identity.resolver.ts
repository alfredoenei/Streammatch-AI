import traktService from './trakt.service';
import omdbService from './omdb.service';
import tmdbService from './tmdb.service'; // v34.5
import { IMediaIdentity } from '../types/tmdb.types';

/**
 * Identity Resolver v14.1 — The Orchestrator
 * 
 * Rol: Coordina Trakt -> OMDb fallback con control de concurrencia.
 */
class IdentityResolver {
  private readonly BATCH_SIZE = 7;

  /**
   * Resuelve una lista de títulos a identidades verificadas.
   */
  async resolveBatch(
    selection: { title: string; year: number; type: 'movie' | 'tv'; local_title?: string }[]
  ): Promise<IMediaIdentity[]> {
    console.log(`🆔 [RESOLVER v14.3] Iniciando resolución de ${selection.length} títulos...`);
    
    // Procesamiento por lotes (Batching) para evitar 429
    const results: IMediaIdentity[] = [];
    
    for (let i = 0; i < selection.length; i += this.BATCH_SIZE) {
      const batch = selection.slice(i, i + this.BATCH_SIZE);
      const batchPromises = batch.map(q => this.resolveSingle(q.title, q.year, q.type, q.local_title));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((res) => {
        if (res.status === 'fulfilled' && res.value) {
          results.push(res.value);
        }
      });

      if (i + this.BATCH_SIZE < selection.length) {
        // Pequeño respiro entre lotes (v28.0)
        await new Promise(resolve => setTimeout(resolve, 100));
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
    type: 'movie' | 'tv',
    local_title?: string
  ): Promise<IMediaIdentity | null> {
    try {
      // 1. Intentar con Trakt (Original)
      let identity = await traktService.searchTitle(title, year, type);
      
      if (identity) return identity;

      // 2. Intento de Limpieza (v36.1: Subtitle Stripping)
      // Detectamos : o - como separadores de subtítulos
      const subtitleRegex = /[:]|(\s-\s)/;
      if (subtitleRegex.test(title)) {
        const cleanTitle = title.split(subtitleRegex)[0].trim();
        
        // v36.1: El "Ancla del Año" es vital aquí para evitar falsos positivos genéricos
        console.log(`🧹 [CLEAN_RESOLVER] Re-intentando con título limpio: "${cleanTitle}" (${year})...`);
        
        identity = await traktService.searchTitle(cleanTitle, year, type);
        if (identity) return identity;

        // Si Trakt falla con el limpio, actualizamos el título para los siguientes fallbacks
        title = cleanTitle;
      }

      // 3. Fallback a OMDb
      console.log(`🛡️ [FALLBACK] Trakt no encontró "${title}". Probando OMDb...`);
      const omdbResult = await omdbService.searchTitle(title, year, type);
      if (omdbResult) return omdbResult;

      // 4. Fallback a TMDB Search (v34.6: Doble Check)
      console.log(`🛡️ [UNIVERSAL_RESOLVER] OMDb no encontró "${title}". Probando búsqueda directa en TMDB...`);
      return await tmdbService.searchByTitle(title, year, type, local_title);
      
    } catch (error) {
      console.warn(`🛡️ [RESILIENCE] Fallo en cadena Trakt/OMDb para "${title}". Disparando TMDB Search...`);
      try {
        const omdbResult = await omdbService.searchTitle(title, year, type);
        if (omdbResult) return omdbResult;
      } catch (e) {}
      return await tmdbService.searchByTitle(title, year, type, local_title);
    }
  }
}

export const identityResolver = new IdentityResolver();
export default identityResolver;
