"use client";

import React, { createContext, useContext, useMemo } from "react";
import { demoDataProvider } from "./demo/DemoDataProvider";
import { liveDataProvider } from "./live/LiveDataProvider";
import { DigitalTwinDataProvider } from "./provider";
import { useDataModeStore } from "../state/useDataModeStore";

const DataProviderContext = createContext<DigitalTwinDataProvider>(demoDataProvider);

export function DataProviderWrapper({ children }: { children: React.ReactNode }) {
  const mode = useDataModeStore((s) => s.mode);

  const provider = useMemo(() => {
    return mode === "live" ? liveDataProvider : demoDataProvider;
  }, [mode]);

  return (
    <DataProviderContext.Provider value={provider}>
      {children}
    </DataProviderContext.Provider>
  );
}

export function useDataProvider(): DigitalTwinDataProvider {
  const context = useContext(DataProviderContext);
  if (!context) {
    throw new Error("useDataProvider must be used within a DataProviderWrapper");
  }
  return context;
}
