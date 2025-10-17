import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Upload, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MultiFileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string;
  existingFiles?: Array<{ name: string; url: string }>;
  onRemoveExisting?: (url: string) => void;
}

export function MultiFileUpload({ 
  onFilesSelected, 
  maxFiles = 5, 
  acceptedTypes = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,image/*",
  existingFiles = [],
  onRemoveExisting 
}: MultiFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const totalFiles = selectedFiles.length + existingFiles.length + files.length;
    
    if (totalFiles > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed`,
        variant: 'destructive'
      });
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const clearAll = () => {
    setSelectedFiles([]);
    onFilesSelected([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('multi-file-upload')?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Select Files
        </Button>
        
        {selectedFiles.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-destructive hover:text-destructive"
          >
            Clear All
          </Button>
        )}
      </div>

      <Input
        id="multi-file-upload"
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleFileSelection}
        className="hidden"
      />

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Existing Files:</p>
          <div className="flex flex-wrap gap-2">
            {existingFiles.map((file, index) => (
              <Badge key={index} variant="secondary" className="gap-2 pr-1">
                <File className="h-3 w-3" />
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:underline text-xs max-w-[100px] truncate"
                >
                  {file.name}
                </a>
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(file.url)}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected Files:</p>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <Badge key={index} variant="outline" className="gap-2 pr-1">
                <File className="h-3 w-3" />
                <span className="text-xs max-w-[100px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {selectedFiles.length + existingFiles.length}/{maxFiles} files selected
      </p>
    </div>
  );
}
