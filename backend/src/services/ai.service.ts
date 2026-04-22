/**
 * AI Service v16.2 — The High Precision Sommelier
 *
 * Filosofía: El Sommelier es infalible. Identifica títulos exactos.
 * REGLA CERO: El prompt del usuario manda sobre el perfil.
 * COT: La IA razona internamente antes de seleccionar los títulos.
 */

import OpenAI from 'openai';
import { z } from 'zod';
import type { ITasteProfile, MediaType } from '../types/user';
import { AIResponseSchema, type IAIFilters } from '../types/tmdb.types';
import { getGenreId } from '../config/genres';
import { AICache } from '../models/AICache';
import { CircuitBreaker } from '../models/SystemCache';
import crypto from 'crypto';

console.log('✅ [BOOT] AI Service v13.1 cargado.');

// ─────────────────────────────────────────────────────────────────────────────
// UTILS — v32.1 JSON STRIPPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * v34.7 JSON Compactor: Extrae los títulos del JSON antes de omitirlo
 * para que el Sommelier no pierda la memoria de lo que ha recomendado.
 */
function stripJSONContent(text: string): string {
  if (!text) return '';
  
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.movie_selection && Array.isArray(parsed.movie_selection)) {
        const titles = parsed.movie_selection.map((m: any) => m.title);
        const compactor = `[Títulos recomendados en este turno: ${titles.join(', ')}]`;
        return text.replace(/```json[\s\S]*?```/gi, compactor).trim();
      }
    }
  } catch (e) {
    // Fallback si el JSON es inválido o no tiene el formato esperado
  }

  return text
    .replace(/```json[\s\S]*?```/gi, '[JSON omitido]')
    .replace(/\[[\s\S]*?\]/g, (match) => match.length > 100 ? '[Caché omitida]' : match)
    .trim();
}

