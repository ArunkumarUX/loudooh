#!/usr/bin/env python3
"""Generate static HTML + vanilla JS from the DC template data."""

import html
import json
import os

OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TOC = [
    ("numbers", "The numbers that actually matter"),
    ("audience", "Who uses UK rail?"),
    ("formats", "Every format explained"),
    ("ratecard", "The 2026 rate card"),
    ("budgets", "Campaigns by budget"),
    ("factors", "What moves the price"),
    ("effectiveness", "Does it actually work?"),
    ("stations", "Choosing the right stations"),
    ("booking", "The booking process"),
    ("sme", "Is rail right for an SME?"),
    ("tips", "Get more from your budget"),
    ("faq", "FAQs"),
]

STATS = [
    ("1.7bn", "UK rail journeys a year", "ORR, year to Mar 2025"),
    ("80.4m", "Busiest station: Liverpool St", "entries & exits, 2024-25"),
    ("55–70%", "Prompted ad recall", "among regular station users"),
    ("1,000+", "Stations with ad inventory", "media owner network coverage"),
    ("~60%", "Journeys via London stations", "ORR regional usage data"),
]

AUDIENCES = [
    ("Commuters", "The frequency audience", "Travel the same stations at the same times every working day, so a campaign builds frequency automatically. Disproportionately professional and ABC1, concentrated on routes into London and major business centres. Peak 7–9:30am and 4:30–7pm on weekdays."),
    ("Business travellers", "The intercity audience", "Professionals travelling to meetings and client visits, concentrated at the major termini and on primary intercity corridors. Longer dwell than commuters - a Euston–Manchester traveller typically spends 20–30 minutes in the station before departure."),
    ("Leisure travellers", "The weekend audience", "Weekends and holidays shift stations towards families, day-trippers, event-goers and tourists. This audience dwells longer, moves slower and engages more with retail and food. A genuinely different audience from the weekday commuter flow."),
]

FORMATS = [
    ("6-Sheet Posters", "Print", "The workhorse format. Backlit panels on platforms, in ticket halls and at entrances - passengers waiting for a train are directly in front of them with nothing else demanding attention. Present at 1,000+ UK stations.", [("Regional", "£250–£750 / panel"), ("Major regional", "from £500 / panel"), ("London termini", "£750–£1,500 / panel")], "Frequency campaigns against commuters; local business targeting."),
    ("Digital 6-Sheets (D6)", "Digital", "The digital equivalent on station screen networks. Ads rotate on a timed loop with daypart targeting, no print cost, and creative changeable remotely mid-campaign. The fastest-growing segment of rail inventory.", [("Regional", "£450–£1,200 / wk"), ("Major regional", "from £800 / wk"), ("London termini", "£1,200–£2,200 / wk")], "Targeting specific commuter windows; brands needing creative flexibility."),
    ("48 & 96-Sheet Billboards", "Print", "Large format on station approaches, alongside tracks at platform ends, and on exterior walls. Trackside 48-sheets are seen from arriving and departing trains too, adding an on-train audience. Often surprisingly good value regionally.", [("Regional", "£750–£2,000 / panel"), ("Major regional", "from £1,500 / panel"), ("London termini", "£2,000–£4,500 / panel")], "Brand awareness at scale; creative that benefits from a large canvas."),
    ("Large Format Digital", "Digital", "The premium station format. Full-motion screens above concourses, facing departure boards. When 500 people are staring at the boards, the screen beside them has their attention by default - among the most valuable OOH sites in the country.", [("Regional", "POA"), ("Major regional", "POA"), ("London termini", "POA")], "High-impact brand campaigns, launches, motion-led creative."),
    ("Concourse & Experiential", "Experiential", "Floor-standing sites on main concourses for product displays, sampling and pop-ups. The larger termini have designated experiential zones with power and footfall in the tens of thousands daily. Puts your brand in the path of the audience.", [("Regional", "POA"), ("Major regional", "POA"), ("London termini", "POA")], "Product sampling, launches, brands that benefit from interaction."),
    ("Station Takeovers", "Domination", "Complete brand presence across a station: every panel, every screen, often wraps on barriers, floors and architecture. Takeovers at the major London termini generate press and social coverage in their own right.", [("Regional", "from £2,500 / station"), ("Major regional", "from £8,000 / station"), ("London termini", "from £15,000 / station")], "Major launches and brand moments; saturating a catchment."),
    ("Traincards (interior)", "Print", "Printed panels inside carriages, above windows and seats. Commuters sit facing them for a 30–45 minute journey, so traincards support longer copy and direct-response mechanics like QR codes. Sold in fleet packages.", [("Regional", "£75–£150 / panel"), ("London / premium", "from £150 / panel"), ("Typical fleet", "500–2,000 panels")], "Detailed messaging, recruitment, financial services, direct response."),
    ("Train Exterior Wraps", "Domination", "Full or partial branding on the outside of trains - the train becomes a moving campaign across its whole route, seen at every station it calls at and every platform it passes. High production cost, priced on application.", [("Regional", "POA"), ("Major regional", "POA"), ("London termini", "POA")], "Major brand campaigns, tourism bodies, route-level partnerships."),
]

RATE_CARD = [
    ("4/6-sheet station posters", "£250–£750 / panel", "from £500 / panel", "£750–£1,500 / panel", "Widest availability, 1,000+ stations"),
    ("Digital 6-sheet (D6)", "£450–£1,200 / wk", "from £800 / wk", "£1,200–£2,200 / wk", "Daypart targeting available"),
    ("48-sheet station large format", "£750–£2,000 / panel", "from £1,500 / panel", "£2,000–£4,500 / panel", "Includes trackside sites"),
    ("Traincards (interior)", "£75–£150 / panel", "from £100 / panel", "from £150 / panel", "Sold in fleet packages"),
    ("Station domination / takeover", "from £2,500", "from £8,000", "from £15,000", "Major termini · longer lead times"),
    ("Large format digital", "POA", "POA", "POA", "Premium concourse positions"),
    ("Concourse experiential", "POA", "POA", "POA", "Staffing & build additional"),
    ("Train exterior wrap", "POA", "POA", "POA", "Production significant, 12+ weeks"),
]

BUDGET_LEVELS = ["Entry", "Growth", "Scale", "Domination"]

