import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Play, 
  Cloud, 
  Youtube, 
  Globe, 
  Lock,
  ShieldAlert,
  BookOpen,
  LayoutGrid,
  List,
  CheckCircle2,
  Circle,
  AlertTriangle,
  MessageSquare,
  Send,
  MessageCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import logos from '@/assets/logos.png';

import { useToast } from '@/hooks/use-toast';

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

interface AccessRecord {
  status: 'pending' | 'approved' | 'rejected' | 'none';
  has_access: boolean;
  expires_at: string | null;
  request_message: string | null;
  admin_message: string | null;
}

interface ProgressRecord {
  video_id: string;
  is_completed: boolean;
}

const GermanCourse = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'index' | 'newest' | 'oldest' | 'az'>('index');
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [access, setAccess] = useState<AccessRecord>({
    status: 'none',
    has_access: false,
    expires_at: null,
    request_message: null,
    admin_message: null
  });
  const [requestMsg, setRequestMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [profile?.user_id]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('german_course_videos')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
      await fetchProgress();
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('german_course_progress')
        .select('video_id, is_completed')
        .eq('user_id', user.id);

      if (error) {
        // If table doesn't exist yet, just log and return empty
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('german_course_progress table not found. Please ensure migration is applied.');
          setProgress([]);
          return;
        }
        throw error;
      }
      setProgress((data as ProgressRecord[]) || []);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const toggleProgress = async (videoId: string, currentStatus: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase as any)
        .from('german_course_progress')
        .upsert({
          user_id: user.id,
          video_id: videoId,
          is_completed: !currentStatus,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,video_id' });

      if (error) throw error;
      await fetchProgress();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
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
  const checkAccess = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setAccess({
          status: 'none',
          has_access: false,
          expires_at: null,
          request_message: null,
          admin_message: null
        });
        return;
      }

      const { data, error } = await supabase
        .from('german_course_access')
        .select('status, has_access, expires_at, request_message, admin_message')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data && data.status === 'approved' && data.has_access) {
        setAccess({
          status: 'approved',
          has_access: true,
          expires_at: data.expires_at,
          request_message: data.request_message,
          admin_message: data.admin_message
        });
        await fetchVideos();
      } else {
        setAccess({
          status: data?.status as any || 'none',
          has_access: false,
          expires_at: data?.expires_at || null,
          request_message: data?.request_message || null,
          admin_message: data?.admin_message || null
        });
      }
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      setIsSubmitting(true);
      console.log('Submitting access request for user:', user.id, 'Message:', requestMsg);

      const { error: upsertError } = await supabase
        .from('german_course_access')
        .upsert({
          user_id: user.id,
          status: 'pending',
          request_message: requestMsg,
          has_access: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        toast({
          title: "Request Failed",
          description: upsertError.message,
          variant: "destructive",
        });
        throw upsertError;
      }
      
      console.log('Access record upserted successfully');
      toast({
        title: "Request Sent",
        description: "Your enrollment request has been submitted to the admin.",
      });

      // Create a notification for admin
      const { data: adminProfiles, error: adminError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1);

      if (adminError) {
        console.error('Error fetching admin profile:', adminError);
      }

      const adminId = adminProfiles?.[0]?.user_id;
      console.log('Target Admin ID for notification:', adminId);

      if (adminId) {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: adminId,
          title: `New German Course Request`,
          body: `${profile?.full_name || 'A student'} has requested access to the German Course.`,
          type: 'service_request',
          seen: false
        });
        if (notifError) {
          console.error('Notification insertion error:', notifError);
        } else {
          console.log('Admin notification sent successfully');
        }
      } else {
        console.warn('No admin user_id found to notify');
      }

      // Refresh access state
      await checkAccess();
      console.log('Access state refreshed');
    } catch (error) {
      console.error('Error requesting access:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!access.has_access || access.status !== 'approved') {
    if (access.status === 'pending') {
      return (
        <Layout>
          <div className="max-w-md mx-auto py-12 text-center space-y-6 px-4">
            <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Request Pending</h1>
              <p className="text-muted-foreground text-sm">
                Your request for German Course access is currently being reviewed by our administrators.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 h-11 border-green-200 hover:bg-green-50 text-green-700 font-bold"
                onClick={() => window.open('https://chat.whatsapp.com/IX9Z24dCKIk0nVn98L3rxd?mode=hqctcla', '_blank')}
              >
                <MessageCircle className="h-4 w-4 fill-green-600/20" /> Join WhatsApp
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 h-11 border-blue-200 hover:bg-blue-50 text-blue-700 font-bold"
                onClick={() => window.open('https://t.me/publicgermany', '_blank')}
              >
                <Send className="h-4 w-4 fill-blue-600/20" /> Join Telegram
              </Button>
            </div>

            {access.request_message && (
              <Card className="bg-muted/50 border-none p-4">
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1 text-left">Your Message:</p>
                <p className="text-sm italic text-left">"{access.request_message}"</p>
              </Card>
            )}
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              Back to Dashboard
            </Button>
          </div>
        </Layout>
      );
    }

    return (
      <Layout>
        <div className="max-w-md mx-auto py-12 space-y-8 px-4">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">German Course Library</h1>
              <p className="text-muted-foreground text-sm">
                Unlock professional A1-B1 training videos to accelerate your career in Germany.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-11 border-green-200 hover:bg-green-50 text-green-700 font-bold"
              onClick={() => window.open('https://chat.whatsapp.com/IX9Z24dCKIk0nVn98L3rxd?mode=hqctcla', '_blank')}
            >
              <MessageCircle className="h-4 w-4 fill-green-600/20" /> Join WhatsApp
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-11 border-blue-200 hover:bg-blue-50 text-blue-700 font-bold"
              onClick={() => window.open('https://t.me/publicgermany', '_blank')}
            >
              <Send className="h-4 w-4 fill-blue-600/20" /> Join Telegram
            </Button>
          </div>

          {access.status === 'rejected' && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl space-y-2">
              <p className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Request Declined
              </p>
              <p className="text-sm text-red-700">
                {access.admin_message || "Your request was declined. Please complete your enrollment or contact support."}
              </p>
            </div>
          )}

          <Card className="p-6 shadow-sm border-zinc-100">
            <h2 className="text-sm font-bold mb-4 uppercase tracking-wider">Request Enrollment Access</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="msg" className="text-xs">Optional Message (e.g. Fees paid, counselor name)</Label>
                <textarea 
                  id="msg"
                  className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Tell us why you need access..."
                  value={requestMsg}
                  onChange={(e) => setRequestMsg(e.target.value)}
                />
              </div>
              <Button 
                className="w-full h-11 font-bold" 
                onClick={handleRequestAccess}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Access Request"}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                Typically approved within 24 hours after verification.
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-center">
              <BookOpen className="h-5 w-5 mx-auto mb-2 text-zinc-400" />
              <p className="text-[10px] font-bold uppercase">Curriculum</p>
              <p className="text-xs font-medium">A1, A2, B1 Levels</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-center">
              <Globe className="h-5 w-5 mx-auto mb-2 text-zinc-400" />
              <p className="text-[10px] font-bold uppercase">Format</p>
              <p className="text-xs font-medium">HD Video Lectures</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const levels = ['A1', 'A2', 'B1'];

  return (
    <Layout>
      <div className="space-y-2 sm:space-y-3 -mt-3 sm:-mt-2 px-1 sm:px-0 pb-20">
        <div className="bg-amber-50 border border-amber-100 rounded-md p-2 flex items-start gap-2 mb-1">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-amber-900 leading-tight">Notice: Course Content Source</p>
            <p className="text-[9px] text-amber-800 leading-tight">
              This course features content from <strong>Language Pantheon</strong>. We offer these recorded sessions at a discounted price for our students. We prioritize your privacy and academic growth.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="space-y-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">German Course</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-none">
              Progress: {Math.round((progress.filter(p => p.is_completed).length / (videos.length || 1)) * 100)}%
            </p>
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        <Tabs defaultValue="A1" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-[280px] sm:max-w-md h-8 p-0.5 bg-muted">
            {levels.map(level => (
              <TabsTrigger key={level} value={level} className="font-bold text-[10px] sm:text-xs h-7">
                {level}
              </TabsTrigger>
            ))}
          </TabsList>

          {levels.map(level => {
            const levelVideos = getSortedVideos(videos.filter(v => v.level === level));
            const completedInLevel = levelVideos.filter(v => progress.find(p => p.video_id === v.id)?.is_completed).length;
            
            return (
              <TabsContent key={level} value={level} className="space-y-2 pt-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">
                    {level} Progress: {completedInLevel}/{levelVideos.length || 0}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  {levelVideos.length === 0 ? (
                    <Card className="col-span-full py-6 text-center border shadow-none bg-muted/20">
                      <p className="text-[10px] text-muted-foreground italic">Empty</p>
                    </Card>
                  ) : (
                    levelVideos.map((video) => {
                      const isDone = progress.find(p => p.video_id === video.id)?.is_completed;
                      
                      return (
                        <Card key={video.id} className={`flex items-center p-1.5 gap-2 border shadow-none hover:border-primary/30 transition-colors ${isDone ? 'bg-primary/5 border-primary/20' : ''}`}>
                          <div className="w-24 aspect-video bg-black rounded overflow-hidden shrink-0">
                            {video.youtube_url ? (
                              <img src={`https://img.youtube.com/vi/${video.video_id}/default.jpg`} className="w-full h-full object-cover opacity-80" alt="" />
                            ) : <div className="w-full h-full flex items-center justify-center"><Play className="h-4 w-4 text-muted-foreground" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[11px] font-bold truncate leading-tight">{video.title}</h3>
                            <p className="text-[9px] text-muted-foreground">{new Date(video.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Dialog onOpenChange={(open) => {
                              if (open && !isDone) {
                                toggleProgress(video.id, false);
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Play className="h-3.5 w-3.5" /></Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-black aspect-video border-none">
                                {video.youtube_url ? (
                                  <iframe src={`https://www.youtube.com/embed/${video.video_id}?autoplay=1`} className="w-full h-full" allowFullScreen />
                                ) : (
                                  <iframe src={video.video_url?.replace('/view', '/preview')} className="w-full h-full border-0" allowFullScreen />
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`h-7 w-7 p-0 ${isDone ? 'text-green-600' : 'text-muted-foreground'}`}
                              onClick={() => toggleProgress(video.id, !!isDone)}
                            >
                              {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                            </Button>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </Layout>
  );
};

export default GermanCourse;
