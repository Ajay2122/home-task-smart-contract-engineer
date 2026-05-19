"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePriceHistory, useRecordPriceHistory } from "@/lib/hooks/usePriceHistory";
import { format } from "date-fns";
import { TrendingUp, Clock } from "lucide-react";

interface PriceHistoryChartProps {
  marketId: number;
  outcomes: readonly string[];
  status: number;
}

const OUTCOME_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

export function PriceHistoryChart({ marketId, outcomes, status }: PriceHistoryChartProps) {
  const { priceHistory, isLoading } = usePriceHistory(marketId, outcomes.length);

  // Record prices for open markets
  useRecordPriceHistory(marketId, outcomes, status === 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Price History
          </CardTitle>
          <CardDescription>Loading historical data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if we have any data
  const hasData = Object.values(priceHistory).some((points) => points.length > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Price History
          </CardTitle>
          <CardDescription>
            Price tracking will begin automatically. Check back in a few minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground space-y-2">
            <Clock className="h-12 w-12 opacity-50" />
            <p className="text-sm">No historical data yet</p>
            <p className="text-xs">Prices are recorded every 5 minutes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find the min and max values for scaling
  let minPrice = 100;
  let maxPrice = 0;
  let minTime = Date.now();
  let maxTime = 0;

  Object.values(priceHistory).forEach((points) => {
    points.forEach((point: { timestamp: number; price: number; blockNumber: bigint }) => {
      if (point.price < minPrice) minPrice = point.price;
      if (point.price > maxPrice) maxPrice = point.price;
      if (point.timestamp < minTime) minTime = point.timestamp;
      if (point.timestamp > maxTime) maxTime = point.timestamp;
    });
  });

  // Add padding to the scale
  minPrice = Math.max(0, minPrice - 5);
  maxPrice = Math.min(100, maxPrice + 5);

  const timeRange = maxTime - minTime || 1;
  const priceRange = maxPrice - minPrice || 1;

  // Calculate SVG path for each outcome
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = 40;

  const getX = (timestamp: number) => {
    const ratio = (timestamp - minTime) / timeRange;
    return padding + ratio * (chartWidth - 2 * padding);
  };

  const getY = (price: number) => {
    const ratio = (price - minPrice) / priceRange;
    return chartHeight - padding - ratio * (chartHeight - 2 * padding);
  };

  // Helper function to create smooth curve path using cubic bezier (monotone interpolation)
  const createSmoothPath = (points: Array<{ timestamp: number; price: number; blockNumber: bigint }>) => {
    if (points.length < 2) return "";

    const coords = points.map((point) => ({
      x: getX(point.timestamp),
      y: getY(point.price),
    }));

    if (coords.length === 2) {
      // For just 2 points, use a straight line
      return `M ${coords[0].x},${coords[0].y} L ${coords[1].x},${coords[1].y}`;
    }

    // Start the path
    let path = `M ${coords[0].x},${coords[0].y}`;

    // Create smooth curves between points using cubic bezier with clamped control points
    for (let i = 0; i < coords.length - 1; i++) {
      const current = coords[i];
      const next = coords[i + 1];

      // Much lower tension to prevent overshoots
      const tension = 0.15;

      // Calculate control points based on the direct line to next point
      const dx = next.x - current.x;
      const dy = next.y - current.y;

      // Control points are closer to the line between current and next
      const cp1x = current.x + dx * tension;
      const cp1y = current.y + dy * tension;
      const cp2x = next.x - dx * tension;
      const cp2y = next.y - dy * tension;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
    }

    return path;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Price History
        </CardTitle>
        <CardDescription>
          Historical probability over time (last {Object.values(priceHistory)[0]?.length || 0}{" "}
          data points)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {outcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: OUTCOME_COLORS[idx % OUTCOME_COLORS.length] }}
                />
                <span className="text-sm">{outcome}</span>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto"
              style={{ minHeight: "300px" }}
            >
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((value) => {
                const y = getY(value);
                return (
                  <g key={value}>
                    <line
                      x1={padding}
                      y1={y}
                      x2={chartWidth - padding}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="#6b7280"
                    >
                      {value}%
                    </text>
                  </g>
                );
              })}

              {/* Price lines for each outcome */}
              {outcomes.map((_, idx) => {
                const points = priceHistory[idx];
                if (!points || points.length < 2) return null;

                const pathData = createSmoothPath(points);
                const color = OUTCOME_COLORS[idx % OUTCOME_COLORS.length];

                return (
                  <g key={idx}>
                    {/* Smooth curved line */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Points */}
                    {points.map((point, i) => (
                      <circle
                        key={i}
                        cx={getX(point.timestamp)}
                        cy={getY(point.price)}
                        r="3"
                        fill={color}
                      >
                        <title>
                          {outcomes[idx]}: {point.price.toFixed(1)}% at{" "}
                          {format(point.timestamp, "MMM d, HH:mm")}
                        </title>
                      </circle>
                    ))}
                  </g>
                );
              })}

              {/* X-axis labels */}
              {priceHistory[0] && priceHistory[0].length > 0 && (
                <>
                  <text
                    x={padding}
                    y={chartHeight - 10}
                    fontSize="12"
                    fill="#6b7280"
                    textAnchor="start"
                  >
                    {format(minTime, "MMM d, HH:mm")}
                  </text>
                  <text
                    x={chartWidth - padding}
                    y={chartHeight - 10}
                    fontSize="12"
                    fill="#6b7280"
                    textAnchor="end"
                  >
                    {format(maxTime, "MMM d, HH:mm")}
                  </text>
                </>
              )}
            </svg>
          </div>

          {/* Info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Prices recorded every 5 minutes • Latest:{" "}
              {priceHistory[0] && priceHistory[0].length > 0
                ? format(priceHistory[0][priceHistory[0].length - 1].timestamp, "MMM d, HH:mm")
                : "N/A"}
            </span>
          </div>

          {status !== 0 && (
            <Badge variant="secondary" className="text-xs">
              Market {status === 2 ? "Resolved" : "Closed"} - Price tracking stopped
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
