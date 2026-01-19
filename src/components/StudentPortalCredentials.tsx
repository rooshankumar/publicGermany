import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, EyeOff, ExternalLink, Check, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PortalCredentialsProps {
  portalLink?: string | null;
  loginId?: string | null;
  password?: string | null;
  showCredentials?: boolean;
}

const StudentPortalCredentials = ({ 
  portalLink, 
  loginId, 
  password, 
  showCredentials 
}: PortalCredentialsProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  // Only show if admin has enabled credentials for this student
  if (!showCredentials || (!portalLink && !loginId && !password)) {
    return null;
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({ title: 'Copied!', description: `${field} copied to clipboard` });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to copy', variant: 'destructive' });
    }
  };

  return (
    <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-dashed">
      <div className="flex items-center gap-2 mb-2">
        <Key className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Portal Access</span>
      </div>
      
      <div className="space-y-2 text-sm">
        {portalLink && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Link:</span>
            <div className="flex items-center gap-1">
              <a 
                href={portalLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate max-w-[200px]"
              >
                {new URL(portalLink).hostname}
              </a>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6"
                onClick={() => copyToClipboard(portalLink, 'Link')}
              >
                {copiedField === 'Link' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6"
                asChild
              >
                <a href={portalLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        )}
        
        {loginId && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Login ID:</span>
            <div className="flex items-center gap-1">
              <code className="bg-background px-2 py-0.5 rounded text-xs">{loginId}</code>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6"
                onClick={() => copyToClipboard(loginId, 'Login ID')}
              >
                {copiedField === 'Login ID' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        )}
        
        {password && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Password:</span>
            <div className="flex items-center gap-1">
              <code className="bg-background px-2 py-0.5 rounded text-xs">
                {showPassword ? password : '••••••••'}
              </code>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6"
                onClick={() => copyToClipboard(password, 'Password')}
              >
                {copiedField === 'Password' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPortalCredentials;
