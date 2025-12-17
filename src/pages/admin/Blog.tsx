import { useEffect, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

interface BlogRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  status: 'draft' | 'published' | 'scheduled';
  read_time_minutes: number | null;
  published_at: string | null;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  { value: 'aps', label: 'APS' },
  { value: 'universities', label: 'Universities' },
  { value: 'visa', label: 'Visa' },
  { value: 'documents', label: 'Documents' },
  { value: 'language-exams', label: 'Language & Exams' },
  { value: 'finance', label: 'Finance & Blocked Account' },
  { value: 'general', label: 'General' },
];

const STATUS_OPTIONS: BlogRow['status'][] = ['draft', 'published', 'scheduled'];

export default function AdminBlog() {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<BlogRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formValues, setFormValues] = useState({
    title: '',
    slug: '',
    category: 'general',
    excerpt: '',
    content_markdown: '',
    featured_image_url: '',
    seo_title: '',
    seo_description: '',
    tags: '',
    status: 'draft' as BlogRow['status'],
  });

  const resetForm = () => {
    setFormValues({
      title: '',
      slug: '',
      category: 'general',
      excerpt: '',
      content_markdown: '',
      featured_image_url: '',
      seo_title: '',
      seo_description: '',
      tags: '',
      status: 'draft',
    });
    setEditing(null);
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('blogs')
        .select('id, title, slug, category, excerpt, status, read_time_minutes, published_at, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBlogs((data || []) as BlogRow[]);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openNewDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (blog: BlogRow) => {
    setEditing(blog);
    setFormValues({
      title: blog.title,
      slug: blog.slug,
      category: blog.category,
      excerpt: blog.excerpt || '',
      content_markdown: '',
      featured_image_url: '',
      seo_title: '',
      seo_description: '',
      tags: '',
      status: blog.status,
    });
    setShowDialog(true);
  };

  const handleTitleChange = (value: string) => {
    setFormValues((prev) => ({
      ...prev,
      title: value,
      slug: prev.slug || value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    }));
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const ext = file.name.split('.').pop();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `blog-images/${Date.now()}-${safeName}`;

      const { error: uploadError } = await (supabase as any).storage
        .from('resources')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = (supabase as any).storage
        .from('resources')
        .getPublicUrl(filePath);

      const publicUrl = data?.publicUrl as string | undefined;
      if (!publicUrl) throw new Error('Could not get public URL for image');

      setFormValues(prev => ({
        ...prev,
        featured_image_url: publicUrl,
      }));

      toast({ title: 'Image uploaded', description: 'Featured image updated for this article.' });
    } catch (error: any) {
      toast({ title: 'Image upload failed', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const wordCount = formValues.content_markdown
        ? formValues.content_markdown.split(/\s+/).filter(Boolean).length
        : 0;
      const readTime = wordCount ? Math.max(1, Math.round(wordCount / 200)) : null;

      const payload: any = {
        title: formValues.title.trim(),
        slug: formValues.slug.trim(),
        category: formValues.category,
        excerpt: formValues.excerpt || null,
        content_markdown: formValues.content_markdown,
        featured_image_url: formValues.featured_image_url || null,
        seo_title: formValues.seo_title || null,
        seo_description: formValues.seo_description || null,
        tags: formValues.tags
          ? formValues.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : null,
        read_time_minutes: readTime,
        status: formValues.status,
      };

      if (formValues.status === 'published' && !editing) {
        payload.published_at = new Date().toISOString();
      }

      if (editing) {
        const { error } = await (supabase as any)
          .from('blogs')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Blog post updated successfully' });
      } else {
        const { error } = await (supabase as any)
          .from('blogs')
          .insert([payload]);
        if (error) throw error;
        toast({ title: 'Created', description: 'Blog post created successfully' });
      }

      setShowDialog(false);
      resetForm();
      fetchBlogs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (blog: BlogRow) => {
    const ok = window.confirm(`Delete blog: "${blog.title}"?`);
    if (!ok) return;
    try {
      const { error } = await (supabase as any)
        .from('blogs')
        .delete()
        .eq('id', blog.id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Blog post deleted' });
      fetchBlogs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Blog Management</h1>
            <p className="text-muted-foreground">
              Create and manage publicgermany blog articles for students.
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="mr-2 h-4 w-4" />
                New Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Article' : 'Create New Article'}</DialogTitle>
                <DialogDescription>
                  Write and publish blogs to help students understand the Germany process.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formValues.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formValues.slug}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formValues.category}
                      onValueChange={(value) => setFormValues((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formValues.status}
                      onValueChange={(value) =>
                        setFormValues((prev) => ({ ...prev, status: value as BlogRow['status'] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Short Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formValues.excerpt}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, excerpt: e.target.value }))}
                    maxLength={220}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content (Markdown)</Label>
                  <Textarea
                    id="content"
                    value={formValues.content_markdown}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, content_markdown: e.target.value }))}
                    rows={12}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Featured Image</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage
                        ? 'Uploading…'
                        : formValues.featured_image_url
                        ? 'Change Image'
                        : 'Upload Image'}
                    </Button>
                    {formValues.featured_image_url && (
                      <img
                        src={formValues.featured_image_url}
                        alt="Featured"
                        className="h-12 w-12 rounded object-cover border"
                      />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFeaturedImageUpload}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formValues.tags}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, tags: e.target.value }))}
                    placeholder="APS, visa, blocked account"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={formValues.seo_title}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, seo_title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDesc">SEO Description</Label>
                  <Textarea
                    id="seoDesc"
                    value={formValues.seo_description}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, seo_description: e.target.value }))}
                    maxLength={300}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDialog(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Article'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Blog Articles</CardTitle>
            <CardDescription>Draft, publish, and maintain all blog posts.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading articles…</p>
            ) : blogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No articles yet. Create your first one.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Read Time</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogs.map((blog) => {
                      const published = blog.published_at
                        ? new Date(blog.published_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : null;
                      return (
                        <TableRow key={blog.id}>
                          <TableCell className="font-medium max-w-xs truncate">{blog.title}</TableCell>
                          <TableCell className="capitalize text-xs">{blog.category.replace('-', ' ')}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                blog.status === 'published'
                                  ? 'default'
                                  : blog.status === 'scheduled'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-[11px] capitalize"
                            >
                              {blog.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {blog.read_time_minutes ? `${blog.read_time_minutes} min` : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {published || '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditDialog(blog)}
                                aria-label="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                asChild
                                aria-label="Preview"
                              >
                                <a
                                  href={`/blog/${blog.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(blog)}
                                aria-label="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
