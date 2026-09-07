#!/bin/zsh
# リポジトリルートから実行。ローカルの使い捨てDBのみを使用する。
set -eu
task_db_root=$(mktemp -d /tmp/anime-log-moderation.XXXXXX)
initdb -D "$task_db_root/data" -A trust --no-locale -E UTF8 > "$task_db_root/setup.log"
pg_ctl -D "$task_db_root/data" -l "$task_db_root/server.log" -o "-k $task_db_root -c listen_addresses='' -p 55488" start > /dev/null
trap 'pg_ctl -D "$task_db_root/data" -m fast stop > /dev/null' EXIT
createdb -h "$task_db_root" -p 55488 moderation_test
psql -h "$task_db_root" -p 55488 -d moderation_test -f tests/sql/moderation.sql > "$task_db_root/results.log" 2>&1 || { tail -35 "$task_db_root/results.log"; exit 1; }
tail -7 "$task_db_root/results.log"

psql -h "$task_db_root" -p 55488 -d moderation_test -v ON_ERROR_STOP=1 -c "BEGIN; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','22222222-1111-4111-8111-111111111111',false); INSERT INTO follows(follower_id,following_id) VALUES('22222222-1111-4111-8111-111111111111','33333333-1111-4111-8111-111111111111'); SELECT pg_sleep(1); COMMIT;" > "$task_db_root/race-follow.log" 2>&1 &
task_follow_pid=$!
sleep 0.2
psql -h "$task_db_root" -p 55488 -d moderation_test -v ON_ERROR_STOP=1 -c "SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','22222222-1111-4111-8111-111111111111',false); SELECT block_user(auth.uid(),'33333333-1111-4111-8111-111111111111');" > "$task_db_root/race-block.log" 2>&1
wait "$task_follow_pid"
psql -h "$task_db_root" -p 55488 -d moderation_test -v ON_ERROR_STOP=1 > /dev/null <<'SQL'
DO $$ BEGIN IF EXISTS(SELECT 1 FROM follows) THEN RAISE EXCEPTION 'concurrent follow survived'; END IF; END $$; DELETE FROM user_blocks;
SQL
psql -h "$task_db_root" -p 55488 -d moderation_test -v ON_ERROR_STOP=1 -c "BEGIN; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','22222222-1111-4111-8111-111111111111',false); SELECT block_user(auth.uid(),'33333333-1111-4111-8111-111111111111'); SELECT pg_sleep(1); COMMIT;" > "$task_db_root/race-block-first.log" 2>&1 &
task_block_pid=$!
sleep 0.2
if psql -h "$task_db_root" -p 55488 -d moderation_test -v ON_ERROR_STOP=1 -c "SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','33333333-1111-4111-8111-111111111111',false); INSERT INTO follows(follower_id,following_id) VALUES('33333333-1111-4111-8111-111111111111','22222222-1111-4111-8111-111111111111');" > "$task_db_root/race-block-first-follow.log" 2>&1; then
  echo 'Concurrent follow unexpectedly succeeded'; exit 1
fi
wait "$task_block_pid"
rg 'Follow is blocked' "$task_db_root/race-block-first-follow.log"
echo 'Both concurrent follow/block orders passed'
