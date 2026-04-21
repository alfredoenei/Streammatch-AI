import { Schema, model, Document } from 'mongoose';

export interface ITurn {
  prompt: string;
  interaction_type: 'INITIAL' | 'REFINEMENT' | 'EXPANSION';
  aiResponse: string; // The raw JSON string or narrative
  timestamp: Date;
}

export interface ILockedIdentity {
  id: number | string; // tmdbId or imdbId
  tmdbId: number | null;
  imdbId: string | null;
  title: string;
  year: number;
  type: 'movie' | 'tv';
  posterUrl: string | null;
}

export interface IRadarConversationDocument extends Document {
  userId: Schema.Types.ObjectId | string;
  threadId: string;
  originalPrompt: string;
  turns: ITurn[];
  lockedIdentities: Map<string, ILockedIdentity>; // Key: "title-year-type"
  lastResults: any[]; // v28.4 Snapshot de Películas
  lastNarrative: string | null; // v28.4 Snapshot Sommelier
  lastMessage: string | null; // v28.4 Snapshot Status
  lastAccessedAt: Date;
}

const TurnSchema = new Schema<ITurn>({
  prompt: { type: String, required: true },
  interaction_type: { 
    type: String, 
    enum: ['INITIAL', 'REFINEMENT', 'EXPANSION'], 
    required: true 
  },
  aiResponse: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const RadarConversationSchema = new Schema<IRadarConversationDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  threadId: { type: String, required: true, unique: true },
  originalPrompt: { type: String, required: true },
  turns: [TurnSchema],
  lockedIdentities: {
    type: Map,
    of: new Schema({
      id: { type: Schema.Types.Mixed, required: true },
      tmdbId: { type: Number, default: null },
      imdbId: { type: String, default: null },
      title: { type: String, required: true },
      year: { type: Number, required: true },
      type: { type: String, required: true },
      posterUrl: { type: String, default: null }
    }, { _id: false })
  },
  lastResults: { type: Schema.Types.Mixed, default: [] },
  lastNarrative: { type: String, default: null },
  lastMessage: { type: String, default: null },
  lastAccessedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// TTL Indexes: Limpiador de Sesiones (4 horas de inactividad)
RadarConversationSchema.index({ lastAccessedAt: 1 }, { expireAfterSeconds: 4 * 60 * 60 });

RadarConversationSchema.pre<IRadarConversationDocument>('save', function() {
  this.lastAccessedAt = new Date();
});

export const RadarConversation = model<IRadarConversationDocument>('RadarConversation', RadarConversationSchema);
