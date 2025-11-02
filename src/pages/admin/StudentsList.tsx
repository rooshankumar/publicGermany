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
import { 
  ArrowRight,
  ArrowLeft,
  UserCheck,
  GraduationCap,
  FileText,
  Calendar
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type StudentProfile = Database['public']['Tables']['profiles']['Row'] & {
  applications?: Database['public']['Tables']['applications']['Row'][];
  service_requests?: Database['public']['Tables']['service_requests']['Row'][];
  email?: string;
};

interface StudentSummary {
  user_id: string;
  full_name: string;
  email: string;
  aps_pathway: string | null;
  german_level: string;
  applications_count: number;
  service_requests_count: number;
  created_at: string;
  profile_completion: number;
}

// Simple debounce hook
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function StudentsList() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    fetchStudents();
    
    // Real-time subscription
    const channel = supabase
      .channel('students-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStudents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          applications(id, status),
          service_requests(id, status)
        `)
        .eq('role', 'student')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get emails for all students
      const studentsWithEmails = await Promise.all((data || []).map(async (student: any) => {
        let email = '';
        try {
          const { data: emailData } = await (supabase as any).rpc('get_user_email', { p_user_id: student.user_id });
          email = emailData || '';
        } catch {}

        // Calculate profile completion
        let completion = 0;
        if (student.full_name) completion += 25;
        if (student.aps_pathway) completion += 25;
        if (student.german_level && student.german_level !== 'none') completion += 25;
        if (student.applications && student.applications.length > 0) completion += 25;

        return {
          user_id: student.user_id,
          full_name: student.full_name || 'Unnamed Student',
          email: email,
          aps_pathway: student.aps_pathway,
          german_level: student.german_level || 'none',
          applications_count: student.applications?.length || 0,
          service_requests_count: student.service_requests?.length || 0,
          created_at: student.created_at,
          profile_completion: completion,
        };
      }));

      setStudents(studentsWithEmails);
    } catch (error: any) {
      toast({
        title: "Error fetching students",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const q = debouncedSearch.toLowerCase().trim();
    return !q || student.full_name.toLowerCase().includes(q);
  });

  const getAPSBadge = (pathway: string | null) => {
    if (!pathway) {
      return <Badge variant="outline" className="bg-muted/10 text-muted-foreground">Not Set</Badge>;
    }
    const colors: Record<string, string> = {
      'stk': 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      'bachelor_2_semesters': 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      'master_applicants': 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    };
    return (
      <Badge variant="outline" className={colors[pathway] || 'bg-muted/10 text-muted-foreground'}>
        {pathway.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getGermanBadge = (level: string) => {
    const colors: Record<string, string> = {
      'none': 'bg-muted/10 text-muted-foreground',
      'a1': 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      'a2': 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      'b1': 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      'b2': 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      'c1': 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      'c2': 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    };
    return (
      <Badge variant="outline" className={colors[level.toLowerCase()] || 'bg-muted/10 text-muted-foreground'}>
        {level.toUpperCase()}
      </Badge>
    );
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
            <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
            <p className="text-muted-foreground">Recently updated students appear first</p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[300px]">
            <Input
              placeholder="Search students by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Students List */}
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
                    onClick={() => navigate(`/admin/students/${student.user_id}`)}
                    className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserCheck className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">{student.full_name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {getAPSBadge(student.aps_pathway)}
                          {getGermanBadge(student.german_level)}
                          <Badge variant="outline" className="text-xs">
                            Profile: {student.profile_completion}%
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Applications: </span>
                            <span className="font-medium">{student.applications_count}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Services: </span>
                            <span className="font-medium">{student.service_requests_count}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Joined: </span>
                            <span className="font-medium">{new Date(student.created_at).toLocaleDateString()}</span>
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
