
-- Add active_session_id and device_info columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active_session_id text,
ADD COLUMN IF NOT EXISTS device_info jsonb;

-- Create the handle_single_device_login function
CREATE OR REPLACE FUNCTION public.handle_single_device_login(
  target_user_id uuid,
  new_session_id text,
  new_device_info jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    active_session_id = new_session_id,
    device_info = new_device_info,
    updated_at = now()
  WHERE user_id = target_user_id;
END;
$$;
