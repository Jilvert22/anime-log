'use client';

import { useState } from 'react';

type ModalType = 'terms' | 'privacy';

interface TermsPrivacyModalProps {
  show: boolean;
  type: ModalType;
  onClose: () => void;
}

export function TermsPrivacyModal({ show, type, onClose }: TermsPrivacyModalProps) {
  if (!show) return null;

  const isTerms = type === 'terms';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="p-6 border-b dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {isTerms ? 'アニメログ 利用規約' : 'アニメログ プライバシーポリシー'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="閉じる"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            最終更新日：2026年1月
          </p>
        </div>

        {/* コンテンツエリア（スクロール可能） */}
        <div className="flex-1 overflow-y-auto p-6">
          {isTerms ? (
            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第1条（はじめに）
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  この利用規約（以下「本規約」）は、Jilvert（以下「運営者」）が提供する「アニメログ」（以下「本サービス」）の利用条件を定めるものです。本サービスをご利用いただく際は、本規約に同意したものとみなします。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第2条（サービス内容）
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  本サービスは、アニメの視聴記録・管理、レビューの投稿、視聴傾向の分析などの機能を提供します。本サービスは、AniList APIを利用してアニメ情報を取得しています。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第3条（利用資格）
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                  <li>本サービスは13歳以上の方を対象としています。13歳未満の方は利用できません。</li>
                  <li>未成年の方は、保護者の同意を得た上でご利用ください。</li>
                </ol>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第4条（アカウント登録）
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                  <li>本サービスの利用にはアカウント登録が必要です。</li>
                  <li>登録時には正確な情報を入力してください。</li>
                  <li>アカウントの管理責任はユーザー本人にあります。パスワードの第三者への共有はお控えください。</li>
                  <li>1人のユーザーが複数のアカウントを作成することは禁止します。</li>
                </ol>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第5条（禁止事項）
                </h3>
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
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第6条（サービスの変更・停止）
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                  <li>運営者は、事前の通知なく本サービスの内容を変更、または提供を停止することがあります。</li>
                  <li>サービスの変更・停止によりユーザーに生じた損害について、運営者は責任を負いません。</li>
                </ol>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第7条（免責事項）
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                  <li>本サービスは現状のまま提供されます。すべての機能が常に正常に動作すること、特定の目的に適合することを保証するものではありません。</li>
                  <li>本サービスの利用により生じた損害について、運営者は故意または重大な過失がある場合を除き、責任を負いません。</li>
                  <li>AniList APIから取得するアニメ情報の正確性について、運営者は保証しません。</li>
                  <li>ユーザー間のトラブルについて、運営者は責任を負いません。</li>
                </ol>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第8条（アカウントの停止・削除）
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  運営者は、ユーザーが本規約に違反した場合、事前の通知なくアカウントを停止または削除できるものとします。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第9条（規約の変更）
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                  <li>運営者は、必要に応じて本規約を変更できます。</li>
                  <li>変更後の規約は、本サービス上に掲載した時点で効力を生じます。</li>
                  <li>変更後も本サービスを利用した場合、変更後の規約に同意したものとみなします。</li>
                </ol>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第10条（準拠法・管轄）
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  本規約は日本法に準拠し、本サービスに関する紛争は日本国内の裁判所を管轄とします。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第11条（お問い合わせ）
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  本サービスに関するお問い合わせは、アプリ内の「ご意見・ご感想」フォームよりご連絡ください。
                </p>
              </section>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-lg font-bold text-[#6b5b6e] dark:text-white">
                  以上
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第1条（はじめに）
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  本プライバシーポリシーは、Jilvert（以下「運営者」）が提供する「アニメログ」（以下「本サービス」）における、ユーザーの個人情報の取り扱いについて定めるものです。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第2条（収集する情報）
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  本サービスでは、以下の情報を収集・保存します。
                </p>
                <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
                  <div>
                    <h4 className="font-semibold mb-1">1. アカウント情報</h4>
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
                    <h4 className="font-semibold mb-1">2. 視聴記録</h4>
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
                    <h4 className="font-semibold mb-1">3. 感想・レビュー</h4>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>感想本文</li>
                      <li>対象アニメ・話数</li>
                      <li>ネタバレ設定</li>
                      <li>いいね・役に立った数</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">4. 積みアニメリスト</h4>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>アニメタイトル・画像</li>
                      <li>メモ（任意）</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">5. その他</h4>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>各データの作成日時・更新日時</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第3条（情報の利用目的）
                </h3>
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
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第4条（第三者への提供）
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  運営者は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 leading-relaxed ml-4 mt-2">
                  <li>ユーザー本人の同意がある場合</li>
                  <li>法令に基づく開示請求があった場合</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第5条（外部サービスの利用）
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  本サービスは、アニメ情報の取得にAniList APIを利用しています。AniListへのデータ送信は、アニメの検索・情報取得に必要な範囲に限られ、ユーザーの個人情報は送信されません。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第6条（データの保管）
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                  <li>ユーザーデータはSupabase（クラウドサービス）上に保管されます。</li>
                  <li>パスワードは暗号化して保存され、運営者を含め誰も閲覧できません。</li>
                  <li>データへのアクセスはユーザーごとに制限されており、他のユーザーのデータにはアクセスできません。</li>
                </ol>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第7条（データの削除）
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                  <li>ユーザーは、設定画面からいつでもアカウントを削除できます。</li>
                  <li>アカウント削除時、ユーザーに紐づくすべてのデータ（プロフィール、視聴履歴、感想、積みアニメ等）は完全に削除されます。</li>
                </ol>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第8条（Cookieについて）
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  本サービスでは、ログイン状態の維持のためにCookieを使用しています。ブラウザの設定でCookieを無効にすると、一部の機能が利用できなくなる場合があります。
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第9条（プライバシーポリシーの変更）
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                  <li>運営者は、必要に応じて本ポリシーを変更できます。</li>
                  <li>変更後のポリシーは、本サービス上に掲載した時点で効力を生じます。</li>
                </ol>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#6b5b6e] dark:text-white mb-3">
                  第10条（お問い合わせ）
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  個人情報の取り扱いに関するお問い合わせは、アプリ内の「ご意見・ご感想」フォームよりご連絡ください。
                </p>
              </section>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-lg font-bold text-[#6b5b6e] dark:text-white">
                  以上
                </p>
              </div>
            </div>
          )}
        </div>

        {/* フッター（閉じるボタン） */}
        <div className="p-6 border-t dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

