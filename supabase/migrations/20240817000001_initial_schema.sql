-- Enable required extensions
create extension if not exists vector;

-- Create custom types
create type visibility as enum ('PRIVATE','UNLISTED','PUBLIC');
create type link_type as enum ('SEMANTIC','SHARED_TAG','SAME_TIMEWINDOW','SAME_LOCATION');

-- Create app_user table
create table app_user (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

-- Create consent table
create table consent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references app_user(id) on delete cascade,
  share_for_research boolean not null default false,
  allow_model_training boolean not null default false,
  receive_study_invites boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Create fragment table
create table fragment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user(id) on delete cascade,
  title text not null check (char_length(title) <= 80),
  body text not null,
  transcript text not null default '',
  event_at timestamptz not null,
  location_text text,
  lat double precision,
  lng double precision,
  visibility visibility not null default 'PRIVATE',
  tags text[] not null default '{}',
  system_emotions text[] not null default '{}',
  system_themes text[] not null default '{}',
  life_stage text,
  media jsonb not null default '[]', -- [{url,type,duration?}]
  embedding vector(1536),
  status text not null default 'READY', -- or PROCESSING/FAILED
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for fragment table
create index fragment_event_idx on fragment(event_at desc);
create index fragment_visibility_idx on fragment(visibility);
create index fragment_gin_tags on fragment using gin(tags);
create index fragment_vec_idx on fragment using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Create link table
create table link (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references fragment(id) on delete cascade,
  to_id uuid not null references fragment(id) on delete cascade,
  type link_type not null,
  score double precision not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique(from_id, to_id, type)
);

-- Create collection table
create table collection (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Create collection_item table
create table collection_item (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collection(id) on delete cascade,
  fragment_id uuid not null references fragment(id) on delete cascade,
  position int not null,
  unique(collection_id, fragment_id)
);

-- Create audit_event table for privacy actions
create table audit_event (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_user(id) on delete set null,
  action text not null,
  subject_id uuid,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table app_user enable row level security;
alter table consent enable row level security;
alter table fragment enable row level security;
alter table link enable row level security;
alter table collection enable row level security;
alter table collection_item enable row level security;
alter table audit_event enable row level security;
