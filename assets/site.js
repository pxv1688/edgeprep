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
