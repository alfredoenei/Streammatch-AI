/**
 * Centralized Provider Registry for StreamMatch AI.
 * Maps platform keys to official branding, high-res logos, and brand colors.
 */

export interface PlatformMetadata {
  id: string;
  name: string;
  color: string;
  logo: string;
  tmdbIds: Record<string, number[]>; // Region-aware IDs
}

export const PLATFORMS: Record<string, PlatformMetadata> = {
  netflix: {
    id: 'netflix',
    name: 'Netflix',
    color: '#E50914',
    logo: 'https://image.tmdb.org/t/p/w500/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg',
    tmdbIds: { ES: [8], US: [8], MX: [8] }
  },
  hbo_max: {
    id: 'hbo_max',
    name: 'Max',
    color: '#5822ff',
    logo: 'https://image.tmdb.org/t/p/w500/jbe4gVSfRlbPTdESXhEKpornsfu.jpg',
    tmdbIds: { ES: [384, 1899], US: [1899], MX: [1899] }
  },
  disney_plus: {
    id: 'disney_plus',
    name: 'Disney+',
    color: '#0063E5',
    logo: 'https://image.tmdb.org/t/p/w500/97yvRBw1GzX7fXprcF80er19ot.jpg',
    tmdbIds: { ES: [337], US: [337], MX: [337] }
  },
  amazon_prime: {
    id: 'amazon_prime',
    name: 'Prime Video',
    color: '#00A8E1',
    logo: 'https://image.tmdb.org/t/p/w500/pvske1MyAoymrs5bguRfVqYiM9a.jpg',
    tmdbIds: { ES: [119, 9, 10], US: [9, 10, 119], MX: [119] }
  },
  apple_tv: {
    id: 'apple_tv',
    name: 'Apple TV+',
    color: '#000000',
    logo: 'https://image.tmdb.org/t/p/w500/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg',
    tmdbIds: { ES: [2, 350], US: [2, 350], MX: [2, 350] }
  },
  skyshowtime: {
    id: 'skyshowtime',
    name: 'SkyShowtime',
    color: '#21d4fd',
    logo: 'https://image.tmdb.org/t/p/w500/h0ZYcYHicKQ4Ixm5nOjqvwni5NG.jpg',
    tmdbIds: { ES: [1773] }
  },
  movistar_plus: {
    id: 'movistar_plus',
    name: 'Movistar+',
    color: '#50BE05',
    logo: 'https://image.tmdb.org/t/p/w500/f6TRLB3H4jDpFEZ0z2KWSSvu1SB.jpg',
    tmdbIds: { ES: [149] }
  },
  filmin: {
    id: 'filmin',
    name: 'Filmin',
    color: '#FFD000',
    logo: 'https://image.tmdb.org/t/p/w500/kO2SWXvDCHAquaUuTJBuZkTBAuU.jpg',
    tmdbIds: { ES: [63], MX: [63] }
  }
};

/**
 * Returns the list of all platform keys currently supported.
 */
export const AVAILABLE_PLATFORMS = Object.keys(PLATFORMS);
