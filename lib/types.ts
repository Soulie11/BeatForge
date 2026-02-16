// ── Union types for genres and track kinds ──────────────────────────
export type Genre = "metal" | "rap" | "pop" | "jazz";
export type TrackKind = "bass" | "lead" | "drums" | "extras";

// ── Intersection type: base track info merged with playback state ───
type TrackInfo = {
  kind: TrackKind;
  label: string;
  icon: string;
};

type PlaybackState = {
  isMuted: boolean;
  volume: number;
};

export type TrackState = TrackInfo & PlaybackState;

// ── Genre configuration with Required<> and Readonly<> ──────────────
type GenreConfigBase = {
  name?: string;
  label: string;
  color: string;
  bpm: number;
  description?: string;
  tracks: ReadonlyArray<TrackInfo>;
};

export type GenreConfig = Readonly<Required<GenreConfigBase>>;

// ── Pick and Omit utility usage ─────────────────────────────────────
export type GenreSummary = Pick<GenreConfig, "name" | "label" | "color">;
export type GenreWithoutTracks = Omit<GenreConfig, "tracks">;

// ── Record usage for genre mapping ──────────────────────────────────
export type GenreMap = Record<Genre, GenreConfig>;

// ── Exclude usage ───────────────────────────────────────────────────
export type NonMetalGenre = Exclude<Genre, "metal">;

// ── Form step types ─────────────────────────────────────────────────
export type FormStep = "welcome" | "genre" | "preferences";

// ── Mixer session data ──────────────────────────────────────────────
export type MixerSession = {
  username: string;
  genre: Genre;
  mixName: string;
  timestamp: number;
  trackStates: Record<TrackKind, boolean>;
};

// ── Type predicate ──────────────────────────────────────────────────
export function isGenre(value: unknown): value is Genre {
  return (
    typeof value === "string" && ["metal", "rap", "pop", "jazz"].includes(value)
  );
}

// ── Function overloads ──────────────────────────────────────────────
export function getTrackLabel(kind: TrackKind): string;
export function getTrackLabel(kind: TrackKind, genre: Genre): string;
export function getTrackLabel(kind: TrackKind, genre?: Genre): string {
  const baseLabels: Record<TrackKind, string> = {
    bass: "Bass",
    lead: "Lead",
    drums: "Drums",
    extras: "Extras",
  };

  if (genre) {
    const genrePrefixes: Record<Genre, string> = {
      metal: "Heavy",
      rap: "Street",
      pop: "Bright",
      jazz: "Smooth",
    };
    return `${genrePrefixes[genre]} ${baseLabels[kind]}`;
  }

  return baseLabels[kind];
}

// ── Typed state for refs ────────────────────────────────────────────
export type AudioEngineRef = {
  audioContext: AudioContext | null;
  gainNodes: Map<string, GainNode>;
  sourceNodes: Map<string, AudioBufferSourceNode>;
  isPlaying: boolean;
};

// ── Genre config data ───────────────────────────────────────────────
export const GENRE_CONFIGS: GenreMap = {
  metal: {
    name: "metal",
    label: "Metal",
    color: "hsl(0, 85%, 55%)",
    bpm: 140,
    description: "Heavy riffs, thundering drums, and crushing bass lines",
    tracks: [
      { kind: "bass", label: "Bass", icon: "bass" },
      { kind: "lead", label: "Lead Guitar", icon: "lead" },
      { kind: "drums", label: "Drums", icon: "drums" },
      { kind: "extras", label: "FX & Synths", icon: "extras" },
    ],
  },
  rap: {
    name: "rap",
    label: "Rap",
    color: "hsl(45, 95%, 55%)",
    bpm: 90,
    description: "Hard-hitting beats, deep 808s, and smooth melodies",
    tracks: [
      { kind: "bass", label: "808 Bass", icon: "bass" },
      { kind: "lead", label: "Melody", icon: "lead" },
      { kind: "drums", label: "Hi-hats & Drums", icon: "drums" },
      { kind: "extras", label: "Ad-libs & FX", icon: "extras" },
    ],
  },
  pop: {
    name: "pop",
    label: "Pop",
    color: "hsl(330, 85%, 60%)",
    bpm: 120,
    description: "Catchy hooks, bright synths, and danceable rhythms",
    tracks: [
      { kind: "bass", label: "Bass Synth", icon: "bass" },
      { kind: "lead", label: "Lead Synth", icon: "lead" },
      { kind: "drums", label: "Beat", icon: "drums" },
      { kind: "extras", label: "Pads & FX", icon: "extras" },
    ],
  },
  jazz: {
    name: "jazz",
    label: "Jazz",
    color: "hsl(210, 80%, 55%)",
    bpm: 110,
    description: "Smooth bass walks, silky keys, and brush strokes",
    tracks: [
      { kind: "bass", label: "Upright Bass", icon: "bass" },
      { kind: "lead", label: "Piano", icon: "lead" },
      { kind: "drums", label: "Brushes", icon: "drums" },
      { kind: "extras", label: "Brass & Sax", icon: "extras" },
    ],
  },
};
