import React, { useState, useEffect } from 'react';
import { Loader2, X, Sparkles, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  onAISearch?: () => void;
  hasActiveSession?: boolean; // v16.4
  onReset?: () => void;        // v16.4
}

const SUGGESTIONS = [
  'Pelis de los 80',
  'Algo de Disney para hoy',
  'Anime de acción',
  'Lo mejor de Pixar',
  'Cine de terror moderno'
];

const SESSION_SUGGESTIONS = [
  'Quita las que ya vi',
  'Más como la primera',
  'Algo un poco más actual',
  'Que sean de acción',
  'Ponme una de comedia'
];

/**
 * Radar 2.0 SearchBar: Luxury Edition
 * v16.4: Conversational State Aware
 */
const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  isLoading, 
  onAISearch,
  hasActiveSession,
  onReset
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  const activeSuggestions = hasActiveSession ? SESSION_SUGGESTIONS : SUGGESTIONS;

  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex((prev) => (prev + 1) % activeSuggestions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSuggestions.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAISearch && !isLoading && value.trim().length >= 3) {
      onAISearch();
    }
  };

  return (
    <div className={`relative w-full transition-all duration-700 mx-auto group`}>
      {/* Botón de Limpiar Radar movido al Dashboard Header en v17.3 */}

      {/* --- EL AURA: Gradiente Animado Pink/Green/Blue --- */}
      <motion.div
        initial={false}
        animate={{
          opacity: isFocused || value || hasActiveSession ? 1 : 0.4,
          scale: isFocused ? 1.01 : 1,
          backgroundImage: hasActiveSession 
            ? 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)' 
            : 'linear-gradient(to right, #ec4899, #6366f1, #10b981)'
        }}
        className={`absolute -inset-[1px] ${hasActiveSession ? 'rounded-[2rem]' : 'rounded-[1.8rem]'} blur-[2px] opacity-40 transition-all duration-700`}
      />

      <form 
        onSubmit={handleSubmit}
        className={`relative flex items-center bg-zinc-950 border transition-all duration-700 ${hasActiveSession ? 'rounded-[1.9rem] p-1' : 'rounded-[1.7rem]'} overflow-hidden ${
          isFocused || hasActiveSession
            ? 'border-transparent shadow-[0_0_40px_rgba(99,102,241,0.15)]' 
            : 'border-white/10'
        }`}
      >
        
        {/* Magic Icon / Loader */}
        <div className="pl-6 text-zinc-500">
          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-indigo-400" />
          ) : (
            <Wand2 size={18} className={`${hasActiveSession ? 'text-indigo-400' : 'text-zinc-400'} group-hover:text-indigo-400 transition-colors`} />
          )}
        </div>

        {/* Input & Placeholder Container */}
        <div className="relative w-full flex items-center">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
            className="w-full bg-transparent border-none outline-none focus:outline-none py-4 px-4 text-white font-medium text-base z-10 placeholder:text-transparent disabled:opacity-50"
          />
          
          {/* Animated Placeholder */}
          <AnimatePresence mode="wait">
            {!value && (
              <motion.span
                key={isLoading ? 'loading' : (isFocused ? 'focused' : `${hasActiveSession}-${suggestionIndex}`)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`absolute left-4 font-bold text-[10px] uppercase tracking-[0.2em] pointer-events-none ${
                    isLoading ? 'text-indigo-400 animate-pulse' : (hasActiveSession ? 'text-indigo-300/40' : 'text-zinc-600')
                }`}
              >
                {isLoading 
                   ? 'EL SOMMELIER ESTÁ PENSANDO...' 
                   : (isFocused 
                       ? (hasActiveSession ? 'ESCRIBE TU PETICIÓN AL SOMMELIER...' : 'DESCUBRE TUS PRÓXIMAS PELÍCULAS...') 
                       : activeSuggestions[suggestionIndex]
                     )
                }
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pr-4">
          <AnimatePresence>
            {value && (
              <motion.button
                key="search-ai-btn"
                type="submit"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                disabled={isLoading || value.trim().length < 3}
                className={`${hasActiveSession ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'} p-3 rounded-full transition-all active:scale-95 disabled:opacity-30 disabled:grayscale`}
              >
                 {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              </motion.button>
            )}
            
            {value && !isLoading && (
              <button
                key="clear-search-btn"
                type="button"
                onClick={() => onChange('')}
                className="text-zinc-600 hover:text-white transition-colors p-1"
              >
                <X size={16} />
              </button>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Ayuda y Stats eliminados por directiva Staff Engineer v17.3 */}
    </div>
  );
};


export default SearchBar;
