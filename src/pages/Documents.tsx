import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload, FileText, FileCheck, FileX, FileClock } from 'lucide-react';
import Layout from '@/components/Layout';
import APSRequiredDocuments, { DOCUMENTS } from '@/components/APSRequiredDocuments';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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

  // Fetch user's documents with status and keep in sync via realtime
  useEffect(() => {
    const fetchUserDocs = async () => {
      if (!profile?.user_id) return;
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('id, category, file_url, upload_path, status')
          .eq('user_id', profile.user_id);
        if (error) throw error;
        const map: Record<string, any | null> = {};
        DOCUMENTS.forEach(d => { map[d.key] = null; });
        (data || []).forEach((d: any) => {
          if (d?.category && d.file_url) map[d.category] = d;
        });
        setUserDocs(map);
      } catch (e) {
        // Initialize empty map on error
        const map: Record<string, any | null> = {};
        DOCUMENTS.forEach(d => { map[d.key] = null; });
        setUserDocs(map);
      }
    };
    fetchUserDocs();
    if (!profile?.user_id) return;
    const channel = supabase
      .channel(`documents-user-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${profile.user_id}` }, () => fetchUserDocs())
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
      const { error } = await supabase
        .from('documents')
        .select('id')
        .eq('user_id', profile.user_id)
        .limit(1);
      if (error) throw error;
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col space-y-1.5 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Documents</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Upload and manage all your required documents in one place
          </p>
        </div>

        {/* Document Stats */}
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentStats.total}</div>
              <p className="text-xs text-muted-foreground">Required for your application</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <FileCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentStats.uploaded}</div>
              <p className="text-xs text-muted-foreground">Approved and verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <FileClock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentStats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <FileX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentStats.rejected}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Document Completion</CardTitle>
              <Badge variant="outline" className="font-normal">
                {uploadProgress}% Complete
              </Badge>
            </div>
            <CardDescription>
              Track your document upload progress for a complete application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span>{documentStats.uploaded} of {documentStats.total} documents uploaded</span>
                <span>{documentStats.total - documentStats.uploaded} remaining</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
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
      </div>
    </Layout>
  );
};

export default Documents;
