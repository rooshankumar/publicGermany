import Layout from '@/components/Layout';
import InlineLoader from '@/components/InlineLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface StudentRequestSummary {
  user_id: string;
  full_name: string;
  email: string;
  total_requests: number;
  pending_requests: number;
  in_progress_requests: number;
  completed_requests: number;
  last_updated: string;
}

export default function RequestStudents() {
  const [students, setStudents] = useState<StudentRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentSummaries();
    
    // Real-time subscription
    const channel = supabase
      .channel('request-students-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        fetchStudentSummaries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStudentSummaries = async () => {
    setLoading(true);
    try {
      // Fetch all service requests with profiles
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id,
          user_id,
          status,
          updated_at,
          profiles:profiles!inner(user_id, full_name)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Group by user_id and calculate summaries
      const studentMap = new Map<string, StudentRequestSummary>();

      for (const request of data || []) {
        const userId = request.user_id;
        
        // Get email for this user
        let email = '';
        try {
          const { data: emailData } = await (supabase as any).rpc('get_user_email', { p_user_id: userId });
          email = emailData || '';
        } catch {}

        if (!studentMap.has(userId)) {
          studentMap.set(userId, {
            user_id: userId,
            full_name: request.profiles?.full_name || 'Unknown',
            email: email,
            total_requests: 0,
            pending_requests: 0,
            in_progress_requests: 0,
            completed_requests: 0,
            last_updated: request.updated_at,
          });
        }

        const student = studentMap.get(userId)!;
        student.total_requests++;

        // Count by status
        switch (request.status) {
          case 'new':
          case 'in_review':
          case 'payment_pending':
            student.pending_requests++;
            break;
          case 'in_progress':
            student.in_progress_requests++;
            break;
          case 'completed':
            student.completed_requests++;
            break;
        }

        // Update last_updated to most recent
        if (new Date(request.updated_at) > new Date(student.last_updated)) {
          student.last_updated = request.updated_at;
        }
      }

      setStudents(Array.from(studentMap.values()));
    } catch (error: any) {
      toast({
        title: "Error fetching student summaries",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const q = searchTerm.toLowerCase().trim();
    return !q || 
      student.full_name.toLowerCase().includes(q) ||
      student.email.toLowerCase().includes(q) ||
      student.user_id.toLowerCase().includes(q);
  });

  const getStatusBadge = (student: StudentRequestSummary) => {
    if (student.pending_requests > 0) {
      return <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
        {student.pending_requests} Pending
      </Badge>;
    }
    if (student.in_progress_requests > 0) {
      return <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
        {student.in_progress_requests} In Progress
      </Badge>;
    }
    return <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
      All Completed
    </Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Request Management</h1>
            <p className="text-muted-foreground">View service requests by student</p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Students</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <Input
              placeholder="Search by student name, email, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle>Students ({filteredStudents.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <InlineLoader label="Loading students" />
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No students found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <div
                    key={student.user_id}
                    onClick={() => navigate(`/admin/requests/${student.user_id}`)}
                    className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-lg truncate">{student.full_name}</h3>
                          {getStatusBadge(student)}
                          <Badge variant="outline" className="text-xs">
                            {student.total_requests} total
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-3">{student.email}</p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total: </span>
                            <span className="font-medium">{student.total_requests}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pending: </span>
                            <span className="font-medium text-yellow-600 dark:text-yellow-400">
                              {student.pending_requests}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">In Progress: </span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {student.in_progress_requests}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Completed: </span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {student.completed_requests}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
