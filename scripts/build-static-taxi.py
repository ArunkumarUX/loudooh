#!/usr/bin/env python3
"""Generate insights/taxi/index.html from taxi guide content."""

import html
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "insights", "taxi", "index.html")

TOC = [
    ("numbers", "The numbers that actually matter"),
    ("audience", "Who uses UK taxis?"),
    ("formats", "Every format explained"),
    ("ratecard", "The 2026 rate card"),
    ("budgets", "Campaigns by budget"),
    ("factors", "What moves the price"),
    ("effectiveness", "Does it actually work?"),
    ("cities", "Choosing the right city"),
    ("booking", "The booking process"),
    ("sme", "Is taxi right for an SME?"),
    ("tips", "Get more from your budget"),
    ("faq", "FAQs"),
]

STATS = [
    ("~14,500", "Licensed black cabs in London", "TfL licensed taxi data 2025"),
    ("3k–5k", "Exterior impressions per cab/day", "London city centre"),
    ("65–72%", "ABC1 share of black cab users", "Multiple industry sources"),
    ("15–20", "Fares per cab per day", "Licensed taxi operator data"),
    ("20+", "UK cities with taxi inventory", "Loud! OOH market coverage"),
]

AUDIENCES = [
    ("Exterior audience", "Volume audience · city at large", "3k–5k/day", "Pedestrians, drivers, and adjacent traffic in high-footfall zones. London averages 3,000–5,000 impressions per branded cab per day."),
    ("Interior audience", "Captive audience · in-journey dwell", "15–20 min", "Panels and screens in direct eyeline throughout the journey - no scrolling, no competing screen. Long enough for detail, QR codes, and direct response."),
    ("Who takes cabs", "ABC1 profile · professionals 25–55", "65–72%", "Professionals aged 25–55, travelling for business and leisure. Consistently more affluent than the population at large."),
]

FORMATS = [
    ("Supersides", "Exterior", "Large panel along the lower side body between the wheel arches - the format most people picture. Highest pavement and adjacent-vehicle visibility at fleet scale. Production: printed vinyl, priced separately.", [("London", "from £395 / cab / 4 wks"), ("Regional", "£175–£275 / cab / 4 wks"), ("Min. fleet", "50 London · 25 regional")], "Brand awareness, product launches, moving city-centre presence."),
    ("Full Livery Wraps", "Exterior", "Entire exterior covered in branded vinyl. Done well: social photography, press, earned reach. Done poorly: expensive production with mediocre return. Production typically £800–£1,400 per cab extra.", [("London", "from £2,750 / cab"), ("Regional", "from £850 / cab"), ("Unit", "Per cab / campaign")], "Major brand moments where the taxi is the creative canvas."),
    ("Tip Seat Panels", "Interior", "Fold-down tip seat panels facing the rear passenger. 15–20 minutes dwell. Highest recall rates of any taxi format - engagement quality, not impression volume.", [("London", "from £85 / cab / 4 wks"), ("Regional", "£40–£65 / cab / 4 wks"), ("Package", "Often with other interior formats")], "Detailed messaging, QR codes, apps, extended reading time."),
    ("Digital Tops", "Digital", "Roof-mounted digital display inventory with GPS and daypart options where available. A different sightline from side panels - visible above surrounding traffic.", [("London", "from £550 / unit"), ("Regional", "POA by city"), ("Availability", "Varies by operator")], "Brand name and logo where height and motion matter."),
    ("Branded Hire", "Activation", "Dedicated branded cab booked by the hour or day for events, activations, and PR-led city moments - not a fleet media buy.", [("London", "from £95 / hour"), ("Regional", "from £75 / hour"), ("Use", "Events · launches · PR")], "Short-burst visibility around a specific moment or venue."),
    ("Rear Panels", "Exterior", "Static panel on the cab rear - in the eyeline of following traffic at lights and in slow traffic. Usually booked alongside supersides rather than standalone.", [("Pricing", "On application"), ("Bundle", "Often add-on to supersides"), ("Best with", "Superside campaigns")], "Extending reach on an existing superside campaign, simple brand or URL messaging."),
    ("Partition & in-cab", "Interior / digital", "Partition panels, headrest cards, and in-cab screens sit in passenger eyeline for the full journey. Availability and packaging vary by city and operator - priced with the media plan.", [("Pricing", "On application"), ("Dwell", "15–20 min captive"), ("Formats", "Print + digital screens")], "Direct response, QR codes, video, and copy-led campaigns."),
]

RATE_CARD = [
    ("Superside panel", "from £395 / cab / 4 wks", "£175–£275 / cab / 4 wks", "50 / 25", "Primary exterior format. High street visibility."),
    ("Tip seats (interior)", "from £85 / cab / 4 wks", "£40–£65 / cab / 4 wks", "-", "Interior. 15–20 min passenger dwell."),
    ("Full livery wrap", "from £2,750 / cab", "from £850 / cab", "-", "Per cab / campaign. Production extra."),
    ("Digital tops", "from £550 / unit", "POA by city", "-", "Roof-mounted digital where available."),
    ("Branded hire", "from £95 / hour", "from £75 / hour", "-", "Events, activations, and PR moments."),
]

