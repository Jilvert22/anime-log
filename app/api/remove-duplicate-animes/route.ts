import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 重複アニメを削除するAPIエンドポイント
 * 同じタイトルのアニメが複数ある場合、最も古いものを残して残りを削除
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // ユーザー認証を確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーのアニメを取得
    const { data: animes, error: fetchError } = await supabase
      .from('animes')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('アニメの取得に失敗しました:', fetchError);
      return NextResponse.json(
        { error: 'アニメの取得に失敗しました' },
        { status: 500 }
      );
    }

    if (!animes || animes.length === 0) {
      return NextResponse.json({
        message: 'アニメが見つかりませんでした',
        deletedCount: 0,
      });
    }

    // タイトルでグループ化（大文字小文字を無視）
    const titleGroups = new Map<string, typeof animes>();
    for (const anime of animes) {
      const normalizedTitle = anime.title?.toLowerCase().trim() || '';
      if (!titleGroups.has(normalizedTitle)) {
        titleGroups.set(normalizedTitle, []);
      }
      titleGroups.get(normalizedTitle)!.push(anime);
    }

    // 重複があるアニメを特定（2つ以上あるもの）
    const duplicates: string[] = [];
    for (const [title, group] of titleGroups.entries()) {
      if (group.length > 1) {
        // 最も古いものを残して、残りを削除対象にする
        const sorted = group.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateA - dateB;
        });
        // 最初の1つを残して、残りを削除
        for (let i = 1; i < sorted.length; i++) {
          duplicates.push(sorted[i].id);
        }
      }
    }

    if (duplicates.length === 0) {
      return NextResponse.json({
        message: '重複アニメは見つかりませんでした',
        deletedCount: 0,
      });
    }

    // 重複アニメを削除
    const { error: deleteError } = await supabase
      .from('animes')
      .delete()
      .in('id', duplicates)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('重複アニメの削除に失敗しました:', deleteError);
      return NextResponse.json(
        { error: '重複アニメの削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `${duplicates.length}件の重複アニメを削除しました`,
      deletedCount: duplicates.length,
    });
  } catch (error) {
    console.error('重複アニメ削除エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

