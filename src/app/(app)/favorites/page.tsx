import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RecipeCard } from "@/components/recipe-card";
import type { Recipe, RecipeIngredient, RecipeStep, RecipeNutrition } from "@/types";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("favorites")
    .select("created_at, recipes_generated(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const recipes: Recipe[] = (rows ?? [])
    .map((r) => r.recipes_generated as unknown as Record<string, unknown>)
    .filter(Boolean)
    .map((raw) => ({
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
    }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Favorites</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {recipes.length === 0
            ? "Recipes you heart will appear here."
            : `${recipes.length} saved recipe${recipes.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🤍</p>
          <h2 className="font-display text-xl font-semibold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Tap the heart on any recipe to save it here.
          </p>
          <Link
            href="/generate"
            className="inline-block px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Generate recipes →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r, i) => (
            <RecipeCard key={r.id} recipe={r} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
