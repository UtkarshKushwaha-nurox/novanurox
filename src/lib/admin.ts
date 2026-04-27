// Single source of truth for admin authorization.
// Only this email is allowed to access /admin. Any other authenticated user
// is redirected to the 404 page.
import { supabase } from "@/lib/supabase";

export const ADMIN_EMAIL = "nuroxindiaofficial@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Hard-refresh-safe session reset.
 *
 * Clears any Supabase auth session AND nukes our persisted auth storage keys
 * so that a stale (non-admin) session sitting in localStorage from a previous
 * tab / refresh can't satisfy a frontend admin check on the next page load.
 *
 * Safe to call from any route — never throws.
 */
export async function clearAdminSession(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore — we still want to wipe local storage below
  }
  if (typeof window !== "undefined") {
    try {
      // Our configured storageKey + any legacy supabase keys.
      const keysToKill: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        if (
          k === "nova-nurox-auth" ||
          k.startsWith("nova-nurox-auth") ||
          k.startsWith("sb-") ||
          k.startsWith("supabase.auth.")
        ) {
          keysToKill.push(k);
        }
      }
      keysToKill.forEach((k) => window.localStorage.removeItem(k));
      window.sessionStorage.removeItem("nova-nurox-auth");
    } catch {
      // ignore storage access errors (private mode, etc.)
    }
  }
}
