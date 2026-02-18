CREATE POLICY "Users can update their own hydration"
  ON public.hydration FOR UPDATE
  USING (auth.uid() = user_id);