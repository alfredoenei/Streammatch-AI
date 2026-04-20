/**
 * Configuración centralizada de géneros para el motor de búsqueda híbrida.
 * Sprint de Estabilización v11.1 — Externalización de Constantes
 *
 * Fuente: https://developers.themoviedb.org/3/genres
 */

export type GenreName =
  | 'Acción'
  | 'Aventura'
  | 'Animación'
  | 'Comedia'
  | 'Crimen'
  | 'Documental'
  | 'Drama'
  | 'Familia'
  | 'Fantasía'
  | 'Misterio'
  | 'Ciencia ficción'
  | 'Guerra'
  | 'Western'
  | 'Romance'
  | 'Thriller'
  | 'Terror'
  | 'Historia'
  | 'Música'
  | 'Bélico';

export interface IGenreMapping {
  movie: number;
  tv: number;
}

/**
 * Mapa de traducción Género → ID de TMDB por tipo de medio.
 * NOTA: Los IDs de TV y Movie son distintos en TMDB para algunos géneros.
 */
export const HYBRID_GENRE_MAP: Record<GenreName, IGenreMapping> = {
  'Acción':          { movie: 28,    tv: 10759 },
  'Aventura':        { movie: 12,    tv: 10759 },
  'Animación':       { movie: 16,    tv: 16    },
  'Comedia':         { movie: 35,    tv: 35    },
  'Crimen':          { movie: 80,    tv: 80    },
  'Documental':      { movie: 99,    tv: 99    },
  'Drama':           { movie: 18,    tv: 18    },
  'Familia':         { movie: 10751, tv: 10751 },
  'Fantasía':        { movie: 14,    tv: 10765 },
  'Misterio':        { movie: 9648,  tv: 9648  },
  'Ciencia ficción': { movie: 878,   tv: 10765 },
  'Guerra':          { movie: 10752, tv: 10768 },
  'Western':         { movie: 37,    tv: 37    },
  'Romance':         { movie: 10749, tv: 10749 },
  'Thriller':        { movie: 53,    tv: 9648  },
  'Terror':          { movie: 27,    tv: 9648  },
  'Historia':        { movie: 36,    tv: 36    },
  'Música':          { movie: 10402, tv: 10402 },
  'Bélico':          { movie: 10752, tv: 10768 },
};

/**
 * Obtiene el ID de TMDB correcto para un género dado un tipo de medio.
 */
export function getGenreId(genreName: string, mediaType: 'movie' | 'tv'): number | undefined {
  const mapping = HYBRID_GENRE_MAP[genreName as GenreName];
  if (!mapping) return undefined;
  return mediaType === 'tv' ? mapping.tv : mapping.movie;
}
