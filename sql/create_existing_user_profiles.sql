-- 既存ユーザーのプロファイル作成
-- user_profiles.sql実行後に実行

-- 既存のauth.usersに対してプロファイルを作成
INSERT INTO public.user_profiles (id, email, full_name, is_approved, is_admin)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  true as is_approved,
  false as is_admin
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.user_profiles);

-- 確認用クエリ（実行後にこれで確認）
-- SELECT id, email, full_name, is_approved, is_admin FROM public.user_profiles;