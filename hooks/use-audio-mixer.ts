"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Genre, TrackKind, AudioEngineRef } from "@/lib/types";
import {
  createTrackBuffer,
  getLoopDurationForGenre,
  getActualLoopDuration,
} from "@/lib/audio-engine";

export type TrackMuteState = Record<TrackKind, boolean>;

const ALL_TRACKS: TrackKind[] = ["bass", "lead", "drums", "extras"];

export function useAudioMixer(genre: Genre) {
  const engineRef = useRef<AudioEngineRef>({
    audioContext: null,
    gainNodes: new Map(),
    sourceNodes: new Map(),
    isPlaying: false,
  });

  // Prevent calling AudioContext.close() multiple times.
  // Browsers may throw: "Cannot close a closed AudioContext." (InvalidStateError)
  const isClosingRef = useRef(false);

  const [trackStates, setTrackStates] = useState<TrackMuteState>({
    bass: false,
    lead: false,
    drums: false,
    extras: false,
  });

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const initializeAudio = useCallback(async () => {
    if (engineRef.current.isPlaying) return;
    setIsLoading(true);

    try {
      const ctx = new AudioContext();
      engineRef.current.audioContext = ctx;

      // Laduj wszystkie 4 sciezki rownolegle (pliki mp3 lub fallback synteza)
      const bufferPromises = ALL_TRACKS.map((track) =>
        createTrackBuffer(ctx, genre, track)
      );
      const buffers = await Promise.all(bufferPromises);

      // Pobierz dlugosc petli z pierwszego tracka
      // (jesli to plik mp3, uzyje dlugosci pliku; jesli synteza - obliczona wartosc)
      const loopDuration = await getActualLoopDuration(ctx, genre, "bass");

      for (let i = 0; i < ALL_TRACKS.length; i++) {
        const track = ALL_TRACKS[i];
        const buffer = buffers[i];

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0; // Start muted
        gainNode.connect(ctx.destination);

        const sourceNode = ctx.createBufferSource();
        sourceNode.buffer = buffer;
        sourceNode.loop = true;
        sourceNode.loopEnd = loopDuration;
        sourceNode.connect(gainNode);
        sourceNode.start(0);

        engineRef.current.gainNodes.set(track, gainNode);
        engineRef.current.sourceNodes.set(track, sourceNode);
      }

      engineRef.current.isPlaying = true;
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize audio:", error);
    } finally {
      setIsLoading(false);
    }
  }, [genre]);

  const toggleTrack = useCallback((track: TrackKind) => {
    const engine = engineRef.current;
    if (!engine.audioContext) return;

    const gainNode = engine.gainNodes.get(track);
    if (!gainNode) return;

    setTrackStates((prev) => {
      const newState = !prev[track];
      const currentTime = engine.audioContext!.currentTime;
      gainNode.gain.cancelScheduledValues(currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
      gainNode.gain.linearRampToValueAtTime(
        newState ? 0.8 : 0,
        currentTime + 0.1
      );

      return { ...prev, [track]: newState };
    });
  }, []);

  const cleanup = useCallback(() => {
    const engine = engineRef.current;

    // cleanup can be called more than once (e.g. manual cleanup + component unmount).
    // Make subsequent calls a no-op while we're already tearing down.
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    engine.sourceNodes.forEach((source) => {
      try {
        source.stop();
      } catch {
        // ignore
      }
    });

    const ctx = engine.audioContext;
    engine.audioContext = null;

    if (ctx && ctx.state !== "closed") {
      // close() is async and can reject if already closing/closed.
      ctx.close().catch(() => {
        /* ignore */
      });
    }

    engine.gainNodes.clear();
    engine.sourceNodes.clear();
    engine.isPlaying = false;
    setIsInitialized(false);
    setTrackStates({
      bass: false,
      lead: false,
      drums: false,
      extras: false,
    });

    // Allow future initializeAudio() calls after cleanup.
    // (We don't block on ctx.close() resolving.)
    isClosingRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    trackStates,
    isInitialized,
    isLoading,
    initializeAudio,
    toggleTrack,
    cleanup,
  };
}
