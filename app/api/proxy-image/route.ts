import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseEnv } from '@/app/lib/env';

// 許可するドメインのホワイトリスト（AniList画像）
const ALLOWED_ANILIST_DOMAINS = [
  's4.anilist.co',
  's3.anilist.co',
  'cdn.anilist.co',
];

// プライベートIPアドレスの範囲をチェック
function isPrivateIP(hostname: string): boolean {
  // localhost, 127.x.x.x, ::1をブロック
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]') {
    return true;
  }

  // プライベートIP範囲のチェック
  // 10.0.0.0/8
  if (/^10\./.test(hostname)) {
    return true;
  }
  
  // 172.16.0.0/12
  const match172 = hostname.match(/^172\.(\d+)\./);
  if (match172) {
    const secondOctet = parseInt(match172[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }
  
  // 192.168.0.0/16
  if (/^192\.168\./.test(hostname)) {
    return true;
  }
  
  // 169.254.0.0/16 (リンクローカル)
  if (/^169\.254\./.test(hostname)) {
    return true;
  }

  return false;
}

// URLが許可されているかチェック
function isAllowedUrl(urlString: string, allowedSupabaseDomain: string | null): boolean {
  try {
    const url = new URL(urlString);
    
    // HTTPSのみ許可
    if (url.protocol !== 'https:') {
      return false;
    }
    
    const hostname = url.hostname.toLowerCase();
    
    // プライベートIPをブロック
    if (isPrivateIP(hostname)) {
      return false;
    }
    
    // ホワイトリストチェック（AniListドメイン）
    if (ALLOWED_ANILIST_DOMAINS.includes(hostname)) {
      return true;
    }
    
    // Supabase Storageドメインのチェック
    if (allowedSupabaseDomain) {
      const supabaseHostname = new URL(allowedSupabaseDomain).hostname.toLowerCase();
      // Supabase Storageのパスを含むかチェック（/storage/v1/object/public/）
      if (hostname === supabaseHostname && url.pathname.includes('/storage/v1/object/public/')) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    // URLのパースに失敗した場合は許可しない
    return false;
  }
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get('url');
  
  if (!urlParam) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }

  // Supabase URLを取得（Supabase Storageドメインの許可チェック用）
  let supabaseUrl: string | null = null;
  try {
    const { url } = getSupabaseEnv(false);
    supabaseUrl = url || null;
  } catch (error) {
    // 環境変数が設定されていない場合でもAniListドメインは使用可能
    console.warn('Supabase URL not configured, only AniList domains will be allowed');
  }

  // URL検証
  if (!isAllowedUrl(urlParam, supabaseUrl)) {
    return NextResponse.json(
      { error: 'URL not allowed' },
      { status: 403 }
    );
  }

  try {
    const response = await fetch(urlParam, {
      // credentials: 'include' を削除（外部ドメインへの不要な認証情報送信を防ぐ）
      headers: {
        'User-Agent': 'AnimeLog-ImageProxy/1.0',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      );
    }
    
    // Content-Typeが画像であることを確認
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }
    
    const blob = await response.blob();
    
    // ファイルサイズ制限（10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (blob.size > maxSize) {
      return NextResponse.json(
        { error: 'Image too large' },
        { status: 413 }
      );
    }
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}


