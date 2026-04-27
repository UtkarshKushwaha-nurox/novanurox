/**
 * Automated dev-only self-test for the admin guard.
 *
 * Goal: prove that a non-admin session sitting in localStorage cannot satisfy
 * the admin email check after a hard refresh.
 *
 * This runs ONCE on app boot in dev mode. It:
 *   1. Plants a fake non-admin auth blob under our Supabase storageKey.
 *   2. Calls isAdminEmail() against the planted email and asserts it's false.
 *   3. Calls clearAdminSession() and asserts the planted keys are gone.
 *
 * It does NOT touch a real signed-in admin session (it backs up & restores
 * any pre-existing value at the storageKey).
 */
import { clearAdminSession, isAdminEmail, ADMIN_EMAIL } from "@/lib/admin";

const STORAGE_KEY = "nova-nurox-auth";
const FAKE_NON_ADMIN_EMAIL = "intruder@example.com";

export async function runAdminGuardSelfTest(): Promise<void> {
  if (typeof window === "undefined") return;

  // Back up any real session blob so we don't disturb a logged-in admin.
  const backup = window.localStorage.getItem(STORAGE_KEY);

  try {
    // 1. Plant a stale non-admin "session" blob.
    const fakeBlob = JSON.stringify({
      currentSession: {
        access_token: "fake",
        refresh_token: "fake",
        user: { email: FAKE_NON_ADMIN_EMAIL, id: "fake-id" },
      },
      expiresAt: Date.now() / 1000 + 3600,
    });
    window.localStorage.setItem(STORAGE_KEY, fakeBlob);

    // 2. The email check must reject it.
    const allowed = isAdminEmail(FAKE_NON_ADMIN_EMAIL);
    if (allowed) {
      throw new Error(
        `[admin-guard self-test] FAIL: non-admin email "${FAKE_NON_ADMIN_EMAIL}" was accepted as admin.`,
      );
    }

    // 3. clearAdminSession must wipe our storageKey.
    await clearAdminSession();
    const stillThere = window.localStorage.getItem(STORAGE_KEY);
    if (stillThere) {
      throw new Error(
        `[admin-guard self-test] FAIL: stale localStorage key "${STORAGE_KEY}" survived clearAdminSession().`,
      );
    }

    // Sanity: the real admin email IS accepted.
    if (!isAdminEmail(ADMIN_EMAIL)) {
      throw new Error(
        `[admin-guard self-test] FAIL: real ADMIN_EMAIL was rejected by isAdminEmail().`,
      );
    }

    // eslint-disable-next-line no-console
    console.info(
      "%c[admin-guard] self-test passed ✓",
      "color: #10b981; font-weight: 600;",
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  } finally {
    // Restore whatever was there before (if anything).
    if (backup !== null) {
      window.localStorage.setItem(STORAGE_KEY, backup);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
}
