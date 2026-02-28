import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CertificationEntry } from '@/hooks/useCertifications';

interface InlineCertificationFormProps {
  entry: Partial<CertificationEntry> | null;
  onSave: (entry: Partial<CertificationEntry>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const InlineCertificationForm = ({
  entry,
  onSave,
  onCancel,
  isLoading,
}: InlineCertificationFormProps) => {
  const [formData, setFormData] = useState<Partial<CertificationEntry>>(
    entry || {
      title: '',
      institution: '',
      date: '',
      certificate_url: '',
    }
  );

  const [expanded, setExpanded] = useState(true);

  const handleChange = (field: keyof CertificationEntry, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    await onSave(formData);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full text-left p-3 border rounded-lg bg-card hover:bg-accent/50 transition flex items-center justify-between group"
      >
        <div>
          <p className="font-medium text-sm">{formData.title}</p>
          <p className="text-xs text-muted-foreground">{formData.institution}, {formData.date}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
      </button>
    );
  }

  return (
    <div className="border-2 border-primary/30 rounded-lg p-4 bg-primary/5 space-y-3">
      <button
        onClick={() => setExpanded(false)}
        className="w-full flex items-center justify-between font-medium text-sm mb-2"
      >
        <span>Edit Certification</span>
        <ChevronUp className="h-4 w-4" />
      </button>

      <div className="space-y-1">
        <Label htmlFor="title" className="text-xs">Certification Title *</Label>
        <Input
          id="title"
          placeholder="AWS Certified Solutions Architect"
          value={formData.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          className="text-sm py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="institution" className="text-xs">Institution</Label>
          <Input
            id="institution"
            placeholder="Amazon Web Services"
            value={formData.institution || ''}
            onChange={(e) => handleChange('institution', e.target.value)}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="date" className="text-xs">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className="text-sm py-2"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="certificate_url" className="text-xs">Certificate URL</Label>
        <Input
          id="certificate_url"
          type="url"
          placeholder="https://..."
          value={formData.certificate_url || ''}
          onChange={(e) => handleChange('certificate_url', e.target.value)}
          className="text-sm py-2"
        />
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onCancel();
            setExpanded(false);
          }}
          disabled={isLoading}
          className="text-xs"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isLoading}
          className="text-xs"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
