#!/usr/bin/env node
// CLIのログインを利用する。環境ファイルやサービスキーは読み取らない。
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function buildModerationQuery(args) {
  if (args.length === 1 && args[0] === 'queue') {
    return "SELECT id, target_type, target_id, reason, details, snapshot, created_at FROM public.content_reports WHERE status = 'pending' ORDER BY created_at LIMIT 50;";
  }
  const [command, id, decision, note] = args;
  if (
    command !== 'resolve' ||
    args.length !== 4 ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id ?? '') ||
    !['hide', 'dismiss', 'restore'].includes(decision) ||
    !note?.trim() ||
    note.length > 1000 ||
    note.includes('\0')
  ) {
    throw new Error(
      '使い方: node scripts/moderation.mjs queue | resolve <通報UUID> hide|dismiss|restore <対応理由>'
    );
  }
  const literal = (value) => {
    let delimiter = '$moderation_input$';
    while (value.includes(delimiter)) delimiter = delimiter.slice(0, -1) + '_$';
    return delimiter + value + delimiter;
  };
  return `BEGIN; SET LOCAL standard_conforming_strings = on; SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '30s'; SELECT public.resolve_content_report(${literal(id)}::uuid, ${literal(decision)}, ${literal(note.trim())}); COMMIT;`;
}

function main() {
  let directory;
  try {
    const sql = buildModerationQuery(process.argv.slice(2));
    directory = mkdtempSync(join(tmpdir(), 'animelog-moderation-'));
    const file = join(directory, 'query.sql');
    writeFileSync(file, sql, { mode: 0o600 });
    const result = spawnSync(
      'supabase',
      ['db', 'query', '--linked', '--file', file, '--output', 'json'],
      { stdio: 'inherit', shell: false }
    );
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : '実行に失敗しました');
    process.exitCode = 1;
  } finally {
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
