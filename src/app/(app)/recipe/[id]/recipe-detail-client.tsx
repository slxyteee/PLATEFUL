"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Heart, Clock, ChefHat, Users, ShoppingCart,
  CheckCircle2, Circle, Flame,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types";

const DIFFICULTY_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };
const DIFFICULTY_COLOR = {
  easy: "text-green-600 bg-green-50 border-green-200",
  medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  hard: "text-red-600 bg-red-50 border-red-200",
};

const GRADIENT = [
  "from-orange-400 to-rose-500",
  "from-emerald-400 to-teal-500",
  "from-violet-400 to-purple-600",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
];

function matchColor(score: number) {
  if (score >= 90) return "bg-green-500";
  if (score >= 70) return "bg-yellow-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

async function updateStreak(userId: string) {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!streak) return 1;
  if (streak.last_cooked_date === today) return streak.current_streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const ydStr = yesterday.toISOString().split("T")[0];

  const newCurrent = streak.last_cooked_date === ydStr ? streak.current_streak + 1 : 1;
  const newLongest = Math.max(newCurrent, streak.longest_streak);

  await supabase
    .from("streaks")
    .update({ current_streak: newCurrent, longest_streak: newLongest, last_cooked_date: today })
    .eq("user_id", userId);

  return newCurrent;
}

interface Props {
  recipe: Recipe;
  userId: string;
  isFavorited: boolean;
  hasCooked: boolean;
  servings: number;
}

