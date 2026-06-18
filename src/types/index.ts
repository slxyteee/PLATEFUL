export type { Database } from "./database.types";

export interface Ingredient {
  id: string;
  name: string;
  slug: string;
  icon_key: string;
  category: string | null;
}

export interface PantryItem {
  id: string;
  user_id: string;
  ingredient_id: string;
  added_at: string;
  expires_at: string | null;
  ingredient?: Ingredient;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  have: boolean;
}

export interface RecipeStep {
  step_number: number;
  instruction: string;
  duration_seconds?: number;
}

export interface RecipeNutrition {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  cuisine: string;
  duration_minutes: number;
  difficulty: "easy" | "medium" | "hard";
  match_score: number;
  image_url: string | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: RecipeNutrition | null;
  missing_ingredients: string[] | null;
  created_at: string;
}

export interface GeneratePayload {
  ingredients: string[];
  cuisine: string;
  duration: "quick" | "standard" | "slow" | "any";
  dietary: string[];
  mealType: string;
  servings: number;
  spiceTolerance: string;
  leftoversMode: boolean;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  dietary_prefs: string[];
  allergies: string[];
  default_servings: number;
  units: "imperial" | "metric";
  theme_preference: "light" | "dark" | "system";
  reduce_motion: boolean;
  text_size: "small" | "medium" | "large";
  created_at: string;
}
