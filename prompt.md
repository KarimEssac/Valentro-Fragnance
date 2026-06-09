# 🚀 Valentro Fragrance E-Commerce — AI Agent Master Prompt

---

## 🎯 MISSION

You are building **Valentro**, a luxury fragrance e-commerce platform. This is a full-stack web application hosted entirely on **Hostinger** under a **single domain**, where the frontend and backend share the same origin. You will scaffold the complete project architecture, database schema, and implement **only the Hero Section of the Home Page** as the first deliverable. Everything must be production-grade, clean, and extensible.

---

## 🏗️ TECH STACK

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Auth** | NextAuth.js (JWT strategy) |
| **Styling** | Tailwind CSS + CSS Variables |
| **Fonts** | Google Fonts: `Libre Caslon Text` (serif) + `Hanken Grotesk` (sans) |
| **i18n** | `next-intl` (Arabic + English, RTL support) |
| **Image Storage** | Local `/public/uploads` (Hostinger-compatible) |
| **Deployment** | Hostinger VPS — single domain, single Next.js server |
| **API** | Next.js Route Handlers (`/app/api/...`) — no separate backend |

---

## 📁 PROJECT STRUCTURE

Scaffold the following folder structure completely before writing any component:

```
valentro/
├── app/
│   ├── [locale]/                    # next-intl locale wrapper (ar | en)
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Home — hero section only for now
│   │   ├── admin/                   # Custom admin dashboard (protected)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # Dashboard overview
│   │   │   ├── announcements/       # Manage top banner offers
│   │   │   ├── fragrances/          # CRUD fragrances
│   │   │   ├── collections/         # CRUD collections
│   │   │   ├── coupons/             # Manage coupons
│   │   │   └── orders/              # View orders
│   │   └── (storefront)/
│   │       ├── fragrances/[slug]/   # Product detail page (scaffold only)
│   │       ├── collections/[slug]/  # Collection page (scaffold only)
│   │       ├── cart/                # Cart page (scaffold only)
│   │       └── account/             # Customer account (scaffold only)
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── admin/
│       │   ├── announcements/
│       │   ├── fragrances/
│       │   ├── collections/
│       │   └── coupons/
│       ├── storefront/
│       │   ├── fragrances/
│       │   └── collections/
│       └── orders/
├── components/
│   ├── storefront/
│   │   ├── layout/
│   │   │   ├── AnnouncementBar.tsx  # ← IMPLEMENT THIS
│   │   │   ├── Navbar.tsx           # ← IMPLEMENT THIS
│   │   │   └── Footer.tsx           # scaffold only
│   │   └── home/
│   │       └── HeroSection.tsx      # ← IMPLEMENT THIS (main deliverable)
│   ├── admin/
│   │   └── (scaffold shells only)
│   └── ui/
│       └── (shared primitives: Button, Input, Badge, etc.)
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── i18n.ts
├── messages/
│   ├── en.json
│   └── ar.json
├── prisma/
│   └── schema.prisma               # ← FULL SCHEMA (see below)
├── public/
│   └── uploads/
├── middleware.ts                    # next-intl + auth route protection
└── tailwind.config.ts
```

---

## 🗄️ FULL DATABASE SCHEMA (Prisma)

Write the complete `prisma/schema.prisma` with all models below. Use `postgresql` as the provider.

### Models to implement:

#### `User` (customers)
- `id`, `email` (unique), `passwordHash`, `name`, `phone`, `role` (enum: `CUSTOMER | ADMIN`), `createdAt`
- Relations: orders, appliedCoupons

#### `Address`
- `id`, `userId`, `label`, `line1`, `line2`, `city`, `country`, `isDefault`

#### `Announcement` (top banner offers)
- `id`, `textEn`, `textAr`, `linkUrl` (optional), `isActive` (boolean), `startAt` (DateTime?), `endAt` (DateTime?), `bgColor`, `textColor`, `createdAt`
- Only one announcement is active at a time — enforce this in the API, not the DB

#### `Collection`
- `id`, `slug` (unique), `nameEn`, `nameAr`, `descriptionEn`, `descriptionAr`, `coverImage`, `position` (Int), `isPublished`, `createdAt`
- Relations: fragrances (many-to-many via `FragranceCollection`)

