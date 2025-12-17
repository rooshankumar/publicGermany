import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import logos from '@/assets/logos.png';

interface Blog {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  content_markdown: string;
  featured_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[] | null;
  read_time_minutes: number | null;
  status: string;
  published_at: string | null;
  updated_at: string | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await (supabase as any)
          .from('blogs')
          .select('*')
          .eq('slug', slug)
          .single();
        if (error) throw error;
        setPost(data as Blog);
      } catch (e: any) {
        setError(e.message || 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const headings = useMemo(() => {
    if (!post?.content_markdown) return [] as { id: string; text: string }[];
    const lines = post.content_markdown.split('\n');
    const result: { id: string; text: string }[] = [];
    lines.forEach((line) => {
      const match = line.match(/^#{2,3}\s+(.*)$/);
      if (match) {
        const text = match[1].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        result.push({ id, text });
      }
    });
    return result;
  }, [post?.content_markdown]);

  const renderContent = () => {
    if (!post) return null;
    const lines = post.content_markdown.split('\n');
    return lines.map((line, idx) => {
      const headingMatch = line.match(/^(#{2,3})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length; // 2 or 3
        const text = headingMatch[2].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const Tag = level === 2 ? 'h2' : 'h3';
        return (
          <Tag
            key={idx}
            id={id}
            className={
              level === 2
                ? 'text-2xl font-semibold mt-8 mb-3 scroll-mt-24'
                : 'text-xl font-semibold mt-6 mb-2 scroll-mt-24'
            }
          >
            {text}
          </Tag>
        );
      }

      if (!line.trim()) {
        return <br key={idx} />;
      }

      return (
        <p key={idx} className="mb-3 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  const publishedDate = post?.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const lastUpdatedDate = post?.updated_at
    ? new Date(post.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="w-full py-3 px-4 md:px-6 bg-background/95 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0" aria-label="Back to home">
            <div className="h-10 w-10 rounded-md overflow-hidden shrink-0">
              <img src={logos} alt="publicgermany logo" className="h-full w-full object-contain object-center" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-lg tracking-tight whitespace-nowrap">publicgermany</span>
              <span className="text-[11px] text-muted-foreground">Blog</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-foreground/90">
            <Link to="/" className="hover:text-primary whitespace-nowrap">Home</Link>
            <Link to="/services" className="hover:text-primary whitespace-nowrap">Services</Link>
            <Link to="/resources" className="hover:text-primary whitespace-nowrap">Resources</Link>
            <Link to="/blog" className="text-primary whitespace-nowrap">Blog</Link>
            <Link to="/converter" className="hover:text-primary whitespace-nowrap">Grade Converter</Link>
            <Link to="/contact" className="hover:text-primary whitespace-nowrap">Contact</Link>
          </nav>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {loading && <p className="text-sm text-muted-foreground">Loading article…</p>}
          {error && !loading && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && !post && <p className="text-sm text-muted-foreground">Article not found.</p>}

          {post && (
            <div className="space-y-8">
              <div className="space-y-3">
                <Badge variant="secondary" className="capitalize text-xs">
                  {post.category.replace('-', ' ')}
                </Badge>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{post.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>By publicgermany Team</span>
                  {publishedDate && <span>• Published {publishedDate}</span>}
                  {lastUpdatedDate && lastUpdatedDate !== publishedDate && (
                    <span>• Updated {lastUpdatedDate}</span>
                  )}
                  {post.read_time_minutes && <span>• {post.read_time_minutes} min read</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)] gap-10 lg:gap-12">
                <article className="prose prose-sm sm:prose-base max-w-none">
                  {post.featured_image_url && (
                    <div className="mb-6 rounded-lg overflow-hidden">
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}
                  {renderContent()}

                  <Card className="mt-10 border-primary/30 bg-primary/5">
                    <CardContent className="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">Need personalized help?</p>
                        <p className="text-sm text-muted-foreground">
                          Get 1:1 support with APS, universities, and visas for your Germany journey.
                        </p>
                      </div>
                      <Button asChild>
                        <Link to="/auth">Get Started Free</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </article>

                <aside className="space-y-6">
                  {headings.length > 0 && (
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                          Table of contents
                        </p>
                        <nav className="space-y-1 text-sm">
                          {headings.map((h) => (
                            <a
                              key={h.id}
                              href={`#${h.id}`}
                              className="block text-muted-foreground hover:text-primary"
                            >
                              {h.text}
                            </a>
                          ))}
                        </nav>
                      </CardContent>
                    </Card>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                          Tags
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </aside>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default BlogPost;
