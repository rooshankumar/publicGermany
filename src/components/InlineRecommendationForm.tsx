import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { RecommendationEntry } from '@/hooks/useRecommendations';

interface InlineRecommendationFormProps {
  entry: Partial<RecommendationEntry> | null;
  onSave: (entry: Partial<RecommendationEntry>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const InlineRecommendationForm = ({
  entry,
  onSave,
  onCancel,
  isLoading,
}: InlineRecommendationFormProps) => {
  const [formData, setFormData] = useState<Partial<RecommendationEntry>>(
    entry || {
      name: '',
      designation: '',
      institution: '',
      email: '',
      contact: '',
      lor_link: '',
    }
  );

  const [expanded, setExpanded] = useState(true);

  const handleChange = (field: keyof RecommendationEntry, value: any) => {
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
          <p className="font-medium text-sm">{formData.name}</p>
          <p className="text-xs text-muted-foreground">{formData.designation} at {formData.institution}</p>
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
        <span>Edit Recommender</span>
        <ChevronUp className="h-4 w-4" />
      </button>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-xs">Name *</Label>
          <Input
            id="name"
            placeholder="Prof. John Doe"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="designation" className="text-xs">Designation</Label>
          <Input
            id="designation"
            placeholder="Professor"
            value={formData.designation || ''}
            onChange={(e) => handleChange('designation', e.target.value)}
            className="text-sm py-2"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="institution" className="text-xs">Institution</Label>
        <Input
          id="institution"
          placeholder="University of Oxford"
          value={formData.institution || ''}
          onChange={(e) => handleChange('institution', e.target.value)}
          className="text-sm py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="prof@university.edu"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact" className="text-xs">Contact</Label>
          <Input
            id="contact"
            placeholder="+44 123 456 7890"
            value={formData.contact || ''}
            onChange={(e) => handleChange('contact', e.target.value)}
            className="text-sm py-2"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="lor_link" className="text-xs">Letter of Recommendation Link</Label>
        <Input
          id="lor_link"
          type="url"
          placeholder="https://..."
          value={formData.lor_link || ''}
          onChange={(e) => handleChange('lor_link', e.target.value)}
          className="text-sm py-2"
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