BUDGETS = [
    ("Under £5,000", "Single-station local presence", "A handful of 6-sheet panels at a regional or local station, or a short D6 rotation at a major regional station. Genuinely useful for local businesses: your customers see you every day at the station they commute through, for two to four weeks. Local stations remain one of the most underpriced formats in UK outdoor."),
    ("£5k – £20k", "Meaningful station presence", "Multiple formats at a major regional station, a strong panel package at a London terminus, or traincards across part of a commuter fleet. A £12,000–£15,000 mix of concourse D6s and platform 6-sheets at Leeds or Manchester Piccadilly builds serious frequency with that city's commuters over a month."),
    ("£20k – £60k", "Multi-station or premium terminus", "Coordinated campaigns across a commuter corridor, premium large-format digital at a London terminus, or traincards across a full fleet. At this level you can own the journey - home station, in-carriage dwell, and terminus panel - frequency almost no other OOH environment can replicate."),
    ("£60k+", "Headline channel territory", "Station takeovers at major termini, multi-city campaigns, or train livery partnerships. Rail becomes a headline channel - takeovers at the London termini reliably earn press and social coverage on top of the paid audience."),
]

FACTOR_TAGS = ["Biggest lever", "Placement", "Timing", "Frequency", "Total cost"]

FACTORS = [
    ("Station footfall tier", "The dominant variable. A 6-sheet at Liverpool Street costs roughly four times the same panel at a mid-sized regional station, reflecting the difference in daily audience. But cost per thousand impressions often favours the regional stations, because their pricing falls faster than their footfall does. If your audience is regional, regional stations are consistently the better value buy."),
    ("Position within the station", "Concourse positions facing departure boards command the highest premiums because they sit in the default sightline of waiting passengers. Platform panels deliver long dwell with a captive audience at lower cost. Entrance and walkway sites deliver volume but shorter exposure. The same format can perform very differently depending on where in the passenger flow it sits."),
    ("Seasonality & demand", "September to November and January to March are peak, driven by recruitment, financial services, and New Year consumer campaigns. Summer softens commuter volumes but lifts leisure traffic. Flexible timing improves what your budget buys."),
    ("Campaign duration", "Two weeks is the standard trading period. Longer bookings of four weeks and beyond reduce the per-period cost, and because rail's core strength is frequency against a repeating commuter audience, longer campaigns disproportionately outperform short ones in this environment. If the budget allows four weeks instead of two, take the four."),
    ("Production", "Digital carries no production cost. Printed 6-sheets and 48-sheets add print and posting; traincard printing is low per panel but adds up across a fleet. Build production into the total budget from the start."),
]

STATIONS = [
    ("Liverpool Street", 80.4, "City / financial professionals, Essex commuters", "Financial and professional services, B2B"),
    ("Paddington", 66.9, "Thames Valley business, Heathrow traffic", "Tech, business services, premium consumer"),
    ("London Bridge", 58.5, "City workers, south-east commuters", "Professional services, consumer brands"),
    ("Waterloo", 57.8, "South-west London and Surrey commuters", "Broad ABC1 consumer, financial services"),
    ("Victoria", 47.6, "South London commuters, Gatwick traffic", "Consumer brands, travel, retail"),
    ("King's Cross / St Pancras", 33.2, "Intercity business, international travellers", "Premium brands, B2B, travel"),
    ("Birmingham New Street", 29.1, "Midlands commuters and intercity", "Midlands regional campaigns"),
    ("Leeds", 21.4, "Yorkshire commuters and business", "Yorkshire regional reach, professional services"),
    ("Glasgow Central", 21.3, "Scottish commuters and intercity", "Scottish market campaigns"),
    ("Manchester Piccadilly", 20.9, "Northern business and commuters", "North of England reach, B2B and consumer"),
]

STATION_CHART_LABELS = {
    "Liverpool Street": "Liverpool St",
    "Paddington": "Paddington",
    "London Bridge": "London Bridge",
    "Waterloo": "Waterloo",
    "Victoria": "Victoria",
    "King's Cross / St Pancras": "King's Cross",
    "Birmingham New Street": "Birmingham",
    "Leeds": "Leeds",
    "Glasgow Central": "Glasgow C.",
    "Manchester Piccadilly": "Manchester",
}

TIP_TAGS = ["Concentration", "Dayparting", "Journey", "Midweek", "Measurement"]

TIPS = [
    ("Buy the station, not the network", "For most SMEs, concentrated presence at one or two well-chosen stations outperforms thin coverage across many. Frequency is the mechanism that makes rail work - own the platforms your audience stands on every day rather than renting a single panel at ten stations they might pass once."),
    ("Use dayparting on digital formats", "If your audience is the morning commuter, buy the morning. D6 and large format digital scheduling lets you weight spend into peak windows and midweek days when modern commuter volumes are strongest."),
    ("Combine platforms with traincards", "Platform panels get 12 minutes of station dwell. Traincards get 30 to 45 minutes of in-carriage dwell. Together they cover the full journey - awareness plus long-copy, QR-friendly format in one campaign."),
    ("Plan around the midweek commuter pattern", "Tuesday to Thursday is when commuter stations are fullest. Weight digital spend into those days, or time printed campaigns to launch on a Tuesday, to compound exposure over a multi-week run."),
    ("Run digital search alongside rail", "Commuters see your panel on the platform and search on the train. Run paid search on branded and category terms during the campaign - branded search volume in Google Search Console is one of the cleanest proxies for whether the campaign is registering."),
]

FAQS = [
    ("How much does rail advertising cost in the UK?", "Based on the Loud! OOH 2026 rate card, station 4/6-sheet posters run £250–£750 per panel per two weeks at regional stations, and £750–£1,500 at the London termini. Digital 6-sheets (D6) run £450–£1,200 per week regionally and £1,200–£2,200 per week at London termini. Traincards start from £75–£150 per panel regionally and from £150 in London. Station takeovers start from £2,500 regionally and from £15,000 at major London termini. See the full rate card at loudooh.co.uk/pricing."),
    ("Is rail cheaper than London Underground advertising?", "At the entry level, yes. Regional station 6-sheets start well below Underground equivalents, and local station advertising is one of the cheapest premium-environment buys in UK outdoor. At the top end, premium London termini sites price comparably with premium Underground inventory. The two environments also serve different audiences: national rail reaches commuter-belt and intercity audiences that the Underground network does not."),
    ("Which UK stations are best for advertising?", "For national and London-focused campaigns, Liverpool Street, Paddington, Waterloo, and London Bridge deliver the largest professional audiences. For regional campaigns, Leeds, Manchester Piccadilly, Birmingham New Street, Glasgow Central, and Edinburgh Waverley each dominate their city's commuter flow. For local businesses, the best station is almost always the one at the centre of your own catchment, regardless of its national ranking."),
    ("How long should a campaign run?", "Four weeks is the sensible minimum for station campaigns, because frequency against the repeating commuter audience is the mechanism that makes the format work. Two-week campaigns are available and useful for time-limited messages, but the recall data consistently favours longer runs. Longer bookings also reduce the per-period cost."),
    ("Can I advertise at just one local station?", "Yes, and for local businesses it is often the smartest available buy. Single-station campaigns at local and regional stations start from a few hundred pounds per panel per fortnight, and reach everyone in the catchment who commutes, twice a day, every working day. Availability at smaller stations is generally good because national advertisers concentrate on the major hubs."),
    ("How do I measure whether it worked?", "Brand tracking before and after the campaign is the most reliable measure for awareness objectives. Branded search volume in Google Search Console during the campaign window is the most accessible proxy. Traincard campaigns with QR codes and campaign URLs generate directly measurable response because of the long in-carriage dwell. For local campaigns, simply asking new customers how they heard of you remains underrated and effective."),
]

