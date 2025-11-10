// hooks/useSession.ts
'use client';

import { useEffect, useState } from 'react';

type MeResponse = { roles?: string[] } | null;

export function useSession() {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        if (!res.ok) {
          if (alive) {
            setRoles([]);
            setLoading(false);
          }
          return;
        }
        const data: MeResponse = await res.json().catch(() => null);
        if (alive) {
          setRoles(Array.isArray(data?.roles) ? data!.roles : []);
          setLoading(false);
        }
      } catch {
        if (alive) {
          setRoles([]);
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { roles, loading };
}
