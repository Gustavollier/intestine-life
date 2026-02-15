
-- Rename table
ALTER TABLE public.annotations RENAME TO evacuations;

-- Add time_of_day column
ALTER TABLE public.evacuations ADD COLUMN time_of_day time without time zone;

-- Drop old RLS policies
DROP POLICY "Users can delete their own annotations" ON public.evacuations;
DROP POLICY "Users can insert their own annotations" ON public.evacuations;
DROP POLICY "Users can update their own annotations" ON public.evacuations;
DROP POLICY "Users can view their own annotations" ON public.evacuations;

-- Recreate RLS policies with new names
CREATE POLICY "Users can view their own evacuations"
  ON public.evacuations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evacuations"
  ON public.evacuations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evacuations"
  ON public.evacuations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evacuations"
  ON public.evacuations FOR DELETE
  USING (auth.uid() = user_id);
