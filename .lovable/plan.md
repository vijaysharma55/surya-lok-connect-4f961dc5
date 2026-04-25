
# Surya Lok Kalyan Foundation (SLKF) — Website Plan

A modern, trust-first multi-page site for an NGO + business hybrid. Mobile-first, brand-aligned, WhatsApp-driven lead capture, no backend.

## Brand & Design System

Update `src/index.css` with HSL design tokens matching the brief:

- `--primary` (Yellow #FFC107) — CTAs, accents, sun motifs
- `--secondary` (Green #2E7D32) — growth, success, trust badges
- `--foreground` (Dark Blue #000080) — body text, headings, authority
- `--background` (Cream #FFFDD0) — page background
- Supporting tokens: muted cream, card white, soft shadows, gradients (warm sun gradient for hero overlay, subtle yellow→green for accents)

Typography: Poppins (headings, semi-bold) + Inter (body) loaded via Google Fonts in `index.html`. Hindi/Devanagari support via `Noto Sans Devanagari` fallback so the Hindi headlines render cleanly.

Tailwind config additions: brand color tokens, container widths, fade-in / slide-up keyframes for scroll animations, custom shadows (`shadow-warm`, `shadow-trust`).

Global UI primitives (reused across pages):
- `Header` — sticky, logo (sun mark + "Surya Lok Kalyan Foundation"), trust strip "80G | 12A | 10AC", contact pills (Call, WhatsApp), responsive hamburger
- `Footer` — contact, quick links, two phone numbers, email, domain, copyright
- `WhatsAppFloat` — fixed bottom-right floating button (link to wa.me/917520585153)
- `SectionHeading`, `ServiceCard`, `TrustBadge`, `StatCard` — shared components

## Pages & Routes

Multi-page via React Router:

| Route | Page |
|---|---|
| `/` | Home |
| `/about` | About |
| `/services` | Services overview |
| `/services/csr` | CSR Project Management detail |
| `/services/solar` | Solar Energy Solutions detail |
| `/services/property` | Property Buy & Sell detail |
| `/projects` | Projects gallery |
| `/contact` | Contact + map + form |
| `*` | NotFound (already exists) |

Each route gets a unique `<title>` and meta description via a small `Seo` component using `react-helmet-async` for SEO.

### Home (`/`)
- Hero: full-width AI image (Indian village sunrise + solar panels + farmers, warm yellow). Overlay with Hindi headline "☀️ सूरज की रोशनी से समाज की रोशनी तक", English subheading, two CTAs (हमसे जुड़ें → /contact, Projects देखें → /projects)
- Trust strip: 80G | 12A | 10AC | Patna, Bihar | Est. 2026
- About snippet (2 paragraphs + "Read more" → /about)
- 3 service cards (link to detail pages)
- Why Choose Us — 4 icon cards (Transparent, Local + Scalable, Multi-service, Trust-first)
- Stats band: years, projects, beneficiaries, districts (modest numbers)
- Mini gallery (8 images, link to /projects)
- Contact CTA band (call + WhatsApp buttons)

### About (`/about`)
- Mission, vision, founding story (24 May 2026, Mithapur Patna)
- Three pillars: जनता की सेवा, सरकार के साथ सहयोग, पारदर्शी सिस्टम
- Trust points cards
- Compliance row (80G/12A/10AC)
- Team placeholder section (AI-generated team-style image)

### Services (`/services` + 3 detail pages)
- Overview page with 3 large cards
- Each detail page: hero image, what we do, features list, benefits list, FAQ accordion, WhatsApp CTA pre-filled with the service name

### Projects (`/projects`)
- Tabbed gallery: All / CSR / Solar / Property / Team
- Responsive masonry grid using AI-generated images per category (4–6 each)
- Lightbox dialog (using existing `Dialog` UI component) for enlarged view

### Contact (`/contact`)
- Address, hours (9:15 AM – 5:00 PM, Sunday closed), both phone numbers, email
- Embedded Google Map iframe of Mithapur, Patna
- Contact form: Name, Phone, Service Interest (select: CSR / Solar / Property / Other), Message
- Validated with `zod` + `react-hook-form` (length limits, phone regex, no script injection)
- On submit: builds a pre-filled WhatsApp message and opens `https://wa.me/917520585153?text=...` in a new tab; shows toast confirmation
- Secondary "Email us" mailto link

## Imagery (AI-generated, custom)

Generate ~14 brand-aligned images via the AI gateway script (Nano Banana Pro for hero, Nano Banana 2 for the rest), saved into `src/assets/`:

1. `hero-sunrise.jpg` — Indian village sunrise, solar panels on rooftops, farmer silhouettes, warm yellow tone
2. `about-community.jpg` — community gathering, Bihar context
3. `service-csr.jpg` — school/skill center activity
4. `service-solar.jpg` — rooftop solar install close-up
5. `service-property.jpg` — agricultural plot with documents/measurement
6–9. CSR gallery (school supplies, women skill training, hospital camp, plantation drive)
10–11. Solar gallery (residential install, farm pump solar)
12–13. Property gallery (verified plot, farmhouse)
14. Team-style image (professionals in office, India)

All imported as ES modules so Vite hashes and optimizes them; `loading="lazy"` and explicit `width`/`height` for CLS; `<img alt>` text in English for accessibility.

## Header Details

- Top row (desktop): logo + name on left; "80G | 12A | 10AC" trust pills center; phone + WhatsApp buttons right
- Bottom row: nav links (Home, About, Services with dropdown, Projects, Contact)
- Mobile: collapsible sheet menu (use existing `Sheet` UI), sticky CTA bar at the bottom of viewport with Call + WhatsApp
- Reg. No. is hidden as requested — only 80G | 12A | 10AC shown

## Accessibility & SEO

- Semantic landmarks (`header`, `nav`, `main`, `section`, `footer`)
- AA contrast: dark blue text on cream passes; yellow buttons use dark-blue text for contrast (not white)
- Focus rings via design tokens
- `react-helmet-async` for per-page title/description/OG tags
- `index.html` updated: title, description, OG image, Hindi `lang` alt where relevant, sitemap-friendly meta
- Sun-themed SVG favicon generated and placed at `public/favicon.svg`; remove old `favicon.ico`
- `robots.txt` allows all; add a simple static `sitemap.xml`

## Performance

- Route-level `React.lazy` + `Suspense` for non-home pages
- Images imported as modules so Vite produces hashed, optimized assets; use `<img loading="lazy" decoding="async">` everywhere except hero
- Tailwind purge already configured; no heavy libraries added beyond `react-helmet-async`, `react-hook-form` + `zod` (already common in shadcn projects), and `lucide-react` (already present)

## Restrictions Honored

- No "3 Guru" / heavy religious symbolism in UI copy
- No "guarantee" wording — using "verified", "transparent", "supported by" instead
- Cream + yellow + green + dark blue only; no loud extra colors
- Clean spacing, generous whitespace, card-based sections

## Files to Add / Modify

Add:
- `src/components/layout/Header.tsx`, `Footer.tsx`, `WhatsAppFloat.tsx`, `MobileCTABar.tsx`
- `src/components/Seo.tsx`, `SectionHeading.tsx`, `ServiceCard.tsx`, `TrustStrip.tsx`, `StatCard.tsx`, `GalleryGrid.tsx`, `ContactForm.tsx`
- `src/pages/Home.tsx`, `About.tsx`, `Services.tsx`, `ServiceCSR.tsx`, `ServiceSolar.tsx`, `ServiceProperty.tsx`, `Projects.tsx`, `Contact.tsx`
- `src/lib/site.ts` (constants: phones, email, address, whatsapp helper)
- `src/assets/*.jpg` (AI-generated)
- `public/favicon.svg`
- `public/sitemap.xml`

Modify:
- `src/index.css` — full design token rewrite to brand palette
- `tailwind.config.ts` — brand tokens, animations, fonts
- `src/App.tsx` — add all routes + `HelmetProvider` + global Header/Footer/WhatsAppFloat layout
- `src/pages/Index.tsx` — replace placeholder, re-export Home
- `index.html` — fonts, meta, title, favicon

## Out of Scope (confirm if you want them later)

- Storing leads in a database (you chose WhatsApp-only)
- Multi-language toggle (Hindi headlines stay inline; UI mostly English/Hinglish)
- Blog / news section
- Donation payment integration