#### `Fragrance`
- `id`, `slug` (unique), `nameEn`, `nameAr`, `taglineEn`, `taglineAr`, `descriptionEn`, `descriptionAr`
- `gender` (enum: `HIM | HER | UNISEX`)
- `scentProfile` (enum: `VANILLA | MUSK | OUD | FLORAL | WOODY | CITRUS | AQUATIC | SPICY | POWDERY | GOURMAND`)
- `avoidIf` (String[] — e.g., "Allergic to musk", "Prefers fresh scents") — stored as text array
- `bestFor` (String[] — e.g., "Evening events", "Date night")
- `sillage` (enum: `SOFT_LANDING | MODERATE | NOTICEABLE | STRONG | ENORMOUS | FILLS_THE_ROOM`)
- `longevity` (Int — hours, 1–24)
- `isPublished`, `isFeatured`, `position`
- `createdAt`, `updatedAt`
- Relations: variants, ingredients, images, collections

#### `FragranceIngredient`
- `id`, `fragranceId`, `nameEn`, `nameAr`, `note` (enum: `TOP | MIDDLE | BASE`)

#### `FragranceImage`
- `id`, `fragranceId`, `url`, `altEn`, `altAr`, `position`, `isPrimary`

#### `FragranceVariant` (sizes)
- `id`, `fragranceId`, `sizeML` (Int — e.g., 30, 50, 100), `price` (Decimal), `compareAtPrice` (Decimal?), `stock` (Int), `sku` (unique)

#### `Coupon`
- `id`, `code` (unique), `type` (enum: `PERCENTAGE | FIXED`), `value` (Decimal)
- `minOrderAmount` (Decimal?), `maxUses` (Int?), `usedCount` (Int default 0)
- `isActive`, `expiresAt` (DateTime?), `createdAt`
- `applicableTo` (enum: `ALL | SPECIFIC_USERS`) — for per-account offers
- Relations: users (many-to-many for specific user targeting)

#### `Order`
- `id`, `userId`, `status` (enum: `PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED`)
- `paymentMethod` (enum: `CASH_ON_DELIVERY`)
- `subtotal`, `discountAmount`, `total` (all Decimal)
- `couponId` (optional FK), `addressSnapshot` (Json — snapshot of address at time of order)
- `notes`, `createdAt`, `updatedAt`
- Relations: items

#### `OrderItem`
- `id`, `orderId`, `variantId`, `fragranceNameEn`, `fragranceNameAr`, `sizeML`, `quantity`, `unitPrice`, `totalPrice`

---

## 🎨 DESIGN SYSTEM

Implement the following CSS variables in `app/globals.css` and configure `tailwind.config.ts` to expose them as Tailwind tokens:

```css
:root {
  --color-bg:          #000000;
  --color-surface:     #131410;
  --color-surface-mid: #20201c;
  --color-surface-hi:  #2a2a26;
  --color-gold:        #DEBC7E;
  --color-gold-muted:  #c6a45a;
  --color-umber:       #402A08;
  --color-parchment:   #F9F6F0;
  --color-on-surface:  #e5e2dc;
  --color-outline:     #4c4546;

  --font-serif:  'Libre Caslon Text', Georgia, serif;
  --font-sans:   'Hanken Grotesk', system-ui, sans-serif;

  --radius: 0px;                    /* Sharp corners everywhere */
  --container-max: 1440px;
  --gutter: 24px;
}
```

**Tailwind config** must extend with: `colors.gold`, `colors.umber`, `colors.parchment`, `colors.surface`, `fontFamily.serif`, `fontFamily.sans`.

---

## ✅ WHAT TO IMPLEMENT NOW (Phase 1)

Implement these three components to pixel-perfect fidelity. Everything else is scaffolded with `// TODO` comments.

---

### 1. `AnnouncementBar.tsx`

- Fetches the **active announcement** from `/api/storefront/announcements/active` on the server side
- Renders a full-width bar **above the navbar**
- Text is centered, uses `label-caps` style: `font-sans text-[11px] font-semibold tracking-[0.12em] uppercase`
- Background and text color come from the `Announcement` DB record (`bgColor`, `textColor`) — default to `var(--color-umber)` bg and `var(--color-gold)` text
- If a `linkUrl` exists, the entire bar is a clickable link
- If no active announcement exists, renders nothing (`null`)
- Supports i18n — renders `textAr` in Arabic locale and `textEn` in English locale
- Has a dismiss button (×) that hides the bar for the session (client-side only, no DB call)

