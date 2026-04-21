import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, EyeOff, Sparkles, History as HistoryIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { movieService } from '../services/movie.service';
import type { Movie } from '../types/movie';
import MovieGrid from '../components/MovieGrid';
import MovieModal from '../components/MovieModal';

const History: React.FC = () => {
  const { user } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<{ id: number; type: 'movie' | 'tv' } | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await movieService.getWatchedHistory();
      setMovies(data.data || []);
    } catch (err: unknown) {
      console.error("History page error:", err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'No se pudo cargar tu historial de visionado.');
      } else {
        setError('No se pudo cargar tu historial de visionado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // UX Pro: Reactive Removal (The "Magic Touch")
  // Sincronizamos la lista local de películas con los IDs en el AuthContext.
  // Si una peli ya no está en user.watchedMovies, la filtramos de la vista actual.
  // Esto permite que el botón de "ojo" sirva para desmarcar y quitar de la lista al instante.
  useEffect(() => {
    if (user?.watchedMovies) {
      setMovies((prevMovies) => 
        prevMovies.filter(movie => user.watchedMovies.some((w) => w.id === movie.id && w.media_type === movie.media_type))
      );
    }
  }, [user?.watchedMovies]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30 pb-24">
      
      {/* Navbar con Backdrop Blur */}
      <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-6 lg:px-12 py-4">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          {/* Back to Dashboard */}
          <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold tracking-tight">Volver a la Sala</span>
          </Link>

          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <HistoryIcon size={20} />
            </div>
            <span className="text-xl font-black tracking-tighter text-white hidden sm:block">
              StreamMatch <span className="text-indigo-500">AI</span>
            </span>
          </div>

          <div className="w-10 md:w-32" /> {/* Spacer for balance */}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-12">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white mb-2">Sala de Recuerdos</h1>
            <p className="text-zinc-500 font-medium">Películas que ya has disfrutado</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400 text-sm font-bold uppercase tracking-widest">
            <Sparkles size={16} />
            <span>{movies.length} Vistas</span>
          </div>
        </header>

        {error && (
          <div className="p-6 mb-8 bg-red-500/5 border border-red-500/20 rounded-2xl text-center">
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Empty State vs Movie Grid */}
        {!isLoading && movies.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center p-20 text-center border border-dashed border-white/10 rounded-[3rem] bg-zinc-900/20 animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-8 shadow-2xl border border-white/5">
              <EyeOff size={40} className="text-zinc-700" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 italic tracking-tighter">Tu historial está vacío</h2>
            <p className="text-zinc-500 max-w-sm mb-10 text-lg leading-relaxed font-medium">
              Parece que aún no has marcado ninguna película como vista. ¡Usa el icono del ojo en la cartelera!
            </p>
            <Link 
              to="/" 
              className="px-10 py-4 bg-white text-zinc-950 rounded-2xl font-black tracking-[0.1em] hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95"
            >
              IR A LA CARTELERA
            </Link>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <MovieGrid 
              movies={movies} 
              isLoading={isLoading} 
              onOpenModal={(id: number, type: 'movie' | 'tv') => setSelectedMovie({ id, type })} 
            />
          </div>
        )}
      </main>

      {/* Cinema Modal */}
      <MovieModal 
        movieData={selectedMovie} 
        onClose={() => setSelectedMovie(null)} 
      />

    </div>
  );
};

export default History;
