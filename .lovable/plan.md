# Repair the public policy pages

## What will change

- Remove the stray JSX fragment in the Privacy Policy so the page compiles.
- Complete the Refund and Cancellation Policy with ROSHN GLOBAL’s verified business identity, cancellation timing, the existing non-refund rule after personalized work begins, the stated 5–7 business-day refund processing window, and the public support email.
- Make the Privacy Policy’s analytics and provider disclosures consistent with the current site: Lovable visitor analytics and click tracking are enabled, no consent banner or custom analytics events are present, and the site also uses Vercel Analytics, Supabase, EmailJS, Brevo, and optional YouTube/Google Drive embeds.
- Keep both policy pages public and lazy-loaded; do not change unrelated pages or integrations.

## Verification

- Confirm the project builds without errors.
- Open `/privacy` and `/refund-policy` in the running preview and confirm both render as public pages.