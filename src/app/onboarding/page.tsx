"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DIETARY_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "dairy-free", label: "Dairy-Free" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "nut-free", label: "Nut-Free" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "low-carb", label: "Low-Carb" },
  { value: "keto", label: "Keto" },
];

const ALLERGY_OPTIONS = [
  { value: "nuts", label: "Tree Nuts" },
  { value: "peanuts", label: "Peanuts" },
  { value: "shellfish", label: "Shellfish" },
  { value: "dairy", label: "Dairy" },
  { value: "eggs", label: "Eggs" },
  { value: "gluten", label: "Gluten" },
  { value: "soy", label: "Soy" },
  { value: "fish", label: "Fish" },
  { value: "wheat", label: "Wheat" },
  { value: "sesame", label: "Sesame" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

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
        "px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150 select-none",
        active
          ? "bg-primary text-white border-primary shadow-sm"
          : "border-border text-foreground hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      {label}
    </button>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [servings, setServings] = useState(2);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function goTo(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function toggle(list: string[], setList: (l: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  }

  async function finish() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    await supabase
      .from("profiles")
      .update({
        display_name: name.trim() || null,
        dietary_prefs: dietary,
        allergies,
        default_servings: servings,
      })
      .eq("id", user.id);

    await supabase.auth.updateUser({ data: { onboarding_complete: true } });

    router.push("/generate");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                n === step
                  ? "w-10 bg-primary"
                  : n < step
                    ? "w-4 bg-primary/40"
                    : "w-4 bg-border"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col gap-6"
            >
              <div>
                <h1 className="font-display text-3xl font-bold">Hi there! 👋</h1>
                <p className="text-muted-foreground mt-2">What should we call you?</p>
              </div>
              <Input
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && goTo(2)}
                className="text-base h-12"
              />
              <Button onClick={() => goTo(2)} className="w-full h-12 text-base">
                Continue →
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col gap-6"
            >
              <div>
                <h1 className="font-display text-3xl font-bold">Dietary preferences?</h1>
                <p className="text-muted-foreground mt-2">
                  Select all that apply — we&apos;ll filter recipes accordingly.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((o) => (
                  <TogglePill
                    key={o.value}
                    label={o.label}
                    active={dietary.includes(o.value)}
                    onClick={() => toggle(dietary, setDietary, o.value)}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => goTo(1)} className="h-12 px-6">
                  ← Back
                </Button>
                <Button onClick={() => goTo(3)} className="flex-1 h-12">
                  Continue →
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col gap-6"
            >
              <div>
                <h1 className="font-display text-3xl font-bold">Any allergies?</h1>
                <p className="text-muted-foreground mt-2">
                  We&apos;ll always warn you about these ingredients.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALLERGY_OPTIONS.map((o) => (
                  <TogglePill
                    key={o.value}
                    label={o.label}
                    active={allergies.includes(o.value)}
                    onClick={() => toggle(allergies, setAllergies, o.value)}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Default servings</p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-xl hover:bg-muted transition-colors"
                  >
                    −
                  </button>
                  <span className="text-2xl font-display font-bold w-8 text-center">
                    {servings}
                  </span>
                  <button
                    type="button"
                    onClick={() => setServings(Math.min(12, servings + 1))}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-xl hover:bg-muted transition-colors"
                  >
                    +
                  </button>
                  <span className="text-muted-foreground text-sm">people</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => goTo(2)} className="h-12 px-6">
                  ← Back
                </Button>
                <Button
                  onClick={finish}
                  disabled={loading}
                  className="flex-1 h-12 text-base"
                >
                  {loading ? "Setting up…" : "Let's cook! 🍳"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
