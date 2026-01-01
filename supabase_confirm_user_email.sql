-- 特定のユーザーのメールアドレスを確認済みにする
-- 使用例: bsk0529bumptatsu@gmail.com を認証済みにする

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'bsk0529bumptatsu@gmail.com';

-- 実行結果を確認する（オプション）
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'bsk0529bumptatsu@gmail.com';

