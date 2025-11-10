// app/(main)/pages/usuario/new/page.tsx
import { requireSession } from '@/lib/auth.server';
import { can } from '@/lib/authz';
import { redirect } from 'next/navigation';
import UsuarioForm from '../_components/UsuarioForm'; // client component
import { Suspense } from 'react';

export default async function Page() {
  const session = await requireSession().catch(() => null);

  if (!session || !can(session.roles, 'createUser')) {
    redirect('/auth/access?code=403&reason=forbidden&next=/');
  }

  return (
    <div className="grid">
      <div className="col-12 md:col-6">
        <Suspense fallback={null}>
          <UsuarioForm />
        </Suspense>
      </div>
    </div>
  );
}
