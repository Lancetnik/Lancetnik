// Live GitHub data for the OpenSource block (progressive enhancement).
//
// Static values in index.html are the fallback. This script refreshes them
// from the public, unauthenticated GitHub API and silently keeps the fallback
// if the API is unreachable or rate-limited (60 req/hour per IP).
//
// What is live: repo stars (+ re-sort of contributions) and GitHub tenure.
// What stays static: merged-PR count, total commits, "projects contributed to".
// Stars from /repos/{slug} are accurate unauthenticated; the PR/commit numbers
// need the GraphQL API (a token, which must not ship in a public static site) -
// the anonymous search API undercounts them, so we show the accurate value instead.
(function () {
  "use strict";

  var ACCOUNT_CREATED = "2018-10-29";
  var CACHE_KEY = "gh-os-cache-v2";
  var CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
  var API = "https://api.github.com";

  // ---- helpers ----
  function fmtStars(n) {
    if (n >= 1000) {
      var s = (n / 1000).toFixed(1).replace(/\.0$/, "");
      return s + "K ★";
    }
    return n + " ★";
  }

  function repoFromAnchor(el) {
    var a = el.closest('a[href*="github.com/"]');
    if (!a) return null;
    var m = a.getAttribute("href").match(/github\.com\/([^\/]+\/[^\/?#]+)/);
    return m ? m[1] : null;
  }

  function yearsSince(dateStr) {
    var start = new Date(dateStr).getTime();
    var years = (Date.now() - start) / (365.25 * 24 * 3600 * 1000);
    return Math.floor(years);
  }

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || Date.now() - obj.ts > CACHE_TTL) return null;
      return obj.data;
    } catch (e) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) {
      /* storage unavailable - ignore */
    }
  }

  function getJSON(url) {
    return fetch(url, { headers: { Accept: "application/vnd.github+json" } }).then(
      function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      }
    );
  }

  // ---- DOM targets ----
  var starEls = Array.prototype.slice.call(
    document.querySelectorAll(".card__stars, .repo__stars")
  );
  var slugs = [];
  var seen = {};
  starEls.forEach(function (el) {
    var slug = repoFromAnchor(el);
    if (slug) {
      el._slug = slug;
      if (!seen[slug]) {
        seen[slug] = true;
        slugs.push(slug);
      }
    }
  });

  // ---- apply a {stars:{slug:n}, prs:n} payload to the DOM ----
  function apply(data) {
    if (!data) return;

    if (data.stars) {
      starEls.forEach(function (el) {
        var n = data.stars[el._slug];
        if (typeof n === "number") el.textContent = fmtStars(n);
      });

      // re-sort the contributions grid by live star count (desc) -
      // only when every repo resolved, so a partial rate-limit cannot scramble order
      var grid = data.complete ? document.querySelector("[data-gh-sort]") : null;
      if (grid) {
        var items = Array.prototype.slice.call(grid.querySelectorAll(".repo"));
        items
          .map(function (node) {
            var slug = repoFromAnchor(node.querySelector(".repo__stars") || node);
            return { node: node, stars: (slug && data.stars[slug]) || -1 };
          })
          .sort(function (a, b) {
            return b.stars - a.stars;
          })
          .forEach(function (item) {
            grid.appendChild(item.node);
          });
      }
    }

  }

  // tenure is deterministic - compute locally, no request needed
  (function setYears() {
    var el = document.querySelector('[data-gh-stat="years"]');
    if (el) el.textContent = yearsSince(ACCOUNT_CREATED) + " лет";
  })();

  // ---- 1) instant paint from cache ----
  var cached = readCache();
  if (cached) apply(cached);

  // ---- 2) refresh from network (skip if cache is still warm) ----
  if (cached) return;

  var starPromises = slugs.map(function (slug) {
    return getJSON(API + "/repos/" + slug)
      .then(function (r) {
        return { slug: slug, stars: r.stargazers_count };
      })
      .catch(function () {
        return null;
      });
  });

  Promise.all(starPromises).then(function (starList) {
    var data = { stars: {}, complete: false };
    var got = 0;

    starList.forEach(function (item) {
      if (item) {
        data.stars[item.slug] = item.stars;
        got++;
      }
    });

    if (got === 0) return; // API blocked - keep static fallback
    data.complete = got === slugs.length;
    apply(data);
    if (data.complete) writeCache(data); // only cache a full, sortable snapshot
  });
})();
