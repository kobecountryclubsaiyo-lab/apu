# 会話から始まるコミュニティ

「フォロワーではなく、一緒に遊ぶ仲間を。」— [docs/app-specification.md](docs/app-specification.md) の仕様をもとにした、実際に動くWebアプリの土台です。
デザインは [docs/original-prototypes/](docs/original-prototypes/) にあった4つのReactプロトタイプ（プロフィール／グループチャット／募集投稿／テーマ選択）を、実データで動くページとして実装しています。

## 技術構成

| 領域 | 選定 | 理由 |
|---|---|---|
| フレームワーク | Next.js 14 (App Router) + TypeScript | フロント・API・SSRを1つのプロジェクトで完結でき、プロトタイプのReact/Tailwindコードをほぼそのまま活かせる |
| スタイリング | Tailwind CSS | プロトタイプが最初からTailwindクラスで書かれていたため |
| DB / ORM | PostgreSQL + Prisma | Vercel Postgres・Neon・Supabase・Railway など主要ホスティング先がすべて対応しており、本番想定でそのまま使える |
| 認証 | 自前実装（bcryptjs + jose製JWTのCookieセッション） | 外部OAuthプロバイダを増やさず、最小構成でログイン機能を用意 |
| AIによる話題整理 | Anthropic API（`@anthropic-ai/sdk`）、未設定時はキーワード頻度によるヒューリスティックにフォールバック | `ANTHROPIC_API_KEY` の有無だけで開発中でも本番相当でも動く |

## セットアップ（ローカル開発）

Postgresが手元にない場合は `docker compose up -d` でローカル用のPostgresが起動します（`.env.example` の接続先と一致）。

```bash
docker compose up -d    # ローカルPostgresを起動（Dockerがない場合は各自用意したDBのURLを.envに設定）
npm install
cp .env.example .env    # 必要なら SESSION_SECRET / ANTHROPIC_API_KEY を編集
npx prisma migrate dev  # 初回のみ：テーブルを作成
npm run db:seed         # デモ用のテーマ・部屋・ユーザーを投入
npm run dev
```

`http://localhost:3000` を開くとログイン画面が出ます。デモアカウント（`npm run db:seed` 実行後）:

| ロール | メールアドレス | パスワード |
|---|---|---|
| 一般ユーザー（信頼スタンプ多め） | `haruka@example.com` | `password1234` |
| 一般ユーザー（信頼スタンプ少なめ） | `taku@example.com` | `password1234` |
| 運営（管理者） | `admin@example.com` | `password1234` |

`ANTHROPIC_API_KEY` を `.env` に設定すると、グループチャットの「AIが整理した話題」がClaudeによる実際の要約に切り替わります（未設定時は簡易ヒューリスティックで動作）。

## 実装した機能（app-specification.md 対応）

- **テーマ→部屋の構造**（3章）: テーマは `prisma/seed.ts` で運営が用意し、部屋はユーザーが作成
- **部屋作成の承認フロー**（3章）: 信頼スタンプ（オフライン参加回数＋もらったリアクション数）が `src/lib/rules.ts` のしきい値未満なら運営承認待ち（`/admin/rooms`）、以上なら即時公開
- **信頼指標プロフィール**（4章）: フォロワー数・性別は表示せず、オフライン参加回数をヒーロー指標として表示（`/profile`）
- **AIが話題を整理**（2章・7章）: `src/lib/summarize.ts`、`/rooms/[id]` のチャット画面
- **安全設計**（5章）: 募集の定員3人以上をUI・APIの両方で強制（`src/lib/rules.ts`）、オフライン注意文、安全ガイドライン同意必須、主催者の信頼スタンプ表示、通報機能（`/api/reports`）
- **通報・ブロックのUI**は未着手（仕様書8章の通り）。APIエンドポイント（`/api/reports`）のみ用意

## ディレクトリ構成

```
src/
  app/                # ページ・APIルート（Next.js App Router）
    login/ signup/    # 認証
    themes/           # テーマ選択・部屋作成
    rooms/[id]/       # グループチャット・募集投稿
    profile/          # プロフィール
    admin/rooms/      # 部屋の承認キュー（運営用）
    api/              # REST的なAPIルート
  components/         # 画面ごとのReactコンポーネント
  lib/                # Prismaクライアント、認証、AI要約、安全ルールの定数など
prisma/
  schema.prisma       # データモデル
  seed.ts             # デモデータ
docs/
  app-specification.md      # 元の仕様書
  original-prototypes/      # 元のReactプロトタイプ（実装前の見た目の参照用）
```

## 本番デプロイ（Vercel + Neon を例に）

このアプリはどのNext.js対応ホスティングでも動きますが、無料枠で最短で公開できる組み合わせとして Vercel（アプリ本体）+ Neon（Postgres）を例に手順を示します。

1. **DBを用意する**: [Neon](https://neon.tech) でプロジェクトを作成し、接続文字列（`postgresql://...`）を控える（Vercel Postgres・Supabase・Railway 等でも同様の手順）
2. **Vercelにプロジェクトを作成**: このGitHubリポジトリをインポートする
3. **環境変数を設定**（Vercelのプロジェクト設定 → Environment Variables）
   - `DATABASE_URL` … 手順1の接続文字列
   - `SESSION_SECRET` … `openssl rand -base64 32` などで生成したランダムな文字列
   - `ANTHROPIC_API_KEY` … AIによる話題整理を有効にする場合のみ
4. **ビルドコマンドを変更**（Project Settings → Build & Development Settings → Build Command）
   - `prisma migrate deploy && next build` に変更する（初回デプロイ時にマイグレーションを本番DBへ適用するため。`package.json` の `vercel-build` スクリプトと同じ内容）
5. **デプロイ** → 初回のみ、ローカルから本番DBに向けて `npm run db:seed`（`.env` の `DATABASE_URL` を本番のものに一時的に差し替えて実行）し、テーマなどの初期データを投入する

以降の変更は、mainブランチにマージ→Vercelが自動でビルド・マイグレーション適用・デプロイまで行います。

## 今後の検討事項（未着手）

- 通報・ブロック画面のUI（APIのみ実装済み）
- 本人確認（仕様書5章：オフ会専用機能を作る場合に再検討）
- リアルタイム性の強化（現状はチャットをポーリングで取得。WebSocket化は将来の拡張）
- 独自ドメインの設定、メール送信（パスワードリセット等）、監視・エラートラッキングの導入
