import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RecommendationEntry } from '@/hooks/useRecommendations';

interface RecommendationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Partial<RecommendationEntry> | null;
  onSave: (entry: Partial<RecommendationEntry>) => Promise<void>;
  isLoading?: boolean;
}

export const RecommendationModal = ({ open, onOpenChange, entry, onSave, isLoading }: RecommendationModalProps) => {
  const [formData, setFormData] = useState<Partial<RecommendationEntry>>(
    entry || {
      name: '',
      designation: '',
      institution: '',
      email: '',
      contact: '',
      lor_link: '',
      order_index: 0,
    }
  );

  const handleChange = (field: keyof RecommendationEntry, value: any) => {
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
          <DialogTitle>{entry?.id ? 'Edit Recommender' : 'Add Recommender'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Prof. John Doe"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                placeholder="e.g., Professor"
                value={formData.designation || ''}
                onChange={(e) => handleChange('designation', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Institution</Label>
            <Input
              id="institution"
              placeholder="e.g., University of Oxford"
              value={formData.institution || ''}
              onChange={(e) => handleChange('institution', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="prof@university.edu"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                placeholder="+44 123 456 7890"
                value={formData.contact || ''}
                onChange={(e) => handleChange('contact', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lor_link">Letter of Recommendation Link</Label>
            <Input
              id="lor_link"
              type="url"
              placeholder="https://..."
              value={formData.lor_link || ''}
              onChange={(e) => handleChange('lor_link', e.target.value)}
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
