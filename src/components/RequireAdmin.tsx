import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import {
  ADMIN_MFA_PATH,
  clearAdminSessionAndRedirect,
  hasAal2,
  isAdminEmail,
} from "@/lib/admin";

/**
 * Route-level admin guard.
 *
 * Runs BEFORE the protected children mount. Requires:
 *  1. A live Supabase session              (else → /admin/login)
 *  2. The session belongs to the admin email (else → /404)
 *  3. The session is AAL2 — i.e. MFA was   (else → /admin/mfa)
 *     verified in this session
 */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    if (!supabaseConfigured) {
      setStatus("ok");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (cancelled) return;

      if (!session) {
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!isAdminEmail(session.user.email)) {
        await clearAdminSessionAndRedirect("/404");
        return;
      }

      // Hard MFA factor check: a verified TOTP factor MUST exist on the
      // account. If MFA was never set up (or the factor isn't verified),
      // deny access entirely — do not even reveal the MFA enrollment page.
      const { data: factors, error: factorsErr } =
        await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      if (factorsErr) {
        await clearAdminSessionAndRedirect("/404");
        return;
      }
      const verifiedFactor = factors.totp.find((f) => f.status === "verified");
      if (!verifiedFactor) {
        await clearAdminSessionAndRedirect("/404");
        return;
      }

      // MFA gate: only AAL2 sessions (TOTP verified this session) may enter.
      if (!(await hasAal2())) {
        navigate(ADMIN_MFA_PATH, { replace: true });
        return;
      }
      if (!cancelled) setStatus("ok");
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  return <>{children}</>;
}
