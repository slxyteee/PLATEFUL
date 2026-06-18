import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODELS = ["moonshotai/kimi-k2-instruct-0905", "llama-3.3-70b-versatile"];

interface SubstituteRequest {
  missingIngredient: string;
  recipeContext: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: SubstituteRequest = await req.json();
  const { missingIngredient, recipeContext } = body;

  if (!missingIngredient) {
    return NextResponse.json({ error: "missingIngredient required" }, { status: 400 });
  }

  // Fetch pantry items
  const { data: pantryRows } = await supabase
    .from("pantry_items")
    .select("ingredients(name)")
    .eq("user_id", user.id);

  const pantryIngredients = (pantryRows ?? [])
    .map((r) => (r.ingredients as { name: string } | null)?.name)
    .filter(Boolean) as string[];

  const prompt = `You are a professional chef helping substitute missing ingredients.

Recipe context: ${recipeContext}
Missing ingredient: ${missingIngredient}
User's pantry: ${pantryIngredients.join(", ") || "empty"}

Suggest the best substitute from the user's pantry (or a common pantry staple if none fit).
Respond with a JSON object with these exact fields:
- "substitute": the ingredient name (string, or null if no reasonable substitute)
- "ratio": how much substitute per 1 unit of original (string, e.g. "1:1" or "use 2 tbsp per 1 cup")
- "note": one brief sentence on how the substitution changes the dish (string)`;

  let lastError: Error | null = null;
  for (const model of MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 300,
        temperature: 0.4,
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw);

      return NextResponse.json({
        substitute: parsed.substitute ?? null,
        ratio: parsed.ratio ?? "1:1",
        note: parsed.note ?? "",
      });
    } catch (e) {
      lastError = e as Error;
      continue;
    }
  }

  console.error("All models failed for substitution:", lastError);
  return NextResponse.json({ error: "Failed to get substitution" }, { status: 500 });
}
