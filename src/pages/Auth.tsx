import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import FullScreenLoader from '@/components/FullScreenLoader';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, GraduationCap, Shield, Star, Users, Globe, BookOpen } from 'lucide-react';
import logos from '@/assets/logos.png';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const { signIn, signUp, signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Live student count query
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
  
  // Live services count query
  const { data: servicesCount } = useQuery({
    queryKey: ['services-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const formData = new FormData(e.target as HTMLFormElement);
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const { error } = await signUp(email, password, fullName);
    if (error) {
      setError(error);
    } else {
      setMessage('Check your email to confirm your account');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);
    setGoogleLoading(true);

    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setGoogleLoading(false);
    }
    // Note: If successful, the user will be redirected, so we don't need to set loading to false
  };

  const features = [
    { icon: GraduationCap, text: "APS Certification Guidance" },
    { icon: Globe, text: "University Application Support" },
    { icon: BookOpen, text: "Document Preparation Help" },
    { icon: Users, text: "Expert Consultations" }
  ];

  if (loading) {
    return <FullScreenLoader label="Preparing sign in" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
      }}></div>

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding & Features */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <div className="h-12 w-12 rounded-md overflow-hidden">
                <img src={logos} alt="publicgermany Logo" className="h-full w-full object-contain object-center p-0.5" />
              </div>
              <span className="font-bold text-2xl text-foreground">publicgermany</span>
              <Badge className="trust-badge">
                <Shield className="w-3 h-3" />
                Trusted
              </Badge>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Your Gateway to 
                <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent"> German Education</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Join thousands of students who have successfully navigated their way to German universities 
                with our comprehensive guidance and expert support.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-card/50 backdrop-blur-sm rounded-lg border">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                  </span>
                  {studentCount ? `${studentCount}+` : '50+'}
                </div>
                <div className="text-xs text-muted-foreground">Students Guided</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">99%</div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">1.5+</div>
                <div className="text-xs text-muted-foreground">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
                  </span>
                  {servicesCount ? `${servicesCount}+` : '10+'}
                </div>
                <div className="text-xs text-muted-foreground">Happy Services</div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Forms */}
          <div className="w-full max-w-md mx-auto">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <Card className="shadow-medium border-border/50 bg-card/95 backdrop-blur-sm">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <CardDescription>
                      Continue your German education journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email Address</Label>
                        <Input 
                          id="signin-email" 
                          name="email" 
                          type="email" 
                          placeholder="your@email.com"
                          required 
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <Input 
                          id="signin-password" 
                          name="password" 
                          type="password" 
                          required 
                          className="h-11"
                        />
                      </div>
                      
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      {message && (
                        <Alert>
                          <AlertDescription>{message}</AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" className="w-full h-11 btn-primary" disabled={loading || googleLoading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            <GraduationCap className="mr-2 h-4 w-4" />
                            Sign In to Dashboard
                          </>
                        )}
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>

                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full h-11" 
                        onClick={handleGoogleSignIn}
                        disabled={loading || googleLoading}
                      >
                        {googleLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting to Google...
                          </>
                        ) : (
                          <>
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                              <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                            Continue with Google
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signup">
                <Card className="shadow-medium border-border/50 bg-card/95 backdrop-blur-sm">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Start Your Journey</CardTitle>
                    <CardDescription>
                      Begin your path to German universities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-fullName">Full Name</Label>
                        <Input 
                          id="signup-fullName" 
                          name="fullName" 
                          type="text" 
                          placeholder="John Doe"
                          required 
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email Address</Label>
                        <Input 
                          id="signup-email" 
                          name="email" 
                          type="email" 
                          placeholder="your@email.com"
                          required 
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input 
                          id="signup-password" 
                          name="password" 
                          type="password" 
                          placeholder="Minimum 6 characters"
                          required 
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirmPassword">Confirm Password</Label>
                        <Input 
                          id="signup-confirmPassword" 
                          name="confirmPassword" 
                          type="password" 
                          required 
                          className="h-11"
                        />
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      {message && (
                        <Alert className="border-success/20 bg-success/10">
                          <AlertDescription className="text-success">{message}</AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" className="w-full h-11 btn-success" disabled={loading || googleLoading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            <Star className="mr-2 h-4 w-4" />
                            Create Free Account
                          </>
                        )}
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>

                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full h-11" 
                        onClick={handleGoogleSignIn}
                        disabled={loading || googleLoading}
                      >
                        {googleLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting to Google...
                          </>
                        ) : (
                          <>
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                              <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                            Continue with Google
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Trusted by <span className="font-semibold text-primary">50+</span> students worldwide
              </p>
            </div>
            <div className="mt-4 text-center text-xs text-muted-foreground">
              <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
              <span className="mx-2">•</span>
              <Link to="/terms" className="hover:underline">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;