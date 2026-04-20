import axios from 'axios';
import api from './api';
import type { MovieResponse } from '../types/movie';

class MovieService {
  /**
   * Obtiene la lista de películas recomendadas basadas en las plataformas del usuario.
   */
  async getRecommendations(platforms?: string[]): Promise<MovieResponse> {
    try {
      const url = platforms && platforms.length > 0 
        ? `/movies/recommendations?platforms=${platforms.join(',')}`
        : '/movies/recommendations';
      const response = await api.get<MovieResponse>(url);
      return response.data;
    } catch (error: any) {
      console.error('Frontend MovieService Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al obtener las recomendaciones.');
    }
  }


  /**
   * Obtiene la lista completa de películas en el historial de visionado.
   */
  async getWatchedHistory(): Promise<MovieResponse> {
    try {
      const response = await api.get<MovieResponse>('/users/history');
      return response.data;
    } catch (error: any) {
      console.error('Frontend MovieService Error (History):', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al obtener tu historial.');
    }
  }

  /**
   * Obtiene los detalles completos de una película o serie de forma determinista.
   */
  async getMovieDetails(movieId: number, mediaType: 'movie' | 'tv'): Promise<any> {
    try {
      const response = await api.get(`/movies/${movieId}?mediaType=${mediaType}`);
      return response.data;
    } catch (error: any) {
      console.error('Frontend MovieService Error (Single):', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al obtener los detalles del contenido.');
    }
  }


  /**
   * Obtiene la lista de plataformas disponibles con su metadata premium (logos, colores).
   */
  async getAvailablePlatforms(): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await api.get('/movies/platforms');
      return response.data;
    } catch (error: any) {
      console.error('Frontend MovieService Error (Platforms):', error.message);
      throw new Error('Error al conectar con el catálogo de plataformas.');
    }
  }

  /**
   * Obtiene recomendaciones semánticas basadas en lenguaje natural usando IA.
   */
  async recommendAI(
    prompt: string, 
    platforms: string[] = [], 
    ignorePlatforms: boolean = false, 
    signal?: AbortSignal, 
    activeMode: 'movie' | 'tv' | 'both' = 'both',
    sessionId?: string
  ): Promise<MovieResponse> {
    try {
      const response = await api.post<MovieResponse>('/movies/recommend-ai', 
        { prompt, platforms, activeMode, sessionId }, // v16.3 sessionId support
        { 
          params: { ignorePlatforms },
          signal 
        }
      );
      return response.data;
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log('Radar request canceled:', prompt);
        return { success: false, data: [], message: 'Request canceled' };
      }
      console.error('Frontend AIService Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error en la magia del Radar.');
    }
  }

  /**
   * Limpia la sesión conversacional activa en el backend.
   */
  async clearSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/movies/session/${sessionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Frontend AIService Error (Clear):', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al limpiar la sesión del Radar.');
    }
  }

  /**
   * Recupera el historial de una sesión activa (v17.0).
   */
  async getSessionHistory(sessionId: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await api.get(`/movies/session/${sessionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Frontend AIService Error (History):', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al recuperar el historial del Radar.');
    }
  }

  /**
   * El Cofre: Guardar o elminar de la watchlist (v18.0).
   */
  async toggleWatchlist(movie: any): Promise<any> {
    try {
      const response = await api.post('/watchlist', { movie });
      return response.data;
    } catch (error: any) {
      console.error('Frontend Watchlist Error (Toggle):', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al actualizar tu cofre.');
    }
  }

  /**
   * El Cofre: Recuperar todos los tesoros guardados (v18.0).
   */
  async getWatchlist(): Promise<any> {
    try {
      const response = await api.get('/watchlist');
      return response.data;
    } catch (error: any) {
      console.error('Frontend Watchlist Error (Get):', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al recuperar tu cofre.');
    }
  }
}

export const movieService = new MovieService();
export default movieService;
