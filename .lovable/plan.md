

# Professional Eligibility Evaluation Engine + Welcome Email Fix

## Problem Summary
1. The current eligibility check is a basic checklist with generic pass/fail logic -- not professional or university-aligned
2. The PDF report looks like a school report card, not an academic screening tool
3. The APS logic has a bug (shows fail even when `has_aps_certificate = true` in some cases)
4. Welcome emails are queued in `emails_outbox` but **never sent** -- no processor exists to pick them up and call the `send-email` edge function

---

## Part 1: Professional Eligibility Evaluation Engine

### New Evaluation Framework (3-Layer System)

**Layer 1 -- Academic Core Eligibility (Hard Filters)**

| Check | Logic |
|---|---|
| Degree Recognition | 3-year vs 4-year, ECTS equivalent >= 180 |
| German Grade Conversion | Formula: `1 + 3 * (MaxGrade - StudentGrade) / (MaxGrade - PassingGrade)` with classification (1.0-2.5 Competitive, 2.6-3.0 Acceptable, 3.1-3.5 Risk, >3.5 Low Chance) |
| ECTS Evaluation | Compare student credits against 180 ECTS standard |
| Language Compliance | IELTS threshold check with nuanced messaging (meets most vs top-tier) |
| APS Logic Fix | Only mandatory if `country_of_education` includes India; properly reads `has_aps_certificate` boolean |

**Layer 2 -- Profile Strength Index (Weighted Scoring)**

| Parameter | Weight |
|---|---|
| CGPA Strength | 25% |
| Subject Relevance (degree field vs intended course) | 25% |
| English Proficiency | 15% |
| Work Experience | 10% |
| Degree Duration/Credits | 10% |
| German Language | 10% |
| APS Status | 5% |

Generates a total score (0-100) with classification:
- 85-100: Strong Candidate
- 70-84: Competitive
- 55-69: Moderate
- Below 55: Needs Improvement

**Layer 3 -- Overall Assessment**

Combines hard filter results with profile strength score to produce:
- Preliminary Status (e.g., "Academically Eligible -- Minor Gaps Identified")
- Admission Probability Estimate (High / Moderate to High / Moderate / Low)
- Personalized Improvement Recommendations

### Professional PDF Template

Redesign the PDF to match the quality of the existing contract and payment bill templates:

- **Header**: publicgermany branding with logo, German flag accent bars, watermark
- **Student Overview section**: Name, Degree, Intended Course, Intake, Evaluation Date
- **Section 1 -- Academic Recognition**: Degree validity, ECTS equivalent, duration (table format)
- **Section 2 -- Grade Evaluation**: CGPA, German equivalent grade, classification with visual indicator
- **Section 3 -- Language Compliance**: IELTS/TOEFL assessment, German level
- **Section 4 -- Mandatory Requirements**: APS status, country-specific checks
- **Section 5 -- Profile Strength Index**: Weighted score breakdown with individual parameter scores
- **Section 6 -- Overall Classification**: Preliminary status, admission probability, improvement recommendations
- **Footer**: Professional disclaimer, publicgermany branding

### UI Changes (In-App Display)

The on-screen evaluation card will also be upgraded:
- Show German grade conversion prominently
- Display Profile Strength Score as a percentage with progress bar
- Show sectioned results instead of flat checklist
- Improvement recommendations section

### Files to Modify/Create
- `src/lib/eligibilityEngine.ts` -- New file: all evaluation logic, grade conversion, scoring algorithms
- `src/lib/eligibilityPDFTemplate.ts` -- New file: professional HTML template for PDF generation (matching contract/bill style)
- `src/components/EligibilityEvaluation.tsx` -- Rewrite: use new engine, new UI with sections and score display
- `src/pages/Profile.tsx` -- Minor: pass full profile data including `country_of_education`

---

## Part 2: Welcome Email Processing

### Problem
The `handle_new_user` trigger correctly inserts into `emails_outbox`, but nothing processes those rows. All welcome emails are stuck as `pending`.

### Solution
Create a new edge function `process-outbox` that:
1. Reads pending rows from `emails_outbox`
2. Calls the existing `send-email` edge function (Brevo) for each
3. Updates status to `sent` with `sent_at` timestamp on success, or `error` on failure
4. Can be triggered manually or via cron

Then update the `handle_new_user` trigger to also directly call the `send-email` function via `pg_net` (or simply have the edge function process the outbox periodically).

**Simpler approach**: Create a `process-outbox` edge function and have the admin dashboard include a "Process Outbox" button, plus ensure the welcome email is sent immediately by also calling `send-email` directly from the trigger using `pg_net` HTTP extension.

### Files to Create/Modify
- `supabase/functions/process-outbox/index.ts` -- New edge function that processes pending emails
- `supabase/config.toml` -- Add JWT config for the new function

---

## Technical Details

### German Grade Conversion Formula

```text
German Grade = 1 + 3 * (Max - Student) / (Max - Pass)

For Indian 10-point scale: Max = 10, Pass = 4
For Indian percentage: Max = 100, Pass = 40

Example: CGPA 9.0 -> 1 + 3*(10-9)/(10-4) = 1.5 (Highly Competitive)
Example: CGPA 7.0 -> 1 + 3*(10-7)/(10-4) = 2.5 (Competitive)
```

### Profile Strength Scoring

```text
Each parameter scored 0-10, then:
Total = (CGPA_score * 0.25) + (Subject_score * 0.25) + (IELTS_score * 0.15) 
      + (Work_score * 0.10) + (Duration_score * 0.10) + (German_score * 0.10) 
      + (APS_score * 0.05)
Final percentage = Total * 10
```

### APS Logic Fix

```text
IF country_of_education contains "India" AND has_aps_certificate != true 
  THEN status = "Required - Not obtained"
ELSE IF country_of_education contains "India" AND has_aps_certificate = true
  THEN status = "Verified"
ELSE 
  THEN status = "Not applicable for your country"
```

