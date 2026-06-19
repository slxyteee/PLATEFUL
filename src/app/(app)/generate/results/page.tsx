"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { RecipeCard, RecipeCardSkeleton } from "@/components/recipe-card";
import type { Recipe, RecipeIngredient, RecipeStep, RecipeNutrition } from "@/types";

function toRecipe(raw: Record<string, unknown>): Recipe {
  return {
    id: raw.id as string,
    user_id: raw.user_id as string,
    title: raw.title as string,
    cuisine: raw.cuisine as string,
    duration_minutes: raw.duration_minutes as number,
    difficulty: raw.difficulty as "easy" | "medium" | "hard",
    match_score: raw.match_score as number,
    image_url: raw.image_url as string | null,
    ingredients: raw.ingredients as RecipeIngredient[],
    steps: raw.steps as RecipeStep[],
    nutrition: raw.nutrition as RecipeNutrition | null,
    missing_ingredients: raw.missing_ingredients as string[] | null,
    created_at: raw.created_at as string,
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("plateful-last-recipes");
      if (cached) {
        const parsed = JSON.parse(cached) as Record<string, unknown>[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecipes(parsed.map(toRecipe));
          setLoaded(true);
          return;
        }
      }
    } catch {}
    router.replace("/generate");
  }, [router]);

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/generate")}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center">
            <h1 className="font-display text-base font-semibold">Your recipes</h1>
            {loaded && (
              <p className="text-xs text-muted-foreground">
                {recipes.length} recipe{recipes.length === 1 ? "" : "s"} generated
              </p>
            )}
          </div>

          <button
            onClick={() => router.push("/generate")}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            New
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <RecipeCardSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm mb-5">
              Based on what&apos;s in your fridge — tap a recipe to see the full instructions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recipes.map((r, i) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  index={i}
                  onCook={() => router.push(`/recipe/${r.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
