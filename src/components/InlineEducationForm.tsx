import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { EducationEntry } from '@/hooks/useEducations';

interface InlineEducationFormProps {
  entry: Partial<EducationEntry> | null;
  onSave: (entry: Partial<EducationEntry>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const InlineEducationForm = ({
  entry,
  onSave,
  onCancel,
  isLoading,
}: InlineEducationFormProps) => {
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
    }
  );

  const [expanded, setExpanded] = useState(true);

  const handleChange = (field: keyof EducationEntry, value: any) => {
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
          <p className="font-medium text-sm">
            {formData.degree_title} in {formData.field_of_study}
          </p>
          <p className="text-xs text-muted-foreground">
            {formData.institution}, {formData.country}
          </p>
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
        <span>Edit Education</span>
        <ChevronUp className="h-4 w-4" />
      </button>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="degree_title" className="text-xs">Degree *</Label>
          <Input
            id="degree_title"
            placeholder="B.Tech, M.Sc"
            value={formData.degree_title || ''}
            onChange={(e) => handleChange('degree_title', e.target.value)}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="field_of_study" className="text-xs">Field *</Label>
          <Input
            id="field_of_study"
            placeholder="Computer Science"
            value={formData.field_of_study || ''}
            onChange={(e) => handleChange('field_of_study', e.target.value)}
            className="text-sm py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="institution" className="text-xs">Institution *</Label>
          <Input
            id="institution"
            placeholder="University name"
            value={formData.institution || ''}
            onChange={(e) => handleChange('institution', e.target.value)}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="country" className="text-xs">Country *</Label>
          <Input
            id="country"
            placeholder="Country"
            value={formData.country || ''}
            onChange={(e) => handleChange('country', e.target.value)}
            className="text-sm py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="start_year" className="text-xs">Start *</Label>
          <Input
            id="start_year"
            type="number"
            value={formData.start_year || ''}
            onChange={(e) => handleChange('start_year', parseInt(e.target.value))}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end_year" className="text-xs">End *</Label>
          <Input
            id="end_year"
            type="number"
            value={formData.end_year || ''}
            onChange={(e) => handleChange('end_year', parseInt(e.target.value))}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="final_grade" className="text-xs">Grade</Label>
          <Input
            id="final_grade"
            placeholder="8.5"
            value={formData.final_grade || ''}
            onChange={(e) => handleChange('final_grade', e.target.value)}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="max_scale" className="text-xs">Scale</Label>
          <Input
            id="max_scale"
            type="number"
            placeholder="10"
            value={formData.max_scale || ''}
            onChange={(e) => handleChange('max_scale', parseInt(e.target.value))}
            className="text-sm py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="total_credits" className="text-xs">Credits</Label>
          <Input
            id="total_credits"
            type="number"
            placeholder="120"
            value={formData.total_credits || ''}
            onChange={(e) => handleChange('total_credits', parseInt(e.target.value))}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="credit_system" className="text-xs">System</Label>
          <Input
            id="credit_system"
            placeholder="ECTS"
            value={formData.credit_system || ''}
            onChange={(e) => handleChange('credit_system', e.target.value)}
            className="text-sm py-2"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="thesis_title" className="text-xs">Thesis</Label>
        <Input
          id="thesis_title"
          placeholder="Optional"
          value={formData.thesis_title || ''}
          onChange={(e) => handleChange('thesis_title', e.target.value)}
          className="text-sm py-2"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="key_subjects" className="text-xs">Key Subjects</Label>
        <Textarea
          id="key_subjects"
          placeholder="Comma-separated"
          rows={2}
          value={formData.key_subjects || ''}
          onChange={(e) => handleChange('key_subjects', e.target.value)}
          className="text-sm resize-none"
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
