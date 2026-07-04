import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { ContractCard } from '@/components/ContractCard';
import { Link } from 'react-router-dom';
import {
  FileText,
  ArrowRight,
  BookOpen,
  Loader2,
  User,
  Briefcase,
  GraduationCap,
  Clock,
  Upload,
  Send,
  CheckCircle2,
  AlertCircle,
  Zap,
  Trophy,
  BarChart3,
  Lightbulb,
  MessageCircle,
} from 'lucide-react';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [docsCount, setDocsCount] = useState(0);
  const [appsCount, setAppsCount] = useState(0);
  const [submittedApps, setSubmittedApps] = useState(0);
  const [nearestDeadline, setNearestDeadline] = useState<{ name: string; date: string; days: number } | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<{ action: string; entity_type: string; created_at: string }[]>([]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [pendingCurrency, setPendingCurrency] = useState('INR');

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
          { data: events },
          { data: requests },
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', user.id).single(),
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('applications').select('id, status, university_name, application_end_date').eq('user_id', user.id),
          supabase.from('contracts').select('*').eq('student_id', user.id).neq('status', 'draft').order('sent_at', { ascending: false }),
          supabase.from('events').select('action, entity_type, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('service_requests').select('id, service_price, target_total_amount, target_currency, service_currency, service_payments(amount, status)').eq('user_id', user.id),
        ]);

        const prof = profResult.data;
        const fields = [
          !!prof?.full_name, !!prof?.date_of_birth, !!prof?.country_of_education,
          !!prof?.class_12_marks, !!prof?.bachelor_degree_name,
          !!(prof?.ielts_toefl_score || prof?.german_level),
        ];
        setProfileCompletion(Math.round((fields.filter(Boolean).length / fields.length) * 100));
        setDocsCount(dCount || 0);
        const appsList = apps || [];
        setAppsCount(appsList.length);
        setSubmittedApps(appsList.filter(a => ['submitted', 'Applied'].includes(a.status)).length);

        const now = new Date();
        const upcoming = appsList
          .filter(a => a.application_end_date && new Date(a.application_end_date) > now)
          .sort((a, b) => new Date(a.application_end_date!).getTime() - new Date(b.application_end_date!).getTime());
        if (upcoming.length > 0) {
          const d = new Date(upcoming[0].application_end_date!);
          setNearestDeadline({
            name: upcoming[0].university_name,
            date: d.toLocaleDateString(),
            days: Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          });
        }

        setContracts(ctrData || []);
        setRecentEvents(events || []);

        let totalPending = 0;
        let currency = 'INR';
        (requests || []).forEach((r: any) => {
          const target = Number(r.target_total_amount ?? r.service_price ?? 0) || 0;
          const received = (r.service_payments || [])
            .filter((p: any) => (p.status || '').toLowerCase() === 'received')
            .reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
          totalPending += Math.max(0, target - received);
          currency = r.target_currency || r.service_currency || currency;
        });
        setPendingAmount(totalPending);
        setPendingCurrency(currency);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-pg-label3" />
        </div>
      </Layout>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const money = pendingAmount > 0
    ? `${pendingCurrency === 'INR' ? '₹' : pendingCurrency + ' '}${pendingAmount.toLocaleString()}`
    : 'All clear';

  const stats = [
    { to: '/profile', icon: User, label: 'Profile', value: `${profileCompletion}%` },
    { to: '/documents', icon: FileText, label: 'Documents', value: `${docsCount} uploaded` },
    { to: '/applications', icon: GraduationCap, label: 'Applications', value: `${appsCount} added` },
    { to: '/services', icon: Briefcase, label: 'Services', value: 'Get help' },
    { to: '/payments', icon: AlertCircle, label: 'Pending', value: money, urgent: pendingAmount > 0 },
  ];

  const quickActions = [
    { to: '/profile', icon: User, label: 'Complete profile' },
    { to: '/documents', icon: Upload, label: 'Upload docs' },
    { to: '/applications', icon: GraduationCap, label: 'Add university' },
    { to: '/services', icon: Briefcase, label: 'Browse services' },
    { to: '/converter', icon: BarChart3, label: 'Grade converter' },
    { to: '/resources', icon: BookOpen, label: 'Resources' },
  ];

  return (
    <Layout>
      <div className="max-w-[1080px] mx-auto px-1 sm:px-2 pb-24 space-y-5">
        {/* Greeting */}
        <div className="pt-2">
          <h1 className="text-[26px] font-bold text-pg-label tracking-tight">Welcome, {firstName}</h1>
          <p className="text-[14px] text-pg-label2 mt-1">
            {profileCompletion < 100
              ? `Your profile is ${profileCompletion}% complete — a few fields left.`
              : 'Your profile is complete. Ready for the next step.'}
          </p>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.to}
                to={s.to}
                className={`flex items-center gap-2.5 p-3.5 rounded-[14px] border transition-colors bg-pg-bg ${
                  s.urgent ? 'border-pg-accent/40 hover:border-pg-accent' : 'border-pg-sep hover:border-pg-label3/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 ${
                  s.urgent ? 'bg-pg-accent/10 text-pg-accent' : 'bg-pg-bg2 text-pg-label'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-pg-label">{s.label}</div>
                  <div className={`text-[11.5px] truncate ${s.urgent ? 'text-pg-accent font-semibold' : 'text-pg-label3'}`}>{s.value}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick actions */}
        <section className="bg-pg-bg rounded-[16px] border border-pg-sep p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-pg-gold" />
            <h2 className="text-[15px] font-semibold text-pg-label">Quick actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.to}
                  to={a.to}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] bg-pg-bg2 hover:bg-pg-bg3 text-[13px] text-pg-label transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-pg-label2" />
                  <span className="truncate">{a.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Journey */}
        <section className="bg-pg-bg rounded-[16px] border border-pg-sep p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-pg-accent" />
            <h2 className="text-[15px] font-semibold text-pg-label">Your journey</h2>
          </div>
          <div className="space-y-2.5">
            {[
              { done: profileCompletion === 100, n: 1, title: 'Complete your profile', desc: 'Fill in all essential details', to: '/profile', extra: `${profileCompletion}%` },
              { done: docsCount > 0, n: 2, title: 'Upload documents', desc: 'Certificates & transcripts', to: '/documents', extra: docsCount > 0 ? 'View →' : 'Add →' },
              { done: appsCount > 0, n: 3, title: 'Add universities', desc: 'Shortlist your targets', to: '/applications', extra: appsCount > 0 ? 'View →' : 'Add →' },
              { done: false, n: 4, title: 'Get professional help', desc: 'SOP, LOR, visa guidance', to: '/services', extra: 'Explore →' },
            ].map((step) => (
              <div key={step.n} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
                  step.done ? 'bg-pg-green/15 text-pg-green' : 'bg-pg-bg2 text-pg-label2'
                }`}>
                  {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.n}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-pg-label">{step.title}</div>
                  <div className="text-[12px] text-pg-label3">{step.desc}</div>
                </div>
                <Link to={step.to} className="text-[12px] font-semibold text-pg-accent hover:underline shrink-0">
                  {step.extra}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Alerts */}
        {(nearestDeadline || profileCompletion < 50) && (
          <section className="bg-pg-gold/10 border border-pg-gold/30 rounded-[16px] p-5 space-y-3">
            {profileCompletion < 50 && (
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-pg-gold shrink-0 mt-0.5" />
                <div className="text-[13px]">
                  <div className="font-semibold text-pg-label">Profile incomplete</div>
                  <div className="text-pg-label2">Complete your profile to unlock better recommendations.</div>
                  <Link to="/profile" className="inline-block mt-2 pg-btn pg-btn-secondary pg-btn-sm">Complete now</Link>
                </div>
              </div>
            )}
            {nearestDeadline && (
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-pg-accent shrink-0 mt-0.5" />
                <div className="text-[13px]">
                  <div className="font-semibold text-pg-label">Upcoming deadline</div>
                  <div className="text-pg-label2">{nearestDeadline.name} closes in {nearestDeadline.days} days ({nearestDeadline.date})</div>
                  <Link to="/applications" className="inline-block mt-2 pg-btn pg-btn-secondary pg-btn-sm">View details</Link>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Community */}
        <section className="bg-pg-bg rounded-[16px] border border-pg-sep p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-pg-green" />
            <h2 className="text-[15px] font-semibold text-pg-label">Join our community</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href="https://chat.whatsapp.com/IX9Z24dCKIk0nVn98L3rxd?mode=hqctcla"
              target="_blank"
              rel="noreferrer"
              className="pg-btn pg-btn-secondary justify-start"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp group
            </a>
            <a
              href="https://t.me/publicgermany"
              target="_blank"
              rel="noreferrer"
              className="pg-btn pg-btn-secondary justify-start"
            >
              <Send className="w-3.5 h-3.5" /> Telegram channel
            </a>
          </div>
        </section>

        {/* Tips */}
        <section className="bg-pg-bg rounded-[16px] border border-pg-sep p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-pg-accent" />
            <h2 className="text-[15px] font-semibold text-pg-label">Helpful tips</h2>
          </div>
          <ul className="space-y-2 text-[13px] text-pg-label2">
            {[
              'A complete profile improves the accuracy of university and program recommendations.',
              'Keep Class 10, 12, Bachelor transcripts and language certificates ready in PDF format.',
              'Shortlist universities early to stay ahead of intake deadlines and portal opening dates.',
              'Use our SOP, LOR, and visa guidance services to strengthen each step.',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-pg-green mt-0.5 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Contracts */}
        {contracts.length > 0 && (
          <section className="bg-pg-bg rounded-[16px] border border-pg-sep p-5">
            <h2 className="text-[15px] font-semibold text-pg-label mb-3">Active contracts</h2>
            <div className="space-y-2">
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
            </div>
          </section>
        )}

        {/* Activity */}
        {recentEvents.length > 0 && (
          <section className="bg-pg-bg rounded-[16px] border border-pg-sep p-5">
            <h2 className="text-[15px] font-semibold text-pg-label mb-3">Recent activity</h2>
            <div className="divide-y divide-pg-sep">
              {recentEvents.map((ev, i) => (
                <div key={i} className="flex items-center justify-between text-[12.5px] py-2">
                  <div className="flex items-center gap-2 text-pg-label2">
                    {ev.entity_type === 'document' ? <Upload className="w-3 h-3" /> :
                      ev.entity_type === 'application' ? <Send className="w-3 h-3" /> :
                      <FileText className="w-3 h-3" />}
                    <span>{ev.action}</span>
                  </div>
                  <span className="text-pg-label3">{new Date(ev.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
