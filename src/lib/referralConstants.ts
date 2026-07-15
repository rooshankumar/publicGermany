export const REFERRAL_SERVICES = [
  { key: 'german_course', label: 'German Course' },
  { key: 'admission', label: 'Admission Service' },
  { key: 'visa', label: 'Visa Service' },
  { key: 'blocked_account', label: 'Blocked Account' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'aps', label: 'APS' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'sop', label: 'SOP' },
  { key: 'other', label: 'Other' },
] as const;

export const TRAINER_NAMES = [
  'Shalini Chauhan',
  'Esha Chowdhury',
] as const;

export const REFERRAL_STATUSES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'interested', label: 'Interested' },
  { key: 'documents_pending', label: 'Documents Pending' },
  { key: 'documents_received', label: 'Documents Received' },
  { key: 'application_started', label: 'Application Started' },
  { key: 'admission_received', label: 'Admission Received' },
  { key: 'visa_process', label: 'Visa Process' },
  { key: 'completed', label: 'Completed' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'lost', label: 'Lost' },
  { key: 'not_interested', label: 'Not Interested' },
] as const;

export const QUALIFIED_STATUSES = [
  'interested',
  'documents_pending',
  'documents_received',
  'application_started',
];

export const REFERRAL_PRIORITIES = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
] as const;

export const LEAD_SOURCES = [
  'Instagram',
  'WhatsApp',
  'Friend',
  'Offline',
  'College',
  'Seminar',
  'YouTube',
  'Other',
] as const;

export const ACTIVITY_TYPES = [
  { key: 'note', label: 'Note' },
  { key: 'call', label: 'Call' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'message', label: 'Message' },
  { key: 'demo', label: 'Demo' },
  { key: 'docs', label: 'Documents' },
  { key: 'other', label: 'Other' },
] as const;

export const TASK_STATUSES = [
  { key: 'open', label: 'Open' },
  { key: 'done', label: 'Done' },
  { key: 'cancelled', label: 'Cancelled' },
] as const;

export const statusLabel = (key: string) =>
  REFERRAL_STATUSES.find(s => s.key === key)?.label ?? key;

export const serviceLabel = (key: string) =>
  REFERRAL_SERVICES.find(s => s.key === key)?.label ?? key;

export const priorityColor = (p: string) => {
  if (p === 'high') return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300';
  if (p === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300';
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300';
};

export const statusColor = (s: string) => {
  if (['completed', 'admission_received', 'visa_process'].includes(s))
    return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300';
  if (['lost', 'not_interested', 'on_hold'].includes(s))
    return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300';
  if (QUALIFIED_STATUSES.includes(s))
    return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300';
  return 'bg-muted text-foreground/70 border-border';
};
