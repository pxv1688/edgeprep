import io, os, json
ROOT = r"C:\Users\pavan\Documents\Edge"
def rd(p): return io.open(os.path.join(ROOT, p), encoding="utf-8").read()
def wr(p, s):
    with io.open(os.path.join(ROOT, p), "w", encoding="utf-8", newline="") as f: f.write(s)

CSP_META = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://cdn.jsdelivr.net https://gc.zgo.at; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src \'self\' data: https://*.goatcounter.com; connect-src \'self\' https://*.supabase.co wss://*.supabase.co https://*.goatcounter.com https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com; worker-src \'self\'; manifest-src \'self\'; object-src \'none\'; base-uri \'self\'; form-action \'self\'">\n<meta name="referrer" content="strict-origin-when-cross-origin">\n'
def head_meta(title, desc, noindex=False):
    return (
        CSP_META +
        '<meta name="description" content="' + desc + '">\n'
        + ('<meta name="robots" content="noindex">\n' if noindex else "")
        + '<link rel="icon" href="favicon.svg" type="image/svg+xml">\n'
        '<link rel="icon" href="assets/img/favicon-32.png" sizes="32x32" type="image/png">\n'
        '<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">\n'
        '<link rel="manifest" href="manifest.webmanifest">\n'
        '<meta name="theme-color" content="#1E3FA8">\n'
        '<meta property="og:type" content="website">\n'
        '<meta property="og:site_name" content="Edge">\n'
        '<meta property="og:title" content="' + title + '">\n'
        '<meta property="og:description" content="' + desc + '">\n'
        '<meta property="og:image" content="assets/img/og.png">\n'
        '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n'
        '<meta name="twitter:card" content="summary_large_image">\n'
        '<!-- site-url -->\n'
    )

LAND_DESC = "Daily quant interview practice as games: 3,000+ problems in probability, brainteasers, options, statistics, code and mental math. Free."
# landing
s = rd("index.html")
s = s.replace('<meta name="description" content="Daily quant interview practice as games: thousands of problems in probability, brainteasers, options, statistics, code and mental math. Free.">\n', "")
if "manifest.webmanifest" not in s:
    s = s.replace('<script>try{var t=', head_meta("Edge: quant interviews, one square a day", LAND_DESC) + '<script>try{var t=', 1)
wr("index.html", s)
# app
s = rd("app.html")
s = s.replace('<meta name="description" content="Daily quant interview practice as games: thousands of problems in probability, mental math, market making, options, stats and code.">\n', "")
if "manifest.webmanifest" not in s:
    s = s.replace('<script>try{var t=', head_meta("Edge practice", LAND_DESC) + '<script>try{var t=', 1)
wr("app.html", s)
# template head gets a per-page placeholder
h = rd(".impeccable/tpl/head.html")
if "__META__" not in h:
    h = h.replace('<script>try{var t=', "__META__" + '<script>try{var t=', 1)
wr(".impeccable/tpl/head.html", h)

