
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'snack', 'dinner', 'other');

CREATE TABLE public.food_diary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day DATE NOT NULL,
  meal_type public.meal_type NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.food_diary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own food diary" ON public.food_diary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own food diary" ON public.food_diary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own food diary" ON public.food_diary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own food diary" ON public.food_diary FOR DELETE USING (auth.uid() = user_id);
