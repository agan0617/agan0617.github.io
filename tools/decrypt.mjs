// 私人頁面還原：encrypt.mjs 的反向。換一台電腦 clone 下來之後，用密碼把加密頁解回 _private/ 的明文原稿。
// 解出來的內容和當初加密的原稿一字不差（encrypt.mjs 是整份原樣加密）。
//
// 用法（在 repo 根目錄）：
//   SITE_PASSWORD_FILE=<存密碼的檔案> node tools/decrypt.mjs
//   或 SITE_PASSWORD=<密碼> node tools/decrypt.mjs
//   加 --force 才會覆蓋 _private/ 裡已經存在的檔（預設跳過，免得蓋掉比 repo 新的原稿）
// 要還原哪些頁照 private-pages.json：每筆把 out（密文）解回 src（明文）。
// 只能還原登記在 private-pages.json、而且加密後有 commit 的頁；沒加密進 repo 的草稿救不回來。
import { webcrypto as crypto } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const force = process.argv.includes("--force");

const pw = (process.env.SITE_PASSWORD ||
  (process.env.SITE_PASSWORD_FILE ? readFileSync(process.env.SITE_PASSWORD_FILE, "utf8") : "")).trim();
if (!pw) { console.error("缺密碼：設 SITE_PASSWORD 或 SITE_PASSWORD_FILE"); process.exit(1); }

const u8 = s => Uint8Array.from(Buffer.from(s, "base64"));

async function decrypt(P) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: u8(P.salt), iterations: P.iter, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: u8(P.iv) }, key, u8(P.ct)));
}

const list = JSON.parse(readFileSync(join(ROOT, "private-pages.json"), "utf8"));
let failed = 0;
for (const p of list) {
  const out = join(ROOT, p.out), src = join(ROOT, p.src);
  if (!existsSync(out)) { console.log(`沒有密文 ${p.out}，跳過`); failed++; continue; }
  if (existsSync(src) && !force) { console.log(`已有 ${p.src}，跳過（要覆蓋加 --force）`); continue; }
  const m = readFileSync(out, "utf8").match(/const P = (\{.*?\});/s);
  if (!m) { console.log(`${p.out} 不是 encrypt.mjs 產的加密頁，跳過`); failed++; continue; }
  let html;
  try { html = await decrypt(JSON.parse(m[1])); }
  catch { console.log(`解不開 ${p.out}（密碼不對？）`); failed++; continue; }
  mkdirSync(dirname(src), { recursive: true });
  writeFileSync(src, html);
  console.log(`還原 ${p.out} → ${p.src}`);
}
process.exit(failed ? 1 : 0);
