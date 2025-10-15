import { Suspense } from 'react';
import ErrorClient from './ErrorClient';

export const dynamic = 'force-dynamic'; // evita prerender

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <ErrorClient />
    </Suspense>
  );
}
