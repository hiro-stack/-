# API エンドポイント一覧仕様書 (v1.1)

本システム「保護猫マッチングアプリ」のAPIエンドポイント定義一覧です。
全てのAPIリクエストには、原則として `Authorization: Bearer <token>` ヘッダーが必要です（`AllowAny` のものを除く）。

## 1. 認証・アカウント (Accounts)

| メソッド  | エンドポイント                 | 説明                 | 権限          | 補足                                                    |
| :-------- | :----------------------------- | :------------------- | :------------ | :------------------------------------------------------ |
| POST      | `/api/accounts/register/`      | ユーザー新規登録     | AllowAny      | `email` 必須。登録後自動ログイントークン返却。          |
| POST      | `/api/accounts/login/`         | ログイン (Token発行) | AllowAny      | `username`, `password` 送信 → `access`/`refresh` 返却。 |
| POST      | `/api/accounts/token/refresh/` | トークンリフレッシュ | AllowAny      | `refresh` 送信 → 新しい `access` 返却。                 |
| GET       | `/api/accounts/profile/`       | プロフィール取得     | Authenticated | 自分の情報を取得 (Private情報含む)。                    |
| PUT/PATCH | `/api/accounts/profile/`       | プロフィール更新     | Authenticated | 住所・自己紹介等を更新（`user_type`, `email` は不可）。 |

## 2. 保護猫 (Cats)

| メソッド  | エンドポイント           | 説明           | 権限          | 補足                                                                    |
| :-------- | :----------------------- | :------------- | :------------ | :---------------------------------------------------------------------- |
| GET       | `/api/cats/`             | 猫一覧・検索   | AllowAny      | **未認証時はステータス 'available' 固定**。認証時は `?status=` 指定可。 |
| POST      | `/api/cats/`             | 猫登録         | ShelterMember | **所属Shelterの猫**として登録。                                         |
| GET       | `/api/cats/{id}/`        | 猫詳細         | AllowAny      | 画像・動画URLを含む詳細情報。                                           |
| PUT/PATCH | `/api/cats/{id}/`        | 猫情報更新     | ShelterMember | **自団体の猫のみ**更新可能。                                            |
| DELETE    | `/api/cats/{id}/`        | 猫削除         | ShelterMember | **自団体の猫のみ**削除可能。                                            |
| POST      | `/api/cats/{id}/images/` | 画像追加       | ShelterMember | 指定した猫 (`{id}`) に画像を追加 (Multipart)。                          |
| GET       | `/api/cats/my_cats/`     | 自団体の猫一覧 | ShelterMember | 自分が所属するShelterの全猫を表示（ステータス不問）。                   |

## 3. 応募 (Applications)

| メソッド | エンドポイント                   | 説明           | 権限          | 補足                                                     |
| :------- | :------------------------------- | :------------- | :------------ | :------------------------------------------------------- |
| GET      | `/api/applications/`             | 応募一覧       | Authenticated | 自分が「した」応募 ＋ (保護団体の場合)自団体への応募。   |
| POST     | `/api/applications/`             | 応募作成       | Authenticated | `cat` (ID) を指定して応募。                              |
| GET      | `/api/applications/{id}/`        | 応募詳細       | Authenticated | 関係者以外 **404**。権限により個人情報の開示範囲が変化。 |
| PATCH    | `/api/applications/{id}/status/` | ステータス更新 | ShelterMember | `status` のみ更新可（保護団体のみ）。                    |

## 4. メッセージ (Messages)

| メソッド | エンドポイント                    | 説明           | 権限          | 補足                                             |
| :------- | :-------------------------------- | :------------- | :------------ | :----------------------------------------------- |
| GET      | `/api/messages/?application={id}` | メッセージ一覧 | Authenticated | **`?application={id}` 必須** (なしは400エラー)。 |
| POST     | `/api/messages/`                  | メッセージ送信 | Authenticated | Bodyに `application_id` 必須。送信者は自動設定。 |

## エラーレスポンス共通仕様

| ステータス       | 原因                                                                      |
| :--------------- | :------------------------------------------------------------------------ |
| 400 Bad Request  | 入力値エラー、必須パラメータ (`application`等) 不足、バリデーション違反。 |
| 401 Unauthorized | 認証トークンが無い、または無効/期限切れ。                                 |
| 403 Forbidden    | 権限不足（例：他団体の猫を編集しようとした）。                            |
| 404 Not Found    | リソースが存在しない、またはアクセス権限がなく存在を隠蔽されている。      |
