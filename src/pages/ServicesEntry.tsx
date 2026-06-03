import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import FullScreenLoader from '@/components/FullScreenLoader';
import ServicesNew from './ServicesNew';
import PublicServices from './PublicServices';
import { Navigate } from 'react-router-dom';

/**
 * /services route entry. Renders the full authed services dashboard for logged-in
 * students, and a SEO-friendly public package page for unregistered visitors.
 */
const ServicesEntry: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) return <FullScreenLoader label="Loading services" />;

  if (!user) return <PublicServices />;

  // Admins shouldn't see the student services dashboard.
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
  if (profile?.role === 'editor') return <Navigate to="/editor" replace />;

  return <ServicesNew />;
};

export default ServicesEntry;
