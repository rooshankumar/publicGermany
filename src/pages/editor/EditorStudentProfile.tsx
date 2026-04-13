import { useParams, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useEditorPermissions } from '@/hooks/useEditorPermissions';
import InlineLoader from '@/components/InlineLoader';
import { User, FileText, GraduationCap, CreditCard } from 'lucide-react';

const EditorStudentProfile = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const { getPermissionForStudent, loading: permLoading } = useEditorPermissions();
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const permission = studentId ? getPermissionForStudent(studentId) : null;

  useEffect(() => {
    if (permLoading || !studentId || !permission) return;

    const fetchData = async () => {
      setLoading(true);
      const promises: Promise<any>[] = [];

      if (permission.can_view_profile) {
        promises.push(
          supabase.from('profiles').select('*').eq('user_id', studentId).maybeSingle()
            .then(({ data }) => { if (data) setProfile(data); }) as Promise<any>
        );
      }
      if (permission.can_view_documents) {
        promises.push(
          supabase.from('documents').select('*').eq('user_id', studentId).order('created_at', { ascending: false })
            .then(({ data }) => setDocuments(data || [])) as Promise<any>
        );
      }
      if (permission.can_view_applications) {
        promises.push(
          supabase.from('applications').select('*').eq('user_id', studentId).order('created_at', { ascending: false })
            .then(({ data }) => setApplications(data || [])) as Promise<any>
        );
      }

      await Promise.all(promises);
      setLoading(false);
    };

    fetchData();
  }, [studentId, permLoading, permission?.editor_user_id]);

  if (permLoading) return <Layout><InlineLoader /></Layout>;
  if (!permission) return <Navigate to="/editor" replace />;

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        {loading ? <InlineLoader /> : (
          <>
            {/* Header */}
            <div>
              <h1 className="text-xl font-bold text-foreground">{profile?.full_name || 'Student'}</h1>
              <p className="text-sm text-muted-foreground">{profile?.country_of_education || ''}</p>
            </div>

            <Tabs defaultValue={permission.can_view_profile ? 'profile' : permission.can_view_documents ? 'documents' : 'applications'}>
              <TabsList className="flex-wrap">
                {permission.can_view_profile && <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1" />Profile</TabsTrigger>}
                {permission.can_view_documents && <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5 mr-1" />Documents</TabsTrigger>}
                {permission.can_view_applications && <TabsTrigger value="applications"><GraduationCap className="h-3.5 w-3.5 mr-1" />Applications</TabsTrigger>}
              </TabsList>

              {permission.can_view_profile && (
                <TabsContent value="profile">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {[
                          ['Full Name', profile?.full_name],
                          ['Date of Birth', profile?.date_of_birth],
                          ['Nationality', profile?.nationality],
                          ['Country', profile?.country_of_education],
                          ['Bachelor Degree', profile?.bachelor_degree_name],
                          ['Bachelor Field', profile?.bachelor_field],
                          ['Bachelor CGPA', profile?.bachelor_cgpa_percentage],
                          ['Master Degree', profile?.master_degree_name],
                          ['German Level', profile?.german_level],
                          ['IELTS/TOEFL', profile?.ielts_toefl_score],
                          ['Intended Course', profile?.intended_master_course],
                          ['Intake', profile?.intake],
                        ].map(([label, value]) => (
                          <div key={label as string}>
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="font-medium">{(value as string) || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {permission.can_view_documents && (
                <TabsContent value="documents">
                  <Card>
                    <CardContent className="pt-6">
                      {documents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No documents uploaded</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {documents.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between py-2.5">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{doc.file_name}</p>
                                <p className="text-xs text-muted-foreground">{doc.category} · {doc.module || 'General'}</p>
                              </div>
                              <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
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
                <TabsContent value="applications">
                  <Card>
                    <CardContent className="pt-6">
                      {applications.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No applications yet</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {applications.map((app: any) => (
                            <div key={app.id} className="flex items-center justify-between py-2.5">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{app.university_name}</p>
                                <p className="text-xs text-muted-foreground">{app.program_name}</p>
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
    </Layout>
  );
};

export default EditorStudentProfile;
