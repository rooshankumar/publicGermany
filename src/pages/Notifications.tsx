import Layout from '@/components/Layout';
import InlineLoader from '@/components/InlineLoader';
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-bold">Notifications</h1>
            <p className="text-[10px] text-muted-foreground">{unseen} unread · {items.length} total</p>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={markAll} disabled={marking || unseen === 0}>{marking ? '…' : 'Mark all read'}</Button>
        </div>

        <Card className="shadow-none"><CardContent className="p-0">
            {loading ? (
              <InlineLoader label="Loading notifications" />
            ) : items.length === 0 ? (
              <p className="p-4 text-[11px] text-muted-foreground">No notifications yet.</p>
            ) : (
              <div className="divide-y">
                {items.map((n) => (
                  <div key={n.id} className="p-2 flex items-start justify-between gap-2 hover:bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {!n.seen && <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />}
                        <div className="text-[11px] font-medium break-words">{n.title}</div>
                        {typeBadge(n.type)}
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                    {!n.seen && (
                      <Button size="sm" variant="ghost" onClick={() => markOne(n.id)} className="h-6 text-[9px] px-1.5">Read</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>
      </div>
    </Layout>
  );
}
