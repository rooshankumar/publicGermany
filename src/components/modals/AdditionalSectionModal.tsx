import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AdditionalSectionEntry } from '@/hooks/useAdditionalSections';

interface AdditionalSectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Partial<AdditionalSectionEntry> | null;
  onSave: (entry: Partial<AdditionalSectionEntry>) => Promise<void>;
  isLoading?: boolean;
}

export const AdditionalSectionModal = ({ open, onOpenChange, entry, onSave, isLoading }: AdditionalSectionModalProps) => {
  const [formData, setFormData] = useState<Partial<AdditionalSectionEntry>>(
    entry || {
      section_title: '',
      section_content: '',
      order_index: 0,
    }
  );

  const handleChange = (field: keyof AdditionalSectionEntry, value: any) => {
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
          <DialogTitle>{entry?.id ? 'Edit Section' : 'Add Section'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section_title">Section Title *</Label>
            <Input
              id="section_title"
              placeholder="e.g., Achievements, Community Service"
              value={formData.section_title || ''}
              onChange={(e) => handleChange('section_title', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section_content">Section Content (max 1200 characters)</Label>
            <Textarea
              id="section_content"
              placeholder="Write your content here"
              rows={6}
              maxLength={1200}
              value={formData.section_content || ''}
              onChange={(e) => handleChange('section_content', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {(formData.section_content?.length || 0)} / 1200
            </p>
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
