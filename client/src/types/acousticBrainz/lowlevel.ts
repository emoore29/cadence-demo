export interface LowLevelRes {
  lowlevel: Lowlevel;
  metadata: Metadata;
  rhythm: Rhythm;
  tonal: Tonal;
}

export interface Lowlevel {
  average_loudness: number;
  barkbands: Barkbands;
  barkbands_crest: BarkbandsCrest;
  barkbands_flatness_db: BarkbandsFlatnessDb;
  barkbands_kurtosis: BarkbandsKurtosis;
  barkbands_skewness: BarkbandsSkewness;
  barkbands_spread: BarkbandsSpread;
  dissonance: Dissonance;
  dynamic_complexity: number;
  erbbands: Erbbands;
  erbbands_crest: ErbbandsCrest;
  erbbands_flatness_db: ErbbandsFlatnessDb;
  erbbands_kurtosis: ErbbandsKurtosis;
  erbbands_skewness: ErbbandsSkewness;
  erbbands_spread: ErbbandsSpread;
  gfcc: Gfcc;
  hfc: Hfc;
  melbands: Melbands;
  melbands_crest: MelbandsCrest;
  melbands_flatness_db: MelbandsFlatnessDb;
  melbands_kurtosis: MelbandsKurtosis;
  melbands_skewness: MelbandsSkewness;
  melbands_spread: MelbandsSpread;
  mfcc: Mfcc;
  pitch_salience: PitchSalience;
  silence_rate_20dB: SilenceRate20dB;
  silence_rate_30dB: SilenceRate30dB;
  silence_rate_60dB: SilenceRate60dB;
  spectral_centroid: SpectralCentroid;
  spectral_complexity: SpectralComplexity;
  spectral_contrast_coeffs: SpectralContrastCoeffs;
  spectral_contrast_valleys: SpectralContrastValleys;
  spectral_decrease: SpectralDecrease;
  spectral_energy: SpectralEnergy;
  spectral_energyband_high: SpectralEnergybandHigh;
  spectral_energyband_low: SpectralEnergybandLow;
  spectral_energyband_middle_high: SpectralEnergybandMiddleHigh;
  spectral_energyband_middle_low: SpectralEnergybandMiddleLow;
  spectral_entropy: SpectralEntropy;
  spectral_flux: SpectralFlux;
  spectral_kurtosis: SpectralKurtosis;
  spectral_rms: SpectralRms;
  spectral_rolloff: SpectralRolloff;
  spectral_skewness: SpectralSkewness;
  spectral_spread: SpectralSpread;
  spectral_strongpeak: SpectralStrongpeak;
  zerocrossingrate: Zerocrossingrate;
}

export interface Barkbands {
  dmean: number[];
  dmean2: number[];
  dvar: number[];
  dvar2: number[];
  max: number[];
  mean: number[];
  median: number[];
  min: number[];
  var: number[];
}

