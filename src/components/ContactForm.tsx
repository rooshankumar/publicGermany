import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import emailjs from '@emailjs/browser';

export const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inquiry_type: '',
    message: ''
  });
  const { toast } = useToast();

  // EmailJS configuration via Vite env vars
  const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
  const EMAILJS_ADMIN_TEMPLATE_ID = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string) || 'template_1rr96tj';
  const EMAILJS_USER_TEMPLATE_ID = (import.meta.env.VITE_EMAILJS_USER_TEMPLATE_ID as string) || 'template_e2zjahq';
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;
  const ADMIN_EMAIL = (import.meta.env.VITE_CONTACT_ADMIN_EMAIL as string) || 'publicgermany@outlook.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validate required fields
      if (!formData.inquiry_type) {
        toast({
          title: "Inquiry type required",
          description: "Please select an inquiry type before sending.",
        });
        setIsSubmitting(false);
        return;
      }

      // Generate a subject automatically based on inquiry type
      const prettyInquiry = formData.inquiry_type
        ? formData.inquiry_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'General Inquiry';
      const generatedSubject = `${prettyInquiry} - Message from ${formData.name}`;

      // Send two emails via EmailJS using separate templates: admin + user receipt
      const timestamp = new Date().toLocaleString();

      const adminParams = {
        to_email: ADMIN_EMAIL,
        from_name: formData.name,
        from_email: formData.email,
        reply_to: formData.email,
        subject: generatedSubject,
        inquiry_type: formData.inquiry_type,
        message: formData.message,
        timestamp,
      };

      const userParams = {
        to_email: formData.email,
        from_name: 'PublicGermany Team',
        from_email: formData.email,
        reply_to: ADMIN_EMAIL,
        subject: generatedSubject,
        inquiry_type: formData.inquiry_type,
        message: formData.message,
        timestamp,
      };

      await Promise.allSettled([
        emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_ADMIN_TEMPLATE_ID,
          adminParams,
          { publicKey: EMAILJS_PUBLIC_KEY }
        ),
        emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_USER_TEMPLATE_ID,
          userParams,
          { publicKey: EMAILJS_PUBLIC_KEY }
        )
      ]);

      const { error } = await supabase
        .from('contact_submissions')
        .insert([{ ...formData, subject: generatedSubject }]);

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We've received your message and sent a confirmation email. We'll get back to you within 24 hours.",
      });

      setFormData({
        name: '',
        email: '',
        inquiry_type: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid gap-8">
      <Card className="glass-card border-border/30 shadow-glass">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Send us a message</CardTitle>
          <CardDescription>
            Have questions about studying in Germany? We're here to help.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  maxLength={255}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inquiry_type">Inquiry Type<span className="text-destructive">*</span></Label>
              <Select value={formData.inquiry_type} onValueChange={(value) => handleInputChange('inquiry_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select inquiry type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aps_guidance">APS Guidance</SelectItem>
                  <SelectItem value="university_selection">University Selection</SelectItem>
                  <SelectItem value="visa_process">Visa Process</SelectItem>
                  <SelectItem value="document_review">Document Review</SelectItem>
                  <SelectItem value="general_inquiry">General Inquiry</SelectItem>
                  <SelectItem value="technical_support">Technical Support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
              <Textarea
                id="message"
                rows={5}
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Tell us how we can help you..."
                maxLength={2000}
                required
              />
              <p className="text-xs text-muted-foreground text-right">{formData.message.length}/2000</p>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">We'll email you a copy of your message.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
