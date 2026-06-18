import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GenerateClient } from "./generate-client";
import type { Ingredient } from "@/types";

export default async function GeneratePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: pantryItems }, { data: profile }] = await Promise.all([
    supabase
      .from("pantry_items")
      .select("ingredient_id, ingredients(*)")
      .eq("user_id", user.id),
    supabase
      .from("profiles")
      .select("dietary_prefs")
      .eq("id", user.id)
      .single(),
  ]);

  const pantryIngredients =
    pantryItems
      ?.map((p) => p.ingredients as unknown as Ingredient)
      .filter(Boolean) ?? [];

  const userDietary = profile?.dietary_prefs ?? [];

  return (
    <GenerateClient
      pantryIngredients={pantryIngredients}
      userDietary={userDietary}
    />
  );
}
