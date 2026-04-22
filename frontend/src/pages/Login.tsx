import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Mail, Lock, Eye, EyeOff, Loader2, ChevronRight, Quote as QuoteIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import loginBg from '../assets/login-bg.png';

const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const EPIC_QUOTES = [
  { text: "La vida es un regalo y no pienso desperdiciarla.", movie: "Titanic" },
  { text: "No son nuestras habilidades las que muestran cómo somos, sino nuestras elecciones.", movie: "Harry Potter" },
  { text: "Hazlo o no lo hagas, pero no lo intentes.", movie: "Star Wars" },
  { text: "La felicidad solo es real cuando se comparte.", movie: "Hacia rutas salvajes" },
  { text: "El ayer es historia, el mañana es un misterio, pero el hoy es un regalo.", movie: "Kung Fu Panda" },
  { text: "Grandes hombres no nacen grandes, crecen grandes.", movie: "El Padrino" },
  { text: "Para ver el mundo, ver cosas peligrosas, ver detrás de los muros...", movie: "La vida secreta de Walter Mitty" },
  { text: "Solo nosotros podemos decidir qué hacer con el tiempo que se nos ha dado.", movie: "El Señor de los Anillos" },
];

const QuoteSection: React.FC<{ quote: { text: string; movie: string } }> = ({ quote }) => (
  <div className="absolute bottom-12 left-12 right-12 z-20 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-500">
    <div className="p-8 rounded-3xl border border-white/20 bg-black/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
      {/* Glow effect inside quote */}
      <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full" />
      
      <QuoteIcon className="text-indigo-500 mb-6 opacity-40 group-hover:opacity-100 transition-opacity duration-700" size={32} />
      
      <p className="text-2xl lg:text-3xl font-extralight leading-relaxed text-white/90 italic tracking-tight">
        "{quote.text}"
      </p>
      
      <div className="mt-6 flex items-center gap-4">
        <div className="h-px w-8 bg-indigo-500/80" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">
          — {quote.movie}
        </p>
      </div>
    </div>
  </div>
);

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedQuote] = useState(() => EPIC_QUOTES[Math.floor(Math.random() * EPIC_QUOTES.length)]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError(null);
      await login(data.email, data.password);
      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Email o contraseña incorrectos');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Error de conexión: El servidor no responde o hay un problema de CORS');
      } else {
        const serverMessage = err.response?.data?.message || err.message;
        setError(serverMessage ? `Error: ${serverMessage}` : 'Error inesperado. Por favor, intenta más tarde');
      }
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-zinc-950 text-zinc-100 overflow-hidden relative">
      
      {/* Capa de Ruido Cinematográfico (35mm Grain) */}
      <div className="absolute inset-0 bg-noise z-50 pointer-events-none" />

      {/* SECCIÓN IZQUIERDA: Autenticación */}
      <main className="flex items-center justify-center p-8 lg:p-24 relative z-40 bg-zinc-950">
        <div className="w-full max-w-sm space-y-16 animate-in fade-in slide-in-from-left-8 duration-1000">
          
          {/* Branding */}
          <header className="space-y-10">
            <div className="flex flex-col items-start gap-2 mb-8">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <Film size={24} />
              </div>
              <h1 className="text-4xl font-bold tracking-tighter text-white">
                StreamMatch <span className="text-indigo-500">AI</span>
              </h1>
            </div>
          </header>


          {/* Formulario de Acceso */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500/80 text-[10px] font-black uppercase tracking-widest text-center animate-in zoom-in-95">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="email" className="block text-[10px] font-black tracking-[0.3em] uppercase text-zinc-600">
                  Identificación de Usuario
                </label>
                <div className="relative group/input">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within/input:text-indigo-500 transition-colors duration-500" />
                  <input
                    {...register('email')}
                    id="email"
                    type="email"
                    disabled={isSubmitting}
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl py-4.5 pl-14 pr-5 outline-none transition-all duration-500 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-zinc-500 text-white text-sm font-medium shadow-inner"
                    placeholder="usuario@streammatch.ai"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-500/70 font-bold ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-3">
                <label htmlFor="password" className="block text-[10px] font-black tracking-[0.3em] uppercase text-zinc-600">
                  Clave de Acceso
                </label>
                <div className="relative group/input">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within/input:text-indigo-500 transition-colors duration-500" />
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    disabled={isSubmitting}
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl py-4.5 pl-14 pr-12 outline-none transition-all duration-500 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-zinc-500 text-white text-sm font-medium shadow-inner"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-indigo-400 transition-all p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-red-500/70 font-bold ml-1">{errors.password.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black py-5 rounded-2xl transition-all duration-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="flex items-center justify-center gap-3 relative z-10 uppercase tracking-[0.2em] text-[11px]">
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Entrar a la Sala</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-500" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Footer de Registro */}
          <footer className="pt-12 text-center text-[10px] font-black tracking-[0.3em] uppercase text-zinc-700">
            <p>
              ¿Sin invitación? {' '}
              <Link to="/register" className="text-zinc-300 hover:text-indigo-400 transition-all underline decoration-zinc-800 underline-offset-8 decoration-2">
                Crea tu perfil
              </Link>
            </p>
          </footer>
        </div>
      </main>

      {/* SECCIÓN DERECHA: Cinematic Canvas */}
      <section className="hidden lg:block relative overflow-hidden bg-black">
        {/* Poster con Zoom Cinematográfico */}
        <div 
          className="absolute inset-0 bg-cover bg-center animate-ken-burns scale-110 brightness-[0.7] grayscale-[10%]"
          style={{ backgroundImage: `url(${loginBg})` }}
        />
        
        {/* Máscaras de Gradiente Progresivas */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/20 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
        
        {/* Contenido de la Cita */}
        <QuoteSection quote={selectedQuote} />

        {/* Cinematic Accents */}
        <div className="absolute top-12 right-12 z-20 flex gap-3 opacity-40">
          <div className="px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black tracking-[0.3em] uppercase text-white/60">
            DOLBY VISION
          </div>
          <div className="px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black tracking-[0.3em] uppercase text-white/60">
            4K HDR
          </div>
        </div>
      </section>

    </div>
  );
};

export default Login;
