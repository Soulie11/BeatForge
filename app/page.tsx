"use client";

import { useState, useCallback, useRef } from "react";
import { SetupForm } from "@/components/setup-form";
import { Mixer } from "@/components/mixer";
import { MixActivityChart } from "@/components/mix-activity-chart";
import type { FullFormData } from "@/lib/form-schema";
import type { Genre, TrackKind } from "@/lib/types";

type ToggleEvent = {
  track: TrackKind;
  active: boolean;
  timestamp: number;
};

type AppState =
  | { phase: "setup" }
  | {
      phase: "mixing";
      username: string;
      genre: Genre;
      mixName: string;
      autoPlay: boolean;
    };

export default function Home() {
  const [appState, setAppState] = useState<AppState>({ phase: "setup" });
  const [toggleHistory, setToggleHistory] = useState<ToggleEvent[]>([]);
  const historyRef = useRef<ToggleEvent[]>([]);

  const handleFormComplete = useCallback((data: FullFormData) => {
    setToggleHistory([]);
    historyRef.current = [];
    setAppState({
      phase: "mixing",
      username: data.username,
      genre: data.genre as Genre,
      mixName: data.mixName,
      autoPlay: data.autoPlay,
    });
  }, []);

  const handleExit = useCallback(() => {
    setAppState({ phase: "setup" });
    setToggleHistory([]);
    historyRef.current = [];
  }, []);

  const handleTrackToggle = useCallback((track: TrackKind, active: boolean) => {
    const event: ToggleEvent = {
      track,
      active,
      timestamp: Date.now(),
    };
    historyRef.current = [...historyRef.current, event];
    setToggleHistory([...historyRef.current]);
  }, []);

  if (appState.phase === "setup") {
    return <SetupForm onComplete={handleFormComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Mixer
        genre={appState.genre}
        username={appState.username}
        mixName={appState.mixName}
        autoPlay={appState.autoPlay}
        onExit={handleExit}
        onTrackToggle={handleTrackToggle}
      />

      {/* Chart section */}
      <section className="container mx-auto p-4 pb-8 md:p-6 md:pb-12">
        <MixActivityChart
          genre={appState.genre}
          toggleHistory={toggleHistory}
        />
      </section>
    </div>
  );
}
