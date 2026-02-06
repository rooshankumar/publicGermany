import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Calendar, User, RefreshCw, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UpcomingReminder {
  id: string;
  university_name: string;
  program_name: string;
  date: string;
  status: string;
  full_name: string;
  user_id: string;
  days_until: number;
  reminder_days: number[];
  type: 'opening' | 'closing';
}

const UpcomingDeadlineReminders = () => {
  const [reminders, setReminders] = useState<UpcomingReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchUpcomingReminders(); }, []);

  const fetchUpcomingReminders = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
      const todayStr = today.toISOString().split('T')[0];
      const futureStr = twoWeeksFromNow.toISOString().split('T')[0];

      // Fetch both opening and closing candidates
      const [openingRes, closingRes, sentRes] = await Promise.all([
        supabase.from('applications')
          .select('id, university_name, program_name, application_start_date, application_end_date, status, user_id, profiles!applications_user_id_fkey(full_name)')
          .gte('application_start_date', todayStr)
          .lte('application_start_date', futureStr)
          .neq('status', 'submitted')
          .order('application_start_date', { ascending: true }),
        supabase.from('applications')
          .select('id, university_name, program_name, application_start_date, application_end_date, status, user_id, profiles!applications_user_id_fkey(full_name)')
          .gte('application_end_date', todayStr)
          .lte('application_end_date', futureStr)
          .neq('status', 'submitted')
          .order('application_end_date', { ascending: true }),
        supabase.from('deadline_reminders').select('application_id, day_offset'),
      ]);

      const sentSet = new Set((sentRes.data || []).map((r: any) => `${r.application_id}:${r.day_offset}`));
      const allReminderDays = [14, 10, 7, 5, 2, 1];

      const processApps = (apps: any[], dateField: string, type: 'opening' | 'closing') =>
        (apps || []).filter((a: any) => a[dateField]).map((app: any) => {
          const d = new Date(app[dateField]);
          const daysUntil = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const pending = allReminderDays.filter(dd => dd >= daysUntil && !sentSet.has(`${app.id}:${dd}`));
          return {
            id: `${app.id}-${type}`,
            university_name: app.university_name,
            program_name: app.program_name,
            date: app[dateField],
            status: app.status,
            full_name: app.profiles?.full_name || 'Unknown',
            user_id: app.user_id,
            days_until: daysUntil,
            reminder_days: pending,
            type,
          } as UpcomingReminder;
        });

      const opening = processApps(openingRes.data || [], 'application_start_date', 'opening');
      const closing = processApps(closingRes.data || [], 'application_end_date', 'closing');
      setReminders([...opening, ...closing].sort((a, b) => a.days_until - b.days_until));
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({ title: 'Error', description: 'Failed to fetch upcoming reminders', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const triggerReminders = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('remind-deadlines', { body: {} });
      if (error) throw error;
      toast({ title: 'Reminders Sent', description: `Processed: ${data?.processed || 0}, Sent: ${data?.sent || 0}` });
      fetchUpcomingReminders();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send reminders', variant: 'destructive' });
    } finally { setSending(false); }
  };

  const getDaysLabel = (days: number) => days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days}d`;
  const getUrgencyVariant = (days: number): "default" | "secondary" | "destructive" | "outline" =>
    days <= 1 ? 'destructive' : days <= 3 ? 'default' : days <= 7 ? 'secondary' : 'outline';

  const openingReminders = reminders.filter(r => r.type === 'opening');
  const closingReminders = reminders.filter(r => r.type === 'closing');

  const ReminderList = ({ items }: { items: UpcomingReminder[] }) => (
    items.length === 0 ? (
      <div className="text-center py-4 text-muted-foreground text-sm">No upcoming reminders</div>
    ) : (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.slice(0, 8).map((reminder) => (
          <div key={reminder.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="font-medium truncate">{reminder.full_name}</span>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {reminder.university_name} • {reminder.program_name}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <Badge variant={getUrgencyVariant(reminder.days_until)} className="text-xs">
                {reminder.type === 'opening' ? 'Opens' : 'Closes'} {getDaysLabel(reminder.days_until)}
              </Badge>
              {reminder.reminder_days.length > 0 && (
                <span className="text-xs text-muted-foreground">📧 D-{reminder.reminder_days.join('/')}</span>
              )}
            </div>
          </div>
        ))}
        {items.length > 8 && <div className="text-center text-xs text-muted-foreground pt-2">+{items.length - 8} more</div>}
      </div>
    )
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Deadline Reminders
            </CardTitle>
            <CardDescription className="text-xs">
              Upcoming alerts (14d) • Auto: D-14/10/7/5/2/1 • Excludes submitted
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fetchUpcomingReminders} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={triggerReminders} disabled={sending}>
              <Send className={`h-4 w-4 mr-1 ${sending ? 'animate-pulse' : ''}`} />
              Send Now
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
        ) : (
          <Tabs defaultValue="opening" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="opening" className="text-xs">
                📂 Opening ({openingReminders.length})
              </TabsTrigger>
              <TabsTrigger value="closing" className="text-xs">
                🔒 Closing ({closingReminders.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="opening" className="mt-2">
              <ReminderList items={openingReminders} />
            </TabsContent>
            <TabsContent value="closing" className="mt-2">
              <ReminderList items={closingReminders} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingDeadlineReminders;
