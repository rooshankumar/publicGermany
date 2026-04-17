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
import InlineLoader from '@/components/InlineLoader';
import { User, FileText, GraduationCap, ArrowLeft, MapPin, Mail } from 'lucide-react';

const EditorStudentProfile = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { permissions, loading: permLoading } = useEditorPermissions();
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState<string>('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const permission = studentId
    ? permissions.find(p => p.student_user_id === studentId) || null
    : null;

  useEffect(() => {
    if (permLoading || !studentId) return;
    if (!permission) {
      setInitialLoading(false);
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
        if (!cancelled) setInitialLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [studentId, permLoading, permission?.id]);

  const loading = initialLoading && !profile && documents.length === 0 && applications.length === 0;

  if (permLoading) return <Layout><div className="p-12"><InlineLoader /></div></Layout>;
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
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-secondary/40 via-background to-background">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground hover:text-primary"
            onClick={() => navigate('/editor')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Roster
          </Button>

          {loading ? (
            <div className="rounded-xl border border-border bg-card p-12">
              <InlineLoader />
            </div>
          ) : (
            <>
              {/* Editorial profile header */}
              <header className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-1 flex">
                  <div className="flex-1 bg-foreground" />
                  <div className="flex-1 bg-destructive" />
                  <div className="flex-1 bg-accent" />
                </div>

                <div className="p-6 md:p-8 pt-8 md:pt-10">
                  <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                    <Avatar className="h-20 w-20 ring-4 ring-secondary shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-primary/15 to-accent/20 text-primary font-serif font-bold text-2xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 min-w-0 flex-1">
                      <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-primary">
                        Student Dossier
                      </p>
                      <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground truncate">
                        {profile?.full_name || 'Student'}
                      </h1>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {profile?.country_of_education && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {profile.country_of_education}
                          </span>
                        )}
                        {profile?.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {profile.phone}
                          </span>
                        )}
                        {profile?.intended_master_course && (
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" /> {profile.intended_master_course}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              <Tabs defaultValue={defaultTab} className="space-y-5">
                <TabsList className="bg-card border border-border h-11 p-1 rounded-xl">
                  {permission.can_view_profile && (
                    <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                      <User className="h-3.5 w-3.5 mr-1.5" />Profile
                    </TabsTrigger>
                  )}
                  {permission.can_view_documents && (
                    <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                      <FileText className="h-3.5 w-3.5 mr-1.5" />Documents
                      <span className="ml-1.5 text-[10px] opacity-70">{documents.length}</span>
                    </TabsTrigger>
                  )}
                  {permission.can_view_applications && (
                    <TabsTrigger value="applications" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                      <GraduationCap className="h-3.5 w-3.5 mr-1.5" />Applications
                      <span className="ml-1.5 text-[10px] opacity-70">{applications.length}</span>
                    </TabsTrigger>
                  )}
                </TabsList>

                {permission.can_view_profile && (
                  <TabsContent value="profile" className="mt-0">
                    <Card className="border-border">
                      <CardContent className="p-6 md:p-8">
                        {!profile ? (
                          <p className="text-sm text-muted-foreground text-center py-6">Profile not available</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
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
                              <div key={label as string} className="border-l-2 border-border pl-3 py-0.5 hover:border-primary transition-colors">
                                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">{label}</p>
                                <p className="text-sm font-medium text-foreground mt-0.5">{(value as string) || '—'}</p>
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
                    <Card className="border-border">
                      <CardContent className="p-2 md:p-3">
                        {documents.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-12">No documents uploaded</p>
                        ) : (
                          <div className="divide-y divide-border">
                            {documents.map((doc: any) => (
                              <div key={doc.id} className="flex items-center justify-between gap-3 p-3 hover:bg-secondary/40 rounded-md transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {doc.category} · {doc.module || 'General'}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant={doc.status === 'approved' ? 'default' : 'secondary'}
                                  className="text-[10px] shrink-0 capitalize"
                                >
                                  {doc.status}
                                </Badge>
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
                    <Card className="border-border">
                      <CardContent className="p-2 md:p-3">
                        {applications.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-12">No applications yet</p>
                        ) : (
                          <div className="divide-y divide-border">
                            {applications.map((app: any) => (
                              <div key={app.id} className="flex items-center justify-between gap-3 p-3 hover:bg-secondary/40 rounded-md transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/10 to-accent/15 flex items-center justify-center shrink-0">
                                    <GraduationCap className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{app.university_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{app.program_name}</p>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="text-[10px] shrink-0 capitalize">
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
      </div>
    </Layout>
  );
};

export default EditorStudentProfile;
