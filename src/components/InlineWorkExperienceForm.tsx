import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { WorkExperienceEntry } from '@/hooks/useWorkExperiences';

interface InlineWorkExperienceFormProps {
  entry: Partial<WorkExperienceEntry> | null;
  onSave: (entry: Partial<WorkExperienceEntry>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const InlineWorkExperienceForm = ({
  entry,
  onSave,
  onCancel,
  isLoading,
}: InlineWorkExperienceFormProps) => {
  const [formData, setFormData] = useState<Partial<WorkExperienceEntry>>(
    entry || {
      job_title: '',
      organisation: '',
      city_country: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      is_current: false,
      description: '',
    }
  );

  const [expanded, setExpanded] = useState(true);

  const handleChange = (field: keyof WorkExperienceEntry, value: any) => {
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
            {formData.job_title} at {formData.organisation}
          </p>
          <p className="text-xs text-muted-foreground">
            {formData.city_country}
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
        <span>Edit Work Experience</span>
        <ChevronUp className="h-4 w-4" />
      </button>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="job_title" className="text-xs">Job Title *</Label>
          <Input
            id="job_title"
            placeholder="e.g., Software Engineer"
            value={formData.job_title || ''}
            onChange={(e) => handleChange('job_title', e.target.value)}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="organisation" className="text-xs">Organisation *</Label>
          <Input
            id="organisation"
            placeholder="Company name"
            value={formData.organisation || ''}
            onChange={(e) => handleChange('organisation', e.target.value)}
            className="text-sm py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="start_date" className="text-xs">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date || ''}
            onChange={(e) => handleChange('start_date', e.target.value)}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end_date" className="text-xs">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date || ''}
            onChange={(e) => handleChange('end_date', e.target.value)}
            disabled={formData.is_current}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1 flex items-end">
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <Checkbox
              checked={formData.is_current || false}
              onCheckedChange={(checked) => handleChange('is_current', checked)}
            />
            <span>Currently Working</span>
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="city_country" className="text-xs">City/Country</Label>
        <Input
          id="city_country"
          placeholder="e.g., Berlin, Germany"
          value={formData.city_country || ''}
          onChange={(e) => handleChange('city_country', e.target.value)}
          className="text-sm py-2"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description" className="text-xs">Description</Label>
        <Textarea
          id="description"
          placeholder="Role responsibilities and context"
          rows={2}
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
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
