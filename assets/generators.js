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

  /* ================= SEQUENCES (next-term questions from online assessments) ================= */
  function diffs(a) { var d = []; for (var i = 1; i < a.length; i++) d.push(a[i] - a[i - 1]); return d; }
  function seqQ(terms) { return "What number comes next? " + terms.join(", ") + ", …"; }
  function seqAdd(kind, diff, terms, next, hint, ex, extra) {
    var d1 = diffs(terms), d2 = diffs(d1);
    var steps = ["Write the sequence: " + terms.join(", ") + ".", "First differences: " + d1.join(", ") + ".", "Second differences: " + d2.join(", ") + "."].concat(extra || []).concat(["The pattern gives " + next + "."]);
    add("seq-" + kind, "Sequences", "brain", diff, seqQ(terms), next, hint, ex, {exact: true, steps: steps});
  }
  [3, 7, 12, 25, 40, -5].forEach(function (a) { [4, 6, 9, 11, 13, -7, -3, 15].forEach(function (d) {
    var t = []; for (var i = 0; i < 5; i++) t.push(a + i * d);
    seqAdd("arith", 1, t, a + 5 * d, "Look at the gap between neighbors.", "Each term changes by " + d + ", so the next is " + t[4] + " " + (d < 0 ? "− " + (-d) : "+ " + d) + " = " + (a + 5 * d) + ".");
  }); });
  [1, 2, 3, 5, 7].forEach(function (a) { [2, 3, -2, 4].forEach(function (r) {
    var t = []; for (var i = 0; i < 5; i++) t.push(a * Math.pow(r, i));
    seqAdd("geo", 1, t, a * Math.pow(r, 5), "Try dividing each term by the one before.", "Each term is the previous one times " + r + ": " + t[4] + " × " + r + " = " + (a * Math.pow(r, 5)) + ".", ["Ratios between neighbors are all " + r + ", so it's geometric."]);
  }); });
  [1, 2, 3].forEach(function (p) { [0, 1, -2].forEach(function (q) { [0, 3, 5].forEach(function (r) {
    var f = function (n) { return p * n * n + q * n + r; }, t = []; for (var n = 1; n <= 5; n++) t.push(f(n));
    seqAdd("quad", 2, t, f(6), "The gaps themselves grow steadily. Check the second differences.", "The second differences are constant (" + (2 * p) + "), so the next gap is " + (f(6) - f(5)) + " and the next term is " + f(5) + " + " + (f(6) - f(5)) + " = " + f(6) + ".", ["Constant second differences mean a quadratic: the next first difference is " + (f(5) - f(4)) + " + " + (2 * p) + " = " + (f(6) - f(5)) + "."]);
  }); }); });
  [-1, 0, 1, 2, 5].forEach(function (c) {
    var t = []; for (var n = 1; n <= 5; n++) t.push(n * n * n + c);
    seqAdd("cube", 2, t, 216 + c, "Compare each term with 1, 8, 27, 64, 125.", "These are cubes " + (c ? (c > 0 ? "plus " + c : "minus " + (-c)) : "") + ": 6³" + (c ? (c > 0 ? " + " + c : " − " + (-c)) : "") + " = " + (216 + c) + ".", ["Third differences are constant (6), the signature of cubes."]);
  });
  (function () { var t = []; for (var n = 1; n <= 5; n++) t.push(n * n * n - n); seqAdd("cube", 3, t, 216 - 6, "Compare with the cubes 1, 8, 27, 64, 125.", "Each term is n³ − n: 6³ − 6 = 210."); })();
  [[1, 1], [2, 3], [1, 4], [3, 5], [2, 7], [5, 8], [4, 1], [1, 3], [10, 10], [3, 2]].forEach(function (s) {
    var t = [s[0], s[1]]; while (t.length < 6) t.push(t[t.length - 1] + t[t.length - 2]);
    seqAdd("fib", 2, t, t[4] + t[5], "Each term may depend on the two before it.", "Each term is the sum of the previous two: " + t[4] + " + " + t[5] + " = " + (t[4] + t[5]) + ".", ["The differences repeat the sequence itself, a sign of a Fibonacci-style rule."]);
  });
  [[1, 1, 2], [0, 1, 1], [2, 1, 3], [1, 2, 3]].forEach(function (s) {
    var t = s.slice(); while (t.length < 7) t.push(t[t.length - 1] + t[t.length - 2] + t[t.length - 3]);
    var nx = t[4] + t[5] + t[6];
    seqAdd("trib", 3, t, nx, "Try adding the previous three terms.", "Each term is the sum of the previous three: " + t[4] + " + " + t[5] + " + " + t[6] + " = " + nx + ".");
  });
  [[1, 3, 10, -2], [2, 5, 20, -3], [5, 2, 1, 4], [10, 10, 3, 3], [0, 4, 50, -5], [7, -1, 2, 6]].forEach(function (x) {
    [6, 7].forEach(function (len) {
      var t = []; for (var i = 0; i < len; i++) t.push(i % 2 === 0 ? x[0] + (i / 2) * x[1] : x[2] + ((i - 1) / 2) * x[3]);
      var i2 = len, nx = i2 % 2 === 0 ? x[0] + (i2 / 2) * x[1] : x[2] + ((i2 - 1) / 2) * x[3];
      seqAdd("alt", 2, t, nx, "Look at every other term.", "Two sequences are interleaved. Odd positions go " + x[0] + ", " + (x[0] + x[1]) + ", … (step " + x[1] + "); even positions go " + x[2] + ", " + (x[2] + x[3]) + ", … (step " + x[3] + "). The next term is " + nx + ".", ["Split into odd and even positions; each is arithmetic."]);
    });
  });
  [2, 3].forEach(function (m) { [1, -1, 2, 3].forEach(function (c) { [1, 2, 3].forEach(function (s0) {
    var t = [s0]; while (t.length < 5) t.push(m * t[t.length - 1] + c);
    if (t[1] === t[0]) return; /* a fixed point (e.g. 1, 1, 1, …) isn't a real puzzle */
    var nx = m * t[4] + c;
    seqAdd("lin", 2, t, nx, "Try multiplying the previous term, then adjusting.", "Each term is " + m + " × previous " + (c < 0 ? "− " + (-c) : "+ " + c) + ": " + m + " × " + t[4] + (c < 0 ? " − " + (-c) : " + " + c) + " = " + nx + ".", ["The differences grow by a factor of " + m + ", which points to a rule of the form x → " + m + "x + c."]);
  }); }); });
  [1, 2, 4, 5, 10].forEach(function (s0) {
    var t = [s0]; for (var n = 1; t.length < 6; n++) t.push(t[t.length - 1] + n);
    seqAdd("tri", 1, t, t[5] + 6, "Look at the differences.", "The gaps are 1, 2, 3, 4, 5, so the next gap is 6: " + t[5] + " + 6 = " + (t[5] + 6) + ".");
  });
  [0, 1, -1, 2, 10].forEach(function (k) {
    var pr = [2, 3, 5, 7, 11, 13, 17], t = pr.slice(0, 6).map(function (x) { return x + k; });
    seqAdd("prime", 2, t, 17 + k, "Compare with 2, 3, 5, 7, 11, 13.", "These are the primes" + (k ? (k > 0 ? " plus " + k : " minus " + (-k)) : "") + ". The next prime is 17, so the next term is " + (17 + k) + ".");
  });

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

  /* ================= METHOD-FIRST EXPLANATIONS =================
     Rewrites the short "formula = answer" explanations so each one teaches how to get there.
     Numbers are read back from the question text; if a pattern ever fails to match, the original explanation stays. */
  function nums(s) { return (s.match(/-?\d+(?:\.\d+)?/g) || []).map(Number); }
  function fx(x) { return String(+(+x).toFixed(6)); }
  var EXPLAIN = {
    mul2: function (q) { var m = q.match(/What is (\d+) × (\d+)\?/); if (!m) return; var a = +m[1], b = +m[2], bt = b - b % 10, bu = b % 10;
      if (bu === 0) return a + " × " + b + " = " + a + " × " + (b / 10) + " × 10 = " + (a * b / 10) + " × 10 = " + (a * b) + ".";
      return "Split " + b + " into " + bt + " + " + bu + ": " + a + " × " + bt + " = " + (a * bt) + " and " + a + " × " + bu + " = " + (a * bu) + ". Add them: " + (a * bt) + " + " + (a * bu) + " = " + (a * b) + "."; },
    square: function (q) { var m = q.match(/What is (\d+)²\?/); if (!m) return; var n = +m[1], t = Math.round(n / 10) * 10, r = n - t;
      if (r === 0) return n + "² = " + (n / 10) + "² × 100 = " + (n * n) + ".";
      return "Round to the nearest ten and correct: a² = (a − r)(a + r) + r². Here " + n + "² = " + t + " × " + (n + r) + " + " + (r * r) + " = " + (t * (n + r)) + " + " + (r * r) + " = " + (n * n) + "."; },
    pctof: function (q) { var m = q.match(/What is (\d+)% of (\d+)\?/); if (!m) return; var p = +m[1], x = +m[2], v = p * x / 100;
      if (p % 25 === 0) return p + "% is " + (p === 25 ? "a quarter" : p === 75 ? "three quarters" : "half") + ": " + x + " × " + fr(p, 100) + " = " + fx(v) + ".";
      if (p >= 85) return "Easier as 100% − " + (100 - p) + "%: " + (100 - p) + "% of " + x + " is " + fx(x * (100 - p) / 100) + ", so the answer is " + x + " − " + fx(x * (100 - p) / 100) + " = " + fx(v) + ".";
      if (p === 5) return "5% is half of 10%. 10% of " + x + " is " + fx(x / 10) + ", so 5% is " + fx(v) + ".";
      var tens = Math.floor(p / 10), five = p % 10 >= 5 ? 1 : 0, ones = p % 10 - 5 * five, parts = [], sum = [];
      if (tens) { parts.push("10% is " + fx(x / 10)); sum.push((tens > 1 ? tens + " × " : "") + fx(x / 10)); }
      if (five) { parts.push("5% is " + fx(x / 20)); sum.push(fx(x / 20)); }
      if (ones) { parts.push("1% is " + fx(x / 100)); sum.push((ones > 1 ? ones + " × " : "") + fx(x / 100)); }
      return "Build it from easy pieces of " + x + ": " + parts.join(", ") + ". So " + p + "% = " + sum.join(" + ") + " = " + fx(v) + "."; },
    tofrac: function (q) { var m = q.match(/Write (\d+)\/(\d+) as a decimal/); if (!m) return; var k = +m[1], d = +m[2];
      if (100 % d === 0) return "Scale the denominator to 100: " + k + "/" + d + " = " + (k * 100 / d) + "/100 = " + fx(k / d) + ".";
      if (1000 % d === 0) return "Scale the denominator to 1000: " + k + "/" + d + " = " + (k * 1000 / d) + "/1000 = " + fx(k / d) + ".";
      return "Start from the unit fraction: 1/" + d + " = " + fx(1 / d) + ". Then " + k + "/" + d + " = " + k + " × " + fx(1 / d) + " = " + fx(k / d) + "."; },
    shake: function (q) { var n = nums(q)[0]; return "Each handshake is one pair of people, so count pairs: " + n + " × " + (n - 1) + " / 2 = " + (n * (n - 1) / 2) + ". (Each person shakes " + (n - 1) + " hands, and dividing by 2 stops each handshake being counted twice.)"; },
    diag: function (q) { var n = nums(q)[0]; return "From each of the " + n + " corners you can draw a diagonal to " + (n - 3) + " others (not itself or its two neighbors). That counts every diagonal from both ends, so halve it: " + n + " × " + (n - 3) + " / 2 = " + (n * (n - 3) / 2) + "."; },
    zeros: function (q) { var n = nums(q)[0], t = [], z = 0; for (var p = 5; p <= n; p *= 5) { t.push(Math.floor(n / p)); z += Math.floor(n / p); }
      return "A trailing zero needs a factor of 10 = 2 × 5. Factors of 2 are plentiful, so count the 5s: multiples of 5 give one each, multiples of 25 an extra one, and so on. " + t.map(function (x, i) { return "⌊" + n + "/" + Math.pow(5, i + 1) + "⌋ = " + x; }).join(", ") + ". Total: " + z + "."; },
    lastdigit: function (q) { var m = q.match(/last digit of (\d+)\^(\d+)/); if (!m) return; var b = +m[1], e = +m[2], cyc = [], d = b % 10;
      while (cyc.indexOf(d) < 0) { cyc.push(d); d = d * b % 10; }
      var L = cyc.length, pos = (e - 1) % L;
      return "Only last digits matter. Powers of " + b + " end in " + cyc.join(", ") + (L > 1 ? ", then repeat (a cycle of " + L + ")" : " every time") + ". " + (L > 1 ? e + " leaves remainder " + ((e % L) || L) + " in that cycle, so " + b + "^" + e + " ends in " + cyc[pos] + "." : "So " + b + "^" + e + " ends in " + cyc[0] + "."); },
    lcm: function (q) { var n = nums(q)[1], f = []; [2, 3, 5, 7, 11, 13, 17, 19].forEach(function (p) { if (p > n) return; var k = p; while (k * p <= n) k *= p; f.push(k === p ? String(p) : p + "^" + Math.round(Math.log(k) / Math.log(p))); });
      var v = 1; for (var i = 2; i <= n; i++) v = lcm(v, i);
      return "The answer needs the highest power of each prime that appears up to " + n + ": " + f.join(" × ") + " = " + v.toLocaleString() + "."; },
    geom: function (q) { var m = q.match(/probability ([\d.]+)\. What is the expected number of flips to get (\d+) head/); if (!m) return; var p = +m[1], k = +m[2];
      return "Each head takes 1/p = 1/" + p + " = " + fx(1 / p) + " flips on average (a geometric wait). The " + k + " wait" + (k > 1 ? "s happen one after another, so add them" : " is all you need") + ": " + k + " × " + fx(1 / p) + " = " + fx(k / p) + "."; },
    rwhit: function (q) { var m = q.match(/reaches \+(\d+) before −(\d+)/); if (!m) return; var b = +m[1], a = +m[2];
      return "A fair walk's expected position never changes, so at the end it's still 0. The walk ends at +" + b + " with probability p or at −" + a + " otherwise: p × " + b + " − (1 − p) × " + a + " = 0, so p = " + a + "/(" + a + " + " + b + ") = " + fr(a, a + b) + "."; },
    rwtime: function (q) { var m = q.match(/hits \+(\d+) or −(\d+)/); if (!m) return; var b = +m[1], a = +m[2];
      return "For a ±1 walk, (position)² − (steps taken) has a constant expected value of 0, so E[steps] = E[final position²]. The walk ends at +" + b + " with probability " + a + "/" + (a + b) + " and at −" + a + " with probability " + b + "/" + (a + b) + ": E = " + b + "² × " + a + "/" + (a + b) + " + " + a + "² × " + b + "/" + (a + b) + " = " + a + " × " + b + " = " + (a * b) + "."; },
    ruinfair: function (q) { var m = q.match(/You have \$(\d+) and bet \$1 on fair coin flips until you reach \$(\d+)/); if (!m) return; var a = +m[1], N = +m[2];
      return "In a fair game your expected wealth stays at $" + a + ". You finish with $" + N + " (probability p) or $0, so " + N + "p = " + a + " and p = " + fr(a, N) + "."; },
    unifmax: function (q) { var n = nums(q)[0]; return "The max is below t only if all " + n + " draws are, so P(max ≤ t) = t^" + n + " and its density is " + n + "t^" + (n - 1) + ". Then E[max] = ∫₀¹ t × " + n + "t^" + (n - 1) + " dt = " + n + "/" + (n + 1) + ". (General rule: n/(n+1).)"; },
    unifmin: function (q) { var n = nums(q)[0]; return "Flip every draw to 1 − X: the smallest becomes the largest. The largest of " + n + " uniforms averages " + n + "/" + (n + 1) + ", so the smallest averages 1 − " + n + "/" + (n + 1) + " = 1/" + (n + 1) + "."; },
    expmin: function (q) { var k = nums(q)[0]; return "All " + k + " clocks are still running at time t with probability (e^(−t))^" + k + " = e^(−" + k + "t). That's an Exponential(" + k + ") tail, so the first ring comes after 1/" + k + " on average."; },
    coupon: function (q) { var n = nums(q)[0]; return "Split the wait into stages. After seeing i faces, a new face appears with probability (" + n + " − i)/" + n + ", so that stage takes " + n + "/(" + n + " − i) rolls on average. Add the stages: " + n + "/" + n + " + " + n + "/" + (n - 1) + " + … + " + n + "/1 = " + n + " × (1 + 1/2 + … + 1/" + n + ") ≈ " + r4(n * H(n)) + "."; },
    se: function (q) { var m = q.match(/standard deviation (\d+)\. What is the standard error of the mean of (\d+)/); if (!m) return; var s = +m[1], n = +m[2];
      return "Averaging n independent draws divides the variance by n, so the spread shrinks by √n: " + s + "/√" + n + " = " + s + "/" + fx(Math.sqrt(n)) + " = " + fx(s / Math.sqrt(n)) + "."; },
    varlin: function (q) { var m = q.match(/Var\(X\) = (\d+) and Var\(Y\) = (\d+)\. What is Var\((\d+)X ([+−]) (\d+)Y\)/); if (!m) return; var vx = +m[1], vy = +m[2], a = +m[3], b = +m[5];
      return "Two rules: constants come out squared, and independent variances add with no covariance term" + (m[4] === "−" ? " (so the minus sign disappears: (−" + b + ")² = " + (b * b) + ")" : "") + ". So " + a + "² × " + vx + " + " + b + "² × " + vy + " = " + (a * a * vx) + " + " + (b * b * vy) + " = " + (a * a * vx + b * b * vy) + "."; },
    corr: function (q) { var x = nums(q.replace(/\(X, Y\)|\(X\)|\(Y\)/g, "")); var c = x[0], sx = x[1], sy = x[2];
      return "Correlation is covariance with both spreads divided out: ρ = Cov/(SD(X) × SD(Y)) = " + c + "/(" + sx + " × " + sy + ") = " + fx(c / (sx * sy)) + ". It always lands between −1 and 1."; },
    beta: function (q) { var x = nums(q.replace(/\(X, Y\)|\(X\)|\(Y\)/g, "")); var c = x[0], sx = x[1];
      return "The OLS slope is Cov(X, Y)/Var(X) = " + c + "/" + sx + "² = " + c + "/" + (sx * sx) + " = " + fx(c / (sx * sx)) + ". On average Y moves that much for each one-unit move in X."; },
    binmean: function (q) { var m = q.match(/Binomial\((\d+), ([\d.]+)\)/); if (!m) return; var n = +m[1], p = +m[2];
      return "X counts successes in " + n + " independent trials. Each trial contributes p = " + p + " on average, and expectations add: " + n + " × " + p + " = " + fx(n * p) + "."; },
    binvar: function (q) { var m = q.match(/Binomial\((\d+), ([\d.]+)\)/); if (!m) return; var n = +m[1], p = +m[2];
      return "Each trial is a 0/1 variable with variance p(1 − p) = " + p + " × " + fx(1 - p) + " = " + fx(p * (1 - p)) + ". The trials are independent, so variances add: " + n + " × " + fx(p * (1 - p)) + " = " + fx(n * p * (1 - p)) + "."; },
    straddleup: function (q) { var m = q.match(/\$(\d+) straddle for a total premium of \$(\d+(?:\.\d+)?)/); if (!m) return; var K = +m[1], pr = +m[2];
      return "A straddle pays |S − K| at expiry. You only profit once the move from $" + K + " covers the $" + pr + " you paid, so the upper breakeven is " + K + " + " + pr + " = " + fx(K + pr) + "."; },
    straddledn: function (q) { var m = q.match(/\$(\d+) straddle for a total premium of \$(\d+(?:\.\d+)?)/); if (!m) return; var K = +m[1], pr = +m[2];
      return "A straddle pays |S − K| at expiry. On the downside the stock must fall far enough below $" + K + " to cover the $" + pr + " premium: " + K + " − " + pr + " = " + fx(K - pr) + "."; },
    gammapnl: function (q) { var m = q.match(/gamma ([\d.]+) per share\. The stock moves \$(\d+)/); if (!m) return; var g = +m[1], d = +m[2];
      return "Delta hedging cancels the first-order (straight-line) P&L. What's left is the curvature term from a Taylor expansion: ½ × Γ × (ΔS)² = ½ × " + g + " × " + d + "² = " + fx(0.5 * g * d * d) + ". Long gamma gains whichever way the stock moves."; },
    ztail: function (q) { var z = nums(q)[0];
      return "Anchor on values worth memorizing: P(Z > 1) ≈ 0.159, P(Z > 1.645) ≈ 0.05, P(Z > 1.96) ≈ 0.025, P(Z > 2) ≈ 0.023, P(Z > 3) ≈ 0.0013. For z = " + z + ": 1 − Φ(" + z + ") ≈ " + r4(1 - Ncdf(z)) + "."; },
    ntail: function (q) { var m = q.match(/SD (\d+)\. What is P\(X > (\d+)\)/); if (!m) return; var s = +m[1], x = +m[2], z = (x - 100) / s, v = 1 - Ncdf(z);
      return "Standardize: z = (" + x + " − 100)/" + s + " = " + fx(z) + ". " + (z < 0 ? "Below the mean, so P(X > " + x + ") = 1 − P(Z > " + fx(-z) + ") ≈ " + r4(v) + "." : "P(X > " + x + ") = P(Z > " + fx(z) + ") ≈ " + r4(v) + ". (68–95–99.7 rule: about 16% lies above 1 SD, 2.5% above 2 SD.)"); },
    pyshift: function (q) { var k = nums(q.replace("1 <<", ""))[0]; return "<< shifts the bits left; each shift doubles the number. Starting from 1 and shifting " + k + " times gives 2^" + k + " = " + Math.pow(2, k).toLocaleString() + "."; },
    odds: function (q) { var n = nums(q)[0]; return "Try small cases: 1 = 1², 1 + 3 = 2², 1 + 3 + 5 = 3². Each new odd number turns a k × k square into a (k+1) × (k+1) square, so the first " + n + " odd numbers sum to " + n + "² = " + (n * n) + "."; },
    atleast: function (q) { var m = q.match(/(\d+) times\. What is the probability that a (\d+) appears/); if (!m) return; var k = +m[1], n = +m[2], miss = Math.pow((n - 1) / n, k);
      return "It's easier to find the chance it never appears. Each roll misses with probability " + (n - 1) + "/" + n + ", and the rolls are independent, so P(never) = (" + (n - 1) + "/" + n + ")^" + k + " ≈ " + r4(miss) + ". So P(at least once) = 1 − " + r4(miss) + " ≈ " + r4(1 - miss) + "."; },
    binfair: function (q) { var m = q.match(/fair coin (\d+) times\. What is the probability of exactly (\d+) heads/); if (!m) return; var n = +m[1], k = +m[2], c = C(n, k), t = Math.pow(2, n);
      return "All 2^" + n + " = " + t + " sequences of flips are equally likely. Choosing which " + k + " flips are heads gives C(" + n + "," + k + ") = " + c + " of them. So the probability is " + c + "/" + t + (fr(c, t) !== c + "/" + t ? " = " + fr(c, t) : "") + "."; },
    binbias: function (q) { var m = q.match(/probability ([\d.]+)\. You flip it (\d+) times\. What is the probability of exactly (\d+) heads/); if (!m) return; var p = +m[1], n = +m[2], k = +m[3], one = Math.pow(p, k) * Math.pow(1 - p, n - k);
      return "Any one sequence with " + k + " heads and " + (n - k) + " tails has probability " + p + "^" + k + " × " + fx(1 - p) + "^" + (n - k) + " ≈ " + r4(one) + ". There are C(" + n + "," + k + ") = " + C(n, k) + " such sequences, so the total is " + C(n, k) + " × " + r4(one) + " ≈ " + r4(C(n, k) * one) + "."; },
    bagsame: function (q) { var m = q.match(/holds (\d+) red and (\d+) blue/); if (!m) return; var r = +m[1], b = +m[2], T = C(r + b, 2), x = C(r, 2), y = C(b, 2);
      return "There are C(" + (r + b) + ",2) = " + T + " equally likely pairs. Same color means both red (C(" + r + ",2) = " + x + " pairs) or both blue (C(" + b + ",2) = " + y + " pairs): (" + x + " + " + y + ")/" + T + " = " + fr(x + y, T) + "."; },
    bagred: function (q) { var m = q.match(/holds (\d+) red and (\d+) blue/); if (!m) return; var r = +m[1], b = +m[2];
      return "The first ball is red with probability " + r + "/" + (r + b) + ". After that, " + (r - 1) + " reds remain among " + (r + b - 1) + " balls, so the second is red with probability " + (r - 1) + "/" + (r + b - 1) + ". Multiply: " + fr(r * (r - 1), (r + b) * (r + b - 1)) + "."; },
    distinct: function (q) { var m = q.match(/fair (?:(\d+)-sided|six-sided) die (\d+) times/); if (!m) return; var n = m[1] ? +m[1] : 6, k = +m[2], hit = 1 - Math.pow((n - 1) / n, k);
      return "Use linearity: take the faces one at a time. A given face is missed by all " + k + " rolls with probability (" + (n - 1) + "/" + n + ")^" + k + ", so it shows up with probability " + r4(hit) + ". Add that up over " + n + " faces: " + n + " × " + r4(hit) + " ≈ " + r4(n * hit) + "."; },
    ace: function (q) { var k = nums(q)[0], none = C(48, k) / C(52, k);
      return "Use the complement. No aces means all " + k + " card" + (k > 1 ? "s come" : " comes") + " from the 48 non-aces: C(48," + k + ")/C(52," + k + ") ≈ " + r4(none) + ". So P(at least one ace) = 1 − " + r4(none) + " ≈ " + r4(1 - none) + "."; },
    suit: function (q) { var k = nums(q)[0];
      return "Choose the suit (4 ways), then " + k + " of its 13 cards: 4 × C(13," + k + ") = " + (4 * C(13, k)).toLocaleString() + " hands. All hands: C(52," + k + ") = " + C(52, k).toLocaleString() + ". Divide: ≈ " + r4(4 * C(13, k) / C(52, k)) + "."; },
    poisson: function (q) { var m = q.match(/averaging ([\d.]+) per hour\. What is the probability of exactly (\d+) events/); if (!m) return; var L = +m[1], k = +m[2];
      return "A Poisson count with mean λ = " + L + " has P(N = k) = e^(−λ) λ^k / k!. Here e^(−" + L + ") ≈ " + r4(Math.exp(-L)) + ", λ^" + k + " = " + fx(Math.pow(L, k)) + " and " + k + "! = " + fact(k) + ", giving ≈ " + r4(Math.exp(-L) * Math.pow(L, k) / fact(k)) + "."; },
    sharpe: function (q) { var m = q.match(/averages (\d+) basis points a day with daily volatility ([\d.]+)%/); if (!m) return; var mu = +m[1] / 100, sd = +m[2], d = mu / sd;
      return "Daily Sharpe = mean ÷ volatility = " + fx(mu) + "% / " + sd + "% = " + fx(d) + ". Over a year the mean grows with the number of days (×252) but volatility only with its square root (×√252), so the ratio grows by √252 ≈ 15.87: " + fx(d) + " × 15.87 ≈ " + r4(d * Math.sqrt(252)) + "."; },
    hedgec: function (q) { var m = q.match(/long (\d+) call contract.*delta ([\d.]+)\./); if (!m) return; var n = +m[1], d = +m[2];
      return "Each contract covers 100 shares, so your delta is " + n + " × 100 × " + d + " = " + Math.round(n * 100 * d) + " shares' worth of exposure. Selling that many shares cancels it."; },
    hedgep: function (q) { var m = q.match(/long (\d+) put contract.*delta −([\d.]+)\./); if (!m) return; var n = +m[1], d = +m[2];
      return "Puts gain when the stock falls, so their delta is negative: " + n + " × 100 × (−" + d + ") = −" + Math.round(n * 100 * d) + " shares. Buying " + Math.round(n * 100 * d) + " shares brings the total to zero."; },
    pyfloor: function (q) { var m = q.match(/print\((-?\d+) \/\/ (-?\d+)\)/); if (!m) return; var x = +m[1], y = +m[2], v = Math.floor(x / y);
      return "// is floor division: it divides, then rounds down toward −∞ (not toward zero). " + x + " / " + y + " = " + fx(x / y) + ", which rounds down to " + v + "." + (x / y < 0 && x % y !== 0 ? " Watch out: rounding toward zero would give " + Math.trunc(x / y) + "." : ""); },
    pymod: function (q) { var m = q.match(/print\((-?\d+) % (-?\d+)\)/); if (!m) return; var x = +m[1], y = +m[2], qq = Math.floor(x / y), md = x - y * qq;
      return "Python defines a % b = a − b × (a // b), so the result takes the sign of b. Here " + x + " // " + y + " = " + qq + ", so " + x + " % " + y + " = " + x + " − (" + y + ") × (" + qq + ") = " + md + "."; },
    rects: function (q) { var m = q.match(/in a (\d+) × (\d+) grid/); if (!m) return; var a = +m[1], b = +m[2];
      return "A rectangle is fixed by picking 2 of the " + (a + 1) + " horizontal grid lines and 2 of the " + (b + 1) + " vertical ones: C(" + (a + 1) + ",2) × C(" + (b + 1) + ",2) = " + C(a + 1, 2) + " × " + C(b + 1, 2) + " = " + C(a + 1, 2) * C(b + 1, 2) + "."; },
    arith: function (q) { var m = q.match(/from (\d+) to (\d+)/); if (!m) return; var a = +m[1], b = +m[2], n = b - a + 1;
      return "Pair the first and last terms: " + a + " + " + b + " = " + (a + b) + ", and every pair moving inward has the same sum. That's " + n + " terms averaging " + fx((a + b) / 2) + ", so the sum is " + n + " × " + fx((a + b) / 2) + " = " + (n * (a + b) / 2).toLocaleString() + "."; },
    bayes: function (q) { var m = q.match(/affects ([\d.]+)% of people\. A test detects it ([\d.]+)% of the time and falsely flags ([\d.]+)%/); if (!m) return;
      var pr = +m[1] / 100, se = +m[2] / 100, fp = +m[3] / 100, N = 100000, sick = pr * N, tp = se * sick, fpos = fp * (N - sick);
      return "Picture " + N.toLocaleString() + " people. " + fx(sick).toLocaleString() + " have the condition and the test catches " + fx(tp) + " of them. Of the " + fx(N - sick) + " healthy people, " + fx(fpos) + " are falsely flagged. So of the " + fx(tp + fpos) + " positives, " + fx(tp) + " really have it: " + fx(tp) + " / " + fx(tp + fpos) + " ≈ " + r4(tp / (tp + fpos)) + ". When a condition is rare, false positives can outnumber true ones."; },
    bdaypairs: function (q) { var n = nums(q)[0];
      return "Use linearity over pairs. There are C(" + n + ",2) = " + C(n, 2) + " pairs, and each pair shares a birthday with probability 1/365. Expected matching pairs: " + C(n, 2) + "/365 ≈ " + r4(C(n, 2) / 365) + ". No independence is needed, which is why linearity is so useful."; },
    dicesum: function (q) { var m = q.match(/two (?:fair (\d+)-sided|fair six-sided) dice\. What is the probability the sum is exactly (\d+)/); if (!m) return; var n = m[1] ? +m[1] : 6, s = +m[2], pairs = [];
      for (var i = 1; i <= n; i++) { var j = s - i; if (j >= 1 && j <= n) pairs.push("(" + i + "," + j + ")"); }
      return "There are " + n + " × " + n + " = " + (n * n) + " equally likely ordered outcomes. The ones summing to " + s + " are " + (pairs.length <= 8 ? pairs.join(", ") : pairs.slice(0, 3).join(", ") + ", …, " + pairs[pairs.length - 1]) + ": " + pairs.length + " in total. So the probability is " + pairs.length + "/" + (n * n) + (fr(pairs.length, n * n) !== pairs.length + "/" + (n * n) ? " = " + fr(pairs.length, n * n) : "") + "."; },
    stairs2: function (q) { var n = nums(q)[0], f = [1, 1]; for (var i = 2; i <= n; i++) f.push(f[i - 1] + f[i - 2]);
      return "Look at the last move: it's either 1 stair (leaving " + (n - 1) + " to climb before it) or 2 stairs (leaving " + (n - 2) + "). So f(n) = f(n − 1) + f(n − 2), with f(1) = 1 and f(2) = 2. Building up: " + f.slice(1, n + 1).join(", ") + ". So f(" + n + ") = " + f[n] + "."; },
    portvol: function (q) { var m = q.match(/holds (\d+)% in asset A \(vol (\d+)%\) and (\d+)% in asset B \(vol (\d+)%\), correlation (-?\d+(?:\.\d+)?)/); if (!m) return;
      var w1 = +m[1] / 100, s1 = +m[2] / 100, w2 = +m[3] / 100, s2 = +m[4] / 100, rho = +m[5], a = w1 * w1 * s1 * s1, b = w2 * w2 * s2 * s2, c = 2 * w1 * w2 * rho * s1 * s2, v = Math.sqrt(a + b + c);
      return "Portfolio variance = w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂ = " + r4(a) + " + " + r4(b) + (c < 0 ? " − " + r4(-c) : " + " + r4(c)) + " = " + r4(a + b + c) + ". Take the square root for volatility: ≈ " + r4(v) + ". " + (rho < 1 ? "Because ρ < 1, that's below the weighted average of the two vols (" + r4(w1 * s1 + w2 * s2) + "): diversification." : "With ρ = 1 there's no diversification: it equals the weighted average of the vols."); },
    parityp: function (q) { var m = q.match(/Stock \$(\d+), a \$(\d+) call costs \$([\d]+\.\d+)\./); if (!m) return; var S = +m[1], K = +m[2], c = +m[3];
      return "A long call plus a short put pays S − K at expiry no matter what, the same as owning the stock and owing K. With zero rates their prices must match: C − P = S − K. So P = C − S + K = " + c + " − " + S + " + " + K + " = $" + (c - S + K).toFixed(2) + "."; },
    parityc: function (q) { var m = q.match(/Stock \$(\d+), a \$(\d+) put costs \$([\d]+\.\d+)\./); if (!m) return; var S = +m[1], K = +m[2], p = +m[3];
      return "A long call plus a short put pays S − K at expiry no matter what, the same as owning the stock and owing K. With zero rates: C − P = S − K. So C = P + S − K = " + p + " + " + S + " − " + K + " = $" + (p + S - K).toFixed(2) + "."; },
    words: function (q) { var m = q.match(/letters in ([A-Z]+)\?/); if (!m) return; var w = m[1], cnt = {}; w.split("").forEach(function (ch) { cnt[ch] = (cnt[ch] || 0) + 1; });
      var reps = Object.keys(cnt).filter(function (ch) { return cnt[ch] > 1; }), den = 1; reps.forEach(function (ch) { den *= fact(cnt[ch]); });
      if (!reps.length) return "All " + w.length + " letters are different, so every ordering is a new word: " + w.length + "! = " + fact(w.length).toLocaleString() + ".";
      return "Start with all " + w.length + "! = " + fact(w.length).toLocaleString() + " orderings, as if every letter were different. Swapping identical letters doesn't create a new word, so divide by " + reps.map(function (ch) { return cnt[ch] + "! for the " + cnt[ch] + " " + ch + "s"; }).join(" and ") + ": " + fact(w.length).toLocaleString() + " / " + den + " = " + (fact(w.length) / den).toLocaleString() + "."; },
    squares: function (q) { var n = nums(q)[0], sq = 0; for (var i = 1; i <= n; i++) sq += i * i; return "Count by size: a k × k square fits in (" + n + " − k + 1)² positions. Adding sizes 1 to " + n + " gives " + n + "² + " + (n - 1) + "² + … + 1² = " + sq + "."; }
  };
  OUT.forEach(function (p) {
    var f = EXPLAIN[p.key.replace(/-\d+$/, "")];
    if (!f) return;
    try { var e = f(p.q); if (e) p.ex = e; else p.exMiss = true; } catch (err) { p.exMiss = true; }
  });

  window.EDGE_GENERATED = OUT;
})();
