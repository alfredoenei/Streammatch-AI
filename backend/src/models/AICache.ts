import mongoose, { Schema, Document } from 'mongoose';
import { IAIFilters } from '../types/tmdb.types';

/**
 * AICache Model v25.0 — Semantic Persistence
 * 
 * Propósito: Almacenar resultados de la IA para evitar peticiones redundantes
 * y optimizar los límites de la API de OpenAI/Groq.
 */

export interface IAICache extends Document {
  promptKey: string;     // Hash o clave normalizada del prompt + contexto
  response: IAIFilters;  // El objeto de filtros validado
  createdAt: Date;
}

const AICacheSchema: Schema = new Schema({
  promptKey: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  response: { 
    type: Object, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: { expires: '24h' } // TTL Index: Expira automáticamente a las 24h
  }
});

export const AICache = mongoose.model<IAICache>('AICache', AICacheSchema);
export default AICache;