BUDGET_LEVELS = ["Entry", "Growth", "Scale", "Domination"]
BUDGETS = [
    ("Under £5,000", "Regional entry-point", "A small regional superside fleet for four weeks - genuine branded presence in Manchester, Birmingham, Edinburgh, or similar at the lower end of the rate card. London at this level is tip seats or a short branded-hire activation, not a meaningful exterior fleet."),
    ("£5k – £20k", "London entry or regional multi-format", "25-cab London superside for four weeks at the lower end (~£10k media). At the higher end: multi-format regional (supersides plus interior) or a larger regional fleet with meaningful city-centre footprint."),
    ("£20k – £60k", "Purposeful London or national fleet", "50–100-cab London superside over four to eight weeks. Or exterior plus interior on a smaller fleet. Or simultaneous London plus two or three regional cities. Full wraps start to enter the plan at this level."),
    ("£60k+", "Fleet dominance", "200–500-cab London campaigns, full-wrap fleet programmes, or multi-city simultaneous activity. At this scale the branded fleet becomes a visible part of the city landscape - full wraps reliably generate earned media."),
]

FACTOR_TAGS = ["Biggest lever", "Volume", "Package", "Timing", "Total cost"]
FACTORS = [
    ("City", "London commands a significant premium - typically 1.5 to 2× regional rates for equivalent formats. For brands whose audience is outside London, regional cities often deliver better value on a cost-per-relevant-impression basis."),
    ("Fleet size", "Larger fleet bookings attract volume discounts. A 200-cab campaign does not cost four times a 50-cab campaign. Discounts typically kick in at 100 cabs - committing to higher volume upfront consistently works out cheaper."),
    ("Format combination", "Interior and exterior formats are priced separately but packaged together in most serious campaigns. Bundling through a single operator almost always beats approaching different suppliers for different formats."),
    ("Campaign duration", "Four weeks is standard. Eight or twelve weeks reduce per-week cost. For sustained taxi presence, a longer commitment upfront is more economical than rolling short bookings."),
    ("Production costs", "Exterior vinyl print and fitting is additional. Superside vinyl: typically £80–£150 per cab. Full wrap: £800–£1,400 per cab. Always build production into the total budget at planning stage."),
]

EFFECTIVENESS = [
    ("Superside exterior", "Pedestrians, drivers, adjacent passengers", "2–5 sec", "Moderate", "No"),
    ("Full wrap exterior", "As above, higher visibility", "2–5 sec", "Moderate to high", "No"),
    ("Rear panel", "Following traffic, pedestrians", "30–60 sec at lights", "Moderate", "No"),
    ("Roof sign", "Pedestrians, drivers", "3–10 sec", "Low to moderate", "No"),
    ("Tip seat panel", "Cab passenger (interior)", "15–20 min", "High", "Yes (QR viable)"),
    ("Partition panel", "Cab passenger (interior)", "15–20 min", "High", "Yes"),
    ("In-cab screen", "Cab passenger (interior)", "15–20 min", "High", "Yes (interactive)"),
]

CITIES = [
    ("London", 14500, "City professionals, premium consumers, tourists", "National brand campaigns, premium positioning"),
    ("Manchester", 2100, "Northern business and consumer mix", "North of England reach, tech and media"),
    ("Birmingham", 1700, "Midlands business and leisure", "Midlands-focused campaigns, retail"),
    ("Glasgow", 1400, "Scottish urban consumers and professionals", "Scotland-wide reach, with Edinburgh"),
    ("Edinburgh", 1250, "Scottish professionals and tourists", "Premium Scottish audience, financial services"),
    ("Leeds", 1050, "Yorkshire business and consumer", "Yorkshire regional reach, retail & hospitality"),
    ("Liverpool", 900, "North-west leisure and consumer", "Supplementary north-west coverage"),
    ("Bristol", 750, "South-west professionals and leisure", "South-west ABC1 audience"),
    ("Newcastle", 680, "North-east business and leisure", "North-east regional campaigns"),
]

CITY_CHART_LABELS = {
    "London": "London",
    "Manchester": "Manchester",
    "Birmingham": "Birmingham",
    "Glasgow": "Glasgow",
    "Edinburgh": "Edinburgh",
    "Leeds": "Leeds",
    "Liverpool": "Liverpool",
    "Bristol": "Bristol",
    "Newcastle": "Newcastle",
}

TIP_TAGS = ["Dual audience", "Creative", "Direct response", "Duration", "Measurement"]
TIPS = [
    ("Combine exterior and interior on the same fleet", "One fleet cost, two distinct exposures: city-wide exterior reach and intimate interior passenger engagement. Running supersides without interior formats leaves the passenger opportunity on the table."),
    ("Design for both audiences explicitly", "Exterior needs brand and a single message in under three seconds. Interior formats, with 15–20 minutes of dwell, can carry copy, detail, and QR codes. Using the same artwork for both consistently underperforms."),
    ("Use interior formats for direct response", "Taxi interiors are one of the few outdoor formats where QR codes actually work. The passenger is holding a phone, has time, and the panel is at reading distance."),
    ("Commit to eight weeks rather than four", "Taxi advertising builds recognition through repeated exposure. Per-week cost reduction on eight weeks, combined with frequency uplift, consistently produces better brand recall than a shorter higher-spend burst."),
    ("Run alongside digital to capture interest", "Taxi advertising drives subsequent search and social behaviour. Running paid search alongside your taxi activity consistently improves measurable return - the taxi builds recognition, digital captures the intent."),
]

