import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload, FileText, FileCheck, FileX, FileClock, Info, Trash2, Edit2, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import APSRequiredDocuments, { DOCUMENTS } from '@/components/APSRequiredDocuments';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  
  // Additional documents state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFileName, setCustomFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [additionalDocs, setAdditionalDocs] = useState<any[]>([]);

  const queryClient = useQueryClient();

  const fetchUserDocs = async () => {
    if (!profile?.user_id) return [] as any[];
    const { data, error } = await supabase
      .from('documents')
      .select('id, category, file_url, file_name, upload_path, status')
      .eq('user_id', profile.user_id);
    if (error) throw error;
    return data || [];
  };

  const docsQuery = useQuery({
    queryKey: ['documents', profile?.user_id],
    queryFn: fetchUserDocs,
    enabled: !!profile?.user_id,
  });

  // Map fetched docs into a keyed object for quick status lookups
  useEffect(() => {
    const data = (docsQuery.data as any[]) || [];
    const map: Record<string, any | null> = {};
    DOCUMENTS.forEach(d => { map[d.key] = null; });
    data.forEach((d: any) => {
      if (d?.category && d.file_url) map[d.category] = d;
    });
    setUserDocs(map);
  }, [docsQuery.data]);

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

  // Fetch additional documents (documents table with module='additional_documents')
  useEffect(() => {
    if (!profile?.user_id) return;
    const fetchAdditionalDocs = async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('module', 'additional_documents')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setAdditionalDocs(data);
      }
    };
    fetchAdditionalDocs();
  }, [profile?.user_id]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Pre-fill with original filename (keep extension for display)
      setCustomFileName(file.name);
      console.log('File selected:', file.name);
    }
  };

  // Reset form when dialog opens
  const handleOpenDialog = () => {
    setSelectedFile(null);
    setCustomFileName('');
    setShowUploadDialog(true);
  };

  // Upload additional document
  const handleUploadAdditional = async () => {
    console.log('Upload clicked:', { selectedFile, customFileName, userId: profile?.user_id });
    
    if (!selectedFile) {
      toast({ title: 'Error', description: 'Please select a file', variant: 'destructive' });
      return;
    }
    
    if (!customFileName || !customFileName.trim()) {
      toast({ title: 'Error', description: 'Please provide a document name', variant: 'destructive' });
      return;
    }
    
    if (!profile?.user_id) {
      toast({ title: 'Error', description: 'User not authenticated', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      const fileExt = selectedFile.name.split('.').pop();
      // Get user's first name from profile
      const firstName = profile?.full_name?.split(' ')[0] || 'user';
      
      // If user's custom name already has extension, use it. Otherwise add the original extension
      let finalFileName = customFileName.trim();
      const hasExtension = /\.[a-zA-Z0-9]+$/.test(finalFileName);
      if (!hasExtension && fileExt) {
        finalFileName = `${finalFileName}.${fileExt}`;
      }
      
      const sanitizedName = finalFileName.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${firstName}_${sanitizedName}`;
      const filePath = `additional/${profile.user_id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Save to documents table with module='additional_documents'
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: profile.user_id,
          file_name: fileName,
          upload_path: filePath,
          file_url: publicUrl,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          category: 'additional',
          module: 'additional_documents',
          status: 'pending'
        });

      if (dbError) throw dbError;

      toast({ title: 'Success', description: 'Document uploaded successfully' });
      
      // Refresh list
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('module', 'additional_documents')
        .order('created_at', { ascending: false });
      if (data) setAdditionalDocs(data);

      // Reset
      setSelectedFile(null);
      setCustomFileName('');
      setShowUploadDialog(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  // Delete additional document
  const handleDeleteAdditional = async (doc: any) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Delete from storage
      await supabase.storage.from('documents').remove([doc.upload_path]);

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Document deleted' });
      setAdditionalDocs(additionalDocs.filter(d => d.id !== doc.id));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total</CardTitle>
              <FileText className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-2 md:pb-4">
              <div className="text-xl md:text-2xl font-bold">{documentStats.total}</div>
              <p className="text-xs text-muted-foreground hidden md:block">Required docs</p>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Approved</CardTitle>
              <FileCheck className="h-3 w-3 md:h-4 md:w-4 text-pg-success" />
            </CardHeader>
            <CardContent className="pb-2 md:pb-4">
              <div className="text-xl md:text-2xl font-bold">{documentStats.uploaded}</div>
              <p className="text-xs text-muted-foreground hidden md:block">Verified</p>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Pending</CardTitle>
              <FileClock className="h-3 w-3 md:h-4 md:w-4 text-pg-gold" />
            </CardHeader>
            <CardContent className="pb-2 md:pb-4">
              <div className="text-xl md:text-2xl font-bold">{documentStats.pending}</div>
              <p className="text-xs text-muted-foreground hidden md:block">In review</p>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Rejected</CardTitle>
              <FileX className="h-3 w-3 md:h-4 md:w-4 text-pg-error" />
            </CardHeader>
            <CardContent className="pb-2 md:pb-4">
              <div className="text-xl md:text-2xl font-bold">{documentStats.rejected}</div>
              <p className="text-xs text-muted-foreground hidden md:block">Fix needed</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="bg-background">
          <CardHeader className="pb-3 md:pb-6">
            <div className="flex justify-between items-start md:items-center gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm md:text-base">Progress</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px] text-xs">
                      Upload all required documents to reach 100% completion. Admins will review and approve your uploads.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge variant="outline" className="font-normal text-xs">
                {uploadProgress}%
              </Badge>
            </div>
            <CardDescription className="hidden md:block text-xs">
              Track your document upload progress
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3 md:pb-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  <Badge variant="secondary" className="mr-1 text-xs">{documentStats.uploaded}</Badge>
                  of {documentStats.total}
                </span>
                <span>
                  <Badge variant="secondary" className="mr-1 text-xs">{documentStats.total - documentStats.uploaded}</Badge>
                  left
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2 rounded-full" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-0 pb-3 md:pb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshDocuments}
              disabled={loading}
              className="text-xs h-8"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </CardFooter>
        </Card>

        {/* General Document Upload */}
        <Card>
          <CardContent>
            <div className="pt-4 sm:pt-6">
              <APSRequiredDocuments 
                additionalDocs={additionalDocs}
                onUploadAdditional={handleOpenDialog}
                onDeleteAdditional={handleDeleteAdditional}
              />
            </div>
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Additional Document</DialogTitle>
              <DialogDescription>
                Choose a file and give it a custom name before uploading
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="customName">Document Name *</Label>
                <Input
                  id="customName"
                  placeholder="e.g., Bachelor Transcript Semester 1"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Give this document a descriptive name
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUploadAdditional} disabled={uploading || !selectedFile || !customFileName.trim()}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
