import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import type { GeneratePayload, RecipeIngredient, RecipeStep, RecipeNutrition } from "@/types";
import type { Json } from "@/types/database.types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

async function fetchYouTubeVideo(title: string, cuisine: string): Promise<{ thumbnailUrl: string; videoUrl: string } | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;
  const query = `${title} ${cuisine} recipe cooking`;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=medium&maxResults=1&relevanceLanguage=en&key=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json() as {
      items?: Array<{
        id: { videoId: string };
        snippet: { thumbnails: { high?: { url: string }; medium?: { url: string }; default: { url: string } } };
      }>;
    };
    const item = data.items?.[0];
    if (!item) return null;
    const videoId = item.id.videoId;
    const thumbnailUrl =
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default.url;
    return { thumbnailUrl, videoUrl: `https://www.youtube.com/watch?v=${videoId}` };
  } catch {
    return null;
  }
}

const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"] as const;

const DURATION_LABEL: Record<string, string> = {
  quick: "30 minutes or less",
  standard: "around 60 minutes",
  slow: "up to 2 hours",
  any: "any duration",
};

function buildPrompt(payload: GeneratePayload): string {
  const lines = [
    `You are a world-class chef. Generate ${payload.ingredients.length >= 8 ? "5" : payload.ingredients.length >= 4 ? "4" : "3"} practical recipe suggestions.`,
    "",
    `AVAILABLE INGREDIENTS: ${payload.ingredients.join(", ")}`,
    "",
    "CONSTRAINTS:",
    `- Cuisine: ${payload.cuisine === "no-preference" ? "any" : payload.cuisine}`,
    `- Time: ${DURATION_LABEL[payload.duration] ?? "any"}`,
    `- Dietary: ${payload.dietary.length ? payload.dietary.join(", ") : "none"}`,
    `- Meal type: ${payload.mealType === "any" ? "any" : payload.mealType}`,
    `- Servings: ${payload.servings}`,
    `- Spice tolerance: ${payload.spiceTolerance}`,
    `- Leftover mode: ${payload.leftoversMode ? "YES — prioritize recipes that use the most available ingredients, minimizing waste" : "no"}`,
    "",
    "Return a JSON object with this EXACT structure (no other fields, no markdown):",
    `{
  "recipes": [
    {
      "title": "Recipe Name Here",
      "cuisine": "Italian",
      "duration_minutes": 30,
      "difficulty": "easy",
      "match_score": 85,
      "missing_ingredients": ["ingredient not in pantry"],
      "ingredients": [
        { "name": "chicken breast", "quantity": 200, "unit": "g", "have": true },
        { "name": "parmesan", "quantity": 50, "unit": "g", "have": false }
      ],
      "steps": [
        { "step_number": 1, "instruction": "Heat olive oil in a pan over medium-high heat.", "duration_seconds": 60 },
        { "step_number": 2, "instruction": "Season chicken with salt, pepper, and paprika.", "duration_seconds": 30 },
        { "step_number": 3, "instruction": "Add chicken to the pan.", "duration_seconds": 10 },
        { "step_number": 4, "instruction": "Cook 5-6 minutes until golden brown, then flip.", "duration_seconds": 360 }
      ],
      "nutrition": { "calories": 450, "protein_g": 35, "carbs_g": 20, "fat_g": 18 }
    }
  ]
}`,
    "",
    "RULES:",
    "1. title must be a real descriptive recipe name (never 'Untitled')",
    "2. match_score = integer 0–100: % of required ingredients the user already has",
    "3. have:true for ingredients in AVAILABLE INGREDIENTS, have:false for others",
    "4. missing_ingredients = names of required ingredients the user does NOT have",
    "5. difficulty must be exactly 'easy', 'medium', or 'hard'",
    "6. duration_minutes must be a realistic integer",
    "7. nutrition values are per serving",
    "8. Break steps into many small single-action steps (aim for 8-12 steps per recipe). Each step is ONE action only — one sentence, short and clear. Like a checklist: 'Heat oil in pan over medium heat.', 'Season chicken with salt and pepper.', 'Add garlic and cook 1 minute until fragrant.' Never combine multiple actions into one step.",
  ];
  return lines.join("\n");
}

interface RawRecipe {
  title: string;
  cuisine: string;
  duration_minutes: number;
  difficulty: "easy" | "medium" | "hard";
  match_score: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: RecipeNutrition;
  missing_ingredients: string[];
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: GeneratePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!payload.ingredients?.length) {
    return NextResponse.json({ error: "No ingredients provided" }, { status: 400 });
  }

  const userPrompt = buildPrompt(payload);
  let raw: string | null = null;

  for (const model of MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              'You are a professional chef. Always respond with a valid JSON object containing a "recipes" array of recipe objects. No markdown, no explanation — JSON only.',
          },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.75,
        max_tokens: 4096,
      });
      raw = completion.choices[0]?.message?.content ?? null;
      if (raw) break;
    } catch (err) {
      console.error(`[generate] Model ${model} failed:`, err);
    }
  }

  if (!raw) {
    console.error("[generate] All models failed. GROQ_API_KEY set:", !!process.env.GROQ_API_KEY);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }

  let parsed: { recipes?: RawRecipe[] };
  try {
    parsed = JSON.parse(raw) as { recipes?: RawRecipe[] };
  } catch {
    return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
  }

  const recipes = (parsed.recipes ?? []).slice(0, 5);
  if (!recipes.length) {
    return NextResponse.json({ error: "No recipes returned" }, { status: 500 });
  }

  const rows = recipes.map((r) => ({
    user_id: user.id,
    title: r.title ?? "Untitled Recipe",
    cuisine: r.cuisine ?? "International",
    duration_minutes: Number(r.duration_minutes) || 30,
    difficulty: (["easy", "medium", "hard"].includes(r.difficulty) ? r.difficulty : "medium") as
      | "easy"
      | "medium"
      | "hard",
    match_score: Math.max(0, Math.min(100, Number(r.match_score) || 0)),
    image_url: null as string | null,
    ingredients: (r.ingredients ?? []) as unknown as Json,
    steps: (r.steps ?? []) as unknown as Json,
    nutrition: (r.nutrition ?? null) as unknown as Json,
    missing_ingredients: Array.isArray(r.missing_ingredients) ? r.missing_ingredients : [],
  }));

  const { data: saved, error } = await supabase
    .from("recipes_generated")
    .insert(rows)
    .select("*");

  if (error) {
    console.error("[generate] Supabase insert error:", error);
    return NextResponse.json({ error: "Failed to save recipes" }, { status: 500 });
  }

  // Fetch YouTube videos in parallel for each recipe
  const ytResults = await Promise.all(
    saved.map((r) => fetchYouTubeVideo(r.title, r.cuisine))
  );

  // Update DB with YouTube data and merge into response
  await Promise.all(
    saved.map((r, i) => {
      const yt = ytResults[i];
      if (!yt) return Promise.resolve();
      return supabase
        .from("recipes_generated")
        .update({ image_url: yt.thumbnailUrl, youtube_url: yt.videoUrl })
        .eq("id", r.id);
    })
  );

  const finalRecipes = saved.map((r, i) => {
    const yt = ytResults[i];
    if (!yt) return r;
    return { ...r, image_url: yt.thumbnailUrl, youtube_url: yt.videoUrl };
  });

  return NextResponse.json({ recipes: finalRecipes });
}
