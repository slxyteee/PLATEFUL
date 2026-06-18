import Link from "next/link";

const FEATURES = [
  {
    emoji: "❄️",
    title: "My Fridge",
    desc: "Tap the ingredients you actually have. Your pantry remembers itself.",
  },
  {
    emoji: "🎯",
    title: "Match Score",
    desc: "Every recipe shows how many of your ingredients it uses — no hidden grocery runs.",
  },
  {
    emoji: "🔥",
    title: "Cooking Streaks",
    desc: "Cook daily, build a streak. Watch your habit compound.",
  },
  {
    emoji: "🔄",
    title: "Smart Substitutions",
    desc: "Out of an ingredient? AI suggests what's already in your fridge instead.",
  },
  {
    emoji: "🛒",
    title: "One-tap Grocery List",
    desc: "Add missing ingredients to a shareable list in one tap.",
  },
  {
    emoji: "♻️",
    title: "Leftover Mode",
    desc: "Toggle it on and recipes are optimized to clear your fridge, not fill it.",
  },
];

const STEPS = [
  { n: "01", title: "Tell us what you have", desc: "Tap ingredients from your fridge. Takes 30 seconds." },
  { n: "02", title: "Set your preferences", desc: "Cuisine, time, dietary needs, how many people." },
  { n: "03", title: "Cook from AI recipes", desc: "Get personalized recipes that use exactly what you have." },
];

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen bg-background">
      {/* Nav */}
      <header className="w-full px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍽️</span>
          <span className="font-display text-xl font-bold">Plateful</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-24 flex-1">
        <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary-foreground text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-secondary/30">
          <span>✨</span> AI-powered recipe generation
        </div>

        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground max-w-3xl leading-tight mb-6">
          What&apos;s in your fridge becomes{" "}
          <span className="text-primary">what&apos;s on your plate.</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mb-10">
          Tell Plateful what you have. Get recipes you can cook right now — no grocery run required.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Link
            href="/signup"
            className="px-8 py-3.5 rounded-2xl bg-primary text-white font-semibold text-base hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-primary/20"
          >
            Start for free →
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-2xl border border-border font-semibold text-base hover:bg-muted transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Floating ingredient chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-14 max-w-lg opacity-70">
          {[
            "🧅 Onion", "🍗 Chicken", "🥕 Carrot", "🧄 Garlic",
            "🍅 Tomatoes", "🥚 Eggs", "🌽 Corn", "🥦 Broccoli",
            "🍋 Lemon", "🧀 Cheese", "🫘 Lentils", "🍚 Rice",
          ].map((item) => (
            <span
              key={item}
              className="px-3 py-1.5 rounded-full bg-card border border-border text-sm font-medium"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/40 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-3">
            From fridge to table in minutes
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Three steps. No meal planning required.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col gap-3">
                <span className="font-display text-5xl font-bold text-primary/20">{n}</span>
                <h3 className="font-display text-xl font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-3">
            Built to keep you cooking
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Every feature was designed around one question: what actually gets people to cook more?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ emoji, title, desc }) => (
              <div
                key={title}
                className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-3 hover:border-primary/30 transition-colors"
              >
                <span className="text-3xl">{emoji}</span>
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center bg-primary/5 border border-primary/20 rounded-3xl p-12">
          <h2 className="font-display text-3xl font-bold mb-4">
            Ready to cook what you have?
          </h2>
          <p className="text-muted-foreground mb-8">
            Free forever. No credit card. Just open your fridge.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3.5 rounded-2xl bg-primary text-white font-semibold text-base hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-md shadow-primary/20"
          >
            Get started for free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Plateful. Cook what you have.
      </footer>
    </main>
  );
}
