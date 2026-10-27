// Vector PDF generator for the admin Student Shortlists page.
// Draws a clean, spreadsheet-style A4 report directly with jsPDF (no screenshots).

export interface ShortlistApp {
  university_name: string;
  program_name: string;
  status: string;
  fees_eur_per_semester: number | null;
  fees_eur: string | null;
  application_end_date: string | null;
}

export interface ShortlistStudent {
  full_name: string;
  phone: string | null;
  bachelor_degree_name: string | null;
  bachelor_field: string | null;
  bachelor_university: string | null;
  bachelor_cgpa_percentage: string | null;
  ielts_toefl_score: string | null;
  german_level: string | null;
  intake: string | null;
  intended_master_course: string | null;
  applications: ShortlistApp[];
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  accepted: 'Offer',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
};

const INK = [29, 29, 31] as const;
const MUTED = [110, 110, 115] as const;
const ACCENT = [178, 58, 46] as const;
const GOLD = [214, 165, 60] as const;
const LINE = [220, 220, 224] as const;

function fmtFees(app: ShortlistApp): string {
  if (app.fees_eur_per_semester != null) return `€${app.fees_eur_per_semester}`;
  if (app.fees_eur) return `€${app.fees_eur}`;
  return '—';
}

function fmtDeadline(d: string | null): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export async function buildShortlistPdfDoc(
  students: ShortlistStudent[],
  opts?: { singleStudent?: boolean }
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const M = 14; // page margin
  const W = 210 - M * 2;
  let y = 0;
  let pageNo = 0;

  const footer = () => {
    const h = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(...MUTED);
    doc.text('publicGermany — Study in Germany', M, h - 7);
    doc.text(`Page ${pageNo}`, 210 - M, h - 7, { align: 'right' });
  };

  const newPage = () => {
    if (pageNo > 0) footer();
    doc.addPage();
    pageNo++;
    y = M;
    // German stripe
    doc.setFillColor(...INK); doc.rect(M, y, W, 1.2, 'F');
    doc.setFillColor(...ACCENT); doc.rect(M, y + 1.2, W, 1.2, 'F');
    doc.setFillColor(...GOLD); doc.rect(M, y + 2.4, W, 1.2, 'F');
    y += 8;
  };

  // ---- Cover header ----
  pageNo++;
  y = M;
  doc.setFillColor(...INK); doc.rect(M, y, W, 1.4, 'F');
  doc.setFillColor(...ACCENT); doc.rect(M, y + 1.4, W, 1.4, 'F');
  doc.setFillColor(...GOLD); doc.rect(M, y + 2.8, W, 1.4, 'F');
  y += 11;
  doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(...INK);
  doc.text(opts?.singleStudent ? 'University Shortlist' : 'Student Shortlists', M, y);
  y += 5.5;
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...MUTED);
  doc.text(
    `publicGermany  ·  Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}` +
      (opts?.singleStudent ? '' : `  ·  ${students.length} student${students.length === 1 ? '' : 's'}`),
    M, y
  );
  y += 7;

  const colX = [M, M + 58, M + 100, M + 124, M + 146, M + W]; // University, Program, Status, Fees, Deadline, end

  const studentHeader = (s: ShortlistStudent) => {
    if (y > 268) newPage();
    y += 2;
    doc.setFillColor(...INK); doc.rect(M, y, W, 6.5, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(255, 255, 255);
    doc.text(s.full_name || 'Unnamed student', M + 2.5, y + 4.6);
    if (s.phone) {
      doc.setFont('helvetica', 'normal').setFontSize(8);
      doc.text(s.phone, 210 - M - 2.5, y + 4.6, { align: 'right' });
    }
    y += 9;

    // Vitals — 2 columns of label:value pairs
    const vitals: Array<[string, string]> = [
      ['Bachelor', [s.bachelor_degree_name, s.bachelor_field].filter(Boolean).join(', ') || '—'],
      ['Bachelor Uni', s.bachelor_university || '—'],
      ['CGPA / %', s.bachelor_cgpa_percentage || '—'],
      ['IELTS / TOEFL', s.ielts_toefl_score || '—'],
      ['German', s.german_level || '—'],
      ['Target Intake', s.intake || '—'],
      ['Target Course', s.intended_master_course || '—'],
    ];
    const colW = (W - 4) / 2;
    doc.setFontSize(7.5);
    vitals.forEach((pair, i) => {
      const cx = M + (i % 2) * (colW + 4);
      const cy = y + Math.floor(i / 2) * 4.4;
      doc.setFont('helvetica', 'bold').setTextColor(...MUTED);
      doc.text(`${pair[0]}:`, cx, cy);
      doc.setFont('helvetica', 'normal').setTextColor(...INK);
      doc.text(doc.splitTextToSize(pair[1] || '—', colW - 24)[0] || '—', cx + 24, cy);
    });
    y += Math.ceil(vitals.length / 2) * 4.4 + 3;
  };

  const tableHeader = () => {
    doc.setFillColor(243, 243, 245); doc.rect(M, y, W, 5.5, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...INK);
    const heads = ['UNIVERSITY', 'PROGRAM', 'STATUS', 'FEES/SEM', 'DEADLINE'];
    heads.forEach((h, i) => doc.text(h, colX[i] + 2, y + 3.8));
    y += 6.5;
  };

  for (const s of students) {
    if (!s.applications.length) continue;
    if (y > 250) newPage();
    studentHeader(s);
    tableHeader();

    s.applications.forEach((app, idx) => {
      const uni = doc.splitTextToSize(app.university_name || '—', colX[1] - colX[0] - 4);
      const prog = doc.splitTextToSize(app.program_name || '—', colX[2] - colX[1] - 4);
      const rows = Math.max(uni.length, prog.length, 1);
      const rowH = rows * 4 + 2.2;
      if (y + rowH > 283) {
        newPage();
        tableHeader();
      }
      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 251); doc.rect(M, y, W, rowH, 'F');
      }
      doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...INK);
      doc.text(uni, colX[0] + 2, y + 4);
      doc.setFontSize(7.5).setTextColor(...MUTED);
      doc.text(prog, colX[1] + 2, y + 4);
      doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...INK);
      doc.text(STATUS_LABEL[app.status] || app.status || '—', colX[2] + 2, y + 4);
      doc.setFont('helvetica', 'normal').setFontSize(8);
      doc.text(fmtFees(app), colX[3] + 2, y + 4);
      doc.text(fmtDeadline(app.application_end_date), colX[4] + 2, y + 4);
      // row line
      doc.setDrawColor(...LINE); doc.setLineWidth(0.15);
      doc.line(M, y + rowH, 210 - M, y + rowH);
      y += rowH;
    });

    y += 6; // gap between students
  }

  footer();
  return doc;
}

export async function generateShortlistPdf(
  students: ShortlistStudent[],
  opts?: { singleStudent?: boolean }
) {
  const doc = await buildShortlistPdfDoc(students, opts);
  const stamp = new Date().toISOString().slice(0, 10);
  const name = opts?.singleStudent && students[0]
    ? `Shortlist_${(students[0].full_name || 'student').replace(/\s+/g, '_')}_${stamp}.pdf`
    : `Student_Shortlists_${stamp}.pdf`;
  doc.save(name);
}
