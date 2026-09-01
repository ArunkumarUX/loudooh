(function () {
  var LOGOS = [
    { alt: "Samsung", src: "../images/clients/samsung.svg", w: 100 },
    { alt: "Coca-Cola", src: "../images/clients/coca-cola.svg", w: 110 },
    { alt: "Tesco", src: "../images/clients/tesco.svg", w: 72 },
    { alt: "JD", src: "../images/clients/jd.svg", w: 56 },
    { alt: "NHS", src: "../images/clients/nhs.svg", w: 56 },
    { alt: "boohoo", src: "../images/clients/boohoo.svg", w: 88 },
    { alt: "Sainsbury's", src: "../images/clients/sainsburys.svg", w: 110 }
  ];

  function boot() {
    var row = document.getElementById("bl-lab-trust-logos");
    if (!row || row.dataset.ready === "1") return;
    row.dataset.ready = "1";
    row.innerHTML = LOGOS.map(function (L) {
      return (
        '<img alt="' +
        L.alt +
        '" loading="lazy" width="' +
        L.w +
        '" height="32" decoding="async" src="' +
        L.src +
        '">'
      );
    }).join("");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
