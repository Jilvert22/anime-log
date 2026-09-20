import { afterEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  ARCHIVE_DIRS,
  GROWTH_NOTE_RATIO,
  LARGE_DOC_BYTES,
  LAST_PRUNE,
  STARTUP_BUDGET,
  STARTUP_TOTAL_BUDGET,
  UNTRACKED_NOTE_TARGETS,
  defaultRoot,
  inspectBudget,
  isArchiveFile,
  main,
} from '../../scripts/check-doc-budget.mjs';

// 一時 git リポジトリを使って検査器そのものを試す。
// 実運用の root は起動時に固定される（scripts/ の親）が、テストでは差し替えられるように
// inspectBudget(root, ...) / main(argv, root) は root を明示的な引数として受け取る。
const roots: string[] = [];

function makeRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'doc-budget-test-'));
  execFileSync('git', ['init', '-q'], { cwd: root });
  roots.push(root);
  return root;
}

function put(root: string, rel: string, size: number) {
  const full = path.join(root, rel);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, 'x'.repeat(size));
}

function add(root: string, ...rel: string[]) {
  execFileSync('git', ['add', '--', ...rel], { cwd: root });
}

afterEach(() => {
  while (roots.length) {
    const root = roots.pop();
    if (root) rmSync(root, { recursive: true, force: true });
  }
});

describe('起動文書の上限（発注文の値と一致すること）', () => {
  it('STARTUP_BUDGET と STARTUP_TOTAL_BUDGET', () => {
    expect(STARTUP_BUDGET).toEqual({
      'CLAUDE.md': 6500,
      'PROJECT.md': 19000,
      'docs/handoff/HANDOFF.md': 16000,
      'docs/handoff/NEXT_SESSION_PROMPT.md': 2000,
    });
    expect(STARTUP_TOTAL_BUDGET).toBe(42000);
  });

  it('個別上限の合計は合計上限より大きい（合計チェックが意味を持つ値）', () => {
    const sum = Object.values(STARTUP_BUDGET).reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(STARTUP_TOTAL_BUDGET);
  });
});

describe('1本ごとの上限', () => {
  for (const [name, limit] of Object.entries(STARTUP_BUDGET)) {
    it(`${name}: 上限ちょうどは pass・+1B は fail（作業ツリー・index 共通）`, () => {
      const root = makeRepo();
      put(root, name, limit);
      add(root, name);
      expect(inspectBudget(root, { staged: false }).fails).toEqual([]);
      expect(inspectBudget(root, { staged: true }).fails).toEqual([]);

      put(root, name, limit + 1);
      add(root, name);
      expect(inspectBudget(root, { staged: false }).fails.some((f) => f.includes(name))).toBe(true);
      expect(inspectBudget(root, { staged: true }).fails.some((f) => f.includes(name))).toBe(true);
    });
  }

  it('起動文書が存在しない場合はサイズ0扱いで fail にならない', () => {
    const root = makeRepo();
    const result = inspectBudget(root, { staged: false });
    expect(result.fails).toEqual([]);
    expect(result.total).toBe(0);
    const staged = inspectBudget(root, { staged: true });
    expect(staged.fails).toEqual([]);
    expect(staged.total).toBe(0);
  });
});

describe('合計上限', () => {
  it('各ファイル単体は上限内でも、合計が+1Bなら fail（合計の指摘だけが出る）', () => {
    const root = makeRepo();
    const budget: Record<string, number> = STARTUP_BUDGET;
    const names = Object.keys(budget);
    const sizes: Record<string, number> = {};
    let left = STARTUP_TOTAL_BUDGET;
    for (const name of names) {
      const size = Math.min(budget[name], left);
      sizes[name] = size;
      put(root, name, size);
      left -= size;
    }
    add(root, ...names);
    // 個別上限の合計(43500) > 合計上限(42000) なので、貪欲に詰めれば必ずどこかに余りが残る。
    expect(left).toBe(0);
    expect(inspectBudget(root, { staged: false }).fails).toEqual([]);

    // 自分の上限にまだ余裕がある1本を+1Bして、合計だけを超過させる。
    const slackName = names.find((name) => sizes[name] < budget[name]);
    expect(slackName).toBeDefined();
    const bumped = sizes[slackName as string] + 1;
    put(root, slackName as string, bumped);
    add(root, slackName as string);
    expect(bumped).toBeLessThanOrEqual(budget[slackName as string]);

    const result = inspectBudget(root, { staged: false });
    expect(result.fails.some((f) => f.includes('合計'))).toBe(true);
    expect(result.fails.some((f) => f.includes(`起動文書 ${slackName}`))).toBe(false);
  });
});

