
-- Table to track analysis usage (daily and monthly) per user
CREATE TABLE public.analysis_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  analysis_type text NOT NULL CHECK (analysis_type IN ('day', 'month')),
  reference_date text NOT NULL, -- 'yyyy-MM-dd' for day, 'yyyy-MM' for month
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analysis_usage ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own analysis usage"
ON public.analysis_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis usage"
ON public.analysis_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_analysis_usage_lookup ON public.analysis_usage (user_id, analysis_type, reference_date);
