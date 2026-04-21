import MovieCard from './MovieCard';
import type { Movie } from '../types/movie';
import { motion, type Variants } from 'framer-motion';

interface MovieGridProps {
  movies: Movie[];
  isLoading: boolean;
  onOpenModal?: (id: number, type: 'movie' | 'tv') => void;
}

const SkeletonCard: React.FC = () => (
  <div className="relative rounded-2xl overflow-hidden aspect-[2/3] bg-zinc-900 border border-white/5 animate-pulse">
    {/* Faux image background */}
    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900/50" />
    
    {/* Faux Rating Badge */}
    <div className="absolute top-3 right-3 w-12 h-6 bg-black/40 rounded-full" />
    
    {/* Faux Text bottom gradient */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
      <div className="w-3/4 h-5 bg-white/10 rounded-md mb-3" />
      <div className="w-1/2 h-3 bg-white/10 rounded-md" />
    </div>
  </div>
);

const MovieGrid: React.FC<MovieGridProps> = ({ movies, isLoading, onOpenModal }) => {
  // v19.1: IMMERSIVE MOBILE GRID (2 Columns, Gap-3)
  const gridClassName = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6";

  if (isLoading) {
    return (
      <div className={gridClassName}>
        {Array.from({ length: 10 }).map((_, index) => (
          <SkeletonCard key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (movies.length === 0) {
    return null; // El Empty State lo manejaremos en el Dashboard
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <motion.div 
      className={gridClassName}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {movies.map((movie, index) => (
        <motion.div
          key={movie.id ? `movie-${movie.id}` : `fallback-movie-${index}`}
          variants={itemVariants}
        >
          <MovieCard movie={movie} onOpenModal={onOpenModal} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default MovieGrid;
