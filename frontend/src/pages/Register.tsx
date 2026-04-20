import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Mail, Lock, Eye, EyeOff, Loader2, ChevronRight, User, CheckCircle2, Quote as QuoteIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import loginBg from '../assets/login-bg.png';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Introduzca un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  streamingPlatforms: z.array(z.string()).min(1, 'Seleccione al menos una plataforma'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const PLATFORMS = [
  { id: 'netflix', name: 'Netflix', color: 'bg-red-600' },
  { id: 'hbo_max', name: 'HBO Max', color: 'bg-indigo-700' },
  { id: 'disney_plus', name: 'Disney+', color: 'bg-blue-800' },
  { id: 'amazon_prime', name: 'Prime Video', color: 'bg-sky-500' },
  { id: 'apple_tv', name: 'Apple TV', color: 'bg-zinc-100', textColor: 'text-zinc-950' },
];

const EPIC_QUOTES = [
  { text: "El mañana es un misterio, el hoy es un regalo.", movie: "Kung Fu Panda" },
  { text: "Grandes hombres no nacen grandes, crecen grandes.", movie: "El Padrino" },
  { text: "Solo nosotros podemos decidir qué hacer con el tiempo que se nos da.", movie: "El Señor de los Anillos" },
];

const QuoteSection: React.FC<{ quote: { text: string; movie: string } }> = ({ quote }) => (
  <div className="absolute bottom-12 left-12 right-12 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-500">
    <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
      <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full" />
      <QuoteIcon className="text-indigo-500 mb-6 opacity-40 group-hover:opacity-100 transition-opacity duration-700" size={32} />
      <p className="text-2xl lg:text-3xl font-extralight leading-relaxed text-white/90 italic tracking-tight">
        "{quote.text}"
      </p>
      <div className="mt-6 flex items-center gap-4">
        <div className="h-px w-8 bg-indigo-500/50" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/80">
          — {quote.movie}
        </p>
      </div>
    </div>
  </div>
);

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();

  const selectedQuote = useMemo(() => EPIC_QUOTES[Math.floor(Math.random() * EPIC_QUOTES.length)], []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { streamingPlatforms: [] },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError(null);
      await registerAuth(data.name, data.email, data.password, data.streamingPlatforms);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta. Inténtelo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-zinc-950 text-zinc-100 overflow-hidden relative selection:bg-indigo-500/30">
      
      {/* Cinematic Grain Overlay */}
      <div className="absolute inset-0 bg-noise z-50 pointer-events-none" />

      {/* SECCIÓN IZQUIERDA: Formulario */}
      <main className="flex items-center justify-center p-8 lg:p-12 relative z-40 bg-zinc-950 overflow-y-auto max-h-screen pt-20">
        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
          
          {/* Branding (Coincide con el Login actualizado) */}
          <header className="space-y-4">
            <div className="flex flex-col items-start gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <Film size={24} />
              </div>
              <h1 className="text-4xl font-bold tracking-tighter text-white">
                StreamMatch <span className="text-indigo-500">AI</span>
              </h1>
            </div>
            <p className="text-zinc-500 text-lg font-medium tracking-tight opacity-70 italic">
              Empieza tu viaje cinematográfico personalizado.
            </p>
          </header>

          {/* Formulario de Registro */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500/80 text-[10px] font-black uppercase tracking-widest text-center animate-in zoom-in-95">
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Nombre */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-zinc-600">Nombre Completo</label>
                <div className="relative group/input">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within/input:text-indigo-500 transition-colors" />
                  <input {...register('name')} disabled={isSubmitting} className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-5 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-zinc-800 text-sm font-medium" placeholder="Cinéfilo García" />
                </div>
                {errors.name && <p className="text-[10px] text-red-500/70 font-bold ml-1">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-zinc-600">Correo Electrónico</label>
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within/input:text-indigo-500 transition-colors" />
                  <input {...register('email')} type="email" disabled={isSubmitting} className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-5 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-zinc-800 text-sm font-medium" placeholder="tu@cine.com" />
                </div>
                {errors.email && <p className="text-[10px] text-red-500/70 font-bold ml-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-zinc-600">Contraseña Maestra</label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within/input:text-indigo-500 transition-colors" />
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} disabled={isSubmitting} className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-12 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-zinc-800 text-sm font-medium" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-red-500/70 font-bold ml-1">{errors.password.message}</p>}
              </div>

              {/* Selector de Plataformas */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black tracking-[0.3em] uppercase text-zinc-600">Plataformas que usas</label>
                <Controller
                  name="streamingPlatforms"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {PLATFORMS.map((platform) => {
                        const isSelected = field.value.includes(platform.id);
                        return (
                          <button
                            key={platform.id}
                            type="button"
                            onClick={() => {
                              const newValue = isSelected
                                ? field.value.filter((val: string) => val !== platform.id)
                                : [...field.value, platform.id];
                              field.onChange(newValue);
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                              isSelected 
                                ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                                : 'bg-zinc-900/30 border-white/5 hover:border-zinc-700'
                            }`}
                          >
                            <span className="text-xs font-bold tracking-tight">{platform.name}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-500" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.streamingPlatforms && <p className="text-[10px] text-red-500/70 font-bold ml-1">{errors.streamingPlatforms.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black py-4.5 rounded-2xl transition-all duration-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98] disabled:opacity-50 overflow-hidden"
            >
              <div className="flex items-center justify-center gap-3 relative z-10 uppercase tracking-[0.2em] text-[11px]">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    <span>Unirse a la Sala</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          <footer className="text-center text-[10px] font-black tracking-[0.3em] uppercase text-zinc-700">
            <p>
              ¿Ya tienes butaca? {' '}
              <Link to="/login" className="text-zinc-300 hover:text-indigo-400 transition-all underline decoration-zinc-800 underline-offset-8 decoration-2">
                Iniciar Sesión
              </Link>
            </p>
          </footer>
        </div>
      </main>

      {/* SECCIÓN DERECHA: Cinematic Canvas (Igual que Login) */}
      <section className="hidden lg:block relative overflow-hidden bg-black">
        <div 
          className="absolute inset-0 bg-cover bg-center animate-ken-burns scale-110 brightness-[0.7] grayscale-[10%]"
          style={{ backgroundImage: `url(${loginBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/20 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
        <QuoteSection quote={selectedQuote} />
        <div className="absolute top-12 right-12 z-20 flex gap-3 opacity-40">
          <div className="px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black tracking-[0.3em] uppercase text-white/60">
            ULTRA HD
          </div>
          <div className="px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black tracking-[0.3em] uppercase text-white/60">
            CINEMATIC AI
          </div>
        </div>
      </section>

    </div>
  );
};

export default Register;
