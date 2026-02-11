# メイン画像が表示されない問題のデバッグ手順

## 現在の状況
- ❌ 新しい画像をアップロードしても反応がない
- ❌ 編集ページで画像が全く表示されない
- ✅ サブ画像と動画はアップロードできている（ユーザー報告）

## デバッグ手順

### 1. ブラウザの開発者ツールでエラー確認

1. **ブラウザで猫の編集ページを開く**
2. **F12キーを押して開発者ツールを開く**
3. **Consoleタブを開く**
4. **画像をアップロードしてみる**
5. **エラーメッセージが表示されるか確認**

エラーが表示される場合、その内容をコピーしてください。

### 2. ネットワークタブでAPIリクエストを確認

1. **開発者ツールのNetworkタブを開く**
2. **画像をアップロードしてみる**
3. **`/api/cats/{id}/images/` へのPOSTリクエストを探す**
4. **そのリクエストをクリックして詳細を確認**
   - Status: 200なら成功、400/500ならエラー
   - Response タブでレスポンス内容を確認

### 3. バックエンドのコンソールを確認

1. **バックエンドを起動しているターミナルを確認**
2. **画像をアップロードした時にエラーが出ていないか確認**

### 4. メディアファイルの設定を確認

バックエンドで以下のコマンドを実行：

```bash
cd backend

# 仮想環境を有効化（Windowsの場合）
.venv\Scripts\activate

# 設定を確認
python manage.py shell
```

Pythonシェルが開いたら：

```python
from django.conf import settings
print("USE_R2_STORAGE:", settings.USE_R2_STORAGE)
print("MEDIA_URL:", settings.MEDIA_URL)
print("MEDIA_ROOT:", settings.MEDIA_ROOT)
exit()
```

結果を教えてください。

### 5. 簡易テスト：既存の猫に画像があるか確認

```bash
python manage.py shell
```

```python
from cats.models import Cat, CatImage

# すべての猫を表示
cats = Cat.objects.all()
for cat in cats:
    images = cat.images.all()
    print(f"\n猫: {cat.name} (ID:{cat.id})")
    print(f"  画像数: {images.count()}")
    for img in images:
        print(f"  - is_primary={img.is_primary}, image={img.image.name if img.image else 'None'}")

exit()
```

この結果を教えてください。

## 次のステップ

上記の情報が得られたら、具体的な修正方法を提案します。