FAQS = [
    ("How much does taxi advertising cost in the UK?", 'Based on the Loud! OOH 2026 rate card, London superside taxi advertising starts from £395 per cab per four weeks. A realistic entry-level London campaign of 25 cabs costs around £9,875 in media, plus print production; 50 cabs from around £19,750. A full livery wrap starts from £2,750 per London cab (campaign rate) plus £800–£1,400 production per cab. Regional supersides run £175–£275 per cab per four weeks - a 25-cab regional campaign from around £4,375–£6,875 in media. Tip seats start from £85 in London and £40–£65 regionally. See full pricing on our <a href="../pricing/#taxi">2026 rate card</a>.'),
    ("How many cabs do I need for a meaningful campaign?", "In London, 50 cabs is typically the minimum for visible city-centre presence. Below 50 cabs, the fleet is too small to generate consistent impressions across the city's commercial zones. In regional cities, 25 cabs is a workable minimum. For major London campaigns, 100–200 cabs is where the format really delivers at scale."),
    ("How long does a taxi campaign take to set up?", "Allow three to four weeks from brief to fleet live for superside and rear panel campaigns. Full wraps need four to six weeks minimum. Interior formats can move slightly faster - typically two to three weeks from artwork approval. Brief at least five weeks ahead of a specific launch date."),
    ("Is the London black cab audience really more affluent?", "Yes, consistently. Research puts the ABC1 share of London black cab users at 65–72%, significantly above the London average and well above the national average. Higher fares and the professional contexts in which black cabs are most commonly used naturally select for higher-income users."),
    ("Can I target specific areas or routes within a city?", "To a degree. London fleet operators can bias cab selection towards specific zones - the City and Canary Wharf for financial district reach, or the West End for premium leisure. Licensed black cabs follow demand rather than fixed routes, so geographic targeting is directional rather than precise."),
    ("Superside vs full wrap - which should I choose?", "A superside is a printed panel on the side body; a full wrap covers the entire exterior. Supersides are significantly cheaper in media and production, allowing larger fleet sizes at a given budget. Full wraps are more visually dominant and more likely to generate social and press attention. For most campaigns, supersides at higher fleet volume outperform wraps at lower volume on cost-per-impression. Full wraps earn their premium when the creative justifies the investment."),
]

MAX_FLEET = 14500


def e(s):
    return html.escape(str(s))


def toc_html():
    return "\n        ".join(
        f'<a href="#{sid}" class="toc-link" data-section="{sid}">{e(label)}</a>'
        for sid, label in TOC
    )


def stat_cards_html():
    cards = []
    for v, l, s in STATS:
        cards.append(f"""<article class="stat-card">
          <p class="stat-card-value">{e(v)}</p>
          <p class="stat-card-label">{e(l)}</p>
          <p class="stat-card-note">{e(s)}</p>
        </article>""")
    return "\n        ".join(cards)


def audience_cards_html():
    cards = []
    for title, tag, meta, text in AUDIENCES:
        cards.append(f"""<article class="audience-card">
          <p class="audience-card-value">{e(meta)}</p>
          <h3 class="audience-card-title">{e(title)}</h3>
          <p class="audience-card-meta">{e(tag)}</p>
          <p class="audience-card-text">{e(text)}</p>
        </article>""")
    return "\n        ".join(cards)


def formats_html():
    cards = []
    accent_keys = {"London", "Production"}
    for name, tag, text, prices, best in FORMATS:
        price_rows = "\n            ".join(
            f'<div class="format-card-price-row"><span class="format-card-price-label">{e(k)}</span>'
            f'<span class="format-card-price-value{" format-card-price-value--accent" if k in accent_keys else ""}">{e(v)}</span></div>'
            for k, v in prices
        )
        cards.append(f"""<article class="format-card">
          <div class="format-card-body">
            <p class="format-card-tag">{e(tag)}</p>
            <h3 class="format-card-title">{e(name)}</h3>
            <p class="format-card-text">{e(text)}</p>
          </div>
          <div class="format-card-prices">
            {price_rows}
          </div>
          <div class="format-card-footer"><span class="format-card-footer-label">Best for</span><p>{e(best)}</p></div>
        </article>""")
    return "\n        ".join(cards)


def rate_rows_html():
    rows = []
    for fmt, lon, reg, fleet, note in RATE_CARD:
        rows.append(f"""<tr>
              <td class="cell-format">{e(fmt)}</td>
              <td class="cell-price-london">{e(lon)}</td>
              <td>{e(reg)}</td>
              <td>{e(fleet)}</td>
              <td class="cell-notes">{e(note)}</td>
            </tr>""")
    return "\n            ".join(rows)


def budgets_html():
    cards = []
    for i, (amount, title, text) in enumerate(BUDGETS):
        featured = " budget-tier--featured" if i == len(BUDGETS) - 1 else ""
        cards.append(f"""<article class="budget-tier{featured}">
          <div class="budget-tier-head">
            <p class="budget-tier-amount">{e(amount)}</p>
            <p class="budget-tier-level">{e(BUDGET_LEVELS[i])}</p>
          </div>
          <div class="budget-tier-body">
            <h3 class="budget-tier-type">{e(title)}</h3>
            <p class="budget-tier-text">{e(text)}</p>
          </div>
        </article>""")
    return "\n        ".join(cards)


def factors_html():
    items = []
    for i, (title, text) in enumerate(FACTORS):
        highlight = " factor-card--highlight" if title == "Campaign duration" else ""
        items.append(f"""<article class="factor-card{highlight}">
          <div class="factor-card-head">
            <span class="factor-card-num" aria-hidden="true">{i + 1:02d}</span>
            <p class="factor-card-tag">{e(FACTOR_TAGS[i])}</p>
          </div>
          <div class="factor-card-body">
            <h3 class="factor-card-title">{e(title)}</h3>
            <p class="factor-card-text">{e(text)}</p>
          </div>
        </article>""")
    return "\n        ".join(items)


