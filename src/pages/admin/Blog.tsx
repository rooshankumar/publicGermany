import { useEffect, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
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
    content_markdown: '',
    featured_image_url: '',
    status: 'draft' as BlogRow['status'],
  });

  const resetForm = () => {
    setFormValues({
      title: '',
      slug: '',
      category: 'general',
      content_markdown: '',
      featured_image_url: '',
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

  const openEditDialog = async (blog: BlogRow) => {
    setEditing(blog);
    // Fetch full content for editing
    try {
      const { data } = await (supabase as any)
        .from('blogs')
        .select('content_markdown, featured_image_url')
        .eq('id', blog.id)
        .single();
      setFormValues({
        title: blog.title,
        slug: blog.slug,
        category: blog.category,
        content_markdown: data?.content_markdown || '',
        featured_image_url: data?.featured_image_url || '',
        status: blog.status,
      });
    } catch {
      setFormValues({
        title: blog.title,
        slug: blog.slug,
        category: blog.category,
        content_markdown: '',
        featured_image_url: '',
        status: blog.status,
      });
    }
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

      setFormValues(prev => ({ ...prev, featured_image_url: publicUrl }));
      toast({ title: 'Image uploaded' });
    } catch (error: any) {
      toast({ title: 'Image upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
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
        content_markdown: formValues.content_markdown,
        featured_image_url: formValues.featured_image_url || null,
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
        toast({ title: 'Updated', description: 'Blog post updated' });
      } else {
        const { error } = await (supabase as any)
          .from('blogs')
          .insert([payload]);
        if (error) throw error;
        toast({ title: 'Created', description: 'Blog post created' });
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
      toast({ title: 'Deleted' });
      fetchBlogs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="space-y-3 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-bold text-foreground">Blog Management</h1>
            <p className="text-[10px] text-muted-foreground">Create and manage blog articles.</p>
          </div>
          <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-[11px]"><Plus className="mr-1 h-3.5 w-3.5" /> New Article</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4">
              <DialogHeader><DialogTitle className="text-sm">{editing ? 'Edit Article' : 'Create New Article'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-3 mt-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">Title</Label>
                  <Input value={formValues.title} onChange={(e) => handleTitleChange(e.target.value)} required placeholder="e.g., How to Apply for APS Certificate" className="h-7 text-xs" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1"><Label className="text-[11px]">URL Slug</Label><Input value={formValues.slug} onChange={(e) => setFormValues((prev) => ({ ...prev, slug: e.target.value }))} required className="h-7 text-xs" /></div>
                  <div className="space-y-1"><Label className="text-[11px]">Category</Label>
                    <Select value={formValues.category} onValueChange={(v) => setFormValues((prev) => ({ ...prev, category: v }))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORY_OPTIONS.map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-[11px]">Status</Label>
                    <Select value={formValues.status} onValueChange={(v) => setFormValues((prev) => ({ ...prev, status: v as BlogRow['status'] }))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1"><Label className="text-[11px]">Content (Markdown)</Label>
                  <Textarea value={formValues.content_markdown} onChange={(e) => setFormValues((prev) => ({ ...prev, content_markdown: e.target.value }))} rows={10} required placeholder="Write your blog content here in Markdown..." className="text-xs" />
                </div>
                <div className="space-y-1"><Label className="text-[11px]">Featured Image</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="h-7 text-[10px]">
                      {uploadingImage ? 'Uploading…' : formValues.featured_image_url ? 'Change Image' : 'Upload Image'}
                    </Button>
                    {formValues.featured_image_url && <img src={formValues.featured_image_url} alt="Featured" className="h-8 w-8 rounded object-cover border" />}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFeaturedImageUpload} />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => { setShowDialog(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit" disabled={saving} size="sm" className="h-7 text-[11px]">{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Article'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-none"><CardContent className="p-0">
          {loading ? (
            <p className="text-xs text-muted-foreground p-3">Loading articles…</p>
          ) : blogs.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3">No articles yet. Create your first one.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] py-1.5">Title</TableHead>
                    <TableHead className="text-[10px] py-1.5">Category</TableHead>
                    <TableHead className="text-[10px] py-1.5">Status</TableHead>
                    <TableHead className="text-[10px] py-1.5">Published</TableHead>
                    <TableHead className="text-[10px] py-1.5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell className="font-medium max-w-[200px] truncate text-[11px] py-1.5">{blog.title}</TableCell>
                      <TableCell className="capitalize text-[10px] py-1.5">{blog.category.replace('-', ' ')}</TableCell>
                      <TableCell className="py-1.5">
                        <Badge variant={blog.status === 'published' ? 'default' : blog.status === 'scheduled' ? 'secondary' : 'outline'} className="text-[9px] px-1 py-0">{blog.status}</Badge>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground py-1.5">{blog.published_at ? new Date(blog.published_at).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="py-1.5">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(blog)} className="h-6 w-6"><Edit className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" asChild className="h-6 w-6"><a href={`/blog/${blog.slug}`} target="_blank"><ExternalLink className="h-3 w-3" /></a></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(blog)} className="h-6 w-6"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent></Card>
      </div>
    </Layout>
  );
}
