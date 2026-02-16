"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Genre, TrackKind } from "@/lib/types";
import { GENRE_CONFIGS } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ToggleEvent = {
  track: TrackKind;
  active: boolean;
  timestamp: number;
};

type MixActivityChartProps = {
  genre: Genre;
  toggleHistory: ToggleEvent[];
};

export function MixActivityChart({ genre, toggleHistory }: MixActivityChartProps) {
  const config = GENRE_CONFIGS[genre];

  const chartData = useMemo(() => {
    const trackCounts: Record<TrackKind, number> = {
      bass: 0,
      lead: 0,
      drums: 0,
      extras: 0,
    };

    for (const event of toggleHistory) {
      trackCounts[event.track]++;
    }

    return [
      { name: "Bass", toggles: trackCounts.bass, fill: config.color },
      { name: "Lead", toggles: trackCounts.lead, fill: `${config.color}cc` },
      { name: "Drums", toggles: trackCounts.drums, fill: `${config.color}99` },
      { name: "Extras", toggles: trackCounts.extras, fill: `${config.color}66` },
    ];
  }, [toggleHistory, config.color]);

  if (toggleHistory.length === 0) {
    return null;
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Aktywnosc miksu</CardTitle>
        <CardDescription>
          Liczba przelaczen dla kazdej sciezki
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(240, 6%, 18%)"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(240, 6%, 18%)" }}
              />
              <YAxis
                tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(240, 6%, 18%)" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(240, 8%, 8%)",
                  border: "1px solid hsl(240, 6%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(0, 0%, 95%)",
                }}
              />
              <Bar dataKey="toggles" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
