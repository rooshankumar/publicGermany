import React, { useEffect, useRef, useState, DragEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle, Upload, Trash2, Eye, Plus, FileText, Loader2 } from 'lucide-react';
import { sendEmail } from '@/lib/sendEmail';
import { Badge } from '@/components/ui/badge';

const DOCUMENT_GROUPS = [
  { title: 'Personal', keys: ['passport_copy', 'passport_photo', 'signature'] },
  { title: 'School', keys: ['class_x', 'class_xii'] },
  { title: "Bachelor's Degree", keys: ['bachelor_degree_certificate', 'bachelor_degree_transcript', 'bachelor_all_sem_marksheets', 'bachelor_module_handbook', 'bachelor_thesis', 'project_major', 'project_minor'] },
  { title: "Master's Degree", keys: ['master_degree_certificate', 'master_degree_transcript', 'master_all_sem_marksheets'] },
  { title: 'Language Certificates', keys: ['english_language_certificate', 'german_language_certificate'] },
  { title: 'Recommendation Letters', keys: ['recommendation_letter_1', 'recommendation_letter_2'] },
  { title: 'Work Experience', keys: ['work_experience_1', 'work_experience_2'] },
  { title: 'Official Academic', keys: ['official_grading_certificate', 'ects_conversion_certificate'] },
  { title: 'Application', keys: ['motivation_letter', 'cv'] },
  { title: 'APS & Admission', keys: ['aps_certificate', 'admission_letter'] },
  { title: 'Financial & Insurance', keys: ['financial_proof', 'health_insurance'] },
];

export const DOCUMENTS = [
  // Personal Documents
  { key: 'passport_copy', label: 'Passport Copy', maxFiles: 1 },
  { key: 'passport_photo', label: 'Passport Size Photograph (White Background)', maxFiles: 1 },
  { key: 'signature', label: 'Signature', maxFiles: 1, accept: 'image/*,application/pdf' },
  
  // School Documents
  { key: 'class_x', label: 'Class X Marksheet and Certificate', maxFiles: 2 },
  { key: 'class_xii', label: 'Class XII Marksheet and Certificate', maxFiles: 2 },
  
  // Bachelor's Degree Documents
  { key: 'bachelor_degree_certificate', label: 'Bachelor Degree Certificate', maxFiles: 1 },
  { key: 'bachelor_degree_transcript', label: 'Bachelor Degree Transcript', maxFiles: 1 },
  { key: 'bachelor_all_sem_marksheets', label: 'Bachelor All Semesters Marksheets', maxFiles: 10 },
  { key: 'bachelor_module_handbook', label: 'Bachelor Module Handbook / Coursework PDF', maxFiles: 3 },
  { key: 'bachelor_thesis', label: 'Bachelor Final Year Project / Thesis PDF', maxFiles: 2 },
  { key: 'project_major', label: 'Project Major', maxFiles: 2 },
  { key: 'project_minor', label: 'Project Minor', maxFiles: 2 },
  
  // Master's Degree Documents
  { key: 'master_degree_certificate', label: 'Master Degree Certificate (if applicable)', maxFiles: 1 },
  { key: 'master_degree_transcript', label: 'Master Degree Transcript (if applicable)', maxFiles: 1 },
  { key: 'master_all_sem_marksheets', label: 'Master All Semesters Marksheets (if applicable)', maxFiles: 10 },
  
  // Language Certificates
  { key: 'english_language_certificate', label: 'English Language Certificate (IELTS/TOEFL)', maxFiles: 2 },
  { key: 'german_language_certificate', label: 'German Language Certificate (Goethe/TestDaF)', maxFiles: 2 },
  
  // Recommendation Letters
  { key: 'recommendation_letter_1', label: 'Recommendation Letter 1', maxFiles: 1 },
  { key: 'recommendation_letter_2', label: 'Recommendation Letter 2', maxFiles: 1 },
  
  // Work Experience Documents
  { key: 'work_experience_1', label: 'Work Experience - Offer & Experience Certificate 1', maxFiles: 2 },
  { key: 'work_experience_2', label: 'Work Experience - Offer & Experience Certificate 2', maxFiles: 2 },
  
  // Official Academic Documents
  { key: 'official_grading_certificate', label: 'Official Grading Certificate', maxFiles: 1 },
  { key: 'ects_conversion_certificate', label: 'Official Credit Points to ECTS Conversion Certificate', maxFiles: 1 },
  
  // Application Documents
  { key: 'motivation_letter', label: 'Motivation Letter / SOP (LOM)', maxFiles: 2 },
  { key: 'cv', label: 'CV / Resume', maxFiles: 1 },
  
  // APS & Admission
  { key: 'aps_certificate', label: 'APS Certificate', maxFiles: 2 },
  { key: 'admission_letter', label: 'Admission Letter', maxFiles: 1 },
  
  // Financial & Insurance
  { key: 'financial_proof', label: 'Financial Proof / Blocked Account', maxFiles: 3 },
  { key: 'health_insurance', label: 'Proof of Health Insurance', maxFiles: 2 },
];

