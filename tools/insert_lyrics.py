"""把 Ken 提供的歌詞檔原樣塞進私人歌曲頁的 LYRICS 區塊（HTML 跳脫），只印行數，不印內容。"""
import html, re, sys
src, page = sys.argv[1], sys.argv[2]
raw = open(src, 'rb').read()
for enc in ('utf-8-sig', 'utf-16', 'cp950'):
    try:
        text = raw.decode(enc); break
    except UnicodeDecodeError:
        continue
text = text.replace('\r\n', '\n').strip('\n')
if '<' in text and re.search(r'<\s*(script|iframe|img|a)\b', text, re.I):
    sys.exit('歌詞檔含 HTML 標籤，不處理')
s = open(page, encoding='utf-8').read()
new, n = re.subn(r'<!-- LYRICS START -->.*?<!-- LYRICS END -->',
                 lambda m: '<!-- LYRICS START -->' + html.escape(text) + '<!-- LYRICS END -->', s, flags=re.S)
assert n == 1
open(page, 'w', encoding='utf-8').write(new)
print('inserted lines:', text.count('\n') + 1, 'chars:', len(text))