---

### 2. `Navbar.tsx`

Replicate the navbar from the design screenshot exactly:

- **Logo:** "VALENTRO" in `font-serif text-2xl tracking-widest text-gold` — left-aligned
- **Nav links (center):** Collections · Fragrances · The Atelier · Our Story — `font-sans text-sm font-semibold tracking-[0.08em] uppercase text-parchment`
- Active link has a **gold underline** (2px, offset 4px)
- **Right side:** Cart icon (thin stroke bag SVG) with item count badge in gold
- **Behavior:**
  - At top of page: fully transparent background, links in parchment
  - On scroll (>80px): `backdrop-blur-md bg-surface/80` with a 1px bottom border in `var(--color-umber)`
  - Transition: smooth 300ms ease
- **Mobile:** hamburger menu (thin stroke), full-screen overlay menu sliding in from right, gold close button
- **RTL:** When locale is `ar`, mirror the layout (logo right, links center, cart left). Use `dir` attribute from `next-intl`.

---

### 3. `HeroSection.tsx`

This is the **main deliverable**. Replicate the hero from the screenshot with full fidelity:

**Layout:**
- Full viewport height (`h-screen`) full-bleed section, black background
- A **carousel/slider** with left (`‹`) and right (`›`) arrow buttons at the vertical center of the screen edges — thin stroke, color gold, 40×40px, no background, no border
- Scroll indicator: a vertical line (`1px`, gold, 60px tall) centered at the bottom of the hero with a subtle animated pulse

**Background:**
- The giant brand name **"VALENTRO"** rendered as a **display headline** in the center of the hero
- Font: `font-serif`, size `clamp(80px, 12vw, 160px)`, color `rgba(229, 226, 220, 0.07)` — ghost text, almost invisible
- Layered behind everything: an animated **golden smoke / particle swirl** effect
  - Implement using pure CSS `@keyframes` + SVG filters (feTurbulence + feDisplacementMap) OR an HTML5 Canvas animation
  - The smoke should be amber-gold (`#DEBC7E` at low opacity), flowing organically, slow (20–40s loop), subtle — evoking real perfume smoke trails
  - This is the **signature element** of the design — give it craft and attention

**Carousel slides** (seed with 2 placeholder slides):
Each slide contains:
- A **product bottle image** (use a placeholder: `https://placehold.co/300x500/131410/DEBC7E?text=Valentro`) positioned to the right-center, with a subtle vertical float animation (`translateY 0 → -12px`, 4s ease-in-out infinite)
- Left side: stacked copy block
  - Eyebrow: collection name in `label-caps` gold
  - Headline: fragrance name in `font-serif text-5xl md:text-7xl text-parchment leading-tight`
  - Tagline: 1-line description in `font-sans font-light text-on-surface text-lg`
  - Two CTA buttons (side by side):
    - Primary: `DISCOVER` — gold background, black text, 0px radius, `px-8 py-3 text-sm font-semibold tracking-widest uppercase`
    - Secondary: `ADD TO CART` — ghost button, gold 1px border, gold text

**Transitions:** Slides fade + subtle lateral slide (300ms ease). Auto-advance every 6 seconds, paused on hover.

---

## 🌐 i18n Setup

- Configure `next-intl` with locales `['en', 'ar']`, default locale `'en'`
- `middleware.ts` handles locale detection and redirects
- Add placeholder translation keys to `messages/en.json` and `messages/ar.json` for:
  - All navbar links
  - Hero CTA buttons ("Discover", "Add to Cart")
  - Admin dashboard section titles
- When locale is `ar`: apply `dir="rtl"` to `<html>`, and use RTL-safe Tailwind classes (`ms-`, `me-`, `ps-`, `pe-`)

---

## 🔐 Auth & Admin Protection

