import { Request, Response } from 'express';
import { Watchlist } from '../models/Watchlist';
import { IUserDocument } from '../types/user';

/**
 * Toggle (Añadir/Quitar) contenido del Cofre de forma atómica.
 * v18.1: Resiliencia ante concurrencia (Staff Engineer Directive).
 */
export const toggleWatchlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUserDocument;
    const { movie } = req.body;

    if (!movie || !movie.id) {
      res.status(400).json({ success: false, message: 'Datos de la película incompletos.' });
      return;
    }

    // 1. Intentamos buscar si ya existe
    const existing = await Watchlist.findOne({ 
      userId: user._id, 
      'movie.id': movie.id 
    });

    if (existing) {
      // Si existe, lo borramos (Toggle: Off)
      await Watchlist.deleteOne({ _id: existing._id });
      res.status(200).json({ 
        success: true, 
        action: 'removed', 
        message: 'Eliminada de tu cofre.' 
      });
      return;
    }

    // 2. Si no existe, intentamos guardarlo (Toggle: On)
    try {
      const newItem = new Watchlist({
        userId: user._id,
        movie: movie
      });
      await newItem.save();
      
      res.status(201).json({ 
        success: true, 
        action: 'added', 
        message: '¡Guardada en tu cofre!' 
      });
    } catch (saveError: any) {
      // Manejo de Colisión por doble clic rápido (Código 11000 de MongoDB)
      if (saveError.code === 11000) {
        // Si alguien se nos adelantó (concurrencia), asumimos que el toggle quería borrarlo 
        // o simplemente ignoramos para evitar que la app crashee.
        await Watchlist.deleteOne({ userId: user._id, 'movie.id': movie.id });
        res.status(200).json({ 
          success: true, 
          action: 'removed', 
          message: 'Eliminada de tu cofre (concurrencia).' 
        });
        return;
      }
      throw saveError;
    }

  } catch (error) {
    console.error('❌ [WATCHLIST_ERROR]:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Fallo al sincronizar con tu cofre.' 
    });
  }
};

/**
 * Recupera todos los tesoros guardados del usuario.
 */
export const getWatchlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUserDocument;
    
    const items = await Watchlist.find({ userId: user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: items.map(item => item.movie) // Devolvemos el array de objetos de película directamente
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al recuperar tu cofre.' 
    });
  }
};
