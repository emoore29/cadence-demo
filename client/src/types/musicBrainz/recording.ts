export interface RecordingSearchResult {
  created: string;
  count: number;
  offset: number;
  recordings: Recording[];
}

export interface Recording {
  id: string;
  score: string;
  title: string;
  length: number;
  video: any;
  "artist-credit": ArtistCredit[];
  "first-release-date": string;
  releases: Release[];
  isrcs: Isrc[];
  tags?: Tag[];
}

export interface ArtistCredit {
  artist: Artist;
}

export interface Artist {
  id: string;
  name: string;
  "sort-name": string;
}

export interface Release {
  id: string;
  title: string;
  "status-id": string;
  status: string;
  "release-group": ReleaseGroup;
  date: string;
  country: string;
  "release-events": Event[];
  "track-count": number;
  media: Medum[];
  "artist-credit"?: ArtistCredit2[];
}

export interface ReleaseGroup {
  id: string;
  "primary-type": string;
  "secondary-types"?: string[];
}

export interface Event {
  date: string;
  area: Area;
}

export interface Area {
  id: string;
  name: string;
  "sort-name": string;
  "iso-3166-1-codes": string[];
}

export interface Medum {
  position: number;
  format: string;
  track: Track[];
  "track-count": number;
  "track-offset": number;
}

export interface Track {
  id: string;
  number: string;
  title: string;
  length: number;
}

export interface ArtistCredit2 {
  artist: Artist2;
}

export interface Artist2 {
  id: string;
  name: string;
  "sort-name": string;
}

export interface Isrc {
  id: string;
}

export interface Tag {
  count: number;
  name: string;
}
