import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { LanguageSkillEntry } from '@/hooks/useLanguageSkills';

const LANGUAGE_LEVELS = [
  'A1', 'A2', 'B1', 'B2', 'C1', 'C2',
];

interface InlineLanguageSkillFormProps {
  entry: Partial<LanguageSkillEntry> | null;
  onSave: (entry: Partial<LanguageSkillEntry>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const InlineLanguageSkillForm = ({
  entry,
  onSave,
  onCancel,
  isLoading,
}: InlineLanguageSkillFormProps) => {
  const [formData, setFormData] = useState<Partial<LanguageSkillEntry>>(
    entry || {
      language_name: '',
      mother_tongue: false,
      listening: null,
      reading: null,
      writing: null,
      speaking: null,
    }
  );

  const [expanded, setExpanded] = useState(true);

  const handleChange = (field: keyof LanguageSkillEntry, value: any) => {
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
            {formData.language_name}{' '}
            {formData.mother_tongue && <span className="text-xs text-muted-foreground">(Mother Tongue)</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {[
              formData.listening && `L: ${formData.listening}`,
              formData.reading && `R: ${formData.reading}`,
              formData.writing && `W: ${formData.writing}`,
              formData.speaking && `S: ${formData.speaking}`,
            ]
              .filter(Boolean)
              .join(' • ')}
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
        <span>Edit Language Skill</span>
        <ChevronUp className="h-4 w-4" />
      </button>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="language_name" className="text-xs">Language *</Label>
          <Input
            id="language_name"
            placeholder="e.g., German, Spanish"
            value={formData.language_name || ''}
            onChange={(e) => handleChange('language_name', e.target.value)}
            className="text-sm py-2"
          />
        </div>
        <div className="space-y-1 flex items-end">
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <Checkbox
              checked={formData.mother_tongue || false}
              onCheckedChange={(checked) => handleChange('mother_tongue', checked)}
            />
            <span>Mother Tongue</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="space-y-1">
          <Label htmlFor="listening" className="text-xs">Listening</Label>
          <Select
            value={formData.listening || ''}
            onValueChange={(val) => handleChange('listening', val)}
            disabled={formData.mother_tongue}
          >
            <SelectTrigger className="text-sm py-2 h-auto">
              <SelectValue placeholder="L" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="reading" className="text-xs">Reading</Label>
          <Select
            value={formData.reading || ''}
            onValueChange={(val) => handleChange('reading', val)}
            disabled={formData.mother_tongue}
          >
            <SelectTrigger className="text-sm py-2 h-auto">
              <SelectValue placeholder="R" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="writing" className="text-xs">Writing</Label>
          <Select
            value={formData.writing || ''}
            onValueChange={(val) => handleChange('writing', val)}
            disabled={formData.mother_tongue}
          >
            <SelectTrigger className="text-sm py-2 h-auto">
              <SelectValue placeholder="W" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="speaking" className="text-xs">Speaking</Label>
          <Select
            value={formData.speaking || ''}
            onValueChange={(val) => handleChange('speaking', val)}
            disabled={formData.mother_tongue}
          >
            <SelectTrigger className="text-sm py-2 h-auto">
              <SelectValue placeholder="S" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.mother_tongue && (
        <p className="text-xs text-muted-foreground italic">CEFR levels not required for mother tongue languages.</p>
      )}

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
