
-- Add plan column to profiles
ALTER TABLE public.profiles ADD COLUMN plan text NOT NULL DEFAULT 'free';

-- Create chat usage tracking table
CREATE TABLE public.chat_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, day)
);

ALTER TABLE public.chat_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat usage"
ON public.chat_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat usage"
ON public.chat_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat usage"
ON public.chat_usage FOR UPDATE
USING (auth.uid() = user_id);
