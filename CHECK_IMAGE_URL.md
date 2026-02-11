# 画像URL確認手順

## 1. ブラウザで画像URLを確認

1. **F12キーで開発者ツールを開く**
2. **Elements タブ（要素タブ）を選択**
3. **壊れた画像の上で右クリック → 「検証」**
4. **`<img src="...">` タグを見つける**
5. **src属性のURLをコピー**

例：
```html
<img src="http://localhost:8000/media/cats/xxxxx.jpg" alt="aaa">
```

そのURLをブラウザのアドレスバーに直接貼り付けて開いてみてください。

## 2. 予想される問題と解決策

### ケース1: URLが `http://localhost:8000/media/cats/...` の形式
→ Djangoがメディアファイルを配信する必要があります

### ケース2: URLが相対パス `/media/cats/...`
→ フロントエンドが正しいベースURLを使っていません

### ケース3: 404エラー（ファイルが見つからない）
→ 画像がアップロードされていません

### ケース4: URLが `/cats/xxxxx.jpg`（/media がない）
→ `image.url` が正しく生成されていません

## 3. APIレスポンスを確認

開発者ツールの **Network タブ** を開いて：

1. **`/api/cats/my_cats/` へのリクエストを探す**
2. **クリックして Response タブを見る**
3. **`primary_image` フィールドの値を確認**

期待される値：
```json
{
  "id": 1,
  "name": "aaa",
  "primary_image": "http://localhost:8000/media/cats/xxxxx.jpg"
}
```

もし `primary_image` が `null` なら、画像がアップロードされていません。
