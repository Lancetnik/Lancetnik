// Ambient hero background: an infinitely scrolling, randomly generated heatmap
// in the GitHub-contributions style. Decorative only (aria-hidden).
// Columns are recycled (constant DOM) and re-randomized as they wrap around.
(function () {
  "use strict";

  var mount = document.querySelector(".hero__hm");
  if (!mount) return;

  var CELL = 13, GAP = 4, PITCH = CELL + GAP;
  var MAX_ROWS = 7; // GitHub-style band caps at 7 rows; fewer on short bands
  var SPEED = 0.02; // px per ms (~20px/s, slow ambient drift)
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // weighted toward empty/dim cells, rare bright ones - reads like real activity
  function randLevel() {
    var r = Math.random();
    if (r < 0.55) return 0;
    if (r < 0.78) return 1;
    if (r < 0.91) return 2;
    if (r < 0.98) return 3;
    return 4;
  }

  var track, cols = [], rows = 0, pos = 0, raf = null, lastT = 0;

  function makeCol() {
    var col = document.createElement("div");
    col.className = "hhm__col";
    for (var r = 0; r < rows; r++) {
      var c = document.createElement("span");
      c.className = "hhm__cell l" + randLevel();
      col.appendChild(c);
    }
    return col;
  }

  function reroll(col) {
    var cells = col.children;
    for (var i = 0; i < cells.length; i++) cells[i].className = "hhm__cell l" + randLevel();
  }

  function build() {
    var w = mount.clientWidth;
    if (!w) return;
    // fit whole rows into the band's actual height (it is clamped by CSS)
    rows = Math.max(2, Math.min(MAX_ROWS, Math.floor((mount.clientHeight + GAP) / PITCH)));
    var nCols = Math.ceil(w / PITCH) + 2;

    track = document.createElement("div");
    track.className = "hhm__track";
    cols = [];
    for (var i = 0; i < nCols; i++) {
      var col = makeCol();
      cols.push(col);
      track.appendChild(col);
    }
    mount.innerHTML = "";
    mount.appendChild(track);
    pos = 0;
    track.style.transform = "translateX(0px)";
  }

  function step(t) {
    if (!lastT) lastT = t;
    var dt = Math.min(t - lastT, 50); // clamp after tab-switch stalls
    lastT = t;
    pos += dt * SPEED;
    // recycle every column that has fully scrolled off the left edge
    while (pos >= PITCH && cols.length) {
      pos -= PITCH;
      var first = cols.shift();
      reroll(first);
      track.appendChild(first);
      cols.push(first);
    }
    track.style.transform = "translateX(" + -pos + "px)";
    raf = requestAnimationFrame(step);
  }

  function start() {
    if (raf) cancelAnimationFrame(raf);
    lastT = 0;
    build();
    if (!reduce && track) raf = requestAnimationFrame(step);
  }

  start();

  // rebuild on resize (next frame, debounced)
  var rT = null;
  window.addEventListener("resize", function () {
    if (rT) cancelAnimationFrame(rT);
    rT = requestAnimationFrame(start);
  });
})();
