"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { useAuthStore } from "../../state/useAuthStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/register" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/register");

  useEffect(() => {
    if (!isAuthPage && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isAuthPage, router]);

  if (isAuthPage) {
    return <div className="min-h-screen bg-surface-0">{children}</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {/* pb-8 clears the fixed StatusBar */}
        <main className="flex-1 overflow-y-auto bg-surface-0 pb-8">
          <div className="max-w-[1920px] mx-auto min-h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
