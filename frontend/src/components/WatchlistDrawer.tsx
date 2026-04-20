import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ExternalLink, Film, Tv, Play } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({ isOpen, onClose }) => {
  const { watchlist, toggleWatchlist, isLoadingWatchlist } = useProfile();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full md:max-w-md bg-zinc-950 border-l border-white/10 z-[110] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-500/20">
                  <Film size={22} className="text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">El Cofre</h2>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">Tus tesoros guardados</p>
                </div>
              </div>
              
              {/* v19.1: Improved Touch Target for mobile Close Button */}
              <button 
                onClick={onClose}
                className="p-4 -mr-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white"
                aria-label="Cerrar Cofre"
              >
                <X size={24} />
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {isLoadingWatchlist ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Abriendo el cofre...</p>
                </div>
              ) : watchlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                    <Film size={32} className="text-zinc-700" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Tu cofre está vacío</h3>
                  <p className="text-zinc-500 text-xs">Usa el icono del marcador en las películas para guardarlas aquí.</p>
                </div>
              ) : (
                watchlist.map((movie) => {
                    const releaseYear = movie.year || (movie.release_date || movie.first_air_date || '').substring(0, 4) || 'N/A';
                    return (
                        <motion.div 
                            layout
                            key={`watchlist-${movie.id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative flex gap-4 p-3 bg-zinc-900/40 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all"
                        >
                            {/* Poster Small */}
                            <div className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 shadow-lg">
                                <img 
                                    src={movie.posterUrl || `https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                                    alt={movie.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>

                            {/* Info */}
                            <div className="flex flex-col justify-between py-1 flex-1">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[7px] font-black uppercase text-zinc-400">
                                            {movie.media_type === 'tv' ? 'Serie' : 'Cine'}
                                        </span>
                                        <span className="text-[9px] font-bold text-zinc-500">{releaseYear}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">
                                        {movie.title || movie.name}
                                    </h4>
                                </div>

                                <div className="flex items-center gap-2 mt-4">
                                    <button 
                                        onClick={() => {
                                            const sources = movie.availability?.sources || [];
                                            const url = sources[0]?.url || (movie.premiumMetadata as any)?.url;
                                            if (url) window.open(url, '_blank');
                                        }}
                                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        <Play size={14} className="text-white fill-white" />
                                        <span className="text-[9px] font-black uppercase text-white tracking-widest">Ver</span>
                                    </button>
                                    <button 
                                        onClick={() => toggleWatchlist(movie)}
                                        className="p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })
              )}
            </div>

            {/* Footer Footer */}
            <div className="p-6 bg-zinc-900/80 border-t border-white/5">
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest text-center">
                    StreamMatch AI v18.2 • Gestión de Tesoros
                </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WatchlistDrawer;
