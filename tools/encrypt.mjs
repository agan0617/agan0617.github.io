// 私人頁面加密：把 _private/ 裡的明文網頁用密碼加密成可以公開放的網頁。
// 瀏覽器打開後要輸入密碼，用 WebCrypto 在本機解密顯示；repo 裡只有密文，明文從不進版控。
//
// 用法（在 repo 根目錄）：
//   SITE_PASSWORD_FILE=<存密碼的檔案> node tools/encrypt.mjs
//   或 SITE_PASSWORD=<密碼> node tools/encrypt.mjs
// 要加密哪些頁寫在 private-pages.json：[{ "src": "_private/x.html", "out": "x/index.html", "title": "標題" }]
//
// 加密：PBKDF2-SHA256（600,000 次）導出 AES-GCM-256 金鑰，每頁隨機 salt 與 iv。
import { webcrypto as crypto } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ITER = 600000;

const pw = (process.env.SITE_PASSWORD ||
  (process.env.SITE_PASSWORD_FILE ? readFileSync(process.env.SITE_PASSWORD_FILE, "utf8") : "")).trim();
if (!pw) { console.error("缺密碼：設 SITE_PASSWORD 或 SITE_PASSWORD_FILE"); process.exit(1); }

const b64 = buf => Buffer.from(buf).toString("base64");

async function encrypt(text) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
  return { salt: b64(salt), iv: b64(iv), ct: b64(ct), iter: ITER };
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function page(title, payload) {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}（私人頁面）</title>
<style>
  :root { --bg:#f3f1ec; --card:#fff; --text:#1d2126; --muted:#646a72; --line:#e2ded6; --accent:#2d5a8e; --err:#b0372b; }
  @media (prefers-color-scheme: dark) { :root { --bg:#111417; --card:#1a1e22; --text:#e7e7e4; --muted:#9aa1a8; --line:#2a2f35; --accent:#8ab4e8; --err:#f07a6c; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:var(--bg); color:var(--text);
         font-family:-apple-system,"Segoe UI","Noto Sans TC","Microsoft JhengHei",sans-serif; padding:16px; }
  form { width:100%; max-width:360px; background:var(--card); border:1px solid var(--line); border-radius:16px; padding:24px; }
  h1 { font-size:20px; margin:0 0 4px; }
  p { color:var(--muted); font-size:14px; margin:0 0 16px; }
  input[type=password] { width:100%; font:inherit; font-size:18px; padding:10px 12px; border:1px solid var(--line); border-radius:10px;
                         background:var(--bg); color:var(--text); letter-spacing:.1em; }
  label.rm { display:flex; gap:8px; align-items:center; font-size:14px; color:var(--muted); margin:12px 0; }
  button { width:100%; font:inherit; font-size:16px; padding:10px; border:0; border-radius:10px; background:var(--accent); color:var(--card); cursor:pointer; }
  .err { color:var(--err); font-size:14px; min-height:20px; margin-top:10px; }
  a { color:var(--accent); font-size:14px; }
</style>
</head>
<body>
<form id="f">
  <h1>🔒 ${esc(title)}</h1>
  <p>這是私人頁面，請輸入密碼。</p>
  <input type="password" id="pw" autocomplete="current-password" inputmode="numeric" autofocus aria-label="密碼">
  <label class="rm"><input type="checkbox" id="rm"> 記住這台裝置</label>
  <button type="submit" id="go">打開</button>
  <div class="err" id="err" role="alert"></div>
  <a href="../">← 回首頁</a>
</form>
<script>
const P = ${JSON.stringify(payload)};
const KEY = "privpw";
const u8 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function open(pw) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: u8(P.salt), iterations: P.iter, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const html = new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: u8(P.iv) }, key, u8(P.ct)));
  document.open(); document.write(html); document.close();
}
const get = k => { try { return localStorage.getItem(k) || sessionStorage.getItem(k); } catch (e) { return null; } };
const f = document.getElementById("f"), err = document.getElementById("err"), go = document.getElementById("go");
f.addEventListener("submit", async e => {
  e.preventDefault();
  const pw = document.getElementById("pw").value;
  const remember = document.getElementById("rm").checked;   // 解密後整頁會換掉，要先讀
  go.disabled = true; go.textContent = "解密中…"; err.textContent = "";
  try {
    await open(pw);
    try { (remember ? localStorage : sessionStorage).setItem(KEY, pw); } catch (e) {}
  } catch (x) {
    err.textContent = "密碼不對，再試一次。"; go.disabled = false; go.textContent = "打開";
  }
});
// 這台裝置記過密碼（或同一個分頁階段輸入過）就直接打開
const saved = get(KEY);
if (saved) open(saved).catch(() => { try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (e) {} });
</script>
</body>
</html>
`;
}

const list = JSON.parse(readFileSync(join(ROOT, "private-pages.json"), "utf8"));
for (const p of list) {
  const src = readFileSync(join(ROOT, p.src), "utf8");
  const out = join(ROOT, p.out);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page(p.title, await encrypt(src)));
  console.log(`加密 ${p.src} → ${p.out}`);
}
