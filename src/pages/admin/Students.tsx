import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  files?: Database['public']['Tables']['files']['Row'][];
};

export default function Students() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsOpen, setDocsOpen] = useState(false);
  const [docsForStudent, setDocsForStudent] = useState<{full_name?: string|null; documents: any[]; files: any[]} | null>(null);
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
          applications(id, status, university_name),
          service_requests(id, status, service_type)
        `)
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch documents in bulk by user_id to avoid ambiguous relationships
      const userIds = (data || []).map((s: any) => s.user_id).filter(Boolean);
      let docsByUser: Record<string, any[]> = {};
      let filesByUser: Record<string, any[]> = {};
      if (userIds.length > 0) {
        const { data: docsData } = await supabase
          .from('documents' as any)
          .select('id,user_id,category,file_name,file_url,created_at')
          .in('user_id', userIds);
        (docsData || []).forEach((d: any) => {
          if (!docsByUser[d.user_id]) docsByUser[d.user_id] = [];
          docsByUser[d.user_id].push(d);
        });

        // Fetch files uploaded via files table
        const { data: filesData } = await supabase
          .from('files' as any)
          .select('id,user_id,file_name,file_path,file_size,file_type,created_at,module')
          .in('user_id', userIds);
        (filesData || []).forEach((f: any) => {
          if (!filesByUser[f.user_id]) filesByUser[f.user_id] = [];
          filesByUser[f.user_id].push(f);
        });
      }

      // Safely set the data with proper type handling and attach documents
      const studentsData = (data || []).map((student: any) => ({
        ...student,
        applications: Array.isArray(student.applications) ? student.applications : [],
        documents: docsByUser[student.user_id] || [],
        files: filesByUser[student.user_id] || [],
        service_requests: Array.isArray(student.service_requests) ? student.service_requests : []
      }));

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
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
          <p className="text-muted-foreground">Manage and track all student profiles with live updates</p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Search by name, student ID, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              <Select value={apsFilter} onValueChange={setApsFilter}>
                <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full">
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
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>Showing {filteredStudents.length} of {students.length} students</p>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Student Profiles ({filteredStudents.length})</span>
              <span className="hidden lg:inline text-xs text-muted-foreground">Tip: Scroll horizontally to view more columns</span>
            </CardTitle>
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
              <div className="overflow-x-auto max-h-[70vh]">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left p-3 font-medium whitespace-nowrap">Student</th>
                      <th className="text-left p-3 font-medium hidden sm:table-cell whitespace-nowrap">Student ID</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell whitespace-nowrap">APS Pathway</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell whitespace-nowrap">German Level</th>
                      <th className="text-left p-3 font-medium hidden lg:table-cell whitespace-nowrap">Progress</th>
                      <th className="text-left p-3 font-medium hidden lg:table-cell whitespace-nowrap">Applications</th>
                      <th className="text-left p-3 font-medium whitespace-nowrap">Documents</th>
                      <th className="text-left p-3 font-medium hidden sm:table-cell whitespace-nowrap">Joined</th>
                      <th className="text-left p-3 font-medium whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="align-middle">
                    {filteredStudents.map((student) => {
                      const progress = getProgressPercentage(student);
                      return (
                        <tr key={student.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3 min-w-[220px]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <UserCheck className="h-5 w-5 text-primary" />
                              </div>
                              <div className="max-w-[280px]">
                                <p className="font-medium truncate" title={student.full_name || undefined}>{student.full_name || 'Unnamed Student'}</p>
                                <p className="text-xs text-muted-foreground">ID: {student.user_id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <Badge variant="outline" className="font-mono">
                              {generateStudentId(students.indexOf(student) + 1)}
                            </Badge>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <Badge className={getAPSStatusColor(student.aps_pathway)}>
                              {student.aps_pathway?.replace('_', ' ').toUpperCase() || 'Not Set'}
                            </Badge>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <Badge className={getGermanLevelColor(student.german_level)}>
                              {student.german_level?.toUpperCase() || 'None'}
                            </Badge>
                          </td>
                          <td className="p-3 hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{progress}%</span>
                            </div>
                          </td>
                          <td className="p-3 hidden lg:table-cell">
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{student.applications?.length || 0}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{(student.documents?.length || 0) + (student.files?.length || 0)}</span>
                              {(student.documents && student.documents.length > 0) || (student.files && student.files.length > 0) ? (
                                <Button size="sm" variant="outline" onClick={() => {
                                  setDocsForStudent({ full_name: student.full_name, documents: (student.documents as any) || [], files: (student.files as any) || [] });
                                  setDocsOpen(true);
                                }}>View</Button>
                              ) : null}
                            </div>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm whitespace-nowrap">
                                {new Date(student.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link to={`/admin/students/${student.user_id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Profile
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

      {/* Documents Dialog */}
      <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documents {docsForStudent?.full_name ? `— ${docsForStudent.full_name}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-3">
              <p className="text-sm font-medium">From documents table</p>
              {(!docsForStudent?.documents || docsForStudent.documents.length === 0) && (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              )}
              {docsForStudent?.documents?.map((doc: any) => {
                const url = doc.file_url || null;
                const handleDownload = () => {
                  if (!url) return;
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = doc.file_name || 'document';
                  link.click();
                };
                return (
                  <div key={`doc-${doc.id}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                    <div className="min-w-0">
                      <p className="font-medium text-sm break-words whitespace-normal">{doc.file_name || 'Document'}</p>
                      <p className="text-xs text-muted-foreground break-words whitespace-normal">{doc.category || 'uncategorized'}</p>
                    </div>
                    {url ? (
                      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                        <a href={url} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto">Open</Button>
                        </a>
                        <Button size="sm" variant="ghost" className="w-full sm:w-auto" onClick={handleDownload}>Download</Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No link available</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">From files table</p>
              {(!docsForStudent?.files || docsForStudent.files.length === 0) && (
                <p className="text-sm text-muted-foreground">No files uploaded.</p>
              )}
              {docsForStudent?.files?.map((file: any) => {
                // Create a signed URL for storage path when opening/downloading via UI
                const handleOpen = async () => {
                  try {
                    const { data } = await supabase.storage
                      .from('documents')
                      .createSignedUrl(file.file_path, 300);
                    if (data?.signedUrl) {
                      window.open(data.signedUrl, '_blank');
                    }
                  } catch (e) {}
                };
                const handleDownload = async () => {
                  try {
                    const { data } = await supabase.storage
                      .from('documents')
                      .createSignedUrl(file.file_path, 300);
                    if (data?.signedUrl) {
                      const link = document.createElement('a');
                      link.href = data.signedUrl;
                      link.download = file.file_name || 'file';
                      link.click();
                    }
                  } catch (e) {}
                };
                return (
                  <div key={`file-${file.id}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                    <div className="min-w-0">
                      <p className="font-medium text-sm break-words whitespace-normal">{file.file_name || 'File'}</p>
                      <p className="text-xs text-muted-foreground break-words whitespace-normal">{file.module || 'general'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                      <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={handleOpen}>Open</Button>
                      <Button size="sm" variant="ghost" className="w-full sm:w-auto" onClick={handleDownload}>Download</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
