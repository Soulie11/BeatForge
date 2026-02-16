import type { Genre, TrackKind } from "./types";

// ══════════════════════════════════════════════════════════════════════
//  JAK USTAWIC WLASNE SCIEZKI DZWIEKOWE:
//
//  1. Wrzuc pliki .mp3 (lub .wav / .ogg) do folderu:
//       public/audio/{gatunek}/{sciezka}.mp3
//
//     Przykladowa struktura:
//       public/audio/metal/bass.mp3
//       public/audio/metal/lead.mp3
//       public/audio/metal/drums.mp3
//       public/audio/metal/extras.mp3
//       public/audio/rap/bass.mp3
//       public/audio/rap/lead.mp3
//       ... itd.
//
//  2. WAZNE: Kazda sciezka w danym gatunku MUSI miec taka sama dlugosc
//     (np. 8 sekund) zeby petla byla zsynchronizowana.
//
//  3. To wszystko! Aplikacja automatycznie wykryje pliki i ich uzyje.
//     Jesli plik nie istnieje, uzyje wbudowanej syntezy jako fallback.
//
//  WSPIERANE FORMATY: .mp3, .wav, .ogg
//  DOMYSLNA SCIEZKA:  /audio/{genre}/{track}.mp3
// ══════════════════════════════════════════════════════════════════════

// ── Konfiguracja sciezek do plikow audio ────────────────────────────
// Zmien te sciezki jesli chcesz uzyc innych nazw plikow lub folderu:

const AUDIO_BASE_PATH = "/audio";
const AUDIO_EXTENSION = ".mp3";

function getAudioFilePath(genre: Genre, track: TrackKind): string {
  return `${AUDIO_BASE_PATH}/${genre}/${track}${AUDIO_EXTENSION}`;
}

// ── Ladowanie pliku audio ───────────────────────────────────────────

async function loadAudioFile(
  audioContext: AudioContext,
  url: string
): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  } catch {
    return null;
  }
}

// ── Proba zaladowania pliku, a jesli brak -> synteza ────────────────

export async function createTrackBuffer(
  audioContext: AudioContext,
  genre: Genre,
  track: TrackKind
): Promise<AudioBuffer> {
  // 1) Sprobuj zaladowac plik z public/audio/
  const filePath = getAudioFilePath(genre, track);
  const fileBuffer = await loadAudioFile(audioContext, filePath);

  if (fileBuffer) {
    return fileBuffer;
  }

  // 2) Fallback: wbudowana synteza
  const bpm = GENRE_BPM[genre];
  return GENERATORS[genre][track](audioContext, bpm);
}

export function getLoopDurationForGenre(genre: Genre): number {
  const bpm = GENRE_BPM[genre];
  return getLoopDuration(bpm);
}

// Zwraca null jesli plik istnieje (bo uzyje dlugosci pliku),
// lub dlugosc z syntezy jesli nie
export async function getActualLoopDuration(
  audioContext: AudioContext,
  genre: Genre,
  track: TrackKind
): Promise<number> {
  const filePath = getAudioFilePath(genre, track);
  const fileBuffer = await loadAudioFile(audioContext, filePath);

  if (fileBuffer) {
    return fileBuffer.duration;
  }

  return getLoopDurationForGenre(genre);
}

// ── BPM per genre ───────────────────────────────────────────────────

const GENRE_BPM: Record<Genre, number> = {
  metal: 140,
  rap: 90,
  pop: 120,
  videogame: 110,
};

// ══════════════════════════════════════════════════════════════════════
//  PONIZEJ: Wbudowana synteza (fallback gdy brak plikow .mp3)
//  Nie musisz tego modyfikowac jesli uzywasz wlasnych plikow.
// ══════════════════════════════════════════════════════════════════════

type NotePattern = {
  frequency: number;
  duration: number;
  startTime: number;
  type: OscillatorType;
  gain: number;
};

type DrumHit = {
  startTime: number;
  frequency: number;
  decay: number;
  gain: number;
  noise: boolean;
};

function getLoopDuration(bpm: number, bars: number = 2): number {
  return (60 / bpm) * 4 * bars;
}

