// Admin authorization.
// Access is gated SOLELY by Supabase auth + TOTP MFA (AAL2).
// No email allowlist — any user with a valid Supabase session AND a verified
// TOTP factor (AAL2) may enter the admin dashboard.
import { supabase } from "@/lib/supabase";

// Obscured admin dashboard path (security-by-obscurity layer on top of the
// real auth check). The login URL stays at /admin/login so muscle memory
// works, but the dashboard itself sits at this non-guessable path.
export const ADMIN_DASHBOARD_PATH = "/AdminDashboardNovaNurox";
export const ADMIN_MFA_PATH = "/admin/mfa";

/**
 * Returns true only if the current Supabase session has been elevated to
 * AAL2 (i.e. the user has presented a verified TOTP factor in this session).
 * AAL1 = password only. AAL2 = password + MFA. Admin requires AAL2.
 */
export async function hasAal2(): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return false;
  return data.currentLevel === "aal2";
}

/**
 * Returns the user's first verified TOTP factor (if any). Used to decide
 * whether to enroll a new factor or challenge an existing one.
 */
export async function getVerifiedTotpFactor() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) return null;
  return data.totp.find((f) => f.status === "verified") ?? null;
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
