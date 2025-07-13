-- ポリシー設定のみ（テーブル作成後に実行）

-- RLS (Row Level Security) の有効化
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（エラー回避）
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can manage own study records" ON public.study_records;
DROP POLICY IF EXISTS "Users can manage own events" ON public.events;
DROP POLICY IF EXISTS "Users can manage own goals" ON public.user_goals;

-- 科目テーブル（全ユーザーが読み取り可能）
CREATE POLICY "Anyone can view subjects" ON public.subjects
  FOR SELECT USING (true);

-- 学習記録テーブル（自分のレコードのみ操作可能）
CREATE POLICY "Users can manage own study records" ON public.study_records
  FOR ALL USING (auth.uid() = user_id);

-- イベントテーブル（自分のイベントのみ操作可能）  
CREATE POLICY "Users can manage own events" ON public.events
  FOR ALL USING (auth.uid() = user_id);

-- 目標テーブル（自分の目標のみ操作可能）
CREATE POLICY "Users can manage own goals" ON public.user_goals
  FOR ALL USING (auth.uid() = user_id);