describe('退避ファイル判定', () => {
  it(`${ARCHIVE_DIRS[0]} 配下のファイルは fail（作業ツリー・index）`, () => {
    const root = makeRepo();
    put(root, 'docs/archive/old.md', 10);
    add(root, 'docs/archive/old.md');
    expect(
      inspectBudget(root, { staged: false }).fails.some((f) => f.includes('docs/archive/old.md'))
    ).toBe(true);
    expect(
      inspectBudget(root, { staged: true }).fails.some((f) => f.includes('docs/archive/old.md'))
    ).toBe(true);
  });

  it('docs/handoff/HANDOFF-2026-07-22.md のような日付付き複製は fail', () => {
    const root = makeRepo();
    put(root, 'docs/handoff/HANDOFF-2026-07-22.md', 10);
    add(root, 'docs/handoff/HANDOFF-2026-07-22.md');
    const result = inspectBudget(root, { staged: false });
    expect(result.fails.some((f) => f.includes('HANDOFF-2026-07-22.md'))).toBe(true);
  });

  it('docs/handoff/HANDOFF.md 本体（複製ではない）は退避ファイル扱いしない', () => {
    expect(isArchiveFile('docs/handoff/HANDOFF.md')).toBe(false);
    expect(isArchiveFile('docs/archive/x.md')).toBe(true);
    expect(isArchiveFile('docs/handoff/HANDOFF-x.md')).toBe(true);
  });

  it('作業ツリーから既に消えている退避ファイル（index にはまだ残る）は --staged だけ fail', () => {
    const root = makeRepo();
    put(root, 'docs/archive/old.md', 10);
    add(root, 'docs/archive/old.md');
    rmSync(path.join(root, 'docs/archive/old.md'));
    expect(
      inspectBudget(root, { staged: true }).fails.some((f) => f.includes('docs/archive/old.md'))
    ).toBe(true);
    expect(
      inspectBudget(root, { staged: false }).fails.some((f) => f.includes('docs/archive/old.md'))
    ).toBe(false);
  });

  it('isArchiveFile は大文字小文字を区別しない（macOS の大文字小文字を区別しないFS対策）', () => {
    expect(isArchiveFile('docs/Archive/a.md')).toBe(true);
    expect(isArchiveFile('docs/ARCHIVE/b.md')).toBe(true);
    expect(isArchiveFile('DOCS/archive/c.md')).toBe(true);
    expect(isArchiveFile('docs/HANDOFF/HANDOFF-2026-07-22.MD')).toBe(true);
    expect(isArchiveFile('docs/handoff/handoff-2026-07-22.md')).toBe(true);
    // 似ているが違うパスは検出しない
    expect(isArchiveFile('docs/archived/a.md')).toBe(false);
    expect(isArchiveFile('docs/handoff/HANDOFF.md')).toBe(false);
  });

  it('docs/Archive/（大文字小文字違い）配下のファイルも git 管理されていれば fail', () => {
    const root = makeRepo();
    put(root, 'docs/Archive/OLD.md', 10);
    add(root, 'docs/Archive/OLD.md');
    expect(
      inspectBudget(root, { staged: false }).fails.some((f) => f.includes('docs/Archive/OLD.md'))
    ).toBe(true);
    expect(
      inspectBudget(root, { staged: true }).fails.some((f) => f.includes('docs/Archive/OLD.md'))
    ).toBe(true);
  });
});

