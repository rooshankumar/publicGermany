import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ContactForm } from '@/components/ContactForm';

const Contact = () => {
  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      value: 'roshlingua@gmail.com',
      description: 'Send us an email for detailed inquiries',
      href: 'mailto:roshlingua@gmail.com',
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        {/* Back to Home */}
        <div>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Get in Touch</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Have questions about your Germany study journey? We're here to help you every step of the way.
          </p>
        </div>

        {/* Email Contact Card */}
        <div className="max-w-md mx-auto">
          {contactInfo.map((info) => {
            const Icon = info.icon;
            return (
              <Card key={info.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{info.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="font-semibold text-foreground mb-2">{info.value}</p>
                  <p className="text-sm text-muted-foreground mb-4">{info.description}</p>
                  {info.href && (
                    <Button size="sm" variant="outline" asChild className="w-full">
                      <a href={info.href} target="_blank" rel="noopener noreferrer">
                        Contact Now
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Form */}
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send us a Message
              </CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Contact;
