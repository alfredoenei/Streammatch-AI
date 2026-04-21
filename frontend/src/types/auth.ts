import React from 'react';

export interface ITasteProfile {
  genres: string[];
  pace: 'frenetic' | 'balanced' | 'slow';
  tone: 'commercial' | 'indie' | 'balanced';
  era: 'classics' | '80s-90s' | '2000s' | 'modern';
  dealbreakers: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  streamingPlatforms: string[];
  watchedMovies: { id: number; media_type: 'movie' | 'tv' }[];
  tasteProfile?: ITasteProfile;
  hasCompletedOnboarding?: boolean;
}

export interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, streamingPlatforms: string[]) => Promise<void>;
  updateTasteProfile: (profile: ITasteProfile) => Promise<void>;
  resetTasteProfile: () => Promise<void>;
  logout: () => void;
}
