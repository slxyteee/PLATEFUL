import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PantryClient } from "./pantry-client";
import type { Ingredient } from "@/types";

export default async function PantryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: ingredients }, { data: pantryItems }] = await Promise.all([
    supabase.from("ingredients").select("*").order("name"),
    supabase
      .from("pantry_items")
      .select("ingredient_id")
      .eq("user_id", user.id),
  ]);

  const pantryIds = pantryItems?.map((p) => p.ingredient_id) ?? [];

  return (
    <PantryClient
      allIngredients={(ingredients ?? []) as Ingredient[]}
      initialPantryIds={pantryIds}
      userId={user.id}
    />
  );
}
