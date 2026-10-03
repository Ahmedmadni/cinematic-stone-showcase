-- SOMMAN public action quotas (privacy preserving, global across app workers)
-- Create-only migration. Apply ONLY to the project referenced by supabase/config.toml.
-- No visitor IPs, emails, prompts, or other identifiers are stored here.
-- Optional feature flag SOMMAN_SHARED_QUOTA_ENABLED=true activates use from app.
--
-- A fixed window is intentionally conservative: at boundaries, bursts may
-- straddle adjacent buckets. Configure a CDN/WAF anti-abuse layer too.

CREATE TABLE IF NOT EXISTS public.somman_public_usage_windows (
  scope text NOT NULL CHECK (scope IN ('assistant', 'inquiry')),
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count > 0),
  PRIMARY KEY (scope, window_started_at)
);

-- No browser/user may query or edit aggregate quota counters. RLS is enabled
-- even though only trusted service-role calls are used by the server.
ALTER TABLE public.somman_public_usage_windows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.somman_public_usage_windows FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.somman_public_usage_windows TO service_role;
CREATE INDEX IF NOT EXISTS somman_public_usage_windows_time_idx
  ON public.somman_public_usage_windows (window_started_at);

CREATE OR REPLACE FUNCTION public.somman_try_public_action(p_scope text)
RETURNS TABLE(allowed boolean, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_start timestamptz;
  v_seconds integer;
  v_limit integer;
  v_used integer;
BEGIN
  -- Trust only server-chosen scopes. Limits cannot be increased by an RPC caller.
  CASE p_scope
    WHEN 'assistant' THEN
      v_seconds := 60;
      v_limit := 48;
    WHEN 'inquiry' THEN
      v_seconds := 600;
      v_limit := 12;
    ELSE
      RAISE EXCEPTION 'Unsupported quota scope' USING ERRCODE = '22023';
  END CASE;

  v_start := to_timestamp(
    (floor(extract(epoch FROM v_now)::numeric / v_seconds) * v_seconds)::double precision
  );

  -- This one INSERT/ON CONFLICT UPDATE is serialized on the unique counter row
  -- by PostgreSQL and does not use read-then-write susceptible to races.
  INSERT INTO public.somman_public_usage_windows AS w
    (scope, window_started_at, request_count)
  VALUES (p_scope, v_start, 1)
  ON CONFLICT (scope, window_started_at)
  DO UPDATE SET request_count = w.request_count + 1
    WHERE w.request_count < v_limit
  RETURNING request_count INTO v_used;

  allowed := v_used IS NOT NULL;
  retry_after_seconds := CASE
    WHEN allowed THEN 0
    ELSE GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM
        (v_start + make_interval(secs => v_seconds) - v_now)
      ))::integer
    )
  END;

  -- Occasional bounded-data retention cleanup (~2 days) without scheduled jobs.
  -- At a low-volume site stale rows may persist until another accepted request.
  IF random() < 0.02 THEN
    DELETE FROM public.somman_public_usage_windows
    WHERE window_started_at < v_now - interval '2 days';
  END IF;
  RETURN NEXT;
END;
$function$;

REVOKE ALL ON FUNCTION public.somman_try_public_action(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.somman_try_public_action(text) TO service_role;

COMMENT ON TABLE public.somman_public_usage_windows IS
  'Aggregate anonymous action counts only. No IP/email/session/prompt/lead data.';
COMMENT ON FUNCTION public.somman_try_public_action(text) IS
  'Service-role-only atomic global quota: assistant 48/min; inquiry 12/10min.';
