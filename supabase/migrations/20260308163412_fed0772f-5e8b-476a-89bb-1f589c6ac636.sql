
CREATE TABLE public.movie_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  movie_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, movie_id)
);

ALTER TABLE public.movie_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders"
ON public.movie_reminders
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
