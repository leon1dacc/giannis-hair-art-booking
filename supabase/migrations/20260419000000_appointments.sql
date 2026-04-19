-- Appointments table
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (length(customer_name) between 1 and 100),
  customer_phone text not null check (length(customer_phone) between 5 and 20),
  service text not null check (length(service) between 1 and 50),
  appointment_date date not null,
  appointment_time text not null check (appointment_time ~ '^[0-9]{2}:[0-9]{2}$'),
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at timestamptz not null default now()
);

-- Unique active appointment per slot (allow re-booking after cancellation)
create unique index appointments_unique_active_slot
  on public.appointments (appointment_date, appointment_time)
  where status = 'confirmed';

create index appointments_date_idx on public.appointments (appointment_date);

-- Admin settings (single row holds the PIN hash)
create table public.admin_settings (
  id int primary key default 1,
  pin_hash text not null,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

-- Default PIN: "1234" (sha256). User can change later via DB or admin UI.
insert into public.admin_settings (id, pin_hash)
values (1, encode(digest('1234', 'sha256'), 'hex'));

-- Enable RLS
alter table public.appointments enable row level security;
alter table public.admin_settings enable row level security;

-- Public can INSERT a booking (no read of others, no update, no delete)
create policy "anyone can create appointment"
  on public.appointments for insert
  to anon, authenticated
  with check (status = 'confirmed');

-- Public can SELECT only date+time of confirmed appointments to compute availability
-- We expose minimal fields via a view + RPC instead. So no select policy for general public.

-- Admin operations go through SECURITY DEFINER RPCs validated by PIN.
-- No direct select/update/delete policies for anon — RPCs bypass RLS.

-- RPC: verify pin
create or replace function public.verify_admin_pin(_pin text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists(
    select 1 from public.admin_settings
    where id = 1 and pin_hash = encode(extensions.digest(_pin, 'sha256'), 'hex')
  );
$$;

-- RPC: get all appointments (requires PIN)
create or replace function public.admin_list_appointments(_pin text)
returns setof public.appointments
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.verify_admin_pin(_pin) then
    raise exception 'invalid pin';
  end if;
  return query select * from public.appointments order by appointment_date desc, appointment_time desc;
end;
$$;

-- RPC: cancel appointment (requires PIN)
create or replace function public.admin_cancel_appointment(_pin text, _id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.verify_admin_pin(_pin) then
    raise exception 'invalid pin';
  end if;
  update public.appointments set status = 'cancelled' where id = _id;
end;
$$;

-- RPC: get booked time slots for a given date (public, returns only times)
create or replace function public.get_booked_slots(_date date)
returns table(appointment_time text)
language sql
stable
security definer
set search_path = public
as $$
  select appointment_time from public.appointments
  where appointment_date = _date and status = 'confirmed';
$$;

-- RPC: change PIN (requires old PIN)
create or replace function public.admin_change_pin(_old_pin text, _new_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_admin_pin(_old_pin) then
    raise exception 'invalid pin';
  end if;
  if length(_new_pin) < 4 then
    raise exception 'pin too short';
  end if;
  update public.admin_settings
    set pin_hash = encode(extensions.digest(_new_pin, 'sha256'), 'hex'),
        updated_at = now()
    where id = 1;
end;
$$;

grant execute on function public.verify_admin_pin(text) to anon, authenticated;
grant execute on function public.admin_list_appointments(text) to anon, authenticated;
grant execute on function public.admin_cancel_appointment(text, uuid) to anon, authenticated;
grant execute on function public.get_booked_slots(date) to anon, authenticated;
grant execute on function public.admin_change_pin(text, text) to anon, authenticated;
