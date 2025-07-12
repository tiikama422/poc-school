-- ユーザーの学習目標設定テーブル
create table public.user_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  daily_goal_minutes integer not null default 120,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- ユーザーごとに1つの目標のみ許可
  unique(user_id)
);

-- RLS (Row Level Security) を有効化
alter table public.user_goals enable row level security;

-- ポリシー: ユーザーは自分の目標のみ操作可能
create policy "Users can manage own goals" on public.user_goals
  for all using (auth.uid() = user_id);

-- インデックス作成
create index user_goals_user_id_idx on public.user_goals(user_id);