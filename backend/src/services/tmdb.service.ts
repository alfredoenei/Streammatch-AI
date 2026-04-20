/**
 * TMDB Service v14.1 — The Escenógrafo
 * 
 * Rol: CDN de Metadatos Visuales (Aesthetics Layer).
 * Filosofía: No decide, solo "viste" los títulos con posters y trailers.
 * SRP: Responsabilidad única de hidratación visual por ID.
 */

import axios, { AxiosInstance } from 'axios';
import { IMediaIdentity } from '../types/tmdb.types';

console.log('🎨 [BOOT] TMDB Service v14.1 (Escenógrafo) cargado.');

interface ITMDBConfig {
  secure_base_url: string;
  poster_sizes: string[];
  backdrop_sizes: string[];
}

class TMDBService {
  private readonly api: AxiosInstance;
  private config: ITMDBConfig | null = null;
  private configPromise: Promise<void>;
  private readonly DEFAULT_POSTER_SIZE = 'w500';
  private readonly DEFAULT_BACKDROP_SIZE = 'original';

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      params: { 
        api_key: process.env.TMDB_API_KEY, 
        language: 'es-ES' 
      },
    });
    this.configPromise = this._loadConfiguration();
  }

  // ─── PUBLIC: Hidratación Principal ────────────────────────────────────────

  /**
   * Obtiene todo el "arte" (posters, backdrops, trailers) para una identidad.
   */
  async getMediaArt(identity: IMediaIdentity) {
    await this.configPromise;
    try {
      const tmdbId = identity.tmdbId;
      if (!tmdbId) return null;

      const type = identity.type === 'tv' ? 'tv' : 'movie';

      // Lanzar peticiones de estética en paralelo (Performance v14.1)
      const [details, images, videos] = await Promise.allSettled([
        this.api.get(`/${type}/${tmdbId}`),
        this.api.get(`/${type}/${tmdbId}/images`),
        this.api.get(`/${type}/${tmdbId}/videos`)
      ]);

      const detailsData = details.status === 'fulfilled' ? details.value.data : {};
      const posters = images.status === 'fulfilled' ? images.value.data.posters : [];
      const vids = videos.status === 'fulfilled' ? videos.value.data.results : [];

      // v14.2: Fallback de posters si el principal no existe
      const posterPath = detailsData.poster_path || (posters.length > 0 ? posters[0].file_path : null);
      const backdropPath = detailsData.backdrop_path || (images.status === 'fulfilled' && images.value.data.backdrops?.length > 0 ? images.value.data.backdrops[0].file_path : null);
      
      return {
        posterUrl: this.buildImageUrl(posterPath, 'poster'),
        backdropUrl: this.buildImageUrl(backdropPath, 'backdrop'),
        trailerUrl: this._extractOfficialTrailer(vids),
        overview: detailsData.overview,
        voteAverage: detailsData.vote_average,
        runtime: detailsData.runtime || (detailsData.episode_run_time ? detailsData.episode_run_time[0] : null)
      };
    } catch (error) {
      console.error(`❌ [TMDB] Error hidratando arte para "${identity.title}":`, (error as Error).message);
      return null;
    }
  }

  /**
   * Construye una URL de imagen dinámica basada en la configuración de la API.
   */
  buildImageUrl(path: string | null, type: 'poster' | 'backdrop'): string | null {
    if (!path || !this.config) return null;
    const size = type === 'poster' ? this.DEFAULT_POSTER_SIZE : this.DEFAULT_BACKDROP_SIZE;
    return `${this.config.secure_base_url}${size}${path}`;
  }

  // ─── PRIVATE: Resolver & Config ──────────────────────────────────────────

  /**
   * Asegura que tenemos un ID de TMDB. Si solo hay IMDB, usa /find.
   */
  async _ensureTMDBId(identity: IMediaIdentity): Promise<number | null> {
    if (identity.tmdbId) return identity.tmdbId;
    
    // v14.3: Intento por IMDB ID (Find)
    if (identity.imdbId) {
      try {
        console.log(`🔍 [TMDB] Resolviendo ID interno para IMDB: ${identity.imdbId}`);
        const response = await this.api.get(`/find/${identity.imdbId}`, {
          params: { external_source: 'imdb_id' }
        });

        const results = identity.type === 'tv' 
          ? response.data.tv_results 
          : response.data.movie_results;

        if (results?.[0]?.id) return results[0].id;
      } catch (err) {
        console.warn(`⚠️ [TMDB] Fallo find por IMDB para "${identity.title}"`);
      }
    }

    return null;
  }

  /**
   * Extrae el trailer oficial de YouTube.
   */
  private _extractOfficialTrailer(videos: any[]): string | null {
    const trailer = videos.find(v => 
      v.site === 'YouTube' && 
      (v.type === 'Trailer' || v.type === 'Teaser') &&
      v.official === true
    ) || videos.find(v => v.site === 'YouTube' && v.type === 'Trailer');

    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
  }

  /**
   * Carga la configuración de imágenes al iniciar.
   */
  private async _loadConfiguration() {
    try {
      const response = await this.api.get('/configuration');
      this.config = {
        secure_base_url: response.data.images.secure_base_url,
        poster_sizes: response.data.images.poster_sizes,
        backdrop_sizes: response.data.images.backdrop_sizes,
      };
      console.log('🖼️ [TMDB] Configuración de imágenes cargada.');
    } catch (error) {
      console.error('❌ [TMDB] Fallo al cargar configuración:', (error as Error).message);
    }
  }

  // ─── COMPATIBILITY LAYER v14.1 ───────────────────────────────────────────

  async getTrendingMovies() {
    const response = await this.api.get('/trending/movie/day');
    return response.data;
  }

  async getMediaDetails(id: number, type: 'movie' | 'tv') {
    const response = await this.api.get(`/${type}/${id}`, {
      params: { append_to_response: 'videos' }
    });
    const art = await this.getMediaArt({ tmdbId: id, type, title: '', year: 0, imdbId: null, traktId: null });
    return { ...response.data, ...art, media_type: type };
  }

  async getMediaBatch(items: { id: number, media_type: 'movie' | 'tv' }[]) {
    const requests = items.map(item => this.getMediaDetails(item.id, item.media_type));
    const results = await Promise.allSettled(requests);
    return results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);
  }
}

export const tmdbService = new TMDBService();
export default tmdbService;