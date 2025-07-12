-- 完全なデータベーススキーマセットアップ

-- 1. 科目テーブル
create table if not exists public.subjects (
  id serial primary key,
  name text not null,
  color text not null default '#95A5A6',
  icon text default '📝',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 科目の初期データ
insert into public.subjects (id, name, color, icon) values
  (1, '国語', '#E74C3C', '📖'),
  (2, '数学', '#3498DB', '📊'),
  (3, '英語', '#2ECC71', '🌍'),
  (4, '理科', '#9B59B6', '🔬'),
  (5, '社会', '#F39C12', '🏛️'),
  (6, 'その他', '#95A5A6', '📝')
on conflict (id) do nothing;

-- 2. 学習記録テーブル
create table if not exists public.study_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  student_email text, -- 後方互換性のため残す（将来的に削除予定）
  study_date date not null,
  subject_id integer references public.subjects(id) not null,
  sub_subject_id integer,
  hours integer not null default 0,
  minutes integer not null default 0,
  memo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. イベント/予定管理テーブル
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  date date not null,
  type text not null default 'other',
  color text not null default '#3498DB',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ユーザー目標設定テーブル
create table if not exists public.user_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  daily_goal_minutes integer not null default 120,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- RLS (Row Level Security) の設定
alter table public.subjects enable row level security;
alter table public.study_records enable row level security;
alter table public.events enable row level security;
alter table public.user_goals enable row level security;

-- RLSポリシーの作成

-- 科目テーブル（全ユーザーが読み取り可能）
create policy if not exists "Anyone can view subjects" on public.subjects
  for select using (true);

-- 学習記録テーブル（自分のレコードのみ操作可能）
create policy if not exists "Users can manage own study records" on public.study_records
  for all using (auth.uid() = user_id);

-- イベントテーブル（自分のイベントのみ操作可能）
create policy if not exists "Users can manage own events" on public.events
  for all using (auth.uid() = user_id);

-- 目標テーブル（自分の目標のみ操作可能）
create policy if not exists "Users can manage own goals" on public.user_goals
  for all using (auth.uid() = user_id);

-- インデックスの作成
create index if not exists study_records_user_id_idx on public.study_records(user_id);
create index if not exists study_records_date_idx on public.study_records(study_date);
create index if not exists study_records_user_date_idx on public.study_records(user_id, study_date);

create index if not exists events_user_id_idx on public.events(user_id);
create index if not exists events_date_idx on public.events(date);
create index if not exists events_user_date_idx on public.events(user_id, date);

create index if not exists user_goals_user_id_idx on public.user_goals(user_id);