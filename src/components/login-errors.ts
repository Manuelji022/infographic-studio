// Plain module (no "use client") so the server login page can call it too.

/**
 * Better Auth redirects failed OAuth callbacks to errorCallbackURL with ?error=<code>.
 * `unable_to_create_user` is what the owner-only create hook produces for other accounts
 * (see src/lib/auth.ts); `signup_disabled` is the same denial if sign-up is ever closed.
 * Other codes (for example `access_denied` when Google consent is cancelled) get the generic error.
 */
const DENIED_CODES = new Set(["unable_to_create_user", "signup_disabled"]);

export function normalizeErrorParam(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" && first.length > 0 ? first : undefined;
}

export function isDeniedOAuthError(code: string | undefined): boolean {
  return code !== undefined && DENIED_CODES.has(code);
}
