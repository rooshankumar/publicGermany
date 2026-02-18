import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ContractCard } from '@/components/ContractCard';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  BookOpen,
  Loader2,
  Download,
  User,
  Briefcase
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { downloadContractPDF } from '@/lib/contractGenerator';

// Minimal progress bar
const ProgressBar = ({ value, className = '' }: { value: number; className?: string }) => (
  <div className={`relative h-2 w-full overflow-hidden rounded-full bg-secondary ${className}`}>
    <div 
      className="h-full rounded-full bg-primary transition-all duration-500"
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [docsCount, setDocsCount] = useState(0);
  const [appsCount, setAppsCount] = useState(0);
  const [submittedApps, setSubmittedApps] = useState(0);
  const [nearestDeadline, setNearestDeadline] = useState<{ name: string; date: string; days: number } | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [activeContractId, setActiveContractId] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [
          profResult,
          { count: dCount },
          { data: apps },
          { data: ctrData },
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', user.id).single(),
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('applications').select('id, status, university_name, application_end_date').eq('user_id', user.id),
          supabase.from('contracts').select('*').eq('student_id', user.id).neq('status', 'draft').order('sent_at', { ascending: false }),
        ]);

        const prof = profResult.data;
        // Profile completion
        const fields = [
          !!prof?.full_name, !!prof?.date_of_birth, !!prof?.country_of_education,
          !!prof?.class_12_marks, !!prof?.bachelor_degree_name,
          !!(prof?.ielts_toefl_score || prof?.german_level)
        ];
        setProfileCompletion(Math.round((fields.filter(Boolean).length / fields.length) * 100));

        setDocsCount(dCount || 0);
        const appsList = apps || [];
        setAppsCount(appsList.length);
        setSubmittedApps(appsList.filter(a => ['submitted', 'Applied'].includes(a.status)).length);

        // Nearest deadline
        const now = new Date();
        const upcoming = appsList
          .filter(a => a.application_end_date && new Date(a.application_end_date) > now)
          .sort((a, b) => new Date(a.application_end_date!).getTime() - new Date(b.application_end_date!).getTime());
        if (upcoming.length > 0) {
          const d = new Date(upcoming[0].application_end_date!);
          setNearestDeadline({
            name: upcoming[0].university_name,
            date: d.toLocaleDateString(),
            days: Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          });
        }

        setContracts(ctrData || []);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleDownloadContract = async (contract: any) => {
    if (!contract?.contract_html) return;
    setDownloadingPdf(true);
    try {
      await downloadContractPDF(contract.contract_html, `Contract-${contract.contract_reference}.pdf`);
      toast({ title: 'Downloaded', description: 'Contract PDF saved' });
    } catch { toast({ title: 'Error', description: 'Failed to download', variant: 'destructive' }); }
    finally { setDownloadingPdf(false); }
  };

  if (loading) {
    return <Layout><div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></Layout>;
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const activeContract = contracts.find(c => c.id === activeContractId);

  return (
    <Layout>
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* German flag stripe */}
        <div className="german-stripe w-full" />

        {/* Greeting */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {profileCompletion < 100
              ? `Your profile is ${profileCompletion}% complete — finish it to unlock all features.`
              : 'Your profile is complete. Keep your applications on track!'}
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<User className="h-5 w-5" />} label="Profile" value={`${profileCompletion}%`} sub={profileCompletion < 100 ? 'Incomplete' : 'Complete'} href="/profile" />
          <StatCard icon={<FileText className="h-5 w-5" />} label="Documents" value={String(docsCount)} sub="Uploaded" href="/documents" />
          <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Applications" value={String(appsCount)} sub={`${submittedApps} submitted`} href="/applications" />
          <StatCard icon={<Briefcase className="h-5 w-5" />} label="Services" value="" sub="Browse services" href="/services" />
        </div>

        {/* Nearest Deadline */}
        {nearestDeadline && (
          <Card className="border-warning/30">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium">Next deadline: {nearestDeadline.name}</p>
                  <p className="text-xs text-muted-foreground">{nearestDeadline.date} — {nearestDeadline.days} days left</p>
                </div>
              </div>
              <Link to="/applications">
                <Button size="sm" variant="outline">View <ArrowRight className="ml-1 h-4 w-4" /></Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Profile Completion Bar (only if incomplete) */}
        {profileCompletion < 100 && (
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Profile completion</span>
                <span className="text-sm text-muted-foreground">{profileCompletion}%</span>
              </div>
              <ProgressBar value={profileCompletion} />
              <Link to="/profile">
                <Button size="sm" className="w-full">Complete Profile <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Active Contracts */}
        {contracts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Your Contracts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  userId={user?.id}
                  onStatusChange={async () => {
                    const { data } = await supabase.from('contracts').select('*').eq('student_id', user?.id).neq('status', 'draft').order('sent_at', { ascending: false });
                    if (data) setContracts(data);
                  }}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickLink href="/documents" icon={<FileText className="h-5 w-5" />} label="Upload Documents" />
          <QuickLink href="/applications" icon={<GraduationCap className="h-5 w-5" />} label="View Applications" />
          <QuickLink href="/resources" icon={<BookOpen className="h-5 w-5" />} label="Resources & Guides" />
        </div>
      </div>

      {/* Contract Preview Dialog */}
      <Dialog open={showContractPreview} onOpenChange={setShowContractPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Contract</DialogTitle>
            <DialogDescription>{activeContract?.contract_reference}</DialogDescription>
          </DialogHeader>
          {activeContract?.contract_html && (
            <div className="border rounded-lg overflow-hidden bg-white max-h-[70vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: activeContract.contract_html }} />
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowContractPreview(false)}>Close</Button>
            <Button onClick={() => activeContract && handleDownloadContract(activeContract)} disabled={downloadingPdf}>
              {downloadingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

// --- Sub-components ---

function StatCard({ icon, label, value, sub, href }: { icon: React.ReactNode; label: string; value: string; sub: string; href: string }) {
  return (
    <Link to={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="py-3 flex flex-col items-center text-center gap-0.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-0.5">
            {icon}
          </div>
          {value && <p className="text-xl font-bold">{value}</p>}
          <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
          <p className="text-[10px] text-muted-foreground">{sub}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="py-3 flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            {icon}
          </div>
          <span className="text-xs font-medium">{label}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default Dashboard;
