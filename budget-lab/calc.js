/* OOH Budget Lab calculator.
   Estimated impressions = lower weekly impressions per unit × quantity × weeks.
   Impressions are never derived from budget: only from formats and quantities
   the customer has chosen. Every figure is a rough estimate. */
(function () {
  "use strict";
  var D = window.LO_CALC;
  if (!D) return;

  var $ = function (id) { return document.getElementById(id); };
  var gbp = function (n) { return "£" + Math.round(n).toLocaleString("en-GB"); };
  var num = function (n) { return Math.round(n).toLocaleString("en-GB"); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var catById = {}; D.categories.forEach(function (c) { catById[c.id] = c; });
  var cityById = {}; D.cities.forEach(function (c) { cityById[c.id] = c; });
  var aptById = {}; D.airports.forEach(function (a) { aptById[a.id] = a; });
  var fmtById = {}; D.formats.forEach(function (f) { fmtById[f.id] = f; });

  var UNIT_WEEKS = { "1wk": 1, "2wk": 2, "4wk": 4 };
  var UNIT_LABEL = { "1wk": "week", "2wk": "2 weeks", "4wk": "4 weeks", day: "day", once: "campaign" };
  var DURATIONS = [2, 4, 6, 8, 12];  // campaigns are sold on a minimum 2-week period

  var state = {
    budget: 1000,
    cats: [],            // selected category ids, in click order
    weeks: 2,
    location: "london",
    audience: "general",
    lines: {}            // formatId -> { qty, weeks, days, loc }
  };

  function track(event, extra) {
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(Object.assign({ event: event, page_path: location.pathname }, extra || {}));
  }

  var toastTimer;
  function toast(msg, action) {
    var t = $("toast"); t.textContent = msg;
    if (action) {
      var b = document.createElement("button"); b.type = "button"; b.className = "toast-act"; b.textContent = action.label;
      b.addEventListener("click", function () { t.classList.remove("is-on"); action.fn(); });
      t.appendChild(b);
    }
    t.classList.toggle("has-act", !!action);
    t.classList.add("is-on");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, action ? 6000 : 3200);
  }

  /* ---------- location helpers ---------- */
  function aptForCity(cityId) {
    return { london: "heathrow", manchester: "manchester-apt", birmingham: "birmingham-apt", edinburgh: "edinburgh-apt" }[cityId] || "regional-apt";
  }
  function locOptions(f) {
    if (f.cat === "underground") return [cityById.london];
    if (f.cat === "airports") return D.airports;
    if (f.cat === "taxis") return D.taxiCities.map(function (id) { return cityById[id]; });
    return D.cities;
  }
  function defaultLoc(f) {
    if (f.cat === "underground") return "london";
    if (f.cat === "airports") return aptById[state.location] ? state.location : aptForCity(state.location);
    if (f.cat === "taxis") return D.taxiCities.indexOf(state.location) > -1 ? state.location : "london";
    return cityById[state.location] ? state.location : "london";
  }
  function locName(id) { return (cityById[id] || aptById[id] || {}).name || id; }
  function regionKey(f, loc) {
    if (f.cat === "airports") return (aptById[loc] || {}).tier || "regional";
    return (cityById[loc] && cityById[loc].london) ? "london" : "regional";
  }
  function unitFor(f, rk) { return typeof f.unit === "string" ? f.unit : (f.unit[rk] || f.unit.regional || f.unit.london); }
  function minFor(f, rk) { return typeof f.min === "number" ? f.min : (f.min && f.min[rk]) || 1; }

  /* ---------- the maths ---------- */
  function calcLine(f, line) {
    var rk = regionKey(f, line.loc);
    var unit = unitFor(f, rk);
    var price = f.price[rk];
    var min = minFor(f, rk);
    var qty = Math.max(line.qty, min);
    var periods, runWeeks;
    if (unit === "day") { periods = line.days; runWeeks = null; }
    else if (unit === "once") { periods = 1; runWeeks = line.weeks; }
    else { periods = Math.ceil(line.weeks / UNIT_WEEKS[unit]); runWeeks = periods * UNIT_WEEKS[unit]; }
    var available = price != null;
    /* impressions: lower weekly per unit × quantity × weeks (AdVans: per day on the road) */
    var impr = unit === "day" ? f.impWk * qty * line.days : f.impWk * qty * runWeeks;
    var media = available ? price * qty * periods : 0;
    var print = available ? f.print * qty : 0;
    var prod = available ? f.prod * qty : 0;
    return { f: f, rk: rk, unit: unit, price: price, min: min, qty: qty, periods: periods, runWeeks: runWeeks,
      available: available, impr: available ? impr : 0, media: media, print: print, prod: prod, total: media + print + prod };
  }

  function allLines() {
    return Object.keys(state.lines).map(function (id) { return calcLine(fmtById[id], state.lines[id]); });
  }

  /* ---------- left controls ---------- */
  function renderCats() {
    var fits = (D.audiences.filter(function (a) { return a.id === state.audience; })[0] || {}).fits || [];
    $("cat-list").innerHTML = D.categories.map(function (c) {
      var on = state.cats.indexOf(c.id) > -1;
      return '<label class="cat' + (on ? " is-on" : "") + '"><input type="checkbox" value="' + c.id + '"' + (on ? " checked" : "") + '>' +
        '<span>' + esc(c.name) + '</span>' + (fits.indexOf(c.id) > -1 ? '<em class="fit">Good fit</em>' : "") + '</label>';
    }).join("");
  }

  function renderLocationSelect() {
    var sel = $("location");
    var onlyUnderground = state.cats.length > 0 && state.cats.every(function (c) { return c === "underground"; });
    var onlyAirports = state.cats.length > 0 && state.cats.every(function (c) { return c === "airports"; });
    var opts = onlyUnderground ? [cityById.london] : onlyAirports ? D.airports : D.cities;
    if (!opts.some(function (o) { return o.id === state.location; })) state.location = onlyAirports ? aptForCity(state.location) : (onlyUnderground ? "london" : (cityById[state.location] ? state.location : "london"));
    sel.innerHTML = opts.map(function (o) { return '<option value="' + o.id + '"' + (o.id === state.location ? " selected" : "") + ">" + esc(o.name) + "</option>"; }).join("");
    sel.disabled = onlyUnderground;
    $("location-help").textContent = onlyUnderground ? "The Underground is London only."
      : onlyAirports ? "Heathrow and Gatwick use hub rates; other airports use mid-tier or regional rates."
      : "London uses London rates. Other cities use regional rates. You can set each format separately.";
  }

  function renderAudience() {
    $("audience").innerHTML = D.audiences.map(function (a) {
      return '<option value="' + a.id + '"' + (a.id === state.audience ? " selected" : "") + ">" + esc(a.name) + "</option>";
    }).join("");
  }

  /* ---------- right: format cards ---------- */
  function priceText(f, loc) {
    var rk = regionKey(f, loc), p = f.price[rk];
    if (p == null) return "On request in " + esc(locName(loc));
    var unit = unitFor(f, rk);
    return "<strong>" + gbp(p) + "</strong> per " + f.per + (unit === "once" ? " (whole campaign)" : " / " + UNIT_LABEL[unit]);
  }

  function durationControl(f, line) {
    var rk = regionKey(f, line.loc), unit = unitFor(f, rk);
    if (unit === "day") {
      return '<label>Days<input type="number" min="1" max="60" step="1" data-k="days" value="' + line.days + '"></label>';
    }
    return '<label>Duration<select data-k="weeks">' + DURATIONS.map(function (w) {
      return '<option value="' + w + '"' + (w === line.weeks ? " selected" : "") + ">" + w + (w === 1 ? " week" : " weeks") + "</option>";
    }).join("") + "</select></label>";
  }

  function card(f) {
    var cat = catById[f.cat];
    var line = state.lines[f.id];
    var loc = line ? line.loc : defaultLoc(f);
    var rk = regionKey(f, loc), min = minFor(f, rk);
    var html = '<article class="fcard' + (line ? " is-on" : "") + '" data-id="' + f.id + '">' +
      '<div class="fcard-img"><img src="' + (f.img || cat.img) + '" alt="" loading="lazy" decoding="async"></div>' +
      '<div class="fcard-body">' +
        "<h4>" + esc(f.name) + "</h4>" +
        '<p class="fcard-price">' + priceText(f, loc) + "</p>" +
        '<p class="fcard-meta">≈ ' + (unitFor(f, rk) === "day" ? num(f.impWk) + " impressions per day" : num(f.impWk * 2) + " impressions per 2 weeks") + " each <span>(lower estimate)</span></p>" +
        '<p class="fcard-note">' + esc(f.note) + "</p>" +
        (min > 1 ? '<p class="fcard-min">Minimum ' + num(min) + " " + f.per + "s</p>" : "") +
        (f.warn ? '<p class="fcard-warn">' + esc(f.warn) + "</p>" : "");
    if (!line) {
      html += '<button type="button" class="fcard-add" data-act="add">Add to plan</button>';
    } else {
      var c = calcLine(f, line);
      var locs = locOptions(f);
      html += '<div class="fcard-ctl">' +
        '<label>Quantity<span class="stepper"><button type="button" data-act="dec" aria-label="Fewer">−</button>' +
          '<input type="number" min="' + min + '" step="1" data-k="qty" value="' + line.qty + '" aria-label="Quantity of ' + esc(f.name) + '">' +
          '<button type="button" data-act="inc" aria-label="More">+</button></span></label>' +
        durationControl(f, line) +
        '<label>Location<select data-k="loc"' + (locs.length < 2 ? " disabled" : "") + ">" + locs.map(function (o) {
          return '<option value="' + o.id + '"' + (o.id === line.loc ? " selected" : "") + ">" + esc(o.name) + "</option>";
        }).join("") + "</select></label>" +
      "</div>";
      if (c.available) {
        html += '<p class="fcard-line">' + gbp(c.total) + " estimated · ≈ " + num(c.impr) + " impressions" +
          (c.runWeeks && c.runWeeks !== line.weeks ? '<br><span>Sold in ' + UNIT_LABEL[c.unit] + " cycles, so this runs " + c.runWeeks + " weeks.</span>" : "") + "</p>";
      } else {
        html += '<p class="fcard-line is-na">Not priced online in ' + esc(locName(line.loc)) + ". Ask us for a quote.</p>";
      }
      html += '<button type="button" class="fcard-remove" data-act="remove">Remove</button>';
    }
    return html + "</div></article>";
  }

  function renderFormats() {
    var host = $("formats");
    if (!state.cats.length) {
      host.innerHTML = '<div class="empty"><p><strong>Start by picking a format on the left.</strong> Billboards, the Tube, buses, airports, taxis and more.</p></div>';
      return;
    }
    var fits = (D.audiences.filter(function (a) { return a.id === state.audience; })[0] || {}).fits || [];
    host.innerHTML = state.cats.map(function (cid) {
      var c = catById[cid];
      return '<section class="fcat" aria-labelledby="fcat-' + cid + '">' +
        '<header class="fcat-head" style="--img:url(\'' + c.img + '\')">' +
          '<div><h3 id="fcat-' + cid + '">' + esc(c.name) + (fits.indexOf(cid) > -1 ? ' <em class="fit">Good fit for your audience</em>' : "") + "</h3>" +
          "<p>" + esc(c.blurb) + ' <a href="' + c.guide + '" target="_blank" rel="noopener">See the full pricing guide</a></p></div>' +
        "</header>" +
        '<div class="fcards">' + D.formats.filter(function (f) { return f.cat === cid; }).map(card).join("") + "</div>" +
      "</section>";
    }).join("");
  }

  /* ---------- results ---------- */
  function renderResults() {
    var lines = allLines();
    var t = lines.reduce(function (a, l) { a.impr += l.impr; a.media += l.media; a.print += l.print; a.prod += l.prod; a.total += l.total; return a; },
      { impr: 0, media: 0, print: 0, prod: 0, total: 0 });
    $("r-impr").textContent = num(t.impr);
    $("r-media").textContent = gbp(t.media);
    $("r-print").textContent = gbp(t.print);
    $("r-prod").textContent = gbp(t.prod);
    var totalEl = $("r-total"), totalTxt = gbp(t.total);
    if (totalEl.textContent !== totalTxt) {
      totalEl.textContent = totalTxt;
      totalEl.classList.remove("is-bump"); void totalEl.offsetWidth; totalEl.classList.add("is-bump");
    }
    var priced = lines.filter(function (l) { return l.available; });
    $("results-sub").textContent = priced.length
      ? priced.length + (priced.length === 1 ? " format" : " formats") + " in your plan."
      : "Add formats and quantities above to see your estimate.";
    var cmp = $("budget-compare");
    var bar = $("budget-bar"), over = priced.length && t.total > state.budget;
    bar.style.width = (state.budget ? Math.min(100, t.total / state.budget * 100) : (t.total ? 100 : 0)) + "%";
    bar.parentNode.className = "budget-meter" + (over ? " is-over" : "");
    if (!priced.length) { cmp.textContent = "Your budget: " + gbp(state.budget); cmp.className = "budget-compare"; }
    else if (!over) { cmp.textContent = gbp(state.budget - t.total) + " left of your " + gbp(state.budget) + " budget."; cmp.className = "budget-compare is-ok"; }
    else { cmp.textContent = gbp(t.total - state.budget) + " over your " + gbp(state.budget) + " budget. Reduce quantities or duration, or talk to us about the best mix."; cmp.className = "budget-compare is-over"; }
    $("lines").innerHTML = !lines.length ? '<p class="lines-empty">Your formats will be listed here, line by line.</p>' : '<table><caption class="sr-only">Formats in your plan</caption><thead><tr><th scope="col">Format</th><th scope="col">Qty</th><th scope="col">Where / how long</th><th scope="col">Impacts</th><th scope="col">Estimate</th></tr></thead><tbody>' +
      lines.map(function (l) {
        var line = state.lines[l.f.id];
        var when = l.unit === "day" ? line.days + (line.days === 1 ? " day" : " days") : (l.unit === "once" ? "campaign" : l.runWeeks + " weeks");
        return '<tr><td><span class="ln-name">' + esc(l.f.name) + '</span><span class="ln-cat">' + esc(catById[l.f.cat].name) + "</span></td><td>" + num(l.qty) + "</td><td>" + esc(locName(line.loc)) + ", " + when + "</td>" +
          "<td>" + (l.available ? num(l.impr) : "–") + "</td><td>" + (l.available ? gbp(l.total) : "On request") + "</td></tr>";
      }).join("") + "</tbody></table>";
    /* live summary in the sticky panel / phone bar: the total rolls to its new value */
    rollTo($("ls-total"), t.total);
    $("ls-meta").textContent = priced.length ? num(t.impr) + " impacts · " + priced.length + (priced.length === 1 ? " format" : " formats") : "No formats yet";
    $("ls-bar").style.width = bar.style.width;
    $("ls-bar").parentNode.className = "ls-meter" + (over ? " is-over" : "");
    var lsb = $("ls-budget");
    lsb.textContent = !priced.length ? "Budget " + gbp(state.budget) : over ? gbp(t.total - state.budget) + " over your " + gbp(state.budget) + " budget" : gbp(state.budget - t.total) + " left of " + gbp(state.budget);
    lsb.className = "ls-budget" + (!priced.length ? "" : over ? " is-over" : " is-ok");
    $("live-sum").classList.toggle("has-plan", lines.length > 0);
    $("results").classList.toggle("has-plan", lines.length > 0);
    state._totals = t;
    state._lines = lines;
  }

  /* number roll for the live total (skipped when the visitor prefers reduced motion) */
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function rollTo(el, to) {
    var from = el._v || 0; el._v = to;
    cancelAnimationFrame(el._raf);
    if (calm || from === to) { el.textContent = gbp(to); return; }
    var t0 = performance.now(), dur = 520;
    (function step(now) {
      var p = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - p, 3);
      el.textContent = gbp(Math.round(from + (to - from) * e));
      if (p < 1) el._raf = requestAnimationFrame(step);
    })(t0);
  }

  function renderAll() { renderCats(); renderLocationSelect(); renderFormats(); renderResults(); }

  /* ---------- events ---------- */
  function parseBudget(v) { var n = parseInt(String(v).replace(/[^\d]/g, ""), 10); return isFinite(n) ? n : 0; }
  function setBudget(n, fromInput) {
    state.budget = Math.max(0, n);
    if (!fromInput) $("budget").value = state.budget.toLocaleString("en-GB");
    document.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(+c.dataset.budget === state.budget)); });
    renderResults();
  }
  $("budget").addEventListener("input", function (e) { setBudget(parseBudget(e.target.value), true); });
  $("budget").addEventListener("blur", function () { $("budget").value = state.budget.toLocaleString("en-GB"); });
  document.querySelectorAll(".chip").forEach(function (c) {
    c.addEventListener("click", function () { setBudget(+c.dataset.budget); track("bl_budget_preset", { budget: +c.dataset.budget }); });
  });

  $("cat-list").addEventListener("change", function (e) {
    var id = e.target.value;
    if (e.target.checked) {
      if (state.cats.indexOf(id) < 0) state.cats.push(id);
      track("bl_category_add", { category: id });
      /* entrance motion only when a category is added, not on every quantity change */
      var box = $("formats"); box.classList.add("is-entering");
      clearTimeout(box._t); box._t = setTimeout(function () { box.classList.remove("is-entering"); }, 900);
    }
    else {
      state.cats = state.cats.filter(function (c) { return c !== id; });
      Object.keys(state.lines).forEach(function (fid) { if (fmtById[fid].cat === id) delete state.lines[fid]; });
    }
    renderAll();
  });

  $("duration").addEventListener("change", function (e) {
    state.weeks = +e.target.value;
    Object.keys(state.lines).forEach(function (id) { state.lines[id].weeks = state.weeks; state.lines[id].days = state.weeks; });
    renderFormats(); renderResults();
  });

  $("location").addEventListener("change", function (e) {
    state.location = e.target.value;
    Object.keys(state.lines).forEach(function (id) {
      var f = fmtById[id], l = state.lines[id];
      l.loc = defaultLoc(f);
      var min = minFor(f, regionKey(f, l.loc)); if (l.qty < min) l.qty = min;
    });
    renderFormats(); renderResults();
  });

  $("audience").addEventListener("change", function (e) { state.audience = e.target.value; renderCats(); renderFormats(); });

  $("formats").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]"); if (!btn) return;
    var cardEl = btn.closest(".fcard"); var id = cardEl.dataset.id; var f = fmtById[id];
    var act = btn.dataset.act;
    if (act === "add") {
      var loc = defaultLoc(f);
      state.lines[id] = { qty: minFor(f, regionKey(f, loc)), weeks: state.weeks, days: state.weeks, loc: loc };
      track("bl_format_add", { format: id });
    } else if (act === "remove") { delete state.lines[id]; }
    else {
      var l = state.lines[id], min = minFor(f, regionKey(f, l.loc));
      l.qty = Math.max(min, l.qty + (act === "inc" ? 1 : -1));
      if (act === "dec" && l.qty === min && min > 1) toast("Minimum " + num(min) + " " + f.per + "s for " + f.name + ".");
    }
    renderFormats(); renderResults();
    var card = document.querySelector('.fcard[data-id="' + id + '"]');
    /* micro-feedback: glow on add, a small bump on the quantity */
    if (card && act === "add") card.classList.add("just-added");
    if (card && (act === "inc" || act === "dec")) { var q = card.querySelector('input[data-k="qty"]'); if (q) q.classList.add("bump"); }
    var again = card && card.querySelector(act === "add" ? 'input[data-k="qty"]' : '[data-act="' + act + '"]');
    if (again) again.focus();
  });

  var rendering = false;
  $("formats").addEventListener("change", function (e) {
    var k = e.target.dataset.k; if (!k || rendering) return;
    rendering = true; setTimeout(function () { rendering = false; }, 0);
    var cardEl = e.target.closest(".fcard"); var id = cardEl.dataset.id; var f = fmtById[id]; var l = state.lines[id];
    if (k === "loc") l.loc = e.target.value;
    if (k === "weeks") l.weeks = +e.target.value;
    if (k === "days") l.days = Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 1));
    if (k === "qty") l.qty = parseInt(e.target.value, 10) || 0;
    var min = minFor(f, regionKey(f, l.loc));
    if (l.qty < min) { l.qty = min; toast("Minimum " + num(min) + " " + f.per + "s for " + f.name + " in " + locName(l.loc) + "."); }
    renderFormats(); renderResults();
    var again = document.querySelector('.fcard[data-id="' + id + '"] [data-k="' + k + '"]'); if (again) again.focus();
  });

  /* ---------- reset (with undo) ---------- */
  function snapshot() {
    return JSON.parse(JSON.stringify({ budget: state.budget, cats: state.cats, weeks: state.weeks, location: state.location, audience: state.audience, lines: state.lines }));
  }
  function restore(s) {
    state.cats = s.cats; state.weeks = s.weeks; state.location = s.location; state.audience = s.audience; state.lines = s.lines;
    $("duration").value = String(state.weeks);
    $("audience").value = state.audience;
    setBudget(s.budget);
    renderAll();
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest("[data-reset]")) return;
    var prev = snapshot();
    restore({ budget: 1000, cats: [], weeks: 2, location: "london", audience: "general", lines: {} });
    track("bl_reset");
    $("calc").scrollIntoView({ block: "start" });
    toast("Plan cleared.", { label: "Undo", fn: function () { restore(prev); track("bl_reset_undo"); } });
  });

  /* ---------- live summary ---------- */
  $("ls-cta").addEventListener("click", function () { track("bl_see_estimate", { total: Math.round((state._totals || {}).total || 0) }); });
  /* phone bar: show while the calculator is on screen, hide once the full results are visible */
  if ("IntersectionObserver" in window) {
    var seen = { calc: false, results: false };
    var syncBar = function () { document.body.classList.toggle("ls-show", seen.calc && !seen.results); };
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { seen[e.target.id === "results" ? "results" : "calc"] = e.isIntersecting; });
      syncBar();
    }, { rootMargin: "0px 0px -80px 0px" }).observe($("calc-grid-anchor") || document.querySelector(".calc-grid"));
    new IntersectionObserver(function (es) { seen.results = es[0].isIntersecting; syncBar(); }, { threshold: 0.15 }).observe($("results"));
  }

  /* ---------- next steps ---------- */
  $("print").addEventListener("click", function () { track("bl_print"); window.print(); });

  $("dl-pdf").addEventListener("click", function () {
    var lines = state._lines || [], t = state._totals;
    if (!lines.length) { toast("Add at least one format first."); return; }
    if (!window.jspdf) { window.print(); return; }
    track("bl_pdf_download", { total: Math.round(t.total) });
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    var x = 48, y = 64, W = 499;
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(14, 30, 60);
    doc.text("Loud! OOH Budget Lab estimate", x, y); y += 22;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(77, 89, 105);
    doc.text("Prepared " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) + " · Your budget " + gbp(state.budget) + " · Rough estimate, excl. VAT", x, y); y += 28;
    doc.setFont("helvetica", "bold"); doc.setTextColor(14, 30, 60);
    var cols = [x, x + 220, x + 262, x + 380, x + 455];
    ["Format", "Qty", "Where / how long", "Impacts", "Estimate"].forEach(function (h, i) { doc.text(h, cols[i], y); });
    y += 8; doc.setDrawColor(14, 30, 60); doc.line(x, y, x + W, y); y += 16;
    doc.setFont("helvetica", "normal"); doc.setTextColor(26, 35, 50);
    lines.forEach(function (l) {
      var line = state.lines[l.f.id];
      var when = l.unit === "day" ? line.days + " days" : (l.unit === "once" ? "campaign" : l.runWeeks + " weeks");
      var name = doc.splitTextToSize(catById[l.f.cat].name + " · " + l.f.name, 210);
      doc.text(name, cols[0], y);
      doc.text(num(l.qty), cols[1], y);
      doc.text(doc.splitTextToSize(locName(line.loc) + ", " + when, 112), cols[2], y);
      doc.text(l.available ? num(l.impr) : "-", cols[3], y);
      doc.text(l.available ? gbp(l.total) : "On request", cols[4], y);
      y += Math.max(name.length, 1) * 13 + 8;
      if (y > 700) { doc.addPage(); y = 64; }
    });
    y += 4; doc.line(x, y, x + W, y); y += 22;
    [["Estimated impressions / impacts", num(t.impr)], ["Media cost", gbp(t.media)], ["Printing cost", gbp(t.print)], ["Production cost", gbp(t.prod)], ["Estimated total", gbp(t.total)]].forEach(function (r, i) {
      doc.setFont("helvetica", i === 4 ? "bold" : "normal"); doc.setFontSize(i === 4 ? 13 : 11);
      doc.text(r[0], x, y); doc.text(r[1], x + W, y, { align: "right" }); y += i === 3 ? 22 : 18;
    });
    y += 12; doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(77, 89, 105);
    doc.text(doc.splitTextToSize("Rough estimates from Loud! OOH's published 2026 rates (middle of each published range), excluding VAT. Impressions use the lower weekly estimate per unit × quantity × weeks. Availability, exact sites and final rates are confirmed in a detailed media quote after your enquiry.", W), x, y);
    y += 44; doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(201, 56, 0);
    doc.text("Contact us for a full media quote: hello@loudooh.co.uk · 020 4514 9147 · loudooh.co.uk/contact", x, y);
    doc.save("loud-ooh-budget-estimate.pdf");
  });

  $("contact").addEventListener("click", function () { track("bl_contact", { total: state._totals ? Math.round(state._totals.total) : 0 }); });

  /* ---------- boot ---------- */
  renderAudience();
  setBudget(1000);
  renderAll();
})();
