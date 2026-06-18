-- ============================================================
-- Plateful — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- =====================
-- TABLES
-- =====================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  dietary_prefs TEXT[] NOT NULL DEFAULT '{}',
  allergies TEXT[] NOT NULL DEFAULT '{}',
  default_servings SMALLINT NOT NULL DEFAULT 2 CHECK (default_servings BETWEEN 1 AND 12),
  units TEXT NOT NULL DEFAULT 'metric' CHECK (units IN ('imperial', 'metric')),
  theme_preference TEXT NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  reduce_motion BOOLEAN NOT NULL DEFAULT false,
  text_size TEXT NOT NULL DEFAULT 'medium' CHECK (text_size IN ('small', 'medium', 'large')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon_key TEXT NOT NULL,
  category TEXT
);

CREATE TABLE IF NOT EXISTS public.pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE (user_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS public.recipes_generated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  match_score SMALLINT NOT NULL CHECK (match_score BETWEEN 0 AND 100),
  image_url TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]',
  steps JSONB NOT NULL DEFAULT '[]',
  nutrition JSONB,
  missing_ingredients TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes_generated(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS public.cooking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes_generated(id) ON DELETE CASCADE,
  cooked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS public.streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_cooked_date DATE
);

CREATE TABLE IF NOT EXISTS public.grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS pantry_items_user_id_idx ON public.pantry_items(user_id);
CREATE INDEX IF NOT EXISTS recipes_generated_user_id_idx ON public.recipes_generated(user_id);
CREATE INDEX IF NOT EXISTS cooking_history_user_id_idx ON public.cooking_history(user_id);
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS grocery_lists_user_id_idx ON public.grocery_lists(user_id);
CREATE INDEX IF NOT EXISTS ingredients_category_idx ON public.ingredients(category);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes_generated ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ingredients (read-only for all authenticated users)
CREATE POLICY "ingredients_select" ON public.ingredients FOR SELECT USING (auth.role() = 'authenticated');

-- pantry_items
CREATE POLICY "pantry_select" ON public.pantry_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pantry_insert" ON public.pantry_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pantry_update" ON public.pantry_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pantry_delete" ON public.pantry_items FOR DELETE USING (auth.uid() = user_id);

-- recipes_generated
CREATE POLICY "recipes_select" ON public.recipes_generated FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recipes_insert" ON public.recipes_generated FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipes_update" ON public.recipes_generated FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recipes_delete" ON public.recipes_generated FOR DELETE USING (auth.uid() = user_id);

-- favorites
CREATE POLICY "favorites_select" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- cooking_history
CREATE POLICY "history_select" ON public.cooking_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "history_insert" ON public.cooking_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "history_update" ON public.cooking_history FOR UPDATE USING (auth.uid() = user_id);

-- streaks
CREATE POLICY "streaks_select" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "streaks_insert" ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "streaks_update" ON public.streaks FOR UPDATE USING (auth.uid() = user_id);

