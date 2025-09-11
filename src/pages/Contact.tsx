import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle,
  Send,
  CheckCircle,
  AlertCircle,
  Globe,
  Users
} from 'lucide-react';
import { ContactForm } from '@/components/ContactForm';

const Contact = () => {
  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      value: 'help@publicgermany.vercel.app',
      description: 'Send us an email for detailed inquiries',
      href: 'mailto:help@publicgermany.vercel.app'
    },
    {
      icon: Phone,
      title: 'Call Us',
      value: '+49 123 456 7890',
      description: 'Available Monday to Friday, 9 AM - 6 PM CET',
      href: 'tel:+491234567890'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: '+49 123 456 7890',
      description: 'Quick support via WhatsApp',
      href: 'https://wa.me/491234567890'
    },
    {
      icon: MapPin,
      title: 'Office Address',
      value: 'Berlin, Germany',
      description: 'Visit us for in-person consultations',
      href: null
    }
  ];

  const faqItems = [
    {
      question: 'How long does the APS process take?',
      answer: 'The APS process typically takes 3-6 months from application to interview and certificate issuance.'
    },
    {
      question: 'What are the university application deadlines?',
      answer: 'Most German universities have deadlines in July for winter semester and January for summer semester.'
    },
    {
      question: 'Do I need German language proficiency?',
      answer: 'It depends on your program. Many international programs are taught in English, but German proficiency can be beneficial.'
    },
    {
      question: 'What are the costs involved?',
      answer: 'Costs include APS fees (€175), visa fees (€75), and our service charges which vary by service package.'
    }
  ];

  const serviceHours = [
    { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM CET' },
    { day: 'Saturday', hours: '10:00 AM - 4:00 PM CET' },
    { day: 'Sunday', hours: 'Emergency support only' }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Get in Touch</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions about your Germany study journey? We're here to help you every step of the way.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <Button 
                      size="sm" 
                      variant="outline" 
                      asChild
                      className="w-full"
                    >
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Service Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Service Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {serviceHours.map((schedule) => (
                  <div key={schedule.day} className="flex justify-between items-center">
                    <span className="font-medium">{schedule.day}</span>
                    <span className="text-sm text-muted-foreground">{schedule.hours}</span>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm text-primary">
                    <CheckCircle className="inline h-4 w-4 mr-1" />
                    Response within 24 hours guaranteed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Our Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <div className="text-2xl font-bold text-success">1000+</div>
                  <div className="text-sm text-muted-foreground">Students Guided</div>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center p-4 bg-warning/10 rounded-lg">
                  <div className="text-2xl font-bold text-warning">15+</div>
                  <div className="text-sm text-muted-foreground">Years Experience</div>
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Languages Supported
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>English</Badge>
                  <Badge>German</Badge>
                  <Badge>Hindi</Badge>
                  <Badge>Chinese</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Quick answers to common questions about studying in Germany
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqItems.map((faq, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-semibold text-foreground">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="h-8 w-8 text-warning" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Need Urgent Help?</h3>
              <p className="text-sm text-muted-foreground">
                For urgent matters outside business hours, contact us on WhatsApp
              </p>
            </div>
            <Button asChild>
              <a href="https://wa.me/491234567890" target="_blank" rel="noopener noreferrer">
                WhatsApp Now
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;