describe('--staged は index を見る（作業ツリーではない）', () => {
  it('index だけ超過: --staged は fail・引数なしは pass', () => {
    const root = makeRepo();
    const limit = STARTUP_BUDGET['CLAUDE.md'];
    put(root, 'CLAUDE.md', limit + 1);
    add(root, 'CLAUDE.md');
    put(root, 'CLAUDE.md', 10); // ステージ後に作業ツリーだけ上限内へ戻す

    expect(inspectBudget(root, { staged: true }).fails.length).toBeGreaterThan(0);
    expect(inspectBudget(root, { staged: false }).fails).toEqual([]);
  });

  it('作業ツリーだけ超過: 引数なしは fail・--staged は pass', () => {
    const root = makeRepo();
    const limit = STARTUP_BUDGET['CLAUDE.md'];
    put(root, 'CLAUDE.md', 10);
    add(root, 'CLAUDE.md');
    put(root, 'CLAUDE.md', limit + 1); // ステージし直さない

    expect(inspectBudget(root, { staged: false }).fails.length).toBeGreaterThan(0);
    expect(inspectBudget(root, { staged: true }).fails).toEqual([]);
  });
});

describe('note（引数なしのみ。--staged では出さない）', () => {
  it(`${LARGE_DOC_BYTES}B 超の docs/ の .md は note・ちょうどは出ない・fail にしない`, () => {
    const root = makeRepo();
    put(root, 'docs/big.md', LARGE_DOC_BYTES + 1);
    put(root, 'docs/edge.md', LARGE_DOC_BYTES);
    add(root, 'docs/big.md', 'docs/edge.md');

    const result = inspectBudget(root, { staged: false });
    expect(result.fails).toEqual([]);
    const largeNote = result.notes.find((n) => n.includes('超の'));
    expect(largeNote).toBeDefined();
    expect(largeNote).toContain('docs/big.md');
    expect(largeNote).not.toContain('edge.md');
  });

  it('docs/ の .md 合計が LAST_PRUNE の GROWTH_NOTE_RATIO 倍を超えたら note', () => {
    const root = makeRepo();
    const over = Math.floor(LAST_PRUNE.docsBytes * GROWTH_NOTE_RATIO) + 1;
    put(root, 'docs/grow.md', over);
    add(root, 'docs/grow.md');
    const result = inspectBudget(root, { staged: false });
    expect(result.notes.some((n) => n.includes('前回の棚卸し'))).toBe(true);
  });

  it('閾値ちょうどでは増え方の note を出さない', () => {
    const root = makeRepo();
    const exact = Math.floor(LAST_PRUNE.docsBytes * GROWTH_NOTE_RATIO);
    put(root, 'docs/grow.md', exact);
    add(root, 'docs/grow.md');
    const result = inspectBudget(root, { staged: false });
    expect(result.notes.some((n) => n.includes('前回の棚卸し'))).toBe(false);
  });

  // UNTRACKED_NOTE_TARGETS は空にもなりうる（起動文書が全部追跡済みのとき）。
  // 空でも note の経路が壊れていないことを確かめるため、対象を注入して試す。
  for (const target of [...UNTRACKED_NOTE_TARGETS, 'docs/handoff/NEXT_SESSION_PROMPT.md']) {
    it(`未追跡の起動文書 ${target} が存在すれば note・tracked なら出さない`, () => {
      const root = makeRepo();
      put(root, target, 10);
      const untrackedResult = inspectBudget(root, { staged: false, untrackedTargets: [target] });
      expect(untrackedResult.notes.some((n) => n.includes(target))).toBe(true);

      add(root, target);
      const trackedResult = inspectBudget(root, { staged: false, untrackedTargets: [target] });
      expect(trackedResult.notes.some((n) => n.includes(target))).toBe(false);
    });
  }

  it('--staged は note を一切出さない', () => {
    const root = makeRepo();
    put(root, 'AGENTS.md', 10);
    put(root, 'docs/big.md', LARGE_DOC_BYTES + 1);
    add(root, 'docs/big.md');
    const result = inspectBudget(root, { staged: true });
    expect(result.notes).toEqual([]);
  });
});

