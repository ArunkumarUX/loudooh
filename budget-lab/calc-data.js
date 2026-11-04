/* OOH Budget Lab — format catalogue.
   Prices: Loud! OOH Insights cards (2026). Where a card gives a range we use the
   middle figure (agreed with Jamie: London bus superside £300–£500 → £400).
   Where a card only gives "from £X", £X is used.
   Impressions: lower weekly estimate per unit from the Impacts and Impressions
   Data (carried in the Budget Lab master data as impactsWeekLow).
   Printing / production: per-unit planning figures from the same master data
   (printing = print, production = posting / installation). Digital = £0.

   unit: "2wk" | "1wk" | "4wk" | "day" | "once" — the period one price buys.
   price: { london, regional } or, for airports, { hub, mid, regional }.
   null price for a region = not bookable there online (contact us). */
window.LO_CALC = {
  updated: "Prices from Loud! OOH Insights, reviewed October 2026",

  categories: [
    { id: "billboards", name: "Billboards", img: "/images/homepage/billboard-night.webp", guide: "/insights/billboard-advertisingguide/",
      blurb: "Roadside 48-sheets, 96-sheets and digital screens across every major UK city." },
    { id: "underground", name: "London Underground", img: "/images/homepage/underground.webp", guide: "/insights/london-underground-advertising-costs-uk/",
      blurb: "Tube car panels, cross-tracks and escalator panels in front of millions of commuters." },
    { id: "bus", name: "Buses", img: "/images/homepage/bus.webp", guide: "/insights/bus-advertising-guide/",
      blurb: "Rears, supersides, T-sides and full wraps that move through city centres." },
    { id: "busstops", name: "Bus stops", img: "/images/pricing/Bus-Stop-Picture-.jpg", guide: "/insights/bus-advertising-guide/",
      blurb: "6-sheet posters and digital screens where people wait." },
    { id: "rail", name: "Rail", img: "/images/pricing/Rail-Train-Station-Advertising.png", guide: "/insights/ooh-advertising-guide-ai-crypto-fintech/",
      blurb: "Station posters, large formats and traincards." },
    { id: "airports", name: "Airports", img: "/images/homepage/airport.webp", guide: "/insights/airport-advertising-costs-uk/",
      blurb: "High-dwell screens and posters for business and leisure travellers." },
    { id: "taxis", name: "Taxis", img: "/images/homepage/taxi.webp", guide: "/insights/taxi/",
      blurb: "Liveries, supersides and tip seats across London and major cities." },
    { id: "advans", name: "Digital AdVans", img: "/images/homepage/advan.webp", guide: "/insights/advan-mobile-billboards/",
      blurb: "Mobile LED screens parked where your buyers are. Booked by the day." }
  ],

  /* Location lists. "london: true" uses London pricing; everything else regional. */
  cities: [
    { id: "london", name: "London", london: true },
    { id: "manchester", name: "Manchester" }, { id: "birmingham", name: "Birmingham" },
    { id: "leeds", name: "Leeds" }, { id: "glasgow", name: "Glasgow" },
    { id: "liverpool", name: "Liverpool" }, { id: "bristol", name: "Bristol" },
    { id: "edinburgh", name: "Edinburgh" }, { id: "newcastle", name: "Newcastle" },
    { id: "sheffield", name: "Sheffield" }, { id: "nottingham", name: "Nottingham" },
    { id: "uk", name: "Rest of UK" }
  ],
  airports: [
    { id: "heathrow", name: "Heathrow", tier: "hub" }, { id: "gatwick", name: "Gatwick", tier: "hub" },
    { id: "manchester-apt", name: "Manchester Airport", tier: "mid" }, { id: "stansted", name: "Stansted", tier: "mid" },
    { id: "birmingham-apt", name: "Birmingham Airport", tier: "mid" }, { id: "edinburgh-apt", name: "Edinburgh Airport", tier: "mid" },
    { id: "regional-apt", name: "Other regional airport", tier: "regional" }
  ],
  /* Cities where taxi formats are sold. */
  taxiCities: ["london", "manchester", "birmingham", "leeds", "glasgow", "liverpool", "bristol", "edinburgh", "newcastle"],

  audiences: [
    { id: "general", name: "Everyone", fits: [] },
    { id: "commuters", name: "Commuters", fits: ["underground", "rail", "busstops", "bus"] },
    { id: "drivers", name: "Drivers", fits: ["billboards", "bus"] },
    { id: "shoppers", name: "Shoppers", fits: ["busstops", "bus", "advans"] },
    { id: "business", name: "Business leaders", fits: ["airports", "taxis", "underground"] },
    { id: "travellers", name: "Travellers", fits: ["airports", "taxis", "rail"] },
    { id: "local", name: "Local area / event", fits: ["advans", "billboards", "busstops"] }
  ],

  formats: [
    /* Billboards — /insights/billboard-advertisingguide/ */
    { id: "bb-6s", cat: "billboards", name: "6-Sheet Static", unit: "2wk", per: "panel", price: { london: 650, regional: 450 }, impWk: 25000, print: 60, prod: 45, note: "Street-level panels, 1.2m × 1.8m." },
    { id: "bb-d6", cat: "billboards", name: "6-Sheet Digital", unit: "1wk", per: "screen", price: { london: 650, regional: 500 }, impWk: 30000, print: 0, prod: 0, note: "Digital screen, priced per week." },
    { id: "bb-48s", cat: "billboards", name: "48-Sheet Static", unit: "2wk", per: "panel", price: { london: 825, regional: 463 }, impWk: 75000, print: 150, prod: 150, img: "/images/homepage/intro-york-street-hq.webp", note: "The classic roadside billboard, 6m × 3m." },
    { id: "bb-d48", cat: "billboards", name: "48-Sheet Digital", unit: "2wk", per: "panel", price: { london: 1100, regional: 750 }, impWk: 75000, print: 0, prod: 0, note: "Roadside digital, share of loop." },
    { id: "bb-d96", cat: "billboards", name: "96-Sheet Digital", unit: "2wk", per: "panel", price: { london: 1500, regional: 1000 }, impWk: 120000, print: 0, prod: 0, img: "/images/hero/piccadilly-circus-dooh.jpg", note: "Large roadside digital, 12m × 3m." },
    { id: "bb-backlit", cat: "billboards", name: "Backlit / Illuminated", unit: "2wk", per: "panel", price: { london: 900, regional: 650 }, impWk: 60000, print: 300, prod: 150, note: "Lit 48 and 96-sheets, seen day and night." },

    /* London Underground — /insights/london-underground-advertising-costs-uk/ */
    { id: "lu-tcp", cat: "underground", name: "Tube Car Panels", unit: "2wk", per: "panel", price: { london: 10, regional: null }, impWk: 10000, print: 20, prod: 0, min: 558,
      img: "/images/pricing/London-Underground-Advertising.jpg", note: "Inside the carriage, sold as a line pack.", warn: "QR codes are not allowed on Tube car panels." },
    { id: "lu-esc", cat: "underground", name: "Escalator Panels", unit: "2wk", per: "panel", price: { london: 125, regional: null }, impWk: 20000, print: 65, prod: 45, img: "/images/homepage/oscar.webp", note: "Panels along the escalator run." },
    { id: "lu-4s", cat: "underground", name: "4-Sheet Platform Posters", unit: "2wk", per: "panel", price: { london: 300, regional: null }, impWk: 30000, print: 45, prod: 40, img: "/images/projects/london-underground-advertising.png", note: "Platform posters with long dwell time." },
    { id: "lu-d6", cat: "underground", name: "Digital 6-Sheet (D6)", unit: "2wk", per: "screen", price: { london: 1500, regional: null }, impWk: 40000, print: 0, prod: 0, img: "/images/hero-station.jpg", note: "Digital screens in ticket halls and corridors." },
    { id: "lu-16x", cat: "underground", name: "16-Sheet Cross-Track", unit: "2wk", per: "panel", price: { london: 1000, regional: null }, impWk: 50000, print: 120, prod: 60, img: "/images/projects/london-underground-advertising.png", note: "Across the tracks, facing waiting passengers." },
    { id: "lu-48x", cat: "underground", name: "48-Sheet Cross-Track", unit: "2wk", per: "panel", price: { london: 1500, regional: null }, impWk: 80000, print: 275, prod: 150, note: "The big cross-track format." },

    /* Buses — /insights/bus-advertising-guide/ */
    { id: "bus-rear", cat: "bus", name: "Bus Rears / Headliners", per: "bus", unit: { london: "1wk", regional: "2wk" }, price: { london: 400, regional: 75 }, impWk: 15000, print: 60, prod: 40, note: "Seen by drivers behind the bus." },
    { id: "bus-ss", cat: "bus", name: "Supersides", unit: "2wk", per: "bus", price: { london: 400, regional: 203 }, impWk: 20000, print: 90, prod: 50, min: { regional: 10 },
      note: "Street-level, pedestrians and traffic. Regional minimum around 10 buses." },
    { id: "bus-ts", cat: "bus", name: "T-Sides", unit: "2wk", per: "bus", price: { london: 700, regional: 375 }, impWk: 25000, print: 120, prod: 60, note: "Side and roof panel in a T shape." },
    { id: "bus-sl", cat: "bus", name: "Streetliners", unit: "2wk", per: "bus", price: { london: null, regional: 340 }, impWk: 15000, print: 100, prod: 60, note: "Suburban high streets. London on request." },
    { id: "bus-wrap", cat: "bus", name: "Full Bus Wraps", unit: "4wk", per: "bus", price: { london: 20000, regional: null }, impWk: 40000, print: 1250, prod: 900, note: "The whole bus. Regional wraps are sold annually: ask us." },

    /* Bus stops — /insights/bus-advertising-guide/ */
    { id: "bs-6s", cat: "busstops", name: "Bus Stop 6-Sheets", unit: "2wk", per: "panel", price: { london: 525, regional: 450 }, impWk: 25000, print: 60, prod: 45, note: "Posters for waiting passengers and pedestrians." },
    { id: "bs-d6", cat: "busstops", name: "Digital Bus Stop Screens (D6)", unit: "1wk", per: "screen", price: { london: 725, regional: 525 }, impWk: 30000, print: 0, prod: 0, note: "4,000+ digital screens UK-wide." },

    /* Rail — /insights/ooh-advertising-guide-ai-crypto-fintech/ (rail card) */
    { id: "rail-tc", cat: "rail", name: "Traincards", unit: "2wk", per: "card", price: { london: 75, regional: 75 }, impWk: 10000, print: 60, prod: 30, note: "Interior cards seen for the whole journey." },
    { id: "rail-poster", cat: "rail", name: "Station Posters", unit: "2wk", per: "panel", price: { london: 250, regional: 250 }, impWk: 30000, print: 65, prod: 45, note: "4 and 6-sheet posters on the platform and concourse." },
    { id: "rail-48", cat: "rail", name: "48-Sheet Station Large Format", unit: "2wk", per: "panel", price: { london: 3250, regional: null }, impWk: 60000, print: 275, prod: 150, note: "Large format at London termini. Regional on request." },

    /* Airports — /insights/airport-advertising-costs-uk/ */
    { id: "apt-6s", cat: "airports", name: "6-Sheet Static Posters", unit: "2wk", per: "panel", price: { hub: 1800, mid: 900, regional: 500 }, impWk: 25000, print: 120, prod: 70,
      img: "/images/airport-formats/airport-6-sheet-static-poster.webp", note: "Posters through terminals and walkways." },
    { id: "apt-d6", cat: "airports", name: "6-Sheet Digital Screens", unit: "1wk", per: "screen", price: { hub: 3200, mid: 1500, regional: 800 }, impWk: 30000, print: 0, prod: 0,
      img: "/images/airport-formats/airport-6-sheet-digital-screen.webp", note: "Digital screens in high-dwell areas." },
    { id: "apt-lfd", cat: "airports", name: "Large Format Digital", unit: "1wk", per: "screen", price: { hub: 7500, mid: 4000, regional: 2000 }, impWk: 80000, print: 0, prod: 0,
      img: "/images/airport-formats/airport-large-format-digital.webp", note: "The big screens travellers can't miss." },

    /* Taxis — /insights/taxi/ */
    { id: "taxi-ss", cat: "taxis", name: "Taxi Supersides", unit: "4wk", per: "cab", price: { london: 395, regional: 225 }, impWk: 15000, print: 90, prod: 55, min: { london: 50, regional: 25 },
      note: "Minimum fleet: 50 cabs in London, 25 regionally." },
    { id: "taxi-tip", cat: "taxis", name: "Tip Seat Panels", unit: "4wk", per: "cab", price: { london: 85, regional: 53 }, impWk: 3000, print: 45, prod: 0, note: "Interior panels facing the passenger." },
    { id: "taxi-wrap", cat: "taxis", name: "Full Livery Wraps", unit: "once", per: "cab", price: { london: 2750, regional: 850 }, impWk: 20000, print: 600, prod: 400, note: "The whole cab, priced per cab per campaign." },
    { id: "taxi-dooh", cat: "taxis", name: "DOOH Taxi Screens", unit: "1wk", per: "screen", price: { london: 25, regional: null }, impWk: 5000, print: 0, prod: 0, note: "In-cab screens. Regional by city on request." },

    /* Digital AdVans — /insights/advan-mobile-billboards/ */
    { id: "advan", cat: "advans", name: "Standard Digital AdVan", unit: "day", per: "van", price: { london: 695, regional: 595 }, impWk: 20000, print: 0, prod: 0, note: "20sqm LED screens. Priced per van per day." },
    { id: "advan-e", cat: "advans", name: "Electric Digital AdVan", unit: "day", per: "van", price: { london: 1500, regional: 1500 }, impWk: 20000, print: 0, prod: 0, note: "100% electric, priced per van per day." }
  ]
};
