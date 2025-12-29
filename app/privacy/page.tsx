'use client';

import Link from 'next/link';

export default function PrivacyPage() {
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
            アニメログ プライバシーポリシー
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
              本プライバシーポリシーは、Jilvert（以下「運営者」）が提供する「アニメログ」（以下「本サービス」）における、ユーザーの個人情報の取り扱いについて定めるものです。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第2条（収集する情報）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
              本サービスでは、以下の情報を収集・保存します。
            </p>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
              <div>
                <h3 className="font-semibold mb-1">1. アカウント情報</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>メールアドレス</li>
                  <li>パスワード（暗号化して保存）</li>
                  <li>ユーザー名・ハンドル名</li>
                  <li>自己紹介文（任意）</li>
                  <li>プロフィール画像（任意）</li>
                  <li>オタクタイプ（診断結果またはカスタム設定）</li>
                  <li>公開/非公開設定</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1">2. 視聴記録</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>視聴したアニメのタイトル・画像</li>
                  <li>視聴シーズン</li>
                  <li>評価（1〜5段階）</li>
                  <li>視聴済み/周回数</li>
                  <li>タグ・シリーズ名・制作スタジオ</li>
                  <li>主題歌・名言メモ（任意）</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1">3. 感想・レビュー</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>感想本文</li>
                  <li>対象アニメ・話数</li>
                  <li>ネタバレ設定</li>
                  <li>いいね・役に立った数</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1">4. 積みアニメリスト</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>アニメタイトル・画像</li>
                  <li>メモ（任意）</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1">5. その他</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>各データの作成日時・更新日時</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第3条（情報の利用目的）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
              収集した情報は、以下の目的で利用します。
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 leading-relaxed ml-4">
              <li>本サービスの提供・運営</li>
              <li>ユーザー認証・アカウント管理</li>
              <li>視聴傾向の分析・統計機能の提供</li>
              <li>サービスの改善・新機能の開発</li>
              <li>お問い合わせへの対応</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第4条（第三者への提供）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              運営者は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 leading-relaxed ml-4 mt-2">
              <li>ユーザー本人の同意がある場合</li>
              <li>法令に基づく開示請求があった場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第5条（外部サービスの利用）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              本サービスは、アニメ情報の取得にAniList APIを利用しています。AniListへのデータ送信は、アニメの検索・情報取得に必要な範囲に限られ、ユーザーの個人情報は送信されません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第6条（データの保管）
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>ユーザーデータはSupabase（クラウドサービス）上に保管されます。</li>
              <li>パスワードは暗号化して保存され、運営者を含め誰も閲覧できません。</li>
              <li>データへのアクセスはユーザーごとに制限されており、他のユーザーのデータにはアクセスできません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第7条（データの削除）
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>ユーザーは、設定画面からいつでもアカウントを削除できます。</li>
              <li>アカウント削除時、ユーザーに紐づくすべてのデータ（プロフィール、視聴履歴、感想、積みアニメ等）は完全に削除されます。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第8条（Cookieについて）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              本サービスでは、ログイン状態の維持のためにCookieを使用しています。ブラウザの設定でCookieを無効にすると、一部の機能が利用できなくなる場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第9条（プライバシーポリシーの変更）
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>運営者は、必要に応じて本ポリシーを変更できます。</li>
              <li>変更後のポリシーは、本サービス上に掲載した時点で効力を生じます。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第10条（お問い合わせ）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              個人情報の取り扱いに関するお問い合わせは、アプリ内の「ご意見・ご感想」フォームよりご連絡ください。
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

