import React, { useEffect, useRef, useState, DragEvent } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, Upload, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { sendEmail } from '@/lib/sendEmail';

export const DOCUMENTS = [
  { key: 'passport_copy', label: '📄 Passport Copy', maxFiles: 1 },
  { key: 'admission_letter', label: '📄 Admission Letter', maxFiles: 1 },
  { key: 'aps_certificate', label: '📄 APS Certificate', maxFiles: 2 },
  { key: 'health_insurance', label: '📄 Proof of Health Insurance', maxFiles: 2 },
  { key: 'academic_transcripts', label: '📄 Academic Transcripts / Marksheets', maxFiles: 10 },
  { key: 'degree_certificate', label: '📄 Degree Certificate', maxFiles: 2 },
  { key: 'language_certificates', label: '📄 Language Certificates (IELTS/Goethe, etc.)', maxFiles: 2 },
  { key: 'motivation_letter', label: '📄 Motivation Letter / SOP (LOM)', maxFiles: 2 },
  { key: 'cv', label: '📄 CV / Resume', maxFiles: 1 },
  { key: 'recommendation_letter', label: '📄 Recommendation Letter(s) (LOR)', maxFiles: 1 },
  { key: 'financial_proof', label: '📄 Financial Proof / Blocked Account', maxFiles: 3 },
  { key: 'class_x', label: '📄 Copy of Class X Marksheet and Certificate', maxFiles: 2 },
  { key: 'class_xii', label: '📄 Copy of Class XII Marksheet and Certificate', maxFiles: 2 },
  { key: 'all_sem_marksheets', label: '📄 Copy of Marksheets of all semesters (Bachelor/Master, if applicable)', maxFiles: 10 },
  { key: 'bachelor_degree', label: '📄 Copy of Bachelor’s Degree and Transcript', maxFiles: 2 },
  { key: 'master_degree', label: '📄 Copy of Master’s Degree and Transcripts (if applicable)', maxFiles: 2 },
];

// Map document keys to standardized base filenames used when storing files.
const CATEGORY_BASE_FILENAME: Record<string, string> = {
  passport_copy: 'Passport',
  admission_letter: 'Admission Letter',
  aps_certificate: 'APS Certificate',
  health_insurance: 'Proof of Health Insurance',
  academic_transcripts: 'Academic Transcripts',
  degree_certificate: 'Degree Certificate',
  language_certificates: 'Language Certificates',
  motivation_letter: 'Motivation Letter',
  cv: 'CV',
  recommendation_letter: 'Recommendation Letter',
  financial_proof: 'Financial Proof',
  class_x: 'Class X marksheets and certificate',
  class_xii: 'Class XII marksheets and certificate',
  all_sem_marksheets: 'All Semester Marksheets',
  bachelor_degree: 'Bachelor Degree and Transcript',
  master_degree: "Master's Degree and Transcripts",
};

interface DocumentMeta {
  id: string;
  category: string;
  file_url: string;
  file_name: string;
  upload_path?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface APSProps {
  displayName?: string;
}

function APSRequiredDocuments({ displayName }: APSProps) {
  const { profile } = useAuth();
  const [docs, setDocs] = useState<Record<string, DocumentMeta | null>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  
  // Helper to render a consistent, brand-styled status pill
  const renderStatusPill = (status?: string) => {
    const s = ((status || 'pending') as 'pending' | 'approved' | 'rejected');
    const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border';
    const classes =
      s === 'approved'
        ? 'bg-pg-success/10 text-pg-success border-pg-success/30'
        : s === 'rejected'
        ? 'bg-pg-error/10 text-pg-error border-pg-error/30'
        : 'bg-pg-gold/10 text-pg-gold border-pg-gold/30';
    const label = s.charAt(0).toUpperCase() + s.slice(1);
    return <span className={`${base} ${classes}`}>{label}</span>;
  };

  const fetchDocs = async () => {
    if (!profile?.user_id) return;
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, category, file_url, file_name, upload_path, status, admin_notes')
        .eq('user_id', profile.user_id);
      
      if (error) throw error;
      
      // Initialize docMap with all document keys set to null first
      const docMap: Record<string, DocumentMeta | null> = {};
      DOCUMENTS.forEach(doc => {
        docMap[doc.key] = null; // Initialize all to null first
      });
      
      // Then update with any existing documents
      if (data && data.length > 0) {
        data.forEach((doc: any) => {
          if (doc.category in docMap) {
            docMap[doc.category] = doc;
          }
        });
      }
      
      setDocs(docMap);
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Initialize with null values if there's an error
      const docMap: Record<string, null> = {};
      DOCUMENTS.forEach(doc => {
        docMap[doc.key] = null;
      });
      setDocs(docMap);
    }
  };

