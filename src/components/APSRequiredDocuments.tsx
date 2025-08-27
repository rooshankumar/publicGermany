import { useEffect, useRef, useState } from 'react';
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
}

export default function APSRequiredDocuments() {
  const { profile } = useAuth();
  const [docs, setDocs] = useState<Record<string, DocumentMeta | null>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!profile?.user_id) return;
    const fetchDocs = async () => {
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
      setDocs(prev => ({ ...prev, [key]: data }));
    }
    setLoading(null);
  };

  const handleDelete = async (key: string) => {
    if (!profile?.user_id || !docs[key]) return;
    setLoading(key);
    // Remove from storage
    const filePath = docs[key]!.file_url.split('/documents/')[1];
    await supabase.storage.from('documents').remove([filePath]);
    // Remove from db
    await supabase.from('documents').delete().eq('id', docs[key]!.id);
    setDocs(prev => ({ ...prev, [key]: null }));
    setLoading(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-xl shadow p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">APS Required Documents</h2>
        <div className="divide-y divide-border">
          {DOCUMENTS.map(doc => (
            <div
              key={doc.key}
              className="flex flex-col md:flex-row md:items-center py-3 gap-2 md:gap-0"
            >
              <div className="flex-1 text-sm md:text-base font-medium">{doc.label}</div>
              <div className="flex flex-col items-start md:items-center gap-1 md:gap-2 mt-2 md:mt-0">
                <div className="text-xs text-muted-foreground mb-1">Drag & drop files here or click to browse</div>
                <div className="text-xs text-muted-foreground mb-1">Accepted: PDF, DOC, DOCX, Images • Max {doc.maxFiles} file{doc.maxFiles > 1 ? 's' : ''}</div>
                {docs[doc.key] ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-500 h-5 w-5" />
                    <a
                      href={docs[doc.key]!.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(doc.key)}
                      disabled={loading === doc.key}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="application/pdf,image/*,.doc,.docx"
                      className="hidden"
                      ref={el => (fileInputs.current[doc.key] = el)}
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleUpload(doc.key, e.target.files[0]);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-3"
                      onClick={() => fileInputs.current[doc.key]?.click()}
                      disabled={loading === doc.key}
                    >
                      <Upload className="h-4 w-4 mr-1" /> Upload
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
