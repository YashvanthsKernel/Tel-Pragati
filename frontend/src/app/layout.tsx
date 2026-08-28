import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "../components/providers/AppProviders";
import { AppShell } from "../components/shell/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TEL PRAGATI | Baghewala Digital Twin | Oil India Limited",
  description: "Physics-informed Heavy Oil Reservoir & Artificial Lift Digital Twin Platform for Jodhpur Sandstone CSS operations.",
  icons: {
    icon: "/logo_transparent.png",
    shortcut: "/logo_transparent.png",
    apple: "/logo_transparent.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="bg-surface-0 text-text-primary font-sans antialiased min-h-screen flex flex-col selection:bg-accent-mechanical/30 selection:text-white">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
