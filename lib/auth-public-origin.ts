/**
 * Base URL for Supabase auth redirects (signup confirmation, password reset).
 *
 * - **Localhost:** always `window.location.origin` (keeps your dev port).
 * - **Production:** if `NEXT_PUBLIC_APP_URL` is set (e.g. in Vercel), use it so
 *   email links never point at a deleted preview like `*-ii4b.vercel.app`.
 * - Otherwise: current browser origin.
 */
export function getAuthPublicOrigin(): string {
  if (typeof window === "undefined") return "";
  const { hostname, origin } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return origin;
  }
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  return origin;
}

export function getEmailConfirmationCallbackUrl(): string {
  const o = getAuthPublicOrigin();
  return o ? `${o}/auth/callback` : "";
}

export function getPasswordResetRedirectUrl(): string {
  const o = getAuthPublicOrigin();
  return o ? `${o}/update-password` : "";
}
