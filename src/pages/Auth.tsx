import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!supabaseConfigured) {
      setError("Auth isn't configured.");
      return;
    }
    setLoading(true);
    if (mode === "signup") {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName },
        },
      });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      if (data.session) {
        navigate("/", { replace: true });
      } else {
        setInfo("Check your inbox to confirm your email, then sign in.");
        setMode("signin");
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      navigate("/", { replace: true });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-md bg-gradient-neon flex items-center justify-center font-display font-bold text-background">
            N
          </div>
          <span className="font-display font-bold text-lg">
            NOVA <span className="text-gradient-neon">NUROX</span>
          </span>
        </Link>

        <div className="rounded-2xl bg-gradient-card border border-border p-7 md:p-8 shadow-card">
          <div className="flex gap-2 mb-6 p-1 rounded-md bg-secondary/40 border border-border">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setInfo(null);
                }}
                className={`flex-1 h-9 text-sm font-semibold rounded ${
                  mode === m
                    ? "bg-gradient-neon text-background shadow-neon"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full Name
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5 w-full h-11 rounded-md border border-border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60"
                />
              </label>
            )}
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full h-11 rounded-md border border-border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full h-11 rounded-md border border-border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60"
              />
            </label>
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
                {info}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-neon h-11 text-sm font-bold text-background shadow-neon disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
