import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEditorPermissions } from '@/hooks/useEditorPermissions';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InlineLoader from '@/components/InlineLoader';

interface StudentSummary {
  user_id: string;
  full_name: string | null;
  country_of_education: string | null;
  created_at: string;
}

const EditorDashboard = () => {
  const { assignedStudentIds, permissions, loading: permLoading } = useEditorPermissions();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (permLoading) return;
    if (assignedStudentIds.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const fetchStudents = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, country_of_education, created_at')
        .in('user_id', assignedStudentIds);
      if (!error) setStudents((data || []) as StudentSummary[]);
      setLoading(false);
    };
    fetchStudents();
  }, [assignedStudentIds.join(','), permLoading]);

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editor Dashboard</h1>
          <p className="text-sm text-muted-foreground">View assigned students and their details</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Students ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading || permLoading ? (
              <InlineLoader />
            ) : students.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No students assigned to you yet. Contact your admin for access.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {students.map((student) => {
                  const perm = permissions.find(p => p.student_user_id === student.user_id);
                  return (
                    <div key={student.user_id} className="flex items-center justify-between py-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {student.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{student.full_name || 'Unnamed'}</p>
                          <p className="text-xs text-muted-foreground">{student.country_of_education || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden sm:flex gap-1">
                          {perm?.can_view_profile && <Badge variant="secondary" className="text-[10px]">Profile</Badge>}
                          {perm?.can_view_documents && <Badge variant="secondary" className="text-[10px]">Docs</Badge>}
                          {perm?.can_view_applications && <Badge variant="secondary" className="text-[10px]">Apps</Badge>}
                          {perm?.can_view_payments && <Badge variant="secondary" className="text-[10px]">Pay</Badge>}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => navigate(`/editor/students/${student.user_id}`)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditorDashboard;
