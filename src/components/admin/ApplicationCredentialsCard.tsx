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

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'offer':
        return 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50';
      case 'applied':
      case 'submitted':
        return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50';
      case 'interview':
        return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50';
      case 'draft':
        return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      default:
        return '';
    }
  };

  const isSubmitted = ['submitted', 'Applied'].includes(status);
  const isOffer = status.toLowerCase() === 'offer';

  return (
    <div className={`border rounded-lg overflow-hidden transition-all duration-200 ${isOffer ? 'border-orange-300 shadow-sm ring-1 ring-orange-200/50' : 'border-border'}`}>
      {/* Header - Always visible */}
      <div 
        className={`p-3 cursor-pointer transition-colors ${isOffer ? 'bg-orange-50/50 hover:bg-orange-100/50 dark:bg-orange-950/10' : 'hover:bg-muted/30'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
          <div className="min-w-0 flex-1 w-full">
            <div className="flex items-center gap-2">
              {isSubmitted && (
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              )}
              {isOffer && (
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0 animate-bounce-slow" />
              )}
              <h4 className={`font-semibold text-sm sm:text-base truncate ${isOffer ? 'text-orange-900 dark:text-orange-100' : 'text-foreground'}`}>{application.university_name}</h4>
            </div>
            <p className={`text-xs sm:text-sm truncate ${isOffer ? 'text-orange-700/80 dark:text-orange-300/80' : 'text-muted-foreground'}`}>{application.program_name}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] sm:text-xs text-muted-foreground">
              {application.application_start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Opens: {new Date(application.application_start_date).toLocaleDateString()}
                </span>
              )}
              {application.application_end_date && (
                <span className="flex items-center gap-1 text-orange-600 font-medium">
                  <Calendar className="h-3 w-3" />
                  Due: {new Date(application.application_end_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
            <div className="flex gap-2">
              {hasCredentials && (
                <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                  <Key className="h-2.5 w-2.5 mr-1" />
                  Creds
                </Badge>
              )}
              <Badge 
                variant={getStatusVariant(application.status)} 
                className={`text-[10px] px-1.5 h-5 capitalize border ${getStatusStyles(application.status)}`}
              >
                {application.status}
              </Badge>
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* University Name */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  University
                </Label>
                <Input
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  placeholder="University name"
                  className="text-sm h-8 px-2"
                />
              </div>

              {/* Program Name */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Program
                </Label>
                <Input
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="M.Sc. Computer Science"
                  className="text-sm h-8 px-2"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-8 text-sm px-2">
                    <SelectValue placeholder="Status" />
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
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Method</Label>
                <Input
                  value={applicationMethod}
                  onChange={(e) => setApplicationMethod(e.target.value)}
                  placeholder="uni-assist, direct, etc."
                  className="text-sm h-8 px-2"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Opens
                </Label>
                <Input
                  type="date"
                  value={applicationStartDate}
                  onChange={(e) => setApplicationStartDate(e.target.value)}
                  className="text-sm h-8 px-2"
                />
              </div>

              {/* End Date / Deadline */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Deadline
                </Label>
                <Input
                  type="date"
                  value={applicationEndDate}
                  onChange={(e) => setApplicationEndDate(e.target.value)}
                  className="text-sm h-8 px-2 font-medium text-orange-600"
                />
              </div>

              {/* Requirements Grid (Row) */}
              <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">German</Label>
                  <Input
                    value={germanRequirement}
                    onChange={(e) => setGermanRequirement(e.target.value)}
                    placeholder="B2/C1"
                    className="text-sm h-8 px-2"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">English</Label>
                  <Input
                    value={ieltsRequirement}
                    onChange={(e) => setIeltsRequirement(e.target.value)}
                    placeholder="6.5/7.0"
                    className="text-sm h-8 px-2"
                  />
                </div>
              </div>

              {/* Fees */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fees (EUR)</Label>
                <Input
                  value={feesEur}
                  onChange={(e) => setFeesEur(e.target.value)}
                  placeholder="0 or amount"
                  className="text-sm h-8 px-2"
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

          <div className="border-t pt-4 space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Key className="h-3.5 w-3.5" />
              Credentials
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Portal Link */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  Portal Link
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    value={portalLink}
                    onChange={(e) => setPortalLink(e.target.value)}
                    placeholder="https://..."
                    className="text-sm h-8 px-2 flex-1"
                  />
                  {portalLink && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => window.open(portalLink, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => copyToClipboard(portalLink, 'Link')}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Login ID */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Login ID
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="ID/Email"
                    className="text-sm h-8 px-2 flex-1"
                  />
                  {loginId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => copyToClipboard(loginId, 'ID')}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  Password
                </Label>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="text-sm h-8 px-2 pr-8"
                    />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {password && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => copyToClipboard(password, 'Password')}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg border border-dashed">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Show to Student</Label>
                <p className="text-[10px] text-muted-foreground leading-none">
                  Students can see these credentials
                </p>
              </div>
              <Switch
                checked={showToStudent}
                onCheckedChange={setShowToStudent}
                className="scale-75 origin-right"
              />
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
