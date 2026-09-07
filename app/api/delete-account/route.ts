import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '../../lib/supabase/server';
import { getSupabaseEnv, getSupabaseServiceRoleKey } from '../../lib/env';
import { deleteAccount, AccountDeletionError } from '../../lib/api/accountDeletion';

const attempts = new Map<string, { count: number; resetTime: number }>();
const inProgress = new Set<string>();
// インスタンス内の濫用・連打防止。分散レート制限ではない。
function checkRateLimit(userId: string) {
  const now = Date.now();
  for (const [id, record] of attempts) if (record.resetTime <= now) attempts.delete(id);
  const record = attempts.get(userId) ?? { count: 0, resetTime: now + 10 * 60 * 1000 };
  if (record.count >= 5) return false;
  record.count++;
  attempts.set(userId, record);
  return true;
}
function failure(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return failure('この画面から削除を実行できません。アプリを開き直してください', 403);
  let userId: string | undefined;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return failure('認証が必要です', 401);
    let expectedUserId: unknown;
    try {
      expectedUserId = (await request.json()).expectedUserId;
    } catch {
      return failure('削除確認をやり直してください', 400);
    }
    if (expectedUserId !== user.id)
      return failure(
        'アカウントが変わったか、画面が古くなっています。再読み込みして削除確認をやり直してください',
        409
      );
    if (inProgress.has(user.id)) return failure('削除を処理中です。しばらくお待ちください', 409);
    if (!checkRateLimit(user.id))
      return failure('削除の試行が多すぎます。10分ほど待って再試行してください', 429);
    const key = getSupabaseServiceRoleKey();
    if (!key) return failure('削除サービスを利用できません。時間をおいて再試行してください', 503);
    const { url } = getSupabaseEnv();
    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    userId = user.id;
    inProgress.add(userId);
    await deleteAccount(admin, userId);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    // 管理者SDKや設定の内部情報をレスポンス・ログに流さない。
    const message =
      error instanceof AccountDeletionError
        ? error.message
        : 'アカウントの削除に失敗しました。時間をおいて再試行してください';
    return failure(message, 500);
  } finally {
    if (userId) inProgress.delete(userId);
  }
}
