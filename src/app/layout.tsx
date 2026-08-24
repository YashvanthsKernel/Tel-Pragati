import type { Metadata } from "next";
import "./globals.css";
import { GlobalHeader } from "../components/layout/GlobalHeader";
import { SecondaryContextBar } from "../components/layout/SecondaryContextBar";
import { TimeMachine } from "../components/layout/TimeMachine";
import { AlertDrawer } from "../components/ui/AlertDrawer";
import { DataProvenanceDrawer } from "../components/ui/DataProvenanceDrawer";
import { PhysicsXRayOverlay } from "../components/ui/PhysicsXRayOverlay";
import { FieldOverviewModal } from "../components/ui/FieldOverviewModal";

export const metadata: Metadata = {
  title: "Tempo_Twin | Oil India Limited - Baghewala Field Digital Twin",
  description: "Well-to-Surface Optimization of CSS + SRP Operations at Baghewala Heavy Oil Field, Ministry of Petroleum & Natural Gas, Government of India",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-app-bg text-text-primary antialiased">
        <GlobalHeader />
        <SecondaryContextBar />
        
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col">
          {children}
        </main>

        <TimeMachine />

        {/* Global Overlays & Slide-Overs */}
        <AlertDrawer />
        <DataProvenanceDrawer />
        <PhysicsXRayOverlay />
        <FieldOverviewModal />
      </body>
    </html>
  );
}