function generateTonePattern(
  audioContext: AudioContext,
  notes: NotePattern[],
  loopDuration: number
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const bufferLength = Math.ceil(loopDuration * sampleRate);
  const buffer = audioContext.createBuffer(1, bufferLength, sampleRate);
  const data = buffer.getChannelData(0);

  for (const note of notes) {
    const startSample = Math.floor(note.startTime * sampleRate);
    const endSample = Math.min(
      startSample + Math.floor(note.duration * sampleRate),
      bufferLength
    );

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / sampleRate;
      const envelope = Math.exp(-t * 3) * (1 - Math.exp(-t * 50)) * note.gain;
      let sample = 0;

      switch (note.type) {
        case "sine":
          sample = Math.sin(2 * Math.PI * note.frequency * t);
          break;
        case "square":
          sample = Math.sin(2 * Math.PI * note.frequency * t) > 0 ? 1 : -1;
          sample *= 0.4;
          break;
        case "sawtooth":
          sample = 2 * ((note.frequency * t) % 1) - 1;
          sample *= 0.5;
          break;
        case "triangle": {
          const phase = (note.frequency * t) % 1;
          sample = 4 * Math.abs(phase - 0.5) - 1;
          break;
        }
      }

      data[i] = (data[i] || 0) + sample * envelope;
    }
  }

  return buffer;
}

function generateDrumPattern(
  audioContext: AudioContext,
  hits: DrumHit[],
  loopDuration: number
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const bufferLength = Math.ceil(loopDuration * sampleRate);
  const buffer = audioContext.createBuffer(1, bufferLength, sampleRate);
  const data = buffer.getChannelData(0);

  for (const hit of hits) {
    const startSample = Math.floor(hit.startTime * sampleRate);
    const hitLength = Math.floor(hit.decay * sampleRate);

    for (let i = 0; i < hitLength && startSample + i < bufferLength; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t / (hit.decay * 0.3)) * hit.gain;

      if (hit.noise) {
        data[startSample + i] += (Math.random() * 2 - 1) * envelope * 0.6;
      } else {
        const freq = hit.frequency * Math.exp(-t * 20);
        data[startSample + i] += Math.sin(2 * Math.PI * freq * t) * envelope;
      }
    }
  }

  return buffer;
}

// ── Generatory dla kazdego gatunku ──────────────────────────────────

function generateMetalBass(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const notes: NotePattern[] = [];
  const baseFreqs = [55, 55, 65.41, 61.74, 55, 55, 73.42, 65.41];
  for (let i = 0; i < 8; i++) {
    notes.push({
      frequency: baseFreqs[i],
      duration: beat * 0.9,
      startTime: i * beat,
      type: "sawtooth",
      gain: 0.6,
    });
  }
  return generateTonePattern(ctx, notes, loopDur);
}

function generateMetalLead(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const notes: NotePattern[] = [];
  const melody = [220, 261.63, 293.66, 246.94, 220, 329.63, 293.66, 220];
  for (let i = 0; i < 8; i++) {
    notes.push({
      frequency: melody[i],
      duration: beat * 0.7,
      startTime: i * beat,
      type: "square",
      gain: 0.35,
    });
  }
  return generateTonePattern(ctx, notes, loopDur);
}

function generateMetalDrums(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const hits: DrumHit[] = [];
  for (let i = 0; i < 8; i++) {
    hits.push({
      startTime: i * beat,
      frequency: 60,
      decay: 0.15,
      gain: 0.8,
      noise: false,
    });
    if (i % 2 === 1) {
      hits.push({
        startTime: i * beat,
        frequency: 200,
        decay: 0.1,
        gain: 0.6,
        noise: true,
      });
    }
    hits.push({
      startTime: i * beat + beat * 0.5,
      frequency: 8000,
      decay: 0.05,
      gain: 0.3,
      noise: true,
    });
  }
  return generateDrumPattern(ctx, hits, loopDur);
}

function generateMetalExtras(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const notes: NotePattern[] = [
    {
      frequency: 880,
      duration: beat * 2,
      startTime: 0,
      type: "sine",
      gain: 0.15,
    },
    {
      frequency: 1046.5,
      duration: beat * 2,
      startTime: beat * 2,
      type: "sine",
      gain: 0.12,
    },
    {
      frequency: 987.77,
      duration: beat * 3,
      startTime: beat * 4,
      type: "sine",
      gain: 0.1,
    },
    {
      frequency: 739.99,
      duration: beat,
      startTime: beat * 7,
      type: "triangle",
      gain: 0.18,
    },
  ];
  return generateTonePattern(ctx, notes, loopDur);
}

