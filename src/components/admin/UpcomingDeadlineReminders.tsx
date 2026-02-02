import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, User, RefreshCw, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UpcomingReminder {
  id: string;
  university_name: string;
  program_name: string;
  start_date: string;
  end_date: string | null;
  status: string;
  full_name: string;
  user_id: string;
  days_until_open: number;
  reminder_days: number[];
}

const UpcomingDeadlineReminders = () => {
  const [reminders, setReminders] = useState<UpcomingReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUpcomingReminders();
  }, []);

  const fetchUpcomingReminders = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

      // Get applications with START dates in the next 14 days
      // Exclude submitted applications - they don't need reminders
      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          id, 
          university_name, 
          program_name, 
          start_date,
          end_date, 
          status,
          user_id,
          profiles!applications_user_id_fkey(full_name)
        `)
        .gte('start_date', today.toISOString().split('T')[0])
        .lte('start_date', twoWeeksFromNow.toISOString().split('T')[0])
        .neq('status', 'submitted')
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Get already sent reminders
      const { data: sentReminders } = await supabase
        .from('deadline_reminders')
        .select('application_id, day_offset');

      const sentSet = new Set(
        (sentReminders || []).map(r => `${r.application_id}:${r.day_offset}`)
      );

      // Process applications to show upcoming reminders
      const processedReminders: UpcomingReminder[] = (applications || [])
        .filter((app: any) => app.start_date)
        .map((app: any) => {
          const startDate = new Date(app.start_date);
          const daysUntilOpen = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
          const allReminderDays = [14, 10, 7, 5, 2, 1];
          const pendingReminderDays = allReminderDays.filter(d => {
            return d >= daysUntilOpen && !sentSet.has(`${app.id}:${d}`);
          });

          return {
            id: app.id,
            university_name: app.university_name,
            program_name: app.program_name,
            start_date: app.start_date,
            end_date: app.end_date,
            status: app.status,
            full_name: app.profiles?.full_name || 'Unknown',
            user_id: app.user_id,
            days_until_open: daysUntilOpen,
            reminder_days: pendingReminderDays
          };
        });

      setReminders(processedReminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch upcoming reminders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerReminders = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('remind-deadlines', {
        body: {}
      });

      if (error) throw error;

      toast({
        title: 'Reminders Sent',
        description: `Processed: ${data?.processed || 0}, Sent: ${data?.sent || 0}`,
      });
      
      fetchUpcomingReminders();
    } catch (error: any) {
      console.error('Error triggering reminders:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reminders',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const getDaysLabel = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `in ${days}d`;
  };

  const getUrgencyVariant = (days: number): "default" | "secondary" | "destructive" | "outline" => {
    if (days <= 1) return 'destructive';
    if (days <= 3) return 'default';
    if (days <= 7) return 'secondary';
    return 'outline';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Application Opening Reminders
            </CardTitle>
            <CardDescription className="text-xs">
              Opens in 14d • Auto: D-14/10/7/5/2/1 • Excludes submitted
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={fetchUpcomingReminders}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              size="sm" 
              onClick={triggerReminders}
              disabled={sending}
            >
              <Send className={`h-4 w-4 mr-1 ${sending ? 'animate-pulse' : ''}`} />
              Send Now
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No application openings in next 14 days (or all submitted)
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {reminders.slice(0, 8).map((reminder) => (
              <div 
                key={reminder.id} 
                className="flex items-center justify-between p-2 border rounded-lg text-sm"
              >
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
                  <Badge variant={getUrgencyVariant(reminder.days_until_open)} className="text-xs">
                    Opens {getDaysLabel(reminder.days_until_open)}
                  </Badge>
                  {reminder.reminder_days.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      📧 D-{reminder.reminder_days.join('/')}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {reminders.length > 8 && (
              <div className="text-center text-xs text-muted-foreground pt-2">
                +{reminders.length - 8} more
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingDeadlineReminders;
