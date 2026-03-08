
CREATE OR REPLACE FUNCTION public.handle_single_device_login(p_user_id uuid, p_device_id text, p_device_info jsonb, p_force_login boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_existing_session text;
  v_existing_device jsonb;
  v_updated_at timestamptz;
BEGIN
  SELECT active_session_id, device_info, updated_at
  INTO v_existing_session, v_existing_device, v_updated_at
  FROM public.profiles 
  WHERE user_id = p_user_id;

  -- Allow login if: no existing session, same device, or session is stale (>30 min)
  IF v_existing_session IS NULL OR v_existing_session = '' OR v_existing_session = p_device_id 
     OR (v_updated_at IS NOT NULL AND v_updated_at < now() - interval '30 minutes') THEN
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
$function$;
