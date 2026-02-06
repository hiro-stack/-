# ビュー（Views）更新レポート & 仕様書（v1.3）

本レポートでは、データモデルの変更（`Shelter` モデルの導入）およびセキュリティ要件（個人情報保護・権限管理・データ整合性）に基づき、最適化・堅牢化された Django REST Framework ビュー層の改修内容と最新仕様を記述します。

---

## 変更レポート

### 1. `cats/views.py` の改修（モデル整合性・セキュリティ）

- **ShelterUserベースの権限管理**:
  - `User` と `Shelter` を直接比較していたバグ（型不一致）を解消。
  - `IsShelterMemberOrReadOnly` パーミッションを実装し、`ShelterUser` テーブル経由で「リクエストユーザーがその猫の保護団体に所属しているか」を判定。
  - 作成時 (`perform_create`) に、ユーザーの所属する有効な `Shelter` を自動的にセット。
- **情報漏洩防止**:
  - `CatListCreateView` の検索フィルターにおいて、**未認証ユーザー（Public）には `status` パラメータを無視し、強制的に `'available'`（募集中）のみ**を返却するように変更。
  - 画像アップロード時の権限エラーを例外 (`PermissionDenied`) に統一。

### 2. `applications/views.py` の改修（権限詳細化・堅牢化）

- **Serializer動的切替 & 到達不能性の明記**:
  - 応募詳細 (`retrieve`) リクエストに対し、応募者本人には「詳細版」、保護団体には「連絡先開示版」、それ以外には「404 Not Found」を返すロジックを確立。
- **Message作成・一覧の制限**:
  - メッセージ取得時 (`GET`) に **`application` パラメータを必須化**（未指定時は `400 Bad Request`）。全件流出リスクをシステム的に排除。
  - `perform_create` 内で `sender`（ログインユーザー）と `sender_type`（Admin > Shelter > User の優先順位で自動判定）を強制的に固定し、なりすましを防止。
- **冗長フィールドの活用**:
  - 検索クエリや作成時の `Application.shelter` セットに冗長カラムを活用し、パフォーマンスとデータ整合性を向上。

### 3. `accounts/views.py` の改修（PII保護・改ざん防止）

- **UserPrivateSerializer / UserMeUpdateSerializer の導入**:
  - プロフィール更新時 (`PUT/PATCH`) は、更新可能フィールドを限定した **`UserMeUpdateSerializer`** を使用。`user_type` や `email` などの重要フィールドがAPI経由で改ざんされるリスクを完全に排除。

---

## ビュー仕様書 (Latest)

### 1. アカウント管理 (`accounts.views`)

| クラス名                 | エンドポイント            | メソッド  | 権限          | 主な処理内容・注意点                                                             |
| :----------------------- | :------------------------ | :-------- | :------------ | :------------------------------------------------------------------------------- |
| **UserRegistrationView** | `/api/accounts/register/` | POST      | AllowAny      | 完了時に `tokens` と `user` (Private) を返却。`email` 必須。                     |
| **UserProfileView**      | `/api/accounts/profile/`  | GET       | Authenticated | 自分の詳細情報取得。`UserPrivateSerializer` 使用。                               |
|                          |                           | PUT/PATCH | Authenticated | プロフィール更新。**`UserMeUpdateSerializer` 使用**（`user_type`等は変更不可）。 |

### 2. 保護猫管理 (`cats.views`)

| クラス名               | エンドポイント           | メソッド  | 権限 (Read/Write) | 主な処理内容・注意点                                           |
| :--------------------- | :----------------------- | :-------- | :---------------- | :------------------------------------------------------------- |
| **CatListCreateView**  | `/api/cats/`             | GET       | **AllowAny**      | 未認証時は **`status=available` 固定**。認証時は指定可。       |
|                        |                          | POST      | **ShelterMember** | 猫登録。ユーザーの所属Shelterを自動設定。未所属なら400エラー。 |
| **CatDetailView**      | `/api/cats/{id}/`        | GET       | **AllowAny**      | 詳細取得。                                                     |
|                        |                          | PUT/PATCH | **ShelterMember** | 自団体の猫のみ更新可。                                         |
| **CatImageUploadView** | `/api/cats/{id}/images/` | POST      | **ShelterMember** | 猫への画像追加。自団体以外は403 PermissionDenied。             |
| **MyCatsView**         | `/api/cats/my_cats/`     | GET       | **ShelterMember** | 所属するShelterの猫一覧（ステータス不問）。                    |

### 3. 応募・メッセージ管理 (`applications.views`)

| クラス名               | エンドポイント                   | メソッド | 権限          | 主な処理内容・注意点                                                 |
| :--------------------- | :------------------------------- | :------- | :------------ | :------------------------------------------------------------------- |
| **ApplicationViewSet** | `/api/applications/`             | GET      | Authenticated | **自分**の応募 + (**保護団体なら**)自団体への応募を表示。            |
|                        |                                  | POST     | Authenticated | 応募作成。`applicant`, `shelter` は自動設定。                        |
|                        | `/api/applications/{id}/`        | GET      | Authenticated | 詳細取得。**関係者以外は 404**。権限により個人情報の開示範囲が変化。 |
|                        | `/api/applications/{id}/status/` | PATCH    | ShelterMember | **`update_status` アクション**。保護団体のみ実行可。                 |
| **MessageViewSet**     | `/api/messages/`                 | GET      | Authenticated | `?application={id}` で取得。**必須**。                               |
|                        |                                  | POST     | Authenticated | 送信。**`application_id` (body/int) 必須**。`sender`等は自動設定。   |

---

## フロントエンド実装時の重要事項

1. **メッセージ取得**
   - パラメータなしで `/api/messages/` を叩くと `400 Bad Request` になります。必ず `?application={id}` を付けてください。

2. **プロフィール更新**
   - ユーザータイプやメールアドレスの変更は `/api/accounts/profile/` では行えません（無視されます）。

3. **保護猫一覧 (Public)**
   - 未ログイン状態で `/api/cats/?status=draft` 等を指定しても無視され、募集中 (`available`) の猫のみが返ります。
