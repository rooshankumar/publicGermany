import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { HelpCircle, Mail, FileText, BookOpen } from 'lucide-react';
import Layout from '@/components/Layout';

const Help: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 -mt-8">
        <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <HelpCircle className="h-7 w-7 text-primary" /> Help Center
            </h1>
            <p className="text-muted-foreground">Find answers to common questions and discover useful resources.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Getting Started
                </CardTitle>
                <CardDescription>Your first steps with publicgermany</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Create your profile and complete the checklist</li>
                  <li>Upload your documents for APS and universities</li>
                  <li>Track your applications and deadlines</li>
                </ul>
                <Button asChild variant="outline" className="mt-2">
                  <Link to="/resources">Browse Resources</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-success" /> Popular Topics
                </CardTitle>
                <CardDescription>Quick guides and references</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-2">
                  <li>APS certification basics</li>
                  <li>Shortlisting universities</li>
                  <li>Visa documentation checklists</li>
                </ul>
                <Button asChild variant="outline" className="mt-2">
                  <a href="#faq">Go to FAQ</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-warning" /> Still need help?
                </CardTitle>
                <CardDescription>We’re here to support you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Reach out to our team for personalized assistance.</p>
                <Button asChild className="w-full">
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Help;
