"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useDataProvider } from "../../data/DataProviderContext";
import { WellState } from "../../data/types";
import { useSelectedWellStore } from "../../state/useSelectedWellStore";
import { useTimeMachineStore } from "../../state/useTimeMachineStore";

interface WellContextValue {
  wellId: string;
  wellState: WellState | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const WellContext = createContext<WellContextValue | null>(null);

export function WellContextProvider({
  wellId,
  children,
}: {
  wellId: string;
  children: React.ReactNode;
}) {
  const provider = useDataProvider();
  const setSelectedWellId = useSelectedWellStore((s) => s.setSelectedWellId);
  const currentDay = useTimeMachineStore((s) => s.currentDay);

  const [wellState, setWellState] = useState<WellState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setSelectedWellId(wellId);
  }, [wellId, setSelectedWellId]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const unsubscribe = provider.subscribeWellState(wellId, (state) => {
      if (isMounted) {
        setWellState(state);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [provider, wellId, currentDay]);

  const refetch = () => {
    setIsLoading(true);
    provider
      .getWellState(wellId)
      .then((s) => {
        setWellState(s);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  };

  return (
    <WellContext.Provider value={{ wellId, wellState, isLoading, error, refetch }}>
      {children}
    </WellContext.Provider>
  );
}

export function useWellContext(): WellContextValue {
  const ctx = useContext(WellContext);
  if (!ctx) {
    throw new Error("useWellContext must be used within a WellContextProvider");
  }
  return ctx;
}
