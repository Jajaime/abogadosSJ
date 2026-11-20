import { describe, expect, it } from 'vitest';
import { csrfTokensMatch } from '../lib/security/csrf-check';

describe('Validación de tokens CSRF', () => {
  const valid = 'token-aleatorio-de-prueba';

  it('acepta tokens iguales y no vacíos', () => {
    expect(csrfTokensMatch(valid, valid)).toBe(true);
  });

  it('rechaza cookie ausente', () => {
    expect(csrfTokensMatch(null, valid)).toBe(false);
  });

  it('rechaza header ausente', () => {
    expect(csrfTokensMatch(valid, null)).toBe(false);
  });

  it('rechaza ambos tokens ausentes', () => {
    expect(csrfTokensMatch(null, null)).toBe(false);
  });

  it('rechaza tokens diferentes', () => {
    expect(csrfTokensMatch(valid, 'otro-token')).toBe(false);
  });

  it('rechaza tokens vacíos', () => {
    expect(csrfTokensMatch('', '')).toBe(false);
  });

  it('exige coincidencia exacta', () => {
    expect(csrfTokensMatch(valid, valid + ' ')).toBe(false);
  });
});
