"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Cog, T, DOMAINS, type DomainId } from "@/lib/theme";

export function Shell({ children, active }: { children: React.ReactNode; active: DomainId[] }) {
  const pathname = usePathname();
  const items = [
    { id: "home", href: "/", label: "Vue", color: T.text, icon: LayoutGrid },
    ...DOMAINS.filter((d) => active.includes(d.id)).map((d) => ({ ...d, href: `/${d.id}` })),
    { id: "settings", href: "/settings", label: "Réglages", color: T.muted, icon: Cog },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 96px" }}>
        {children}
      </div>
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(18,21,31,0.92)", backdropFilter: "blur(12px)",
        borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-start",
        gap: 4, overflowX: "auto", WebkitOverflowScrolling: "touch",
        padding: "10px 8px calc(10px + env(safe-area-inset-bottom))", maxWidth: "100%",
      }}>
        {items.map((d) => {
          const Icon = d.icon;
          const isActive = pathname === d.href;
          return (
            <Link key={d.id} href={d.href} aria-label={d.label} style={{
              background: "none", border: "none", cursor: "pointer", flex: "1 0 auto",
              minWidth: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: isActive ? d.color : T.muted, fontSize: 10, fontWeight: 600, textDecoration: "none",
            }}>
              <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
              {d.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
