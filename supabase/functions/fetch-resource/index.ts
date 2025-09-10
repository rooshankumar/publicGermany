// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      throw new Error('URL is required')
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      throw new Error('Invalid URL format')
    }

    // Fetch the resource
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'publicgermany Resource Fetcher 1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch resource: ${response.status}`)
    }

    const html = await response.text()
    
    // Basic content extraction
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled'
    
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    const description = descMatch ? descMatch[1].trim() : 'No description available'
    
    // Extract main content (remove scripts, styles, etc.)
    let content = html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    // Limit content length
    if (content.length > 1000) {
      content = content.substring(0, 1000) + '...'
    }

    return new Response(
      JSON.stringify({
        title,
        description,
        content,
        url,
        fetchedAt: new Date().toISOString()
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch resource'
      }),
      {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      },
    )
  }
})