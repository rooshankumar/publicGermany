
# iOS-style Redesign — publicgermany

You've given me two reference HTMLs (homepage + services) and asked me to rebuild the entire app around that design system, keeping all logic and routes untouched. That's a large surface area, so I want to do it in clear phases and confirm the approach before touching every page.

## Design system (applied globally, phase 0)

Locked from your HTML. No emojis in UI chrome — replaced with `lucide-react` icons (Check, Search, ChevronRight, Menu, etc.). Emojis stay only where they're content (testimonial names, blog text).

- Background: `#FFFFFF` / `#F5F5F7` / `#EFEFF1`
- Text: `#1D1D1F` (label) / `#6E6E73` (label2) / `#AEAEB2` (label3)
- Accent red: `#B23A2E` (hover `#8f2f24`)
- Accent gold: `#B8862E` (used only for "most popular" tag + highlight)
- Success green: `#3F8558`
- Radii: cards 14–20px, buttons full pill (`rounded-full`)
- Font: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif` — set on `body`, overrides any current serif/decorative fonts
- Nav: sticky, `backdrop-blur` + 78% white
- List pattern: one rounded container, thin dividers between rows (FAQs, service lists, settings sections)
- Cards: white or `bg2`, subtle 1px border, no gradients, no glow

These become CSS tokens in `src/index.css` + `tailwind.config.ts` (extending, not replacing, existing shadcn tokens so all the existing UI keeps working).

## Phase 1 — Foundation (do first)

1. Add design tokens to `index.css` (HSL vars: `--pg-bg`, `--pg-bg2`, `--pg-label`, `--pg-accent`, `--pg-gold`, `--pg-green`, `--pg-sep`) and matching Tailwind colors under a `pg` namespace (already partially there — I'll align it to the new palette).
2. Set the system font stack on `body` in `index.css`, remove any competing serif imports.
3. Rewrite `LandingHero`, `LandingFeatures`, `LandingHowItWorks`, `LandingFAQ`, `LandingFooter`, plus `Index.tsx` composition, to match `homepage.html` section-for-section: hero → features grid → testimonial scroll-snap carousel → 4-step process strip → pricing scroll-snap carousel → grouped FAQ list → dark final CTA → minimal footer. No comparison table.
4. Rebuild the logged-in `ServicesEntry.tsx` (and `ServicesNew.tsx` if that's the live one — I'll confirm from the router) to match `services.html`: sticky app bar, segmented Browse/Requests/Delivered, pricing carousel, individual-services grouped list with radio-style checkbox, live-total sticky bottom bar, search field. Wired to your existing services data + request handlers — no logic changes.

## Phase 2 — Shared shell

5. New `AppShell` / update `Layout.tsx` so every authenticated page uses the same iOS-style sticky app bar + avatar + hamburger (from `services.html`). Mobile bottom nav (`StudentMobileBottomNav`, `AdminMobileBottomNav`) restyled to match — flat white with blur, no gradients, lucide icons.
6. Restyle shadcn primitives that we use most (`button`, `card`, `input`, `tabs`, `accordion`, `dialog`, `badge`) via variants — no API changes, so no page needs to be rewritten to pick up the look.

## Phase 3 — Interior pages (bulk restyle, no logic changes)

Applied top-down as time allows, in this order:

- Dashboard
- Applications (student + admin)
- Documents
- Profile / StudentProfileForm
- Payments (student + admin)
- Blog + BlogPost
- Contact, Help, Privacy, Terms, Reviews, Resources
- Auth pages (Auth, ResetPassword)
- Admin pages (Students, Universities, Requests, PaymentStudents, Blog admin, etc.)

Each page: swap current wrapper cards/gradients for the new token classes, replace emoji chrome with lucide icons, convert vertical stacks of repeated rows into grouped-list cards where it matches your HTML pattern (FAQ, settings, service lists). Route paths and data queries stay identical.

## Out of scope

- Backend, RLS, edge functions, DB schema — untouched.
- Route names, URLs, auth flow — untouched.
- Content copy on interior pages — untouched unless the layout requires condensing.

## Technical notes

- Tailwind tokens go under a `pg.*` namespace so `bg-pg-bg2`, `text-pg-label`, `border-pg-sep`, `bg-pg-accent`, `text-pg-accent`, `bg-pg-gold` are usable everywhere. Existing shadcn semantic tokens (`--primary`, `--background`, etc.) will be re-pointed to the same palette so any un-touched component picks up the theme automatically.
- Carousels use native CSS `overflow-x-auto` + `scroll-snap` — no new dependency.
- Icons come from the already-installed `lucide-react`.
- Blur header uses Tailwind's `backdrop-blur` (already enabled).

## What I need from you

**One decision** before I start:

Do you want me to do Phase 1 (homepage + logged-in Services page + design tokens) as a single deliverable first — so you can review the exact look on the two reference pages — and then I proceed to Phases 2 and 3? Or do you want me to push through all three phases in one go and hand back the full app restyled at once (larger diff, slower to review)?

Reply "phased" or "all at once" and I'll start.
