import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, Plus, Trash2, Edit2, Loader2, Play, Cloud, Globe, Users, ShieldCheck, ShieldAlert, Search, X, GripVertical } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Video {
  id: string;
  title: string;
  level: string;
  youtube_url?: string | null;
  video_id?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  order_index: number;
  created_at: string;
}

interface StudentAccess {
  user_id: string;
  has_access: boolean;
  status: string;
  expires_at: string | null;
  request_message: string | null;
  admin_message: string | null;
  updated_at: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const GermanCourseAdmin = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [students, setStudents] = useState<StudentAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'index' | 'newest' | 'oldest' | 'az'>('index');
  
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('A1');
  const [url, setUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoType, setVideoType] = useState<'youtube' | 'direct'>('youtube');

  const [editingAccess, setEditingAccess] = useState<{
    studentId: string;
    expires_at: string | null;
    status: string;
    admin_message: string;
  } | null>(null);

  const { toast } = useToast();

  const [studentSortOrder, setStudentSortOrder] = useState<'status' | 'date' | 'name'>('status');

  useEffect(() => {
    fetchVideos();
    fetchStudents();
  }, []);

  const [orderIndex, setOrderIndex] = useState(0);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('german_course_videos')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching videos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      // First, fetch all student profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .eq('role', 'student');

      if (profilesError) throw profilesError;

      // Second, fetch all access records
      const { data: accessRecords, error: accessError } = await supabase
        .from('german_course_access')
        .select('*');

      if (accessError) throw accessError;

      // Merge profiles with their access records (if any)
      const mergedStudents: StudentAccess[] = (profiles || []).map(profile => {
        const access = (accessRecords || []).find(a => a.user_id === profile.user_id);
        return {
          user_id: profile.user_id,
          has_access: access?.has_access ?? false,
          status: access?.status ?? 'none',
          expires_at: access?.expires_at ?? null,
          request_message: access?.request_message ?? null,
          admin_message: access?.admin_message ?? null,
          updated_at: access?.updated_at ?? null,
          profiles: {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          }
        };
      });

