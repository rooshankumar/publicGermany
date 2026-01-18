import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ExternalLink, 
  Copy, 
  Eye, 
  EyeOff, 
  Save, 
  Loader2,
  Link as LinkIcon,
  Key,
  User
} from 'lucide-react';

interface Application {
  id: string;
  university_name: string;
  program_name: string;
  status: string;
  created_at: string;
  portal_link?: string | null;
  portal_login_id?: string | null;
  portal_password?: string | null;
  show_credentials_to_student?: boolean;
}

interface ApplicationCredentialsCardProps {
  application: Application;
  onUpdate: () => void;
}

export default function ApplicationCredentialsCard({ application, onUpdate }: ApplicationCredentialsCardProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [portalLink, setPortalLink] = useState(application.portal_link || '');
  const [loginId, setLoginId] = useState(application.portal_login_id || '');
  const [password, setPassword] = useState(application.portal_password || '');
  const [showToStudent, setShowToStudent] = useState(application.show_credentials_to_student || false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: `${label} copied to clipboard` });
    } catch {
      toast({ title: 'Error', description: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          portal_link: portalLink || null,
          portal_login_id: loginId || null,
          portal_password: password || null,
          show_credentials_to_student: showToStudent,
        })
        .eq('id', application.id);

      if (error) throw error;
      
      toast({ title: 'Saved!', description: 'Portal credentials updated' });
      onUpdate();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const hasCredentials = portalLink || loginId || password;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'offer': return 'default';
      case 'interview': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <div 
        className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium truncate">{application.university_name}</h4>
            <p className="text-sm text-muted-foreground truncate">{application.program_name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Applied: {new Date(application.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasCredentials && (
              <Badge variant="secondary" className="text-xs">
                <Key className="h-3 w-3 mr-1" />
                Credentials
              </Badge>
            )}
            <Badge variant={getStatusVariant(application.status)}>
              {application.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Expanded Credentials Section */}
      {isExpanded && (
        <div className="border-t p-4 bg-muted/20 space-y-4">
          {/* Portal Link */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              Portal Link
            </Label>
            <div className="flex gap-2">
              <Input
                value={portalLink}
                onChange={(e) => setPortalLink(e.target.value)}
                placeholder="https://uni-assist.de/portal..."
                className="text-sm h-9"
              />
              {portalLink && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(portalLink, '_blank');
                    }}
                    title="Open link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(portalLink, 'Portal link');
                    }}
                    title="Copy link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Login ID */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <User className="h-3 w-3" />
              Login ID
            </Label>
            <div className="flex gap-2">
              <Input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="student@email.com or username"
                className="text-sm h-9"
              />
              {loginId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(loginId, 'Login ID');
                  }}
                  title="Copy login ID"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Key className="h-3 w-3" />
              Password
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-sm h-9 pr-10"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-0 top-0 h-9 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {password && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(password, 'Password');
                  }}
                  title="Copy password"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Show to Student Toggle */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="space-y-0.5">
              <Label className="text-sm">Show to Student</Label>
              <p className="text-xs text-muted-foreground">
                Allow student to see these credentials
              </p>
            </div>
            <Switch
              checked={showToStudent}
              onCheckedChange={setShowToStudent}
            />
          </div>

          {/* Save Button */}
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            disabled={saving}
            className="w-full"
            size="sm"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Credentials
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