  useEffect(() => {
    fetchDocs();
    // Realtime subscription to reflect admin status updates immediately
    if (!profile?.user_id) return;
    const channel = supabase
      .channel(`docs-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${profile.user_id}` }, () => fetchDocs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.user_id]);

  const handleUpload = async (key: string, file: File) => {
    if (!profile?.user_id) {
      alert('User not authenticated');
      return;
    }
    
    setLoading(key);
    
    try {
      // Generate a standardized stored file name based on category + original extension
      const originalExt = (() => {
        const dot = file.name.lastIndexOf('.');
        return dot >= 0 ? file.name.slice(dot) : '';
      })();
      const base = CATEGORY_BASE_FILENAME[key] || key;
      // Get user's first name from profile
      const firstName = profile?.full_name?.split(' ')[0] || 'user';
      const safeBaseName = base.replace(/[^a-zA-Z0-9-_ ()]/g, '_');
      // Format: firstname_documentname.ext (e.g., "roshan_Passport.pdf")
      const storedFileName = `${firstName}_${safeBaseName}${originalExt || ''}`;
      const fileName = `${Date.now()}-${storedFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${profile.user_id}/${key}/${fileName}`;
      
      // Upload the file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '3600',
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload file to storage');
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      if (!publicUrl) {
        throw new Error('Failed to generate public URL');
      }
      
      // Upsert document metadata in the database
      const { data, error: dbError } = await supabase
        .from('documents')
        .upsert({
          user_id: profile.user_id,
          category: key,
          file_url: publicUrl,
          file_name: storedFileName,
          file_size: file.size,
          file_type: file.type,
          upload_path: filePath,
          updated_at: new Date().toISOString(),
          // Reset status to pending on new upload so admin can review again
          status: 'pending',
        })
        .select()
        .single();
      
      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save document metadata');
      }
      
      // Refresh the documents list
      await fetchDocs();

      // Fire-and-forget: email confirmation to the user
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const to = user?.email;
        if (to) {
          const label = (DOCUMENTS.find(d => d.key === key)?.label || key).replace('📄 ', '');
          await sendEmail(
            to,
            'We received your document',
            `<p>Hi ${profile?.full_name || ''},</p>
             <p>Your document <strong>${label}</strong> was uploaded successfully and is now <strong>pending</strong> review.</p>
             <p>We will notify you once it is approved or if any changes are required.</p>
             <p>— publicGermany Team</p>`
          );
        }
      } catch (_) {/* ignore email errors */}
      
    } catch (error) {
      console.error('Error in handleUpload:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (key: string) => {
    if (!profile?.user_id || !docs[key]) {
      alert('User not authenticated or document not found');
      return;
    }
    
    // Confirm before deletion
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }
    
    setLoading(key);
    
    try {
      const doc = docs[key]!;
      
      // Remove from storage if upload_path exists
      if (doc.upload_path) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([doc.upload_path]);
          
        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }
      
      // Remove from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);
        
      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw new Error('Failed to remove document from database');
      }
      
      // Update local state immediately for better UX
      setDocs(prev => ({
        ...prev,
        [key]: null
      }));
      
      // Refresh the documents list
      await fetchDocs();
      
    } catch (error) {
      console.error('Error in handleDelete:', error);
      alert(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-16 md:pb-0">
      <div className="bg-card rounded-lg shadow-sm p-3 md:p-6 border border-border">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Document Upload</h2>

        {/* Desktop/Tablet: existing list */}
        <div className="hidden md:flex flex-col gap-3">
          {DOCUMENTS.map(doc => (
            <div key={doc.key} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-2 rounded-lg border bg-background">
              <div className="w-full md:w-1/3 flex flex-col items-start md:items-center text-sm md:text-base font-medium text-foreground">
                <span>{doc.label}</span>
                <span className="text-xs text-muted-foreground mt-1">Accepted: PDF, DOC, DOCX, Images • Max {doc.maxFiles} file{doc.maxFiles > 1 ? 's' : ''}</span>
              </div>
              <div className="w-full md:w-2/3 flex flex-col gap-1">
                {docs[doc.key] ? (
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-success h-5 w-5" />
                      <span className="truncate max-w-[180px] text-sm font-medium">{docs[doc.key]!.file_name}</span>
                      <span className="ml-1">{renderStatusPill((docs[doc.key] as any)?.status)}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <Button size="sm" variant="outline" className="px-2"
                        onClick={async () => {
                          try {
                            const pathOrUrl = docs[doc.key]!.upload_path || docs[doc.key]!.file_url;
                            const { data } = await supabase.storage.from('documents').createSignedUrl(pathOrUrl, 60);
                            if (data?.signedUrl) window.open(data.signedUrl, '_blank'); else window.open(docs[doc.key]!.file_url, '_blank');
                          } catch (error) { window.open(docs[doc.key]!.file_url, '_blank'); }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="px-2"
                        onClick={async () => {
                          try {
                            const pathOrUrl = docs[doc.key]!.upload_path || docs[doc.key]!.file_url;
                            const desiredName = docs[doc.key]!.file_name || 'document';
                            const { data } = await supabase.storage.from('documents').createSignedUrl(pathOrUrl, 60, { download: desiredName });
                            const url = data?.signedUrl || docs[doc.key]!.file_url;
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = desiredName;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                          } catch (_) {
                            // fallback open
                            window.open(docs[doc.key]!.file_url, '_blank');
                          }
                        }}
                      >
                        Download
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(doc.key)} disabled={loading === doc.key} className="px-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <DocumentDropZone docKey={doc.key} onFileSelect={file => setSelectedFiles(prev => ({ ...prev, [doc.key]: file }))}
                    onUpload={() => { if (selectedFiles[doc.key]) { handleUpload(doc.key, selectedFiles[doc.key]!); setSelectedFiles(prev => ({ ...prev, [doc.key]: null })); } }}
                    selectedFile={selectedFiles[doc.key]} loading={loading === doc.key} maxFiles={doc.maxFiles}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Accordion */}
        <div className="md:hidden pb-24">
          <Accordion type="single" collapsible className="w-full">
            {DOCUMENTS.map(doc => (
              <AccordionItem key={doc.key} value={doc.key}>
                <AccordionTrigger className="text-left px-3">
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="font-medium text-sm text-foreground leading-tight break-words" style={{maxWidth:'75%'}}>{doc.label}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            {docs[doc.key] ? (
                              renderStatusPill((docs[doc.key] as any)?.status)
                            ) : (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border bg-muted text-muted-foreground">Missing</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[220px] text-xs">
                          {docs[doc.key]
                            ? ((docs[doc.key] as any)?.status === 'approved'
                                ? 'Approved: Your document has been verified.'
                                : (docs[doc.key] as any)?.status === 'rejected'
                                  ? 'Rejected: Tap to expand and view reason and next steps.'
                                  : 'Pending: Awaiting admin review.')
                            : 'Missing: No file uploaded yet.'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-xs text-muted-foreground mb-2">Accepted: PDF, DOC, DOCX, Images • Max {doc.maxFiles} file{doc.maxFiles > 1 ? 's' : ''}</div>
                  {docs[doc.key] ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-500 h-5 w-5" />
                        <span className="truncate text-sm font-medium">{docs[doc.key]!.file_name}</span>
                      </div>
                      {((docs[doc.key] as any)?.status === 'rejected') && (docs[doc.key] as any)?.admin_notes && (
                        <div className="rounded-md border border-pg-error/30 bg-pg-error/5 text-sm text-pg-error p-3">
                          <div className="font-medium mb-1">Why it was rejected</div>
                          <div className="whitespace-pre-wrap break-words">{(docs[doc.key] as any).admin_notes}</div>
                          <div className="text-xs text-muted-foreground mt-2">Please upload a corrected document and resubmit.</div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="px-3"
                          onClick={async () => {
                            try {
                              const pathOrUrl = docs[doc.key]!.upload_path || docs[doc.key]!.file_url;
                              const { data } = await supabase.storage.from('documents').createSignedUrl(pathOrUrl, 60);
                              if (data?.signedUrl) window.open(data.signedUrl, '_blank'); else window.open(docs[doc.key]!.file_url, '_blank');
                            } catch (error) { window.open(docs[doc.key]!.file_url, '_blank'); }
                          }}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="px-3"
                          onClick={async () => {
                            try {
                              const pathOrUrl = docs[doc.key]!.upload_path || docs[doc.key]!.file_url;
                              const desiredName = docs[doc.key]!.file_name || 'document';
                              const { data } = await supabase.storage.from('documents').createSignedUrl(pathOrUrl, 60, { download: desiredName });
                              const url = data?.signedUrl || docs[doc.key]!.file_url;
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = desiredName;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                            } catch (_) {
                              window.open(docs[doc.key]!.file_url, '_blank');
                            }
                          }}
                        >
                          Download
                        </Button>
                        <Button size="sm" variant="ghost" className="px-3" onClick={() => handleDelete(doc.key)} disabled={loading === doc.key}>Delete</Button>
                      </div>
                    </div>
                  ) : (
                    <DocumentDropZone docKey={doc.key} onFileSelect={file => setSelectedFiles(prev => ({ ...prev, [doc.key]: file }))}
                      onUpload={() => { if (selectedFiles[doc.key]) { handleUpload(doc.key, selectedFiles[doc.key]!); setSelectedFiles(prev => ({ ...prev, [doc.key]: null })); } }}
                      selectedFile={selectedFiles[doc.key]} loading={loading === doc.key} maxFiles={doc.maxFiles}
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

      </div>
    </div>
  );
}

// Minimal drag-and-drop upload box for each document row

type DropZoneProps = {
  docKey: string;
  onFileSelect: (file: File) => void;
  onUpload: () => void;
  selectedFile: File | null;
  loading: boolean;
  maxFiles: number;
};

function DocumentDropZone({ docKey, onFileSelect, onUpload, selectedFile, loading, maxFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={
            'flex items-center border-2 border-dashed rounded-md p-1 transition-colors ' +
            (dragActive ? 'border-ring bg-accent/30' : 'border-border bg-background')
          }
          onDragOver={e => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={e => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{ cursor: 'pointer', minHeight: 36, maxWidth: 260 }}
        >
          <span className="text-xs text-muted-foreground">Drag & drop or <span className="text-primary underline">click to upload</span></span>
          <Upload className="h-4 w-4 text-muted-foreground ml-2" />
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/*,.doc,.docx"
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                onFileSelect(e.target.files[0]);
              }
            }}
            disabled={loading}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-1">
          <span className="truncate max-w-[180px] text-sm font-medium text-primary">{selectedFile.name}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={e => {
              e.stopPropagation();
              onFileSelect(null as any);
            }}
            className="px-2"
          >
            Remove
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={e => {
              e.stopPropagation();
              onUpload();
            }}
            disabled={loading}
            className="px-2"
          >
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}

export default APSRequiredDocuments;