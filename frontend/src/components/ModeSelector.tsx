import React from 'react';
import { motion } from 'framer-motion';
import { Film, Tv, Infinity as InfinityIcon } from 'lucide-react';

export type SearchMode = 'movie' | 'tv' | 'both';

interface ModeSelectorProps {
  activeMode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

const MODES = [
  { id: 'movie', label: 'Películas', icon: Film },
  { id: 'tv', label: 'Series', icon: Tv },
  { id: 'both', label: 'Híbrido', icon: InfinityIcon },
] as const;

/**
 * v11.0 Segmented Control: Luxury Noir Edition
 * Deslizamiento suave con Framer Motion para selección de intención.
 */
const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onChange }) => {
  return (
    <div className="flex items-center justify-center mb-6">
      <div className="relative flex bg-zinc-950/50 backdrop-blur-md border border-white/5 p-1 rounded-2xl shadow-2xl">
        {MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          const Icon = mode.icon;
          
          return (
            <button
              key={mode.id}
              onClick={() => onChange(mode.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 z-10 ${
                isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={14} className={isActive ? 'text-indigo-400' : 'text-zinc-600'} />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelector;
