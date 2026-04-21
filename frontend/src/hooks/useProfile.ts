import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './useAuth';
import { movieService } from '../services/movie.service';
import type { Movie } from '../types/movie';
import { toast } from 'sonner';
import axios from 'axios';

/**
 * Hook especializado para la gestión del perfil del usuario y favoritos.
 * Desacopla la lógica de negocio de perfil del AuthContext central.
 */
export const useProfile = () => {
  const { setUser, isAuthenticated } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar Watchlist inicial (v18.0)
  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchlist();
    }
  }, [isAuthenticated]);

  const fetchWatchlist = async () => {
    setIsLoadingWatchlist(true);
    try {
      const response = await movieService.getWatchlist();
      if (response.success) {
        setWatchlist(response.data);
      }
    } catch (err: unknown) {
      console.error('Error fetching watchlist:', err);
    } finally {
      setIsLoadingWatchlist(false);
    }
  };

  /**
   * Helper descriptivo para saber si un item está en el cofre.
   */
  const isInWatchlist = useCallback((movieId: number) => {
    return watchlist.some(item => item.id === movieId);
  }, [watchlist]);

  /**
   * El Cofre: Toggle Optimista (v18.2 Staff Engineer Directive)
   */
  const toggleWatchlist = async (movie: Movie) => {
    const movieId = movie.id;
    const isAlreadySaved = isInWatchlist(movieId);
    
    // 1. Actualización Optimista
    const previousWatchlist = [...watchlist];
    if (isAlreadySaved) {
      setWatchlist(prev => prev.filter(item => item.id !== movieId));
      toast.success('Eliminada del cofre');
    } else {
      setWatchlist(prev => [movie, ...prev]);
      toast.success('¡Añadida a tu cofre!', {
        description: `${movie.title || movie.name} se guardó para luego.`
      });
    }

    // 2. Persistencia en segundo plano
    try {
      await movieService.toggleWatchlist(movie);
    } catch {
      // 3. Reversión en caso de fallo
      setWatchlist(previousWatchlist);
      toast.error('Error de sincronización', {
        description: 'No se pudo actualizar tu cofre. Inténtalo de nuevo.'
      });
    }
  };

  /**
   * Actualiza las plataformas de streaming contratadas por el usuario.
   */
  const updatePlatforms = async (streamingPlatforms: string[]) => {
    setIsUpdating(true);
    setError(null);
    try {
      const response = await api.put('/auth/profile', { streamingPlatforms });
      if (response.data.success) {
        // Actualizamos el estado global del usuario reactivamente
        setUser((prevUser) => prevUser ? { ...prevUser, streamingPlatforms } : null);
      }
      return response.data;
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) 
        ? (err.response?.data?.message || 'Error al actualizar preferencias')
        : 'Error al actualizar preferencias';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsUpdating(false);
    }
  };
  /**
   * Añade o elimina contenido del historial de visionado.
   * v11.0: Soporte Híbrido
   */
  const toggleWatched = async (movieId: number, mediaType: 'movie' | 'tv' = 'movie') => {
    setError(null);
    try {
      const response = await api.patch(`/users/watch/${movieId}?mediaType=${mediaType}`);
      if (response.data.success) {
        setUser((prevUser) => prevUser ? { 
          ...prevUser, 
          watchedMovies: response.data.data.watchedMovies 
        } : null);
      }
      return response.data;
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message || 'Error al actualizar historial')
        : 'Error al actualizar historial';
      setError(msg);
      throw new Error(msg);
    }
  };

  return {
    updatePlatforms,
    toggleWatched,
    toggleWatchlist,
    isInWatchlist,
    fetchWatchlist,
    watchlist,
    isLoadingWatchlist,
    isUpdating,
    error,
    clearError: () => setError(null)
  };
};
