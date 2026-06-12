'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

// ============================================================
// トースト(操作の成功/失敗フィードバック) + 確認ダイアログ
// ネイティブの alert()/confirm() の置き換え先。
// 使い方:
//   const { showToast, confirmDialog } = useFeedback();
//   showToast('追加しました');                    // 成功(デフォルト)
//   showToast('追加に失敗しました', 'error');     // エラー
//   if (!(await confirmDialog({ message: '削除しますか？', danger: true }))) return;
// ============================================================

type ToastType = 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 削除など破壊的操作のときtrue(確定ボタンが赤になる) */
  danger?: boolean;
}

interface FeedbackContextValue {
  showToast: (message: string, type?: ToastType) => void;
  confirmDialog: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return ctx;
}

const TOAST_DURATION_MS = 3000;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<
    (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
  >(null);
  const toastIdRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
  }, [dismissToast]);

  const confirmDialog = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const closeConfirm = useCallback((ok: boolean) => {
    setConfirmState(prev => {
      prev?.resolve(ok);
      return null;
    });
  }, []);

  return (
    <FeedbackContext.Provider value={{ showToast, confirmDialog }}>
      {children}

      {/* トースト */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 animate-slide-up"
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-[#0f8f88] shrink-0" aria-hidden />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" aria-hidden />
              )}
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 break-words whitespace-pre-wrap">
                {toast.message}
              </span>
              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                aria-label="閉じる"
              >
                <X className="w-4 h-4 text-gray-400" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 確認ダイアログ */}
      {confirmState && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => closeConfirm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            {confirmState.title && (
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                {confirmState.title}
              </h3>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-6">
              {confirmState.message}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => closeConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {confirmState.cancelLabel || 'キャンセル'}
              </button>
              <button
                onClick={() => closeConfirm(true)}
                autoFocus
                className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-white transition-colors ${
                  confirmState.danger
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-[#e879d4] hover:bg-[#d45dbf]'
                }`}
              >
                {confirmState.confirmLabel || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
