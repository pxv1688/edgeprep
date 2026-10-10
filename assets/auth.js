/* Edge accounts: Supabase auth, profile, progress sync and leaderboard.
   Without a configured project (assets/config.js), everything here reports configured: false. */
(function () {
  "use strict";
  var cfg = window.EDGE_CONFIG || {};
  var ok = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase && window.supabase.createClient);
  var sb = ok ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  var base = location.href.replace(/[#?].*$/, "").replace(/[^/]*$/, "");
  var listeners = [];
  var A = window.EdgeAuth = {configured: ok, user: null, ready: false};

  function emit() { listeners.forEach(function (fn) { try { fn(A.user); } catch (e) {} }); }
  A.onChange = function (fn) { listeners.push(fn); if (A.ready) fn(A.user); };
  A.name = function (u) { u = u || A.user; if (!u) return ""; return (u.user_metadata && u.user_metadata.display_name) || (u.email || "").split("@")[0]; };

  function need() { if (!ok) return Promise.reject(new Error("Accounts aren't available yet.")); return Promise.resolve(); }
  function unwrap(r) { if (r.error) throw r.error; return r.data; }

  A.signUp = function (email, password, displayName) { return need().then(function () { return sb.auth.signUp({email: email, password: password, options: {data: {display_name: displayName}, emailRedirectTo: base + "account.html"}}).then(unwrap); }); };
  A.signIn = function (email, password) { return need().then(function () { return sb.auth.signInWithPassword({email: email, password: password}).then(unwrap); }); };
  A.sendReset = function (email) { return need().then(function () { return sb.auth.resetPasswordForEmail(email, {redirectTo: base + "reset.html"}).then(unwrap); }); };
  A.updatePassword = function (password) { return need().then(function () { return sb.auth.updateUser({password: password}).then(unwrap); }); };
  A.signOut = function () { return need().then(function () { return sb.auth.signOut().then(unwrap); }); };
  A.getProfile = function () { return need().then(function () { return sb.from("profiles").select("*").eq("id", A.user.id).maybeSingle().then(unwrap); }); };
  A.saveProfile = function (fields) {
    return need().then(function () {
      fields.id = A.user.id;
      return sb.from("profiles").upsert(fields).then(unwrap).then(function () {
        if (fields.display_name) return sb.auth.updateUser({data: {display_name: fields.display_name}}).then(unwrap);
      });
    });
  };
  A.league = function (week) { return need().then(function () { return sb.rpc("league", {p_week: week || null}).then(unwrap); }); };
  /* problem reports and feedback: anyone can send, only the site owner can read (see schema.sql) */
  A.sendFeedback = function (f) {
    return need().then(function () {
      return sb.from("feedback").insert({
        kind: f.kind, message: String(f.message).slice(0, 2000), problem_key: f.problem_key || null,
        contact: f.contact ? String(f.contact).slice(0, 254) : null, page: String(f.page || location.pathname + location.hash).slice(0, 200)
      }).then(unwrap);
    });
  };
  A.subscribe = function (email, source) {
    return need().then(function () {
      return sb.from("subscribers").insert({email: String(email).trim().toLowerCase(), source: source || null}).then(function (r) {
        if (r.error) { if (r.error.code === "23505") return "exists"; throw r.error; }
        return "ok";
      });
    });
  };
  A.leaderboard = function () { return need().then(function () { return sb.rpc("leaderboard").then(unwrap); }); };
  A.deleteAccount = function () { return need().then(function () { return sb.rpc("delete_me").then(unwrap); }).then(function () { return sb.auth.signOut(); }); };

  /* ---------- progress sync ---------- */
  function merge(local, remote) {
    if (!remote) return local;
    var out = JSON.parse(JSON.stringify(local)), k;
    out.solved = out.solved || {}; for (k in remote.solved || {}) out.solved[k] = true;
    out.days = out.days || {}; for (k in remote.days || {}) out.days[k] = Math.max(out.days[k] || 0, remote.days[k]);
    out.daily = out.daily || {}; for (k in remote.daily || {}) { var a = out.daily[k], b = remote.daily[k]; if (!a || (b && b.done && !a.done)) out.daily[k] = b; }
    out.best = out.best || {}; out.best.math = Math.max((local.best || {}).math || 0, (remote.best || {}).math || 0);
    if ((remote.xp || 0) > (local.xp || 0)) out.r = remote.r || out.r;
    out.xp = Math.max(local.xp || 0, remote.xp || 0);
    if (remote.first && (!out.first || remote.first < out.first)) out.first = remote.first;
    out.noticed = !!(local.noticed || remote.noticed);
    out.best.rush = Math.max((local.best || {}).rush || 0, (remote.best || {}).rush || 0);
    out.frozen = out.frozen || {}; for (k in remote.frozen || {}) out.frozen[k] = true;
    out.arch = out.arch || {}; for (k in remote.arch || {}) out.arch[k] = true;
    out.rev = out.rev || {}; for (k in remote.rev || {}) if (!out.rev[k] && !out.solved[k]) out.rev[k] = remote.rev[k];
    out.freezes = Math.max(local.freezes || 0, remote.freezes || 0);
    out.cleared = Math.max(local.cleared || 0, remote.cleared || 0);
    out.onboarded = !!(local.onboarded || remote.onboarded);
    if (remote.wk && (!local.wk || remote.wk.start > local.wk.start || (remote.wk.start === local.wk.start && remote.wk.xp > local.wk.xp))) out.wk = remote.wk;
    if (remote.wkPrev && (!local.wkPrev || remote.wkPrev.xp > local.wkPrev.xp)) out.wkPrev = remote.wkPrev;
    out.leagueTop10 = !!(local.leagueTop10 || remote.leagueTop10);
    out.saved = out.saved || {}; for (k in remote.saved || {}) if (!out.saved[k]) out.saved[k] = remote.saved[k];
    out.notes = out.notes || {}; for (k in remote.notes || {}) if (!out.notes[k]) out.notes[k] = remote.notes[k];
    if ((remote.mocks || []).length > (local.mocks || []).length) out.mocks = remote.mocks;
    out.bestCustom = out.bestCustom || {}; for (k in remote.bestCustom || {}) out.bestCustom[k] = Math.max(out.bestCustom[k] || 0, remote.bestCustom[k]);
    out.mathCfg = local.mathCfg || remote.mathCfg;
    out.goal = local.goal || remote.goal;
    out.profile = local.profile && local.profile.name ? local.profile : (remote.profile || local.profile);
    for (k in remote) if (k.indexOf("trk_") === 0 && remote[k]) out[k] = true;
    return out;
  }
  var timer = null, pulling = false;
  function push() {
    var st = window.EdgeState && window.EdgeState.get();
    if (!ok || !A.user || !st) return;
    var wk = window.EdgeWeek ? window.EdgeWeek.ensure() : (st.wk || {}), pv = st.wkPrev || {};
    sb.from("progress").upsert({user_id: A.user.id, data: st, xp: st.xp || 0, solved_count: Object.keys(st.solved || {}).length, streak: window.EdgeState.streak(),
      week_start: wk.start || null, week_xp: wk.xp || 0, prev_week_start: pv.start || null, prev_week_xp: pv.xp || 0, updated_at: new Date().toISOString()}).then(function (r) { if (r.error) console.warn("Edge sync:", r.error.message); });
  }
  function pull() {
    if (!window.EdgeState || !A.user) return;
    pulling = true;
    sb.from("progress").select("data").eq("user_id", A.user.id).maybeSingle().then(function (r) {
      pulling = false;
      if (r.error) { console.warn("Edge sync:", r.error.message); return; }
      window.EdgeState.replace(merge(window.EdgeState.get(), r.data && r.data.data));
      push();
    });
  }
  A.merge = merge;
  window.EdgeSync = {queue: function () { if (!ok || !A.user || pulling) return; clearTimeout(timer); timer = setTimeout(push, 1500); }};
  A.pullProgress = pull;

  if (!ok) { A.ready = true; return; }
  var lastId = null;
  sb.auth.onAuthStateChange(function (event, session) {
    A.user = session ? session.user : null;
    A.ready = true;
    var id = A.user ? A.user.id : null;
    if (id && id !== lastId) setTimeout(pull, 0);
    lastId = id;
    A.lastEvent = event;
    emit();
  });
})();
