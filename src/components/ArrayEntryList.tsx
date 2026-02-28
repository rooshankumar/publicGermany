import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react';

interface ArrayEntry {
  id: string;
  order_index?: number;
  [key: string]: any;
}

interface ArrayEntryListProps<T extends ArrayEntry> {
  title: string;
  icon: React.ReactNode;
  entries: T[];
  onAdd: () => void;
  onEdit: (entry: T) => void;
  onDelete: (id: string) => void;
  onInlineAdd?: (onSave: (entry: Partial<T>) => Promise<void>) => void;
  onInlineEdit?: (entry: T, onSave: (updatedEntry: Partial<T>) => Promise<void>, onCancel: () => void) => void;
  onReorder?: (sortedIds: string[]) => void;
  renderEntry: (entry: T) => React.ReactNode;
  canReorder?: boolean;
  isLoading?: boolean;
  useInlineEdit?: boolean;
}

export const ArrayEntryList = <T extends ArrayEntry>({
  title,
  icon,
  entries,
  onAdd,
  onEdit,
  onDelete,
  onInlineAdd,
  onInlineEdit,
  onReorder,
  renderEntry,
  canReorder = true,
  isLoading = false,
  useInlineEdit = false,
}: ArrayEntryListProps<T>) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const moveEntry = (index: number, direction: 'up' | 'down') => {
    if (!onReorder) return;
    const newEntries = [...entries];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newEntries[index], newEntries[newIndex]] = [newEntries[newIndex], newEntries[index]];
    const sortedIds = newEntries.map((e) => e.id);
    onReorder(sortedIds);
  };

  const handleEditClick = (entry: T) => {
    if (useInlineEdit && onInlineEdit) {
      setEditingId(entry.id);
      onInlineEdit(entry, async (updated) => {
        await onEdit({ ...entry, ...updated } as T);
        setEditingId(null);
      }, () => {
        setEditingId(null);
      });
    } else {
      onEdit(entry);
    }
  };

  const handleAddClick = () => {
    if (useInlineEdit && onInlineAdd) {
      setIsAdding(true);
      onInlineAdd(async (newEntry) => {
        onAdd();
        setIsAdding(false);
      });
    } else {
      onAdd();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <CardTitle>{title}</CardTitle>
            <span className="text-sm text-muted-foreground">({entries.length})</span>
          </div>
          <Button size="sm" onClick={handleAddClick} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isAdding && onInlineAdd && (
          <div className="p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
            {/* Inline add form will be rendered by onInlineAdd callback */}
          </div>
        )}

        {entries.length === 0 && !isAdding ? (
          <p className="text-sm text-muted-foreground py-4">No entries yet. Click "Add" to create one.</p>
        ) : (
          entries.map((entry, idx) => (
            <div key={entry.id}>
              {editingId === entry.id && onInlineEdit ? (
                <div className="p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
                  {/* Inline edit form will be rendered by onInlineEdit callback */}
                </div>
              ) : (
                <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition flex justify-between items-start group">
                  <div className="flex-1">{renderEntry(entry)}</div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition ml-2">
                    {canReorder && onReorder && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveEntry(idx, 'up')}
                          disabled={idx === 0 || isLoading}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveEntry(idx, 'down')}
                          disabled={idx === entries.length - 1 || isLoading}
                          className="h-7 w-7 p-0"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditClick(entry)}
                      disabled={isLoading}
                      className="h-7 w-7 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(entry.id)}
                      disabled={isLoading}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