export function RecipeDetailClient({ recipe, userId, isFavorited: initFav, hasCooked: initCooked, servings: defaultServings }: Props) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initFav);
  const [cooked, setCooked] = useState(initCooked);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [cookLoading, setCookLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [servings, setServings] = useState(defaultServings);
  const [addedToGrocery, setAddedToGrocery] = useState(false);
  const [subs, setSubs] = useState<Record<string, { substitute: string; ratio: string; note: string }>>({});
  const [subLoading, setSubLoading] = useState<string | null>(null);

  const gradient = GRADIENT[recipe.title.charCodeAt(0) % GRADIENT.length];
  const missing = recipe.missing_ingredients ?? [];
  const ratio = servings / (recipe.ingredients.find(() => true) ? defaultServings : 1);

  function toggleStep(n: number) {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  async function handleCook() {
    if (cooked || cookLoading) return;
    setCookLoading(true);

    const supabase = createClient();
    await supabase.from("cooking_history").insert({
      user_id: userId,
      recipe_id: recipe.id,
    });

    const newStreak = await updateStreak(userId);
    setStreak(newStreak);
    setCooked(true);
    setCookLoading(false);
  }

  async function handleFavorite() {
    if (favLoading) return;
    setFavLoading(true);
    const supabase = createClient();

    if (favorited) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("recipe_id", recipe.id);
    } else {
      await supabase.from("favorites").insert({ user_id: userId, recipe_id: recipe.id });
    }

    setFavorited((f) => !f);
    setFavLoading(false);
  }

  async function handleAddMissingToGrocery() {
    if (!missing.length) return;
    const supabase = createClient();
    await supabase.from("grocery_lists").insert({
      user_id: userId,
      items: missing.map((name) => ({ name, checked: false })),
    });
    setAddedToGrocery(true);
  }

  async function handleSubstitute(ingredient: string) {
    setSubLoading(ingredient);
    try {
      const res = await fetch("/api/substitute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missingIngredient: ingredient,
          recipeContext: recipe.title,
        }),
      });
      const data = await res.json();
      if (data.substitute) {
        setSubs((prev) => ({ ...prev, [ingredient]: data }));
      }
    } finally {
      setSubLoading(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* Hero */}
      <div className={cn("relative h-56 sm:h-72 bg-gradient-to-br", gradient)}>
        {recipe.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl opacity-70">🍽️</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Favorite button */}
        <button
          onClick={handleFavorite}
          disabled={favLoading}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <Heart
            className={cn("w-4 h-4 transition-all", favorited ? "fill-rose-400 text-rose-400" : "text-white")}
          />
        </button>

        {/* Match score */}
        <div
          className={cn(
            "absolute bottom-4 right-4 px-3 py-1 rounded-full text-white text-sm font-bold",
            matchColor(recipe.match_score)
          )}
        >
          {recipe.match_score}% match
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-5 flex flex-col gap-6">
        {/* Title + meta */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            {recipe.cuisine}
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight">{recipe.title}</h1>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatDuration(recipe.duration_minutes)}
            </span>
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full border capitalize",
                DIFFICULTY_COLOR[recipe.difficulty]
              )}
            >
              {DIFFICULTY_LABEL[recipe.difficulty]}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="hover:text-foreground transition-colors px-1"
              >−</button>
              {servings} servings
              <button
                onClick={() => setServings(Math.min(12, servings + 1))}
                className="hover:text-foreground transition-colors px-1"
              >+</button>
            </span>
          </div>
        </div>

        {/* Nutrition */}
        {recipe.nutrition && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Calories", value: Math.round(recipe.nutrition.calories * ratio) },
              { label: "Protein", value: `${Math.round(recipe.nutrition.protein_g * ratio)}g` },
              { label: "Carbs", value: `${Math.round(recipe.nutrition.carbs_g * ratio)}g` },
              { label: "Fat", value: `${Math.round(recipe.nutrition.fat_g * ratio)}g` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="font-display font-bold text-lg leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Missing ingredients banner */}
        {missing.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-amber-100/60 border-b border-amber-200">
              <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                {missing.length} missing ingredient{missing.length === 1 ? "" : "s"}
              </p>
              <button
                onClick={handleAddMissingToGrocery}
                disabled={addedToGrocery}
                className={cn(
                  "text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors",
                  addedToGrocery
                    ? "bg-green-500 text-white"
                    : "bg-amber-800 text-white hover:bg-amber-900"
                )}
              >
                {addedToGrocery ? "✓ Added to list" : "Add all to grocery list"}
              </button>
            </div>
            <ul className="divide-y divide-amber-100">
              {missing.map((ing) => (
                <li key={ing} className="px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-amber-900">{ing}</span>
                    {!subs[ing] && (
                      <button
                        onClick={() => handleSubstitute(ing)}
                        disabled={subLoading === ing}
                        className={cn(
                          "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors",
                          subLoading === ing
                            ? "border-amber-200 text-amber-400 bg-white"
                            : "border-amber-300 text-amber-800 bg-white hover:bg-amber-100"
                        )}
                      >
                        {subLoading === ing ? "Finding…" : "Find substitute"}
                      </button>
                    )}
                  </div>
                  {subs[ing] && (
                    <div className="bg-white rounded-xl px-3 py-2.5 border border-amber-100 flex flex-col gap-0.5">
                      <p className="text-sm font-semibold text-amber-900">
                        Use: {subs[ing].substitute}
                        <span className="text-amber-500 font-normal ml-2 text-xs">{subs[ing].ratio}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{subs[ing].note}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ingredients */}
        <section>
          <h2 className="font-display text-xl font-semibold mb-3">Ingredients</h2>
          <ul className="flex flex-col gap-2">
            {recipe.ingredients.map((ing, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm",
                  ing.have
                    ? "bg-green-50 border-green-200"
                    : "bg-amber-50 border-amber-200"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full shrink-0", ing.have ? "bg-green-500" : "bg-amber-500")} />
                <span className="flex-1">
                  <span className="font-medium">{ing.quantity} {ing.unit}</span>{" "}
                  {ing.name}
                </span>
                {!ing.have && (
                  <span className="text-xs text-amber-600 font-medium">need</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Steps */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-semibold">Steps</h2>
            <span className="text-xs text-muted-foreground">
              {completedSteps.size}/{recipe.steps.length} done
            </span>
          </div>
          <ol className="flex flex-col gap-3">
            {recipe.steps.map((step) => {
              const done = completedSteps.has(step.step_number);
              return (
                <li
                  key={step.step_number}
                  onClick={() => toggleStep(step.step_number)}
                  className={cn(
                    "flex gap-4 p-4 rounded-xl border cursor-pointer select-none transition-all duration-150",
                    done
                      ? "bg-green-50 border-green-200 opacity-60"
                      : "bg-card border-border hover:border-primary/30"
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-foreground">
                        Step {step.step_number}
                      </span>
                      {step.duration_seconds && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.ceil(step.duration_seconds / 60)} min
                        </span>
                      )}
                    </div>
                    <p className={cn("text-sm leading-relaxed", done && "line-through")}>
                      {step.instruction}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      {/* Streak celebration */}
      {streak !== null && (
        <div className="fixed inset-x-4 bottom-28 lg:bottom-8 z-50 pointer-events-none">
          <div className="max-w-sm mx-auto bg-primary text-white rounded-2xl px-5 py-4 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
            <Flame className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Nicely done!</p>
              <p className="text-xs opacity-90">
                {streak === 1
                  ? "You started a streak 🔥"
                  : `${streak}-day streak! Keep it going 🔥`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sticky bottom action */}
      <div className="fixed bottom-0 left-0 right-0 lg:absolute lg:relative p-4 bg-background/95 backdrop-blur-sm border-t border-border/50 lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={handleAddMissingToGrocery}
            disabled={!missing.length || addedToGrocery}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors",
              addedToGrocery || !missing.length
                ? "border-border text-muted-foreground"
                : "border-border hover:bg-muted"
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            {addedToGrocery ? "Added" : "Grocery list"}
          </button>

          <button
            onClick={handleCook}
            disabled={cooked || cookLoading}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all",
              cooked
                ? "bg-green-500 text-white"
                : "bg-primary text-white hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-primary/20"
            )}
          >
            {cooked ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Cooked!
              </>
            ) : cookLoading ? (
              "Saving…"
            ) : (
              <>
                <ChefHat className="w-4 h-4" /> I cooked this!
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
