import { Rocket, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section id="home" className="relative pt-32 md:pt-40 pb-20 md:pb-28 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="container relative mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center animate-float-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-primary">
            <Sparkles size={14} /> India&apos;s Most Futuristic AI Masterclass
          </div>

          <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
            Nova Nurox AI:{" "}
            <span className="text-gradient-neon">The 10-Day AI Co-Pilot</span> Challenge
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop being a <span className="text-foreground font-semibold">&quot;User.&quot;</span>{" "}
            Become a <span className="text-foreground font-semibold">&quot;Creator.&quot;</span>{" "}
            Master the tools of 2026 and transform your workflow.
          </p>

          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 px-5 py-2.5 rounded-full glow-border bg-card/60">
            <Rocket size={16} className="text-primary" />
            <span className="text-sm md:text-base font-display font-semibold tracking-wide">
              &quot;Don&apos;t just use AI, Co-Pilot it.&quot;
            </span>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#join"
              className="inline-flex items-center justify-center rounded-md bg-gradient-neon px-7 h-12 text-sm font-bold text-background shadow-neon hover:scale-[1.02] transition-smooth"
            >
              Confirm Your Seat — ₹149
            </a>
            <a
              href="#course"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card/40 px-7 h-12 text-sm font-semibold text-foreground hover:bg-card transition-smooth"
            >
              View Curriculum
            </a>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-3 max-w-xl mx-auto">
            {[
              { k: "10", l: "Days" },
              { k: "20", l: "Seats" },
              { k: "₹149", l: "Early Bird" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4"
              >
                <div className="text-2xl md:text-3xl font-display font-bold text-gradient-neon">
                  {s.k}
                </div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
