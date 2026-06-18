import { create } from "zustand";
import type { Ingredient } from "@/types";

interface GenerateFilters {
  cuisine: string;
  duration: "quick" | "standard" | "slow" | "any";
  dietary: string[];
  mealType: string;
  servings: number;
  spiceTolerance: string;
  leftoversMode: boolean;
}

interface IngredientStore {
  selectedIngredients: Ingredient[];
  filters: GenerateFilters;
  addIngredient: (ingredient: Ingredient) => void;
  removeIngredient: (id: string) => void;
  clearIngredients: () => void;
  setFilter: <K extends keyof GenerateFilters>(key: K, value: GenerateFilters[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: GenerateFilters = {
  cuisine: "no-preference",
  duration: "any",
  dietary: [],
  mealType: "any",
  servings: 2,
  spiceTolerance: "medium",
  leftoversMode: false,
};

export const useIngredientStore = create<IngredientStore>((set) => ({
  selectedIngredients: [],
  filters: defaultFilters,

  addIngredient: (ingredient) =>
    set((state) => {
      if (state.selectedIngredients.find((i) => i.id === ingredient.id)) return state;
      return { selectedIngredients: [...state.selectedIngredients, ingredient] };
    }),

  removeIngredient: (id) =>
    set((state) => ({
      selectedIngredients: state.selectedIngredients.filter((i) => i.id !== id),
    })),

  clearIngredients: () => set({ selectedIngredients: [] }),

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
