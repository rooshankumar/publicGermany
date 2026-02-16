import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Download, FileText, Info, TrendingUp, Target, BookOpen } from 'lucide-react';
import { evaluateEligibility, type ProfileInput, type EvaluationResult } from '@/lib/eligibilityEngine';
import { generateEligibilityPDFHTML } from '@/lib/eligibilityPDFTemplate';

const statusIcon = (s: string) => {
  if (s === 'pass') return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
  if (s === 'warn') return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
  if (s === 'fail') return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
  return <Info className="h-4 w-4 text-muted-foreground shrink-0" />;
};

const statusBadge = (s: string) => {
  if (s === 'pass') return <Badge variant="default" className="text-[10px]">Pass</Badge>;
  if (s === 'fail') return <Badge variant="destructive" className="text-[10px]">Fail</Badge>;
  if (s === 'warn') return <Badge variant="secondary" className="text-[10px]">Attention</Badge>;
  return <Badge variant="outline" className="text-[10px]">Info</Badge>;
};

export default function EligibilityEvaluation({ profile }: { profile: ProfileInput }) {
  const [showResults, setShowResults] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const result: EvaluationResult = evaluateEligibility(profile);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const html = generateEligibilityPDFHTML(profile, result);
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.position = 'absolute';
      container.style.left = '0';
      container.style.top = '-10000px';
      container.style.width = '210mm';
      container.style.backgroundColor = '#fff';
      document.body.appendChild(container);

      await new Promise(r => setTimeout(r, 800));
      const images = container.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img =>
        new Promise<void>(resolve => {
          if (img.complete) resolve();
          else { img.onload = () => resolve(); img.onerror = () => resolve(); }
        })
      ));

      const canvas = await html2canvas(container, {
        scale: 2, useCORS: true, allowTaint: true,
        width: container.scrollWidth, height: container.scrollHeight,
      });

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = 210;
      const pageH = 297;
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = 0;
      let page = 0;

      while (y < imgH) {
        if (page > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, -y, imgW, imgH);
        y += pageH;
        page++;
      }

      pdf.save(`Eligibility_Report_${(profile.full_name || 'Student').replace(/\s+/g, '_')}.pdf`);
      document.body.removeChild(container);
    } catch (e) {
      console.error('PDF generation error:', e);
    } finally {
      setDownloading(false);
    }
  };

  const strengthColor = result.profileStrengthScore >= 85 ? 'text-green-600' :
    result.profileStrengthScore >= 70 ? 'text-lime-600' :
    result.profileStrengthScore >= 55 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Eligibility Evaluation
            </CardTitle>
            <CardDescription>Professional academic screening for German universities</CardDescription>
          </div>
          {!showResults ? (
            <Button onClick={() => setShowResults(true)} size="sm">Check Eligibility</Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleDownloadPDF} disabled={downloading}>
                <Download className="h-4 w-4 mr-1" />
                {downloading ? 'Generating…' : 'Download PDF'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowResults(false)}>Hide</Button>
            </div>
          )}
        </div>
      </CardHeader>

      {showResults && (
        <CardContent className="space-y-5">
          {/* Overall Status */}
          <div className={`p-4 rounded-lg border ${
            result.overallStatus === 'eligible' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' :
            result.overallStatus === 'conditional' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' :
            'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {result.overallStatus === 'eligible' && <CheckCircle className="h-5 w-5 text-green-600" />}
                {result.overallStatus === 'conditional' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                {result.overallStatus === 'needs-improvement' && <XCircle className="h-5 w-5 text-red-600" />}
                <span className="font-semibold text-sm">{result.preliminaryStatus}</span>
              </div>
              <Badge variant="outline" className="text-xs" style={{ color: result.admissionProbabilityColor, borderColor: result.admissionProbabilityColor }}>
                Admission Probability: {result.admissionProbability}
              </Badge>
            </div>
          </div>

          {/* German Grade Conversion */}
          {result.gradeConversion && (
            <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
              <div className="text-center px-4 py-2 border-2 rounded-lg" style={{ borderColor: result.gradeConversion.classificationColor }}>
                <div className="text-2xl font-bold" style={{ color: result.gradeConversion.classificationColor }}>
                  {result.gradeConversion.germanGrade.toFixed(2)}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">German Grade</div>
              </div>
              <div className="space-y-1">
                <p className="text-sm"><strong>Original:</strong> {result.gradeConversion.originalValue}</p>
                <p className="text-sm">
                  <strong>Classification:</strong>{' '}
                  <span className="font-semibold" style={{ color: result.gradeConversion.classificationColor }}>
                    {result.gradeConversion.classification}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">Modified Bavarian Formula</p>
              </div>
            </div>
          )}

          {/* Profile Strength Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Profile Strength Index</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${strengthColor}`}>{result.profileStrengthScore}%</span>
                <Badge variant="outline" className="text-[10px]">{result.profileStrengthLabel}</Badge>
              </div>
            </div>
            <Progress value={result.profileStrengthScore} className="h-3" />
          </div>

          {/* Score Breakdown */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Score Breakdown</span>
            </div>
            {result.scoreParameters.map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 text-sm">
                <span className="w-40 truncate text-muted-foreground">{p.label} ({(p.weight * 100).toFixed(0)}%)</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${p.score * 10}%`,
                      backgroundColor: p.score >= 7 ? '#16a34a' : p.score >= 5 ? '#d97706' : '#dc2626',
                    }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">{p.score}/10</span>
              </div>
            ))}
          </div>

          {/* Academic Core Checks */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Academic Core Checks</span>
            </div>
            {result.hardChecks.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 border rounded-lg">
                {statusIcon(c.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.detail}</p>
                </div>
                {statusBadge(c.status)}
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800 space-y-2">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">📌 Improvement Recommendations</p>
              {result.recommendations.map((r, i) => (
                <p key={i} className="text-xs text-blue-700 dark:text-blue-400 pl-4">
                  {i + 1}. {r}
                </p>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[11px] text-muted-foreground text-center">
            This assessment is based on publicly available admission regulations and the information provided.
            Final admission decisions are made solely by the respective universities.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
