/**
 * Tipos centralizados para la integración con TMDB y el Motor de IA.
 * Sprint de Estabilización v11.1 — Tipado Estricto
 */

import { z } from 'zod';
import type { MediaType, IMediaItem, ITasteProfile, StreamingPlatform } from './user';

// ─────────────────────────────────────────────────────────────────────────────
// RE-EXPORTS de user.ts para uso cross-module sin dependencias circulares
// ─────────────────────────────────────────────────────────────────────────────
export type { MediaType, IMediaItem, ITasteProfile, StreamingPlatform };

// ─────────────────────────────────────────────────────────────────────────────
// TMDB — Estructuras crudas de la API
// ─────────────────────────────────────────────────────────────────────────────

export interface ITMDBProvider {
  provider_id: number;
  provider_name: string;
  logo_path?: string;
}

export interface ITMDBWatchProviderResult {
  link?: string;
  flatrate?: ITMDBProvider[];
  rent?: ITMDBProvider[];
  buy?: ITMDBProvider[];
}

export interface ITMDBWatchProviderResponse {
  results: Record<string, ITMDBWatchProviderResult>;
}

export interface ITMDBMedia {
  id: number;
  title?: string;        // Películas
  name?: string;         // Series
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;     // Películas
  first_air_date?: string;   // Series
  vote_average: number;
  genre_ids: number[];
  popularity: number;
  media_type: MediaType;
  isExternal?: boolean;
}

export interface ITMDBMediaEnriched extends ITMDBMedia {
  premiumMetadata: IPremiumMetadata | null;
  isAvailable: boolean;
  allAvailableProviders?: ITMDBProvider[]; // v12.5 Consultant Feature
}

export interface IPremiumMetadata {
  brandColor: string;
  logo: string;
  platformName: string;
}

export interface ITMDBDiscoverResponse {
  page: number;
  results: ITMDBMedia[];
  total_pages: number;
  total_results: number;
  totalRawResults?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI SERVICE — Contrato de respuesta del LLM (Zod + TypeScript)
// ─────────────────────────────────────────────────────────────────────────────

export const AIResponseSchema = z.object({
  interaction_type: z.enum(['INITIAL', 'REFINEMENT', 'EXPANSION']).default('INITIAL'), // v16.3 Conversational memory
  internal_reasoning: z.string().default(''), // v13.1 Chain of Thought
  movie_selection: z.array(z.object({
    title: z.string(),
    original_title: z.string().optional(), // v34.5: Precision machine title
    local_title: z.string().optional(),    // v34.5: Human/Spanish title
    year: z.number(),
    type: z.enum(['movie', 'tv'])
  })).default([]), // v14.3 Structured Identity
  movie_titles: z.array(z.string()).default([]), // Deprecated v14.3
  media_type: z.enum(['movie', 'tv', 'both']).default('both'),
  advisory: z.string().default('Sommelier v16.0: Escudo Narrativo activo.'),
  narrative_justification: z.string().default(''), // v16.0: La Voz del Sommelier (Markdown)
});

export type IAIResponse = z.infer<typeof AIResponseSchema>;

export interface IAIFilters extends IAIResponse {
  source: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TMDB SERVICE — Parámetros de búsqueda
// ─────────────────────────────────────────────────────────────────────────────

export interface IDiscoverParams {
  aiFilters: IAIFilters;
  platforms: StreamingPlatform[];
  watchedMovies: IMediaItem[];
  region?: string;
  activePlatformIds?: number[];
  prompt?: string;
  mediaTypeOverride?: 'movie' | 'tv' | 'both';
  sessionId?: string; // v16.3 Conversational context
}

// ─────────────────────────────────────────────────────────────────────────────
// IDENTITY LAYER — v14.1
// ─────────────────────────────────────────────────────────────────────────────

export interface IMediaIdentity {
  imdbId: string | null;
  tmdbId: number | null;
  traktId: number | null;
  title: string;
  original_title?: string; // v34.5
  local_title?: string;    // v34.5
  year: number;
  type: 'movie' | 'tv';
  posterUrl?: string; // v15.0: Native Fallback Poster
}
