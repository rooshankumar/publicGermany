import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  GraduationCap,
  FileText,
  Download,
  Eye,
  MapPin,
  Award,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type StudentProfile = Database['public']['Tables']['profiles']['Row'] & {
  applications?: Database['public']['Tables']['applications']['Row'][];
  documents?: Database['public']['Tables']['documents']['Row'][];
  service_requests?: Database['public']['Tables']['service_requests']['Row'][];
};

export default function StudentProfile() {
  const { studentId } = useParams();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStudentProfile = async () => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          applications(*),
          documents(*),
          service_requests(*)
        `)
        .eq('user_id', studentId)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch student profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId]);

  const downloadDocument = async (doc: any) => {
    try {
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.upload_path || doc.file_url, 60);
      
      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = doc.file_name;
        link.click();
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const viewDocument = async (doc: any) => {
    try {
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.upload_path || doc.file_url, 60);
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        window.open(doc.file_url, '_blank');
      }
    } catch (error) {
      window.open(doc.file_url, '_blank');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading student profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Student Not Found</h1>
          <Link to="/admin/students" className="text-primary hover:underline">
            Back to Students
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/students">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
          </Link>
        </div>

        {/* Student Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {student.full_name || 'Unknown Student'}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{student.user_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Joined {new Date(student.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={student.aps_pathway ? 'default' : 'secondary'}>
                {student.aps_pathway || 'No APS Pathway'}
              </Badge>
              <Badge variant="outline">
                German: {student.german_level || 'None'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="text-sm">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Country of Education</label>
                  <p className="text-sm">{student.country_of_education || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Work Experience</label>
                  <p className="text-sm">
                    {student.work_experience_years ? `${student.work_experience_years} years` : 'Not provided'}
                    {student.work_experience_field && ` in ${student.work_experience_field}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Class 10 & 12</label>
                  <p className="text-sm">
                    10th: {student.class_10_marks || 'N/A'} | 
                    12th: {student.class_12_marks || 'N/A'} ({student.class_12_stream || 'N/A'})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bachelor's Degree</label>
                  <p className="text-sm">
                    {student.bachelor_degree_name || 'Not provided'} 
                    {student.bachelor_field && ` in ${student.bachelor_field}`}
                    {student.bachelor_cgpa_percentage && ` - ${student.bachelor_cgpa_percentage}`}
                  </p>
                  {student.bachelor_credits_ects && (
                    <p className="text-xs text-muted-foreground">
                      {student.bachelor_credits_ects} ECTS credits, {student.bachelor_duration_years} years
                    </p>
                  )}
                </div>
                {student.master_degree_name && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Master's Degree</label>
                    <p className="text-sm">
                      {student.master_degree_name} 
                      {student.master_field && ` in ${student.master_field}`}
                      {student.master_cgpa_percentage && ` - ${student.master_cgpa_percentage}`}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Language Score</label>
                  <p className="text-sm">{student.ielts_toefl_score || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              University Applications ({student.applications?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.applications && student.applications.length > 0 ? (
              <div className="space-y-3">
                {student.applications.map((app) => (
                  <div key={app.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{app.university_name}</h4>
                        <p className="text-sm text-muted-foreground">{app.program_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Applied: {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        app.status === 'offer' ? 'default' :
                        app.status === 'interview' ? 'secondary' :
                        app.status === 'rejected' ? 'destructive' : 'outline'
                      }>
                        {app.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No applications found</p>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({student.documents?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.documents && student.documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {student.documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{doc.category}</h4>
                        <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewDocument(doc)}
                          className="px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadDocument(doc)}
                          className="px-2"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No documents uploaded</p>
            )}
          </CardContent>
        </Card>

        {/* Service Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Service Requests ({student.service_requests?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.service_requests && student.service_requests.length > 0 ? (
              <div className="space-y-3">
                {student.service_requests.map((req) => (
                  <div key={req.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{req.service_type}</h4>
                        <p className="text-sm text-muted-foreground">
                          {req.service_price} {req.service_currency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested: {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        req.status === 'in_review' ? 'secondary' :
                        req.status === 'payment_pending' ? 'default' :
                        req.status === 'new' ? 'outline' : 'secondary'
                      }>
                        {req.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No service requests found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}