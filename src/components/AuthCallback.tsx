import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import FullScreenLoader from '@/components/FullScreenLoader';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 1) PKCE flow: handle "code" in search params
        const params = new URLSearchParams(location.search);
        const code = params.get('code');

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data?.session) {
            navigate('/dashboard', { replace: true });
            return;
          }
        }

        // 2) Implicit flow: handle tokens in hash fragment
        if (location.hash && location.hash.includes('access_token')) {
          const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
          const access_token = hash.get('access_token') || undefined;
          const refresh_token = hash.get('refresh_token') || undefined;

          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;
            if (data?.session) {
              navigate('/dashboard', { replace: true });
              return;
            }
          }
        }

        // 3) Fallback: check existing session
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session) {
          navigate('/dashboard', { replace: true });
          return;
        }

        // If everything fails, go back to auth
        navigate('/auth', { replace: true });
      } catch (error: any) {
        console.error('Auth callback error:', error);
        navigate('/auth?error=' + encodeURIComponent(error?.message || 'OAuth callback failed'), { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  return <FullScreenLoader label="Completing sign in" />;
};

export default AuthCallback;
