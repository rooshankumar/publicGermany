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
      <div className="space-y-4 sm:space-y-8 -mt-2 sm:mt-0 px-1 sm:px-0 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold">German Course</h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-none">Select your level to start learning</p>
          </div>
        </div>

        <Tabs defaultValue="A1" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md h-9 sm:h-10">
            {levels.map(level => (
              <TabsTrigger key={level} value={level} className="font-bold text-xs sm:text-sm">
                German {level}
              </TabsTrigger>
            ))}
          </TabsList>

          {levels.map(level => (
            <TabsContent key={level} value={level} className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {videos.filter(v => v.level === level).length === 0 ? (
                  <Card className="col-span-full py-8 sm:py-12 text-center border-none sm:border shadow-sm">
                    <p className="text-xs sm:text-sm text-muted-foreground italic">No lectures available for {level} yet.</p>
                  </Card>
                ) : (
                  videos.filter(v => v.level === level).map((video) => (
                    <Card key={video.id} className="overflow-hidden border-none sm:border shadow-sm">
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
                          <div className="flex flex-col items-center justify-center h-full p-4 text-center space-y-2 sm:space-y-4">
                            <Cloud className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                            <p className="text-[10px] sm:text-xs text-white">External cloud video.</p>
                            <Button size="sm" className="h-7 sm:h-9 text-[10px] sm:text-xs" onClick={() => window.open(video.video_url!, '_blank')}>
                              Watch Video
                            </Button>
                          </div>
                        )}
                      </div>
                      <CardHeader className="p-3 sm:p-4">
                        <CardTitle className="text-sm sm:text-base line-clamp-1">{video.title}</CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs">
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
