import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import ProfilePageClient from './ProfilePageClient';
import { JsonLd } from '@/app/components/seo/JsonLd';
import { Breadcrumb } from '@/app/components/seo/Breadcrumb';
import { getSiteUrl } from '@/app/lib/env';
import type { UserProfile } from '@/app/lib/api';

// オタクタイプID→ラベルのマッピング
const OTAKU_TYPE_ID_TO_LABEL: { [key: string]: string } = {
  analyst: '考察厨',
  emotional: '感情移入型',
  visual: '作画厨',
  audio: '音響派',
  character: 'キャラオタ',
  passionate: '熱血派',
  story: 'ストーリー重視',
  slice_of_life: '日常系好き',
  battle: 'バトル好き',
  entertainment: 'エンタメ重視',
};

function getOtakuTypeLabel(type: string | null): string {
  if (!type) return 'アニメファン';
  if (type === 'auto') return 'アニメファン';
  if (type === 'custom') return 'アニメファン';
  if (OTAKU_TYPE_ID_TO_LABEL[type]) {
    return OTAKU_TYPE_ID_TO_LABEL[type];
  }
  return (
    type.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim() ||
    'アニメファン'
  );
}

type Props = {
  params: Promise<{ username: string }>;
};

// ProfilePageClient が期待する公開アニメの形
type PublicAnime = { id: number; title: string; image: string; rating: number; watched: boolean };

// サーバ側で公開プロフィールと公開視聴記録を取得（SSRで本文を描画＝クローラ/AIが読める）
async function fetchPublicProfile(
  username: string
): Promise<{ profile: UserProfile | null; animes: PublicAnime[] }> {
  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('username', username)
    .eq('is_public', true)
    .single();

  if (!profile) return { profile: null, animes: [] };

  const { data: rows } = await supabase
    .from('public_animes')
    .select('id, title, image, rating, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  const animes: PublicAnime[] = (rows ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    image: r.image ?? '',
    rating: r.rating ?? 0,
    watched: true,
  }));

  return { profile: profile as UserProfile, animes };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/profile/${encodeURIComponent(username)}`;

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('username, otaku_type, otaku_type_custom')
    .eq('username', username)
    .eq('is_public', true)
    .single();

  if (!profile) {
    // 非公開/存在しないプロフィールはインデックスさせない
    return {
      title: 'プロフィールが見つかりません',
      description: 'アニメログでアニメ視聴記録を管理しよう',
      alternates: { canonical },
      robots: { index: false, follow: true },
    };
  }

  const displayName = profile.username;
  const otakuType = profile.otaku_type_custom || getOtakuTypeLabel(profile.otaku_type);

  const pageTitle = `${displayName}のプロフィール`;
  const socialTitle = `${displayName}のプロフィール | アニメログ`;
  const description = `${displayName}さん（${otakuType}）のアニメ視聴記録とANIME DNA`;
  const ogImageUrl = `${siteUrl}/api/og?username=${encodeURIComponent(username)}`;

  return {
    title: pageTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: socialTitle,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${displayName}のプロフィール` }],
      type: 'profile',
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

function buildProfileJsonLd(
  siteUrl: string,
  username: string,
  profile: UserProfile,
  animes: PublicAnime[]
): Record<string, unknown>[] {
  const url = `${siteUrl}/profile/${encodeURIComponent(username)}`;
  const profilePage: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url,
    mainEntity: {
      '@type': 'Person',
      name: profile.username,
      ...(profile.bio ? { description: profile.bio } : {}),
    },
  };
  const nodes: Record<string, unknown>[] = [profilePage];

  // 視聴履歴（本文に表示している作品名のみをItemList化）
  if (animes.length > 0) {
    nodes.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${profile.username}の視聴履歴`,
      numberOfItems: animes.length,
      itemListElement: animes.slice(0, 50).map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'CreativeWork', name: a.title },
      })),
    });
  }
  return nodes;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const { profile, animes } = await fetchPublicProfile(username);
  const siteUrl = getSiteUrl();

  return (
    <>
      {profile && <JsonLd data={buildProfileJsonLd(siteUrl, username, profile, animes)} />}
      <ProfilePageClient
        key={username}
        username={username}
        initialProfile={profile}
        initialAnimes={animes}
        breadcrumb={
          profile && (
            <Breadcrumb
              items={[
                { name: 'ホーム', url: siteUrl },
                // 現在ページ(プロフィール)は url を持たせない(常に aria-current 表示)
                { name: `${profile.username}のプロフィール` },
              ]}
            />
          )
        }
      />
    </>
  );
}
