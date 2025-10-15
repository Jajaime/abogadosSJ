import { Suspense } from 'react';
import AccessClient from './AccessClient';

export const dynamic = 'force-dynamic'; // evita prerender

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <AccessClient />
    </Suspense>
  );
}
