import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LanguageSkillEntry, CEFRLevel } from '@/hooks/useLanguageSkills';

const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

interface LanguageSkillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: Partial<LanguageSkillEntry> | null;
  onSave: (entry: Partial<LanguageSkillEntry>) => Promise<void>;
  isLoading?: boolean;
}

export const LanguageSkillModal = ({ open, onOpenChange, entry, onSave, isLoading }: LanguageSkillModalProps) => {
  const [formData, setFormData] = useState<Partial<LanguageSkillEntry>>(
    entry || {
      language_name: '',
      mother_tongue: false,
      listening: null,
      reading: null,
      writing: null,
      speaking: null,
      ielts_score: null,
    }
  );

  const handleChange = (field: keyof LanguageSkillEntry, value: any) => {
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
          <DialogTitle>{entry?.id ? 'Edit Language Skill' : 'Add Language Skill'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language_name">Language Name *</Label>
              <Input
                id="language_name"
                placeholder="e.g., English"
                value={formData.language_name || ''}
                onChange={(e) => handleChange('language_name', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mother_tongue"
                  checked={formData.mother_tongue || false}
                  onCheckedChange={(checked) => handleChange('mother_tongue', checked)}
                />
                <Label htmlFor="mother_tongue">Mother Tongue</Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">CEFR Levels (Listening, Reading, Writing, Speaking)</p>
            <div className="grid grid-cols-4 gap-3">
              {(['listening', 'reading', 'writing', 'speaking'] as const).map((skill) => (
                <div key={skill} className="space-y-2">
                  <Label htmlFor={skill} className="capitalize text-xs">
                    {skill}
                  </Label>
                  <Select
                    value={formData[skill] || ''}
                    onValueChange={(val) => handleChange(skill, val || null)}
                  >
                    <SelectTrigger id={skill} className="h-9">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {CEFR_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ielts_score">IELTS Score (if applicable)</Label>
            <Input
              id="ielts_score"
              type="number"
              step="0.5"
              placeholder="e.g., 7.5"
              value={formData.ielts_score || ''}
              onChange={(e) => handleChange('ielts_score', e.target.value ? parseFloat(e.target.value) : null)}
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
