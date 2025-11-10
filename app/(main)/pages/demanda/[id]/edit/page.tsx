import { requireSession } from '@/lib/auth.server';
import { can } from '@/lib/authz';
import { redirect } from 'next/navigation';
import DemandaForm from '../../_components/DemandaForm';

export default async function Page(_ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);

  if (!session || !can(session.roles, 'updateDemanda')) {
    redirect('/auth/access?code=403&reason=forbidden&next=/');
  }

  return (
    <div className="grid">
      <div className="col-12">
        <DemandaForm />
      </div>
    </div>
  );
}
