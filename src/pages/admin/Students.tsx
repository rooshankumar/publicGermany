import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  GraduationCap,
  FileText,
  Calendar,
  Eye,
  Edit3
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type StudentProfile = Database['public']['Tables']['profiles']['Row'] & {
  applications?: Database['public']['Tables']['applications']['Row'][];
  documents?: Database['public']['Tables']['documents']['Row'][];
  service_requests?: Database['public']['Tables']['service_requests']['Row'][];
};

export default function Students() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [apsFilter, setApsFilter] = useState('all');
  const [germanFilter, setGermanFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
    
    // Real-time subscription for live updates
    const channel = supabase
      .channel('students-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStudents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, apsFilter, germanFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          applications!applications_user_id_fkey(id, status, university_name),
          documents!documents_user_id_fkey(id, category, file_name),
          service_requests!service_requests_user_id_fkey(id, status, service_type)
        `)
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Safely set the data with proper type handling
      const studentsData = data?.map(student => ({
        ...student,
        applications: Array.isArray(student.applications) ? student.applications : [],
        documents: Array.isArray(student.documents) ? student.documents : [],
        service_requests: Array.isArray(student.service_requests) ? student.service_requests : []
      })) || [];

      setStudents(studentsData as StudentProfile[]);
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

  const generateStudentId = (index: number) => {
    const year = new Date().getFullYear();
    return `GH${year}-${String(index).padStart(3, '0')}`;
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (apsFilter !== 'all') {
      filtered = filtered.filter(student => student.aps_pathway === apsFilter);
    }

    if (germanFilter !== 'all') {
      filtered = filtered.filter(student => student.german_level === germanFilter);
    }

    setFilteredStudents(filtered);
  };

  const updateStudentProfile = async (studentId: string, updates: Database['public']['Tables']['profiles']['Update']) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Student updated",
        description: "Student profile updated successfully",
      });
      
      fetchStudents(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error updating student",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAPSStatusColor = (pathway: string | null) => {
    switch (pathway) {
      case 'stk': return 'bg-success/10 text-success';
      case 'bachelor_2_semesters': return 'bg-warning/10 text-warning';
      case 'master_applicants': return 'bg-secondary/10 text-secondary';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getGermanLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'none': 'bg-muted/10 text-muted-foreground',
      'a1': 'bg-destructive/10 text-destructive',
      'a2': 'bg-warning/10 text-warning',
      'b1': 'bg-secondary/10 text-secondary',
      'b2': 'bg-primary/10 text-primary',
      'c1': 'bg-success/10 text-success',
      'c2': 'bg-success/10 text-success'
    };
    return colors[level?.toLowerCase()] || 'bg-muted/10 text-muted-foreground';
  };

  const getProgressPercentage = (student: StudentProfile) => {
    let progress = 0;
    if (student.full_name) progress += 20;
    if (student.aps_pathway) progress += 20;
    if (student.german_level && student.german_level !== 'none') progress += 20;
    if (student.applications && student.applications.length > 0) progress += 20;
    if (student.documents && student.documents.length > 0) progress += 20;
    return progress;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
          <p className="text-muted-foreground">Manage and track all student profiles with live updates</p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, student ID, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={apsFilter} onValueChange={setApsFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="APS Pathway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All APS Status</SelectItem>
                  <SelectItem value="stk">STK</SelectItem>
                  <SelectItem value="bachelor_2_semesters">Bachelor 2 Semesters</SelectItem>
                  <SelectItem value="master_applicants">Master Applicants</SelectItem>
                </SelectContent>
              </Select>
              <Select value={germanFilter} onValueChange={setGermanFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="German Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="a1">A1</SelectItem>
                  <SelectItem value="a2">A2</SelectItem>
                  <SelectItem value="b1">B1</SelectItem>
                  <SelectItem value="b2">B2</SelectItem>
                  <SelectItem value="c1">C1</SelectItem>
                  <SelectItem value="c2">C2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredStudents.length} of {students.length} students
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Student Profiles ({filteredStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No students found matching your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Student</th>
                      <th className="text-left p-3 font-medium">Student ID</th>
                      <th className="text-left p-3 font-medium">APS Pathway</th>
                      <th className="text-left p-3 font-medium">German Level</th>
                      <th className="text-left p-3 font-medium">Progress</th>
                      <th className="text-left p-3 font-medium">Applications</th>
                      <th className="text-left p-3 font-medium">Documents</th>
                      <th className="text-left p-3 font-medium">Joined</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => {
                      const progress = getProgressPercentage(student);
                      return (
                        <tr key={student.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <UserCheck className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{student.full_name || 'Unnamed Student'}</p>
                                <p className="text-sm text-muted-foreground">ID: {student.user_id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono">
                              {generateStudentId(students.indexOf(student) + 1)}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={getAPSStatusColor(student.aps_pathway)}>
                              {student.aps_pathway?.replace('_', ' ').toUpperCase() || 'Not Set'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={getGermanLevelColor(student.german_level)}>
                              {student.german_level?.toUpperCase() || 'None'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{progress}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{student.applications?.length || 0}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{student.documents?.length || 0}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(student.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link to={`/admin/student-profile?id=${student.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  // Quick edit functionality can be added here
                                  toast({
                                    title: "Quick Edit",
                                    description: "Quick edit feature coming soon",
                                  });
                                }}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