RELATED = [
    ("Buyer's Guide", "London Underground Advertising: The Complete 2026 Cost Guide", "18 min"),
    ("Buyer's Guide", "Billboard Advertising Costs in the UK, Format by Format", "15 min"),
    ("Playbook", "How to Plan an OOH Campaign That Actually Builds Frequency", "12 min"),
]

SHARES = ["in", "X", "f"]
MAX_USAGE = 80.4


def e(s):
    return html.escape(str(s))


def toc_html():
    items = []
    for sid, label in TOC:
        items.append(
            f'<a href="#{sid}" class="toc-link" data-section="{sid}">{e(label)}</a>'
        )
    return "\n        ".join(items)


def stats_html():
    cards = []
    for v, l, s in STATS:
        cards.append(f"""<div style="background:#fff;padding:22px 20px;">
            <div style="font-family:'Inter',sans-serif;font-weight:900;font-size:30px;letter-spacing:-0.02em;color:#FF4A00;line-height:1;">{e(v)}</div>
            <div style="font-weight:700;font-size:14px;color:#0E1E3C;margin:9px 0 3px;line-height:1.3;">{e(l)}</div>
            <div style="font-size:12px;color:#8b96a9;">{e(s)}</div>
          </div>""")
    return "\n        ".join(cards)


def audiences_html():
    cards = []
    for k, tag, d in AUDIENCES:
        cards.append(f"""<div style="border:1px solid #E6E9F0;border-top:3px solid #0E1E3C;padding:22px 24px;">
            <div style="font-family:'Inter',sans-serif;font-weight:800;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#FF4A00;margin-bottom:5px;">{e(tag)}</div>
            <div style="font-family:'Inter',sans-serif;font-weight:800;font-size:21px;color:#0E1E3C;margin-bottom:10px;">{e(k)}</div>
            <div style="font-size:16px;line-height:1.62;color:#3a4761;">{e(d)}</div>
          </div>""")
    return "\n        ".join(cards)


def formats_html():
    cards = []
    for name, tag, d, prices, best in FORMATS:
        accent_keys = {"London termini", "1,000-panel pkg"}
        price_rows = "\n            ".join(
            f"""<div class="format-card-price-row"><span class="format-card-price-label">{e(k)}</span><span class="format-card-price-value{" format-card-price-value--accent" if k in accent_keys else ""}">{e(v)}</span></div>"""
            for k, v in prices
            if k
        )
        cards.append(f"""<article class="format-card">
          <div class="format-card-body">
            <p class="format-card-tag">{e(tag)}</p>
            <h3 class="format-card-title">{e(name)}</h3>
            <p class="format-card-text">{e(d)}</p>
          </div>
          <div class="format-card-prices">
            {price_rows}
          </div>
          <div class="format-card-footer"><span class="format-card-footer-label">Best for</span><p>{e(best)}</p></div>
        </article>""")
    return "\n        ".join(cards)


def rate_rows_html():
    rows = []
    for fmt, reg, maj, lon, note in RATE_CARD:
        rows.append(f"""<tr>
              <td class="cell-format">{e(fmt)}</td>
              <td>{e(reg)}</td>
              <td>{e(maj)}</td>
              <td class="cell-price-london">{e(lon)}</td>
              <td class="cell-notes">{e(note)}</td>
            </tr>""")
    return "\n            ".join(rows)


