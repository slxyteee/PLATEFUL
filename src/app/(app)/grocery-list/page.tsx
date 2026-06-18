import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GroceryClient } from "./grocery-client";

export default async function GroceryListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("grocery_lists")
    .select("id, items, completed, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const lists = (rows ?? []).map((r) => ({
    id: r.id,
    items: (r.items as { name: string; checked: boolean }[]) ?? [],
    completed: r.completed,
    created_at: r.created_at,
  }));

  return <GroceryClient lists={lists} userId={user.id} />;
}
