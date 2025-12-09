import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Send, Eye, User, Mail, Phone, Package, Trash2, Edit, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { generateContractHTML, generateContractReference, validateContractData, downloadContractPDF, generateContractPDFBlob } from '@/lib/contractGenerator';
import { sendEmail } from '@/lib/sendEmail';
import { getContractSignedUrl } from '@/lib/signedUrl';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

interface DraftContract {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  service_package: string;
  service_fee: string;
  contract_reference: string;
  contract_html: string;
  status: string;
  created_at: string;
  updated_at: string;
  sent_at?: string | null;
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
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [drafts, setDrafts] = useState<DraftContract[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [contractsHistory, setContractsHistory] = useState<DraftContract[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryContract, setSelectedHistoryContract] = useState<DraftContract | null>(null);
  const [showHistoryPreview, setShowHistoryPreview] = useState(false);
  const [editingDraft, setEditingDraft] = useState<DraftContract | null>(null);
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
    fetchDrafts();
    fetchContractsHistory();
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

  const fetchDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoadingDrafts(false);
    }
  };

  const fetchContractsHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContractsHistory(data || []);
    } catch (error) {
      console.error('Error fetching contract history:', error);
    } finally {
      setLoadingHistory(false);
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
    const ref = editingDraft?.contract_reference || generateContractReference();
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

  const handleDownloadPDF = async () => {
    if (generatedHTML) {
      setDownloading(true);
      try {
        await downloadContractPDF(generatedHTML, `Contract-${contractRef}.pdf`);
        toast({ title: 'Success', description: 'PDF downloaded successfully' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to download PDF', variant: 'destructive' });
      } finally {
        setDownloading(false);
      }
    }
  };

  const handleSaveContract = async () => {
    if (!selectedStudentId || !generatedHTML) return;

    try {
      if (editingDraft) {
        // Update existing draft
        const { error } = await supabase
          .from('contracts')
          .update({
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
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDraft.id);

        if (error) throw error;
        toast({ title: 'Updated', description: 'Draft updated successfully' });
      } else {
        // Create new draft
        const { error } = await supabase
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
      }
      
      fetchDrafts();
      setShowPreview(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving contract:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save contract', variant: 'destructive' });
    }
  };

  const handleSendContract = async () => {
    if (!studentEmail || !generatedHTML) return;

    setSending(true);
    try {
      // Generate PDF and save to storage
      let pdfStorageUrl = '';
      let contractId = editingDraft?.id;

      try {
        // Use standardized PDF generation that returns a Blob (keeps admin/student PDFs identical)
        const pdfBlob = await generateContractPDFBlob(generatedHTML);
        const fileName = `Contract-${contractRef}-${Date.now()}.pdf`;
        const filePath = `contracts/${selectedStudentId}/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('documents')
          .upload(filePath, pdfBlob, { upsert: false });

        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        pdfStorageUrl = publicUrl;
      } catch (pdfError) {
        console.warn('PDF generation failed', pdfError);
      }

      if (editingDraft) {
        // Update existing draft to sent
        const { error } = await supabase
          .from('contracts')
          .update({
            contract_html: generatedHTML,
            contract_pdf_url: pdfStorageUrl || null,
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', editingDraft.id);

        if (error) throw error;
        contractId = editingDraft.id;
      } else {
        // Create new contract as sent
        const { data, error } = await supabase
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
            contract_pdf_url: pdfStorageUrl || null,
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) throw error;
        contractId = data?.id;
      }

      // Create notification for student dashboard (using only valid schema fields)
      try {
        await supabase.from('notifications').insert({
          user_id: selectedStudentId,
          title: 'New Contract Received',
          type: 'contract',
          ref_id: contractId,
          meta: {
            contract_reference: contractRef,
            service_package: formData.servicePackage,
            service_fee: formData.serviceFee,
            message: `You have received a new service contract for ${formData.servicePackage}. Download, review, and upload the signed copy.`,
          },
        });
      } catch (noteErr) {
        console.warn('Notification insert failed:', noteErr);
      }

      // Generate signed URL for secure, time-limited PDF access
      let signedPdfUrl = pdfStorageUrl;
      if (pdfStorageUrl) {
        try {
          const fileName = pdfStorageUrl.split('/').pop() || `Contract-${contractRef}.pdf`;
          const signedUrl = await getContractSignedUrl(selectedStudentId, fileName, 604800); // 7 days
          if (signedUrl) signedPdfUrl = signedUrl;
        } catch (signedErr) {
          console.warn('Signed URL generation failed, using public URL:', signedErr);
        }
      }

      // Send email with download link
      const emailHtml = `
        <h2>Service Contract from publicgermany</h2>
        <p>Dear ${selectedStudent?.full_name || 'Student'},</p>
        ${sendMessage ? `<p>${sendMessage}</p>` : ''}
        <p>You have received a new service contract. Please review it carefully.</p>
        <p><strong>Contract Reference:</strong> ${contractRef}</p>
        <p>
          <strong>Next Steps:</strong>
          <ol>
            <li><a href="${signedPdfUrl || 'https://publicgermany.vercel.app/dashboard'}">Download and review the PDF contract</a></li>
            <li>Sign the contract</li>
            <li>Upload the signed copy back through your dashboard</li>
          </ol>
        </p>
        <p><a href="https://publicgermany.vercel.app/dashboard" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View on Dashboard</a></p>
        <p>If you have any questions, please reply to this email.</p>
        <p>Best regards,<br/>publicgermany Team</p>
      `;

      await sendEmail(
        studentEmail,
        `Service Contract - ${contractRef} | publicgermany`,
        emailHtml
      );

      toast({ title: 'Sent', description: 'Contract sent to student with download link' });
      setShowSendDialog(false);
      setShowPreview(false);
      fetchDrafts();
      fetchContractsHistory();
      resetForm();
    } catch (error: any) {
      console.error('Error sending contract:', error);
      toast({ title: 'Error', description: error.message || 'Failed to send contract', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleEditDraft = (draft: DraftContract) => {
    setEditingDraft(draft);
    setSelectedStudentId(draft.student_id);
    setStudentEmail(draft.student_email);
    setFormData({
      servicePackage: draft.service_package || '',
      serviceDescription: (draft as any).service_description || '',
      serviceFee: draft.service_fee || '',
      paymentStructure: (draft as any).payment_structure || '',
      startDate: (draft as any).start_date || '',
      expectedEndDate: (draft as any).expected_end_date || '',
    });
    setContractRef(draft.contract_reference);
    setGeneratedHTML(draft.contract_html);
    setActiveTab('create');
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      toast({ title: 'Deleted', description: 'Draft deleted successfully' });
      fetchDrafts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete draft', variant: 'destructive' });
    }
  };

  const handlePreviewDraft = (draft: DraftContract) => {
    setGeneratedHTML(draft.contract_html);
    setContractRef(draft.contract_reference);
    setEditingDraft(draft);
    setShowPreview(true);
  };

  const resetForm = () => {
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
    setEditingDraft(null);
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
          <h1 className="text-3xl font-bold text-foreground">Contracts</h1>
          <p className="text-muted-foreground">Create and manage service agreements</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">
              <FileText className="h-4 w-4 mr-2" />
              Create Contract
            </TabsTrigger>
            <TabsTrigger value="drafts">
              <Clock className="h-4 w-4 mr-2" />
              Contracts ({drafts.length + contractsHistory.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            {editingDraft && (
              <Card className="border-warning bg-warning/5">
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4 text-warning" />
                    <span className="text-sm">Editing draft: <strong>{editingDraft.contract_reference}</strong></span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Cancel Edit
                  </Button>
                </CardContent>
              </Card>
            )}

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
                    {generating ? 'Generating...' : editingDraft ? 'Update Contract' : 'Generate Contract'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4">
            {(loadingDrafts || loadingHistory) ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : drafts.length === 0 && contractsHistory.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No contracts yet</p>
                  <Button variant="link" onClick={() => setActiveTab('create')}>
                    Create a new contract
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Draft Contracts */}
                {drafts.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Edit className="h-5 w-5 text-amber-600" />
                      Draft Contracts ({drafts.length})
                    </h2>
                    {drafts.map((draft) => (
                      <Card key={draft.id} className="border-l-4 border-l-amber-500 bg-amber-50/30">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{draft.student_name}</h3>
                                <Badge className="bg-amber-100 text-amber-800 border-amber-300">Draft</Badge>
                                <Badge variant="outline">{draft.contract_reference}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {draft.service_package} • {draft.service_fee}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Created: {format(new Date(draft.created_at), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => handlePreviewDraft(draft)}>
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditDraft(draft)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteDraft(draft.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Sent/Successful Contracts */}
                {contractsHistory.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      Sent Contracts ({contractsHistory.length})
                    </h2>
                    {contractsHistory.map((c) => (
                      <Card key={c.id} className="border-l-4 border-l-green-500 bg-green-50/30">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{c.student_name}</h3>
                                <Badge className="bg-green-100 text-green-800 border-green-300">Sent</Badge>
                                <Badge variant="outline">{c.contract_reference}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {c.service_package} • {c.service_fee}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Created: {format(new Date(c.created_at), 'MMM d, yyyy h:mm a')}
                                {c.sent_at ? ` • Sent: ${format(new Date(c.sent_at), 'MMM d, yyyy')}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => { setSelectedHistoryContract(c); setShowHistoryPreview(true); }}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button variant="ghost" size="sm" onClick={async () => {
                                try {
                                  await downloadContractPDF(c.contract_html, `Contract-${c.contract_reference}.pdf`);
                                  toast({ title: 'Downloaded', description: 'PDF downloaded' });
                                } catch (e) {
                                  toast({ title: 'Error', description: 'Failed to download PDF', variant: 'destructive' });
                                }
                              }}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteDraft(c.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Contract Preview Dialog - Using new HTML template */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contract Preview</DialogTitle>
              <DialogDescription>
                Review the contract before saving or sending
              </DialogDescription>
            </DialogHeader>
            
            {/* Render the new HTML template directly */}
            <div 
              className="border rounded-lg overflow-hidden bg-white"
              dangerouslySetInnerHTML={{ __html: generatedHTML }}
            />

            <div className="flex flex-wrap gap-2 justify-end mt-4">
              <Button variant="outline" onClick={handleDownloadPDF} disabled={downloading}>
                {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
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
                Send the contract to {selectedStudent?.full_name || editingDraft?.student_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedStudent?.full_name || editingDraft?.student_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{studentEmail || editingDraft?.student_email}</span>
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

        {/* History Contract Preview Dialog */}
        <Dialog open={showHistoryPreview} onOpenChange={setShowHistoryPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contract: {selectedHistoryContract?.contract_reference}</DialogTitle>
            </DialogHeader>

            {selectedHistoryContract && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedHistoryContract.student_name}</span>
                  </div>
                  <Badge>
                    {selectedHistoryContract.status}
                  </Badge>
                  {selectedHistoryContract.sent_at && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Send className="h-3 w-3" />
                      Sent: {format(new Date(selectedHistoryContract.sent_at), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>

                <div 
                  className="border rounded-lg p-4 bg-white text-black"
                  dangerouslySetInnerHTML={{ __html: selectedHistoryContract.contract_html }}
                />

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={async () => {
                    try {
                      await downloadContractPDF(selectedHistoryContract.contract_html, `Contract-${selectedHistoryContract.contract_reference}.pdf`);
                      toast({ title: 'Downloaded', description: 'PDF downloaded' });
                    } catch (e) {
                      toast({ title: 'Error', description: 'Failed to download PDF', variant: 'destructive' });
                    }
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
