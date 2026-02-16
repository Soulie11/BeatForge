"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// ── Generic component: renders any item[] in a responsive grid ──────
type GenericGridProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
};

const COLUMN_CLASSES: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const GAP_CLASSES: Record<string, string> = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
};

export function GenericGrid<T>({
  items,
  renderItem,
  keyExtractor,
  columns = 4,
  gap = "md",
  className,
}: GenericGridProps<T>) {
  return (
    <div
      className={cn(
        "grid",
        COLUMN_CLASSES[columns],
        GAP_CLASSES[gap],
        className
      )}
    >
      {items.map((item, index) => (
        <div key={keyExtractor(item, index)} className="animate-float-up" style={{ animationDelay: `${index * 0.1}s` }}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
