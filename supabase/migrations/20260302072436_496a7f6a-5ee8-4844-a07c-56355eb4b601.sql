
-- Fix overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
