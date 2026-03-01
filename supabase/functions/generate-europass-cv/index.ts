// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Format date to DD/MM/YYYY
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB");
}

// Escape HTML special characters
function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Render education entries for academic template
function renderEducations(educations: any[]): string {
  if (!educations || educations.length === 0) return "";
  
  return educations
    .map(
      (edu) => `
<div class="entry">
    <table class="entry-table">
        <tr>
            <td class="entry-title">${escapeHtml(edu.degree_title)} – ${escapeHtml(edu.field_of_study)}</td>
            <td class="entry-date">${edu.start_year} – ${edu.end_year}</td>
        </tr>
    </table>
    <div class="sub-info">${escapeHtml(edu.institution)}, ${escapeHtml(edu.country)}</div>
    ${edu.key_subjects ? `<ul class="list-style"><li>${escapeHtml(edu.key_subjects)}</li></ul>` : ""}
    <div class="academic-meta">
        Grade: ${escapeHtml(edu.final_grade)} / ${edu.max_scale} | Credits: ${edu.total_credits}${edu.thesis_title ? ` | Thesis: <em>${escapeHtml(edu.thesis_title)}</em>` : ""}
    </div>
</div>
`
    )
    .join("");
}

// Render work experience entries for academic template
function renderWorkExperiences(workExps: any[]): string {
  if (!workExps || workExps.length === 0) return "";
  
  return workExps
    .map(
      (work) => `
<div class="entry">
    <table class="entry-table">
        <tr>
            <td class="entry-title">${escapeHtml(work.job_title)}</td>
            <td class="entry-date">${formatDate(work.start_date)} – ${work.is_current ? "Present" : formatDate(work.end_date)}</td>
        </tr>
    </table>
    <div class="sub-info">${escapeHtml(work.organisation)}, ${escapeHtml(work.city_country)}</div>
    ${work.description ? `<div class="academic-meta">${escapeHtml(work.description)}</div>` : ""}
</div>
`
    )
    .join("");
}

// Render language skills table
function renderLanguagesTable(languages: any[]): string {
  if (!languages || languages.length === 0) return "";
  
  const nonMotherTongues = languages.filter((l) => !l.mother_tongue);
  if (nonMotherTongues.length === 0) return "";
  
  const rows = nonMotherTongues
    .map(
      (lang) => `
<tr>
<td>${escapeHtml(lang.language_name)}</td>
<td>${escapeHtml(lang.listening) || "—"}</td>
<td>${escapeHtml(lang.reading) || "—"}</td>
<td>${escapeHtml(lang.writing) || "—"}</td>
<td>${escapeHtml(lang.speaking) || "—"}</td>
</tr>
`
    )
    .join("");
  
  return `
<table class="lang-table">
<tr>
<th>Language</th>
<th>Listening</th>
<th>Reading</th>
<th>Writing</th>
<th>Speaking</th>
</tr>
${rows}
</table>
`;
}

// Render mother tongues
function renderMotherTongues(languages: any[]): string {
  if (!languages || languages.length === 0) return "";
  
  const motherTongues = languages
    .filter((l) => l.mother_tongue)
    .map((l) => escapeHtml(l.language_name))
    .join(", ");
  
  if (!motherTongues) return "";
  return `Mother tongue(s): ${motherTongues}<br><br>`;
}

// Render certifications as bullet list
function renderCertifications(certs: any[]): string {
  if (!certs || certs.length === 0) return "";
  
  return `<div class="bullet-list">
${certs
  .map(
    (cert) => `• ${escapeHtml(cert.title)} | ${escapeHtml(cert.institution)} | ${formatDate(cert.date)}${cert.certificate_url ? ` <a href="${escapeHtml(cert.certificate_url)}" target="_blank">Link</a>` : ""}`
  )
  .join("<br>")}
</div>`;
}

// Render publications for academic template
function renderPublications(pubs: any[]): string {
  if (!pubs || pubs.length === 0) return "";
  
  return pubs
    .map(
      (pub) => `
<div class="entry">
    <strong>${escapeHtml(pub.title)}</strong>
    <div class="academic-meta">${escapeHtml(pub.journal)} (${pub.year})${pub.doi_url ? `. <a href="${escapeHtml(pub.doi_url)}" target="_blank">${escapeHtml(pub.doi_url)}</a>` : ""}</div>
</div>
`
    )
    .join("");
}

// Render recommendations for academic template
function renderRecommendations(recs: any[]): string {
  if (!recs || recs.length === 0) return "";
  
  return recs
    .map(
      (rec) => `
<div class="entry">
    <strong>${escapeHtml(rec.name)}</strong> – ${escapeHtml(rec.designation)}
    <div class="sub-info">${escapeHtml(rec.institution)}</div>
    <div class="academic-meta">
        ${rec.email ? `Email: <a href="mailto:${escapeHtml(rec.email)}">${escapeHtml(rec.email)}</a> | ` : ""}
        ${rec.contact ? `Contact: ${escapeHtml(rec.contact)}` : ""}
        ${rec.lor_link ? ` | <a href="${escapeHtml(rec.lor_link)}" target="_blank">Letter of Recommendation</a>` : ""}
    </div>
</div>
`
    )
    .join("");
}

