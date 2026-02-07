import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ExternalLink, 
  Copy, 
  Eye, 
  EyeOff, 
  Save, 
  Loader2,
  Link as LinkIcon,
  Key,
  User,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  GraduationCap,
  Building,
  CheckCircle
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
  application_start_date?: string | null;
  application_end_date?: string | null;
  notes?: string | null;
  german_requirement?: string | null;
  ielts_requirement?: string | null;
  fees_eur?: string | null;
  application_method?: string | null;
}

interface ApplicationCredentialsCardProps {
  application: Application;
  onUpdate: () => void;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'Applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
];

export default function ApplicationCredentialsCard({ application, onUpdate }: ApplicationCredentialsCardProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Application details state
  const [universityName, setUniversityName] = useState(application.university_name || '');
  const [programName, setProgramName] = useState(application.program_name || '');
  const [status, setStatus] = useState(application.status || 'draft');
  const [applicationStartDate, setApplicationStartDate] = useState(application.application_start_date || '');
  const [applicationEndDate, setApplicationEndDate] = useState(application.application_end_date || '');
  const [notes, setNotes] = useState(application.notes || '');
  const [germanRequirement, setGermanRequirement] = useState(application.german_requirement || '');
  const [ieltsRequirement, setIeltsRequirement] = useState(application.ielts_requirement || '');
  const [feesEur, setFeesEur] = useState(application.fees_eur || '');
  const [applicationMethod, setApplicationMethod] = useState(application.application_method || '');
  
  // Credentials state
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
          university_name: universityName,
          program_name: programName,
          status: status,
          application_start_date: applicationStartDate || null,
          application_end_date: applicationEndDate || null,
          notes: notes || null,
          german_requirement: germanRequirement || null,
          ielts_requirement: ieltsRequirement || null,
          fees_eur: feesEur || null,
          application_method: applicationMethod || null,
          portal_link: portalLink || null,
          portal_login_id: loginId || null,
          portal_password: password || null,
          show_credentials_to_student: showToStudent,
        })
        .eq('id', application.id);

      if (error) throw error;
      
      toast({ title: 'Saved!', description: 'Application updated successfully' });
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

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'offer': return 'default';
      case 'interview': 
      case 'submitted':
      case 'Applied': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const isSubmitted = ['submitted', 'Applied'].includes(status);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <div 
        className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isSubmitted && (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              )}
              <h4 className="font-medium truncate">{application.university_name}</h4>
            </div>
            <p className="text-sm text-muted-foreground truncate">{application.program_name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Applied: {new Date(application.created_at).toLocaleDateString()}
              {application.application_end_date && (
                <span className="ml-2">• Deadline: {new Date(application.application_end_date).toLocaleDateString()}</span>
              )}
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
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Edit Section */}
      {isExpanded && (
        <div className="border-t p-4 bg-muted/20 space-y-4">
          {/* Application Details Section */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Application Details
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* University Name */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  University Name
                </Label>
                <Input
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  placeholder="University name"
                  className="text-sm h-9"
                />
              </div>

              {/* Program Name */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Program Name
                </Label>
                <Input
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="M.Sc. Computer Science"
                  className="text-sm h-9"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Application Method */}
              <div className="space-y-1.5">
                <Label className="text-xs">Application Method</Label>
                <Input
                  value={applicationMethod}
                  onChange={(e) => setApplicationMethod(e.target.value)}
                  placeholder="uni-assist, direct, etc."
                  className="text-sm h-9"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Application Start Date
                </Label>
                <Input
                  type="date"
                  value={applicationStartDate}
                  onChange={(e) => setApplicationStartDate(e.target.value)}
                  className="text-sm h-9"
                />
              </div>

              {/* End Date / Deadline */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Application Deadline
                </Label>
                <Input
                  type="date"
                  value={applicationEndDate}
                  onChange={(e) => setApplicationEndDate(e.target.value)}
                  className="text-sm h-9"
                />
              </div>

              {/* German Requirement */}
              <div className="space-y-1.5">
                <Label className="text-xs">German Requirement</Label>
                <Input
                  value={germanRequirement}
                  onChange={(e) => setGermanRequirement(e.target.value)}
                  placeholder="B1, B2, C1, etc."
                  className="text-sm h-9"
                />
              </div>

              {/* IELTS Requirement */}
              <div className="space-y-1.5">
                <Label className="text-xs">IELTS/TOEFL Requirement</Label>
                <Input
                  value={ieltsRequirement}
                  onChange={(e) => setIeltsRequirement(e.target.value)}
                  placeholder="6.5, 7.0, etc."
                  className="text-sm h-9"
                />
              </div>

              {/* Fees */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Fees (EUR)</Label>
                <Input
                  value={feesEur}
                  onChange={(e) => setFeesEur(e.target.value)}
                  placeholder="0 or amount"
                  className="text-sm h-9"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this application..."
                className="text-sm min-h-[60px]"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t pt-4">
            <h5 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Key className="h-4 w-4" />
              Portal Credentials
            </h5>

            {/* Portal Link */}
            <div className="space-y-3">
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
            </div>
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
                Save Application
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
