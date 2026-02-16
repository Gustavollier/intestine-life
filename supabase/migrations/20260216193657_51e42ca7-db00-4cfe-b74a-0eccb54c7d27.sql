-- Add bristol_scale column to evacuations (nullable, 1-7)
ALTER TABLE public.evacuations
ADD COLUMN bristol_scale smallint CHECK (bristol_scale >= 1 AND bristol_scale <= 7);