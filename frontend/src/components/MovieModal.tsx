import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Star, Calendar, Clock, Loader2, Layers } from 'lucide-react';
import { movieService } from '../services/movie.service';
import type { DetailedMovie } from '../types/movie';


interface MovieModalProps {
  movieData: { id: number; type: 'movie' | 'tv' } | null;
  onClose: () => void;
}

const TMDB_BACKDROP_URL = 'https://image.tmdb.org/t/p/original';
const TMDB_POSTER_URL = 'https://image.tmdb.org/t/p/w500';

const MovieModal: React.FC<MovieModalProps> = ({ movieData, onClose }) => {
  const [movie, setMovie] = useState<DetailedMovie | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);


  // Cargar detalles
  useEffect(() => {
    if (movieData) {
      setIsLoading(true);
      movieService.getMovieDetails(movieData.id, movieData.type)
        .then(res => {
          setMovie(res.data as DetailedMovie);
        })
        .catch(err => console.error("Error loading movie details:", err))
        .finally(() => setIsLoading(false));
    } else {
      setMovie(null);
      setShowTrailer(false);
    }
  }, [movieData]);

  // Manejo de scroll lock
  useEffect(() => {
    if (movieData) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [movieData]);

  // Manejo de ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);



  const trailer = movie?.videos?.results.find(
    (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );

  const title = movie?.local_title || movie?.title || movie?.name || movie?.original_title || 'Cargando...';
  const releaseDate = movie?.release_date || movie?.first_air_date || '';
  const runtime = movie?.runtime || (movie?.episode_run_time?.[0]);

  return (
    <AnimatePresence>
      {movieData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-2xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl max-h-[90vh] bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col md:flex-row"
          >
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              </div>
            ) : movie ? (
              <>
                <div className="relative w-full md:w-3/5 h-[300px] md:h-auto overflow-hidden bg-zinc-950">
                  {showTrailer && trailer ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                      title="YouTube trailer"
                      className="w-full h-full border-none"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      <img 
                        src={movie.backdropUrl || movie.posterUrl || (movie.backdrop_path ? `${TMDB_BACKDROP_URL}${movie.backdrop_path}` : `${TMDB_POSTER_URL}${movie.poster_path}`)} 
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-1000"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-zinc-900" />
                      
                      {trailer && (
                        <button 
                          onClick={() => setShowTrailer(true)}
                          className="absolute inset-0 flex items-center justify-center group"
                        >
                          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 transition-all duration-500">
                            <Play className="w-8 h-8 text-white fill-white" />
                          </div>
                        </button>
                      )}
                    </>
                  )}
                  
                  <button 
                    onClick={onClose}
                    className="absolute top-6 left-6 md:hidden p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 text-white z-50"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar relative">
                  <button 
                    onClick={onClose}
                    className="hidden md:flex absolute top-8 right-8 p-3 bg-zinc-800/50 hover:bg-zinc-800 backdrop-blur-xl rounded-2xl border border-white/5 text-zinc-400 hover:text-white transition-all z-50"
                  >
                    <X size={20} />
                  </button>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${movie.media_type === 'tv' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'}`}>
                           {movie.media_type === 'tv' ? 'Serie' : 'Cine'}
                         </span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight">
                        {title}
                      </h2>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm font-bold tracking-widest uppercase text-zinc-500">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                          <Star className="w-4 h-4 fill-indigo-400" />
                          <span>{movie.vote_average?.toFixed(1) || '0.0'}</span>
                        </div>
                        {releaseDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={16} />
                            <span>{releaseDate.split('-')[0]}</span>
                          </div>
                        )}
                        {runtime && (
                          <div className="flex items-center gap-1.5">
                            <Clock size={16} />
                            <span>{runtime}m</span>
                          </div>
                        )}
                        {movie.number_of_seasons && (
                           <div className="flex items-center gap-1.5">
                             <Layers size={16} />
                             <span>{movie.number_of_seasons} Temporadas</span>
                           </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">Sinopsis</h4>
                      <p className="text-zinc-400 leading-relaxed text-lg font-medium italic">
                        {movie.overview || "No hay sinopsis disponible."}
                      </p>
                    </div>

                    {movie.genres && (
                      <div className="flex flex-wrap gap-2">
                        {movie.genres.map((g: any, index: number) => (
                          <span key={g.id ? `genre-${g.id}` : `fallback-genre-${index}`} className="px-4 py-2 bg-zinc-800/50 border border-white/5 rounded-xl text-xs font-bold text-zinc-300">
                            {g.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-6 flex items-center gap-4">
                      {trailer && !showTrailer && (
                        <button 
                          onClick={() => setShowTrailer(true)}
                          className="flex-1 flex items-center justify-center gap-3 py-5 bg-white text-zinc-950 rounded-[1.5rem] font-black tracking-widest text-sm hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95"
                        >
                          <Play size={18} fill="currentColor" />
                          VER TRÁILER
                        </button>
                      )}

                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center py-20 text-zinc-500 italic">
                Error al cargar los datos.
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MovieModal;
