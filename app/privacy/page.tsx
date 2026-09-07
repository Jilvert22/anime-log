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
          <p className="text-sm text-white/80 dark:text-gray-400 mt-2">最終更新日：2026年9月8日</p>
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
                  <li>パスワード（認証サービスでハッシュ化して保存）</li>
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
                  <li>視聴済み/周回数、視聴中の話数・総話数</li>
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
                <h3 className="font-semibold mb-1">5. 通知設定（任意）</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    プッシュ通知を有効にした場合、配信に必要な購読情報（通知エンドポイント等）
                  </li>
                  <li>通知のタイミング設定</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-1">6. その他</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>各データの作成日時・更新日時</li>
                  <li>作品検索時の検索語・作品ID</li>
                  <li>サービス改善のためのアクセス解析情報・表示性能の情報（第5条参照）</li>
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
              <li>通報への対応、不正利用の防止、コミュニティの安全な運営</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第4条（第三者への提供）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              本サービスは第5条の外部サービスを利用し、そこに記載する情報を送信します。また、以下の場合に情報を第三者へ提供します。
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 leading-relaxed ml-4 mt-2">
              <li>ユーザー本人の同意がある場合</li>
              <li>ユーザーが公開したプロフィール・視聴作品一覧や、投稿した感想を表示する場合</li>
              <li>法令に基づく開示請求があった場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第5条（外部サービスの利用）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              アカウント認証、記録の保存、プロフィール画像の保管にはSupabaseを利用します。Webサイトの配信にはVercelを利用します。これらのサービスには、機能の提供に必要なアカウント情報・投稿内容・画像や、IPアドレス、リクエスト情報などの通信に伴う情報が送信されます。
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              作品情報の検索にはAniListとAnnictを利用します。検索語、作品ID、シーズンなどの検索条件を送信します。Annictへの通信は本サービスのサーバーを経由します。AniListへの直接の通信や作品画像の取得では、接続先にIPアドレスなどの通信情報も送信されます。本サービスのメールアドレス、パスワード、非公開の視聴メモを検索用データとして送信することはありません。検索欄には個人情報を入力しないでください。
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              サービス改善のためにVercel AnalyticsとVercel Speed
              Insightsを利用します。閲覧状況、インストール操作、追加機能への関心、ページの表示速度などを集計します。これらの解析ではCookieを使用しません。送信するページURLではプロフィールのユーザー名などを伏せ、クエリ文字列を除去します。追加機能への関心の集計に作品名や感想は含めません。
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              お問い合わせ窓口にはGoogleフォームを利用します。フォームに入力・送信した内容はGoogleのサービス上で保存され、運営者が対応のために確認します。パスワードなどの秘密情報は送らないでください。
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              プッシュ通知を有効にした場合は、通知先を示す購読情報を保存し、ブラウザの通知配信サービスを通じて通知を送ります。アニメログの通知設定やブラウザ・端末の設定から通知を停止できます。
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              アクセス解析にはGoogleアナリティクス（GA4）も利用します。Cookieによる識別子、ページの閲覧状況、ブラウザ・端末に関する情報、IPアドレスに基づく地域などを利用して、サービスの利用状況を統計的に把握します。氏名やメールアドレスを解析のために送信することはありません。収集したデータはGoogleの
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e879d4] hover:underline"
              >
                プライバシーポリシー
              </a>
              に従って取り扱われます。ブラウザの設定や、Googleが提供する
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e879d4] hover:underline"
              >
                オプトアウトアドオン
              </a>
              により、計測を無効にすることもできます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第6条（データの保管）
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>
                ログインして保存した記録はSupabase上に保管されます。未ログインで保存した記録は、利用しているブラウザの端末内ストレージに保管されます。
              </li>
              <li>
                パスワードはSupabase
                Authでハッシュ化して保存されます。運営者が元のパスワードを確認する機能はありません。
              </li>
              <li>
                非公開の記録には所有者ごとのアクセス制限を設けています。公開設定のプロフィール・視聴作品一覧や投稿した感想は、他のユーザーやログアウトした人も閲覧できます。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
              通報・ブロックに関する情報
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              通報時には送信者と対象者のID、理由・補足、対象となるプロフィールや感想の内容を保存し、運営による確認と対応に利用します。通報内容や送信者情報を相手へ通知・公開しません。ブロック関係も一般公開しません。運営の対応内容は記録します。関連するアカウントを削除すると、そのアカウントに紐づく通報・ブロックと対応記録も削除します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第7条（データの削除）
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              <li>ユーザーは、設定画面からいつでもアカウントを削除できます。</li>
              <li>
                <Link href="/delete-account" className="underline">
                  アカウントとデータの削除手順
                </Link>
                は、ブラウザからも確認できます。
              </li>
              <li>
                アカウントの削除処理が完了すると、認証アカウントと、サービスのデータベースに紐づくプロフィール、視聴記録、感想、積みアニメ、フォロー関係、通知設定など、および保存されたプロフィール画像を削除します。失敗した場合は画面に表示される案内に従って再試行するか、お問い合わせください。
              </li>
              <li>
                端末内の未ログイン時の記録や、書き出して保存したファイルは、アカウント削除では削除されません。必要に応じてブラウザの保存データやダウンロードしたファイルを削除してください。
              </li>
              <li>
                アクセス解析の集計、外部サービスの通信ログ・バックアップ、お問い合わせフォームの内容は、アカウント削除処理とは別に管理されます。外部サービス上の情報の保持・削除は各サービスの仕組みや設定に従います。お問い合わせ内容などの削除を希望する場合は、第10条の窓口へご連絡ください。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3 font-mixed">
              第8条（Cookieについて）
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              本サービスでは、ログイン状態の維持のためにCookieを使用しています。また、アクセス解析（Googleアナリティクス）のためのCookieも使用します。これらは無効にしても、ログイン以外の主要な機能への影響はありません。ブラウザの設定でCookieを無効にすると、一部の機能が利用できなくなる場合があります。
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
              個人情報の取り扱いに関するお問い合わせは、アプリ内の「ご意見・ご感想」リンクから開くお問い合わせフォーム（Googleフォーム）よりご連絡ください。
            </p>
          </section>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-lg font-bold text-[#6b5b6e] dark:text-white font-mixed">以上</p>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/"
              className="block w-full text-center bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
