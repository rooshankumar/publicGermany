import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Play, 
  Cloud, 
  Youtube, 
  Globe, 
  Lock 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

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

const GermanCourse = () => {
  const { profile } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (profile?.user_id) {
      checkAccess();
    }
  }, [profile?.user_id]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('german_course_access')
        .select('has_access')
        .eq('user_id', profile?.user_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const access = data?.has_access || false;
      setHasAccess(access);

      if (access) {
        fetchVideos();
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      if (hasAccess === false) setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('german_course_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (hasAccess === false) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-12 text-center space-y-4">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Course Locked</h1>
          <p className="text-muted-foreground">
            Please contact the administrator to grant you access to this course.
          </p>
          <Button onClick={() => window.location.href = '/contact'}>
            Contact Support
          </Button>
        </div>
      </Layout>
    );
  }

  const levels = ['A1', 'A2', 'B1'];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">German Course</h1>
          <p className="text-sm text-muted-foreground">Select your level to start learning</p>
        </div>

        <Tabs defaultValue="A1" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            {levels.map(level => (
              <TabsTrigger key={level} value={level} className="font-bold">
                German {level}
              </TabsTrigger>
            ))}
          </TabsList>

          {levels.map(level => (
            <TabsContent key={level} value={level} className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.filter(v => v.level === level).length === 0 ? (
                  <Card className="col-span-full py-12 text-center">
                    <p className="text-muted-foreground italic">No lectures available for {level} yet.</p>
                  </Card>
                ) : (
                  videos.filter(v => v.level === level).map((video) => (
                    <Card key={video.id} className="overflow-hidden">
                      <div className="aspect-video relative bg-black">
                        {video.youtube_url ? (
                          <iframe 
                            src={`https://www.youtube.com/embed/${video.video_id}`}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        ) : video.video_url?.includes('drive.google.com') ? (
                          <iframe 
                            src={video.video_url.replace('/view', '/preview')} 
                            className="w-full h-full border-0" 
                            allowFullScreen 
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full p-4 text-center space-y-4">
                            <Cloud className="h-8 w-8 text-muted-foreground" />
                            <p className="text-xs text-white">This video is hosted on an external cloud.</p>
                            <Button size="sm" onClick={() => window.open(video.video_url!, '_blank')}>
                              Watch Video
                            </Button>
                          </div>
                        )}
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">{video.title}</CardTitle>
                        <CardDescription>
                          {new Date(video.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
};

export default GermanCourse;
