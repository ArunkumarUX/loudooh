/* bl-pdf.js — download plan as PDF without window.print (safe in embedded browsers) */
(function () {
  "use strict";

  var JSPDF_SRC = "vendor/jspdf.umd.min.js";
  var H2C_SRC = "vendor/html2canvas.min.js";
  var pending = {};

  function loadScript(src) {
    if (pending[src]) return pending[src];
    pending[src] = new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        reject(new Error("Could not load " + src));
      };
      document.head.appendChild(s);
    });
    return pending[src];
  }

  function ensurePdfLibs() {
    if (window.jspdf && window.jspdf.jsPDF && typeof html2canvas === "function") {
      return Promise.resolve();
    }
    return loadScript(JSPDF_SRC).then(function () {
      return loadScript(H2C_SRC);
    });
  }

  var REMOVE_SEL = [
    "button",
    ".bl-act-cta",
    ".bl-act-apply",
    ".bl-act-cancel",
    ".bl-act-prev",
    ".bl-sum-alt",
    ".bl-sum-foot",
    ".bl-sum-send",
    ".bl-rev",
    'input[type="checkbox"]',
  ].join(",");

  var DEDUPE_SEL = [
    "#bl-ai-verdict",
    ".bl-ai-verdict",
    ".bl-ai",
    ".bl-sum-head",
    ".bl-sum-stats",
  ].join(",");

  function cleanPlanClone(node, opts) {
    if (!node) return null;
    var clone = node.cloneNode(true);
    clone.querySelectorAll(REMOVE_SEL).forEach(function (el) {
      el.remove();
    });
    if (opts && opts.coverHtml) {
      clone.querySelectorAll(DEDUPE_SEL).forEach(function (el) {
        el.remove();
      });
    }
    return clone;
  }

  function savePdfBlob(pdf, filename) {
    var blob = pdf.output("blob");
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      if (a.parentNode) a.parentNode.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  }

  function paginateImagePdf(pdf, canvas) {
    var margin = 10;
    var pageW = pdf.internal.pageSize.getWidth();
    var pageH = pdf.internal.pageSize.getHeight();
    var imgW = pageW - margin * 2;
    var imgH = (canvas.height * imgW) / canvas.width;
    var imgData = canvas.toDataURL("image/jpeg", 0.9);
    var usableH = pageH - margin * 2;
    var offset = 0;
    var first = true;

    while (offset < imgH) {
      if (!first) pdf.addPage();
      first = false;
      pdf.addImage(imgData, "JPEG", margin, margin - offset, imgW, imgH);
      offset += usableH;
    }
  }

  function textToPdf(text, filename) {
    var jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) throw new Error("jsPDF unavailable");
    var pdf = new jsPDF({ unit: "mm", format: "a4" });
    var lines = pdf.splitTextToSize(String(text || ""), 180);
    var y = 18;
    var pageH = pdf.internal.pageSize.getHeight();

    pdf.setFontSize(10);
    lines.forEach(function (line) {
      if (y > pageH - 15) {
        pdf.addPage();
        y = 18;
      }
      pdf.text(line, 15, y);
      y += 5;
    });
    savePdfBlob(pdf, filename);
  }

  function renderVisualPdf(opts) {
    var jsPDF = window.jspdf.jsPDF;
    var pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    var container = document.createElement("div");
    container.className = "bl-pdf-export";
    container.setAttribute("aria-hidden", "true");
    container.style.cssText =
      "position:fixed;left:-12000px;top:0;width:760px;padding:32px 36px;background:#fff;color:#0a1f3d;z-index:-1;pointer-events:none;";

    if (opts.coverHtml) {
      var cover = document.createElement("div");
      cover.className = "bl-pdf-cover";
      cover.innerHTML = opts.coverHtml;
      container.appendChild(cover);
    }

    var planClone = cleanPlanClone(opts.planElement, opts);
    if (planClone) {
      var planWrap = document.createElement("div");
      planWrap.className = "bl-pdf-plan";
      planWrap.appendChild(planClone);
      container.appendChild(planWrap);
    }

    if (opts.appendixHtml) {
      var appendix = document.createElement("div");
      appendix.className = "bl-pdf-appendix";
      appendix.innerHTML = opts.appendixHtml;
      container.appendChild(appendix);
    }

    document.body.appendChild(container);

    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    })
      .then(function () {
        return html2canvas(container, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 760,
        });
      })
      .then(function (canvas) {
        document.body.removeChild(container);
        paginateImagePdf(pdf, canvas);
        savePdfBlob(pdf, opts.filename);
      })
      .catch(function (err) {
        if (container.parentNode) document.body.removeChild(container);
        throw err;
      });
  }

  window.blGeneratePlanPdf = function (opts) {
    opts = opts || {};
    var filename = opts.filename || "loudooh-plan.pdf";
    var fallbackText = opts.fallbackText || "";

    return ensurePdfLibs()
      .then(function () {
        return renderVisualPdf({
          coverHtml: opts.coverHtml,
          planElement: opts.planElement,
          appendixHtml: opts.appendixHtml,
          filename: filename,
        });
      })
      .catch(function (err) {
        if (!fallbackText) throw err;
        return ensurePdfLibs().then(function () {
          textToPdf(fallbackText, filename);
        });
      });
  };
})();
