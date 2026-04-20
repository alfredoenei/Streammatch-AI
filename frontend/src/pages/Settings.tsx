import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Film, ChevronLeft, Save, Loader2, CheckCircle2, Tv, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { movieService } from '../services/movie.service';

interface PlatformMetadata {
  id: string;
  name: string;
  color: string;
  logo: string;
}

const Settings: React.FC = () => {
  const { user, resetTasteProfile } = useAuth();
  const { updatePlatforms, isUpdating } = useProfile();
  const navigate = useNavigate();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [availablePlatforms, setAvailablePlatforms] = useState<PlatformMetadata[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar catálogo oficial desde el backend
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const response = await movieService.getAvailablePlatforms();
        setAvailablePlatforms(response.data);
      } catch (err: any) {
        setError('No se pudo cargar el catálogo de marcas oficiales.');
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchPlatforms();
  }, []);

  // Inicializar plataformas seleccionadas desde el usuario actual
  useEffect(() => {
    if (user?.streamingPlatforms) {
      setSelectedPlatforms(user.streamingPlatforms);
    }
  }, [user]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedPlatforms.length === 0) {
      setError('Selecciona al menos una plataforma para recalibrar el Radar.');
      return;
    }

    setError(null);
  
    try {
      await updatePlatforms(selectedPlatforms);
      setShowSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      setError(err.message || 'Error al guardar las preferencias.');
    }
  };

  const handleResetProfile = async () => {
    const confirmReset = window.confirm(
      '¿Estás seguro de que quieres reiniciar tu paladar cinemátográfico? Esta acción es irreversible y tendrás que volver a realizar el onboarding.'
    );

    if (!confirmReset) return;

    setIsResetting(true);
    setError(null);

    try {
      await resetTasteProfile();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al reiniciar el perfil.');
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden">
      
      {/* Cinematic Grain Overlay */}
      <div className="absolute inset-0 bg-noise z-0 pointer-events-none opacity-20" />

      {/* Header / Navbar */}
      <nav className="relative z-10 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-6 lg:px-12 py-4">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold tracking-tight uppercase text-[10px] tracking-[0.2em]">Cerrar Radar</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Film size={20} />
            </div>
            <span className="text-xl font-black tracking-tighter text-white hidden sm:block">
              StreamMatch <span className="text-indigo-500">AI</span>
            </span>
          </div>

          <div className="w-24" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-3xl space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-3xl bg-zinc-900 border border-white/5 mb-2 shadow-2xl">
              <Tv className="text-indigo-500" size={32} />
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white">
              Panel de <span className="italic text-zinc-500">Marcas</span>
            </h1>
            <p className="text-zinc-500 text-lg font-medium max-w-md mx-auto">
              Selecciona tus suscripciones activas para sincronizar el catálogo real.
            </p>
          </div>

          {/* Platform Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {isDataLoading ? (
               Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
              ))
            ) : availablePlatforms.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  disabled={isUpdating || showSuccess}
                  className={`relative flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border transition-all duration-500 group overflow-hidden ${
                    isSelected
                      ? 'bg-zinc-900 border-white/20 shadow-2xl'
                      : 'bg-zinc-900/40 border-white/5 hover:border-white/10 grayscale hover:grayscale-0'
                  }`}
                  style={{
                    boxShadow: isSelected ? `0 0 30px ${platform.color}15` : undefined,
                    borderColor: isSelected ? `${platform.color}50` : undefined
                  }}
                >
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <img 
                      src={platform.logo} 
                      alt={platform.name}
                      className={`w-10 h-10 object-contain transition-transform duration-500 ${isSelected ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}
                    />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-zinc-600'}`}>
                      {platform.name}
                    </span>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundColor: platform.color }} />
                  )}

                  {isSelected && (
                    <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-white animate-in zoom-in duration-300" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Actions */}
          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500 text-center text-sm font-bold tracking-wide uppercase">
                {error}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isUpdating || showSuccess || isResetting}
              className={`w-full relative py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all duration-500 overflow-hidden ${
                showSuccess
                  ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] active:scale-[0.98]'
              } disabled:opacity-70`}
            >
              <div className="flex items-center justify-center gap-3 relative z-10">
                {isUpdating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Guardando Preferencias...</span>
                  </>
                ) : showSuccess ? (
                  <>
                    <CheckCircle2 size={20} />
                    <span>Preferencias Guardadas</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Guardar Preferencias</span>
                  </>
                )}
              </div>
            </button>

            {/* Danger Zone v10.0 */}
            <div className="pt-8 mt-8 border-t border-red-950/30">
              <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black tracking-tight text-white uppercase">Zona de Peligro</h3>
                    <p className="text-zinc-500 text-sm">
                      Reiniciar tu perfil borrará todo tu historial de preferencias y el algoritmo de Radar AI volverá a cero.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleResetProfile}
                  disabled={isUpdating || isResetting || showSuccess}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-500 font-bold text-xs uppercase tracking-widest group disabled:opacity-50"
                >
                  {isResetting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} className="group-hover:animate-bounce" />
                  )}
                  <span>Reiniciar Mi Paladar AI</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
    </div>
  );
};

export default Settings;
