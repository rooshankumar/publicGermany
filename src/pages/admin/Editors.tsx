import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import InlineLoader from '@/components/InlineLoader';
import { Plus, Loader2, Trash2, UserPlus, UserMinus, Check } from 'lucide-react';

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
  const [assignOpen, setAssignOpen] = useState<string | null>(null); // editor user_id or null
  const [addEditorOpen, setAddEditorOpen] = useState(false);
  const [selectedStudentToAssign, setSelectedStudentToAssign] = useState('');
  const [selectedUserToPromote, setSelectedUserToPromote] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifiedCounts, setVerifiedCounts] = useState<Record<string, number>>({});

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
    // Only show students (non-admin, non-editor) as candidates to promote
    const nonEditorNonAdmin = (usersRes.data || []).filter(
      (u: any) => u.role === 'student'
    );
    setAllUsers(nonEditorNonAdmin as StudentProfile[]);
    // Count verified referrals per editor
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
      <div className="p-3 max-w-5xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div><h1 className="text-base font-bold text-foreground">Manage Editors</h1><p className="text-[10px] text-muted-foreground">Add editors, assign students and control permissions</p></div>
          <Button onClick={() => setAddEditorOpen(v => !v)} size="sm" className="h-7 text-[11px]"><UserPlus className="h-3.5 w-3.5 mr-1" /> Add Editor</Button>
        </div>

        {/* Inline Add Editor */}
        {addEditorOpen && (
          <Card className="shadow-none border-primary/30">
            <CardContent className="p-3 space-y-2">
              <p className="text-[10px] font-semibold">Add New Editor</p>
              <Command className="border rounded-md">
                <CommandInput placeholder="Search users to promote to editor..." className="h-8 text-xs" />
                <CommandList>
                  <CommandEmpty className="text-xs py-4 text-center text-muted-foreground">No user found.</CommandEmpty>
                  <CommandGroup>
                    {allUsers.filter(u => !editors.some(e => e.user_id === u.user_id)).map(u => (
                      <CommandItem
                        key={u.user_id}
                        value={u.full_name || u.user_id}
                        onSelect={() => { setSelectedUserToPromote(u.user_id); }}
                        className="text-xs h-8"
                      >
                        <Check className={`mr-2 h-3 w-3 ${selectedUserToPromote === u.user_id ? 'opacity-100' : 'opacity-0'}`} />
                        {u.full_name || u.user_id}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
              <div className="flex gap-2">
                <Button onClick={promoteToEditor} disabled={!selectedUserToPromote || saving} size="sm" className="h-7 text-xs">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Promote to Editor
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setAddEditorOpen(false); setSelectedUserToPromote(''); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? <InlineLoader /> : editors.length === 0 ? (
          <Card><CardContent className="py-6 text-center"><p className="text-xs text-muted-foreground">No editors yet.</p></CardContent></Card>
        ) : (
          <div className="space-y-2">
            {editors.map(editor => {
              const perms = editorPerms(editor.user_id);
              const isAssigning = assignOpen === editor.user_id;
              const verifiedCount = verifiedCounts[editor.user_id] || 0;
              return (
                <Card key={editor.user_id} className="shadow-none">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/10 text-primary text-[10px]">{editor.full_name?.charAt(0) || 'E'}</AvatarFallback></Avatar>
                        <div><p className="text-[12px] font-semibold">{editor.full_name || 'Editor'}</p>
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                            <span>{perms.length} students</span>
                            {verifiedCount > 0 && <span className="text-green-600 font-medium">{verifiedCount} verified</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="secondary" className="h-6 text-[9px] px-2" onClick={() => window.location.assign(`/admin/editors/${editor.user_id}`)}>Profile</Button>
                        <Button size="sm" variant="outline" className="h-6 text-[9px] px-2" onClick={() => { setAssignOpen(isAssigning ? null : editor.user_id); setSelectedStudentToAssign(''); }}>
                          <Plus className="h-3 w-3 mr-0.5" /> Assign
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"><UserMinus className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle className="text-sm">Remove Editor</AlertDialogTitle><AlertDialogDescription className="text-xs">Revoke {editor.full_name || 'this editor'}'s access and revert to student.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="h-7 text-[11px]">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => demoteEditor(editor.user_id)} className="h-7 text-[11px]">Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Inline Assign Student */}
                    {isAssigning && (
                      <div className="border border-primary/20 rounded-md p-2 space-y-1.5 bg-muted/20">
                        <p className="text-[10px] font-medium">Assign student to {editor.full_name}</p>
                        <Command className="border rounded-md">
                          <CommandInput placeholder="Search students..." className="h-8 text-xs" />
                          <CommandList>
                            <CommandEmpty className="text-xs py-4 text-center text-muted-foreground">No student found.</CommandEmpty>
                            <CommandGroup>
                              {allStudents.filter(s => !editorPerms(editor.user_id).some(p => p.student_user_id === s.user_id)).map(s => (
                                <CommandItem
                                  key={s.user_id}
                                  value={s.full_name || s.user_id}
                                  onSelect={() => { setSelectedStudentToAssign(s.user_id); }}
                                  className="text-xs h-8"
                                >
                                  <Check className={`mr-2 h-3 w-3 ${selectedStudentToAssign === s.user_id ? 'opacity-100' : 'opacity-0'}`} />
                                  {s.full_name || s.user_id}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs" onClick={() => {
                            if (!selectedStudentToAssign) { toast({ title: 'Select a student', variant: 'destructive' }); return; }
                            setSaving(true);
                            supabase.from('editor_permissions').insert({ editor_user_id: editor.user_id, student_user_id: selectedStudentToAssign })
                              .then(({ error }) => {
                                if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
                                else { toast({ title: 'Student assigned' }); setAssignOpen(null); setSelectedStudentToAssign(''); fetchData(); }
                                setSaving(false);
                              });
                          }} disabled={saving}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Assign
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setAssignOpen(null); setSelectedStudentToAssign(''); }}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {perms.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-1">No students assigned</p>
                    ) : (
                      <div className="space-y-1">
                        {perms.map(perm => (
                          <div key={perm.id} className="border rounded p-1.5 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-medium">{getStudentName(perm.student_user_id)}</p>
                              <Button size="sm" variant="ghost" className="h-5 p-0 text-destructive" onClick={() => removeAssignment(perm.id)}><Trash2 className="h-2.5 w-2.5" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {(['can_view_profile','can_view_documents','can_view_applications','can_view_payments','can_view_contracts'] as const).map(field => (
                                <div key={field} className="flex items-center gap-0.5">
                                  <Switch checked={(perm as any)[field]} onCheckedChange={() => togglePermission(perm, field)} className="scale-[0.55]" />
                                  <Label className="text-[8px] cursor-pointer capitalize">{field.replace('can_view_', '')}</Label>
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

      </div>
    </Layout>
  );
}
