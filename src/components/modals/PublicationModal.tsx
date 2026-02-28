import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { PublicationEntry } from '@/hooks/usePublications';

interface PublicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Partial<PublicationEntry> | null;
  onSave: (entry: Partial<PublicationEntry>) => Promise<void>;
  isLoading?: boolean;
}

export const PublicationModal = ({ open, onOpenChange, entry, onSave, isLoading }: PublicationModalProps) => {
  const [formData, setFormData] = useState<Partial<PublicationEntry>>(
    entry || {
      title: '',
      journal: '',
      year: new Date().getFullYear(),
      doi_url: '',
      description: '',
      order_index: 0,
    }
  );

  const handleChange = (field: keyof PublicationEntry, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    await onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry?.id ? 'Edit Publication' : 'Add Publication'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Publication Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Machine Learning in Healthcare"
              value={formData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="journal">Journal</Label>
              <Input
                id="journal"
                placeholder="e.g., Nature"
                value={formData.journal || ''}
                onChange={(e) => handleChange('journal', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year || ''}
                onChange={(e) => handleChange('year', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doi_url">DOI / URL</Label>
            <Input
              id="doi_url"
              placeholder="https://doi.org/... or URL"
              value={formData.doi_url || ''}
              onChange={(e) => handleChange('doi_url', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief summary of the publication"
              rows={4}
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
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
