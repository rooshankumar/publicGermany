import { useState, useEffect } from 'react';
import { Bell, Calendar, Clock, X, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SimpleReminder {
  id: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

interface ReminderSystemProps {
  showCompact?: boolean;
  className?: string;
}

export const ReminderSystem = ({ showCompact = false, className = '' }: ReminderSystemProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<SimpleReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewReminder, setShowNewReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    dueDate: '',
    priority: 'medium' as const,
    category: 'general'
  });

  const categories = [
    { value: 'documents', label: 'Documents' },
    { value: 'university', label: 'University Applications' },
    { value: 'visa', label: 'Visa Process' },
    { value: 'language', label: 'Language Tests' },
    { value: 'financial', label: 'Financial Documents' },
    { value: 'general', label: 'General' },
  ];

  useEffect(() => {
    // For now, we'll use localStorage for reminders until the database types are updated
    loadReminders();
  }, [profile]);

  const loadReminders = () => {
    try {
      const stored = localStorage.getItem(`reminders_${profile?.user_id}`);
      if (stored) {
        setReminders(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReminders = (newReminders: SimpleReminder[]) => {
    try {
      localStorage.setItem(`reminders_${profile?.user_id}`, JSON.stringify(newReminders));
      setReminders(newReminders);
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  const createReminder = () => {
    if (!profile?.user_id || !newReminder.title || !newReminder.dueDate) return;

    const reminder: SimpleReminder = {
      id: `reminder_${Date.now()}`,
      title: newReminder.title,
      dueDate: newReminder.dueDate,
      priority: newReminder.priority,
      category: newReminder.category
    };

    const newReminders = [...reminders, reminder];
    saveReminders(newReminders);
    
    setNewReminder({
      title: '',
      dueDate: '',
      priority: 'medium',
      category: 'general'
    });
    setShowNewReminder(false);

    toast({
      title: "Reminder created",
      description: "Your reminder has been added successfully.",
    });
  };

  const removeReminder = (reminderId: string) => {
    const newReminders = reminders.filter(r => r.id !== reminderId);
    saveReminders(newReminders);
    
    toast({
      title: "Reminder removed",
      description: "Your reminder has been removed.",
    });
  };

  const getTimeUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', color: 'text-destructive' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-warning' };
    if (diffDays === 1) return { text: '1 day left', color: 'text-warning' };
    if (diffDays <= 7) return { text: `${diffDays} days left`, color: 'text-warning' };
    return { text: `${diffDays} days left`, color: 'text-muted-foreground' };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const urgentReminders = reminders.filter(r => {
    const dueDate = new Date(r.dueDate);
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 || r.priority === 'high';
  });

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showCompact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {urgentReminders.length > 0 && (
          <div className="space-y-2">
            {urgentReminders.slice(0, 3).map((reminder) => {
              const timeLeft = getTimeUntilDue(reminder.dueDate);
              return (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Bell className="h-4 w-4 text-warning" />
                    <div>
                      <p className="text-sm font-medium">{reminder.title}</p>
                      <p className={`text-xs ${timeLeft.color}`}>{timeLeft.text}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReminder(reminder.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <span>Reminders</span>
              {urgentReminders.length > 0 && (
                <Badge variant="destructive">{urgentReminders.length}</Badge>
              )}
            </CardTitle>
            <Dialog open={showNewReminder} onOpenChange={setShowNewReminder}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reminder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Reminder</DialogTitle>
                  <DialogDescription>
                    Set up a reminder for important deadlines and tasks.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newReminder.title}
                      onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                      placeholder="e.g., Submit required documents"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="datetime-local"
                        value={newReminder.dueDate}
                        onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={newReminder.priority}
                        onValueChange={(value: any) => setNewReminder({ ...newReminder, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newReminder.category}
                      onValueChange={(value) => setNewReminder({ ...newReminder, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button onClick={createReminder} className="flex-1">
                      Create Reminder
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewReminder(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active reminders</p>
              <p className="text-sm">Create your first reminder to stay on track!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => {
                const timeLeft = getTimeUntilDue(reminder.dueDate);
                const category = categories.find(c => c.value === reminder.category)?.label || 'General';
                
                return (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{reminder.title}</h4>
                          <Badge className={getPriorityColor(reminder.priority)} variant="secondary">
                            {reminder.priority}
                          </Badge>
                          <Badge variant="outline">{category}</Badge>
                        </div>
                        <p className={`text-sm ${timeLeft.color}`}>
                          {new Date(reminder.dueDate).toLocaleDateString()} • {timeLeft.text}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReminder(reminder.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};