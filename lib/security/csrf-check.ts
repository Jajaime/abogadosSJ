export function csrfTokensMatch(
  cookieToken: string | null | undefined,
  headerToken: string | null | undefined
): boolean {
  return (
    typeof cookieToken === 'string' &&
    cookieToken.length > 0 &&
    typeof headerToken === 'string' &&
    headerToken.length > 0 &&
    cookieToken === headerToken
  );
}
