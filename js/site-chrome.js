(function () {
  if (document.querySelector(".lo-amenu")) return;

  var path = (location.pathname || "/").replace(/\/+$/, "") || "/";
  var onLab = path.indexOf("/budget-lab") === 0;
  var onInsights = path.indexOf("/insights") === 0;
  var onPricing = path.indexOf("/insights/pricing") === 0;
  var onHome = path === "/";
  var onAbout = path.indexOf("/about") === 0;
  var ctaHref = onLab ? "#planner" : "/budget-lab/";
  var ctaLabel = onLab ? "Start my plan" : "Open Budget Lab";
  var SITE_ORIGIN = "https://www.loudooh.co.uk";

  var chevron = '<svg class="lo-amenu-chevron" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var services = [
    { title: "Billboard Advertising", desc: "48-sheet and 96-sheet roadside dominance.", href: "https://www.loudooh.co.uk/services/billboard-advertising/" },
    { title: "Programmatic DOOH", desc: "Real-time digital buying across premium screens.", href: "https://www.loudooh.co.uk/services/programmatic-dooh/" },
    { title: "London Underground", desc: "Cross-track and gallery Tube campaigns.", href: "https://www.loudooh.co.uk/services/london-underground/" },
    { title: "Airport Advertising", desc: "Heathrow, Gatwick and high-value travellers.", href: "https://www.loudooh.co.uk/services/airport-advertising/" },
    { title: "Digital AdVans", desc: "Mobile LED for events, openings and launches.", href: "https://www.loudooh.co.uk/services/digital-advans/" },
    { title: "Taxi Advertising", desc: "London black cab wraps and roaming presence.", href: "https://www.loudooh.co.uk/services/taxi-advertising/" }
  ];

  function ddPanel() {
    var html = '<div class="lo-amenu-dropdown"><div class="lo-amenu-dropdown-inner"><p class="lo-amenu-dd-eyebrow">Our services</p>';
    services.forEach(function (it) {
      html += '<a class="lo-amenu-dd-item" href="' + it.href + '"><p class="lo-amenu-dd-title">' + it.title + '</p><p class="lo-amenu-dd-desc">' + it.desc + '</p></a>';
    });
    return html + "</div></div>";
  }

  function linkClass(active) {
    return active ? ' class="lo-amenu-link is-current" aria-current="page"' : ' class="lo-amenu-link"';
  }

  function mobileClass(active) {
    return active ? ' class="lo-amenu-mobile-link is-current" aria-current="page"' : ' class="lo-amenu-mobile-link"';
  }

  var navHtml =
    '<div class="lo-amenu lo-on-light">' +
      '<div class="lo-amenu-row">' +
        '<a class="lo-amenu-logo" href="/"><img class="lo-amenu-logo-img" src="/images/loud-ooh-logo.png" alt="Loud! OOH" width="680" height="214"></a>' +
        '<ul class="lo-amenu-links">' +
          '<li class="lo-amenu-item"><a' + linkClass(onHome) + ' href="/">Home</a></li>' +
          '<li class="lo-amenu-item" data-has-dropdown="1"><a class="lo-amenu-link" href="/#services">Services ' + chevron + "</a>" + ddPanel() + "</li>" +
          '<li class="lo-amenu-item"><a class="lo-amenu-link" href="/#lo-difference">Why Loud?</a></li>' +
          '<li class="lo-amenu-item"><a' + linkClass(onPricing) + ' href="/insights/pricing/">Pricing</a></li>' +
          '<li class="lo-amenu-item"><a' + linkClass(onLab) + ' href="/budget-lab/">Budget Lab</a></li>' +
          '<li class="lo-amenu-item"><a' + linkClass(onInsights && !onPricing) + ' href="/insights/">Insights</a></li>' +
          '<li class="lo-amenu-item"><a class="lo-amenu-link" href="/#lo-footer">Contact</a></li>' +
        "</ul>" +
        '<a class="lo-amenu-cta" href="' + ctaHref + '" data-lo-track="enquiry_start">' + ctaLabel + "</a>" +
        '<button type="button" class="lo-amenu-toggle" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
      "</div>" +
    "</div>" +
    '<div class="lo-amenu-mobile">' +
      '<ul class="lo-amenu-mobile-list">' +
        '<li><a' + mobileClass(onHome) + ' href="/">Home</a></li>' +
        '<li><a class="lo-amenu-mobile-link" href="/#services" data-mobile-toggle="1">Services ' + chevron + "</a>" +
          '<ul class="lo-amenu-mobile-sub">' + services.map(function (s) { return "<li><a href=\"" + s.href + "\">" + s.title + "</a></li>"; }).join("") + "</ul>" +
        "</li>" +
        '<li><a class="lo-amenu-mobile-link" href="/#lo-difference">Why Loud?</a></li>' +
        '<li><a' + mobileClass(onPricing) + ' href="/insights/pricing/">Pricing</a></li>' +
        '<li><a' + mobileClass(onLab) + ' href="/budget-lab/">Budget Lab</a></li>' +
        '<li><a' + mobileClass(onInsights && !onPricing) + ' href="/insights/">Insights</a></li>' +
        '<li><a class="lo-amenu-mobile-link" href="/#lo-footer">Contact</a></li>' +
        '<li><a class="lo-amenu-mobile-link" href="' + ctaHref + '">' + ctaLabel + "</a></li>" +
      "</ul>" +
    "</div>";

  var footerHtml =
    '<footer class="lo-footer" id="lo-footer">' +
      '<div class="lo-footer-top">' +
        '<div class="lo-footer-brand">' +
          '<a class="lo-footer-logo" href="/"><img src="/images/loud-ooh-logo.png" alt="Loud! OOH"></a>' +
          '<div class="lo-footer-pills"><span class="lo-footer-pill">Bigger.</span><span class="lo-footer-pill">Bolder.</span><span class="lo-footer-pill">Louder.</span></div>' +
          '<p class="lo-footer-bio">UK Out-of-Home Media Buyer &amp; Planner. Zero Fluff. Direct Results. Let\'s make your brand <strong>Loud!</strong></p>' +
          '<p class="lo-footer-legal" style="margin-top:-.5rem">3rd Floor, 86-90 Paul Street, London, EC2A 4NE</p>' +
          '<p class="lo-footer-legal">Loud! OOH Ltd is registered in England &amp; Wales under company number 17092553.<br>VAT Registration Number: 518 5397 63.</p>' +
          '<div class="lo-footer-flag" aria-hidden="true"><svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg"><clipPath id="lo-uk-chrome"><rect width="60" height="30"/></clipPath><g clip-path="url(#lo-uk-chrome)"><path fill="#012169" d="M0 0h60v30H0z"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" stroke="#C8102E" stroke-width="2"/><path fill="#fff" d="M25 0h10v30H25zM0 10h60v10H0z"/><path fill="#C8102E" d="M27 0h6v30h-6zM0 12h60v6H0z"/></g></svg></div>' +
        "</div>" +
        '<div class="lo-footer-links-wrap">' +
          '<p class="lo-footer-links-title">Site Links</p>' +
          '<div class="lo-footer-rule"></div>' +
          '<div class="lo-footer-cols">' +
            '<div class="lo-footer-col">' +
              '<p class="lo-footer-col-title">Services</p>' +
              '<a href="https://www.loudooh.co.uk/services/billboard-advertising/">Billboard</a>' +
              '<a href="https://www.loudooh.co.uk/services/programmatic-dooh/">Programmatic DOOH</a>' +
              '<a href="https://www.loudooh.co.uk/services/london-underground/">London Underground</a>' +
              '<a href="https://www.loudooh.co.uk/services/airport-advertising/">Airport</a>' +
              '<a href="https://www.loudooh.co.uk/services/digital-advans/">AdVans</a>' +
            "</div>" +
            '<div class="lo-footer-col">' +
              '<p class="lo-footer-col-title">Company</p>' +
              '<a href="/#lo-difference">Why <span class="loud">Loud!</span></a>' +
              '<a href="/budget-lab/">Budget Lab</a>' +
              '<a href="/insights/">Insights</a>' +
              '<a href="/#lo-footer">Contact</a>' +
            "</div>" +
            '<div class="lo-footer-col">' +
              '<p class="lo-footer-col-title">Contact Us</p>' +
              '<div class="lo-footer-contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg><a href="mailto:hello@loudooh.co.uk">hello@loudooh.co.uk</a></div>' +
              '<div class="lo-footer-contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2.1z"/></svg><a href="tel:+442083233978">020 8323 3978</a></div>' +
              '<div class="lo-footer-contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg><span>London Office — 3rd Floor, London, EC2A 4NE</span></div>' +
              '<div class="lo-footer-contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg><span>Leeds Office — International House, 14 King Street, Leeds, LS1 2HL</span></div>' +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="lo-footer-bottom">' +
        '<p>© 2026 <strong>Loud!</strong> OOH Ltd. All rights reserved.</p>' +
        '<div class="lo-footer-bottom-links">' +
          '<a href="https://www.loudooh.co.uk/privacy-policy/">Privacy Policy</a>' +
          '<a href="https://www.loudooh.co.uk/terms/">Terms &amp; Conditions</a>' +
          '<a href="https://www.loudooh.co.uk/cookie-policy/">Cookie Policy</a>' +
        "</div>" +
        '<div class="lo-footer-socials">' +
          '<a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">LinkedIn</a>' +
          '<a href="https://x.com/" target="_blank" rel="noopener noreferrer">X</a>' +
          '<a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">Facebook</a>' +
          '<a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a>' +
        "</div>" +
      "</div>" +
    "</footer>";

  function pageTitle() {
    var h1 = document.querySelector(".hero h1, .pricing-title, main h1, article h1, #main-content h1");
    if (h1) {
      var text = (h1.textContent || "").replace(/\s+/g, " ").trim();
      if (text) return text;
    }
    return (document.title || "Page").split("|")[0].replace(/\s+/g, " ").trim();
  }

  function slugToTitle(slug) {
    return slug.replace(/-/g, " ").replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
  }

  function buildBreadcrumbTrail() {
    if (onHome) return null;

    var crumbs = [{ href: "/", label: "Home" }];

    if (onLab) {
      crumbs.push({ label: "Budget Lab", current: true, path: "/budget-lab/" });
      return crumbs;
    }

    if (onPricing) {
      crumbs.push({ label: "Pricing", current: true, path: "/insights/pricing/" });
      return crumbs;
    }

    if (onInsights) {
      crumbs.push({ href: "/insights/", label: "Insights", path: "/insights/" });
      var tail = path.replace(/^\/insights\/?/, "").replace(/\/index\.html$/, "");
      if (!tail) {
        crumbs[crumbs.length - 1].current = true;
        delete crumbs[crumbs.length - 1].href;
        return crumbs;
      }
      crumbs.push({ label: pageTitle(), current: true, path: location.pathname || path });
      return crumbs;
    }

    if (onAbout) {
      var aboutTail = path.replace(/^\/about\/?/, "");
      if (aboutTail === "jamie-roberts") {
        crumbs.push({ label: "Jamie Roberts", current: true, path: "/about/jamie-roberts/" });
      } else if (aboutTail) {
        crumbs.push({ href: "/about/jamie-roberts/", label: "About", path: "/about/jamie-roberts/" });
        crumbs.push({ label: pageTitle() || slugToTitle(aboutTail), current: true, path: path + "/" });
      } else {
        crumbs.push({ label: "About", current: true, path: "/about/" });
      }
      return crumbs;
    }

    var parts = path.split("/").filter(Boolean);
    if (!parts.length) return null;

    var built = "/";
    parts.forEach(function (part, index) {
      built += part + "/";
      var isLast = index === parts.length - 1;
      var entry = { label: slugToTitle(part), path: built };
      if (!isLast) entry.href = built;
      else entry.current = true;
      crumbs.push(entry);
    });

    if (crumbs.length > 1 && crumbs[crumbs.length - 1].current) {
      crumbs[crumbs.length - 1].label = pageTitle();
    }

    return crumbs;
  }

  function breadcrumbHasSchema() {
    var found = false;
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (node) {
      if (found) return;
      try {
        var data = JSON.parse(node.textContent || "");
        if (data["@type"] === "BreadcrumbList") found = true;
        if (Array.isArray(data["@graph"])) {
          data["@graph"].forEach(function (item) {
            if (item && item["@type"] === "BreadcrumbList") found = true;
          });
        }
      } catch (err) {
        /* ignore malformed JSON-LD */
      }
    });
    return found;
  }

  function injectBreadcrumbSchema(crumbs) {
    if (!crumbs || !crumbs.length || breadcrumbHasSchema()) return;

    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-lo-breadcrumb", "1");
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map(function (crumb, index) {
        var item = {
          "@type": "ListItem",
          position: index + 1,
          name: crumb.label
        };
        var url = crumb.path || crumb.href;
        if (url) item.item = SITE_ORIGIN + (url.indexOf("/") === 0 ? url : "/" + url);
        return item;
      })
    });
    document.head.appendChild(script);
  }

  function renderBreadcrumb(crumbs) {
    var nav = document.createElement("nav");
    nav.className = "lo-breadcrumb";
    nav.setAttribute("aria-label", "Breadcrumb");

    var list = document.createElement("ol");
    list.className = "lo-breadcrumb-list";

    crumbs.forEach(function (crumb, index) {
      if (index) {
        var sep = document.createElement("li");
        sep.className = "lo-breadcrumb-sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = "/";
        list.appendChild(sep);
      }

      var item = document.createElement("li");
      if (crumb.current) {
        item.className = "lo-breadcrumb-current";
        item.setAttribute("aria-current", "page");
        item.textContent = crumb.label;
      } else {
        var link = document.createElement("a");
        link.href = crumb.href;
        link.textContent = crumb.label;
        item.appendChild(link);
      }
      list.appendChild(item);
    });

    nav.appendChild(list);
    return nav;
  }

  function mountBreadcrumb(nav) {
    if (document.querySelector(".lo-breadcrumb")) return;

    var targets = [
      ".bl-ref-lab-wrap",
      ".pricing-hero-inner",
      ".hero-content",
      ".insights-hub-inner",
      "article.article",
      "main#main-content",
      "main"
    ];

    for (var i = 0; i < targets.length; i += 1) {
      var host = document.querySelector(targets[i]);
      if (!host) continue;
      if (host.closest(".hero, .pricing-hero")) nav.classList.add("lo-breadcrumb--inverse");
      host.insertBefore(nav, host.firstChild);
      return;
    }

    var menu = document.querySelector(".lo-amenu");
    if (menu && menu.parentNode) {
      menu.parentNode.insertBefore(nav, menu.nextSibling);
    }
  }

  function installBreadcrumbs() {
    var crumbs = buildBreadcrumbTrail();
    if (!crumbs || crumbs.length < 2) return;
    injectBreadcrumbSchema(crumbs);
    mountBreadcrumb(renderBreadcrumb(crumbs));
  }

  function boot() {
    document.documentElement.classList.add("lo-chrome");
    if (!onLab && !document.querySelector(".insights-hub, .hero, .pricing-hero")) {
      document.body.classList.add("lo-chrome-pad");
    }

    var wrap = document.createElement("div");
    wrap.innerHTML = navHtml;
    document.body.insertBefore(wrap, document.body.firstChild);

    var oldFoot = document.querySelector(".lo-footer") || document.querySelector(".site-footer") || document.querySelector(".bl-foot");
    var footWrap = document.createElement("div");
    footWrap.innerHTML = footerHtml;
    if (oldFoot) oldFoot.replaceWith(footWrap.firstElementChild);
    else document.body.appendChild(footWrap.firstElementChild);

    var menu = document.querySelector(".lo-amenu");
    var mobile = document.querySelector(".lo-amenu-mobile");

    function syncMenu() {
      if (!menu) return;
      var scrolled = (window.scrollY || document.documentElement.scrollTop || 0) > 12;
      var open = !!document.querySelector(".lo-amenu-item.is-open") || !!(mobile && mobile.classList.contains("is-open"));
      menu.classList.toggle("is-scrolled", scrolled);
      menu.classList.toggle("is-open", open);
    }

    syncMenu();
    window.addEventListener("scroll", syncMenu, { passive: true });
    window.addEventListener("resize", syncMenu);

    document.querySelectorAll(".lo-amenu-item[data-has-dropdown]").forEach(function (item) {
      item.addEventListener("mouseenter", function () {
        item.classList.add("is-open");
        syncMenu();
      });
      item.addEventListener("mouseleave", function () {
        item.classList.remove("is-open");
        syncMenu();
      });
    });

    var toggle = document.querySelector(".lo-amenu-toggle");
    if (toggle && mobile) {
      toggle.addEventListener("click", function () {
        var open = mobile.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.style.overflow = open ? "hidden" : "";
        syncMenu();
      });
      mobile.addEventListener("click", function (e) {
        var a = e.target.closest("a");
        if (!a || a.getAttribute("data-mobile-toggle")) return;
        mobile.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        syncMenu();
      });
    }

    var mobileToggle = document.querySelector("[data-mobile-toggle]");
    if (mobileToggle && mobileToggle.nextElementSibling) {
      mobileToggle.addEventListener("click", function (e) {
        e.preventDefault();
        mobileToggle.nextElementSibling.classList.toggle("is-open");
      });
    }

    installBreadcrumbs();
  }

  function loadSmoothExperience() {
    if (window.__LO_SMOOTH_INIT__) return;
    if (document.querySelector('script[src*="smooth-experience.js"]')) return;
    var js = document.createElement("script");
    js.src = "/js/smooth-experience.js?v=1";
    js.defer = true;
    document.body.appendChild(js);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      boot();
      loadSmoothExperience();
    });
  } else {
    boot();
    loadSmoothExperience();
  }
})();
