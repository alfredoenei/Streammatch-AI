export interface IPremiumMetadata {
  brandColor: string;
  logo: string;
  platformName: string;
  url?: string; // v34.7: Added for deep links
}

export interface ISource {
  platform: string;
  url: string;
  name: string;
}

export interface IAvailability {
  isAvailable: boolean;
  sources?: ISource[];
}

export interface Movie {
  id: number;
  title?: string;        // Usado por Películas
  name?: string;         // Usado por Series
  original_title?: string; // v34.5
  local_title?: string;    // v34.5
  overview: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string; // Usado por Películas
  first_air_date?: string; // Usado por Series
  vote_average?: number;
  genre_ids?: number[];
  popularity?: number;
  media_type: 'movie' | 'tv';
  isExternal?: boolean;
  premiumMetadata?: IPremiumMetadata | null;
  isAvailable?: boolean;
  allAvailableProviders?: ISource[]; // Changed from any[]
  // v14.1 Aggregator fields
  posterUrl?: string | null;
  backdropUrl?: string | null;
  trailerUrl?: string | null;
  voteAverage?: number | null;
  year?: number;
  availability?: IAvailability;
}

export interface DetailedMovie extends Movie {
  runtime?: number;      // Películas
  episode_run_time?: number[]; // Series
  genres?: { id: number; name: string }[];
  videos?: {
    results: {
      key: string;
      site: string;
      type: string;
    }[];
  };
  number_of_seasons?: number; // Series
  number_of_episodes?: number; // Series
}

export interface MovieResponse {
  success: boolean;
  data: Movie[];
  message?: string;
  narrative?: string | null;
  source?: string;
  meta?: {
    total?: number;
    totalRaw?: number;
    isExpanded?: boolean;
    region?: string;
    media_type?: 'movie' | 'tv' | 'both';
    interaction_type?: 'INITIAL' | 'REFINEMENT' | 'EXPANSION';
  };
  isAbort?: boolean;
}

export interface ISessionHistoryItem {
  prompt: string;
  aiResponse: string;
  timestamp: string;
}

export interface ISessionHistory {
  success: boolean;
  data: {
    history: ISessionHistoryItem[];
    lastResults?: Movie[];
    lastNarrative?: string;
    lastMessage?: string;
  };
}

export interface IPlatform {
  id: number;
  name: string;
  logo: string;
  brandColor: string;
}
