import React from 'react';
import Resources from '../Resources';

// Admin wrapper for the existing Resources page.
// Keeps a single source of truth for resources content, while exposing it under /admin/resources
const AdminResources = () => {
  return <Resources />;
};

export default AdminResources;
