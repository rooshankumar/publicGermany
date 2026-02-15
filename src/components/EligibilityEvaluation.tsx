import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Download, FileText } from 'lucide-react';

interface ProfileData {
  full_name?: string | null;
  class_12_marks?: string | null;
  bachelor_degree_name?: string | null;
  bachelor_field?: string | null;
  bachelor_cgpa_percentage?: string | null;
  bachelor_credits_ects?: number | null;
  bachelor_duration_years?: number | null;
  ielts_toefl_score?: string | null;
  german_level?: string | null;
  has_aps_certificate?: boolean | null;
  work_experience_years?: number | null;
  intended_master_course?: string | null;
}

interface EvalResult {
  label: string;
  status: 'pass' | 'fail' | 'warn';
  detail: string;
}

function evaluate(profile: ProfileData): EvalResult[] {
  const results: EvalResult[] = [];

  // 1. Class 12 marks
  const marks12 = parseFloat(profile.class_12_marks || '');
  if (marks12 >= 60) {
    results.push({ label: 'Class 12 Marks', status: 'pass', detail: `${marks12}% — Meets minimum requirement` });
  } else if (profile.class_12_marks) {
    results.push({ label: 'Class 12 Marks', status: marks12 >= 50 ? 'warn' : 'fail', detail: `${marks12}% — Most German universities require 60%+` });
  } else {
    results.push({ label: 'Class 12 Marks', status: 'warn', detail: 'Not provided — Please fill in your profile' });
  }

  // 2. Bachelor degree
  if (profile.bachelor_degree_name) {
    results.push({ label: "Bachelor's Degree", status: 'pass', detail: `${profile.bachelor_degree_name} in ${profile.bachelor_field || 'N/A'}` });
  } else {
    results.push({ label: "Bachelor's Degree", status: 'fail', detail: 'Not provided — Required for master applications' });
  }

  // 3. CGPA
  const cgpa = parseFloat(profile.bachelor_cgpa_percentage || '');
  if (cgpa) {
    if (cgpa >= 7 || cgpa >= 70) {
      results.push({ label: 'CGPA/Percentage', status: 'pass', detail: `${profile.bachelor_cgpa_percentage} — Competitive score` });
    } else if (cgpa >= 5.5 || cgpa >= 55) {
      results.push({ label: 'CGPA/Percentage', status: 'warn', detail: `${profile.bachelor_cgpa_percentage} — May limit university options` });
    } else {
      results.push({ label: 'CGPA/Percentage', status: 'fail', detail: `${profile.bachelor_cgpa_percentage} — Below typical requirements` });
    }
  } else {
    results.push({ label: 'CGPA/Percentage', status: 'warn', detail: 'Not provided' });
  }

  // 4. Duration & credits
  const duration = profile.bachelor_duration_years || 0;
  if (duration >= 4) {
    results.push({ label: 'Degree Duration', status: 'pass', detail: `${duration} years — Meets 4-year requirement` });
  } else if (duration === 3) {
    results.push({ label: 'Degree Duration', status: 'warn', detail: '3 years — Some universities may not accept. Consider APS STK pathway.' });
  } else {
    results.push({ label: 'Degree Duration', status: duration > 0 ? 'fail' : 'warn', detail: duration > 0 ? `${duration} years — Too short` : 'Not provided' });
  }

  // 5. English proficiency
  if (profile.ielts_toefl_score) {
    results.push({ label: 'English Proficiency', status: 'pass', detail: `Score: ${profile.ielts_toefl_score}` });
  } else {
    results.push({ label: 'English Proficiency', status: 'warn', detail: 'Not provided — IELTS 6.5+ or TOEFL 90+ typically required' });
  }

  // 6. German
  const germanOk = profile.german_level && !['none', ''].includes(profile.german_level);
  results.push({ label: 'German Language', status: germanOk ? 'pass' : 'warn', detail: germanOk ? `Level: ${profile.german_level?.toUpperCase()}` : 'None — Not required for many English programs but helpful for daily life' });

  // 7. APS
  if (profile.has_aps_certificate === true) {
    results.push({ label: 'APS Certificate', status: 'pass', detail: 'APS certificate obtained' });
  } else {
    results.push({ label: 'APS Certificate', status: 'fail', detail: 'APS certificate is mandatory for Indian students' });
  }

  return results;
}

