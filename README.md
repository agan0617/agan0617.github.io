# agan0617.github.io

個人靜態網頁的總站，首頁 https://agan0617.github.io/ 是所有網頁的連結清單。

## 新增一個網頁

1. **放在這個 repo**：建一個子資料夾（例如 `snake/`），把網頁的 `index.html` 等檔案放進去，網址就是 `https://agan0617.github.io/snake/`
2. **在首頁加連結**：`index.html` 裡的 `PAGES` 清單加一筆 `{ icon, name, desc, url, tag, en: { desc, tag } }`；`url` 用子資料夾就寫 `"snake/"`，`en` 是英文版要換掉的欄位（首頁有中／EN 切換）
3. commit、push，GitHub Pages 約一分鐘後更新

已經有自己 repo 的網頁（K書吧 `KBookBar`、`AnnoyingCats`）只在首頁放連結、不搬進來：它們的網址是 `agan0617.github.io/<repo 名>/`，由各自的 repo 提供；這裡若建同名資料夾會被那個 repo 蓋過。

## 私人頁面（要密碼）

GitHub Pages 只能放公開檔案，所以私人頁面是**加密後才上傳**：

1. 明文原稿放 `_private/`（已在 `.gitignore`，**不會進 repo**，只存在本機）
2. 在 `private-pages.json` 加一筆 `{ "src": "_private/x.html", "out": "x/index.html", "title": "標題" }`
3. 執行 `SITE_PASSWORD_FILE=<密碼檔> node tools/encrypt.mjs`，產生加密後的 `x/index.html`（只有密文與輸入密碼的畫面）
4. 首頁 `PAGES` 那筆加 `private: true`（卡片會顯示 🔒）
5. commit、push

打開時在瀏覽器輸入密碼，用 WebCrypto（PBKDF2-SHA256 60 萬次＋AES-GCM）在本機解密；勾「記住這台裝置」會把密碼存在該瀏覽器。改了原稿要重新執行第 3 步。

⚠️ 這是擋一般人的鎖，不是保險箱：密文是公開的，密碼太短就可能被離線暴力破解，別放真正機密的東西。

## 目前的網頁

| 網頁 | 網址 | 來源 |
|---|---|---|
| K書吧 | https://agan0617.github.io/KBookBar/ | repo `KBookBar` |
| 貓貓好煩（AnnoyingCats） | https://agan0617.github.io/AnnoyingCats/ | repo `AnnoyingCats` |
