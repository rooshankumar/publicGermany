import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, Plus, Trash2, Edit2, Loader2, Play, Cloud, Globe, Users, ShieldCheck, ShieldAlert, Search, X } from 'lucide-react';
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
  created_at: string;
}

interface StudentAccess {
  user_id: string;
  has_access: boolean;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
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

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('german_course_videos')
        .select('*')
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
      // First get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      if (profileError) throw profileError;

      // Then get access data
      const { data: accessData, error: accessError } = await supabase
        .from('german_course_access')
        .select('*');

      if (accessError) throw accessError;

      // Merge data
      const mergedData = profiles.map(profile => {
        const access = accessData?.find(a => a.user_id === profile.user_id);
        return {
          user_id: profile.user_id,
          has_access: access ? access.has_access : false,
          profiles: {
            full_name: profile.full_name,
            email: '' // Email not available in profiles table
          }
        };
      });

      setStudents(mergedData);
    } catch (error: any) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleToggleAccess = async (userId: string, currentAccess: boolean) => {
    try {
      const { error } = await supabase
        .from('german_course_access')
        .upsert({ 
          user_id: userId, 
          has_access: !currentAccess,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setStudents(prev => prev.map(s => 
        s.user_id === userId ? { ...s, has_access: !currentAccess } : s
      ));

      toast({
        title: !currentAccess ? "Access Granted" : "Access Revoked",
        description: `Student access has been updated.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating access",
        description: error.message,
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
      setVideos(prev => prev.filter(v => v.id !== id));
      const { error } = await supabase
        .from('german_course_videos')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Video deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error deleting video",
        description: error.message,
        variant: "destructive",
      });
      fetchVideos();
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
    setShowUploadForm(false);
  };

  const filteredStudents = students.filter(s => 
    s.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 -mt-2 sm:mt-0 px-1 sm:px-0 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold">German Course</h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-none">Manage lectures and student access</p>
          </div>
          
          {!showUploadForm && (
            <Button 
              onClick={() => setShowUploadForm(true)}
              size="sm"
              className="bg-primary text-primary-foreground h-9"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Lecture
            </Button>
          )}
        </div>

        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="w-full justify-start h-9 p-0 bg-transparent border-b rounded-none mb-4">
            <TabsTrigger value="videos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-9 font-bold text-xs sm:text-sm">Lectures</TabsTrigger>
            <TabsTrigger value="students" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-9 font-bold text-xs sm:text-sm">Student Access</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-4 pt-0">
            {showUploadForm && (
              <Card className="border-none sm:border shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-bold">{editingVideo ? 'Edit Lecture' : 'Add New Lecture'}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <form onSubmit={handleSaveVideo} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="title" className="text-xs">Title</Label>
                        <Input 
                          id="title" 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required 
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="level" className="text-xs">Level</Label>
                        <select 
                          id="level"
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          className="w-full h-9 p-2 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="A1">German A1</option>
                          <option value="A2">German A2</option>
                          <option value="B1">German B1</option>
                        </select>
                      </div>
                    </div>

                    <Tabs value={videoType} onValueChange={(v) => setVideoType(v as any)}>
                      <TabsList className="grid w-full grid-cols-2 h-8">
                        <TabsTrigger value="youtube" className="text-[10px] sm:text-xs">YouTube</TabsTrigger>
                        <TabsTrigger value="direct" className="text-[10px] sm:text-xs">Direct Link</TabsTrigger>
                      </TabsList>
                      <TabsContent value="youtube" className="pt-2">
                        <Input 
                          placeholder="YouTube URL"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          required={videoType === 'youtube'}
                          className="h-9 text-sm"
                        />
                      </TabsContent>
                      <TabsContent value="direct" className="pt-2">
                        <Input 
                          placeholder="Direct Video URL"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          required={videoType === 'direct'}
                          className="h-9 text-sm"
                        />
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" size="sm" onClick={resetForm} className="h-8 text-xs px-3">Cancel</Button>
                      <Button type="submit" size="sm" disabled={isSubmitting} className="h-8 text-xs px-3">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingVideo ? 'Update' : 'Save')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {videos.map((video) => (
                  <Card key={video.id} className="overflow-hidden border-none sm:border shadow-sm">
                    <div className="aspect-video relative bg-muted">
                      {video.youtube_url ? (
                        <iframe 
                          src={`https://www.youtube.com/embed/${video.video_id}`}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Play className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="p-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">German {video.level}</Badge>
                      </div>
                      <CardTitle className="text-sm font-bold line-clamp-1">{video.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(video)} className="h-8 text-xs px-3">Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteVideo(video.id)} className="h-8 text-xs px-3">Delete</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" className="outline-none">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-zinc-900">
              <CardHeader className="p-8 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Student Access Control</CardTitle>
                    <CardDescription className="font-medium mt-1">Grant or revoke course access for registered students.</CardDescription>
                  </div>
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input 
                      placeholder="Search name or email..." 
                      className="pl-12 py-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingStudents ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#ea384c]" />
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Loading Records...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-24 text-center">
                    <Users className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
                    <p className="text-zinc-400 font-bold uppercase tracking-tight">No students found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Student Info</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Email Address</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Course Status</th>
                          <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Access Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {filteredStudents.map((student) => (
                          <tr key={student.user_id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#ea384c]/10 border border-[#ea384c]/20 flex items-center justify-center text-[#ea384c] font-black text-xs">
                                  {student.profiles?.full_name?.charAt(0) || 'S'}
                                </div>
                                <span className="font-bold text-sm tracking-tight">{student.profiles?.full_name || 'Anonymous Student'}</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="text-sm font-medium text-muted-foreground">{student.profiles?.email}</span>
                            </td>
                            <td className="p-6 text-center">
                              {student.has_access ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 rounded-full border border-green-100 dark:border-green-900/30">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Enrolled</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 rounded-full border border-zinc-100 dark:border-zinc-800">
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">No Access</span>
                                </div>
                              )}
                            </td>
                            <td className="p-6 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{student.has_access ? 'Revoke' : 'Grant'}</span>
                                <Switch 
                                  checked={student.has_access}
                                  onCheckedChange={() => handleToggleAccess(student.user_id, student.has_access)}
                                  className="data-[state=checked]:bg-green-500"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default GermanCourseAdmin;
