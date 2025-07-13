-- 完全なデータベーススキーマセットアップ（外部キー制約対応）
-- 実行順序: 1. subjects → 2. user_profiles → 3. study_records/events/user_goals

-- 1. 科目テーブル（外部キー制約なし）
CREATE TABLE IF NOT EXISTS public.subjects (
  id serial primary key,
  name text not null,
  color text not null default '#95A5A6',
  icon text default '📝',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 科目の初期データ
INSERT INTO public.subjects (id, name, color, icon) VALUES
  (1, '国語', '#E74C3C', '📖'),
  (2, '数学', '#3498DB', '📊'),
  (3, '英語', '#2ECC71', '🌍'),
  (4, '理科', '#9B59B6', '🔬'),
  (5, '社会', '#F39C12', '🏛️'),
  (6, 'その他', '#95A5A6', '📝')
ON CONFLICT (id) DO NOTHING;

-- 2. ユーザープロファイルテーブル
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid references auth.users on delete cascade,
  email text unique not null,
  full_name text,
  is_approved boolean default true,
  is_admin boolean default false,
  approved_by uuid references auth.users,
  approved_at timestamp with time zone,
  is_pre_registered boolean default false,
  initial_password_changed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- 3. 学習記録テーブル
CREATE TABLE IF NOT EXISTS public.study_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  student_email text, -- 後方互換性のため残す
  study_date date not null,
  subject_id integer references public.subjects(id) not null,
  sub_subject_id integer,
  hours integer not null default 0,
  minutes integer not null default 0,
  memo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. イベント/予定管理テーブル
CREATE TABLE IF NOT EXISTS public.events (
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

-- 5. ユーザー目標設定テーブル
CREATE TABLE IF NOT EXISTS public.user_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  daily_goal_minutes integer not null default 120,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- RLS (Row Level Security) の設定
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（エラー回避）
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can manage own study records" ON public.study_records;
DROP POLICY IF EXISTS "Users can manage own events" ON public.events;
DROP POLICY IF EXISTS "Users can manage own goals" ON public.user_goals;

-- ポリシーの作成
-- 科目テーブル（全ユーザーが読み取り可能）
CREATE POLICY "Anyone can view subjects" ON public.subjects
  FOR SELECT USING (true);

-- ユーザープロファイル（自分のみ参照可能）
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- 管理者は全プロファイル参照可能
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 学習記録テーブル（自分のレコードのみ操作可能）
CREATE POLICY "Users can manage own study records" ON public.study_records
  FOR ALL USING (auth.uid() = user_id);

-- イベントテーブル（自分のイベントのみ操作可能）
CREATE POLICY "Users can manage own events" ON public.events
  FOR ALL USING (auth.uid() = user_id);

-- 目標テーブル（自分の目標のみ操作可能）
CREATE POLICY "Users can manage own goals" ON public.user_goals
  FOR ALL USING (auth.uid() = user_id);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS study_records_user_id_idx ON public.study_records(user_id);
CREATE INDEX IF NOT EXISTS study_records_date_idx ON public.study_records(study_date);
CREATE INDEX IF NOT EXISTS study_records_user_date_idx ON public.study_records(user_id, study_date);

CREATE INDEX IF NOT EXISTS events_user_id_idx ON public.events(user_id);
CREATE INDEX IF NOT EXISTS events_date_idx ON public.events(date);
CREATE INDEX IF NOT EXISTS events_user_date_idx ON public.events(user_id, date);

CREATE INDEX IF NOT EXISTS user_goals_user_id_idx ON public.user_goals(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON public.user_profiles(email);

-- 既存ユーザーのプロファイル作成
INSERT INTO public.user_profiles (id, email, full_name, is_approved, is_admin)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  true as is_approved,
  false as is_admin
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- 承認済みユーザーかどうかを確認する関数
CREATE OR REPLACE FUNCTION public.is_user_approved(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE id = user_id AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザー登録時に自動的にプロファイルを作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, is_approved)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成（既存の場合は削除してから作成）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();