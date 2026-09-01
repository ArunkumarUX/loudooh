/* bl-plan-pdf.js — builds the printed plan.
   ------------------------------------------------------------------
   The download used to print the screen with its furniture switched off: it
   opened cold on the verdict box with no title or date, and appended the email
   as a bare <pre>. This builds the three parts a document needs — a cover with
   the brand and the headline figures, the plan itself (the real markup, so the
   PDF can never disagree with the screen), and the email as an appendix — then
   prints, then removes them again.

   Everything here is read from the same result object the plan is rendered
   from. Nothing is recomputed for the PDF, so nothing can drift. */
(function () {
  "use strict";

  function el(id){ return document.getElementById(id); }
  function esc(s){
    return String(s == null ? "" : s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function gbp(n){ return "£" + Math.round(n || 0).toLocaleString("en-GB"); }
  function gbp2(n){
    return "£" + (Math.round((n || 0) * 100) / 100)
      .toLocaleString("en-GB", {minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function millions(n){
    if(n == null) return "—";
    if(n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/,"") + "M";
    if(n >= 1e3) return Math.round(n / 1e3) + "K";
    return String(Math.round(n));
  }
  function plural(n, w){ return n + " " + w + (n === 1 ? "" : "s"); }
  function durationLabel(d){
    if(!d) return "—";
    return d % 7 === 0 ? plural(d / 7, "week") : plural(d, "day");
  }
  function placeLabel(st){
    if(!st) return "your area";
    if(st.geo === "london") return "London";
    if(st.geo === "uk") return "UK-wide";
    if(st.geo === "regional") return "Regional UK";
    if(st.geo === "named") return st.named || "one city";
    return st.named || "your area";
  }
  function today(){
    return new Date().toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"});
  }

  /* Append only — never insert at the front. Putting the cover first shifted
     every body > *:nth-child() rule on the page, and if the print then died
     (an embedded browser where window.print throws, for instance) the page was
     left rearranged. Print order is set with flex `order` in the stylesheet,
     which costs nothing on screen and cannot outlive the print. */
  function ensure(id){
    var n = el(id);
    if(!n){
      n = document.createElement("section");
      n.id = id;
      document.body.appendChild(n);
    }
    return n;
  }

  /* The verdict as the plan states it, not a second opinion written here. */
  function verdict(){
    var v = document.querySelector("#bl-ai-verdict, .bl-ai-verdict");
    if(!v) return null;
    var h = v.querySelector("h3, h2");
    var p = v.querySelector(".bl-ai-body, p:last-of-type");
    return {
      title: h ? h.textContent.trim() : "",
      body: p ? p.textContent.trim() : ""
    };
  }

  function coverMarkup(r){
    var st = (r && r.state) || (window.BLState && window.BLState.get()) || {};
    var v = verdict();
    var h = "";

    h += '<div class="bl-pdf-brandbar">' +
           '<span class="bl-pdf-brand">Loud<em>!</em> OOH</span>' +
           '<span class="bl-pdf-brandmeta">Budget Lab · prepared ' + esc(today()) + '</span>' +
         "</div>";

    h += '<p class="bl-pdf-eyebrow">' + esc((r.scenario && r.scenario.label) || "Plan") + '</p>';
    h += '<h1 class="bl-pdf-title">Your OOH plan for ' + esc(gbp(st.budget)) + "</h1>";
    h += '<p class="bl-pdf-sub">' + esc(placeLabel(st)) + " · " + esc(durationLabel(st.durationDays)) +
         " · all figures ex-VAT · indicative planning estimate, not a quote</p>";

    if(v){
      h += '<div class="bl-pdf-verdict"><p>Loud AI</p><h2>' + esc(v.title) + "</h2>" +
           "<p>" + esc(v.body) + "</p></div>";
    }

    var figs = [
      {b: gbp(st.budget), s: "Total budget", i: durationLabel(st.durationDays) + " · " + placeLabel(st)},
      {b: gbp(r.spend), s: "Planned spend", i: "Media, production and installation", lead: true},
      {b: String(r.sites), s: "Sites booked", i: plural(r.lines ? r.lines.length : 0, "format") + " in the mix"},
      {b: r.cpm ? gbp2(r.cpm.mid) : "—", s: "Per 1,000 impacts",
       i: r.cpm ? gbp2(r.cpm.low) + "–" + gbp2(r.cpm.high) + " across the range" : ""},
      {b: millions(r.audienceLow) + "–" + millions(r.audienceHigh), s: "Estimated impacts",
       i: "Exposures, not people reached"},
      {b: gbp(r.reserve + (r.unallocated > 0 ? r.unallocated : 0)), s: "Held back",
       i: gbp(r.reserve) + " contingency" + (r.unallocated > 0 ? " · " + gbp(r.unallocated) + " unallocated" : "")}
    ];
    h += '<div class="bl-pdf-figures">';
    figs.forEach(function(f){
      h += '<div class="bl-pdf-fig' + (f.lead ? " is-lead" : "") + '"><b>' + esc(f.b) + "</b>" +
           "<span>" + esc(f.s) + "</span>" + (f.i ? "<i>" + esc(f.i) + "</i>" : "") + "</div>";
    });
    h += "</div>";

    h += '<p class="bl-pdf-note">Impacts are a planning range from operator and industry data, not a ' +
         'measured audience. Rates are indicative and subject to availability. This document ' +
         'reflects the plan as it stood on ' + esc(today()) + ".</p>";
    h += '<p class="bl-pdf-disclaimer">Planning estimates based on current market rates, available audience data and Loud! OOH buying experience. Final prices and availability are confirmed before booking.</p>';
    return h;
  }

  function appendixMarkup(){
    var subject = "", body = "";
    var sEl = el("bl-plan-drawer-email-subject") || el("bl-mail-subject");
    var bEl = el("bl-plan-drawer-email-body") || el("bl-mail-body");
    if(sEl) subject = sEl.value || "";
    if(bEl) body = bEl.value || "";
    if(!body && typeof window.blEmailBodyText === "function"){
      /* (result, name, from) — it needs the plan, not an empty call */
      var nameEl = el("bl-plan-drawer-email-name") || el("bl-mail-name");
      var fromEl = el("bl-plan-drawer-email-from") || el("bl-mail-from");
      try{
        body = window.blEmailBodyText(window.__BL_LAST_RESULT__,
                 nameEl && nameEl.value, fromEl && fromEl.value) || "";
      }catch(e){}
    }
    if(!subject && !body) return "";
    return '<h2 class="bl-pdf-h">The email that goes with this plan</h2>' +
           (subject ? '<p class="bl-pdf-subject"><strong>Subject:</strong> ' + esc(subject) + "</p>" : "") +
           '<pre class="bl-pdf-mail">' + esc(body) + "</pre>";
  }



  function cleanup(){
    document.body.classList.remove("bl-printing");
    ["bl-plan-cover","bl-plan-appendix"].forEach(function(id){
      var n = el(id);
      if(n && n.parentNode) n.parentNode.removeChild(n);
    });
    /* the old implementation's block, if it is still around */
    var legacy = el("bl-print");
    if(legacy && legacy.parentNode) legacy.parentNode.removeChild(legacy);
  }

  /* opts.previewOnly builds the printed document and leaves it in place
     without printing, so a test can look at what would come out of the
     printer. Nothing in the product calls it that way. */
  function download(opts){
    opts = opts || {};
    var r = window.__BL_LAST_RESULT__;
    if(!r || r.infeasible){
      if(typeof window.__BL_PDF_PREV__ === "function") return window.__BL_PDF_PREV__();
      return;
    }

    if(window.BLPlanDrawer && window.BLPlanDrawer.setStage){
      try{ window.BLPlanDrawer.setStage("review"); }catch(e){}
    }
    if(window.BLPanel && window.BLPanel.showTab){
      try{ window.BLPanel.showTab("plan"); }catch(e){}
    }

    if(typeof window.blGeneratePlanPdf !== "function"){
      if(window.console && console.warn) console.warn("[plan pdf] bl-pdf.js not loaded");
      return;
    }

    var st = (r && r.state) || (window.BLState && window.BLState.get()) || {};
    var planEl = el("hl-drawer-plan-content");
    var filename = "loudooh-plan-" + (st.budget || "export") + ".pdf";
    var btn = el("bl-plan-drawer-download-btn") || el("bl-download-pdf") || el("bl-mail-pdf");
    var btnLabel = btn ? btn.textContent : "";

    if(btn){
      btn.disabled = true;
      btn.textContent = "Generating PDF…";
    }

    var fallbackText = "";
    if(typeof window.blPlanFullExport === "function"){
      try{ fallbackText = window.blPlanFullExport(r) || ""; }catch(e){}
    }

    return window.blGeneratePlanPdf({
      coverHtml: coverMarkup(r),
      planElement: planEl,
      appendixHtml: appendixMarkup(),
      filename: filename,
      fallbackText: fallbackText
    }).then(function(){
      if(window.__BL_TRACK__) window.__BL_TRACK__("plan_pdf", {budget: st.budget, geo: st.geo});
    }).catch(function(err){
      if(window.console && console.error) console.error("[plan pdf]", err);
      var errEl = el("bl-plan-drawer-email-error");
      if(errEl){
        errEl.hidden = false;
        errEl.textContent = "Could not generate PDF. Try again in a moment.";
      }
    }).finally(function(){
      if(btn){
        btn.disabled = false;
        btn.textContent = btnLabel || "Download PDF";
      }
    });
  }

  /* Take over from whatever was wired before, and keep a reference so the
     infeasible case still has somewhere to go. */
  function install(){
    if(typeof window.blDownloadPlanPdf === "function" && window.blDownloadPlanPdf !== download){
      window.__BL_PDF_PREV__ = window.blDownloadPlanPdf;
    }
    window.blDownloadPlanPdf = download;
    if(window.BLPlanDrawer) window.BLPlanDrawer.downloadPdf = download;
    if(window.BLPanel) window.BLPanel.downloadPdf = download;

    ["bl-plan-drawer-download-btn","bl-download-pdf","bl-mail-pdf"].forEach(function(id){
      var b = el(id);
      if(!b || b.getAttribute("data-pdf-wired") === "1") return;
      b.setAttribute("data-pdf-wired", "1");
      /* Capture phase, so this runs instead of the older handler. */
      b.addEventListener("click", function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        download();
      }, true);
    });
  }

  window.BLPlanPdf = {
    download: download,
    install: install,
    /* used by the print test, and a way back if a page is ever left mid-print */
    restore: function(){
      document.body.classList.remove("bl-printing");
      cleanup();
    }
  };

  /* If a previous print died before it could clean up — a browser that throws
     on window.print, a tab closed mid-dialog — the page must not load in the
     printing state. */
  if(document.body && document.body.classList.contains("bl-printing")){
    document.body.classList.remove("bl-printing");
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", function(){ setTimeout(install, 0); });
  } else {
    setTimeout(install, 0);
  }
  /* the drawer wires its own button when it first opens, so claim it again */
  document.addEventListener("click", function(){ setTimeout(install, 120); }, true);
})();
