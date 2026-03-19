/**
 * Professional Eligibility Evaluation PDF Template
 * Matches contract/payment bill quality with publicgermany branding
 */

import type { EvaluationResult, ProfileInput } from './eligibilityEngine';
import { format } from 'date-fns';

const LOGO_URL = 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/avatars/logo.png';

function statusIcon(status: string): string {
  if (status === 'pass') return '✔';
  if (status === 'fail') return '✘';
  if (status === 'warn') return '⚠';
  return 'ℹ';
}

function statusColor(status: string): string {
  if (status === 'pass') return '#16a34a';
  if (status === 'fail') return '#dc2626';
  if (status === 'warn') return '#d97706';
  return '#6b7280';
}

function overallBadge(result: EvaluationResult): { bg: string; border: string; text: string; label: string } {
  if (result.overallStatus === 'eligible') return { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46', label: 'Eligible' };
  if (result.overallStatus === 'conditional') return { bg: '#fef3c7', border: '#fcd34d', text: '#92400e', label: 'Conditional' };
  return { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', label: 'Needs Improvement' };
}

export function generateEligibilityPDFHTML(profile: ProfileInput, result: EvaluationResult): string {
  const evalDate = format(new Date(), 'MMMM d, yyyy');
  const badge = overallBadge(result);

  // Hard checks rows - Modern Table Style
  const hardCheckRows = result.hardChecks.map(c => `
    <tr>
      <td style="padding:10px 12px; border-bottom:1px solid #edf2f7; font-size:10px; font-weight:600; color:#2d3748;">${c.label}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #edf2f7; font-size:10px; text-align:center;">
        <span style="display:inline-block; padding:2px 8px; border-radius:4px; font-weight:700; font-size:9px; text-transform:uppercase; background:${c.status === 'pass' ? '#ebfbee' : c.status === 'fail' ? '#fff5f5' : '#fffaf0'}; color:${statusColor(c.status)};">
          ${c.status.toUpperCase()}
        </span>
      </td>
      <td style="padding:10px 12px; border-bottom:1px solid #edf2f7; font-size:10px; color:#4a5568;">${c.detail}</td>
    </tr>
  `).join('');

  // Score parameters rows - Modern Table Style
  const scoreRows = result.scoreParameters.map(p => {
    return `
    <tr>
      <td style="padding:10px 12px; border-bottom:1px solid #edf2f7; font-size:10px; font-weight:500; color:#2d3748;">${p.label}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #edf2f7; font-size:10px; text-align:center; color:#718096;">${(p.weight * 100).toFixed(0)}%</td>
      <td style="padding:10px 12px; border-bottom:1px solid #edf2f7; font-size:10px; text-align:center; font-weight:700; color:#2d3748;">${p.score}/10</td>
      <td style="padding:10px 12px; border-bottom:1px solid #edf2f7; font-size:10px; color:#718096;">${p.detail}</td>
    </tr>
    `;
  }).join('');

  // Recommendations - Modern Minimalist Bullets
  const recsHTML = result.recommendations.length > 0 ? `
    <div style="margin-top:8px; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
      ${result.recommendations.map(r => `
        <div style="font-size:10px; color:#4a5568; display:flex; align-items:flex-start; gap:6px;">
          <span style="color:#3182ce; font-weight:bold;">•</span>
          <span>${r}</span>
        </div>
      `).join('')}
    </div>
  ` : '<div style="font-size:10px; color:#a0aec0;">No immediate action items required.</div>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Evaluation — ${profile.full_name || 'Student'}</title>
<style>
  @page { size: A4; margin: 0; }
  @media print { body { -webkit-print-color-adjust: exact; } }
  body { 
    font-family: "Inter", "Helvetica", "Arial", sans-serif; 
    margin: 0; padding: 40px; 
    font-size: 11px; color: #1a202c; 
    background: #fff; line-height: 1.5;
  }
  .container { max-width: 100%; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
  .brand { color: #2b6cb0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .report-meta { text-align: right; color: #718096; font-size: 9px; line-height: 1.4; }
  
  .section { margin-bottom: 25px; }
  .section-title { 
    font-size: 11px; font-weight: 800; color: #2d3748; 
    text-transform: uppercase; letter-spacing: 1px; 
    margin-bottom: 12px; display: flex; align-items: center; gap: 10px;
  }
  .section-title::after { content: ""; flex: 1; height: 1px; background: #e2e8f0; }

  .profile-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; background: #f7fafc; padding: 15px; border-radius: 8px; border: 1px solid #edf2f7; }
  .profile-item { display: flex; flex-direction: column; gap: 2px; }
  .label { font-size: 8px; font-weight: 700; color: #a0aec0; text-transform: uppercase; }
  .value { font-size: 10px; font-weight: 600; color: #2d3748; }

  .status-card { 
    background: #fff; border: 2px solid #edf2f7; border-radius: 10px; padding: 20px; 
    margin: 20px 0; display: flex; justify-content: space-between; align-items: center;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  .status-primary { font-size: 14px; font-weight: 800; color: #2d3748; }
  .probability-badge { font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 20px; }

  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 9px; font-weight: 700; color: #a0aec0; text-transform: uppercase; padding: 8px 12px; border-bottom: 2px solid #edf2f7; }
  
  .grade-summary { display: flex; gap: 30px; align-items: center; padding: 15px; background: #f7fafc; border-radius: 8px; border: 1px solid #edf2f7; }
  .grade-val-large { font-size: 32px; font-weight: 900; color: #2b6cb0; line-height: 1; }
  
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #edf2f7; display: flex; justify-content: space-between; font-size: 9px; color: #a0aec0; }
  .disclaimer { font-size: 8px; color: #cbd5e0; line-height: 1.6; margin-top: 20px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="brand">publicgermany</div>
        <div style="font-size:10px; color:#4a5568; font-weight:600; margin-top:2px;">Academic Eligibility Assessment</div>
      </div>
      <div class="report-meta">
        <strong>REPORT ID:</strong> PG-${Math.random().toString(36).substring(2, 8).toUpperCase()}<br>
        <strong>DATE:</strong> ${evalDate}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Candidate Snapshot</div>
      <div class="profile-grid">
        <div class="profile-item"><span class="label">Name</span><span class="value">${(profile.full_name || 'N/A')}</span></div>
        <div class="profile-item"><span class="label">University</span><span class="value">${(profile.university_name || 'N/A')}</span></div>
        <div class="profile-item"><span class="label">Degree</span><span class="value">${(profile.bachelor_degree_name || 'N/A')}</span></div>
        <div class="profile-item"><span class="label">Field of Study</span><span class="value">${(profile.bachelor_field || 'N/A')}</span></div>
        <div class="profile-item"><span class="label">Intended Master</span><span class="value">${(profile.intended_master_course || 'N/A')}</span></div>
        <div class="profile-item"><span class="label">Target Intake</span><span class="value">${(profile.intake || 'N/A')}</span></div>
      </div>
    </div>

    <div class="status-card" style="border-left: 5px solid ${badge.border};">
      <div>
        <div class="label">Evaluation Verdict</div>
        <div class="status-primary">${result.preliminaryStatus}</div>
      </div>
      <div class="probability-badge" style="background:${badge.bg}; color:${badge.text}; border: 1px solid ${badge.border};">
        ADMISSION PROBABILITY: ${result.admissionProbability.toUpperCase()}
      </div>
    </div>

    <div class="section">
      <div class="section-title">1. Academic Core Compliance</div>
      <table>
        <thead>
          <tr><th style="width:30%;">Requirement</th><th style="width:15%; text-align:center;">Status</th><th>Findings</th></tr>
        </thead>
        <tbody>${hardCheckRows}</tbody>
      </table>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px;">
      <div class="section" style="margin-bottom:0;">
        <div class="section-title">2. Grade Analysis</div>
        <div class="grade-summary">
          <div class="grade-val-large" style="color:${result.gradeConversion?.classificationColor || '#2b6cb0'};">
            ${result.gradeConversion?.germanGrade.toFixed(2) || 'N/A'}
          </div>
          <div>
            <div class="label">German Grade Conversion</div>
            <div style="font-size:12px; font-weight:700; color:${result.gradeConversion?.classificationColor || '#2d3748'};">
              ${(result.gradeConversion?.classification || 'N/A').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div class="section" style="margin-bottom:0;">
        <div class="section-title">3. Profile Strength (${result.profileStrengthScore}/100)</div>
        <table>
          <thead>
            <tr><th style="padding-left:0;">Metric</th><th style="text-align:center;">Wgt</th><th style="text-align:center;">Score</th></tr>
          </thead>
          <tbody>
            ${result.scoreParameters.map(p => `
              <tr>
                <td style="padding:6px 0; border-bottom:1px solid #edf2f7; font-size:10px; color:#2d3748;">${p.label}</td>
                <td style="padding:6px 0; border-bottom:1px solid #edf2f7; font-size:10px; text-align:center; color:#a0aec0;">${(p.weight * 100).toFixed(0)}%</td>
                <td style="padding:6px 0; border-bottom:1px solid #edf2f7; font-size:10px; text-align:center; font-weight:700; color:#2d3748;">${p.score}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">4. Strategic Recommendations</div>
      <div style="padding:15px; background:#f7fafc; border-radius:8px; border:1px solid #edf2f7;">
        ${recsHTML}
        <div style="margin-top:15px; padding-top:10px; border-top:1px dashed #e2e8f0; font-size:9px; color:#718096; font-style:italic;">
          <strong>Pro-Tip:</strong> Upgrade to our Premium Evaluation for a detailed university list and 1-on-1 strategy call.
        </div>
      </div>
    </div>

    <div class="disclaimer">
      <strong>Disclaimer:</strong> This automated assessment provides an advisory screening based on standard German admission regulations. Final decisions remain at the sole discretion of the respective university admission committees. This report is not a guarantee of admission.
    </div>

    <div class="footer">
      <div>© publicgermany Professional Screening v2.5</div>
      <div>publicgermany.com</div>
      <div>PAGE 1 OF 1</div>
    </div>
  </div>
</body>
</html>`;
}
