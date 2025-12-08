import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Send, Eye, User, Mail, Phone, Calendar, DollarSign, Package } from 'lucide-react';
import { format } from 'date-fns';
import ContractTemplate from '@/components/ContractTemplate';
import { generateContractHTML, generateContractReference, validateContractData, downloadContractPDF } from '@/lib/contractGenerator';
import { sendEmail } from '@/lib/sendEmail';

interface Student {
  user_id: string;
  full_name: string | null;
  email?: string;
}

interface ServiceRequest {
  id: string;
  service_type: string;
  service_price: number | null;
  service_currency: string | null;
  request_details: string | null;
  preferred_timeline: string | null;
  target_total_amount: number | null;
}

export default function Contracts() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendMessage, setSendMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Form fields
  const [formData, setFormData] = useState({
    servicePackage: '',
    serviceDescription: '',
    serviceFee: '',
    paymentStructure: '',
    startDate: '',
    expectedEndDate: '',
  });

  const [contractRef, setContractRef] = useState('');
  const [contractDate, setContractDate] = useState(format(new Date(), 'MMMM d, yyyy'));
  const [generatedHTML, setGeneratedHTML] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentEmail(selectedStudentId);
      fetchServiceRequests(selectedStudentId);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    if (selectedServiceId && serviceRequests.length > 0) {
      const sr = serviceRequests.find(s => s.id === selectedServiceId);
      if (sr) {
        setFormData(prev => ({
          ...prev,
          servicePackage: sr.service_type || '',
          serviceDescription: sr.request_details || '',
          serviceFee: sr.target_total_amount 
            ? `₹${sr.target_total_amount.toLocaleString()}`
            : sr.service_price 
              ? `${sr.service_currency || '₹'}${sr.service_price.toLocaleString()}`
              : '',
        }));
      }
    }
  }, [selectedServiceId, serviceRequests]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('role', 'student')
        .order('full_name');
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({ title: 'Error', description: 'Failed to load students', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentEmail = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any).rpc('get_user_email', { p_user_id: userId });
      if (!error && data) {
        setStudentEmail(data);
      }
    } catch (error) {
      console.error('Error fetching email:', error);
    }
  };

  const fetchServiceRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('id, service_type, service_price, service_currency, request_details, preferred_timeline, target_total_amount')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setServiceRequests(data || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    }
  };

  const selectedStudent = students.find(s => s.user_id === selectedStudentId);

  const handleGenerateContract = () => {
    const validation = validateContractData({
      studentName: selectedStudent?.full_name || '',
      studentEmail,
      servicePackage: formData.servicePackage,
      serviceFee: formData.serviceFee,
    });

    if (!validation.valid) {
      toast({ title: 'Error', description: validation.error, variant: 'destructive' });
      return;
    }

    setGenerating(true);
    const ref = generateContractReference();
    setContractRef(ref);
    
    const html = generateContractHTML({
      studentName: selectedStudent?.full_name || '',
      studentEmail,
      studentPhone,
      servicePackage: formData.servicePackage,
      serviceDescription: formData.serviceDescription,
      serviceFee: formData.serviceFee,
      paymentStructure: formData.paymentStructure,
      startDate: formData.startDate,
      expectedEndDate: formData.expectedEndDate,
      contractReference: ref,
      contractDate,
    });
    
    setGeneratedHTML(html);
    setShowPreview(true);
    setGenerating(false);
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (generatedHTML) {
      setDownloading(true);
      try {
        await downloadContractPDF(generatedHTML, `Contract-${contractRef}.pdf`);
      } finally {
        setDownloading(false);
      }
    }
  };

  const handleSaveContract = async () => {
    if (!selectedStudentId || !generatedHTML) return;

    try {
      const { error } = await (supabase as any)
        .from('contracts')
        .insert({
          student_id: selectedStudentId,
          service_request_id: selectedServiceId || null,
          contract_reference: contractRef,
          student_name: selectedStudent?.full_name || '',
          student_email: studentEmail,
          student_phone: studentPhone || null,
          service_package: formData.servicePackage,
          service_description: formData.serviceDescription || null,
          service_fee: formData.serviceFee,
          payment_structure: formData.paymentStructure || null,
          start_date: formData.startDate || null,
          expected_end_date: formData.expectedEndDate || null,
          contract_html: generatedHTML,
          status: 'draft',
        });

      if (error) throw error;
      toast({ title: 'Saved', description: 'Contract saved as draft' });
    } catch (error: any) {
      console.error('Error saving contract:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save contract', variant: 'destructive' });
    }
  };

  const handleSendContract = async () => {
    if (!studentEmail || !generatedHTML) return;

    setSending(true);
    try {
      // Save contract first
      const { data: contractData, error: saveError } = await (supabase as any)
        .from('contracts')
        .insert({
          student_id: selectedStudentId,
          service_request_id: selectedServiceId || null,
          contract_reference: contractRef,
          student_name: selectedStudent?.full_name || '',
          student_email: studentEmail,
          student_phone: studentPhone || null,
          service_package: formData.servicePackage,
          service_description: formData.serviceDescription || null,
          service_fee: formData.serviceFee,
          payment_structure: formData.paymentStructure || null,
          start_date: formData.startDate || null,
          expected_end_date: formData.expectedEndDate || null,
          contract_html: generatedHTML,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Send email
      const emailHtml = `
        <h2>Service Contract from publicgermany</h2>
        <p>Dear ${selectedStudent?.full_name || 'Student'},</p>
        ${sendMessage ? `<p>${sendMessage}</p>` : ''}
        <p>Please find your service contract attached below. Review the terms and conditions carefully.</p>
        <p>Contract Reference: <strong>${contractRef}</strong></p>
        <hr style="margin: 20px 0;" />
        ${generatedHTML}
        <hr style="margin: 20px 0;" />
        <p>If you have any questions, please reply to this email.</p>
        <p>Best regards,<br/>publicgermany Team</p>
      `;

      await sendEmail(
        studentEmail,
        `Service Contract - ${contractRef} | publicgermany`,
        emailHtml
      );

      toast({ title: 'Sent', description: 'Contract sent to student successfully' });
      setShowSendDialog(false);
      setShowPreview(false);
      
      // Reset form
      setSelectedStudentId('');
      setSelectedServiceId('');
      setStudentEmail('');
      setStudentPhone('');
      setFormData({
        servicePackage: '',
        serviceDescription: '',
        serviceFee: '',
        paymentStructure: '',
        startDate: '',
        expectedEndDate: '',
      });
      setGeneratedHTML('');
    } catch (error: any) {
      console.error('Error sending contract:', error);
      toast({ title: 'Error', description: error.message || 'Failed to send contract', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Generate Contract</h1>
          <p className="text-muted-foreground">Create personalized service agreements for students</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Student
            </CardTitle>
            <CardDescription>Choose a student to generate a contract for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.user_id} value={student.user_id}>
                        {student.full_name || 'Unnamed Student'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStudentId && serviceRequests.length > 0 && (
                <div className="space-y-2">
                  <Label>Service Request (Optional)</Label>
                  <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-fill from request" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceRequests.map(sr => (
                        <SelectItem key={sr.id} value={sr.id}>
                          {sr.service_type} - {sr.service_currency || '₹'}{sr.service_price?.toLocaleString() || 'N/A'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {selectedStudentId && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{selectedStudent?.full_name || 'Not available'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{studentEmail || 'Fetching...'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <Input 
                    placeholder="Enter phone (optional)"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    className="h-8 w-48"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedStudentId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Service Details
              </CardTitle>
              <CardDescription>Enter or modify the service package details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service Package *</Label>
                  <Input 
                    placeholder="e.g., Admission Package"
                    value={formData.servicePackage}
                    onChange={(e) => setFormData(prev => ({ ...prev, servicePackage: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Service Fee *</Label>
                  <Input 
                    placeholder="e.g., ₹25,000"
                    value={formData.serviceFee}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceFee: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Service Description</Label>
                <Textarea 
                  placeholder="Describe the services included..."
                  value={formData.serviceDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceDescription: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Structure</Label>
                <Input 
                  placeholder="e.g., 50% Advance, 50% on Admission"
                  value={formData.paymentStructure}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentStructure: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected End Date</Label>
                  <Input 
                    type="date"
                    value={formData.expectedEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedEndDate: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleGenerateContract} 
                disabled={generating || !formData.servicePackage || !formData.serviceFee}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                {generating ? 'Generating...' : 'Generate Contract'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Contract Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contract Preview</DialogTitle>
              <DialogDescription>
                Review the contract before saving or sending
              </DialogDescription>
            </DialogHeader>
            
            <div className="border rounded-lg overflow-hidden">
              <ContractTemplate
                studentName={selectedStudent?.full_name || ''}
                studentEmail={studentEmail}
                studentPhone={studentPhone}
                servicePackage={formData.servicePackage}
                serviceDescription={formData.serviceDescription}
                serviceFee={formData.serviceFee}
                paymentStructure={formData.paymentStructure}
                startDate={formData.startDate ? format(new Date(formData.startDate), 'MMMM d, yyyy') : undefined}
                expectedEndDate={formData.expectedEndDate ? format(new Date(formData.expectedEndDate), 'MMMM d, yyyy') : undefined}
                contractReference={contractRef}
                contractDate={contractDate}
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-end mt-4">
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={handleSaveContract}>
                Save as Draft
              </Button>
              <Button onClick={() => setShowSendDialog(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send to Student
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Contract Dialog */}
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Contract</DialogTitle>
              <DialogDescription>
                Send the contract to {selectedStudent?.full_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedStudent?.full_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{studentEmail}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Message (Optional)</Label>
                <Textarea
                  placeholder="Add a personal message..."
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowSendDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendContract} disabled={sending}>
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Contract'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
