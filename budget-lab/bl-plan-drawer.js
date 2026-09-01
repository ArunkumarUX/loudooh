/* bl-plan-drawer.js — right-side full plan preview drawer */
(function(){
"use strict";

var root, backdrop, drawer, stageReview, stageEmail, foot;
var backBtn, emailBtn, dlBtn, sendBtn, refineBtn;
var contentEl, titleEl, subEl;
var emailTo, emailSubject, emailBodyPre, emailError;
var wired = false;
var stage = "review";

function els(){
  root = document.getElementById("bl-plan-drawer-root");
  backdrop = document.getElementById("bl-plan-drawer-backdrop");
  drawer = document.getElementById("bl-plan-drawer");
  stageReview = document.getElementById("bl-plan-drawer-stage-review");
  stageEmail = document.getElementById("bl-plan-drawer-stage-email");
  foot = document.getElementById("bl-plan-drawer-foot");
  backBtn = document.getElementById("bl-plan-drawer-back-btn");
  emailBtn = document.getElementById("bl-plan-drawer-email-btn");
  dlBtn = document.getElementById("bl-plan-drawer-download-btn");
  sendBtn = document.getElementById("bl-plan-drawer-send-btn");
  refineBtn = document.getElementById("bl-cta-refine");
  contentEl = document.getElementById("hl-drawer-plan-content");
  titleEl = document.getElementById("bl-plan-drawer-title");
  subEl = document.getElementById("bl-plan-drawer-sub");
  emailTo = document.getElementById("bl-plan-drawer-email-to");
  emailSubject = document.getElementById("bl-plan-drawer-email-subject");
  emailBodyPre = document.getElementById("bl-plan-drawer-email-body");
  emailError = document.getElementById("bl-plan-drawer-email-error");
}

function setStage(next){
  stage = next;
  if(stageReview) stageReview.classList.toggle("is-active", next === "review");
  if(stageEmail) stageEmail.classList.toggle("is-active", next === "email");
  if(stageEmail) stageEmail.hidden = next !== "email";
  if(foot) foot.dataset.stage = next;
  if(backBtn) backBtn.hidden = next !== "email";
  if(emailBtn) emailBtn.hidden = next !== "review";
  if(dlBtn) dlBtn.hidden = next !== "review";
  if(refineBtn) refineBtn.hidden = next !== "review";
  if(sendBtn) sendBtn.hidden = next !== "email";
}

function syncHeader(result){
  if(!titleEl || !window.BLState) return;
  var s = window.BLState.get();
  var gbp = window.blGbp || function(n){ return "£" + Math.round(n).toLocaleString("en-GB"); };
  titleEl.textContent = "Your OOH plan for " + gbp(s.budget);
  if(subEl){
    var geo = window.BLState.geoLabel(s);
    var dur = s.durationDays === 7 ? "1 week" : s.durationDays === 14 ? "2 weeks" : s.durationDays + " days";
    subEl.textContent = (result && result.scenario ? result.scenario.label : s.objective) + " · " + geo + " · " + dur;
  }
}

function syncEmailPreview(result){
  if(!emailBodyPre || !result) return;
  var s = window.BLState.get();
  var gbpFn = window.blGbp || function(n){ return "£" + Math.round(n).toLocaleString("en-GB"); };
  var geo = window.BLState.geoLabel(s);
  if(emailSubject) emailSubject.value = "Budget Lab mix — " + gbpFn(s.budget) + " — " + geo;
  var nameEl = document.getElementById("bl-plan-drawer-email-name");
  var fromEl = document.getElementById("bl-plan-drawer-email-from");
  var fromEmail = fromEl && fromEl.value ? fromEl.value : (emailTo && emailTo.value);
  if(typeof window.blEmailBodyText === "function"){
    emailBodyPre.textContent = window.blEmailBodyText(result, nameEl && nameEl.value, fromEmail);
  }
}

function escHtml(s){
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function durationLabel(days){
  if(days === 7) return "1 week";
  if(days === 14) return "2 weeks";
  if(days === 28) return "4 weeks";
  if(days === 56) return "8 weeks";
  return days + " days";
}

function buildPdfAppendixHtml(r, s, subject, body){
  var gbpFn = window.blGbp || function(n){ return "£" + Math.round(n).toLocaleString("en-GB"); };
  var geo = window.BLState.geoLabel(s);
  if(!subject){
    subject = "Budget Lab mix — " + gbpFn(s.budget) + " — " + geo;
  }
  return (
    '<h1 class="bl-print-title">Your OOH plan for ' + escHtml(gbpFn(s.budget)) + '</h1>' +
    '<p class="bl-print-sub">' + escHtml(geo) + ' · ' + escHtml(durationLabel(s.durationDays)) +
      ' · ex-VAT · built ' + new Date().toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"}) +
      '</p>' +
    '<h2 class="bl-print-h">The email that goes with this plan</h2>' +
    '<p class="bl-print-subject"><strong>Subject:</strong> ' + escHtml(subject) + '</p>' +
    '<pre class="bl-print-mail">' + escHtml(body) + '</pre>'
  );
}

function downloadPdf(){
  var r = window.__BL_LAST_RESULT__;
  if(!r || !window.BLState) return;
  if(typeof window.blGeneratePlanPdf !== "function"){
    console.warn("bl-pdf.js not loaded");
    return;
  }

  var s = window.BLState.get();
  var gbpFn = window.blGbp || function(n){ return "£" + Math.round(n).toLocaleString("en-GB"); };
  var geo = window.BLState.geoLabel(s);
  var subject = emailSubject && emailSubject.value ? emailSubject.value : "";
  var body = "";
  if(typeof window.blEmailBodyText === "function"){
    var nameEl = document.getElementById("bl-plan-drawer-email-name");
    var fromEl = document.getElementById("bl-plan-drawer-email-from");
    var fromEmail = fromEl && fromEl.value ? fromEl.value : (emailTo && emailTo.value);
    body = window.blEmailBodyText(r, nameEl && nameEl.value, fromEmail);
  }
  if(!subject){
    subject = "Budget Lab mix — " + gbpFn(s.budget) + " — " + geo;
  }

  var btn = dlBtn;
  var btnLabel = btn ? btn.textContent : "";
  if(btn){
    btn.disabled = true;
    btn.textContent = "Generating PDF…";
  }

  window.blGeneratePlanPdf({
    planElement: contentEl || document.getElementById("hl-drawer-plan-content"),
    appendixHtml: buildPdfAppendixHtml(r, s, subject, body),
    filename: "loudooh-plan-" + s.budget + ".pdf",
    fallbackText: body || (typeof window.blPlanFullExport === "function" ? window.blPlanFullExport(r) : "")
  }).then(function(){
    if(window.__BL_TRACK__) window.__BL_TRACK__("plan_pdf", {budget: s.budget, geo: s.geo});
  }).catch(function(err){
    console.error(err);
    if(emailError){
      emailError.hidden = false;
      emailError.textContent = "Could not generate PDF. Try again in a moment.";
    }
  }).finally(function(){
    if(btn){
      btn.disabled = false;
      btn.textContent = btnLabel || "Download PDF";
    }
  });
}

function wireOnce(){
  if(wired) return;
  els();
  if(!root) return;
  wired = true;

  function close(){
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("bl-plan-drawer-open");
    setStage("review");
    if(emailError) emailError.hidden = true;
  }

  function open(){
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("bl-plan-drawer-open");
    setStage("review");
    syncHeader(window.__BL_LAST_RESULT__);
    if(contentEl) contentEl.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent("bl-plan-drawer-open"));
  }

  if(backdrop) backdrop.addEventListener("click", close);
  var closeBtn = document.getElementById("bl-plan-drawer-close");
  if(closeBtn) closeBtn.addEventListener("click", close);

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && root.classList.contains("is-open")) close();
  });

  var emailBtnEl = document.getElementById("bl-plan-drawer-email-btn");
  if(emailBtnEl) emailBtnEl.addEventListener("click", function(){
    syncEmailPreview(window.__BL_LAST_RESULT__);
    setStage("email");
    var fromEl = document.getElementById("bl-plan-drawer-email-from");
    if(fromEl) fromEl.focus();
  });

  var backBtn = document.getElementById("bl-plan-drawer-back-btn");
  if(backBtn) backBtn.addEventListener("click", function(){ setStage("review"); });

  var dlBtnEl = document.getElementById("bl-plan-drawer-download-btn");
  if(dlBtnEl) dlBtnEl.addEventListener("click", downloadPdf);

  var refineBtnEl = document.getElementById("bl-cta-refine");
  if(refineBtnEl) refineBtnEl.addEventListener("click", function(){
    close();
    if(typeof window.blGoToStep === "function") window.blGoToStep();
  });

  var sendBtnEl = document.getElementById("bl-plan-drawer-send-btn");
  if(sendBtnEl) sendBtnEl.addEventListener("click", function(){
    var r = window.__BL_LAST_RESULT__;
    if(!r) return;
    var fromEl = document.getElementById("bl-plan-drawer-email-from");
    var email = (fromEl && fromEl.value || "").trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      if(emailError){
        emailError.hidden = false;
        emailError.textContent = "Enter your work email before sending.";
      }
      if(fromEl) fromEl.focus();
      return;
    }
    if(emailError) emailError.hidden = true;
    var subject = emailSubject ? emailSubject.value : "";
    var nameEl = document.getElementById("bl-plan-drawer-email-name");
    var body = typeof window.blEmailBodyText === "function"
      ? window.blEmailBodyText(r, nameEl && nameEl.value, email) : "";
    window.location.href = "mailto:hello@loudooh.co.uk?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    /* SLA confirmation (Jamie brief) */
    if(emailError){
      emailError.hidden = false;
      emailError.style.color = "rgba(10,31,61,.85)";
      emailError.textContent = "Request received. We'll review the plan and confirm availability within 2 business hours. Where media can be provisionally held, we'll confirm the seven-day hold separately.";
    }
  });

  [document.getElementById("bl-plan-drawer-email-from"), document.getElementById("bl-plan-drawer-email-name")].forEach(function(el){
    if(!el) return;
    el.addEventListener("input", function(){
      syncEmailPreview(window.__BL_LAST_RESULT__);
    });
  });

  document.addEventListener("click", function(e){
    var emailLink = e.target.closest('a[href="#bl-plan-email"]');
    if(emailLink){
      e.preventDefault();
      open();
      syncEmailPreview(window.__BL_LAST_RESULT__);
      setStage("email");
      return;
    }
    var openBtn = e.target.closest("[data-open-plan-drawer]");
    if(openBtn){
      e.preventDefault();
      open();
    }
  });

  window.BLPlanDrawer = {
    open: open,
    close: close,
    isOpen: function(){ return root.classList.contains("is-open"); },
    downloadPdf: downloadPdf,
    refresh: function(html, result){
      els();
      if(contentEl && html != null) contentEl.innerHTML = html;
      syncHeader(result);
      syncEmailPreview(result);
      if(root.classList.contains("is-open") && stage === "review" && contentEl){
        contentEl.scrollTop = 0;
      }
    },
    setStage: setStage
  };

  window.blDownloadPlanPdf = downloadPdf;
}

function boot(){
  wireOnce();
  if(window.__BL_PLAN_HTML__ && window.BLPlanDrawer){
    window.BLPlanDrawer.refresh(window.__BL_PLAN_HTML__, window.__BL_LAST_RESULT__);
  }
}

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
})();
