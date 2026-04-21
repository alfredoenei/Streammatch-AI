import identityResolver from './identity.resolver';
import tmdbService from './tmdb.service';
import watchmodeService from './watchmode.service';
import omdbService from './omdb.service';
import { IMediaIdentity } from '../types/tmdb.types';
import { PLATFORMS } from '../config/platforms';

/**
 * Radar Orchestrator v14.1 — The Final Director
 * 
 * Rol: Coordina el flujo completo: IA -> Identidad -> Estética -> Ubicación.
 */
class RadarOrchestrator {
  
  async orchestrateSemanticSearch(
    selection: { title: string; year: number; type: 'movie' | 'tv'; original_title?: string; local_title?: string }[], 
    region: string, 
    userPlatforms: string[],
    watchedMovies: any[] = [], // Opcional para filtrar vistos
    lockedIdentities: Record<string, IMediaIdentity> = {} // Contexto bloqueado (Sesión)
  ) {
    console.log('\n--- 🎬 [ORQUESTRADOR v14.3] INICIANDO FLUJO ESTRUCTURADO ---');
    
    // 1. Fase de Identidad - Mezcla Locks y Resolver 
    const identitiesToResolve = selection.filter(item => !lockedIdentities[`${item.title.toLowerCase()}-${item.year}-${item.type}`.replace(/\./g, '')]);
    const preResolvedIdentities = selection
      .map(item => lockedIdentities[`${item.title.toLowerCase()}-${item.year}-${item.type}`.replace(/\./g, '')])
      .filter(Boolean);

    console.log(`🔒 [RADAR SESSIONS] Utilizando ${preResolvedIdentities.length} identidades pre-calculadas de la sesión local.`);
    
    const newlyResolvedIdentities = identitiesToResolve.length > 0 
      ? await identityResolver.resolveBatch(identitiesToResolve)
      : [];
      
    // Combinar (Las pre-resueltas no garantizan el arte local, sólo el ID. El arte se hidrata debajo o se toma en finalPoster)
    const identities = [...preResolvedIdentities, ...newlyResolvedIdentities];
    
    
    // 2. Fase de Estética e Identidad real en paralelo (TMDB + Watchmode)
    const finalResults = await Promise.allSettled(identities.map(async (identity) => {
      
      // Filtrar películas ya vistas (vía ID de IMDB si es posible)
      if (this._isAlreadyWatched(identity, watchedMovies)) {
        return null;
      }

      const [aesthetic, location] = await Promise.all([
        tmdbService.getMediaArt(identity),
        identity.imdbId ? watchmodeService.getAvailability(identity.imdbId, region, userPlatforms) : Promise.resolve({ isAvailable: false, sources: [] })
      ]);

      // v15.0: Doctrina de Cero Adivinanzas - Purga Visual
      // Si TMDB falla en dar poster, usamos el de OMDb inyectado en la identidad
      let finalPoster = aesthetic?.posterUrl ? aesthetic.posterUrl : identity.posterUrl;

      // v15.6: Reconstrucción de PremiumMetadata (Logos y Colores)
      // Buscamos la primera fuente que coincida con las plataformas activas del usuario
      let premiumMetadata = null;
      if (location.isAvailable && location.sources && location.sources.length > 0) {
        const firstMatch = location.sources.find(s => s.platform && PLATFORMS[s.platform]);
        if (firstMatch) {
          const meta = PLATFORMS[firstMatch.platform];
          premiumMetadata = {
            brandColor: meta.color,
            logo: meta.logo,
            platformName: meta.name
          };
        }
      }

      return {
        id: identity.tmdbId || identity.imdbId,
        tmdbId: identity.tmdbId, // Preservados para la sesión
        imdbId: identity.imdbId, 
        title: identity.title,
        original_title: identity.original_title, // v34.5
        local_title: identity.local_title,       // v34.5
        year: identity.year,
        media_type: identity.type,
        ...aesthetic,
        posterUrl: finalPoster,
        availability: location, // Estructura { isAvailable, sources }
        isAvailable: location.isAvailable,
        premiumMetadata,
        source: 'v15.6_aggregator'
      };
    }));

    // 3. Fase de Limpieza y De-duplicación v34.7
    const seenKeys = new Set<string>();
    const successfulResults = finalResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(v => {
        if (v === null) return false;
        
        // Generar clave de identidad única para evitar duplicados visuales
        const key = `${v.title.toLowerCase()}-${v.year}-${v.media_type}`.replace(/\s+/g, '');
        if (seenKeys.has(key)) {
          console.log(`🚫 [DEDUP] Silenciando duplicado detectado: ${v.title} (${v.year})`);
          return false;
        }
        seenKeys.add(key);
        return true;
      });

    console.log(`--- 🏁 [ORQUESTRADOR] Flujo completado. ${successfulResults.length} títulos listos para el Radar. ---\n`);
    
    return successfulResults;
  }

  private _isAlreadyWatched(identity: IMediaIdentity, watched: any[]): boolean {
    return watched.some(w => 
      (identity.imdbId && w.imdbId === identity.imdbId) || 
      (identity.tmdbId && w.tmdbId === identity.tmdbId) ||
      (identity.title === w.title && identity.year === w.year)
    );
  }
}

export const radarOrchestrator = new RadarOrchestrator();
export default radarOrchestrator;
