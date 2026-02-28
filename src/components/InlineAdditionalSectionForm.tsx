import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AdditionalSectionEntry } from '@/hooks/useAdditionalSections';

interface InlineAdditionalSectionFormProps {
  entry: Partial<AdditionalSectionEntry> | null;
  onSave: (entry: Partial<AdditionalSectionEntry>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const InlineAdditionalSectionForm = ({
  entry,
  onSave,
  onCancel,
  isLoading,
}: InlineAdditionalSectionFormProps) => {
  const [formData, setFormData] = useState<Partial<AdditionalSectionEntry>>(
    entry || {
      section_title: '',
      section_content: '',
    }
  );

  const [expanded, setExpanded] = useState(true);

  const handleChange = (field: keyof AdditionalSectionEntry, value: any) => {
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
          <p className="font-medium text-sm">{formData.section_title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {formData.section_content?.substring(0, 60)}...
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
        <span>Edit Section</span>
        <ChevronUp className="h-4 w-4" />
      </button>

      <div className="space-y-1">
        <Label htmlFor="section_title" className="text-xs">Section Title *</Label>
        <Input
          id="section_title"
          placeholder="Achievements, Community Service, etc."
          value={formData.section_title || ''}
          onChange={(e) => handleChange('section_title', e.target.value)}
          className="text-sm py-2"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="section_content" className="text-xs">Section Content (max 1200 characters)</Label>
        <Textarea
          id="section_content"
          placeholder="Write your content here"
          rows={4}
          maxLength={1200}
          value={formData.section_content || ''}
          onChange={(e) => handleChange('section_content', e.target.value)}
          className="text-sm resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {(formData.section_content?.length || 0)} / 1200
        </p>
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
