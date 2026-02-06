# シリアライザー仕様書 (v1.2)

本システムで使用する Django REST Framework シリアライザーの定義と、各フィールドの公開範囲（セキュリティ仕様）について記述します。

---

## 1. アカウント (`accounts.serializers`)

| クラス名                       | 用途                         | 含むフィールド                                                      | 特記事項                                                     |
| :----------------------------- | :--------------------------- | :------------------------------------------------------------------ | :----------------------------------------------------------- |
| **UserPublicSerializer**       | 一般公開                     | `id`, `username`, `user_type`, `profile_image`, `bio`               | **IDは公開**。個人情報なし。                                 |
| **UserPrivateSerializer**      | 詳細確認 (GET)               | 上記 + **`email`**, **`phone_number`**, **`address`**, `created_at` | **取扱注意**。本人詳細確認用。                               |
| **UserMeUpdateSerializer**     | プロフィール更新 (PUT/PATCH) | `phone_number`, `address`, `profile_image`, `bio`                   | **`user_type`, `email`, `username` は更新不可 (ReadOnly)**。 |
| **UserRegistrationSerializer** | 新規登録                     | `username`, `email`, `password`, `phone_number`, `address`          | **Email必須**。登録時 `adopter` 固定。                       |

## 2. 応募・メッセージ (`applications.serializers`)

| クラス名                                  | 用途             | 含むフィールド                                             | 特記事項                                                   |
| :---------------------------------------- | :--------------- | :--------------------------------------------------------- | :--------------------------------------------------------- |
| **ApplicationSerializer**                 | 一覧 / 一般公開  | `cat`, `status`, `motivation` 等                           | **個人情報なし**。`applicant_info` は Public。             |
| **ApplicationDetailForOwnerSerializer**   | **応募者本人用** | 上記 + 詳細属性 (`full_name`等)                            | **自分の応募を見る用**。`applicant_info` は Public。       |
| **ApplicationDetailForShelterSerializer** | **保護団体用**   | 上記 + 詳細属性                                            | **`applicant_info` が Private** (連絡先開示)。             |
| **ApplicationCreateSerializer**           | 応募作成         | `cat`, 詳細属性, `motivation`                              | `applicant` は自動設定。                                   |
| **ApplicationStatusUpdateSerializer**     | ステータス更新   | `status`                                                   | 完了状態からの変更禁止。                                   |
| **MessageSerializer**                     | メッセージ送受信 | `content`, `application_id` (write_only), `sender_info` 等 | **`application_id` 必須(POST時)**。`sender`等は ReadOnly。 |

## 3. 保護猫 (`cats.serializers`)

| クラス名                      | 用途         | 含むフィールド                                          | 特記事項                                   |
| :---------------------------- | :----------- | :------------------------------------------------------ | :----------------------------------------- |
| **CatListSerializer**         | 猫一覧       | `id`, `name`, `status`, `primary_image`, `shelter_name` | 軽量化。`shelter_name` は `Shelter.name`。 |
| **CatDetailSerializer**       | 猫詳細       | 全フィールド + `images`, `videos`                       | 全情報網羅。                               |
| **CatCreateUpdateSerializer** | 猫登録・更新 | 全フィールド                                            | `shelter` は自動設定 (ReadOnly)。          |
| **CatImage/VideoSerializer**  | メディア     | `id`, `*_url`, `caption` 等                             | **絶対URL** (`*_url`) を提供。             |

---

## 主な変更履歴とセキュリティポリシー

1. **UserMeUpdateSerializer の導入**
   プロフィール更新時に `user_type` や `email` などの重要情報が改ざんされるリスクを防ぐため、専用のシリアライザーを導入しました。

2. **ApplicationDetail の分離**
   「誰が見るか」によって応募者の個人情報（電話番号等）が含まれるかどうかが厳密に分かれています。`ForShelter` 版のみ `UserPrivateSerializer` を使用します。

3. **Message の application_id**
   メッセージ作成時は `write_only` フィールド `application_id` を使用して対象を指定し、内部で整合性を検証します。レスポンスには `application` オブジェクト（IDのみ、またはPublic情報）が含まれます。
