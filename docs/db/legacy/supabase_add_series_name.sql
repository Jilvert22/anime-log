-- animesテーブルにseries_nameカラムを追加
-- このSQLをSupabaseのSQL Editorで実行してください

-- series_nameカラムが存在しない場合のみ追加
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'animes' 
    AND column_name = 'series_name'
  ) THEN
    ALTER TABLE animes 
    ADD COLUMN series_name TEXT;
    
    RAISE NOTICE 'series_nameカラムを追加しました';
  ELSE
    RAISE NOTICE 'series_nameカラムは既に存在します';
  END IF;
END $$;

