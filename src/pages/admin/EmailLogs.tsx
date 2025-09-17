import Layout from '@/components/Layout';
import InlineLoader from '@/components/InlineLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  template: string | null;
  payload: any;
  status: 'success' | 'error' | string;
  error: string | null;
  created_at: string;
}

export default function EmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  // Simple debounce hook
  function useDebouncedValue<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const t = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
  }

  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('emails_log' as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        setLogs((data as any[]) || []);
      } catch (e: any) {
        toast({ title: 'Failed to load logs', description: e?.message || 'Unknown error', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();

    // real-time channel (optional)
    const channel = supabase
      .channel('emails-log-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emails_log' }, () => fetchLogs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(l =>
      l.to_email?.toLowerCase().includes(q) ||
      l.subject?.toLowerCase().includes(q) ||
      l.status?.toLowerCase().includes(q)
    );
  }, [logs, debouncedSearch]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Email Logs</h1>
            <p className="text-muted-foreground">Latest 200 email attempts from the platform</p>
          </div>
          <div className="w-full sm:w-80">
            <Input placeholder="Search by email, subject, or status..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Emails ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <InlineLoader label="Loading emails" />
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground">No emails found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Time</th>
                      <th className="text-left p-3 font-medium">To</th>
                      <th className="text-left p-3 font-medium">Subject</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-3 whitespace-nowrap">{log.to_email}</td>
                        <td className="p-3">{log.subject}</td>
                        <td className="p-3">
                          <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                            {log.status}
                          </Badge>
                        </td>
                        <td className="p-3 max-w-[360px] truncate" title={log.error || ''}>
                          {log.error}
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
