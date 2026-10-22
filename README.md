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
2. 在 `private-pages.json` 加一筆 `{ "src": "_private/x.html", "out": "x/index.html" }`（不寫標題：這個檔是公開的）
3. 執行 `SITE_PASSWORD_FILE=<密碼檔> node tools/encrypt.mjs`，產生加密後的 `x/index.html`（只有密文與輸入密碼的畫面，畫面一律只寫「私人頁面」，各頁真正的標題在密文裡）
4. 首頁 `PAGES` 那筆加 `private: true`（卡片會顯示 🔒）
5. commit、push

打開時在瀏覽器輸入密碼，用 WebCrypto（PBKDF2-SHA256 60 萬次＋AES-GCM）在本機解密；勾「記住這台裝置」會把密碼存在該瀏覽器。改了原稿要重新執行第 3 步。

`encrypt.mjs` 每次都會把清單裡的每一頁重新加密（隨機 salt，內容沒變密文也會變），只 commit 有改的頁，其他用 `git checkout -- <路徑>` 還原。

### 換電腦：從 repo 還原明文原稿

`_private/` 不在 repo 裡，但加密頁就是原稿整份加密的結果，有密碼就能解回來：

```
SITE_PASSWORD_FILE=<密碼檔> node tools/decrypt.mjs
```

照 `private-pages.json` 把每個 `out` 解回 `src`，內容和原稿一字不差。`_private/` 已有的檔預設跳過，要覆蓋加 `--force`；密碼錯了會報「解不開」，不會寫任何檔。

救不回來的：沒登記在 `private-pages.json` 的檔、改了原稿但還沒加密 commit 的部分，以及密碼本身——密碼弄丟，密文就解不開。

⚠️ 這是擋一般人的鎖，不是保險箱：密文是公開的，任何人都能下載回去離線猜密碼，所以**密碼要 12 字以上、英數混合**（純數字幾小時就能被顯卡試完）。換密碼只保護之後推上去的密文，舊密文仍留在 git 歷史裡。網址路徑（如 `guides/xxx/`）也是公開的，命名時別洩漏內容。別放真正機密的東西。

## 目前的網頁

| 網頁 | 網址 | 來源 |
|---|---|---|
| K書吧 | https://agan0617.github.io/KBookBar/ | repo `KBookBar` |
| 貓貓好煩（AnnoyingCats） | https://agan0617.github.io/AnnoyingCats/ | repo `AnnoyingCats` |

## 版權

Copyright © 2026 agan0617. All rights reserved. 保留所有權利，詳見 [LICENSE](LICENSE)。

攻略、歌詞等頁面引用的外部資料，出處標在各頁內；遊戲與歌曲的名稱、內容版權屬原權利人。
