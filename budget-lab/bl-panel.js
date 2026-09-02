/* bl-panel.js — the plan panel: tabs, the email that actually gets sent, and
   the PDF.
   ------------------------------------------------------------------
   Three things were wrong before this file existed:

   1. The plan was behind a "View Plan Summary" button. A calculator that has
      already calculated should not ask permission to show its answer.
   2. The email was a black box. You typed an address and hoped. Now the exact
      subject and body are on screen, editable, and what is sent is what you
      read — there is no second version of the text hiding in the code.
   3. There was no way to take the plan anywhere except that email. There is
      now a PDF containing the whole plan and the email text with it.

   Everything here is generated from the same result object the summary is
   rendered from, so the email and the PDF can never quietly disagree with the
   plan on screen. */
(function () {
  "use strict";

  var PANEL = "bl-plan-panel";
  var edited = false;          /* has the reader touched the email text? */
  var lastSignature = null;    /* the plan the current email text was written for */

  /* ---------- small helpers ---------- */
  function el(id){ return document.getElementById(id); }
  function gbp(n){ return "£" + Math.round(n || 0).toLocaleString("en-GB"); }
  /* Money that matters to the penny: a cost per 1,000 of £3.05 is not £3. */
  function gbp2(n){
    return "£" + (Math.round((n || 0) * 100) / 100).toLocaleString("en-GB",
      {minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function esc(s){
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function millions(n){
    if(n == null) return "—";
    if(n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
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
    if(st.geo === "uk") return "the UK";
    if(st.geo === "named") return st.named || "one city";
    if(st.geo === "regional") return "regional UK";
    return st.named || "your area";
  }
  function result(){ return window.__BL_LAST_RESULT__ || null; }
  function stateOf(r){ return (r && r.state) || (window.BLState && window.BLState.get()) || {}; }

  function signature(r){
    if(!r) return "none";
    var st = stateOf(r);
    return [st.budget, st.durationDays, st.objective, st.geo, st.named, st.audience,
            r.sites, Math.round(r.spend || 0)].join("|");
  }

  /* ---------- the email ---------- *
     Kept deliberately tight. A mailto: URL is not a document — some mail
     clients truncate long ones — so the email is the shape of the plan and the
     numbers that matter, and the PDF carries the full detail. */
  function emailFor(r){
    var st = stateOf(r);
    var place = placeLabel(st);
    var dur = durationLabel(st.durationDays);

    if(!r || r.infeasible){
      return {
        subject: "OOH plan enquiry — " + gbp(st.budget) + ", " + place,
        body: [
          "Hi,",
          "",
          "I was planning " + gbp(st.budget) + " across " + place + " over " + dur +
            ", and the Budget Lab could not build a bookable plan at that size" +
            (r && r.minBudget ? " — the smallest realistic buy it found was about " + gbp(r.minBudget) + "." : "."),
          "",
          "Could you tell me what is achievable at this budget, or what it would take to make it work?",
          "",
          "Thanks"
        ].join("\n")
      };
    }

    var mix = r.lines.map(function(l){
      return "  " + l.qty + " × " + l.f.format + " (" + l.f.category + ") — " + gbp(l.total);
    }).join("\n");

    var confirm = [];
    if(r.discount > 0){
      confirm.push("  · " + gbp(r.discount) + " of the saving comes from assumed volume bands — confirm the real rate.");
    }
    if(r.taperNotes && r.taperNotes.length){
      confirm.push("  · Multi-cycle rates are quoted below a straight multiple; confirm the long-run rate.");
    }
    confirm.push("  · Planning rates never guarantee availability — sites have to be confirmed live.");

    var body = [
      "Hi,",
      "",
      "Here is the plan the Loud! OOH Budget Lab™ built for " + gbp(st.budget) +
        " across " + place + " over " + dur + ".",
      "",
      "THE NUMBERS",
      "  Planned spend      " + gbp(r.spend) + " of " + gbp(st.budget),
      "  Held back          " + gbp(r.reserve) + " contingency" +
        (r.unallocated > 0 ? " · " + gbp(r.unallocated) + " unallocated" : ""),
      "  Sites booked       " + r.sites + " across " + plural(r.lines.length, "format"),
      "  Estimated impacts  " + millions(r.audienceLow) + "–" + millions(r.audienceHigh),
      "  Cost per 1,000     " + (r.cpm ? gbp2(r.cpm.mid) : "—") +
        (r.cpm ? " (" + gbp2(r.cpm.low) + "–" + gbp2(r.cpm.high) + " across the range)" : ""),
      "",
      "THE MIX",
      mix,
      "",
      "TO CONFIRM BEFORE BOOKING",
      confirm.join("\n"),
      "",
      "All figures are ex-VAT and indicative — impacts are a range, not a promise,",
      "and this is a planning estimate rather than a quote.",
      "",
      "Could you come back with live availability and a firm price?",
      "",
      "Thanks"
    ].join("\n");

    return {
      subject: "OOH plan — " + place + ", " + gbp(st.budget) + ", " + dur,
      body: body
    };
  }

  /* ---------- the email pane ---------- */
  function emailPaneMarkup(mail){
    var h = '<div class="bl-mail">';
    h += '<p class="bl-mail-lead">This is the email that will be sent. Edit anything you like — ' +
         'what you see here is exactly what goes out.</p>';

    h += '<div class="bl-mail-fields">';
    h += '<label class="bl-mail-field"><span>Your email</span>' +
         '<input id="bl-mail-from" type="email" autocomplete="email" required ' +
         'placeholder="you@brand.co.uk"></label>';
    h += '<label class="bl-mail-field"><span>Name <em>(optional)</em></span>' +
         '<input id="bl-mail-name" type="text" autocomplete="name" placeholder="Alex"></label>';
    h += "</div>";

    h += '<label class="bl-mail-field bl-mail-field--wide"><span>To</span>' +
         '<input id="bl-mail-to" type="email" value="hello@loudooh.co.uk"></label>';
    h += '<label class="bl-mail-field bl-mail-field--wide"><span>Subject</span>' +
         '<input id="bl-mail-subject" type="text" value="' + esc(mail.subject) + '"></label>';
    h += '<label class="bl-mail-field bl-mail-field--wide"><span>Message</span>' +
         '<textarea id="bl-mail-body" rows="18" spellcheck="true">' + esc(mail.body) + '</textarea></label>';

    h += '<p class="bl-mail-stale" id="bl-mail-stale" hidden role="status">' +
         'The plan has changed since you edited this. ' +
         '<button type="button" class="bl-mail-relink" id="bl-mail-refresh">Rewrite it from the current plan</button>' +
         "</p>";

    h += '<p class="bl-mail-error" id="bl-mail-error" hidden role="alert"></p>';
    h += '<div class="bl-mail-acts">';
    h += '<button type="button" class="bl-btn bl-btn-primary" id="bl-mail-send">Send this plan</button>';
    h += '<button type="button" class="bl-btn bl-btn-ghost" id="bl-mail-copy">Copy the text</button>';
    h += '<button type="button" class="bl-btn bl-btn-ghost" id="bl-mail-pdf">Download PDF</button>';
    h += "</div>";
    h += '<p class="bl-mail-note">“Send” opens your own mail app with this message in it — nothing is sent ' +
         'from this page, and nothing is stored here. If your mail app trims a long message, use ' +
         '“Copy the text” or send the PDF instead.</p>';
    h += '<p class="bl-mail-done" id="bl-mail-done" hidden>Your mail app should be open with this message ' +
         'in it. If it didn’t open, copy the text or write to hello@loudooh.co.uk.</p>';
    h += "</div>";
    return h;
  }

  function fillEmail(force){
    var pane = el("bl-pane-email");
    var r = result();
    if(!pane || !r) return;
    var mail = emailFor(r);
    var sig = signature(r);

    if(!pane.firstChild){
      pane.innerHTML = emailPaneMarkup(mail);
      lastSignature = sig;
      wireEmail();
      return;
    }

    /* The plan changed. If the reader has written their own words, those are
       theirs to keep — say the text is out of date and offer to rewrite it,
       rather than deleting what they typed. */
    if(sig !== lastSignature || force){
      if(edited && !force){
        var stale = el("bl-mail-stale");
        if(stale) stale.hidden = false;
      } else {
        var subj = el("bl-mail-subject"), body = el("bl-mail-body");
        if(subj) subj.value = mail.subject;
        if(body) body.value = mail.body;
        edited = false;
        var st2 = el("bl-mail-stale");
        if(st2) st2.hidden = true;
      }
      lastSignature = sig;
    }
  }

  function wireEmail(){
    var subj = el("bl-mail-subject"), body = el("bl-mail-body");
    [subj, body].forEach(function(f){
      if(f) f.addEventListener("input", function(){ edited = true; });
    });

    var refresh = el("bl-mail-refresh");
    if(refresh) refresh.addEventListener("click", function(){
      edited = false;
      fillEmail(true);
      var b = el("bl-mail-body");
      if(b) b.focus();
    });

    var send = el("bl-mail-send");
    if(send) send.addEventListener("click", function(){
      var href = mailtoHref();
      if(!href) return;                       /* the error is already on screen */
      window.location.href = href;
      if(window.__BL_TRACK__) window.__BL_TRACK__("lead_cta_clicked", {source:"panel_email"});
      var done = el("bl-mail-done");
      if(done) done.hidden = false;
    });

    var copy = el("bl-mail-copy");
    if(copy) copy.addEventListener("click", function(){
      var text = "Subject: " + (el("bl-mail-subject").value || "") + "\n\n" +
                 (el("bl-mail-body").value || "");
      var done = function(ok){
        copy.textContent = ok ? "Copied" : "Select and copy";
        setTimeout(function(){ copy.textContent = "Copy the text"; }, 2200);
      };
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(function(){ done(true); }, function(){ fallback(); });
      } else { fallback(); }
      function fallback(){
        var b = el("bl-mail-body");
        if(b){ b.focus(); b.select(); }
        done(false);
      }
    });

    var pdf = el("bl-mail-pdf");
    if(pdf) pdf.addEventListener("click", downloadPdf);
  }

  /* The mailto the Send button will open, built from exactly what is on screen.
     Split out from the click handler so that what gets sent is inspectable —
     by a test, and by anyone reading this — rather than assembled inside an
     event and immediately navigated away from. Returns null and shows the
     error when the address is not usable. */
  function mailtoHref(){
    var fromEl = el("bl-mail-from");
    if(!fromEl) return null;
    var from = (fromEl.value || "").trim();
    var name = (el("bl-mail-name").value || "").trim();
    var err = el("bl-mail-error");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)){
      if(err){
        err.hidden = false;
        err.textContent = "Enter your email so a planner can reply to you.";
      }
      fromEl.focus();
      return null;
    }
    if(err) err.hidden = true;
    var to = (el("bl-mail-to").value || "hello@loudooh.co.uk").trim();
    var subject = el("bl-mail-subject").value || "";
    var text = (el("bl-mail-body").value || "") +
      "\n\n— " + (name ? name + " <" + from + ">" : from);
    return "mailto:" + encodeURIComponent(to) +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(text);
  }

  /* ---------- opening and closing ---------- *
     The panel is a right-hand drawer. On a desktop it does not dim or block
     the page: the controls are on the left and the plan is on the right, so
     you can move the budget and watch the plan answer. Narrow screens have no
     room for that, so there it covers the screen and takes a scrim. */
  var opener = null;                       /* what to give focus back to */

  function narrow(){ return window.innerWidth <= 900; }

  function isOpen(){
    var pan = el(PANEL);
    return !!pan && pan.classList.contains("is-open");
  }

  function open(trigger){
    var pan = el(PANEL);
    if(!pan || isOpen()) return;
    opener = trigger || document.activeElement;
    pan.hidden = false;
    var scrim = el("bl-drawer-scrim");
    if(scrim && narrow()) scrim.hidden = false;
    /* let the browser see the hidden->shown state before the transform runs */
    void pan.offsetWidth;
    pan.classList.add("is-open");
    if(scrim && narrow()) scrim.classList.add("is-open");
    if(narrow()) document.body.classList.add("bl-drawer-open");
    setExpanded(true);
    document.addEventListener("keydown", onKey, true);
    pan.setAttribute("tabindex", "-1");
    pan.focus({preventScroll:true});
    syncMeta();
    /* Opening it IS the moment the plan arrives, so this is where the reveal
       belongs — inside a container that is already on screen. */
    if(window.BLReveal && window.BLReveal.reveal && window.__BL_LAST_RESULT__){
      window.BLReveal.reveal(window.__BL_LAST_RESULT__, {force:true});
    }
    if(window.__BL_TRACK__) window.__BL_TRACK__("plan_panel_opened", {});
  }

  function close(){
    var pan = el(PANEL);
    if(!pan || !isOpen()) return;
    if(window.BLReveal && window.BLReveal.finish) window.BLReveal.finish();
    pan.classList.remove("is-open");
    var scrim = el("bl-drawer-scrim");
    if(scrim){ scrim.classList.remove("is-open"); }
    document.body.classList.remove("bl-drawer-open");
    setExpanded(false);
    document.removeEventListener("keydown", onKey, true);
    var done = function(){
      pan.hidden = true;
      if(scrim) scrim.hidden = true;
    };
    if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) done();
    else setTimeout(done, 280);
    if(opener && opener.focus) opener.focus();
    opener = null;
  }

  function setExpanded(on){
    document.querySelectorAll('[aria-controls="' + PANEL + '"]').forEach(function(b){
      b.setAttribute("aria-expanded", String(on));
    });
  }

  function onKey(e){
    if(e.key === "Escape" && isOpen()){
      e.stopPropagation();
      close();
    }
  }

  /* ---------- tabs ---------- */
  function showTab(which, byKeyboard){
    var isEmail = which === "email";
    var tp = el("bl-tab-plan"), te = el("bl-tab-email");
    var pp = el("bl-pane-plan"), pe = el("bl-pane-email");
    if(!tp || !te || !pp || !pe) return;
    if(isEmail) fillEmail(false);
    tp.classList.toggle("is-on", !isEmail);
    te.classList.toggle("is-on", isEmail);
    tp.setAttribute("aria-selected", String(!isEmail));
    te.setAttribute("aria-selected", String(isEmail));
    pp.hidden = isEmail;
    pe.hidden = !isEmail;
    /* Keyboard users need focus to follow the tab; a mouse click should not
       paint a focus ring around the whole pane. */
    if(byKeyboard) (isEmail ? pe : pp).focus({preventScroll:true});
  }

  /* ---------- the panel's one-line summary of itself ---------- */
  function syncMeta(){
    var m = el("bl-drawer-meta"), r = result();
    if(!m) return;
    var st = stateOf(r);
    /* Short enough to sit on one line beside the tabs and the download at
       every panel width. The plan itself states the duration and the site
       count a few lines further down; repeating them here only cost space. */
    m.textContent = gbp(st.budget) + " · " + placeLabel(st);
  }

  /* ---------- the PDF ---------- *
     Printed from the page itself rather than rebuilt in a PDF library: the
     print stylesheet lays out the plan already on screen, so the document can
     never drift from what was read. The email text is appended so the PDF is
     the whole handover in one file. */
  function downloadPdf(){
    var r = result();
    if(!r) return;
    var mail = {subject: "", body: ""};
    var subjEl = el("bl-mail-subject"), bodyEl = el("bl-mail-body");
    if(subjEl && bodyEl){
      mail.subject = subjEl.value; mail.body = bodyEl.value;   /* their edits, not the template */
    } else {
      mail = emailFor(r);
    }

    var host = el("bl-print");
    if(!host){
      host = document.createElement("section");
      host.id = "bl-print";
      host.setAttribute("aria-hidden", "true");
      document.body.appendChild(host);
    }
    var st = stateOf(r);
    host.innerHTML =
      '<h1 class="bl-print-title">Your OOH plan for ' + gbp(st.budget) + '</h1>' +
      '<p class="bl-print-sub">' + esc(placeLabel(st)) + ' · ' + esc(durationLabel(st.durationDays)) +
        ' · ex-VAT · built ' + new Date().toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"}) +
        '</p>' +
      '<h2 class="bl-print-h">The email that goes with this plan</h2>' +
      '<p class="bl-print-subject"><strong>Subject:</strong> ' + esc(mail.subject) + '</p>' +
      '<pre class="bl-print-mail">' + esc(mail.body) + '</pre>';

    document.body.classList.add("bl-printing");
    var restore = function(){
      document.body.classList.remove("bl-printing");
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(function(){
      window.print();
      /* Safari never fires afterprint in some versions. */
      setTimeout(restore, 1500);
    }, 60);
    if(window.__BL_TRACK__) window.__BL_TRACK__("plan_pdf", {budget: st.budget, geo: st.geo});
  }

  /* ---------- boot ---------- */
  function wire(){
    if(!el(PANEL)) return;
    var tp = el("bl-tab-plan"), te = el("bl-tab-email");
    /* detail === 0 means the click came from the keyboard (Enter/Space), not
       from a pointer — the standard way to tell them apart. */
    if(tp) tp.addEventListener("click", function(e){ showTab("plan", e.detail === 0); });
    if(te) te.addEventListener("click", function(e){ showTab("email", e.detail === 0); });

    var dl = el("bl-download-pdf");
    if(dl) dl.addEventListener("click", downloadPdf);

    var x = el("bl-drawer-close");
    if(x) x.addEventListener("click", close);

    var scrim = el("bl-drawer-scrim");
    if(scrim) scrim.addEventListener("click", close);

    /* Everything that opens the panel, in one place. */
    document.querySelectorAll('[aria-controls="' + PANEL + '"], [data-open-plan]').forEach(function(btn){
      btn.addEventListener("click", function(e){
        e.preventDefault();
        if(isOpen()) close(); else open(btn);
      });
    });

    /* Arrow keys across the tablist, as a tablist should behave. */
    var tabs = [tp, te].filter(Boolean);
    tabs.forEach(function (t, i){
      t.addEventListener("keydown", function(e){
        if(e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        var next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        next.click(); next.focus();
      });
    });

    syncMeta();
    if(window.BLState && window.BLState.subscribe){
      window.BLState.subscribe(function(){
        syncMeta();
        /* keep the email honest about the plan it describes */
        if(el("bl-pane-email") && el("bl-pane-email").firstChild) fillEmail(false);
      });
    }
  }

  window.BLPanel = {
    open: open,
    close: close,
    isOpen: isOpen,
    emailFor: emailFor,
    mailtoHref: mailtoHref,
    showTab: showTab,
    downloadPdf: downloadPdf,
    refreshEmail: function(){ fillEmail(true); },
    syncMeta: syncMeta
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
