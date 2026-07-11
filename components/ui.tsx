import { T } from "@/lib/theme";
import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";

export const Card = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 18, padding: 16, ...style,
  }}>{children}</div>
);

export const Section = ({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted }}>{title}</div>
      {right}
    </div>
    {children}
  </div>
);

export const Btn = ({
  children, onClick, color = T.goal, ghost, small, style, disabled, type,
}: {
  children: ReactNode; onClick?: () => void; color?: string; ghost?: boolean; small?: boolean;
  style?: CSSProperties; disabled?: boolean; type?: "button" | "submit";
}) => (
  <button type={type || "button"} onClick={onClick} disabled={disabled} style={{
    background: ghost ? "transparent" : color,
    color: ghost ? color : "#12151F",
    border: ghost ? `1px solid ${color}` : "none",
    borderRadius: 12, padding: small ? "6px 10px" : "10px 16px",
    fontWeight: 700, fontSize: small ? 13 : 14, cursor: disabled ? "default" : "pointer",
    fontFamily: "'Space Grotesk',sans-serif", opacity: disabled ? 0.4 : 1,
    display: "inline-flex", alignItems: "center", gap: 6, ...style,
  }}>{children}</button>
);

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} style={{
    background: T.surface2, border: `1px solid ${T.border}`, color: T.text,
    borderRadius: 12, padding: "10px 12px", fontSize: 15, width: "100%",
    outline: "none", boxSizing: "border-box", ...props.style,
  }} />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} style={{
    background: T.surface2, color: T.text, border: `1px solid ${T.border}`,
    borderRadius: 12, padding: "10px 12px", fontSize: 14, width: "100%",
    ...props.style,
  }} />
);

export const Empty = ({ text }: { text: string }) => (
  <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "18px 0" }}>{text}</div>
);

export const MiniHeader = ({ title, color, sub }: { title: string; color: string; sub?: string }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color }}>{title}</div>
    {sub && <div style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>{sub}</div>}
  </div>
);
