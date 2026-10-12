/* Shared site chrome: account link in the header and the theme switch in the footer. */
(function () {
  "use strict";
  var acct = document.getElementById("acct");
  function paint(user) {
    if (!acct) return;
    var A = window.EdgeAuth;
    if (A && A.configured && user) { acct.textContent = A.name(user); acct.href = "account.html"; acct.title = "Your account"; }
    else { acct.textContent = "Sign in"; acct.href = "login.html"; acct.removeAttribute("title"); }
  }
  if (window.EdgeAuth) window.EdgeAuth.onChange(paint); else paint(null);

  /* cookie-free visitor stats (GoatCounter), only when a site code is set in config.js */
  var gc = (window.EDGE_CONFIG || {}).goatcounter;
  var queue = [];
  window.EdgeTrack = function (path, title) {
    if (!gc) return;
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({path: path, title: title || path});
    else queue.push([path, title]);
  };
  if (gc && /^[a-z0-9-]+$/.test(gc)) {
    var isApp = !!document.getElementById("app");
    window.goatcounter = {no_onload: isApp}; /* the app counts each screen itself (see app.js route) */
    var s = document.createElement("script");
    s.async = true; s.src = "https://gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", "https://" + gc + ".goatcounter.com/count");
    s.onload = function () { queue.splice(0).forEach(function (q) { window.EdgeTrack(q[0], q[1]); }); };
    document.head.appendChild(s);
    /* the app's first screen rendered before this script loaded, so count it here */
    if (isApp) window.EdgeTrack("/app/" + (location.hash.slice(1) || "today"), "App");
  }

  /* offline support and app install (needs http(s); skipped when opened as a file) */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }

  var sel = document.getElementById("themeSel");
  if (sel) {
    var cur = "system";
    try { cur = localStorage.getItem("edge-theme") || "system"; } catch (e) {}
    sel.value = cur;
    sel.addEventListener("change", function () {
      var v = sel.value;
      try { localStorage.setItem("edge-theme", v); } catch (e) {}
      if (v === "system") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", v);
    });
  }
})();
