import { describe, expect, it } from 'vitest';
import { maskPath, maskTitle } from '../../../app/lib/analytics/maskPath';

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
