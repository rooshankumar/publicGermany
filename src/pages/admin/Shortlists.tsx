import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Download, Search, Users, GraduationCap, CheckCircle, Star } from 'lucide-react';
import { generateShortlistPdf, fmtDate, fmtFees, STATUS_LABEL, type ShortlistStudent, type ShortlistApp } from '@/lib/shortlistPdf';

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  bachelor_degree_name: string | null;
  bachelor_field: string | null;
  bachelor_university: string | null;
  bachelor_cgpa_percentage: string | null;
  ielts_toefl_score: string | null;
  german_level: string | null;
  intake: string | null;
  intended_master_course: string | null;
}

type AppRow = ShortlistApp & { user_id: string };
type Student = ProfileRow & { email: string; applications: AppRow[]; is_favorite: boolean };

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'submitted': return 'bg-primary/10 text-primary';
    case 'under_review': return 'bg-warning/10 text-warning';
    case 'accepted': return 'bg-success/10 text-success';
    case 'rejected': return 'bg-destructive/10 text-destructive';
    default: return 'bg-muted/20 text-muted-foreground';
  }
};

export default function Shortlists() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [starredOnly, setStarredOnly] = useState(true);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['shortlists-full', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Student[]> => {
      const [profRes, appRes, favRes] = await Promise.all([
        (supabase as any)
          .from('profiles')
          .select('user_id, full_name, phone, bachelor_degree_name, bachelor_field, bachelor_university, bachelor_cgpa_percentage, ielts_toefl_score, german_level, intake, intended_master_course')
          .eq('role', 'student')
          .order('full_name'),
        (supabase as any)
          .from('applications')
          .select('user_id, university_name, program_name, status, fees_eur_per_semester, fees_eur, application_start_date, application_end_date, application_method, german_requirement, ielts_requirement')
          .order('application_end_date', { ascending: true, nullsFirst: false })
          .limit(5000),
        (supabase as any).from('student_favorites').select('student_id').eq('admin_id', user!.id),
      ]);
      if (profRes.error) throw profRes.error;
      if (appRes.error) throw appRes.error;
      const favs = new Set(((favRes.data || []) as any[]).map((f) => f.student_id));
      const byUser = new Map<string, AppRow[]>();
      for (const a of (appRes.data || []) as AppRow[]) {
        if (!byUser.has(a.user_id)) byUser.set(a.user_id, []);
        byUser.get(a.user_id)!.push(a);
      }
      const started = ((profRes.data || []) as ProfileRow[]).filter((p) => byUser.has(p.user_id));
      const withEmail = await Promise.all(started.map(async (p) => {
        let email = '';
        try {
          const { data } = await (supabase as any).rpc('get_user_email', { p_user_id: p.user_id });
          email = data || '';
        } catch { /* ignore */ }
        return { ...p, email, applications: byUser.get(p.user_id)!, is_favorite: favs.has(p.user_id) };
      }));
      return withEmail.sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite));
    },
  });

  const starredCount = students.filter((s) => s.is_favorite).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (starredOnly && !s.is_favorite) return false;
      if (!q) return true;
      return (s.full_name || '').toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.applications.some((a) => a.university_name.toLowerCase().includes(q) || a.program_name.toLowerCase().includes(q));
    });
  }, [students, search, starredOnly]);

  const totals = useMemo(() => {
    const all = filtered.flatMap((s) => s.applications);
    return { students: filtered.length, unis: all.length, offers: all.filter((a) => a.status === 'accepted').length };
  }, [filtered]);

  const toPdf = (s: Student): ShortlistStudent => ({ ...s, full_name: s.full_name || '' });

  const handleDownloadAll = async () => {
    if (!filtered.length) return;
    setDownloadingAll(true);
    try { await generateShortlistPdf(filtered.map(toPdf)); } finally { setDownloadingAll(false); }
  };
  const handleDownloadOne = async (s: Student) => {
    setDownloadingId(s.user_id);
    try { await generateShortlistPdf([toPdf(s)], { singleStudent: true }); } finally { setDownloadingId(null); }
  };

  const th = 'px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap';
  const td = 'px-2 py-1.5 align-top';

  return (
    <Layout>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-base font-bold text-foreground">Student Shortlists</h1>
            <p className="text-[10px] text-muted-foreground">Started students — full shortlist details at one glance</p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleDownloadAll} disabled={downloadingAll || !filtered.length}>
            <Download className="h-3.5 w-3.5" />
            {downloadingAll ? 'Preparing…' : 'Download PDF'}
          </Button>
        </div>

        <Card className="shadow-none border-l-4 border-l-primary">
          <CardContent className="p-2.5 grid grid-cols-3 gap-2">
            {[
              { icon: Users, v: totals.students, l: 'Students', c: 'text-primary' },
              { icon: GraduationCap, v: totals.unis, l: 'Universities shortlisted', c: 'text-primary' },
              { icon: CheckCircle, v: totals.offers, l: 'Offers', c: 'text-success' },
            ].map(({ icon: Icon, v, l, c }) => (
              <div key={l} className="flex items-center gap-2">
                <Icon className={`h-4 w-4 shrink-0 ${c}`} />
                <div>
                  <p className="text-sm font-bold leading-none">{v}</p>
                  <p className="text-[9px] text-muted-foreground">{l}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="inline-flex rounded-md border p-0.5 bg-muted/30">
            <Button size="sm" variant={starredOnly ? 'default' : 'ghost'} className="h-7 text-[11px] gap-1" onClick={() => setStarredOnly(true)}>
              <Star className="h-3 w-3" /> Starred ({starredCount})
            </Button>
            <Button size="sm" variant={!starredOnly ? 'default' : 'ghost'} className="h-7 text-[11px]" onClick={() => setStarredOnly(false)}>
              All ({students.length})
            </Button>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search name, email, university or program…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-none">
            <CardContent className="py-10 text-center">
              <GraduationCap className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">{starredOnly ? 'No starred students with shortlists' : 'No shortlists yet'}</p>
              <p className="text-xs text-muted-foreground">
                {starredOnly ? 'Star students on the Students page, or switch to All.' : 'Students appear here once universities are added.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <Card key={s.user_id} className="shadow-none overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/40">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate flex items-center gap-1.5">
                      {s.is_favorite && <Star className="h-3 w-3 fill-primary text-primary shrink-0" />}
                      {s.full_name || 'Unnamed student'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {[s.email, s.phone].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 shrink-0" onClick={() => handleDownloadOne(s)} disabled={downloadingId === s.user_id}>
                    <Download className="h-3 w-3" />{downloadingId === s.user_id ? '…' : 'PDF'}
                  </Button>
                </div>
                <div className="px-3 py-1.5 border-b text-[10px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>Bachelor: <b className="text-foreground font-medium">{[s.bachelor_degree_name, s.bachelor_field].filter(Boolean).join(', ') || '—'}</b></span>
                  <span>CGPA: <b className="text-foreground font-medium">{s.bachelor_cgpa_percentage || '—'}</b></span>
                  <span>IELTS/TOEFL: <b className="text-foreground font-medium">{s.ielts_toefl_score || '—'}</b></span>
                  <span>German: <b className="text-foreground font-medium uppercase">{s.german_level || '—'}</b></span>
                  <span>Intake: <b className="text-foreground font-medium">{s.intake || '—'}</b></span>
                  <span>Target: <b className="text-foreground font-medium">{s.intended_master_course || '—'}</b></span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border-collapse">
                    <thead className="bg-muted/30 border-b">
                      <tr>
                        <th className={th}>#</th>
                        <th className={th}>University</th>
                        <th className={th}>Program</th>
                        <th className={th}>Start</th>
                        <th className={th}>Deadline</th>
                        <th className={th}>Method</th>
                        <th className={th}>German Req.</th>
                        <th className={th}>English Req.</th>
                        <th className={th}>Status</th>
                        <th className={th}>Fees/Sem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.applications.map((a, i) => (
                        <tr key={i} className="border-b last:border-0 even:bg-muted/20">
                          <td className={`${td} text-muted-foreground`}>{i + 1}</td>
                          <td className={`${td} font-semibold min-w-[140px]`}>{a.university_name}</td>
                          <td className={`${td} text-muted-foreground min-w-[160px]`}>{a.program_name}</td>
                          <td className={`${td} whitespace-nowrap`}>{fmtDate(a.application_start_date)}</td>
                          <td className={`${td} whitespace-nowrap font-medium`}>{fmtDate(a.application_end_date)}</td>
                          <td className={td}>{a.application_method || '—'}</td>
                          <td className={td}>{a.german_requirement || '—'}</td>
                          <td className={td}>{a.ielts_requirement || '—'}</td>
                          <td className={td}>
                            <Badge variant="secondary" className={`${getStatusBadge(a.status)} text-[9px] px-1.5 py-0 h-4`}>
                              {STATUS_LABEL[a.status] || a.status}
                            </Badge>
                          </td>
                          <td className={`${td} whitespace-nowrap`}>{fmtFees(a).replace('EUR ', '€')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
