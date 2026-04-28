import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { supabase, supabaseConfigured, type Signup } from "@/lib/supabase";
import { clearAdminSessionAndRedirect, isAdminEmail } from "@/lib/admin";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // RLS verification state — true while we confirm Supabase accepts our JWT
  // for the protected `signups` table before showing any data UI.
  const [verifyingRls, setVerifyingRls] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  // Detect Supabase / PostgREST RLS denials. PostgREST returns:
  //   - HTTP 401/403 (status on FetchError)
  //   - code "PGRST301" (JWT invalid) / "42501" (insufficient privilege)
  //   - message containing "row-level security" / "permission denied"
  function isForbiddenError(err: unknown): boolean {
    if (!err || typeof err !== "object") return false;
    const e = err as { code?: string; status?: number; message?: string };
    if (e.status === 401 || e.status === 403) return true;
    if (e.code === "PGRST301" || e.code === "42501") return true;
    const msg = (e.message ?? "").toLowerCase();
    return (
      msg.includes("row-level security") ||
      msg.includes("permission denied") ||
      msg.includes("forbidden")
    );
  }

  useEffect(() => {
    if (!supabaseConfigured) {
      setAuthChecked(true);
      return;
    }
    let cancelled = false;
    const verify = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (cancelled) return;
      if (!session) {
        navigate("/admin/login", { replace: true });
        return;
      }
      const userEmail = session.user.email ?? null;
      if (!isAdminEmail(userEmail)) {
        // Invisible guard: not the admin → wipe everything and HARD redirect
        // to /404 (not the login screen — we don't reveal admin exists).
        await clearAdminSessionAndRedirect("/404");
        return;
      }
      setAuthed(true);
      setEmail(userEmail);
      setAuthChecked(true);
    };
    verify();
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        setAuthed(false);
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!isAdminEmail(session.user.email)) {
        setAuthed(false);
        void clearAdminSessionAndRedirect("/404");
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  async function loadSignups() {
    if (!supabaseConfigured) return;
    setRefreshing(true);
    setError(null);
    setVerifyingRls(true);
    const { data, error: err, status } = await supabase
      .from("signups")
      .select("*")
      .order("created_at", { ascending: false });
    setVerifyingRls(false);
    if (err) {
      const errWithStatus = { ...err, status } as typeof err & { status?: number };
      if (isForbiddenError(errWithStatus)) {
        setForbidden(true);
        setError(
          "Access denied by Row-Level Security. Your account does not have permission to read this table.",
        );
      } else {
        setError(err.message);
      }
    } else {
      setForbidden(false);
      setSignups((data ?? []) as Signup[]);
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    if (authed) loadSignups();
  }, [authed]);

  async function togglePaid(s: Signup) {
    setUpdatingId(s.id);
    const { error: err, status } = await supabase
      .from("signups")
      .update({ paid: !s.paid })
      .eq("id", s.id);
    if (err) {
      const errWithStatus = { ...err, status } as typeof err & { status?: number };
      if (isForbiddenError(errWithStatus)) {
        setError("RLS denied this update. Admin policy may not cover UPDATE.");
      } else {
        setError(err.message);
      }
    } else {
      setSignups((list) =>
        list.map((x) => (x.id === s.id ? { ...x, paid: !s.paid } : x)),
      );
    }
    setUpdatingId(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center rounded-2xl bg-gradient-card border border-border p-8">
          <h1 className="font-display text-2xl font-bold">Setup Required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Add your Supabase URL and anon key to <code className="text-primary">.env</code> and
            run the SQL from <code className="text-primary">SUPABASE_SETUP.md</code>.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-gradient-neon px-5 h-10 text-sm font-bold text-background"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!authed) return null;

  // Verifying RLS — we have a session but haven't confirmed Supabase will
  // serve us the protected table yet. Show a dedicated loading state so the
  // user knows we're checking permissions, not just fetching rows.
  if (verifyingRls && loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm text-muted-foreground">
          Verifying admin permissions…
        </p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center rounded-2xl bg-gradient-card border border-destructive/30 p-8">
          <ShieldCheck className="mx-auto text-destructive" size={36} />
          <h1 className="mt-3 font-display text-2xl font-bold">Access Denied</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Row-Level Security blocked this request. Your account
            <span className="text-foreground"> ({email}) </span>
            does not satisfy the admin policy on this table.
          </p>
          <button
            onClick={logout}
            className="mt-5 inline-flex items-center justify-center rounded-md bg-gradient-neon px-5 h-10 text-sm font-bold text-background"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const paidCount = signups.filter((s) => s.paid).length;
  const totalSeats = 20;

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-neon flex items-center justify-center font-display font-bold text-background">
              N
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-sm">NOVA NUROX</span>
              <span className="text-[10px] uppercase tracking-wider text-primary">
                Admin Panel
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[160px]">
              {email}
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-3 h-9 text-xs font-semibold hover:bg-secondary transition-smooth"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 mt-8">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-primary" />
          <h1 className="font-display text-2xl md:text-3xl font-bold">Dashboard</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage Alpha Batch signups, mark payments, and contact users on WhatsApp.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <Stat label="Total Signups" value={signups.length} />
          <Stat label="Paid" value={paidCount} accent />
          <Stat
            label="Seats Left"
            value={Math.max(0, totalSeats - paidCount)}
            danger={paidCount >= totalSeats}
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">All Signups</h2>
          <button
            onClick={loadSignups}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-3 h-9 text-xs font-semibold hover:bg-secondary transition-smooth disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-4 rounded-xl border border-border bg-gradient-card overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : signups.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="mx-auto text-muted-foreground/40" size={36} />
              <p className="mt-3 text-sm">No signups yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Name</th>
                    <th className="text-left px-4 py-3 font-semibold">Email</th>
                    <th className="text-left px-4 py-3 font-semibold">WhatsApp</th>
                    <th className="text-left px-4 py-3 font-semibold">City</th>
                    <th className="text-left px-4 py-3 font-semibold">Joined</th>
                    <th className="text-left px-4 py-3 font-semibold">Paid</th>
                    <th className="text-right px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-border hover:bg-secondary/30 transition-smooth"
                    >
                      <td className="px-4 py-3 font-medium">{s.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground break-all">{s.email}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">+91 {s.whatsapp}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.city || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(s.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => togglePaid(s)}
                          disabled={updatingId === s.id}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-smooth ${
                            s.paid
                              ? "bg-primary/15 text-primary border border-primary/30 hover:shadow-neon"
                              : "bg-secondary text-muted-foreground border border-border hover:bg-secondary/80"
                          }`}
                        >
                          {updatingId === s.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : s.paid ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <Circle size={12} />
                          )}
                          {s.paid ? "Paid" : "Unpaid"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`https://wa.me/91${s.whatsapp}?text=${encodeURIComponent(
                            `Hi ${s.full_name}, this is Nova Nurox Admin. Welcome to the Alpha Batch! 🚀`,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] px-3 h-8 text-xs font-semibold hover:bg-[#25D366]/25 transition-smooth"
                        >
                          <MessageCircle size={13} /> WhatsApp
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: number;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl bg-gradient-card border border-border p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`mt-2 font-display text-3xl font-bold ${
          danger ? "text-destructive" : accent ? "text-gradient-neon" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