def effectiveness_rows_html():
    rows = []
    for fmt, aud, exp, recall, dr in EFFECTIVENESS:
        rows.append(f"""<tr>
              <td class="cell-format">{e(fmt)}</td>
              <td>{e(aud)}</td>
              <td>{e(exp)}</td>
              <td>{e(recall)}</td>
              <td>{e(dr)}</td>
            </tr>""")
    return "\n            ".join(rows)


def city_chart_html():
    rows = []
    for name, fleet, aud, best in CITIES:
        label = CITY_CHART_LABELS.get(name, name)
        pct = fleet / MAX_FLEET * 100
        display = f"{fleet:,}" if fleet >= 1000 else str(fleet)
        rows.append(
            f'<div class="bar-row"><span class="bar-label">{e(label)}</span>'
            f'<div class="bar-track"><div class="bar-fill" style="width:{pct:.1f}%"></div></div>'
            f'<span class="bar-value">{display}</span></div>'
        )
    return "\n          ".join(rows)


def city_cards_html():
    cards = []
    for name, fleet, aud, best in CITIES:
        tier = "Premium" if name == "London" else "Regional"
        cards.append(f"""<article class="station-card">
          <h3 class="station-card-name">{e(name)}</h3>
          <p class="station-card-audience">{fleet:,} licensed taxis · {e(tier)} · {e(aud)}</p>
          <p class="station-card-best"><span class="station-card-label">Best for</span> {e(best)}</p>
        </article>""")
    return "\n        ".join(cards)


def tips_html():
    items = []
    for i, (title, text) in enumerate(TIPS):
        lead = " tip-card--lead" if i == 0 else ""
        items.append(f"""<article class="tip-card{lead}">
          <div class="tip-card-head">
            <span class="tip-card-num" aria-hidden="true">{i + 1:02d}</span>
            <p class="tip-card-tag">{e(TIP_TAGS[i])}</p>
          </div>
          <div class="tip-card-body">
            <h3 class="tip-card-title">{e(title)}</h3>
            <p class="tip-card-text">{e(text)}</p>
          </div>
        </article>""")
    return "\n        ".join(items)


def faqs_html():
    items = []
    for i, (q, a) in enumerate(FAQS):
        open_cls = " is-open" if i == 0 else ""
        items.append(f"""<div class="faq-item{open_cls}" data-faq="{i}">
            <button type="button" class="faq-question" aria-expanded="{'true' if i == 0 else 'false'}">
              {e(q)}
              <span class="faq-sign" aria-hidden="true">{'−' if i == 0 else '+'}</span>
            </button>
            <div class="faq-answer">{a}</div>
          </div>""")
    return "\n        ".join(items)


PAGE = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Taxi Advertising in the UK: What It Costs &amp; What Works | Loud! OOH</title>
  <meta name="description" content="The complete UK taxi advertising buyer's guide - real 2026 pricing, every format, city selection, and an honest answer on whether taxi fits your business.">
  <meta name="theme-color" content="#0E1E3C">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../css/styles.css?v=20260715">