// Render additional sections
function renderAdditionalSections(sections: any[]): string {
  if (!sections || sections.length === 0) return "";
  
  return sections
    .map(
      (section) => `
<div class="section-title">${escapeHtml(section.section_title)}</div>
<div class="entry">
    ${escapeHtml(section.section_content)}
</div>
`
    )
    .join("");
}

// Render digital & research skills
function renderDigitalResearchSkills(skills: any): string {
  if (!skills) return "";
  
  const technicalSkills = Array.isArray(skills.technical_skills)
    ? skills.technical_skills.join(", ")
    : skills.technical_skills || "";
  const researchMethods = Array.isArray(skills.research_methods)
    ? skills.research_methods.join(", ")
    : skills.research_methods || "";
  const tools = Array.isArray(skills.tools) ? skills.tools.join(", ") : skills.tools || "";
  
  return `
Technical Skills: ${escapeHtml(technicalSkills)}<br>
Research Methods: ${escapeHtml(researchMethods)}<br>
Tools: ${escapeHtml(tools)}
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    console.log("📋 PDF Generation started for user:", user_id);

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing service configuration" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch profile and all CV data
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    console.log("👤 Profile fetch result:", { profile: profile?.full_name, error: profileErr?.message });

    if (profileErr) throw profileErr;

    // Fetch user email from auth.users table
    const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(user_id);
    
    if (userErr) {
      console.warn("Could not fetch user email:", userErr);
    }

    const userEmail = user?.email || "";

    const [educations, workExps, languages, certs, pubs, recs, sections] = await Promise.all([
      supabase.from("profile_educations").select("*").eq("profile_id", user_id).order("order_index"),
      supabase.from("profile_work_experiences").select("*").eq("profile_id", user_id).order("order_index"),
      supabase.from("profile_language_skills").select("*").eq("profile_id", user_id),
      supabase.from("profile_certifications").select("*").eq("profile_id", user_id).order("order_index"),
      supabase.from("profile_publications").select("*").eq("profile_id", user_id).order("order_index"),
      supabase.from("profile_recommendations").select("*").eq("profile_id", user_id).order("order_index"),
      supabase.from("profile_additional_sections").select("*").eq("profile_id", user_id).order("order_index"),
    ]);

    console.log("📚 Data fetch results:", {
      educations: educations.data?.length || 0,
      workExps: workExps.data?.length || 0,
      languages: languages.data?.length || 0,
      certs: certs.data?.length || 0,
      pubs: pubs.data?.length || 0,
      recs: recs.data?.length || 0,
      sections: sections.data?.length || 0,
    });

    // Import academic template (with fallback to professional template)
    let templateText: string;
    try {
      // Try reading academic template first
      templateText = await Deno.readTextFile("./template_academic.html");
    } catch {
      // Fallback to professional template
      try {
        templateText = await Deno.readTextFile("./template_professional.html");
      } catch {
        // Ultimate fallback: fetch from GitHub
        templateText = await fetch(
          "https://raw.githubusercontent.com/rooshankumar/publicGermany/main/supabase/functions/generate-europass-cv/template_professional.html"
        ).then((r) => r.text());
      }
    }

    // Build HTML by replacing placeholders
    let html = templateText;

    // Replace simple fields
    html = html.replace(/{{FULL_NAME}}/g, escapeHtml(profile.full_name));
    html = html.replace(/{{PASSPORT_NUMBER}}/g, escapeHtml(profile.passport_number));
    html = html.replace(/{{DATE_OF_BIRTH}}/g, formatDate(profile.date_of_birth));
    html = html.replace(/{{PLACE_OF_BIRTH}}/g, escapeHtml(profile.place_of_birth));
    html = html.replace(/{{NATIONALITY}}/g, escapeHtml(profile.nationality));
    html = html.replace(/{{GENDER}}/g, escapeHtml(profile.gender));
    html = html.replace(/{{PHONE}}/g, escapeHtml(profile.phone));
    html = html.replace(/{{EMAIL}}/g, escapeHtml(userEmail));
    
    // Handle profile picture with conditional rendering
    if (profile.avatar_url) {
      html = html.replace(/{{#PROFILE_PIC}}/g, "");
      html = html.replace(/{{\/PROFILE_PIC}}/g, "");
      html = html.replace(/{{PROFILE_PIC}}/g, escapeHtml(profile.avatar_url));
    } else {
      html = html.replace(/{{#PROFILE_PIC}}[\s\S]*?{{\/PROFILE_PIC}}/g, "");
    }
    
    // Handle LinkedIn URL with conditional rendering
    if (profile.linkedin_url) {
      html = html.replace(/{{#LINKEDIN}}{{LINKEDIN_URL}}{{\/LINKEDIN}}/g, 
        ` | <a href="${escapeHtml(profile.linkedin_url)}" target="_blank">${escapeHtml(profile.linkedin_url)}</a>`);
    } else {
      html = html.replace(/{{#LINKEDIN}}{{LINKEDIN_URL}}{{\/LINKEDIN}}/g, '');
    }
    
    html = html.replace(/{{ADDRESS}}/g, escapeHtml(
      [
        profile.address_street,
        profile.address_city,
        profile.address_postal_code,
        profile.address_country,
      ]
        .filter(Boolean)
        .join(", ")
    ));
    
    // Signature handling
    if (profile.signature_url) {
      html = html.replace(/{{#SIGNATURE_URL}}/g, "");
      html = html.replace(/{{\/SIGNATURE_URL}}/g, "");
      html = html.replace(/{{SIGNATURE_URL}}/g, escapeHtml(profile.signature_url));
    } else {
      html = html.replace(/{{#SIGNATURE_URL}}[\s\S]*?{{\/SIGNATURE_URL}}/g, "");
    }
    
    html = html.replace(/{{SIGNATURE_DATE}}/g, formatDate(profile.signature_date));

    // Replace array sections
    html = html.replace("{{EDUCATIONS}}", renderEducations(educations.data));
    
    if (workExps.data && workExps.data.length > 0) {
      html = html.replace("{{#WORK_EXPERIENCES_SECTION}}", "");
      html = html.replace("{{/WORK_EXPERIENCES_SECTION}}", "");
      html = html.replace("{{WORK_EXPERIENCES}}", renderWorkExperiences(workExps.data));
    } else {
      html = html.replace(/{{#WORK_EXPERIENCES_SECTION}}[\s\S]*?{{\/WORK_EXPERIENCES_SECTION}}/g, "");
    }

    html = html.replace("{{MOTHER_TONGUES}}", renderMotherTongues(languages.data));
    html = html.replace("{{LANGUAGES_TABLE}}", renderLanguagesTable(languages.data));

    if (profile.digital_research_skills) {
      html = html.replace("{{#DIGITAL_RESEARCH_SKILLS}}", "");
      html = html.replace("{{/DIGITAL_RESEARCH_SKILLS}}", "");
      html = html.replace("{{DIGITAL_RESEARCH_SKILLS}}", renderDigitalResearchSkills(profile.digital_research_skills));
    } else {
      html = html.replace(/{{#DIGITAL_RESEARCH_SKILLS}}[\s\S]*?{{\/DIGITAL_RESEARCH_SKILLS}}/g, "");
    }

    if (certs.data && certs.data.length > 0) {
      html = html.replace("{{#CERTIFICATIONS_SECTION}}", "");
      html = html.replace("{{/CERTIFICATIONS_SECTION}}", "");
      html = html.replace("{{CERTIFICATIONS}}", renderCertifications(certs.data));
    } else {
      html = html.replace(/{{#CERTIFICATIONS_SECTION}}[\s\S]*?{{\/CERTIFICATIONS_SECTION}}/g, "");
    }

    if (pubs.data && pubs.data.length > 0) {
      html = html.replace("{{#PUBLICATIONS_SECTION}}", "");
      html = html.replace("{{/PUBLICATIONS_SECTION}}", "");
      html = html.replace("{{PUBLICATIONS}}", renderPublications(pubs.data));
    } else {
      html = html.replace(/{{#PUBLICATIONS_SECTION}}[\s\S]*?{{\/PUBLICATIONS_SECTION}}/g, "");
    }

    if (recs.data && recs.data.length > 0) {
      html = html.replace("{{#RECOMMENDATIONS_SECTION}}", "");
      html = html.replace("{{/RECOMMENDATIONS_SECTION}}", "");
      html = html.replace("{{RECOMMENDATIONS}}", renderRecommendations(recs.data));
    } else {
      html = html.replace(/{{#RECOMMENDATIONS_SECTION}}[\s\S]*?{{\/RECOMMENDATIONS_SECTION}}/g, "");
    }

    html = html.replace("{{ADDITIONAL_SECTIONS}}", renderAdditionalSections(sections.data));

    console.log("✅ HTML generated, length:", html.length);
    console.log("📄 Sample HTML snippet (first 500 chars):", html.substring(0, 500));

    // Calculate content metrics for page estimation
    const contentLength = html.length;
    const estimatedPages = Math.ceil(contentLength / 3200); // ~3200 chars per A4 page

    return new Response(JSON.stringify({ 
      html, 
      success: true,
      metadata: {
        estimatedPages,
        contentLength,
        mayExceedTwoPages: estimatedPages > 2,
        sections: {
          education: educations.data?.length || 0,
          work: workExps.data?.length || 0,
          languages: languages.data?.length || 0,
          certifications: certs.data?.length || 0,
          publications: pubs.data?.length || 0,
          recommendations: recs.data?.length || 0,
        }
      }
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("❌ generate-europass-cv error", err);
    return new Response(JSON.stringify({ error: err?.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
