// app/(main)/pages/usuario/[id]/edit/page.tsx
import { requireSession } from '@/lib/auth.server';
import { can } from '@/lib/authz';
import { redirect } from 'next/navigation';
import UsuarioForm from '../../_components/UsuarioForm'; // client component

export default async function Page(ctx: { params: Promise<{ id: string }> }) {
  const session = await requireSession().catch(() => null);

  if (!session || !can(session.roles, 'updateUser')) {
    redirect('/auth/access?code=403&reason=forbidden&next=/');
  }

  // Si necesitas validar que el id exista antes de renderizar, puedes:
  // const { id } = await ctx.params; // (opcional para prefetch/validaciones aquí)

  return (
    <div className="grid">
      <div className="col-12 md:col-6">
        <UsuarioForm />
      </div>
    </div>
  );
}
