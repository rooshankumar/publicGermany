import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

type Notif = {
  id: string;
  title: string;
  created_at: string;
  seen: boolean;
  type?: 'application' | 'document' | 'service_request' | null;
  ref_id?: string | null;
};

export default function Notifications() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifs = async () => {
    if (!profile?.user_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications' as any)
      .select('id, title, created_at, seen, type, ref_id')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error) setItems((data || []) as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifs();
    if (!profile?.user_id) return;
    const ch = supabase
      .channel(`notifs-page-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.user_id}` }, () => fetchNotifs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.user_id]);

  const markAll = async () => {
    if (!profile?.user_id) return;
    setMarking(true);
    await supabase.from('notifications' as any).update({ seen: true }).eq('user_id', profile.user_id).eq('seen', false);
    setMarking(false);
    fetchNotifs();
  };

  const markOne = async (id: string) => {
    await supabase.from('notifications' as any).update({ seen: true }).eq('id', id);
    setItems(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n));
  };

  const unseen = items.filter(n => !n.seen).length;

  const typeBadge = (t?: string | null) => {
    if (!t) return null;
    const label = t === 'service_request' ? 'service' : t;
    return <Badge variant="outline" className="capitalize">{label}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">You have {unseen} unread</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markAll} disabled={marking || unseen === 0}>{marking ? 'Marking…' : 'Mark all as read'}</Button>
            <Button variant="ghost" size="sm" onClick={fetchNotifs}>Refresh</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground">No notifications yet.</p>
            ) : (
              <div className="divide-y">
                {items.map((n) => (
                  <div key={n.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {!n.seen && <span className="inline-block h-2 w-2 rounded-full bg-destructive" aria-hidden />}
                        <div className="font-medium break-words whitespace-normal">{n.title}</div>
                        {typeBadge(n.type)}
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                    {!n.seen && (
                      <Button size="sm" variant="ghost" onClick={() => markOne(n.id)}>Mark read</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
