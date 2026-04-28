// Single source of truth for admin authorization.
// Only this email is allowed to access the admin dashboard. Any other
// authenticated user is redirected to the 404 page.
import { supabase } from "@/lib/supabase";

export const ADMIN_EMAIL = "nuroxindiaofficial@gmail.com";

// Obscured admin dashboard path (security-by-obscurity layer on top of the
// real auth check). The login URL stays at /admin/login so muscle memory
// works, but the dashboard itself sits at this non-guessable path.
export const ADMIN_DASHBOARD_PATH = "/AdminDashboardNovaNurox";

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Hard-refresh-safe session reset.
 *
 * 1. Signs out of Supabase (revokes the refresh token server-side).
 * 2. Wipes ALL localStorage + sessionStorage (no stale JS state can survive).
 * 3. Defensively re-removes the well-known auth keys in case .clear() was
 *    blocked by browser policy (private mode, etc.).
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
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // ignore storage access errors
    }
    // Defensive belt-and-suspenders: explicitly nuke known auth keys in case
    // .clear() didn't run (some browsers block it on cross-origin iframes).
    try {
      const targeted = ["nova-nurox-auth", "supabase.auth.token"];
      targeted.forEach((k) => {
        window.localStorage.removeItem(k);
        window.sessionStorage.removeItem(k);
      });
      // Sweep any remaining sb-* / supabase.auth.* / nova-nurox-auth* keys.
      [window.localStorage, window.sessionStorage].forEach((store) => {
        const kill: string[] = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (!k) continue;
          if (
            k.startsWith("sb-") ||
            k.startsWith("supabase.auth") ||
            k.startsWith("nova-nurox-auth")
          ) {
            kill.push(k);
          }
        }
        kill.forEach((k) => store.removeItem(k));
      });
    } catch {
      // ignore
    }
  }
}

/**
 * Clear the session AND force a full browser reload to the given path.
 * Using window.location.href (not navigate) guarantees no React state,
 * in-memory Supabase client cache, or stale context survives.
 */
export async function clearAdminSessionAndRedirect(path: string = "/404"): Promise<void> {
  await clearAdminSession();
  if (typeof window !== "undefined") {
    window.location.href = path;
  }
}
