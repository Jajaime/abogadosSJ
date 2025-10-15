// /hooks/useAuthGuard.ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch } from '@/utils/apiClient';

type UseAuthGuardOptions = {
  redirectTo?: string;     // default: '/auth/login'
  nextParam?: string;      // default: 'next'
  enabled?: boolean;       // para páginas públicas que opcionalmente requieren auth
};

export function useAuthGuard(opts: UseAuthGuardOptions = {}) {
  const {
    redirectTo = '/auth/login',
    nextParam = 'next',
    enabled = true,
  } = opts;

  const router = useRouter();
  const pathname = usePathname();

  const nextQuery = useMemo(() => {
    try {
      const url = new URL(window.location.href);
      const search = url.search;
      return `${pathname}${search}`;
    } catch {
      return pathname || '/';
    }
  }, [pathname]);

  const [checking, setChecking] = useState<boolean>(!!enabled);
  const [authorized, setAuthorized] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    if (!enabled) {
      setChecking(false);
      setAuthorized(true);
      return;
    }

    (async () => {
      try {
        // apiFetch intentará refresh si recibe 401 internamente
        const res = await apiFetch('/api/auth/status', { method: 'GET' });
        if (!alive) return;

        if (res.ok) {
          setAuthorized(true);
        } else {
          // status final sigue 401 → no hay sesión (ni refresh válido)
          setAuthorized(false);
          const url = new URL(redirectTo, window.location.origin);
          url.searchParams.set(nextParam, nextQuery);
          router.replace(url.toString());
        }
      } catch {
        if (!alive) return;
        setAuthorized(false);
        const url = new URL(redirectTo, window.location.origin);
        url.searchParams.set(nextParam, nextQuery);
        router.replace(url.toString());
      } finally {
        if (alive) setChecking(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [enabled, redirectTo, nextParam, nextQuery, router]);

  return { checking, authorized };
}
