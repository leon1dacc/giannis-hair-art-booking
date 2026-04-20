-- 1. Site settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_closed boolean NOT NULL DEFAULT false,
  booking_closed boolean NOT NULL DEFAULT false,
  closure_message text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings (id, site_closed, booking_closed, closure_message)
VALUES (1, false, false, '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read site settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "deny direct writes" ON public.site_settings
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- 2. Add columns to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cancel_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS reminder_24h_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_appointments_cancel_token ON public.appointments(cancel_token);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments(appointment_date, status);

-- 3. Drop old IP-only trigger
DROP TRIGGER IF EXISTS trg_enforce_ip_booking_limit ON public.appointments;

-- 4. RPC: book_appointment
CREATE OR REPLACE FUNCTION public.book_appointment(
  _name text,
  _phone text,
  _email text,
  _service text,
  _date date,
  _time text,
  _ip text
) RETURNS TABLE(out_id uuid, out_token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _settings record;
  _existing_count int;
  _new_id uuid;
  _new_token uuid;
BEGIN
  IF _name IS NULL OR length(trim(_name)) < 2 THEN
    RAISE EXCEPTION 'invalid_name' USING MESSAGE = 'Το όνομα είναι μη έγκυρο';
  END IF;
  IF _phone !~ '^\d{10}$' THEN
    RAISE EXCEPTION 'invalid_phone' USING MESSAGE = 'Το τηλέφωνο πρέπει να είναι 10 ψηφία';
  END IF;
  IF _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email' USING MESSAGE = 'Μη έγκυρο email';
  END IF;
  IF _date < current_date THEN
    RAISE EXCEPTION 'past_date' USING MESSAGE = 'Δεν μπορείς να κλείσεις ραντεβού στο παρελθόν';
  END IF;

  SELECT * INTO _settings FROM public.site_settings WHERE id = 1;
  IF _settings.site_closed OR _settings.booking_closed THEN
    RAISE EXCEPTION 'booking_closed' USING MESSAGE = 'Οι κρατήσεις είναι προσωρινά κλειστές';
  END IF;

  SELECT count(*) INTO _existing_count
    FROM public.appointments
    WHERE appointment_date = _date
      AND status = 'confirmed'
      AND (
        lower(customer_email) = lower(_email)
        OR customer_phone = _phone
        OR (_ip IS NOT NULL AND _ip <> '' AND customer_ip = _ip)
      );
  IF _existing_count >= 2 THEN
    RAISE EXCEPTION 'limit_reached' USING MESSAGE = 'Έχεις ήδη 2 ραντεβού για αυτή την ημέρα';
  END IF;

  IF EXISTS(
    SELECT 1 FROM public.appointments
    WHERE appointment_date = _date AND appointment_time = _time AND status = 'confirmed'
  ) THEN
    RAISE EXCEPTION 'slot_taken' USING MESSAGE = 'Αυτή η ώρα μόλις κλείστηκε';
  END IF;

  _new_token := gen_random_uuid();

  INSERT INTO public.appointments(
    customer_name, customer_phone, customer_email, customer_ip,
    service, appointment_date, appointment_time, status, cancel_token
  ) VALUES (
    trim(_name), _phone, lower(trim(_email)), nullif(_ip, ''),
    _service, _date, _time, 'confirmed', _new_token
  ) RETURNING appointments.id INTO _new_id;

  RETURN QUERY SELECT _new_id, _new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_appointment(text, text, text, text, date, text, text) TO anon, authenticated;

-- 5. RPC: cancel_by_token
CREATE OR REPLACE FUNCTION public.cancel_by_token(_token uuid)
RETURNS TABLE(success boolean, message text, out_name text, out_date date, out_time text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _appt record;
BEGIN
  SELECT * INTO _appt FROM public.appointments WHERE cancel_token = _token LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Δεν βρέθηκε ραντεβού'::text, NULL::text, NULL::date, NULL::text;
    RETURN;
  END IF;
  IF _appt.status = 'cancelled' THEN
    RETURN QUERY SELECT false, 'Αυτό το ραντεβού έχει ήδη ακυρωθεί'::text, _appt.customer_name, _appt.appointment_date, _appt.appointment_time;
    RETURN;
  END IF;
  IF (_appt.appointment_date::timestamp + _appt.appointment_time::time) < now() THEN
    RETURN QUERY SELECT false, 'Δεν μπορείς να ακυρώσεις παρελθοντικό ραντεβού'::text, _appt.customer_name, _appt.appointment_date, _appt.appointment_time;
    RETURN;
  END IF;
  UPDATE public.appointments SET status = 'cancelled' WHERE id = _appt.id;
  RETURN QUERY SELECT true, 'Το ραντεβού ακυρώθηκε'::text, _appt.customer_name, _appt.appointment_date, _appt.appointment_time;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_by_token(uuid) TO anon, authenticated;

-- 6. RPC: admin_set_settings
CREATE OR REPLACE FUNCTION public.admin_set_settings(
  _pin text, _site_closed boolean, _booking_closed boolean, _closure_message text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.verify_admin_pin(_pin) THEN
    RAISE EXCEPTION 'invalid pin';
  END IF;
  UPDATE public.site_settings
    SET site_closed = _site_closed,
        booking_closed = _booking_closed,
        closure_message = coalesce(_closure_message, ''),
        updated_at = now()
    WHERE id = 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_settings(text, boolean, boolean, text) TO anon, authenticated;

-- 7. RPC: admin_delete_appointment
CREATE OR REPLACE FUNCTION public.admin_delete_appointment(_pin text, _id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.verify_admin_pin(_pin) THEN
    RAISE EXCEPTION 'invalid pin';
  END IF;
  DELETE FROM public.appointments WHERE id = _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_appointment(text, uuid) TO anon, authenticated;

-- 8. RPC: admin_cleanup_cancelled
CREATE OR REPLACE FUNCTION public.admin_cleanup_cancelled()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deleted int;
BEGIN
  WITH d AS (
    DELETE FROM public.appointments
    WHERE status = 'cancelled'
      AND created_at < now() - interval '7 days'
    RETURNING 1
  )
  SELECT count(*) INTO _deleted FROM d;
  RETURN _deleted;
END;
$$;

-- 9. RPC: get_due_reminders
CREATE OR REPLACE FUNCTION public.get_due_reminders(_kind text)
RETURNS TABLE(
  out_id uuid, out_name text, out_email text, out_phone text,
  out_service text, out_date date, out_time text, out_token uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now timestamptz := now();
BEGIN
  IF _kind = '24h' THEN
    RETURN QUERY
      SELECT a.id, a.customer_name, a.customer_email, a.customer_phone,
             a.service, a.appointment_date, a.appointment_time, a.cancel_token
      FROM public.appointments a
      WHERE a.status = 'confirmed'
        AND a.reminder_24h_sent = false
        AND a.customer_email IS NOT NULL
        AND (a.appointment_date::timestamp + a.appointment_time::time) BETWEEN _now AND (_now + interval '25 hours')
        AND (a.appointment_date::timestamp + a.appointment_time::time) > (_now + interval '2 hours');
  ELSIF _kind = '2h' THEN
    RETURN QUERY
      SELECT a.id, a.customer_name, a.customer_email, a.customer_phone,
             a.service, a.appointment_date, a.appointment_time, a.cancel_token
      FROM public.appointments a
      WHERE a.status = 'confirmed'
        AND a.reminder_2h_sent = false
        AND a.customer_email IS NOT NULL
        AND (a.appointment_date::timestamp + a.appointment_time::time) BETWEEN _now AND (_now + interval '2 hours 30 minutes');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_reminder_sent(_id uuid, _kind text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _kind = '24h' THEN
    UPDATE public.appointments SET reminder_24h_sent = true WHERE id = _id;
  ELSIF _kind = '2h' THEN
    UPDATE public.appointments SET reminder_2h_sent = true WHERE id = _id;
  END IF;
END;
$$;

-- 10. Schedule daily cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-cancelled-appointments') THEN
    PERFORM cron.unschedule('cleanup-cancelled-appointments');
  END IF;
END $$;

SELECT cron.schedule(
  'cleanup-cancelled-appointments',
  '0 3 * * *',
  $cron$ SELECT public.admin_cleanup_cancelled(); $cron$
);