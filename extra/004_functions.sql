-- ============================================================
-- CineStream Database Schema - Functions & Triggers
-- Generated: 2026-03-08
-- ============================================================

-- ============================================================
-- 1. AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, unique_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    'CS-' || substr(NEW.id::text, 1, 8)
  );
  RETURN NEW;
END;
$$;

-- Trigger: auto-create profile when a new auth user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. SINGLE DEVICE LOGIN ENFORCEMENT
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_single_device_login(
  p_user_id UUID,
  p_device_id TEXT,
  p_device_info JSONB,
  p_force_login BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing_session TEXT;
  v_existing_device JSONB;
  v_updated_at TIMESTAMPTZ;
BEGIN
  SELECT active_session_id, device_info, updated_at
  INTO v_existing_session, v_existing_device, v_updated_at
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- Allow login if: no existing session, same device, or session is stale (>30 min)
  IF v_existing_session IS NULL
     OR v_existing_session = ''
     OR v_existing_session = p_device_id
     OR (v_updated_at IS NOT NULL AND v_updated_at < now() - interval '30 minutes')
  THEN
    UPDATE public.profiles
    SET active_session_id = p_device_id,
        device_info = p_device_info,
        is_online = true,
        updated_at = now()
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object('status', 'ok');
  END IF;

  -- Another device is active - require force login
  IF NOT p_force_login THEN
    RETURN jsonb_build_object(
      'status', 'conflict',
      'existing_device', v_existing_device
    );
  END IF;

  -- Force login: evict existing device
  UPDATE public.profiles
  SET active_session_id = p_device_id,
      device_info = p_device_info,
      is_online = true,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('status', 'ok', 'evicted', true);
END;
$$;

-- ============================================================
-- 3. AUTO-UPDATE updated_at COLUMN
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
