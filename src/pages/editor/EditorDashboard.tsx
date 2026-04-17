import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEditorPermissions } from '@/hooks/useEditorPermissions';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, ArrowUpRight, Search, MapPin, FileText, GraduationCap, CreditCard, FileSignature, ChevronDown, FileCheck2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InlineLoader from '@/components/InlineLoader';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
  const [agreementOpen, setAgreementOpen] = useState(false);
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
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 space-y-8">

          {/* Clean header */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Editor Workspace</p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage assigned students and review their progress.
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Students</p>
                <p className="text-2xl font-semibold text-foreground tabular-nums">{students.length}</p>
              </div>
              <div className="border-l border-border pl-6">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Permissions</p>
                <p className="text-2xl font-semibold text-foreground tabular-nums">{totalPermsGranted}</p>
              </div>
            </div>
          </header>

          {/* Collaboration agreement dropdown */}
          <Collapsible open={agreementOpen} onOpenChange={setAgreementOpen}>
            <Card className="border-border overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Collaboration Agreement</p>
                      <p className="text-xs text-muted-foreground">Commission structure & terms</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${agreementOpen ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-5 pb-5 pt-2 border-t border-border space-y-5 text-sm">
                  {/* Path A */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">A</span>
                      <h3 className="font-semibold text-foreground">Upfront Model</h3>
                    </div>
                    <ul className="space-y-1.5 text-foreground/80 ml-8 list-disc marker:text-muted-foreground">
                      <li>Student pays: <span className="font-medium text-foreground">₹30k</span> (admission) + <span className="font-medium text-foreground">₹20k</span> (visa)</li>
                      <li>Your share: <span className="font-medium text-foreground">₹5k per student</span></li>
                      <li>Condition: Must opt for admission + visa</li>
                    </ul>
                  </div>

                  {/* Path B */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">B</span>
                      <h3 className="font-semibold text-foreground">Pay After Admission</h3>
                    </div>
                    <ul className="space-y-1.5 text-foreground/80 ml-8 list-disc marker:text-muted-foreground">
                      <li>Student pays: <span className="font-medium text-foreground">₹60k</span> (admission only) + <span className="font-medium text-foreground">₹20k</span> (visa)</li>
                      <li>Your share: <span className="font-medium text-foreground">₹7k–₹8k per student</span></li>
                      <li>Condition: Must opt for admission only</li>
                    </ul>
                  </div>

                  {/* Post-Admission */}
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <h3 className="font-semibold text-foreground mb-2">Post-Admission (Both Paths)</h3>
                    <p className="text-foreground/80">
                      Blocked account + loan services → <span className="font-semibold text-foreground">50–50 split</span>
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section header + search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              Assigned Students <span className="text-muted-foreground font-normal">({filtered.length})</span>
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or country"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Roster */}
          {loading || permLoading ? (
            <div className="rounded-lg border border-border bg-card p-12">
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    className="group text-left rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
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
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>

                    {/* Permission chips */}
                    <div className="flex flex-wrap gap-1 pt-3 border-t border-border">
                      {grantedChips.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground italic">No permissions granted</span>
                      ) : (
                        grantedChips.map(chip => {
                          const Icon = chip.icon;
                          return (
                            <span
                              key={chip.key}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground bg-muted"
                            >
                              <Icon className="h-2.5 w-2.5" />
                              {chip.label}
                            </span>
                          );
                        })
                      )}
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
