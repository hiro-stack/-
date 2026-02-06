FROM python:3.11-slim

# 作業ディレクトリの設定
WORKDIR /app

# 環境変数の設定
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# システムパッケージの更新とMySQLクライアントのインストール
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 依存関係のインストール
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# アプリケーションコードのコピー
COPY . .

# ポートの公開
EXPOSE 8000

# デフォルトコマンド
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
