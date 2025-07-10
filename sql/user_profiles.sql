-- ユーザープロファイルテーブル
-- 承認されたユーザーのみがログイン可能にするためのテーブル
create table public.user_profiles (
  id uuid references auth.users on delete cascade,
  email text unique not null,
  full_name text,
  is_approved boolean default false,
  approved_by uuid references auth.users,
  approved_at timestamp with time zone,
  is_pre_registered boolean default false,
  initial_password_changed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  primary key (id)
);

-- RLS (Row Level Security) を有効化
alter table public.user_profiles enable row level security;

-- ポリシー: ユーザーは自分のプロファイルのみ読み取り可能
create policy "Users can view own profile" on public.user_profiles
  for select using (auth.uid() = id);

-- ポリシー: 管理者のみがすべてのプロファイルを表示可能
create policy "Admins can view all profiles" on public.user_profiles
  for select using (
    exists (
      select 1 from public.user_profiles 
      where id = auth.uid() and is_admin = true
    )
  );

-- 管理者用のフラグを追加
alter table public.user_profiles add column is_admin boolean default false;

-- 承認済みユーザーかどうかを確認する関数
create or replace function public.is_user_approved(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 
    from public.user_profiles 
    where id = user_id and is_approved = true
  );
end;
$$ language plpgsql security definer;

-- ユーザー登録時に自動的にプロファイルを作成するトリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- トリガーの作成
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();