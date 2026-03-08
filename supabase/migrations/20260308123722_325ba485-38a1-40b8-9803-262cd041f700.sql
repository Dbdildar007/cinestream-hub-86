
-- Drop the existing restrictive UPDATE policy that only allows receiver
DROP POLICY IF EXISTS "Users can update received chat messages" ON public.chat_messages;

-- Create two separate UPDATE policies: one for receiver (mark read), one for sender (edit)
CREATE POLICY "Receivers can update chat messages"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Senders can edit their own chat messages"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);
