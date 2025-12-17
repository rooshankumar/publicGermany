import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import logos from '@/assets/logos.png';

interface BlogSummary {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  featured_image_url: string | null;
  read_time_minutes: number | null;
  published_at: string | null;
}

const BLOG_CATEGORIES: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'aps', label: 'APS' },
  { value: 'universities', label: 'Universities' },
  { value: 'visa', label: 'Visa' },
  { value: 'documents', label: 'Documents' },
  { value: 'language-exams', label: 'Language & Exams' },
  { value: 'finance', label: 'Finance & Blocked Account' },
  { value: 'general', label: 'General' },
];

const Blog = () => {
  const [posts, setPosts] = useState<BlogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('category') || 'all';

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = (supabase as any)
          .from('blogs')
          .select('id, title, slug, category, excerpt, featured_image_url, read_time_minutes, published_at')
          .eq('status', 'published')
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false });

        if (activeCategory !== 'all') {
          query = query.eq('category', activeCategory);
        }

        const { data, error } = await query;
        if (error) throw error;
        setPosts((data || []) as BlogSummary[]);
      } catch (e: any) {
        setError(e.message || 'Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [activeCategory]);

  const handleCategoryChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') {
      next.delete('category');
    } else {
      next.set('category', value);
    }
    setSearchParams(next, { replace: true });
  };

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
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 sm:space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Your Complete Guide to Study in Germany</h1>
            <p className="text-muted-foreground max-w-2xl">
              APS, universities, visas, timelines, mistakes, updates – deep‑dive articles written for Indian students
              planning their German education.
            </p>
            <div>
              <Button asChild size="sm" className="mt-1">
                <Link to="/auth">Start Your Journey Free</Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {BLOG_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-3 py-1 rounded-full text-xs sm:text-sm border transition-colors ${
                  activeCategory === cat.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-accent/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading && (
            <p className="text-sm text-muted-foreground mt-4">Loading articles…</p>
          )}

          {error && !loading && (
            <p className="text-sm text-destructive mt-4">{error}</p>
          )}

          {!loading && !error && posts.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">No articles yet in this category. Check back soon.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mt-4 sm:mt-6">
            {posts.map((post) => {
              const publishedDate = post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : null;

              return (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group h-full">
                  <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
                    {post.featured_image_url && (
                      <div className="h-40 w-full overflow-hidden rounded-t-lg">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {post.category.replace('-', ' ')}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {post.read_time_minutes ? `${post.read_time_minutes} min read` : ''}
                        </span>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4 flex-1 flex flex-col">
                      {post.excerpt && (
                        <CardDescription className="text-sm line-clamp-3 mb-3">
                          {post.excerpt}
                        </CardDescription>
                      )}
                      <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                        <span>{publishedDate}</span>
                        <span className="inline-flex items-center gap-1 text-primary text-xs">
                          Read more
                          <span aria-hidden>→</span>
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Blog;
