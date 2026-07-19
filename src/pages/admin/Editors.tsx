import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import InlineLoader from '@/components/InlineLoader';
import {
  Plus, Loader2, Trash2, UserPlus, UserMinus, Check, ChevronDown, ChevronUp,
} from 'lucide-react';

interface EditorProfile {
  user_id: string;
  full_name: string | null;
  role: string;
}

interface EditorPerm {
  id: string;
  editor_user_id: string;
  student_user_id: string;
  can_view_profile: boolean;
  can_view_documents: boolean;
  can_view_applications: boolean;
  can_view_payments: boolean;
  can_view_contracts: boolean;
}

interface StudentProfile {
  user_id: string;
  full_name: string | null;
}

const PERMISSION_FIELDS = [
  'can_view_profile',
  'can_view_documents',
  'can_view_applications',
  'can_view_payments',
  'can_view_contracts',
] as const;

const PERMISSION_LABELS: Record<string, string> = {
  can_view_profile: 'Profile',
  can_view_documents: 'Documents',
  can_view_applications: 'Applications',
  can_view_payments: 'Payments',
  can_view_contracts: 'Contracts',
};

export default function Editors() {
  const { toast } = useToast();
  const [editors, setEditors] = useState<EditorProfile[]>([]);
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
  const [allUsers, setAllUsers] = useState<StudentProfile[]>([]);
  const [permissions, setPermissions] = useState<EditorPerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEditor, setExpandedEditor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [verifiedCounts, setVerifiedCounts] = useState<Record<string, number>>({});

  // Add editor dialog
  const [addOpen, setAddOpen] = useState(false);
  const [promoteUserId, setPromoteUserId] = useState('');

  // Assign student dialog
  const [assignEditorId, setAssignEditorId] = useState<string | null>(null);
  const [assignStudentId, setAssignStudentId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [editorsRes, studentsRes, permsRes, usersRes, verifiedRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, role').eq('role', 'editor' as any),
      supabase.from('profiles').select('user_id, full_name').eq('role', 'student' as any),
      supabase.from('editor_permissions').select('*'),
      supabase.from('profiles').select('user_id, full_name, role'),
      (supabase as any).from('referrals').select('owner_editor_id, id').eq('verified_by_admin', true),
    ]);
    setEditors((editorsRes.data || []) as EditorProfile[]);
    setAllStudents((studentsRes.data || []) as StudentProfile[]);
    setPermissions((permsRes.data || []) as EditorPerm[]);
    const nonEditorNonAdmin = (usersRes.data || []).filter(
      (u: any) => u.role === 'student'
    );
    setAllUsers(nonEditorNonAdmin as StudentProfile[]);
    const counts: Record<string, number> = {};
    for (const ref of (verifiedRes.data || []) as any[]) {
      counts[ref.owner_editor_id] = (counts[ref.owner_editor_id] || 0) + 1;
    }
    setVerifiedCounts(counts);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const editorPerms = (editorId: string) =>
    permissions.filter(p => p.editor_user_id === editorId);

  const removeAssignment = async (permId: string) => {
    const { error } = await supabase.from('editor_permissions').delete().eq('id', permId);
    if (!error) {
      toast({ title: 'Assignment removed' });
      fetchData();
    }
  };

  const togglePermission = async (perm: EditorPerm, field: keyof EditorPerm) => {
    const { error } = await supabase
      .from('editor_permissions')
      .update({ [field]: !(perm as any)[field] } as any)
      .eq('id', perm.id);
    if (!error) fetchData();
  };

  const promoteToEditor = async () => {
    if (!promoteUserId) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'editor' as any })
      .eq('user_id', promoteUserId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User promoted to Editor' });
      setAddOpen(false);
      setPromoteUserId('');
      fetchData();
    }
    setSaving(false);
  };

  const demoteEditor = async (editorUserId: string) => {
    setSaving(true);
    await supabase.from('editor_permissions').delete().eq('editor_user_id', editorUserId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'student' as any })
      .eq('user_id', editorUserId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Editor removed and reverted to student' });
      fetchData();
    }
    setSaving(false);
  };

  const assignStudent = async () => {
    if (!assignEditorId || !assignStudentId) return;
    setSaving(true);
    const { error } = await supabase.from('editor_permissions').insert({
      editor_user_id: assignEditorId,
      student_user_id: assignStudentId,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Student assigned' });
      setAssignEditorId(null);
      setAssignStudentId('');
      fetchData();
    }
    setSaving(false);
  };

  const getStudentName = (id: string) =>
    allStudents.find(s => s.user_id === id)?.full_name || 'Unknown';

  return (
    <Layout>
      <div className="px-4 py-5 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold">Manage Editors</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add editors, assign students, and control permissions
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)} size="sm" className="h-9 px-3 text-xs gap-1.5 shrink-0">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Editor</span>
          </Button>
        </div>

        {/* Loading state */}
        {loading ? (
          <InlineLoader />
        ) : editors.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">No editors yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add your first editor to get started.</p>
          </div>
        ) : (
          /* Editor list */
          <div className="space-y-2">
            {editors.map(editor => {
              const perms = editorPerms(editor.user_id);
              const verifiedCount = verifiedCounts[editor.user_id] || 0;
              const isExpanded = expandedEditor === editor.user_id;

              return (
                <div key={editor.user_id} className="border rounded-lg overflow-hidden">
                  {/* Editor header row */}
                  <button
                    type="button"
                    onClick={() => setExpandedEditor(isExpanded ? null : editor.user_id)}
                    className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {editor.full_name?.charAt(0)?.toUpperCase() || 'E'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{editor.full_name || 'Editor'}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {perms.length} student{perms.length !== 1 ? 's' : ''}
                          {verifiedCount > 0 && (
                            <span className="text-green-600 font-medium ml-1.5">
                              · {verifiedCount} verified
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={e => { e.stopPropagation(); window.location.assign(`/admin/editors/${editor.user_id}`); }}
                      >
                        Profile
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t bg-muted/10">
                      {/* Students list */}
                      <div className="px-3.5 py-2.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Assigned Students
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs gap-1"
                            onClick={() => { setAssignEditorId(editor.user_id); setAssignStudentId(''); }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </Button>
                        </div>

                        {perms.length === 0 ? (
                          <p className="text-xs text-muted-foreground/60 text-center py-3">
                            No students assigned yet
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {perms.map(perm => (
                              <div key={perm.id} className="border rounded-md px-3 py-2 bg-background">
                                {/* Student name + remove */}
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium truncate">
                                    {getStudentName(perm.student_user_id)}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                    onClick={() => removeAssignment(perm.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                {/* Permission toggles */}
                                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                                  {PERMISSION_FIELDS.map(field => (
                                    <label
                                      key={field}
                                      className="flex items-center gap-1.5 cursor-pointer py-0.5"
                                    >
                                      <Switch
                                        checked={(perm as any)[field]}
                                        onCheckedChange={() => togglePermission(perm, field)}
                                        className="data-[state=checked]:bg-primary"
                                      />
                                      <span className="text-xs text-muted-foreground select-none">
                                        {PERMISSION_LABELS[field]}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Remove editor */}
                      <div className="px-3.5 py-2 border-t flex justify-end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive gap-1">
                              <UserMinus className="h-3.5 w-3.5" />
                              Remove Editor
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-sm">Remove Editor</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs">
                                Revoke {editor.full_name || 'this editor'}'s access and revert them to a student role. This will also remove all student assignments.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => demoteEditor(editor.user_id)}
                                className="h-9 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Editor Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Editor</DialogTitle>
              <DialogDescription>
                Select a user to promote to editor role.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Command className="border rounded-md">
                <CommandInput placeholder="Search users..." className="h-9 text-sm" />
                <CommandList>
                  <CommandEmpty className="text-xs py-6 text-center text-muted-foreground">
                    No users found.
                  </CommandEmpty>
                  <CommandGroup>
                    {allUsers.filter(u => !editors.some(e => e.user_id === u.user_id)).map(u => (
                      <CommandItem
                        key={u.user_id}
                        value={u.full_name || u.user_id}
                        onSelect={() => setPromoteUserId(u.user_id)}
                        className="text-sm h-9"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="h-5 w-5 rounded-full border flex items-center justify-center">
                            {promoteUserId === u.user_id && <Check className="h-3 w-3 text-primary" />}
                          </div>
                          {u.full_name || u.user_id}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setAddOpen(false); setPromoteUserId(''); }} className="text-xs h-9">
                Cancel
              </Button>
              <Button
                onClick={promoteToEditor}
                disabled={!promoteUserId || saving}
                className="text-xs h-9 gap-1.5"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Promote to Editor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Student Dialog */}
        <Dialog open={!!assignEditorId} onOpenChange={open => { if (!open) setAssignEditorId(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Student</DialogTitle>
              <DialogDescription>
                Choose a student to assign to this editor.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Command className="border rounded-md">
                <CommandInput placeholder="Search students..." className="h-9 text-sm" />
                <CommandList>
                  <CommandEmpty className="text-xs py-6 text-center text-muted-foreground">
                    No students found.
                  </CommandEmpty>
                  <CommandGroup>
                    {assignEditorId && (() => {
                      const editorId = assignEditorId;
                      return allStudents.filter(s => !editorPerms(editorId).some(p => p.student_user_id === s.user_id));
                    })()
                      .map(s => (
                        <CommandItem
                          key={s.user_id}
                          value={s.full_name || s.user_id}
                          onSelect={() => setAssignStudentId(s.user_id)}
                          className="text-sm h-9"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div className="h-5 w-5 rounded-full border flex items-center justify-center">
                              {assignStudentId === s.user_id && <Check className="h-3 w-3 text-primary" />}
                            </div>
                            {s.full_name || s.user_id}
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setAssignEditorId(null); setAssignStudentId(''); }} className="text-xs h-9">
                Cancel
              </Button>
              <Button
                onClick={assignStudent}
                disabled={!assignStudentId || saving}
                className="text-xs h-9 gap-1.5"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
