import { Router } from 'express';
import { z } from 'zod';
import * as movieController from '../controllers/movie.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import rateLimit from 'express-rate-limit';

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Límite de 10 peticiones estrictas para consumo de tokens
  message: { success: false, message: 'Límite de solicitudes IA alcanzado. Por favor, realiza búsquedas con más cautela.' },
  standardHeaders: true,
  legacyHeaders: false,
});


// Esquema de validación para Modo Fiesta
const syncSchema = z.object({
  body: z.object({
    friendEmail: z.string()
      .email('Email de amigo no válido')
      .toLowerCase()
  })
});

// Esquema para recomendación por IA
const recommendAISchema = z.object({
  body: z.object({
    prompt: z.string().min(5, 'La frase debe ser un poco más descriptiva'),
    platforms: z.array(z.string()).optional()
  })
});

const router = Router();

/**
 * @route GET /api/movies/platforms
 * @desc Get rich metadata for all supported streaming platforms (Premium UI)
 * @access Public
 */
router.get('/platforms', movieController.getAvailablePlatforms);

/**
 * @route GET /api/movies/trending
 * @desc Get trending movies from TMDB for the current week
 * @access Public
 */
router.get('/trending', movieController.getTrendingMovies);

/**
 * @route GET /api/movies/recommendations
 * @desc Get personalized movie recommendations based on user's platforms
 * @access Private
 */
router.get('/recommendations', protect, movieController.getRecommendations);


/**
 * @route GET /api/movies/:id
 * @desc Get detailed information for a single movie
 * @access Private
 */
router.get('/:id', protect, movieController.getMovieDetails);

/**
 * @route POST /api/movies/sync
 * @desc Sync platforms with a friend for Party Mode
 * @access Private
 */
router.post('/sync', protect, validate(syncSchema), movieController.syncWithFriend);

/**
 * @route POST /api/movies/recommend-ai
 * @desc Get semantic recommendations using Gemini AI
 * @access Private
 */
router.post('/recommend-ai', protect, aiLimiter, validate(recommendAISchema), movieController.recommendAI);

/**
 * @route GET /api/movies/session/:sessionId
 * @desc Retrieve conversation history for rehydration
 * @access Private
 */
router.get('/session/:sessionId', protect, movieController.getSession);

/**
 * @route DELETE /api/movies/session/:sessionId
 * @desc Clear an active Conversational Radar session
 * @access Private
 */
router.delete('/session/:sessionId', protect, movieController.deleteSession);

export default router;
