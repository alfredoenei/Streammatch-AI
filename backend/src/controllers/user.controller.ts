import { Request, Response } from 'express';
import { IUserDocument } from '../types/user';
import tmdbService from '../services/tmdb.service';

/**
 * v10.1: Gestión robusta del historial de visionado.
 * Añade o elimina una película del historial (Toggle).
 */
export const toggleWatchedMovie = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const { mediaType = 'movie' } = req.query; // v11.0 Support
    const user = req.user as IUserDocument;

    if (!movieId || isNaN(Number(movieId))) {
      res.status(400).json({ 
        success: false, 
        message: 'ID de contenido inválido.' 
      });
      return;
    }

    const movieIDNum = Number(movieId);
    const mType = mediaType as 'movie' | 'tv';

    // Verificamos existencia previa con comparativa de objeto (Hibridación)
    const watchedIndex = user.watchedMovies.findIndex(item => 
      item.id === movieIDNum && item.media_type === mType
    );

    const isWatched = watchedIndex !== -1;

    if (isWatched) {
      user.watchedMovies.splice(watchedIndex, 1);
    } else {
      user.watchedMovies.push({ id: movieIDNum, media_type: mType });
    }

    await user.save();
    
    res.status(200).json({
      success: true,
      message: isWatched ? 'Eliminado del historial' : 'Añadido al historial',
      data: {
        movieId: movieIDNum,
        mediaType: mType,
        isWatched: !isWatched,
        watchedMovies: user.watchedMovies
      }
    });

  } catch (error: any) {
    console.error('❌ [USER CONTROLLER] Toggle Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error crítico al actualizar el historial.' 
    });
  }
};

/**
 * v10.1: Obtención hidratada del historial.
 */
export const getWatchedHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUserDocument;

    if (!user.watchedMovies || user.watchedMovies.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    // Hidratar con metadata real (Híbrido v11.0)
    const movies = await tmdbService.getMediaBatch(user.watchedMovies);

    res.status(200).json({
      success: true,
      data: movies
    });
  } catch (error: any) {
    console.error('❌ [USER CONTROLLER] History Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error al recuperar el detalle del historial.' 
    });
  }
};

/**
 * v10.1: Actualización del Perfil de Paladar con flag de Onboarding.
 */
export const updateTasteProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUserDocument;
    const { tasteProfile } = req.body;

    if (!tasteProfile || typeof tasteProfile !== 'object') {
      res.status(400).json({ 
        success: false, 
        message: 'Datos de perfil de paladar inválidos.' 
      });
      return;
    }

    // Persistencia atómica
    user.tasteProfile = tasteProfile;
    user.hasCompletedOnboarding = true;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: '¡Radar configurado! Tu paladar ha sido guardado.',
      data: {
        tasteProfile: user.tasteProfile,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      }
    });
  } catch (error: any) {
    console.error('❌ [USER CONTROLLER] Update Profile Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Fallo al sincronizar tu perfil de paladar.' 
    });
  }
};

/**
 * v10.1: Reinicio total de preferencias (Hard Reset).
 */
export const resetTasteProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUserDocument;
    
    // Reset de estado
    user.tasteProfile = null;
    user.hasCompletedOnboarding = false;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Radar reiniciado. Onboarding reactivado.',
      data: {
        tasteProfile: null,
        hasCompletedOnboarding: false
      }
    });
  } catch (error: any) {
    console.error('❌ [USER CONTROLLER] Reset Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'No se pudo reiniciar el radar en este momento.' 
    });
  }
};
