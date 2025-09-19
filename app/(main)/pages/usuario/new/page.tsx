'use client';
import UsuarioForm from '../_components/UsuarioForm';
import { Suspense } from 'react';

export default function Page() {
  return (
    <div className="grid">
      <div className="col-12 md:col-6">
        <Suspense fallback={null}>
          <UsuarioForm />
        </Suspense>
      </div>
    </div >
  );
}
