'use client';

import { supabase } from '../supabase';
import { requireAuth } from './auth';
import { SupabaseError, ValidationError, AuthenticationError } from './errors';
import {
  REPORT_REASONS,
  type ReportReason,
  type ReportTarget,
  type BlockEntry,
} from '../moderation/types';

export async function getBlockedUsers(): Promise<BlockEntry[]> {
  const user = await requireAuth();
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id,blocked_label,created_at')
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw new SupabaseError('ブロック一覧を取得できませんでした', error.code, error);
  return data ?? [];
}
export async function blockUser(targetUserId: string, expectedOwner: string): Promise<BlockEntry> {
  const user = await requireAuth();
  if (user.id !== expectedOwner)
    throw new AuthenticationError('アカウントが変わりました。再読み込みしてください');
  if (targetUserId === user.id) throw new ValidationError('自分自身はブロックできません');
  const { data, error } = await supabase.rpc('block_user', {
    expected_blocker: user.id,
    target_user: targetUserId,
  });
  if (error || !data)
    throw new SupabaseError(
      'ブロックできませんでした。もう一度お試しください。',
      error?.code,
      error
    );
  return data;
}
export async function unblockUser(targetUserId: string, expectedOwner: string): Promise<void> {
  const user = await requireAuth();
  if (user.id !== expectedOwner)
    throw new AuthenticationError('アカウントが変わりました。再読み込みしてください');
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', targetUserId);
  if (error) throw new SupabaseError('ブロックを解除できませんでした', error.code, error);
}
export async function reportContent(
  target: ReportTarget,
  reason: ReportReason,
  details: string,
  expectedOwner: string
): Promise<string> {
  if (!REPORT_REASONS.some((item) => item.value === reason) || details.length > 1000)
    throw new ValidationError('通報理由を選択し、補足は1000文字以内で入力してください');
  const user = await requireAuth();
  if (user.id !== expectedOwner)
    throw new AuthenticationError('アカウントが変わりました。再読み込みしてください');
  const { data, error } = await supabase.rpc('submit_content_report', {
    expected_reporter: user.id,
    target_kind: target.type,
    target: target.id,
    report_reason: reason,
    report_details: details.trim(),
  });
  if (error || typeof data !== 'string')
    throw new SupabaseError(
      error?.code === 'P0001'
        ? '通報の上限に達しました。時間をおいてお試しください。'
        : '通報を保存できませんでした。内容を残したまま、もう一度お試しください。',
      error?.code,
      error
    );
  return data;
}
