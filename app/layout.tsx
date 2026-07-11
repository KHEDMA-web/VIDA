import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIDA — Ma Superapp Personnelle",
  description: "Suivi de vie personnel : finances, sport, habitudes, prière et plus.",
};

export const viewport = {
  themeColor: "#12151F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
