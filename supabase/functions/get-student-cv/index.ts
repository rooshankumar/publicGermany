// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return new Response(JSON.stringify({ error: "Missing service configuration" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getUser();
    if (claimsErr || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const callerId = claimsData.user.id;
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Authorize: self, admin, or editor with profile permission
    if (callerId !== user_id) {
      const { data: callerProfile } = await supabase
        .from("profiles").select("role").eq("user_id", callerId).single();

      const isAdmin = callerProfile?.role === "admin";
      let isEditor = false;
      if (!isAdmin && callerProfile?.role === "editor") {
        const { data: perm } = await supabase
          .from("editor_permissions")
          .select("can_view_profile")
          .eq("editor_user_id", callerId)
          .eq("student_user_id", user_id)
          .single();
        isEditor = perm?.can_view_profile === true;
      }

      if (!isAdmin && !isEditor) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // fetch profile base
    const { data: profile, error: profileErr } = await supabase
      .from("profiles").select("*").eq("user_id", user_id).single();
    if (profileErr) throw profileErr;

    // fetch related lists in parallel
    const [educations, work, languages, certs, pubs, recs, extras] = await Promise.all([
      supabase.from("profile_educations").select("*").eq("profile_id", user_id).order("order_index"),
      supabase.from("profile_work_experiences").select("*").eq("profile_id", user_id).order("order_index"),
      supabase.from("profile_language_skills").select("*").eq("profile_id", user_id),
      supabase.from("profile_certifications").select("*").eq("profile_id", user_id).order("order_index"),
      supabase.from("profile_publications").select("*").eq("profile_id", user_id).order("order_index"),
      supabase.from("profile_recommendations").select("*").eq("profile_id", user_id).order("order_index"),
      supabase.from("profile_additional_sections").select("*").eq("profile_id", user_id).order("order_index"),
    ]);

    return new Response(JSON.stringify({
      profile,
      educations: educations.data || [],
      work_experiences: work.data || [],
      language_skills: languages.data || [],
      certifications: certs.data || [],
      publications: pubs.data || [],
      recommendations: recs.data || [],
      additional_sections: extras.data || [],
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("get-student-cv error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});