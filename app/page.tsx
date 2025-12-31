import HomeClient from './components/HomeClient';

// メインページ（Server Component）
export default async function Home() {
  // Server Componentで初期データを取得（必要に応じて）
  // 現在は認証状態やユーザーデータがクライアント側で管理されているため、
  // ここでは基本的な初期化のみ行う
  // 将来的にServer Componentで取得できるデータがあればここで取得
  
  return <HomeClient />;
}
