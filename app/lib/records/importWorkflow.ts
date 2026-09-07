import { getSession } from '../api/auth';
import { getAccountRecords, importAccountRecords } from '../api/recordImport';
import { MAX_IMPORT_BYTES, type RecordBundle } from './importValidation';
import { fingerprint, mergeGuestRecords, planImport, prepareBundle } from './importPlan';
import { readGuestSnapshot, saveGuestImport } from './importStorage';
import { RECORDS_CHANGED_EVENT } from './guest';

export type ImportPreview = {
  ownerId: string | null;
  destinationFingerprint: string;
  source: RecordBundle;
  plan: ReturnType<typeof planImport>;
};
async function checkOwner(ownerId: string | null) {
  const session = await getSession();
  if ((session?.user.id ?? null) !== ownerId)
    throw new Error('ログイン状態が変わりました。内容をもう一度確認してください。');
}
export async function createImportPreview(
  source: RecordBundle,
  ownerId: string | null
): Promise<ImportPreview> {
  if (new TextEncoder().encode(JSON.stringify(source)).length > MAX_IMPORT_BYTES)
    throw new Error('取り込める記録は一度に5MBまでです');
  await checkOwner(ownerId);
  const destination = ownerId
    ? await getAccountRecords(ownerId)
    : (await readGuestSnapshot()).bundle;
  const [preparedSource, preparedDestination, destinationFingerprint] = await Promise.all([
    prepareBundle(source),
    prepareBundle(destination),
    fingerprint(destination),
  ]);
  await checkOwner(ownerId);
  return {
    ownerId,
    source: preparedSource,
    destinationFingerprint,
    plan: planImport(preparedSource, preparedDestination),
  };
}
export async function applyImport(preview: ImportPreview): Promise<number> {
  await checkOwner(preview.ownerId);
  const snapshot = preview.ownerId ? null : await readGuestSnapshot();
  const current = snapshot ? snapshot.bundle : await getAccountRecords(preview.ownerId!);
  if ((await fingerprint(current)) !== preview.destinationFingerprint)
    throw new Error('確認後に記録が更新されました。もう一度内容を確認してください。');
  await checkOwner(preview.ownerId);
  if (snapshot) {
    const merged = mergeGuestRecords(snapshot.bundle, preview.plan.additions);
    saveGuestImport(snapshot, merged);
    return preview.plan.animeCount + preview.plan.watchlistCount;
  }
  const result = await importAccountRecords(preview.ownerId!, preview.plan.additions);
  window.dispatchEvent(new Event(RECORDS_CHANGED_EVENT));
  return result.animes_added + result.watchlist_added;
}
