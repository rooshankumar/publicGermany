import React, { useEffect, useRef, useState, DragEvent } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CheckCircle, Upload, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const DOCUMENTS = [
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

interface DocumentMeta {
  id: string;
  category: string;
  file_url: string;
  file_name: string;
  upload_path?: string;
}

function APSRequiredDocuments() {
  const { profile } = useAuth();
  const [docs, setDocs] = useState<Record<string, DocumentMeta | null>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});

  const fetchDocs = async () => {
    if (!profile?.user_id) return;
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', profile.user_id);
    const docMap: Record<string, DocumentMeta | null> = {};
    DOCUMENTS.forEach(doc => {
      docMap[doc.key] = data?.find((d: any) => d.category === doc.key) || null;
    });
    setDocs(docMap);
  };

  useEffect(() => {
    fetchDocs();
  }, [profile?.user_id]);

  const handleUpload = async (key: string, file: File) => {
    if (!profile?.user_id) return;
    setLoading(key);
    const filePath = `${profile.user_id}/${key}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file, { upsert: true });
    if (uploadError) {
      setLoading(null);
      return alert('Upload failed');
    }
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
    // Save metadata
    const { data, error } = await supabase.from('documents').upsert({
      user_id: profile.user_id,
      category: key,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      upload_path: filePath,
    }).select().single();
    if (!error && data) {
      await fetchDocs();
    }
    setLoading(null);
  };

  const handleDelete = async (key: string) => {
    if (!profile?.user_id || !docs[key]) return;
    setLoading(key);
    try {
      // Remove from storage - handle potential path issues
      const doc = docs[key]!;
      if (doc.upload_path) {
        await supabase.storage.from('documents').remove([doc.upload_path]);
      }
      // Remove from db
      await supabase.from('documents').delete().eq('id', doc.id);
      await fetchDocs();
    } catch (error: any) {
      console.error('Error deleting document:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-6">Document Upload</h2>
        <div className="flex flex-col gap-4">
          {DOCUMENTS.map(doc => (
            <div
              key={doc.key}
              className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-2 rounded-lg border border-gray-100 shadow-sm bg-gray-50"
            >
              <div className="w-full md:w-1/3 flex flex-col items-start md:items-center text-sm md:text-base font-medium">
                <span>{doc.label}</span>
                <span className="text-xs text-muted-foreground mt-1">Accepted: PDF, DOC, DOCX, Images • Max {doc.maxFiles} file{doc.maxFiles > 1 ? 's' : ''}</span>
              </div>
              <div className="w-full md:w-2/3 flex flex-col gap-1">
                {docs[doc.key] ? (
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-500 h-5 w-5" />
                      <span className="truncate max-w-[180px] text-sm font-medium">{docs[doc.key]!.file_name}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="px-2"
                        onClick={async () => {
                          try {
                            const { data } = await supabase.storage
                              .from('documents')
                              .createSignedUrl(docs[doc.key]!.upload_path || docs[doc.key]!.file_url, 60);
                            if (data?.signedUrl) {
                              window.open(data.signedUrl, '_blank');
                            } else {
                              window.open(docs[doc.key]!.file_url, '_blank');
                            }
                          } catch (error) {
                            window.open(docs[doc.key]!.file_url, '_blank');
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(doc.key)}
                        disabled={loading === doc.key}
                        className="px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <DocumentDropZone
                    docKey={doc.key}
                    onFileSelect={file => setSelectedFiles(prev => ({ ...prev, [doc.key]: file }))}
                    onUpload={() => {
                      if (selectedFiles[doc.key]) {
                        handleUpload(doc.key, selectedFiles[doc.key]!);
                        setSelectedFiles(prev => ({ ...prev, [doc.key]: null }));
                      }
                    }}
                    selectedFile={selectedFiles[doc.key]}
                    loading={loading === doc.key}
                    maxFiles={doc.maxFiles}
                  />
                )}
              </div>
            </div>
          ))}
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
            (dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white')
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
          <span className="text-xs text-gray-500">Drag & drop or <span className="text-blue-600 underline">click to upload</span></span>
          <Upload className="h-4 w-4 text-gray-400 ml-2" />
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
          <span className="truncate max-w-[180px] text-sm font-medium text-blue-700">{selectedFile.name}</span>
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