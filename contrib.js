// GitHub-style contribution heatmap.
// Renders from baked data (contrib-data.js), then refreshes live from a public
// CORS proxy (no token needed); falls back to the baked snapshot on any failure.
(function () {
  "use strict";

  var mount = document.getElementById("heatmap");
  if (!mount || !window.GH_CONTRIB) return;

  var PROXY = "https://github-contributions-api.jogruber.de/v4/Lancetnik?y=last";
  var CACHE_KEY = "gh-contrib-cache-v1";
  var CACHE_TTL = 12 * 60 * 60 * 1000;
  var MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

  function plural(n) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return "вкладов";
    if (b > 1 && b < 5) return "вклада";
    if (b === 1) return "вклад";
    return "вкладов";
  }

  // group a flat, date-sorted day list into Sunday-started week columns
  function toWeeks(days) {
    var weeks = [], cur = null;
    days.forEach(function (day) {
      var wd = new Date(day.d + "T00:00:00Z").getUTCDay();
      if (cur === null) cur = [null, null, null, null, null, null, null];
      cur[wd] = day;
      if (wd === 6) { weeks.push(cur); cur = null; }
    });
    if (cur) weeks.push(cur);
    return weeks;
  }

  function render(days, total) {
    var weeks = toWeeks(days);
    mount.innerHTML = "";

    // month labels aligned to the columns where a new month begins
    var months = document.createElement("div");
    months.className = "hm__months";
    var prevMonth = -1;
    weeks.forEach(function (week) {
      var first = week.find(function (x) { return x; });
      var label = document.createElement("span");
      label.className = "hm__month";
      if (first) {
        var m = new Date(first.d + "T00:00:00Z").getUTCMonth();
        if (m !== prevMonth) { label.textContent = MONTHS[m]; prevMonth = m; }
      }
      months.appendChild(label);
    });

    // grid of week columns
    var grid = document.createElement("div");
    grid.className = "hm__grid";
    weeks.forEach(function (week) {
      var col = document.createElement("div");
      col.className = "hm__col";
      for (var r = 0; r < 7; r++) {
        var day = week[r];
        var cell = document.createElement("span");
        cell.className = "hm__cell l" + (day ? day.l : 0);
        if (day) cell.title = day.c + " " + plural(day.c) + " · " + day.d;
        else cell.classList.add("is-empty");
        col.appendChild(cell);
      }
      grid.appendChild(col);
    });

    // months row + grid share one inner so they scroll together and stay aligned
    var inner = document.createElement("div");
    inner.className = "hm__inner";
    inner.style.setProperty("--weeks", weeks.length); // drives the responsive column count
    inner.appendChild(months);
    inner.appendChild(grid);

    var scroll = document.createElement("div");
    scroll.className = "hm__scroll";
    scroll.appendChild(inner);

    // footer: total + legend
    var foot = document.createElement("div");
    foot.className = "hm__foot";
    var totalEl = document.createElement("span");
    totalEl.className = "hm__total";
    totalEl.textContent = total + " " + plural(total) + " за год";
    var legend = document.createElement("div");
    legend.className = "hm__legend";
    legend.appendChild(document.createTextNode("меньше"));
    for (var l = 0; l <= 4; l++) {
      var c = document.createElement("span");
      c.className = "hm__cell l" + l;
      legend.appendChild(c);
    }
    legend.appendChild(document.createTextNode("больше"));
    foot.appendChild(totalEl);
    foot.appendChild(legend);

    mount.appendChild(scroll);
    mount.appendChild(foot);

    // keep the strip scrolled to the most recent week on overflow
    requestAnimationFrame(function () { scroll.scrollLeft = scroll.scrollWidth; });
  }

  // ---- initial paint from baked snapshot ----
  var baked = window.GH_CONTRIB.days.map(function (a) { return { d: a[0], c: a[1], l: a[2] }; });
  render(baked, window.GH_CONTRIB.total);

  // ---- live refresh (cached 12h), graceful fallback to baked ----
  function fromCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      return Date.now() - o.ts > CACHE_TTL ? null : o.data;
    } catch (e) { return null; }
  }

  var cached = fromCache();
  if (cached) {
    render(cached.days, cached.total);
    return;
  }

  fetch(PROXY)
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (j) {
      if (!j || !j.contributions || !j.contributions.length) return;
      var days = j.contributions.map(function (x) {
        return { d: x.date, c: x.count, l: x.level };
      });
      var total = (j.total && (j.total.lastYear || j.total["last"])) ||
        days.reduce(function (s, x) { return s + x.c; }, 0);
      render(days, total);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: { days: days, total: total } })); } catch (e) {}
    })
    .catch(function () { /* keep baked snapshot */ });
})();
