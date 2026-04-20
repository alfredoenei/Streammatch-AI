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

console.log('✅ [BOOT] AI Service v13.1 cargado.');

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT v16.2 — EL SOMMELIER 70B
// ─────────────────────────────────────────────────────────────────────────────

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
    activeMode === 'tv'
      ? 'Recomienda ÚNICAMENTE Series de TV.'
      : activeMode === 'movie'
        ? 'Recomienda ÚNICAMENTE Películas.'
        : 'Combina películas y series con criterio de experto.';

  return `Eres el Sommelier de StreamMatch AI. Actúa como un experto de videoclub culto, apasionado y con opinión propia.

${profileContext}
${platformsContext}
${modeInstruction}

═══════════════════════════════════════
// REGLAS DE ORO DE CURADURÍA (v16.5):
// ═══════════════════════════════════════
0. IDENTIDAD ABSOLUTA: Prioriza títulos exactos. Usa nombres completos si existe ambigüedad (Ej: "El Camino: A Breaking Bad Movie"). Asegúrate de que el "year" sea exacto.
9. ELASTICIDAD Y UTILIDAD: Si lo que el usuario pide es extremadamente específico y no existe una coincidencia 1:1, NO devuelvas una lista vacía. En su lugar, busca el contenido que más se aproxime en temática, tono, equipo técnico o atmósfera. Explica en la \`narrative_justification\` por qué estas son las mejores alternativas disponibles.
1. CONCIENCIA DE TURNO (CERO SALUDOS REPETIDOS):
   - Si es el primer mensaje (interaction_type: INITIAL), saluda: "¡${timeGreeting} ${firstName}!".
   - Si es un turno de refinamiento (REFINEMENT) o expansión (EXPANSION), ESTÁ TOTALMENTE PROHIBIDO saludar de nuevo o decir "Hola". Continúa la charla de forma natural.
2. RECONOCIMIENTO DEL 'DELTA' (EL CAMBIO): En turnos de refinamiento, tu narrativa de \`narrative_justification\` DEBE centrarse en reconocer lo que el usuario acaba de pedir (ej: "Entendido, quitamos el terror y nos enfocamos en el suspenso puro...").
3. BREVEDAD EN SEGUIMIENTOS: En REFINEMENT/EXPANSION, sé directo. No vuelvas a explicar de qué tratan los títulos que ya mencionaste antes. Justifica solo las novedades o el nuevo ajuste del conjunto.
4. MANTENIMIENTO DE TÍTULOS: Es válido (y recomendable) mantener títulos de la respuesta anterior si siguen cumpliendo los requisitos, pero no gastes texto en describirlos de nuevo.
5. CITAS OBLIGATORIAS: Menciona títulos de tu "movie_selection" en **Negritas** dentro de la narrativa.
6. VOLUMEN PROFUNDO: El \`movie_selection\` DEBE contener entre 12 y 15 títulos.
7. MEMORIA CONTINUA: ${conversationalContext ? 'ESTAS EN MEDIO DE UNA CONVERSACIÓN. Revisa el historial. Tu "interaction_type" debe ser REFINEMENT o EXPANSION.' : 'NUEVA BÚSQUEDA. Tu "interaction_type" es INITIAL.'}
8. JSON STRICT: Devuelve siempre el esquema solicitado.

Tu respuesta debe ser un JSON estricto:
{
  "interaction_type": "INITIAL" | "REFINEMENT" | "EXPANSION",
  "internal_reasoning": string,
  "narrative_justification": string (Markdown rico, breve en refinamientos),
  "movie_selection": [
    { "title": string, "year": number, "type": "movie" | "tv" }
  ],
  "advisory": string (short status)
}

${conversationalContext ? `\n--- HISTORIAL DE CONVERSACIÓN ---\n${conversationalContext}\n---------------------------------\n` : ''}`;
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
      console.log('🍷 [RADAR v13.1] Sommelier 70B activado.');
    }
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    if (openaiKey) this.openai = new OpenAI({ apiKey: openaiKey });
  }

  // ─── PUBLIC ───────────────────────────────────────────────────────────────

  async translatePromptToFilters(
    prompt: string,
    userProfile?: ITasteProfile | null,
    signal?: AbortSignal,
    activeMode: MediaType | 'both' = 'both',
    userName: string = 'Usuario',
    conversationalContext?: string
  ): Promise<IAIFilters> {
    // Si hay context (sesión viva), bypasseamos el cache tradicional
    const cacheKey = buildCacheKey(prompt, userProfile, activeMode);
    if (!conversationalContext && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      console.log(`♻️ [CACHE] Resultado recuperado para: "${prompt}" (Source: ${cached.source})`);
      return cached;
    }

    if (this.groq && Date.now() >= this.circuitBreakerUntil) {
      const result = await this._callWithRetry(
        this.groq, this.GROQ_MODEL, prompt, userProfile, signal, activeMode, userName, conversationalContext
      );
      if (result !== null) {
        if (!conversationalContext) this.cache.set(cacheKey, result);
        return result;
      }
    }

    return this._localFallback(activeMode);
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
    conversationalContext?: string
  ): Promise<IAIFilters | null> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const raw = await this._callLLM(client, model, prompt, userProfile, signal, activeMode, userName, conversationalContext);
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
          this.circuitBreakerUntil = Date.now() + 60_000;
          console.error('❌ [AI] Rate limit (429). Circuit Breaker 60s.');
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
    conversationalContext?: string
  ): Promise<unknown> {
    // Obtenemos las plataformas desde el contexto de la petición si es posible, 
    // pero para el prompt del sistema usaremos las AVAILABLE_PLATFORMS por defecto si no se pasan
    const response = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: 'system', content: buildSystemPrompt(userProfile, activeMode, (process.env.AVAILABLE_PLATFORMS?.split(',') || []), userName, conversationalContext) },
          { role: 'user', content: prompt },
        ],
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
