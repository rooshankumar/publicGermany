import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import FullScreenLoader from '@/components/FullScreenLoader';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PgLogoMark } from '@/components/PgLogo';
import { Loader2, ArrowLeft, Check } from 'lucide-react';

type Mode = 'signin' | 'signup' | 'forgot';

const Auth = () => {
  const { signIn, signUp, signInWithGoogle, resetPasswordForEmail, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { data: studentCount } = useQuery({
    queryKey: ['student-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const resetBanners = () => {
    setError(null);
    setMessage(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetBanners();
    const fd = new FormData(e.target as HTMLFormElement);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;
    if (!email || !password) return setError('Please fill in all fields');
    const { error } = await signIn(email, password);
    if (error) setError(error);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetBanners();
    const fd = new FormData(e.target as HTMLFormElement);
    const fullName = fd.get('fullName') as string;
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;
    const confirmPassword = fd.get('confirmPassword') as string;
    if (!fullName || !email || !password || !confirmPassword) return setError('Please fill in all fields');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    const { error } = await signUp(email, password, fullName);
    if (error) setError(error);
    else setMessage('Check your email to confirm your account.');
  };

  const handleGoogle = async () => {
    resetBanners();
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setGoogleLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    resetBanners();
    if (!forgotEmail) return setError('Please enter your email');
    setForgotLoading(true);
    const { error } = await resetPasswordForEmail(forgotEmail);
    if (error) setError(error);
    else setMessage('Password reset link sent. Check your inbox.');
    setForgotLoading(false);
  };

  if (loading) return <FullScreenLoader label="Preparing sign in" />;

  const inputClass =
    'w-full h-11 px-3.5 rounded-[10px] bg-pg-bg2 border border-transparent text-[15px] text-pg-label placeholder:text-pg-label3 outline-none focus:border-pg-accent focus:bg-pg-bg transition';
  const labelClass = 'block text-[12.5px] font-medium text-pg-label2 mb-1.5';

  return (
    <div className="min-h-screen bg-pg-bg2 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-pg-bg/80 backdrop-blur border-b border-pg-sep">
        <div className="max-w-[1080px] mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <PgLogoMark />
            <span className="font-semibold text-[15px] text-pg-label tracking-tight">publicgermany</span>
          </Link>
          <Link
            to="/"
            className="text-[13px] text-pg-label2 hover:text-pg-label flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex mb-4"><PgLogoMark /></div>
            <h1 className="text-[26px] font-bold text-pg-label tracking-tight mb-1">
              {mode === 'forgot' ? 'Reset password' : mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-[14px] text-pg-label2">
              {mode === 'forgot'
                ? 'Enter your email and we will send you a reset link.'
                : mode === 'signup'
                ? 'Start your Germany file in under a minute.'
                : 'Sign in to continue your Germany journey.'}
            </p>
          </div>

          {/* Segmented tabs */}
          {mode !== 'forgot' && (
            <div className="flex bg-pg-bg3 rounded-[10px] p-[3px] mb-5">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    resetBanners();
                  }}
                  className={`flex-1 py-2 text-[13.5px] font-semibold rounded-[8px] transition-colors ${
                    mode === m ? 'bg-pg-bg text-pg-label shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-pg-label2'
                  }`}
                >
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
          )}

          {/* Card */}
          <div className="bg-pg-bg rounded-[16px] border border-pg-sep p-5 md:p-6">
            {error && (
              <div className="mb-4 text-[13px] bg-pg-accent/10 text-pg-accent border border-pg-accent/20 rounded-[10px] px-3.5 py-2.5">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 text-[13px] bg-pg-green/10 text-pg-green border border-pg-green/20 rounded-[10px] px-3.5 py-2.5 flex gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className={labelClass} htmlFor="signin-email">Email</label>
                  <input id="signin-email" name="email" type="email" required placeholder="you@example.com" className={inputClass} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12.5px] font-medium text-pg-label2" htmlFor="signin-password">Password</label>
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); resetBanners(); }}
                      className="text-[12px] text-pg-accent hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input id="signin-password" name="password" type="password" required className={inputClass} />
                </div>
                <button type="submit" disabled={loading || googleLoading} className="pg-btn pg-btn-primary w-full h-11">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign in'}
                </button>
                <Divider />
                <GoogleButton onClick={handleGoogle} loading={googleLoading} />
              </form>
            )}

            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div>
                  <label className={labelClass} htmlFor="su-name">Full name</label>
                  <input id="su-name" name="fullName" type="text" required placeholder="Your name" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="su-email">Email</label>
                  <input id="su-email" name="email" type="email" required placeholder="you@example.com" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="su-pw">Password</label>
                  <input id="su-pw" name="password" type="password" required placeholder="Min. 6 characters" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="su-pw2">Confirm password</label>
                  <input id="su-pw2" name="confirmPassword" type="password" required className={inputClass} />
                </div>
                <button type="submit" disabled={loading || googleLoading} className="pg-btn pg-btn-primary w-full h-11">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create account'}
                </button>
                <Divider />
                <GoogleButton onClick={handleGoogle} loading={googleLoading} />
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-3.5">
                <div>
                  <label className={labelClass} htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
                <button type="submit" disabled={forgotLoading} className="pg-btn pg-btn-primary w-full h-11">
                  {forgotLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send reset link'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signin'); resetBanners(); }}
                  className="pg-btn pg-btn-secondary w-full h-11"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </button>
              </form>
            )}
          </div>

          <p className="mt-5 text-center text-[12.5px] text-pg-label3">
            Trusted by <span className="font-semibold text-pg-label">{studentCount ? `${studentCount}+` : '50+'}</span> students.
          </p>
          <div className="mt-3 text-center text-[11.5px] text-pg-label3 flex gap-3 justify-center">
            <Link to="/privacy" className="hover:text-pg-label">Privacy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-pg-label">Terms</Link>
            <span>·</span>
            <Link to="/help" className="hover:text-pg-label">Help</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

const Divider: React.FC = () => (
  <div className="relative py-1">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t border-pg-sep" />
    </div>
    <div className="relative flex justify-center">
      <span className="bg-pg-bg px-2.5 text-[11px] uppercase tracking-wide text-pg-label3">or</span>
    </div>
  </div>
);

const GoogleButton: React.FC<{ onClick: () => void; loading: boolean }> = ({ onClick, loading }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="pg-btn pg-btn-secondary w-full h-11"
  >
    {loading ? (
      <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
    ) : (
      <>
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        </svg>
        Continue with Google
      </>
    )}
  </button>
);

export default Auth;
