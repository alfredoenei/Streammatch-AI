import { Request, Response } from 'express';
import { User } from '../models/User';
import { RadarConversation, ILockedIdentity } from '../models/RadarConversation';
import tmdbService from '../services/tmdb.service';
import aiService from '../services/ai.service';
import radarOrchestrator from '../services/radar.orchestrator';
import { IUserDocument, StreamingPlatform } from '../types/user';
import { PLATFORMS, AVAILABLE_PLATFORMS } from '../config/platforms';

/**
 * Endpoint para obtener la metadata premium de todas las plataformas.
 * Usado por el Panel de Control Inteligente.
 */
export const getAvailablePlatforms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const platforms = Object.values(PLATFORMS).map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      logo: p.logo
    }));

    res.status(200).json({
      success: true,
      data: platforms
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener el catálogo de marcas.' });
  }
};

/**
 * Handles the request to get trending movies.
 */
export const getTrendingMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await tmdbService.getTrendingMovies();
    
    const identities = data.results.map((r: any) => ({
      tmdbId: r.id,
      imdbId: null,
      traktId: null,
      title: r.title || r.name,
      year: parseInt(r.release_date || r.first_air_date || '0'),
      type: r.media_type
    }));

    const results = await Promise.all(identities.map(async (id: any) => {
      const aesthetic = await tmdbService.getMediaArt(id);
      return { ...id, ...aesthetic };
    }));

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error en el Radar de Tendencias.'
    });
  }
};

/**
 * Handles the request to get movie recommendations based on user's platforms.
 */
export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUserDocument;
    const { ignorePlatforms } = req.query;
    const activeRegion = user.region || 'ES';

    let platformsToUse: StreamingPlatform[];

    if (ignorePlatforms === 'true') {
      platformsToUse = AVAILABLE_PLATFORMS as StreamingPlatform[];
    } else {
      platformsToUse = user.streamingPlatforms as StreamingPlatform[] || [];
    }

    const aiFilters = await aiService.translatePromptToFilters(
      'Recomienda las 15 mejores películas y series tendencia actuales de alta calidad.',
      user.tasteProfile,
      undefined,
      'both',
      user.name
    );

    const selection = (aiFilters.movie_selection && aiFilters.movie_selection.length > 0)
      ? aiFilters.movie_selection
      : aiFilters.movie_titles.map(t => ({ title: t, year: 2024, type: 'movie' as const }));

    const results = await radarOrchestrator.orchestrateSemanticSearch(
      selection,
      activeRegion,
      platformsToUse,
      user.watchedMovies
    );

    res.status(200).json({
      success: true,
      data: results,
      meta: {
        total: results.length,
        isExpanded: ignorePlatforms === 'true'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Fallo en la sincronización del Radar Premium.'
    });
  }
};

/**
 * Handles the request to get a single movie's full details.
 */
export const getMovieDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { mediaType = 'movie' } = req.query;
    const data = await tmdbService.getMediaDetails(Number(id), mediaType as 'movie' | 'tv');
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Fallo al contactar con el Radar de detalle.' });
  }
};

/**
 * Sincroniza las plataformas del usuario con las de un amigo (Modo Fiesta).
 */
