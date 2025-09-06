import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Filter, 
  FileSpreadsheet,
  FileText,
  Calendar,
  Users,
  GraduationCap,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';

export default function Exports() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });
  const { toast } = useToast();

  const exportData = async (type: string, formatType: 'csv' | 'json' = 'csv') => {
    setLoading(true);
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'students':
          const { data: studentsData } = await supabase
            .from('profiles')
            .select(`
              *, 
              applications(id, status, university_name, program_name, created_at),
              documents(id, category, file_name),
              service_requests(id, status, service_type)
            `)
            .eq('role', 'student');
          
          data = studentsData?.map((student, index) => ({
            'Student ID': `GH${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
            'Full Name': student.full_name || '',
            'Email': student.user_id,
            'APS Pathway': student.aps_pathway || '',
            'German Level': student.german_level || '',
            'Applications Count': Array.isArray(student.applications) ? student.applications.length : 0,
            'Documents Count': Array.isArray(student.documents) ? student.documents.length : 0,
            'Service Requests': Array.isArray(student.service_requests) ? student.service_requests.length : 0,
            'Joined Date': format(new Date(student.created_at), 'yyyy-MM-dd')
          })) || [];
          filename = `students_export_${format(new Date(), 'yyyy-MM-dd')}`;
          break;

        case 'applications':
          const { data: appsData } = await supabase
            .from('applications')
            .select(`
              *, 
              profiles(full_name, user_id)
            `)
            .gte('created_at', dateRange.from)
            .lte('created_at', dateRange.to);
          
          data = appsData?.map(app => ({
            'Student Name': (app.profiles as any)?.full_name || '',
            'University': app.university_name,
            'Program': app.program_name,
            'Status': app.status,
            'Application Method': app.application_method || '',
            'Fees (EUR)': app.fees_eur || 0,
            'Start Date': app.start_date || '',
            'Created': format(new Date(app.created_at), 'yyyy-MM-dd')
          })) || [];
          filename = `applications_export_${format(new Date(), 'yyyy-MM-dd')}`;
          break;

        case 'requests':
          const { data: requestsData } = await supabase
            .from('service_requests')
            .select(`
              *, 
              profiles(full_name, user_id)
            `)
            .gte('created_at', dateRange.from)
            .lte('created_at', dateRange.to);
          
          data = requestsData?.map(req => ({
            'Student Name': (req.profiles as any)?.full_name || '',
            'Service Type': req.service_type,
            'Status': req.status,
            'Price': req.service_price || 0,
            'Currency': req.service_currency || 'EUR',
            'Timeline': req.preferred_timeline || '',
            'Created': format(new Date(req.created_at), 'yyyy-MM-dd')
          })) || [];
          filename = `service_requests_export_${format(new Date(), 'yyyy-MM-dd')}`;
          break;
      }

      if (formatType === 'csv') {
        downloadCSV(data, filename);
      } else {
        downloadJSON(data, filename);
      }

      toast({
        title: "Export successful",
        description: `${data.length} records exported successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          `"${String(row[header]).replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const downloadJSON = (data: any[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
  };

  const exportOptions = [
    {
      type: 'students',
      title: 'Students Data',
      description: 'Export all student profiles with applications and documents count',
      icon: Users,
      color: 'text-primary'
    },
    {
      type: 'applications',
      title: 'University Applications',
      description: 'Export all applications with status and deadlines',
      icon: GraduationCap,
      color: 'text-secondary'
    },
    {
      type: 'requests',
      title: 'Service Requests',
      description: 'Export all service requests with status and pricing',
      icon: FileText,
      color: 'text-accent'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Export Center</h1>
          <p className="text-muted-foreground">Export your data in CSV or JSON format for offline analysis</p>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Export Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Date range applies to Applications, Service Requests, and Payments exports
            </p>
          </CardContent>
        </Card>

        {/* Export Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card key={option.type} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base md:text-lg">
                    <Icon className={`h-5 w-5 md:h-6 md:w-6 ${option.color}`} />
                    <span className="truncate">{option.title}</span>
                  </CardTitle>
                  <p className="text-xs md:text-sm text-muted-foreground">{option.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => exportData(option.type, 'csv')}
                      disabled={loading}
                      className="flex-1 text-xs md:text-sm"
                      variant="outline"
                    >
                      <FileSpreadsheet className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      onClick={() => exportData(option.type, 'json')}
                      disabled={loading}
                      className="flex-1 text-xs md:text-sm"
                      variant="outline"
                    >
                      <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      Export JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Export All */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Quick Export All Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export all data types at once for comprehensive backup (Students, Applications, Service Requests)
            </p>
            <Button
              onClick={async () => {
                await Promise.all([
                  exportData('students', 'csv'),
                  exportData('applications', 'csv'),
                  exportData('requests', 'csv'),
                ]);
              }}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              <Download className="h-5 w-5 mr-2" />
              Export All Data (CSV)
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}