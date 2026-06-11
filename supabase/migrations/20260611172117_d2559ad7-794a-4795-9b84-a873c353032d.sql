
-- Replace the broad user-update policy with one restricted to non-sensitive columns.
-- Sensitive economy/progression fields (total_coins, high_score, *_level, coin_multiplier, head_start)
-- must only be modified by the service role through server functions.

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE OR REPLACE FUNCTION public.profiles_block_sensitive_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role / SECURITY DEFINER server code is allowed to change anything.
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.total_coins         IS DISTINCT FROM OLD.total_coins
     OR NEW.high_score       IS DISTINCT FROM OLD.high_score
     OR NEW.shield_level     IS DISTINCT FROM OLD.shield_level
     OR NEW.magnet_level     IS DISTINCT FROM OLD.magnet_level
     OR NEW.speed_level      IS DISTINCT FROM OLD.speed_level
     OR NEW.invincibility_level IS DISTINCT FROM OLD.invincibility_level
     OR NEW.coin_multiplier  IS DISTINCT FROM OLD.coin_multiplier
     OR NEW.head_start       IS DISTINCT FROM OLD.head_start
  THEN
    RAISE EXCEPTION 'Sensitive profile fields can only be updated server-side';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_block_sensitive_self_update_trg ON public.profiles;
CREATE TRIGGER profiles_block_sensitive_self_update_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_block_sensitive_self_update();

CREATE POLICY "Users update own profile display name"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
