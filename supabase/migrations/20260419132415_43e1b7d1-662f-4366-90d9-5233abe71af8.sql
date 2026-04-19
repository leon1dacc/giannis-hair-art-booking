
-- Add new columns
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_ip text;

-- Reset admin PIN to 4565
UPDATE public.admin_settings
  SET pin_hash = encode(extensions.digest('4565', 'sha256'), 'hex'),
      updated_at = now()
  WHERE id = 1;

-- Function: enforce per-IP daily limit + return inserted row id
-- Use a trigger to enforce the 2-per-IP-per-day rule
CREATE OR REPLACE FUNCTION public.enforce_ip_booking_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt int;
BEGIN
  IF NEW.customer_ip IS NULL OR NEW.customer_ip = '' THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO cnt
    FROM public.appointments
    WHERE customer_ip = NEW.customer_ip
      AND appointment_date = NEW.appointment_date
      AND status = 'confirmed';
  IF cnt >= 2 THEN
    RAISE EXCEPTION 'Έχεις ήδη 2 ραντεβού για αυτή την ημέρα.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_ip_booking_limit ON public.appointments;
CREATE TRIGGER trg_enforce_ip_booking_limit
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_ip_booking_limit();

-- Prevent double-booking the same time slot (unique on confirmed slots)
CREATE UNIQUE INDEX IF NOT EXISTS appointments_unique_slot
  ON public.appointments (appointment_date, appointment_time)
  WHERE status = 'confirmed';

-- Update admin_list_appointments to return all columns including new ones
CREATE OR REPLACE FUNCTION public.admin_list_appointments(_pin text)
RETURNS SETOF public.appointments
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.verify_admin_pin(_pin) THEN
    RAISE EXCEPTION 'invalid pin';
  END IF;
  RETURN QUERY SELECT * FROM public.appointments ORDER BY appointment_date DESC, appointment_time DESC;
END;
$$;
