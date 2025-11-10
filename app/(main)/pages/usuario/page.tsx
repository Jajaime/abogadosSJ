// app/(main)/pages/usuario/page.tsx
import { requireSession } from '@/lib/auth.server';
import { can } from '@/lib/authz';
import { redirect } from 'next/navigation';
import UsuariosClient from './UsuariosClient';

export default async function Page() {
  const session = await requireSession().catch(() => null);

  if (!session || !can(session.roles, 'viewUsersMenu')) {
    // usa tu página de acceso denegado full-page
    redirect('/auth/access?code=403&reason=forbidden&next=/');
  }

  return <UsuariosClient />;
}
