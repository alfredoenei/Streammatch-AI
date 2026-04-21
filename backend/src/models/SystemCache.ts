import mongoose, { Schema, Document } from 'mongoose';

/**
 * SystemCache Model v26.0 — Global Availability & Circuit Breakers
 * 
 * Propósito: 
 * 1. Almacenar resultados de Watchmode (TTL 24h) para evitar consumos masivos en la API.
 * 2. Persistir estados de Circuit Breaker para evitar 'request storms' tras reinicios.
 */

// 1. Watchmode Availability Cache
export interface IWatchmodeCache extends Document {
  cacheKey: string;
  sources: any[];
  createdAt: Date;
}

const WatchmodeCacheSchema = new Schema({
  cacheKey: { type: String, required: true, unique: true, index: true },
  sources: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now, index: { expires: '24h' } }
});

export const WatchmodeCache = mongoose.model<IWatchmodeCache>('WatchmodeCache', WatchmodeCacheSchema);

// 2. Persistent Circuit Breakers
export interface ICircuitBreaker extends Document {
  serviceId: string;
  lockedUntil: number;
}

const CircuitBreakerSchema = new Schema({
  serviceId: { type: String, required: true, unique: true, index: true },
  lockedUntil: { type: Number, required: true }
});

export const CircuitBreaker = mongoose.model<ICircuitBreaker>('CircuitBreaker', CircuitBreakerSchema);
