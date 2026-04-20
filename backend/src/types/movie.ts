export interface IMedia {
  id: number;
  title?: string;        // Usado por Películas
  name?: string;         // Usado por Series
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string; // Usado por Películas
  first_air_date?: string; // Usado por Series
  vote_average: number;
  genre_ids: number[];
  popularity: number;
  media_type: 'movie' | 'tv';
  premiumMetadata?: {
    brandColor: string;
    logo: string;
    platformName: string;
  } | null;
}

export interface TMDBMediaResponse {
  page: number;
  results: IMedia[];
  total_pages: number;
  total_results: number;
  totalRawResults?: number;
}
