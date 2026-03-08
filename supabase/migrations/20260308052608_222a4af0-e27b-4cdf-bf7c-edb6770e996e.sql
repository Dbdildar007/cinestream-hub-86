
CREATE OR REPLACE FUNCTION public.handle_single_device_login(
  p_user_id uuid,
  p_device_id text,
  p_device_info jsonb,
  p_force_login boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_session text;
  v_existing_device jsonb;
BEGIN
  SELECT active_session_id, device_info 
  INTO v_existing_session, v_existing_device
  FROM public.profiles 
  WHERE user_id = p_user_id;

  IF v_existing_session IS NULL OR v_existing_session = '' OR v_existing_session = p_device_id THEN
    UPDATE public.profiles 
    SET active_session_id = p_device_id, 
        device_info = p_device_info, 
        is_online = true,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object('status', 'ok');
  END IF;

  IF NOT p_force_login THEN
    RETURN jsonb_build_object(
      'status', 'conflict',
      'existing_device', v_existing_device
    );
  END IF;

  UPDATE public.profiles 
  SET active_session_id = p_device_id, 
      device_info = p_device_info, 
      is_online = true,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('status', 'ok', 'evicted', true);
END;
$$;
