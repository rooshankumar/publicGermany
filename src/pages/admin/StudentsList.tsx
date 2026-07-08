import Layout from '@/components/Layout';
import InlineLoader from '@/components/InlineLoader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, UserCheck, GraduationCap, FileText, Calendar, Star } from 'lucide-react';
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
  is_favorite: boolean;
  favorite_id: string | null;
  category: 'paid' | 'regular';
}

type StudentCategory = StudentSummary['category'];

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    if (!user?.id) return;

    fetchStudents();
    
    // Real-time subscription
    const channel = supabase
      .channel(`students-list-changes-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStudents();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        fetchStudents();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_favorites', filter: `admin_id=eq.${user.id}` }, () => {
        fetchStudents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchStudents = async () => {
    if (!user?.id) return;

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

      const favoriteStudentIds = (data || []).map((student: any) => student.user_id).filter(Boolean);
      const { data: favoritesData } = favoriteStudentIds.length > 0
        ? await supabase
            .from('student_favorites')
            .select('id, student_id')
            .eq('admin_id', user.id)
            .in('student_id', favoriteStudentIds)
        : { data: [] as Array<{ id: string; student_id: string | null }> };

      const favoritesMap = new Map(
        (favoritesData || [])
          .filter((favorite) => favorite.student_id)
          .map((favorite) => [favorite.student_id as string, favorite.id])
      );

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
          is_favorite: favoritesMap.has(student.user_id),
          favorite_id: favoritesMap.get(student.user_id) || null,
          category: ((student.service_requests?.length || 0) > 0 ? 'paid' : 'regular') as StudentCategory,
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

  const toggleFavorite = async (student: StudentSummary) => {
    if (!user?.id) return;

    const previousFavoriteId = student.favorite_id;
    const nextFavoriteState = !student.is_favorite;

    setStudents((current) =>
      current.map((entry) =>
        entry.user_id === student.user_id
          ? {
              ...entry,
              is_favorite: nextFavoriteState,
              favorite_id: nextFavoriteState ? entry.favorite_id : null,
            }
          : entry
      )
    );

    try {
      if (student.is_favorite && student.favorite_id) {
        const { error } = await supabase
          .from('student_favorites')
          .delete()
          .eq('id', student.favorite_id);

        if (error) throw error;

        toast({ title: 'Removed from favorites' });
        return;
      }

      const { data, error } = await supabase
        .from('student_favorites')
        .insert({ admin_id: user.id, student_id: student.user_id })
        .select('id')
        .single();

      if (error) throw error;

      setStudents((current) =>
        current.map((entry) =>
          entry.user_id === student.user_id
            ? { ...entry, favorite_id: data.id, is_favorite: true }
            : entry
        )
      );

      toast({ title: 'Added to favorites' });
    } catch (error: any) {
      setStudents((current) =>
        current.map((entry) =>
          entry.user_id === student.user_id
            ? { ...entry, is_favorite: student.is_favorite, favorite_id: previousFavoriteId }
            : entry
        )
      );

      toast({
        title: 'Could not update favorite',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredStudents = students.filter(student => {
    const q = debouncedSearch.toLowerCase().trim();
    return !q || student.full_name.toLowerCase().includes(q);
  });

  filteredStudents.sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) {
      return a.is_favorite ? -1 : 1;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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

  const getCategoryBadge = (category: StudentSummary['category']) => (
    <Badge
      variant="outline"
      className={category === 'paid'
        ? 'bg-primary/10 text-primary border-primary/20'
        : 'bg-muted text-muted-foreground border-border'}
    >
      {category === 'paid' ? 'Paid' : 'Regular'}
    </Badge>
  );

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
            <h1 className="text-base font-bold text-foreground">Student Management</h1>
            <p className="text-[10px] text-muted-foreground">Recently updated students appear first</p>
          </div>
          <Input placeholder="Search students by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-56 h-7 text-xs" />
        </div>

        <Card><CardContent className="p-0">
          {loading ? (
            <div className="p-4 text-center"><InlineLoader label="Loading students" /></div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-6"><p className="text-xs text-muted-foreground">No students found</p></div>
          ) : (
            <div className="divide-y">
              {filteredStudents.map((student) => (
                <div key={student.user_id} onClick={() => navigate(`/admin/students/${student.user_id}`)}
                  className="p-2.5 hover:bg-muted/20 transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <UserCheck className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-semibold text-[12px] truncate">{student.full_name}</h3>
                            {student.is_favorite && <Star className="w-3 h-3 fill-primary text-primary" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {getCategoryBadge(student.category)}
                        {getAPSBadge(student.aps_pathway)}
                        {getGermanBadge(student.german_level)}
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">{student.profile_completion}%</Badge>
                      </div>
                      <div className="flex gap-3 text-[10px] text-muted-foreground mt-1.5">
                        <span>Apps: {student.applications_count}</span>
                        <span>Services: {student.service_requests_count}</span>
                        <span>Joined: {new Date(student.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); toggleFavorite(student); }}>
                        <Star className={`w-3.5 h-3.5 ${student.is_favorite ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
                      </Button>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
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
