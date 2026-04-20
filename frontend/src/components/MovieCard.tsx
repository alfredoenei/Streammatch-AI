import React, { useState, useEffect } from 'react';
import { Star, Eye, Play, Bookmark, Globe, Loader2, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import type { Movie } from '../types/movie';
import { motion, AnimatePresence } from 'framer-motion';

interface MovieCardProps {
  movie: Movie;
  onOpenModal?: (id: number, type: 'movie' | 'tv') => void;
}

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const MovieCard: React.FC<MovieCardProps> = ({ movie, onOpenModal }) => {
  const { user } = useAuth();
  const { toggleWatched, toggleWatchlist, isInWatchlist } = useProfile();
  
  // Optimistic UI state
  const movieIdNum = Number(movie.id);
  const mType = movie.media_type;

  const isSaved = isInWatchlist(movieIdNum);

  const [isWatched, setIsWatched] = useState(
    user?.watchedMovies.some((w: any) => w.id === movieIdNum && w.media_type === mType) || false
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false); 

  // --- v19.1: DYNAMIC RESOLUTION ---
  const [imgSize, setImgSize] = useState('w500');
  
  useEffect(() => {
    const handleResize = () => {
      setImgSize(window.innerWidth < 768 ? 'w342' : 'w500');
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const TMDB_DYNAMIC_URL = `https://image.tmdb.org/t/p/${imgSize}`;

  // --- v18.3: STRICT URL RESOLUTION ---
  const sources = movie.availability?.sources || [];
  const premiumUrl = (movie.premiumMetadata as any)?.url;

  const getValidUrl = (): string | null => {
    if (premiumUrl && typeof premiumUrl === 'string' && premiumUrl.startsWith('http')) return premiumUrl;
    for (const source of sources) {
       if (source.url && typeof source.url === 'string' && source.url.startsWith('http')) return source.url;
    }
    return null;
  };

  const validUrl = getValidUrl();
  const hasValidLink = !!validUrl;
  const platformName = (sources[0]?.name || sources[0]?.platform || movie.premiumMetadata?.platformName || '').toLowerCase();

  useEffect(() => {
    if (!hasValidLink && movie.isAvailable !== false) {
      console.warn(`⚠️ [ORPHAN_TITLE]: "${movie.title || movie.name}" no tiene links válidos. Activando Smart Fallback.`);
    }
  }, [hasValidLink, movie.title, movie.name]);

  useEffect(() => {
    const freshId = Number(movie.id);
    setIsWatched(user?.watchedMovies.some((w: any) => w.id === freshId && w.media_type === mType) || false);
  }, [user?.watchedMovies, movie.id, mType]);



  const handleToggleWatched = async (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (isUpdating) return;
    setIsUpdating(true);
    try { await toggleWatched(movieIdNum, mType); setIsWatched(!isWatched); } 
    catch (error) { console.error('Error toggling watched:', error); } 
    finally { setIsUpdating(false); }
  };

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    toggleWatchlist(movie);
  };

  const handleWatchNow = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();
    
    const targetUrl = validUrl || '';
    
    // v19.2: EMERGENCY URL SAFETY CATCH
    if (!hasValidLink || !targetUrl.startsWith('http')) {
      const gQuery = encodeURIComponent(`ver ${movie.title || movie.name} ${releaseYear} online españa streaming`);
      const fallbackUrl = `https://www.google.com/search?q=${gQuery}`;
      console.log(`🔍 [FALLBACK]: ${fallbackUrl}`);
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // Deshabilitamos deep linking experimental (nflx://) para evitar about:blank en navegadores sin el handler
    console.log(`🚀 [OPENING]: ${targetUrl}`);
    
    const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    
    if (!win || win.closed || typeof win.closed === 'undefined') {
       // Si el popup es bloqueado o falla, intentamos fallback a Google
       console.warn('⚠️ [POPUP_BLOCKED]: Fallback a Google Search.');
       const gQuery = encodeURIComponent(`ver ${movie.title || movie.name} ${releaseYear} online españa streaming`);
       window.open(`https://www.google.com/search?q=${gQuery}`, '_blank', 'noopener,noreferrer');
    }
  };

  const imageUrl = movie.posterUrl || (movie.poster_path ? `${TMDB_DYNAMIC_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750/18181b/ffffff?text=Poster+No+Disponible');
  const releaseYear = movie.year || (movie.release_date || movie.first_air_date || '').substring(0, 4) || 'N/A';
  const rating = (movie.voteAverage ?? movie.vote_average)?.toFixed(1) || 'NR';

  return (
    <div 
      onClick={() => onOpenModal?.(movieIdNum, mType)}
      className="relative rounded-2xl overflow-hidden aspect-[2/3] group cursor-pointer bg-zinc-900 shadow-xl transition-all duration-500 hover:scale-[1.02] border border-white/5"
      style={{
        boxShadow: movie.premiumMetadata?.brandColor ? `0 10px 40px ${movie.premiumMetadata.brandColor}15` : undefined,
        borderColor: isSaved ? `${movie.premiumMetadata?.brandColor || '#6366f1'}40` : undefined
      }}
    >
      
      {/* 
         v19.1: CLS PREVENTION 
         Envolvemos la imagen en un contenedor con aspect-ratio fijo y esqueleto.
      */}
      <div className="absolute inset-0 bg-zinc-800 animate-pulse overflow-hidden">
        {!imageError ? (
          <img 
            src={imageUrl} 
            alt={movie.title || movie.name} 
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${!imageLoaded ? 'opacity-0' : 'opacity-100'} ${movie.isAvailable === false ? 'grayscale opacity-70' : ''}`}
            onLoad={() => {
                setImageLoaded(true);
                // Detenemos el pulso si aplicamos la clase directamente al div:
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-4 bg-zinc-900 border border-white/5">
            <div className="p-4 rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-500">
               <Film size={24} />
            </div>
            <div className="space-y-1 px-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Título Recomendado</p>
               <h4 className="text-sm font-black text-white uppercase leading-tight line-clamp-3">
                 {movie.title || movie.name}
               </h4>
            </div>
          </div>
        )}
      </div>

      {/* --- VOID / BOOKMARK (Top-Right) --- */}
      <div className="absolute top-3 right-3 z-40 flex flex-col gap-2">
         <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleToggleWatchlist}
            className={`p-2.5 rounded-xl border backdrop-blur-xl transition-all ${
              isSaved 
                ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                : 'bg-black/40 border-white/10 hover:bg-black/60'
            }`}
         >
            <Bookmark size={18} className={isSaved ? 'fill-white text-white' : 'text-white/70'} />
         </motion.button>
         
         {/* Platform Logo */}
         {movie.isAvailable !== false && movie.premiumMetadata && (
            <div className="p-1.5 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 shadow-lg flex items-center justify-center">
              <img src={movie.premiumMetadata.logo} alt={platformName} className="w-5 h-5 object-contain" />
            </div>
         )}
      </div>

      {/* Top Badges (Left Side) */}
      <div className="absolute top-3 left-3 z-30 flex flex-col gap-2 pointer-events-none">
        <div className={`px-2 py-1 backdrop-blur-md rounded-lg border text-[8px] font-black uppercase tracking-widest text-white ${movie.media_type === 'tv' ? 'bg-purple-600/60 border-purple-400/30' : 'bg-indigo-600/60 border-indigo-400/30'}`}>
          {movie.media_type === 'tv' ? 'Serie' : 'Cine'}
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-black text-white">
          <Star className="w-3 h-3 text-indigo-400 fill-indigo-400" />
          {rating}
        </div>
      </div>

      {/* --- SMART VER AHORA --- */}
      <div className="absolute bottom-4 left-4 right-4 z-40 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
         <button 
           onClick={handleWatchNow}
           className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl ${
             hasValidLink 
              ? 'bg-white text-zinc-950 hover:bg-indigo-400 hover:text-white' 
              : 'bg-zinc-900/80 text-zinc-500 border border-white/5'
           }`}
         >
           {hasValidLink ? (
              <>
                <Play size={14} className="fill-current" />
                Ver Ahora
              </>
           ) : (
              <>
                <Globe size={14} />
                Buscar en Red
              </>
           )}
         </button>
      </div>

      {/* Side Secondary Actions (Mini) */}
      <div className="absolute bottom-20 right-3 z-30 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={handleToggleWatched} className={`p-2 backdrop-blur-md rounded-full border border-white/10 transition-all ${isWatched ? 'bg-purple-600/40 border-purple-400/30' : 'bg-black/40'}`}>
          <Eye size={14} className={isWatched ? 'text-purple-400' : 'text-white/50'} />
        </button>
      </div>

      {/* Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4 transition-all duration-300 z-10">
        <h3 className="line-clamp-1 text-sm font-bold text-white tracking-tight">{movie.title || movie.name}</h3>
        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{releaseYear}</p>
      </div>
    </div>
  );
};

export default MovieCard;
