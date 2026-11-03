"""Point the Edge site at its real domain.

Usage (from the Edge folder):
    python tools/set_domain.py edgequant.com

Writes sitemap.xml and the robots.txt sitemap line, and fills in canonical / og:url /
absolute og:image tags on every page. URLs drop ".html" because Cloudflare Pages serves
/about.html as a redirect to /about. Safe to run again with a new domain.
"""
import io, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = ["index.html", "app.html", "quant-interview-questions.html", "probability-interview-questions.html", "brainteaser-interview-questions.html",
          "options-interview-questions.html", "statistics-interview-questions.html", "python-coding-interview-questions.html", "mental-math-practice.html",
          "learn.html", "learn-expected-value.html", "learn-conditional-probability.html", "learn-random-walks.html", "learn-options-greeks.html",
          "learn-kelly.html", "learn-making-markets.html", "leaderboard.html", "about.html", "privacy.html", "terms.html", "login.html"]

def pretty(name):
    return "" if name == "index.html" else name[:-len(".html")]

def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python tools/set_domain.py yourdomain.com")
    domain = sys.argv[1].strip().lower().replace("https://", "").replace("http://", "").strip("/")
    if not re.fullmatch(r"[a-z0-9.-]+\.[a-z]{2,}", domain):
        sys.exit("That doesn't look like a domain name: " + domain)
    site = "https://" + domain + "/"

    for name in os.listdir(ROOT):
        if not name.endswith(".html"):
            continue
        path = os.path.join(ROOT, name)
        s = io.open(path, encoding="utf-8").read()
        page = pretty(name)
        block = ("<!-- site-url -->\n"
                 '<link rel="canonical" href="' + site + page + '">\n'
                 '<meta property="og:url" content="' + site + page + '">\n'
                 "<!-- /site-url -->")
        s = re.sub(r"<!-- site-url -->(?:.*?<!-- /site-url -->)?", lambda m: block, s, count=1, flags=re.S)
        s = re.sub(r'(<meta property="og:image" content=")(?:https://[^/"]+/)?(assets/img/og\.png")', r"\g<1>" + site + r"\2", s)
        with io.open(path, "w", encoding="utf-8", newline="") as f:
            f.write(s)

    today = datetime.date.today().isoformat()
    urls = "".join("  <url><loc>" + site + pretty(p) + "</loc><lastmod>" + today + "</lastmod></url>\n" for p in PUBLIC)
    with io.open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n")

    rp = os.path.join(ROOT, "robots.txt")
    robots = io.open(rp, encoding="utf-8").read() if os.path.exists(rp) else "User-agent: *\nAllow: /\n"
    robots = re.sub(r"\nSitemap: .*", "", robots).rstrip("\n") + "\nSitemap: " + site + "sitemap.xml\n"
    with io.open(rp, "w", encoding="utf-8", newline="\n") as f:
        f.write(robots)

    print("Done. Site now points at " + site)
    print("Next: commit and push, then make sure Supabase's Site URL and redirect list use the same domain.")

if __name__ == "__main__":
    main()
