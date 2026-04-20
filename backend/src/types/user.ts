import { Document, Types } from 'mongoose';

export type MediaType = 'movie' | 'tv';

export interface IMediaItem {
  id: number;
  media_type: MediaType;
}

export type StreamingPlatform = 'netflix' | 'hbo_max' | 'disney_plus' | 'amazon_prime' | 'apple_tv' | 'skyshowtime' | 'movistar_plus' | 'filmin';

export interface ITasteProfile {
  genres: string[];
  pace: 'frenetic' | 'balanced' | 'slow';
  tone: 'commercial' | 'indie' | 'balanced';
  era: 'classics' | '80s-90s' | '2000s' | 'modern';
  dealbreakers: string[];
}

export interface IUser {
  name: string;
  email: string;
  password?: string;
  streamingPlatforms: StreamingPlatform[];
  watchedMovies: IMediaItem[];
  region?: string;
  tasteProfile?: ITasteProfile | null; // v10.0
  hasCompletedOnboarding?: boolean; // v10.0
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}
