"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 font-mono select-none">
      <div className="w-12 h-12 rounded bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-text-primary uppercase">
        SCADA Node or Subsystem View Not Found
      </h1>
      <p className="text-xs text-text-secondary max-w-md">
        The requested digital twin route is unavailable or outside configured telemetry bounds.
      </p>
      <Link
        href="/twin"
        className="px-4 py-2 bg-oil-charcoal text-white rounded text-xs font-bold flex items-center gap-1.5 hover:bg-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to TWIN Workstation</span>
      </Link>
    </div>
  );
}