function generateRapBass(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const notes: NotePattern[] = [];
  for (const p of [0, 2, 4, 4.5, 6]) {
    notes.push({
      frequency: 36.71,
      duration: beat * 1.2,
      startTime: p * beat,
      type: "sine",
      gain: 0.8,
    });
  }
  return generateTonePattern(ctx, notes, loopDur);
}

function generateRapLead(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const notes: NotePattern[] = [];
  const melody = [523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 440, 493.88];
  for (let i = 0; i < 8; i++) {
    notes.push({
      frequency: melody[i],
      duration: beat * 0.6,
      startTime: i * beat,
      type: "triangle",
      gain: 0.25,
    });
  }
  return generateTonePattern(ctx, notes, loopDur);
}

function generateRapDrums(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const hits: DrumHit[] = [];
  for (let i = 0; i < 8; i++) {
    if (i % 4 === 0 || i % 4 === 3) {
      hits.push({
        startTime: i * beat,
        frequency: 50,
        decay: 0.25,
        gain: 0.7,
        noise: false,
      });
    }
    if (i % 4 === 2) {
      hits.push({
        startTime: i * beat,
        frequency: 300,
        decay: 0.08,
        gain: 0.7,
        noise: true,
      });
    }
    for (let j = 0; j < 3; j++) {
      hits.push({
        startTime: i * beat + j * (beat / 3),
        frequency: 10000,
        decay: 0.03,
        gain: 0.2 + (j === 2 ? 0.15 : 0),
        noise: true,
      });
    }
  }
  return generateDrumPattern(ctx, hits, loopDur);
}

function generateRapExtras(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const notes: NotePattern[] = [
    {
      frequency: 1200,
      duration: 0.05,
      startTime: beat * 1.5,
      type: "sine",
      gain: 0.3,
    },
    {
      frequency: 1500,
      duration: 0.08,
      startTime: beat * 3,
      type: "sine",
      gain: 0.25,
    },
    {
      frequency: 800,
      duration: 0.1,
      startTime: beat * 5.5,
      type: "triangle",
      gain: 0.2,
    },
    {
      frequency: 2000,
      duration: 0.05,
      startTime: beat * 7,
      type: "sine",
      gain: 0.3,
    },
  ];
  return generateTonePattern(ctx, notes, loopDur);
}

function generatePopBass(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const notes: NotePattern[] = [];
  const freqs = [
    130.81, 130.81, 146.83, 146.83, 164.81, 164.81, 146.83, 130.81,
  ];
  for (let i = 0; i < 8; i++) {
    notes.push({
      frequency: freqs[i],
      duration: beat * 0.8,
      startTime: i * beat,
      type: "sine",
      gain: 0.5,
    });
  }
  return generateTonePattern(ctx, notes, loopDur);
}

function generatePopLead(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const notes: NotePattern[] = [];
  const melody = [
    523.25, 659.25, 783.99, 659.25, 523.25, 587.33, 659.25, 523.25,
  ];
  for (let i = 0; i < 8; i++) {
    notes.push({
      frequency: melody[i],
      duration: beat * 0.5,
      startTime: i * beat,
      type: "square",
      gain: 0.2,
    });
  }
  return generateTonePattern(ctx, notes, loopDur);
}

function generatePopDrums(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const hits: DrumHit[] = [];
  for (let i = 0; i < 8; i++) {
    if (i % 2 === 0) {
      hits.push({
        startTime: i * beat,
        frequency: 80,
        decay: 0.15,
        gain: 0.6,
        noise: false,
      });
    }
    if (i % 2 === 1) {
      hits.push({
        startTime: i * beat,
        frequency: 350,
        decay: 0.08,
        gain: 0.5,
        noise: true,
      });
    }
    hits.push({
      startTime: i * beat + beat * 0.5,
      frequency: 9000,
      decay: 0.04,
      gain: 0.25,
      noise: true,
    });
  }
  return generateDrumPattern(ctx, hits, loopDur);
}

