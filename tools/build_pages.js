/* Builds the static, search-engine-readable topic pages from the live problem bank.
   Run on any page that loads data.js + generators.js (e.g. app.html) via the local preview server:
     var s = document.createElement("script"); s.src = "tools/build_pages.js"; document.body.appendChild(s);
   then call EdgeBuildPages(). Bodies are PUT to .impeccable/tpl/gen-*.body.html and assembled by tools/build_site.py. */
(function () {
  var TOPICS = [
    {set: "prob", slug: "probability-interview-questions", h1: "Probability interview questions",
      intro: "Probability is the core of quant trading and research interviews: expected value, conditioning, dice, cards, coins and random walks. Below are problems in the style interviewers ask, each with the answer and the method. Try each one before you open the solution."},
    {set: "brain", slug: "brainteaser-interview-questions", h1: "Brainteaser and puzzle interview questions",
      intro: "Brainteasers test whether you can find structure fast: counting, number theory, clever weighings, recursion and sequences. Each problem below has a short solution that shows the trick, not just the number."},
    {set: "options", slug: "options-interview-questions", h1: "Options interview questions",
      intro: "Trading interviews expect fluency with option payoffs, put–call parity, the Greeks and quick pricing approximations. These questions cover the ideas that come up most, from delta hedging to Black–Scholes."},
    {set: "stats", slug: "statistics-interview-questions", h1: "Statistics interview questions for quant roles",
      intro: "Quant research interviews lean on statistics: variance rules, standard errors, correlation, regression, the normal distribution and portfolio risk. Every answer below shows how to get there."},
    {set: "code", slug: "python-coding-interview-questions", h1: "Python and algorithms interview questions",
      intro: "Quant developer and researcher interviews include quick-fire questions on Python behavior and algorithm costs. These are the gotchas that catch people: floor division, aliasing, default arguments, complexity and more."},
    {set: "mental", slug: "mental-math-practice", h1: "Mental math practice for trading interviews",
      intro: "Trading firms test arithmetic speed in their first-round online tests. Below are representative questions with the shortcuts that make them fast: splitting products, rounding to tens, building percentages from 10% and 5%, and scaling fractions."}
  ];
  var CAP = 32;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  function fmt(x) { if (Number.isInteger(x)) return x.toLocaleString(); for (var d = 2; d <= 70000; d++) { var n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-12) return n + "/" + d + (d > 12 ? " ≈ " + (+x.toPrecision(4)) : ""); } return String(+x.toPrecision(4)); }
  function diffName(d) { return ["", "Warm-up", "Interview", "Hard"][d]; }
  function pick(all, set) {
    var classics = all.filter(function (p) { return p.set === set && p.key.indexOf("c-") === 0; }).sort(function (a, b) { return a.diff - b.diff; });
    var fams = {}, gen = [];
    all.forEach(function (p) { if (p.set !== set || p.key.indexOf("c-") === 0) return; var f = p.key.replace(/-\d+$/, ""); if (!fams[f]) { fams[f] = []; } fams[f].push(p); });
    var keys = Object.keys(fams), budget = Math.max(CAP - Math.min(classics.length, 20), keys.length), round = 0;
    /* take one example per problem type, then keep cycling through the types (spread out) until the page is full */
    while (gen.length < budget && round < 12) {
      var added = false;
      keys.forEach(function (f) { var L = fams[f], idx = Math.floor((L.length * (2 * round + 1)) / 24) % L.length; if (gen.length < budget && gen.indexOf(L[idx]) < 0) { gen.push(L[idx]); added = true; } });
      if (!added) break; round++;
    }
    var out = classics.slice(0, Math.max(CAP - gen.length, Math.min(classics.length, 20))).concat(gen).slice(0, CAP);
    return out.sort(function (a, b) { return a.diff - b.diff; });
  }
  function qa(p, i) {
    var ans = p.type === "num" ? fmt(p.a) : p.opts[p.a];
    return '<article class="qa" id="' + p.key + '">' +
      '<h2 class="qa-q"><span class="qa-n">' + (i + 1) + "</span>" + esc(p.q) + "</h2>" +
      (p.type === "mc" ? '<ol class="qa-opts" type="A">' + p.opts.map(function (o) { return "<li>" + esc(o) + "</li>"; }).join("") + "</ol>" : "") +
      '<p class="meta"><span>' + esc(p.topic && p.topic !== "Classic" ? p.topic : "") + "</span><span>" + diffName(p.diff) + "</span></p>" +
      '<details class="qa-sol"><summary>Show the answer and solution</summary><p class="qa-a"><b>Answer:</b> ' + esc(ans) + "</p><p>" + esc(p.ex) + "</p>" +
      (p.steps ? '<ol class="qa-steps">' + p.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" : "") +
      "</details></article>";
  }
  function related(slug) {
    return '<nav class="qa-related" aria-label="More interview questions"><h2>More interview questions</h2><ul>' +
      TOPICS.filter(function (t) { return t.slug !== slug; }).map(function (t) { return '<li><a href="' + t.slug + '.html">' + esc(t.h1) + "</a></li>"; }).join("") +
      '<li><a href="quant-interview-questions.html">All quant interview questions</a></li><li><a href="learn.html">Lessons: learn the methods</a></li></ul></nav>';
  }
  window.EdgeBuildPages = function () {
    var C = window.EDGE_BANK.slice(), all;
    C.forEach(function (p) { p.key = p.key || "c-" + p.id; });
    (window.EDGE_STEPS || []).forEach(function (s) { for (var i = 0; i < C.length; i++) if (C[i].q.indexOf(s[0]) >= 0) { C[i].steps = s[1]; break; } });
    all = C.concat(window.EDGE_GENERATED);
    var pages = {}, hubCards = [];
    TOPICS.forEach(function (t) {
      var L = pick(all, t.set), total = all.filter(function (p) { return p.set === t.set; }).length;
      pages[t.slug] =
        '<article class="doc qa-page">' +
        "<h1>" + esc(t.h1) + '</h1><p class="lede" style="margin-top:12px">' + esc(t.intro) + "</p>" +
        '<div class="callout qa-cta"><b>' + L.length + " sample questions with solutions.</b> Edge has " + total.toLocaleString() + " " + esc(t.h1.toLowerCase().replace(/ interview questions.*| practice.*/, "")) + ' problems to practice, with a daily puzzle, timed games and a mock assessment. <a href="app.html#bank">Practice them free</a>.</div>' +
        L.map(qa).join("") + related(t.slug) + "</article>";
      hubCards.push('<a class="topic" href="' + t.slug + '.html"><h3>' + esc(t.h1) + "</h3><b class=\"num\">" + total.toLocaleString() + " problems</b><p>" + esc(t.intro.split(". ")[0]) + '.</p><q>' + esc(L[Math.min(3, L.length - 1)].q) + "</q></a>");
    });
    pages["quant-interview-questions"] =
      '<article class="qa-page stack" style="gap:24px">' +
      '<div class="doc"><h1>Quant interview questions with solutions</h1><p class="lede" style="margin-top:12px">Practice questions for quant trader, researcher and developer interviews, grouped by topic. Every question has a worked solution. When you\'re ready to drill, Edge turns all ' + all.length.toLocaleString() + " problems into daily puzzles, timed games and a mock assessment.</p></div>" +
      '<div class="topics">' + hubCards.join("") + "</div>" +
      '<div class="callout">New to a topic? Start with the <a href="learn.html">lessons</a>: short explanations of expected value, Bayes, random walks, the Greeks, Kelly betting and making markets, each with practice problems.</div></article>';
    return Promise.all(Object.keys(pages).map(function (slug) {
      return fetch(".impeccable/tpl/gen-" + slug + ".body.html", {method: "PUT", body: pages[slug]}).then(function (r) { return slug + ":" + r.status; });
    }));
  };
})();
