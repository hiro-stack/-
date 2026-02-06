# データモデル設計仕様書

## 1. 概要

本プロジェクト（マッチングアプリ）のデータベース設計仕様です。
主なエンティティとして、ユーザー（User）、保護猫（Cat）、保護団体（Shelter）、応募（Application）が存在し、それらが相互に関連し合っています。

## 2. エンティティ詳細

### 2.1 Accounts (ユーザー管理)

#### User (カスタムユーザーモデル)

システムを利用する全てのユーザー（飼い主希望者、保護団体スタッフ、管理者）を管理します。Djangoの`AbstractUser`を継承しています。

| フィールド名    | 型       | 制約/デフォルト                                  | 説明                         |
| --------------- | -------- | ------------------------------------------------ | ---------------------------- |
| `username`      | String   | Unique                                           | ユーザーID（Django標準）     |
| `email`         | Email    | blank=True                                       | メールアドレス（Django標準） |
| `user_type`     | Choice   | `adopter`/`shelter`/`admin` (default: `adopter`) | ユーザー種別                 |
| `phone_number`  | String   | max=20                                           | 電話番号                     |
| `address`       | Text     | blank=True                                       | 住所                         |
| `profile_image` | Image    | null/blank                                       | プロフィール画像             |
| `bio`           | Text     | blank=True                                       | 自己紹介                     |
| `created_at`    | DateTime | auto_now_add                                     | 登録日時                     |
| `updated_at`    | DateTime | auto_now                                         | 更新日時                     |

---

### 2.2 Shelters (保護団体管理)

#### Shelter (保護団体)

保護活動を行う団体自体の情報を管理します。ユーザーとは独立して存在し、ユーザー（スタッフ）が紐づく形をとります。

| フィールド名          | 型       | 制約/デフォルト     | 説明                  |
| --------------------- | -------- | ------------------- | --------------------- |
| `name`                | String   | max=200             | 団体名                |
| `representative`      | String   | max=100             | 代表者名              |
| `website_url`         | URL      | blank=True          | 公式サイトURL         |
| `address`             | Text     |                     | 住所                  |
| `contact_info`        | String   | max=200             | 連絡先（電話/メール） |
| `registration_number` | String   | max=100, blank=True | 登録番号              |
| `description`         | Text     | blank=True          | 団体説明              |
| `created_at`          | DateTime | auto_now_add        | 登録日時              |
| `updated_at`          | DateTime | auto_now            | 更新日時              |

#### ShelterUser (保護団体メンバー)

保護団体(`Shelter`)とユーザー(`User`)の中間テーブルです。1人のユーザーが複数の団体に所属することや、1つの団体に複数のスタッフがいることを表現可能です。

| フィールド名 | 型       | 関連                                           | 説明                                 |
| ------------ | -------- | ---------------------------------------------- | ------------------------------------ |
| `shelter`    | FK       | `Shelter`                                      | 所属する保護団体                     |
| `user`       | FK       | `User`                                         | 所属ユーザー                         |
| `role`       | Choice   | `admin`/`staff`/`volunteer` (default: `staff`) | 役割（管理者/スタッフ/ボランティア） |
| `is_active`  | Bool     | default=True                                   | 有効状態                             |
| `joined_at`  | DateTime | auto_now_add                                   | 参加日時                             |

- **制約**: `shelter` と `user` の組み合わせはユニーク（同一人物が同じ団体に二重登録できない）。

---

### 2.3 Cats (保護猫管理)

#### Cat (保護猫)

募集対象となる保護猫の基本情報です。

| フィールド名    | 型       | 関連/制約                                     | 説明                 |
| --------------- | -------- | --------------------------------------------- | -------------------- |
| `shelter`       | FK       | `Shelter`                                     | 管理している保護団体 |
| `name`          | String   | max=100                                       | 名前                 |
| `gender`        | Choice   | `male`/`female`/`unknown`                     | 性別                 |
| `age_years`     | Int      | default=0                                     | 年齢（年）           |
| `age_months`    | Int      | default=0 (0-11)                              | 年齢（月）           |
| `breed`         | String   | max=100, blank=True                           | 品種                 |
| `size`          | Choice   | `small`/`medium`/`large`                      | 体格                 |
| `color`         | String   | max=100, blank=True                           | 毛色                 |
| `personality`   | Text     |                                               | 性格                 |
| `health_status` | Text     |                                               | 健康状態             |
| `vaccination`   | Bool     | default=False                                 | ワクチン接種済みか   |
| `neutered`      | Bool     | default=False                                 | 去勢・避妊済みか     |
| `description`   | Text     |                                               | 自由記述の説明文     |
| `status`        | Choice   | `open`/`paused`/`in_review`/`trial`/`adopted` | 募集ステータス       |
| `created_at`    | DateTime | auto_now_add                                  | 登録日時             |
| `updated_at`    | DateTime | auto_now                                      | 更新日時             |

#### CatImage (保護猫画像)

保護猫の画像ギャラリーです。

