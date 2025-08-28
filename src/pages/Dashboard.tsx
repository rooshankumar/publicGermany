import React from 'react';
import Layout from '@/components/Layout';
import NextActionCard from '@/components/NextActionCard';
import ModuleProgressGrid from '@/components/ModuleProgressGrid';

const Dashboard = () => {
  const nextActions = [
    { 
      id: "aps-docs",
      title: "Complete APS Documents", 
      description: "Upload remaining documents for APS verification",
      priority: "high" as const,
      category: "APS",
      actionLink: "/aps",
      dueDate: "Jan 15, 2025"
    },
    { 
      id: "university-apps",
      title: "University Applications", 
      description: "Submit applications to your target universities",
      priority: "medium" as const,
      category: "Applications",
      actionLink: "/applications"
    }
  ];

  const modules = [
    { 
      key: 'aps', 
      name: 'APS Documents', 
      icon: ({ className }: { className?: string }) => <span className={className}>📄</span>,
      progress: 65, 
      completedTasks: 4,
      totalTasks: 6,
      status: 'in_progress' as const, 
      nextAction: 'Upload transcripts',
      link: '/aps'
    },
    { 
      key: 'applications', 
      name: 'University Applications', 
      icon: ({ className }: { className?: string }) => <span className={className}>🎓</span>,
      progress: 30, 
      completedTasks: 2,
      totalTasks: 8,
      status: 'in_progress' as const, 
      nextAction: 'Complete application forms',
      link: '/applications'
    },
    { 
      key: 'profile', 
      name: 'Profile Setup', 
      icon: ({ className }: { className?: string }) => <span className={className}>👤</span>,
      progress: 100, 
      completedTasks: 8,
      totalTasks: 8,
      status: 'completed' as const,
      link: '/profile'
    },
    { 
      key: 'language', 
      name: 'Language Tests', 
      icon: ({ className }: { className?: string }) => <span className={className}>🗣️</span>,
      progress: 75, 
      completedTasks: 3,
      totalTasks: 4,
      status: 'in_progress' as const,
      nextAction: 'Schedule IELTS exam',
      link: '/profile'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-success">
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>
          <div className="relative container mx-auto px-6 py-12">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome Back! 🇩🇪</h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Your journey to studying in Germany continues. Track your progress and complete your next steps.
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="container mx-auto px-6 py-8 -mt-8 relative z-10">
          <div className="space-y-8">
            {/* Priority Actions */}
            <NextActionCard actions={nextActions} />
            
            {/* Module Progress Grid */}
            <ModuleProgressGrid modules={modules} />
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-soft border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Documents</h3>
                    <p className="text-sm text-muted-foreground">Upload & manage files</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-soft border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Applications</h3>
                    <p className="text-sm text-muted-foreground">Track university status</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-soft border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📞</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Support</h3>
                    <p className="text-sm text-muted-foreground">Get expert help</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;