import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/LayoutLite';
import { supabase } from '@/integrations/supabase/client';
import Layout_default from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Download, Search, Users, GraduationCap, CheckCircle, Phone } from 'lucide-react';
import { generateShortlistPdf, type ShortlistStudent } from '@/lib/shortlistPdf';

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

interface AppRow {
  user_id: string;
  university_name: string;
  program_name: string;
  status: string;
  fees_eur_per_semester: number | null;
  fees_eur: string | null;
  application_end_date: string | null;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-muted/20 text-muted-foreground';
    case 'submitted': return 'bg-primary/10 text-primary';
    case 'under_review': return 'bg-warning/10 text-warning';
    case 'accepted': return 'bg-success/10 text-success';
    case 'rejected': return 'bg-destructive/10 text-destructive';
    case 'waitlisted': return 'bg-secondary/20 text-secondary-foreground';
    default: return 'bg-muted/20 text-muted-foreground';
  }
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  accepted: 'Offer',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
};

export default function Shortlists() {
  const [search, setSearch] = useState('');
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ['shortlists-profiles'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('user_id, full_name, phone, bachelor_degree_name, bachelor_field, bachelor_university, bachelor_cgpa_percentage, ielts_toefl_score, german_level, intake, intended_master_course')
        .eq('role', 'student')
        .order('full_name');
      if (error) throw error;
      return data as ProfileRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: applications, isLoading: loadingApps } = useQuery({
    queryKey: ['shortlists-applications'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('applications')
        .select('user_id, university_name, program_name, status, fees_eur_per_semester, fees_eur, application_end_date')
        .order('university_name');
      if (error) throw error;
      return data as AppRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const students: Array<ProfileRow & { applications: AppRow[] }> = useMemo(() => {
    if (!profiles || !applications) return [];
    const byUser = new Map<string, AppRow[]>();
    for (const app of applications) {
      if (!byUser.has(app.user_id)) byUser.set(app.user_id, []);
      byUser.get(app.user_id)!.push(app);
    }
    // Only students who actually started shortlisting (at least one university listed)
    return profiles
      .filter((p) => (byUser.get(p.user_id) || []).length > 0)
      .map((p) => ({ ...p, applications: byUser.get(p.user_id)! }));
  }, [profiles, applications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = (s.full_name || '').toLowerCase();
      const inApps = s.applications.some(
        (a) => a.university_name.toLowerCase().includes(q) || a.program_name.toLowerCase().includes(q)
      );
      return name.includes(q) || inApps;
    });
  }, [students, search]);

  const totals = useMemo(() => {
    const all = filtered.flatMap((s) => s.applications);
    return {
      students: filtered.length,
      unis: all.length,
      offers: all.filter((a) => a.status === 'accepted').length,
    };
  }, [filtered]);

  const toPdfStudent = (s: ProfileRow & { applications: AppRow[] }): ShortlistStudent => ({
    full_name: s.full_name || '',
    phone: s.phone,
    bachelor_degree_name: s.bachelor_degree_name,
    bachelor_field: s.bachelor_field,
    bachelor_university: s.bachelor_university,
    bachelor_cgpa_percentage: s.bachelor_cgpa_percentage,
    ielts_toefl_score: s.ielts_toefl_score,
    german_level: s.german_level,
    intake: s.intake,
    intended_master_course: s.intended_master_course,
    applications: s.applications,
  });

  const handleDownloadAll = async () => {
    if (!filtered.length) return;
    setDownloadingAll(true);
    try {
      await generateShortlistPdf(filtered.map(toPdfStudent));
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleDownloadOne = async (s: ProfileRow & { applications: AppRow[] }) => {
    setDownloadingId(s.user_id);
    try {
      await generateShortlistPdf([toPdfStudent(s)], { singleStudent: true });
    } finally {
      setDownloadingId(null);
    }
  };

  const loading = loadingProfiles || loadingApps;

  return (
    <Layout_default>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-base font-bold text-foreground">Student Shortlists</h1>
            <p className="text-[10px] text-muted-foreground">
              Started students — profile vitals and shortlisted universities at one glance
            </p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleDownloadAll} disabled={downloadingAll || !filtered.length}>
            <Download className="h-3.5 w-3.5" />
            {downloadingAll ? 'Preparing…' : 'Download PDF'}
          </Button>
        </div>

        {/* Summary strip */}
        <Card className="shadow-none border-l-4 border-l-primary">
          <CardContent className="p-2.5 grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-bold leading-none">{totals.students}</p>
                <p className="text-[9px] text-muted-foreground">Students started</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-bold leading-none">{totals.unis}</p>
                <p className="text-[9px] text-muted-foreground">Universities shortlisted</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success shrink-0" />
              <div>
                <p className="text-sm font-bold leading-none">{totals.offers}</p>
                <p className="text-[9px] text-muted-foreground">Offers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search student, university or program…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-none">
            <CardContent className="py-10 text-center">
              <GraduationCap className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">No shortlists yet</p>
              <p className="text-xs text-muted-foreground">Students appear here once universities are added to their application list.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <Card key={s.user_id} className="shadow-none overflow-hidden">
                {/* Student header */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/30">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{s.full_name || 'Unnamed student'}</p>
                    {s.phone && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Phone className="h-2.5 w-2.5" />{s.phone}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] gap-1 shrink-0"
                    onClick={() => handleDownloadOne(s)}
                    disabled={downloadingId === s.user_id}
                  >
                    <Download className="h-3 w-3" />
                    {downloadingId === s.user_id ? '…' : 'PDF'}
                  </Button>
                </div>

                {/* Vitals grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 px-3 py-2 border-b text-[10px]">
                  <div><span className="text-muted-foreground">Bachelor:</span> <span className="font-medium">{[s.bachelor_degree_name, s.bachelor_field].filter(Boolean).join(', ') || '—'}</span></div>
                  <div><span className="text-muted-foreground">Bachelor Uni:</span> <span className="font-medium">{s.bachelor_university || '—'}</span></div>
                  <div><span className="text-muted-foreground">CGPA / %:</span> <span className="font-medium">{s.bachelor_cgpa_percentage || '—'}</span></div>
                  <div><span className="text-muted-foreground">IELTS/TOEFL:</span> <span className="font-medium">{s.ielts_toefl_score || '—'}</span></div>
                  <div><span className="text-muted-foreground">German:</span> <span className="font-medium">{s.german_level || '—'}</span></div>
                  <div><span className="text-muted-foreground">Intake:</span> <span className="font-medium">{s.intake || '—'}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Target Course:</span> <span className="font-medium">{s.intended_master_course || '—'}</span></div>
                </div>

                {/* Shortlist table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-7 text-[9px] uppercase tracking-wide pl-3">University</TableHead>
                        <TableHead className="h-7 text-[9px] uppercase tracking-wide">Program</TableHead>
                        <TableHead className="h-7 text-[9px] uppercase tracking-wide">Status</TableHead>
                        <TableHead className="h-7 text-[9px] uppercase tracking-wide">Fees/Sem</TableHead>
                        <TableHead className="h-7 text-[9px] uppercase tracking-wide pr-3">Deadline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {s.applications.map((app, i) => (
                        <TableRow key={i} className="text-xs">
                          <TableCell className="py-1.5 pl-3 font-medium">{app.university_name}</TableCell>
                          <TableCell className="py-1.5 text-muted-foreground">{app.program_name}</TableCell>
                          <TableCell className="py-1.5">
                            <Badge className={`${getStatusBadge(app.status)} text-[9px] px-1.5 py-0 h-4`} variant="secondary">
                              {STATUS_LABEL[app.status] || app.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1.5">
                            {app.fees_eur_per_semester != null ? `€${app.fees_eur_per_semester}` : app.fees_eur ? `€${app.fees_eur}` : '—'}
                          </TableCell>
                          <TableCell className="py-1.5 pr-3">
                            {app.application_end_date
                              ? new Date(app.application_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout_default>
  );
}
