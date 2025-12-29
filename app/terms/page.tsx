'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e879d4] via-[#764ba2] to-[#e879d4] dark:from-[#0a0a0f] dark:via-[#1a1a2e] dark:to-[#0a0a0f] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-white dark:text-gray-200 hover:text-[#ffd700] dark:hover:text-[#ffd700] transition-colors mb-4"
          >
            ← ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold text-white dark:text-white font-mixed">
            アニメログ 利用規約
          </h1>
          <p className="text-sm text-white/80 dark:text-gray-400 mt-2">
            最終更新日：2026年1月
          </p>
        </div>

        {/* コンテンツ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第1条（はじめに）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              この利用規約（以下「本規約」）は、Jilvert（以下「運営者」）が提供する「アニメログ」（以下「本サービス」）の利用条件を定めるものです。本サービスをご利用いただく際は、本規約に同意したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第2条（サービス内容）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              本サービスは、アニメの視聴記録・管理、レビューの投稿、視聴傾向の分析などの機能を提供します。本サービスは、AniList APIを利用してアニメ情報を取得しています。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第3条（利用資格）
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>本サービスは13歳以上の方を対象としています。13歳未満の方は利用できません。</li>
              <li>未成年の方は、保護者の同意を得た上でご利用ください。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第4条（アカウント登録）
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>本サービスの利用にはアカウント登録が必要です。</li>
              <li>登録時には正確な情報を入力してください。</li>
              <li>アカウントの管理責任はユーザー本人にあります。パスワードの第三者への共有はお控えください。</li>
              <li>1人のユーザーが複数のアカウントを作成することは禁止します。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第5条（禁止事項）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
              本サービスの利用にあたり、以下の行為を禁止します。
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 leading-relaxed ml-4">
              <li>法令または公序良俗に反する行為</li>
              <li>他のユーザーへの嫌がらせ、誹謗中傷</li>
              <li>虚偽の情報を登録・投稿する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>不正アクセス、システムへの攻撃</li>
              <li>本サービスのデータを無断で収集・転用する行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第6条（サービスの変更・停止）
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>運営者は、事前の通知なく本サービスの内容を変更、または提供を停止することがあります。</li>
              <li>サービスの変更・停止によりユーザーに生じた損害について、運営者は責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第7条（免責事項）
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>本サービスは現状のまま提供されます。すべての機能が常に正常に動作すること、特定の目的に適合することを保証するものではありません。</li>
              <li>本サービスの利用により生じた損害について、運営者は故意または重大な過失がある場合を除き、責任を負いません。</li>
              <li>AniList APIから取得するアニメ情報の正確性について、運営者は保証しません。</li>
              <li>ユーザー間のトラブルについて、運営者は責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第8条（アカウントの停止・削除）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              運営者は、ユーザーが本規約に違反した場合、事前の通知なくアカウントを停止または削除できるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第9条（規約の変更）
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>運営者は、必要に応じて本規約を変更できます。</li>
              <li>変更後の規約は、本サービス上に掲載した時点で効力を生じます。</li>
              <li>変更後も本サービスを利用した場合、変更後の規約に同意したものとみなします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第10条（準拠法・管轄）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              本規約は日本法に準拠し、本サービスに関する紛争は日本国内の裁判所を管轄とします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第11条（お問い合わせ）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              本サービスに関するお問い合わせは、アプリ内の「ご意見・ご感想」フォームよりご連絡ください。
            </p>
          </section>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-lg font-bold text-[#6b5b6e] dark:text-white font-mixed">
              以上
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

