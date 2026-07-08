import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useEditorPermissions } from '@/hooks/useEditorPermissions';
import { User, FileText, GraduationCap, ArrowLeft, MapPin, Mail, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EditorStudentProfile = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { permissions, loading: permLoading } = useEditorPermissions();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState<string>('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [showInitialLoader, setShowInitialLoader] = useState(false);

  const permission = studentId
    ? permissions.find(p => p.student_user_id === studentId) || null
    : null;

  useEffect(() => {
    if (permLoading || !studentId) return;
    if (!permission) {
      setInitialLoading(false);
      setHasLoadedInitialData(true);
      return;
    }

    let cancelled = false;
    const fetchData = async () => {
      try {
        const tasks: Promise<any>[] = [];
        if (permission.can_view_profile) {
          tasks.push(
            Promise.resolve(supabase.from('profiles').select('*').eq('user_id', studentId).maybeSingle())
              .then(({ data }) => { if (!cancelled && data) setProfile(data); }),
            Promise.resolve(supabase.rpc('get_user_email' as any, { p_user_id: studentId } as any))
              .then(({ data }: any) => { if (!cancelled && data) setEmail(data as string); })
          );
        }
        if (permission.can_view_documents) {
          tasks.push(
            Promise.resolve(supabase.from('documents').select('*').eq('user_id', studentId).order('created_at', { ascending: false }))
              .then(({ data }) => { if (!cancelled) setDocuments(data || []); })
          );
        }
        if (permission.can_view_applications) {
          tasks.push(
            Promise.resolve(supabase.from('applications').select('*').eq('user_id', studentId).order('created_at', { ascending: false }))
              .then(({ data }) => { if (!cancelled) setApplications(data || []); })
          );
        }
        await Promise.all(tasks);
      } catch (e) {
        console.error('Error fetching student data:', e);
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
          setHasLoadedInitialData(true);
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [studentId, permLoading, permission?.id]);

  const loading = initialLoading && !profile && documents.length === 0 && applications.length === 0;
  const shouldShowInitialLoader = !hasLoadedInitialData && loading;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (!hasLoadedInitialData && loading) {
      timeout = setTimeout(() => setShowInitialLoader(true), 50);
    } else {
      setShowInitialLoader(false);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [hasLoadedInitialData, loading]);

  const downloadDocument = async (doc: any) => {
    try {
      const nameParts = (profile?.full_name || 'Student').split(' ') || ['Student'];
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

      const category = doc.category || doc.file_name || 'Document';
      const safeName = String(category)
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      const fileExt = doc.file_name?.split('.').pop() || 'pdf';
      const downloadName = lastName
        ? `${firstName}_${lastName}_${safeName || 'document'}.${fileExt}`
        : `${firstName}_${safeName || 'document'}.${fileExt}`;

      let fileUrl = doc.file_url;

      if (!fileUrl && doc.upload_path) {
        const { data } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.upload_path, 300);
        if (data?.signedUrl) {
          fileUrl = data.signedUrl;
        }
      }

      if (!fileUrl) {
        toast({ title: 'Unavailable', description: 'No downloadable link for this file', variant: 'destructive' });
        return;
      }

      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Error', description: 'Failed to download document', variant: 'destructive' });
    }
  };

  if (shouldShowInitialLoader) return <Layout><div className="flex items-center justify-center min-h-[40vh]"><p className="text-xs text-muted-foreground">Loading...</p></div></Layout>;
  if (!permission) return <Navigate to="/editor" replace />;

  const defaultTab = permission.can_view_profile
    ? 'profile'
    : permission.can_view_documents
      ? 'documents'
      : 'applications';

  const initials = (profile?.full_name || '?')
    .split(' ')
    .map((s: string) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-3 space-y-2">
        <button
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
          onClick={() => navigate('/editor')}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Roster
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-10"><p className="text-xs text-muted-foreground">Loading student profile...</p></div>
        ) : (
          <>
            {/* Profile header */}
            <header className="rounded-lg border border-border/60 bg-card shadow-sm">
              <div className="p-2.5 flex items-center gap-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm font-semibold truncate">{profile?.full_name || 'Student'}</h1>
                  <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
                    {email && (
                      <span className="inline-flex items-center gap-1 truncate max-w-full">
                        <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{email}</span>
                      </span>
                    )}
                    {profile?.country_of_education && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {profile.country_of_education}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </header>

            <Tabs defaultValue={defaultTab} className="space-y-2">
              <TabsList className="bg-muted/40 border border-border/60 h-7 p-0.5 rounded-lg gap-0.5">
                {permission.can_view_profile && (
                  <TabsTrigger value="profile" className="rounded-md px-2 text-[10px] h-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <User className="h-3 w-3 mr-1" />Profile
                  </TabsTrigger>
                )}
                {permission.can_view_documents && (
                  <TabsTrigger value="documents" title="Documents" className="rounded-md px-2 text-[10px] h-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <FileText className="h-3 w-3 mr-1" />Docs
                    <span className="ml-1 text-[9px] opacity-60">{documents.length}</span>
                  </TabsTrigger>
                )}
                {permission.can_view_applications && (
                  <TabsTrigger value="applications" title="Applications" className="rounded-md px-2 text-[10px] h-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <GraduationCap className="h-3 w-3 mr-1" />Apps
                    <span className="ml-1 text-[9px] opacity-60">{applications.length}</span>
                  </TabsTrigger>
                )}
              </TabsList>

              {permission.can_view_profile && (
                <TabsContent value="profile" className="mt-0">
                  <Card className="border-border/60 shadow-none">
                    <CardContent className="p-2.5">
                      {!profile ? (
                        <p className="text-xs text-muted-foreground text-center py-4">Profile not available</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-2">
                          {[
                            ['Full Name', profile?.full_name],
                            ['Date of Birth', profile?.date_of_birth],
                            ['Nationality', profile?.nationality],
                            ['Country of Education', profile?.country_of_education],
                            ['Bachelor Degree', profile?.bachelor_degree_name],
                            ['Bachelor Field', profile?.bachelor_field],
                            ['Bachelor CGPA', profile?.bachelor_cgpa_percentage],
                            ['Master Degree', profile?.master_degree_name],
                            ['German Level', profile?.german_level],
                            ['IELTS / TOEFL', profile?.ielts_toefl_score],
                            ['Intended Course', profile?.intended_master_course],
                            ['Intake', profile?.intake],
                          ].map(([label, value]) => (
                            <div key={label as string} className="border-l-2 border-border/60 pl-2 py-0.5">
                              <p className="text-[9px] font-semibold tracking-wider uppercase text-muted-foreground">{label as string}</p>
                              <p className="text-[11px] font-medium mt-0.5 truncate">{(value as string) || '—'}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {permission.can_view_documents && (
                <TabsContent value="documents" className="mt-0">
                  <Card className="border-border/60 shadow-none">
                    <CardContent className="p-0">
                      {documents.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">No documents uploaded</p>
                      ) : (
                        <div className="divide-y divide-border/60">
                          {documents.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between gap-2 px-2.5 py-2 hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="h-6 w-6 rounded bg-muted/60 flex items-center justify-center shrink-0">
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-medium truncate">{doc.file_name}</p>
                                  <p className="text-[9px] text-muted-foreground truncate">{doc.category} · {doc.module || 'General'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={() => downloadDocument(doc)}
                                  title="Download"
                                >
                                  <Download className="h-3 w-3" />
                                </button>
                                <Badge
                                  variant={doc.status === 'approved' ? 'default' : 'secondary'}
                                  className="text-[8px] px-1.5 py-0 h-4 capitalize"
                                >
                                  {doc.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {permission.can_view_applications && (
                <TabsContent value="applications" className="mt-0">
                  <Card className="border-border/60 shadow-none">
                    <CardContent className="p-0">
                      {applications.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">No applications yet</p>
                      ) : (
                        <div className="divide-y divide-border/60">
                          {applications.map((app: any) => (
                            <div key={app.id} className="flex items-center justify-between gap-2 px-2.5 py-2 hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="h-7 w-7 rounded bg-gradient-to-br from-primary/10 to-accent/15 flex items-center justify-center shrink-0">
                                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-medium truncate">{app.university_name}</p>
                                  <p className="text-[9px] text-muted-foreground truncate">{app.program_name}</p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-[8px] px-1.5 py-0 h-4 capitalize shrink-0">
                                {app.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
};

export default EditorStudentProfile;
