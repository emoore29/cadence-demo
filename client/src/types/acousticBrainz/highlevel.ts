export interface HighLevelRes {
  highlevel: Highlevel;
  metadata: Metadata;
}

export interface Highlevel {
  danceability: Danceability;
  gender: Gender;
  genre_dortmund: GenreDortmund;
  genre_electronic: GenreElectronic;
  genre_rosamerica: GenreRosamerica;
  genre_tzanetakis: GenreTzanetakis;
  ismir04_rhythm: Ismir04Rhythm;
  mood_acoustic: MoodAcoustic;
  mood_aggressive: MoodAggressive;
  mood_electronic: MoodElectronic;
  mood_happy: MoodHappy;
  mood_party: MoodParty;
  mood_relaxed: MoodRelaxed;
  mood_sad: MoodSad;
  moods_mirex: MoodsMirex;
  timbre: Timbre;
  tonal_atonal: TonalAtonal;
  voice_instrumental: VoiceInstrumental;
}

export interface Danceability {
  all: All;
  probability: number;
  value: string;
  version: Version;
}

export interface All {
  danceable: number;
  not_danceable: number;
}

export interface Version {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface Gender {
  all: All2;
  probability: number;
  value: string;
  version: Version2;
}

export interface All2 {
  female: number;
  male: number;
}

export interface Version2 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface GenreDortmund {
  all: All3;
  probability: number;
  value: string;
  version: Version3;
}

export interface All3 {
  alternative: number;
  blues: number;
  electronic: number;
  folkcountry: number;
  funksoulrnb: number;
  jazz: number;
  pop: number;
  raphiphop: number;
  rock: number;
}

export interface Version3 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface GenreElectronic {
  all: All4;
  probability: number;
  value: string;
  version: Version4;
}

export interface All4 {
  ambient: number;
  dnb: number;
  house: number;
  techno: number;
  trance: number;
}

export interface Version4 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface GenreRosamerica {
  all: All5;
  probability: number;
  value: string;
  version: Version5;
}

export interface All5 {
  cla: number;
  dan: number;
  hip: number;
  jaz: number;
  pop: number;
  rhy: number;
  roc: number;
  spe: number;
}

export interface Version5 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface GenreTzanetakis {
  all: All6;
  probability: number;
  value: string;
  version: Version6;
}

export interface All6 {
  blu: number;
  cla: number;
  cou: number;
  dis: number;
  hip: number;
  jaz: number;
  met: number;
  pop: number;
  reg: number;
  roc: number;
}

export interface Version6 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface Ismir04Rhythm {
  all: All7;
  probability: number;
  value: string;
  version: Version7;
}

export interface All7 {
  ChaChaCha: number;
  Jive: number;
  Quickstep: number;
  "Rumba-American": number;
  "Rumba-International": number;
  "Rumba-Misc": number;
  Samba: number;
  Tango: number;
  VienneseWaltz: number;
  Waltz: number;
}

export interface Version7 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface MoodAcoustic {
  all: All8;
  probability: number;
  value: string;
  version: Version8;
}

export interface All8 {
  acoustic: number;
  not_acoustic: number;
}

export interface Version8 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface MoodAggressive {
  all: All9;
  probability: number;
  value: string;
  version: Version9;
}

export interface All9 {
  aggressive: number;
  not_aggressive: number;
}

export interface Version9 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface MoodElectronic {
  all: All10;
  probability: number;
  value: string;
  version: Version10;
}

export interface All10 {
  electronic: number;
  not_electronic: number;
}

export interface Version10 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface MoodHappy {
  all: All11;
  probability: number;
  value: string;
  version: Version11;
}

export interface All11 {
  happy: number;
  not_happy: number;
}

export interface Version11 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface MoodParty {
  all: All12;
  probability: number;
  value: string;
  version: Version12;
}

export interface All12 {
  not_party: number;
  party: number;
}

export interface Version12 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface MoodRelaxed {
  all: All13;
  probability: number;
  value: string;
  version: Version13;
}

export interface All13 {
  not_relaxed: number;
  relaxed: number;
}

export interface Version13 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface MoodSad {
  all: All14;
  probability: number;
  value: string;
  version: Version14;
}

export interface All14 {
  not_sad: number;
  sad: number;
}

export interface Version14 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface MoodsMirex {
  all: All15;
  probability: number;
  value: string;
  version: Version15;
}

export interface All15 {
  Cluster1: number;
  Cluster2: number;
  Cluster3: number;
  Cluster4: number;
  Cluster5: number;
}

export interface Version15 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface Timbre {
  all: All16;
  probability: number;
  value: string;
  version: Version16;
}

export interface All16 {
  bright: number;
  dark: number;
}

export interface Version16 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface TonalAtonal {
  all: All17;
  probability: number;
  value: string;
  version: Version17;
}

export interface All17 {
  atonal: number;
  tonal: number;
}

export interface Version17 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface VoiceInstrumental {
  all: All18;
  probability: number;
  value: string;
  version: Version18;
}

export interface All18 {
  instrumental: number;
  voice: number;
}

export interface Version18 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface Metadata {
  audio_properties: AudioProperties;
  tags: Tags;
  version: Version19;
}

export interface AudioProperties {
  analysis_sample_rate: number;
  bit_rate: number;
  codec: string;
  downmix: string;
  equal_loudness: number;
  length: number;
  lossless: number;
  md5_encoded: string;
  replay_gain: number;
}

export interface Tags {
  album: string[];
  albumartist: string[];
  albumartistsort: string[];
  artist: string[];
  artistsort: string[];
  asin: string[];
  barcode: string[];
  catalognumber: string[];
  composer: string[];
  date: string[];
  discnumber: string[];
  encoding: string[];
  file_name: string;
  genre: string[];
  label: string[];
  language: string[];
  media: string[];
  mp3gain_album_minmax: string[];
  mp3gain_minmax: string[];
  "musicbrainz album release country": string[];
  "musicbrainz album status": string[];
  "musicbrainz album type": string[];
  musicbrainz_albumartistid: string[];
  musicbrainz_albumid: string[];
  musicbrainz_artistid: string[];
  musicbrainz_recordingid: string[];
  originaldate: string[];
  "release type": string[];
  replaygain_album_gain: string[];
  replaygain_album_peak: string[];
  replaygain_track_gain: string[];
  replaygain_track_peak: string[];
  "rip date": string[];
  "ripping tool": string[];
  script: string[];
  source: string[];
  title: string[];
  tracknumber: string[];
  url: string[];
}

export interface Version19 {
  highlevel: Highlevel2;
  lowlevel: Lowlevel;
}

export interface Highlevel2 {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
  gaia: string;
  gaia_git_sha: string;
  models_essentia_git_sha: string;
}

export interface Lowlevel {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
}