function generatePopExtras(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const notes: NotePattern[] = [
    {
      frequency: 392,
      duration: beat * 4,
      startTime: 0,
      type: "sine",
      gain: 0.12,
    },
    {
      frequency: 440,
      duration: beat * 4,
      startTime: beat * 4,
      type: "sine",
      gain: 0.1,
    },
    {
      frequency: 349.23,
      duration: beat * 2,
      startTime: beat * 2,
      type: "triangle",
      gain: 0.08,
    },
  ];
  return generateTonePattern(ctx, notes, loopDur);
}

function generateJazzBass(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const notes: NotePattern[] = [];
  const walk = [130.81, 146.83, 155.56, 164.81, 174.61, 164.81, 146.83, 130.81];
  for (let i = 0; i < 8; i++) {
    notes.push({
      frequency: walk[i],
      duration: beat * 0.7,
      startTime: i * beat,
      type: "triangle",
      gain: 0.45,
    });
  }
  return generateTonePattern(ctx, notes, loopDur);
}

function generateJazzLead(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const notes: NotePattern[] = [];
  const chords: [number, number][] = [
    [261.63, beat * 2],
    [329.63, beat],
    [349.23, beat],
    [392, beat * 2],
    [349.23, beat],
    [329.63, beat],
  ];
  let time = 0;
  for (const [freq, dur] of chords) {
    notes.push({
      frequency: freq,
      duration: dur * 0.9,
      startTime: time,
      type: "sine",
      gain: 0.3,
    });
    notes.push({
      frequency: freq * 1.25,
      duration: dur * 0.9,
      startTime: time,
      type: "sine",
      gain: 0.15,
    });
    time += dur;
  }
  return generateTonePattern(ctx, notes, loopDur);
}

function generateJazzDrums(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const hits: DrumHit[] = [];
  for (let i = 0; i < 8; i++) {
    hits.push({
      startTime: i * beat,
      frequency: 10000,
      decay: 0.08,
      gain: 0.15,
      noise: true,
    });
    hits.push({
      startTime: i * beat + beat * 0.66,
      frequency: 10000,
      decay: 0.05,
      gain: 0.12,
      noise: true,
    });
    if (i === 2 || i === 6) {
      hits.push({
        startTime: i * beat,
        frequency: 200,
        decay: 0.1,
        gain: 0.3,
        noise: true,
      });
    }
    if (i % 4 === 0) {
      hits.push({
        startTime: i * beat,
        frequency: 60,
        decay: 0.2,
        gain: 0.3,
        noise: false,
      });
    }
  }
  return generateDrumPattern(ctx, hits, loopDur);
}

function generateJazzExtras(ctx: AudioContext, bpm: number): AudioBuffer {
  const loopDur = getLoopDuration(bpm);
  const beat = 60 / bpm;
  const notes: NotePattern[] = [
    {
      frequency: 440,
      duration: beat * 3,
      startTime: beat,
      type: "sine",
      gain: 0.15,
    },
    {
      frequency: 554.37,
      duration: beat * 2,
      startTime: beat * 4,
      type: "sine",
      gain: 0.12,
    },
    {
      frequency: 493.88,
      duration: beat * 2,
      startTime: beat * 6,
      type: "sine",
      gain: 0.1,
    },
  ];
  return generateTonePattern(ctx, notes, loopDur);
}

// ── Mapa generatorow ────────────────────────────────────────────────

type TrackGenerator = (ctx: AudioContext, bpm: number) => AudioBuffer;

const GENERATORS: Record<Genre, Record<TrackKind, TrackGenerator>> = {
  metal: {
    bass: generateMetalBass,
    lead: generateMetalLead,
    drums: generateMetalDrums,
    extras: generateMetalExtras,
  },
  rap: {
    bass: generateRapBass,
    lead: generateRapLead,
    drums: generateRapDrums,
    extras: generateRapExtras,
  },
  pop: {
    bass: generatePopBass,
    lead: generatePopLead,
    drums: generatePopDrums,
    extras: generatePopExtras,
  },
  videogame: {
    bass: generateJazzBass,
    lead: generateJazzLead,
    drums: generateJazzDrums,
    extras: generateJazzExtras,
  },
};
