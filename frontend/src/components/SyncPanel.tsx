import React, { useState } from 'react';
import { Users, Mail, Loader2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import api from '../services/api';

interface SyncPanelProps {
  onSync: (friendName: string, commonPlatforms: string[]) => void;
  onClose: () => void;
}

/**
 * Panel de Sincronización para el Modo Fiesta.
 * Diseño Neón/Cyberpunk con validación en tiempo real.
 */
const SyncPanel: React.FC<SyncPanelProps> = ({ onSync, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/movies/sync', { friendEmail: email });
      const { friendName, commonPlatforms } = response.data.data;
      
      onSync(friendName, commonPlatforms);
    } catch (err: unknown) {
      console.error('Sync Error:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'No se pudo conectar con tu amigo.');
      } else {
        setError('No se pudo conectar con tu amigo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="w-full max-w-md mx-auto bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 bg-indigo-600/20 rounded-full blur-[80px]" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-40 h-40 bg-purple-600/20 rounded-full blur-[80px]" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-10">
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Users size={28} />
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Modo <span className="text-indigo-500 italic">Fiesta</span></h2>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-10 leading-relaxed">
          Sincronización de Catálogo <br /> Humano x IA
        </p>

        <form onSubmit={handleSync} className="space-y-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email de tu compañero"
              className="w-full bg-zinc-950/50 border border-white/5 focus:border-indigo-500/50 rounded-2xl py-5 pl-14 pr-4 text-white placeholder-zinc-700 outline-none transition-all shadow-inner"
              required
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                key="sync-error-msg"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <p className="text-red-400 text-[10px] font-black uppercase tracking-wider">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full relative group py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 font-black text-xs uppercase tracking-[0.3em] text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-center gap-3 relative z-10">
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Activar Frecuencia</span>
                </>
              )}
            </div>
          </button>
        </form>

        <p className="mt-8 text-[10px] text-center font-bold uppercase tracking-[0.2em] text-zinc-600">
          Inteligencia de Intersección Activa
        </p>
      </div>
    </motion.div>
  );
};

export default SyncPanel;