export type RequiredDocumentDef = {
  key: string;
  label: string;
  maxFiles: number;
  accept?: string;
};

// Map document keys to standardized base filenames used when storing files.
const CATEGORY_BASE_FILENAME: Record<string, string> = {
  passport_copy: 'Passport',
  passport_photo: 'Passport_Photo',
  signature: 'Signature',
  class_x: 'Class_X_Marksheet_Certificate',
  class_xii: 'Class_XII_Marksheet_Certificate',
  bachelor_degree_certificate: 'Bachelor_Degree_Certificate',
  bachelor_degree_transcript: 'Bachelor_Degree_Transcript',
  bachelor_all_sem_marksheets: 'Bachelor_All_Semester_Marksheets',
  bachelor_module_handbook: 'Bachelor_Module_Handbook',
  bachelor_thesis: 'Bachelor_Final_Year_Project_Thesis',
  project_major: 'Project_Major',
  project_minor: 'Project_Minor',
  master_degree_certificate: 'Master_Degree_Certificate',
  master_degree_transcript: 'Master_Degree_Transcript',
  master_all_sem_marksheets: 'Master_All_Semester_Marksheets',
  english_language_certificate: 'English_Language_Certificate',
  german_language_certificate: 'German_Language_Certificate',
  recommendation_letter_1: 'Recommendation_Letter_1',
  recommendation_letter_2: 'Recommendation_Letter_2',
  work_experience_1: 'Work_Experience_Certificate_1',
  work_experience_2: 'Work_Experience_Certificate_2',
  official_grading_certificate: 'Official_Grading_Certificate',
  ects_conversion_certificate: 'ECTS_Conversion_Certificate',
  motivation_letter: 'Motivation_Letter',
  cv: 'CV_Resume',
  aps_certificate: 'APS_Certificate',
  admission_letter: 'Admission_Letter',
  financial_proof: 'Financial_Proof',
  health_insurance: 'Health_Insurance',
  // Legacy mappings for backward compatibility
  academic_transcripts: 'Academic_Transcripts',
  degree_certificate: 'Degree_Certificate',
  language_certificates: 'Language_Certificates',
  recommendation_letter: 'Recommendation_Letter',
  all_sem_marksheets: 'All_Semester_Marksheets',
  bachelor_degree: 'Bachelor_Degree_Transcript',
  master_degree: 'Master_Degree_Transcripts',
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
  requiredDocuments?: RequiredDocumentDef[];
  additionalDocs?: any[];
  onUploadAdditional?: () => void;
  onDeleteAdditional?: (doc: any) => void;
  notesSlot?: React.ReactNode;
}

