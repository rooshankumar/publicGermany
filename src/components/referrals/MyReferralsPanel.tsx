import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import {
  REFERRAL_STATUSES,
  REFERRAL_PRIORITIES,
  REFERRAL_SERVICES,
  serviceLabel,
  statusLabel,
  statusColor,
  priorityColor,
} from '@/lib/referralConstants';
import { useMyReferrals } from '@/hooks/useReferrals';
import AddReferralForm from './AddReferralForm';

export default function MyReferralsPanel() {
  const { data = [], isLoading } = useMyReferrals();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [service, setService] = useState<string>('all');
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.filter(r => {
      if (status !== 'all' && r.current_status !== status) return false;
      if (priority !== 'all' && r.priority !== priority) return false;
      if (service !== 'all' && !r.referral_services?.some(s => s.service_key === service)) return false;
      if (term) {
        const hay = `${r.full_name} ${r.email ?? ''} ${r.phone ?? ''} ${r.city ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [data, q, status, priority, service]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, phone..." value={q} onChange={e => setQ(e.target.value)} className="pl-9 h-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {REFERRAL_STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-full md:w-32 h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {REFERRAL_PRIORITIES.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={service} onValueChange={setService}>
          <SelectTrigger className="w-full md:w-40 h-9"><SelectValue placeholder="Service" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {REFERRAL_SERVICES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setAdding(v => !v)} className="h-9">
          <Plus className="h-4 w-4 mr-1" /> {adding ? 'Close' : 'Add Referral'}
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="p-4">
            <AddReferralForm
              onCreated={(id) => { setAdding(false); navigate(`/editor/referrals/${id}`); }}
              onCancel={() => setAdding(false)}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No referrals found</TableCell></TableRow>
                ) : filtered.map(r => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/editor/referrals/${r.id}`)}>
                    <TableCell>
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.phone || r.email || '—'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {(r.referral_services || []).slice(0, 3).map(s => (
                          <Badge key={s.id} variant="secondary" className="text-[10px]">{serviceLabel(s.service_key)}</Badge>
                        ))}
                        {(r.referral_services?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-[10px]">+{r.referral_services!.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${statusColor(r.current_status)}`}>{statusLabel(r.current_status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] capitalize ${priorityColor(r.priority)}`}>{r.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.next_followup_date || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
