import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  REFERRAL_SERVICES,
  REFERRAL_STATUSES,
  REFERRAL_PRIORITIES,
  LEAD_SOURCES,
} from '@/lib/referralConstants';
import { useCreateReferral } from '@/hooks/useReferrals';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Props {
  onCreated?: (id: string) => void;
  onCancel?: () => void;
}

const emptyForm = {
  full_name: '',
  phone: '',
  whatsapp: '',
  email: '',
  city: '',
  state: '',
  qualification: '',
  percentage: '',
  passing_year: '',
  passport_available: false,
  german_level: '',
  preferred_intake: '',
  lead_source: '',
  current_status: 'new',
  priority: 'medium',
  next_followup_date: '',
  remarks: '',
};

export default function AddReferralForm({ onCreated, onCancel }: Props) {
  const [form, setForm] = useState<any>(emptyForm);
  const [services, setServices] = useState<string[]>([]);
  const create = useCreateReferral();
  const { toast } = useToast();

  const toggleService = (k: string) => {
    setServices(prev => prev.includes(k) ? prev.filter(s => s !== k) : [...prev, k]);
  };

  const submit = async () => {
    if (!form.full_name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    try {
      const payload = { ...form };
      if (!payload.next_followup_date) payload.next_followup_date = null;
      const r = await create.mutateAsync({ referral: payload, services });
      toast({ title: 'Referral created' });
      onCreated?.(r.id);
      setForm(emptyForm);
      setServices([]);
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const Section = ({ title, children }: any) => (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  );

  const Field = ({ label, children }: any) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <Section title="Personal">
        <Field label="Full Name *"><Input value={form.full_name} onChange={e => set('full_name', e.target.value)} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
        <Field label="WhatsApp"><Input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></Field>
        <Field label="City"><Input value={form.city} onChange={e => set('city', e.target.value)} /></Field>
        <Field label="State"><Input value={form.state} onChange={e => set('state', e.target.value)} /></Field>
      </Section>

      <Section title="Education">
        <Field label="Qualification"><Input value={form.qualification} onChange={e => set('qualification', e.target.value)} /></Field>
        <Field label="Percentage / CGPA"><Input value={form.percentage} onChange={e => set('percentage', e.target.value)} /></Field>
        <Field label="Passing Year"><Input value={form.passing_year} onChange={e => set('passing_year', e.target.value)} /></Field>
        <Field label="German Level"><Input placeholder="A1, A2, B1..." value={form.german_level} onChange={e => set('german_level', e.target.value)} /></Field>
        <Field label="Preferred Intake"><Input placeholder="Summer/Winter 2026" value={form.preferred_intake} onChange={e => set('preferred_intake', e.target.value)} /></Field>
        <div className="flex items-center gap-2 pt-6">
          <Checkbox id="passport" checked={form.passport_available} onCheckedChange={v => set('passport_available', !!v)} />
          <Label htmlFor="passport" className="text-sm">Passport Available</Label>
        </div>
      </Section>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Interested Services</p>
        <div className="flex flex-wrap gap-2">
          {REFERRAL_SERVICES.map(s => {
            const active = services.includes(s.key);
            return (
              <button
                type="button"
                key={s.key}
                onClick={() => toggleService(s.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <Section title="Lead & Follow-up">
        <Field label="Lead Source">
          <Select value={form.lead_source} onValueChange={v => set('lead_source', v)}>
            <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
            <SelectContent>{LEAD_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Current Status">
          <Select value={form.current_status} onValueChange={v => set('current_status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{REFERRAL_STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onValueChange={v => set('priority', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{REFERRAL_PRIORITIES.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Next Follow-up">
          <Input type="date" value={form.next_followup_date} onChange={e => set('next_followup_date', e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Remarks">
            <Textarea rows={3} value={form.remarks} onChange={e => set('remarks', e.target.value)} />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button onClick={submit} disabled={create.isPending}>
          {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Referral
        </Button>
      </div>
    </div>
  );
}
