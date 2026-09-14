// The language is the URL: / is English, /ru/ is Russian. Both are complete
// static pages, so nothing here translates the document - this only feeds the
// handful of strings that JS builds at runtime (heatmap, GitHub tenure).
// Loaded in <head>, before contrib.js and github.js.
(function () {
  "use strict";

  var STRINGS = {
    en: {
      "js.yearsUnit": "years",
      "js.hm.less": "less",
      "js.hm.more": "more",
      "js.hm.total": "{n} {w} in the last year",
      "js.hm.months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    },
    ru: {
      "js.yearsUnit": "лет",
      "js.hm.less": "меньше",
      "js.hm.more": "больше",
      "js.hm.total": "{n} {w} за год",
      "js.hm.months": ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
    }
  };

  var lang = document.documentElement.getAttribute("lang") === "ru" ? "ru" : "en";
  var strings = STRINGS[lang];

  window.I18N = {
    lang: lang,
    t: function (key) {
      var v = strings[key];
      return v === undefined ? key : v;
    }
  };
})();
