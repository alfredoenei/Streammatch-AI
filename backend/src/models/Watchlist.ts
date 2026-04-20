import { Schema, model, Document, Types } from 'mongoose';

export interface IWatchlistItem extends Document {
  userId: Types.ObjectId;
  movie: {
    id: number;
    title: string;
    media_type: 'movie' | 'tv';
    poster_path?: string;
    year?: number;
    vote_average?: number;
    availability?: any;
    premiumMetadata?: any;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const watchlistSchema = new Schema<IWatchlistItem>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID de usuario es obligatorio']
  },
  movie: {
    type: Schema.Types.Mixed,
    required: [true, 'Los datos de la película son obligatorios']
  }
}, { 
  timestamps: true 
});

/**
 * ÍNDICE COMPUESTO ÚNICO (Staff Engineer Directive v18.1)
 * Evita duplicados si el usuario hace clic rápido (concurrencia).
 * Se indexa userId y el ID de la película dentro del objeto.
 */
watchlistSchema.index({ userId: 1, 'movie.id': 1 }, { unique: true });

export const Watchlist = model<IWatchlistItem>('Watchlist', watchlistSchema);
