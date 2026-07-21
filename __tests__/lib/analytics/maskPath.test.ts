import { describe, expect, it } from 'vitest';
import {
  maskLocationHref,
  maskPath,
  maskReferrer,
  maskTitle,
} from '../../../app/lib/analytics/maskPath';

describe('maskPath', () => {
  it('/profile/{username} の username を [username] に置換する', () => {
    expect(maskPath('/profile/Jilvert')).toBe('/profile/[username]');
  });

  it('マルチバイト文字の username もマスクする', () => {
    expect(maskPath('/profile/ユーザー')).toBe('/profile/[username]');
  });

  it('/share/{username} の username を [username] に置換する', () => {
    expect(maskPath('/share/Abc123')).toBe('/share/[username]');
  });

  it('トップページはそのまま', () => {
    expect(maskPath('/')).toBe('/');
  });

  it('マスク対象外のパスはそのまま', () => {
    expect(maskPath('/about')).toBe('/about');
  });

  it('username を持たない /profile はそのまま', () => {
    expect(maskPath('/profile')).toBe('/profile');
  });

  it('username を持たない /share はそのまま', () => {
    expect(maskPath('/share')).toBe('/share');
  });

  it('トレイリングスラッシュがあっても安全にマスクする', () => {
    expect(maskPath('/profile/Jilvert/')).toBe('/profile/[username]/');
  });

  it('username より深い階層があっても username 部分だけマスクする', () => {
    expect(maskPath('/profile/Jilvert/settings')).toBe('/profile/[username]/settings');
  });
});

describe('maskTitle', () => {
  it('/profile/{username} では汎用タイトルを返す', () => {
    expect(maskTitle('/profile/Jilvert', 'Jilvertさんのプロフィール | アニメログ')).toBe(
      'プロフィール | アニメログ'
    );
  });

  it('/share/{username} では汎用タイトルを返す', () => {
    expect(maskTitle('/share/Abc123', 'Abc123のANIME DNA | アニメログ')).toBe(
      'ANIME DNA | アニメログ'
    );
  });

  it('マスク対象外のパスでは元の title をそのまま返す', () => {
    expect(maskTitle('/about', 'アニメログについて | アニメログ')).toBe(
      'アニメログについて | アニメログ'
    );
  });

  it('username を持たない /profile では元の title をそのまま返す', () => {
    expect(maskTitle('/profile', 'プロフィール一覧 | アニメログ')).toBe(
      'プロフィール一覧 | アニメログ'
    );
  });
});

describe('maskLocationHref', () => {
  it('/profile/{username} の pathname をマスクしクエリ・フラグメントを除去する', () => {
    expect(maskLocationHref('https://animelog.jp/profile/Jilvert?x=1#a')).toBe(
      'https://animelog.jp/profile/[username]'
    );
  });

  it('/share/{username} の pathname をマスクする', () => {
    expect(maskLocationHref('https://animelog.jp/share/Abc123?ref=x')).toBe(
      'https://animelog.jp/share/[username]'
    );
  });

  it('マスク対象外のパスはクエリ・フラグメントのみ除去してそのまま返す', () => {
    expect(maskLocationHref('https://animelog.jp/about')).toBe('https://animelog.jp/about');
  });

  it('マスク対象外のパスでもクエリ文字列は除去する', () => {
    expect(maskLocationHref('https://animelog.jp/about?utm_source=x')).toBe(
      'https://animelog.jp/about'
    );
  });

  it('外部URLはホスト・パスをそのまま維持しつつクエリ・フラグメントのみ除去する', () => {
    expect(maskLocationHref('https://google.com/search?q=anime-log')).toBe(
      'https://google.com/search'
    );
  });

  it('空文字は空文字を返す', () => {
    expect(maskLocationHref('')).toBe('');
  });

  it('相対URLなど解析に失敗する入力は空文字を返す', () => {
    expect(maskLocationHref('/profile/Jilvert')).toBe('');
  });
});

describe('maskReferrer', () => {
  it('自サイトの /profile/{username} リファラはマスクされる', () => {
    expect(maskReferrer('https://animelog.jp/profile/Jilvert')).toBe(
      'https://animelog.jp/profile/[username]'
    );
  });

  it('自サイトの /share/{username} リファラはマスクされる', () => {
    expect(maskReferrer('https://animelog.jp/share/Abc123')).toBe(
      'https://animelog.jp/share/[username]'
    );
  });

  it('外部リファラはパスがマッチしないためそのまま（クエリのみ除去）', () => {
    expect(maskReferrer('https://google.com/search?q=anime-log')).toBe('https://google.com/search');
  });

  it('空文字は空文字を返す', () => {
    expect(maskReferrer('')).toBe('');
  });
});
