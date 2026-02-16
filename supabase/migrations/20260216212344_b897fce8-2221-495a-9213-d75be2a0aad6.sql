
CREATE TABLE public.hydration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bottle', 'cup')),
  ml INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hydration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hydration"
  ON public.hydration FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hydration"
  ON public.hydration FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hydration"
  ON public.hydration FOR DELETE
  USING (auth.uid() = user_id);
