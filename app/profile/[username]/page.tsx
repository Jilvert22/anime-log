import { Metadata } from 'next'
import { createServerSupabaseClient } from '@/app/lib/supabase/server'
import ProfilePageClient from './ProfilePageClient'
import { getSiteUrl } from '@/app/lib/env'

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
  return type.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim() || 'アニメファン'
}

type Props = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  
  const supabase = await createServerSupabaseClient()
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('username, otaku_type, otaku_type_custom')
    .eq('username', username)
    .eq('is_public', true)
    .single()

  if (!profile) {
    return {
      title: 'プロフィールが見つかりません | アニメログ',
      description: 'アニメログでアニメ視聴記録を管理しよう',
    }
  }

  const displayName = profile.username
  const otakuType = profile.otaku_type_custom || getOtakuTypeLabel(profile.otaku_type)

  const siteUrl = getSiteUrl()
  const title = `${displayName}のプロフィール | アニメログ`
  const description = `${displayName}さん（${otakuType}）のアニメ視聴記録とANIME DNA`
  const ogImageUrl = `${siteUrl}/api/og?username=${encodeURIComponent(username)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName}のプロフィール`,
        },
      ],
      type: 'profile',
      url: `${siteUrl}/profile/${encodeURIComponent(username)}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  
  return <ProfilePageClient username={username} />
}