| フィールド名 | 型     | 関連/制約           | 説明             |
| ------------ | ------ | ------------------- | ---------------- |
| `cat`        | FK     | `Cat`               | 対象の保護猫     |
| `image`      | Image  | `cats/`             | 画像ファイル     |
| `is_primary` | Bool   | default=False       | メイン画像フラグ |
| `sort_order` | Int    | default=0           | 表示順序         |
| `caption`    | String | max=200, blank=True | キャプション     |

- **ロジック**: `is_primary=True` 保存時、同一猫の他の画像の `is_primary` を自動的に False に更新（トランザクション制御）。

#### CatVideo (保護猫動画)

保護猫の動画ギャラリーです。

| フィールド名 | 型     | 関連/制約           | 説明         |
| ------------ | ------ | ------------------- | ------------ |
| `cat`        | FK     | `Cat`               | 対象の保護猫 |
| `video`      | File   | `cats/videos/`      | 動画ファイル |
| `sort_order` | Int    | default=0           | 表示順序     |
| `caption`    | String | max=200, blank=True | キャプション |

---

### 2.4 Applications (応募・メッセージ)

#### Application (応募)

ユーザーが保護猫に対して行う応募情報（エントリーシート）です。

| フィールド名             | 型       | 関連/制約                                               | 説明                         |
| ------------------------ | -------- | ------------------------------------------------------- | ---------------------------- |
| `cat`                    | FK       | `Cat`                                                   | 応募対象の保護猫             |
| `applicant`              | FK       | `User`                                                  | 応募者                       |
| `shelter`                | FK       | `Shelter`                                               | 担当保護団体（冗長保持）     |
| `status`                 | Choice   | `pending`/`reviewing`/`accepted`/`rejected`/`cancelled` | 進行ステータス               |
| `message`                | Text     | blank=True                                              | 初回メッセージ（動機など）   |
| `full_name`              | String   | max=100                                                 | （以下、応募時入力情報）氏名 |
| `age`                    | Int      | max=120                                                 | 年齢                         |
| `occupation`             | String   | max=100                                                 | 職業                         |
| `phone_number`           | String   | max=20                                                  | 電話番号                     |
| `address`                | Text     |                                                         | 住所                         |
| `housing_type`           | String   | max=100                                                 | 住居タイプ                   |
| `has_garden`             | Bool     |                                                         | 庭の有無                     |
| `family_members`         | Int      | max=20                                                  | 家族人数                     |
| `has_other_pets`         | Bool     |                                                         | 先住ペット有無               |
| `other_pets_description` | Text     | blank=True                                              | 先住ペット詳細               |
| `has_experience`         | Bool     |                                                         | 飼育経験有無                 |
| `experience_description` | Text     | blank=True                                              | 飼育経験詳細                 |
| `motivation`             | Text     |                                                         | 応募動機                     |
| `additional_notes`       | Text     | blank=True                                              | 備考                         |
| `applied_at`             | DateTime | auto_now_add                                            | 応募日時                     |
| `updated_at`             | DateTime | auto_now                                                | 更新日時                     |

- **制約**: `cat` と `applicant` の組み合わせにおいて、進行中ステータス（pending, reviewing, accepted）の応募は1つしか存在できない。過去にrejected/cancelledされた場合は再応募可能。
- **ロジック**: 保存時に `cat` から `shelter` を自動設定。

#### ApplicationEvent (応募イベントログ)

応募ごとのステータス変更履歴やメモを記録します。

| フィールド名  | 型       | 関連                              | 説明                             |
| ------------- | -------- | --------------------------------- | -------------------------------- |
| `application` | FK       | `Application`                     | 対象の応募                       |
| `event_type`  | Choice   | `status_changed`/`note`/`system`  | イベント種類                     |
| `from_status` | Choice   |                                   | 変更前ステータス                 |
| `to_status`   | Choice   |                                   | 変更後ステータス                 |
| `actor_type`  | Choice   | `user`/`shelter`/`admin`/`system` | 実行者種別                       |
| `actor`       | FK       | `User`                            | 実行ユーザー（システムならNull） |
| `note`        | Text     | blank=True                        | メモ内容                         |
| `created_at`  | DateTime | auto_now_add                      | 発生日時                         |

#### Message (メッセージ)

応募に関連して、応募者と保護団体間で行われるチャットメッセージです。

| フィールド名  | 型       | 関連                     | 説明                     |
| ------------- | -------- | ------------------------ | ------------------------ |
| `application` | FK       | `Application`            | 対象の応募               |
| `sender`      | FK       | `User`                   | 送信者                   |
| `sender_type` | Choice   | `user`/`shelter`/`admin` | 送信者の立場             |
| `content`     | Text     |                          | メッセージ本文           |
| `created_at`  | DateTime | auto_now_add             | 送信日時                 |
| `read_at`     | DateTime | null/blank               | 既読日時（Nullなら未読） |

- **ロジック**: `sender_type` が実際の `sender.user_type` と矛盾しないかバリデーションを実施。
