import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv, getSupabaseServiceRoleKey } from '@/app/lib/env';

export async function POST(request: NextRequest) {
  try {
    // Route Handler用のSupabaseクライアントを作成（認証確認用）
    const cookieStore = await cookies();
    
    const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv();
    
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Route Handler.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Route Handler.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    });

    // 認証されたユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('認証エラー:', userError);
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = user.id;

    // Supabaseクライアントを作成（サービスロールキーを使用）
    const supabaseServiceKey = getSupabaseServiceRoleKey();

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEYが設定されていません');
      return NextResponse.json(
        { error: 'サーバー設定エラー: サービスロールキーが設定されていません' },
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
  } catch (error: unknown) {
    console.error('アカウント削除エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'アカウントの削除に失敗しました';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

