// supabase/functions/generate-academic-cv-pdf/index.ts
// @ts-nocheck

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { buildCVHtml } from "./cvTemplateBuilder.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function embedMeta(html: string, data: unknown): string {
  const json    = JSON.stringify({ generator: "publicgermany-cv", version: 1, data });
  const bytes   = new TextEncoder().encode(json);
  let   binary  = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const tag     = `<div id="pgcvmeta" aria-hidden="true" style="display:none;">PGCVMETA:${encoded}:ENDPGCVMETA</div>`;
  return html.includes("</body>") ? html.replace("</body>", `${tag}</body>`) : html + tag;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")    return jsonError("Method not allowed", 405);

  try {
    const body = await req.json();
    const {
      personal, educations, workExperiences, languages,
      publications, certifications, customSections,
      recommendations, buildOptions, file_name,
    } = body;

    if (!personal?.full_name) return jsonError("Missing required field: full_name", 400);

    const html = buildCVHtml(
      personal,
      educations       ?? [],
      workExperiences  ?? [],
      languages        ?? [],
      publications     ?? [],
      certifications   ?? [],
      customSections   ?? [],
      recommendations  ?? [],
      buildOptions     ?? {},
    );

    console.log(`Generated HTML length: ${html.length} characters`);
    if (html.length < 500) {
      console.error("HTML seems too short, might be incomplete.");
    }

    const metaData = {
      personal: { ...personal, avatar_url: undefined, signature_url: undefined },
      educations, workExperiences, languages, publications,
      certifications, customSections, recommendations, buildOptions,
    };

    const finalHtml = embedMeta(html, metaData);
    console.log(`Final HTML with Meta length: ${finalHtml.length} characters`);
    console.log("HTML Preview (first 500 chars):", finalHtml.slice(0, 500));

    const apiKey = Deno.env.get("PDFSHIFT_API_KEY")?.trim();
    if (!apiKey) return jsonError("PDFSHIFT_API_KEY not configured", 500);

    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), 60_000);

    let resp: Response;
    try {
      console.log("Calling PDFShift API...");
      resp = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
        method:  "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Basic " + btoa("api:" + apiKey)
        },
        body: JSON.stringify({
          source:                    finalHtml,
          sandbox:                   false,
          use_print:                 false,
          delay:                     4000,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!resp.ok) {
      const err = await resp.text().catch(() => resp.statusText);
      console.error("PDFShift error:", err);
      return jsonError(`PDF conversion failed: ${err}`, 502);
    }

    const pdf      = new Uint8Array(await resp.arrayBuffer());
    const filename = typeof file_name === "string" && file_name.trim()
      ? file_name.trim() : "cv.pdf";

    return new Response(pdf, {
      status:  200,
      headers: {
        ...corsHeaders,
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return jsonError(err instanceof Error ? err.message : "Unexpected error", 500);
  }
});