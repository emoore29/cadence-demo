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

export interface SampleTrack {
  href: string;
  id: string;
  name: string;
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
  preview_url: string;
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
  minBpm: number;
  maxBpm: number;
  valence: number;
  danceability: number;
  energy: number;
  instrumental: boolean;
  acoustic: boolean;
  source: string;
}

export interface PlaylistData {
  name: string;
  description: string;
  public: boolean;
}

export interface PlaylistObject {
  track: Track;
  features: TrackFeatures;
}
