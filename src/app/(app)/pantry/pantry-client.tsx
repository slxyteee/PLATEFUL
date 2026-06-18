"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { Search, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { getEmoji, CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/ingredient-icons";
import type { Ingredient } from "@/types";

interface Props {
  allIngredients: Ingredient[];
  initialPantryIds: string[];
  userId: string;
}

export function PantryClient({ allIngredients, initialPantryIds, userId }: Props) {
  const [pantryIds, setPantryIds] = useState<Set<string>>(() => new Set(initialPantryIds));
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = allIngredients.filter((i) => {
      if (activeCategory && i.category !== activeCategory) return false;
      if (q && !i.name.toLowerCase().includes(q)) return false;
      return true;
    });

    const map = new Map<string, Ingredient[]>();
    for (const ingredient of filtered) {
      const cat = ingredient.category ?? "other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(ingredient);
    }
    return map;
  }, [allIngredients, search, activeCategory]);

  const categories = useMemo(() => {
    return CATEGORY_ORDER.filter((c) => grouped.has(c));
  }, [grouped]);

  const pantryCount = pantryIds.size;

  const toggle = useCallback(
    async (ingredient: Ingredient) => {
      if (pending.has(ingredient.id)) return;

      const isIn = pantryIds.has(ingredient.id);
      setPantryIds((prev) => {
        const next = new Set(prev);
        if (isIn) next.delete(ingredient.id);
        else next.add(ingredient.id);
        return next;
      });
      setPending((prev) => new Set(prev).add(ingredient.id));

      const supabase = createClient();
      if (isIn) {
        await supabase
          .from("pantry_items")
          .delete()
          .eq("user_id", userId)
          .eq("ingredient_id", ingredient.id);
      } else {
        await supabase.from("pantry_items").insert({
          user_id: userId,
          ingredient_id: ingredient.id,
        });
      }

      setPending((prev) => {
        const next = new Set(prev);
        next.delete(ingredient.id);
        return next;
      });
    },
    [pantryIds, pending, userId]
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">My Fridge</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pantryCount === 0
              ? "Tap ingredients you have — we'll find recipes that use them."
              : `${pantryCount} ingredient${pantryCount === 1 ? "" : "s"} in your fridge`}
          </p>
        </div>
        {pantryCount > 0 && (
          <button
            onClick={() =>
              startTransition(async () => {
                const supabase = createClient();
                await supabase.from("pantry_items").delete().eq("user_id", userId);
                setPantryIds(new Set());
              })
            }
            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 mt-1 shrink-0"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search ingredients…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 h-11 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors shrink-0",
            activeCategory === null
              ? "bg-primary text-white border-primary"
              : "border-border hover:border-primary/40 text-muted-foreground"
          )}
        >
          All
        </button>
        {CATEGORY_ORDER.map((cat) => {
          const label = CATEGORY_LABEL[cat] ?? cat;
          const count = allIngredients.filter(
            (i) => i.category === cat && pantryIds.has(i.id)
          ).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors shrink-0 flex items-center gap-1.5",
                activeCategory === cat
                  ? "bg-primary text-white border-primary"
                  : "border-border hover:border-primary/40 text-muted-foreground"
              )}
            >
              {label}
              {count > 0 && (
                <span
                  className={cn(
                    "text-xs font-bold rounded-full px-1.5 py-0.5 leading-none",
                    activeCategory === cat
                      ? "bg-white/20 text-white"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Ingredient sections */}
      {categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No ingredients found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {categories.map((cat) => {
            const items = grouped.get(cat) ?? [];
            const inPantryCount = items.filter((i) => pantryIds.has(i.id)).length;
            return (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-display font-semibold text-base">
                    {CATEGORY_LABEL[cat] ?? cat}
                  </h2>
                  {inPantryCount > 0 && (
                    <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                      {inPantryCount}/{items.length}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {items.map((ingredient) => {
                    const inPantry = pantryIds.has(ingredient.id);
                    const isPending = pending.has(ingredient.id);
                    return (
                      <button
                        key={ingredient.id}
                        onClick={() => toggle(ingredient)}
                        disabled={isPending}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-150 select-none",
                          inPantry
                            ? "bg-primary/8 border-primary/40 shadow-sm"
                            : "bg-card border-border hover:border-primary/30 hover:bg-muted/40",
                          isPending && "opacity-60"
                        )}
                      >
                        <span className="text-2xl leading-none">
                          {getEmoji(ingredient.icon_key)}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-medium leading-tight",
                            inPantry ? "text-primary" : "text-foreground"
                          )}
                        >
                          {ingredient.name}
                        </span>
                        {inPantry && (
                          <Check className="w-3 h-3 text-primary" strokeWidth={3} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Sticky pantry summary */}
      {pantryCount > 0 && (
        <div className="sticky bottom-24 lg:bottom-6 pointer-events-none">
          <div className="pointer-events-auto mx-auto max-w-xs">
            <a
              href="/generate"
              className="flex items-center justify-between gap-3 px-5 py-3.5 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="font-semibold text-sm">
                {pantryCount} ingredient{pantryCount === 1 ? "" : "s"} ready
              </span>
              <span className="text-sm font-bold">Find recipes →</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
