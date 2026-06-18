"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Check, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Json } from "@/types/database.types";

interface GroceryItem {
  name: string;
  checked: boolean;
}

interface GroceryList {
  id: string;
  items: GroceryItem[];
  created_at: string;
  completed: boolean;
}

interface Props {
  lists: GroceryList[];
  userId: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function GroceryClient({ lists: initialLists, userId }: Props) {
  const [lists, setLists] = useState<GroceryList[]>(initialLists);
  const [newItem, setNewItem] = useState("");
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const activeList = lists.find((l) => !l.completed) ?? null;

  async function toggleItem(listId: string, idx: number) {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        const items = l.items.map((it, i) =>
          i === idx ? { ...it, checked: !it.checked } : it
        );
        return { ...l, items };
      })
    );

    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const items = list.items.map((it, i) =>
      i === idx ? { ...it, checked: !it.checked } : it
    );
    await supabase.from("grocery_lists").update({ items: items as unknown as Json }).eq("id", listId);
  }

  async function addItem() {
    const name = newItem.trim();
    if (!name) return;
    setNewItem("");

    if (activeList) {
      const items = [...activeList.items, { name, checked: false }];
      setLists((prev) =>
        prev.map((l) => (l.id === activeList.id ? { ...l, items } : l))
      );
      await supabase.from("grocery_lists").update({ items: items as unknown as Json }).eq("id", activeList.id);
    } else {
      const { data } = await supabase
        .from("grocery_lists")
        .insert({ user_id: userId, items: [{ name, checked: false }] as unknown as Json })
        .select()
        .single();
      if (data) {
        setLists((prev) => [
          { id: data.id, items: [{ name, checked: false }], created_at: data.created_at, completed: false },
          ...prev,
        ]);
      }
    }
  }

  async function clearChecked(listId: string) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const items = list.items.filter((it) => !it.checked);
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, items } : l)));
    await supabase.from("grocery_lists").update({ items: items as unknown as Json }).eq("id", listId);
  }

  async function completeList(listId: string) {
    startTransition(async () => {
      setLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, completed: true } : l))
      );
      await supabase.from("grocery_lists").update({ completed: true }).eq("id", listId);
    });
  }

  async function deleteList(listId: string) {
    startTransition(async () => {
      setLists((prev) => prev.filter((l) => l.id !== listId));
      await supabase.from("grocery_lists").delete().eq("id", listId);
    });
  }

  const checkedCount = activeList?.items.filter((i) => i.checked).length ?? 0;
  const totalCount = activeList?.items.length ?? 0;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Grocery List</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {activeList
            ? `${checkedCount}/${totalCount} items checked`
            : "Add items to start a new list."}
        </p>
      </div>

      {/* Add item input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Add an ingredient…"
          className="flex-1 px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
        />
        <button
          onClick={addItem}
          disabled={!newItem.trim()}
          className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Active list */}
      {activeList && activeList.items.length > 0 && (
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Current list · {formatDate(activeList.created_at)}
            </span>
            <div className="flex gap-2">
              {checkedCount > 0 && (
                <button
                  onClick={() => clearChecked(activeList.id)}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
                >
                  Clear checked
                </button>
              )}
              {totalCount > 0 && checkedCount === totalCount && (
                <button
                  onClick={() => completeList(activeList.id)}
                  className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Done shopping
                </button>
              )}
            </div>
          </div>

          <ul>
            {activeList.items.map((item, idx) => (
              <li
                key={idx}
                onClick={() => toggleItem(activeList.id, idx)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer select-none border-b border-border/30 last:border-0 transition-colors",
                  item.checked ? "bg-muted/40" : "hover:bg-muted/20"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    item.checked
                      ? "border-primary bg-primary"
                      : "border-border"
                  )}
                >
                  {item.checked && <Check className="w-3 h-3 text-white" />}
                </div>
                <span
                  className={cn(
                    "text-sm flex-1 transition-all",
                    item.checked && "line-through text-muted-foreground"
                  )}
                >
                  {item.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!activeList && lists.length === 0 && (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">Your list is empty</h2>
          <p className="text-muted-foreground text-sm">
            Add items above, or tap &quot;Add to list&quot; on any recipe to import missing ingredients.
          </p>
        </div>
      )}

      {/* Past lists */}
      {lists.filter((l) => l.completed).length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold mb-3 text-muted-foreground">
            Past lists
          </h2>
          <div className="flex flex-col gap-2">
            {lists
              .filter((l) => l.completed)
              .map((list) => (
                <div
                  key={list.id}
                  className="flex items-center gap-3 px-4 py-3 bg-card border border-border/40 rounded-xl"
                >
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {list.items.length} item{list.items.length === 1 ? "" : "s"}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(list.created_at)}</p>
                  </div>
                  <button
                    onClick={() => deleteList(list.id)}
                    disabled={isPending}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
