import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  return (
    <SettingsClient
      profile={{
        id: profile.id,
        display_name: profile.display_name,
        dietary_prefs: profile.dietary_prefs ?? [],
        allergies: profile.allergies ?? [],
        default_servings: profile.default_servings,
        units: profile.units as "imperial" | "metric",
        theme_preference: profile.theme_preference as "light" | "dark" | "system",
        reduce_motion: profile.reduce_motion,
        text_size: profile.text_size as "small" | "medium" | "large",
      }}
      email={user.email ?? ""}
    />
  );
}
