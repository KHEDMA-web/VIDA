"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { T } from "@/lib/theme";
import { Card, Section, Btn, Empty } from "./ui";
import type { TrendData } from "@/lib/trends";

const VIEW_W = 320;
const VIEW_H = 170;
const PAD_L = 28;
const PAD_R = 8;
const PAD_T = 10;
const PAD_B = 20;
const PLOT_W = VIEW_W - PAD_L - PAD_R;
const PLOT_H = VIEW_H - PAD_T - PAD_B;

function formatDay(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function TrendChart({ data }: { data: TrendData }) {
  const [period, setPeriod] = useState<7 | 30>(7);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);

  const dates = data.dates.slice(-period);
  const series = data.series.map((s) => ({ ...s, values: s.values.slice(-period) }));
  const n = dates.length;

  const stepX = n > 1 ? PLOT_W / (n - 1) : 0;
  const x = (i: number) => PAD_L + i * stepX;
  const y = (v: number) => PAD_T + PLOT_H * (1 - Math.max(0, Math.min(1, v)));

  const linePath = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

  const xLabelIdx = useMemo(() => {
    if (n <= 1) return [0];
    const count = Math.min(n, period === 30 ? 6 : 7);
    const step = (n - 1) / (count - 1);
    return Array.from({ length: count }, (_, i) => Math.round(i * step));
  }, [n, period]);

  const hasAnyData = series.some((s) => s.values.some((v) => v > 0));

  function updateHoverFromClientX(clientX: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const relX = ((clientX - rect.left) / rect.width) * VIEW_W;
    const idx = Math.round((relX - PAD_L) / (stepX || 1));
    setHoverIdx(Math.max(0, Math.min(n - 1, idx)));
  }

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => updateHoverFromClientX(e.clientX);
  const onPointerLeave = () => setHoverIdx(null);

  const toggleSeries = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Section title="Tendances" right={
      <div style={{ display: "flex", gap: 6 }}>
        <Btn small ghost={period !== 7} color={T.goal} onClick={() => setPeriod(7)}>7 j</Btn>
        <Btn small ghost={period !== 30} color={T.goal} onClick={() => setPeriod(30)}>30 j</Btn>
      </div>
    }>
      <Card>
        {!hasAnyData ? (
          <Empty text="Pas encore assez de données pour une tendance." />
        ) : (
          <>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              style={{ width: "100%", height: "auto", touchAction: "pan-y" }}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
              onPointerDown={onPointerMove}
            >
              {[0, 0.5, 1].map((f) => (
                <g key={f}>
                  <line
                    x1={PAD_L} x2={VIEW_W - PAD_R} y1={y(f)} y2={y(f)}
                    stroke={T.border} strokeWidth={1}
                  />
                  <text x={PAD_L - 6} y={y(f) + 3} textAnchor="end" fontSize={8} fill={T.muted}>
                    {Math.round(f * 100)}%
                  </text>
                </g>
              ))}

              {xLabelIdx.map((i) => (
                <text key={i} x={x(i)} y={VIEW_H - 4} textAnchor="middle" fontSize={8} fill={T.muted}>
                  {formatDay(dates[i])}
                </text>
              ))}

              {series.filter((s) => !hidden.has(s.id)).map((s) => (
                <g key={s.id}>
                  <path d={linePath(s.values)} fill="none" stroke={s.color} strokeWidth={2}
                    strokeLinecap="round" strokeLinejoin="round" />
                  {s.values.map((v, i) => (
                    <circle key={i} cx={x(i)} cy={y(v)} r={hoverIdx === i ? 3.5 : 2.5} fill={s.color}
                      stroke={T.bg} strokeWidth={1} />
                  ))}
                </g>
              ))}

              {hoverIdx !== null && (
                <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={PAD_T} y2={VIEW_H - PAD_B}
                  stroke={T.muted} strokeWidth={1} strokeDasharray="2,2" />
              )}
            </svg>

            {hoverIdx !== null && (
              <div style={{
                marginTop: 8, padding: "8px 10px", background: T.surface2, borderRadius: 10,
                fontSize: 12,
              }}>
                <div style={{ color: T.muted, marginBottom: 4, fontWeight: 700 }}>{dates[hoverIdx]}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                  {series.filter((s) => !hidden.has(s.id)).map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 4, background: s.color, flexShrink: 0 }} />
                      <span style={{ color: T.text }}>{Math.round(s.values[hoverIdx] * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
              {series.map((s) => {
                const isHidden = hidden.has(s.id);
                return (
                  <button key={s.id} onClick={() => toggleSeries(s.id)} style={{
                    display: "flex", alignItems: "center", gap: 5, fontSize: 11,
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                    color: isHidden ? T.muted : T.text, opacity: isHidden ? 0.5 : 1,
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                      background: isHidden ? "transparent" : s.color,
                      border: isHidden ? `1px solid ${T.muted}` : "none",
                    }} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </Section>
  );
}
