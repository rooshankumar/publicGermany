import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import InlineLoader from '@/components/InlineLoader';
import { Plus, Loader2, Trash2, UserPlus, UserMinus } from 'lucide-react';

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

export default function Editors() {
  const { toast } = useToast();
  const [editors, setEditors] = useState<EditorProfile[]>([]);
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
  const [allUsers, setAllUsers] = useState<StudentProfile[]>([]);
  const [permissions, setPermissions] = useState<EditorPerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEditor, setSelectedEditor] = useState<EditorProfile | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [addEditorDialogOpen, setAddEditorDialogOpen] = useState(false);
  const [selectedStudentToAssign, setSelectedStudentToAssign] = useState('');
  const [selectedUserToPromote, setSelectedUserToPromote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [editorsRes, studentsRes, permsRes, usersRes] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, role').eq('role', 'editor' as any),
      supabase.from('profiles').select('user_id, full_name').eq('role', 'student' as any),
      supabase.from('editor_permissions').select('*'),
      supabase.from('profiles').select('user_id, full_name, role'),
    ]);
    setEditors((editorsRes.data || []) as EditorProfile[]);
    setAllStudents((studentsRes.data || []) as StudentProfile[]);
    setPermissions((permsRes.data || []) as EditorPerm[]);
    // Only show students (non-admin, non-editor) as candidates to promote
    const nonEditorNonAdmin = (usersRes.data || []).filter(
      (u: any) => u.role === 'student'
    );
    setAllUsers(nonEditorNonAdmin as StudentProfile[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const editorPerms = (editorId: string) =>
    permissions.filter(p => p.editor_user_id === editorId);

  const assignStudent = async () => {
    if (!selectedEditor || !selectedStudentToAssign) return;
    setSaving(true);
    const { error } = await supabase.from('editor_permissions').insert({
      editor_user_id: selectedEditor.user_id,
      student_user_id: selectedStudentToAssign,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Student assigned' });
      setAssignDialogOpen(false);
      setSelectedStudentToAssign('');
      fetchData();
    }
    setSaving(false);
  };

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
    if (!selectedUserToPromote) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'editor' as any })
      .eq('user_id', selectedUserToPromote);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User promoted to Editor' });
      setAddEditorDialogOpen(false);
      setSelectedUserToPromote('');
      fetchData();
    }
    setSaving(false);
  };

  const demoteEditor = async (editorUserId: string) => {
    setSaving(true);
    // First remove all their permissions
    await supabase.from('editor_permissions').delete().eq('editor_user_id', editorUserId);
    // Then change role back to student
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

  const getStudentName = (id: string) =>
    allStudents.find(s => s.user_id === id)?.full_name || 'Unknown';

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Editors</h1>
            <p className="text-sm text-muted-foreground">Add editors, assign students and control permissions</p>
          </div>
          <Button onClick={() => setAddEditorDialogOpen(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-1" /> Add Editor
          </Button>
        </div>

        {loading ? <InlineLoader /> : editors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <p className="text-muted-foreground text-sm">No editors yet. Click "Add Editor" to promote a student to editor role.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {editors.map(editor => {
              const perms = editorPerms(editor.user_id);
              return (
                <Card key={editor.user_id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {editor.full_name?.charAt(0) || 'E'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{editor.full_name || 'Editor'}</CardTitle>
                          <p className="text-xs text-muted-foreground">Editor · {perms.length} students</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedEditor(editor);
                          setAssignDialogOpen(true);
                        }}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Assign Student
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive h-8 px-2">
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Editor</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will revoke {editor.full_name || 'this editor'}'s editor access, remove all student assignments, and revert them to a student account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => demoteEditor(editor.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Remove Editor
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {perms.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No students assigned</p>
                    ) : (
                      <div className="space-y-3">
                        {perms.map(perm => (
                          <div key={perm.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{getStudentName(perm.student_user_id)}</p>
                              <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => removeAssignment(perm.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                              {(['can_view_profile', 'can_view_documents', 'can_view_applications', 'can_view_payments', 'can_view_contracts'] as const).map(field => (
                                <div key={field} className="flex items-center gap-1.5">
                                  <Switch
                                    checked={(perm as any)[field]}
                                    onCheckedChange={() => togglePermission(perm, field)}
                                    className="scale-75"
                                  />
                                  <Label className="text-xs capitalize cursor-pointer">
                                    {field.replace('can_view_', '')}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Assign Student Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Student to {selectedEditor?.full_name}</DialogTitle>
              <DialogDescription>Select a student to assign to this editor.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Select value={selectedStudentToAssign} onValueChange={setSelectedStudentToAssign}>
                <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
                <SelectContent>
                  {allStudents
                    .filter(s => !editorPerms(selectedEditor?.user_id || '').some(p => p.student_user_id === s.user_id))
                    .map(s => (
                      <SelectItem key={s.user_id} value={s.user_id}>{s.full_name || s.user_id}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={assignStudent} disabled={!selectedStudentToAssign || saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Assign
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add New Editor Dialog */}
        <Dialog open={addEditorDialogOpen} onOpenChange={setAddEditorDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Editor</DialogTitle>
              <DialogDescription>Promote a student account to editor role. They'll get their own editor dashboard.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Select value={selectedUserToPromote} onValueChange={setSelectedUserToPromote}>
                <SelectTrigger><SelectValue placeholder="Select a user to promote" /></SelectTrigger>
                <SelectContent>
                  {allUsers
                    .filter(u => !editors.some(e => e.user_id === u.user_id))
                    .map(u => (
                      <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || u.user_id}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={promoteToEditor} disabled={!selectedUserToPromote || saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Promote to Editor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
