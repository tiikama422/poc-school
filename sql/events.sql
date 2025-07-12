-- イベント/予定管理テーブル
create table public.events (
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

-- RLS (Row Level Security) を有効化
alter table public.events enable row level security;

-- ポリシー: ユーザーは自分のイベントのみ操作可能
create policy "Users can manage own events" on public.events
  for all using (auth.uid() = user_id);

-- インデックス作成
create index events_user_id_idx on public.events(user_id);
create index events_date_idx on public.events(date);
create index events_user_date_idx on public.events(user_id, date);