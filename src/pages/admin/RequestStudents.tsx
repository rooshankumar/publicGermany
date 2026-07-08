import Layout from '@/components/Layout';
import InlineLoader from '@/components/InlineLoader';
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-bold text-foreground">Request Management</h1>
            <p className="text-[10px] text-muted-foreground">View service requests by student</p>
          </div>
        </div>

        <Card className="shadow-none"><CardContent className="p-2.5">
          <Input placeholder="Search by student name, email, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-7 text-xs" />
        </CardContent></Card>

        <Card className="shadow-none"><CardContent className="p-0">
          {loading ? (
            <div className="p-4 text-center"><InlineLoader label="Loading students" /></div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-6"><p className="text-xs text-muted-foreground">No students found</p></div>
          ) : (
            <div className="divide-y">
              {filteredStudents.map((student) => (
                <div key={student.user_id} onClick={() => navigate(`/admin/requests/${student.user_id}`)}
                  className="p-2.5 hover:bg-muted/20 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <h3 className="font-semibold text-[12px] truncate">{student.full_name}</h3>
                        {getStatusBadge(student)}
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">{student.total_requests} total</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mb-1.5">{student.email}</p>
                      <div className="flex gap-2 text-[10px]">
                        <span>Pending: <span className="font-medium text-yellow-600">{student.pending_requests}</span></span>
                        <span>In Progress: <span className="font-medium text-blue-600">{student.in_progress_requests}</span></span>
                        <span>Completed: <span className="font-medium text-green-600">{student.completed_requests}</span></span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>
      </div>
    </Layout>
  );
}
