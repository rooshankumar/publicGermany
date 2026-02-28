import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CertificationEntry } from '@/hooks/useCertifications';

interface CertificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Partial<CertificationEntry> | null;
  onSave: (entry: Partial<CertificationEntry>) => Promise<void>;
  isLoading?: boolean;
}

export const CertificationModal = ({ open, onOpenChange, entry, onSave, isLoading }: CertificationModalProps) => {
  const [formData, setFormData] = useState<Partial<CertificationEntry>>(
    entry || {
      title: '',
      institution: '',
      date: '',
      certificate_url: '',
      order_index: 0,
    }
  );

  const handleChange = (field: keyof CertificationEntry, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    await onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry?.id ? 'Edit Certification' : 'Add Certification'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Certification Title *</Label>
            <Input
              id="title"
              placeholder="e.g., AWS Certified Solutions Architect"
              value={formData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Institution</Label>
            <Input
              id="institution"
              placeholder="e.g., Amazon Web Services"
              value={formData.institution || ''}
              onChange={(e) => handleChange('institution', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date || ''}
              onChange={(e) => handleChange('date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate_url">Certificate URL</Label>
            <Input
              id="certificate_url"
              type="url"
              placeholder="https://..."
              value={formData.certificate_url || ''}
              onChange={(e) => handleChange('certificate_url', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
