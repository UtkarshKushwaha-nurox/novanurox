import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { clearAdminSession, isAdminEmail } from "@/lib/admin";

/**
 * Route-level admin guard.
 *
 * Runs BEFORE the protected children mount, so a stale non-admin session
 * hydrated from localStorage on a hard refresh can never see protected UI.
 *
 * Behavior:
 *  - No session            → /admin/login
 *  - Session, non-admin    → clearAdminSession() then /404
 *  - Session, admin email  → render children
 */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    if (!supabaseConfigured) {
      // Allow the child to render its own "setup required" UI.
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
        await clearAdminSession();
        if (!cancelled) navigate("/404", { replace: true });
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
