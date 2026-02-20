"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Genre, TrackKind, AudioEngineRef } from "@/lib/types";
import { createTrackBuffer, getActualLoopDuration } from "@/lib/audio-engine";

export type TrackMuteState = Record<TrackKind, boolean>;

const ALL_TRACKS: TrackKind[] = ["bass", "lead", "drums", "extras"];

export function useAudioMixer(genre: Genre) {
  const engineRef = useRef<AudioEngineRef>({
    audioContext: null,
    gainNodes: new Map(),
    sourceNodes: new Map(),
    isPlaying: false,
  });

  // Prevent calling AudioContext.close() multiple times
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
    const engine = engineRef.current;

    // If an AudioContext already exists (e.g. created by autoplay but suspended),
    // don't create a new one — try to resume it.
    if (engine.audioContext) {
      const ctx = engine.audioContext;

      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch {
          // Autoplay policy: resume may fail without a user gesture.
        }
      }

      const running = ctx.state === "running";
      engine.isPlaying = running;
      setIsInitialized(running);
      return;
    }

    if (engine.isPlaying) return;

    setIsLoading(true);

    try {
      const ctx = new AudioContext();
      engineRef.current.audioContext = ctx;

      // Try to resume immediately (may succeed if autoplay is allowed)
      try {
        await ctx.resume();
      } catch {
        // ignore
      }

      // Load all 4 tracks in parallel
      const bufferPromises = ALL_TRACKS.map((track) =>
        createTrackBuffer(ctx, genre, track)
      );
      const buffers = await Promise.all(bufferPromises);

      // Determine loop duration (actual mp3 length or computed)
      const loopDuration = await getActualLoopDuration(ctx, genre, "bass");

      for (let i = 0; i < ALL_TRACKS.length; i++) {
        const track = ALL_TRACKS[i];
        const buffer = buffers[i];

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0; // start muted
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

      // IMPORTANT: consider initialized only if AudioContext is actually running
      const running = ctx.state === "running";
      engineRef.current.isPlaying = running;
      setIsInitialized(running);
    } catch (error) {
      console.error("Failed to initialize audio:", error);
    } finally {
      setIsLoading(false);
    }
  }, [genre]);

  const toggleTrack = useCallback((track: TrackKind) => {
    const engine = engineRef.current;
    const ctx = engine.audioContext;
    if (!ctx) return;

    const gainNode = engine.gainNodes.get(track);
    if (!gainNode) return;

    setTrackStates((prev) => {
      const newState = !prev[track];

      const currentTime = ctx.currentTime;
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

    // cleanup can be called more than once (manual cleanup + unmount)
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    // Stop sources
    engine.sourceNodes.forEach((source) => {
      try {
        source.stop();
      } catch {
        // ignore
      }
    });

    // Close context safely
    const ctx = engine.audioContext;
    engine.audioContext = null;

    if (ctx && ctx.state !== "closed") {
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

    // Allow future init calls
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
