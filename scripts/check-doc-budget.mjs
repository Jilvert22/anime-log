#!/usr/bin/env node
// 起動時に毎回読む文書（CLAUDE.md・PROJECT.md・docs/handoff/HANDOFF.md）が肥大化するのを機械で止める。
// 履歴は git に任せ、退避ファイル（旧版の全文複製）は置かない。
// 上限を上げるのではなく、正本へ移すか消して収める。上限を下げるのは棚卸しのとき。
// 2026-09-20 導入。
//
//   引数なし   : 作業ツリーのサイズで判定。fail（上限超過・退避ファイル）に加えて
//                note（増え方・大きい文書・未追跡の起動文書）を出す。fail があれば exit 1
//   --staged   : pre-commit 用。index（git cat-file -s :path）のサイズで判定し、
//                上限超過と退避ファイル（index にあるもの）だけを見る。note は出さない
//   --summary  : SessionStart 用。問題（fail か note）があるときだけ最大2行を stdout へ。
//                常に exit 0（例外も握りつぶす）
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// 起動文書ごとの上限 bytes。
export const STARTUP_BUDGET = {
  'CLAUDE.md': 6500,
  'PROJECT.md': 19000,
  'docs/handoff/HANDOFF.md': 16000,
};
// 合計上限。1本ごとの上限の和より小さく、どれかを増やせば他を削る必要がある値。
export const STARTUP_TOTAL_BUDGET = 40000;

// 退避ディレクトリ（旧版の全文複製を置かない）。
export const ARCHIVE_DIRS = ['docs/archive/'];
// docs/handoff/HANDOFF-2026-07-22.md のような日付付き複製も退避ファイルとして扱う。
const ARCHIVE_HANDOFF_COPY = /^docs\/handoff\/HANDOFF-[^/]+\.md$/i;
// macOS は既定で大文字小文字を区別しないファイルシステムのため、docs/Archive/ のような
// 表記ゆれも同じファイルとして扱われ得る。判定も大文字小文字を区別しない。
export const isArchiveFile = (name) => {
  const lower = name.toLowerCase();
  return (
    ARCHIVE_DIRS.some((dir) => lower.startsWith(dir.toLowerCase())) ||
    ARCHIVE_HANDOFF_COPY.test(name)
  );
};

// 存在するのに未追跡なら note する起動文書。
export const UNTRACKED_NOTE_TARGETS = [
  'docs/handoff/NEXT_SESSION_PROMPT.md',
  'RELEASE_HANDOFF.md',
  'AGENTS.md',
];

// 前回の棚卸し時点の docs/ 配下 git 管理 .md 合計バイト数。
// 2026-09-20 の棚卸し（docs/archive/ 32本と重複 EMAIL_TEMPLATES の削除）後の
// docs/ 配下 git 管理 .md の実測値。
export const LAST_PRUNE = { date: '2026-09-20', docsBytes: 208318 };
export const GROWTH_NOTE_RATIO = 1.15;
export const LARGE_DOC_BYTES = 200_000;

// import.meta.dirname は Node 20.11 未満では未定義(Node 20.0〜20.10 のギャップ対策)。
// import.meta.url は ESM なら常に使えるので、そちらからスクリプトの場所を導く。
// 注意: `new URL('..', import.meta.url)` の形は Vite/vitest が静的解析でアセットURLへ
// 書き換えてしまう(dev サーバ相対の http: URL になり fileURLToPath が例外を投げる)ため、
// fileURLToPath(import.meta.url) 単体 + path.dirname で親ディレクトリを求める。
export const defaultRoot = () => path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const git = (root, ...args) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 << 20,
  });
const tracked = (root, staged, pathspec) =>
  git(root, 'ls-files', ...(staged ? ['--cached'] : []), '-z', '--', pathspec)
    .split('\0')
    .filter(Boolean);
const sizeOf = (root, staged, name) => {
  if (staged) {
    const listed = git(root, 'ls-files', '--stage', '--', name);
    return listed ? Number(git(root, 'cat-file', '-s', `:${name}`).trim()) : 0;
  }
  const file = path.join(root, name);
  return existsSync(file) ? statSync(file).size : 0;
};
const kb = (bytes) => `${Math.round(bytes / 1000)}KB`;

