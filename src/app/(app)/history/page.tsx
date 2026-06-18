import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Flame, Trophy } from "lucide-react";
import type { Recipe, RecipeIngredient, RecipeStep, RecipeNutrition } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function matchColor(score: number) {
  if (score >= 90) return "bg-green-100 text-green-700";
  if (score >= 70) return "bg-yellow-100 text-yellow-700";
  return "bg-orange-100 text-orange-700";
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: historyRows }, { data: streak }] = await Promise.all([
    supabase
      .from("cooking_history")
      .select("id, cooked_at, rating, recipes_generated(*)")
      .eq("user_id", user.id)
      .order("cooked_at", { ascending: false })
      .limit(50),
    supabase.from("streaks").select("*").eq("user_id", user.id).single(),
  ]);

  const entries = (historyRows ?? []).map((h) => {
    const raw = h.recipes_generated as unknown as Record<string, unknown>;
    const recipe: Recipe | null = raw
      ? {
          id: raw.id as string,
          user_id: raw.user_id as string,
          title: raw.title as string,
          cuisine: raw.cuisine as string,
          duration_minutes: raw.duration_minutes as number,
          difficulty: raw.difficulty as "easy" | "medium" | "hard",
          match_score: raw.match_score as number,
          image_url: raw.image_url as string | null,
          ingredients: raw.ingredients as unknown as RecipeIngredient[],
          steps: raw.steps as unknown as RecipeStep[],
          nutrition: raw.nutrition as unknown as RecipeNutrition | null,
          missing_ingredients: raw.missing_ingredients as string[] | null,
          created_at: raw.created_at as string,
        }
      : null;
    return { id: h.id, cooked_at: h.cooked_at, rating: h.rating, recipe };
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Cooking History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Every meal you&apos;ve cooked with Plateful.
        </p>
      </div>

      {/* Streak cards */}
      {streak && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col items-center gap-1">
            <Flame className="w-6 h-6 text-primary" />
            <p className="font-display text-2xl font-bold text-primary">{streak.current_streak}</p>
            <p className="text-xs text-muted-foreground">Day streak</p>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col items-center gap-1">
            <Trophy className="w-6 h-6 text-amber-500" />
            <p className="font-display text-2xl font-bold">{streak.longest_streak}</p>
            <p className="text-xs text-muted-foreground">Best streak</p>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col items-center gap-1">
            <Clock className="w-6 h-6 text-secondary" />
            <p className="font-display text-2xl font-bold">{entries.length}</p>
            <p className="text-xs text-muted-foreground">Total cooked</p>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🍳</p>
          <h2 className="font-display text-xl font-semibold mb-2">No cooking history yet</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Click &quot;I cooked this!&quot; on any recipe to log it here.
          </p>
          <Link
            href="/generate"
            className="inline-block px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Find a recipe →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={entry.recipe ? `/recipe/${entry.recipe.id}` : "#"}
              className="flex items-center gap-4 p-4 bg-card border border-border/60 rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all"
            >
              {/* Emoji placeholder */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                🍽️
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {entry.recipe?.title ?? "Deleted recipe"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.recipe?.cuisine} · {formatDate(entry.cooked_at)}
                </p>
              </div>
              {entry.recipe && (
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${matchColor(entry.recipe.match_score)}`}
                >
                  {entry.recipe.match_score}%
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
