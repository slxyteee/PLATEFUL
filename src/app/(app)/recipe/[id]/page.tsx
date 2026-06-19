import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { RecipeDetailClient } from "./recipe-detail-client";
import type { Recipe, RecipeIngredient, RecipeStep, RecipeNutrition } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: raw }, { data: fav }, { data: history }, { data: profile }] =
    await Promise.all([
      supabase.from("recipes_generated").select("*").eq("id", id).eq("user_id", user.id).single(),
      supabase.from("favorites").select("recipe_id").eq("user_id", user.id).eq("recipe_id", id).maybeSingle(),
      supabase.from("cooking_history").select("id").eq("user_id", user.id).eq("recipe_id", id).maybeSingle(),
      supabase.from("profiles").select("default_servings").eq("id", user.id).single(),
    ]);

  if (!raw) notFound();

  const recipe: Recipe = {
    id: raw.id,
    user_id: raw.user_id,
    title: raw.title,
    cuisine: raw.cuisine,
    duration_minutes: raw.duration_minutes,
    difficulty: raw.difficulty as "easy" | "medium" | "hard",
    match_score: raw.match_score,
    image_url: raw.image_url,
    youtube_url: raw.youtube_url,
    ingredients: raw.ingredients as unknown as RecipeIngredient[],
    steps: raw.steps as unknown as RecipeStep[],
    nutrition: raw.nutrition as unknown as RecipeNutrition | null,
    missing_ingredients: raw.missing_ingredients,
    created_at: raw.created_at,
  };

  return (
    <RecipeDetailClient
      recipe={recipe}
      userId={user.id}
      isFavorited={!!fav}
      hasCooked={!!history}
      servings={profile?.default_servings ?? 2}
    />
  );
}
