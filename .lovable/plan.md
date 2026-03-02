

# CV Generator Production Fix + UI Improvements

## Problem Summary
1. **PDF is blank** -- The `buildCVHtml()` function produces valid HTML but html2pdf renders a blank page because the iframe height is fixed at 1200px and the container element may not be found properly
2. **Route rename** -- `/academic-cv-generator` needs to become `/europass-cv`
3. **Missing sections** -- No custom/additional sections (Research Experience, Technical Skills, Academic Projects, LOR)
4. **No profile pic / signature upload** on the public generator page
5. **No live preview** while filling in details
6. **No save/history** functionality
7. **Services + Applications use popup dialogs** instead of inline forms
8. **Student dashboard** needs to be more data-dense (Excel-inspired)

---

## Part 1: Fix Blank PDF

The blank PDF issue is caused by html2pdf targeting `.container` inside the iframe but the iframe dimensions and rendering timing are insufficient.

**Fix in `src/lib/cvTemplateBuilder.ts`**:
- Add explicit `padding: 20px` to the container div so content isn't clipped
- Add `width: 210mm` (A4 width) to body for proper print layout

**Fix in `src/pages/AcademicCVGenerator.tsx` (generatePDF function)**:
- Increase iframe dimensions to `width:210mm; height:auto; min-height:297mm`
- Target `iframeDoc.body` instead of `.container` for html2pdf capture
- Increase render wait from 800ms to 1200ms for image loading
- Set `html2canvas.windowWidth: 794` (A4 width in px at 96dpi)

**Fix in `src/hooks/useGenerateEuropassCV.ts`** (authenticated version):
- Same html2pdf option fixes as above

---

## Part 2: Route Rename

- Change route from `/academic-cv-generator` to `/europass-cv` in `src/App.tsx`
- Add redirect: `/academic-cv-generator` -> `/europass-cv` for SEO preservation
- Update all links referencing the old route (in `src/pages/Index.tsx`)
- Update page title/meta to "Free Europass CV Generator for Germany"

---

## Part 3: Custom Sections (Research Experience, Technical Skills, Academic Projects, LOR)

**Add to `src/lib/cvTemplateBuilder.ts`**:
- New interface `CVCustomSection` with `title: string` and `items: { label: string; description?: string }[]`
- New interface `CVRecommendation` with `name, designation, institution, email, contact`
- Update `buildCVHtml()` signature to accept `customSections` and `recommendations` arrays
- Render custom sections as bullet-list entries between Certifications and Signature
- Render Recommendations/LOR section with name, designation, institution, contact info

**Add to `src/pages/AcademicCVGenerator.tsx` (public page)**:
- "Custom Sections" card with ability to add sections (title + items with label/description)
- Pre-suggested section titles: Research Experience, Technical Skills, Academic Projects
- "Recommendations / Referees" card with fields: name, designation, institution, email, contact

**Update edge function** (`supabase/functions/generate-europass-cv/index.ts`):
- Already handles `profile_additional_sections` and `profile_recommendations` from DB
- Ensure the template renders them correctly (already does -- just need template alignment)

---

## Part 4: Profile Photo & Signature Upload (Public Page)

Add to the Personal Information card in `AcademicCVGenerator.tsx`:
- **Profile Photo**: File input that reads image as base64 data URL, stores in `personal.avatar_url`
- **Signature**: File input that reads image as base64 data URL, stores in `personal.signature_url`
- Small preview thumbnails next to each upload
- No server upload needed -- stays client-side as data URLs embedded in the HTML

---

## Part 5: Live Preview

Add a split-panel layout on desktop (form left, preview right):
- Use an `<iframe srcDoc={html}>` that updates in real-time as the user types
- Debounce the HTML regeneration (300ms) to avoid excessive re-renders
- On mobile: show a "Preview" toggle button that opens a full-screen preview overlay
- The preview uses the exact same `buildCVHtml()` function so what-you-see-is-what-you-download

---

## Part 6: Save & History

After PDF generation, show an inline prompt:
- If user is logged in: auto-save CV data to a new `cv_history` concept using `profile_additional_sections` (reuse existing tables)
- If user is NOT logged in: show a CTA banner "Sign up to save your CV" linking to `/auth`
- For registered users on the Profile page: the existing CV generation card already works with saved data

**No new database tables needed** -- the public page is stateless (data in browser), and logged-in users already have their data in profile tables.

---

## Part 7: Inline Forms (Replace Popups)

**`src/pages/Applications.tsx`**:
- Replace the "Add Application" Dialog with a collapsible inline form at the top of the page
- Use `Collapsible` component (already imported) with a card containing the form fields
- Same form fields, just rendered inline instead of in a modal

**`src/pages/ServicesNew.tsx`**:
- Replace the service request Dialog with an inline expandable panel
- When user clicks "Request Services", expand an inline card below the button with timeline, details fields, and submit button
- Remove the `Dialog` import and `showRequestDialog` state, replace with `showInlineForm` boolean

---

## Part 8: Student Dashboard Cleanup

Redesign `src/pages/Dashboard.tsx` for data density:

- **Remove** the large circular icon stat cards -- replace with a single-row compact stats bar:
  ```
  Profile: 80% | Documents: 12 | Applications: 5 (3 submitted) | Services
  ```
- **Remove** the QuickLinks section (redundant with nav)
- **Keep** nearest deadline card but make it more compact (single line)
- **Keep** contracts section but make it denser
- **Add** a compact "Recent Activity" list showing last 3-5 events (document uploads, application status changes)
- Overall: reduce from ~5 visual sections to 3 (stats bar, deadline/alerts, contracts)

---

## Files to Create/Modify

| File | Changes |
|---|---|
| `src/lib/cvTemplateBuilder.ts` | Add CVCustomSection, CVRecommendation interfaces; update buildCVHtml with custom sections, recommendations, fix container styling |
| `src/pages/AcademicCVGenerator.tsx` | Full rewrite: live preview, photo/signature upload, custom sections, recommendations, inline form, fix PDF generation, save prompt |
| `src/App.tsx` | Rename route to `/europass-cv`, add redirect from old path |
| `src/pages/Index.tsx` | Update link to `/europass-cv` |
| `src/hooks/useGenerateEuropassCV.ts` | Fix html2pdf options (windowWidth, body target) |
| `src/pages/Dashboard.tsx` | Compact stats bar, remove QuickLinks, add activity list |
| `src/pages/Applications.tsx` | Replace add Dialog with inline collapsible form |
| `src/pages/ServicesNew.tsx` | Replace request Dialog with inline expandable panel |

## What Does NOT Change
- All Supabase tables, RLS, edge functions logic
- Edge function `generate-europass-cv/index.ts` (already handles all sections)
- Template HTML file (template_academic.html)
- Admin pages
- Authentication flow
- All other student pages (Documents, Profile, Payments)

