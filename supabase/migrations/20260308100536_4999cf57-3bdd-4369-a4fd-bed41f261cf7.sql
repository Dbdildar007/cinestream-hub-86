ALTER TABLE public.call_messages ADD COLUMN IF NOT EXISTS read_at timestamp with time zone DEFAULT NULL;

-- Allow users to update messages they received (to mark as read)
CREATE POLICY "Users can update received messages"
ON public.call_messages FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);