export interface BarkbandsCrest {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface BarkbandsFlatnessDb {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface BarkbandsKurtosis {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface BarkbandsSkewness {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface BarkbandsSpread {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface Dissonance {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface Erbbands {
  dmean: number[];
  dmean2: number[];
  dvar: number[];
  dvar2: number[];
  max: number[];
  mean: number[];
  median: number[];
  min: number[];
  var: number[];
}

export interface ErbbandsCrest {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface ErbbandsFlatnessDb {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface ErbbandsKurtosis {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface ErbbandsSkewness {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface ErbbandsSpread {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface Gfcc {
  cov: number[][];
  icov: number[][];
  mean: number[];
}

export interface Hfc {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface Melbands {
  dmean: number[];
  dmean2: number[];
  dvar: number[];
  dvar2: number[];
  max: number[];
  mean: number[];
  median: number[];
  min: number[];
  var: number[];
}

export interface MelbandsCrest {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface MelbandsFlatnessDb {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface MelbandsKurtosis {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface MelbandsSkewness {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface MelbandsSpread {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface Mfcc {
  cov: number[][];
  icov: number[][];
  mean: number[];
}

export interface PitchSalience {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SilenceRate20dB {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SilenceRate30dB {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SilenceRate60dB {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralCentroid {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralComplexity {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralContrastCoeffs {
  dmean: number[];
  dmean2: number[];
  dvar: number[];
  dvar2: number[];
  max: number[];
  mean: number[];
  median: number[];
  min: number[];
  var: number[];
}

export interface SpectralContrastValleys {
  dmean: number[];
  dmean2: number[];
  dvar: number[];
  dvar2: number[];
  max: number[];
  mean: number[];
  median: number[];
  min: number[];
  var: number[];
}

export interface SpectralDecrease {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralEnergy {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralEnergybandHigh {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralEnergybandLow {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralEnergybandMiddleHigh {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralEnergybandMiddleLow {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralEntropy {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralFlux {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralKurtosis {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralRms {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralRolloff {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralSkewness {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralSpread {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface SpectralStrongpeak {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface Zerocrossingrate {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface Metadata {
  audio_properties: AudioProperties;
  tags: Tags;
  version: Version;
}

export interface AudioProperties {
  analysis_sample_rate: number;
  bit_rate: number;
  codec: string;
  downmix: string;
  equal_loudness: number;
  length: number;
  lossless: boolean;
  md5_encoded: string;
  replay_gain: number;
  sample_rate: number;
}

export interface Tags {
  acoustid_id: string[];
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
  disctotal: string[];
  file_name: string;
  genre: string[];
  isrc: string[];
  label: string[];
  media: string[];
  musicbrainz_albumartistid: string[];
  musicbrainz_albumid: string[];
  musicbrainz_artistid: string[];
  musicbrainz_recordingid: string[];
  musicbrainz_releasegroupid: string[];
  originaldate: string[];
  releasecountry: string[];
  releasestatus: string[];
  releasetype: string[];
  script: string[];
  title: string[];
  totaldiscs: string[];
  totaltracks: string[];
  tracknumber: string[];
  tracktotal: string[];
}

export interface Version {
  essentia: string;
  essentia_build_sha: string;
  essentia_git_sha: string;
  extractor: string;
}

export interface Rhythm {
  beats_count: number;
  beats_loudness: BeatsLoudness;
  beats_loudness_band_ratio: BeatsLoudnessBandRatio;
  beats_position: number[];
  bpm: number;
  bpm_histogram_first_peak_bpm: BpmHistogramFirstPeakBpm;
  bpm_histogram_first_peak_spread: BpmHistogramFirstPeakSpread;
  bpm_histogram_first_peak_weight: BpmHistogramFirstPeakWeight;
  bpm_histogram_second_peak_bpm: BpmHistogramSecondPeakBpm;
  bpm_histogram_second_peak_spread: BpmHistogramSecondPeakSpread;
  bpm_histogram_second_peak_weight: BpmHistogramSecondPeakWeight;
  danceability: number;
  onset_rate: number;
}

export interface BeatsLoudness {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface BeatsLoudnessBandRatio {
  dmean: number[];
  dmean2: number[];
  dvar: number[];
  dvar2: number[];
  max: number[];
  mean: number[];
  median: number[];
  min: number[];
  var: number[];
}

export interface BpmHistogramFirstPeakBpm {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface BpmHistogramFirstPeakSpread {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface BpmHistogramFirstPeakWeight {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface BpmHistogramSecondPeakBpm {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface BpmHistogramSecondPeakSpread {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface BpmHistogramSecondPeakWeight {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface Tonal {
  chords_changes_rate: number;
  chords_histogram: number[];
  chords_key: string;
  chords_number_rate: number;
  chords_scale: string;
  chords_strength: ChordsStrength;
  hpcp: Hpcp;
  hpcp_entropy: HpcpEntropy;
  key_key: string;
  key_scale: string;
  key_strength: number;
  thpcp: number[];
  tuning_diatonic_strength: number;
  tuning_equal_tempered_deviation: number;
  tuning_frequency: number;
  tuning_nontempered_energy_ratio: number;
}

export interface ChordsStrength {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}

export interface Hpcp {
  dmean: number[];
  dmean2: number[];
  dvar: number[];
  dvar2: number[];
  max: number[];
  mean: number[];
  median: number[];
  min: number[];
  var: number[];
}

export interface HpcpEntropy {
  dmean: number;
  dmean2: number;
  dvar: number;
  dvar2: number;
  max: number;
  mean: number;
  median: number;
  min: number;
  var: number;
}
