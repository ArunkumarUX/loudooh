/* Loud! homepage. Static content first; optional motion and planning preview. */
(() => {
  "use strict";
  const root = document.documentElement;
  const header = document.getElementById("site-header");
  const hero = document.querySelector(".hero");
  const stage = document.querySelector(".hero-stage");
  const finale = document.getElementById("lo-final-cta");
  const orange = document.querySelector(".takeover-orange");
  const photo = document.querySelector(".takeover-photo");
  const motionButton = document.querySelector(".motion-toggle");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  let paused = false;
  let tier = "optimised";
  let scheduled = false;
  try {
    paused = sessionStorage.getItem("loud-motion-paused") === "true";
  } catch (_) {}
  function applyMotionPreference() {
    root.classList.toggle("motion-paused", paused || reduced.matches);
    motionButton.setAttribute(
      "aria-pressed",
      String(paused || reduced.matches),
    );
    motionButton.innerHTML =
      paused || reduced.matches
        ? 'Motion paused <span aria-hidden="true">▷</span>'
        : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
    motionButton.disabled = reduced.matches;
    motionButton.title = reduced.matches
      ? "Reduced motion is enabled in your device settings"
      : "Pause or resume cinematic motion";
    updateScroll();
  }
  motionButton.addEventListener("click", () => {
    paused = !paused;
    try {
      sessionStorage.setItem("loud-motion-paused", String(paused));
    } catch (_) {}
    applyMotionPreference();
  });
  reduced.addEventListener("change", applyMotionPreference);
  // Capability preference plus a short frame-time sample; width is not the tier signal.
  if (
    connection?.saveData ||
    /(^|-)2g$/.test(connection?.effectiveType || "") ||
    (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
  ) {
    tier = "lightweight";
  } else if (!reduced.matches) {
    const frames = [];
    let previous;
    const sample = (now) => {
      if (previous) frames.push(now - previous);
      previous = now;
      if (frames.length < 12) requestAnimationFrame(sample);
      else {
        frames.sort((a, b) => a - b);
        tier = frames[8] < 22 ? "full" : "optimised";
        root.dataset.renderTier = tier;
        scheduleScroll();
      }
    };
    requestAnimationFrame(sample);
  }
  root.dataset.renderTier = tier;
  function updateScroll() {
    scheduled = false;
    const heroHeight = hero.offsetHeight;
    const bounds = finale.getBoundingClientRect();
    header.classList.toggle("scrolled", scrollY > 35);
    if (paused || reduced.matches || tier === "lightweight") {
      stage.style.transform = "";
      orange.style.clipPath = "";
      photo.style.transform = "";
      return;
    }
    if (scrollY < heroHeight) {
      const progress = Math.min(1, scrollY / heroHeight);
      const strength = tier === "full" ? 0.075 : 0.025;
      stage.style.transform = `scale(${1 + progress * strength}) translateY(${progress * 26}px)`;
    }
    if (bounds.top < innerHeight && bounds.bottom > 0) {
      const progress = Math.min(
        1,
        Math.max(0, (innerHeight - bounds.top) / (innerHeight * 0.8)),
      );
      orange.style.clipPath = `inset(0 ${(1 - progress) * 40}% 0 0)`;
      photo.style.transform = `scale(${1.08 - progress * 0.08})`;
    }
  }
  function scheduleScroll() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateScroll);
    }
  }
  addEventListener("scroll", scheduleScroll, { passive: true });
  addEventListener("resize", scheduleScroll, { passive: true });
  applyMotionPreference();

  // Native dialog supplies focus containment, inert background and Escape support.
  const menu = document.getElementById("mobile-nav");
  const menuToggle = document.querySelector(".menu-toggle");
  function closeMenu() {
    menu.close();
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.focus({ preventScroll: true });
  }
  menuToggle.addEventListener("click", () => {
    menu.showModal();
    menuToggle.setAttribute("aria-expanded", "true");
  });
  menu.querySelector(".menu-close").addEventListener("click", closeMenu);
  menu.addEventListener("close", () =>
    menuToggle.setAttribute("aria-expanded", "false"),
  );
  menu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      menu.close();
      menuToggle.setAttribute("aria-expanded", "false");
    }),
  );
  const desktop = matchMedia("(min-width:851px)");
  desktop.addEventListener("change", (event) => {
    if (event.matches && menu.open) closeMenu();
  });

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectTab(index, focus = false) {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      panel.hidden = !selected;
      panel.classList.toggle("is-entering", selected);
    });
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(index));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft")
        next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectTab(next, true);
      }
    });
  });

  // Preview uses the same source file as the existing planner. No invented rates.
  const slider = document.getElementById("campaign-budget");
  const region = document.getElementById("campaign-region");
  const output = document.getElementById("budget-output");
  const results = document.getElementById("budget-results");
  const money = (value) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(value);
  let rates;
  const formatSpecs = [
    {
      category: "Roadside",
      format: "Static 48-Sheet",
      title: "Static billboards",
      unit: "panels",
      icon: "▭",
    },
    {
      category: "Roadside",
      format: "Digital 48-Sheet",
      title: "Digital billboards",
      unit: "screens",
      icon: "▣",
    },
    {
      category: "Bus",
      format: "Superside",
      title: "Bus supersides",
      unit: "buses",
      icon: "↔",
    },
  ];
  function renderBudget() {
    const budget = Number(slider.value);
    output.value = money(budget);
    slider.setAttribute("aria-valuetext", money(budget));
    const percentage =
      ((budget - Number(slider.min)) /
        (Number(slider.max) - Number(slider.min))) *
      100;
    slider.style.background = `linear-gradient(to right,var(--orange) ${percentage}%,#dfe3e9 ${percentage}%)`;
    const enquiry = document.getElementById("budget-discuss");
    if (enquiry)
      enquiry.href =
        "mailto:hello@loudooh.co.uk?subject=" +
        encodeURIComponent(`OOH campaign: ${money(budget)} media budget`) +
        "&body=" +
        encodeURIComponent(
          `Hello Loud! OOH,\n\nI would like to explore a campaign with a ${money(budget)} media budget in ${region.options[region.selectedIndex].text}.\n\nMy audience:\nMy preferred dates:\nMy campaign goal:\n`,
        );
    if (!rates) return;
    results.replaceChildren();
    for (const spec of formatSpecs) {
      const row = rates.find(
        (r) =>
          r.Category === spec.category &&
          r.Format === spec.format &&
          r["Market/Region"] === region.value,
      );
      const typical = Number(row?.["Planning Typical £"]);
      if (!row || !Number.isFinite(typical) || typical <= 0) continue;
      const quantity = Math.floor(budget / typical);
      const item = document.createElement("div");
      item.className = "budget-result";
      const icon = document.createElement("span");
      icon.className = "result-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = spec.icon;
      const copy = document.createElement("div");
      const title = document.createElement("p");
      title.className = "result-title";
      title.textContent = spec.title;
      const basis = document.createElement("p");
      basis.textContent = `${money(typical)} ${row["Buying Unit"]} · typical`;
      copy.append(title, basis);
      const number = document.createElement("strong");
      number.textContent = `≈ ${quantity}`;
      const label = document.createElement("small");
      label.textContent = `${spec.unit} / 2 weeks`;
      number.append(label);
      item.append(icon, copy, number);
      results.append(item);
    }
  }
  slider.addEventListener("input", renderBudget);
  region.addEventListener("change", renderBudget);
  renderBudget();
  const loading = document.createElement("p");
  loading.className = "budget-placeholder";
  loading.textContent = "Loading planning benchmarks…";
  results.replaceChildren(loading);
  results.setAttribute("aria-busy", "true");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  fetch("/budget-lab/data/master-data-v1.json", { signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error("Rates unavailable");
      return response.json();
    })
    .then((data) => {
      rates = data["Format Rate Benchmarks"];
      if (
        !Array.isArray(rates) ||
        !formatSpecs.every((spec) =>
          ["Regional", "London"].every((place) =>
            rates.some(
              (r) =>
                r.Category === spec.category &&
                r.Format === spec.format &&
                r["Market/Region"] === place &&
                Number(r["Planning Typical £"]) > 0,
            ),
          ),
        )
      )
        throw new Error("Incomplete rates");
      renderBudget();
    })
    .catch(() => {
      rates = null;
      results.replaceChildren();
      const error = document.createElement("p");
      error.className = "budget-error";
      error.textContent =
        "We couldn’t load the estimates. You can still explore our published rate cards or contact the team about your budget.";
      const link = document.createElement("a");
      link.href = "/insights/pricing/";
      link.textContent = "View published rates ↗";
      link.className = "text-link ink";
      results.append(error, link);
    })
    .finally(() => {
      clearTimeout(timeout);
      results.removeAttribute("aria-busy");
    });

  // Use the existing analytics dataLayer only when supplied by the host site.
  document.querySelectorAll("a.button, a.header-cta").forEach((link) =>
    link.addEventListener("click", () => {
      if (Array.isArray(window.dataLayer))
        window.dataLayer.push({
          event: "loud_cta_click",
          cta_text: link.textContent.trim(),
          destination: link.getAttribute("href"),
          page_path: location.pathname,
        });
    }),
  );
})();
