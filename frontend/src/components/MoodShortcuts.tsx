import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Coffee, Ghost } from 'lucide-react';

interface MoodShortcutsProps {
  onSelect: (prompt: string) => void;
  isLoading: boolean;
}

const SHORTCUTS = [
  { label: 'Cine de Suspense', prompt: 'Una película intensa de suspense para atraparme.', icon: Ghost, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { label: 'Comedia Ligera', prompt: 'Una comedia ligera para desconectar y reír.', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { label: 'Blockbuster', prompt: 'Un blockbuster moderno con mucha acción y efectos.', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { label: 'Sorpréndeme', prompt: 'Recomiéndame una joya oculta de la que nadie habla.', icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
];

const MoodShortcuts: React.FC<MoodShortcutsProps> = ({ onSelect, isLoading }) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-8">
      {SHORTCUTS.map((shortcut, idx) => {
        const Icon = shortcut.icon;
        return (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading}
            onClick={() => onSelect(shortcut.prompt)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border ${shortcut.border} ${shortcut.bg} hover:brightness-125 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Icon size={14} className={shortcut.color} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
              {shortcut.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default MoodShortcuts;
