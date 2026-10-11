import io, os, re, time
ROOT = r"C:\Users\pavan\Documents\Edge"
V = time.strftime("%Y%m%d%H%M")
pat = re.compile(r'((?:src|href)="assets/(?:[a-z]+\.js|edge\.css))(?:\?v=\d+)?"')
files = [os.path.join(ROOT, f) for f in os.listdir(ROOT) if f.endswith(".html")] + [os.path.join(ROOT, ".impeccable", "tpl", f) for f in ("head.html", "foot.html")]
n = 0
for p in files:
    s = io.open(p, encoding="utf-8").read()
    t, k = pat.subn(r'\1?v=' + V + '"', s)
    if k:
        n += k
        with io.open(p, "w", encoding="utf-8", newline="") as f: f.write(t)
print("version", V, "links stamped:", n)