      // Sort by status priority: pending first, then alphabetical name
      const sorted = mergedStudents.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || '');
      });

      setStudents(sorted);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error fetching students",
        description: "Could not load the student list.",
        variant: "destructive",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleUpdateAccess = async (studentId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('german_course_access')
        .upsert({
          user_id: studentId,
          ...updates,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      toast({
        title: "Access Updated",
        description: "Student access has been successfully modified.",
      });
      fetchStudents();
    } catch (error) {
      console.error('Error updating access:', error);
      toast({
        title: "Update Failed",
        description: "Could not update student access.",
        variant: "destructive",
      });
    }
  };

  const extractVideoId = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1).split(/[?#]/)[0];
      }
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      }
      return null;
    } catch (e) {
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[7].length === 11) ? match[7] : null;
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.startsWith('http')) {
      toast({
        title: "Invalid URL",
        description: "Please provide a complete URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    let videoData: any = {
      title,
      level,
      order_index: orderIndex,
      thumbnail_url: thumbnailUrl || null,
    };

    if (videoType === 'youtube') {
      const videoId = extractVideoId(url);
      if (!videoId) {
        toast({
          title: "Invalid YouTube URL",
          description: "Please provide a valid YouTube link.",
          variant: "destructive",
        });
        return;
      }
      videoData.youtube_url = url;
      videoData.video_id = videoId;
      videoData.video_url = null;
    } else {
      videoData.video_url = url;
      videoData.youtube_url = null;
      videoData.video_id = null;
    }

    try {
      setIsSubmitting(true);
      if (editingVideo) {
        const { error } = await supabase
          .from('german_course_videos')
          .update(videoData)
          .eq('id', editingVideo.id);
        if (error) throw error;
        toast({ title: "Video updated successfully" });
      } else {
        const { error } = await supabase
          .from('german_course_videos')
          .insert([videoData]);
        if (error) throw error;
        toast({ title: "Video added successfully" });
      }
      setShowUploadForm(false);
      resetForm();
      fetchVideos();
    } catch (error: any) {
      toast({
        title: "Error saving video",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('german_course_videos')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Video deleted successfully" });
      fetchVideos();
    } catch (error: any) {
      toast({
        title: "Error deleting video",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (video: Video) => {
    setEditingVideo(video);
    setTitle(video.title);
    setLevel(video.level || 'A1');
    setUrl(video.youtube_url || video.video_url || '');
    setThumbnailUrl(video.thumbnail_url || '');
    setVideoType(video.youtube_url ? 'youtube' : 'direct');
    setOrderIndex(video.order_index || 0);
    setShowUploadForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingVideo(null);
    setTitle('');
    setLevel('A1');
    setUrl('');
    setThumbnailUrl('');
    setVideoType('youtube');
    setOrderIndex(0);
    setShowUploadForm(false);
  };

  const getSortedVideos = (vids: Video[]) => {
    return [...vids].sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'az':
          return a.title.localeCompare(b.title);
        case 'index':
        default:
          return (a.order_index || 0) - (b.order_index || 0);
      }
    });
  };

  const filteredStudents = students
    .filter(s => s.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (studentSortOrder === 'status') {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        if (a.status === 'approved' && b.status !== 'approved') return -1;
        if (a.status !== 'approved' && b.status === 'approved') return 1;
      } else if (studentSortOrder === 'date') {
        const dateA = new Date(a.updated_at || 0).getTime();
        const dateB = new Date(b.updated_at || 0).getTime();
        return dateB - dateA;
      }
      return (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || '');
    });

  return (
    <Layout>
      <div className="space-y-3 sm:space-y-4 -mt-3 sm:-mt-2 px-1 sm:px-0 pb-10">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">German Course</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-none">Lectures & Access</p>
          </div>
        </div>

        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8 p-0.5 bg-muted">
            <TabsTrigger value="videos" className="font-bold text-[10px] uppercase h-7">Lectures</TabsTrigger>
            <TabsTrigger value="access" className="font-bold text-[10px] uppercase h-7">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-2 pt-0">
            <div className="flex items-center justify-between gap-2 mt-1">
              <Button 
                size="sm" 
                variant={showUploadForm ? "ghost" : "default"}
                onClick={() => setShowUploadForm(!showUploadForm)} 
                className="h-7 text-[10px] font-bold px-2"
              >
                {showUploadForm ? <X className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                {showUploadForm ? "Close Form" : "Add Lecture"}
              </Button>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="h-7 px-2 rounded-md border border-input bg-background text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="index">Order (1st, 2nd...)</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="az">A-Z Title</option>
              </select>
            </div>

            {showUploadForm && (
              <Card className="border shadow-none bg-muted/30">
                <CardContent className="p-2">
                  <form onSubmit={handleSaveVideo} className="flex flex-wrap items-end gap-2">
                    <div className="flex-1 min-w-[120px] space-y-1">
                      <Label htmlFor="title" className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Title</Label>
                      <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="h-7 text-[11px] px-2" placeholder="Lecture title" />
                    </div>
                    <div className="w-12 space-y-1">
                      <Label htmlFor="order" className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Ord</Label>
                      <Input id="order" type="number" value={orderIndex} onChange={(e) => setOrderIndex(parseInt(e.target.value))} className="h-7 text-[11px] px-1" />
                    </div>
                    <div className="w-16 space-y-1">
                      <Label htmlFor="level" className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Level</Label>
                      <select id="level" value={level} onChange={(e) => setLevel(e.target.value)} className="w-full h-7 px-1 rounded-md border border-input bg-background text-[11px]">
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                      </select>
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Type</Label>
                      <select value={videoType} onChange={(e) => setVideoType(e.target.value as any)} className="w-full h-7 px-1 rounded-md border border-input bg-background text-[11px]">
                        <option value="youtube">YouTube</option>
                        <option value="direct">Direct</option>
                      </select>
                    </div>
                    <div className="flex-[2] min-w-[150px] space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">URL</Label>
                      <Input placeholder="Video Link" value={url} onChange={(e) => setUrl(e.target.value)} required className="h-7 text-[11px] px-2" />
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="h-7 text-[10px] px-2">X</Button>
                      <Button type="submit" size="sm" disabled={isSubmitting} className="h-7 text-[10px] px-3">
                        {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : (editingVideo ? 'Update' : 'Save')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-1.5 mt-2">
              {['A1', 'A2', 'B1'].map(lvl => {
                const levelVideos = getSortedVideos(videos.filter(v => v.level === lvl));
                if (levelVideos.length === 0) return null;
                return (
                  <div key={lvl} className="space-y-1">
                    <div className="flex items-center gap-2 px-1">
                      <div className="h-px flex-1 bg-border/50" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{lvl}</span>
                      <div className="h-px flex-1 bg-border/50" />
                    </div>
                    <div className="flex flex-col gap-1">
                      {levelVideos.map((video) => (
                        <Card key={video.id} className="p-1.5 border shadow-none hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-16 aspect-video bg-black rounded overflow-hidden shrink-0 relative group">
                              {video.youtube_url ? (
                                <img src={`https://img.youtube.com/vi/${video.video_id}/default.jpg`} className="w-full h-full object-cover opacity-80" alt="" />
                              ) : <div className="w-full h-full flex items-center justify-center"><Play className="h-3.5 w-3.5 text-muted-foreground" /></div>}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white"><Play className="h-3 w-3" /></Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-black aspect-video border-none">
                                    {video.youtube_url ? (
                                      <iframe src={`https://www.youtube.com/embed/${video.video_id}?autoplay=1`} className="w-full h-full" allowFullScreen />
                                    ) : (
                                      <iframe src={video.video_url?.replace('/view', '/preview')} className="w-full h-full border-0" allowFullScreen />
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono font-bold bg-muted px-1 rounded text-muted-foreground">#{video.order_index}</span>
                                <h3 className="text-[10px] font-bold truncate leading-tight">{video.title}</h3>
                              </div>
                              <p className="text-[8px] text-muted-foreground">{new Date(video.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEdit(video)}>
                                <Edit2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:text-destructive" onClick={() => handleDeleteVideo(video.id)}>
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
              {videos.length === 0 && (
                <div className="py-8 text-center border rounded-lg border-dashed bg-muted/20">
                  <p className="text-[10px] text-muted-foreground italic">No lectures found.</p>
                </div>
              )}
            </div>
            )}
          </TabsContent>

          <TabsContent value="access" className="outline-none">
            <Card className="border shadow-none rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
              <CardHeader className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider">Access</CardTitle>
                    <select 
                      value={studentSortOrder} 
                      onChange={(e) => setStudentSortOrder(e.target.value as any)}
                      className="h-6 px-1 rounded border border-input bg-background text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="status">By Status</option>
                      <option value="date">By Date</option>
                      <option value="name">By Name</option>
                    </select>
                  </div>
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-7 h-7 text-[10px]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                        <th className="text-left p-2 font-bold text-muted-foreground">User</th>
                        <th className="text-left p-2 font-bold text-muted-foreground">Msg/Status</th>
                        <th className="text-left p-2 font-bold text-muted-foreground hidden sm:table-cell">Expiry/Date</th>
                        <th className="text-right p-2 font-bold text-muted-foreground">Act</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {loadingStudents ? (
                        <tr><td colSpan={4} className="text-center py-6"><Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" /></td></tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">None</td></tr>
                      ) : (
                        filteredStudents.map((s) => (
                          <tr key={s.user_id} className={cn("hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors", s.status === 'pending' && "bg-amber-50/50 dark:bg-amber-950/10")}>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold overflow-hidden shrink-0">
                                  {s.profiles?.avatar_url ? <img src={s.profiles.avatar_url} className="h-full w-full object-cover" /> : (s.profiles?.full_name?.charAt(0) || 'U')}
                                </div>
                                <span className="font-bold truncate max-w-[80px] sm:max-w-none">{s.profiles?.full_name || 'User'}</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex flex-col gap-1">
                                <Badge variant={s.status === 'approved' ? 'default' : s.status === 'pending' ? 'secondary' : s.status === 'rejected' ? 'destructive' : 'outline'} className="text-[8px] px-1 py-0 h-4 w-fit leading-none">
                                  {s.status === 'none' ? 'NO' : s.status.substring(0, 3).toUpperCase()}
                                </Badge>
                                {s.request_message && (
                                  <p className="text-[9px] text-muted-foreground line-clamp-1 max-w-[120px] italic">
                                    "{s.request_message}"
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="p-2 hidden sm:table-cell">
                              <div className="flex flex-col text-[9px]">
                                <span className="font-medium">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '∞ Life'}</span>
                                {s.updated_at && (
                                  <span className="text-muted-foreground opacity-70">
                                    {new Date(s.updated_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-2 text-right">
                              <Dialog onOpenChange={(open) => {
                                if (open) {
                                  setEditingAccess({
                                    studentId: s.user_id,
                                    expires_at: s.expires_at,
                                    status: s.status,
                                    admin_message: s.admin_message || ''
                                  });
                                } else {
                                  setEditingAccess(null);
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-muted"><Edit2 className="h-3 w-3" /></Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[320px] p-4">
                                  {editingAccess && (
                                    <div className="space-y-3">
                                      <div className="space-y-0.5">
                                        <h2 className="text-sm font-bold tracking-tight">Access: {s.profiles?.full_name}</h2>
                                        <p className="text-[10px] text-muted-foreground">
                                          Current Status: <span className="font-bold uppercase">{editingAccess.status}</span>
                                        </p>
                                        {editingAccess.expires_at && (
                                          <p className="text-[10px] text-muted-foreground">Ends: {new Date(editingAccess.expires_at).toLocaleDateString()}</p>
                                        )}
                                      </div>
                                      
                                      {s.request_message && (
                                        <div className="bg-muted p-2 rounded text-[11px] italic leading-tight">"{s.request_message}"</div>
                                      )}

                                      <div className="space-y-3">
                                        <div className="space-y-1.5">
                                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Timeline</Label>
                                          <div className="grid grid-cols-3 gap-1">
                                            <Button 
                                              size="sm" 
                                              variant={editingAccess.expires_at?.includes('T') && (new Date(editingAccess.expires_at).getMonth() === (new Date().getMonth() + 3) % 12) ? 'default' : 'outline'} 
                                              className="h-7 text-[10px] px-1" 
                                              onClick={() => {
                                                const date = new Date();
                                                date.setMonth(date.getMonth() + 3);
                                                setEditingAccess({ ...editingAccess, expires_at: date.toISOString() });
                                              }}
                                            >3M</Button>
                                            <Button 
                                              size="sm" 
                                              variant={editingAccess.expires_at?.includes('T') && (new Date(editingAccess.expires_at).getMonth() === (new Date().getMonth() + 6) % 12) ? 'default' : 'outline'} 
                                              className="h-7 text-[10px] px-1" 
                                              onClick={() => {
                                                const date = new Date();
                                                date.setMonth(date.getMonth() + 6);
                                                setEditingAccess({ ...editingAccess, expires_at: date.toISOString() });
                                              }}
                                            >6M</Button>
                                            <Button 
                                              size="sm" 
                                              variant={editingAccess.expires_at === null ? 'default' : 'outline'} 
                                              className="h-7 text-[10px] px-1" 
                                              onClick={() => {
                                                setEditingAccess({ ...editingAccess, expires_at: null });
                                              }}
                                            >∞ Life</Button>
                                          </div>
                                        </div>

                                        <div className="space-y-1">
                                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Note</Label>
                                          <Input 
                                            placeholder="Msg..." 
                                            className="h-7 text-[11px]" 
                                            value={editingAccess.admin_message} 
                                            onChange={(e) => setEditingAccess({ ...editingAccess, admin_message: e.target.value })} 
                                          />
                                        </div>

                                        <div className="flex flex-wrap gap-1 pt-2 border-t">
                                          <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="flex-1 h-7 text-[10px] text-destructive border-destructive/20 hover:bg-destructive/10" 
                                            onClick={() => handleUpdateAccess(s.user_id, { status: 'none', has_access: false, expires_at: null, admin_message: editingAccess.admin_message || 'Access revoked' })}
                                          >Revoke</Button>
                                          <Button 
                                            size="sm" 
                                            variant="destructive" 
                                            className="flex-1 h-7 text-[10px]" 
                                            onClick={() => handleUpdateAccess(s.user_id, { status: 'rejected', has_access: false, admin_message: editingAccess.admin_message })}
                                          >Reject</Button>
                                          <Button 
                                            size="sm" 
                                            className="flex-1 h-7 text-[10px]" 
                                            onClick={() => handleUpdateAccess(s.user_id, { status: 'approved', has_access: true, expires_at: editingAccess.expires_at, admin_message: editingAccess.admin_message })}
                                          >Approve</Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default GermanCourseAdmin;
