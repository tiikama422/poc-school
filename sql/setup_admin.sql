-- 初期管理者ユーザーを設定する手順
-- 
-- 1. 管理者用のメールアドレスでユーザー登録を行う
-- 2. 以下のSQLを実行して管理者権限と承認を付与する
-- 
-- 注意: 'admin@example.com'を実際の管理者メールアドレスに置き換えてください

-- 管理者ユーザーを承認し、管理者権限を付与
UPDATE public.user_profiles 
SET 
  is_approved = true,
  is_admin = true,
  approved_at = timezone('utc'::text, now()),
  approved_by = id
WHERE email = 'admin@example.com';

-- 確認クエリ（管理者ユーザーの設定を確認）
SELECT 
  email,
  is_approved,
  is_admin,
  approved_at,
  created_at
FROM public.user_profiles 
WHERE email = 'admin@example.com';