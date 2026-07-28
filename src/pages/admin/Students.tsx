import Layout from '@/components/Layout';
import InlineLoader from '@/components/InlineLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useMemo, useState } from 'react';
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
  Edit3,
  DollarSign
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type StudentProfile = Database['public']['Tables']['profiles']['Row'] & {
  applications?: Database['public']['Tables']['applications']['Row'][];
  documents?: Database['public']['Tables']['documents']['Row'][];
  service_requests?: Database['public']['Tables']['service_requests']['Row'][];
};

// Simple debounce hook to avoid filtering on every keystroke
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Students() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsOpen, setDocsOpen] = useState(false);
  const [docsForStudent, setDocsForStudent] = useState<{full_name?: string|null; documents: any[]} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [apsFilter, setApsFilter] = useState('all');
  const [germanFilter, setGermanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'oldest'
  const [paidTab, setPaidTab] = useState('regular');
  const [paidStudentIds, setPaidStudentIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Debounce search to limit filter recalculations while typing
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    fetchStudents();
    
    // Real-time subscription for live updates
    const channel = supabase
      .channel('students-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStudents();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        fetchStudents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, debouncedSearch, apsFilter, germanFilter, sortBy, paidTab, paidStudentIds]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          created_at,
          aps_pathway,
          german_level,
          role,
          applications(id, status, university_name),
          service_requests(id, status, service_type)
        `)
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch all documents in bulk by user_id
      const userIds = (data || []).map((s: any) => s.user_id).filter(Boolean);
      let docsByUser: Record<string, any[]> = {};
      
      if (userIds.length > 0) {
        // Fetch only necessary columns for documents
        const { data: docsData } = await supabase
          .from('documents' as any)
          .select('id,user_id,category,file_name,upload_path,module,status')
          .in('user_id', userIds);
        
        (docsData || []).forEach((d: any) => {
          if (!docsByUser[d.user_id]) docsByUser[d.user_id] = [];
          docsByUser[d.user_id].push(d);
        });
      }

      // Fetch payments to determine paid students
      if (userIds.length > 0) {
        const { data: paymentsData } = await supabase
          .from('service_requests' as any)
          .select(`user_id, service_payments ( status )`)
          .in('user_id', userIds);
        
        const paidIds = new Set<string>();
        (paymentsData || []).forEach((sr: any) => {
          if (sr.service_payments && Array.isArray(sr.service_payments)) {
            sr.service_payments.forEach((p: any) => {
              if (p.status === 'received') paidIds.add(sr.user_id);
            });
          }
        });
        setPaidStudentIds(paidIds);
      }

      // Safely set the data with proper type handling and attach documents
      const studentsData = (data || []).map((student: any) => ({
        ...student,
        applications: Array.isArray(student.applications) ? student.applications : [],
        documents: docsByUser[student.user_id] || [],
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

    const q = (debouncedSearch || '').toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(student => 
        (student.full_name || '').toLowerCase().includes(q) ||
        (student.user_id || '').toLowerCase().includes(q)
      );
    }

    if (apsFilter !== 'all') {
      filtered = filtered.filter(student => student.aps_pathway === apsFilter);
    }

    if (germanFilter !== 'all') {
      filtered = filtered.filter(student => student.german_level === germanFilter);
    }

    // Filter by paid/regular
    if (paidTab === 'paid') {
      filtered = filtered.filter(student => paidStudentIds.has(student.user_id));
    } else {
      filtered = filtered.filter(student => !paidStudentIds.has(student.user_id));
    }

    // Sort by creation date
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

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
      <div className="space-y-3 max-w-7xl mx-auto">
         <div className="german-stripe w-full" />
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
           <div>
             <h1 className="text-base font-bold text-foreground">Student Management</h1>
             <p className="text-[10px] text-muted-foreground">Manage and track all student profiles</p>
          </div>
          <Tabs value={paidTab} onValueChange={(v) => setPaidTab(v)} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="regular" className="text-xs gap-1.5">
                Regular
                <span className="inline-flex items-center justify-center h-4 min-w-[18px] px-1 rounded-full bg-muted-foreground/15 text-[10px] font-medium">
                  {students.filter(s => !paidStudentIds.has(s.user_id)).length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="paid" className="text-xs gap-1.5">
                <DollarSign className="h-3 w-3" />
                Paid
                <span className="inline-flex items-center justify-center h-4 min-w-[18px] px-1 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-[10px] font-medium">
                  {students.filter(s => paidStudentIds.has(s.user_id)).length}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="shadow-none"><CardContent className="p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold"><Filter className="h-3.5 w-3.5" /> Search & Filter</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5">
            <Input placeholder="Search by name or user ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-7 text-xs" />
            <Select value={apsFilter} onValueChange={setApsFilter}>
              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="APS Pathway" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All APS</SelectItem>
                <SelectItem value="stk" className="text-xs">STK</SelectItem>
                <SelectItem value="bachelor_2_semesters" className="text-xs">Bachelor 2 Sem</SelectItem>
                <SelectItem value="master_applicants" className="text-xs">Master Applicants</SelectItem>
              </SelectContent>
            </Select>
            <Select value={germanFilter} onValueChange={setGermanFilter}>
              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="German Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Levels</SelectItem>
                <SelectItem value="none" className="text-xs">None</SelectItem>
                <SelectItem value="a1" className="text-xs">A1</SelectItem>
                <SelectItem value="a2" className="text-xs">A2</SelectItem>
                <SelectItem value="b1" className="text-xs">B1</SelectItem>
                <SelectItem value="b2" className="text-xs">B2</SelectItem>
                <SelectItem value="c1" className="text-xs">C1</SelectItem>
                <SelectItem value="c2" className="text-xs">C2</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
                <SelectItem value="oldest" className="text-xs">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-[10px] text-muted-foreground">Showing {filteredStudents.length} of {students.length} students</p>
        </CardContent></Card>

        <Card className="shadow-none"><CardContent className="p-0">
          {loading ? (
            <div className="p-4"><InlineLoader label="Loading students" /></div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-6"><p className="text-xs text-muted-foreground">No students found</p></div>
          ) : (
            <div className="overflow-x-auto max-h-[70vh]">
              <table className="w-full border-collapse text-[11px]">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left p-1 font-medium text-[10px] whitespace-nowrap">Student</th>
                    <th className="text-left p-1 font-medium text-[10px] hidden sm:table-cell whitespace-nowrap">ID</th>
                    <th className="text-left p-1 font-medium text-[10px] hidden md:table-cell whitespace-nowrap">APS</th>
                    <th className="text-left p-1 font-medium text-[10px] hidden md:table-cell whitespace-nowrap">German</th>
                    <th className="text-left p-1 font-medium text-[10px] hidden lg:table-cell whitespace-nowrap">Prog.</th>
                    <th className="text-left p-1 font-medium text-[10px] hidden lg:table-cell whitespace-nowrap">Apps</th>
                    <th className="text-left p-1 font-medium text-[10px] whitespace-nowrap">Docs</th>
                    <th className="text-left p-1 font-medium text-[10px] hidden sm:table-cell whitespace-nowrap">Joined</th>
                    <th className="text-left p-1 font-medium text-[10px] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="align-middle">
                  {filteredStudents.map((student) => {
                    const progress = getProgressPercentage(student);
                    return (
                      <tr key={student.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-1 min-w-[140px]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <UserCheck className="h-3 w-3 text-primary" />
                            </div>
                            <div className="max-w-[160px]">
                              <p className="font-medium text-[11px] truncate" title={student.full_name || undefined}>{student.full_name || 'Unnamed'}</p>
                              <p className="text-[9px] text-muted-foreground">{student.user_id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-1 hidden sm:table-cell"><Badge variant="outline" className="font-mono text-[8px] px-1 py-0 h-4">{generateStudentId(students.indexOf(student) + 1)}</Badge></td>
                        <td className="p-1 hidden md:table-cell"><Badge className={`${getAPSStatusColor(student.aps_pathway)} text-[8px] px-1 py-0`}>{student.aps_pathway?.replace('_', ' ').toUpperCase() || '—'}</Badge></td>
                        <td className="p-1 hidden md:table-cell"><Badge className={`${getGermanLevelColor(student.german_level)} text-[8px] px-1 py-0`}>{student.german_level?.toUpperCase() || '—'}</Badge></td>
                        <td className="p-1 hidden lg:table-cell"><div className="flex items-center gap-1"><div className="w-12 bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }} /></div><span className="text-[10px] text-muted-foreground">{progress}%</span></div></td>
                        <td className="p-1 hidden lg:table-cell"><span className="text-[11px]">{student.applications?.length || 0}</span></td>
                        <td className="p-1"><div className="flex items-center gap-1"><GraduationCap className="h-3 w-3 text-muted-foreground" /><span className="text-[11px]">{student.documents?.length || 0}</span>{student.documents && student.documents.length > 0 ? <Button size="sm" variant="outline" className="h-5 text-[8px] px-1" onClick={() => { setDocsForStudent({ full_name: student.full_name, documents: (student.documents as any) || [] }); setDocsOpen(true); }}>View</Button> : null}</div></td>
                        <td className="p-1 hidden sm:table-cell"><span className="text-[10px] whitespace-nowrap">{new Date(student.created_at).toLocaleDateString()}</span></td>
                        <td className="p-1"><div className="flex items-center gap-1"><Button size="sm" variant="outline" className="h-6 text-[9px] px-1.5" asChild><Link to={`/admin/students/${student.user_id}`}><Eye className="h-3 w-3 mr-0.5" />View</Link></Button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent></Card>
      </div>

      <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl p-4">
          <DialogHeader><DialogTitle className="text-sm">Documents {docsForStudent?.full_name ? `— ${docsForStudent.full_name}` : ''}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {(!docsForStudent?.documents || docsForStudent.documents.length === 0) && <p className="text-xs text-muted-foreground text-center py-3">No documents uploaded.</p>}
            {docsForStudent?.documents?.map((doc: any) => (
              <div key={`doc-${doc.id}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 border rounded-lg">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5"><p className="font-medium text-[11px] break-words">{doc.file_name || 'Document'}</p><Badge variant={doc.status === 'approved' ? 'secondary' : doc.status === 'rejected' ? 'destructive' : 'outline'} className="text-[8px] px-1 py-0 capitalize">{doc.status || 'pending'}</Badge></div>
                  <p className="text-[9px] text-muted-foreground">{doc.module === 'additional_documents' ? 'Additional' : doc.category || 'APS Required'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" className="h-6 text-[9px] px-2" onClick={async () => { const { data } = await supabase.storage.from('documents').createSignedUrl(doc.upload_path, 300); if (data?.signedUrl) window.open(data.signedUrl, '_blank'); }}>Open</Button>
                  <Button size="sm" variant="ghost" className="h-6 text-[9px] px-2" onClick={async () => { const { data } = await supabase.storage.from('documents').createSignedUrl(doc.upload_path, 300); if (data?.signedUrl) { const a = document.createElement('a'); a.href = data.signedUrl; a.download = doc.file_name; a.click(); } }}>Download</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
