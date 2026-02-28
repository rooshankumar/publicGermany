import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { WorkExperienceEntry } from '@/hooks/useWorkExperiences';

interface WorkExperienceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Partial<WorkExperienceEntry> | null;
  onSave: (entry: Partial<WorkExperienceEntry>) => Promise<void>;
  isLoading?: boolean;
}

export const WorkExperienceModal = ({ open, onOpenChange, entry, onSave, isLoading }: WorkExperienceModalProps) => {
  const [formData, setFormData] = useState<Partial<WorkExperienceEntry>>(
    entry || {
      job_title: '',
      organisation: '',
      city_country: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
      order_index: 0,
    }
  );

  const handleChange = (field: keyof WorkExperienceEntry, value: any) => {
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
          <DialogTitle>{entry?.id ? 'Edit Work Experience' : 'Add Work Experience'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                placeholder="e.g., Software Engineer"
                value={formData.job_title || ''}
                onChange={(e) => handleChange('job_title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organisation">Organisation</Label>
              <Input
                id="organisation"
                placeholder="e.g., Google"
                value={formData.organisation || ''}
                onChange={(e) => handleChange('organisation', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city_country">City & Country</Label>
            <Input
              id="city_country"
              placeholder="e.g., San Francisco, USA"
              value={formData.city_country || ''}
              onChange={(e) => handleChange('city_country', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => handleChange('start_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => handleChange('end_date', e.target.value)}
                disabled={formData.is_current}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_current"
              checked={formData.is_current || false}
              onCheckedChange={(checked) => handleChange('is_current', checked)}
            />
            <Label htmlFor="is_current">Currently Working Here</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (max 1000 characters)</Label>
            <Textarea
              id="description"
              placeholder="Describe your responsibilities and achievements"
              rows={4}
              maxLength={1000}
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {(formData.description?.length || 0)} / 1000
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
