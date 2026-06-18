export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type ProfileRow = {
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
};

type IngredientsRow = {
  id: string;
  name: string;
  slug: string;
  icon_key: string;
  category: string | null;
};

type PantryItemRow = {
  id: string;
  user_id: string;
  ingredient_id: string;
  added_at: string;
  expires_at: string | null;
};

type RecipeRow = {
  id: string;
  user_id: string;
  title: string;
  cuisine: string;
  duration_minutes: number;
  difficulty: "easy" | "medium" | "hard";
  match_score: number;
  image_url: string | null;
  ingredients: Json;
  steps: Json;
  nutrition: Json | null;
  missing_ingredients: string[] | null;
  created_at: string;
};

type CookingHistoryRow = {
  id: string;
  user_id: string;
  recipe_id: string;
  cooked_at: string;
  rating: number | null;
};

type StreakRow = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_cooked_date: string | null;
};

type GroceryListRow = {
  id: string;
  user_id: string;
  items: Json;
  completed: boolean;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      ingredients: {
        Row: IngredientsRow;
        Insert: Omit<IngredientsRow, "id">;
        Update: Partial<IngredientsRow>;
        Relationships: [];
      };
      pantry_items: {
        Row: PantryItemRow;
        Insert: {
          id?: string;
          user_id: string;
          ingredient_id: string;
          added_at?: string;
          expires_at?: string | null;
        };
        Update: Partial<PantryItemRow>;
        Relationships: [
          {
            foreignKeyName: "pantry_items_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          }
        ];
      };
      recipes_generated: {
        Row: RecipeRow;
        Insert: Omit<RecipeRow, "id" | "created_at">;
        Update: Partial<RecipeRow>;
        Relationships: [];
      };
      favorites: {
        Row: { user_id: string; recipe_id: string; created_at: string };
        Insert: { user_id: string; recipe_id: string; created_at?: string };
        Update: { user_id?: string; recipe_id?: string; created_at?: string };
        Relationships: [
          {
            foreignKeyName: "favorites_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes_generated";
            referencedColumns: ["id"];
          }
        ];
      };
      cooking_history: {
        Row: CookingHistoryRow;
        Insert: {
          id?: string;
          user_id: string;
          recipe_id: string;
          cooked_at?: string;
          rating?: number | null;
        };
        Update: Partial<CookingHistoryRow>;
        Relationships: [
          {
            foreignKeyName: "cooking_history_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes_generated";
            referencedColumns: ["id"];
          }
        ];
      };
      streaks: {
        Row: StreakRow;
        Insert: Partial<StreakRow> & { user_id: string };
        Update: Partial<StreakRow>;
        Relationships: [];
      };
      grocery_lists: {
        Row: GroceryListRow;
        Insert: {
          id?: string;
          user_id: string;
          items?: Json;
          completed?: boolean;
          created_at?: string;
        };
        Update: Partial<GroceryListRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
