FROM node:20-alpine

# 作業ディレクトリの設定
WORKDIR /app

# package.jsonとpackage-lock.jsonのコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# アプリケーションコードのコピー
COPY . .

# ポートの公開
EXPOSE 3000

# 開発サーバーの起動
CMD ["npm", "run", "dev"]
