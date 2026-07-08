import Layout from '@/components/Layout';
import InlineLoader from '@/components/InlineLoader';
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-bold text-foreground">Email Logs</h1>
            <p className="text-[10px] text-muted-foreground">Latest 200 email attempts</p>
          </div>
          <Input placeholder="Search by email, subject, or status..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-56 h-7 text-xs" />
        </div>

        <Card className="shadow-none"><CardContent className="p-0">
          {loading ? (
            <div className="p-3"><InlineLoader label="Loading emails" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3">No emails found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1.5 font-medium text-[10px]">Time</th>
                    <th className="text-left p-1.5 font-medium text-[10px]">To</th>
                    <th className="text-left p-1.5 font-medium text-[10px]">Subject</th>
                    <th className="text-left p-1.5 font-medium text-[10px]">Status</th>
                    <th className="text-left p-1.5 font-medium text-[10px]">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/30">
                      <td className="p-1.5 whitespace-nowrap text-[10px]">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-1.5 whitespace-nowrap text-[10px]">{log.to_email}</td>
                      <td className="p-1.5 text-[10px]">{log.subject}</td>
                      <td className="p-1.5"><Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-[8px] px-1 py-0 h-4">{log.status}</Badge></td>
                      <td className="p-1.5 max-w-[200px] truncate text-[10px]" title={log.error || ''}>{log.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent></Card>
      </div>
    </Layout>
  );
}
