// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync, readFileSync, existsSync } from "fs"
import { resolve } from "path"

const BASE_URL = "https://publicgermany.vercel.app"

interface SitemapEntry {
  path: string
  lastmod?: string
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: string
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/services", changefreq: "weekly", priority: "0.9" },
  { path: "/blog", changefreq: "daily", priority: "0.8" },
  { path: "/europass-cv", changefreq: "monthly", priority: "0.7" },
  { path: "/converter", changefreq: "monthly", priority: "0.7" },
  { path: "/tools/grade-converter", changefreq: "monthly", priority: "0.6" },
  { path: "/german-course", changefreq: "monthly", priority: "0.6" },
  { path: "/reviews", changefreq: "weekly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/help", changefreq: "monthly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms", changefreq: "yearly", priority: "0.2" },
]

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>
  if (existsSync(".env")) {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !env[m[1]]) env[m[1]] = m[2].trim()
    }
  }
  return env
}

async function fetchBlogEntries(): Promise<SitemapEntry[]> {
  const env = loadEnv()
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    console.warn("Supabase env not found; sitemap will include static routes only")
    return []
  }
  try {
    const res = await fetch(
      `${url}/rest/v1/blogs?select=slug,updated_at,created_at&status=eq.published`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    )
    if (!res.ok) throw new Error(`blogs fetch failed: ${res.status}`)
    const rows = (await res.json()) as { slug: string; updated_at?: string; created_at?: string }[]
    return rows
      .filter((r) => r.slug)
      .map((r) => ({
        path: `/blog/${r.slug}`,
        lastmod: (r.updated_at || r.created_at || "").slice(0, 10) || undefined,
        changefreq: "monthly" as const,
        priority: "0.7",
      }))
  } catch (e) {
    console.warn("Could not fetch blog posts for sitemap:", e)
    return []
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  )

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n")
}

const blogEntries = await fetchBlogEntries()
const entries = [...staticEntries, ...blogEntries]
writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries))
console.log(`sitemap.xml written (${entries.length} entries, ${blogEntries.length} blog posts)`)
