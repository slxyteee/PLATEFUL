import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Auto-create profile if missing (trigger may have failed at signup)
  if (!profile) {
    await supabase.from("profiles").upsert({ id: user.id });
    const { data: fresh } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = fresh;
  }

  if (!profile) redirect("/onboarding");

  return (
    <SettingsClient
      profile={{
        id: profile.id,
        display_name: profile.display_name,
        dietary_prefs: profile.dietary_prefs ?? [],
        allergies: profile.allergies ?? [],
        default_servings: profile.default_servings ?? 2,
        units: (profile.units ?? "metric") as "imperial" | "metric",
        theme_preference: (profile.theme_preference ?? "system") as "light" | "dark" | "system",
        reduce_motion: profile.reduce_motion ?? false,
        text_size: (profile.text_size ?? "medium") as "small" | "medium" | "large",
      }}
      email={user.email ?? ""}
    />
  );
}
