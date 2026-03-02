import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import React, { Suspense, lazy, useEffect } from "react";
import AppShellFallback from "./components/AppShellFallback";
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./components/AuthCallback"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Converter = lazy(() => import("./pages/Converter"));
const Applications = lazy(() => import("./pages/Applications"));
const GradeConverter = lazy(() => import("./pages/tools/grade-converter"));
const Services = lazy(() => import("./pages/ServicesNew"));
const Resources = lazy(() => import("./pages/Resources"));
const Contact = lazy(() => import("./pages/Contact"));
const Help = lazy(() => import("./pages/Help"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Requests = lazy(() => import("./pages/admin/Requests"));
const RequestStudents = lazy(() => import("./pages/admin/RequestStudents"));
const StudentRequests = lazy(() => import("./pages/admin/StudentRequests"));
const Students = lazy(() => import("./pages/admin/Students"));
const StudentsList = lazy(() => import("./pages/admin/StudentsList"));
const Payments = lazy(() => import("./pages/admin/Payments"));
const PaymentStudents = lazy(() => import("./pages/admin/PaymentStudents"));
const StudentPayments = lazy(() => import("./pages/admin/StudentPayments"));
const StudentProfile = lazy(() => import("./pages/admin/StudentProfile"));
const Exports = lazy(() => import("./pages/admin/Exports"));
const Universities = lazy(() => import("./pages/admin/Universities"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const AdminResources = lazy(() => import("./pages/admin/Resources"));
const AdminContracts = lazy(() => import("./pages/admin/Contracts"));
const AdminBlog = lazy(() => import("./pages/admin/Blog"));
const AdminContractHistory = lazy(() => import("./pages/admin/ContractHistory"));
const StudentPaymentsPage = lazy(() => import("./pages/StudentPayments"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Documents = lazy(() => import("./pages/Documents"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const AcademicCVGenerator = lazy(() => import("./pages/AcademicCVGenerator"));
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

const AppRoutes = () => {
  const { user, loading, profile } = useAuth();

  // Preload most-used routes after auth state is known to avoid cold-start delays
  useEffect(() => {
    if (loading) return;
    // Public routes
    import('./pages/Index');
    import('./pages/Contact');
    import('./pages/Help');

    if (user) {
      // Student side preloads
      if (profile?.role !== 'admin') {
        import('./pages/Dashboard');
        import('./pages/Applications');
        import('./pages/ServicesNew');
        import('./pages/Resources');
        import('./pages/Documents');
        import('./pages/Reviews');
        import('./pages/Profile');
        import('./pages/Notifications');
      }
      // Admin side preloads
      if (profile?.role === 'admin') {
        import('./pages/admin/AdminDashboard');
        import('./pages/admin/RequestStudents');
        import('./pages/admin/PaymentStudents');
        import('./pages/admin/StudentsList');
        import('./pages/admin/StudentProfile');
        import('./pages/admin/Exports');
        import('./pages/admin/Universities');
        import('./pages/admin/Reviews');
        import('./pages/admin/Resources');
        import('./pages/admin/Blog');
      }
    }
  }, [loading, user, profile?.role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      // App Shell fallback: show layout chrome immediately, while page content lazily loads
      <AppShellFallback />
    }>
      <Routes>
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/dashboard" replace />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/converter" element={<Converter />} />
        <Route path="/europass-cv" element={<AcademicCVGenerator />} />
        <Route path="/academic-cv-generator" element={<Navigate to="/europass-cv" replace />} />
        {/* Redirect old /grade-converter to new /converter */}
        <Route path="/grade-converter" element={<Navigate to="/converter" replace />} />
        <Route path="/tools/grade-converter" element={
          <ProtectedRoute>
            <GradeConverter />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute disallowRole="admin">
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/applications" element={
          <ProtectedRoute disallowRole="admin">
            <Applications />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute disallowRole="admin">
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/services" element={
          <ProtectedRoute disallowRole="admin">
            <Services />
          </ProtectedRoute>
        } />
        <Route path="/resources" element={
          <ProtectedRoute>
            <Resources />
          </ProtectedRoute>
        } />
        {/* Make Contact public so it's accessible from the home page */}
        <Route path="/contact" element={<Contact />} />
        {/* Public Blog and Help Center */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/help" element={<Help />} />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/requests" element={
          <ProtectedRoute requiredRole="admin">
            <RequestStudents />
          </ProtectedRoute>
        } />
        <Route path="/admin/requests/:studentId" element={
          <ProtectedRoute requiredRole="admin">
            <StudentRequests />
          </ProtectedRoute>
        } />
        <Route path="/admin/students" element={
          <ProtectedRoute requiredRole="admin">
            <StudentsList />
          </ProtectedRoute>
        } />
        <Route path="/admin/students/:studentId" element={
          <ProtectedRoute requiredRole="admin">
            <StudentProfile />
          </ProtectedRoute>
        } />
        {/* Backward compatibility: redirect old admin applications path */}
        <Route path="/admin/applications" element={<Navigate to="/admin" replace />} />
        
        <Route path="/admin/payments" element={
          <ProtectedRoute requiredRole="admin">
            <PaymentStudents />
          </ProtectedRoute>
        } />
        <Route path="/admin/payments/:studentId" element={
          <ProtectedRoute requiredRole="admin">
            <StudentPayments />
          </ProtectedRoute>
        } />
        <Route path="/admin/student-profile" element={
          <ProtectedRoute requiredRole="admin">
            <StudentProfile />
          </ProtectedRoute>
        } />
        <Route path="/admin/exports" element={
          <ProtectedRoute requiredRole="admin">
            <Exports />
          </ProtectedRoute>
        } />
        <Route path="/admin/universities" element={
          <ProtectedRoute requiredRole="admin">
            <Universities />
          </ProtectedRoute>
        } />
        <Route path="/admin/reviews" element={
          <ProtectedRoute requiredRole="admin">
            <AdminReviews />
          </ProtectedRoute>
        } />
        <Route path="/admin/resources" element={
          <ProtectedRoute requiredRole="admin">
            <AdminResources />
          </ProtectedRoute>
        } />
        <Route path="/admin/blog" element={
          <ProtectedRoute requiredRole="admin">
            <AdminBlog />
          </ProtectedRoute>
        } />
        <Route path="/admin/contracts" element={
          <ProtectedRoute requiredRole="admin">
            <AdminContracts />
          </ProtectedRoute>
        } />
        <Route path="/admin/contract-history" element={
          <ProtectedRoute requiredRole="admin">
            <AdminContractHistory />
          </ProtectedRoute>
        } />
        <Route path="/documents" element={
          <ProtectedRoute disallowRole="admin">
            <Documents />
          </ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute disallowRole="admin">
            <StudentPaymentsPage />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute disallowRole="admin">
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/reviews" element={
          <ProtectedRoute disallowRole="admin">
            <Reviews />
          </ProtectedRoute>
        } />
        {/* Redirect old /aps path to /documents for backward compatibility */}
        <Route path="/aps" element={
          <Navigate to="/documents" replace />
        } />
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : <Index />
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      {import.meta.env.MODE === 'production' ? <Analytics /> : null}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
