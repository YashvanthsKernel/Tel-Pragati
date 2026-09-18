"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DataProviderWrapper } from "../../data/DataProviderContext";
import { AlertFeedProvider } from "./AlertFeedProvider";
import { useDataModeStore } from "../../state/useDataModeStore";

function DataModeHydrator() {
  const initFromStorage = useDataModeStore((s) => s.initFromStorage);
  useEffect(() => {
    // Runs only on the client, after SSR hydration — restores saved mode
    initFromStorage();
  }, [initFromStorage]);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <DataModeHydrator />
      <DataProviderWrapper>
        <AlertFeedProvider>{children}</AlertFeedProvider>
      </DataProviderWrapper>
    </QueryClientProvider>
  );
}
