import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useMyTasks, useUpdateTask } from '@/hooks/useReferrals';
import { useNavigate } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';

export default function TasksInbox() {
  const { data = [], isLoading } = useMyTasks();
  const update = useUpdateTask();
  const navigate = useNavigate();

  const groups = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const overdue: any[] = [];
    const todays: any[] = [];
    const upcoming: any[] = [];
    const done: any[] = [];
    (data as any[]).forEach(t => {
      if (t.status === 'done' || t.status === 'cancelled') { done.push(t); return; }
      if (!t.due_date) { upcoming.push(t); return; }
      if (t.due_date < today) overdue.push(t);
      else if (t.due_date === today) todays.push(t);
      else upcoming.push(t);
    });
    return { overdue, todays, upcoming, done };
  }, [data]);

  const Row = ({ t }: any) => (
    <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-border/60 last:border-0 hover:bg-muted/30">
      <Checkbox
        checked={t.status === 'done'}
        onCheckedChange={(v) => update.mutate({ id: t.id, patch: { status: v ? 'done' : 'open' } })}
        className="h-3.5 w-3.5"
      />
      <button className="flex-1 text-left min-w-0" onClick={() => navigate(`/editor/referrals/${t.referral_id}`)}>
        <div className={`text-[11px] ${t.status === 'done' ? 'line-through text-muted-foreground' : ''} truncate`}>{t.title}</div>
        {t.referrals?.full_name && (
          <div className="text-[9px] text-muted-foreground truncate">{t.referrals.full_name}</div>
        )}
      </button>
      {t.due_date && (
        <Badge variant="outline" className="text-[8px] py-0 h-4 gap-0.5 shrink-0">
          <CalendarClock className="h-2.5 w-2.5" />{t.due_date}
        </Badge>
      )}
    </div>
  );

  const Group = ({ title, items, tone }: any) => (
    <Card className="shadow-none border-border/60">
      <CardContent className="p-0">
        <div className={`px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider border-b border-border/60 ${tone}`}>
          {title} <span className="text-muted-foreground font-normal">({items.length})</span>
        </div>
        {items.length === 0 ? (
          <div className="px-2.5 py-4 text-[10px] text-muted-foreground text-center">Nothing here</div>
        ) : items.map((t: any) => <Row key={t.id} t={t} />)}
      </CardContent>
    </Card>
  );

  if (isLoading) return <div className="text-center py-8 text-xs text-muted-foreground">Loading tasks...</div>;

  return (
    <div className="space-y-2">
      <Group title="Overdue" items={groups.overdue} tone="text-red-600 dark:text-red-400" />
      <Group title="Today" items={groups.todays} tone="text-amber-600 dark:text-amber-400" />
      <Group title="Upcoming" items={groups.upcoming} tone="text-foreground" />
      <Group title="Completed" items={groups.done} tone="text-muted-foreground" />
    </div>
  );
}
