/* Loud AI — Airbnb-style campaign control interactions */
(function(){
"use strict";

var control = document.getElementById("hl-campaign-control");
if(!control) return;

var searchWrap = document.querySelector(".bl-ref-search-wrap");
var openPanel = null;
var collapseTimer = null;
var closeGen = 0;
var hero = null;

var PANEL_WIDTH = {
  budget: 420,
  duration: 560,
  location: 760,
  objective: 700,
  audience: 440
};

var DUR_LABELS = {
  7:"1 week", 14:"2 weeks", 28:"4 weeks", 42:"6 weeks",
  91:"13 weeks", 182:"26 weeks", 365:"52 weeks", 56:"8 weeks+"
};
var OBJ_LABELS = {
  reach:"Maximise Reach", local:"Local Dominance", frequency:"Frequency Boost",
  launch:"Product Launch", footfall:"Footfall", premium:"Product Launch", brand:"Brand Building"
};
var AUD_LABELS = {
  broad:"Mass Market", commuters:"Commuters", professionals:"Professionals",
  students:"Students", shoppers:"Shoppers", local:"Local Residents", custom:"Custom Audience"
};

function getHero(){ return window.__BL_HERO__ || null; }

function barEls(){
  return {
    budget: document.getElementById("hl-bar-budget"),
    duration: document.getElementById("hl-bar-duration"),
    location: document.getElementById("hl-bar-location"),
    objective: document.getElementById("hl-bar-objective"),
    audience: document.getElementById("hl-bar-audience"),
    pill: document.getElementById("hl-mobile-pill")
  };
}

function syncBar(){
  hero = getHero();
  if(!hero) return;
  var s = hero.getState();
  var b = barEls();
  if(b.budget) b.budget.textContent = hero.gbp(s.budget);
  if(b.duration) b.duration.textContent = DUR_LABELS[s.days] || (s.days + " days");
  if(b.location) b.location.textContent = GEO_LABELS[s.geo] || "London";
  if(b.objective) b.objective.textContent = OBJ_LABELS[s.objective] || OBJ_LABELS.reach;
  if(b.audience) b.audience.textContent = AUD_LABELS[s.audience] || "Mass Market";
  var compactBar = document.body.classList.contains("is-planning") && window.innerWidth <= 1024;
  if(compactBar){
    if(b.budget) b.budget.textContent = s.budget >= 1000 ? "£" + Math.round(s.budget/1000) + "K" : hero.gbp(s.budget);
    if(b.duration) b.duration.textContent = (DUR_LABELS[s.days] || "2 weeks").replace(" weeks"," Weeks").replace(" week"," Week");
    if(b.objective) b.objective.textContent = (OBJ_LABELS[s.objective] || "Reach").replace("Maximise ","");
  }
  if(b.pill){
    var bud = s.budget >= 1000 ? "£" + Math.round(s.budget / 1000) + "K" : hero.gbp(s.budget);
    var dur = DUR_LABELS[s.days] || "2 weeks";
    var loc = GEO_LABELS[s.geo] || "London";
    var obj = (OBJ_LABELS[s.objective] || "Reach").replace("Maximise ", "");
    var summary = loc + " · " + bud + " · " + dur + " · " + obj;
    b.pill.setAttribute("aria-label", "Campaign settings: " + summary);
    var sumEl = document.getElementById("hl-mobile-pill-summary");
    if(sumEl) sumEl.textContent = summary;
    else b.pill.textContent = summary;
  }
  syncPanelSelections(s);
}

var GEO_LABELS = {
  london:"London", manchester:"Manchester", birmingham:"Birmingham",
  leeds:"Leeds", glasgow:"Glasgow", uk:"UK-wide", regional:"Regional UK", named:"Named city"
};

function syncPanelSelections(s){
  document.querySelectorAll(".bl-campaign-preset").forEach(function(btn){
    var b = parseInt(btn.getAttribute("data-budget"), 10);
    btn.classList.toggle("is-on", Math.abs(s.budget - b) < (b < 15000 ? 500 : 2500));
  });
  document.querySelectorAll(".bl-campaign-opt").forEach(function(btn){
    var on = parseInt(btn.getAttribute("data-days"), 10) === s.days;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll(".bl-campaign-loc-item").forEach(function(btn){
    var on = btn.getAttribute("data-geo") === s.geo;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll(".bl-campaign-obj-card").forEach(function(btn){
    var on = btn.getAttribute("data-obj") === s.objective;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  /* Only rows that actually carry data-aud. The row component is shared with
     the Advanced settings pickers, and an unscoped sweep was stripping their
     selected state on every sync. */
  document.querySelectorAll("[data-aud].bl-campaign-aud-row, [data-aud].bl-campaign-aud-opt").forEach(function(btn){
    var on = btn.getAttribute("data-aud") === s.audience;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  var inp = document.getElementById("hl-budget-input");
  if(inp && hero) inp.value = hero.gbp(s.budget);
}

function isDesktopSplit(){
  return window.innerWidth > 1024;
}

function setPickerOpenState(on){
  if(searchWrap) searchWrap.classList.toggle("is-sidebar-picker-open", !!on);
  control.classList.toggle("is-picker-open", !!on);
}

function positionPopover(id){
  var panels = document.getElementById("hl-campaign-panels");
  if(!panels) return;

  if(isDesktopSplit()){
    panels.style.position = "";
    panels.style.left = "";
    panels.style.top = "";
    panels.style.width = "";
    panels.style.right = "";
    return;
  }

  var seg = document.querySelector('.bl-campaign-seg[data-panel="' + id + '"]');
  if(!seg) return;

  panels.style.position = "absolute";
  panels.style.top = "calc(100% + 14px)";
  var controlRect = control.getBoundingClientRect();
  var segRect = seg.getBoundingClientRect();
  var w = Math.min(PANEL_WIDTH[id] || 520, controlRect.width);
  var left = segRect.left - controlRect.left + (segRect.width / 2) - (w / 2);
  left = Math.max(0, Math.min(left, controlRect.width - w));
  panels.style.width = w + "px";
  panels.style.left = left + "px";
}

function syncAccordionItems(id){
  document.querySelectorAll(".bl-campaign-accordion-item").forEach(function(item){
    var on = id && item.getAttribute("data-panel") === id;
    item.classList.toggle("is-expanded", !!on);
  });
}

function focusPanelOption(id){
  var panel = document.getElementById("hl-panel-" + id);
  if(!panel) return;
  var selected = panel.querySelector(".is-on[role='option'], .is-on[data-days], .is-on[data-geo], .is-on[data-obj], .is-on[data-aud]");
  var first = panel.querySelector("[data-days], [data-geo], [data-obj], [data-aud], .bl-campaign-loc-nearby");
  var target = selected || first;
  if(target && target.focus) target.focus({ preventScroll: true });
}

function scrollExpandedIntoView(id){
  if(!isDesktopSplit()) return;
  var item = document.querySelector('.bl-campaign-accordion-item[data-panel="' + id + '"]');
  if(!item) return;
  requestAnimationFrame(function(){
    item.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}

function open(id){
  if(isMobileSheet() && window.__BL_OPEN_CAMPAIGN_SHEET__){
    window.__BL_OPEN_CAMPAIGN_SHEET__(id);
    return;
  }
  closeGen++;
  if(openPanel === id){
    close();
    return;
  }
  var wasOpen = openPanel !== null;
  openPanel = id;
  if(!wasOpen){
    control.classList.add("is-open");
    setPickerOpenState(true);
    document.dispatchEvent(new CustomEvent("bl-campaign-open"));
  }
  document.querySelectorAll(".bl-campaign-seg").forEach(function(seg){
    var on = seg.getAttribute("data-panel") === id;
    seg.classList.toggle("is-active", on);
    seg.setAttribute("aria-expanded", on ? "true" : "false");
  });
  document.querySelectorAll(".bl-campaign-panel").forEach(function(p){
    p.classList.toggle("is-open", p.getAttribute("data-panel") === id);
  });
  if(isDesktopSplit()) syncAccordionItems(id);
  control.classList.toggle("is-picker-location", id === "location");
  requestAnimationFrame(function(){
    if(!isDesktopSplit()) positionPopover(id);
    else scrollExpandedIntoView(id);
    if(!wasOpen) window.addEventListener("resize", onResize);
    else onResize();
    if(id === "location" && isDesktopSplit()){
      var locSearch = document.getElementById("hl-loc-search");
      if(locSearch) locSearch.focus({ preventScroll: true });
    } else {
      focusPanelOption(id);
    }
  });
}

function onResize(){
  if(openPanel) positionPopover(openPanel);
}

function close(){
  if(!openPanel){
    if(control.classList.contains("is-open")){
      control.classList.remove("is-open");
      setPickerOpenState(false);
      document.dispatchEvent(new CustomEvent("bl-campaign-close"));
    }
    return;
  }
  openPanel = null;
  var gen = ++closeGen;
  document.querySelectorAll(".bl-campaign-seg").forEach(function(seg){
    seg.classList.remove("is-active");
    seg.setAttribute("aria-expanded", "false");
  });
  document.querySelectorAll(".bl-campaign-panel").forEach(function(p){
    p.classList.remove("is-open");
  });
  syncAccordionItems(null);
  control.classList.remove("is-picker-location");
  window.removeEventListener("resize", onResize);
  setTimeout(function(){
    if(gen !== closeGen || openPanel) return;
    if(control.classList.contains("is-open")){
      control.classList.remove("is-open");
      setPickerOpenState(false);
      document.dispatchEvent(new CustomEvent("bl-campaign-close"));
    }
  }, 280);
}

function apply(partial, autoClose){
  hero = getHero();
  if(!hero) return;
  if(window.__BL_AI_PREVIEW__ && window.__BL_AI_PREVIEW__.isActive()){
    window.__BL_AI_PREVIEW__.dismiss();
  }
  hero.setState(partial);
  if(autoClose !== false){
    clearTimeout(collapseTimer);
    collapseTimer = setTimeout(function(){ close(); }, 220);
  }
}

function panelOptions(id){
  var panel = document.getElementById("hl-panel-" + id);
  if(!panel) return [];
  return Array.prototype.slice.call(
    panel.querySelectorAll("[data-days], [data-geo], [data-obj], [data-aud], .bl-campaign-loc-nearby")
  );
}

function focusAdjacentOption(id, delta){
  var options = panelOptions(id);
  if(!options.length) return;
  var idx = options.indexOf(document.activeElement);
  if(idx < 0) idx = options.findIndex(function(el){ return el.classList.contains("is-on"); });
  var next = (idx + delta + options.length) % options.length;
  options[next].focus({ preventScroll: true });
}

function wirePanelKeyboard(){
  document.addEventListener("keydown", function(e){
    if(!openPanel || !isDesktopSplit()) return;
    var panel = document.getElementById("hl-panel-" + openPanel);
    if(!panel || !panel.classList.contains("is-open")) return;

    if(e.key === "ArrowDown"){
      e.preventDefault();
      focusAdjacentOption(openPanel, 1);
      return;
    }
    if(e.key === "ArrowUp"){
      e.preventDefault();
      focusAdjacentOption(openPanel, -1);
      return;
    }
    if(e.key === "Home"){
      e.preventDefault();
      var first = panelOptions(openPanel)[0];
      if(first) first.focus({ preventScroll: true });
      return;
    }
    if(e.key === "End"){
      e.preventDefault();
      var opts = panelOptions(openPanel);
      if(opts.length) opts[opts.length - 1].focus({ preventScroll: true });
      return;
    }
    if(e.key === "Enter" || e.key === " "){
      var t = e.target;
      if(!t.closest || !t.closest(".bl-campaign-panel.is-open")) return;
      var pick = t.closest("[data-days], [data-geo], [data-obj], [data-aud], .bl-campaign-loc-nearby");
      if(!pick || pick.tagName !== "BUTTON") return;
      e.preventDefault();
      pick.click();
    }
  });
}

function onDocumentPointerDown(e){
  if(!openPanel) return;
  if(e.target.closest(".bl-campaign-panel.is-open")) return;
  if(e.target.closest(".bl-campaign-seg")) return;
  if(e.target.closest("#hl-control-backdrop")) return;
  if(isDesktopSplit()){
    if(!control.contains(e.target)) close();
    return;
  }
  var panels = document.getElementById("hl-campaign-panels");
  if(control.contains(e.target)) return;
  if(panels && panels.contains(e.target)) return;
  close();
}

function wirePickerDelegation(){
  control.addEventListener("click", function(e){
    var daysBtn = e.target.closest("[data-days]");
    if(daysBtn){
      e.preventDefault();
      apply({ days: parseInt(daysBtn.getAttribute("data-days"), 10) }, true);
      return;
    }
    var geoBtn = e.target.closest("[data-geo]");
    if(geoBtn){
      e.preventDefault();
      apply({ geo: geoBtn.getAttribute("data-geo") }, true);
      return;
    }
    var objBtn = e.target.closest("[data-obj]");
    if(objBtn){
      e.preventDefault();
      apply({ objective: objBtn.getAttribute("data-obj") }, true);
      return;
    }
    var audBtn = e.target.closest("[data-aud]");
    if(audBtn){
      e.preventDefault();
      apply({ audience: audBtn.getAttribute("data-aud") }, true);
      return;
    }
  });
}

function wireDesktop(){
  document.querySelectorAll(".bl-campaign-seg").forEach(function(seg){
    seg.addEventListener("click", function(e){
      e.preventDefault();
      e.stopPropagation();
      open(seg.getAttribute("data-panel"));
    });
  });

  var backdrop = document.getElementById("hl-control-backdrop");
  if(backdrop){
    backdrop.addEventListener("click", function(e){
      e.stopPropagation();
      close();
    });
  }

  document.addEventListener("pointerdown", onDocumentPointerDown);
  wirePickerDelegation();
  wirePanelKeyboard();

  document.addEventListener("bl-campaign-close-request", function(){
    close();
  });

  var slider = document.getElementById("hl-budget");
  if(slider){
    slider.addEventListener("input", function(){
      hero = getHero();
      if(!hero) return;
      apply({budget: hero.sliderToBudget(parseFloat(slider.value))}, false);
    });
  }

  var budgetInput = document.getElementById("hl-budget-input");
  if(budgetInput){
    budgetInput.addEventListener("change", function(){
      var raw = this.value.replace(/[^0-9]/g, "");
      var n = parseInt(raw, 10);
      if(!n || n < 1000) return;
      apply({budget: Math.min(500000, n)}, false);
    });
  }

  var budgetPresets = document.getElementById("hl-budget-presets");
  if(budgetPresets){
    budgetPresets.addEventListener("click", function(e){
      var btn = e.target.closest("[data-budget]");
      if(!btn) return;
      apply({budget: parseInt(btn.getAttribute("data-budget"), 10)}, true);
    });
  }

  document.querySelectorAll(".bl-campaign-loc-item").forEach(function(item){
    item.addEventListener("mouseenter", function(){
      if(openPanel !== "location") return;
      var geo = item.getAttribute("data-geo");
      if(window.__BL_MAP__ && window.__BL_MAP__.previewGeo) window.__BL_MAP__.previewGeo(geo);
    });
    item.addEventListener("mouseleave", function(){
      if(openPanel !== "location") return;
      hero = getHero();
      if(window.__BL_MAP__ && window.__BL_MAP__.restoreGeo && hero){
        window.__BL_MAP__.restoreGeo(hero.getState().geo);
      }
    });
  });

  var nearby = document.getElementById("hl-loc-nearby");
  if(nearby){
    nearby.addEventListener("click", function(){
      apply({geo:"london"}, true);
    });
  }

  var laiBtn = document.getElementById("hl-lai-btn");
  if(laiBtn){
    laiBtn.addEventListener("click", function(e){
      e.stopPropagation();
      close();
      if(window.__BL_HERO__ && window.__BL_HERO__.focusIntelligence){
        window.__BL_HERO__.focusIntelligence();
        return;
      }
      var exp = document.getElementById("hl-plan-hub") || document.getElementById("hl-ai-experiment");
      if(exp) exp.scrollIntoView({behavior:"smooth", block:"center"});
    });
  }

  var locSearch = document.getElementById("hl-loc-search");
  if(locSearch){
    locSearch.addEventListener("input", function(){
      var q = this.value.toLowerCase().trim();
      document.querySelectorAll(".bl-campaign-loc-item").forEach(function(item){
        var t = item.textContent.toLowerCase();
        item.style.display = !q || t.indexOf(q) > -1 ? "" : "none";
      });
    });
  }

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape") close();
  });
}

function isMobileSheet(){
  return window.innerWidth <= 1024;
}

function wireMobile(){
  var sheet = document.getElementById("hl-campaign-sheet");
  var content = document.getElementById("hl-sheet-content");
  var pill = document.getElementById("hl-mobile-pill");
  if(!sheet || !content || !pill) return;

  function clonePanel(id){
    var src;
    if(id === "budget"){
      src = document.getElementById("hl-sidebar-budget");
    } else if(id === "advanced"){
      var adv = document.getElementById("hl-advanced");
      src = adv ? adv.querySelector(".bl-adv-body") : null;
    } else {
      src = document.getElementById("hl-panel-" + id);
    }
    if(!src) return;
    content.innerHTML = src.innerHTML;
    wireSheetPanel();
  }

  function openSheet(panel){
    if(!isMobileSheet()) return;
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    pill.setAttribute("aria-expanded", "true");
    document.body.classList.add("bl-sheet-open");
    document.querySelectorAll(".bl-campaign-sheet-tab").forEach(function(t){
      t.classList.toggle("is-on", t.getAttribute("data-panel") === panel);
    });
    clonePanel(panel || "budget");
  }

  function closeSheet(){
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    pill.setAttribute("aria-expanded", "false");
    document.body.classList.remove("bl-sheet-open");
  }

  window.__BL_OPEN_CAMPAIGN_SHEET__ = openSheet;

  pill.addEventListener("click", function(){
    if(sheet.classList.contains("is-open")) closeSheet();
    else openSheet("budget");
  });
  document.getElementById("hl-sheet-backdrop").addEventListener("click", closeSheet);
  var doneBtn = document.getElementById("hl-sheet-done");
  if(doneBtn) doneBtn.addEventListener("click", closeSheet);
  document.getElementById("hl-sheet-tabs").addEventListener("click", function(e){
    var tab = e.target.closest("[data-panel]");
    if(!tab) return;
    openSheet(tab.getAttribute("data-panel"));
  });

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && sheet.classList.contains("is-open")) closeSheet();
  });

  window.addEventListener("resize", function(){
    if(!isMobileSheet() && sheet.classList.contains("is-open")) closeSheet();
  });

  function proxyField(cloneRoot, sourceRoot, attr){
    if(!cloneRoot || !sourceRoot) return;
    cloneRoot.querySelectorAll("[" + attr + "]").forEach(function(btn){
      btn.addEventListener("click", function(e){
        e.preventDefault();
        var val = btn.getAttribute(attr);
        var orig = sourceRoot.querySelector("[" + attr + '="' + val + '"]');
        if(orig) orig.click();
        syncBar();
      });
    });
  }

  function wireSheetPanel(){
    var root = content;
    var slider = root.querySelector("#hl-budget");
    if(slider){
      slider.id = "hl-budget-sheet";
      slider.addEventListener("input", function(){
        hero = getHero();
        if(!hero) return;
        apply({budget: hero.sliderToBudget(parseFloat(slider.value))}, false);
      });
    }
    var budgetInput = root.querySelector("#hl-budget-input");
    if(budgetInput){
      budgetInput.id = "hl-budget-input-sheet";
      budgetInput.addEventListener("change", function(){
        hero = getHero();
        if(!hero) return;
        var raw = this.value.replace(/[^0-9]/g, "");
        var n = parseInt(raw, 10);
        if(!n || n < 1000) return;
        apply({budget: Math.min(500000, n)}, false);
      });
    }
    root.querySelectorAll("[data-budget]").forEach(function(btn){
      btn.addEventListener("click", function(){
        apply({budget: parseInt(btn.getAttribute("data-budget"), 10)}, false);
      });
    });
    root.querySelectorAll("[data-days]").forEach(function(btn){
      btn.addEventListener("click", function(){
        apply({days: parseInt(btn.getAttribute("data-days"), 10)}, false);
      });
    });
    root.querySelectorAll("[data-geo]").forEach(function(btn){
      btn.addEventListener("click", function(){
        apply({geo: btn.getAttribute("data-geo")}, false);
      });
    });
    root.querySelectorAll("[data-obj]").forEach(function(btn){
      btn.addEventListener("click", function(){
        apply({objective: btn.getAttribute("data-obj")}, false);
      });
    });
    root.querySelectorAll("[data-aud]").forEach(function(btn){
      btn.addEventListener("click", function(){
        apply({audience: btn.getAttribute("data-aud")}, false);
      });
    });
    proxyField(root.querySelector("#bl-basis-toggle"), document.getElementById("bl-basis-toggle"), "data-basis");
    proxyField(root.querySelector("#bl-format-pref-row"), document.getElementById("bl-format-pref-row"), "data-val");
    proxyField(root.querySelector("#bl-planning-mode-row"), document.getElementById("bl-planning-mode-row"), "data-val");
  }
}

function boot(){
  var stalePortal = document.getElementById("hl-campaign-flyout-portal");
  if(stalePortal) stalePortal.remove();

  wireDesktop();
  wireMobile();
  syncBar();
  window.addEventListener("resize", function(){
    if(openPanel && isDesktopSplit()) scrollExpandedIntoView(openPanel);
  });
  var tries = 0;
  var iv = setInterval(function(){
    if(window.__BL_HERO__ || tries++ > 40){
      clearInterval(iv);
      syncBar();
      if(window.__BL_HERO__) window.__BL_HERO__.onSync = syncBar;
    }
  }, 50);
}

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
})();
