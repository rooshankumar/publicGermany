import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload, FileText, FileCheck, FileX, FileClock, Info } from 'lucide-react';
import Layout from '@/components/Layout';
import APSRequiredDocuments, { DOCUMENTS } from '@/components/APSRequiredDocuments';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Documents = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userDocs, setUserDocs] = useState<Record<string, any | null>>({});
  // Tabs removed; simplifying to a single upload section
  const [documentStats, setDocumentStats] = useState({
    total: 0,
    uploaded: 0,
    pending: 0,
    rejected: 0
  });
  // Document name UI removed per user request

  const queryClient = useQueryClient();

  const fetchUserDocs = async () => {
    if (!profile?.user_id) return [] as any[];
    const { data, error } = await supabase
      .from('documents')
      .select('id, category, file_url, upload_path, status')
      .eq('user_id', profile.user_id);
    if (error) throw error;
    return data || [];
  };

  const docsQuery = useQuery({
    queryKey: ['documents', profile?.user_id],
    queryFn: fetchUserDocs,
    enabled: !!profile?.user_id,
    onSuccess: (data: any[]) => {
      const map: Record<string, any | null> = {};
      DOCUMENTS.forEach(d => { map[d.key] = null; });
      (data || []).forEach((d: any) => {
        if (d?.category && d.file_url) map[d.category] = d;
      });
      setUserDocs(map);
    }
  });

  // Debounce utility
  const debounce = <F extends (...args: any[]) => void>(fn: F, delay = 300) => {
    let t: any;
    return (...args: Parameters<F>) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  };

  // Realtime refetch with debounce
  useEffect(() => {
    if (!profile?.user_id) return;
    const channel = supabase
      .channel(`documents-user-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${profile.user_id}` }, debounce(() => docsQuery.refetch(), 400))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.user_id]);

  // Calculate document statistics using status
  useEffect(() => {
    const requiredKeys = DOCUMENTS.map(d => d.key);
    const total = requiredKeys.length;
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    requiredKeys.forEach((k) => {
      const d = userDocs[k] as any | null;
      if (!d) return; // not uploaded
      const st = (d.status || 'pending') as string;
      if (st === 'approved') approved += 1;
      else if (st === 'rejected') rejected += 1;
      else pending += 1;
    });
    setDocumentStats({ total, uploaded: approved, pending, rejected });
  }, [userDocs]);

  // Refresh document list
  const refreshDocuments = async () => {
    if (!profile?.user_id) return;
    try {
      setLoading(true);
      await docsQuery.refetch();
      toast({ title: 'Documents refreshed', description: 'Your document list has been updated.' });
    } catch (error) {
      console.error('Error refreshing documents:', error);
      toast({ title: 'Error', description: 'Failed to refresh documents. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate upload progress percentage
  const uploadProgress = documentStats.total > 0 
    ? Math.round((documentStats.uploaded / documentStats.total) * 100) 
    : 0;

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 pb-20 md:pb-0">
        <div className="flex flex-col space-y-1.5 sm:space-y-2">
          <h1 className="hidden md:block text-2xl sm:text-3xl font-bold tracking-tight">My Documents</h1>
          <p className="hidden md:block text-sm sm:text-base text-muted-foreground">
            Upload and manage all your required documents in one place
          </p>
        </div>

        {/* Document Stats */}
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentStats.total}</div>
              <p className="text-xs text-muted-foreground">Required for your application</p>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <FileCheck className="h-4 w-4 text-pg-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentStats.uploaded}</div>
              <p className="text-xs text-muted-foreground">Approved and verified</p>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <FileClock className="h-4 w-4 text-pg-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentStats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <FileX className="h-4 w-4 text-pg-error" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentStats.rejected}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="bg-background">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CardTitle>Document Completion</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px] text-xs">
                      Upload all required documents to reach 100% completion. Admins will review and approve your uploads.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge variant="outline" className="font-normal">
                {uploadProgress}% Complete
              </Badge>
            </div>
            <CardDescription>
              Track your document upload progress for a complete application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span>
                  <Badge variant="secondary" className="mr-2">{documentStats.uploaded}</Badge>
                  of {documentStats.total} documents uploaded
                </span>
                <span>
                  <Badge variant="secondary" className="mr-2">{documentStats.total - documentStats.uploaded}</Badge>
                  remaining
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2 rounded-full" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshDocuments}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </Button>
          </CardFooter>
        </Card>

        {/* General Document Upload */}
        <Card>
          <CardContent>
            <div className="pt-4 sm:pt-6">
              <APSRequiredDocuments />
            </div>
          </CardContent>
        </Card>
        {/* Mobile sticky action bar */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 py-3 flex items-center justify-center">
            <Button className="w-full" variant="outline" size="sm" onClick={refreshDocuments} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh Status'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Documents;