-- grocery_lists
CREATE POLICY "grocery_select" ON public.grocery_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "grocery_insert" ON public.grocery_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "grocery_update" ON public.grocery_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "grocery_delete" ON public.grocery_lists FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- TRIGGER: Auto-create profile + streak on signup
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- SEED: ~130 ingredients
-- =====================
INSERT INTO public.ingredients (name, slug, icon_key, category) VALUES
-- Proteins
('Chicken Breast', 'chicken-breast', 'chicken', 'protein'),
('Chicken Thigh', 'chicken-thigh', 'chicken', 'protein'),
('Ground Beef', 'ground-beef', 'beef', 'protein'),
('Beef Steak', 'beef-steak', 'beef', 'protein'),
('Ground Turkey', 'ground-turkey', 'turkey', 'protein'),
('Pork Chops', 'pork-chops', 'pork', 'protein'),
('Bacon', 'bacon', 'bacon', 'protein'),
('Ham', 'ham', 'ham', 'protein'),
('Sausage', 'sausage', 'sausage', 'protein'),
('Salmon', 'salmon', 'fish', 'protein'),
('Tuna', 'tuna', 'fish', 'protein'),
('Shrimp', 'shrimp', 'shrimp', 'protein'),
('Cod', 'cod', 'fish', 'protein'),
('Tilapia', 'tilapia', 'fish', 'protein'),
('Eggs', 'eggs', 'eggs', 'protein'),
('Tofu', 'tofu', 'tofu', 'protein'),
('Tempeh', 'tempeh', 'tempeh', 'protein'),
('Lentils', 'lentils', 'lentils', 'protein'),
('Chickpeas', 'chickpeas', 'chickpeas', 'protein'),
('Black Beans', 'black-beans', 'beans', 'protein'),
('Kidney Beans', 'kidney-beans', 'beans', 'protein'),
('Edamame', 'edamame', 'edamame', 'protein'),
('Lamb', 'lamb', 'lamb', 'protein'),
-- Vegetables
('Onion', 'onion', 'onion', 'vegetable'),
('Red Onion', 'red-onion', 'onion', 'vegetable'),
('Garlic', 'garlic', 'garlic', 'vegetable'),
('Tomato', 'tomato', 'tomato', 'vegetable'),
('Cherry Tomato', 'cherry-tomato', 'tomato', 'vegetable'),
('Potato', 'potato', 'potato', 'vegetable'),
('Sweet Potato', 'sweet-potato', 'sweet-potato', 'vegetable'),
('Carrot', 'carrot', 'carrot', 'vegetable'),
('Broccoli', 'broccoli', 'broccoli', 'vegetable'),
('Cauliflower', 'cauliflower', 'cauliflower', 'vegetable'),
('Spinach', 'spinach', 'spinach', 'vegetable'),
('Kale', 'kale', 'kale', 'vegetable'),
('Lettuce', 'lettuce', 'lettuce', 'vegetable'),
('Cucumber', 'cucumber', 'cucumber', 'vegetable'),
('Zucchini', 'zucchini', 'zucchini', 'vegetable'),
('Red Bell Pepper', 'red-bell-pepper', 'pepper', 'vegetable'),
('Green Bell Pepper', 'green-bell-pepper', 'pepper', 'vegetable'),
('Yellow Bell Pepper', 'yellow-bell-pepper', 'pepper', 'vegetable'),
('Mushroom', 'mushroom', 'mushroom', 'vegetable'),
('Portobello Mushroom', 'portobello-mushroom', 'mushroom', 'vegetable'),
('Celery', 'celery', 'celery', 'vegetable'),
('Corn', 'corn', 'corn', 'vegetable'),
('Peas', 'peas', 'peas', 'vegetable'),
('Green Beans', 'green-beans', 'green-beans', 'vegetable'),
('Asparagus', 'asparagus', 'asparagus', 'vegetable'),
('Cabbage', 'cabbage', 'cabbage', 'vegetable'),
('Eggplant', 'eggplant', 'eggplant', 'vegetable'),
('Leek', 'leek', 'leek', 'vegetable'),
('Bok Choy', 'bok-choy', 'bok-choy', 'vegetable'),
('Brussels Sprouts', 'brussels-sprouts', 'brussels-sprouts', 'vegetable'),
('Artichoke', 'artichoke', 'artichoke', 'vegetable'),
('Green Onion', 'green-onion', 'onion', 'vegetable'),
-- Fruits
('Apple', 'apple', 'apple', 'fruit'),
('Banana', 'banana', 'banana', 'fruit'),
('Lemon', 'lemon', 'lemon', 'fruit'),
('Lime', 'lime', 'lime', 'fruit'),
('Orange', 'orange', 'orange', 'fruit'),
('Avocado', 'avocado', 'avocado', 'fruit'),
('Strawberry', 'strawberry', 'strawberry', 'fruit'),
('Blueberry', 'blueberry', 'blueberry', 'fruit'),
('Mango', 'mango', 'mango', 'fruit'),
('Pineapple', 'pineapple', 'pineapple', 'fruit'),
('Grapes', 'grapes', 'grapes', 'fruit'),
('Peach', 'peach', 'peach', 'fruit'),
('Pear', 'pear', 'pear', 'fruit'),
('Raspberry', 'raspberry', 'raspberry', 'fruit'),
-- Dairy
('Milk', 'milk', 'milk', 'dairy'),
('Butter', 'butter', 'butter', 'dairy'),
('Cheddar Cheese', 'cheddar-cheese', 'cheese', 'dairy'),
('Mozzarella', 'mozzarella', 'cheese', 'dairy'),
('Parmesan', 'parmesan', 'cheese', 'dairy'),
('Feta Cheese', 'feta-cheese', 'cheese', 'dairy'),
('Heavy Cream', 'heavy-cream', 'cream', 'dairy'),
('Sour Cream', 'sour-cream', 'cream', 'dairy'),
('Cream Cheese', 'cream-cheese', 'cream-cheese', 'dairy'),
('Greek Yogurt', 'greek-yogurt', 'yogurt', 'dairy'),
-- Grains & Starches
('White Rice', 'white-rice', 'rice', 'grain'),
('Brown Rice', 'brown-rice', 'rice', 'grain'),
('Pasta', 'pasta', 'pasta', 'grain'),
('Spaghetti', 'spaghetti', 'pasta', 'grain'),
('Penne', 'penne', 'pasta', 'grain'),
('Bread', 'bread', 'bread', 'grain'),
('All-Purpose Flour', 'all-purpose-flour', 'flour', 'grain'),
('Quinoa', 'quinoa', 'quinoa', 'grain'),
('Oats', 'oats', 'oats', 'grain'),
('Couscous', 'couscous', 'couscous', 'grain'),
('Tortilla', 'tortilla', 'tortilla', 'grain'),
('Ramen Noodles', 'ramen-noodles', 'noodles', 'grain'),
('Rice Noodles', 'rice-noodles', 'noodles', 'grain'),
('Panko Breadcrumbs', 'panko-breadcrumbs', 'breadcrumbs', 'grain'),
-- Pantry / Condiments
('Olive Oil', 'olive-oil', 'oil', 'pantry'),
('Vegetable Oil', 'vegetable-oil', 'oil', 'pantry'),
('Sesame Oil', 'sesame-oil', 'oil', 'pantry'),
('Soy Sauce', 'soy-sauce', 'soy-sauce', 'pantry'),
('Fish Sauce', 'fish-sauce', 'fish-sauce', 'pantry'),
('Worcestershire Sauce', 'worcestershire-sauce', 'sauce', 'pantry'),
('Apple Cider Vinegar', 'apple-cider-vinegar', 'vinegar', 'pantry'),
('Balsamic Vinegar', 'balsamic-vinegar', 'vinegar', 'pantry'),
('Rice Vinegar', 'rice-vinegar', 'vinegar', 'pantry'),
('Tomato Paste', 'tomato-paste', 'tomato-paste', 'pantry'),
('Canned Tomatoes', 'canned-tomatoes', 'tomatoes', 'pantry'),
('Coconut Milk', 'coconut-milk', 'coconut-milk', 'pantry'),
('Chicken Broth', 'chicken-broth', 'broth', 'pantry'),
('Beef Broth', 'beef-broth', 'broth', 'pantry'),
('Vegetable Broth', 'vegetable-broth', 'broth', 'pantry'),
('Honey', 'honey', 'honey', 'pantry'),
('Maple Syrup', 'maple-syrup', 'maple-syrup', 'pantry'),
('Sugar', 'sugar', 'sugar', 'pantry'),
('Brown Sugar', 'brown-sugar', 'sugar', 'pantry'),
('Dijon Mustard', 'dijon-mustard', 'mustard', 'pantry'),
('Ketchup', 'ketchup', 'ketchup', 'pantry'),
('Hot Sauce', 'hot-sauce', 'hot-sauce', 'pantry'),
('Sriracha', 'sriracha', 'hot-sauce', 'pantry'),
('Peanut Butter', 'peanut-butter', 'peanut-butter', 'pantry'),
('Tahini', 'tahini', 'tahini', 'pantry'),
('Oyster Sauce', 'oyster-sauce', 'sauce', 'pantry'),
-- Spices
('Salt', 'salt', 'salt', 'spice'),
('Black Pepper', 'black-pepper', 'pepper-spice', 'spice'),
('Cumin', 'cumin', 'cumin', 'spice'),
('Paprika', 'paprika', 'paprika', 'spice'),
('Smoked Paprika', 'smoked-paprika', 'paprika', 'spice'),
('Dried Oregano', 'dried-oregano', 'oregano', 'spice'),
('Dried Basil', 'dried-basil', 'basil', 'spice'),
('Fresh Ginger', 'fresh-ginger', 'ginger', 'spice'),
('Turmeric', 'turmeric', 'turmeric', 'spice'),
('Chili Powder', 'chili-powder', 'chili', 'spice'),
('Cayenne Pepper', 'cayenne-pepper', 'chili', 'spice'),
('Garlic Powder', 'garlic-powder', 'garlic-spice', 'spice'),
('Onion Powder', 'onion-powder', 'onion-spice', 'spice'),
('Red Pepper Flakes', 'red-pepper-flakes', 'chili', 'spice'),
('Cinnamon', 'cinnamon', 'cinnamon', 'spice'),
('Thyme', 'thyme', 'thyme', 'spice'),
('Rosemary', 'rosemary', 'rosemary', 'spice'),
('Bay Leaves', 'bay-leaves', 'bay-leaves', 'spice'),
('Curry Powder', 'curry-powder', 'curry', 'spice'),
('Italian Seasoning', 'italian-seasoning', 'oregano', 'spice'),
-- Nuts & Seeds
('Almonds', 'almonds', 'nuts', 'nut'),
('Walnuts', 'walnuts', 'nuts', 'nut'),
('Peanuts', 'peanuts', 'nuts', 'nut'),
('Cashews', 'cashews', 'nuts', 'nut'),
('Pine Nuts', 'pine-nuts', 'nuts', 'nut'),
('Sesame Seeds', 'sesame-seeds', 'seeds', 'nut'),
('Sunflower Seeds', 'sunflower-seeds', 'seeds', 'nut'),
('Chia Seeds', 'chia-seeds', 'seeds', 'nut')
ON CONFLICT (slug) DO NOTHING;