// Delete button with confirmation dialog (defined outside component to avoid recreation)
function DeleteButton({ onDelete, loading }: { onDelete: () => void; loading: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-destructive hover:text-destructive/80" disabled={loading}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm">Delete this document?</AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            This action cannot be undone. The file will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="h-8 text-xs bg-destructive hover:bg-destructive/90">
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function APSRequiredDocuments({ displayName, requiredDocuments, additionalDocs = [], onUploadAdditional, onDeleteAdditional, notesSlot }: APSProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<Record<string, DocumentMeta | null>>({});
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const initialLoadDone = useRef(false);
  const requiredList = requiredDocuments && requiredDocuments.length > 0 ? requiredDocuments : (DOCUMENTS as RequiredDocumentDef[]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB (matches Supabase Storage default limit)

  // Helper: status pill
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
    // Only show loading skeleton on first load, not on re-fetches
    if (!initialLoadDone.current) setFetching(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, category, file_url, file_name, upload_path, status, admin_notes')
        .eq('user_id', profile.user_id);
      if (error) throw error;
      const docMap: Record<string, DocumentMeta | null> = {};
      requiredList.forEach(doc => { docMap[doc.key] = null; });
      if (data && data.length > 0) {
        data.forEach((doc: any) => {
          if (doc.category in docMap) docMap[doc.category] = doc;
        });
      }
      setDocs(docMap);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setFetching(false);
      initialLoadDone.current = true;
    }
  };

  useEffect(() => {
    fetchDocs();
    if (!profile?.user_id) return;
    const channel = supabase
      .channel(`docs-${profile.user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${profile.user_id}` }, () => fetchDocs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.user_id]);

  const handleUpload = async (key: string, file: File) => {
    if (!profile?.user_id) {
      toast({ title: 'Authentication required', description: 'Please log in to upload documents.', variant: 'destructive' });
      return;
    }
    
    // Client-side file size validation
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: `File size must be under 5 MB. This file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
        variant: 'destructive',
      });
      return;
    }

    setLoadingDoc(key);
    try {
      const originalExt = (() => { const dot = file.name.lastIndexOf('.'); return dot >= 0 ? file.name.slice(dot) : ''; })();
      const base = CATEGORY_BASE_FILENAME[key] || key;
      const firstName = profile?.full_name?.split(' ')[0] || 'user';
      const safeBaseName = base.replace(/[^a-zA-Z0-9-_ ()]/g, '_');
      const storedFileName = `${firstName}_${safeBaseName}${originalExt || ''}`;
      const fileName = `${Date.now()}-${storedFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${profile.user_id}/${key}/${fileName}`;

      // Upload new file FIRST (safe order: don't delete old until new succeeds)
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: false, cacheControl: '3600' });
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message === 'The resource already exists'
          ? 'A file with this name already exists. Please try again.'
          : 'Failed to upload file. Please try again or contact support.');
      }

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
      if (!publicUrl) throw new Error('Failed to generate public URL');

      // Then upsert the database record
      const { error: dbError } = await supabase
        .from('documents')
        .upsert({
          user_id: profile.user_id,
          category: key,
          file_url: publicUrl,
          file_name: storedFileName,
          file_size: file.size,
          file_type: file.type,
          upload_path: filePath,
          module: 'aps_documents',
          updated_at: new Date().toISOString(),
          status: 'pending',
        })
        .select()
        .single();
      if (dbError) { console.error('Database error:', dbError); throw new Error('Failed to save document metadata'); }

      // Only NOW delete the old file (after new upload succeeded)
      const existingDoc = docs[key] as any;
      if (existingDoc?.upload_path) {
        try { await supabase.storage.from('documents').remove([existingDoc.upload_path]); } catch (e) { console.warn('Failed to delete old file:', e); }
      }

      await fetchDocs();
      toast({ title: 'Document uploaded', description: 'Your document has been submitted for review.' });

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const to = user?.email;
        if (to) {
          const label = (requiredList.find(d => d.key === key)?.label || key);
          const { wrapInEmailTemplate, getPersonalizedGreeting, signOffs } = await import('@/lib/emailTemplate');
          const emailContent = `Your document <strong>${label}</strong> was uploaded successfully and is now <strong>pending</strong> review.<br/><br/>We will notify you once it is approved or if any changes are required.`;
          const emailHtml = wrapInEmailTemplate(emailContent, { customGreeting: getPersonalizedGreeting(profile?.full_name || ''), signOff: signOffs.team });
          await sendEmail(to, 'We received your document', emailHtml);
        }
      } catch (_) { /* ignore email errors */ }
    } catch (error) {
      console.error('Error in handleUpload:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally { setLoadingDoc(null); }
  };

  const handleDelete = async (key: string) => {
    if (!profile?.user_id || !docs[key]) {
      toast({ title: 'Error', description: 'User not authenticated or document not found', variant: 'destructive' });
      return;
    }
    setLoadingDoc(key);
    try {
      const doc = docs[key]!;
      if (doc.upload_path) { await supabase.storage.from('documents').remove([doc.upload_path]).catch(e => console.error(e)); }
      const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id);
      if (dbError) throw new Error('Failed to remove document from database');
      setDocs(prev => ({ ...prev, [key]: null }));
      await fetchDocs();
      toast({ title: 'Document deleted' });
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred.',
        variant: 'destructive',
      });
    } finally { setLoadingDoc(null); }
  };

  // Upload after selecting a file
  const triggerUpload = (key: string) => {
    if (selectedFiles[key]) {
      handleUpload(key, selectedFiles[key]!);
      setSelectedFiles(prev => ({ ...prev, [key]: null }));
    }
  };

  // Render a single document row
  const renderDocRow = (doc: RequiredDocumentDef) => {
    const docData = docs[doc.key];
    const status = (docData as any)?.status;
    const isApproved = status === 'approved';
    const isRejected = status === 'rejected';
    const adminNotes = (docData as any)?.admin_notes;
    
    return (
      <div key={doc.key} className="py-2 px-2 rounded-lg hover:bg-muted/30 transition-colors">
        <div className="flex items-center justify-between gap-1.5 min-h-[36px]">
          {/* Left: label + status */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[11px] sm:text-sm truncate leading-tight">{doc.label}</span>
            {docData && <span className="flex-shrink-0">{renderStatusPill(status)}</span>}
            {isApproved && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-pg-success/10 text-pg-success border border-pg-success/30 font-medium">
                Verified
              </Badge>
            )}
          </div>
          {/* Right: actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {docData ? (
              <>
                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
                  onClick={async () => {
                    const pathOrUrl = (docData as any).upload_path || docData.file_url;
                    if (pathOrUrl) {
                      try {
                        const { data } = await supabase.storage.from('documents').createSignedUrl(pathOrUrl, 60);
                        if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                        else window.open(docData.file_url, '_blank');
                      } catch { window.open(docData.file_url, '_blank'); }
                    }
                  }}
                >
                  <Eye className="h-3 w-3 mr-0.5" /> View
                </Button>
                {/* Show upload button for rejected so they can re-upload */}
                {!isApproved && (
                  <DocumentDropZone 
                    docKey={doc.key}
                    accept={doc.accept}
                    onFileSelect={file => setSelectedFiles(prev => ({ ...prev, [doc.key]: file }))}
                    onUpload={() => triggerUpload(doc.key)}
                    selectedFile={selectedFiles[doc.key]} 
                    loading={loadingDoc === doc.key} 
                    maxFiles={doc.maxFiles}
                    compact={true}
                  />
                )}
                {!isApproved && (
                  <DeleteButton onDelete={() => handleDelete(doc.key)} loading={loadingDoc === doc.key} />
                )}
              </>
            ) : (
              <DocumentDropZone 
                docKey={doc.key}
                accept={doc.accept}
                onFileSelect={file => setSelectedFiles(prev => ({ ...prev, [doc.key]: file }))}
                onUpload={() => triggerUpload(doc.key)}
                selectedFile={selectedFiles[doc.key]} 
                loading={loadingDoc === doc.key} 
                maxFiles={doc.maxFiles}
              />
            )}
          </div>
        </div>
        {/* Show admin rejection notes */}
        {isRejected && adminNotes && (
          <p className="text-[10px] text-destructive mt-1 px-1">Reason: {adminNotes}</p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-16 md:pb-0">
      <div className="bg-card rounded-lg shadow-sm p-3 md:p-6 border border-border">
        <h2 className="text-base md:text-lg font-semibold">Required Documents</h2>
        <p className="text-xs text-muted-foreground mb-3">Upload clear, legible copies for review.</p>

        {/* Notes slot - integrated at the top of the card */}
        {notesSlot && <div className="mb-4">{notesSlot}</div>}

        {/* Loading state */}
        {fetching ? (
          <div className="space-y-3 py-6">
            <div className="flex items-center gap-2 py-2 px-1">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-3 w-8 bg-muted rounded animate-pulse" />
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between py-3 px-2">
                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
        <div className="divide-y divide-border/60">
          {DOCUMENT_GROUPS.map(group => {
            const groupDocs = group.keys.map(key => requiredList.find(d => d.key === key)).filter(Boolean) as RequiredDocumentDef[];
            if (groupDocs.length === 0) return null;
            const uploaded = groupDocs.filter(d => docs[d.key]?.status === 'approved').length;
            return (
              <div key={group.title}>
                {/* Category header */}
                <div className="flex items-center gap-2 py-1.5 px-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</span>
                  <span className="text-[10px] text-muted-foreground/60">({uploaded}/{groupDocs.length})</span>
                  {uploaded === groupDocs.length && <CheckCircle className="h-3 w-3 text-pg-success" />}
                </div>
                {/* Document rows */}
                <div className="space-y-0.5 pb-1.5">
                  {groupDocs.map(doc => renderDocRow(doc))}
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Additional Documents Section */}
        {onUploadAdditional && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Additional Documents
              </h3>
              <Button onClick={onUploadAdditional} size="sm" variant="default" className="h-7 text-xs px-2">
                <Upload className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>

            {additionalDocs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground border rounded-lg bg-muted/10">
                <FileText className="h-6 w-6 mx-auto mb-1 opacity-40" />
                <p className="text-xs">No additional documents</p>
              </div>
            ) : (
              <div className="space-y-1">
                {additionalDocs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between gap-2 p-2 border rounded-lg bg-background">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium truncate">{doc.file_name}</p>
                          <Badge variant={doc.status === 'approved' ? 'secondary' : doc.status === 'rejected' ? 'destructive' : 'outline'} className="capitalize text-[10px] px-1.5 py-0">{doc.status || 'pending'}</Badge>
                        </div>
                        {doc.admin_notes && doc.status === 'rejected' && <p className="text-[10px] text-destructive truncate">Admin: {doc.admin_notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {doc.status === 'approved' ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-pg-success/10 text-pg-success border border-pg-success/30 font-medium">
                          Verified
                        </Badge>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
                            onClick={async () => {
                              const { data } = await supabase.storage.from('documents').createSignedUrl(doc.upload_path, 300);
                              if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                            }}
                          >
                            View
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-destructive hover:text-destructive/80" onClick={() => onDeleteAdditional?.(doc)}>
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        <div className="mt-3 pt-2 border-t text-[10px] text-muted-foreground flex flex-wrap gap-x-3">
          <span>Accepted: PDF, DOC, DOCX, Images</span>
          <span>Signature: PDF &amp; Images</span>
        </div>
      </div>
    </div>
  );
}

// Minimal drag-and-drop upload box
type DropZoneProps = {
  docKey: string;
  accept?: string;
  onFileSelect: (file: File) => void;
  onUpload: () => void;
  selectedFile: File | null;
  loading: boolean;
  maxFiles: number;
  compact?: boolean;
};

function DocumentDropZone({ docKey, accept, onFileSelect, onUpload, selectedFile, loading, maxFiles, compact }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) onFileSelect(e.dataTransfer.files[0]);
  };

  const acceptString = accept || "application/pdf,image/*,.doc,.docx";

  if (compact) {
    return (
      <>
        {!selectedFile ? (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[10px]"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
          >
            <Upload className="h-3 w-3 mr-0.5" /> Re-upload
          </Button>
        ) : (
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] text-primary truncate max-w-[50px] hidden sm:inline">{selectedFile.name}</span>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
              onClick={e => { e.stopPropagation(); onFileSelect(null as any); }}
              title="Cancel"
            >✕</Button>
            <Button size="sm" variant="default" className="h-6 px-1.5 text-[10px]"
              onClick={e => { e.stopPropagation(); onUpload(); }}
              disabled={loading}
            ><Upload className="h-3 w-3" /></Button>
          </div>
        )}
        <input ref={inputRef} type="file" accept={acceptString} className="hidden"
          onChange={e => { if (e.target.files && e.target.files[0]) onFileSelect(e.target.files[0]); }}
          disabled={loading}
        />
      </>
    );
  }

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={'flex items-center border border-dashed rounded-md px-1.5 py-1 transition-colors gap-0.5 ' + (dragActive ? 'border-ring bg-accent/30' : 'border-border bg-background')}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{ cursor: 'pointer' }}
          title="Upload file"
        >
          <Upload className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-[10px] sm:text-[11px] text-muted-foreground whitespace-nowrap hidden sm:inline"><span className="text-primary underline">Click</span> or drop</span>
          <input ref={inputRef} type="file" accept={acceptString} className="hidden"
            onChange={e => { if (e.target.files && e.target.files[0]) onFileSelect(e.target.files[0]); }}
            disabled={loading}
          />
        </div>
      ) : (
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] text-primary truncate max-w-[70px] hidden sm:inline">{selectedFile.name}</span>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-[10px]"
            onClick={e => { e.stopPropagation(); onFileSelect(null as any); }}
            title="Cancel"
          >✕</Button>
          <Button size="sm" variant="default" className="h-6 px-1.5 text-[10px] min-w-0"
            onClick={e => { e.stopPropagation(); onUpload(); }}
            disabled={loading}
          ><Upload className="h-3 w-3 sm:mr-0.5" /><span className="hidden sm:inline">Upload</span></Button>
        </div>
      )}
    </div>
  );
}

export default APSRequiredDocuments;