export const syncWithFriend = async (req: Request, res: Response): Promise<void> => {
  try {
    const { friendEmail } = req.body;
    const currentUser = req.user as IUserDocument;

    const friend = await User.findOne({ email: friendEmail.toLowerCase() })
      .select('name streamingPlatforms')
      .lean();

    if (!friend) {
      res.status(404).json({ success: false, message: 'Compañero no encontrado en el sistema.' });
      return;
    }

    const commonPlatforms = currentUser.streamingPlatforms.filter(
      (platform) => friend.streamingPlatforms.includes(platform)
    );

    res.status(200).json({
      success: true,
      message: `¡Radar de Fiesta sincronizado con ${friend.name}!`,
      data: {
        friendName: friend.name,
        commonPlatforms,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Fallo en la sincronización del Modo Fiesta.' });
  }
};

/**
 * Motor de Recomendación Semántica (Barra Mágica) — Conversacional.
 */
export const recommendAI = async (req: Request, res: Response): Promise<void> => {
  const { prompt, platforms, activeMode = 'both', sessionId } = req.body;
  console.log('\n--- 🚀 [RADAR v16.4] PETICIÓN CONVERSACIONAL ---');
  
  try {
    const user = req.user as IUserDocument;
    const { ignorePlatforms } = req.query;
    const activeRegion = user.region || 'ES';
    
    const abortController = new AbortController();
    req.on('close', () => {
      if (!abortController.signal.aborted) abortController.abort();
    });

    if (!prompt) {
      res.status(400).json({ success: false, message: 'La frecuencia mágica está vacía.' });
      return;
    }

    let conversationalContext = '';
    let lockedIdentities: Record<string, any> = {};
    let session: any = null;

    if (sessionId) {
      // Usamos cast a any para evitar problemas de tipos con threadId en Mongoose Query
      session = await (RadarConversation as any).findOne({ threadId: sessionId, userId: user._id });
      if (session) {
        const lastTurns = session.turns.slice(-2).map((t: any) => `USER: ${t.prompt}\nAI: ${t.aiResponse}`).join('\n\n');
        lockedIdentities = Object.fromEntries(session.lockedIdentities);
        const lockedTitles = Object.values(lockedIdentities).map((l: any) => `${l.title} (${l.year})`).join(', ');
        
        conversationalContext = `PROMPT ORIGINAL: ${session.originalPrompt}\n\nÚLTIMOS TURNOS:\n${lastTurns}\n\nTÍTULOS ACTUALMENTE EN PANTALLA: ${lockedTitles}`;
        console.log(`🧠 [MEMORIA] Contexto cargado: ${session.turns.length} turnos.`);
      }
    }

    const aiFilters = await aiService.translatePromptToFilters(
      prompt,
      user.tasteProfile,
      abortController.signal,
      activeMode as 'movie' | 'tv' | 'both',
      user.name,
      conversationalContext
    );

    const headers = req.headers as any;
    const isDebug = headers['x-radar-debug'] === 'true' || prompt.toLowerCase().includes('debug mode');

    if (abortController.signal.aborted) return;

    let platformsToUse: StreamingPlatform[];
    if (ignorePlatforms === 'true') {
      platformsToUse = AVAILABLE_PLATFORMS as StreamingPlatform[];
    } else {
      const activeSelection = Array.isArray(platforms) ? platforms : [];
      platformsToUse = activeSelection.length > 0 
        ? activeSelection as StreamingPlatform[] 
        : (user.streamingPlatforms as StreamingPlatform[] || []);
      
      if (platformsToUse.length === 0) {
        res.status(200).json({ success: false, message: 'Selecciona al menos una plataforma.', data: [] });
        return;
      }
    }

    const selection = (aiFilters.movie_selection && aiFilters.movie_selection.length > 0)
      ? aiFilters.movie_selection
      : aiFilters.movie_titles.map(t => ({ title: t, year: 2024, type: activeMode === 'tv' ? 'tv' as const : 'movie' as const }));

    const results = await radarOrchestrator.orchestrateSemanticSearch(
      selection,
      activeRegion,
      platformsToUse,
      user.watchedMovies,
      lockedIdentities
    );

    if (sessionId) {
      if (!session) {
        session = new RadarConversation({
          userId: user._id,
          threadId: sessionId,
          originalPrompt: prompt,
          turns: [],
          lockedIdentities: new Map()
        });
      }
      
      results.forEach(r => {
        const key = `${r.title.toLowerCase()}-${r.year}-${r.media_type}`.replace(/\./g, '');
        session.lockedIdentities.set(key, {
          id: r.id,
          tmdbId: r.tmdbId,
          imdbId: r.imdbId,
          title: r.title,
          year: r.year,
          type: r.media_type,
          posterUrl: r.posterUrl
        });
      });

      session.turns.push({
        prompt: prompt,
        interaction_type: aiFilters.interaction_type,
        aiResponse: aiFilters.narrative_justification,
        timestamp: new Date()
      });

      await session.save();
    }

    res.status(200).json({
      success: true,
      message: aiFilters.advisory,
      data: results, 
      narrative: aiFilters.narrative_justification,
      source: aiFilters.source,
      meta: {
        total: results.length,
        isExpanded: ignorePlatforms === 'true',
        region: activeRegion
      }
    });
  } catch (error: any) {
    const isAbort = error?.name === 'AbortError' || error?.name === 'CanceledError' || error?.code === 'ECONNABORTED';
    if (isAbort) {
      res.status(200).json({ success: false, isAbort: true, data: [] });
      return;
    }
    console.error('--- CRITICAL RADAR ERROR ---', error?.message);
    res.status(200).json({ success: false, message: 'Radar saturado.', data: [], source: 'fail-soft' });
  }
};

/**
 * Destruye la memoria de la sesión conversacional.
 */
export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const user = req.user as IUserDocument;

    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Falta SessionID.' });
      return;
    }

    const result = await (RadarConversation as any).deleteOne({ threadId: sessionId, userId: user._id });
    
    if (result.deletedCount === 0) {
       res.status(404).json({ success: false, message: 'Sesión no encontrada.' });
       return;
    }

    res.status(200).json({ success: true, message: 'Radar limpiado.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al limpiar sesión.' });
  }
};
/**
 * Recupera el historial de una sesión conversacional para rehidratación del UI.
 */
export const getSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const user = req.user as IUserDocument;

    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Falta SessionID.' });
      return;
    }

    const session = await (RadarConversation as any).findOne({ threadId: sessionId, userId: user._id });

    if (!session) {
      res.status(404).json({ success: false, message: 'Sesión no encontrada.' });
      return;
    }

    // v17.0: Formateo limpio para el frontend (Chat Log)
    const chatHistory = session.turns.map((turn: any) => ({
      prompt: turn.prompt,
      aiResponse: turn.aiResponse,
      timestamp: turn.timestamp
    }));

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.threadId,
        originalPrompt: session.originalPrompt,
        history: chatHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al recuperar la sesión.' });
  }
};
