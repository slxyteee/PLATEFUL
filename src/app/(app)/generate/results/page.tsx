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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const payloadStr = sessionStorage.getItem("plateful-generate-payload");

    if (payloadStr) {
      // Fresh generation — fetch now
      sessionStorage.removeItem("plateful-generate-payload");
      setLoading(true);
      setError(null);

      fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payloadStr,
      })
        .then((r) => r.json())
        .then((data: { recipes?: Record<string, unknown>[]; error?: string }) => {
          if (data.error) { setError(data.error); return; }
          const mapped = (data.recipes ?? []).map(toRecipe);
          setRecipes(mapped);
          try { sessionStorage.setItem("plateful-last-recipes", JSON.stringify(data.recipes ?? [])); } catch {}
        })
        .catch(() => setError("Something went wrong. Please try again."))
        .finally(() => setLoading(false));

      return;
    }

    // Returning to page — show cached
    try {
      const cached = sessionStorage.getItem("plateful-last-recipes");
      if (cached) {
        const parsed = JSON.parse(cached) as Record<string, unknown>[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecipes(parsed.map(toRecipe));
          return;
        }
      }
    } catch {}

    router.replace("/generate");
  }, [router]);

  const count = loading ? 3 : recipes.length;

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
            <h1 className="font-display text-base font-semibold">
              {loading ? "Cooking up ideas…" : "Your recipes"}
            </h1>
            {!loading && recipes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {recipes.length} recipe{recipes.length === 1 ? "" : "s"} for you
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

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {error ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">😕</p>
            <p className="font-display text-xl font-semibold mb-2">Something went wrong</p>
            <p className="text-muted-foreground text-sm mb-6">{error}</p>
            <button
              onClick={() => router.push("/generate")}
              className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading
              ? Array.from({ length: count }).map((_, i) => <RecipeCardSkeleton key={i} />)
              : recipes.map((r, i) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    index={i}
                    onCook={() => router.push(`/recipe/${r.id}`)}
                  />
                ))}
          </div>
        )}
      </div>
    </div>
  );
}
