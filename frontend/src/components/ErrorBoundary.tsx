import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary v17.1 — Contención de Errores Críticos
 * Evita la 'pantalla negra' capturando fallos de renderizado y ofreciendo
 * una interfaz de recuperación elegante.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Actualiza el estado para que el siguiente renderizado muestre la interfaz de fallback.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 [ErrorBoundary CRASH]:', error, errorInfo);
  }

  private handleReset = () => {
    // Limpieza agresiva para evitar bucles de crash por datos corruptos
    localStorage.removeItem('streammatch_session');
    sessionStorage.clear();
    window.location.href = '/'; // Redirigir al inicio y recargar
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-zinc-100 font-sans selection:bg-indigo-500/30">
          {/* Bloque de Fondo (Aura de Error) */}
          <div className="fixed inset-0 pointer-events-none opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#ef4444,transparent_70%)]" />
          </div>

          <div className="relative z-10 w-full max-w-md">
            <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tighter uppercase">Interrupción en el Radar</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  El Sommelier ha encontrado una anomalía inesperada. Para garantizar la estabilidad, necesitamos reiniciar tu sesión de visualización.
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  <RefreshCw size={16} />
                  Reiniciar Sesión
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-800 text-white font-black py-4 rounded-2xl hover:bg-zinc-700 transition-all active:scale-95 text-xs uppercase tracking-widest border border-white/5"
                >
                  <Home size={16} />
                  Ir al Inicio
                </button>
              </div>

              <div className="pt-4">
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                  Error ID: {this.state.error?.name || 'UnknownException'}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
