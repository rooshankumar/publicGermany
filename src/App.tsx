import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import React, { Suspense, lazy } from "react";
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./components/AuthCallback"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Applications = lazy(() => import("./pages/Applications"));
const Services = lazy(() => import("./pages/Services"));
const Resources = lazy(() => import("./pages/Resources"));
const Contact = lazy(() => import("./pages/Contact"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Requests = lazy(() => import("./pages/admin/Requests"));
const Students = lazy(() => import("./pages/admin/Students"));
const ApplicationsAdmin = lazy(() => import("./pages/admin/Applications"));
const Payments = lazy(() => import("./pages/admin/Payments"));
const StudentProfile = lazy(() => import("./pages/admin/StudentProfile"));
const Exports = lazy(() => import("./pages/admin/Exports"));
const Universities = lazy(() => import("./pages/admin/Universities"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Documents = lazy(() => import("./pages/Documents"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/dashboard" replace />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
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
          <ProtectedRoute disallowRole="admin">
            <Resources />
          </ProtectedRoute>
        } />
        <Route path="/contact" element={
          <ProtectedRoute disallowRole="admin">
            <Contact />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/requests" element={
          <ProtectedRoute requiredRole="admin">
            <Requests />
          </ProtectedRoute>
        } />
        <Route path="/admin/students" element={
          <ProtectedRoute requiredRole="admin">
            <Students />
          </ProtectedRoute>
        } />
        <Route path="/admin/students/:studentId" element={
          <ProtectedRoute requiredRole="admin">
            <StudentProfile />
          </ProtectedRoute>
        } />
        <Route path="/admin/applications" element={
          <ProtectedRoute requiredRole="admin">
            <ApplicationsAdmin />
          </ProtectedRoute>
        } />
        <Route path="/admin/payments" element={
          <ProtectedRoute requiredRole="admin">
            <Payments />
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
        <Route path="/documents" element={
          <ProtectedRoute disallowRole="admin">
            <Documents />
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
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
