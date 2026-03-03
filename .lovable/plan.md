

# CV Generator: Preview-PDF Parity + Professional Features

## Problem Analysis
1. **Preview does not match downloaded PDF** -- html2pdf.js renders from an iframe but has margin, scale, and dimension differences from the live preview iframe
2. **No profile photo cropping/centering** -- uploaded photos render as-is with no positioning control
3. **No rich text editing** for Focus/Key Subjects (no bold, italic, alignment)
4. **No info (i) helper tooltips** on sections
5. **No header background color picker**
6. **No page count in PDF footer**
7. **Build error** -- `npm:openai@^4.52.5` resolution failure (from Supabase functions JS types, not our code)

---

## Part 1: Fix Preview = PDF (No Exceptions)

The root cause is that the preview `<iframe srcDoc={html}>` renders at whatever width the panel is, while html2pdf captures at `windowWidth: 794` with `margin: [12, 15, 12, 15]`. This creates layout differences.

**Fix in `src/lib/cvTemplateBuilder.ts`**:
- Set body width to `794px` (not `210mm`) so both preview and html2pdf use the exact same pixel width
- Add explicit `box-sizing: border-box` to container
- Remove `max-width: 800px` (use fixed `width: 794px` instead) so there's zero ambiguity

**Fix in `src/pages/AcademicCVGenerator.tsx` (generatePDF)**:
- Use `margin: 0` in html2pdf (margins are already in the template CSS via `padding: 20px`)
- Set `html2canvas.width: 794` and `html2canvas.windowWidth: 794` explicitly
- Add `html2canvas.scrollY: 0` and `html2canvas.scrollX: 0` to prevent scroll offset issues
- Set iframe width to exactly `794px` (matching body width)
- The preview iframe should also be constrained to `794px` width inside its container, scaled down with CSS `transform: scale()` to fit the panel

**Fix preview iframe scaling**:
- Wrap the preview iframe in a container that calculates `scale = containerWidth / 794`
- Apply `transform: scale(${scale})` and `transform-origin: top left` so the preview is a perfect miniature of the PDF
- This guarantees pixel-perfect match between what you see and what you download

**Fix in `src/hooks/useGenerateEuropassCV.ts`** (authenticated version):
- Same margin and dimension fixes as above

---

## Part 2: Profile Photo Positioning Controls

Add simple crop/position controls to the photo upload:
- **Object Position selector**: dropdown with options "Center", "Top", "Bottom" (maps to CSS `object-position: center/top/bottom`)
- **Zoom slider**: range input 100%-200% that sets the photo `transform: scale()` inside a circular overflow-hidden container
- Store these as extra state fields (`photoPosition`, `photoZoom`)
- Update `buildCVHtml` to apply `object-position` style on the `profile-pic-circle` img tag
- The photo circle already has `object-fit: cover` and `border-radius: 50%` so this will properly center the face

---

## Part 3: Rich Text Mini-Toolbar for Key Subjects / Focus

Add a lightweight inline formatting toolbar (NOT a full WYSIWYG editor -- keep it simple and non-detectable):
- Small toolbar above the "Key Subjects / Focus" textarea with buttons: **B** (bold), *I* (italic), alignment (left/center/right)
- Use a `contenteditable` div instead of plain `<Input>` for these fields
- On format button click, wrap selected text in `<strong>` or `<em>` tags
- Store the value as simple HTML (the template already renders HTML via `innerHTML`)
- Update `buildCVHtml` to NOT escape HTML in `key_subjects` field (use raw insertion with sanitization for dangerous tags only)
- Keep it minimal -- no colors, no font sizes, just bold/italic/alignment

**Fields that get this toolbar**:
- Key Subjects / Focus (in Education)
- Description (in Work Experience)
- Custom section item descriptions

---

## Part 4: Info (i) Helper Tooltips

Add a small `(i)` icon next to every section title that shows a tooltip on click/hover:
- Use the existing `Tooltip` component from shadcn/ui
- Helper text per section:
  - **Personal Information**: "Include all details as they appear on your passport. This helps universities verify your identity."
  - **Education & Training**: "List degrees in reverse chronological order. Include ECTS/credit equivalents and grading scale."
  - **Research Publications**: "Include peer-reviewed papers, conference proceedings, and working papers. Use standard citation format."
  - **Work Experience**: "Include relevant professional experience, internships, and research positions."
  - **Language Skills**: "Use CEFR levels (A1-C2). Mother tongue languages are listed separately."
  - **Certifications**: "Include relevant certificates, MOOCs, and professional development courses."
  - **Custom Sections**: "Add sections like Research Experience, Technical Skills, or Academic Projects."
  - **Recommendations**: "Include 2-3 academic referees who can vouch for your work."
- Render as a small `Info` icon (from lucide-react) next to each CardTitle

---

## Part 5: Header Background Color Picker

Add a color selector for the personal details header area:
- Dropdown/swatches with 5-6 professional solid colors:
  - White (default), Light Gray (#f5f5f5), Light Blue (#e8f0fe), Navy subtle (#f0f4f8), Cream (#faf8f5), Light Sage (#f0f5f0)
- Store as `headerBgColor` state
- Update `buildCVHtml` to accept an optional `headerBgColor` parameter
- Apply as `background-color` on the `.header-table` element
- Keep it subtle -- these are professional academic CVs

---

## Part 6: Page Count Footer

Add automatic page numbering to the PDF:
- In `buildCVHtml`, add a CSS `@page` footer rule (won't work in html2pdf)
- Instead, use html2pdf's `displayHeaderFooter` equivalent -- since html2pdf doesn't support this natively, add a footer div at the bottom of the HTML:
  ```html
  <div class="page-footer">Page 1 of X</div>
  ```
- For single-page CVs, show "Page 1 of 1"
- For multi-page: use CSS `counter-increment` with `@page` or add a JS-calculated page count after html2pdf renders
- Simpler approach: Add `displayHeaderFooter: true` in jsPDF options with page numbers, or add a manual footer line in the HTML template

---

## Part 7: Fix Build Error

The `npm:openai@^4.52.5` error comes from `@supabase/functions-js` types resolution, not from our code. Fix by adding a `deno.json` or updating the edge function imports. Since we don't use OpenAI, this is a transient type resolution issue.

**Fix**: Add `// @ts-nocheck` is already present in the edge function. The build error may be from the Supabase CLI type checking. We can add a `supabase/functions/deno.json` with `"nodeModulesDir": "auto"` or pin the `@supabase/functions-js` version.

---

## Files to Create/Modify

| File | Changes |
|---|---|
| `src/lib/cvTemplateBuilder.ts` | Fixed body width (794px), accept `headerBgColor` param, raw HTML for rich-text fields, photo `object-position`, page footer |
| `src/pages/AcademicCVGenerator.tsx` | Scaled preview iframe, photo position/zoom controls, rich text toolbar, info tooltips, color picker, margin fixes in generatePDF |
| `src/hooks/useGenerateEuropassCV.ts` | Same margin/dimension fixes for authenticated PDF generation |
| `supabase/functions/deno.json` | Add `"nodeModulesDir": "auto"` to fix OpenAI type resolution |

## What Does NOT Change
- Edge function logic (`generate-europass-cv/index.ts`)
- Template HTML file (`template_academic.html`) -- used only by edge function for authenticated users
- Database tables, RLS policies
- All other pages (Dashboard, Applications, etc.)
- Routing, authentication

