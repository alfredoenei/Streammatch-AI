import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Check, Film, History, Loader2, PartyPopper, Save, Search, Settings, Sparkles, Tv, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { movieService } from '../services/movie.service';
import type { Movie } from '../types/movie';
import MovieGrid from '../components/MovieGrid';
import MovieModal from '../components/MovieModal';
import SearchBar from '../components/SearchBar';
import SyncPanel from '../components/SyncPanel';
import Onboarding from '../components/Onboarding'; // v10.0
import ModeSelector from '../components/ModeSelector'; // v11.0
import { useSearch } from '../hooks/useSearch';
import ConversationThread from '../components/ConversationThread';
import MoodShortcuts from '../components/MoodShortcuts';
import WatchlistDrawer from '../components/WatchlistDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { Vibrant } from 'node-vibrant/browser';

const Dashboard: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth(); // v10.0: Added isAuthenticated
  const { updatePlatforms, isUpdating: isUpdatingProfile } = useProfile();
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  
  // v16.4 Premium Visual State (Aura)
  const [accentColors, setAccentColors] = useState({
    vibrant: '#6366f1',
    darkVibrant: '#3730a3',
    muted: '#a855f7'
  });

  // Magic Platforms: Inline Selection State
  const [availablePlatforms, setAvailablePlatforms] = useState<any[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Modo Fiesta State
  const [partyMode, setPartyMode] = useState<{
    isActive: boolean;
    friendName: string | null;
    commonPlatforms: string[];
  }>(() => {
    const saved = sessionStorage.getItem('streammatch_party');
    return saved ? JSON.parse(saved) : { isActive: false, friendName: null, commonPlatforms: [] };
  });

  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const activePlatforms = partyMode.isActive ? partyMode.commonPlatforms : undefined;

  // Logic for search platforms: Party Mode takes precedence, otherwise use local selection
  // Memoized to prevent useSearch hook from re-triggering unnecessarily
  const searchPlatforms = useMemo(() => {
    return partyMode.isActive ? partyMode.commonPlatforms : selectedPlatforms;
  }, [partyMode.isActive, partyMode.commonPlatforms, selectedPlatforms]);

  // Search Logic
  const { 
    query, 
    setQuery, 
    activeMode,
    setActiveMode,
    results: searchResults, 
    isSearching, 
    error: searchError, 
    message: searchMessage,
    narrative: searchNarrative, // v16.1
    totalRaw,
    isExpanded,
    interactionType, // v16.4
    loadingStatus, // v22.0
    hasActiveSession,
    chatHistory, // v17.0
    isActive: isSearchActive,
    handleAISearch,
    triggerExpandedSearch,
    resetRadar // v16.4
  } = useSearch(searchPlatforms);

  // v16.4: Extracción de colores para el Aura Dinámica
  useEffect(() => {
    const topMovie = isSearchActive ? searchResults?.[0] : recommendations?.[0];
    const posterUrl = topMovie?.posterUrl || (topMovie?.poster_path ? `https://image.tmdb.org/t/p/w500${topMovie.poster_path}` : undefined);
    
    if (!posterUrl) return;

    const extract = async () => {
      try {
        const palette = await Vibrant.from(posterUrl).getPalette();
        setAccentColors({
          vibrant: palette.Vibrant?.hex || '#6366f1',
          darkVibrant: palette.DarkVibrant?.hex || '#3730a3',
          muted: palette.Muted?.hex || '#a855f7',
        });
      } catch (err) {
        // Ignorar errores de CORS o posters vacíos
      }
    };
    extract();
  }, [searchResults, recommendations, isSearchActive]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<{ id: number; type: 'movie' | 'tv' } | null>(null);
  const [isSynced, setIsSynced] = useState(false); // v10.0: Success feedback state

  // Sync Initial Selection
  useEffect(() => {
    const initPlatforms = async () => {
      try {
        const response = await movieService.getAvailablePlatforms();
        setAvailablePlatforms(response.data);
        if (user?.streamingPlatforms) {
          setSelectedPlatforms(user.streamingPlatforms);
        }
      } catch (err) {
        console.error("Platforms Error:", err);
      }
    };
    initPlatforms();
  }, [user?.id]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await movieService.getRecommendations(activePlatforms);
        setRecommendations(data.data || []);
      } catch (err: any) {
        setError(err.message || 'Error al cargar recomendaciones.');
      } finally {
        setIsLoading(false);
      }
    };
    if (isAuthenticated) fetchRecommendations();
  }, [partyMode.isActive, partyMode.commonPlatforms, user?.streamingPlatforms, isAuthenticated]);

  const handleTogglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSavePlatforms = async () => {
    try {
      await updatePlatforms(selectedPlatforms);
      setIsSynced(true);
      
      // Feedback de Éxito: Volvemos al estado normal tras 2.5s
      setTimeout(() => setIsSynced(false), 2500);

      // UX: Scroll suave hacia el Radar tras sincronizar (v10.0)
      const searchSection = document.getElementById('radar-search-anchor');
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (err) {
      console.error("Save Error:", err);
    }
  };

  const handleStartParty = (friendName: string, commonPlatforms: string[]) => {
    const newState = { isActive: true, friendName, commonPlatforms };
    setPartyMode(newState);
    sessionStorage.setItem('streammatch_party', JSON.stringify(newState));
    setShowSyncPanel(false);
  };

  const handleEndParty = () => {
    const newState = { isActive: false, friendName: null, commonPlatforms: [] };
    setPartyMode(newState);
    sessionStorage.removeItem('streammatch_party');
    // Si reseteamos el radar al terminar fiesta? Tal vez no necesariamente
  };

  const displayedMovies = isSearchActive ? searchResults : recommendations;
  // Solo mostramos Loading Global (skeletons) si no tenemos nada que mostrar (pantalla vacía)
  const isGlobalLoading = (isLoading && recommendations.length === 0) || (isSearching && searchResults.length === 0 && isSearchActive);
  const activeError = error || searchError;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30 font-sans transition-colors duration-1000">
      
      {/* v16.4 Global Dynamic Aura */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at 50% -20%, ${accentColors?.vibrant || '#6366f1'}, transparent 70%)`
        }} 
      />

      {/* v10.0 Onboarding Barrier */}
      <AnimatePresence>
        {isAuthenticated && !user?.hasCompletedOnboarding && (
          <motion.div
            key="onboarding-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100]"
          >
            <Onboarding />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Navbar de Lujo: Evolución "Aura" v21.0 Symmetry Premium */}
      <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 px-6 lg:px-12 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="grid grid-cols-3 items-center max-w-screen-2xl mx-auto">
          
          {/* Col 1: Left-aligned (Modo Fiesta) */}
          <div className="flex justify-start">
            <button
              onClick={() => setShowSyncPanel(true)}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${
                partyMode.isActive 
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]' 
                  : 'bg-zinc-900/50 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Users size={14} className={partyMode.isActive ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">{partyMode.isActive ? 'Fiesta Activa' : 'Modo Fiesta'}</span>
            </button>
          </div>

          {/* Col 2: Center-aligned (Branding) */}
          <div className="flex justify-center">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Film size={18} />
              </div>
              <span className="text-xl font-black tracking-tighter text-white">
                StreamMatch <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">AI</span>
              </span>
            </div>
          </div>

          {/* Col 3: Right-aligned (User Tools) */}
          <div className="flex items-center justify-end gap-4 lg:gap-6">
            
            {/* Subtle Reset (Only if active) */}
            <AnimatePresence>
              {hasActiveSession && (
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    resetRadar();
                  }}
                  className="hidden xl:flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors mr-2"
                >
                  <X size={12} className="opacity-50" />
                  Reset
                </motion.button>
              )}
            </AnimatePresence>

            {/* tool: Historial (Iconic) */}
            <Link 
              to="/history" 
              className="relative p-2.5 bg-zinc-900 border border-white/10 rounded-full hover:border-emerald-400 group transition-all shadow-xl"
            >
              <History size={16} className="text-zinc-400 group-hover:text-emerald-400 group-hover:rotate-[-20deg] transition-all" />
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 rounded-full pointer-events-none" />
            </Link>

            {/* tool: El Cofre (Iconic) */}
            <button
               onClick={() => setIsWatchlistOpen(true)}
               className="relative p-2.5 bg-zinc-900 border border-white/10 rounded-full hover:border-indigo-400 group transition-all shadow-xl"
            >
               <Film size={16} className="text-zinc-400 group-hover:text-indigo-400" />
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                  <span className="text-[7px] font-black text-white">!</span>
               </div>
            </button>

            {/* Profile Avatar */}
            <div className="group relative flex items-center gap-4 cursor-pointer" onClick={logout}>
              <div className="hidden sm:flex flex-col items-end opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                <p className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">
                  {user?.name?.split(' ')[0] || 'User'}
                </p>
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
                  Diamond
                </p>
              </div>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity" />
                <img 
                  src={`https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff&bold=true`}
                  alt="Avatar"
                  className="relative w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-white/40 transition-all"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950" />
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* Main Content: Luxury Showroom (Unified Scroll pb-52) */}
      <main className="relative max-w-screen-2xl mx-auto px-6 lg:px-12 py-12 space-y-12 pb-52">
        
        {/* --- PARTY BANNER --- */}
        <AnimatePresence>
          {partyMode.isActive && (
            <motion.div
              key="party-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative p-[1px] overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600"
            >
              <div className="bg-zinc-950/80 backdrop-blur-xl p-5 rounded-[calc(1.5rem-1px)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <PartyPopper size={20} className="text-purple-400 animate-bounce" />
                  <p className="text-zinc-300 text-xs font-bold uppercase tracking-widest">
                    Modo Fiesta Activo: <span className="text-white">{partyMode.friendName}</span>
                  </p>
                </div>
                <button
                  onClick={handleEndParty}
                  className="text-[9px] font-black uppercase tracking-widest text-purple-400 hover:text-white transition-colors"
                >
                  Finalizar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* --- CENTRAL RADAR HERO: Pivot Layout v17.0 --- */}
        <section className="flex flex-col items-center gap-8 py-4 relative">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
             <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-none">
              Radar <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500" style={{ backgroundImage: `linear-gradient(to right, ${accentColors.vibrant}, ${accentColors.muted})` }}>Inteligente</span>
            </h2>
          </motion.div>

          <div id="radar-search-anchor" className="w-full flex flex-col items-center">
            
            {/* 1. Modo Selector */}
            <div className="z-20 mb-8">
               <ModeSelector activeMode={activeMode} onChange={setActiveMode} />
            </div>

            {/* 2. Conversation Thread (Historial) */}
            <AnimatePresence mode="popLayout">
                {hasActiveSession && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full"
                    >
                        <ConversationThread 
                          messages={chatHistory} 
                          isTyping={isSearching}
                          loadingStatus={loadingStatus}
                          accentColors={accentColors}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Mood Shortcuts (Solo si no hay conversación activa - Staff Engineer v17.3) */}
            {!isSearchActive && !hasActiveSession && (
               <MoodShortcuts 
                 onSelect={(prompt) => setQuery(prompt)} 
                 isLoading={isSearching} 
               />
            )}
          </div>

          {/* --- SLIM PLATFORM SELECTOR --- */}
          {!hasActiveSession && (
             <div className="w-full max-w-4xl flex flex-col items-center gap-8 py-2">
                <div className="flex flex-wrap justify-center gap-3">
                {availablePlatforms.map((platform, index) => {
                    const isSelected = selectedPlatforms.includes(platform.id);
                    return (
                    <button
                        key={platform.id ? `platform-${platform.id}` : `fallback-platform-${index}`}
                        onClick={() => handleTogglePlatform(platform.id)}
                        className={`relative px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-500 border ${
                        isSelected 
                            ? 'shadow-2xl border-white/20' 
                            : 'bg-zinc-900/40 border-white/5 opacity-40 hover:opacity-100 hover:bg-zinc-800'
                        }`}
                        style={{
                        backgroundColor: isSelected ? platform.color : undefined,
                        boxShadow: isSelected ? `0 10px 30px -10px ${platform.color}80` : undefined
                        }}
                    >
                        <div className="w-4 h-4 flex items-center justify-center overflow-hidden rounded-sm bg-white/10">
                        <img src={platform.logo} alt={platform.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">
                        {platform.name}
                        </span>
                    </button>
                    );
                })}
                </div>
                <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSavePlatforms}
                disabled={isUpdatingProfile}
                className={`group px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.3em] text-white transition-all disabled:opacity-50 ${
                    isSynced ? 'bg-emerald-600' : 'bg-zinc-900 border border-white/10 hover:border-white/20'
                }`}
                >
                {isSynced ? 'Sincronizado' : 'Guardar Preferencias'}
                </motion.button>
            </div>
          )}
        </section>

        {/* --- RESULTADOS (Live Grid) --- */}
        <section className="space-y-12">
          {isSearchActive && searchMessage && !isGlobalLoading && (
            <div 
              className="p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-1000 border mx-auto max-w-4xl"
              style={{ 
                backgroundColor: `${accentColors.vibrant}15`,
                borderColor: `${accentColors.vibrant}30`
              }}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 transition-colors duration-1000" style={{ color: accentColors.vibrant }} />
                <p className="font-medium" style={{ color: accentColors.vibrant }}>{searchMessage}</p>
              </div>
              
              {!isExpanded && searchResults.length === 0 && totalRaw > 0 && (
                <button
                  onClick={triggerExpandedSearch}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap"
                >
                  ¿Dónde puedo verla?
                </button>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!isGlobalLoading && displayedMovies.length === 0 ? (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-white/10 rounded-3xl bg-zinc-900/20 backdrop-blur-sm"
              >
                <div className="w-24 h-24 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 shadow-2xl border border-white/5">
                  <Tv className="w-12 h-12 text-zinc-500" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4">
                  {isSearchActive ? 'Sin resultados en tu Radar' : 'Tu pantalla está apagada'}
                </h3>
                <p className="text-zinc-400 max-w-md mb-8 text-lg">
                  {isSearchActive 
                    ? `No hemos encontrado "${query}" disponible en tus plataformas contratadas. ¡Prueba con otro título!`
                    : 'Añade tus servicios de streaming para encender las recomendaciones personalizadas.'
                  }
                </p>
                {!isSearchActive && (
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-full font-bold tracking-wide transition-all shadow-lg"
                  >
                    <Settings size={20} />
                    Configurar Plataformas
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={isSearchActive ? 'search-results' : 'recommendations'}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 }
                  }
                }}
              >
                <MovieGrid 
                  movies={displayedMovies} 
                  isLoading={isGlobalLoading} 
                  onOpenModal={(id: number, type: 'movie' | 'tv') => setSelectedMovie({ id, type })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Cinema Modal */}
      <MovieModal 
        movieData={selectedMovie} 
        onClose={() => setSelectedMovie(null)} 
      />

      {/* Sync Panel Overlay */}
      <AnimatePresence>
        {showSyncPanel && (
          <div key="sync-panel-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-md">
            <SyncPanel 
              onSync={handleStartParty}
              onClose={() => setShowSyncPanel(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* --- MINIMALIST BOTTOM DOCK (Staff Engineer v17.3) --- */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-zinc-950/80 backdrop-blur-xl z-[60] border-t border-white/10 flex justify-center">
          <div className="w-full max-w-4xl px-4">
              <SearchBar 
                  value={query} 
                  onChange={setQuery} 
                  isLoading={isSearching} 
                  onAISearch={handleAISearch}
                  hasActiveSession={hasActiveSession}
                  onReset={resetRadar}
              />
          </div>
      </div>

      {/* El Cofre: Side Drawer integration (v18.2) */}
      <WatchlistDrawer 
        isOpen={isWatchlistOpen} 
        onClose={() => setIsWatchlistOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;
