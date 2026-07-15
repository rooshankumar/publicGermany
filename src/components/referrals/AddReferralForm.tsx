import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  REFERRAL_SERVICES,
  REFERRAL_STATUSES,
  REFERRAL_PRIORITIES,
  LEAD_SOURCES,
  TRAINER_NAMES,
} from '@/lib/referralConstants';
import { useCreateReferral } from '@/hooks/useReferrals';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, Mail, MapPin, Globe, User, Tag, Star, CalendarDays, IndianRupee, StickyNote } from 'lucide-react';

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
  lead_source: '',
  current_status: 'new',
  priority: 'medium',
  next_followup_date: '',
  total_fees: '',
  trainer_name: '',
  remarks: '',
};

const inputClass = "h-8 text-xs bg-background";

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
      if (!payload.remarks) payload.remarks = null;
      ['phone', 'whatsapp', 'email', 'city', 'lead_source'].forEach(k => {
        if (!payload[k]) payload[k] = null;
      });

      const dbPayload = { ...payload };
      const totalFeesValue = dbPayload.total_fees;
      delete dbPayload.total_fees;

      const r = await create.mutateAsync({ referral: dbPayload, services });

      if (totalFeesValue) {
        try {
          await (supabase as any).from('referrals').update({ total_fees: totalFeesValue }).eq('id', r.id);
        } catch { /* column migration not yet applied */ }
      }

      toast({ title: 'Referral created' });
      onCreated?.(r.id);
      setForm(emptyForm);
      setServices([]);
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      {/* — Personal Information — */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <User className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Personal Information</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <span className="text-destructive">*</span> Full Name
            </Label>
            <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Lead name" className={inputClass} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Label>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Optional" className={inputClass} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> WhatsApp</Label>
            <Input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="Optional" className={inputClass} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Optional" className={inputClass} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> City</Label>
            <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Optional" className={inputClass} />
          </div>
        </div>
      </div>

      {/* — Interested Services — */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Globe className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Interested Services</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REFERRAL_SERVICES.map(s => {
            const active = services.includes(s.key);
            return (
              <button
                type="button"
                key={s.key}
                onClick={() => toggleService(s.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* — Lead & Fees (inline) — */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Tag className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Lead &amp; Fees</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground">Lead Source</Label>
            <Select value={form.lead_source} onValueChange={v => set('lead_source', v)}>
              <SelectTrigger className={`${inputClass} text-[11px]`}><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground">Trainer Name</Label>
            <Select value={form.trainer_name} onValueChange={v => set('trainer_name', v)}>
              <SelectTrigger className={`${inputClass} text-[11px]`}><SelectValue placeholder="Select trainer" /></SelectTrigger>
              <SelectContent>
                {TRAINER_NAMES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3" /> Status</Label>
            <Select value={form.current_status} onValueChange={v => set('current_status', v)}>
              <SelectTrigger className={`${inputClass} text-[11px]`}><SelectValue /></SelectTrigger>
              <SelectContent>
                {REFERRAL_STATUSES.map(s => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground">Priority</Label>
            <Select value={form.priority} onValueChange={v => set('priority', v)}>
              <SelectTrigger className={`${inputClass} text-[11px]`}><SelectValue /></SelectTrigger>
              <SelectContent>
                {REFERRAL_PRIORITIES.map(p => <SelectItem key={p.key} value={p.key} className="text-xs">{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Follow-up</Label>
            <Input type="date" value={form.next_followup_date} onChange={e => set('next_followup_date', e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-4">
            <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><IndianRupee className="h-3 w-3" /> Total Fees (Optional)</Label>
            <Input
              type="text"
              value={form.total_fees}
              onChange={e => set('total_fees', e.target.value)}
              placeholder="e.g. ₹5,000 or EUR 500"
              className={inputClass + " max-w-xs"}
            />
          </div>
        </div>
      </div>

      {/* — Notes — */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <StickyNote className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Notes</p>
        </div>
        <Textarea
          rows={3}
          value={form.remarks}
          onChange={e => set('remarks', e.target.value)}
          placeholder="e.g. Interested in A1 Fast Track, Planning for Summer 2027, Waiting for parents' approval..."
          className="text-xs bg-background"
        />
      </div>

      {/* — Actions — */}
      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} size="sm" className="h-8 text-xs">
            Cancel
          </Button>
        )}
        <Button onClick={submit} disabled={create.isPending} size="sm" className="h-8 text-xs px-4">
          {create.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          Create Referral
        </Button>
      </div>
    </div>
  );
}
