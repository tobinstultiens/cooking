/* Client-side scaler + metric/imperial converter for ```ingredients blocks.
 *
 * Data comes from data/units.yaml, serialised into window.RecipeUnits by the
 * render hook. Everything below is display logic: amounts are stored as-authored
 * in data-attributes; we scale by (target servings / base servings) and convert
 * within a dimension using each unit's factor to the base unit (g for weight,
 * ml for volume). Count units never convert. Only runs on pages that actually
 * contain a scaler, so un-migrated recipes render exactly as authored.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "recipe-unit-system";
  var units = (typeof window !== "undefined" && window.RecipeUnits) || {};
  var currentSystem = "metric";

  /* ---- unit lookup (token -> canonical info) --------------------------- */
  var lookup = {};
  function norm(s) { return String(s).toLowerCase().trim(); }
  Object.keys(units).forEach(function (dim) {
    var group = units[dim] || {};
    Object.keys(group).forEach(function (canonical) {
      var u = group[canonical] || {};
      var info = {
        dim: dim, factor: u.factor || 1,
        system: u.system || "any", abbr: u.abbr || canonical, known: true
      };
      lookup[norm(canonical)] = info;
      (u.aliases || []).forEach(function (a) { lookup[norm(a)] = info; });
    });
  });
  function unitInfo(token) {
    var hit = lookup[norm(token)];
    // Unknown unit -> dimensionless count label (scales by number, never converts).
    // Shown verbatim (not pluralised) since it's really the food noun the author typed.
    return hit || { dim: "count", factor: 1, system: "any", abbr: String(token).trim(), known: false };
  }
  function f(dim, key) { return ((units[dim] || {})[key] || {}).factor; }

  /* ---- number parsing & pretty fractions ------------------------------- */
  function parseAmount(str) {
    str = String(str).trim();
    var mixed = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);   // "1 1/2"
    if (mixed) return +mixed[1] + (+mixed[2] / +mixed[3]);
    var frac = str.match(/^(\d+)\/(\d+)$/);            // "1/2"
    if (frac) return +frac[1] / +frac[2];
    return parseFloat(str);                            // "1.5", "60"
  }

  var NICE = [0, 1 / 8, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1];
  function glyph(v) {
    if (approx(v, 1 / 8)) return "⅛";
    if (approx(v, 1 / 4)) return "¼";
    if (approx(v, 1 / 3)) return "⅓";
    if (approx(v, 1 / 2)) return "½";
    if (approx(v, 2 / 3)) return "⅔";
    if (approx(v, 3 / 4)) return "¾";
    return "";
  }
  function approx(a, b) { return Math.abs(a - b) < 0.02; }

  // Snap to a cook-friendly whole + fraction, e.g. 1.51 -> "1½".
  function fraction(x) {
    if (isNaN(x)) return "";
    var whole = Math.floor(x), frac = x - whole, best = 0, bd = 1;
    NICE.forEach(function (n) { var d = Math.abs(frac - n); if (d < bd) { bd = d; best = n; } });
    if (best === 1) { whole += 1; best = 0; }
    var g = best > 0 ? glyph(best) : "";
    if (whole === 0 && g) return g;
    if (g) return whole + g;
    return String(whole);
  }

  function roundTo(x, step) { return Math.round(x / step) * step; }
  function trimNum(x) { return String(parseFloat(x.toFixed(2))); }
  function roundMetric(x) {
    if (x < 20) return trimNum(roundTo(x, 1));
    if (x < 100) return trimNum(roundTo(x, 5));
    return trimNum(roundTo(x, 10));
  }

  /* ---- rendering a single scaled amount -------------------------------- */
  var NB = " ";
  function pluralize(word, n) {
    return (Math.abs(n) > 1 && !/s$/.test(word)) ? word + "s" : word;
  }

  function present(value, info, system) {
    if (isNaN(value)) return "";
    if (info.dim === "count" || info.system === "any") {
      var label = info.known ? pluralize(info.abbr, value) : info.abbr;
      return label ? fraction(value) + NB + label : fraction(value);
    }
    var base = value * info.factor; // grams or millilitres
    return system === "metric" ? metric(base, info.dim) : imperial(base, info.dim);
  }

  function metric(base, dim) {
    if (dim === "weight") {
      return base >= 1000
        ? trimNum(roundTo(base / 1000, 0.05)) + NB + "kg"
        : roundMetric(base) + NB + "g";
    }
    return base >= 1000
      ? trimNum(roundTo(base / 1000, 0.05)) + NB + "l"
      : roundMetric(base) + NB + "ml";
  }

  function imperial(base, dim) {
    if (dim === "weight") {
      var lb = f("weight", "lb"), oz = f("weight", "oz");
      return base >= 0.75 * lb
        ? fraction(base / lb) + NB + "lb"
        : fraction(base / oz) + NB + "oz";
    }
    var cup = f("volume", "cup"), tbsp = f("volume", "tbsp"), tsp = f("volume", "tsp");
    if (base >= 0.25 * cup) {
      var c = base / cup;
      return fraction(c) + NB + pluralize("cup", c);
    }
    if (base >= tbsp) return fraction(base / tbsp) + NB + "tbsp";
    return fraction(base / tsp) + NB + "tsp";
  }

  /* ---- scaling a block ------------------------------------------------- */
  function updateList(sc) {
    var base = parseInt(sc.dataset.baseServings, 10) || 1;
    var input = sc.querySelector(".recipe-scaler__serves-input");
    var target = Math.max(1, parseInt(input && input.value, 10) || base);
    var mul = target / base;
    sc.querySelectorAll(".recipe-scaler__item[data-unit]").forEach(function (li) {
      var qty = li.querySelector(".recipe-scaler__qty");
      if (!qty) return;
      var out = present(parseAmount(li.dataset.amount) * mul, unitInfo(li.dataset.unit), currentSystem);
      if (out) qty.textContent = out;
    });
  }

  /* ---- oven temperatures in the prose ---------------------------------- */
  // number + unit, optionally followed by a parenthesised counterpart.
  var TEMP_RE = /(\d+(?:\.\d+)?)\s*(°\s*[cf]|°[cf]|degrees?\s*[cf]|degrees?)(?:\s*\(\s*(\d+(?:\.\d+)?)\s*(°?\s*[cf])\s*\))?/gi;
  function isC(unitText) { return /c/i.test(unitText); }
  function toC(f_) { return (f_ - 32) * 5 / 9; }
  function toF(c) { return c * 9 / 5 + 32; }

  function wrapTemps(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !/\d/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode;
        while (p && p !== root) {
          var t = p.nodeName;
          if (t === "SCRIPT" || t === "STYLE" || t === "PRE" || t === "CODE") return NodeFilter.FILTER_REJECT;
          if (p.classList && p.classList.contains("recipe-scaler")) return NodeFilter.FILTER_REJECT;
          if (p.classList && p.classList.contains("rt-temp")) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return TEMP_RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var targets = [];
    while (walker.nextNode()) targets.push(walker.currentNode);
    targets.forEach(function (node) {
      TEMP_RE.lastIndex = 0;
      var frag = document.createDocumentFragment();
      var text = node.nodeValue, last = 0, m;
      while ((m = TEMP_RE.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        var cVal, fVal;
        if (m[3]) { // explicit dual, e.g. "275°F (135°C)"
          var a = parseFloat(m[1]), b = parseFloat(m[3]);
          if (isC(m[2])) { cVal = a; fVal = b; } else { fVal = a; cVal = b; }
        } else {
          var v = parseFloat(m[1]);
          if (isC(m[2])) { cVal = v; fVal = toF(v); } else { fVal = v; cVal = toC(v); }
        }
        var span = document.createElement("span");
        span.className = "rt-temp";
        span.setAttribute("data-c", String(cVal));
        span.setAttribute("data-f", String(fVal));
        frag.appendChild(span);
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function updateTemps(system) {
    document.querySelectorAll(".rt-temp").forEach(function (span) {
      var val = system === "metric" ? +span.getAttribute("data-c") : +span.getAttribute("data-f");
      span.textContent = roundTo(val, 5) + NB + "°" + (system === "metric" ? "C" : "F");
    });
  }

  /* ---- wiring ---------------------------------------------------------- */
  function applySystem(system) {
    currentSystem = system;
    document.querySelectorAll(".recipe-scaler").forEach(function (sc) {
      sc.querySelectorAll(".recipe-scaler__system").forEach(function (b) {
        b.classList.toggle("is-active", b.dataset.system === system);
      });
      updateList(sc);
    });
    updateTemps(system);
    try { localStorage.setItem(STORAGE_KEY, system); } catch (e) { /* private mode */ }
  }

  function init() {
    var scalers = document.querySelectorAll(".recipe-scaler");
    if (!scalers.length) return; // un-migrated page: leave everything untouched

    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "metric" || stored === "imperial") currentSystem = stored;
    } catch (e) { /* ignore */ }

    scalers.forEach(function (sc) {
      var input = sc.querySelector(".recipe-scaler__serves-input");
      sc.querySelectorAll(".recipe-scaler__step").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var next = (parseInt(input.value, 10) || 1) + parseInt(btn.dataset.step, 10);
          input.value = Math.max(1, next);
          updateList(sc);
        });
      });
      if (input) input.addEventListener("input", function () { updateList(sc); });
      sc.querySelectorAll(".recipe-scaler__system").forEach(function (btn) {
        btn.addEventListener("click", function () { applySystem(btn.dataset.system); });
      });
    });

    wrapTemps(document.querySelector("main") || document.body);
    applySystem(currentSystem);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  // Expose pure helpers for Node-based unit tests; no effect in the browser.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      parseAmount: parseAmount, fraction: fraction, present: present,
      unitInfo: unitInfo, _setUnits: function (u) {
        units = u;
        lookup = {};
        Object.keys(units).forEach(function (dim) {
          var group = units[dim] || {};
          Object.keys(group).forEach(function (canonical) {
            var v = group[canonical] || {};
            var info = { dim: dim, factor: v.factor || 1, system: v.system || "any", abbr: v.abbr || canonical, known: true };
            lookup[norm(canonical)] = info;
            (v.aliases || []).forEach(function (a) { lookup[norm(a)] = info; });
          });
        });
      }
    };
  }
})();
