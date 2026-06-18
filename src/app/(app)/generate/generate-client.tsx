"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Minus, Plus, RefrigeratorIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEmoji } from "@/lib/ingredient-icons";
import { RecipeCard, RecipeCardSkeleton } from "@/components/recipe-card";
import type { Ingredient, Recipe, RecipeIngredient, RecipeStep, RecipeNutrition } from "@/types";

const CUISINES = [
  "no-preference", "Italian", "Mexican", "Japanese", "Chinese", "Indian",
  "Thai", "Mediterranean", "French", "American", "Korean", "Middle Eastern",
];

const DIETARY_OPTIONS = [
  "vegetarian", "vegan", "gluten-free", "dairy-free", "halal", "kosher", "nut-free",
];

const MEAL_TYPES = ["any", "breakfast", "lunch", "dinner", "snack", "dessert"];
const SPICE_LEVELS = ["none", "mild", "medium", "hot", "extra-hot"];

interface GenerateFilters {
  cuisine: string;
  duration: "quick" | "standard" | "slow" | "any";
  dietary: string[];
  mealType: string;
  servings: number;
  spiceTolerance: string;
  leftoversMode: boolean;
}

interface Props {
  pantryIngredients: Ingredient[];
  userDietary: string[];
}

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

export function GenerateClient({ pantryIngredients, userDietary }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Ingredient[]>(pantryIngredients);
  const [filters, setFilters] = useState<GenerateFilters>({
    cuisine: "no-preference",
    duration: "any",
    dietary: userDietary,
    mealType: "any",
    servings: 2,
    spiceTolerance: "medium",
    leftoversMode: false,
  });
  const [generating, setGenerating] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);

  function removeIngredient(id: string) {
    setSelected((prev) => prev.filter((i) => i.id !== id));
  }

  function setFilter<K extends keyof GenerateFilters>(key: K, val: GenerateFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: val }));
  }

  function toggleDietary(val: string) {
    setFilters((prev) => ({
      ...prev,
      dietary: prev.dietary.includes(val)
        ? prev.dietary.filter((x) => x !== val)
        : [...prev.dietary, val],
    }));
  }

  async function generate() {
    if (!selected.length) return;
    setGenerating(true);
    setError(null);
    setRecipes([]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: selected.map((i) => i.name),
          ...filters,
        }),
      });

      const data = await res.json() as { recipes?: Record<string, unknown>[]; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setRecipes((data.recipes ?? []).map(toRecipe));
    } catch {
      setError("Network error — please try again");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCook(recipe: Recipe) {
    router.push(`/recipe/${recipe.id}`);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Generate Recipes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          AI will find recipes you can make with what you have.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Ingredient chips */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-foreground">
              Your ingredients ({selected.length})
            </h2>
            <a href="/pantry" className="text-xs text-primary hover:underline flex items-center gap-1">
              <RefrigeratorIcon className="w-3 h-3" /> Edit pantry
            </a>
          </div>
          {selected.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground text-sm">No ingredients selected.</p>
              <a href="/pantry" className="text-primary text-sm font-medium hover:underline mt-2 inline-block">
                Go to My Fridge →
              </a>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selected.map((i) => (
                <span
                  key={i.id}
                  className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-full bg-primary/8 border border-primary/20 text-sm font-medium"
                >
                  <span className="text-base leading-none">{getEmoji(i.icon_key)}</span>
                  {i.name}
                  <button
                    onClick={() => removeIngredient(i.id)}
                    className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5 transition-colors"
                    aria-label={`Remove ${i.name}`}
                  >
                    <X className="w-3 h-3 text-primary" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Filters */}
        <section className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-sm">Preferences</h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {/* Cuisine */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cuisine</label>
              <select
                value={filters.cuisine}
                onChange={(e) => setFilter("cuisine", e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CUISINES.map((c) => (
                  <option key={c} value={c}>
                    {c === "no-preference" ? "Any cuisine" : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Meal type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Meal type</label>
              <select
                value={filters.mealType}
                onChange={(e) => setFilter("mealType", e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {MEAL_TYPES.map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Spice */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Spice level 🌶️</label>
              <select
                value={filters.spiceTolerance}
                onChange={(e) => setFilter("spiceTolerance", e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {SPICE_LEVELS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Time available</label>
            <div className="flex gap-1.5 flex-wrap">
              {(["quick", "standard", "slow", "any"] as const).map((d) => {
                const labels = { quick: "≤30 min", standard: "≤1 hr", slow: "1-2 hr", any: "Any" };
                return (
                  <button
                    key={d}
                    onClick={() => setFilter("duration", d)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                      filters.duration === d
                        ? "bg-primary text-white border-primary"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {labels[d]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Servings */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">Servings</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter("servings", Math.max(1, filters.servings - 1))}
                className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-display font-bold w-6 text-center text-lg">{filters.servings}</span>
              <button
                onClick={() => setFilter("servings", Math.min(12, filters.servings + 1))}
                className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Dietary */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Dietary (optional)</label>
            <div className="flex flex-wrap gap-1.5">
              {DIETARY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDietary(d)}
                  className={cn(
                    "px-3 py-1 rounded-full border text-xs font-medium transition-colors capitalize",
                    filters.dietary.includes(d)
                      ? "bg-secondary/20 text-secondary-foreground border-secondary/40"
                      : "border-border hover:border-secondary/40"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Leftover mode */}
          <button
            onClick={() => setFilter("leftoversMode", !filters.leftoversMode)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
              filters.leftoversMode
                ? "bg-secondary/15 border-secondary/40"
                : "border-border hover:border-secondary/30"
            )}
          >
            <span className="text-2xl">♻️</span>
            <div>
              <p className={cn("text-sm font-semibold", filters.leftoversMode && "text-secondary-foreground")}>
                Leftover Mode {filters.leftoversMode ? "ON" : "OFF"}
              </p>
              <p className="text-xs text-muted-foreground">
                Prioritize recipes that use up more of your fridge
              </p>
            </div>
            <div
              className={cn(
                "ml-auto w-9 h-5 rounded-full border-2 transition-all duration-200 flex items-center px-0.5",
                filters.leftoversMode
                  ? "bg-secondary border-secondary"
                  : "bg-muted border-border"
              )}
            >
              <div
                className={cn(
                  "w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-200",
                  filters.leftoversMode && "translate-x-4"
                )}
              />
            </div>
          </button>
        </section>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={generating || !selected.length}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-semibold text-base transition-all",
            selected.length
              ? "bg-primary text-white hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-primary/20"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {generating ? (
            <>
              <span className="animate-spin text-xl">⚙️</span>
              Generating your recipes…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate 3 recipes
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3 border border-destructive/20">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {(generating || recipes.length > 0) && (
        <section>
          <h2 className="font-display text-xl font-semibold mb-4">
            {generating ? "Cooking up ideas…" : `${recipes.length} recipes for you`}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generating
              ? Array.from({ length: 3 }).map((_, i) => <RecipeCardSkeleton key={i} />)
              : recipes.map((r, i) => (
                  <RecipeCard key={r.id} recipe={r} index={i} onCook={handleCook} />
                ))}
          </div>
        </section>
      )}
    </div>
  );
}
