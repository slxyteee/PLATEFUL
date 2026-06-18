"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const DIETARY_OPTIONS = [
  "vegetarian", "vegan", "pescatarian", "keto", "paleo",
  "gluten-free", "dairy-free", "halal", "kosher", "low-carb",
];
const ALLERGY_OPTIONS = [
  "nuts", "peanuts", "shellfish", "fish", "eggs",
  "dairy", "soy", "wheat", "sesame", "sulfites",
];

interface Profile {
  id: string;
  display_name: string | null;
  dietary_prefs: string[];
  allergies: string[];
  default_servings: number;
  units: "imperial" | "metric";
  theme_preference: "light" | "dark" | "system";
  reduce_motion: boolean;
  text_size: "small" | "medium" | "large";
}

interface Props {
  profile: Profile;
  email: string;
}

function TogglePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium border transition-all capitalize",
        active
          ? "bg-primary text-white border-primary"
          : "bg-card text-foreground border-border hover:border-primary/40"
      )}
    >
      {label}
    </button>
  );
}

export function SettingsClient({ profile, email }: Props) {
  const [name, setName] = useState(profile.display_name ?? "");
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(profile.dietary_prefs ?? []);
  const [allergies, setAllergies] = useState<string[]>(profile.allergies ?? []);
  const [servings, setServings] = useState(profile.default_servings);
  const [units, setUnits] = useState(profile.units);
  const [theme, setTheme] = useState(profile.theme_preference);
  const [reduceMotion, setReduceMotion] = useState(profile.reduce_motion);
  const [textSize, setTextSize] = useState(profile.text_size);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function toggleDiet(v: string) {
    setDietaryPrefs((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  function toggleAllergy(v: string) {
    setAllergies((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({
        display_name: name.trim() || null,
        dietary_prefs: dietaryPrefs,
        allergies,
        default_servings: servings,
        units,
        theme_preference: theme,
        reduce_motion: reduceMotion,
        text_size: textSize,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (err) {
      setError("Failed to save. Try again.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">{email}</p>
      </div>

      {/* Profile */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Profile</h2>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>
      </section>

      {/* Dietary prefs */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Dietary preferences</h2>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((opt) => (
            <TogglePill
              key={opt}
              label={opt}
              active={dietaryPrefs.includes(opt)}
              onClick={() => toggleDiet(opt)}
            />
          ))}
        </div>
      </section>

      {/* Allergies */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Allergies</h2>
        <div className="flex flex-wrap gap-2">
          {ALLERGY_OPTIONS.map((opt) => (
            <TogglePill
              key={opt}
              label={opt}
              active={allergies.includes(opt)}
              onClick={() => toggleAllergy(opt)}
            />
          ))}
        </div>
      </section>

      {/* Cooking defaults */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Cooking defaults</h2>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Default servings</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors text-lg"
            >
              −
            </button>
            <span className="font-semibold w-4 text-center">{servings}</span>
            <button
              type="button"
              onClick={() => setServings(Math.min(12, servings + 1))}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors text-lg"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Measurement units</label>
          <div className="flex gap-1 bg-muted p-1 rounded-xl">
            {(["imperial", "metric"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnits(u)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
                  units === u ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Appearance</h2>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Theme</label>
          <div className="flex gap-1 bg-muted p-1 rounded-xl">
            {(["light", "system", "dark"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
                  theme === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Text size</label>
          <div className="flex gap-1 bg-muted p-1 rounded-xl">
            {(["small", "medium", "large"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTextSize(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
                  textSize === s ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Reduce motion</p>
            <p className="text-xs text-muted-foreground">Minimise animations</p>
          </div>
          <button
            type="button"
            onClick={() => setReduceMotion((v) => !v)}
            className={cn(
              "w-12 h-6 rounded-full transition-colors relative",
              reduceMotion ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                reduceMotion ? "translate-x-6" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
      )}

      {/* Save button */}
      <button
        type="submit"
        disabled={saving}
        className={cn(
          "w-full py-3 rounded-xl font-semibold text-sm transition-all",
          saved
            ? "bg-green-500 text-white"
            : "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
        )}
      >
        {saving ? "Saving…" : saved ? "✓ Saved!" : "Save settings"}
      </button>
    </form>
  );
}
