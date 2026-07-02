// Scroll-reveal via IntersectionObserver (no scroll listeners).
// Motion is motivated: staggered entrance reveals content hierarchy as you scroll.
(function () {
  "use strict";

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var items = document.querySelectorAll(".reveal");

  if (prefersReduced || !("IntersectionObserver" in window)) {
    items.forEach(function (el) {
      el.classList.add("is-in");
    });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // small stagger between siblings entering together
        var siblings = Array.prototype.slice.call(
          el.parentElement ? el.parentElement.querySelectorAll(".reveal") : [el]
        );
        var idx = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(idx * 60, 300) + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  items.forEach(function (el) {
    io.observe(el);
  });
})();

// Edge-fade for any horizontal scroll strip (contributions, all-articles):
// show a side's fade only when there is content scrolled off-screen on that side.
(function () {
  "use strict";

  var FADE = "48px";

  document
    .querySelectorAll("[data-gh-sort], [data-edge-fade]")
    .forEach(function (strip) {
      var raf = null;

      function update() {
        raf = null;
        var max = strip.scrollWidth - strip.clientWidth;
        var x = strip.scrollLeft;
        strip.style.setProperty("--fade-l", x > 1 ? FADE : "0px");
        strip.style.setProperty("--fade-r", x < max - 1 ? FADE : "0px");
      }

      function schedule() {
        if (!raf) raf = requestAnimationFrame(update);
      }

      strip.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      // card widths can change after web fonts load or stars update - recompute on resize of the strip
      if (window.ResizeObserver) new ResizeObserver(schedule).observe(strip);

      update();
    });
})();

// Tag filter for the "Видео и подкасты" section (#видео / #стрим / #подкаст).
(function () {
  "use strict";

  var group = document.querySelector("[data-filter-group]");
  if (!group) return;

  var section = group.closest("section");
  var rows = Array.prototype.slice.call(section.querySelectorAll(".row"));

  group.addEventListener("click", function (e) {
    var btn = e.target.closest(".filter__btn");
    if (!btn) return;
    var f = btn.getAttribute("data-filter");

    group.querySelectorAll(".filter__btn").forEach(function (b) {
      b.classList.toggle("is-active", b === btn);
    });
    rows.forEach(function (row) {
      var show = f === "all" || row.getAttribute("data-type") === f;
      row.style.display = show ? "" : "none";
    });
  });
})();
