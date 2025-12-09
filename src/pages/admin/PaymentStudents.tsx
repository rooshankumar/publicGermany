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

interface StudentPaymentSummary {
  user_id: string;
  full_name: string;
  email: string;
  total_amount: number;
  received_amount: number;
  pending_amount: number;
  currency: string;
  request_count: number;
  last_updated: string;
}

export default function PaymentStudents() {
  const [students, setStudents] = useState<StudentPaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentSummaries();
    
    // Real-time subscription
    const channel = supabase
      .channel('payment-students-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_payments' }, () => {
        fetchStudentSummaries();
      })
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
      // Fetch all service requests with profiles and payments
      const { data, error } = await supabase
        .from('service_requests' as any)
        .select(`
          id,
          user_id,
          service_price,
          service_currency,
          target_total_amount,
          target_currency,
          updated_at,
          profiles:profiles!inner(user_id, full_name),
          service_payments (
            amount,
            status,
            currency
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Group by user_id and calculate summaries
      const studentMap = new Map<string, StudentPaymentSummary>();

      for (const request of (data || []) as any[]) {
        const userId = request.user_id;
        const payments = request.service_payments || [];
        
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
            total_amount: 0,
            received_amount: 0,
            pending_amount: 0,
            currency: request.target_currency || request.service_currency || 'INR',
            request_count: 0,
            last_updated: request.updated_at,
          });
        }

        const student = studentMap.get(userId)!;
        student.request_count++;

        // Calculate amounts using service-level target total and received sums
        const paymentsArr = (payments || []) as any[];
        const receivedSum = paymentsArr
          .filter((p: any) => (p?.status || '').toLowerCase() === 'received')
          .reduce((sum: number, p: any) => sum + (Number(p?.amount) || 0), 0);

        const targetTotal = Number(request.target_total_amount ?? request.service_price ?? 0) || 0;
        const remaining = Math.max(0, targetTotal - receivedSum);

        student.total_amount += targetTotal;
        student.received_amount += receivedSum;
        student.pending_amount += remaining;

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

  // Calculate overall totals
  const overallTotals = filteredStudents.reduce(
    (acc, student) => ({
      total: acc.total + student.total_amount,
      received: acc.received + student.received_amount,
      pending: acc.pending + student.pending_amount,
    }),
    { total: 0, received: 0, pending: 0 }
  );

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
            <h1 className="text-3xl font-bold text-foreground">Payment Management</h1>
            <p className="text-muted-foreground">View payment status by student</p>
          </div>
        </div>

        {/* Overall Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">INR {overallTotals.total.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Amount Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                INR {overallTotals.received.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Amount Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                INR {overallTotals.pending.toLocaleString()}
              </div>
            </CardContent>
          </Card>
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
                    onClick={() => navigate(`/admin/payments/${student.user_id}`)}
                    className="p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate">{student.full_name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {student.request_count} {student.request_count === 1 ? 'request' : 'requests'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-3">{student.email}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total: </span>
                            <span className="font-medium">{student.currency} {student.total_amount.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Received: </span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {student.currency} {student.received_amount.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pending: </span>
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              {student.currency} {student.pending_amount.toLocaleString()}
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
