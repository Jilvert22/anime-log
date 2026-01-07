'use client';

import Link from 'next/link';
import { Footer } from '../components/common/Footer';
import { SimpleHeader } from '../components/common/SimpleHeader';

export default function AboutClient() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f]">
      <SimpleHeader />
      {/* ヒーローセクション */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white to-gray-50 dark:from-[#0a0a0f] dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 左側: テキスト */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
                あのクール、何見てたっけ？がすぐわかる
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8">
                視聴履歴をコレクションして、見逃したアニメも思い出せる
              </p>
              <Link
                href="/"
                className="inline-block bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] active:bg-[var(--color-primary-dark)] text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                今すぐ使ってみる
              </Link>
            </div>
            {/* 右側: スクリーンショット */}
            <div className="order-first lg:order-last">
              <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <img
                  src="/images/about/hero-home.png"
                  alt="アニメログのホーム画面"
                  className="w-full h-auto aspect-[16/9] object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.placeholder')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'placeholder aspect-video flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800';
                      placeholder.textContent = 'スクリーンショット準備中';
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">
            主な機能
          </h2>
          
          {/* クール別管理 - 左画像・右テキスト */}
          <div className="mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* 左側: スクリーンショット */}
              <div className="order-2 lg:order-1">
                <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <img
                    src="/images/about/feature-quarter.png"
                    alt="クール別管理の画面"
                    className="w-full h-auto aspect-[16/9] object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.placeholder')) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'placeholder aspect-video flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800';
                        placeholder.textContent = 'スクリーンショット準備中';
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                </div>
              </div>
              {/* 右側: テキスト */}
              <div className="order-1 lg:order-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-purple)] flex items-center justify-center mb-6">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                  クール別管理
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  春・夏・秋・冬のクールごとに視聴アニメを整理。シーズンごとの視聴傾向を把握できます。過去のクールも振り返りやすく、見逃した作品もすぐに見つけられます。
                </p>
              </div>
            </div>
          </div>

          {/* 来期視聴管理 - 左テキスト・右画像 */}
          <div className="mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* 左側: テキスト */}
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)] flex items-center justify-center mb-6">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                  来期視聴管理
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  次期クールの視聴予定を事前に登録。放送開始を逃さずに済みます。視聴ステータスを管理して、進捗を追跡できます。
                </p>
              </div>
              {/* 右側: スクリーンショット */}
              <div>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <img
                    src="/images/about/feature-next.png"
                    alt="来期視聴管理の画面"
                    className="w-full h-auto aspect-[16/9] object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.placeholder')) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'placeholder aspect-video flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800';
                        placeholder.textContent = 'スクリーンショット準備中';
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DNAカード - 左画像・右テキスト */}
          <div className="mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* 左側: スクリーンショット */}
              <div className="order-2 lg:order-1">
                <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <img
                    src="/images/about/feature-dna.png"
                    alt="DNAカードのサンプル"
                    className="w-full h-auto aspect-[9/16] object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.placeholder')) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'placeholder aspect-[9/16] flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800';
                        placeholder.textContent = 'スクリーンショット準備中';
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                </div>
              </div>
              {/* 右側: テキスト */}
              <div className="order-1 lg:order-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-purple)] to-[var(--color-primary)] flex items-center justify-center mb-6">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                  DNAカード
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  最推し作品5つと視聴傾向タイプを1枚の画像に。SNSでシェアして、趣味の合う人を見つけよう。あなただけのアニメ視聴DNAを可視化します。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-[#0a0a0f]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            アニメログの特徴
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* ログイン不要 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[var(--color-primary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                ログイン不要
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                すぐに使い始められます。アカウント作成は任意です。
              </p>
            </div>

            {/* マルチデバイス同期 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-secondary)]/10 dark:bg-[var(--color-secondary)]/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[var(--color-secondary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                マルチデバイス同期
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                ログインすれば、PC・スマホ・タブレットでデータを同期できます。
              </p>
            </div>

            {/* 無料 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/10 dark:bg-[var(--color-accent)]/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[var(--color-accent)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                無料
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                すべての機能を無料でご利用いただけます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--color-primary)]/10 via-[var(--color-purple)]/10 to-[var(--color-secondary)]/10 dark:from-[var(--color-primary)]/20 dark:via-[var(--color-purple)]/20 dark:to-[var(--color-secondary)]/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
            今すぐ始めましょう
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            アニメ視聴記録を管理して、あなただけのANIME DNAカードを作成しよう
          </p>
          <Link
            href="/"
            className="inline-block bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] active:bg-[var(--color-primary-dark)] text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            今すぐ始める
          </Link>
        </div>
      </section>

      {/* フッター */}
      <Footer />
    </div>
  );
}

