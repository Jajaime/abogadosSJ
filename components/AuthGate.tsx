// /components/AuthGate.tsx
'use client';

import React from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode; // spinner/skeleton
  enabled?: boolean;          // por si quieres desactivar el guard
};

export default function AuthGate({ children, fallback = null, enabled = true }: Props) {
  const { checking, authorized } = useAuthGuard({ enabled });

  if (checking) return <>{fallback}</>;
  if (!authorized) return null; // el hook ya redirigió

  return <>{children}</>;
}