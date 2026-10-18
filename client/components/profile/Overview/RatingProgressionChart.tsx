"use client";

import React, { useMemo, useState } from "react";
import { TrendingUp, Award, ArrowUpRight, ArrowDownRight, Minus, Calendar, Filter } from "lucide-react";
import { RatingProgressionPoint } from "@/types/stats";

interface RatingProgressionChartProps {
  ratingHistory: RatingProgressionPoint[];
  currentRating?: number;
  peakRating?: number;
  lowestRating?: number;
}

type TimeRangeFilter = "all" | "30d" | "10g";

export default function RatingProgressionChart({
  ratingHistory,
  currentRating = 1200,
  peakRating = 1200,
  lowestRating = 1200,
}: RatingProgressionChartProps) {
  const [filter, setFilter] = useState<TimeRangeFilter>("all");
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: RatingProgressionPoint;
    x: number;
    y: number;
    index: number;
  } | null>(null);

  // Filter history points according to selected range
  const filteredData = useMemo(() => {
    if (!ratingHistory || ratingHistory.length === 0) {
      return [
        {
          date: new Date().toISOString(),
          rating: currentRating,
          change: 0,
          opponent: "Starting Rating",
          opponentRating: currentRating,
          result: "draw" as const,
          format: "Rapid" as const,
        },
      ];
    }

    if (filter === "10g") {
      return ratingHistory.slice(-10);
    }

    if (filter === "30d") {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const filtered = ratingHistory.filter(
        (p) => new Date(p.date).getTime() >= thirtyDaysAgo
      );
      return filtered.length > 0 ? filtered : ratingHistory.slice(-5);
    }

    return ratingHistory;
  }, [ratingHistory, filter, currentRating]);

  // Compute min, max, delta in filtered slice
  const { minRating, maxRating, deltaInRange, rangePeak, rangeLowest } = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        minRating: 1100,
        maxRating: 1300,
        deltaInRange: 0,
        rangePeak: currentRating,
        rangeLowest: currentRating,
      };
    }

    const ratings = filteredData.map((d) => d.rating);
    const pPeak = Math.max(...ratings);
    const pLowest = Math.min(...ratings);
    const first = filteredData[0].rating;
    const last = filteredData[filteredData.length - 1].rating;

    // Pad Y axis bounds for pleasant breathing room
    const padding = Math.max(30, Math.round((pPeak - pLowest) * 0.25));
    const rawMin = pLowest - padding;
    const rawMax = pPeak + padding;

    // Snap to 50s
    const yMin = Math.max(0, Math.floor(rawMin / 50) * 50);
    const yMax = Math.ceil(rawMax / 50) * 50;

    return {
      minRating: yMin,
      maxRating: yMax <= yMin ? yMin + 100 : yMax,
      deltaInRange: last - first,
      rangePeak: pPeak,
      rangeLowest: pLowest,
    };
  }, [filteredData, currentRating]);

  // Chart layout dimensions (SVG coordinate space)
  const chartWidth = 800;
  const chartHeight = 280;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Scale coordinates
  const points = useMemo(() => {
    if (filteredData.length === 1) {
      const y = paddingTop + innerHeight / 2;
      return [
        {
          x: paddingLeft + innerWidth / 2,
          y,
          data: filteredData[0],
        },
      ];
    }

    return filteredData.map((d, i) => {
      const x = paddingLeft + (i / (filteredData.length - 1)) * innerWidth;
      const normalizedY =
        (d.rating - minRating) / (maxRating - minRating || 1);
      const y = paddingTop + innerHeight - normalizedY * innerHeight;
      return { x, y, data: d };
    });
  }, [filteredData, minRating, maxRating, innerWidth, innerHeight, paddingLeft, paddingTop]);

  // Generate smooth line and area path
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: "", areaPath: "" };

    if (points.length === 1) {
      const p = points[0];
      const line = `M ${paddingLeft} ${p.y} L ${paddingLeft + innerWidth} ${p.y}`;
      const area = `M ${paddingLeft} ${p.y} L ${paddingLeft + innerWidth} ${p.y} L ${paddingLeft + innerWidth} ${paddingTop + innerHeight} L ${paddingLeft} ${paddingTop + innerHeight} Z`;
      return { linePath: line, areaPath: area };
    }

    // Build SVG path
    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Cubic Bezier curve control points for fluid curve
      const cpX = (prev.x + curr.x) / 2;
      line += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const first = points[0];
    const last = points[points.length - 1];
    const baselineY = paddingTop + innerHeight;
    const area = `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;

    return { linePath: line, areaPath: area };
  }, [points, paddingLeft, innerWidth, paddingTop, innerHeight]);

  // Y-axis ticks (4 intervals)
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 4;
    const step = (maxRating - minRating) / count;
    for (let i = 0; i <= count; i++) {
      ticks.push(Math.round(minRating + i * step));
    }
    return ticks;
  }, [minRating, maxRating]);

  // Format date helper
  const formatDateLabel = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div
      className="rounded-2xl border p-5 md:p-6 space-y-6 transition-all shadow-lg"
      style={{
        backgroundColor: "var(--surface-card)",
        borderColor: "var(--surface-border)",
      }}
    >
      {/* Header with Title and Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: "var(--primary)" }} />
            <h3 className="text-lg font-bold text-white tracking-wide">
              Rating Progression
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Track your competitive chess rating progression over time
          </p>
        </div>

        {/* Filter controls */}
        <div
          className="flex items-center p-1 rounded-xl border text-xs font-semibold self-start sm:self-auto"
          style={{
            backgroundColor: "var(--surface-main)",
            borderColor: "var(--surface-border)",
          }}
        >
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === "all"
                ? "bg-[var(--primary)] text-[var(--surface-main)] shadow font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => setFilter("30d")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === "30d"
                ? "bg-[var(--primary)] text-[var(--surface-main)] shadow font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => setFilter("10g")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === "10g"
                ? "bg-[var(--primary)] text-[var(--surface-main)] shadow font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Last 10 Games
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Current Rating */}
        <div
          className="p-3.5 rounded-xl border space-y-1"
          style={{
            backgroundColor: "var(--surface-main)",
            borderColor: "var(--surface-border)",
          }}
        >
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
            Current Rating
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{currentRating}</span>
            {deltaInRange !== 0 && (
              <span
                className={`text-xs font-bold flex items-center ${
                  deltaInRange > 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                }`}
              >
                {deltaInRange > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 inline mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 inline mr-0.5" />
                )}
                {deltaInRange > 0 ? `+${deltaInRange}` : deltaInRange}
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-500 block">
            {deltaInRange >= 0 ? "Gain in view" : "Loss in view"}
          </span>
        </div>

        {/* Peak Rating */}
        <div
          className="p-3.5 rounded-xl border space-y-1"
          style={{
            backgroundColor: "var(--surface-main)",
            borderColor: "var(--surface-border)",
          }}
        >
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
            Peak Rating
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{peakRating}</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[10px] text-gray-500 block">
            Period peak: {rangePeak}
          </span>
        </div>

        {/* Lowest Rating */}
        <div
          className="p-3.5 rounded-xl border space-y-1"
          style={{
            backgroundColor: "var(--surface-main)",
            borderColor: "var(--surface-border)",
          }}
        >
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
            Lowest Rating
          </span>
          <span className="text-2xl font-black text-gray-300 block">
            {lowestRating}
          </span>
          <span className="text-[10px] text-gray-500 block">
            Period low: {rangeLowest}
          </span>
        </div>

        {/* Games In Range */}
        <div
          className="p-3.5 rounded-xl border space-y-1"
          style={{
            backgroundColor: "var(--surface-main)",
            borderColor: "var(--surface-border)",
          }}
        >
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
            Data Points
          </span>
          <span className="text-2xl font-black text-white block">
            {filteredData.length}
          </span>
          <span className="text-[10px] text-gray-500 block">
            Matches recorded
          </span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden rounded-xl bg-[#0b0d11]/80 border border-[var(--surface-border)] pt-4 pb-2 px-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Linear gradient fill under the line */}
            <linearGradient id="ratingAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="70%" stopColor="var(--primary)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>

            {/* Line glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--primary)" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Horizontal Gridlines & Y-axis labels */}
          {yTicks.map((tick, idx) => {
            const normalizedY = (tick - minRating) / (maxRating - minRating || 1);
            const y = paddingTop + innerHeight - normalizedY * innerHeight;

            return (
              <g key={`ytick-${idx}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + innerWidth}
                  y2={y}
                  stroke="var(--surface-border)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#717682"
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="inherit"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Baseline starting line at 1200 if in range */}
          {1200 >= minRating && 1200 <= maxRating && (
            <line
              x1={paddingLeft}
              y1={paddingTop + innerHeight - ((1200 - minRating) / (maxRating - minRating || 1)) * innerHeight}
              x2={paddingLeft + innerWidth}
              y2={paddingTop + innerHeight - ((1200 - minRating) / (maxRating - minRating || 1)) * innerHeight}
              stroke="var(--primary-border)"
              strokeWidth="1"
              opacity="0.6"
            />
          )}

          {/* Area Fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#ratingAreaGradient)"
              className="transition-all duration-300"
            />
          )}

          {/* Stroke Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              className="transition-all duration-300"
            />
          )}

          {/* Data Points on the line */}
          {points.map((pt, i) => {
            const isHovered = hoveredPoint?.index === i;
            const outcome = pt.data.result;
            const dotColor =
              outcome === "win"
                ? "var(--success)"
                : outcome === "loss"
                ? "var(--danger)"
                : "var(--primary)";

            return (
              <g
                key={`point-${i}`}
                className="cursor-pointer group"
                onMouseEnter={() =>
                  setHoveredPoint({
                    point: pt.data,
                    x: pt.x,
                    y: pt.y,
                    index: i,
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Invisible hover hotspot */}
                <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />

                {/* Outer ring on hover */}
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill="none"
                    stroke={dotColor}
                    strokeWidth="2"
                    opacity="0.8"
                    className="animate-pulse"
                  />
                )}

                {/* Main Dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : points.length > 25 ? 2.5 : 4}
                  fill={dotColor}
                  stroke="var(--surface-main)"
                  strokeWidth="2"
                  className="transition-transform duration-150"
                />
              </g>
            );
          })}

          {/* X-axis date labels */}
          {points.length > 0 && (
            <>
              {/* First point date */}
              <text
                x={points[0].x}
                y={paddingTop + innerHeight + 22}
                textAnchor="start"
                fill="#717682"
                fontSize="10"
                fontWeight="500"
              >
                {formatDateLabel(points[0].data.date)}
              </text>

              {/* Mid point date (if 3+ points) */}
              {points.length >= 3 && (
                <text
                  x={points[Math.floor(points.length / 2)].x}
                  y={paddingTop + innerHeight + 22}
                  textAnchor="middle"
                  fill="#717682"
                  fontSize="10"
                  fontWeight="500"
                >
                  {formatDateLabel(points[Math.floor(points.length / 2)].data.date)}
                </text>
              )}

              {/* Last point date (if 2+ points) */}
              {points.length > 1 && (
                <text
                  x={points[points.length - 1].x}
                  y={paddingTop + innerHeight + 22}
                  textAnchor="end"
                  fill="#717682"
                  fontSize="10"
                  fontWeight="500"
                >
                  {formatDateLabel(points[points.length - 1].data.date)}
                </text>
              )}
            </>
          )}
        </svg>

        {/* Interactive Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all text-xs"
            style={{
              left: `${(hoveredPoint.x / chartWidth) * 100}%`,
              top: `${(hoveredPoint.y / chartHeight) * 100}%`,
              backgroundColor: "rgba(22, 25, 32, 0.95)",
              borderColor: "var(--surface-border)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.7)",
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="font-bold text-white text-sm">
                {hoveredPoint.point.rating}{" "}
                <span className="text-[10px] text-gray-400 font-normal">ELO</span>
              </span>

              {hoveredPoint.point.change !== undefined && (
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    hoveredPoint.point.change > 0
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : hoveredPoint.point.change < 0
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-gray-500/20 text-gray-300"
                  }`}
                >
                  {hoveredPoint.point.change > 0
                    ? `+${hoveredPoint.point.change}`
                    : hoveredPoint.point.change}
                </span>
              )}
            </div>

            <div className="space-y-0.5 text-[11px] text-gray-400">
              <div className="flex items-center justify-between gap-2">
                <span>Vs:</span>
                <span className="text-white font-medium">
                  {hoveredPoint.point.opponent || "Opponent"}
                  {hoveredPoint.point.opponentRating
                    ? ` (${hoveredPoint.point.opponentRating})`
                    : ""}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span>Result:</span>
                <span
                  className={`font-semibold capitalize ${
                    hoveredPoint.point.result === "win"
                      ? "text-[var(--success)]"
                      : hoveredPoint.point.result === "loss"
                      ? "text-[var(--danger)]"
                      : "text-[var(--primary)]"
                  }`}
                >
                  {hoveredPoint.point.result || "Completed"}
                </span>
              </div>

              {hoveredPoint.point.format && (
                <div className="flex items-center justify-between gap-2">
                  <span>Format:</span>
                  <span className="text-gray-200">{hoveredPoint.point.format}</span>
                </div>
              )}

              <div className="pt-1 text-[10px] text-gray-500 border-t border-[var(--surface-border)] mt-1">
                {formatDateLabel(hoveredPoint.point.date)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