- Configure `NextAuth.js` with **Credentials provider** (email + bcrypt password)
- Session strategy: JWT
- Admin routes (`/[locale]/admin/**`) are protected via `middleware.ts` — redirect to `/login` if no valid session with `role: ADMIN`
- Storefront routes are public
- Seed script (`prisma/seed.ts`) must create:
  - 1 admin user: `admin@valentro.com` / `Admin1234!`
  - 1 sample announcement: `"LIMITED TIME OFFER: DISCOVER OUR PRIVATE COLLECTION"` (active, umber bg, gold text)
  - 2 sample collections and 3 sample fragrances with full variant + ingredient data

---

## 🧩 API Routes to Scaffold (with correct types, no implementation needed except announcement)

Fully implement:
- `GET /api/storefront/announcements/active` → returns the single active `Announcement` or `null`

Scaffold with correct request/response types and a `// TODO` body:
- `GET/POST /api/admin/announcements`
- `PUT/DELETE /api/admin/announcements/[id]`
- `GET/POST /api/admin/fragrances`
- `PUT/DELETE /api/admin/fragrances/[id]`
- `GET/POST /api/admin/collections`
- `GET/POST /api/admin/coupons`
- `PUT/DELETE /api/admin/coupons/[id]`
- `POST /api/orders` (place order — COD)
- `GET /api/storefront/fragrances` (with filters: collection, gender, scentProfile)
- `GET /api/storefront/fragrances/[slug]`

---

## 🧱 UI Primitives to Scaffold in `/components/ui/`

Create these with proper TypeScript props interfaces but minimal implementation (enough to import without errors):

- `Button.tsx` — variants: `primary | ghost | danger`, sizes: `sm | md | lg`
- `Input.tsx` — bottom-border only, label above, focus state in gold
- `Badge.tsx` — for scent notes / tags, Deep Umber border, label-caps
- `ScaleIndicator.tsx` — vertical line scale for Sillage (used on product pages later)
- `Modal.tsx` — centered overlay, black bg, 1px gold border

---

## ⚙️ Environment Variables

Create `.env.example` with:
```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/valentro
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## 📋 DELIVERABLES CHECKLIST

When done, confirm each item:

- [ ] `prisma/schema.prisma` — all models defined
- [ ] `prisma/seed.ts` — admin user + sample data
- [ ] `tailwind.config.ts` — design tokens wired
- [ ] `app/globals.css` — CSS variables
- [ ] `middleware.ts` — i18n + admin auth guard
- [ ] `messages/en.json` + `messages/ar.json` — placeholder keys
- [ ] `lib/prisma.ts`, `lib/auth.ts`, `lib/i18n.ts`
- [ ] `AnnouncementBar.tsx` — fully implemented
- [ ] `Navbar.tsx` — fully implemented (transparent → blur on scroll, RTL, mobile)
- [ ] `HeroSection.tsx` — fully implemented (smoke animation, carousel, slide copy, CTAs)
- [ ] `GET /api/storefront/announcements/active` — fully implemented
- [ ] All other API route files — scaffolded with types
- [ ] All UI primitives — scaffolded
- [ ] `package.json` with all required dependencies listed
- [ ] `README.md` with setup instructions for Hostinger deployment

---

## 🚫 CONSTRAINTS

1. **No external UI libraries** (no shadcn, no MUI, no Chakra). Build all UI from scratch with Tailwind.
2. **No separate backend server**. Everything runs through Next.js Route Handlers on the same domain.
3. **0px border-radius** on all interactive elements (buttons, inputs, cards, modals) — this is a hard brand rule.
4. **No vibrant colors** outside the defined palette. No blues, greens, reds unless it's an error state.
5. **RTL must work** — test Arabic locale visually mirrors the English layout.
6. **The smoke animation must be CSS/Canvas only** — no Three.js, no GSAP, no heavy animation libraries.
7. **TypeScript strict mode** — no `any` types.

---

## 🎬 START HERE

Begin by:
1. Running `npx create-next-app@latest valentro --typescript --tailwind --app --src-dir no`
2. Installing dependencies: `prisma @prisma/client next-auth next-intl bcryptjs`  
3. Writing `prisma/schema.prisma` in full
4. Setting up `tailwind.config.ts` and `globals.css`
5. Then implement the three Phase 1 components in order: `AnnouncementBar` → `Navbar` → `HeroSection`

Do not skip steps. Do not stub the three Phase 1 components — implement them completely.