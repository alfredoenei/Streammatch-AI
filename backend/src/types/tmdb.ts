import { z } from 'zod';

/**
 * Zod Schemas for TMDB API Responses.
 * Implements the "Fail-Fast" / "Fail-Soft" contract for Data Integrity.
 */

export const TMDBMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string().optional().default('Sin descripción disponible.'),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  release_date: z.string().optional().default(''),
  vote_average: z.number().optional().default(0),
  genre_ids: z.array(z.number()).optional().default([]),
  popularity: z.number().optional().default(0),
});

export const TMDBMovieResponseSchema = z.object({
  page: z.number().optional().default(1),
  results: z.array(TMDBMovieSchema),
  total_pages: z.number().optional().default(1),
  total_results: z.number().optional().default(0),
  totalRawResults: z.number().optional(), // Metadata para transparencia de filtrado
});

export const TMDBWatchProviderSchema = z.object({
  results: z.record(z.string(), z.object({
    link: z.string().optional(),
    flatrate: z.array(
      z.object({
        provider_id: z.number(),
        provider_name: z.string(),
        logo_path: z.string().optional(),
      })
    ).optional(),
  })),
});

export type ITMDBMovie = z.infer<typeof TMDBMovieSchema>;
export type ITMDBMovieResponse = z.infer<typeof TMDBMovieResponseSchema>;
export type ITMDBWatchProvider = z.infer<typeof TMDBWatchProviderSchema>;
