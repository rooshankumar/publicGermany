import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useMyTasks, useUpdateTask, useAddTask } from '@/hooks/useReferrals';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CalendarClock, Circle } from 'lucide-react';

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
    <div className="flex items-center gap-3 px-3 py-2 border-b border-border last:border-0 hover:bg-muted/40">
      <Checkbox
        checked={t.status === 'done'}
        onCheckedChange={(v) => update.mutate({ id: t.id, patch: { status: v ? 'done' : 'open' } })}
      />
      <button className="flex-1 text-left" onClick={() => navigate(`/editor/referrals/${t.referral_id}`)}>
        <div className={`text-sm ${t.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</div>
        <div className="text-xs text-muted-foreground">{t.referrals?.full_name}</div>
      </button>
      {t.due_date && (
        <Badge variant="outline" className="text-[10px] gap-1">
          <CalendarClock className="h-3 w-3" />{t.due_date}
        </Badge>
      )}
    </div>
  );

  const Group = ({ title, items, tone }: any) => (
    <Card>
      <CardContent className="p-0">
        <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide border-b border-border ${tone}`}>
          {title} <span className="text-muted-foreground">({items.length})</span>
        </div>
        {items.length === 0 ? (
          <div className="px-3 py-6 text-xs text-muted-foreground text-center">Nothing here</div>
        ) : items.map((t: any) => <Row key={t.id} t={t} />)}
      </CardContent>
    </Card>
  );

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading tasks...</div>;

  return (
    <div className="space-y-3">
      <Group title="Overdue" items={groups.overdue} tone="text-red-600 dark:text-red-400" />
      <Group title="Today" items={groups.todays} tone="text-amber-600 dark:text-amber-400" />
      <Group title="Upcoming" items={groups.upcoming} tone="text-foreground" />
      <Group title="Completed" items={groups.done} tone="text-muted-foreground" />
    </div>
  );
}
