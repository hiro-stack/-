# モデル変更の詳細ドキュメント

## 概要

団体・カフェ向けの機能を強化するため、`Shelter`（団体）モデルと `Cat`（保護猫）モデルに大幅なフィールド追加と構造変更を行いました。

## 1. Shelter（保護団体・カフェ）モデルの変更

`backend/shelters/models.py`

### 新規追加フィールド

| フィールド名               | 型           | 説明                                                     |
| :------------------------- | :----------- | :------------------------------------------------------- |
| `shelter_type`             | CharField    | 団体種別（現在は 'cafe' 固定）                           |
| `prefecture`               | CharField    | 都道府県（検索・フィルタ用）                             |
| `city`                     | CharField    | 市区町村                                                 |
| `sns_url`                  | URLField     | SNSのURL（Instagram推奨）                                |
| `business_hours`           | TextField    | 営業日・営業時間・定休日                                 |
| `transfer_available_hours` | TextField    | 譲渡対応可能な時間帯                                     |
| `verification_status`      | CharField    | 審査ステータス（pending, verified, rejected, suspended） |
| `contact_verified`         | BooleanField | 連絡先確認済みフラグ                                     |

### 変更・継続フィールド

| フィールド名          | 変更点                                        |
| :-------------------- | :-------------------------------------------- |
| `name`                | 名称変更：「団体名」→「カフェ名（団体名）」   |
| `address`             | 名称変更：「住所」→「店舗住所」               |
| `representative`      | **任意入力に変更**（blank=True）              |
| `registration_number` | 名称変更：「登録番号」→「動物取扱業登録番号」 |

---

## 2. Cat（保護猫）モデルの変更

`backend/cats/models.py`

### 新規追加・詳細化フィールド

#### 基本情報

| フィールド名    | 型        | 説明                                      |
| :-------------- | :-------- | :---------------------------------------- |
| `age_category`  | CharField | 年齢区分（子猫, 成猫, シニア猫, 不明）    |
| `estimated_age` | CharField | 推定年齢（文字列入力。「2歳くらい」など） |

#### 医療情報（詳細化）

| フィールド名             | 型        | 説明                                                          |
| :----------------------- | :-------- | :------------------------------------------------------------ |
| `spay_neuter_status`     | CharField | 不妊去勢状況（未, 済, 予定, 不明）                            |
| `vaccination_status`     | CharField | ワクチン接種状況（未, 一部, 済, 不明）                        |
| `health_status_category` | CharField | 健康状態区分（問題なし, ケアあり, 継続治療, 不明）            |
| `fiv_felv_status`        | CharField | ウイルス検査（陰性, FIV陽性, FeLV陽性, ダブル, 未検査, 不明） |
| `health_notes`           | TextField | 健康状態詳細（旧 health_status の移行先）                     |

#### 性格・特徴

| フィールド名     | 型        | 説明                                         |
| :--------------- | :-------- | :------------------------------------------- |
| `human_distance` | CharField | 人への距離感・抱っこ（好き, 可, 苦手, 不明） |
| `activity_level` | CharField | 活発さ（活発, 普通, おっとり, 不明）         |

#### 譲渡条件

| フィールド名       | 型           | 説明                                 |
| :----------------- | :----------- | :----------------------------------- |
| `interview_format` | CharField    | 面談形式（オンライン, 対面, 両方可） |
| `trial_period`     | CharField    | トライアル期間（「2週間」など）      |
| `transfer_fee`     | IntegerField | 譲渡費用                             |
| `fee_details`      | TextField    | 費用に含まれる内容                   |

### 既存フィールドの扱い

- `age_years`, `age_months`: 数値管理用に残すが、入力は任意（null=True）に変更。
- `neutered`, `vaccination`: 旧booleanフィールドは移行用として残すが、今後は `*_status` フィールドを使用。
- `health_status`: 廃止予定（`health_notes` へ移行）。

---

## 今後の対応手順（マイグレーション）

データベースへの適用時に、多数のフィールドで「既存データへのデフォルト値」を求められます。
自動入力では対応しきれないため、以下の手順で進める必要があります。

1.  **`makemigrations` の再実行**: 非対話モードでデフォルト値を指定しながら作成するか、モデル定義で一時的に `default` 値を設定して回避する。
2.  **データ移行（必要な場合）**: 旧フィールド（neuteredなど）から新フィールド（spay_neuter_statusなど）へのデータコピーを行うデータマイグレーションスクリプトを作成する。
