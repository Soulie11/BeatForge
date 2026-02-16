"use client";

import { useEffect } from "react";
import type { Genre, TrackKind } from "@/lib/types";
import { GENRE_CONFIGS, getTrackLabel } from "@/lib/types";
import { useAudioMixer } from "@/hooks/use-audio-mixer";
import { TrackPanel } from "@/components/track-panel";
import { GenericGrid } from "@/components/generic-grid";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Disc3, LogOut, Volume2, VolumeX, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

type MixerProps = {
  genre: Genre;
  username: string;
  mixName: string;
  autoPlay: boolean;
  onExit: () => void;
  onTrackToggle?: (track: TrackKind, active: boolean) => void;
};

const TRACK_ICONS: Record<TrackKind, React.ReactNode> = {
  bass: <Volume2 className="h-5 w-5" />,
  lead: <Headphones className="h-5 w-5" />,
  drums: <Disc3 className="h-5 w-5" />,
  extras: <Headphones className="h-5 w-5" />,
};

export function Mixer({
  genre,
  username,
  mixName,
  autoPlay,
  onExit,
  onTrackToggle,
}: MixerProps) {
  const config = GENRE_CONFIGS[genre];
  const {
    trackStates,
    isInitialized,
    isLoading,
    initializeAudio,
    toggleTrack,
    cleanup,
  } = useAudioMixer(genre);

  // Inicjalizacja audio -- jesli autoPlay, odpala od razu.
  // Jesli przegladarka zablokuje (brak gestu), ponowi przy pierwszym kliknieciu.
  useEffect(() => {
    if (autoPlay && !isInitialized && !isLoading) {
      initializeAudio();
    }
  }, [autoPlay, isInitialized, isLoading, initializeAudio]);

  useEffect(() => {
    if (isInitialized) return;

    function handleUserGesture() {
      if (!isInitialized && !isLoading) {
        initializeAudio();
      }
      document.removeEventListener("click", handleUserGesture);
    }

    document.addEventListener("click", handleUserGesture, { once: true });
    return () => document.removeEventListener("click", handleUserGesture);
  }, [isInitialized, isLoading, initializeAudio]);

  function handleToggle(track: TrackKind) {
    if (!isInitialized) {
      initializeAudio().then(() => {
        toggleTrack(track);
        onTrackToggle?.(track, true);
      });
    } else {
      toggleTrack(track);
      onTrackToggle?.(track, !trackStates[track]);
    }
  }

  function handleExit() {
    cleanup();
    onExit();
  }

  const activeTracks = Object.values(trackStates).filter(Boolean).length;
  const tracks: TrackKind[] = ["bass", "lead", "drums", "extras"];

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="container mx-auto flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isInitialized && "animate-spin-slow"
            )}
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
          >
            <Disc3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{mixName}</h1>
            <p className="text-xs text-muted-foreground">
              {username} / {config.label} / {config.bpm} BPM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden sm:flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        activeTracks > 0 ? config.color : "hsl(var(--muted-foreground))",
                    }}
                  />
                  <span className="text-xs font-mono text-secondary-foreground">
                    {activeTracks}/4
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {activeTracks} aktywnych sciezek z 4
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Wyjdz</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Zakonczyc sesje?</DialogTitle>
                <DialogDescription>
                  Czy na pewno chcesz opuscic mikser? Twoj aktualny miks
                  nie zostanie zapisany.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Anuluj</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleExit}>
                  Tak, wyjdz
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main mixer area */}
      <main className="container mx-auto flex-1 p-4 md:p-6">
        {!isInitialized && !isLoading && (
          <div className="mb-6 flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground">
              Kliknij przycisk ponizej lub dowolna sciezke, aby rozpoczac
            </p>
            <Button
              onClick={initializeAudio}
              className="gap-2"
              style={{ backgroundColor: config.color, color: "hsl(var(--background))" }}
            >
              <Volume2 className="h-4 w-4" />
              Rozpocznij odtwarzanie
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="mb-6 flex items-center justify-center gap-3">
            <Disc3 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Ladowanie sciezek...</p>
          </div>
        )}

        <GenericGrid
          items={tracks}
          keyExtractor={(track) => track}
          renderItem={(track) => (
            <TrackPanel.Root
              accentColor={config.color}
              defaultActive={false}
              onToggle={() => handleToggle(track)}
            >
              <TrackPanel.Header>
                <TrackPanel.Icon>{TRACK_ICONS[track]}</TrackPanel.Icon>
                <TrackPanel.Label>
                  {getTrackLabel(track, genre)}
                </TrackPanel.Label>
              </TrackPanel.Header>
              <TrackPanel.Visualizer />
              <TrackPanel.ToggleButton />
            </TrackPanel.Root>
          )}
          columns={4}
          gap="md"
        />

        {/* Track status indicators */}
        <div className="mt-8 flex items-center justify-center gap-6">
          {tracks.map((track) => (
            <div key={track} className="group flex flex-col items-center gap-1">
              {trackStates[track] ? (
                <Volume2
                  className="h-4 w-4 transition-colors"
                  style={{ color: config.color }}
                />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
              )}
              <span
                className={cn(
                  "text-xs font-mono transition-colors",
                  trackStates[track]
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {getTrackLabel(track)}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
