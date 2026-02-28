import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { EducationEntry } from '@/hooks/useEducations';

interface EducationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Partial<EducationEntry> | null;
  onSave: (entry: Partial<EducationEntry>) => Promise<void>;
  isLoading?: boolean;
}

export const EducationModal = ({ open, onOpenChange, entry, onSave, isLoading }: EducationModalProps) => {
  const [formData, setFormData] = useState<Partial<EducationEntry>>(
    entry || {
      degree_title: '',
      field_of_study: '',
      institution: '',
      country: '',
      start_year: new Date().getFullYear(),
      end_year: new Date().getFullYear(),
      final_grade: '',
      max_scale: 100,
      total_credits: undefined,
      credit_system: 'ECTS',
      thesis_title: '',
      key_subjects: '',
      academic_highlights: '',
      order_index: 0,
    }
  );

  const handleChange = (field: keyof EducationEntry, value: any) => {
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
          <DialogTitle>{entry?.id ? 'Edit Education' : 'Add Education'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="degree_title">Degree Title *</Label>
              <Input
                id="degree_title"
                placeholder="e.g., B.Tech, M.Sc"
                value={formData.degree_title || ''}
                onChange={(e) => handleChange('degree_title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field_of_study">Field of Study *</Label>
              <Input
                id="field_of_study"
                placeholder="e.g., Computer Science"
                value={formData.field_of_study || ''}
                onChange={(e) => handleChange('field_of_study', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="institution">Institution *</Label>
              <Input
                id="institution"
                placeholder="e.g., MIT"
                value={formData.institution || ''}
                onChange={(e) => handleChange('institution', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                placeholder="e.g., USA"
                value={formData.country || ''}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_year">Start Year *</Label>
              <Input
                id="start_year"
                type="number"
                value={formData.start_year || ''}
                onChange={(e) => handleChange('start_year', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_year">End Year *</Label>
              <Input
                id="end_year"
                type="number"
                value={formData.end_year || ''}
                onChange={(e) => handleChange('end_year', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="final_grade">Final Grade</Label>
              <Input
                id="final_grade"
                placeholder="e.g., 8.5"
                value={formData.final_grade || ''}
                onChange={(e) => handleChange('final_grade', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_scale">Max Scale</Label>
              <Input
                id="max_scale"
                type="number"
                placeholder="e.g., 10"
                value={formData.max_scale || ''}
                onChange={(e) => handleChange('max_scale', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_credits">Total Credits</Label>
              <Input
                id="total_credits"
                type="number"
                placeholder="e.g., 120"
                value={formData.total_credits || ''}
                onChange={(e) => handleChange('total_credits', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit_system">Credit System</Label>
              <Input
                id="credit_system"
                placeholder="ECTS, Indian, Other"
                value={formData.credit_system || ''}
                onChange={(e) => handleChange('credit_system', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thesis_title">Thesis Title</Label>
            <Input
              id="thesis_title"
              placeholder="Optional"
              value={formData.thesis_title || ''}
              onChange={(e) => handleChange('thesis_title', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="key_subjects">Key Subjects</Label>
            <Textarea
              id="key_subjects"
              placeholder="Comma-separated subjects"
              rows={3}
              value={formData.key_subjects || ''}
              onChange={(e) => handleChange('key_subjects', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="academic_highlights">Academic Highlights</Label>
            <Textarea
              id="academic_highlights"
              placeholder="Notable achievements"
              rows={3}
              value={formData.academic_highlights || ''}
              onChange={(e) => handleChange('academic_highlights', e.target.value)}
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
