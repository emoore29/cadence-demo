export interface User {
  country: string;
  display_name: string;
  email: string;
  explicit_content: Object;
  external_urls: Object;
  followers: Object;
  href: string;
  id: string;
  images: Array<{
    height: number;
    url: string;
    width: number;
  }>;
  product: string;
  type: string;
  uri: string;
}

export interface Track {
  album: {
    album_type: string;
    total_tracks: number;
    available_markets: string[];
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    images: {
      url: string;
      height: number;
      width: number;
    }[];
    name: string;
    release_date: string;
    release_date_precision: string;
    restrictions?: {
      reason: string;
    };
    type: string;
    uri: string;
    artists: {
      external_urls: {
        spotify: string;
      };
      href: string;
      id: string;
      name: string;
      type: string;
      uri: string;
    }[];
  };
  artists: {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
  }[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: {
    isrc?: string;
    ean?: string;
    upc?: string;
  };
  external_urls: {
    spotify?: string;
  };
  href: string;
  id: string;
  is_playable?: boolean;
  linked_from?: {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
  } | null;
  restrictions?: {
    reason: string;
  };
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: string;
  uri: string;
  is_local: boolean;
}

export interface SavedTrack {
  added_at: string;
  track: Track;
}

export interface Library {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
  items: SavedTrack[];
}

export interface FeaturesLibrary {
  audio_features: TrackFeatures[];
}

export interface TrackFeatures {
  acousticness: number;
  analysis_url: string;
  danceability: number;
  duration_ms: number;
  energy: number;
  id: string;
  instrumentalness: number;
  key: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  time_signature: number;
  track_href: string;
  type: string;
  uri: string;
  valence: number;
}

export interface StoredPlaylist {
  name: string;
  id: string;
  tracks: TrackObject[];
}

export interface LowLevelFeatures {
  bpm: number;
  key: string;
  mode: string;
}

export interface HighLevelFeatures {
  danceability: string;
  gender: string;
  acoustic: string;
  aggressive: string;
  electronic: string;
  happy: string;
  party: string;
  relaxed: string;
  sad: string;
  timbre: string;
}

export interface MbidAndTags {
  mbid: string;
  tags: string[];
}

export interface MetaBrainzFeatures {
  tags: string[];
  bpm: number;
  key: string;
  mode: string;
  danceability: string;
  gender: string;
  acoustic: string;
  aggressive: string;
  electronic: string;
  happy: string;
  party: string;
  relaxed: string;
  sad: string;
  timbre: string;
}

export interface StoredTrack {
  track: Track;
  features: TrackFeatures;
  order: number;
}

export interface DemoTrack {
  track: Track;
  features: TrackFeatures;
}

export interface NumericFeatures {
  acousticness: number;
  danceability: number;
  duration_ms: number;
  energy: number;
  instrumentalness: number;
  key: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  time_signature: number;
  valence: number;
}

export interface GetRecommendationsOptions {
  anyTempo: boolean;
  targetRecs?: number;
  chosenSeeds?: ChosenSeeds;
}

export interface ChosenSeeds {
  genres: string[];
  tracks: string[];
  artists: string[];
}

export interface Artist {
  external_urls: {
    spotify: string;
  };
  followers: {
    href: string;
    total: number;
  };
  genres: string[];
  href: string;
  id: string;
  images: {
    url: string;
    height: number;
    width: number;
  }[];
  name: string;
  popularity: number;
  type: string;
  uri: string;
}

export interface TopArtists {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
  items: Artist[];
}

export interface TopTracks {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
  items: Track[];
}

export interface FormValues {
  minTempo: number;
  maxTempo: number;
  key: string;
  mode: string;
  danceability: string;
  gender: string;
  acoustic: string;
  aggressive: string;
  electronic: string;
  happy: string;
  party: string;
  relaxed: string;
  sad: string;
  timbre: string;
  source: string;
  target: number;
}

export interface PlaylistData {
  name: string;
  description: string;
  public: boolean;
}

export interface TrackSeedForm {
  track: string;
}

export interface ArtistSeedForm {
  artist: string;
}

export interface TrackObject {
  track: Track;
  features: MetaBrainzFeatures;
  saved?: boolean;
  pinned?: boolean;
}

export type StoreName =
  | "savedTracks"
  | "topArtists"
  | "topTracks"
  | "playlists";

export type TrackStoreName = "savedTracks" | "topTracks";

export interface TopTrackObject {
  track: Track;
  features: MetaBrainzFeatures;
  saved?: boolean;
  order?: number;
}

export interface Filters {
  minTempo: number | undefined;
  maxTempo: number | undefined;
  targetValence: string;
  targetDanceability: string;
  targetEnergy: string;
  targetInstrumentalness: string;
  targetAcousticness: string;
}

export interface NumericFilters {
  minTempo?: number;
  maxTempo?: number;
  targetValence?: number;
  targetDanceability?: number;
  targetEnergy?: number;
  targetInstrumentalnes?: number;
  targetAcousticness?: number;
}

export interface Recommendations {
  seeds: {
    afterFilteringSize: number;
    afterRelinkingSize: number;
    href: string;
    id: string;
    initialPoolSize: number;
    type: string;
  }[];
  tracks: Track[];
}

export type FeaturesDropDown = "Any" | "Low" | "Medium" | "High";
