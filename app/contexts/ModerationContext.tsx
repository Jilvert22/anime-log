'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { blockUser, getBlockedUsers, unblockUser } from '../lib/api/moderation';
import {
  MODERATION_CHANGED,
  type BlockEntry,
  type ModerationChange,
} from '../lib/moderation/types';

function useModerationState() {
  const { user, isLoading } = useAuth();
  const owner = user?.id ?? null;
  const currentOwner = useRef(owner);
  currentOwner.current = owner;
  const [state, setState] = useState<{
    owner: string | null;
    entries: BlockEntry[];
    ready: boolean;
    error: boolean;
  }>({ owner: null, entries: [], ready: false, error: false });
  const requests = useRef(Symbol());
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    const request = Symbol();
    requests.current = request;
    if (isLoading || !owner) return;
    getBlockedUsers()
      .then((entries) => {
        if (active && requests.current === request)
          setState({ owner, entries, ready: true, error: false });
      })
      .catch(() => {
        if (active && requests.current === request)
          setState((previous) => ({
            owner,
            entries: previous.owner === owner ? previous.entries : [],
            ready: true,
            error: true,
          }));
      });
    return () => {
      active = false;
    };
  }, [owner, isLoading, revision]);
  const entries = useMemo(
    () => (state.owner === owner && owner ? state.entries : []),
    [state, owner]
  );
  const blockedIds = useMemo(() => new Set(entries.map((entry) => entry.blocked_id)), [entries]);
  const block = useCallback(
    async (targetId: string) => {
      const entry = await blockUser(targetId, owner!);
      if (currentOwner.current !== owner) return;
      requests.current = Symbol();
      setState((previous) =>
        previous.owner === owner
          ? {
              ...previous,
              entries: [...previous.entries.filter((item) => item.blocked_id !== targetId), entry],
            }
          : previous
      );
      window.dispatchEvent(
        new CustomEvent<ModerationChange>(MODERATION_CHANGED, {
          detail: { ownerId: owner!, blockedId: targetId },
        })
      );
    },
    [owner]
  );
  const unblock = useCallback(
    async (targetId: string) => {
      await unblockUser(targetId, owner!);
      if (currentOwner.current !== owner) return;
      requests.current = Symbol();
      setState((previous) =>
        previous.owner === owner
          ? {
              ...previous,
              entries: previous.entries.filter((item) => item.blocked_id !== targetId),
            }
          : previous
      );
      window.dispatchEvent(
        new CustomEvent<ModerationChange>(MODERATION_CHANGED, { detail: { ownerId: owner! } })
      );
    },
    [owner]
  );
  return {
    user,
    isLoading,
    entries,
    blockedIds,
    block,
    unblock,
    reload,
    ready: !isLoading && (!owner || (state.owner === owner && state.ready)),
    error: state.owner === owner && !!owner && state.error,
  };
}
const ModerationContext = createContext<ReturnType<typeof useModerationState> | null>(null);
export function ModerationProvider({ children }: { children: ReactNode }) {
  const value = useModerationState();
  return <ModerationContext.Provider value={value}>{children}</ModerationContext.Provider>;
}
export function useModeration() {
  const value = useContext(ModerationContext);
  if (!value) throw new Error('ModerationProvider is required');
  return value;
}
export function UserContentBoundary({ userId, children }: { userId: string; children: ReactNode }) {
  const { blockedIds } = useModeration();
  return blockedIds.has(userId) ? null : <>{children}</>;
}
