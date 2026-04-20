import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import type { ITasteProfile } from '../context/AuthContext';
import { Film, Sparkles, Check, Settings } from 'lucide-react';

const GENRES = ['Acción', 'Comedia', 'Drama', 'Terror', 'Sci-Fi', 'Documental', 'Animación', 'Suspenso', 'Fantasía'];
const DEALBREAKERS = ['Musicales', 'Gore extremo', 'Romance empalagoso', 'Western Clásico', 'Cine Experimental'];

const Onboarding: React.FC = () => {
  const { updateTasteProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const [profile, setProfile] = useState<Partial<ITasteProfile>>({
    genres: [],
    pace: 'balanced',
    tone: 'balanced',
    era: 'modern',
    dealbreakers: []
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const toggleItem = (list: string[], item: string, key: 'genres' | 'dealbreakers') => {
    const newList = list.includes(item) 
      ? list.filter(i => i !== item) 
      : [...list, item];
    setProfile({ ...profile, [key]: newList });
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    // Simular el efecto "Cocinando el Algoritmo" v10.0
    await new Promise(resolve => setTimeout(resolve, 2500));
    try {
      await updateTasteProfile(profile as ITasteProfile);
    } catch (err) {
      console.error(err);
      setIsFinishing(false);
    }
  };

  // Variantes de Animación Premium (v10.0 Cine-Noir)
  const stepVariants = {
    initial: { opacity: 0, x: 20, filter: 'blur(10px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, x: -20, filter: 'blur(10px)' }
  };

  if (isFinishing) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-noise absolute inset-0 pointer-events-none" />
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 border-t-2 border-amber-400 rounded-full mb-8 shadow-[0_0_30px_rgba(251,191,36,0.3)]"
        />
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-light text-amber-500 tracking-[0.2em] uppercase"
        >
          Afinando tu paladar...
        </motion.h2>
        <p className="text-zinc-500 mt-2 font-light">El Sommelier está consultando los archivos maestros.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-noise absolute inset-0 pointer-events-none" />
      
      <div className="relative w-full max-w-2xl bg-zinc-950/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900">
          <motion.div 
            className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" {...stepVariants} className="space-y-6">
                <div className="flex items-center gap-3 text-amber-500">
                  <Film size={24} />
                  <span className="text-xs tracking-widest uppercase font-semibold">Preferencia Base</span>
                </div>
                <h2 className="text-3xl font-light leading-tight">¿Qué texturas suele tener tu <span className="text-amber-500">noche de cine</span>?</h2>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => (
                    <motion.button
                      key={g}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleItem(profile.genres || [], g, 'genres')}
                      className={`px-4 py-2 rounded-full border text-sm transition-all ${
                        profile.genres?.includes(g) 
                          ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.2)]' 
                          : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {g}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" {...stepVariants} className="space-y-6">
                <div className="flex items-center gap-3 text-amber-500">
                  <Sparkles size={24} />
                  <span className="text-xs tracking-widest uppercase font-semibold">El Compás</span>
                </div>
                <h2 className="text-3xl font-light">¿A qué <span className="text-amber-500">velocidad</span> prefieres que lata la historia?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'frenetic', label: 'Frenético', icon: Sparkles, color: 'text-red-400', shake: true },
                    { id: 'balanced', label: 'Equilibrado', icon: Settings, color: 'text-amber-400' },
                    { id: 'slow', label: 'Contemplativo', icon: Film, color: 'text-blue-400', blur: true }
                  ].map(opt => (
                    <motion.button
                      key={opt.id}
                      onClick={() => setProfile({ ...profile, pace: opt.id as any })}
                      whileHover={opt.shake ? { x: [0, -2, 2, -2, 2, 0] } : { scale: 1.02 }}
                      className={`p-6 rounded-xl border flex flex-col items-center gap-4 transition-all ${
                        profile.pace === opt.id 
                          ? 'bg-zinc-900 border-amber-500/50' 
                          : 'border-zinc-800 bg-black/20 hover:border-zinc-700'
                      }`}
                    >
                      <opt.icon className={profile.pace === opt.id ? opt.color : 'text-zinc-600'} />
                      <span className={profile.pace === opt.id ? 'text-white' : 'text-zinc-500'}>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" {...stepVariants} className="space-y-6">
                <div className="flex items-center gap-3 text-amber-500">
                  <Sparkles size={24} />
                  <span className="text-xs tracking-widest uppercase font-semibold">El Matiz</span>
                </div>
                <h2 className="text-3xl font-light">¿Qué tipo de <span className="text-amber-500">pureza</span> buscas?</h2>
                <div className="space-y-3">
                  {[
                    { id: 'commercial', label: 'Blockbusters de alto voltaje', desc: 'Grandes historias, grandes presupuestos.' },
                    { id: 'balanced', label: 'Un equilibrio refinado', desc: 'Lo mejor de ambos mundos.' },
                    { id: 'indie', label: 'Cine de Autor e Independiente', desc: 'Narrativas únicas y visiones arriesgadas.' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setProfile({ ...profile, tone: opt.id as any })}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        profile.tone === opt.id 
                          ? 'bg-amber-500/5 border-amber-500/50' 
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-medium text-white">{opt.label}</div>
                      <div className="text-xs text-zinc-500">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" {...stepVariants} className="space-y-6">
                <div className="flex items-center gap-3 text-amber-500">
                  <Film size={24} />
                  <span className="text-xs tracking-widest uppercase font-semibold">La Memoria</span>
                </div>
                <h2 className="text-3xl font-light">¿De qué <span className="text-amber-500">época</span> quieres extraer tesoros?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'classics', label: 'Clásicos (Pre-80)' },
                    { id: '80s-90s', label: 'Años 80 y 90' },
                    { id: '2000s', label: 'Años 2000' },
                    { id: 'modern', label: 'Actualidad' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setProfile({ ...profile, era: opt.id as any })}
                      className={`p-4 rounded-xl border transition-all ${
                        profile.era === opt.id 
                          ? 'bg-amber-500/10 border-amber-500 text-white' 
                          : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step5" {...stepVariants} className="space-y-6">
                <div className="flex items-center gap-3 text-red-500">
                  <Settings size={24} />
                  <span className="text-xs tracking-widest uppercase font-semibold">Líneas Rojas</span>
                </div>
                <h2 className="text-3xl font-light leading-tight">¿Qué puertas prefieres <span className="text-red-500">no abrir</span> jamás?</h2>
                <p className="text-zinc-500 text-sm">Estos géneros o temas serán evitados por el Sommelier.</p>
                <div className="flex flex-wrap gap-2">
                  {DEALBREAKERS.map(d => (
                    <motion.button
                      key={d}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleItem(profile.dealbreakers || [], d, 'dealbreakers')}
                      className={`px-4 py-2 rounded-full border text-sm transition-all ${
                        profile.dealbreakers?.includes(d) 
                          ? 'bg-red-500/10 border-red-500 text-red-500' 
                          : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {d}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-12 pt-6 border-t border-zinc-900">
            {step > 1 ? (
              <button 
                onClick={prevStep}
                className="text-zinc-500 hover:text-white transition-colors text-sm font-medium"
              >
                Volver
              </button>
            ) : <div />}
            
            <button
              onClick={step === 5 ? handleFinish : nextStep}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-full font-semibold transition-all shadow-[0_4px_20px_rgba(251,191,36,0.3)] active:scale-95"
            >
              {step === 5 ? 'Finalizar Cata' : 'Siguiente'}
              <Check size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
