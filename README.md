# SHEERHBD

しあちゃんの29歳を祝う会のための、GitHub Pages向け静的招待状ページです。

## 公開URL

https://enhiro971021.github.io/SHEERHBD/

## 構成

- `index.html` - ページ本体とOGPメタ情報
- `styles.css` - レイアウト、レスポンシブ、ビジュアルスタイル
- `script.js` - バルーンの揺れとクリック時の演出
- `assets/` - ページで使う画像素材
- `favicon.svg` - サイトアイコン

## ローカル確認

```bash
python3 -m http.server 8080
```

その後、ブラウザで `http://localhost:8080/` を開きます。

このサイトはビルド不要で、GitHub Pagesでは `main` ブランチのルートをそのまま配信します。
