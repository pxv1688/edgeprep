/* Interactive practice problems inside lessons: <div class="embed-q" data-find="unique phrase from the question"></div> */
(function () {
  "use strict";
  var C = window.EDGE_BANK || [], ALL = C.concat(window.EDGE_GENERATED || []);
  (window.EDGE_STEPS || []).forEach(function (s) { for (var i = 0; i < C.length; i++) if (C[i].q.indexOf(s[0]) >= 0) { C[i].steps = s[1]; break; } });
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  function parse(s) { s = String(s).trim().replace(/,/g, "").replace(/\s+/g, ""); if (!s) return NaN; var m = s.match(/^(-?[\d.]+)\/([\d.]+)$/); if (m) return +m[1] / +m[2]; if (/%$/.test(s)) return parseFloat(s) / 100; return Number(s); }
  function close(v, p) { if (p.exact) return Math.abs(v - p.a) < 1e-9; return Math.abs(v - p.a) <= Math.max(p.abs != null ? p.abs : 0.0005, Math.abs(p.a) * (p.tol != null ? p.tol : 0.01)); }
  function fmt(x) { if (Number.isInteger(x)) return x.toLocaleString(); for (var d = 2; d <= 70000; d++) { var n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-12) return n + "/" + d + (d > 12 ? " ≈ " + (+x.toPrecision(4)) : ""); } return String(+x.toPrecision(4)); }
  var uid = 0;
  document.querySelectorAll(".embed-q").forEach(function (box) {
    var phrase = box.getAttribute("data-find"), p = ALL.filter(function (q) { return q.q.indexOf(phrase) >= 0; })[0];
    if (!p) { box.hidden = true; return; }
    var id = "eq" + (++uid);
    box.innerHTML = '<p class="embed-label">Try it</p><p class="today-q">' + esc(p.q) + "</p>" +
      (p.type === "num"
        ? '<div class="row"><label class="sr" for="' + id + '">Your answer</label><input class="field" id="' + id + '" autocomplete="off" inputmode="decimal" placeholder="Your answer"><button class="btn go" data-a="check">Check</button></div>'
        : '<div class="opts">' + p.opts.map(function (o, i) { return '<button class="opt" data-i="' + i + '"><span class="k">' + "ABCD"[i] + "</span>" + esc(o) + "</button>"; }).join("") + "</div>") +
      '<p class="fb" aria-live="polite"></p><div class="row"><button class="btn alt" data-a="hint">Hint</button><button class="btn alt" data-a="show">Show the solution</button></div><div class="ex" hidden></div>';
    var fb = box.querySelector(".fb"), ex = box.querySelector(".ex");
    function reveal(ok, msg) {
      fb.className = "fb " + (ok ? "good" : ok === false ? "bad" : ""); fb.textContent = msg || "";
      ex.hidden = false;
      ex.innerHTML = "<b>Answer: " + esc(p.type === "num" ? fmt(p.a) : p.opts[p.a]) + "</b><p>" + esc(p.ex) + "</p>" +
        (p.steps ? '<details class="walk" open><summary>Step-by-step</summary><ol>' + p.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></details>" : "");
      box.querySelectorAll("input,.opt,[data-a=check],[data-a=show],[data-a=hint]").forEach(function (b) { b.disabled = true; });
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || b.disabled) return;
      if (b.classList.contains("opt")) { var ok = +b.dataset.i === p.a; box.querySelectorAll(".opt").forEach(function (o, j) { if (j === p.a) o.classList.add("right"); }); if (!ok) b.classList.add("wrong"); reveal(ok, ok ? "Correct." : "Not this one."); }
      else if (b.dataset.a === "check") { var v = parse(box.querySelector("input").value); if (isNaN(v)) { fb.className = "fb bad"; fb.textContent = "Enter a number, a fraction like 3/8, or a percent."; return; } if (close(v, p)) reveal(true, "Correct."); else { fb.className = "fb bad"; fb.textContent = "Not quite. Try again, or take the hint."; } }
      else if (b.dataset.a === "hint") { fb.className = "fb"; fb.textContent = "Hint: " + p.hint; b.disabled = true; }
      else if (b.dataset.a === "show") reveal(null, "");
    });
    var inp = box.querySelector("input"); if (inp) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") box.querySelector("[data-a=check]").click(); });
  });
})();
