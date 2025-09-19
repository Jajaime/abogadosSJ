// hooks/useRut.ts
import { useState } from 'react';
import { looksLikeRut, validateRut, normalizeRut } from '@/utils/rut';

export const useRut = (initial = '') => {
  const [value, setValue] = useState(normalizeRut(initial));
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const onChange = (raw: string) => {
    const pretty = normalizeRut(raw);
    setValue(pretty);

    if (looksLikeRut(raw)) {
      setHint(null);
      setError(validateRut(raw) ? null : 'RUT inválido. Revisa el dígito verificador.');
    } else {
      setError(null);
      setHint('Ingresaste un identificador no-RUT. Se aceptará como Pasaporte/Cédula.');
    }
  };

  return { value, error, hint, onChange, setValue };
};
