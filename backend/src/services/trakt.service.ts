import axios, { AxiosInstance } from 'axios';
import stringSimilarity from 'string-similarity';
import { IMediaIdentity } from '../types/tmdb.types';

/**
 * Trakt Service v14.1 — The Librarian
 * 
 * Rol: Identificador principal de títulos.
 * Estrategia: Búsqueda estricta -> Búsqueda por rango de año.
 */
class TraktService {
  private readonly api: AxiosInstance;
  private readonly CLIENT_ID = process.env.TRAKT_CLIENT_ID;

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.trakt.tv',
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': this.CLIENT_ID,
      },
      timeout: 1500, // Staff Engineer Requirement: 1500ms limit
    });
  }

  async searchTitle(
    query: string, 
    year: number | null, 
    type: 'movie' | 'tv'
  ): Promise<IMediaIdentity | null> {
    if (!this.CLIENT_ID) {
      console.warn('⚠️ [TRAKT] Missing API Key. Skipping.');
      return null;
    }

    try {
      // v14.3: Búsqueda Determinista por Tipo
      let identity = await this._executeSearch(query, year, type);

      // v14.3: La tolerancia de año ahora es manejada por el validador estricto, 
      // pero mantenemos un reintento si la búsqueda exacta por año falla.
      if (!identity && year) {
        console.log(`🔍 [TRAKT] No match for ${query} (${year}). Retrying with range...`);
        const years = `${year-1}-${year+1}`;
        identity = await this._executeSearch(query, null, type, years, year);
      }

      return identity;
    } catch (error) {
      console.error(`❌ [TRAKT] Error searching "${query}":`, (error as Error).message);
      return null;
    }
  }

  private async _executeSearch(
    query: string, 
    year: number | null, 
    type: 'movie' | 'tv',
    yearRange?: string,
    requestedYear?: number
  ): Promise<IMediaIdentity | null> {
    const mediaTypes = type === 'tv' ? 'show' : 'movie';
    const params: any = {
      query,
      extended: 'full',
    };

    if (year) params.years = year;
    if (yearRange) params.years = yearRange;

    const response = await this.api.get(`/search/${mediaTypes}`, { params });
    const results = response.data;

    if (!Array.isArray(results) || results.length === 0) return null;

    // v16.2: Selección inteligente por validación y popularidad (Anti-Homónimo)
    const targetYear = requestedYear || year;
    const validMatches: any[] = [];
    
    for (const result of results) {
      const item = result.movie || result.show;
      if (!item) continue;

      if (this._validateMatch(query, targetYear, type, item)) {
        validMatches.push(item);
      }
    }

    if (validMatches.length === 0) return null;
    if (validMatches.length === 1) {
      const best = validMatches[0];
      return {
        imdbId: best.ids.imdb || null,
        tmdbId: best.ids.tmdb || null,
        traktId: best.ids.trakt || null,
        title: best.title,
        year: best.year,
        type: type,
      };
    }

    // Si hay múltiples matches válidos (ej: "El Camino"), usamos heurística de popularidad
    console.log(`⚖️ [TRAKT] Desambiguando ${validMatches.length} matches para "${query}"...`);
    const sorted = validMatches.sort((a, b) => {
      // Prioridad 1: Rating * Votes (Densidad de relevancia)
      const scoreA = (a.rating || 0) * (a.votes || 0);
      const scoreB = (b.rating || 0) * (b.votes || 0);
      return scoreB - scoreA;
    });

    const best = sorted[0];
    console.log(`🎯 [TRAKT] Ganador por relevancia: "${best.title}" (${best.year}) - Score: ${(best.rating * best.votes).toLocaleString()}`);

    return {
      imdbId: best.ids.imdb || null,
      tmdbId: best.ids.tmdb || null,
      traktId: best.ids.trakt || null,
      title: best.title,
      year: best.year,
      type: type,
    };
  }

  /**
   * v14.3: El Corazón del Motor de Identidad.
   * Aplica Normalización, Candado Temporal y Sørensen-Dice.
   */
  private _validateMatch(requestedTitle: string, requestedYear: number | null, requestedType: string, foundItem: any): boolean {
    const normalizedReq = this._normalizeString(requestedTitle);
    const normalizedFound = this._normalizeString(foundItem.title);

    // 1. Candado Temporal Extremo (v14.3)
    if (requestedYear && foundItem.year) {
      if (Math.abs(requestedYear - foundItem.year) > 1) {
        return false;
      }
    }

    // 2. Similitud de Sørensen-Dice (>= 0.85)
    // v14.4: Plus de rigor para títulos cortos (1 o 2 palabras) para evitar genéricos como "Tiger"
    const similarity = stringSimilarity.compareTwoStrings(normalizedReq, normalizedFound);
    const wordCount = requestedTitle.split(/\s+/).length;
    
    let threshold = 0.85;
    if (wordCount <= 2) threshold = 0.92;

    if (similarity < threshold) {
      // Caso especial: Si uno contiene al otro y la diferencia no es masiva, permitimos
      if ((normalizedFound.includes(normalizedReq) || normalizedReq.includes(normalizedFound)) && similarity > 0.6) {
        // Ok
      } else {
        return false;
      }
    }

    // 3. Deep Keyword Validation (v14.5 - Anti-Homonym Shield)
    // v14.5: Si el título es corto y el resultado parece un falso positivo (ej: "The Tiger"),
    // buscamos keywords que confirmen la intención del usuario en la sinopsis.
    if (wordCount <= 2 && foundItem.overview) {
      const overview = foundItem.overview.toLowerCase();
      const queryWords = requestedTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      
      // Si la query de la IA tiene palabras de contexto (ej: Tiger Woods), deben estar en la sinopsis
      // o el título encontrado debe ser una coincidencia casi perfecta (>= 0.98).
      const hasKeywords = queryWords.some(word => overview.includes(word));
      if (!hasKeywords && similarity < 0.98) {
        console.warn(`🕵️ [TRAKT] Descarte Anti-Homónimo: "${foundItem.title}" no contiene keywords de "${requestedTitle}"`);
        return false;
      }
    }

    // 4. Linguistic Lock (v15.5 - Anti-Soap Opera Shield)
    // Evita que homónimos en idiomas no solicitados (Tagalo, Árabe, etc.) se cuelen 
    // en búsquedas genéricas (ej: "All or Nothing" -> Serie Filipina).
    const originalLanguage = foundItem.language;
    if (originalLanguage && originalLanguage !== 'en' && originalLanguage !== 'es') {
      // Solo permitimos idiomas exóticos si la IA incluyó el título original con paréntesis
      // o si la similitud es absoluta (100%), signo de que es lo que buscábamos.
      if (!requestedTitle.includes('(') && similarity < 0.99) {
        console.warn(`🕵️ [TRAKT] Bloqueo Lingüístico (${originalLanguage}) para "${foundItem.title}"`);
        return false;
      }
    }

    return true;
  }

  private _normalizeString(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Eliminar todo menos alfanuméricos
      .trim();
  }
}

export const traktService = new TraktService();
export default traktService;
