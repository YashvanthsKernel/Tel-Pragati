import React from "react";
import { WellContextProvider } from "../../../components/well/WellContext";

export default async function WellLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ wellId: string }>;
}) {
  const resolvedParams = await params;
  const wellId = resolvedParams?.wellId || "BGW-08";

  return <WellContextProvider wellId={wellId}>{children}</WellContextProvider>;
}
