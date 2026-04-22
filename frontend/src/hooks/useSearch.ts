import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { movieService } from '../services/movie.service';
import type { Movie } from '../types/movie';
import type { SearchMode } from '../components/ModeSelector';

/**
 * Hook especializado para la gestión del Radar de Búsqueda Inteligente.
 * v11.0: Soporte Multimodal (Cine & Series)
 */
export const useSearch = (platforms: string[] = [], initialMode: SearchMode = 'both') => {
  const [query, setQuery] = useState('');
  const [activeMode, setActiveMode] = useState<SearchMode>(initialMode);
  const [results, setResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'ai', text: string, timestamp: Date }[]>([]);
  
  // Metadata del Radar 3.1
  const [totalRaw, setTotalRaw] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [interactionType, setInteractionType] = useState<'INITIAL' | 'REFINEMENT' | 'EXPANSION'>('INITIAL');
  const [loadingStatus, setLoadingStatus] = useState('Iniciando Radar...');

  // Referencias de Control y Sesión
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSearchQueryRef = useRef<string>(''); 
  const lastSearchModeRef = useRef<SearchMode>(initialMode);
  
  // v17.1: Persistencia Resiliente con Blindaje try/catch
  const getSafeSessionId = (): string => {
    try {
      return localStorage.getItem('streammatch_session') || '';
    } catch (err: unknown) {
      console.warn('⚠️ Error accediendo al localStorage:', err);
      return '';
    }
  };

  const sessionIdRef = useRef<string>(getSafeSessionId());

  // v22.0: Dynamic loading messages rotation
  useEffect(() => {
    if (!isSearching) return;
    
    const statuses = [
      'Iniciando Radar...',
      'Consultando archivos...',
      'Buscando en plataformas...',
      'Analizando alternativas...',
      'Cocinando recomendaciones...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % statuses.length;
      setLoadingStatus(statuses[i]);
    }, 1800);
    
    return () => clearInterval(interval);
  }, [isSearching]);


  /**
   * Rehidrata el estado desde el backend si hay una sesión activa en localStorage.
   */
  const rehydrateSession = async () => {
    if (!sessionIdRef.current) return;
    
    try {
      setIsSearching(true);
      const sessionData = await movieService.getSessionHistory(sessionIdRef.current);
      
      // Validamos estructura básica para evitar crashes de renderizado
      if (sessionData && sessionData.success && Array.isArray(sessionData.data?.history)) {
        const history = sessionData.data.history.map((h) => ([
          { 
            sender: 'user' as const, 
            text: typeof h.prompt === 'string' ? h.prompt : '', 
            timestamp: h.timestamp ? new Date(h.timestamp) : new Date() 
          },
          { 
            sender: 'ai' as const, 
            text: typeof h.aiResponse === 'string' ? h.aiResponse : '', 
            timestamp: h.timestamp ? new Date(h.timestamp) : new Date() 
          }
        ])).flat();
        
        setChatHistory(history);
        
        // v28.4: Rehidratación de Estado Completo (Zero-Fetch Snapshot)
        // Recuperamos los pósters y la narrativa guardados sin disparar la IA
        if (sessionData.data.lastResults) {
          setResults(sessionData.data.lastResults);
        }
        if (sessionData.data.lastNarrative) {
          setNarrative(sessionData.data.lastNarrative);
        }
        if (sessionData.data.lastMessage) {
          setMessage(sessionData.data.lastMessage);
        }

        console.log('⚡ [RADAR] Rehidratación de memoria fotográfica (0 tokens) completada.');
      } else {
         throw new Error('Estructura de historial inválida o inexistente');
      }
    } catch (err: unknown) {
      console.warn('⚠️ Fallo al rehidratar sesión. Limpiando contexto:', err);
      try {
        localStorage.removeItem('streammatch_session');
      } catch {
        // Ignorar error de limpieza de sesión
      }
      sessionIdRef.current = '';
      setChatHistory([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Ejecuta la búsqueda semántica en el backend.
   */
  const performSearch = async (
    searchQuery: string, 
    ignorePlatforms: boolean = false, 
    mode: SearchMode = activeMode,
    isRehydration: boolean = false
  ) => {
    const trimmedQuery = searchQuery.trim();

    // 1. Validación de longitud mínima
    if (trimmedQuery.length < 3) {
      if (!isRehydration) {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        setResults([]);
        setMessage(null);
        setNarrative(null);
        setTotalRaw(0);
        setIsExpanded(false);
        setIsSearching(false);
        lastSearchQueryRef.current = '';
      }
      return;
    }

    // 2. Blindaje de Redundancia (Query + Mode)
    if (trimmedQuery === lastSearchQueryRef.current && mode === lastSearchModeRef.current && !ignorePlatforms) {
      return;
    }

    // Si no tenemos sessionId y no es rehidratación, generamos uno nuevo y lo guardamos
    if (!sessionIdRef.current) {
        sessionIdRef.current = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('streammatch_session', sessionIdRef.current);
    }

    // Cancelar petición previa
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setError(null);
    setMessage(null);
    setNarrative(null);
    lastSearchQueryRef.current = trimmedQuery;
    lastSearchModeRef.current = mode;

    // Actualizamos el historial visual LOCALMENTE para respuesta inmediata (solo si no es rehidratación)
    if (!isRehydration) {
      setChatHistory(prev => [...prev, { sender: 'user', text: trimmedQuery, timestamp: new Date() }]);
    }

    try {
      const response = await movieService.recommendAI(
        trimmedQuery, 
        platforms, 
        ignorePlatforms, 
        controller.signal,
        mode,
        sessionIdRef.current
      );

      if (controller.signal.aborted) return;

      if (response.success === false) {
        if (response.isAbort) return;
        throw new Error(response.message);
      }
      
      if (response.success) {
        // v35.1: Smart Accumulation Logic (Staff Engineer Surgical Patch)
        const interactionType = response.meta?.interaction_type || 'INITIAL';
        
        if (interactionType === 'REFINEMENT' || interactionType === 'EXPANSION') {
          setResults(prev => {
            const newResults = response.data || [];
            // Deduplicación Estricta: prioritizar tmdbId, fallback a id
            const existingIds = new Set(prev.map(m => m.tmdbId || m.id));
            const uniqueNew = newResults.filter(m => {
              const movieId = m.tmdbId || m.id;
              return !existingIds.has(movieId);
            });
            
            console.log(`📡 [RADAR] Smart Accumulation (${interactionType}): +${uniqueNew.length} títulos.`);
            return [...prev, ...uniqueNew];
          });
        } else {
          // INITIAL Search: Hard Reset
          setResults(response.data || []);
        }

        setMessage(response.message || null);
        setNarrative(response.narrative || null);
        setTotalRaw(response.meta?.totalRaw || 0);
        setIsExpanded(response.meta?.isExpanded || false);
        
        if (response.narrative) {
          setChatHistory(prev => [...prev, { sender: 'ai', text: response.narrative!, timestamp: new Date() }]);
        }

        // v16.3 interaction type handling
        if (response.meta?.interaction_type) {
           setInteractionType(response.meta.interaction_type);
        } else if (response.data && response.data.length > 0) {
           setInteractionType('REFINEMENT');
        }
      }

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.name === 'AbortError' || error.message === 'Request canceled') return; 
        
        const isNetworkError = !error.response || error.message.includes('Network Error') || error.message.includes('Failed to fetch');
        const errorMsg = isNetworkError 
          ? 'Parece que hay un problema de conexión. Por favor, verifica tu red o desactiva bloqueadores de anuncios (pueden interferir con el Radar).'
          : (error.message || 'Error en la conexión con el Radar.');
          
        setError(errorMsg);
      } else {
         const err = error as Error;
         if (err.name === 'AbortError') return;
         setError(err.message || 'Error en la conexión con el Radar.');
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsSearching(false);
      }
    }
  };

  /**
   * Limpia la sesión actual y resetea el Radar.
   */
  const resetRadar = async () => {
    // 1. Instant Clean Up (Frontend-First)
    try {
      localStorage.removeItem('streammatch_session');
    } catch {
      // Ignorar error de limpieza de sesión
    }

    const oldSessionId = sessionIdRef.current;
    sessionIdRef.current = '';
    setResults([]);
    setQuery('');
    setNarrative(null);
    setMessage(null);
    setChatHistory([]);
    setInteractionType('INITIAL');
    setLoadingStatus('Iniciando Radar...');
    lastSearchQueryRef.current = '';
    setError(null);

    // 2. Background Sync (Fire & Forget)
    if (oldSessionId) {
      movieService.clearSession(oldSessionId).catch(err => {
        console.warn('⚠️ [RADAR_CLEANUP] Silent failure in background session deletion:', err);
      });
    }
  };

  // v17.0: Rehidratar al cargar el hook
  useEffect(() => {
    rehydrateSession();
  }, []);


  return {
    query,
    setQuery,
    activeMode,
    setActiveMode,
    results,
    isSearching,
    error,
    message,
    narrative,
    chatHistory, // v17.0
    totalRaw,
    isExpanded,
    interactionType,
    loadingStatus, // v22.0
    hasActiveSession: chatHistory.length > 0,
    isActive: isSearching || results.length > 0 || chatHistory.length > 0,
    handleAISearch: () => performSearch(query, false, activeMode),
    triggerExpandedSearch: () => performSearch(query, true, activeMode),
    resetRadar
  };
};
