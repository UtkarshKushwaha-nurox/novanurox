import { Trophy, Lightbulb } from "lucide-react";

const FOUNDERS = [
  {
    name: "Utkarsh Kushwaha",
    role: "Founder & Lead Developer",
    quote: "I don't just write code; I build futures. 🚀",
    bio: "Utkarsh is a Full-Stack Developer and UI/UX Designer who believes in pushing the boundaries of technology. Coding and AI deep-diving since 4th class, he started Nova Nurox so every student can learn to make AI their Co-Pilot — not their servant.",
    skills: ["React", "Python (Flask)", "Prompt Engineering", "Hardware Expert"],
    achievement: "Winner & Top Scorer — 7-Day Technical Fix-a-thon (2026)",
    icon: Trophy,
    initials: "UK",
  },
  {
    name: "Umang Kushwaha",
    role: "Co-Founder & Strategy Lead",
    quote: "Innovation is the heartbeat of Nova Nurox. 💡",
    bio: "Umang handles strategy and operations to turn the Nova Nurox vision into reality. His focus: building India's most trusted AI-first education platform. He believes the right mentorship can turn any student into a next-gen creator.",
    skills: ["Strategy", "Operations", "Mentorship", "Growth"],
    achievement: "Driving India's AI-first education movement",
    icon: Lightbulb,
    initials: "UK",
  },
];

export function Founders() {
  return (
    <section id="founders" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">Owners</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            Meet the <span className="text-gradient-neon">Founders</span>
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Two minds. One mission — turning students into creators.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-14 max-w-5xl mx-auto">
          {FOUNDERS.map((f) => (
            <article
              key={f.name}
              className="rounded-2xl bg-gradient-card border border-border hover:border-primary/40 transition-smooth shadow-card overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-neon blur-md opacity-50" />
                    <div className="relative h-16 w-16 rounded-full bg-gradient-neon flex items-center justify-center font-display font-bold text-background text-xl">
                      {f.initials}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-xl md:text-2xl font-bold">{f.name}</h3>
                    <p className="text-sm text-primary">{f.role}</p>
                  </div>
                </div>

                <p className="mt-5 text-base font-display italic text-foreground/90">
                  &ldquo;{f.quote}&rdquo;
                </p>

                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{f.bio}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {f.skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full text-xs border border-border bg-secondary/50 text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <f.icon size={18} className="text-primary mt-0.5 shrink-0" />
                  <p className="text-xs md:text-sm text-foreground/90">{f.achievement}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
