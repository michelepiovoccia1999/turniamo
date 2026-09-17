-- Schema Turniamo per Supabase (Postgres)
-- Esegui questo script nel SQL Editor del progetto Supabase.
-- L'autenticazione resta gestita dall'app (username + password con bcrypt),
-- quindi RLS è disabilitato: solo il server (service_role key) scrive/legge queste tabelle.

create table if not exists users (
  id bigint generated always as identity primary key,
  username text unique not null,
  password_hash text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists shifts (
  id bigint generated always as identity primary key,
  user_id bigint not null references users(id) on delete cascade,
  date text not null,
  type text not null,
  label text not null,
  start text not null,
  "end" text not null,
  hours numeric not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shifts_user_date on shifts(user_id, date);
