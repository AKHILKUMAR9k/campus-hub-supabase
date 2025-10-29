-- Users table
create type user_role as enum ('student', 'organizer', 'admin');

create table if not exists public.users (
  id uuid primary key,
  full_name text,
  email text unique,
  role user_role default 'student',
  created_at timestamptz default now()
);

-- Events table
create table if not exists public.events (
  id serial primary key,
  title text not null,
  description text not null,
  date timestamptz not null,
  venue text not null,
  club text,
  category text,
  image_url text,
  created_by uuid references public.users(id) on delete cascade,
  is_completed boolean default false
);

-- Registrations table
create table if not exists public.registrations (
  id serial primary key,
  event_id int references public.events(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  registered_at timestamptz default now(),
  unique(event_id, user_id)
);

-- Comments table (threaded via parent_comment)
create table if not exists public.comments (
  id serial primary key,
  event_id int references public.events(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  content text not null,
  parent_comment int references public.comments(id) on delete cascade,
  likes int default 0,
  created_at timestamptz default now()
);

-- Optional resources table
create table if not exists public.resources (
  id serial primary key,
  title text not null,
  subject text,
  file_url text not null,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);


