export const REPORT_REASONS = [
  { value: 'harassment', label: '嫌がらせ・誹謗中傷' },
  { value: 'sexual', label: '不適切な性的表現' },
  { value: 'spam', label: 'スパム・宣伝' },
  { value: 'rights', label: '権利の侵害' },
  { value: 'other', label: 'その他' },
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number]['value'];
export type ReportTarget = { type: 'user' | 'review'; id: string };
export type BlockEntry = { blocked_id: string; blocked_label: string; created_at: string };
export const MODERATION_CHANGED = 'animelog-moderation-changed';
export type ModerationChange = { ownerId: string; blockedId?: string };