function buildSystemPrompt(
  userProfile?: ITasteProfile | null,
  activeMode: MediaType | 'both' = 'both',
  platforms: string[] = [],
  userName: string = 'Usuario',
  conversationalContext: string = ''
): string {
  const rawName = userName ? userName.split(' ')[0].trim() : '';
  const firstName = rawName || 'Cinéfilo';
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  const profileContext = userProfile
    ? `Perfil de gusto del usuario:
       - Géneros favoritos: ${userProfile.genres?.join(', ') || 'Variado'}
       - Ritmo: ${userProfile.pace || 'Equilibrado'}
       - Tono: ${userProfile.tone || 'Abierto'}
       - Época preferida: ${userProfile.era || 'Cualquiera'}
       - No le gusta: ${userProfile.dealbreakers?.join(', ') || 'Nada específico'}`
    : 'Sin perfil de usuario definido.';

  const platformsContext = platforms.length > 0
    ? `PLATAFORMAS DISPONIBLES (HARD CONSTRAINT): ${platforms.join(', ')}. Solo puedes recomendar contenido que esté disponible en estos servicios.`
    : 'No hay plataformas definidas.';

  const modeInstruction =
    activeMode === 'tv' ? 'Solo Series.' : activeMode === 'movie' ? 'Solo Películas.' : 'Películas y Series.';

  return `Eres el Sommelier de StreamMatch AI. Actúa como un experto de videoclub culto, apasionado y con opinión propia.

${profileContext}
${platformsContext}
${modeInstruction}

═══════════════════════════════════════
// 🧠 DIRECTIVAS MAESTRAS DEL SOMMELIER v35.0 (PERSONALITY OVERHAUL)
// ═══════════════════════════════════════
0. CERO ALUCINACIONES: NINGÚN título en narrativa que no esté en 'movie_selection'. El texto y el JSON son un espejo.
1. DETECTA EL CONTEXTO (STATE AWARENESS): Si el usuario pide "más", "ampliar" o refina una búsqueda anterior, NUNCA vuelvas a introducir el tema. Actúa como si estuvieras sacando más botellas de la bodega. Usa aperturas cortas: "Profundicemos más...", "Aquí tienes otras joyas...", "Vamos un paso más allá...".
2. PROHIBICIÓN DE REPETICIÓN (REFINEMENT RULE): En el caso de que la interacción sea un 'REFINEMENT', tienes PROHIBIDO incluir en 'movie_selection' títulos que ya hayan sido mencionados en el 'HISTORIAL DE CONVERSACIÓN'. Tu objetivo es aportar variedad y descubrimiento.
3. ESTILO CRÍTICO Y ASERTIVO: Abandona el tono de "asistente servicial" (ej. "Aquí te presento..."). Adopta el tono de un crítico de cine apasionado y con autoridad (ej. "He seleccionado estas obras porque...", "Es imperativo que veas...").
4. MICRO-FORMATO: Usa **Negritas** para destacar conceptos clave, nombres de **Directores** o **Estilos** cinematográficos.
5. IDENTIDAD ABSOLUTA: Devuelve SIEMPRE "original_title" y "local_title".

--- EJEMPLOS DE AUTORIDAD (FEW-SHOT) ---
User: "Busco algo de suspenso psicológico similar a Shutter Island."
Assistant: "¡Magnífica elección! Si te apasionan los laberintos mentales de **Martin Scorsese**, he curado una selección que desafiará tu percepción de la realidad. Destacan obras con una **Atmósfera Opresiva** como estas..."

User: "Me encantan esas, pero quita las que sean españolas y ponme algo más futurista."
Assistant: "Entendido, giramos el radar hacia el mañana. Desechamos el suspenso costumbrista para adentrarnos en **Distopías Visuales** de primer nivel. Es obligatorio que analices la propuesta de **Denis Villeneuve** en..."
----------------------------------

Tu respuesta debe ser un JSON estricto:
{
  "interaction_type": "INITIAL" | "REFINEMENT" | "EXPANSION",
  "internal_reasoning": string,
  "narrative_justification": string (Markdown rico),
    "movie_selection": [
      { 
        "title": string, 
        "original_title": string, 
        "local_title": string,
        "year": number, 
        "type": "movie" | "tv" 
      }
    ],
    "advisory": string
  }

${conversationalContext ? `\n--- HISTORIAL DE CONVERSACIÓN (COMPACTO) ---\n${conversationalContext}\n---------------------------------\n` : ''}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CACHE
// ─────────────────────────────────────────────────────────────────────────────

function buildCacheKey(
  prompt: string,
  profile: ITasteProfile | null | undefined,
  mode: MediaType | 'both'
): string {
  return `${prompt}::${JSON.stringify(profile ?? {})}::${mode}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI SERVICE CLASS
// ─────────────────────────────────────────────────────────────────────────────

class AIService {
  private groq: OpenAI | null = null;
  private openai: OpenAI | null = null;
  private cache: Map<string, IAIFilters> = new Map();
  private circuitBreakerUntil: number = 0;
  private readonly GROQ_MODEL = 'llama-3.3-70b-versatile';
  private readonly MAX_RETRIES = 2;

  constructor() {
    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (groqKey) {
      this.groq = new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' });
      console.log('🍷 [RADAR v31.0] Sommelier 70B restaurado.');
    }
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    if (openaiKey) this.openai = new OpenAI({ apiKey: openaiKey });
  }

  // ─── CIRCUIT BREAKER ASYNC ──────────────────────────────────────────────
  private async _isLocked(): Promise<boolean> {
    if (Date.now() < this.circuitBreakerUntil) return true;
    try {
      const cb = await CircuitBreaker.findOne({ serviceId: 'ai_groq' });
      if (cb && Date.now() < cb.lockedUntil) {
        this.circuitBreakerUntil = cb.lockedUntil;
        return true;
      }
    } catch (e) {}
    return false;
  }

  private async _setLock() {
    this.circuitBreakerUntil = Date.now() + 60000; // 60s
    try {
      await CircuitBreaker.findOneAndUpdate(
        { serviceId: 'ai_groq' },
        { lockedUntil: this.circuitBreakerUntil },
        { upsert: true }
      );
    } catch (e) {}
  }

  // ─── PUBLIC ───────────────────────────────────────────────────────────────

  async translatePromptToFilters(
    prompt: string,
    userProfile?: ITasteProfile | null,
    signal?: AbortSignal,
    activeMode: MediaType | 'both' = 'both',
    userName: string = 'Usuario',
    conversationalContext?: string,
    history: any[] = [] // v32.1
  ): Promise<IAIFilters> {
    // Generar clave única para MongoDB
    const promptKey = this._generateCacheKey(prompt, userProfile, activeMode, !!conversationalContext);

    // 1. Check MongoDB AICache (v25.0)
    try {
      const cached = await AICache.findOne({ promptKey });
      if (cached) {
        console.log(`♻️ [AICache] Hit para promptKey: ${promptKey.substring(0, 12)}...`);
        return { ...cached.response, source: `mongo_cache_${cached.response.source}` };
      }
    } catch (err) {
      console.warn('⚠️ [AICache] Error al consultar MongoDB:', err);
    }

    const isLocked = await this._isLocked();
    let result: IAIFilters | null = null;
    
    // Primer intento con Groq (Primario, Rápido)
    if (this.groq && !isLocked) {
      result = await this._callWithRetry(
        this.groq, this.GROQ_MODEL, prompt, userProfile, signal, activeMode, userName, conversationalContext, history
      );
    }

    // Segundo intento con OpenAI (Secundario, Respaldo vital)
    if (result === null && this.openai) {
      console.log('🔄 [AI] Conmutando a OpenAI (gpt-4o-mini) por indisponibilidad de Groq.');
      result = await this._callWithRetry(
        this.openai, 'gpt-4o-mini', prompt, userProfile, signal, activeMode, userName, conversationalContext, history
      );
      if (result) {
        result.source = 'sommelier_v14.3_openai_fallback';
      }
    }

    // Si tuvimos éxito (con Groq u OpenAI)
    if (result !== null) {
      // Guardar en MongoDB AICache para futuras peticiones
      try {
        await AICache.findOneAndUpdate(
          { promptKey }, 
          { response: result, createdAt: new Date() }, 
          { upsert: true }
        );
      } catch (err) {
        console.warn('⚠️ [AICache] Error al guardar en MongoDB:', err);
      }
      return result;
    }

    // Si AMBAS APIs fallaron (Stale-While-Error)
    return this._resilientFallback(activeMode);

  }

  private _generateCacheKey(prompt: string, profile: any, mode: string, hasContext: boolean): string {
    const rawKey = `${prompt}|${JSON.stringify(profile || {})}|${mode}|ctx:${hasContext}`;
    return crypto.createHash('md5').update(rawKey).digest('hex');
  }

  private async _resilientFallback(activeMode: MediaType | 'both'): Promise<IAIFilters> {
    console.log('🆘 [AI] Fallback resiliente activado.');
    
    // Tratamos de buscar las tendencias globales en la caché como último recurso
    try {
      const trendKey = this._generateCacheKey('Recomienda las 15 mejores películas y series tendencia actuales de alta calidad.', null, 'both', false);
      const staleTrends = await AICache.findOne({ promptKey: trendKey });
      if (staleTrends) {
        console.log('💡 [AI] Sirviendo tendencias cacheadas ante saturación de API.');
        return { 
          ...staleTrends.response, 
          source: 'stale_while_error',
          advisory: 'Servidores saturados. Mostrando tendencias globales.',
          narrative_justification: 'Mis disculpas cinéfilas, el Radar está experimentando una alta demanda. Mientras recupero mi total fluidez, aquí tienes las tendencias mundiales más potentes de hoy.'
        };
      }
    } catch (err) {}

    // Fallback maestro: Lista pre-aprobada si Mongo está vacío (v26.0)
    console.log('🚨 [AI] Activando Fallback Maestro Hardcoded (V26.0).');
    return {
      source: 'master_fallback',
      interaction_type: 'INITIAL',
      internal_reasoning: 'Circuit Breaker full trigger. MongoDB empty.',
      movie_titles: [
        'Dune: Part Two', 'Oppenheimer', 'The Batman', 'Everything Everywhere All at Once', 
        'Spider-Man: Across the Spider-Verse', 'The Last of Us', 'Succession', 'The Bear',
        'Severance', 'Top Gun: Maverick', 'Avatar: The Way of Water', 'John Wick: Chapter 4',
        'Guardians of the Galaxy Vol. 3', 'Barbie', 'Peaky Blinders'
      ],
      movie_selection: [
        { title: 'Dune: Part Two', year: 2024, type: 'movie' },
        { title: 'Oppenheimer', year: 2023, type: 'movie' },
        { title: 'The Batman', year: 2022, type: 'movie' },
        { title: 'Everything Everywhere All at Once', year: 2022, type: 'movie' },
        { title: 'The Last of Us', year: 2023, type: 'tv' },
        { title: 'Succession', year: 2018, type: 'tv' },
        { title: 'The Bear', year: 2022, type: 'tv' },
        { title: 'Severance', year: 2022, type: 'tv' },
        { title: 'Top Gun: Maverick', year: 2022, type: 'movie' },
        { title: 'John Wick: Chapter 4', year: 2023, type: 'movie' }
      ],
      media_type: activeMode,
      advisory: 'Radar en enfriamiento. Mostrando clásicos modernos.',
      narrative_justification: 'El Radar de StreamMatch ha entrado en modo de enfriamiento por alta demanda. Mientras recargamos las baterías, he seleccionado esta colección maestra de obras imprescindibles y grandes *blockbusters* recientes para que nunca te quedes sin opciones.',
    };
  }


  getGenreId(genreName: string, mediaType: MediaType): number | undefined {
    return getGenreId(genreName, mediaType);
  }

  // ─── PRIVATE ──────────────────────────────────────────────────────────────

  private async _callWithRetry(
    client: OpenAI,
    model: string,
    prompt: string,
    userProfile: ITasteProfile | null | undefined,
    signal: AbortSignal | undefined,
    activeMode: MediaType | 'both',
    userName: string,
    conversationalContext?: string,
    history: any[] = []
  ): Promise<IAIFilters | null> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const raw = await this._callLLM(client, model, prompt, userProfile, signal, activeMode, userName, conversationalContext, history);
        const parsed = this._parseAndValidate(raw);
        if (parsed !== null) {
          console.log(`🍷 [SOMMELIER v14.3] ${parsed.movie_selection.length} títulos seleccionados.`);
          console.log(`🧠 [COT] reasoning: ${parsed.internal_reasoning.substring(0, 100)}...`);
          return { ...parsed, source: 'sommelier_v14.3_70b' };
        }
        console.warn(`⚠️ [AI] Respuesta inválida en intento ${attempt}/${this.MAX_RETRIES}. Reintentando...`);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') throw error;
        const status = (error as { status?: number }).status;
        if (status === 429) {
          if (client === this.groq) {
            await this._setLock();
            console.error('❌ [AI] Rate limit (429) en Groq. Circuit Breaker 60s.');
          } else {
            console.error('❌ [AI] Rate limit (429) en OpenAI. (Posible cuenta sin fondos/créditos)');
          }
          return null;
        }
        if (status === 401) {
           console.error(`❌ [AI] No autorizado (401) en ${client === this.groq ? 'Groq' : 'OpenAI'}. Revisa la API KEY.`);
           return null;
        }
        console.error(`❌ [AI] Error intento ${attempt}:`, error instanceof Error ? error.message : error);
      }
    }
    return null;
  }

  private async _callLLM(
    client: OpenAI,
    model: string,
    prompt: string,
    userProfile: ITasteProfile | null | undefined,
    signal: AbortSignal | undefined,
    activeMode: MediaType | 'both',
    userName: string,
    conversationalContext?: string,
    history: any[] = []
  ): Promise<unknown> {
    
    // v32.1: Construcción de Payload Optimizado (JSON Stripper)
    const messages: any[] = [
      { role: 'system', content: buildSystemPrompt(userProfile, activeMode, (process.env.AVAILABLE_PLATFORMS?.split(',') || []), userName, conversationalContext) }
    ];

    // Inyectar historial procesado
    history.forEach(turn => {
      messages.push({ role: 'user', content: turn.prompt });
      messages.push({ role: 'assistant', content: stripJSONContent(turn.aiResponse) });
    });

    // ÚLTIMO mensaje (query actual)
    messages.push({ role: 'user', content: prompt });

    console.log(`📡 [AI Payload] Enviando ${messages.length} mensajes optimizados (JSON Stripped).`);

    const response = await client.chat.completions.create(
      {
        model,
        messages,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      },
      { signal }
    );

    const content = response.choices[0]?.message?.content ?? '{}';
    try {
      return JSON.parse(content);
    } catch {
      console.warn('⚠️ [AI] JSON malformado del LLM:', content.slice(0, 150));
      return {};
    }
  }

  private _parseAndValidate(raw: unknown): z.infer<typeof AIResponseSchema> | null {
    const result = AIResponseSchema.safeParse(raw);
    if (result.success) return result.data;

    // Intento de recuperación parcial
    if (typeof raw === 'object' && raw !== null) {
      const partial = AIResponseSchema.safeParse({ ...(raw as object) });
      if (partial.success) return partial.data;
    }

    console.warn('⚠️ [AI] Zod validation failed:', JSON.stringify(result.error.issues));
    return null;
  }

  private _localFallback(activeMode: MediaType | 'both'): IAIFilters {
    console.log('🆘 [AI] Fallback local activado.');
    return {
      source: 'local_fallback',
      interaction_type: 'INITIAL',
      internal_reasoning: 'Error de conexión con el cerebro 70B.',
      movie_selection: [],
      movie_titles: [],
      media_type: activeMode,
      advisory: 'Servicio de IA temporalmente no disponible. Intenta de nuevo.',
      narrative_justification: 'Mis disculpas, estoy teniendo dificultades para conectar con mi biblioteca cinematográfica. Por favor, intenta de nuevo en unos instantes.',
    };
  }
}

export const aiService = new AIService();
export default aiService;
