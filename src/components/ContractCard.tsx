import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { useState, useRef } from 'react';
import { format } from 'date-fns';

interface ContractCardProps {
  contract: {
    id: string;
    contract_reference: string;
    service_package: string;
    service_fee: string;
    status: string;
    sent_at: string;
    created_at: string;
    contract_html: string;
    contract_pdf_url?: string;
    student_id?: string;
  };
  onStatusChange?: () => void;
  userId?: string;
}

export function ContractCard({ contract, onStatusChange, userId }: ContractCardProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'pending_approval':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Pending Approval</Badge>;
      case 'signed':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      
      // If PDF URL is stored, download directly from storage
      if (contract.contract_pdf_url) {
        const link = document.createElement('a');
        link.href = contract.contract_pdf_url;
        link.download = `Contract-${contract.contract_reference}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Downloaded', description: 'Contract PDF downloaded successfully' });
        return;
      }

      // Fallback: Generate PDF from HTML if URL not available
      let html2canvas: any;
      let jsPDFLib: any;
      try {
        html2canvas = (await import('html2canvas')).default;
        jsPDFLib = (await import('jspdf')).jsPDF || (await import('jspdf')).default;
      } catch (impErr) {
        console.error('Failed to load PDF libraries:', impErr);
        throw new Error('Failed to load PDF libraries. This can happen if a module chunk returned HTML (MIME error) on the server.');
      }

      const div = document.createElement('div');
      div.innerHTML = contract.contract_html;
      div.style.position = 'absolute';
      div.style.left = '-9999px';
      div.style.top = '-9999px';
      div.style.width = '1000px';
      div.style.backgroundColor = '#ffffff';
      document.body.appendChild(div);

      // Wait for images to load before capturing
      const images = div.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        return new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        });
      });
      await Promise.all(imagePromises);

      const canvas = await html2canvas(div, { 
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      document.body.removeChild(div);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Convert canvas to JPEG instead of PNG to avoid signature issues
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (!imgData || (!imgData.startsWith('data:image/jpeg') && !imgData.startsWith('data:image/png'))) {
        throw new Error('Invalid canvas image data. Possibly an HTML error page was loaded instead of an image.');
      }

      try {
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
      } catch (addErr) {
        console.error('jsPDF addImage failed:', addErr, 'imgData startsWith:', imgData?.slice?.(0,50));
        throw addErr;
      }
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Contract-${contract.contract_reference}.pdf`);
      toast({ title: 'Downloaded', description: 'Contract PDF downloaded successfully' });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({ title: 'Error', description: 'Failed to download contract PDF', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const handleUploadSigned = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const path = `signed-contracts/${userId}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(path, file, { upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(path);

      // Update contract status to signed
      const { error: updateErr } = await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signed_document_url: publicUrl,
          signed_at: new Date().toISOString(),
        })
        .eq('id', contract.id);

      if (updateErr) throw updateErr;

      // Also create a notification for admin
      try {
        const { error: noteErr } = await supabase.from('notifications').insert({
          user_id: contract.student_id,
          title: 'Contract Signed',
          body: `Student has signed and uploaded contract ${contract.contract_reference}. Please review and approve.`,
          type: 'contract',
          ref_id: contract.id,
          recipient_role: 'admin',
        });

        if (noteErr) console.warn('Notification insert error:', noteErr);
      } catch (noteEx) {
        console.warn('Notification insert failed', noteEx);
      }

      toast({ title: 'Uploaded', description: 'Signed contract uploaded successfully. Awaiting admin approval.' });
      onStatusChange?.();
    } catch (error: any) {
      console.error('Error uploading contract:', error);
      toast({ title: 'Error', description: error.message || 'Failed to upload contract', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const statusIcon = {
    'sent': <Clock className="h-5 w-5 text-amber-600" />,
    'pending_approval': <Clock className="h-5 w-5 text-amber-600" />,
    'signed': <AlertCircle className="h-5 w-5 text-blue-600" />,
    'completed': <CheckCircle2 className="h-5 w-5 text-green-600" />,
    'rejected': <AlertCircle className="h-5 w-5 text-red-600" />,
  };

  return (
    <Card className="border-l-4 border-l-amber-500 bg-amber-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">{contract.service_package}</CardTitle>
              <CardDescription>{contract.service_fee}</CardDescription>
            </div>
          </div>
          {getStatusBadge(contract.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contract Reference:</span>
            <span className="font-mono font-semibold">{contract.contract_reference}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sent on:</span>
            <span>{format(new Date(contract.sent_at), 'MMM d, yyyy')}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Download Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </Button>

          {/* Upload Button - Only show if status is sent or pending_approval */}
          {(contract.status === 'sent' || contract.status === 'pending_approval') && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleUploadSigned}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Signed'}
              </Button>
            </>
          )}

          {/* Status Info */}
          {(contract.status === 'signed' || contract.status === 'pending_approval') && (
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>Waiting for admin approval</span>
            </div>
          )}

          {contract.status === 'completed' && (
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>Contract approved</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