PAGES = {

  "learn": ("Learn: quant interview lessons | Edge", "Short lessons on expected value, Bayes, random walks, option Greeks, the Kelly criterion and making markets, each with practice problems.", False),
  "learn-expected-value": ("Expected value and linearity | Edge lessons", "How to solve 'on average' interview questions: expected value, linearity of expectation, indicators and geometric waiting times, with practice problems.", False),
  "learn-conditional-probability": ("Conditional probability and Bayes' rule | Edge lessons", "Conditional probability and Bayes' rule for quant interviews: base rates, natural frequencies, Monty Hall and updating in odds, with practice problems.", False),
  "learn-random-walks": ("Random walks and gambler's ruin | Edge lessons", "Gambler's ruin and random walk interview questions solved with fair games: hitting probabilities and expected hitting times, with practice problems.", False),
  "learn-options-greeks": ("Options and the Greeks | Edge lessons", "Option payoffs, put-call parity, one-step pricing, delta, gamma, vega, theta and the 0.4 S sigma root T approximation for trading interviews.", False),
  "learn-kelly": ("The Kelly criterion | Edge lessons", "How much to bet with an edge: the Kelly criterion formula, why it maximizes growth, why over-betting ruins you, and fractional Kelly.", False),
  "learn-making-markets": ("Making markets and estimating | Edge lessons", "How to answer 'make me a market' interview questions: bids, asks, spreads, Fermi estimation and reacting to trades.", False),
  "gen-quant-interview-questions": ("Quant interview questions with solutions | Edge", "Quant trader, researcher and developer interview questions with worked solutions, by topic: probability, brainteasers, options, statistics, Python and mental math.", False),
  "gen-probability-interview-questions": ("Probability interview questions with solutions | Edge", "Probability interview questions for quant roles with answers and worked solutions: expected value, conditioning, dice, cards and random walks.", False),
  "gen-brainteaser-interview-questions": ("Brainteaser interview questions with solutions | Edge", "Brainteaser and puzzle interview questions with solutions: counting, number theory, weighings, recursion and number sequences.", False),
  "gen-options-interview-questions": ("Options interview questions with solutions | Edge", "Options interview questions with answers: payoffs, put-call parity, Greeks, delta hedging and Black-Scholes approximations.", False),
  "gen-statistics-interview-questions": ("Statistics interview questions for quants | Edge", "Statistics interview questions for quant roles with solutions: variance, standard error, correlation, regression, normal distribution and portfolio risk.", False),
  "gen-python-coding-interview-questions": ("Python coding interview questions for quants | Edge", "Python and algorithms questions from quant interviews with explanations: floor division, aliasing, default arguments, complexity and more.", False),
  "gen-mental-math-practice": ("Mental math practice for trading interviews | Edge", "Mental math questions like trading-firm online tests, with the shortcuts that make them fast: products, squares, percentages and fractions.", False),
  "login": ("Sign in to Edge", "Sign in or create a free Edge account to sync your quant interview practice.", True),
  "account": ("Edge Account", "Manage your Edge account.", True),
  "leaderboard": ("Edge Leaderboard", "Weekly leagues and all-time rankings for Edge quant interview practice.", False),
  "reset": ("Reset Edge Password", "Set a new password for your Edge account.", True),
  "about": ("About Edge", "How Edge works, where the problems come from, and answers to common questions.", False),
  "404": ("Page Not Found", "This page doesn't exist.", True),
  "privacy": ("Edge Privacy Policy", "How Edge handles your data. No ads, no trackers, no cookies.", False),
  "terms": ("Edge Terms of Use", "The terms for using Edge.", False),
}
foot = rd(".impeccable/tpl/foot.html")
for name, (title, desc, noindex) in PAGES.items():
    body = rd(".impeccable/tpl/" + name + ".body.html")
    sp = os.path.join(ROOT, ".impeccable", "tpl", name + ".script.html")
    script = io.open(sp, encoding="utf-8").read() if os.path.exists(sp) else ""
    wr(name.replace("gen-", "", 1) + ".html", h.replace("__TITLE__", title).replace("__META__", head_meta(title, desc, noindex)) + body + foot + script + "</body>\n</html>\n")

# web app manifest
wr("manifest.webmanifest", json.dumps({
  "name": "Edge Quant Trainer", "short_name": "Edge",
  "description": "Daily quant interview practice as games.",
  "start_url": "app.html#today", "scope": "./", "display": "standalone",
  "background_color": "#E9EDF8", "theme_color": "#1E3FA8",
  "icons": [
    {"src": "assets/img/icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "assets/img/icon-512.png", "sizes": "512x512", "type": "image/png"},
    {"src": "assets/img/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
  ]}, indent=2))
wr(".nojekyll", "")
wr(".gitignore", ".claude/\n.impeccable/\n*.bak\n__pycache__/\n")
wr("robots.txt", "User-agent: *\nAllow: /\nDisallow: /account.html\nDisallow: /reset.html\n")
print("web-ready files written")
