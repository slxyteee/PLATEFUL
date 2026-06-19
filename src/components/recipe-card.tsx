import Link from "next/link";
import { Clock, ChefHat, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types";

const DIFFICULTY_COLOR = {
  easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const CUISINE_GRADIENTS = [
  "from-orange-400 to-rose-400",
  "from-emerald-400 to-teal-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-pink-400 to-rose-500",
];

function matchColor(score: number) {
  if (score >= 90) return "bg-green-500 text-white";
  if (score >= 70) return "bg-yellow-500 text-white";
  if (score >= 50) return "bg-orange-500 text-white";
  return "bg-red-500 text-white";
}

function matchLabel(score: number) {
  if (score >= 90) return "Perfect match";
  if (score >= 70) return "Great match";
  if (score >= 50) return "Good match";
  return "Partial match";
}

interface RecipeCardProps {
  recipe: Recipe;
  index?: number;
  onCook?: (recipe: Recipe) => void;
}

export function RecipeCard({ recipe, index = 0, onCook }: RecipeCardProps) {
  const gradient = CUISINE_GRADIENTS[index % CUISINE_GRADIENTS.length];
  const missingCount = recipe.missing_ingredients?.length ?? 0;

  return (
    <article className="bg-card border border-border/60 rounded-2xl overflow-hidden flex flex-col hover:border-primary/30 hover:shadow-md transition-all duration-200 group">
      {/* Image / gradient placeholder */}
      <div className={cn("relative h-40 bg-gradient-to-br", gradient)}>
        {recipe.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-80">🍽️</span>
          </div>
        )}

        {/* YouTube badge */}
        {recipe.youtube_url && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/65 backdrop-blur-sm rounded-full px-2 py-1 border border-white/10">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#FF0000]">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/>
            </svg>
            <span className="text-white text-[10px] font-semibold tracking-wide">Watch</span>
          </div>
        )}

        {/* Match score badge */}
        <div
          className={cn(
            "absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold",
            matchColor(recipe.match_score)
          )}
        >
          {recipe.match_score}%
        </div>

        {/* Difficulty badge */}
        <div
          className={cn(
            "absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold capitalize",
            DIFFICULTY_COLOR[recipe.difficulty]
          )}
        >
          {recipe.difficulty}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
            {recipe.cuisine}
          </p>
          <h3 className="font-display font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
            {recipe.title}
          </h3>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {recipe.duration_minutes} min
          </span>
          <span className="flex items-center gap-1">
            <ChefHat className="w-3.5 h-3.5" />
            {matchLabel(recipe.match_score)}
          </span>
        </div>

        {/* Missing ingredients */}
        {missingCount > 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400">
            Missing {missingCount} ingredient{missingCount === 1 ? "" : "s"}:{" "}
            {recipe.missing_ingredients?.slice(0, 2).join(", ")}
            {missingCount > 2 ? ` +${missingCount - 2} more` : ""}
          </p>
        )}

        {/* Nutrition row */}
        {recipe.nutrition && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{recipe.nutrition.calories} kcal</span>
            <span>{recipe.nutrition.protein_g}g protein</span>
            <span>{recipe.nutrition.carbs_g}g carbs</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <Link
            href={`/recipe/${recipe.id}`}
            className="flex-1 text-center text-sm font-medium py-2 rounded-xl border border-border hover:bg-muted transition-colors"
          >
            View recipe
          </Link>
          {onCook && (
            <button
              onClick={() => onCook(recipe)}
              className="flex-1 text-sm font-medium py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Cook this
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-40 bg-muted" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="h-5 bg-muted rounded w-4/5" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-8 bg-muted rounded-xl" />
        <div className="h-9 bg-muted rounded-xl" />
      </div>
    </div>
  );
}
