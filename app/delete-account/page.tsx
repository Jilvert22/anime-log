import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'アカウントとデータの削除',
  description: 'アニメログのアカウントと関連データを削除する手順です。ブラウザからも操作できます。',
  alternates: { canonical: '/delete-account' },
};

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-[#fef6f0] dark:bg-gray-900 px-4 py-12">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-6 text-gray-800 dark:text-gray-200">
        <Link href="/" className="text-fuchsia-800 dark:text-fuchsia-300">
          アニメログへ戻る
        </Link>
        <h1 className="text-2xl font-bold">アカウントとデータの削除</h1>
        <p>アプリをインストールしていなくても、このサイトから削除を操作できます。</p>
        <ol className="list-decimal pl-5 space-y-3">
          <li>削除したいアカウントでアニメログにログインします。</li>
          <li>マイページの設定にある「アカウント削除」を選びます。</li>
          <li>削除対象を確認し、「削除する」を押します。</li>
        </ol>
        <Link
          href="/?tab=mypage"
          className="inline-block px-4 py-3 bg-fuchsia-700 text-white rounded-xl"
        >
          マイページを開く
        </Link>
        <p>
          アカウントに紐づく視聴記録、積みアニメ、感想、プロフィールなどが削除対象です。必要な記録は先に書き出してください。端末内の記録やダウンロード済みファイルは別途管理してください。
        </p>
        <p>
          ログインできない場合はログイン画面のパスワード再設定をお試しください。解決しない場合は、アニメログのアカウント削除についてのご相談として、下記の窓口へご連絡ください。パスワードは送らないでください。
        </p>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLScfwMPJs8-qazTa9kfnDU6b4gqRLJVleDJkDgeCFDeuJjlxUQ/viewform"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block underline text-fuchsia-800 dark:text-fuchsia-300"
        >
          お問い合わせ窓口
        </a>
        <p className="text-sm">
          <Link href="/privacy" className="underline">
            データの取り扱いについて
          </Link>
        </p>
      </div>
    </main>
  );
}
