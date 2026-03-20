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
  
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('A1');
  const [url, setUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoType, setVideoType] = useState<'youtube' | 'direct'>('youtube');

  const { toast } = useToast();

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
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .eq('role', 'student');

      if (profilesError) throw profilesError;

      const { data: accessRecords, error: accessError } = await supabase
        .from('german_course_access')
        .select('*');

      if (accessError) throw accessError;

      const mergedStudents: StudentAccess[] = (profiles || []).map(profile => {
        const access = (accessRecords || []).find(a => a.user_id === profile.user_id);
        return {
          user_id: profile.user_id,
          has_access: access?.has_access ?? false,
          status: access?.status ?? 'none',
          expires_at: access?.expires_at ?? null,
          request_message: access?.request_message ?? null,
          admin_message: access?.admin_message ?? null,
          profiles: {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          }
        };
      });

      setStudents(mergedStudents);
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

  const filteredStudents = students.filter(s => 
    s.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-3 sm:space-y-4 -mt-3 sm:-mt-2 px-1 sm:px-0 pb-10">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">German Course</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-none">Lectures & Access</p>
          </div>
          {!showUploadForm && (
            <Button 
              onClick={() => setShowUploadForm(true)}
              size="sm"
              className="bg-primary text-primary-foreground h-8 text-xs px-3"
            >
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          )}
        </div>

        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="w-full justify-start h-8 p-0 bg-transparent border-b rounded-none mb-3">
            <TabsTrigger value="videos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 h-8 font-bold text-xs">Lectures</TabsTrigger>
            <TabsTrigger value="students" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 h-8 font-bold text-xs">Access</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-2 pt-0">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {videos.map((video) => (
                  <Card key={video.id} className="overflow-hidden border shadow-none hover:border-primary/30 transition-colors bg-card">
                    <div className="aspect-video relative bg-black/5">
                      {video.youtube_url ? (
                        <iframe src={`https://www.youtube.com/embed/${video.video_id}`} className="w-full h-full" allowFullScreen />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Play className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="p-2 space-y-0.5">
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 w-fit">G-{video.level}</Badge>
                      <CardTitle className="text-[11px] font-bold line-clamp-1 leading-tight">{video.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0 flex justify-between gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(video)} className="h-6 text-[10px] px-1.5 flex-1 bg-muted/50">Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteVideo(video.id)} className="h-6 text-[10px] px-1.5 flex-1 text-destructive hover:text-destructive hover:bg-destructive/10">Del</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" className="outline-none">
            <Card className="border shadow-none rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
              <CardHeader className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">Access</CardTitle>
                  <div className="relative w-32 sm:w-48">
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
                        <th className="text-left p-2 font-bold text-muted-foreground">Status</th>
                        <th className="text-left p-2 font-bold text-muted-foreground hidden sm:table-cell">Expiry</th>
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
                          <tr key={s.user_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold overflow-hidden shrink-0">
                                  {s.profiles?.avatar_url ? <img src={s.profiles.avatar_url} className="h-full w-full object-cover" /> : (s.profiles?.full_name?.charAt(0) || 'U')}
                                </div>
                                <span className="font-bold truncate max-w-[80px] sm:max-w-none">{s.profiles?.full_name || 'User'}</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <Badge variant={s.status === 'approved' ? 'default' : s.status === 'pending' ? 'secondary' : s.status === 'rejected' ? 'destructive' : 'outline'} className="text-[8px] px-1 py-0 h-4 leading-none">
                                {s.status === 'none' ? 'NO' : s.status.substring(0, 3).toUpperCase()}
                              </Badge>
                            </td>
                            <td className="p-2 text-[10px] hidden sm:table-cell">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '∞'}</td>
                            <td className="p-2 text-right">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-muted"><Edit2 className="h-3 w-3" /></Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[320px] p-4">
                                  <div className="space-y-3">
                                    <div className="space-y-0.5">
                                      <h2 className="text-sm font-bold tracking-tight">Access: {s.profiles?.full_name}</h2>
                                      {s.expires_at && <p className="text-[10px] text-muted-foreground">Ends: {new Date(s.expires_at).toLocaleDateString()}</p>}
                                    </div>
                                    {s.request_message && <div className="bg-muted p-2 rounded text-[11px] italic leading-tight">"{s.request_message}"</div>}
                                    <div className="space-y-3">
                                      <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Timeline</Label>
                                        <div className="grid grid-cols-3 gap-1">
                                          <Button size="sm" variant="outline" className="h-7 text-[10px] px-1" onClick={() => {
                                            const date = new Date();
                                            date.setMonth(date.getMonth() + 3);
                                            handleUpdateAccess(s.user_id, { expires_at: date.toISOString(), status: 'approved', has_access: true });
                                          }}>3M</Button>
                                          <Button size="sm" variant="outline" className="h-7 text-[10px] px-1" onClick={() => {
                                            const date = new Date();
                                            date.setMonth(date.getMonth() + 6);
                                            handleUpdateAccess(s.user_id, { expires_at: date.toISOString(), status: 'approved', has_access: true });
                                          }}>6M</Button>
                                          <Button size="sm" variant="outline" className="h-7 text-[10px] px-1" onClick={() => {
                                            handleUpdateAccess(s.user_id, { expires_at: null, status: 'approved', has_access: true });
                                          }}>∞ Life</Button>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Note</Label>
                                        <Input placeholder="Msg..." className="h-7 text-[11px]" defaultValue={s.admin_message || ''} onBlur={(e) => handleUpdateAccess(s.user_id, { admin_message: e.target.value })} />
                                      </div>
                                      <div className="flex flex-wrap gap-1 pt-2 border-t">
                                        <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleUpdateAccess(s.user_id, { status: 'none', has_access: false, expires_at: null, admin_message: 'Access revoked by administrator' })}>Revoke All</Button>
                                        <Button size="sm" variant="destructive" className="flex-1 h-7 text-[10px]" onClick={() => handleUpdateAccess(s.user_id, { status: 'rejected', has_access: false })}>Reject</Button>
                                        <Button size="sm" className="flex-1 h-7 text-[10px]" onClick={() => handleUpdateAccess(s.user_id, { status: 'approved', has_access: true })}>Approve</Button>
                                      </div>
                                    </div>
                                  </div>
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
