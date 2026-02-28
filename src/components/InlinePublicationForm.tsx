import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PublicationEntry } from '@/hooks/usePublications';

interface InlinePublicationFormProps {
  entry: Partial<PublicationEntry> | null;
  onSave: (entry: Partial<PublicationEntry>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const InlinePublicationForm = ({
  entry,
  onSave,
  onCancel,
  isLoading,
}: InlinePublicationFormProps) => {
  const [formData, setFormData] = useState<Partial<PublicationEntry>>(
    entry || {
      title: '',
      journal: '',
      year: new Date().getFullYear(),
      doi_url: '',
      description: '',
    }
  );

  const [expanded, setExpanded] = useState(true);

  const handleChange = (field: keyof PublicationEntry, value: any) => {
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
          <p className="text-xs text-muted-foreground">{formData.journal}, {formData.year}</p>
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
        <span>Edit Publication</span>
        <ChevronUp className="h-4 w-4" />
      </button>

      <div className="space-y-1">
        <Label htmlFor="title" className="text-xs">Publication Title *</Label>
        <Input
          id="title"
          placeholder="Machine Learning in Healthcare"
          value={formData.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          className="text-sm py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="journal" className="text-xs">Journal</Label>
          <Input
            id="journal"
            placeholder="Nature, IEEE, etc."
            value={formData.journal || ''}
            onChange={(e) => handleChange('journal', e.target.value)}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="year" className="text-xs">Year</Label>
          <Input
            id="year"
            type="number"
            value={formData.year || ''}
            onChange={(e) => handleChange('year', parseInt(e.target.value))}
            className="text-sm py-2"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="doi_url" className="text-xs">DOI / URL</Label>
        <Input
          id="doi_url"
          type="url"
          placeholder="https://doi.org/... or URL"
          value={formData.doi_url || ''}
          onChange={(e) => handleChange('doi_url', e.target.value)}
          className="text-sm py-2"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description" className="text-xs">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief summary of the publication"
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
