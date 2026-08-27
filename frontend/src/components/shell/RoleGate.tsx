"use client";

import React from "react";
import { Role } from "../../data/types";
import { useAuthStore } from "../../state/useAuthStore";

interface RoleGateProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const currentRole = useAuthStore((s) => s.role);

  if (!roles.includes(currentRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
