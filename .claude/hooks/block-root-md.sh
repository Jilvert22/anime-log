#!/usr/bin/env bash
# PreToolUse(Write) フック: リポジトリ直下への新規 .md 作成をブロックする。
# 分析/レポート系ドキュメントがルートに散乱する事故 (かつて51個) の再発防止。
# 新規ドキュメントは docs/ 配下に置くこと。
#
# stdin に Claude Code のツール入力 JSON が渡る。exit 2 でツールを止め、
# stderr のメッセージが AI にフィードバックされる。

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# ルートに残してよい既存の .md (これらの上書きは許可)
allowlist="README.md PROJECT.md CONTRIBUTING.md CLAUDE.md RELEASE_HANDOFF.md PLAY_STORE_SUBMISSION.md"

# リポジトリルート直下の *.md か判定 (末尾が /<name>.md で、その手前にサブディレクトリが無い)
base=$(basename "$file_path")
dir=$(dirname "$file_path")

case "$file_path" in
  *.md)
    # ルート直下 (dir がリポジトリルートそのもの) かどうかは、
    # dir が anime-log で終わるかで判定する。
    case "$dir" in
      */anime-log)
        for allowed in $allowlist; do
          [ "$base" = "$allowed" ] && exit 0
        done
        echo "ルート直下への新規 .md 作成は禁止です。分析/レポート系は docs/ 配下 (docs/archive, docs/ops, docs/specs 等) に置いてください。" >&2
        exit 2
        ;;
    esac
    ;;
esac

exit 0
