(function () {
  "use strict";
  var CLASSIC = window.EDGE_BANK, SETS = window.EDGE_SETS, MARKETS = window.EDGE_MARKETS;
  CLASSIC.forEach(function (p) { p.key = "c-" + p.id; p.topic = p.topic || "Classic"; });
  (window.EDGE_STEPS || []).forEach(function (s) { for (var i = 0; i < CLASSIC.length; i++) if (CLASSIC[i].q.indexOf(s[0]) >= 0) { CLASSIC[i].steps = s[1]; break; } });
  var BANK = CLASSIC.concat(window.EDGE_GENERATED || []);
  BANK.forEach(function (p, i) { p.n = i + 1; });
  var BY_KEY = {}; BANK.forEach(function (p) { BY_KEY[p.key] = p; });
  var KEY = "edge-v2";

  /* ---------- state ---------- */
  var S = {xp: 0, solved: {}, days: {}, r: {math: 1000, prob: 1000, mm: 1000, bet: 1000, desk: 1000}, best: {math: 0}, daily: {}, noticed: false};
  try { var saved = JSON.parse(localStorage.getItem(KEY) || "null"); if (saved) { for (var k in saved) S[k] = saved[k]; } } catch (e) {}
  if (S.v !== 3) { var mig = {}; for (var sk in S.solved) mig[/^\d+$/.test(sk) ? "c-" + sk : sk] = true; S.solved = mig; S.v = 3; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} if (window.EdgeSync) window.EdgeSync.queue(); }
  window.EdgeState = {
    get: function () { return S; },
    replace: function (next) { S = next; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} hud(); route(); },
    streak: function () { return streak(); }
  };
  if (!S.first) { S.first = (function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })(new Date()); save(); }

  function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function today() { return ymd(new Date()); }
  function active(k) { return !!(S.days[k] || (S.frozen && S.frozen[k])); }
  function streak() {
    var d = new Date(), n = 0;
    if (!active(ymd(d))) d.setDate(d.getDate() - 1);
    while (active(ymd(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }
  function goal() { return S.goal || 5; }
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(function () { t.hidden = true; }, 4000);
  }
  /* a streak freeze covers a single missed day automatically */
  (function () {
    S.frozen = S.frozen || {};
    var y = new Date(); y.setDate(y.getDate() - 1); var y2 = new Date(y); y2.setDate(y2.getDate() - 1);
    if (!active(ymd(y)) && active(ymd(y2)) && (S.freezes || 0) > 0) { S.frozen[ymd(y)] = true; S.freezes--; S.freezeNote = ymd(y); save(); }
  })();
  function weekStart() { var d = new Date(), day = (d.getUTCDay() + 6) % 7; var m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)); return m.toISOString().slice(0, 10); }
  function ensureWeek() {
    var ws = weekStart();
    if (!S.wk || S.wk.start !== ws) { S.wkPrev = S.wk && S.wk.xp ? {start: S.wk.start, xp: S.wk.xp} : (S.wkPrev || null); S.wk = {start: ws, xp: 0}; }
    return S.wk;
  }
  ensureWeek();
  window.EdgeWeek = {start: weekStart, ensure: function () { return ensureWeek(); }};
  function credit(skill, ok, xp) {
    if (xp > 0) ensureWeek().xp += xp;
    if (ok) {
      S.days[today()] = (S.days[today()] || 0) + 1;
      if (S.days[today()] === goal()) setTimeout(function () { toast("Daily goal reached: " + goal() + " solved today."); }, 600);
      var s = streak();
      if (s > 0 && s % 7 === 0 && S.freezeDay !== today()) { S.freezeDay = today(); if ((S.freezes || 0) < 2) { S.freezes = (S.freezes || 0) + 1; setTimeout(function () { toast(s + "-day streak! You earned a streak freeze."); }, 1200); } }
    }
    S.xp += xp;
    if (skill) S.r[skill] = Math.max(400, Math.min(2400, S.r[skill] + (ok ? 18 : -10)));
    S.rh = S.rh || {}; S.rh[today()] = JSON.parse(JSON.stringify(S.r));
    save(); hud();
  }
  function hud() { $("#streak").textContent = streak(); }

  /* ---------- helpers ---------- */
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  function parseNum(s) {
    s = String(s).trim().replace(/,/g, "").replace(/\s+/g, "");
    if (!s) return NaN;
    var m = s.match(/^(-?[\d.]+)\/([\d.]+)$/);
    if (m) return +m[1] / +m[2];
    if (/%$/.test(s)) return parseFloat(s) / 100;
    return Number(s);
  }
  function close(v, p) { var a = p.a; if (p.exact) return Math.abs(v - a) < 1e-9; return Math.abs(v - a) <= Math.max(p.abs != null ? p.abs : 0.0005, Math.abs(a) * (p.tol != null ? p.tol : 0.01)); }
  function fmt(x) {
    if (Number.isInteger(x)) return x.toLocaleString();
    for (var d = 2; d <= 2600; d++) { var n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9) return n + "/" + d + " ≈ " + (+x.toPrecision(4)); }
    return String(+x.toPrecision(4));
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.random() * (i + 1) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function rnd(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function setName(id) { for (var i = 0; i < SETS.length; i++) if (SETS[i].id === id) return SETS[i].name; return id; }
  function skillOf(p) { return (p.set === "prob" || p.set === "brain") ? "prob" : p.set === "mental" ? "math" : "desk"; }
  function dots(n) { var h = '<span class="dots" aria-label="Difficulty ' + n + ' of 3">'; for (var i = 1; i <= 3; i++) h += '<i class="' + (i <= n ? "f" : "") + '"></i>'; return h + "</span>"; }
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>';
  var timers = [];
  function clearTimers() { timers.forEach(clearInterval); timers = []; }

  /* ---------- daily ---------- */
  var DAILY = CLASSIC.filter(function (p) { return p.type === "num"; });
  function dayNo(d) { return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
  function dailyFor(d) { return DAILY[(dayNo(d) * 37) % DAILY.length]; }
  function dailyNumber() { return dayNo(new Date()) - dayNo(new Date(2026, 9, 1)) + 1; }

  /* ---------- problem widget (shared by Today and Bank) ---------- */
  var BOOKMARK = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="miter"/></svg>';
  var ACTIVE = null;
  document.addEventListener("keydown", function (e) {
    if (!ACTIVE || !document.body.contains(ACTIVE.el) || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
    if (typing) { if (e.key === "Escape") t.blur(); return; }
    var el = ACTIVE.el, k = e.key.toLowerCase(), btn = null;
    if (k === "h") btn = $("[data-a=hint]", el);
    else if (k === "n") { btn = $("[data-a=next]", el); if (btn && btn.hidden) btn = null; }
    else if (k === "s") btn = $("[data-a=save]", el);
    else if (/^[1-4]$/.test(k) && !ACTIVE.done()) btn = $$(".opt", el)[+k - 1];
    else if (k === "enter" && !ACTIVE.done()) { var inp = $("input", el); if (inp) { inp.focus(); e.preventDefault(); } return; }
    if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
  });
  function problemWidget(el, p, opts) {
    opts = opts || {};
    var answered = false;
    var body = '<p class="today-q">' + esc(p.q) + '</p>' +
      '<div class="meta">' + (opts.daily ? "" : '<span>No. ' + p.n + '</span>') + '<span>' + esc(setName(p.set)) + (p.topic && p.topic !== "Classic" ? ' · ' + esc(p.topic) : '') + '</span><span>' + dots(p.diff) + '</span>' + (S.solved[p.key] ? '<span style="color:var(--good)">Solved before</span>' : "") + '</div>';
    if (p.type === "num") {
      body += '<div class="row"><label class="lab" for="ans-' + p.n + '" style="position:absolute;left:-9999px">Your answer</label>' +
        '<input class="field" id="ans-' + p.n + '" autocomplete="off" inputmode="decimal" placeholder="e.g. 3/8 or 0.375">' +
        '<button class="btn go" data-a="check">Check</button></div>';
    } else {
      body += '<div class="opts">' + p.opts.map(function (o, i) { return '<button class="opt" data-i="' + i + '"><span class="k">' + "ABCD"[i] + '</span>' + esc(o) + '</button>'; }).join("") + '</div>';
    }
    body += (p.steps ? '<ol class="wsteps" hidden></ol>' : "") + '<p class="fb" aria-live="polite"></p><div class="row"><button class="btn alt" data-a="hint">' + (p.steps ? "Show a step" : "Show hint") + '</button><button class="btn alt" data-a="reveal">Reveal answer</button>' + (opts.next ? '<button class="btn" data-a="next" hidden>Next problem</button>' : "") + '</div><div class="ex" hidden></div>' +
      '<div class="ptools"><button class="btn alt sm" data-a="save" aria-pressed="' + !!(S.saved && S.saved[p.key]) + '">' + BOOKMARK + '<span>' + (S.saved && S.saved[p.key] ? "Saved" : "Save") + '</span></button>' +
      '<details class="note"' + (S.notes && S.notes[p.key] ? " open" : "") + '><summary>My notes</summary><label class="sr" for="note-' + p.n + '">Notes for problem ' + p.n + '</label><textarea id="note-' + p.n + '" rows="3" placeholder="Your approach, mistakes to avoid, a trick to remember…">' + esc((S.notes && S.notes[p.key]) || "") + '</textarea></details>' +
      '<p class="keys">Keys: ' + (p.type === "mc" ? "1–4 choose · " : "Enter check · ") + 'H ' + (p.steps ? "step" : "hint") + (opts.next ? " · N next" : "") + ' · S save</p></div>';
    el.innerHTML = body;
    ACTIVE = {el: el, p: p, done: function () { return answered; }};
    var noteT; $("textarea", el).addEventListener("input", function () { var v = this.value; clearTimeout(noteT); noteT = setTimeout(function () { S.notes = S.notes || {}; if (v.trim()) S.notes[p.key] = v; else delete S.notes[p.key]; save(); }, 400); });
    var fb = $(".fb", el), ex = $(".ex", el), tries = 0;
    function finish(ok, msg) {
      answered = true;
      S.att = S.att || {}; var at = S.att[p.set] = S.att[p.set] || {n: 0, ok: 0, first: 0};
      at.n++; if (ok) { at.ok++; if (tries === 1) at.first++; } save();
      fb.className = "fb " + (ok ? "good" : "bad"); fb.textContent = msg;
      ex.hidden = false;
      ex.innerHTML = "<b>Answer: " + esc(p.type === "num" ? fmt(p.a) : p.opts[p.a]) + "</b><p>" + esc(p.ex) + "</p>" +
        (p.steps ? '<details class="walk" open><summary>Step-by-step solution</summary><ol>' + p.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></details>" : "");
      var ws = $(".wsteps", el); if (ws) ws.hidden = true;
      $$("input,.opt,[data-a=check],[data-a=reveal]", el).forEach(function (b) { b.disabled = true; });
      var nb = $("[data-a=next]", el); if (nb) { nb.hidden = false; nb.focus(); }
      schedule(p, ok && tries <= 1);
      if (opts.onDone) opts.onDone(ok, tries);
    }
    function grade(ok) {
      tries++;
      if (ok) {
        var first = !S.solved[p.key]; S.solved[p.key] = true;
        credit(skillOf(p), true, first ? 10 * p.diff + 5 : 3);
        finish(true, tries === 1 ? "Correct on the first try." : "Correct.");
      } else if (p.type === "mc") {
        credit(skillOf(p), false, 1); finish(false, "Not this one.");
      } else {
        credit(null, false, 0);
        fb.className = "fb bad"; fb.textContent = "Not quite. Try again, or take a hint.";
      }
    }
    el.onclick = function (e) {
      var b = e.target.closest("button"); if (!b || answered && b.dataset.a !== "next" && b.dataset.a !== "save") return;
      if (b.dataset.a === "save") {
        S.saved = S.saved || {}; var on = !S.saved[p.key];
        if (on) S.saved[p.key] = today(); else delete S.saved[p.key];
        save(); b.setAttribute("aria-pressed", on); b.querySelector("span").textContent = on ? "Saved" : "Save";
        toast(on ? "Saved. Find it under Train → Saved problems." : "Removed from saved problems.");
        return;
      }
      if (b.classList.contains("opt")) {
        var i = +b.dataset.i, ok = i === p.a;
        $$(".opt", el).forEach(function (o, j) { if (j === p.a) o.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        grade(ok);
      } else if (b.dataset.a === "check") {
        var v = parseNum($("input", el).value);
        if (isNaN(v)) { fb.className = "fb bad"; fb.textContent = "Enter a number, a fraction like 3/8, or a percent."; return; }
        grade(close(v, p));
      } else if (b.dataset.a === "hint") {
        if (p.steps) {
          var ol = $(".wsteps", el), shown = ol.children.length;
          ol.hidden = false; ol.insertAdjacentHTML("beforeend", "<li>" + esc(p.steps[shown]) + "</li>");
          if (shown + 1 >= p.steps.length - 1) { b.disabled = true; b.textContent = "Last step is the answer"; }
          else b.textContent = "Show step " + (shown + 2) + " of " + p.steps.length;
        } else { fb.className = "fb"; fb.textContent = "Hint: " + p.hint; b.disabled = true; }
      } else if (b.dataset.a === "reveal") {
        credit(skillOf(p), false, 0); if (opts.onReveal) opts.onReveal(); finish(false, "Revealed. Study the method, then come back to it.");
      } else if (b.dataset.a === "next" && opts.next) opts.next();
    };
    var inp = $("input", el);
    if (inp) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") $("[data-a=check]", el).click(); });
  }

  /* ---------- views ---------- */
  var V = {};

  V.today = function (app) {
    var p = dailyFor(new Date()), t = today(), d = S.daily[t];
    var now = new Date(), y = now.getFullYear(), m = now.getMonth();
    var first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    var monthName = now.toLocaleString(undefined, {month: "long"});
    var cells = ["S", "M", "T", "W", "T", "F", "S"].map(function (x) { return '<div class="dow" aria-hidden="true">' + x + "</div>"; }).join("");
    for (var i = 0; i < first; i++) cells += '<div class="cell blank" aria-hidden="true"></div>';
    for (var dd = 1; dd <= days; dd++) {
      var key = ymd(new Date(y, m, dd)), isToday = dd === now.getDate(), past = dd < now.getDate() && key >= S.first;
      var fz = !S.days[key] && S.frozen && S.frozen[key];
      var cls = S.days[key] ? "solved" : fz ? "frozen" : (past ? "black" : "");
      cells += '<div class="cell ' + cls + (isToday ? " today" : "") + '" role="img" aria-label="' + monthName + " " + dd + (S.days[key] ? ", practiced" : fz ? ", covered by a streak freeze" : past ? ", missed" : "") + '"' + (isToday ? ' id="todayCell"' : "") + "><sup>" + dd + "</sup>" + (S.days[key] ? CHECK : fz ? SNOW : "") + "</div>";
    }
    var solvedCount = Object.keys(S.solved).length;
    var mcCount = BANK.filter(function (q) { return q.type === "mc"; }).length;
    var games = [
      ["bank", "Problem Bank", "Probability, brainteasers, options, stats, code and mental math. Fill the grid.", solvedCount.toLocaleString() + " of " + BANK.length.toLocaleString() + " solved", "prob"],
      ["math", "Speed Math", "Two minutes of arithmetic under the clock, the way trading firms test it.", "Best " + S.best.math, "math"],
      ["market", "Make a Market", "Quote a bid and an ask on numbers you don't know. Tight and right scores.", MARKETS.length + " markets", "mm"],
      ["bet", "Betting Table", "A coin that lands heads 60% of the time. Size your bets or go broke.", "30 flips", "bet"],
      ["quiz", "Desk Quiz", "Ten rapid questions on Greeks, Python and statistics.", mcCount + " questions", "desk"]
    ];
    function bar(v, label) { return '<div class="track" role="img" aria-label="' + label + " rating " + v + '"><i style="width:' + Math.max(2, Math.min(100, (v - 400) / 20)) + '%"></i></div>'; }
    app.innerHTML =
      '<div class="split">' +
        '<section class="sheet pad stack" aria-labelledby="dq">' +
          '<div class="row between"><h1 id="dq">Daily No. ' + dailyNumber() + '</h1><span class="sub num">' + now.toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"}) + "</span></div>" +
          '<div id="dailyBox" class="stack"></div><div id="shareBox" class="stack" hidden></div>' +
        "</section>" +
        '<section class="sheet pad stack" aria-labelledby="mh">' +
          '<div class="row between"><h2 id="mh">' + monthName + '</h2><span class="sub num">' + streak() + " day streak</span></div>" +
          '<div class="month">' + cells + "</div>" +
          goalMeter() +
          '<p class="sub">' + SNOW_INLINE + " " + (S.freezes || 0) + " streak freeze" + ((S.freezes || 0) === 1 ? "" : "s") + " saved. Earn one every 7 days in a row; it covers a missed day automatically.</p>" +
        "</section>" +
      "</div>" +
      (S.freezeNote ? '<div class="callout">A streak freeze covered ' + new Date(S.freezeNote + "T12:00:00").toLocaleDateString(undefined, {weekday: "long"}) + ". Your streak is safe.</div>" : "") +
      planSection() +
      '<section class="stack" aria-labelledby="bk"><div class="row between"><h2 id="bk">Across</h2><span class="sub">Ratings start at 1000 (the marker). Every solve fills today\'s square.</span></div>' +
        '<div class="clues">' + games.map(function (g, i) { var v = S.r[g[4]]; return '<a class="clue" href="#' + g[0] + '"><span class="n">' + (i + 1) + '</span><span class="clue-b"><h3>' + g[1] + '</h3><p>' + g[2] + '</p><span class="clue-r">' + bar(v, g[1]) + '<b class="num">' + v + '</b></span><span class="clue-c num">' + g[3] + '</span></span><span class="go">Play</span></a>'; }).join("") + "</div></section>";
    if (S.freezeNote) { delete S.freezeNote; save(); }
    $("#goalSel").onchange = function () { S.goal = +this.value; save(); route(); };

    var box = $("#dailyBox"), share = $("#shareBox");
    function showShare(st) {
      share.hidden = false;
      var txt = "Edge Daily No. " + dailyNumber() + "\n" + "⬛".repeat(Math.max(0, st.tries - 1)) + "🟨 solved in " + st.tries + (st.tries > 1 ? " tries" : " try") + "\nStreak: " + streak() + (streak() === 1 ? " day" : " days");
      share.innerHTML = '<div class="share" id="shareTxt">' + esc(txt) + '</div><div class="row"><button class="btn" id="copyBtn">Copy result</button><a class="btn alt" href="#bank" style="text-decoration:none">Keep practicing</a></div>';
      $("#copyBtn").onclick = function () {
        var b = this;
        try { navigator.clipboard.writeText(txt).then(function () { b.textContent = "Copied"; }, function () { getSelection().selectAllChildren($("#shareTxt")); b.textContent = "Press Ctrl+C to copy"; }); }
        catch (e) { getSelection().selectAllChildren($("#shareTxt")); }
      };
    }
    if (d && (d.done || d.revealed)) {
      box.innerHTML = '<p class="today-q">' + esc(p.q) + '</p><div class="meta"><span>' + esc(setName(p.set)) + "</span><span>" + dots(p.diff) + '</span></div><div class="ex"><b>Answer: ' + esc(fmt(p.a)) + "</b><p>" + esc(p.ex) + "</p></div>";
      if (d.done) showShare(d);
      else box.insertAdjacentHTML("beforeend", '<p class="sub">You revealed today\'s answer. A new puzzle arrives tomorrow; the Problem Bank is open now.</p><div class="row"><a class="btn go" href="#bank" style="text-decoration:none">Open the Problem Bank</a></div>');
    } else {
      problemWidget(box, p, {daily: true, onReveal: function () { S.daily[t] = {revealed: true}; save(); }, onDone: function (ok, tries) {
        if (!ok) return;
        S.daily[t] = {tries: tries, done: true}; save();
        var c = $("#todayCell"); if (c) { c.classList.add("solved", "stamp"); c.insertAdjacentHTML("beforeend", CHECK); }
        showShare(S.daily[t]);
      }});
    }
  };

  V.bank = function (app, arg) {
    var PAGE = 160, f = {set: "all", diff: 0, open: false, q: "", saved: arg === "saved"}, cur = null, page = 0;
    var total = BANK.length.toLocaleString();
    app.innerHTML =
      '<div class="stack"><h1>Problem Bank</h1><p class="lede">' + total + " problems across probability, brainteasers, options, statistics, code and mental math. Every square you solve turns yellow. Fractions like 3/8 are accepted.</p></div>" +
      '<div class="split">' +
        '<section class="sheet pad stack" aria-label="Problems">' +
          '<div class="row"><label class="lab" for="bankQ" style="position:absolute;left:-9999px">Search problems</label><input class="field" id="bankQ" type="search" placeholder="Search: dice, Bayes, straddle, Python…" autocomplete="off" style="font-size:16px;font-weight:500"><button class="btn go" id="randBtn">Random unsolved</button></div>' +
          '<div class="filters" role="group" aria-label="Filter by set"><button class="chip" data-set="all" aria-pressed="true">All</button>' + SETS.map(function (s) { return '<button class="chip" data-set="' + s.id + '" aria-pressed="false">' + s.name + "</button>"; }).join("") + "</div>" +
          '<div class="filters" role="group" aria-label="Filter by difficulty"><button class="chip" data-diff="0" aria-pressed="true">Any level</button><button class="chip" data-diff="1" aria-pressed="false">' + dots(1) + ' Warm-up</button><button class="chip" data-diff="2" aria-pressed="false">' + dots(2) + ' Interview</button><button class="chip" data-diff="3" aria-pressed="false">' + dots(3) + ' Hard</button><button class="chip" id="openOnly" aria-pressed="false">Unsolved only</button><button class="chip" id="savedOnly" aria-pressed="' + f.saved + '">' + BOOKMARK + ' Saved</button></div>' +
          '<p class="sub num" id="count" aria-live="polite"></p><div class="bank" id="grid"></div>' +
          '<div class="row between" id="pager"><button class="btn alt" id="prevP">Previous</button><span class="sub num" id="pageN"></span><button class="btn alt" id="nextP">Next</button></div>' +
        "</section>" +
        '<section class="sheet pad stack" id="pane" aria-live="polite"></section>' +
      "</div>";
    function list() {
      var q = f.q.toLowerCase();
      return BANK.filter(function (p) { return (f.set === "all" || p.set === f.set) && (!f.diff || p.diff === f.diff) && (!f.open || !S.solved[p.key]) && (!f.saved || (S.saved && S.saved[p.key])) && (!q || (p.q + " " + (p.topic || "") + " " + setName(p.set)).toLowerCase().indexOf(q) >= 0); });
    }
    function draw() {
      var L = list(), solved = 0; L.forEach(function (p) { if (S.solved[p.key]) solved++; });
      var pages = Math.max(1, Math.ceil(L.length / PAGE)); if (page >= pages) page = pages - 1;
      $("#count").textContent = solved.toLocaleString() + " of " + L.length.toLocaleString() + " solved in this view";
      $("#grid").innerHTML = L.slice(page * PAGE, page * PAGE + PAGE).map(function (p) {
        var s = S.solved[p.key];
        return '<button class="cell' + (s ? " solved" : "") + (cur && cur.key === p.key ? " on" : "") + '" data-key="' + p.key + '" aria-label="Problem ' + p.n + ", " + setName(p.set) + (s ? ", solved" : "") + '"><sup>' + p.n + "</sup>" + (s ? CHECK : "") + "</button>";
      }).join("") || (f.saved && !Object.keys(S.saved || {}).length ? '<p class="sub">No saved problems yet. Press Save (or S) on any problem to keep it here.</p>' : '<p class="sub">No problems match. Clear the search or pick another set.</p>');
      $("#pageN").textContent = "Page " + (page + 1) + " of " + pages;
      $("#prevP").disabled = page === 0; $("#nextP").disabled = page >= pages - 1;
      $("#pager").hidden = pages < 2;
    }
    function open(p, scroll) {
      cur = p; draw();
      problemWidget($("#pane"), p, {
        next: function () { var L = list().filter(function (q) { return !S.solved[q.key] && q.key !== p.key; }); open(L.filter(function (q) { return q.n > p.n; })[0] || L[0] || p, true); },
        onDone: function (ok) { draw(); if (ok) { var c = $('[data-key="' + p.key + '"]'); if (c) c.classList.add("stamp"); } }
      });
      if (scroll && innerWidth < 900) $("#pane").scrollIntoView({behavior: "smooth", block: "start"});
    }
    var tq;
    $("#bankQ").addEventListener("input", function () { var v = this.value; clearTimeout(tq); tq = setTimeout(function () { f.q = v.trim(); page = 0; draw(); }, 150); });
    app.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.set) { f.set = b.dataset.set; page = 0; $$("[data-set]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); draw(); }
      else if (b.dataset.diff !== undefined) { f.diff = +b.dataset.diff; page = 0; $$("[data-diff]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); draw(); }
      else if (b.id === "openOnly") { f.open = !f.open; page = 0; b.setAttribute("aria-pressed", f.open); draw(); }
      else if (b.id === "savedOnly") { f.saved = !f.saved; page = 0; b.setAttribute("aria-pressed", f.saved); draw(); }
      else if (b.id === "prevP") { page--; draw(); $("#grid").scrollIntoView({block: "nearest"}); }
      else if (b.id === "nextP") { page++; draw(); $("#grid").scrollIntoView({block: "nearest"}); }
      else if (b.id === "randBtn") { var L = list().filter(function (q) { return !S.solved[q.key]; }); if (L.length) { var p = L[Math.random() * L.length | 0]; page = Math.floor(list().indexOf(p) / PAGE); open(p, true); } }
      else if (b.dataset.key) open(BY_KEY[b.dataset.key], true);
    });
    var first = list()[0] || BANK.filter(function (p) { return !S.solved[p.key]; })[0] || BANK[0];
    open(first);
  };

  V.math = function (app) {
    var OPS = ["+", "−", "×", "÷"], STD = {ops: "+−×÷", lvl: "medium", dur: 120};
    var cfg = S.mathCfg || {ops: STD.ops, lvl: STD.lvl, dur: STD.dur};
    function isStd() { return cfg.ops === STD.ops && cfg.lvl === STD.lvl && cfg.dur === STD.dur; }
    function cfgKey() { return cfg.ops + "|" + cfg.lvl + "|" + cfg.dur; }
    S.bestCustom = S.bestCustom || {};
    function bestNow() { return isStd() ? S.best.math : (S.bestCustom[cfgKey()] || 0); }
    app.innerHTML =
      '<div class="stack"><h1>Speed Math</h1><p class="lede">Whole-number arithmetic against the clock. Each answer submits itself the moment it\'s right. The Standard setup (all four operations, Medium, 2 minutes) counts toward your rating and personal best.</p></div>' +
      '<div class="split">' +
      '<section class="sheet pad stack" aria-label="Game">' +
        '<div class="row between"><div><span class="sub">Time left</span><div class="big num" id="mT"></div></div><div style="text-align:right"><span class="sub">Score</span><div class="big num" id="mS" style="color:var(--cobalt)">0</div></div></div>' +
        '<div class="timebar"><i id="mBar" style="width:100%"></i></div>' +
        '<div class="prompt" id="mQ" aria-live="polite">Ready</div>' +
        '<div class="row"><label class="sr" for="mA">Your answer</label><input class="field" id="mA" inputmode="numeric" autocomplete="off" disabled placeholder="Answer"><button class="btn alt" id="mSkip" disabled title="Skip (Tab)">Skip</button></div>' +
        '<div class="row between"><button class="btn go" id="mGo">Start the clock</button><span class="sub num" id="mBest"></span></div>' +
        '<div id="mRes"></div>' +
      "</section>" +
      '<section class="sheet pad stack" aria-labelledby="msh"><h2 id="msh">Setup</h2>' +
        '<fieldset class="fs"><legend class="lab">Operations</legend><div class="filters">' + OPS.map(function (o) { return '<label class="chip tog"><input type="checkbox" data-op="' + o + '"' + (cfg.ops.indexOf(o) >= 0 ? " checked" : "") + "> " + o + "</label>"; }).join("") + "</div></fieldset>" +
        '<fieldset class="fs"><legend class="lab">Difficulty</legend><div class="filters">' + [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]].map(function (l) { return '<label class="chip tog"><input type="radio" name="mlvl" value="' + l[0] + '"' + (cfg.lvl === l[0] ? " checked" : "") + "> " + l[1] + "</label>"; }).join("") + "</div></fieldset>" +
        '<fieldset class="fs"><legend class="lab">Length</legend><div class="filters">' + [[60, "1 min"], [120, "2 min"], [300, "5 min"], [480, "8 min"]].map(function (l) { return '<label class="chip tog"><input type="radio" name="mdur" value="' + l[0] + '"' + (cfg.dur === l[0] ? " checked" : "") + "> " + l[1] + "</label>"; }).join("") + "</div></fieldset>" +
        '<p class="sub" id="mMode"></p><button class="btn alt" id="mStd">Reset to Standard</button>' +
      "</section></div>";
    var ans, op, score, left, running = false, shownAt, log;
    function paintCfg() {
      $("#mT").textContent = cfg.dur >= 60 ? Math.floor(cfg.dur / 60) + ":" + String(cfg.dur % 60).padStart(2, "0") : cfg.dur;
      $("#mBest").textContent = (isStd() ? "Personal best: " : "Best with this setup: ") + bestNow();
      $("#mMode").textContent = isStd() ? "Standard setup: counts toward your rating." : "Custom setup: practice only, with its own best score.";
    }
    function readCfg() {
      var ops = $$("[data-op]").filter(function (c) { return c.checked; }).map(function (c) { return c.dataset.op; }).join("");
      if (!ops) { ops = "+"; $$("[data-op]")[0].checked = true; }
      cfg = {ops: ops, lvl: ($("[name=mlvl]:checked") || {}).value || "medium", dur: +(($("[name=mdur]:checked") || {}).value || 120)};
      S.mathCfg = cfg; save(); paintCfg();
    }
    app.addEventListener("change", function (e) { if (!running && e.target.closest(".fs")) readCfg(); });
    $("#mStd").onclick = function () { if (running) return; cfg = {ops: STD.ops, lvl: STD.lvl, dur: STD.dur}; S.mathCfg = cfg; save(); V.math(clearApp()); };
    function next() {
      op = cfg.ops[Math.random() * cfg.ops.length | 0]; var a, b, L = cfg.lvl;
      if (op === "+") { if (L === "easy") { a = rnd(10, 99); b = rnd(10, 99); } else if (L === "medium") { a = rnd(12, 999); b = rnd(12, 999); } else { a = rnd(100, 9999); b = rnd(100, 9999); } ans = a + b; }
      else if (op === "−") { if (L === "easy") { a = rnd(20, 99); b = rnd(10, a); } else if (L === "medium") { a = rnd(60, 999); b = rnd(11, a); } else { a = rnd(1000, 9999); b = rnd(100, a); } ans = a - b; }
      else if (op === "×") { if (L === "easy") { a = rnd(2, 12); b = rnd(2, 12); } else if (L === "medium") { a = rnd(3, 99); b = rnd(3, 12); } else { a = rnd(11, 99); b = rnd(11, 99); } ans = a * b; }
      else { if (L === "easy") { b = rnd(2, 12); ans = rnd(2, 12); } else if (L === "medium") { b = rnd(3, 12); ans = rnd(3, 99); } else { b = rnd(11, 49); ans = rnd(11, 99); } a = ans * b; }
      $("#mQ").textContent = a + " " + op + " " + b; $("#mA").value = ""; shownAt = performance.now();
    }
    function record(ok) { log.push({op: op, ok: ok, t: (performance.now() - shownAt) / 1000}); }
    function finish() {
      running = false; clearTimers(); $("#mA").disabled = true; $("#mSkip").disabled = true;
      $$(".fs input").forEach(function (c) { c.disabled = false; }); $("#mStd").disabled = false;
      var g = $("#mGo"); g.disabled = false; g.textContent = "Play again";
      var pb = score > bestNow();
      if (isStd()) {
        if (pb) S.best.math = score;
        S.runs = (S.runs || []).concat([{d: today(), s: score}]).slice(-60);
        S.r.math = Math.round(S.r.math * 0.6 + (600 + score * 16) * 0.4);
      } else if (pb) S.bestCustom[cfgKey()] = score;
      credit(null, score > 0, isStd() ? score * 2 : score);
      $("#mQ").textContent = pb && score > 0 ? "New best: " + score : "Score: " + score;
      var by = {}; log.forEach(function (x) { var o = by[x.op] = by[x.op] || {n: 0, ok: 0, t: 0}; o.n++; if (x.ok) { o.ok++; o.t += x.t; } });
      var rows = Object.keys(by).map(function (k) { var o = by[k]; return {op: k, ok: o.ok, skip: o.n - o.ok, avg: o.ok ? o.t / o.ok : null}; });
      var slow = rows.filter(function (r) { return r.avg != null; }).sort(function (a, b) { return b.avg - a.avg; })[0];
      $("#mRes").innerHTML = rows.length ? '<div class="ex"><b>Breakdown</b><div class="scroll-x"><table class="tbl"><thead><tr><th scope="col">Operation</th><th scope="col" class="r">Correct</th><th scope="col" class="r">Skipped</th><th scope="col" class="r">Avg time</th></tr></thead><tbody>' +
        rows.map(function (r) { return "<tr><th scope=\"row\">" + r.op + '</th><td class="r">' + r.ok + '</td><td class="r">' + r.skip + '</td><td class="r">' + (r.avg != null ? r.avg.toFixed(1) + "s" : "–") + "</td></tr>"; }).join("") +
        "</tbody></table></div>" + (slow && rows.length > 1 ? "<p>Slowest: <b>" + slow.op + "</b> at " + slow.avg.toFixed(1) + "s per answer. Try a custom run with only " + slow.op + " to drill it.</p>" : "") + "</div>" : "";
      paintCfg();
    }
    $("#mGo").onclick = function () {
      readCfg(); score = 0; left = cfg.dur; log = []; running = true; $("#mRes").innerHTML = "";
      $("#mS").textContent = 0; $("#mA").disabled = false; $("#mSkip").disabled = false; $("#mA").focus(); this.disabled = true;
      $$(".fs input").forEach(function (c) { c.disabled = true; }); $("#mStd").disabled = true;
      next();
      timers.push(setInterval(function () {
        left--; $("#mT").textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0"); $("#mBar").style.width = (left / cfg.dur * 100) + "%";
        if (left <= 0) finish();
      }, 1000));
    };
    $("#mSkip").onclick = function () { if (!running) return; record(false); next(); $("#mA").focus(); };
    $("#mA").addEventListener("keydown", function (e) { if (e.key === "Tab" && running) { e.preventDefault(); $("#mSkip").click(); } });
    $("#mA").addEventListener("input", function () { if (running && this.value.trim() !== "" && +this.value === ans) { record(true); score++; $("#mS").textContent = score; next(); } });
    paintCfg();
  };

  V.market = function (app) {
    var deck = shuffle(MARKETS).slice(0, 6), k = 0, pnl = 0;
    app.innerHTML =
      '<div class="stack"><h1>Make a Market</h1><p class="lede">An interviewer names a number you probably don\'t know and asks for a bid and an ask. If the true value lands inside your quote you score 100 × bid ÷ ask, so tighter quotes earn more. If it lands outside, you get picked off for −40.</p></div>' +
      '<section class="sheet pad stack" style="max-width:820px">' +
        '<div class="row between"><span class="sub num" id="mmN"></span><span class="sub">Session PnL <b class="num" id="mmP" style="color:var(--ink);font-size:18px">0</b></span></div>' +
        '<p class="today-q" id="mmQ"></p>' +
        '<div class="row"><label class="lab" for="mmB" style="position:absolute;left:-9999px">Bid</label><input class="field" id="mmB" inputmode="decimal" placeholder="Bid (low)"><label class="lab" for="mmA" style="position:absolute;left:-9999px">Ask</label><input class="field" id="mmA" inputmode="decimal" placeholder="Ask (high)"><button class="btn go" id="mmGo">Quote</button></div>' +
        '<p class="fb" id="mmFb" aria-live="polite"></p><div class="row"><button class="btn" id="mmNext" hidden>Next round</button></div>' +
      "</section>";
    function load() {
      if (k >= deck.length) {
        var ok = pnl >= 250; credit("mm", ok, Math.max(5, Math.round(pnl / 6)));
        $("#mmN").textContent = "Session complete";
        $("#mmQ").textContent = "Final PnL: " + pnl;
        $("#mmFb").className = "fb " + (ok ? "good" : "bad");
        $("#mmFb").textContent = ok ? "A profitable session. Your Markets rating went up." : "Under 250. Quote wider when you're unsure and tighter when you know.";
        $("#mmB").disabled = $("#mmA").disabled = $("#mmGo").disabled = true;
        var n = $("#mmNext"); n.hidden = false; n.textContent = "New session"; n.onclick = function () { V.market(clearApp()); };
        return;
      }
      $("#mmN").textContent = "Round " + (k + 1) + " of " + deck.length;
      $("#mmQ").textContent = deck[k][0] + "?";
      $("#mmB").value = $("#mmA").value = ""; $("#mmFb").textContent = ""; $("#mmNext").hidden = true; $("#mmGo").disabled = false; $("#mmB").focus();
    }
    $("#mmGo").onclick = function () {
      var b = parseNum($("#mmB").value), a = parseNum($("#mmA").value), t = deck[k][1];
      if (!(b > 0 && a >= b)) { $("#mmFb").className = "fb bad"; $("#mmFb").textContent = "Enter a positive bid that is no higher than your ask."; return; }
      var inside = b <= t && t <= a, s = inside ? Math.round(100 * b / a) : -40;
      pnl += s; $("#mmP").textContent = pnl;
      $("#mmFb").className = "fb " + (inside ? "good" : "bad");
      $("#mmFb").textContent = "True value " + t.toLocaleString() + ". " + (inside ? "Inside your quote, +" + s + "." : "Picked off, −40.");
      this.disabled = true; var n = $("#mmNext"); n.hidden = false; n.textContent = "Next round"; n.onclick = function () { k++; load(); }; n.focus();
    };
    $("#mmA").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#mmGo").click(); });
    load();
  };

  V.bet = function (app) {
    var N = 30, p = 0.6, bank = 25, kelly = 25, flip = 0, hist = [[25, 25]], done = false;
    app.innerHTML =
      '<div class="stack"><h1>Betting Table</h1><p class="lede">This coin lands heads 60% of the time and pays even money. You start with $25 and get 30 flips. Next to you, a Kelly bettor stakes 20% of its bankroll on heads every flip, on the same coin.</p></div>' +
      '<div class="split">' +
        '<section class="sheet pad stack"><canvas id="bC" width="760" height="220" role="img" aria-label="Bankroll over time, you versus the Kelly bettor"></canvas>' +
          '<div class="legend"><span><i style="background:var(--cobalt)"></i>You</span><span><i style="background:var(--muted)"></i>Kelly bettor</span><span><i style="background:var(--hair)"></i>Starting $25</span></div></section>' +
        '<section class="sheet pad stack">' +
          '<div class="row between"><span class="sub num" id="bN">Flip 1 of ' + N + '</span></div><div class="big num" id="bBank">$25.00</div>' +
          '<label class="lab" for="bPct">Stake: <b class="num" id="bPctV" style="color:var(--ink)">20</b>% of bankroll</label><input type="range" id="bPct" min="1" max="100" value="20">' +
          '<div class="row"><button class="btn go" id="bH">Bet heads</button><button class="btn alt" id="bT">Bet tails</button></div>' +
          '<p class="fb" id="bFb" aria-live="polite"></p><div id="bEnd"></div>' +
        "</section></div>";
    var cv = $("#bC"), cx = cv.getContext("2d");
    function draw() {
      var cs = getComputedStyle(document.documentElement), W = cv.width, H = cv.height, mx = Math.max(60, Math.max.apply(null, hist.map(function (h) { return Math.max(h[0], h[1]); })) * 1.1);
      cx.clearRect(0, 0, W, H);
      var y25 = H - 25 / mx * (H - 8);
      cx.strokeStyle = cs.getPropertyValue("--hair"); cx.lineWidth = 2; cx.beginPath(); cx.moveTo(0, y25); cx.lineTo(W, y25); cx.stroke();
      [[1, "--muted", 2], [0, "--cobalt", 4]].forEach(function (s) {
        cx.strokeStyle = cs.getPropertyValue(s[1]); cx.lineWidth = s[2]; cx.lineJoin = "round"; cx.beginPath();
        hist.forEach(function (v, i) { var x = i / N * (W - 6) + 3, y = H - v[s[0]] / mx * (H - 8); if (i) cx.lineTo(x, y); else cx.moveTo(x, y); });
        cx.stroke();
      });
    }
    $("#bPct").oninput = function () { $("#bPctV").textContent = this.value; };
    function play(side) {
      if (done) return;
      var heads = Math.random() < p, won = heads === (side === "H"), stake = bank * $("#bPct").value / 100, ks = kelly * 0.2;
      bank += won ? stake : -stake; kelly += heads ? ks : -ks; flip++; hist.push([bank, kelly]);
      $("#bBank").textContent = "$" + bank.toFixed(2); $("#bN").textContent = "Flip " + Math.min(flip + 1, N) + " of " + N;
      $("#bFb").className = "fb " + (won ? "good" : "bad"); $("#bFb").textContent = (heads ? "Heads" : "Tails") + ". " + (won ? "+" : "−") + "$" + stake.toFixed(2);
      draw();
      if (flip >= N || bank < 0.01) {
        done = true; var beat = bank >= kelly && bank > 25; credit("bet", beat || bank > 25, beat ? 40 : 10);
        $("#bH").disabled = $("#bT").disabled = true;
        $("#bEnd").innerHTML = '<div class="ex"><b>' + (bank < 0.01 ? "Busted. " : "") + "You: $" + bank.toFixed(2) + " · Kelly: $" + kelly.toFixed(2) + "</b><p>With even-money odds, the Kelly fraction is 2p − 1 = 20%. Betting much more than that lowers your long-run growth even when you have an edge, and betting on tails gives the edge away.</p></div><div class=\"row\" style=\"margin-top:12px\"><button class=\"btn\" id=\"bAgain\">Play again</button></div>";
        $("#bAgain").onclick = function () { V.bet(clearApp()); };
      }
    }
    $("#bH").onclick = function () { play("H"); }; $("#bT").onclick = function () { play("T"); };
    draw();
  };

  V.quiz = function (app) {
    var deck = shuffle(BANK.filter(function (p) { return p.type === "mc"; })).slice(0, 10), k = 0, right = 0;
    app.innerHTML = '<div class="stack"><h1>Desk Quiz</h1><p class="lede">Ten questions on options, statistics and Python, the material that comes between the brainteasers.</p></div><section class="sheet pad stack" style="max-width:820px"><div class="row between"><span class="sub num" id="qN"></span><span class="sub num" id="qR"></span></div><div id="qBox" class="stack"></div></section>';
    function load() {
      $("#qR").textContent = right + " correct";
      if (k >= deck.length) {
        $("#qN").textContent = "Quiz complete";
        $("#qBox").innerHTML = '<p class="big num">' + right + "/" + deck.length + '</p><p class="lede">' + (right >= 8 ? "Strong desk instincts." : right >= 5 ? "Solid. Read the explanations you missed and run it again." : "Worth another run. The explanations are where the learning is.") + '</p><div class="row"><button class="btn go" id="qAgain">New quiz</button><a class="btn alt" href="#bank" style="text-decoration:none">Open the Problem Bank</a></div>';
        $("#qAgain").onclick = function () { V.quiz(clearApp()); };
        return;
      }
      $("#qN").textContent = "Question " + (k + 1) + " of " + deck.length;
      problemWidget($("#qBox"), deck[k], {next: function () { k++; load(); }, onDone: function (ok) { if (ok) right++; $("#qR").textContent = right + " correct"; }});
    }
    load();
  };

  /* ---------- shared helpers for games / stats / profile ---------- */
  function ratingBar(v, label) { return '<div class="track" role="img" aria-label="' + label + " rating " + v + '"><i style="width:' + Math.max(2, Math.min(100, (v - 400) / 20)) + '%"></i></div>'; }
  function clueRows(list) {
    return '<div class="clues">' + list.map(function (g, i) { var v = S.r[g[4]]; return '<a class="clue" href="#' + g[0] + '"><span class="n">' + (i + 1) + '</span><span class="clue-b"><h3>' + g[1] + "</h3><p>" + g[2] + '</p><span class="clue-r">' + ratingBar(v, g[1]) + '<b class="num">' + v + '</b></span><span class="clue-c num">' + g[3] + '</span></span><span class="go">Play</span></a>'; }).join("") + "</div>";
  }
  function gameList() {
    return [
      ["rush", "Puzzle Rush", "Three minutes, three strikes. Problems get harder as your score climbs.", "Best " + (S.best.rush || 0), "prob"],
      ["mock", "Mock assessment", "20 mixed questions in 20 minutes, scored at the end like an online test.", S.mocks && S.mocks.length ? S.mocks.length + " taken" : "Not taken yet", "desk"],
      ["math", "Speed Math", "Two minutes of arithmetic under the clock, the way trading firms test it.", "Best " + S.best.math, "math"],
      ["market", "Make a Market", "Quote a bid and an ask on numbers you don't know. Tight and right scores.", MARKETS.length + " markets", "mm"],
      ["bet", "Betting Table", "A coin that lands heads 60% of the time. Size your bets or go broke.", "30 flips", "bet"],
      ["quiz", "Desk Quiz", "Ten rapid questions on Greeks, Python and statistics.", BANK.filter(function (q) { return q.type === "mc"; }).length + " questions", "desk"]
    ];
  }
  function bestStreak() {
    var keys = Object.keys(S.days || {}).concat(Object.keys(S.frozen || {})).filter(function (k, i, a) { return a.indexOf(k) === i; }).sort(), best = 0, run = 0, prev = null;
    keys.forEach(function (k) { var d = new Date(k + "T12:00:00"); if (prev && Math.round((d - prev) / 864e5) === 1) run++; else run = 1; if (run > best) best = run; prev = d; });
    return best;
  }
  function level(xp) { var l = Math.floor(Math.sqrt(xp / 40)) + 1; return {lvl: l, from: (l - 1) * (l - 1) * 40, to: l * l * 40}; }
  function totals() {
    var solved = Object.keys(S.solved).length, att = S.att || {}, n = 0, ok = 0, first = 0;
    for (var k in att) { n += att[k].n; ok += att[k].ok; first += att[k].first; }
    return {solved: solved, n: n, ok: ok, first: first};
  }
  function pctTxt(a, b) { return b ? Math.round(100 * a / b) + "%" : "–"; }
  function whenReady(fn) { if (document.readyState === "complete") fn(); else addEventListener("load", fn, {once: true}); }

  V.games = function (app) {
    app.innerHTML = '<div class="stack"><h1>Games</h1><p class="lede">Six formats that drill what interviews test under pressure. Each one moves its own rating.</p></div>' + clueRows(gameList()).replace('class="clues"', 'class="clues two"');
  };

  V.stats = function (app) {
    var t = totals(), lv = level(S.xp || 0), st = streak();
    /* activity: last 16 weeks, columns are weeks */
    var end = new Date(), start = new Date(end); start.setDate(end.getDate() - end.getDay() - 7 * 15);
    var heat = "", d = new Date(start), active = 0;
    while (d <= end) {
      var k = ymd(d), c = S.days[k] || 0; if (c) active++;
      heat += '<span class="hc' + (c >= 5 ? " h2" : c ? " h1" : "") + (k === today() ? " now" : "") + '" title="' + k + ": " + c + ' solved"></span>';
      d.setDate(d.getDate() + 1);
    }
    /* topic table */
    var rows = SETS.map(function (s) {
      var tot = 0, sv = 0; BANK.forEach(function (p) { if (p.set === s.id) { tot++; if (S.solved[p.key]) sv++; } });
      var a = (S.att || {})[s.id] || {n: 0, ok: 0, first: 0};
      return "<tr><th scope=\"row\">" + s.name + '</th><td class="tw"><div class="track" role="img" aria-label="' + s.name + " " + sv + " of " + tot + '"><i style="width:' + (tot ? Math.max(sv ? 1 : 0, 100 * sv / tot) : 0) + '%"></i></div></td><td class="r num">' + sv.toLocaleString() + " / " + tot.toLocaleString() + '</td><td class="r num">' + pctTxt(a.ok, a.n) + '</td><td class="r num">' + pctTxt(a.first, a.n) + "</td></tr>";
    }).join("");
    /* rating history chart */
    var rh = S.rh || {}, rk = Object.keys(rh).sort().slice(-30);
    var series = rk.map(function (k) { var r = rh[k]; return Math.round((r.math + r.prob + r.mm + r.bet + r.desk) / 5); });
    var chart;
    if (series.length < 2) chart = '<p class="callout">Your rating chart appears after two days of practice.</p>';
    else {
      var lo = Math.min.apply(null, series) - 10, hi = Math.max.apply(null, series) + 10, W = 600, Hh = 180, P = 36;
      var pts = series.map(function (v, i) { return (P + i * (W - P - 8) / (series.length - 1)).toFixed(1) + "," + (Hh - 22 - (v - lo) / (hi - lo) * (Hh - 40)).toFixed(1); });
      chart = '<svg class="chart" viewBox="0 0 ' + W + " " + Hh + '" role="img" aria-label="Average rating over your last ' + series.length + ' practice days, from ' + series[0] + " to " + series[series.length - 1] + '">' +
        '<line x1="' + P + '" y1="' + (Hh - 22) + '" x2="' + W + '" y2="' + (Hh - 22) + '" class="ax"/>' +
        '<text x="0" y="' + (Hh - 22) + '" class="lb">' + lo + '</text><text x="0" y="22" class="lb">' + hi + "</text>" +
        '<text x="' + P + '" y="' + (Hh - 4) + '" class="lb">' + rk[0].slice(5) + '</text><text x="' + (W - 40) + '" y="' + (Hh - 4) + '" class="lb">' + rk[rk.length - 1].slice(5) + "</text>" +
        '<polyline points="' + pts.join(" ") + '" class="ln"/>' +
        '<circle cx="' + pts[pts.length - 1].split(",")[0] + '" cy="' + pts[pts.length - 1].split(",")[1] + '" r="5" class="dot"/></svg>';
    }
    /* speed math runs */
    var runs = (S.runs || []).slice(-20), bars;
    if (!runs.length) bars = '<p class="callout">Play <a href="#math">Speed Math</a> to see your scores here.</p>';
    else {
      var mx = Math.max(10, Math.max.apply(null, runs.map(function (r) { return r.s; })));
      bars = '<div class="runs" role="img" aria-label="Last ' + runs.length + " Speed Math scores, best " + S.best.math + '">' + runs.map(function (r) { return '<span style="height:' + Math.max(3, 100 * r.s / mx) + '%" title="' + r.d + ": " + r.s + '"><b class="num">' + r.s + "</b></span>"; }).join("") + "</div>";
    }
    app.innerHTML =
      '<div class="stack"><h1>Your stats</h1><p class="lede">Everything you\'ve practiced, in one place. Stats are kept in this browser and sync to your account when you\'re signed in.</p></div>' +
      '<dl class="stats" style="margin:0">' +
        "<div><dt>Level</dt><dd class=\"num\">" + lv.lvl + "</dd></div>" +
        "<div><dt>Problems solved</dt><dd class=\"num\">" + t.solved.toLocaleString() + "</dd></div>" +
        "<div><dt>Accuracy</dt><dd class=\"num\">" + pctTxt(t.ok, t.n) + "</dd></div>" +
        "<div><dt>First-try rate</dt><dd class=\"num\">" + pctTxt(t.first, t.n) + "</dd></div>" +
        "<div><dt>Day streak</dt><dd class=\"num\">" + st + "</dd></div>" +
        "<div><dt>Best streak</dt><dd class=\"num\">" + bestStreak() + "</dd></div>" +
      "</dl>" +
      '<section class="sheet pad stack" aria-labelledby="lvh"><div class="row between"><h2 id="lvh">Level ' + lv.lvl + '</h2><span class="sub num">' + (S.xp || 0).toLocaleString() + " XP · " + (lv.to - (S.xp || 0)).toLocaleString() + " to level " + (lv.lvl + 1) + '</span></div><div class="track big-track"><i style="width:' + (100 * ((S.xp || 0) - lv.from) / (lv.to - lv.from)) + '%"></i></div></section>' +
      '<div class="split">' +
        '<section class="sheet pad stack" aria-labelledby="ach"><div class="row between"><h2 id="ach">Activity</h2><span class="sub num">' + active + " active days in 16 weeks</span></div><div class=\"heat\">" + heat + '</div><div class="legend"><span><i class="hk"></i>None</span><span><i class="hk h1"></i>1–4 solved</span><span><i class="hk h2"></i>5+ solved</span></div></section>' +
        '<section class="sheet pad stack" aria-labelledby="rth"><h2 id="rth">Ratings</h2><div class="stack">' + [["Probability", "prob"], ["Speed Math", "math"], ["Markets", "mm"], ["Betting", "bet"], ["Desk Quiz", "desk"]].map(function (s) { return '<div class="clue-r" style="max-width:none;grid-template-columns:110px minmax(0,1fr) 44px"><span class="sub" style="color:var(--ink);font-weight:600">' + s[0] + "</span>" + ratingBar(S.r[s[1]], s[0]) + '<b class="num">' + S.r[s[1]] + "</b></div>"; }).join("") + "</div></section>" +
      "</div>" +
      '<section class="sheet pad stack" aria-labelledby="tph"><h2 id="tph">By topic</h2><div class="scroll-x"><table class="tbl"><thead><tr><th scope="col">Topic</th><th scope="col">Progress</th><th scope="col" class="r">Solved</th><th scope="col" class="r">Accuracy</th><th scope="col" class="r">First try</th></tr></thead><tbody>' + rows + "</tbody></table></div></section>" +
      '<div class="split">' +
        '<section class="sheet pad stack" aria-labelledby="rhh"><h2 id="rhh">Rating trend</h2>' + chart + "</section>" +
        '<section class="sheet pad stack" aria-labelledby="smh"><div class="row between"><h2 id="smh">Speed Math</h2><span class="sub num">Best ' + S.best.math + "</span></div>" + bars + "</section>" +
      "</div>";
  };

  var BADGES = [
    ["First solve", "Solve your first problem.", function (t) { return t.solved >= 1; }],
    ["Ten down", "Solve 10 problems.", function (t) { return t.solved >= 10; }],
    ["Century", "Solve 100 problems.", function (t) { return t.solved >= 100; }],
    ["Five hundred", "Solve 500 problems.", function (t) { return t.solved >= 500; }],
    ["Thousand club", "Solve 1,000 problems.", function (t) { return t.solved >= 1000; }],
    ["Daily habit", "Solve a daily puzzle.", function () { for (var k in S.daily) if (S.daily[k].done) return true; return false; }],
    ["Three-peat", "Reach a 3-day streak.", function () { return bestStreak() >= 3; }],
    ["Full week", "Reach a 7-day streak.", function () { return bestStreak() >= 7; }],
    ["Iron habit", "Reach a 30-day streak.", function () { return bestStreak() >= 30; }],
    ["Quick hands", "Score 30 in Speed Math.", function () { return S.best.math >= 30; }],
    ["Calculator", "Score 50 in Speed Math.", function () { return S.best.math >= 50; }],
    ["Sharpshooter", "Get 25 answers right on the first try.", function (t) { return t.first >= 25; }],
    ["All-rounder", "Solve a problem in every topic.", function () { return SETS.every(function (s) { return BANK.some(function (p) { return p.set === s.id && S.solved[p.key]; }); }); }],
    ["Market maker", "Raise your Markets rating to 1,100.", function () { return S.r.mm >= 1100; }],
    ["Risk manager", "Raise your Betting rating to 1,100.", function () { return S.r.bet >= 1100; }],
    ["Desk ready", "Raise your Desk Quiz rating to 1,200.", function () { return S.r.desk >= 1200; }],
    ["Rusher", "Score 15 in Puzzle Rush.", function () { return (S.best.rush || 0) >= 15; }],
    ["Track finisher", "Complete a study track.", function () { return TRACKS.some(function (t) { return S["trk_" + t.id]; }); }],
    ["Comeback", "Clear 10 problems from review.", function () { return (S.cleared || 0) >= 10; }],
    ["League top 10", "Finish a weekly league in the top 10.", function () { return !!S.leagueTop10; }]
  ];

  V.profile = function (app) {
    S.profile = S.profile || {};
    var t = totals(), earned = BADGES.filter(function (b) { return b[2](t); }).length;
    var roles = {undecided: "Undecided", trader: "Quant trader", researcher: "Quant researcher", developer: "Quant developer"};
    function initials(n) { return (n || "?").trim().split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase(); }
    app.innerHTML =
      '<section class="sheet pad profile-head" aria-labelledby="pn">' +
        '<div class="avatar" id="pAv" aria-hidden="true">?</div>' +
        '<div class="stack" style="gap:6px;min-width:0"><h1 id="pn">Your profile</h1><p class="sub" id="pMeta"></p><p class="sub" id="pAcct"></p></div>' +
        '<div class="row" style="align-self:start"><button class="btn alt" id="pEditBtn">Edit profile</button></div>' +
      "</section>" +
      '<section class="sheet pad stack" id="pEdit" hidden aria-labelledby="peh"><h2 id="peh">Edit profile</h2><form class="form" id="pForm" novalidate>' +
        '<div class="fieldset"><label class="lab" for="pf-n">Display name</label><input class="field" id="pf-n" maxlength="24"></div>' +
        '<div class="fieldset"><label class="lab" for="pf-s">School (optional)</label><input class="field" id="pf-s" maxlength="80"></div>' +
        '<div class="fieldset"><label class="lab" for="pf-y">Graduation year (optional)</label><input class="field" id="pf-y" inputmode="numeric" maxlength="4" placeholder="2028"></div>' +
        '<div class="fieldset"><label class="lab" for="pf-r">Target role</label><select id="pf-r">' + Object.keys(roles).map(function (k) { return '<option value="' + k + '">' + roles[k] + "</option>"; }).join("") + "</select></div>" +
        '<div class="row"><button class="btn go" type="submit">Save profile</button><button class="btn alt" type="button" id="pCancel">Cancel</button></div><p class="fb" aria-live="polite"></p></form></section>' +
      '<dl class="stats" style="margin:0">' +
        "<div><dt>Level</dt><dd class=\"num\">" + level(S.xp || 0).lvl + "</dd></div>" +
        "<div><dt>Solved</dt><dd class=\"num\">" + t.solved.toLocaleString() + "</dd></div>" +
        "<div><dt>Best streak</dt><dd class=\"num\">" + bestStreak() + "</dd></div>" +
        "<div><dt>Badges</dt><dd class=\"num\">" + earned + " / " + BADGES.length + "</dd></div>" +
      "</dl>" +
      '<section class="sheet pad stack" aria-labelledby="bh"><div class="row between"><h2 id="bh">Badges</h2><a class="sub" href="#stats">See full stats</a></div><div class="badges">' +
        BADGES.map(function (b) { var on = b[2](t); return '<div class="badge' + (on ? " on" : "") + '"><span class="cell' + (on ? " solved" : "") + '" aria-hidden="true">' + (on ? CHECK : "") + "</span><span><b>" + b[0] + "</b><small>" + b[1] + "</small></span><span class=\"sr\">" + (on ? "Earned" : "Not yet earned") + "</span></div>"; }).join("") +
      "</div></section>";

    var signedIn = null;
    function paint() {
      var p = S.profile, nm = p.name || (signedIn && window.EdgeAuth.name(signedIn)) || "Guest";
      $("#pAv").textContent = initials(nm); $("#pn").textContent = nm;
      var bits = [roles[p.role || "undecided"]]; if (p.school) bits.push(p.school); if (p.year) bits.push("Class of " + p.year);
      bits.push("Practicing since " + new Date(S.first + "T12:00:00").toLocaleDateString(undefined, {month: "long", year: "numeric"}));
      $("#pMeta").textContent = bits.join(" · ");
      $("#pAcct").innerHTML = signedIn ? "Signed in as " + esc(signedIn.email) + '. <a href="account.html">Account settings</a>' :
        (window.EdgeAuth && window.EdgeAuth.configured ? 'Playing as a guest. <a href="login.html#signup">Create a free account</a> to sync your progress and join the leaderboard.' : "Playing as a guest. Your profile is saved in this browser.");
    }
    paint();
    whenReady(function () {
      var A = window.EdgeAuth; if (!A) return;
      A.onChange(function (u) {
        if (!document.body.contains($("#pAv"))) return;
        signedIn = u; paint();
        if (u) A.getProfile().then(function (pr) { if (!pr) return; S.profile = {name: pr.display_name, school: pr.school || "", year: pr.grad_year || "", role: pr.target_role || "undecided"}; save(); if (document.body.contains($("#pAv"))) paint(); }, function () {});
      });
    });
    $("#pEditBtn").onclick = function () {
      var p = S.profile; $("#pEdit").hidden = false;
      $("#pf-n").value = p.name || (signedIn ? window.EdgeAuth.name(signedIn) : ""); $("#pf-s").value = p.school || ""; $("#pf-y").value = p.year || ""; $("#pf-r").value = p.role || "undecided";
      $("#pf-n").focus();
    };
    $("#pCancel").onclick = function () { $("#pEdit").hidden = true; };
    $("#pForm").addEventListener("submit", function (e) {
      e.preventDefault(); var fb = this.querySelector(".fb"), nm = $("#pf-n").value.trim(), yr = $("#pf-y").value.trim();
      if (nm.length < 2) { fb.className = "fb bad"; fb.textContent = "Display name needs at least 2 characters."; return; }
      if (yr && !/^20[2-4]\d$/.test(yr)) { fb.className = "fb bad"; fb.textContent = "Enter a year between 2020 and 2049, or leave it blank."; return; }
      S.profile = {name: nm, school: $("#pf-s").value.trim(), year: yr, role: $("#pf-r").value}; save(); paint();
      function done() { fb.className = "fb good"; fb.textContent = "Profile saved."; setTimeout(function () { $("#pEdit").hidden = true; fb.textContent = ""; }, 900); }
      if (signedIn) window.EdgeAuth.saveProfile({display_name: nm, school: S.profile.school || null, grad_year: yr ? +yr : null, target_role: S.profile.role}).then(done, function (err) { fb.className = "fb bad"; fb.textContent = "Saved here, but couldn't sync: " + err.message; });
      else done();
    });
  };

  /* ================= TRAINING: review, goals, tracks, practice, rush, archive, onboarding ================= */
  var SNOW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 3 3-3M9 20l3-3 3 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg>';
  var SNOW_INLINE = '<span class="snow">' + SNOW + "</span>";
  var REVIEW_GAPS = [1, 3, 7];

  /* spaced review: misses come back after 1, 3, then 7 days */
  function schedule(p, clean) {
    S.rev = S.rev || {};
    var r = S.rev[p.key];
    if (!clean) { S.rev[p.key] = {stage: 0, due: addDays(REVIEW_GAPS[0])}; }
    else if (r && r.due <= today()) {
      r.stage++;
      if (r.stage >= REVIEW_GAPS.length) { delete S.rev[p.key]; S.cleared = (S.cleared || 0) + 1; }
      else r.due = addDays(REVIEW_GAPS[r.stage]);
    }
    save();
  }
  function dueKeys() { var t = today(), out = []; for (var k in S.rev || {}) if (S.rev[k].due <= t && BY_KEY[k]) out.push(k); return out; }
  function nextDue() { var n = null; for (var k in S.rev || {}) if (!n || S.rev[k].due < n) n = S.rev[k].due; return n; }

  function goalMeter() {
    var g = goal(), done = S.days[today()] || 0, h = "";
    for (var i = 0; i < g; i++) h += '<span class="cell' + (i < done ? " solved" : "") + '">' + (i < done ? CHECK : "") + "</span>";
    return '<div class="goal"><div class="row between"><label class="goal-l" for="goalSel"><b>Daily goal</b> <select id="goalSel">' + [3, 5, 10, 15].map(function (n) { return '<option value="' + n + '"' + (n === g ? " selected" : "") + ">" + n + "</option>"; }).join("") + '</select></label><span class="sub num">' + Math.min(done, g) + " / " + g + (done >= g ? " · done" : "") + '</span></div><div class="goal-cells" style="grid-template-columns:repeat(' + g + ',minmax(0,1fr))" role="img" aria-label="' + Math.min(done, g) + " of " + g + ' solved today">' + h + "</div></div>";
  }

  /* ---------- study tracks ---------- */
  function fam(f, n) { var all = BANK.filter(function (p) { return p.key.indexOf(f + "-") === 0; }); var step = Math.max(1, Math.floor(all.length / n)), out = []; for (var i = 0; i < all.length && out.length < n; i += step) out.push(all[i].key); return out; }
  function classic(set, lo, hi) { return CLASSIC.filter(function (p) { return p.set === set && p.diff >= lo && p.diff <= hi; }).map(function (p) { return p.key; }); }
  var TRACKS = [
    {id: "prob101", name: "Probability 101", blurb: "Dice, coins, urns, conditioning and expected value: the core of every quant interview.",
      keys: classic("prob", 1, 1).concat(fam("dieuntil", 2), fam("atleast", 2), fam("dicesum", 2), fam("bagsame", 2), fam("binfair", 2), fam("geom", 2), fam("bayes", 2), classic("prob", 2, 2).slice(0, 8))},
    {id: "trader", name: "Trader test prep", blurb: "Fast arithmetic, estimation and quick logic, like the online tests trading firms send first.",
      keys: fam("mul2", 5).concat(fam("pctof", 4), fam("tofrac", 4), fam("square", 4), fam("clock", 3), fam("zeros", 3), fam("lastdigit", 3), classic("brain", 1, 1))},
    {id: "options", name: "Options foundations", blurb: "Payoffs, parity, Greeks and quick pricing approximations.",
      keys: classic("options", 1, 1).concat(fam("straddleup", 2), fam("parityp", 3), fam("hedgec", 3), classic("options", 2, 2), fam("atm", 3), fam("gammapnl", 2), classic("options", 3, 3), fam("bs", 2))},
    {id: "stats", name: "Stats & regression", blurb: "Variance rules, sampling, correlation, regression and the normal distribution.",
      keys: classic("stats", 1, 1).concat(fam("varlin", 3), fam("se", 3), fam("corr", 3), fam("ztail", 3), classic("stats", 2, 3), fam("beta", 3), fam("portvol", 3), fam("sharpe", 2))},
    {id: "python", name: "Python gotchas", blurb: "The floor division, aliasing and complexity questions coding rounds love.",
      keys: classic("code", 1, 1).concat(fam("pyfloor", 4), fam("pymod", 4), fam("pyrange", 4), classic("code", 2, 3), fam("popcount", 3))},
    {id: "superday", name: "Superday hard set", blurb: "The hardest problems in the bank. Save these for the week before onsites.",
      keys: classic("prob", 3, 3).concat(classic("brain", 3, 3), fam("ruinbias", 3), fam("reroll", 3), fam("dicemax", 3), fam("runbias", 3), fam("expmax", 2), fam("stairs3", 2))}
  ];
  TRACKS.forEach(function (t) { var seen = {}; t.keys = t.keys.filter(function (k) { if (seen[k] || !BY_KEY[k]) return false; seen[k] = true; return true; }); });
  function trackById(id) { for (var i = 0; i < TRACKS.length; i++) if (TRACKS[i].id === id) return TRACKS[i]; return null; }
  function trackDone(t) { return t.keys.filter(function (k) { return S.solved[k]; }).length; }

  function planSection(bare) {
    var due = dueKeys().length, tr = trackById(S.curTrack) || null, items = [];
    items.push(['<a class="plan" href="#review"><span class="n' + (due ? " hot" : "") + '">' + due + '</span><span><h3>Review</h3><p>' + (due ? due + " missed problem" + (due > 1 ? "s are" : " is") + " due for another try." : "Nothing due. Missed problems come back after 1, 3 and 7 days.") + "</p></span></a>"]);
    if (tr) { var d = trackDone(tr); items.push(['<a class="plan" href="#track-' + tr.id + '"><span class="n">' + Math.round(100 * d / tr.keys.length) + '%</span><span><h3>Continue: ' + tr.name + "</h3><p>" + d + " of " + tr.keys.length + " done.</p></span></a>"]); }
    else items.push(['<a class="plan" href="#tracks"><span class="n">6</span><span><h3>Pick a study track</h3><p>Ordered problem sets from Probability 101 to the Superday hard set.</p></span></a>']);
    items.push(['<a class="plan" href="#practice"><span class="n">' + dots(targetDiff(S.r.prob)) + '</span><span><h3>Practice at your level</h3><p>Unsolved problems matched to your ratings.</p></span></a>']);
    items.push(['<a class="plan" href="#rush"><span class="n">' + (S.best.rush || 0) + '</span><span><h3>Puzzle Rush</h3><p>3 minutes, 3 strikes, harder as you go. Best: ' + (S.best.rush || 0) + ".</p></span></a>"]);
    var wk = ensureWeek(), resetIn = Math.ceil((Date.parse(wk.start + "T00:00:00Z") + 7 * 864e5 - Date.now()) / 864e5);
    items.push(['<a class="plan" href="leaderboard.html"><span class="n">' + wk.xp + '</span><span><h3>Weekly league</h3><p>' + wk.xp + " XP this week. Resets in " + resetIn + " day" + (resetIn === 1 ? "" : "s") + ".</p></span></a>"]);
    var grid = '<div class="plans">' + items.join("") + "</div>"; if (bare) return grid; return '<section class="stack" aria-labelledby="ph"><div class="row between"><h2 id="ph">Your plan</h2><a class="sub" href="#train">All training</a></div>' + grid + "</section>";
  }

  /* ---------- training hub ---------- */
  V.train = function (app) {
    app.innerHTML = '<div class="stack"><h1>Train</h1><p class="lede">Structured practice: review what you missed, follow a study track, or drill at your level.</p></div>' + planSection(true) +
      '<section class="stack" aria-labelledby="tt"><div class="row between"><h2 id="tt">Study tracks</h2><a class="sub" href="#tracks">All tracks</a></div>' + trackList() + "</section>" +
      '<section class="stack" aria-labelledby="ts"><h2 id="ts">More ways to train</h2><div class="plans">' +
        '<a class="plan" href="#saved"><span class="n">' + Object.keys(S.saved || {}).length + '</span><span><h3>Saved problems</h3><p>Problems you bookmarked, with your notes.</p></span></a>' +
        '<a class="plan" href="#mock"><span class="n">' + (S.mocks && S.mocks.length ? Math.max.apply(null, S.mocks.map(function (m) { return Math.round(100 * m.score / m.total); })) + "%" : "–") + '</span><span><h3>Mock assessment</h3><p>20 questions, 20 minutes, no feedback until the end.</p></span></a>' +
      "</div></section>" +
      '<section class="stack" aria-labelledby="ta"><div class="row between"><h2 id="ta">Daily archive</h2><a class="sub" href="#archive">Open archive</a></div><p class="sub">Missed a day? Every past daily puzzle is playable in the archive.</p></section>';
  };
  function trackList() {
    return '<div class="clues two">' + TRACKS.map(function (t, i) {
      var d = trackDone(t), pc = Math.round(100 * d / t.keys.length);
      return '<a class="clue" href="#track-' + t.id + '"><span class="n">' + (i + 1) + '</span><span class="clue-b"><h3>' + t.name + "</h3><p>" + t.blurb + '</p><span class="clue-r"><div class="track" role="img" aria-label="' + pc + '% complete"><i style="width:' + pc + '%"></i></div><b class="num">' + pc + '%</b></span><span class="clue-c num">' + d + " of " + t.keys.length + ' done</span></span><span class="go">' + (d ? "Continue" : "Start") + "</span></a>";
    }).join("") + "</div>";
  }
  V.tracks = function (app) {
    app.innerHTML = '<div class="stack"><h1>Study tracks</h1><p class="lede">Ordered sets that build from warm-ups to interview level. Your progress counts toward the Problem Bank too.</p></div>' + trackList();
  };
  V.track = function (app, id) {
    var t = trackById(id); if (!t) { location.hash = "#tracks"; return; }
    S.curTrack = t.id; save();
    var cur = null;
    app.innerHTML = '<div class="stack"><p class="sub"><a href="#tracks">Study tracks</a></p><h1>' + t.name + '</h1><p class="lede">' + t.blurb + "</p></div>" +
      '<div class="split"><section class="sheet pad stack" aria-label="Track problems"><div class="row between"><b id="tProg"></b><button class="btn go" id="tCont">Continue</button></div><div class="track big-track"><i id="tBar"></i></div><div class="bank" id="tGrid"></div></section>' +
      '<section class="sheet pad stack" id="tPane" aria-live="polite"></section></div>';
    function draw() {
      var d = trackDone(t);
      $("#tProg").textContent = d + " of " + t.keys.length + " done";
      $("#tBar").style.width = (100 * d / t.keys.length) + "%";
      $("#tGrid").innerHTML = t.keys.map(function (k, i) { var s = S.solved[k]; return '<button class="cell' + (s ? " solved" : "") + (cur === k ? " on" : "") + '" data-k="' + k + '" aria-label="Step ' + (i + 1) + (s ? ", solved" : "") + '"><sup>' + (i + 1) + "</sup>" + (s ? CHECK : "") + "</button>"; }).join("");
      if (d === t.keys.length && !S["trk_" + t.id]) { S["trk_" + t.id] = true; save(); toast("Track complete: " + t.name + "!"); }
    }
    function nextKey(after) { var i0 = after ? t.keys.indexOf(after) + 1 : 0; for (var i = 0; i < t.keys.length; i++) { var k = t.keys[(i0 + i) % t.keys.length]; if (!S.solved[k]) return k; } return null; }
    function open(k, scroll) {
      cur = k; draw();
      if (!k) { $("#tPane").innerHTML = '<h2>Track complete</h2><p class="lede">You solved every problem in ' + t.name + '.</p><div class="row"><a class="btn go" href="#tracks" style="text-decoration:none">Pick another track</a></div>'; return; }
      problemWidget($("#tPane"), BY_KEY[k], {next: function () { open(nextKey(k), true); }, onDone: function () { draw(); }});
      if (scroll && innerWidth < 900) $("#tPane").scrollIntoView({behavior: "smooth", block: "start"});
    }
    $("#tCont").onclick = function () { open(nextKey(cur), true); };
    app.addEventListener("click", function (e) { var b = e.target.closest("[data-k]"); if (b) open(b.dataset.k, true); });
    open(nextKey(null));
  };

  /* ---------- adaptive practice ---------- */
  function targetDiff(r) { return r < 1060 ? 1 : r < 1260 ? 2 : 3; }
  V.practice = function (app) {
    var topic = S.pTopic || "mix";
    app.innerHTML = '<div class="stack"><h1>Practice at your level</h1><p class="lede">Unsolved problems picked to match your current rating in each topic. Get them right and they get harder.</p></div>' +
      '<section class="sheet pad stack" style="max-width:860px"><div class="filters" role="group" aria-label="Topic"><button class="chip" data-t="mix">Mix</button>' + SETS.map(function (s) { return '<button class="chip" data-t="' + s.id + '">' + s.name + "</button>"; }).join("") + '</div><p class="sub" id="pWhy"></p><div id="pBox" class="stack"></div></section>';
    function chips() { $$("[data-t]").forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.t === topic); }); }
    function pick() {
      var set = topic;
      if (set === "mix") set = SETS[Math.floor(Math.random() * SETS.length)].id;
      var skill = skillOf({set: set}), r = S.r[skill], dt = targetDiff(r);
      var pool = BANK.filter(function (p) { return p.set === set && !S.solved[p.key] && p.diff === dt; });
      if (!pool.length) pool = BANK.filter(function (p) { return p.set === set && !S.solved[p.key]; });
      if (!pool.length) { $("#pBox").innerHTML = '<p class="callout">You\'ve solved every ' + setName(set) + " problem. Impressive. Pick another topic.</p>"; return; }
      var p = pool[Math.floor(Math.random() * pool.length)];
      $("#pWhy").textContent = setName(set) + " · your rating " + r + " → " + ["", "Warm-up", "Interview", "Hard"][p.diff] + " level";
      problemWidget($("#pBox"), p, {next: pick});
    }
    app.addEventListener("click", function (e) { var c = e.target.closest("[data-t]"); if (c) { topic = S.pTopic = c.dataset.t; save(); chips(); pick(); } });
    chips(); pick();
  };

  /* ---------- review queue ---------- */
  V.review = function (app) {
    app.innerHTML = '<div class="stack"><h1>Review</h1><p class="lede">Problems you missed come back after 1 day, then 3, then 7. Solve one cleanly on its due day and it moves to the next step; miss it and it starts over.</p></div><section class="sheet pad stack" style="max-width:860px" id="rBox" aria-live="polite"></section>';
    function next() {
      var due = dueKeys(), box = $("#rBox");
      if (!due.length) {
        var nd = nextDue(), pend = Object.keys(S.rev || {}).length;
        box.innerHTML = "<h2>All caught up</h2><p class=\"lede\">" + (pend ? pend + " problem" + (pend > 1 ? "s are" : " is") + " scheduled. Next review: " + new Date(nd + "T12:00:00").toLocaleDateString(undefined, {weekday: "long", month: "short", day: "numeric"}) + "." : "Nothing scheduled yet. Any problem you miss will show up here for another try.") + "</p><p class=\"sub\">Cleared from review so far: " + (S.cleared || 0) + '</p><div class="row"><a class="btn go" href="#practice" style="text-decoration:none">Practice at your level</a></div>';
        return;
      }
      var k = due[0], r = S.rev[k];
      box.innerHTML = '<div class="row between"><b>' + due.length + ' due</b><span class="sub">Step ' + (r.stage + 1) + " of 3</span></div><div id=\"rP\" class=\"stack\"></div>";
      problemWidget($("#rP"), BY_KEY[k], {next: next});
    }
    next();
  };

  /* ---------- puzzle rush ---------- */
  var NO_RUSH = ["bs", "atm", "portvol", "ruinbias", "binbias", "poisson", "bday", "bdaypairs", "suit", "dicemax", "reroll", "runbias", "expmax", "coupon", "distinct", "sharpe", "ntail", "ztail", "words", "ace", "atleast", "bayes", "lcm"];
  var RUSH = BANK.filter(function (p) { return p.type === "num" && NO_RUSH.indexOf(p.key.split("-")[0]) < 0; });
  V.rush = function (app) {
    var score = 0, strikes = 0, left = 180, cur = null, on = false, log = [];
    app.innerHTML = '<div class="stack"><h1>Puzzle Rush</h1><p class="lede">Three minutes. Problems get harder as your score climbs. Three wrong answers and the run ends. One try per problem.</p></div>' +
      '<section class="sheet pad stack" style="max-width:820px">' +
        '<div class="row between"><div><span class="sub">Time</span><div class="big num" id="rT">3:00</div></div><div class="strikes" id="rX" aria-label="Strikes"></div><div style="text-align:right"><span class="sub">Score</span><div class="big num" id="rS" style="color:var(--cobalt)">0</div></div></div>' +
        '<div class="timebar"><i id="rBar" style="width:100%"></i></div>' +
        '<p class="meta" id="rMeta"></p><p class="today-q" id="rQ">Ready when you are.</p>' +
        '<div class="row"><label class="sr" for="rA">Your answer</label><input class="field" id="rA" autocomplete="off" inputmode="decimal" placeholder="Answer, then Enter" disabled><button class="btn go" id="rGo">Start</button></div>' +
        '<p class="fb" id="rFb" aria-live="polite"></p><p class="sub num">Personal best: ' + (S.best.rush || 0) + '</p><div id="rLog"></div>' +
      "</section>";
    function strikesHtml() { var h = ""; for (var i = 0; i < 3; i++) h += '<span class="cell' + (i < strikes ? " black" : "") + '"></span>'; $("#rX").innerHTML = h; }
    function next() {
      var lv = score < 5 ? 1 : score < 12 ? 2 : 3;
      var pool = RUSH.filter(function (p) { return p.diff === lv; });
      cur = pool[Math.floor(Math.random() * pool.length)];
      $("#rQ").textContent = cur.q; $("#rMeta").textContent = setName(cur.set) + " · " + ["", "Warm-up", "Interview", "Hard"][cur.diff];
      $("#rA").value = ""; $("#rA").focus();
    }
    function end() {
      on = false; clearTimers(); $("#rA").disabled = true; var g = $("#rGo"); g.textContent = "Play again"; g.disabled = false;
      var pb = score > (S.best.rush || 0); if (pb) S.best.rush = score;
      S.rushRuns = (S.rushRuns || []).concat([{d: today(), s: score}]).slice(-60);
      credit(null, score > 0, score * 3);
      $("#rQ").textContent = (pb ? "New best: " : "Run over. Score: ") + score;
      $("#rMeta").textContent = "";
      $("#rLog").innerHTML = log.length ? '<div class="ex"><b>Missed this run</b>' + log.map(function (m) { return "<p>" + esc(m.q) + " <b>Answer: " + esc(fmt(m.a)) + "</b></p>"; }).join("") + "</div>" : "";
    }
    function submit() {
      if (!on) return;
      var v = parseNum($("#rA").value); if (isNaN(v)) return;
      if (close(v, cur)) { score++; $("#rS").textContent = score; $("#rFb").className = "fb good"; $("#rFb").textContent = "Correct."; S.solved[cur.key] = true; }
      else { strikes++; strikesHtml(); log.push(cur); schedule(cur, false); $("#rFb").className = "fb bad"; $("#rFb").textContent = "Wrong. Answer: " + fmt(cur.a); if (strikes >= 3) return end(); }
      next();
    }
    $("#rGo").onclick = function () {
      if (on) return submit();
      score = 0; strikes = 0; left = 180; log = []; on = true; strikesHtml(); $("#rS").textContent = 0; $("#rFb").textContent = ""; $("#rLog").innerHTML = "";
      $("#rA").disabled = false; this.textContent = "Submit"; next();
      timers.push(setInterval(function () { left--; $("#rT").textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0"); $("#rBar").style.width = (left / 180 * 100) + "%"; if (left <= 0) end(); }, 1000));
    };
    $("#rA").addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
    strikesHtml();
  };

  /* ---------- daily archive ---------- */
  V.archive = function (app) {
    var start = new Date(2026, 9, 1), end = new Date(), list = [];
    for (var d = new Date(start); ymd(d) < ymd(end); d.setDate(d.getDate() + 1)) list.push(ymd(d));
    list.reverse();
    S.arch = S.arch || {};
    app.innerHTML = '<div class="stack"><h1>Daily archive</h1><p class="lede">Every past daily puzzle. Archive solves count toward your goal and the bank, but not toward that day\'s streak.</p></div>' +
      '<div class="split"><section class="sheet pad stack" aria-label="Past puzzles">' + (list.length ? '<div class="bank arch" id="aGrid"></div><div class="legend"><span><i class="hk h2"></i>Solved</span><span><i class="hk"></i>Not yet</span></div>' : '<p class="callout">The archive starts filling tomorrow. Today\'s puzzle is on the <a href="#today">Today</a> page.</p>') + "</section>" +
      '<section class="sheet pad stack" id="aPane" aria-live="polite"><p class="sub">Pick a date to play that day\'s puzzle.</p></section></div>';
    if (!list.length) return;
    function status(k) { var dd = S.daily[k]; return (dd && dd.done) || S.arch[k] ? "solved" : ""; }
    function draw(sel) {
      $("#aGrid").innerHTML = list.map(function (k) { var dt = new Date(k + "T12:00:00"); return '<button class="cell ' + status(k) + (sel === k ? " on" : "") + '" data-d="' + k + '" aria-label="' + dt.toDateString() + (status(k) ? ", solved" : "") + '"><sup>' + dt.toLocaleDateString(undefined, {month: "short"}) + " " + dt.getDate() + "</sup>" + (status(k) ? CHECK : "") + "</button>"; }).join("");
    }
    draw();
    app.addEventListener("click", function (e) {
      var b = e.target.closest("[data-d]"); if (!b) return;
      var k = b.dataset.d, p = dailyFor(new Date(k + "T12:00:00")); draw(k);
      $("#aPane").innerHTML = '<h2>' + new Date(k + "T12:00:00").toLocaleDateString(undefined, {weekday: "long", month: "long", day: "numeric"}) + '</h2><div id="aP" class="stack"></div>';
      problemWidget($("#aP"), p, {daily: true, onDone: function (ok) { if (ok) { S.arch[k] = true; save(); draw(k); } }});
      if (innerWidth < 900) $("#aPane").scrollIntoView({behavior: "smooth", block: "start"});
    });
  };

  /* ---------- onboarding ---------- */
  V.start = function (app) {
    var picks = [CLASSIC.filter(function (p) { return p.set === "prob" && p.diff === 1 && p.type === "num"; })[0], BY_KEY["mul2-20"], CLASSIC.filter(function (p) { return p.set === "prob" && p.diff === 2; })[0], CLASSIC.filter(function (p) { return p.set === "options" && p.diff === 1; })[0], CLASSIC.filter(function (p) { return p.set === "brain" && p.diff === 3; })[0]].filter(Boolean);
    var right = 0, step = 0;
    S.profile = S.profile || {};
    function done() {
      S.onboarded = true;
      var shift = (right - 2) * 60; S.r.prob = 1000 + shift; S.r.desk = 1000 + Math.round(shift / 2); S.r.math = 1000 + Math.round(shift / 2);
      var rec = S.profile.role === "trader" ? "trader" : S.profile.role === "developer" ? "python" : right >= 4 ? "superday" : "prob101";
      save();
      var t = trackById(rec);
      app.innerHTML = '<section class="sheet pad stack onboard"><h1>You\'re set.</h1><p class="lede">You got ' + right + " of " + picks.length + " placement questions right. Your starting ratings are set, and your daily goal is " + goal() + " problems.</p>" +
        '<div class="callout"><b>Recommended track: ' + t.name + "</b><br>" + t.blurb + '</div><div class="row"><a class="btn go big-btn" href="#track-' + t.id + '">Start ' + t.name + '</a><a class="btn alt big-btn" href="#today">Go to today\'s puzzle</a></div></section>';
    }
    function render() {
      if (step === 0) {
        app.innerHTML = '<section class="sheet pad stack onboard" aria-labelledby="ob"><span class="sub">Step 1 of 3</span><h1 id="ob">What are you preparing for?</h1><p class="lede">We\'ll suggest a study track that fits.</p><div class="opts" id="obOpts">' +
          [["trader", "Quant trader", "Mental math, markets and quick probability"], ["researcher", "Quant researcher", "Probability, statistics and harder puzzles"], ["developer", "Quant developer", "Coding, complexity and core probability"], ["undecided", "Not sure yet", "A bit of everything"]].map(function (o, i) { return '<button class="opt" data-v="' + o[0] + '"><span class="k">' + "ABCD"[i] + "</span><span><b>" + o[1] + "</b><br><small class=\"sub\">" + o[2] + "</small></span></button>"; }).join("") +
          '</div><p><a href="#today" id="obSkip" class="sub">Skip setup</a></p></section>';
        $("#obOpts").onclick = function (e) { var b = e.target.closest("[data-v]"); if (!b) return; S.profile.role = b.dataset.v; step = 1; render(); };
      } else if (step === 1) {
        app.innerHTML = '<section class="sheet pad stack onboard" aria-labelledby="ob"><span class="sub">Step 2 of 3</span><h1 id="ob">Pick a daily goal</h1><p class="lede">How many problems a day? You can change this later on the Today page.</p><div class="opts" id="obOpts">' +
          [[3, "Casual", "About 10 minutes a day"], [5, "Regular", "About 20 minutes a day"], [10, "Intense", "Recruiting season mode"]].map(function (o, i) { return '<button class="opt" data-v="' + o[0] + '"><span class="k">' + o[0] + "</span><span><b>" + o[1] + "</b><br><small class=\"sub\">" + o[2] + "</small></span></button>"; }).join("") + "</div></section>";
        $("#obOpts").onclick = function (e) { var b = e.target.closest("[data-v]"); if (!b) return; S.goal = +b.dataset.v; save(); step = 2; render(); };
      } else {
        var i = step - 2;
        if (i >= picks.length) return done();
        app.innerHTML = '<section class="sheet pad stack onboard"><span class="sub">Step 3 of 3 · Placement ' + (i + 1) + " of " + picks.length + '</span><div id="obP" class="stack"></div></section>';
        problemWidget($("#obP"), picks[i], {next: function () { step++; render(); }, onDone: function (ok, tries) { if (ok && tries <= 1) right++; }});
      }
    }
    app.addEventListener("click", function (e) { if (e.target.id === "obSkip") { S.onboarded = true; save(); } });
    render();
  };


  /* ---------- mock assessment ---------- */
  V.mock = function (app) {
    var DUR = 20 * 60, qs = [], ans = {}, cur = 0, left = DUR, running = false, started = 0;
    function pickSet(pred, n) { return shuffle(BANK.filter(pred)).slice(0, n); }
    function build() {
      var quick = ["mul2", "pctof", "tofrac", "square"];
      qs = [].concat(
        pickSet(function (p) { return p.set === "mental" && quick.indexOf(p.key.split("-")[0]) >= 0; }, 5).map(function (p) { return {p: p, sec: "Mental math"}; }),
        pickSet(function (p) { return p.key.indexOf("seq-") === 0 && p.diff <= 2; }, 4).map(function (p) { return {p: p, sec: "Sequences"}; }),
        pickSet(function (p) { return p.set === "prob" && p.type === "num" && p.diff <= 2 && NO_RUSH.indexOf(p.key.split("-")[0]) < 0; }, 6).map(function (p) { return {p: p, sec: "Probability"}; }),
        pickSet(function (p) { return p.type === "mc"; }, 5).map(function (p) { return {p: p, sec: "Options, stats & code"}; })
      );
    }
    function intro() {
      var hist = (S.mocks || []).slice(-5).reverse();
      app.innerHTML = '<div class="stack"><h1>Mock assessment</h1><p class="lede">20 questions in 20 minutes: mental math, number sequences, probability, and options, stats and code. Like a real online test, you won\'t see whether you\'re right until you submit. Skip freely and come back.</p></div>' +
        '<section class="sheet pad stack" style="max-width:760px"><dl class="stats" style="margin:0"><div><dt>Questions</dt><dd class="num">20</dd></div><div><dt>Time</dt><dd class="num">20:00</dd></div><div><dt>Best score</dt><dd class="num">' + (hist.length ? Math.max.apply(null, (S.mocks || []).map(function (m) { return m.score; })) + "/20" : "–") + "</dd></div></dl>" +
        '<div class="row"><button class="btn go big-btn" id="mkGo">Start the test</button></div>' +
        (hist.length ? '<div class="scroll-x"><table class="tbl"><thead><tr><th scope="col">Date</th><th scope="col" class="r">Score</th><th scope="col" class="r">Time used</th></tr></thead><tbody>' + hist.map(function (m) { return "<tr><td>" + m.d + '</td><td class="r">' + m.score + "/" + m.total + '</td><td class="r">' + Math.floor(m.secs / 60) + ":" + String(m.secs % 60).padStart(2, "0") + "</td></tr>"; }).join("") + "</tbody></table></div>" : "") + "</section>";
      $("#mkGo").onclick = start;
    }
    function start() {
      build(); ans = {}; cur = 0; left = DUR; running = true; started = Date.now();
      app.innerHTML = '<section class="sheet pad stack mock" aria-label="Mock assessment">' +
        '<div class="row between"><b id="mkPos"></b><span class="big num mk-t" id="mkT">20:00</span></div><div class="timebar"><i id="mkBar" style="width:100%"></i></div>' +
        '<div class="bank mk-nav" id="mkNav" aria-label="Questions"></div>' +
        '<p class="meta" id="mkSec"></p><p class="today-q" id="mkQ"></p><div id="mkA"></div>' +
        '<div class="row between"><div class="row"><button class="btn alt" id="mkPrev">Previous</button><button class="btn" id="mkNext">Next</button></div><button class="btn go" id="mkSubmit">Submit test</button></div>' +
        '<div id="mkConfirm" class="callout" hidden><p id="mkLeft"></p><div class="row" style="margin-top:10px"><button class="btn go" id="mkYes">Submit now</button><button class="btn alt" id="mkNo">Keep working</button></div></div></section>';
      timers.push(setInterval(function () { left--; $("#mkT").textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0"); $("#mkBar").style.width = (100 * left / DUR) + "%"; if (left <= 0) finish(); }, 1000));
      $("#mkPrev").onclick = function () { saveCur(); show(cur - 1); };
      $("#mkNext").onclick = function () { saveCur(); show(cur + 1); };
      $("#mkSubmit").onclick = function () { saveCur(); var blank = qs.length - Object.keys(ans).length; if (!blank) return finish(); $("#mkLeft").textContent = blank + " question" + (blank > 1 ? "s are" : " is") + " unanswered."; $("#mkConfirm").hidden = false; };
      $("#mkYes").onclick = finish; $("#mkNo").onclick = function () { $("#mkConfirm").hidden = true; };
      $("#mkNav").onclick = function (e) { var b = e.target.closest("[data-q]"); if (b) { saveCur(); show(+b.dataset.q); } };
      show(0);
    }
    function nav() { $("#mkNav").innerHTML = qs.map(function (q, i) { var a = ans[i] != null && ans[i] !== ""; return '<button class="cell' + (a ? " answered" : "") + (i === cur ? " on" : "") + '" data-q="' + i + '" aria-label="Question ' + (i + 1) + (a ? ", answered" : "") + '"><sup>' + (i + 1) + "</sup></button>"; }).join(""); }
    function saveCur() { var q = qs[cur]; if (!q || q.p.type !== "num") return; var v = $("#mkInp"); if (v) { if (v.value.trim()) ans[cur] = v.value.trim(); else delete ans[cur]; } }
    function show(i) {
      cur = Math.max(0, Math.min(qs.length - 1, i)); var q = qs[cur], p = q.p;
      $("#mkPos").textContent = "Question " + (cur + 1) + " of " + qs.length; $("#mkSec").textContent = q.sec; $("#mkQ").textContent = p.q;
      if (p.type === "num") {
        $("#mkA").innerHTML = '<label class="sr" for="mkInp">Your answer</label><input class="field" id="mkInp" autocomplete="off" inputmode="decimal" placeholder="Answer, then Enter for next">';
        $("#mkInp").value = ans[cur] || ""; $("#mkInp").focus();
        $("#mkInp").onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); saveCur(); if (cur < qs.length - 1) show(cur + 1); else { nav(); } } };
      } else {
        $("#mkA").innerHTML = '<div class="opts">' + p.opts.map(function (o, k) { return '<button class="opt' + (ans[cur] === k ? " picked" : "") + '" data-k="' + k + '"><span class="k">' + "ABCD"[k] + "</span>" + esc(o) + "</button>"; }).join("") + "</div>";
        $("#mkA").onclick = function (e) { var b = e.target.closest("[data-k]"); if (!b) return; ans[cur] = +b.dataset.k; $$(".opt", $("#mkA")).forEach(function (o) { o.classList.toggle("picked", o === b); }); nav(); };
      }
      $("#mkPrev").disabled = cur === 0; $("#mkNext").disabled = cur === qs.length - 1;
      nav();
    }
    function finish() {
      if (!running) return; running = false; clearTimers(); saveCur();
      var secs = Math.min(DUR, Math.round((Date.now() - started) / 1000)), score = 0, bySec = {};
      var rows = qs.map(function (q, i) {
        var p = q.p, a = ans[i], ok = false;
        if (a != null && a !== "") ok = p.type === "num" ? (!isNaN(parseNum(a)) && close(parseNum(a), p)) : a === p.a;
        var s = bySec[q.sec] = bySec[q.sec] || {n: 0, ok: 0}; s.n++;
        if (ok) { score++; s.ok++; var firstTime = !S.solved[p.key]; S.solved[p.key] = true; credit(skillOf(p), true, firstTime ? 8 : 2); }
        else if (a != null && a !== "") schedule(p, false);
        return {p: p, a: a, ok: ok};
      });
      S.mocks = (S.mocks || []).concat([{d: today(), score: score, total: qs.length, secs: secs}]).slice(-50); save();
      app.innerHTML = '<div class="stack"><h1>Score: ' + score + "/" + qs.length + '</h1><p class="lede">Time used ' + Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0") + ". Questions you answered wrong were added to your review queue.</p></div>" +
        '<dl class="stats" style="margin:0">' + Object.keys(bySec).map(function (k) { return "<div><dt>" + k + '</dt><dd class="num">' + bySec[k].ok + "/" + bySec[k].n + "</dd></div>"; }).join("") + "</dl>" +
        '<section class="sheet pad stack"><h2>Review your answers</h2><ol class="mk-review">' + rows.map(function (r) {
          var p = r.p, given = r.a == null || r.a === "" ? "No answer" : (p.type === "mc" ? p.opts[r.a] : r.a);
          return '<li class="' + (r.ok ? "ok" : "miss") + '"><p class="q">' + esc(p.q) + '</p><p><span class="tag-' + (r.ok ? "ok" : "miss") + '">' + (r.ok ? "Correct" : "Missed") + "</span> Your answer: <b>" + esc(given) + "</b>" + (r.ok ? "" : " · Correct: <b>" + esc(p.type === "num" ? fmt(p.a) : p.opts[p.a]) + "</b>") + "</p>" + (r.ok ? "" : '<p class="sub">' + esc(p.ex) + "</p>") + "</li>";
        }).join("") + '</ol><div class="row"><button class="btn go" id="mkAgain">Take another test</button><a class="btn alt" href="#review" style="text-decoration:none">Go to review</a></div></section>';
      $("#mkAgain").onclick = function () { V.mock(clearApp()); };
      scrollTo(0, 0);
    }
    intro();
  };

  /* ---------- router ---------- */
  function clearApp() { clearTimers(); var app = $("#app"), fresh = app.cloneNode(false); app.parentNode.replaceChild(fresh, app); return fresh; }
  function route() {
    var id = (location.hash || "#today").slice(1), arg = null;
    if (!S.onboarded && Object.keys(S.solved).length) { S.onboarded = true; save(); }
    if (!S.onboarded && (id === "today" || id === "")) id = "start";
    if (id.indexOf("track-") === 0) { arg = id.slice(6); id = "track"; }
    if (id === "saved") { arg = "saved"; id = "bank"; }
    if (!V[id]) id = "today";
    var navId = ["math", "market", "bet", "quiz", "rush", "mock"].indexOf(id) >= 0 ? "games" : ["practice", "review", "tracks", "track", "archive"].indexOf(id) >= 0 ? "train" : id;
    $$(".nav a").forEach(function (a) { if (a.getAttribute("href") === "#" + navId) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    var app = clearApp(); V[id](app, arg); scrollTo(0, 0);
  }
  addEventListener("hashchange", route);
  hud(); route();

  if (!S.noticed) { $("#notice").hidden = false; }
  $("#noticeOk").onclick = function () { S.noticed = true; save(); $("#notice").hidden = true; };
})();