</head>
<body>
  <div id="progress-bar" aria-hidden="true"><div id="progress-fill"></div></div>

  <a class="skip-link" href="#main-content">Skip to content</a>

  <header class="site-header" id="site-header">
    <div class="header-inner">
      <a href="../../" class="logo" aria-label="Loud! OOH home">
        <img src="../../images/loud-ooh-logo.png" alt="" class="logo-img" width="680" height="214" fetchpriority="high">
      </a>
      <button type="button" class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Open menu">
        <span class="nav-toggle-bar"></span>
        <span class="nav-toggle-bar"></span>
        <span class="nav-toggle-bar"></span>
      </button>
      <nav class="main-nav" id="main-nav" aria-label="Primary">
        <a href="../../" class="nav-link">Home</a>
        <a href="#" class="nav-link">Services</a>
        <a href="#" class="nav-link">Why <span class="nav-accent">Loud?</span></a>
        <a href="../pricing/" class="nav-link">Pricing</a>
        <a href="../" class="nav-link nav-active" aria-current="page">Insights</a>
        <a href="#cta" class="nav-link">Contact</a>
        <a href="#cta" class="nav-cta">Get in touch</a>
      </nav>
    </div>
  </header>

  <section class="hero" id="hero">
    <div class="hero-stage" aria-hidden="true">
      <img
        src="../../images/billboard-advertising-costs.jpeg"
        alt=""
        class="hero-stage-img"
        width="951"
        height="458"
        decoding="async"
        fetchpriority="high"
      >
      <div class="hero-stage-scrim"></div>
    </div>

    <div class="hero-shell">
      <div class="hero-content" id="main-content">
        <p class="hero-eyebrow">Insights · Buyer's Guide</p>
        <h1>Taxi advertising in the UK</h1>
        <p class="hero-lead">A real guide to what it costs, what works, and whether it is right for your business - real 2026 pricing, every format, no vague ranges, no call-us-to-find-out.</p>
        <a href="../pricing/#taxi" class="hero-btn hero-btn-primary">See taxi pricing</a>
      </div>
    </div>

    <div class="hero-metrics" aria-label="Key figures">
      <div class="hero-metrics-inner">
        <div class="hero-metric">
          <span class="hero-metric-value">14,500</span>
          <span class="hero-metric-label">London black cabs</span>
        </div>
        <div class="hero-metric">
          <span class="hero-metric-value">£395</span>
          <span class="hero-metric-label">Supersides from</span>
        </div>
        <div class="hero-metric">
          <span class="hero-metric-value">3k–5k</span>
          <span class="hero-metric-label">Daily impressions / cab</span>
        </div>
        <div class="hero-metric">
          <span class="hero-metric-value">65–72%</span>
          <span class="hero-metric-label">ABC1 passengers</span>
        </div>
      </div>
    </div>
  </section>

  <div class="body-grid" id="body-grid">
    <aside class="toc-aside" id="toc-aside">
      <div class="toc-label">On this page</div>
      <nav class="toc-nav">
        {toc_html()}
      </nav>
    </aside>

    <article class="article">
      <header class="guide-header">
        <p class="guide-meta">20 min read · Updated July 2026</p>
        <nav class="guide-jumps" aria-label="Quick jumps">
          <a href="#ratecard" class="guide-jump">Pricing</a>
          <a href="#formats" class="guide-jump">Formats</a>
          <a href="#budgets" class="guide-jump">Budget</a>
          <a href="#cities" class="guide-jump">Cities</a>
          <a href="#faq" class="guide-jump">FAQs</a>
        </nav>
      </header>

      <div class="intro">
        <p>Taxi advertising guides tend to follow a familiar pattern. They open with a line about moving billboards and captive audiences. They mention London black cabs. Then they direct you to a contact form. The actual numbers, the format detail, the honest assessment of when it works and when it does not, are nowhere to be found.</p>
        <blockquote class="pull-quote">Taxi advertising is a genuinely distinctive outdoor format when used correctly - and one that gets misunderstood more than most, usually because people think about it as a single product when it is actually several quite different ones.</blockquote>
        <p>I have planned and bought taxi advertising campaigns across UK cities for brands at very different budget levels. I know which formats perform, how pricing works in practice across different fleet sizes and cities, and what the common mistakes look like.</p>
        <p class="intro-lead">Every price below is from the Loud! OOH rate card, with no mark-up.</p>
        <p>This guide covers the UK taxi advertising market specifically - every format, real 2026 pricing, city selection and fleet sizing, and an honest view of what the format does well and where it falls short.</p>
        <blockquote class="pull-quote">No forms. No vague ranges. No call-us-to-find-out. Just the information you need to make the decision yourself.</blockquote>
      </div>

      <h2 id="numbers" class="section-heading">First, the numbers that actually matter</h2>
      <p class="section-lead">The UK licensed taxi market is dominated by London, with approximately <strong>14,500 licensed black cabs</strong> covering an estimated 80,000 miles per day across the capital - city centres, mainline stations, hotels, theatres, and both Heathrow and Gatwick. Outside London, fleets range from roughly <strong>2,100 licensed taxis in Manchester</strong> down to <strong>680 in Newcastle</strong>. A London cab averages <strong>15 to 20 fares per day</strong> and covers about <strong>150 miles</strong>. A 100-cab campaign delivers roughly <strong>300,000 to 500,000 exterior impressions daily</strong>.</p>
      <div class="stat-cards" aria-label="Key statistics">
        {stat_cards_html()}
      </div>
      <div class="key-insights" aria-label="Why dual audience matters">
        <p class="key-insights-lead">Two characteristics make taxi advertising genuinely distinctive as a medium.</p>
        <div class="key-insights-grid">
          <article class="key-insight">
            <p class="key-insight-stat">City-wide</p>
            <h3 class="key-insight-title">Exterior reach</h3>
            <p class="key-insight-text">Branded cabs move through the densest footfall zones - shopping streets, business districts, stations, hotels. Presence builds through continuous urban circulation, not a single fixed site.</p>
          </article>
          <article class="key-insight">
            <p class="key-insight-stat">15–20 min</p>
            <h3 class="key-insight-title">Interior dwell</h3>
            <p class="key-insight-text">The passenger is seated with panels or screens in eyeline - no scrolling, no competing screen. The highest-quality engagement in the taxi portfolio.</p>
          </article>
        </div>
        <p class="key-insights-note callout">Exterior branding reaches the city at large; interior formats reach the passenger directly. Plan both - not one format decision.</p>
      </div>
      <blockquote class="pull-quote">You are buying two distinct exposures simultaneously: city-scale exterior reach and intimate interior engagement with a high-income passenger.</blockquote>

      <h2 id="audience" class="section-heading">Who actually uses UK taxis? The audience question.</h2>
      <p class="section-lead">Taxi advertising has two audiences at once - the city at large and the captive passenger - plus a passenger profile that skews affluent. Understanding which formats reach which is fundamental to whether a campaign works.</p>
      <div class="audience-cards">
        {audience_cards_html()}
      </div>
      <div class="read-panels" aria-label="Route patterns">
        <article class="read-panel read-panel--wide">
          <h3 class="read-panel-title">Where cabs actually go</h3>
          <p>Exterior creative needs a single message readable in seconds; interior can carry copy, QR codes, and direct response across 15–20 minutes. Cabs cluster where demand is highest - London Zone 1–2, Manchester Spinningfields and MediaCityUK, Edinburgh Old and New Town.</p>
        </article>
      </div>
      <blockquote class="pull-quote">A taxi is not one audience. Plan exterior and interior as two distinct exposures - not a single format decision.</blockquote>

      <h2 id="formats" class="section-heading">Every format explained</h2>
      <p class="section-lead">Formats across exterior, interior, and digital - what each one is, what it costs, and who it works for. Rate card figures match the <a href="../pricing/#taxi">pricing page</a>. Media costs per cab per four weeks unless stated; VAT and production excluded.</p>
      <div class="formats-grid" aria-label="Taxi advertising formats">
        {formats_html()}
      </div>

      <h2 id="ratecard" class="section-heading">The 2026 rate card</h2>
      <p class="intro-lead">Media cost only, excluding VAT and production. Four-week periods - published openly, no mark-up.</p>
      <p class="section-lead">Sort, filter, and compare every format in the table below. For all UK OOH formats, see the <a href="../pricing/#taxi">complete 2026 pricing page</a>.</p>
      <div class="interactive-table" data-table-label="2026 Taxi Rate Card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Format</th><th>London from</th><th>Regional from</th><th>Min. fleet (Lon / reg)</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rate_rows_html()}
          </tbody>
        </table>
      </div>
      <div class="source-note">Media cost only, excl. VAT and production. Source: <a href="../pricing/#taxi">Loud! OOH 2026 Rate Card</a>.</div>

      <h2 id="budgets" class="section-heading">What a real campaign looks like at different budget levels</h2>
      <p class="section-lead">Individual cab prices only tell you so much. Here is what taxi advertising actually looks like across different total budgets - from regional entry to fleet dominance.</p>
      <div class="budget-tiers" aria-label="Campaigns by budget">
        {budgets_html()}
      </div>

      <h2 id="factors" class="section-heading">The factors that move the price</h2>
      <p class="section-lead">Five variables explain most of the difference between two otherwise similar campaigns.</p>
      <div class="factor-cards" aria-label="Pricing factors">
        {factors_html()}
      </div>
      <div class="callout"><strong>Production rule:</strong> Always build vinyl print and fitting into the total budget from the start. A superside panel typically costs £80–£150 per cab; a full wrap adds £800–£1,400 per cab on top of media.</div>

      <h2 id="effectiveness" class="section-heading">Does it work? The honest answer on effectiveness.</h2>
      <p class="section-lead">Taxi earns its place for premium urban presence and interior engagement with an affluent audience - best as part of a broader campaign, not the sole channel.</p>
      <div class="verdict-card">
        <span class="verdict-badge" aria-hidden="true">✓</span>
        <div>
          <h3>Yes - if you need premium urban presence and interior engagement</h3>
          <p>Interior formats deliver 70%+ recall in several industry studies. Exterior formats build brand presence in specific urban environments at a quality level static posters cannot replicate.</p>
        </div>
      </div>
      <div class="interactive-table" data-table-label="Format effectiveness">
        <table class="data-table">
          <thead>
            <tr>
              <th>Format</th><th>Primary audience</th><th>Avg exposure</th><th>Recall</th><th>Direct response?</th>
            </tr>
          </thead>
          <tbody>
            {effectiveness_rows_html()}
          </tbody>
        </table>
      </div>
      <div class="split-insight" aria-label="Strengths and limitations">
        <article class="split-insight-card split-insight-card--yes">
          <h3 class="split-insight-title">Where it's strongest</h3>
          <p>Interior formats deliver 70%+ recall in several studies - captive environment, close proximity, and genuine dwell. QR codes on tip seat panels have a realistic chance of direct response. Exterior builds premium urban presence at a quality static posters cannot replicate.</p>
        </article>
        <article class="split-insight-card split-insight-card--no">
          <h3 class="split-insight-title">What it doesn't do well</h3>
          <p>Taxi is not mass-reach like a national billboard campaign - 100 London cabs is meaningful city-centre presence, not millions reached simultaneously. Exterior needs simple, high-contrast creative readable in seconds. Works best combined with other channels.</p>
        </article>
      </div>
      <blockquote class="pull-quote">Taxi advertising rewards brands that invest in creative built specifically for the format - exterior for seconds, interior for minutes.</blockquote>

      <h2 id="cities" class="section-heading">Choosing the right UK city: a practical framework</h2>
      <p class="section-lead">Match the city to your audience - not just the largest fleet number.</p>
      <div class="framework-cards" aria-label="How to target by city">
        <article class="framework-card">
          <h3>London professionals</h3>
          <p>London is the strongest single market for taxi advertising - scale, commercial concentration, and ABC1 skew of black cab users. Essential for financial services, premium consumer, and media brands.</p>
        </article>
        <article class="framework-card">
          <h3>National at controlled budget</h3>
          <p>Simultaneous campaigns in Manchester, Birmingham, and Edinburgh provide meaningful coverage of three major conurbations at regional pricing - 200–300 cabs total at a cost that buys a modest London fleet alone.</p>
        </article>
        <article class="framework-card">
          <h3>Regional SME entry</h3>
          <p>25-cab superside campaigns in Manchester or Edinburgh can be planned from around £6,000–£9,000 total including production - genuinely accessible for city-specific businesses.</p>
        </article>
        <article class="framework-card">
          <h3>Zone biasing in London</h3>
          <p>Fleet operators can bias towards the City and Canary Wharf for financial district reach, or the West End for premium leisure - directional rather than precise, because cabs follow demand.</p>
        </article>
      </div>
      <div class="chart-panel" aria-label="Fleet size by city">
        <div class="chart-panel-header">
          <h3 class="chart-title">Licensed taxi fleets by city</h3>
          <p class="chart-subtitle">Approximate fleet sizes · major UK markets</p>
        </div>
        <div class="bar-chart">
          {city_chart_html()}
        </div>
      </div>
      <div class="station-cards" aria-label="City audience guide">
        {city_cards_html()}
      </div>
      <div class="source-note">Source: Local licensing authority data and industry estimates. London covers licensed black cabs; other cities cover licensed hackney carriages.</div>

      <h2 id="booking" class="section-heading">The booking process: what actually happens</h2>
      <p class="section-lead">Allow a minimum of <strong>three to four weeks</strong> from brief to live for superside and rear panel campaigns. Exterior vinyl print and fitting typically takes one to two weeks after artwork sign-off. Full wraps need four to six weeks. Interior print formats move faster - typically two to three weeks from artwork approval.</p>
      <div class="timeline" aria-label="Typical booking timeline">
        <div class="timeline-step">
          <span class="timeline-dot" aria-hidden="true"></span>
          <div>
            <strong>Week 1 - Brief &amp; fleet plan</strong>
            <p>City selection, format mix, fleet size, and rate confirmation.</p>
          </div>
        </div>
        <div class="timeline-step">
          <span class="timeline-dot" aria-hidden="true"></span>
          <div>
            <strong>Week 2 - Artwork</strong>
            <p>Creative sign-off, CAP compliance, and cab-model size specifications.</p>
          </div>
        </div>
        <div class="timeline-step">
          <span class="timeline-dot" aria-hidden="true"></span>
          <div>
            <strong>Weeks 3–4 - Production &amp; live</strong>
            <p>Vinyl print and fitting for exterior; interior installs can move faster.</p>
          </div>
        </div>
      </div>
      <div class="info-block">
        <p>The UK taxi market is served by national operators and city-specific fleet owners. Booking through an agency with established operator relationships gets you the right fleet selection without managing multiple suppliers across cities.</p>
        <div class="callout"><strong>Compliance:</strong> Artwork must comply with the <a href="https://www.asa.org.uk/codes-and-rulings/codes" rel="noopener noreferrer" target="_blank">CAP Code</a> and individual operator content policies. Submit for approval before print. Exterior size and bleed specs vary by cab model - confirm before artwork is finalised.</div>
      </div>

      <h2 id="sme" class="section-heading">Is taxi advertising right for an SME?</h2>
      <div class="callout"><strong>Straight answer:</strong> Taxi can work very well for smaller businesses with the right audience profile, particularly in regional cities where entry costs are manageable - a 25-cab superside in Manchester or Edinburgh typically lands between <strong>£6,000 and £9,000</strong> including production. London needs more commitment for meaningful scale, but it is not exclusively a large-brand format.</div>
      <div class="sme-grid">
        <article class="sme-card sme-yes">
          <h3 class="sme-title">When it makes sense</h3>
          <ul>
            <li>Your target audience is concentrated in a specific UK city and taxi users are part of that audience</li>
            <li>You want premium, moving presence in a city centre without a major billboard commitment</li>
            <li>You are targeting professional or high-income consumers for whom the black cab context reinforces positioning</li>
            <li>Your message has a direct response component that benefits from interior formats and passenger dwell time</li>
            <li>You are launching in a new city and want visible, talked-about brand presence</li>
          </ul>
        </article>
        <article class="sme-card sme-no">
          <h3 class="sme-title">When to think twice</h3>
          <ul>
            <li>Your audience is primarily suburban or rural rather than city-centre concentrated</li>
            <li>You need measurable, trackable direct response as the primary campaign metric</li>
            <li>Your creative budget is insufficient for work built specifically for the taxi format</li>
            <li>Your timeline is shorter than three to four weeks from brief to live</li>
            <li>You expect taxi advertising alone to carry awareness without supporting digital or broader OOH</li>
          </ul>
        </article>
      </div>

      <h2 id="tips" class="section-heading">How to get more from your taxi advertising budget</h2>
      <blockquote class="pull-quote">Combine exterior and interior formats on the same fleet. One fleet cost, two distinct audience exposures.</blockquote>
      <p class="section-lead">Five planning moves that consistently improve what a taxi budget delivers.</p>
      <div class="tip-cards" aria-label="Budget tips">
        {tips_html()}
      </div>

      <h2 id="faq" class="section-heading">Frequently asked questions</h2>
      <div class="faq-list">
        {faqs_html()}
      </div>

      <h2 class="section-heading">Final thoughts</h2>
      <p>Taxi advertising earns its place in UK outdoor. The dual audience - exterior city presence plus intimate interior passenger engagement - is genuinely distinctive. The premium urban context, particularly in London, reinforces brand positioning in a way a suburban roadside poster cannot.</p>
      <div class="callout">The brands that get the most from taxi design for both audiences explicitly, commit to a fleet size that generates real presence, and run long enough for frequency to build - as part of a broader campaign, not a standalone channel.</div>
      <blockquote class="pull-quote">Does your audience use taxis in the city you're targeting? If they do, taxi advertising can reach them with a quality and intimacy that almost no other outdoor format matches.</blockquote>
      <p>At Loud! OOH we plan and buy taxi advertising for SMEs and challenger brands across the UK. We publish pricing openly and do not mark up media costs. See our <a href="../pricing/#taxi">2026 rate card</a> or contact <a href="mailto:hello@loudooh.co.uk">hello@loudooh.co.uk</a> / <a href="tel:+442045149147">020 4514 9147</a>.</p>

      <div class="source-note" style="margin-top:2rem;">
        <strong>Sources referenced in this article</strong>
        <ol style="margin:0.75rem 0 0;padding-left:1.25rem;">
          <li><a href="https://tfl.gov.uk/info-for/taxis-and-private-hire/licensing" rel="noopener noreferrer" target="_blank">Transport for London: Licensed Taxi and Private Hire Data 2025</a></li>
          <li>Local Government Licensing Authority data: major UK cities</li>
          <li><a href="https://www.asa.org.uk/codes-and-rulings/codes" rel="noopener noreferrer" target="_blank">Committees of Advertising Practice (CAP): CAP Code</a></li>
          <li>Taxi advertising effectiveness research: industry compiled data</li>
          <li><a href="https://tfl.gov.uk/modes/taxis-and-minicabs/" rel="noopener noreferrer" target="_blank">TfL: Journey time and fare data, London licensed taxis</a></li>
          <li><a href="../pricing/#taxi">Loud! OOH: UK OOH Pricing Page (primary pricing source)</a></li>
        </ol>
      </div>
    </article>
  </div>

  <section id="cta" class="cta">
    <div class="cta-inner">
      <div class="cta-label">Plan your campaign</div>
      <h2>See exactly what your taxi campaign will cost</h2>
      <p>We plan and buy taxi advertising for SMEs and challenger brands across the UK. Open pricing, no media mark-up - you know what you're committing to before you commit to anything.</p>
      <div class="cta-buttons">
        <a href="../pricing/#taxi" class="btn-primary">See the full rate card</a>
        <a href="mailto:hello@loudooh.co.uk" class="btn-secondary">Talk to a planner</a>
      </div>
      <div class="cta-contact"><a href="mailto:hello@loudooh.co.uk">hello@loudooh.co.uk</a> &nbsp;·&nbsp; <a href="tel:+442045149147">020 4514 9147</a> &nbsp;·&nbsp; <a href="../pricing/#taxi">loudooh.co.uk/pricing</a></div>
    </div>
  </section>

  <section class="related">
    <div class="related-header">
      <h2>Keep reading</h2>
      <a href="../">All insights →</a>
      <a href="../pricing/#taxi">Full pricing →</a>
    </div>
    <div class="related-grid">
      <a href="../../" style="display:flex;flex-direction:column;border:1px solid #E6E9F0;background:#fff;color:inherit;transition:border-color .15s;">
          <div style="height:120px;background:#0E1E3C;position:relative;overflow:hidden;">
            <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(135deg,rgba(255,74,0,0.16) 0 12px,transparent 12px 24px);"></div>
          </div>
          <div style="padding:20px 22px;">
            <div style="font-family:'Inter',sans-serif;font-weight:800;font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:#FF4A00;margin-bottom:10px;">Buyer&#x27;s Guide</div>
            <div style="font-family:'Inter',sans-serif;font-weight:800;font-size:18px;line-height:1.22;color:#0E1E3C;margin-bottom:14px;">Rail Advertising in the UK</div>
            <div style="font-size:12.5px;color:#8b96a9;">20 min read</div>
          </div>
        </a>
      <a href="../pricing/#taxi" style="display:flex;flex-direction:column;border:1px solid #E6E9F0;background:#fff;color:inherit;transition:border-color .15s;">
          <div style="height:120px;background:#0E1E3C;position:relative;overflow:hidden;">
            <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(135deg,rgba(255,74,0,0.16) 0 12px,transparent 12px 24px);"></div>
          </div>
          <div style="padding:20px 22px;">
            <div style="font-family:'Inter',sans-serif;font-weight:800;font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:#FF4A00;margin-bottom:10px;">Pricing</div>
            <div style="font-family:'Inter',sans-serif;font-weight:800;font-size:18px;line-height:1.22;color:#0E1E3C;margin-bottom:14px;">UK OOH Pricing 2026</div>
            <div style="font-size:12.5px;color:#8b96a9;">All formats · open rate card</div>
          </div>
        </a>
      <a href="../" style="display:flex;flex-direction:column;border:1px solid #E6E9F0;background:#fff;color:inherit;transition:border-color .15s;">
          <div style="height:120px;background:#0E1E3C;position:relative;overflow:hidden;">
            <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(135deg,rgba(255,74,0,0.16) 0 12px,transparent 12px 24px);"></div>
          </div>
          <div style="padding:20px 22px;">
            <div style="font-family:'Inter',sans-serif;font-weight:800;font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:#FF4A00;margin-bottom:10px;">Insights</div>
            <div style="font-family:'Inter',sans-serif;font-weight:800;font-size:18px;line-height:1.22;color:#0E1E3C;margin-bottom:14px;">All UK OOH buyer guides</div>
            <div style="font-size:12.5px;color:#8b96a9;">Rail · Taxi · Pricing</div>
          </div>
        </a>
    </div>
  </section>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-logo">
        <img src="../../images/loud-ooh-logo.png" alt="" class="logo-img logo-img--footer" width="680" height="214">
      </div>
      <div>© 2026 Loud! OOH &nbsp;·&nbsp; UK out-of-home planning &amp; buying &nbsp;·&nbsp; Bigger. Bolder. Louder.</div>
    </div>
  </footer>

  <nav class="mobile-jump" id="mobile-jump" aria-label="Jump to section">
    <a href="../pricing/#taxi" class="mobile-jump-link">Pricing</a>
    <a href="#ratecard" class="mobile-jump-link" data-section="ratecard">Rate card</a>
    <a href="#formats" class="mobile-jump-link" data-section="formats">Formats</a>
    <a href="#budgets" class="mobile-jump-link" data-section="budgets">Budget</a>
    <a href="#cities" class="mobile-jump-link" data-section="cities">Cities</a>
    <a href="#sme" class="mobile-jump-link" data-section="sme">SME?</a>
    <a href="#faq" class="mobile-jump-link" data-section="faq">FAQs</a>
  </nav>

  <button type="button" id="back-to-top" aria-label="Back to top">↑</button>

  <script src="../../js/insight.js?v=20260715"></script>
  <script src="../../js/header.js?v=20260715"></script>
  <script src="../../js/tables.js?v=20260715"></script>
  <script src="../../js/guide.js?v=20260715"></script>
  <script src="../../js/app.js?v=20260715"></script>
</body>
</html>
"""


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(PAGE)
    print("Generated", OUT)


if __name__ == "__main__":
    main()