// root を明示的に受け取る（テストが一時 git リポジトリを差し替えられるようにするため）。
export function inspectBudget(root, { staged = false } = {}) {
  const fails = [];
  const notes = [];
  let total = 0;
  for (const [name, limit] of Object.entries(STARTUP_BUDGET)) {
    const bytes = sizeOf(root, staged, name);
    total += bytes;
    if (bytes > limit)
      fails.push(
        `起動文書 ${name}: ${bytes}B（上限 ${limit}B）。詳細は正本へ移すか消す（上限は上げない）`
      );
  }
  if (total > STARTUP_TOTAL_BUDGET) {
    fails.push(
      `起動文書の合計: ${total}B（上限 ${STARTUP_TOTAL_BUDGET}B）。正本へ移すか消す（上限は上げない）`
    );
  }
  for (const name of tracked(root, staged, 'docs')) {
    if (isArchiveFile(name) && (staged || existsSync(path.join(root, name)))) {
      fails.push(`退避ファイル ${name} は置かない。旧版は git 履歴に残る`);
    }
  }
  if (staged) {
    return { fails, notes, total };
  }
  const docs = tracked(root, false, 'docs')
    .filter((name) => name.endsWith('.md') && existsSync(path.join(root, name)))
    .map((name) => [name, statSync(path.join(root, name)).size]);
  const docsBytes = docs.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (LAST_PRUNE.docsBytes && docsBytes > LAST_PRUNE.docsBytes * GROWTH_NOTE_RATIO) {
    const pct = Math.round((docsBytes / LAST_PRUNE.docsBytes - 1) * 100);
    notes.push(
      `docs/ の .md が前回の棚卸し（${LAST_PRUNE.date}）から +${pct}%（${kb(docsBytes)}）。消す候補を並べてオーナーに提案する`
    );
  }
  const large = docs.filter(([, bytes]) => bytes > LARGE_DOC_BYTES).sort((a, b) => b[1] - a[1]);
  if (large.length) {
    notes.push(
      `${kb(LARGE_DOC_BYTES)} 超の docs/ の .md ${large.length} 本: ${large
        .slice(0, 3)
        .map(([n, b]) => `${n}(${kb(b)})`)
        .join(', ')}`
    );
  }
  const untracked = UNTRACKED_NOTE_TARGETS.filter(
    (name) => existsSync(path.join(root, name)) && !git(root, 'ls-files', '-z', '--', name)
  );
  if (untracked.length) {
    notes.push(
      `未追跡の起動文書 ${untracked.length} 本（コミットするか確認する）: ${untracked.join(', ')}`
    );
  }
  return { fails, notes, total, docsBytes };
}

const KNOWN_FLAGS = ['--staged', '--summary'];

// root は明示的に渡さない限り未確定のまま関数に入り、defaultRoot() の評価は
// 各モードの try の中で行う（Node 20.0〜20.10 で import.meta.dirname が無い環境や、
// その他の予期しない失敗でも --summary の「例外を握りつぶして exit 0」を守るため）。
export function main(argv, root) {
  const unknown = argv.filter((arg) => !KNOWN_FLAGS.includes(arg));
  if (unknown.length) {
    console.error(`check-doc-budget: 不明な引数: ${unknown.join(', ')}`);
    return 2;
  }
  const staged = argv.includes('--staged');
  const summary = argv.includes('--summary');
  if (staged && summary) {
    console.error('check-doc-budget: --staged と --summary は併用できません');
    return 2;
  }
  if (summary) {
    try {
      const effectiveRoot = root ?? defaultRoot();
      const { fails, notes } = inspectBudget(effectiveRoot, { staged: false });
      const lines = [];
      if (fails.length) lines.push(`[doc-budget] 上限超過 ${fails.length} 件: ${fails[0]}`);
      if (notes.length) lines.push(`[doc-budget] ${notes[0]}`);
      if (lines.length) console.log(lines.slice(0, 2).join('\n'));
    } catch {
      // SessionStart は起動を止めない。測れなくても exit 0。
    }
    return 0;
  }
  try {
    const effectiveRoot = root ?? defaultRoot();
    const { fails, notes, total, docsBytes } = inspectBudget(effectiveRoot, { staged });
    for (const note of notes) console.log(`note: ${note}`);
    for (const fail of fails) console.log(`✗ ${fail}`);
    if (fails.length) {
      console.log(`check-doc-budget: ${fails.length} 件の指摘`);
      return 1;
    }
    const scope = staged
      ? 'index'
      : `起動文書 ${kb(total)}/${kb(STARTUP_TOTAL_BUDGET)}・docs/ の .md ${kb(docsBytes)}`;
    console.log(`check-doc-budget: OK (${scope})`);
    return 0;
  } catch (error) {
    console.error(`check-doc-budget: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
