"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// ── Compound Component: TrackPanel ──────────────────────────────────
// Follows the Compound Components pattern with shared context.

type TrackPanelContextValue = {
  isActive: boolean;
  toggle: () => void;
  accentColor: string;
};

const TrackPanelContext = createContext<TrackPanelContextValue | null>(null);

function useTrackPanel(): TrackPanelContextValue {
  const ctx = useContext(TrackPanelContext);
  if (!ctx) {
    throw new Error(
      "TrackPanel compound components must be used within TrackPanel.Root"
    );
  }
  return ctx;
}

// ── Root ─────────────────────────────────────────────────────────────
type RootProps = {
  children: ReactNode;
  defaultActive?: boolean;
  accentColor: string;
  onToggle?: (active: boolean) => void;
  className?: string;
};

function Root({
  children,
  defaultActive = false,
  accentColor,
  onToggle,
  className,
}: RootProps) {
  const [isActive, setIsActive] = useState(defaultActive);

  function toggle() {
    const next = !isActive;
    setIsActive(next);
    onToggle?.(next);
  }

  return (
    <TrackPanelContext.Provider value={{ isActive, toggle, accentColor }}>
      <div
        className={cn(
          "track-container rounded-lg border-2 transition-all duration-300",
          isActive
            ? "border-current bg-current/5"
            : "border-border bg-card hover:border-muted-foreground",
          className
        )}
        style={isActive ? { color: accentColor } : undefined}
      >
        {children}
      </div>
    </TrackPanelContext.Provider>
  );
}

// ── Header ──────────────────────────────────────────────────────────
type HeaderProps = {
  children: ReactNode;
  className?: string;
};

function Header({ children, className }: HeaderProps) {
  return (
    <div className={cn("flex items-center gap-3 p-4 pb-2", className)}>
      {children}
    </div>
  );
}

// ── Icon ────────────────────────────────────────────────────────────
type IconProps = {
  children: ReactNode;
  className?: string;
};

function Icon({ children, className }: IconProps) {
  const { isActive, accentColor } = useTrackPanel();

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
        isActive ? "scale-110" : "bg-muted text-muted-foreground",
        className
      )}
      style={
        isActive
          ? { backgroundColor: `${accentColor}20`, color: accentColor }
          : undefined
      }
    >
      {children}
    </div>
  );
}

// ── Label ───────────────────────────────────────────────────────────
type LabelProps = {
  children: ReactNode;
  className?: string;
};

function Label({ children, className }: LabelProps) {
  const { isActive } = useTrackPanel();

  return (
    <span
      className={cn(
        "track-label-responsive font-semibold transition-colors",
        isActive ? "text-foreground" : "text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}

// ── Visualizer ──────────────────────────────────────────────────────
type VisualizerProps = {
  barCount?: number;
  className?: string;
};

function Visualizer({ barCount = 12, className }: VisualizerProps) {
  const { isActive, accentColor } = useTrackPanel();

  return (
    <div className={cn("flex items-end gap-1 px-4 h-16", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-full rounded-t-sm transition-all",
            isActive ? "animate-waveform" : "bg-muted"
          )}
          style={{
            height: isActive ? `${30 + Math.random() * 70}%` : "20%",
            animationDelay: `${i * 0.08}s`,
            backgroundColor: isActive ? accentColor : undefined,
            opacity: isActive ? 0.7 + Math.random() * 0.3 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

// ── Toggle Button ───────────────────────────────────────────────────
type ToggleButtonProps = {
  className?: string;
};

function ToggleButton({ className }: ToggleButtonProps) {
  const { isActive, toggle, accentColor } = useTrackPanel();

  return (
    <div className={cn("p-4 pt-2", className)}>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "group w-full rounded-md py-3 font-semibold transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          "active:scale-95",
          isActive
            ? "text-background hover:opacity-90"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
        style={
          isActive ? { backgroundColor: accentColor } : undefined
        }
        aria-pressed={isActive}
      >
        {isActive ? "ON" : "OFF"}
      </button>
    </div>
  );
}

// ── Export as Compound Component ─────────────────────────────────────
export const TrackPanel = {
  Root,
  Header,
  Icon,
  Label,
  Visualizer,
  ToggleButton,
};
