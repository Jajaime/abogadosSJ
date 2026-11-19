import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth.server';
import { can } from '@/lib/authz';
import AbogadosClient from './AbogadosClient';

export default async function Page() {
  const session = await requireSession().catch(() => null);
  if (!session || !can(session.roles, 'viewAbogadosMenu')) {
    redirect('/auth/access?code=403&reason=forbidden&next=/');
  }
  return <AbogadosClient />;
}
