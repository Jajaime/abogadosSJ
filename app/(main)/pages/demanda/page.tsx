import { requireSession } from '@/lib/auth.server';
import { can } from '@/lib/authz';
import { redirect } from 'next/navigation';
import DemandasClient from './DemandasClient';

export default async function Page() {
  const session = await requireSession().catch(() => null);

  if (!session || !can(session.roles, 'listDemandas')) {
    redirect('/auth/access?code=403&reason=forbidden&next=/');
  }

  return <DemandasClient />;
}
