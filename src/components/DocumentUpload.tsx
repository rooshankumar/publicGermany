import { useState, useRef } from 'react';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DocumentUploadProps {
  category: string;
  maxFiles?: number;
  acceptedTypes?: string[];
  onUploadComplete?: (files: UploadedFile[]) => void;
  className?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  category: string;
}

export const DocumentUpload = ({
  category,
  maxFiles = 5,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  onUploadComplete,
  className = ''
}: DocumentUploadProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (uploadedFiles.length === 0) {
      const files = Array.from(e.dataTransfer.files).slice(0, 1);
      handleFileUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && uploadedFiles.length === 0) {
      const files = Array.from(e.target.files).slice(0, 1);
      handleFileUpload(files);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!profile?.user_id) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files.",
        variant: "destructive",
      });
      return;
    }

    if (uploadedFiles.length + files.length > 1) {
      toast({
        title: "Too many files",
        description: `Only 1 file allowed (Passport Copy).`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = files.map(async (file, index) => {
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.user_id}/${category}/${Date.now()}-${index}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        // Save to database using existing files table
        const { data: dbData, error: dbError } = await supabase
          .from('files')
          .insert({
            user_id: profile.user_id,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            file_path: fileName,
            module: category,
            mime_type: file.type
          })
          .select()
          .single();

        if (dbError) throw dbError;

        setUploadProgress((prev) => prev + (100 / files.length));

        return {
          id: dbData.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          category: category
        } as UploadedFile;
      });

      const results = await Promise.all(uploadPromises);
      const newFiles = [...uploadedFiles, ...results];
      setUploadedFiles(newFiles);
      
      toast({
        title: "Upload successful",
        description: `${files.length} file(s) uploaded successfully.`,
      });

      onUploadComplete?.(newFiles);
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;

    try {
      // Delete from storage
      const filePath = file.url.split('/').slice(-2).join('/'); // Get user_id/category/filename
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      // Delete from database using files table
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (storageError || dbError) throw storageError || dbError;

      const newFiles = uploadedFiles.filter(f => f.id !== fileId);
      setUploadedFiles(newFiles);
      onUploadComplete?.(newFiles);

    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.includes('pdf')) return FileText;
    return File;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="font-semibold text-base flex items-center gap-2">
        <span role="img" aria-label="passport">📄</span> Passport Copy
      </div>

  {/* If file is uploaded, show file info with Download/Delete */}
      {uploadedFiles.length > 0 ? (
        <div className="border rounded-lg divide-y bg-secondary">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium">{uploadedFiles[0].name}</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={uploadedFiles[0].url}
                download={uploadedFiles[0].name}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Download
              </a>
              <Button variant="ghost" size="sm" onClick={() => removeFile(uploadedFiles[0].id)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Upload Zone */}
          <div
            className={`upload-zone p-8 rounded-lg text-center cursor-pointer transition-colors ${dragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {dragOver ? 'Drop file here' : 'Upload Passport Copy'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Accepted: PDF, DOC, DOCX, Images • Max 1 file
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="progress-glow" />
            </div>
          )}
        </>
      )}
    </div>
  );
};