function getOverallStatus(results: EvalResult[]): 'eligible' | 'conditional' | 'not-eligible' {
  const fails = results.filter(r => r.status === 'fail').length;
  const warns = results.filter(r => r.status === 'warn').length;
  if (fails >= 2) return 'not-eligible';
  if (fails >= 1 || warns >= 3) return 'conditional';
  return 'eligible';
}

function generatePDFContent(profile: ProfileData, results: EvalResult[], overall: string): string {
  const rows = results.map(r => 
    `<tr><td style="padding:8px;border:1px solid #ddd">${r.label}</td><td style="padding:8px;border:1px solid #ddd">${r.status === 'pass' ? '✅ Pass' : r.status === 'warn' ? '⚠️ Warning' : '❌ Fail'}</td><td style="padding:8px;border:1px solid #ddd">${r.detail}</td></tr>`
  ).join('');
  
  return `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <div style="text-align:center;margin-bottom:30px">
        <h1 style="color:#1a1a1a;margin-bottom:5px">Eligibility Evaluation Report</h1>
        <p style="color:#666">publicgermany — Study in Germany</p>
      </div>
      <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin-bottom:20px">
        <p><strong>Student:</strong> ${profile.full_name || 'N/A'}</p>
        <p><strong>Intended Course:</strong> ${profile.intended_master_course || 'N/A'}</p>
        <p><strong>Overall Status:</strong> <span style="color:${overall === 'eligible' ? '#16a34a' : overall === 'conditional' ? '#d97706' : '#dc2626'};font-weight:bold">${overall === 'eligible' ? 'Likely Eligible' : overall === 'conditional' ? 'Conditionally Eligible' : 'Needs Improvement'}</span></p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead><tr style="background:#f0f0f0"><th style="padding:8px;border:1px solid #ddd;text-align:left">Criteria</th><th style="padding:8px;border:1px solid #ddd;text-align:left">Result</th><th style="padding:8px;border:1px solid #ddd;text-align:left">Details</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="background:#f0f8ff;padding:15px;border-radius:8px;border-left:4px solid #3b82f6">
        <p style="margin:0;font-size:13px"><strong>Disclaimer:</strong> This is an automated preliminary assessment. Actual eligibility depends on specific university requirements. Contact publicgermany for detailed guidance.</p>
      </div>
    </div>
  `;
}

export default function EligibilityEvaluation({ profile }: { profile: ProfileData }) {
  const [showResults, setShowResults] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const results = evaluate(profile);
  const overall = getOverallStatus(results);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const html = generatePDFContent(profile, results, overall);
      const { default: html2pdf } = await import('html2pdf.js');
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);
      await html2pdf().from(container).set({
        margin: 10,
        filename: `Eligibility_Report_${(profile.full_name || 'Student').replace(/\s+/g, '_')}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();
      document.body.removeChild(container);
    } catch (e) {
      console.error('PDF generation error:', e);
    } finally {
      setDownloading(false);
    }
  };

  const statusIcon = (s: EvalResult['status']) => {
    if (s === 'pass') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (s === 'warn') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Quick Eligibility Check
            </CardTitle>
            <CardDescription>See if you meet the basic requirements for German universities</CardDescription>
          </div>
          {!showResults && (
            <Button onClick={() => setShowResults(true)} size="sm">
              Check Eligibility
            </Button>
          )}
        </div>
      </CardHeader>
      {showResults && (
        <CardContent className="space-y-4">
          {/* Overall status */}
          <div className={`p-4 rounded-lg border ${
            overall === 'eligible' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' :
            overall === 'conditional' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' :
            'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {overall === 'eligible' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {overall === 'conditional' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
              {overall === 'not-eligible' && <XCircle className="h-5 w-5 text-red-600" />}
              <span className="font-semibold">
                {overall === 'eligible' ? 'Likely Eligible' : overall === 'conditional' ? 'Conditionally Eligible — Complete your profile for accuracy' : 'Needs Improvement — Some criteria not met'}
              </span>
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                {statusIcon(r.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.detail}</p>
                </div>
                <Badge variant={r.status === 'pass' ? 'default' : r.status === 'warn' ? 'secondary' : 'destructive'} className="text-[10px]">
                  {r.status === 'pass' ? 'Pass' : r.status === 'warn' ? 'Check' : 'Fail'}
                </Badge>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={handleDownloadPDF} disabled={downloading}>
              <Download className="h-4 w-4 mr-1" />
              {downloading ? 'Generating…' : 'Download PDF Report'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowResults(false)}>
              Hide
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
