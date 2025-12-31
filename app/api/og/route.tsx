import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase/server'
import { getSiteUrl } from '@/app/lib/env'

// Edge Runtimeを削除（Node.js runtimeを使用）

// オタクタイプID→ラベルのマッピング
const OTAKU_TYPE_ID_TO_LABEL: { [key: string]: string } = {
  'analyst': '考察厨',
  'emotional': '感情移入型',
  'visual': '作画厨',
  'audio': '音響派',
  'character': 'キャラオタ',
  'passionate': '熱血派',
  'story': 'ストーリー重視',
  'slice_of_life': '日常系好き',
  'battle': 'バトル好き',
  'entertainment': 'エンタメ重視',
}

function getOtakuTypeLabel(type: string | null): string {
  if (!type) return 'アニメファン'
  if (type === 'auto') return 'アニメファン'
  if (type === 'custom') return 'アニメファン'
  if (OTAKU_TYPE_ID_TO_LABEL[type]) {
    return OTAKU_TYPE_ID_TO_LABEL[type]
  }
  // カスタムテキストの場合は絵文字を除去
  return type.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim() || 'アニメファン'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  // デフォルトOGP（ユーザー指定なし）
  if (!username) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #e879d4, #764ba2)',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 'bold', color: 'white' }}>
            🎬 アニメログ
          </div>
          <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)', marginTop: 20 }}>
            あなたのアニメ視聴記録を美しく
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }

  // ユーザー情報を取得
  const supabase = await createServerSupabaseClient()
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, username, otaku_type, otaku_type_custom')
    .eq('username', username)
    .eq('is_public', true)
    .single()

  if (!profile) {
    // プロフィールが見つからない場合はデフォルトOGPを返す
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #e879d4, #764ba2)',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 'bold', color: 'white' }}>
            🎬 アニメログ
          </div>
          <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)', marginTop: 20 }}>
            プロフィールが見つかりません
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }

  // ユーザーの視聴統計を取得
  const { data: animes } = await supabase
    .from('animes')
    .select('id, rating')
    .eq('user_id', profile.id)
    .eq('watched', true)

  const watchedCount = animes?.length || 0
  const avgRating = animes && animes.length > 0
    ? (animes.reduce((sum: number, a: { rating: number | null }) => sum + (a.rating || 0), 0) / animes.length).toFixed(1)
    : '-'

  const displayName = profile.username
  const otakuType = profile.otaku_type_custom || getOtakuTypeLabel(profile.otaku_type)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
          fontFamily: 'sans-serif',
          padding: 60,
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              background: 'linear-gradient(135deg, #e879d4, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              marginRight: 30,
            }}
          >
            🎬
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: 'white' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 28, color: '#e879d4', marginTop: 8 }}>
              {otakuType}
            </div>
          </div>
        </div>

        {/* ANIME DNA ラベル */}
        <div
          style={{
            fontSize: 24,
            color: '#00d4ff',
            letterSpacing: 4,
            marginBottom: 30,
          }}
        >
          ANIME DNA
        </div>

        {/* 統計 */}
        <div style={{ display: 'flex', gap: 60 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 64, fontWeight: 'bold', color: '#ffd700' }}>
              {watchedCount}
            </div>
            <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)' }}>
              視聴作品
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 64, fontWeight: 'bold', color: '#ffd700' }}>
              {avgRating}
            </div>
            <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.7)' }}>
              平均評価
            </div>
          </div>
        </div>

        {/* フッター */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 60,
            fontSize: 24,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {new URL(getSiteUrl()).hostname}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}

