# 保護猫マッチングシステム - セットアップガイド

##公開しているURL
https://cat-maching.vercel.app/

## 🚀 クイックスタート

### 1. 前提条件

- Docker Desktop がインストールされていること
- Git がインストールされていること

### 2. プロジェクトのセットアップ

```bash
# プロジェクトディレクトリに移動
cd マッチングアプリ

# Docker環境の起動
docker compose up --build
```

### 3. アクセス

起動後、以下のURLにアクセスできます：

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/api/docs/
- **管理画面**: http://localhost:8000/admin/

### 4. 初回セットアップ

初回起動時に、管理者ユーザーを作成します：

```bash
# バックエンドコンテナに入る
docker compose exec backend bash

# 管理者ユーザーの作成
python manage.py createsuperuser

# 指示に従ってユーザー名、メール、パスワードを入力
```

## 📁 プロジェクト構造

```
マッチングアプリ/
├── backend/              # Django バックエンド
│   ├── config/          # Django設定
│   ├── accounts/        # ユーザー管理
│   ├── cats/            # 保護猫管理
│   └── applications/    # 応募管理
├── frontend/            # Next.js フロントエンド
│   └── src/
│       ├── app/         # ページ
│       ├── contexts/    # React Context
│       └── lib/         # ユーティリティ
└── docker-compose.yml   # Docker設定
```

## 🎯 主要機能

### 飼い主希望者

- ✅ ユーザー登録・ログイン
- ✅ 猫一覧の閲覧
- ✅ 猫の詳細ページ
- ✅ 応募フォーム

### 保護団体

- ✅ ログイン
- ✅ 猫の登録・管理
- ✅ 応募一覧の確認
- ✅ メッセージ機能

### 管理者

- ✅ 管理画面でのデータ管理
- ✅ ユーザー管理
- ✅ 猫データ管理

## 🛠️ 開発コマンド

### Docker操作

```bash
# コンテナの起動
docker compose up

# バックグラウンドで起動
docker compose up -d

# コンテナの停止
docker compose down

# ログの確認
docker compose logs -f

# 特定のサービスのログ
docker compose logs -f backend
docker compose logs -f frontend
```

### Django操作

```bash
# マイグレーションの作成
docker compose exec backend python manage.py makemigrations

# マイグレーションの適用
docker compose exec backend python manage.py migrate

# 管理者ユーザーの作成
docker compose exec backend python manage.py createsuperuser

# Djangoシェル
docker compose exec backend python manage.py shell
```

## 🔧 トラブルシューティング

### ポートが使用中の場合

```bash
# 使用中のポートを確認
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# プロセスを終了（管理者権限が必要）
taskkill /PID <プロセスID> /F
```

### データベース接続エラー

```bash
# コンテナを完全に削除して再起動
docker compose down -v
docker compose up --build
```

### フロントエンドのビルドエラー

```bash
# node_modulesを削除して再インストール
docker compose exec frontend rm -rf node_modules
docker compose exec frontend npm install
```

## 📝 API エンドポイント

### 認証

- `POST /api/accounts/register/` - ユーザー登録
- `POST /api/accounts/login/` - ログイン
- `GET /api/accounts/profile/` - プロフィール取得

### 保護猫

- `GET /api/cats/` - 猫一覧
- `POST /api/cats/` - 猫登録（保護団体のみ）
- `GET /api/cats/{id}/` - 猫詳細
- `PUT /api/cats/{id}/` - 猫更新（保護団体のみ）

### 応募

- `POST /api/applications/` - 応募作成
- `GET /api/applications/my-applications/` - 自分の応募一覧
- `GET /api/applications/received/` - 受け取った応募（保護団体）

詳細は http://localhost:8000/api/docs/ を参照

## 🚢 デプロイ

### Vercel（フロントエンド）

1. Vercelアカウントを作成
2. GitHubリポジトリを接続
3. `frontend`ディレクトリをルートに設定
4. 環境変数を設定

### Heroku（バックエンド）

1. Herokuアカウントを作成
2. Herokuアプリを作成（Heroku Postgresアドオンを追加）
3. GitHubリポジトリを接続、またはHeroku CLIでデプロイ
4. 環境変数を設定（Procfileを使用）

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。