describe('--summary（SessionStart 用）', () => {
  it('問題がなければ無出力・exit 0', () => {
    const root = makeRepo();
    put(root, 'CLAUDE.md', 10);
    add(root, 'CLAUDE.md');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = main(['--summary'], root);
    expect(code).toBe(0);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('問題があれば2行以内・exit 0', () => {
    const root = makeRepo();
    put(root, 'docs/archive/x.md', 10);
    put(root, 'docs/big.md', LARGE_DOC_BYTES + 1);
    add(root, 'docs/archive/x.md', 'docs/big.md');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = main(['--summary'], root);
    expect(code).toBe(0);
    expect(spy).toHaveBeenCalledTimes(1);
    const output = String(spy.mock.calls[0][0]);
    const lines = output.split('\n');
    expect(lines.length).toBeLessThanOrEqual(2);
    expect(lines[0]).toContain('[doc-budget]');
    spy.mockRestore();
  });

  it('git が失敗しても例外を投げず exit 0（測れなくても起動を止めない）', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'doc-budget-test-'));
    roots.push(root); // .git を作らない = git 呼び出しが必ず失敗する
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    let code: number | undefined;
    expect(() => {
      code = main(['--summary'], root);
    }).not.toThrow();
    expect(code).toBe(0);
    spy.mockRestore();
  });
});

describe('引数なし・--staged は git が失敗したら握りつぶさず exit 1', () => {
  it('git が使えないリポジトリでは exit 1', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'doc-budget-test-'));
    roots.push(root);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(main([], root)).toBe(1);
    expect(main(['--staged'], root)).toBe(1);
    errSpy.mockRestore();
  });
});

describe('main() の戻り値（fail 時に 0 を返す変異を検出する）', () => {
  it('main(["--staged"], root): 上限超過なら1・問題なしなら0', () => {
    const root = makeRepo();
    const limit = STARTUP_BUDGET['CLAUDE.md'];
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    put(root, 'CLAUDE.md', limit);
    add(root, 'CLAUDE.md');
    expect(main(['--staged'], root)).toBe(0);

    put(root, 'CLAUDE.md', limit + 1);
    add(root, 'CLAUDE.md');
    expect(main(['--staged'], root)).toBe(1);

    logSpy.mockRestore();
  });

  it('main([], root)（作業ツリー）: 上限超過なら1・問題なしなら0', () => {
    const root = makeRepo();
    const limit = STARTUP_BUDGET['CLAUDE.md'];
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    put(root, 'CLAUDE.md', limit);
    add(root, 'CLAUDE.md');
    expect(main([], root)).toBe(0);

    put(root, 'CLAUDE.md', limit + 1);
    add(root, 'CLAUDE.md');
    expect(main([], root)).toBe(1);

    logSpy.mockRestore();
  });

  it('main(["--staged"], root): 退避ファイルが index にあれば1', () => {
    const root = makeRepo();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(main(['--staged'], root)).toBe(0);
    put(root, 'docs/archive/x.md', 10);
    add(root, 'docs/archive/x.md');
    expect(main(['--staged'], root)).toBe(1);
    logSpy.mockRestore();
  });
});

describe('引数の検証', () => {
  it('--staged と --summary の併用はエラー（exit 2）', () => {
    const root = makeRepo();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(main(['--staged', '--summary'], root)).toBe(2);
    errSpy.mockRestore();
  });

  it('未知の引数はモード判定より前に exit 2 で止める', () => {
    const root = makeRepo();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(main(['--stage'], root)).toBe(2);
    expect(main(['--staged', '--bogus'], root)).toBe(2);
    expect(main(['--summary', '--bogus'], root)).toBe(2);
    errSpy.mockRestore();
  });
});

describe('defaultRoot（import.meta.dirname に依存しない）', () => {
  it('スクリプトの親ディレクトリ（プロジェクトルート）を返す', () => {
    const root = defaultRoot();
    expect(existsSync(path.join(root, 'package.json'))).toBe(true);
    expect(existsSync(path.join(root, 'scripts/check-doc-budget.mjs'))).toBe(true);
  });

  it('root を渡さなくても --summary は defaultRoot 経由で例外を投げない', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => main(['--summary'])).not.toThrow();
    expect(main(['--summary'])).toBe(0);
    logSpy.mockRestore();
  });
});

describe('pre-commit の配線', () => {
  it('.husky/pre-commit が check-doc-budget.mjs を --staged で呼ぶ（lint-staged も残っている）', () => {
    const hookPath = path.resolve(import.meta.dirname, '../../.husky/pre-commit');
    const hook = readFileSync(hookPath, 'utf8');
    const activeLines = hook
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
    expect(activeLines.some((line) => line === 'node scripts/check-doc-budget.mjs --staged')).toBe(
      true
    );
    expect(activeLines.some((line) => line === 'npx lint-staged')).toBe(true);
  });
});
