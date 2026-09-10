# 今ヒマ(スタンドアロン版) — 公開手順

ターミナル操作なし、ブラウザの画面操作だけで公開できるようにまとめてあります。所要時間は15分くらいです。

## 1. Firebaseプロジェクトを作る(無料)

1. https://console.firebase.google.com を開き、Googleアカウントでログイン
2. 「プロジェクトを追加」→ 好きな名前(例: imahima)を入力→作成
3. 料金プランは無料の「Spark」のままでOK(クレジットカード不要)

## 2. Firestore Database を有効化する

1. 左メニューの「構築」→「Firestore Database」を開く
2. 「データベースの作成」→ ロケーションは `asia-northeast1(東京)` を選択
3. モード選択で「テストモードで開始」を選ぶ(あとで3.のルールに置き換えます)

## 3. セキュリティルールを設定する

1. Firestore画面の「ルール」タブを開く
2. 内容を下記に置き換えて「公開」

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /presence/{docId} {
      allow read: if true;
      allow write: if request.resource.data.roomCode is string
        && request.resource.data.roomCode.size() <= 8
        && request.resource.data.userId is string;
    }
    match /invites/{inviteId} {
      allow read: if true;
      allow create: if request.resource.data.roomCode is string
        && request.resource.data.roomCode.size() <= 8
        && request.resource.data.fromUserId is string
        && request.resource.data.toUserId is string;
      allow update: if request.resource.data.fromUserId == resource.data.fromUserId
        && request.resource.data.toUserId == resource.data.toUserId;
    }
  }
}
```

※ ログイン機能がないアプリなので、荒らし対策としては最低限です。友達内での利用にとどめてください。

## 4. ウェブアプリを追加してAPIキーを取得する

1. Firebaseコンソールのプロジェクト概要画面で「</>」(ウェブ)アイコンをクリック
2. アプリのニックネームを入力して「アプリを登録」
3. 表示された `firebaseConfig` の中身(apiKeyなど6項目)をコピー

## 5. コードに貼り付ける

1. このフォルダの `src/firebase.js` を開く
2. `firebaseConfig` の中身を、4.でコピーした値に置き換えて保存

## 6. StackBlitzでビルド・公開する(ターミナル不要)

1. https://stackblitz.com を開き、右上の「Create」→「Import from local folder」でこのフォルダをまるごとアップロード(またはZIPを展開してドラッグ&ドロップ)
2. 自動的に依存パッケージがインストールされ、プレビューが立ち上がります(位置情報はStackBlitzのプレビュー内では動かないことがあるので、公開後に実機で確認してください)
3. 画面上部の「Deploy」ボタン→「Deploy to Netlify」を選択
4. Netlifyのアカウント作成(Googleアカウントで数秒)→そのまま公開
5. 発行されたURL(例: `https://xxxxx.netlify.app`)が完成したアプリのリンクです

## 7. 友達に送る

発行されたURLとグループコード(アプリ内で作成)をLINEなどで送るだけで、友達はClaudeアカウントなしで開けます。ブラウザで開くだけで、位置情報の許可を求められたら「許可」を選んでもらってください。

---

## 更新したいとき

コードを直接いじりたい場合は、Visual Studio Codeなどのエディタでこのフォルダを開いて編集し、もう一度StackBlitzにアップロードし直せばOKです。慣れてきたらGitHub連携にすると、コードを直すだけで自動的に再公開されるようになります(この段階は好みで)。
