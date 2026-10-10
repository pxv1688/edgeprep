/* Edge problem generators.
   Each family is a classic interview problem type; parameters vary and every answer is computed,
   so the bank is large and correct by construction. Keys are stable: <family>-<index>. */
(function () {
  "use strict";
  var OUT = [], count = {};
  function add(fam, topic, set, diff, q, a, hint, ex, o) {
    count[fam] = (count[fam] || 0) + 1;
    var p = {key: fam + "-" + count[fam], topic: topic, set: set, diff: diff, type: "num", q: q, a: a, hint: hint, ex: ex};
    if (o) { if (o.exact) p.exact = true; if (o.tol) p.tol = o.tol; if (o.abs) p.abs = o.abs; if (o.steps) p.steps = o.steps; }
    OUT.push(p);
  }
  /* ---------- math helpers ---------- */
  function C(n, k) { if (k < 0 || k > n) return 0; k = Math.min(k, n - k); var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }
  function fact(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function fr(n, d) { var g = gcd(n, d); return (n / g) + "/" + (d / g); }
  function r4(x) { return String(+x.toPrecision(4)); }
  function H(n) { var s = 0; for (var i = 1; i <= n; i++) s += 1 / i; return s; }
  function erf(x) { var s = x < 0 ? -1 : 1; x = Math.abs(x); var t = 1 / (1 + 0.3275911 * x); var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
  function Ncdf(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
  function bs(S, K, s, T, r, put) { var d1 = (Math.log(S / K) + (r + s * s / 2) * T) / (s * Math.sqrt(T)), d2 = d1 - s * Math.sqrt(T); var c = S * Ncdf(d1) - K * Math.exp(-r * T) * Ncdf(d2); return put ? c - S + K * Math.exp(-r * T) : c; }
  function pct(p) { return (Math.round(p * 1000) / 10) + "%"; }
  function money(x) { return "$" + (Math.round(x * 100) / 100).toFixed(2); }
  var DICE = [4, 6, 8, 10, 12, 20];
  function die(n) { return n === 6 ? "a fair six-sided die" : "a fair " + n + "-sided die"; }

  /* ================= PROBABILITY ================= */
  DICE.forEach(function (n) { for (var m = 1; m <= Math.min(n - 1, 6); m++) add("dieuntil", "Waiting times", "prob", 1,
    "You roll " + die(n) + " until it shows one of " + m + " particular face" + (m > 1 ? "s" : "") + ". What is the expected number of rolls?", n / m,
    "Each roll succeeds with the same probability.", "Each roll succeeds with probability " + m + "/" + n + ", so the wait is geometric with mean " + n + "/" + m + " = " + r4(n / m) + ".", {}); });

  DICE.forEach(function (n) { for (var k = 2; k <= 10; k++) add("atleast", "Complements", "prob", 1,
    "You roll " + die(n) + " " + k + " times. What is the probability that a " + n + " appears at least once? (Decimal is fine.)", 1 - Math.pow((n - 1) / n, k),
    "Compute the chance it never appears.", "1 − (" + (n - 1) + "/" + n + ")^" + k + " ≈ " + r4(1 - Math.pow((n - 1) / n, k)) + "."); });

  [4, 6, 8, 10, 12].forEach(function (n) { for (var s = 2; s <= 2 * n; s++) { var c = 0; for (var i = 1; i <= n; i++) { var j = s - i; if (j >= 1 && j <= n) c++; }
    add("dicesum", "Dice", "prob", 1, "You roll two " + (n === 6 ? "fair six-sided dice" : "fair " + n + "-sided dice") + ". What is the probability the sum is exactly " + s + "?", c / (n * n),
      "Count the ordered pairs that work.", c + " of the " + (n * n) + " ordered outcomes sum to " + s + ": " + fr(c, n * n) + "."); } });

  for (var n = 2; n <= 16; n++) for (var k = 0; k <= n; k++) add("binfair", "Coin flips", "prob", n > 8 ? 2 : 1,
    "You flip a fair coin " + n + " times. What is the probability of exactly " + k + " heads?", C(n, k) / Math.pow(2, n),
    "Count arrangements, then divide by 2^" + n + ".", "C(" + n + "," + k + ") / 2^" + n + " = " + C(n, k) + "/" + Math.pow(2, n) + " = " + fr(C(n, k), Math.pow(2, n)) + ".");

  [0.3, 0.4, 0.6, 0.7].forEach(function (p) { for (var n = 3; n <= 8; n++) for (var k = 0; k <= n; k++) { var v = C(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    add("binbias", "Coin flips", "prob", 2, "A coin lands heads with probability " + p + ". You flip it " + n + " times. What is the probability of exactly " + k + " heads? (Decimal.)", v,
      "Binomial: C(n,k) p^k (1−p)^(n−k).", "C(" + n + "," + k + ") × " + p + "^" + k + " × " + r4(1 - p) + "^" + (n - k) + " ≈ " + r4(v) + "."); } });

  for (var r = 1; r <= 8; r++) for (var b = 1; b <= 8; b++) { if (r + b < 3) continue; var tot = C(r + b, 2);
    add("bagsame", "Urns", "prob", 1, "A bag holds " + r + " red and " + b + " blue balls. You draw 2 without replacement. What is the probability they are the same color?", (C(r, 2) + C(b, 2)) / tot,
      "Count same-color pairs over all pairs.", "(C(" + r + ",2) + C(" + b + ",2)) / C(" + (r + b) + ",2) = " + (C(r, 2) + C(b, 2)) + "/" + tot + "."); }
  for (r = 2; r <= 9; r++) for (b = 1; b <= 8; b++) { tot = C(r + b, 2);
    add("bagred", "Urns", "prob", 1, "A bag holds " + r + " red and " + b + " blue balls. You draw 2 without replacement. What is the probability both are red?", C(r, 2) / tot,
      "Multiply the two draws.", "(" + r + "/" + (r + b) + ") × (" + (r - 1) + "/" + (r + b - 1) + ") = " + fr(C(r, 2), tot) + "."); }

  for (var N = 4; N <= 15; N++) for (var a = 1; a < N; a++) add("ruinfair", "Gambler's ruin", "prob", 2,
    "You have $" + a + " and bet $1 on fair coin flips until you reach $" + N + " or go broke. What is the probability you reach $" + N + "?", a / N,
    "In a fair game your expected wealth never changes.", "Optional stopping: " + N + "p = " + a + ", so p = " + fr(a, N) + ".");

  [0.4, 0.45, 0.55, 0.6].forEach(function (p) { for (var N = 5; N <= 10; N++) for (var a = 1; a < N; a++) { var q = 1 - p, x = q / p, v = (Math.pow(x, a) - 1) / (Math.pow(x, N) - 1);
    add("ruinbias", "Gambler's ruin", "prob", 3, "Each $1 bet wins with probability " + p + ". Starting with $" + a + ", you play until you have $" + N + " or nothing. What is the probability you reach $" + N + "? (Decimal.)", v,
      "With r = q/p, the answer is (r^a − 1)/(r^N − 1).", "r = " + r4(x) + ", so ((" + r4(x) + ")^" + a + " − 1)/((" + r4(x) + ")^" + N + " − 1) ≈ " + r4(v) + ".", {steps: [
        "Let Pₖ be the chance of reaching $" + N + " from $k. One bet later: Pₖ = " + p + "·Pₖ₊₁ + " + r4(q) + "·Pₖ₋₁, with P₀ = 0 and P" + N + " = 1.",
        "Try Pₖ = A + B·rᵏ. Substituting shows it works when r = q/p = " + r4(q) + "/" + p + " = " + r4(x) + ".",
        "The boundary conditions fix A and B: Pₖ = (rᵏ − 1)/(r^" + N + " − 1).",
        "At k = " + a + ": (" + r4(x) + "^" + a + " − 1)/(" + r4(x) + "^" + N + " − 1) = " + r4(Math.pow(x, a) - 1) + " / " + r4(Math.pow(x, N) - 1) + " ≈ " + r4(v) + "."]}); } });

  for (n = 2; n <= 20; n++) {
    add("unifmax", "Order statistics", "prob", 2, "You draw " + n + " independent Uniform(0,1) numbers. What is the expected value of the largest?", n / (n + 1), "P(max ≤ t) = t^n.", "E[max] = n/(n+1) = " + n + "/" + (n + 1) + ".");
    add("unifmin", "Order statistics", "prob", 2, "You draw " + n + " independent Uniform(0,1) numbers. What is the expected value of the smallest?", 1 / (n + 1), "By symmetry with the max.", "E[min] = 1/(n+1) = 1/" + (n + 1) + ".");
    add("coupon", "Coupon collector", "prob", 2, "A fair die has " + n + " faces. What is the expected number of rolls to see every face at least once? (Decimal.)", n * H(n), "Each new face is its own geometric wait.", "n(1 + 1/2 + … + 1/n) = " + n + " × H(" + n + ") ≈ " + r4(n * H(n)) + ".");
  }
  DICE.forEach(function (n) { for (var k = 2; k <= 12; k++) { var v = n * (1 - Math.pow(1 - 1 / n, k));
    add("distinct", "Linearity", "prob", 2, "You roll " + die(n) + " " + k + " times. What is the expected number of distinct faces you see? (Decimal.)", v,
      "For each face, ask whether it ever appears.", n + " × (1 − (" + (n - 1) + "/" + n + ")^" + k + ") ≈ " + r4(v) + "."); } });

  [0.001, 0.005, 0.01, 0.02, 0.05, 0.1].forEach(function (pr) { [0.9, 0.95, 0.99].forEach(function (se) { [0.01, 0.02, 0.05, 0.1].forEach(function (fp) {
    var v = pr * se / (pr * se + (1 - pr) * fp);
    add("bayes", "Bayes", "prob", 2, "A condition affects " + pct(pr) + " of people. A test detects it " + pct(se) + " of the time and falsely flags " + pct(fp) + " of healthy people. You test positive. What is the probability you have the condition? (Decimal.)", v,
      "Compare true positives with all positives.", pr + " × " + se + " / (" + pr + " × " + se + " + " + r4(1 - pr) + " × " + fp + ") ≈ " + r4(v) + "."); }); }); });

  DICE.forEach(function (n) { for (var m = 2; m <= 5; m++) { var e = 0; for (var k = 1; k <= n; k++) e += k * (Math.pow(k, m) - Math.pow(k - 1, m)) / Math.pow(n, m);
    add("dicemax", "Order statistics", "prob", 3, "You roll " + m + " fair " + n + "-sided dice. What is the expected value of the highest roll? (Decimal.)", e,
      "P(max ≤ k) = (k/n)^m.", "Σ k[(k/n)^" + m + " − ((k−1)/n)^" + m + "] ≈ " + r4(e) + ".", {steps: [
        "The max is at most k exactly when every die is at most k: P(max ≤ k) = (k/" + n + ")^" + m + ".",
        "So P(max = k) = (k/" + n + ")^" + m + " − ((k−1)/" + n + ")^" + m + ".",
        "E[max] = Σ k · P(max = k) for k = 1…" + n + ". Equivalently, E[max] = Σ P(max ≥ k) = Σ [1 − ((k−1)/" + n + ")^" + m + "].",
        "Adding up the terms gives ≈ " + r4(e) + ". More dice push the max toward " + n + "."]}); } });

  DICE.forEach(function (n) { var v = (n + 1) / 2, vals = [v]; for (var r = 1; r <= 4; r++) { var e = 0; for (var k = 1; k <= n; k++) e += Math.max(k, v) / n; v = e; vals.push(v);
    add("reroll", "Optimal stopping", "prob", 3, "You roll " + die(n) + " and are paid the face value. You may reroll up to " + r + " time" + (r > 1 ? "s" : "") + ", keeping only the last roll. What is your expected payoff with optimal play? (Decimal.)", v,
      "Work backwards: keep a roll only if it beats the value of continuing.", "Starting from (n+1)/2 with no rerolls left, each extra reroll is worth E[max(X, previous value)]. With " + r + " reroll" + (r > 1 ? "s" : "") + " the value is ≈ " + r4(v) + ".", {steps: [
        "Work backwards from the last roll. With no rerolls left you must keep whatever comes up: v₀ = (" + n + " + 1)/2 = " + r4(vals[0]) + ".",
        "With one reroll left, keep the current roll only if it beats v₀. The value is v₁ = E[max(X, v₀)] = " + r4(vals[1]) + ".",
        "Each extra reroll repeats the rule: vᵣ = E[max(X, vᵣ₋₁)], where X is uniform on 1–" + n + ".",
        "Values: " + vals.slice(0, r + 1).map(function (x, i) { return "v" + i + " = " + r4(x); }).join(", ") + ". With " + r + " reroll" + (r > 1 ? "s" : "") + ", the answer is " + r4(v) + "."]}); } });

  [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8].forEach(function (p) { for (var k = 1; k <= 5; k++) add("geom", "Waiting times", "prob", 1,
    "A coin lands heads with probability " + p + ". What is the expected number of flips to get " + k + " head" + (k > 1 ? "s" : "") + " in total?", k / p,
    "Each head is a separate geometric wait.", k + " × 1/" + p + " = " + r4(k / p) + "."); });
  for (k = 2; k <= 10; k++) add("runfair", "Patterns", "prob", 2, "What is the expected number of fair coin flips until you see " + k + " heads in a row?", Math.pow(2, k + 1) - 2,
    "The answer has the form 2^(k+1) − 2.", "2^" + (k + 1) + " − 2 = " + (Math.pow(2, k + 1) - 2) + ".", {exact: true, steps: [
      "Let Eⱼ be the expected flips to get j heads in a row, with E₀ = 0.",
      "First reach j−1 in a row, then flip once more: heads finishes, tails restarts. Eⱼ = Eⱼ₋₁ + 1 + ½Eⱼ, so Eⱼ = 2(Eⱼ₋₁ + 1).",
      "Building up: " + (function () { var e = 0, out = []; for (var j = 1; j <= k; j++) { e = 2 * (e + 1); out.push("E" + j + " = " + e); } return out.join(", "); })() + ".",
      "That matches the closed form 2^(k+1) − 2 = " + (Math.pow(2, k + 1) - 2) + "."]});
  [0.3, 0.4, 0.6, 0.7].forEach(function (p) { for (var k = 2; k <= 5; k++) { var v = (1 - Math.pow(p, k)) / ((1 - p) * Math.pow(p, k));
    add("runbias", "Patterns", "prob", 3, "A coin lands heads with probability " + p + ". What is the expected number of flips until " + k + " heads in a row? (Decimal.)", v,
      "E = (1 − p^k) / ((1 − p) p^k).", "(1 − " + p + "^" + k + ") / (" + r4(1 - p) + " × " + p + "^" + k + ") ≈ " + r4(v) + ".", {steps: [
        "Let Eⱼ be the expected flips to get j heads in a row, with E₀ = 0.",
        "Reach j−1 in a row, then flip once more: heads (probability " + p + ") finishes, tails restarts everything. Eⱼ = Eⱼ₋₁ + 1 + " + r4(1 - p) + "·Eⱼ, so Eⱼ = (Eⱼ₋₁ + 1)/" + p + ".",
        "Building up: " + (function () { var e = 0, out = []; for (var j = 1; j <= k; j++) { e = (e + 1) / p; out.push("E" + j + " ≈ " + r4(e)); } return out.join(", "); })() + ".",
        "Closed form check: (1 − p^k)/((1 − p)p^k) ≈ " + r4(v) + "."]}); } });

  for (a = 1; a <= 10; a++) for (b = 1; b <= 10; b++) {
    add("rwhit", "Random walks", "prob", 2, "A symmetric random walk starts at 0. What is the probability it reaches +" + b + " before −" + a + "?", a / (a + b), "The walk is a martingale.", "p·" + b + " − (1 − p)·" + a + " = 0, so p = " + fr(a, a + b) + ".");
    add("rwtime", "Random walks", "prob", 2, "A symmetric random walk starts at 0. What is the expected number of steps until it hits +" + b + " or −" + a + "?", a * b, "W² − t is a martingale.", "E[T] = a × b = " + (a * b) + ".", {exact: true});
  }

  [0.5, 1, 2, 3, 4, 5].forEach(function (L) { for (var k = 0; k <= 6; k++) { var v = Math.exp(-L) * Math.pow(L, k) / fact(k);
    add("poisson", "Poisson", "prob", 2, "Events arrive as a Poisson process averaging " + L + " per hour. What is the probability of exactly " + k + " events in an hour? (Decimal.)", v,
      "P(N = k) = e^(−λ) λ^k / k!.", "e^(−" + L + ") × " + L + "^" + k + " / " + k + "! ≈ " + r4(v) + ".", {abs: 0.0005}); } });

  for (k = 2; k <= 6; k++) add("suit", "Cards", "prob", 2, "You draw " + k + " cards from a shuffled 52-card deck. What is the probability they are all the same suit? (Decimal.)", 4 * C(13, k) / C(52, k),
    "Pick the suit, then the cards.", "4 × C(13," + k + ") / C(52," + k + ") ≈ " + r4(4 * C(13, k) / C(52, k)) + ".", {abs: 0.00005});
  for (k = 1; k <= 13; k++) add("ace", "Cards", "prob", 1, "You draw " + k + " card" + (k > 1 ? "s" : "") + " from a shuffled deck. What is the probability of at least one ace? (Decimal.)", 1 - C(48, k) / C(52, k),
    "Complement: no aces at all.", "1 − C(48," + k + ")/C(52," + k + ") ≈ " + r4(1 - C(48, k) / C(52, k)) + ".");
  for (n = 5; n <= 60; n += 5) { var pd = 1; for (var i = 0; i < n; i++) pd *= (365 - i) / 365;
    add("bday", "Birthdays", "prob", 2, "In a group of " + n + " people with birthdays uniform over 365 days, what is the probability at least two share a birthday? (Decimal.)", 1 - pd, "Find the chance all birthdays differ.", "1 − (365 × 364 × … × " + (366 - n) + ") / 365^" + n + " ≈ " + r4(1 - pd) + ".");
    add("bdaypairs", "Birthdays", "prob", 2, "In a group of " + n + " people, what is the expected number of pairs who share a birthday? (Decimal.)", C(n, 2) / 365, "Linearity over pairs.", "C(" + n + ",2)/365 = " + C(n, 2) + "/365 ≈ " + r4(C(n, 2) / 365) + "."); }
  for (k = 2; k <= 12; k++) {
    add("expmin", "Exponentials", "prob", 2, "You have " + k + " independent Exponential(1) waiting times. What is the expected value of the shortest?", 1 / k, "The min of exponentials is exponential.", "min ~ Exponential(" + k + "), mean 1/" + k + ".");
    add("expmax", "Exponentials", "prob", 3, "You have " + k + " independent Exponential(1) waiting times. What is the expected value of the longest? (Decimal.)", H(k), "After each arrival, the rest restart by memorylessness.", "1/" + k + " + 1/" + (k - 1) + " + … + 1 = H(" + k + ") ≈ " + r4(H(k)) + ".", {steps: [
      "The first of " + k + " Exponential(1) clocks rings after an Exponential(" + k + ") time, which averages 1/" + k + ".",
      "Memorylessness: the " + (k - 1) + " clocks still running start fresh, so the next gap averages 1/" + (k - 1) + ".",
      "Keep going until the last clock rings: 1/" + k + " + 1/" + (k - 1) + " + … + 1/1.",
      "That's the harmonic number H(" + k + ") ≈ " + r4(H(k)) + "."]});
  }

  /* ================= BRAINTEASERS ================= */
  for (n = 10; n <= 1000; n += 10) { var z = 0; for (var p5 = 5; p5 <= n; p5 *= 5) z += Math.floor(n / p5);
    add("zeros", "Factorials", "brain", n > 200 ? 2 : 1, "How many trailing zeros does " + n + "! have?", z, "Count the factors of 5.", "Σ ⌊" + n + "/5^k⌋ = " + z + ".", {exact: true}); }
  for (var h = 1; h <= 12; h++) for (var m = 0; m < 60; m += 5) { var ang = Math.abs(30 * (h % 12) - 5.5 * m); if (ang > 180) ang = 360 - ang;
    add("clock", "Clocks", "brain", 1, "What is the smaller angle, in degrees, between the hour and minute hands at " + h + ":" + String(m).padStart(2, "0") + "?", ang,
      "The hour hand moves 0.5° per minute.", "Hour hand at " + (30 * (h % 12) + 0.5 * m) + "°, minute hand at " + (6 * m) + "°. Smaller angle: " + ang + "°.", {exact: true}); }
  for (var base = 2; base <= 9; base++) [10, 25, 50, 99, 100, 123, 1000, 2024, 2025, 2026].forEach(function (e) { var d = 1; for (var i = 0; i < e; i++) d = d * base % 10;
    add("lastdigit", "Number theory", "brain", 2, "What is the last digit of " + base + "^" + e + "?", d, "Last digits of powers repeat in short cycles.", "The last digits of " + base + "^k cycle, and the cycle position for " + e + " gives " + d + ".", {exact: true}); });
  var f1 = [0, 1, 2]; for (i = 3; i <= 30; i++) f1[i] = f1[i - 1] + f1[i - 2];
  for (n = 4; n <= 30; n++) add("stairs2", "Recursion", "brain", 2, "How many ways can you climb " + n + " stairs taking 1 or 2 steps at a time?", f1[n], "f(n) = f(n−1) + f(n−2).", "This follows the Fibonacci recurrence: f(" + n + ") = " + f1[n] + ".", {exact: true});
  var t3 = [1, 1, 2, 4]; for (i = 4; i <= 20; i++) t3[i] = t3[i - 1] + t3[i - 2] + t3[i - 3];
  for (n = 4; n <= 20; n++) add("stairs3", "Recursion", "brain", 3, "How many ways can you climb " + n + " stairs taking 1, 2 or 3 steps at a time?", t3[n], "f(n) = f(n−1) + f(n−2) + f(n−3).", "Tribonacci recurrence: f(" + n + ") = " + t3[n] + ".", {exact: true, steps: [
    "Look at the last move: it covers 1, 2 or 3 stairs. So f(n) = f(n−1) + f(n−2) + f(n−3).",
    "Base cases: f(0) = 1 (do nothing), f(1) = 1, f(2) = 2.",
    "Build up: " + t3.slice(3, n + 1).map(function (x, i) { return "f(" + (i + 3) + ") = " + x; }).join(", ") + ".",
    "So f(" + n + ") = " + t3[n] + "."]});
  ["LEVEL", "BANANA", "APPLE", "MISSISSIPPI", "LETTER", "STATISTICS", "TRADER", "OPTION", "MARKET", "HEDGE", "QUANT", "VOLATILITY", "ARBITRAGE", "COFFEE", "BOOKKEEPER", "PEPPER", "CANNON", "ASSESS", "SUCCESS", "BALLOON", "COMMITTEE", "PROBABILITY", "EXPECTED", "RANDOM", "GAMMA", "DELTA", "THETA", "SIGMA", "LAMBDA", "PARABOLA", "EXCELLENCE", "REFERENCE", "ADDRESS", "INNOCENT", "TATTOO", "PUZZLE", "GOOGOL", "ACCESS", "BUBBLE", "LITTLE"].forEach(function (w) {
    var c = {}; w.split("").forEach(function (ch) { c[ch] = (c[ch] || 0) + 1; }); var d = 1, rep = []; for (var ch in c) { d *= fact(c[ch]); if (c[ch] > 1) rep.push(ch + "×" + c[ch]); }
    add("words", "Counting", "brain", w.length > 8 ? 2 : 1, "How many distinct arrangements are there of the letters in " + w + "?", fact(w.length) / d,
      "Divide by the arrangements of repeated letters.", w.length + "! / (" + (rep.length ? rep.map(function (x) { return x.split("×")[1] + "!"; }).join(" × ") : "1") + ") = " + (fact(w.length) / d).toLocaleString() + (rep.length ? " (repeats: " + rep.join(", ") + ")" : "") + ".", {exact: true}); });
  [[1, 50], [1, 99], [1, 200], [1, 500], [1, 1000], [10, 60], [20, 80], [50, 150], [100, 200], [11, 99], [25, 75], [101, 199], [1, 365], [7, 77], [30, 300]].forEach(function (x) { var s = (x[0] + x[1]) * (x[1] - x[0] + 1) / 2;
    add("arith", "Series", "brain", 1, "What is the sum of all integers from " + x[0] + " to " + x[1] + "?", s, "Pair the first and last terms.", (x[1] - x[0] + 1) + " terms averaging " + ((x[0] + x[1]) / 2) + ": " + s + ".", {exact: true}); });
  for (n = 5; n <= 50; n += 5) add("odds", "Series", "brain", 1, "What is the sum of the first " + n + " odd numbers?", n * n, "Try small cases.", "The first n odd numbers sum to n² = " + (n * n) + ".", {exact: true});
  var L = 1; for (n = 2; n <= 20; n++) { L = lcm(L, n); if (n >= 4) add("lcm", "Number theory", "brain", 2, "What is the smallest positive integer divisible by every number from 1 to " + n + "?", L, "Take the highest power of each prime up to " + n + ".", "LCM(1…" + n + ") = " + L.toLocaleString() + ".", {exact: true}); }
  for (var mm = 2; mm <= 8; mm++) for (var nn = mm; nn <= 8; nn++) add("rects", "Counting", "brain", 2, "How many rectangles of any size are in a " + mm + " × " + nn + " grid of squares?", C(mm + 1, 2) * C(nn + 1, 2),
    "Choose two horizontal and two vertical lines.", "C(" + (mm + 1) + ",2) × C(" + (nn + 1) + ",2) = " + C(mm + 1, 2) * C(nn + 1, 2) + ".", {exact: true});
  for (n = 2; n <= 12; n++) { var sq = 0; for (i = 1; i <= n; i++) sq += i * i;
    add("squares", "Counting", "brain", 1, "How many squares of any size are on an " + n + " × " + n + " board?", sq, "Count k × k squares for each k.", "1² + 2² + … + " + n + "² = " + sq + ".", {exact: true}); }
  for (n = 5; n <= 50; n++) add("shake", "Counting", "brain", 1, n + " people each shake hands once with every other person. How many handshakes happen?", C(n, 2), "Choose pairs.", "C(" + n + ",2) = " + C(n, 2) + ".", {exact: true});
  for (n = 5; n <= 25; n++) add("diag", "Counting", "brain", 1, "How many diagonals does a " + n + "-sided convex polygon have?", n * (n - 3) / 2, "Each vertex connects to n − 3 others.", n + " × " + (n - 3) + " / 2 = " + (n * (n - 3) / 2) + ".", {exact: true});

  /* ================= MENTAL MATH ================= */
  for (a = 12; a <= 99; a += 7) for (b = 13; b <= 99; b += 11) add("mul2", "Multiplication", "mental", 1, "What is " + a + " × " + b + "?", a * b, "Split one factor into tens and units.", a + " × " + b + " = " + (a * b).toLocaleString() + ".", {exact: true});
  [5, 12, 15, 18, 25, 35, 45, 65, 75, 85, 95].forEach(function (p) { [40, 60, 80, 120, 240, 360, 480, 720].forEach(function (x) { var v = Math.round(p * x) / 100;
    add("pctof", "Percentages", "mental", 1, "What is " + p + "% of " + x + "?", v, "Find 10% and 5% first, then combine.", p + "% × " + x + " = " + v + ".", {abs: 0.001}); }); });
  [8, 16, 20, 25, 32, 40].forEach(function (d) { for (var k = 1; k < d; k++) { if (gcd(k, d) !== 1) continue; if (d === 32 && k % 4 !== 1 && k % 4 !== 3) continue;
    add("tofrac", "Fractions", "mental", d >= 32 ? 2 : 1, "Write " + k + "/" + d + " as a decimal.", k / d, "Use the eighths and sixteenths you know by heart.", k + "/" + d + " = " + (k / d) + ".", {abs: 0.00001}); } });
  for (n = 11; n <= 99; n++) add("square", "Squares", "mental", 1, "What is " + n + "²?", n * n, "(a + b)² = a² + 2ab + b².", n + "² = " + (n * n).toLocaleString() + ".", {exact: true});

  /* ================= CODE ================= */
  [-17, -13, -9, -7, -5, -1, 1, 5, 7, 9, 13, 17].forEach(function (x) { [2, 3, 4, -3, -4].forEach(function (y) { var q = Math.floor(x / y), md = x - y * q;
    add("pyfloor", "Python arithmetic", "code", x < 0 || y < 0 ? 2 : 1, "Python: what does print(" + x + " // " + y + ") show?", q, "// floors toward negative infinity.", x + " / " + y + " = " + r4(x / y) + ", floored to " + q + ".", {exact: true});
    add("pymod", "Python arithmetic", "code", x < 0 || y < 0 ? 2 : 1, "Python: what does print(" + x + " % " + y + ") show?", md, "In Python, a % b takes the sign of b.", x + " − (" + y + ") × (" + q + ") = " + md + ".", {exact: true}); }); });
  [[0, 10, 1], [0, 10, 2], [0, 10, 3], [1, 20, 3], [5, 50, 5], [10, 0, -1], [10, 0, -3], [3, 3, 1], [0, 100, 7], [2, 30, 4], [-5, 5, 2], [100, 1, -9], [1, 1000, 10], [0, 7, 7], [7, 0, 2]].forEach(function (t) { var len = Math.max(0, Math.ceil((t[1] - t[0]) / t[2]));
    add("pyrange", "Python ranges", "code", 1, "Python: what does print(len(range(" + t.join(", ") + "))) show?", len, "range stops before the end value.", "The sequence starts at " + t[0] + ", steps by " + t[2] + " and stops before " + t[1] + ": " + len + " values.", {exact: true}); });
  for (n = 10; n <= 255; n += 5) { var ones = n.toString(2).split("").filter(function (c) { return c === "1"; }).length;
    add("popcount", "Bits", "code", 2, "Python: what does print(bin(" + n + ").count('1')) show?", ones, "Write " + n + " in binary.", n + " = 0b" + n.toString(2) + ", which has " + ones + " ones.", {exact: true}); }
  for (k = 1; k <= 20; k++) add("pyshift", "Bits", "code", 1, "Python: what does print(1 << " + k + ") show?", Math.pow(2, k), "A left shift multiplies by 2.", "1 << " + k + " = 2^" + k + " = " + Math.pow(2, k).toLocaleString() + ".", {exact: true});

  /* ================= OPTIONS ================= */
  [50, 100, 200, 400].forEach(function (S) { [0.1, 0.2, 0.3, 0.4, 0.5].forEach(function (s) { [[1 / 12, "1 month"], [0.25, "3 months"], [0.5, "6 months"], [1, "1 year"]].forEach(function (T) {
    var v = bs(S, S, s, T[0], 0);
    add("atm", "ATM approximation", "options", 2, "Estimate the price of an at-the-money call: spot $" + S + ", implied vol " + Math.round(s * 100) + "%, " + T[1] + " to expiry, zero rates.", v,
      "ATM call ≈ 0.4 × S × σ × √T.", "0.4 × " + S + " × " + s + " × √" + r4(T[0]) + " ≈ " + r4(0.4 * S * s * Math.sqrt(T[0])) + " (exact Black–Scholes " + r4(v) + ").", {tol: 0.03}); }); }); });
  [80, 90, 100, 110, 120].forEach(function (K) { [0.15, 0.2, 0.3, 0.4].forEach(function (s) { [0.5, 1].forEach(function (T) { [0, 0.05].forEach(function (r) { [false, true].forEach(function (put) {
    var v = bs(100, K, s, T, r, put);
    var d1 = (Math.log(100 / K) + (r + s * s / 2) * T) / (s * Math.sqrt(T)), d2 = d1 - s * Math.sqrt(T);
    var bsSteps = [
      "Inputs: S = 100, K = " + K + ", σ = " + s + ", T = " + T + ", r = " + r + ".",
      "d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T) = [" + r4(Math.log(100 / K)) + " + " + r4((r + s * s / 2) * T) + "] / " + r4(s * Math.sqrt(T)) + " ≈ " + r4(d1) + ".",
      "d₂ = d₁ − σ√T ≈ " + r4(d2) + ". The discount factor is e^(−rT) ≈ " + r4(Math.exp(-r * T)) + ".",
      put ? "Put = K e^(−rT) N(−d₂) − S N(−d₁) = " + K + " × " + r4(Math.exp(-r * T)) + " × " + r4(Ncdf(-d2)) + " − 100 × " + r4(Ncdf(-d1)) + " ≈ " + money(v) + "."
          : "Call = S N(d₁) − K e^(−rT) N(d₂) = 100 × " + r4(Ncdf(d1)) + " − " + K + " × " + r4(Math.exp(-r * T)) + " × " + r4(Ncdf(d2)) + " ≈ " + money(v) + "."];
    add("bs", "Black–Scholes", "options", 3, "Black–Scholes " + (put ? "put" : "call") + " price: spot $100, strike $" + K + ", vol " + Math.round(s * 100) + "%, " + (T === 1 ? "1 year" : "6 months") + " to expiry, rate " + (r * 100) + "%. (To the cent.)", v,
      "d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T), d₂ = d₁ − σ√T.", (put ? "Put = K e^(−rT) N(−d₂) − S N(−d₁)" : "Call = S N(d₁) − K e^(−rT) N(d₂)") + " ≈ " + money(v) + ".", {tol: 0.01, abs: 0.02, steps: bsSteps}); }); }); }); }); });
  [90, 100, 110].forEach(function (S) { [90, 95, 100, 105, 110].forEach(function (K) { var c = Math.round(bs(S, K, 0.25, 0.5, 0) * 100) / 100, p = Math.round((c - S + K) * 100) / 100;
    add("parityp", "Put–call parity", "options", 1, "Zero rates, no dividends. Stock $" + S + ", a $" + K + " call costs " + money(c) + ". What should the $" + K + " put with the same expiry cost?", p, "C − P = S − K when rates are zero.", "P = C − S + K = " + c + " − " + S + " + " + K + " = " + money(p) + ".", {abs: 0.006});
    add("parityc", "Put–call parity", "options", 1, "Zero rates, no dividends. Stock $" + S + ", a $" + K + " put costs " + money(p) + ". What should the $" + K + " call with the same expiry cost?", c, "C − P = S − K when rates are zero.", "C = P + S − K = " + p + " + " + S + " − " + K + " = " + money(c) + ".", {abs: 0.006}); }); });
  for (var K2 = 50; K2 <= 150; K2 += 10) [2, 3.5, 5, 8].forEach(function (pr) {
    add("straddleup", "Strategies", "options", 1, "You buy a $" + K2 + " straddle for a total premium of $" + pr + ". What is the upper breakeven stock price at expiry?", K2 + pr, "The move must cover the premium.", K2 + " + " + pr + " = " + (K2 + pr) + ".", {exact: true});
    add("straddledn", "Strategies", "options", 1, "You buy a $" + K2 + " straddle for a total premium of $" + pr + ". What is the lower breakeven stock price at expiry?", K2 - pr, "The move must cover the premium.", K2 + " − " + pr + " = " + (K2 - pr) + ".", {exact: true}); });
  [1, 2, 5, 10, 20].forEach(function (Nc) { [0.25, 0.4, 0.5, 0.6, 0.75].forEach(function (d) {
    add("hedgec", "Delta hedging", "options", 1, "You are long " + Nc + " call contract" + (Nc > 1 ? "s" : "") + " (100 shares each), delta " + d + ". How many shares must you sell to be delta-neutral?", Math.round(Nc * d * 100), "Position delta = contracts × 100 × delta.", Nc + " × 100 × " + d + " = " + Math.round(Nc * d * 100) + " shares.", {exact: true});
    add("hedgep", "Delta hedging", "options", 1, "You are long " + Nc + " put contract" + (Nc > 1 ? "s" : "") + " (100 shares each), delta −" + d + ". How many shares must you buy to be delta-neutral?", Math.round(Nc * d * 100), "Puts have negative delta.", "Position delta = −" + Math.round(Nc * d * 100) + ", so buy " + Math.round(Nc * d * 100) + " shares.", {exact: true}); }); });
  [0.02, 0.05, 0.1].forEach(function (g) { [1, 2, 3, 5].forEach(function (dS) {
    add("gammapnl", "Gamma", "options", 2, "A delta-hedged position has gamma " + g + " per share. The stock moves $" + dS + ". Approximately how much does the hedged position gain, per share?", 0.5 * g * dS * dS, "Gamma P&L ≈ ½ Γ (ΔS)².", "½ × " + g + " × " + dS + "² = " + r4(0.5 * g * dS * dS) + ".", {abs: 0.0001}); }); });

  /* ================= STATISTICS ================= */
  [1, 2, 3].forEach(function (a) { [1, -1, 2, -2].forEach(function (b) { [1, 4].forEach(function (vx) { [4, 9].forEach(function (vy) {
    add("varlin", "Variance", "stats", 1, "X and Y are independent with Var(X) = " + vx + " and Var(Y) = " + vy + ". What is Var(" + a + "X " + (b < 0 ? "− " : "+ ") + Math.abs(b) + "Y)?", a * a * vx + b * b * vy,
      "Constants come out squared; independent variances add.", a + "² × " + vx + " + " + b + "² × " + vy + " = " + (a * a * vx + b * b * vy) + ".", {exact: true}); }); }); }); });
  [5, 10, 20, 30].forEach(function (s) { [4, 16, 25, 64, 100, 400].forEach(function (n) {
    add("se", "Sampling", "stats", 1, "Draws have standard deviation " + s + ". What is the standard error of the mean of " + n + " independent draws?", s / Math.sqrt(n), "SE = σ/√n.", s + "/√" + n + " = " + r4(s / Math.sqrt(n)) + ".", {abs: 0.0001}); }); });
  [0.25, 0.5, 0.75].forEach(function (w) { [[0.1, 0.15], [0.2, 0.3], [0.1, 0.3], [0.2, 0.15]].forEach(function (sg) { [-0.5, 0, 0.5, 1].forEach(function (rho) {
    var v = Math.sqrt(w * w * sg[0] * sg[0] + (1 - w) * (1 - w) * sg[1] * sg[1] + 2 * w * (1 - w) * rho * sg[0] * sg[1]);
    add("portvol", "Portfolios", "stats", 2, "A portfolio holds " + (w * 100) + "% in asset A (vol " + (sg[0] * 100) + "%) and " + ((1 - w) * 100) + "% in asset B (vol " + (sg[1] * 100) + "%), correlation " + rho + ". What is the portfolio volatility, as a decimal?", v,
      "σ² = w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂.", "√(" + r4(w * w * sg[0] * sg[0]) + " + " + r4((1 - w) * (1 - w) * sg[1] * sg[1]) + " + " + r4(2 * w * (1 - w) * rho * sg[0] * sg[1]) + ") ≈ " + r4(v) + ".", {abs: 0.0005}); }); }); });
  [0.5, 0.75, 1, 1.25, 1.5, 1.645, 1.96, 2, 2.33, 2.5, 3].forEach(function (zz) { var v = 1 - Ncdf(zz);
    add("ztail", "Normal distribution", "stats", 1, "Z is standard normal. What is P(Z > " + zz + ")? (Decimal.)", v, "Use the table values you know: 1 → 16%, 2 → 2.3%.", "1 − Φ(" + zz + ") ≈ " + r4(v) + ".", {abs: 0.001}); });
  [10, 15].forEach(function (s) { [70, 80, 90, 110, 120, 130].forEach(function (x) { var v = 1 - Ncdf((x - 100) / s);
    add("ntail", "Normal distribution", "stats", 2, "X is normal with mean 100 and SD " + s + ". What is P(X > " + x + ")? (Decimal.)", v, "Standardize: z = (x − μ)/σ.", "z = " + r4((x - 100) / s) + ", so P ≈ " + r4(v) + ".", {abs: 0.001}); }); });
  [2, 4, 5, 8].forEach(function (mu) { [0.5, 1, 1.5].forEach(function (sd) { var v = (mu / 10000) / (sd / 100) * Math.sqrt(252);
    add("sharpe", "Performance", "stats", 2, "A strategy averages " + mu + " basis points a day with daily volatility " + sd + "%. What is its annualized Sharpe ratio (252 trading days, zero risk-free rate)?", v, "Daily Sharpe × √252.", "(" + (mu / 100) + "% / " + sd + "%) × √252 ≈ " + r4(v) + "."); }); });
  [10, 20, 50, 100].forEach(function (n) { [0.1, 0.25, 0.5, 0.8].forEach(function (p) {
    add("binmean", "Distributions", "stats", 1, "X ~ Binomial(" + n + ", " + p + "). What is E[X]?", n * p, "Sum of n Bernoulli trials.", n + " × " + p + " = " + r4(n * p) + ".", {abs: 0.0001});
    add("binvar", "Distributions", "stats", 1, "X ~ Binomial(" + n + ", " + p + "). What is Var(X)?", n * p * (1 - p), "np(1 − p).", n + " × " + p + " × " + r4(1 - p) + " = " + r4(n * p * (1 - p)) + ".", {abs: 0.0001}); }); });
  [[2, 2, 4], [3, 2, 5], [-4, 4, 5], [6, 3, 4], [1, 1, 2], [-3, 2, 3], [9, 3, 5], [-2, 1, 4], [5, 5, 2], [12, 4, 6], [-6, 3, 4], [8, 4, 4]].forEach(function (t) {
    add("corr", "Correlation", "stats", 1, "Cov(X, Y) = " + t[0] + ", SD(X) = " + t[1] + ", SD(Y) = " + t[2] + ". What is Corr(X, Y)?", t[0] / (t[1] * t[2]), "ρ = Cov / (σx σy).", t[0] + " / (" + t[1] + " × " + t[2] + ") = " + r4(t[0] / (t[1] * t[2])) + ".", {abs: 0.0001});
    add("beta", "Regression", "stats", 2, "Cov(X, Y) = " + t[0] + " and SD(X) = " + t[1] + ". What is the OLS slope when regressing Y on X?", t[0] / (t[1] * t[1]), "β = Cov(X,Y) / Var(X).", t[0] + " / " + (t[1] * t[1]) + " = " + r4(t[0] / (t[1] * t[1])) + ".", {abs: 0.0001}); });

  window.EDGE_GENERATED = OUT;
})();
