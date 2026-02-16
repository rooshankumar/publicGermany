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

  // Hard checks rows
  const hardCheckRows = result.hardChecks.map(c => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;">${c.label}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:${statusColor(c.status)};font-weight:600;">${statusIcon(c.status)} ${c.status === 'pass' ? 'Pass' : c.status === 'fail' ? 'Fail' : c.status === 'warn' ? 'Attention' : 'Info'}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;">${c.detail}</td>
    </tr>
  `).join('');

  // Score parameters rows
  const scoreRows = result.scoreParameters.map(p => {
    const pct = p.score * 10;
    const barColor = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
    return `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;">${p.label}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${(p.weight * 100).toFixed(0)}%</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${barColor};border-radius:4px;"></div>
          </div>
          <span style="font-weight:600;min-width:32px;text-align:right;">${p.score}/10</span>
        </div>
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;">${p.detail}</td>
    </tr>
    `;
  }).join('');

  // Recommendations
  const recsHTML = result.recommendations.map((r, i) => `
    <div style="display:flex;gap:8px;margin:6px 0;font-size:12px;">
      <span style="color:#1e3a8a;font-weight:700;">${i + 1}.</span>
      <span>${r}</span>
    </div>
  `).join('');

  // Grade section
  const gradeSection = result.gradeConversion ? `
    <div style="margin-top:14px;display:flex;gap:20px;align-items:center;">
      <div style="text-align:center;padding:12px 20px;border:2px solid ${result.gradeConversion.classificationColor};border-radius:8px;">
        <div style="font-size:28px;font-weight:700;color:${result.gradeConversion.classificationColor};">${result.gradeConversion.germanGrade.toFixed(2)}</div>
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">German Grade</div>
      </div>
      <div>
        <div style="font-size:13px;"><strong>Original CGPA/Percentage:</strong> ${result.gradeConversion.originalValue}</div>
        <div style="font-size:13px;margin-top:4px;"><strong>Classification:</strong> <span style="color:${result.gradeConversion.classificationColor};font-weight:600;">${result.gradeConversion.classification}</span></div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px;">Formula: 1 + 3 × (Max − Student) / (Max − Pass)</div>
      </div>
    </div>
  ` : '';

  // Profile strength bar
  const strengthColor = result.profileStrengthScore >= 85 ? '#16a34a' : result.profileStrengthScore >= 70 ? '#65a30d' : result.profileStrengthScore >= 55 ? '#d97706' : '#dc2626';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>publicgermany - Eligibility Evaluation Report</title>
<style>
  @page { size: A4; margin: 15mm; }
  @media print { body { -webkit-print-color-adjust: exact; } }

  body {
    font-family: "Segoe UI", Arial, sans-serif;
    margin: 0; padding: 0;
    font-size: 12px; color: #222;
    background: #fff;
  }

  .page {
    padding: 25px 20px;
    min-height: 100vh;
    position: relative;
  }

  .watermark {
    position: absolute;
    top: 45%; left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    opacity: 0.05;
    width: 300px;
    pointer-events: none;
  }

  .header {
    text-align: center;
    margin-bottom: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .header img {
    width: 80px;
    opacity: 0.9;
    margin-bottom: 4px;
    display: block;
  }

  .title {
    font-size: 24px;
    font-weight: 700;
    color: #1e3a8a;
    letter-spacing: 1px;
  }

  .subtitle {
    color: #555; font-size: 14px; margin-top: 4px;
  }

  .flag-bar {
    display: flex;
    height: 4px;
    width: 120px;
    margin: 8px auto 0;
    border-radius: 2px;
    overflow: hidden;
  }

  .flag-bar div { flex: 1; }

  .section-title {
    margin-top: 18px;
    font-size: 14px;
    font-weight: 700;
    color: #1e3a8a;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 4px;
  }

  .eval-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }

  .eval-table th {
    background: linear-gradient(135deg, #1e3a8a, #1e40af);
    color: #fff;
    padding: 8px 10px;
    font-weight: 600;
    font-size: 12px;
    text-align: left;
  }

  .eval-table td {
    padding: 8px 10px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 12px;
  }

  .eval-table tr:nth-child(even) td {
    background: #f9fafb;
  }

  .status-box {
    margin-top: 14px;
    padding: 12px;
    border-radius: 6px;
    border-left: 4px solid;
    font-size: 12px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px 20px;
    margin-top: 10px;
  }

  .info-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #6b7280;
    margin-bottom: 2px;
  }

  .info-value {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
  }

  .footer-note {
    margin-top: 24px;
    font-size: 11px;
    color: #6b7280;
    text-align: center;
    line-height: 1.5;
  }

  .page-number {
    position: absolute;
    bottom: 10px;
    right: 20px;
    font-weight: 600;
    color: #1e3a8a;
    font-size: 11px;
  }
</style>
</head>
<body>

<div class="page">
  <img class="watermark" src="${LOGO_URL}" alt="">

  <div class="header">
    <img src="${LOGO_URL}" alt="publicgermany logo" crossorigin="anonymous">
    <div class="title">publicgermany</div>
    <div class="subtitle">Eligibility Evaluation Report</div>
    <div class="flag-bar">
      <div style="background:#000;"></div>
      <div style="background:#DD0000;"></div>
      <div style="background:#FFCC00;"></div>
    </div>
  </div>

  <!-- Student Overview -->
  <div class="section-title">Student Overview</div>
  <div class="info-grid">
    <div><div class="info-label">Student Name</div><div class="info-value">${profile.full_name || 'N/A'}</div></div>
    <div><div class="info-label">Bachelor Degree</div><div class="info-value">${profile.bachelor_degree_name || 'N/A'}${profile.bachelor_field ? ` — ${profile.bachelor_field}` : ''}</div></div>
    <div><div class="info-label">Country</div><div class="info-value">${profile.country_of_education || 'N/A'}</div></div>
    <div><div class="info-label">Intended Course</div><div class="info-value">${profile.intended_master_course || 'N/A'}</div></div>
    <div><div class="info-label">Target Intake</div><div class="info-value">${profile.intake || 'N/A'}</div></div>
    <div><div class="info-label">Evaluation Date</div><div class="info-value">${evalDate}</div></div>
  </div>

  <!-- Overall Status Badge -->
  <div class="status-box" style="background:${badge.bg};border-color:${badge.border};margin-top:16px;">
    <span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;color:${badge.text};background:${badge.bg};border:1px solid ${badge.border};margin-right:8px;">${badge.label}</span>
    <span style="font-weight:500;color:${badge.text};">${result.preliminaryStatus}</span>
    <span style="float:right;font-weight:600;color:${result.admissionProbabilityColor};">Admission Probability: ${result.admissionProbability}</span>
  </div>

  <!-- Section 1: Academic Recognition -->
  <div class="section-title">1. Academic Recognition & Core Checks</div>
  <table class="eval-table">
    <thead><tr><th style="width:25%;">Parameter</th><th style="width:15%;">Result</th><th>Details</th></tr></thead>
    <tbody>${hardCheckRows}</tbody>
  </table>

  <!-- Section 2: Grade Evaluation -->
  <div class="section-title">2. Grade Evaluation — German Scale Conversion</div>
  ${gradeSection || '<p style="color:#6b7280;font-size:12px;margin-top:8px;">CGPA/Percentage not provided — unable to calculate German grade equivalent.</p>'}

  <!-- Section 3: Profile Strength Index -->
  <div class="section-title">3. Profile Strength Index</div>

  <div style="margin:12px 0;display:flex;align-items:center;gap:16px;">
    <div style="flex:1;height:16px;background:#e5e7eb;border-radius:8px;overflow:hidden;">
      <div style="width:${result.profileStrengthScore}%;height:100%;background:${strengthColor};border-radius:8px;transition:width 0.5s;"></div>
    </div>
    <div style="font-size:18px;font-weight:700;color:${strengthColor};min-width:60px;text-align:right;">${result.profileStrengthScore}%</div>
    <div style="font-size:12px;font-weight:600;color:${strengthColor};">${result.profileStrengthLabel}</div>
  </div>

  <table class="eval-table">
    <thead><tr><th style="width:22%;">Parameter</th><th style="width:12%;text-align:center;">Weight</th><th style="width:40%;">Score</th><th>Details</th></tr></thead>
    <tbody>${scoreRows}</tbody>
  </table>

  <!-- Section 4: Recommendations -->
  <div class="section-title">4. Improvement Recommendations</div>
  <div style="margin-top:8px;">${recsHTML}</div>

  <!-- Disclaimer -->
  <div class="footer-note">
    <strong>Disclaimer:</strong> This assessment is based on publicly available admission regulations and the information provided by the applicant.
    Final admission decisions are made solely by the respective universities. This report does not guarantee admission to any program.<br>
    <span style="margin-top:6px;display:inline-block;">publicgermany — publicgermany@outlook.com | <a href="https://publicgermany.vercel.app" style="color:#1d4ed8;">publicgermany.vercel.app</a></span>
  </div>

  <div class="page-number">publicgermany — Eligibility Report</div>
</div>

</body>
</html>`;
}
