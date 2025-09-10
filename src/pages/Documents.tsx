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
  const { profile, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  // Tabs removed; simplifying to a single upload section
  const [documentStats, setDocumentStats] = useState({
    total: 0,
    uploaded: 0,
    pending: 0,
    rejected: 0
  });
  // Document name UI removed per user request

  // Calculate document statistics using required DOCUMENTS list for accuracy
  useEffect(() => {
    const docs = (profile as any)?.documents as any[] | undefined;
    const requiredKeys = DOCUMENTS.map(d => d.key);
    const total = requiredKeys.length;
    let uploaded = 0;
    if (Array.isArray(docs)) {
      const byCategory = new Map<string, any>();
      for (const d of docs) {
        if (d?.category && requiredKeys.includes(d.category) && (d.file_url || d.upload_path)) {
          byCategory.set(d.category, d);
        }
      }
      uploaded = byCategory.size;
    }
    const pending = Math.max(0, total - uploaded);
    const rejected = 0; // not tracked
    setDocumentStats({ total, uploaded, pending, rejected });
  }, [profile]);

  // Refresh document list
  const refreshDocuments = async () => {
    if (!profile?.user_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', profile.user_id);
      
      if (error) throw error;
      
      // Update profile with fresh documents
      await refetchProfile();
      
      toast({
        title: "Documents refreshed",
        description: "Your document list has been updated.",
      });
    } catch (error) {
      console.error('Error refreshing documents:', error);
      toast({
        title: "Error",
        description: "Failed to refresh documents. Please try again.",
        variant: "destructive",
      });
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
              <CardTitle className="text-sm font-medium">Uploaded</CardTitle>
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
