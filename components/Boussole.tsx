import { T } from "@/lib/theme";

export type Fraction = { id: string; color: string; value: number };

export function Boussole({ fractions, size = 220 }: { fractions: Fraction[]; size?: number }) {
  if (fractions.length === 0) return null;
  const cx = size / 2, cy = size / 2, r = size / 2 - 16;
  const seg = 360 / fractions.length, gap = 8;
  const polar = (a: number): [number, number] => {
    const rad = ((a - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const arc = (a0: number, a1: number) => {
    const [x0, y0] = polar(a0);
    const [x1, y1] = polar(a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  const global = Math.round((fractions.reduce((s, f) => s + f.value, 0) / fractions.length) * 100);
  return (
    <div style={{ position: "relative", width: size, margin: "0 auto" }}>
      <svg width={size} height={size}>
        {fractions.map((f, i) => {
          const a0 = i * seg + gap / 2;
          const a1 = (i + 1) * seg - gap / 2;
          const fillEnd = a0 + Math.max(0.001, f.value) * (a1 - a0);
          return (
            <g key={f.id}>
              <path d={arc(a0, a1)} stroke={f.color} strokeOpacity="0.18" strokeWidth="10" fill="none" strokeLinecap="round" />
              {f.value > 0 && (
                <path d={arc(a0, fillEnd)} stroke={f.color} strokeWidth="10" fill="none" strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${f.color}55)` }} />
              )}
            </g>
          );
        })}
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
      }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 44, fontWeight: 700, lineHeight: 1 }}>
          {global}<span style={{ fontSize: 20, color: T.muted }}>%</span>
        </div>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>Aujourd&apos;hui</div>
      </div>
    </div>
  );
}