def budgets_html():
    cards = []
    for i, (amount, title, text) in enumerate(BUDGETS):
        level = BUDGET_LEVELS[i]
        featured = " budget-tier--featured" if i == len(BUDGETS) - 1 else ""
        cards.append(f"""<article class="budget-tier{featured}">
          <div class="budget-tier-head">
            <p class="budget-tier-amount">{e(amount)}</p>
            <p class="budget-tier-level">{e(level)}</p>
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
        num = f"{i + 1:02d}"
        tag = FACTOR_TAGS[i]
        highlight = " factor-card--highlight" if title == "Campaign duration" else ""
        items.append(f"""<article class="factor-card{highlight}">
          <div class="factor-card-head">
            <span class="factor-card-num" aria-hidden="true">{num}</span>
            <p class="factor-card-tag">{e(tag)}</p>
          </div>
          <div class="factor-card-body">
            <h3 class="factor-card-title">{e(title)}</h3>
            <p class="factor-card-text">{e(text)}</p>
          </div>
        </article>""")
    return "\n        ".join(items)


def station_chart_html():
    rows = []
    for name, usage, aud, best in STATIONS:
        label = STATION_CHART_LABELS.get(name, name)
        pct = usage / MAX_USAGE * 100
        rows.append(
            f'<div class="bar-row"><span class="bar-label">{e(label)}</span>'
            f'<div class="bar-track"><div class="bar-fill" style="width:{pct:.1f}%"></div></div>'
            f'<span class="bar-value">{usage:.1f}m</span></div>'
        )
    return "\n          ".join(rows)


def station_cards_html():
    cards = []
    for name, usage, aud, best in STATIONS:
        cards.append(f"""<article class="station-card">
          <h3 class="station-card-name">{e(name)}</h3>
          <p class="station-card-audience">{e(aud)}</p>
          <p class="station-card-best"><span class="station-card-label">Best for</span> {e(best)}</p>
        </article>""")
    return "\n        ".join(cards)


def tips_html():
    items = []
    for i, (title, text) in enumerate(TIPS):
        num = f"{i + 1:02d}"
        tag = TIP_TAGS[i]
        lead = " tip-card--lead" if i == 0 else ""
        items.append(f"""<article class="tip-card{lead}">
          <div class="tip-card-head">
            <span class="tip-card-num" aria-hidden="true">{num}</span>
            <p class="tip-card-tag">{e(tag)}</p>
          </div>
          <div class="tip-card-body">
            <h3 class="tip-card-title">{e(title)}</h3>
            <p class="tip-card-text">{e(text)}</p>
          </div>
        </article>""")
    return "\n        ".join(items)


def station_bars_html():
    bars = []
    for name, usage, aud, best in STATIONS:
        pct = usage / MAX_USAGE * 100
        bars.append(f"""<div style="display:flex;align-items:center;gap:14px;">
            <div style="width:150px;flex:none;font-size:13.5px;font-weight:600;color:#0E1E3C;text-align:right;line-height:1.2;">{e(name)}</div>
            <div style="flex:1;height:26px;background:#F0F2F6;position:relative;">
              <div class="usage-bar" style="height:100%;width:{pct:.1f}%;background:#0E1E3C;"></div>
            </div>
            <div style="width:52px;flex:none;font-family:'Inter',sans-serif;font-weight:800;font-size:13.5px;color:#FF4A00;">{usage:.1f}m</div>
          </div>""")
    return "\n        ".join(bars)


def station_table_html():
    rows = []
    for name, usage, aud, best in STATIONS:
        rows.append(f"""<tr style="border-top:1px solid #EEF0F5;">
                <td style="padding:11px 16px;font-weight:700;color:#0E1E3C;">{e(name)}</td>
                <td style="padding:11px 12px;font-weight:700;color:#FF4A00;">{usage:.1f}m</td>
                <td style="padding:11px 12px;color:#3a4761;">{e(aud)}</td>
                <td style="padding:11px 16px;color:#3a4761;">{e(best)}</td>
              </tr>""")
    return "\n            ".join(rows)


def faqs_html():
    items = []
    for i, (q, a) in enumerate(FAQS):
        open_cls = " is-open" if i == 0 else ""
        items.append(f"""<div class="faq-item{open_cls}" data-faq="{i}">
            <button type="button" class="faq-question" aria-expanded="{'true' if i == 0 else 'false'}">
              {e(q)}
              <span class="faq-sign" aria-hidden="true">{'−' if i == 0 else '+'}</span>
            </button>
            <div class="faq-answer"{' style="display:block;"' if i == 0 else ''}>{e(a)}</div>
          </div>""")
    return "\n        ".join(items)


def related_html():
    cards = []
    for tag, title, read in RELATED:
        cards.append(f"""<a href="#" style="display:flex;flex-direction:column;border:1px solid #E6E9F0;background:#fff;color:inherit;transition:border-color .15s;">
          <div style="height:120px;background:#0E1E3C;position:relative;overflow:hidden;">
            <div style="position:absolute;inset:0;background-image:repeating-linear-gradient(135deg,rgba(255,74,0,0.16) 0 12px,transparent 12px 24px);"></div>
          </div>
          <div style="padding:20px 22px;">
            <div style="font-family:'Inter',sans-serif;font-weight:800;font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:#FF4A00;margin-bottom:10px;">{e(tag)}</div>
            <div style="font-family:'Inter',sans-serif;font-weight:800;font-size:18px;line-height:1.22;color:#0E1E3C;margin-bottom:14px;">{e(title)}</div>
            <div style="font-size:12.5px;color:#8b96a9;">{e(read)} read</div>
          </div>
        </a>""")
    return "\n      ".join(cards)


def shares_html():
    return "\n          ".join(
        f'<a href="#" style="width:36px;height:36px;border:1px solid rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;color:#cdd6e6;font-weight:700;font-size:13px;font-family:\'Inter\',sans-serif;">{e(s)}</a>'
        for s in SHARES
    )


PAGE = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rail Advertising in the UK | Loud! OOH Insights</title>
  <meta name="description" content="The complete UK rail advertising buyer's guide - formats, 2026 pricing, station selection, and campaign planning from Loud! OOH.">
  <meta name="theme-color" content="#0E1E3C">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900;1,14..32,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css?v=20260715">
</head>
<body>
  <div id="progress-bar" aria-hidden="true"><div id="progress-fill"></div></div>

  <header class="site-header">
    <div class="header-inner">
      <a href="#" class="logo">LOUD<span class="logo-accent">!</span><span class="logo-ooh">OOH</span></a>
      <nav class="main-nav" id="main-nav">
        <a href="#" class="nav-link">Formats</a>
        <a href="#" class="nav-link">Pricing</a>
        <a href="#" class="nav-link nav-active">Insights</a>
        <a href="#" class="nav-link">About</a>
        <a href="#cta" class="nav-cta">Get Pricing</a>
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="hero-inner">
      <div class="breadcrumb">
        <a href="#">Insights</a><span>/</span><span>Rail Advertising</span>
      </div>
      <div class="badge">Buyer's Guide</div>
      <h1>Rail Advertising in the UK</h1>
      <p class="hero-lead">A real guide to what it costs, what works, and whether it's right for your business. No forms, no vague ranges - just the numbers you need to decide.</p>
      <div class="hero-meta">
        <div class="author">
          <div class="author-avatar">L!</div>
          <div><div class="author-name">Loud! OOH</div><div class="author-role">OOH planning &amp; buying</div></div>
        </div>
        <div class="meta-divider"></div>
        <div class="meta-item"><span>Updated</span> July 2026</div>
        <div class="meta-item"><span>Read</span> 20 min</div>
        <div class="meta-spacer"></div>
        <div class="share-row">
          <span>Share</span>
          {shares_html()}
        </div>
      </div>
    </div>
    <div class="hero-image-wrap">
      <div class="hero-image" role="img" aria-label="UK station OOH advertising placeholder"></div>
      <div class="hero-caption">A large-format digital screen on a London terminus concourse - the premium rail format.</div>
    </div>
    <div class="hero-spacer"></div>
  </section>

  <div class="body-grid" id="body-grid">
    <aside class="toc-aside" id="toc-aside">
      <div class="toc-label">On this page</div>
      <nav class="toc-nav">
        {toc_html()}
      </nav>
    </aside>

    <article class="article">
      <div class="intro">
        <p class="intro-lead">Rail advertising guides tend to be written by people who have never bought any. They tell you the network carries over a billion journeys a year, that commuters are attractive, that stations are high-impact - all true, none of it useful - then comes the contact form, because the actual prices are apparently a secret.</p>
        <p>We plan and buy rail campaigns across the UK network, from single-station regional activity to multi-station London terminus takeovers. This guide covers the UK national rail market: railway stations and trains across the National Rail network. It includes every format, real 2026 pricing from the Loud! OOH rate card, how to choose between stations, and an honest answer to the question that matters - is this right for my business, and what will it genuinely cost?</p>
      </div>

      <h2 id="numbers" class="section-heading">First, the numbers that matter</h2>
      <p>The UK national rail network handled approximately <strong>1.7 billion passenger journeys</strong> in the year to March 2025 (Office of Rail and Road). Traffic is heavily concentrated: the London termini alone account for hundreds of millions of annual entries and exits, with Liverpool Street the busiest station in Britain at over 80 million.</p>
      <div class="stats-grid">
        {stats_html()}
      </div>
      <p>Two characteristics make rail genuinely distinctive. The first is <strong>dwell time</strong> - the average passenger spends around 12 minutes in the station per journey, considerably longer when trains are delayed. People waiting for a platform announcement stand still, facing the departure boards, in exactly the sightline where the best inventory sits.</p>
      <p>The second is <strong>frequency</strong>. A season-ticket holder passes through the same station ten times a week - roughly 450 times a year. A well-placed campaign doesn't reach them once; it reaches them every working day for the entire period. Rail commuters also skew ABC1, with a strong concentration of professionals and above-average incomes.</p>

      <h2 id="audience" class="section-heading">Who actually uses UK rail stations?</h2>
      <p>A station is not one audience. It is a commuter audience in the morning peak, a business audience through the day, and a leisure audience at weekends. The best campaigns are planned against the specific segment that matters - not the headline footfall number.</p>
      <div class="audience-list">
        {audiences_html()}
      </div>

      <h2 id="formats" class="section-heading">Every format explained</h2>
      <p>All prices are media costs for a standard two-week campaign unless stated, excluding VAT and print production. Pricing splits between London termini and major regional stations; smaller local stations price below the regional figures shown.</p>
      <div class="formats-grid">
        {formats_html()}
      </div>

      <h2 id="ratecard" class="section-heading">The 2026 rate card</h2>
      <p>Media cost only, excluding VAT and production. Two-week trading period unless stated. We publish these openly and do not mark up media costs.</p>
      <div class="interactive-table" data-table-label="2026 Rate Card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Format</th><th>Regional</th><th>Major regional</th><th>London termini</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rate_rows_html()}
          </tbody>
        </table>
      </div>
      <div class="source-note">Source: Loud! OOH 2026 Rate Card.</div>

      <h2 id="budgets" class="section-heading">What a campaign looks like by budget</h2>
      <p class="section-lead">Individual panel prices only tell you so much. Here is what rail advertising actually looks like across total budgets - from local entry to full domination.</p>
      <div class="budget-tiers" aria-label="Campaigns by budget">
        {budgets_html()}
      </div>

      <h2 id="factors" class="section-heading">The factors that move the price</h2>
      <p class="section-lead">Five variables explain most of the difference between two otherwise similar campaigns.</p>
      <div class="factor-cards" aria-label="Pricing factors">
        {factors_html()}
      </div>
      <div class="callout"><strong>Duration rule:</strong> If the budget allows four weeks instead of two, take the four. Rail's strength is frequency against a repeating audience - longer campaigns disproportionately outperform short ones.</div>

      <h2 id="effectiveness" class="section-heading">Does it work? The honest answer.</h2>
      <p class="section-lead">Rail's defining strength is repetition - the same commuter, the same panel, every working day.</p>
      <div class="verdict-card">
        <span class="verdict-badge" aria-hidden="true">✓</span>
        <div>
          <h3>Yes - if you need frequency against commuters</h3>
          <p>A four-week campaign can deliver ~40 exposures to the same ABC1 audience, with ~12 minutes of dwell each time.</p>
        </div>
      </div>
      <div class="chart-panel" aria-label="Campaign frequency chart">
        <div class="chart-panel-header">
          <h3 class="chart-title">Typical exposures per commuter</h3>
          <p class="chart-subtitle">Regular season-ticket holder · same station panel · illustrative</p>
        </div>
        <div class="bar-chart">
          <div class="bar-row"><span class="bar-label">2 weeks</span><div class="bar-track"><div class="bar-fill" style="width:50%"></div></div><span class="bar-value">~20×</span></div>
          <div class="bar-row"><span class="bar-label">4 weeks</span><div class="bar-track"><div class="bar-fill" style="width:100%"></div></div><span class="bar-value">~40×</span></div>
          <div class="bar-row"><span class="bar-label">8 weeks</span><div class="bar-track"><div class="bar-fill bar-fill--muted" style="width:100%"></div></div><span class="bar-value">~80×</span></div>
        </div>
      </div>
      <div class="sme-grid" aria-label="Strengths and limitations">
        <article class="sme-card sme-yes">
          <h3 class="sme-title">Where it's strongest</h3>
          <p>Recruitment performs exceptionally - you're addressing people during their commute to a job they may want to leave. Financial, professional and B2B brands benefit from the ABC1 concentration. And traincards, with 30–45 minutes of dwell, genuinely support direct response.</p>
        </article>
        <article class="sme-card sme-no">
          <h3 class="sme-title">What it doesn't do well</h3>
          <p>Rail reaches rail users, and rail users are not everyone. If your audience drives, works from home, or lives outside commuter catchments, station advertising will miss them. It's also weaker for cheap national reach - roadside delivers raw national coverage more cheaply. Note too that Mon and Fri commuter volumes remain measurably quieter post-pandemic; midweek-weighted digital reaches the modern pattern more efficiently.</p>
        </article>
      </div>
      <blockquote class="pull-quote">Rail advertising is the most efficient frequency-building format in UK outdoor for reaching commuters and city-centre audiences.</blockquote>

      <h2 id="stations" class="section-heading">Choosing the right stations</h2>
      <p class="section-lead">Match the station to your audience - not just the biggest footfall number.</p>
      <div class="chart-panel" aria-label="Station footfall chart">
        <div class="chart-panel-header">
          <h3 class="chart-title">Ten busiest managed stations</h3>
          <p class="chart-subtitle">Annual entries and exits · millions · ORR 2024-25</p>
        </div>
        <div class="bar-chart">
          {station_chart_html()}
        </div>
      </div>
      <div class="station-cards" aria-label="Station audience guide">
        {station_cards_html()}
      </div>
      <div class="source-note">Source: Office of Rail and Road station usage estimates, 2024-25.</div>

      <h2 id="booking" class="section-heading">The booking process</h2>
      <p>Allow three to five weeks from brief to live for standard poster and D6 campaigns. Printed formats need artwork sign-off then print and posting (one to two weeks); digital can move faster once artwork is approved. Station dominations and train wraps need eight to twelve weeks minimum, and premium concourse screens at the London termini book ahead - particularly for autumn and new year.</p>
      <p>Inventory is managed by a small number of media owners holding long-term concessions with Network Rail and the train operating companies. A multi-station campaign often involves multiple owners - booking through an agency consolidates that into one plan, one point of accountability, and better rates than individual direct bookings.</p>
      <div class="callout"><strong>Compliance:</strong> all creative must comply with the CAP Code, and rail environments carry additional restrictions - notably around imagery that could be distressing in a rail context or mistaken for operational signage. Submit artwork for approval at least five working days before your start date.</div>

      <h2 id="sme" class="section-heading">Is rail right for an SME?</h2>
      <p>Straight answer: rail is one of the most SME-accessible premium formats in UK outdoor, provided you buy at the right level. Local and regional station advertising is genuinely affordable, and the frequency it builds against a defined catchment is something small businesses usually can't buy anywhere else at the price.</p>
      <div class="sme-grid">
        <article class="sme-card sme-yes">
          <h3 class="sme-title">When it makes sense</h3>
          <ul>
            <li>Your customers cluster in a town, city or commuter catchment</li>
            <li>You want repeated exposure over one-off reach</li>
            <li>You're recruiting and want employed professionals mid-commute</li>
            <li>Your local station has meaningful footfall and panels start in the hundreds</li>
            <li>You can run four weeks or more to let frequency build</li>
          </ul>
        </article>
        <article class="sme-card sme-no">
          <h3 class="sme-title">When to think twice</h3>
          <ul>
            <li>Your audience predominantly drives or works from home</li>
            <li>You need broad national reach on a limited budget</li>
            <li>You need immediate, trackable response as the primary metric</li>
            <li>Your timeline is shorter than three to four weeks</li>
            <li>Your catchment doesn't align with any station's commuter flow</li>
          </ul>
        </article>
      </div>

      <h2 id="faq" class="section-heading">Frequently asked questions</h2>
      <div class="faq-list">
        {faqs_html()}
      </div>

      <h2 class="section-heading">Final thoughts</h2>
      <p>Rail advertising is the frequency format of UK outdoor. Nothing else puts your message in front of the same defined, affluent audience ten times a week with twelve minutes of dwell per exposure. At the local and regional level it is also one of the most underpriced formats in the market, because national money crowds into the London termini and leaves the rest of the network genuinely good value.</p>
      <p>Whether rail is right for your business comes down to one question: <strong>does your audience pass through a station regularly?</strong> If they do, rail advertising will reach them more often, for longer, than almost anything else you can buy.</p>
    </article>
  </div>

  <section id="cta" class="cta">
    <div class="cta-inner">
      <div class="cta-label">Plan your campaign</div>
      <h2>See exactly what your rail campaign will cost</h2>
      <p>We plan and buy rail advertising for SMEs and challenger brands across the UK. Open pricing, no media mark-up - you know what you're committing to before you commit to anything.</p>
      <div class="cta-buttons">
        <a href="#" class="btn-primary">See the full rate card</a>
        <a href="#" class="btn-secondary">Talk to a planner</a>
      </div>
      <div class="cta-contact">hello@loudooh.co.uk &nbsp;·&nbsp; 020 4514 9147 &nbsp;·&nbsp; loudooh.co.uk/pricing</div>
    </div>
  </section>

  <section class="related">
    <div class="related-header">
      <h2>Keep reading</h2>
      <a href="#">All insights →</a>
    </div>
    <div class="related-grid">
      {related_html()}
    </div>
  </section>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="logo footer-logo">LOUD<span class="logo-accent">!</span><span class="logo-ooh">OOH</span></div>
      <div>© 2026 Loud! OOH &nbsp;·&nbsp; UK out-of-home planning &amp; buying &nbsp;·&nbsp; Bigger. Bolder. Louder.</div>
    </div>
  </footer>

  <button type="button" id="back-to-top" aria-label="Back to top">↑</button>

  <script src="js/tables.js?v=20260715"></script>
  <script src="js/app.js?v=20260715"></script>
</body>
</html>
"""

APP_JS = """(function () {
  'use strict';

  var SECTIONS = ['numbers','audience','formats','ratecard','budgets','factors','effectiveness','stations','booking','sme','faq'];
  var progressFill = document.getElementById('progress-fill');
  var backToTop = document.getElementById('back-to-top');
  var bodyGrid = document.getElementById('body-grid');
  var tocAside = document.getElementById('toc-aside');
  var mainNav = document.getElementById('main-nav');
  var tocLinks = document.querySelectorAll('.toc-link');
  var faqItems = document.querySelectorAll('.faq-item');

  function isNarrow() {
    return window.innerWidth < 920;
  }

  function updateLayout() {
    var narrow = isNarrow();
    if (bodyGrid) {
      bodyGrid.classList.toggle('is-narrow', narrow);
    }
    if (tocAside) {
      tocAside.classList.toggle('is-hidden', narrow);
    }
    if (mainNav) {
      mainNav.classList.toggle('is-narrow', narrow);
    }
  }

  function scrollToSection(id, e) {
    if (e) e.preventDefault();
    var el = document.getElementById(id);
    if (el) {
      var top = el.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  function updateScrollState() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var progress = max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0;

    if (progressFill) {
      progressFill.style.width = progress + '%';
    }

    if (backToTop) {
      backToTop.classList.toggle('is-visible', doc.scrollTop > 900);
    }

    var active = SECTIONS[0];
    var line = 140;
    for (var i = 0; i < SECTIONS.length; i++) {
      var section = document.getElementById(SECTIONS[i]);
      if (section && section.getBoundingClientRect().top - line <= 0) {
        active = SECTIONS[i];
      }
    }

    tocLinks.forEach(function (link) {
      var on = link.getAttribute('data-section') === active;
      link.classList.toggle('is-active', on);
    });
  }

  tocLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      scrollToSection(link.getAttribute('data-section'), e);
    });
  });

  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq-question');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        var answer = other.querySelector('.faq-answer');
        var sign = other.querySelector('.faq-sign');
        var q = other.querySelector('.faq-question');
        if (answer) answer.style.display = 'none';
        if (sign) sign.textContent = '+';
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        var answer = item.querySelector('.faq-answer');
        var sign = item.querySelector('.faq-sign');
        if (answer) answer.style.display = 'block';
        if (sign) sign.textContent = '−';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  window.addEventListener('resize', updateLayout, { passive: true });
  window.addEventListener('scroll', updateScrollState, { passive: true });

  updateLayout();
  updateScrollState();
})();
"""

STYLES = """* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: #fff;
  color: #14213A;
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
a { color: #FF4A00; text-decoration: none; }
a:hover { color: #cc3b00; }
::selection { background: #FF4A00; color: #fff; }

#progress-bar {
  position: fixed; top: 0; left: 0; right: 0; height: 4px;
  z-index: 60; background: rgba(14,30,60,0.08);
}
#progress-fill {
  height: 100%; background: #FF4A00; width: 0;
  transition: width 0.08s linear;
}

.site-header {
  position: sticky; top: 0; z-index: 50;
  background: #0E1E3C; border-bottom: 1px solid rgba(255,255,255,0.08);
}
.header-inner {
  max-width: 1240px; margin: 0 auto; padding: 0 24px;
  height: 68px; display: flex; align-items: center;
  justify-content: space-between; gap: 20px;
}
.logo {
  display: flex; align-items: baseline; gap: 0;
  font-weight: 900; font-size: 24px; letter-spacing: -0.02em; color: #fff;
}
.logo-accent { color: #FF4A00; }
.logo-ooh {
  font-weight: 700; font-size: 13px; letter-spacing: 0.28em;
  margin-left: 8px; align-self: center; color: #8fa0bd;
}
.main-nav { display: flex; align-items: center; gap: 28px; }
.main-nav.is-narrow { gap: 16px; }
.main-nav.is-narrow .nav-link { display: none; }
.nav-link { color: #cdd6e6; font-weight: 600; font-size: 14.5px; }
.nav-active {
  color: #fff; font-weight: 700;
  border-bottom: 2px solid #FF4A00; padding-bottom: 4px;
}
.nav-cta {
  background: #FF4A00; color: #fff !important; font-weight: 800;
  font-size: 13.5px; letter-spacing: 0.03em; padding: 12px 20px;
  text-transform: uppercase;
}

.hero {
  background: #0E1E3C;
  background-image: radial-gradient(120% 100% at 85% 0%, rgba(255,74,0,0.14), rgba(255,74,0,0) 55%);
  color: #fff; padding: 56px 24px 0;
}
.hero-inner { max-width: 900px; margin: 0 auto; }
.breadcrumb { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #8fa0bd; font-weight: 600; margin-bottom: 28px; }
.breadcrumb a { color: #8fa0bd; }
.breadcrumb span { opacity: 0.5; }
.badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: #FF4A00; color: #fff; font-weight: 800;
  font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
  padding: 7px 12px; margin-bottom: 22px;
}
.hero h1 {
  font-weight: 900; font-size: clamp(34px, 6vw, 60px);
  line-height: 1.02; letter-spacing: -0.02em; margin: 0 0 22px;
  text-transform: uppercase;
}
.hero-lead {
  font-size: clamp(18px, 2.4vw, 23px); line-height: 1.5;
  color: #c3cede; font-weight: 400; max-width: 720px; margin: 0 0 34px;
}
.hero-meta {
  display: flex; flex-wrap: wrap; align-items: center;
  gap: 14px 26px; padding-bottom: 40px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.author { display: flex; align-items: center; gap: 11px; }
.author-avatar {
  width: 40px; height: 40px; background: #FF4A00;
  display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: 15px;
}
.author-name { font-weight: 700; font-size: 14.5px; color: #fff; }
.author-role { font-size: 12.5px; color: #8fa0bd; }
.meta-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.12); }
.meta-item { font-size: 13.5px; color: #c3cede; }
.meta-item span { color: #8fa0bd; }
.meta-spacer { flex: 1; }
.share-row { display: flex; align-items: center; gap: 10px; }
.share-row > span { font-size: 12.5px; color: #8fa0bd; font-weight: 600; }
.hero-image-wrap { max-width: 1080px; margin: 44px auto 0; }
.hero-image {
  position: relative; width: 100%; aspect-ratio: 16/7;
  border: 3px solid #FF4A00; background: #0A1730;
  background-image: repeating-linear-gradient(135deg, rgba(255,74,0,0.12) 0 20px, transparent 20px 40px);
}
.hero-caption { font-size: 12px; color: #8fa0bd; margin-top: 10px; }
.hero-spacer { height: 56px; }

.body-grid {
  max-width: 1240px; margin: 0 auto; padding: 52px 24px 0;
  display: grid; gap: 56px; align-items: start;
  grid-template-columns: 250px 1fr;
}
.body-grid.is-narrow { grid-template-columns: 1fr; }
.toc-aside { position: sticky; top: 96px; align-self: start; }
.toc-aside.is-hidden { display: none; }
.toc-label {
  font-weight: 800; font-size: 12px; letter-spacing: 0.16em;
  text-transform: uppercase; color: #8b96a9; margin-bottom: 16px;
}
.toc-nav {
  display: flex; flex-direction: column;
  border-left: 2px solid #E6E9F0;
}
.toc-link {
  padding: 8px 0 8px 16px; margin-left: -2px;
  font-size: 14px; line-height: 1.35; font-weight: 500;
  border-left: 2px solid transparent; color: #68758c;
  cursor: pointer; transition: color 0.15s;
}
.toc-link.is-active {
  font-weight: 700; border-left-color: #FF4A00; color: #0E1E3C;
}

.article { max-width: 720px; font-size: 17.5px; line-height: 1.72; color: #2c3a55; }
.intro-lead {
  font-size: 20px; line-height: 1.62; color: #14213A;
  margin: 0 0 22px; font-weight: 500;
}
.article p { margin: 0 0 22px; }
.section-heading {
  scroll-margin-top: 88px; font-weight: 900;
  font-size: clamp(25px, 3.6vw, 34px); line-height: 1.1;
  letter-spacing: -0.02em; color: #0E1E3C; text-transform: uppercase;
  margin: 56px 0 20px; padding: 0;
}
#numbers.section-heading { margin-top: 52px; }

.stats-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1px; background: #E6E9F0; border: 1px solid #E6E9F0; margin: 0 0 30px;
}
.audience-list, .budget-list { display: flex; flex-direction: column; gap: 14px; margin: 0 0 8px; }
.formats-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px; margin: 26px 0 8px;
}
.table-wrap { overflow-x: auto; border: 1px solid #E6E9F0; margin: 0 0 14px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13.5px; min-width: 520px; }
.data-table thead tr { background: #0E1E3C; color: #fff; text-align: left; }
.data-table th { padding: 12px 16px; font-weight: 700; font-size: 12px; }
.data-table th:not(:first-child) { padding-left: 12px; padding-right: 12px; }
.source-note { font-size: 12px; color: #8b96a9; margin-bottom: 8px; }

.pull-quote {
  margin: 28px 0; padding: 22px 24px 22px 52px;
  background: #0E1E3C; border: none; border-radius: 12px;
  box-shadow: 0 2px 16px rgba(14, 30, 60, 0.18);
  font-weight: 600; font-size: 1.125rem; line-height: 1.55;
  color: rgba(255, 255, 255, 0.94); position: relative;
}
.station-bars { display: flex; flex-direction: column; gap: 11px; margin: 0 0 30px; }
.usage-bar { animation: barGrow 0.9s ease-out; }
@keyframes barGrow { from { width: 0; } }

.callout {
  border-left: 4px solid #FF4A00; background: #FFF4EF;
  padding: 16px 20px; font-size: 14.5px; line-height: 1.6; color: #3a4761; margin: 0 0 8px;
}
.callout strong { color: #0E1E3C; }

.sme-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px; margin: 0 0 8px;
}
.sme-card { border: 1px solid #E6E9F0; border-radius: 12px; padding: 20px 22px 22px; background: #fff; }
.sme-yes { border-top: 4px solid #1F8A5B; }
.sme-no { border-top: 4px solid #C43D2E; }
.sme-title {
  font-weight: 900; font-size: 14px; text-transform: uppercase;
  letter-spacing: 0.04em; margin: 0 0 16px; line-height: 1.25;
}
.sme-yes .sme-title { color: #1F8A5B; }
.sme-no .sme-title { color: #C43D2E; }
.sme-card ul { margin: 0; padding-left: 18px; font-size: 14.5px; line-height: 1.7; color: #3a4761; }

.faq-list { border-top: 1px solid #E6E9F0; margin: 0 0 8px; }
.faq-item { border-bottom: 1px solid #E6E9F0; }
.faq-question {
  width: 100%; text-align: left; background: none; border: none;
  padding: 18px 40px 18px 0; cursor: pointer; font-family: inherit;
  font-weight: 700; font-size: 16.5px; color: #0E1E3C;
  position: relative; line-height: 1.35;
}
.faq-sign {
  position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
  color: #FF4A00; font-size: 22px; font-weight: 400;
}
.faq-answer {
  display: none; padding: 0 30px 22px 0;
  font-size: 15.5px; line-height: 1.68; color: #4a5872;
}
.faq-item.is-open .faq-answer { display: block; }

.cta {
  background: #0E1E3C;
  background-image: radial-gradient(100% 120% at 15% 100%, rgba(255,74,0,0.16), rgba(255,74,0,0) 55%);
  color: #fff; margin-top: 72px; padding: 64px 24px;
}
.cta-inner { max-width: 820px; margin: 0 auto; text-align: center; }
.cta-label {
  font-weight: 800; font-size: 12px; letter-spacing: 0.16em;
  text-transform: uppercase; color: #FF4A00; margin-bottom: 18px;
}
.cta h2 {
  font-weight: 900; font-size: clamp(28px, 4.5vw, 44px);
  line-height: 1.04; letter-spacing: -0.02em; text-transform: uppercase; margin: 0 0 18px;
}
.cta p { font-size: 18px; line-height: 1.55; color: #c3cede; max-width: 560px; margin: 0 auto 32px; }
.cta-buttons { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; }
.btn-primary {
  background: #FF4A00; color: #fff !important; font-weight: 800;
  font-size: 15px; letter-spacing: 0.03em; text-transform: uppercase; padding: 16px 30px;
}
.btn-secondary {
  border: 1px solid rgba(255,255,255,0.35); color: #fff !important; font-weight: 800;
  font-size: 15px; letter-spacing: 0.03em; text-transform: uppercase; padding: 16px 30px;
}
.cta-contact { margin-top: 26px; font-size: 14px; color: #8fa0bd; }

.related { max-width: 1240px; margin: 0 auto; padding: 64px 24px 8px; }
.related-header {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 16px; margin-bottom: 24px;
}
.related-header h2 {
  font-weight: 900; font-size: clamp(22px, 3vw, 30px);
  letter-spacing: -0.02em; text-transform: uppercase; color: #0E1E3C; margin: 0;
  padding-left: 16px; border-left: 5px solid #FF4A00; line-height: 1.1;
}
.related-header a {
  font-weight: 700; font-size: 13.5px; text-transform: uppercase;
  letter-spacing: 0.04em; white-space: nowrap;
}
.related-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;
}
.related-grid a:hover { border-color: #FF4A00; }

.site-footer {
  background: #0A1730; color: #8fa0bd; margin-top: 64px; padding: 44px 24px;
}
.footer-inner {
  max-width: 1240px; margin: 0 auto;
  display: flex; flex-wrap: wrap; align-items: center;
  justify-content: space-between; gap: 20px;
}
.footer-logo { font-size: 22px; }
.footer-inner > div:last-child { font-size: 13px; }

#back-to-top {
  position: fixed; right: 22px; bottom: 22px; z-index: 55;
  width: 48px; height: 48px; border: none; cursor: pointer;
  background: #FF4A00; color: #fff; font-size: 22px; font-family: inherit;
  box-shadow: 0 6px 20px rgba(14,30,60,0.28);
  transition: opacity 0.2s, transform 0.2s;
  opacity: 0; transform: translateY(12px); pointer-events: none;
}
#back-to-top.is-visible {
  opacity: 1; transform: translateY(0); pointer-events: auto;
}
"""


def main():
    with open(os.path.join(OUT, "index.html"), "w", encoding="utf-8") as f:
        f.write(PAGE)

    print("Generated index.html in", OUT)


if __name__ == "__main__":
    main()
