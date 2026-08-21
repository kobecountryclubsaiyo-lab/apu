# 会話から始まるコミュニティ

「フォロワーではなく、一緒に遊ぶ仲間を。」— [docs/app-specification.md](docs/app-specification.md) の仕様をもとにした、実際に動くWebアプリの土台です。
デザインは [docs/original-prototypes/](docs/original-prototypes/) にあった4つのReactプロトタイプ（プロフィール／グループチャット／募集投稿／テーマ選択）を、実データで動くページとして実装しています。

## 技術構成

| 領域 | 選定 | 理由 |
|---|---|---|
| フレームワーク | Next.js 14 (App Router) + TypeScript | フロント・API・SSRを1つのプロジェクトで完結でき、プロトタイプのReact/Tailwindコードをほぼそのまま活かせる |
| スタイリング | Tailwind CSS | プロトタイプが最初からTailwindクラスで書かれていたため |
| DB / ORM | SQLite + Prisma | セットアップ不要でこのまま動かせる。将来 Postgres 等に切り替える場合も `prisma/schema.prisma` の `datasource` を変えるだけ |
| 認証 | 自前実装（bcryptjs + jose製JWTのCookieセッション） | 外部OAuthプロバイダを増やさず、最小構成でログイン機能を用意 |
| AIによる話題整理 | Anthropic API（`@anthropic-ai/sdk`）、未設定時はキーワード頻度によるヒューリスティックにフォールバック | `ANTHROPIC_API_KEY` の有無だけで開発中でも本番相当でも動く |

## セットアップ

```bash
npm install
cp .env.example .env   # 必要なら SESSION_SECRET / ANTHROPIC_API_KEY を編集
npx prisma migrate dev # 初回のみ（DBは prisma/dev.db に作成される）
npm run db:seed        # デモ用のテーマ・部屋・ユーザーを投入
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

## 今後の検討事項（未着手）

- 通報・ブロック画面のUI（APIのみ実装済み）
- 本人確認（仕様書5章：オフ会専用機能を作る場合に再検討）
- リアルタイム性の強化（現状はチャットをポーリングで取得。WebSocket化は将来の拡張）
- 本番デプロイ時のDB移行（SQLite → Postgres等）とセッションシークレットの管理
