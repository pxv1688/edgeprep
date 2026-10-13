/* Edge landing page: the headline board, 1 Across with a 30-second clock, the topic sampler and email signup. */
(function () {
  "use strict";
  var CL = window.EDGE_BANK, ALL = CL.concat(window.EDGE_GENERATED || []), SETS = window.EDGE_SETS;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  function parse(s) { s = String(s).trim().replace(/,/g, "").replace(/\s+/g, ""); if (!s) return NaN; var m = s.match(/^(-?[\d.]+)\/([\d.]+)$/); if (m) return +m[1] / +m[2]; if (/%$/.test(s)) return parseFloat(s) / 100; return Number(s); }
  function close(v, p) { if (p.exact) return Math.abs(v - p.a) < 1e-9; return Math.abs(v - p.a) <= Math.max(p.abs != null ? p.abs : 0.0005, Math.abs(p.a) * (p.tol != null ? p.tol : 0.01)); }
  function fmt(x) { if (Number.isInteger(x)) return x.toLocaleString(); for (var d = 2; d <= 70000; d++) { var n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-12) return n + "/" + d + (d > 12 ? " ≈ " + (+x.toPrecision(4)) : ""); } return String(+x.toPrecision(4)); }
  function setName(id) { for (var i = 0; i < SETS.length; i++) if (SETS[i].id === id) return SETS[i].name; return id; }
  function diffName(d) { return ["", "Warm-up", "Interview", "Hard"][d]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.random() * (i + 1) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function exHTML(p) {
    return "<b>Answer: " + esc(p.type === "num" ? fmt(p.a) : p.opts[p.a]) + "</b><p>" + esc(p.ex) + "</p>" +
      (p.steps ? '<details class="walk"><summary>Step-by-step solution</summary><ol>' + p.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></details>" : "");
  }
  (window.EDGE_STEPS || []).forEach(function (s) { for (var i = 0; i < CL.length; i++) if (CL[i].q.indexOf(s[0]) >= 0) { CL[i].steps = s[1]; break; } });

  var total = ALL.length.toLocaleString();
  document.querySelectorAll('[data-count="all"]').forEach(function (el) { el.textContent = total; });

  /* ---------- accounts: signed-in visitors get "Open the app"; guests with progress get "continue" ---------- */
  var A = window.EdgeAuth;
  try { var st = JSON.parse(localStorage.getItem("edge-v2") || "null"); if (st && st.solved && Object.keys(st.solved).length) $("#ctaGuest").textContent = "Continue practicing"; } catch (e) {}
  if (A && !A.configured) {
    ["#ctaMain", "#ctaEnd"].forEach(function (s) { var b = $(s); b.textContent = "Start practicing"; b.href = "app.html#today"; if (b.nextElementSibling) b.nextElementSibling.hidden = true; });
    $("#ctaGuest").hidden = true;
  }
  if (A && A.configured) A.onChange(function (u) {
    if (!u) return;
    ["#ctaMain", "#ctaEnd"].forEach(function (s) { var b = $(s); b.textContent = "Open the app"; b.href = "app.html#today"; if (b.nextElementSibling) b.nextElementSibling.hidden = true; });
  });

  /* ---------- the headline board ---------- */
  var WORDS = ["QUANT", "INTERVIEWS", "ONE", "SQUARE", "A", "DAY"], lastCols = 0, target = null;
  function buildBoard() {
    var board = $("#board"), W = board.clientWidth; if (!W) return;
    var minCell = W >= 900 ? 56 : W >= 600 ? 44 : 30, cols = Math.max(10, Math.min(18, Math.floor(W / minCell)));
    if (cols === lastCols && board.children.length) return;
    lastCols = cols;
    var rows = [], row = [], num = 0;
    WORDS.forEach(function (w) {
      var need = (row.length ? 1 : 0) + w.length;
      if (row.length + need > cols) { rows.push(row); row = []; need = w.length; }
      if (row.length) row.push({t: "b"});
      num++;
      w.split("").forEach(function (ch, i) { row.push({t: "l", ch: ch, n: i === 0 ? num : 0}); });
    });
    rows.push(row);
    rows.push([]);
    var html = "", li = 0, firstBlank = null;
    rows.forEach(function (r, ri) {
      for (var c = 0; c < cols; c++) {
        var cell = r[c];
        if (!cell) cell = ((ri * 7 + c * 3) % 5 === 0) ? {t: "b"} : {t: "e"};
        if (ri === rows.length - 1 && cell.t === "e" && firstBlank === null && c >= 1) { firstBlank = true; cell = {t: "target"}; }
        if (cell.t === "l") { html += '<span class="bc l"' + (reduced ? "" : ' style="animation-delay:' + (180 + li * 55) + 'ms"') + ">" + (cell.n ? "<sup>" + cell.n + "</sup>" : "") + cell.ch + "</span>"; li++; }
        else if (cell.t === "b") html += '<span class="bc k"></span>';
        else if (cell.t === "target") html += '<span class="bc e target" id="boardTarget"><sup>' + (num + 1) + "</sup></span>";
        else html += '<span class="bc e"></span>';
      }
    });
    board.style.setProperty("--cols", cols);
    board.style.setProperty("--fs", Math.round(Math.min(W / cols, 72) * 0.58) + "px");
    board.innerHTML = html;
    /* letters are visible by default; the stamp-in only runs while the page is actually on screen */
    if (!reduced && document.visibilityState === "visible" && !buildBoard.played) {
      buildBoard.played = true;
      requestAnimationFrame(function () { board.classList.add("stamping"); });
      setTimeout(function () { board.classList.remove("stamping"); }, 180 + li * 55 + 900);
    }
    target = $("#boardTarget");
    if (solvedOnce) fillTarget(false);
  }
  var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(buildBoard, 150); });

  /* ---------- 1 Across: a real problem on a 30-second clock ---------- */
  var pool = shuffle(CL.filter(function (p) { return p.type === "num" && p.diff <= 2 && (p.set === "prob" || p.set === "brain"); })
    .concat(ALL.filter(function (p) { return p.key && p.key.indexOf("seq-") === 0 && p.diff === 1; }).slice(0, 12)));
  var idx = 0, cur, timer = null, left = 30, started = 0, solvedOnce = false, tries = 0;
  var R = 19, CIRC = 2 * Math.PI * R;
  function setClock(s) {
    $("#clockN").textContent = s > 0 ? s : "0";
    $("#clockArc").style.strokeDasharray = CIRC;
    $("#clockArc").style.strokeDashoffset = CIRC * (1 - s / 30);
    $("#clock").classList.toggle("low", s <= 10 && s > 0);
    $("#clock").classList.toggle("out", s <= 0);
  }
  function stopClock() { clearInterval(timer); timer = null; }
  function startClock() {
    if (timer || started) return;
    started = Date.now();
    timer = setInterval(function () {
      left--; setClock(left);
      if (left <= 0) { stopClock(); if (!$("#clueA").disabled) { var fb = $("#clueFb"); fb.className = "fb bad"; fb.textContent = "Time's up. You can still answer, or take the hint."; } }
    }, 1000);
  }
  function loadClue() {
    cur = pool[idx % pool.length]; idx++; tries = 0; stopClock(); left = 30; started = 0; setClock(30);
    $("#clueQ").textContent = cur.q;
    $("#clueTopic").textContent = (cur.topic && cur.topic !== "Classic" ? cur.topic : setName(cur.set)) + " · " + diffName(cur.diff);
    var a = $("#clueA"); a.value = ""; a.disabled = false; $("#clueGo").disabled = false; $("#clueHint").disabled = false;
    $("#clueFb").textContent = ""; $("#clueFb").className = "fb"; $("#clueEx").hidden = true;
  }
  function fillTarget(animate) {
    if (!target) return;
    target.classList.add("filled"); if (animate && !reduced) target.classList.add("pop");
    target.innerHTML = target.innerHTML.replace(/<svg[\s\S]*<\/svg>/, "") + '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>';
  }
  function finishClue(ok) {
    stopClock();
    $("#clueA").disabled = true; $("#clueGo").disabled = true; $("#clueHint").disabled = true;
    $("#clueEx").hidden = false; $("#clueEx").innerHTML = exHTML(cur);
    var fb = $("#clueFb");
    if (ok) {
      var secs = started ? Math.max(1, Math.round((Date.now() - started) / 1000)) : null;
      fb.className = "fb good";
      fb.textContent = (secs ? "Solved in " + secs + "s. " : "Solved. ") + (solvedOnce ? "Nice. Another square." : "That's your first square: look at the board.");
      if (!solvedOnce) { solvedOnce = true; fillTarget(true); }
      $("#clueNote").innerHTML = 'Keep it going: <a href="app.html#today">today\'s puzzle</a> is waiting in the app.';
    } else { fb.className = "fb bad"; fb.textContent = "Here's how it works. Try another clue."; }
  }
  $("#clueA").addEventListener("input", startClock);
  $("#clueA").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#clueGo").click(); });
  $("#clueGo").onclick = function () {
    var v = parse($("#clueA").value), fb = $("#clueFb");
    if (isNaN(v)) { fb.className = "fb bad"; fb.textContent = "Enter a number, a fraction like 3/8, or a percent."; return; }
    tries++;
    if (close(v, cur)) finishClue(true);
    else if (tries >= 3) finishClue(false);
    else { fb.className = "fb bad"; fb.textContent = "Not quite. " + (tries === 1 ? "Try again, or take the hint." : "One more try."); }
  };
  $("#clueHint").onclick = function () { var fb = $("#clueFb"); fb.className = "fb"; fb.textContent = "Hint: " + cur.hint; this.disabled = true; };
  $("#clueNext").onclick = function () { loadClue(); $("#clueA").focus(); };

  /* ---------- topic sampler ---------- */
  var curSet = SETS[0].id, sample;
  function tabs() {
    $("#tTabs").innerHTML = SETS.map(function (s) {
      var n = ALL.filter(function (p) { return p.set === s.id; }).length;
      return '<button role="tab" id="tab-' + s.id + '" aria-selected="' + (s.id === curSet) + '" data-set="' + s.id + '">' + s.name + ' <span class="tab-n">' + n.toLocaleString() + "</span></button>";
    }).join("");
  }
  function drawSample() {
    var list = ALL.filter(function (p) { return p.set === curSet; });
    sample = list[Math.floor(Math.random() * list.length)];
    var p = sample, panel = $("#tPanel");
    panel.setAttribute("aria-labelledby", "tab-" + curSet);
    panel.innerHTML = '<p class="meta"><span>' + esc(p.topic && p.topic !== "Classic" ? p.topic : setName(p.set)) + "</span><span>" + diffName(p.diff) + '</span></p><p class="today-q">' + esc(p.q) + "</p>" +
      (p.type === "num"
        ? '<div class="row"><label class="sr" for="sA">Your answer</label><input class="field" id="sA" autocomplete="off" inputmode="decimal" placeholder="Your answer"><button class="btn go" id="sGo">Check</button></div>'
        : '<div class="opts">' + p.opts.map(function (o, i) { return '<button class="opt" data-i="' + i + '"><span class="k">' + "ABCD"[i] + "</span>" + esc(o) + "</button>"; }).join("") + "</div>") +
      '<p class="fb" id="sFb" aria-live="polite"></p><div class="ex" id="sEx" hidden></div><div class="row"><button class="btn alt" id="sShow">Show the method</button><button class="btn alt" id="sNext">Another ' + setName(curSet).toLowerCase() + " problem</button></div>";
    function reveal(ok, msg) {
      $("#sFb").className = "fb " + (ok ? "good" : ok === false ? "bad" : ""); $("#sFb").textContent = msg || "";
      $("#sEx").hidden = false; $("#sEx").innerHTML = exHTML(p); $("#sShow").disabled = true;
      panel.querySelectorAll("input,.opt,#sGo").forEach(function (b) { b.disabled = true; });
    }
    if (p.type === "num") {
      $("#sGo").onclick = function () { var v = parse($("#sA").value); if (isNaN(v)) return; if (close(v, p)) reveal(true, "Correct."); else { $("#sFb").className = "fb bad"; $("#sFb").textContent = "Not quite. Try again or show the method."; } };
      $("#sA").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#sGo").click(); });
    } else {
      panel.querySelector(".opts").onclick = function (e) {
        var b = e.target.closest(".opt"); if (!b || b.disabled) return;
        var ok = +b.dataset.i === p.a;
        panel.querySelectorAll(".opt").forEach(function (o, j) { if (j === p.a) o.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        reveal(ok, ok ? "Correct." : "Not this one.");
      };
    }
    $("#sShow").onclick = function () { reveal(null, ""); };
    $("#sNext").onclick = drawSample;
  }
  $("#tTabs").addEventListener("click", function (e) { var b = e.target.closest("[data-set]"); if (!b) return; curSet = b.dataset.set; tabs(); drawSample(); $("#tab-" + curSet).focus(); });
  $("#tTabs").addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var i = SETS.findIndex(function (s) { return s.id === curSet; }) + (e.key === "ArrowRight" ? 1 : -1);
    curSet = SETS[(i + SETS.length) % SETS.length].id; tabs(); drawSample(); $("#tab-" + curSet).focus(); e.preventDefault();
  });

  /* ---------- mini bank illustration ---------- */
  var mb = ""; for (var k = 1; k <= 40; k++) mb += '<span class="cell' + ([2, 3, 7, 11, 12, 13, 18, 22, 29, 31].indexOf(k) >= 0 ? " solved" : "") + '"><sup>' + k + "</sup></span>"; $("#miniBank").innerHTML = mb;

  /* ---------- weekly puzzle email ---------- */
  if (A && A.configured && A.subscribe) {
    var form = $("#subForm"); form.hidden = false;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var em = $("#subEmail").value.trim(), fb = $("#subFb");
      if ($("#subHp").value) return; /* bots fill the hidden field */
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { fb.className = "fb bad"; fb.textContent = "Enter a valid email address."; return; }
      form.querySelector("button").disabled = true; fb.className = "fb"; fb.textContent = "Subscribing…";
      A.subscribe(em, "landing").then(function (r) {
        fb.className = "fb good"; fb.textContent = r === "exists" ? "You're already subscribed." : "You're on the list. The first puzzle arrives next week.";
      }, function () { form.querySelector("button").disabled = false; fb.className = "fb bad"; fb.textContent = "Couldn't subscribe right now. Try again in a minute."; });
    });
  }

  buildBoard(); loadClue(); tabs(); drawSample();
})();
