// Design switcher: three independent versions of the site (each with its own
// markup and stylesheet) live side by side - root (Stream), press/ (Пресса),
// terminal/ (Терминал). The toggle navigates to the same page in the chosen
// design; the choice persists in localStorage and root pages redirect to the
// saved design before first paint (inline <head> script on each root page).
(function () {
  "use strict";

  var KEY = "site-design";
  var FOLDERS = { stream: "", press: "press/", term: "terminal/" };

  var m = location.pathname.match(/\/(press|terminal)\/[^\/]*$/);
  var current = m ? (m[1] === "press" ? "press" : "term") : "stream";
  var page = location.pathname.split("/").pop() || "index.html";
  var toRoot = current === "stream" ? "" : "../";

  document
    .querySelectorAll("[data-design-toggle] .dtoggle__btn")
    .forEach(function (btn) {
      var active = btn.getAttribute("data-design") === current;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

  document.querySelectorAll("[data-design-toggle]").forEach(function (group) {
    group.addEventListener("click", function (e) {
      var btn = e.target.closest(".dtoggle__btn");
      if (!btn) return;
      var design = btn.getAttribute("data-design");
      if (!Object.prototype.hasOwnProperty.call(FOLDERS, design) || design === current) return;
      try {
        localStorage.setItem(KEY, design);
      } catch (err) {
        /* storage unavailable - the choice just won't persist */
      }
      location.href = toRoot + FOLDERS[design] + page;
    });
  });
})();
