-- 新しいスキーマに追加テーブルを作成

-- 1. イベント/予定管理テーブル
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email text NOT NULL,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  type text NOT NULL DEFAULT 'other',
  color text NOT NULL DEFAULT '#3498DB',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. ユーザー目標設定テーブル
CREATE TABLE IF NOT EXISTS public.user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email text NOT NULL UNIQUE,
  daily_goal_minutes integer NOT NULL DEFAULT 120,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS設定
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- ポリシー設定（Service Roleが全て操作可能）
CREATE POLICY "Service role can do anything on events" ON public.events 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do anything on user_goals" ON public.user_goals 
  FOR ALL USING (auth.role() = 'service_role');

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_events_student_email ON public.events(student_email);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_user_goals_student_email ON public.user_goals(student_email);

SELECT 'Additional tables created successfully' as status;