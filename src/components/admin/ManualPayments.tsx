import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Trash2, Loader2 } from 'lucide-react';

interface ManualPaymentRow {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  service_name: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  paid_at: string;
  admin_note: string | null;
  created_at: string;
}

const emptyForm = {
  client_name: '',
  client_email: '',
  client_phone: '',
  service_name: '',
  amount: '',
  currency: 'INR',
  status: 'received',
  payment_method: 'cash',
  paid_at: new Date().toISOString().slice(0, 10),
  admin_note: '',
};

export default function ManualPayments() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ManualPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('manual_payments')
      .select('*')
      .order('paid_at', { ascending: false });
    if (error) {
      toast({ title: 'Error loading manual payments', description: error.message, variant: 'destructive' });
    } else {
      setRows((data as ManualPaymentRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const submit = async () => {
    if (!form.client_name.trim() || !form.service_name.trim() || !form.amount) {
      toast({ title: 'Missing fields', description: 'Client name, service, and amount are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from('manual_payments').insert({
      client_name: form.client_name.trim(),
      client_email: form.client_email.trim() || null,
      client_phone: form.client_phone.trim() || null,
      service_name: form.service_name.trim(),
      amount: Number(form.amount),
      currency: form.currency,
      status: form.status,
      payment_method: form.payment_method || null,
      paid_at: new Date(form.paid_at).toISOString(),
      admin_note: form.admin_note.trim() || null,
      created_by: u?.user?.id || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Manual payment recorded' });
    setForm({ ...emptyForm });
    setOpen(false);
    fetchRows();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this manual payment entry?')) return;
    const { error } = await (supabase as any).from('manual_payments').delete().eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      setRows((r) => r.filter((x) => x.id !== id));
    }
  };

  const statusColor = (s: string) => {
    switch ((s || '').toLowerCase()) {
      case 'received': return 'bg-success/10 text-success';
      case 'pending': return 'bg-warning/10 text-warning';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const totals = rows.reduce(
    (acc, r) => {
      const k = (r.currency || 'INR').toUpperCase();
      if ((r.status || '').toLowerCase() === 'received') {
        acc[k] = (acc[k] || 0) + Number(r.amount || 0);
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Card className="overflow-hidden border-none sm:border shadow-sm">
      <CardHeader className="px-3 py-2 bg-muted/30">
        <CardTitle className="text-sm font-bold flex items-center justify-between gap-2 flex-wrap">
          <span>Manual / Offline Payments ({rows.length})</span>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(totals).map(([cur, val]) => (
              <span key={cur} className="text-[10px] font-normal text-muted-foreground">
                Received: <strong className="text-success">{cur} {val.toLocaleString()}</strong>
              </span>
            ))}
            <Button size="sm" className="h-7 px-2 text-[11px]" onClick={() => setOpen((o) => !o)}>
              {open ? <X className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
              {open ? 'Close' : 'Add Payment'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      {open && (
        <div className="p-3 border-b bg-muted/10 space-y-2">
          <p className="text-[10px] text-muted-foreground">
            Record a payment received from a walk-in client who does not have an account.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px]">Client Name *</Label>
              <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Email</Label>
              <Input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Phone</Label>
              <Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Service *</Label>
              <Input value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} placeholder="e.g. APS Consultation" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Amount *</Label>
              <div className="flex gap-1">
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-8 text-xs" />
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[10px]">Payment Method</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Paid On</Label>
              <Input type="date" value={form.paid_at} onChange={(e) => setForm({ ...form, paid_at: e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <Label className="text-[10px]">Admin Note</Label>
              <Input value={form.admin_note} onChange={(e) => setForm({ ...form, admin_note: e.target.value })} className="h-8 text-xs" placeholder="Optional reference, receipt #, etc." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => { setOpen(false); setForm({ ...emptyForm }); }}>Cancel</Button>
            <Button size="sm" className="h-7 text-[11px]" onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Save Payment
            </Button>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">No manual payments yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] sm:text-sm">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                <tr>
                  <th className="px-2 py-1.5 sm:px-4 sm:py-2">Client</th>
                  <th className="px-2 py-1.5 sm:px-4 sm:py-2">Service</th>
                  <th className="px-2 py-1.5 sm:px-4 sm:py-2">Amount</th>
                  <th className="px-2 py-1.5 sm:px-4 sm:py-2">Method</th>
                  <th className="px-2 py-1.5 sm:px-4 sm:py-2">Status</th>
                  <th className="px-2 py-1.5 sm:px-4 sm:py-2">Paid On</th>
                  <th className="px-2 py-1.5 sm:px-4 sm:py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-2 py-2 sm:px-4 sm:py-2">
                      <p className="font-semibold truncate">{r.client_name}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{r.client_email || r.client_phone || '—'}</p>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-2 capitalize">{r.service_name}</td>
                    <td className="px-2 py-2 sm:px-4 sm:py-2 font-medium">{r.currency} {Number(r.amount).toLocaleString()}</td>
                    <td className="px-2 py-2 sm:px-4 sm:py-2 capitalize text-muted-foreground">{(r.payment_method || '').replace('_', ' ')}</td>
                    <td className="px-2 py-2 sm:px-4 sm:py-2">
                      <Badge className={`${statusColor(r.status)} text-[9px] px-1 py-0 border-none h-4 capitalize`}>{r.status}</Badge>
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-2 text-muted-foreground text-[10px]">{new Date(r.paid_at).toLocaleDateString()}</td>
                    <td className="px-2 py-2 sm:px-4 sm:py-2 text-right">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => remove(r.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.some((r) => r.admin_note) && (
              <p className="text-[9px] text-muted-foreground px-3 py-1">Tip: hover rows to see notes (coming soon).</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
