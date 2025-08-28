import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  FileText, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Users,
  BookOpen,
  MapPin,
  Shield,
  Globe,
  Calendar,
  Target,
  Star
} from 'lucide-react';

const Dashboard = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary via-primary to-success relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
          }}></div>
          
          <div className="relative container mx-auto px-6 py-16">
            <div className="max-w-4xl mx-auto text-center text-white">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <GraduationCap className="w-8 h-8" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Welcome to Your Journey
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8">
                Your path to studying in Germany starts here
              </p>
              <div className="flex items-center justify-center gap-4 text-white/80">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  <span>Goal-oriented</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>Trusted guidance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  <span>Proven success</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="container mx-auto px-6 py-12 -mt-8 relative z-10">
          {/* Progress Overview */}
          <Card className="mb-8 bg-gradient-to-r from-card to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CheckCircle className="w-6 h-6 text-success" />
                Your Progress
              </CardTitle>
              <CardDescription>
                Track your journey to studying in Germany
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">3</div>
                  <div className="text-sm text-muted-foreground">Steps Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-warning mb-2">5</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-success mb-2">68%</div>
                  <div className="text-sm text-muted-foreground">Overall Progress</div>
                </div>
              </div>
              <Progress value={68} className="h-3" />
            </CardContent>
          </Card>

          {/* Action Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Priority Actions */}
            <Card className="border-warning/30 bg-gradient-to-r from-warning/5 to-warning/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <Clock className="w-5 h-5" />
                  Priority Actions
                </CardTitle>
                <CardDescription>
                  Complete these tasks to stay on track
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">Complete APS Documents</div>
                      <div className="text-sm text-muted-foreground">Upload remaining certificates</div>
                    </div>
                  </div>
                  <Link to="/aps">
                    <Button size="sm">
                      Start
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium">University Applications</div>
                      <div className="text-sm text-muted-foreground">Submit 3 pending applications</div>
                    </div>
                  </div>
                  <Link to="/applications">
                    <Button size="sm">
                      Continue
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-success" />
                  Your Journey Stats
                </CardTitle>
                <CardDescription>
                  Key metrics and milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <div className="text-2xl font-bold text-success mb-1">5</div>
                    <div className="text-xs text-muted-foreground">Universities Selected</div>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">85%</div>
                    <div className="text-xs text-muted-foreground">Profile Complete</div>
                  </div>
                  <div className="text-center p-4 bg-warning/10 rounded-lg">
                    <div className="text-2xl font-bold text-warning mb-1">12</div>
                    <div className="text-xs text-muted-foreground">Documents Ready</div>
                  </div>
                  <div className="text-center p-4 bg-accent rounded-lg">
                    <div className="text-2xl font-bold text-foreground mb-1">45</div>
                    <div className="text-xs text-muted-foreground">Days to Deadline</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* APS Module */}
            <Card className="card-hover border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">APS Verification</CardTitle>
                      <CardDescription>Academic credentials</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                    In Progress
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress value={65} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">4 of 6 documents</span>
                    <span className="text-primary font-medium">65%</span>
                  </div>
                  <Link to="/aps" className="block">
                    <Button className="w-full">
                      Continue Setup
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* University Applications */}
            <Card className="card-hover border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Universities</CardTitle>
                      <CardDescription>Application tracking</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Applications</span>
                    <span className="text-sm font-medium">3 submitted, 2 pending</span>
                  </div>
                  <Link to="/applications" className="block">
                    <Button className="w-full" variant="outline">
                      Manage Applications
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Profile Setup */}
            <Card className="card-hover border-success/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Profile</CardTitle>
                      <CardDescription>Personal information</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                    Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress value={100} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">All sections done</span>
                    <span className="text-success font-medium">100%</span>
                  </div>
                  <Link to="/profile" className="block">
                    <Button className="w-full" variant="outline">
                      View Profile
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Language Tests */}
            <Card className="card-hover border-warning/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Language Tests</CardTitle>
                      <CardDescription>IELTS/TOEFL preparation</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress value={75} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Exam scheduled</span>
                    <span className="text-warning font-medium">75%</span>
                  </div>
                  <Button className="w-full" variant="outline">
                    Prepare Test
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card className="card-hover border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Expert Services</CardTitle>
                      <CardDescription>Professional guidance</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-accent text-foreground border-border">
                    Available
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Get personalized help from our experts
                  </div>
                  <Link to="/services" className="block">
                    <Button className="w-full">
                      Browse Services
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card className="card-hover border-accent/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-accent/50 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Resources</CardTitle>
                      <CardDescription>Guides and materials</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-accent text-foreground border-border">
                    Updated
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Latest guides, forms, and helpful materials
                  </div>
                  <Link to="/resources" className="block">
                    <Button className="w-full" variant="outline">
                      View Resources
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-12 bg-gradient-to-r from-primary/5 to-success/5 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Ready to Take the Next Step?</h2>
              <p className="text-muted-foreground">Get personalized guidance from our Germany education experts</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="w-full sm:w-auto">
                  <Calendar className="mr-2 w-5 h-5" />
                  Book Consultation
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Star className="mr-2 w-5 h-5" />
                  View All Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;