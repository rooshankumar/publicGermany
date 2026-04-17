import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEditorPermissions } from '@/hooks/useEditorPermissions';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, ArrowUpRight, Search, MapPin, ShieldCheck, FileText, GraduationCap, CreditCard, FileSignature } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InlineLoader from '@/components/InlineLoader';
import { Input } from '@/components/ui/input';

interface StudentSummary {
  user_id: string;
  full_name: string | null;
  country_of_education: string | null;
  created_at: string;
}

const PERM_CHIPS = [
  { key: 'can_view_profile', label: 'Profile', icon: Users },
  { key: 'can_view_documents', label: 'Docs', icon: FileText },
  { key: 'can_view_applications', label: 'Apps', icon: GraduationCap },
  { key: 'can_view_payments', label: 'Pay', icon: CreditCard },
  { key: 'can_view_contracts', label: 'Contracts', icon: FileSignature },
] as const;

const EditorDashboard = () => {
  const { assignedStudentIds, permissions, loading: permLoading } = useEditorPermissions();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (permLoading) return;
    if (assignedStudentIds.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const fetchStudents = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, country_of_education, created_at')
        .in('user_id', assignedStudentIds);
      if (!error) setStudents((data || []) as StudentSummary[]);
      setLoading(false);
    };
    fetchStudents();
  }, [assignedStudentIds.join(','), permLoading]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s =>
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.country_of_education || '').toLowerCase().includes(q)
    );
  }, [students, query]);

  const totalPermsGranted = permissions.reduce((acc, p) => {
    return acc +
      (p.can_view_profile ? 1 : 0) +
      (p.can_view_documents ? 1 : 0) +
      (p.can_view_applications ? 1 : 0) +
      (p.can_view_payments ? 1 : 0) +
      (p.can_view_contracts ? 1 : 0);
  }, 0);

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-secondary/40 via-background to-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-8">

          {/* Editorial hero header */}
          <header className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* German flag accent stripe */}
            <div className="absolute top-0 left-0 right-0 h-1 flex">
              <div className="flex-1 bg-foreground" />
              <div className="flex-1 bg-destructive" />
              <div className="flex-1 bg-accent" />
            </div>

            <div className="grid md:grid-cols-[1fr_auto] gap-6 p-6 md:p-8 pt-8 md:pt-10">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Editor Workspace
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-foreground leading-tight">
                  Your assigned students,<br className="hidden md:block" />
                  <span className="text-primary">curated for review.</span>
                </h1>
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                  Review profiles, documents and applications you've been granted access to by the admin team. Permissions update in real time.
                </p>
              </div>

              {/* Stat tiles */}
              <div className="flex md:flex-col gap-3 md:min-w-[200px]">
                <div className="flex-1 md:flex-initial rounded-xl border border-border bg-secondary/50 px-4 py-3">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Students</p>
                  <p className="text-2xl font-serif font-bold text-foreground tabular-nums">{students.length}</p>
                </div>
                <div className="flex-1 md:flex-initial rounded-xl border border-border bg-secondary/50 px-4 py-3">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Permissions</p>
                  <p className="text-2xl font-serif font-bold text-foreground tabular-nums">{totalPermsGranted}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Section header + search */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-primary" />
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-primary">Roster</p>
              </div>
              <h2 className="text-xl md:text-2xl font-serif font-semibold text-foreground mt-1">
                Assigned Students <span className="text-muted-foreground font-normal">· {filtered.length}</span>
              </h2>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or country…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-10 bg-card border-border"
              />
            </div>
          </div>

          {/* Roster */}
          {loading || permLoading ? (
            <div className="rounded-xl border border-border bg-card p-12">
              <InlineLoader />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center space-y-3">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">
                  {students.length === 0 ? 'No students assigned yet' : 'No matches found'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {students.length === 0
                    ? 'Contact your admin to get students assigned to your workspace.'
                    : 'Try a different search term.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((student) => {
                const perm = permissions.find(p => p.student_user_id === student.user_id);
                const grantedChips = PERM_CHIPS.filter(c => perm && (perm as any)[c.key]);
                const initials = (student.full_name || '?')
                  .split(' ')
                  .map(s => s[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <button
                    key={student.user_id}
                    onClick={() => navigate(`/editor/students/${student.user_id}`)}
                    className="group relative text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Hover accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />

                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-11 w-11 shrink-0 ring-2 ring-border group-hover:ring-primary/30 transition">
                            <AvatarFallback className="bg-gradient-to-br from-primary/15 to-accent/20 text-primary font-serif font-bold text-sm">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {student.full_name || 'Unnamed Student'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {student.country_of_education || 'Not specified'}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                      </div>

                      {/* Permission chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/60">
                        {grantedChips.length === 0 ? (
                          <span className="text-[10px] text-muted-foreground italic pt-2">No permissions granted</span>
                        ) : (
                          grantedChips.map(chip => {
                            const Icon = chip.icon;
                            return (
                              <span
                                key={chip.key}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-[10px] font-medium text-foreground/80 mt-2"
                              >
                                <Icon className="h-2.5 w-2.5" />
                                {chip.label}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EditorDashboard;
