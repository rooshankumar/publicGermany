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

      const studentMap = new Map<string, StudentPaymentSummary>();

      for (const request of (data || []) as any[]) {
        const userId = request.user_id;
        const payments = request.service_payments || [];
        
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

        const paymentsArr = (payments || []) as any[];
        const receivedSum = paymentsArr
          .filter((p: any) => (p?.status || '').toLowerCase() === 'received')
          .reduce((sum: number, p: any) => sum + (Number(p?.amount) || 0), 0);

        const targetTotal = Number(request.target_total_amount ?? request.service_price ?? 0) || 0;
        const remaining = Math.max(0, targetTotal - receivedSum);

        student.total_amount += targetTotal;
        student.received_amount += receivedSum;
        student.pending_amount += remaining;

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
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-bold">Payments</h1>
          </div>
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-xs w-32 sm:w-48"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/30 border rounded-md p-1.5 sm:p-3 text-center">
            <p className="text-[8px] sm:text-xs text-muted-foreground uppercase tracking-tight leading-none mb-1">Total</p>
            <p className="text-[10px] sm:text-lg font-bold truncate">₹{(overallTotals.total / 1000).toFixed(1)}k</p>
          </div>
          <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-md p-1.5 sm:p-3 text-center">
            <p className="text-[8px] sm:text-xs text-green-600 dark:text-green-400 uppercase tracking-tight leading-none mb-1">Recv.</p>
            <p className="text-[10px] sm:text-lg font-bold text-green-600 dark:text-green-400 truncate">₹{(overallTotals.received / 1000).toFixed(1)}k</p>
          </div>
          <div className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-md p-1.5 sm:p-3 text-center">
            <p className="text-[8px] sm:text-xs text-orange-600 dark:text-orange-400 uppercase tracking-tight leading-none mb-1">Pend.</p>
            <p className="text-[10px] sm:text-lg font-bold text-orange-600 dark:text-orange-400 truncate">₹{(overallTotals.pending / 1000).toFixed(1)}k</p>
          </div>
        </div>

        <Card className="shadow-none border-none sm:border overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="py-10"><InlineLoader label="Loading..." /></div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-xs text-muted-foreground">No students</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] sm:text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                    <tr>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2 text-center">Summary</th>
                      <th className="px-3 py-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents.map((student) => (
                      <tr 
                        key={student.user_id} 
                        className="hover:bg-muted/20 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/admin/payments/${student.user_id}`)}
                      >
                        <td className="px-3 py-2 min-w-[120px]">
                          <p className="font-semibold text-foreground truncate max-w-[100px] sm:max-w-none">{student.full_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[100px] sm:max-w-none">{student.email}</p>
                          <Badge variant="secondary" className="text-[8px] h-3.5 px-1 py-0 mt-0.5 font-normal">
                            {student.request_count} {student.request_count === 1 ? 'req' : 'reqs'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-0.5 text-[10px] text-right sm:text-center">
                            <p><span className="text-muted-foreground">T:</span> ₹{student.total_amount.toLocaleString()}</p>
                            <p className="text-green-600 font-medium"><span className="text-muted-foreground">R:</span> ₹{student.received_amount.toLocaleString()}</p>
                            <p className="text-orange-600 font-medium"><span className="text-muted-foreground">P:</span> ₹{student.pending_amount.toLocaleString()}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors inline" />
                        </td>
                      </tr>
                    ))}
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
