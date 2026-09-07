import { describe, expect, it } from 'vitest';
import { buildModerationQuery } from '../../scripts/moderation.mjs';
const id = '11111111-1111-4111-8111-111111111111';
describe('運営CLIの入力', () => {
  it('キューは保留中を古い順で限定取得する', () => {
    expect(buildModerationQuery(['queue'])).toContain(
      "status = 'pending' ORDER BY created_at LIMIT 50"
    );
  });
  it('ID、判断、理由が不正ならSQLを生成しない', () => {
    for (const args of [
      ['resolve', 'x;DROP TABLE', 'hide', '理由'],
      ['resolve', id, 'delete', '理由'],
      ['resolve', id, 'hide', ''],
      ['resolve', id, 'hide', 'a'.repeat(1001)],
    ])
      expect(() => buildModerationQuery(args)).toThrow();
  });
  it('引用符・バックスラッシュ・SQL断片と区切り文字を含む理由をリテラルに閉じ込める', () => {
    const note = "a'\\; DROP TABLE x; --\n$moderation_input$";
    expect(buildModerationQuery(['resolve', id, 'hide', note])).toContain(
      '$moderation_input_$' + note + '$moderation_input_$'
    );
  });
});
