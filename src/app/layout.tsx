import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "DCCO ResearchHub", description: "Plataforma interna de publicaciones científicas del DCCO" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="es"><body>{children}</body></html>; }
