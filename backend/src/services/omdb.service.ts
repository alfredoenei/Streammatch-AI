import axios from 'axios';
import stringSimilarity from 'string-similarity';
import { IMediaIdentity } from '../types/tmdb.types';

/**
 * OMDb Service v14.4 — The Safety Net
 * 
 * Rol: Fallback de identidad cuando Trakt falla.
 */
class OMDbService {
  private readonly api_key = process.env.OMDB_API_KEY;
  private readonly base_url = 'http://www.omdbapi.com/';

  async searchTitle(
    query: string, 
    year: number | null, 
    type: 'movie' | 'tv'
  ): Promise<IMediaIdentity | null> {
    if (!this.api_key) {
      console.warn('⚠️ [OMDb] Missing API Key. Skipping.');
      return null;
    }

    try {
      const params: any = {
        apikey: this.api_key,
        t: query,
      };

      if (year) params.y = year;
      params.type = type === 'tv' ? 'series' : 'movie';

      const response = await axios.get(this.base_url, { params, timeout: 5000 });
      const data = response.data;

      if (data.Response === 'False') {
        console.log(`❌ [OMDb] No results for "${query}"`);
        return null;
      }

      // v14.4: Validación de Similitud también en el Fallback
      if (!this._validateMatch(query, data.Title)) {
        console.warn(`⚠️ [OMDb] Descarte por desvío en fallback: "${query}" vs "${data.Title}"`);
        return null;
      }

      return {
        imdbId: data.imdbID || null,
        tmdbId: null,
        traktId: null,
        title: data.Title,
        year: parseInt(data.Year),
        type: data.Type === 'series' ? 'tv' : 'movie',
        posterUrl: data.Poster !== 'N/A' ? data.Poster : undefined,
      };
    } catch (error) {
      console.error(`❌ [OMDb] Error for "${query}":`, (error as Error).message);
      return null;
    }
  }

  private _validateMatch(requested: string, found: string): boolean {
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const req = normalize(requested);
    const fnd = normalize(found);
    
    // Si la IA nos dio contexto (ej: Tiger Woods), y el resultado lo contiene, es un match perfecto
    if (requested.includes('(') && fnd.includes(req)) return true;

    const similarity = stringSimilarity.compareTwoStrings(req, fnd);
    return similarity >= 0.85;
  }
}

export const omdbService = new OMDbService();
export default omdbService;
