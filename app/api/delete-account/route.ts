import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // クライアントから認証トークンを取得
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // Supabaseクライアントを作成（サービスロールキーを使用）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase環境変数が設定されていません');
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
        { status: 500 }
      );
    }

    // サービスロールキーでクライアントを作成（管理者権限）
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // リクエストからユーザーIDを取得（認証トークンから）
    const token = authHeader.replace('Bearer ', '');
    
    // トークンからユーザー情報を取得
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('認証エラー:', userError);
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    const userId = user.id;

    // ユーザー関連データを削除
    // 注意: CASCADE制約により、一部のデータは自動的に削除されますが、
    // 明示的に削除することで確実に削除されます

    // 1. followsテーブル（フォロー関係）
    await supabaseAdmin
      .from('follows')
      .delete()
      .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

    // 2. watchlistテーブル（積みアニメ）
    await supabaseAdmin
      .from('watchlist')
      .delete()
      .eq('user_id', userId);

    // 3. reviewsテーブル（感想・レビュー）
    // CASCADEにより、review_likesとreview_helpfulも自動削除されます
    await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('user_id', userId);

    // 4. animesテーブル（視聴履歴）
    await supabaseAdmin
      .from('animes')
      .delete()
      .eq('user_id', userId);

    // 5. user_profilesテーブル（プロフィール情報）
    await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    // 6. アバター画像をStorageから削除
    try {
      const { data: files } = await supabaseAdmin.storage
        .from('avatars')
        .list(userId);
      
      if (files && files.length > 0) {
        const filesToDelete = files.map(file => `${userId}/${file.name}`);
        await supabaseAdmin.storage
          .from('avatars')
          .remove(filesToDelete);
      }
    } catch (storageError) {
      // ストレージの削除に失敗しても続行（既に削除されている可能性がある）
      console.warn('アバター画像の削除に失敗:', storageError);
    }

    // 7. auth.usersからユーザーを削除
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('ユーザー削除エラー:', deleteError);
      return NextResponse.json(
        { error: 'アカウントの削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('アカウント削除エラー:', error);
    return NextResponse.json(
      { error: error.message || 'アカウントの削除に失敗しました' },
      { status: 500 }
    );
  }
}

