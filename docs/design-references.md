# Design references

DualFee v0.2's visual direction was chosen after looking at current, well-regarded dev-tool, web3 and data
sites. Nothing below is copied (no assets, code or copy); each entry lists the *pattern* we borrowed and where
it shows up in DualFee. Checked on 2026-10-26.

| Site | Where it's recognised | What we borrowed | Where in DualFee |
|---|---|---|---|
| **Sui** — https://www.sui.io/ | Awwwards Site of the Day, 23 Jun 2026 (+ Developer Award), https://www.awwwards.com/sites/sui | Its highlighted elements are an *intro loader*, *gradient transitions* and a two-colour palette (#298DFF on #000). We took the idea of a short, branded intro that hands off to the page with a gradient wipe, on a strictly two-colour base. | Session-once splash (`src/components/Splash.tsx`): two bars converge into the wordmark, then a wipe reveals the page. |
| **Navigate** (Resn) — https://www.awwwards.com/sites/navigate | Awwwards SOTD, 16 Apr 2025, Developer Award; tagged *Data Visualization*, *Storytelling* | A web3 *data* platform told as a scroll story with a strict 2-colour palette (#FF6D38 / #8584FF). We adopted the "two colours = two actors" rule: violet is always EVM, mint is always Native, and a single third accent (amber) is reserved for the storage deposit, the thing the story is about. | Colour tokens in `tailwind.config.js`; scroll-revealed landing sections; stacked fee-vs-deposit bar. |
| **Cantor8** — https://www.cantor8.io | CSS Winner Site of the Day, 8 Jun 2026, https://www.csswinner.com/details/cantor8/19242 | Blockchain infra site that *visualises data flow* with animated SVG and heavy typography. We borrowed animated SVG paths that carry a value from two sources to one destination. | Landing hero: two surfaces (EVM, Native) flow along SVG paths and converge into one answer node. |
| **MotionSites** dark/SaaS gallery — https://motionsites.org/style/dark , https://motionsites.ai/ | Curated gallery of motion-first SaaS/web3 heroes built with React + Tailwind + Framer Motion | "Near-black canvases lit by glowing gradients" and its prompt conventions (Framer Motion reveals, ease `[0.25, 0.1, 0.25, 1]`, AnimatePresence for overlays/menus). | Motion tokens in `src/lib/motion.ts`; glow behind the hero; AnimatePresence for route transitions and the mobile menu. |
| **Linear** — https://linear.app | Reference dev-tool product site | Product screenshots *as UI*, a quiet sidebar app shell, and numbered figure labels ("Fig 0.1"). | `/app` shell with sidebar on desktop / tab bar on mobile; mono "§ 01 / Problem" kicker labels on every section. |
| **Vercel** — https://vercel.com | Reference dev-tool product site (Geist design system) | Hairline grid lines, monospace for anything machine-generated, and a live status indicator in the footer ("Loading status…"). | Grid + noise background texture, all numbers in JetBrains Mono with tabular figures, live network strip/ticker with per-surface status dots and latency. |

## The resulting direction: "dual-surface instrument"

* **Dark, technical, near-black** (`#06070a`) with a 48px hairline grid and a faint SVG noise layer, masked so it fades toward the edges.
* **Two-tone semantic colour**: EVM = violet `#8b7bff`, Native = mint `#2fe0a6`. **Amber `#ffb547` is only ever the storage deposit.** Neutral greys for everything else. A colour always means the same surface everywhere (bars, dots, text, charts).
* **Type**: Space Grotesk (display), Inter (UI), JetBrains Mono (all numbers, hashes, addresses, method names), tabular figures.
* **Motion**: one easing curve, short durations (0.25–0.6s), reveal-on-scroll once, number count-ups for live values, route cross-fades. Everything is disabled under `prefers-reduced-motion`.
* **Honesty rule carried into the design**: no illustrative fake numbers. Any chart, bar or ticker renders only live or locally-measured values, and shows a "connecting"/"not measured yet" state otherwise.
