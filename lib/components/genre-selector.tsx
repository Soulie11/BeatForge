"use client";

import { cn } from "@/lib/utils";
import type { Genre } from "@/lib/types";
import { GENRE_CONFIGS } from "@/lib/types";
import { Guitar, Mic2, Music, Piano } from "lucide-react";

const GENRE_ICONS: Record<Genre, React.ReactNode> = {
  metal: <Guitar className="h-8 w-8" />,
  rap: <Mic2 className="h-8 w-8" />,
  pop: <Music className="h-8 w-8" />,
  videogame: <Piano className="h-8 w-8" />,
};

const GENRE_COLOR_CLASSES: Record<Genre, string> = {
  metal: "border-metal text-metal",
  rap: "border-rap text-rap",
  pop: "border-pop text-pop",
  videogame: "border-vg text-vg",
};

const GENRE_BG_CLASSES: Record<Genre, string> = {
  metal: "bg-metal/10",
  rap: "bg-rap/10",
  pop: "bg-pop/10",
  videogame: "bg-vg/10",
};

type GenreSelectorProps = {
  value: Genre | undefined;
  onChange: (genre: Genre) => void;
};

export function GenreSelector({ value, onChange }: GenreSelectorProps) {
  const genres: Genre[] = ["metal", "rap", "pop", "videogame"];

  return (
    <div className="grid grid-cols-2 gap-4">
      {genres.map((genre) => {
        const config = GENRE_CONFIGS[genre];
        const isSelected = value === genre;

        return (
          <button
            key={genre}
            type="button"
            onClick={() => onChange(genre)}
            className={cn(
              "group relative flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all duration-300",
              "hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
              isSelected
                ? cn(GENRE_COLOR_CLASSES[genre], GENRE_BG_CLASSES[genre])
                : "border-border hover:border-muted-foreground"
            )}
            aria-pressed={isSelected}
          >
            <div
              className={cn(
                "transition-transform duration-300 group-hover:scale-110",
                isSelected
                  ? GENRE_COLOR_CLASSES[genre]
                  : "text-muted-foreground"
              )}
            >
              {GENRE_ICONS[genre]}
            </div>
            <span
              className={cn(
                "text-lg font-semibold transition-colors",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground text-center leading-relaxed">
              {config.description}
            </span>
            {isSelected && (
              <div
                className={cn(
                  "absolute -top-1 -right-1 h-4 w-4 rounded-full",
                  "animate-pulse-glow"
                )}
                style={{ color: config.color, backgroundColor: config.color }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
