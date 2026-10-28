// Vector PDF generator for the admin Student Shortlists page.
// Compact landscape A4 spreadsheet-style report drawn directly with jsPDF.

export interface ShortlistApp {
  university_name: string;
  program_name: string;
  status: string;
  fees_eur_per_semester: number | null;
  fees_eur: string | null;
  application_start_date: string | null;
  application_end_date: string | null;
  application_method: string | null;
  german_requirement: string | null;
  ielts_requirement: string | null;
}

export interface ShortlistStudent {
  full_name: string;
  email: string | null;
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

export const STATUS_LABEL: Record<string, string> = {
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

export function fmtFees(app: ShortlistApp): string {
  if (app.fees_eur_per_semester != null) return `EUR ${app.fees_eur_per_semester}`;
  if (app.fees_eur) return `EUR ${app.fees_eur}`;
  return '—';
}

export function fmtDate(d: string | null): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export async function buildShortlistPdfDoc(students: ShortlistStudent[], opts?: { singleStudent?: boolean }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const PW = 297, PH = 210, M = 10, W = PW - M * 2;
  let y = 0;
  let pageNo = 1;

  const stripe = (yy: number) => {
    doc.setFillColor(...INK); doc.rect(M, yy, W, 1, 'F');
    doc.setFillColor(...ACCENT); doc.rect(M, yy + 1, W, 1, 'F');
    doc.setFillColor(...GOLD); doc.rect(M, yy + 2, W, 1, 'F');
  };
  const footer = () => {
    doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(...MUTED);
    doc.text('publicGermany — Student Shortlists', M, PH - 5);
    doc.text(`Page ${pageNo}`, PW - M, PH - 5, { align: 'right' });
  };

  // Columns: #, University, Program, Start, Deadline, Method, German, English, Status, Fees
  const cols = [
    { h: '#', w: 7 },
    { h: 'UNIVERSITY', w: 52 },
    { h: 'PROGRAM', w: 60 },
    { h: 'START', w: 18 },
    { h: 'DEADLINE', w: 18 },
    { h: 'METHOD', w: 28 },
    { h: 'GERMAN REQ.', w: 26 },
    { h: 'ENGLISH REQ.', w: 26 },
    { h: 'STATUS', w: 18 },
    { h: 'FEES/SEM', w: W - 253 },
  ];
  const colX: number[] = [];
  cols.reduce((x, c) => { colX.push(x); return x + c.w; }, M);

  const newPage = () => {
    footer();
    doc.addPage();
    pageNo++;
    y = M;
    stripe(y);
    y += 6;
  };

  const tableHeader = () => {
    doc.setFillColor(243, 243, 245); doc.rect(M, y, W, 5, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(6.5).setTextColor(...INK);
    cols.forEach((c, i) => doc.text(c.h, colX[i] + 1.5, y + 3.4));
    y += 5;
  };

  // Cover
  y = M;
  stripe(y);
  y += 9;
  doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(...INK);
  doc.text(opts?.singleStudent ? 'University Shortlist' : 'Student Shortlists', M, y);
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED);
  doc.text(
    `Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}` +
      (opts?.singleStudent ? '' : `  ·  ${students.length} student${students.length === 1 ? '' : 's'}`),
    PW - M, y, { align: 'right' }
  );
  y += 5;

  for (const s of students) {
    if (!s.applications.length) continue;
    if (y > PH - 40) newPage();
    y += 2;
    // Student band
    doc.setFillColor(...INK); doc.rect(M, y, W, 6, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(255, 255, 255);
    doc.text(s.full_name || 'Unnamed student', M + 2, y + 4.2);
    doc.setFont('helvetica', 'normal').setFontSize(7.5);
    doc.text([s.email, s.phone].filter(Boolean).join('   ·   '), PW - M - 2, y + 4.2, { align: 'right' });
    y += 6;
    // Vitals line
    const vit = [
      `Bachelor: ${[s.bachelor_degree_name, s.bachelor_field].filter(Boolean).join(', ') || '—'}`,
      `CGPA: ${s.bachelor_cgpa_percentage || '—'}`,
      `IELTS/TOEFL: ${s.ielts_toefl_score || '—'}`,
      `German: ${(s.german_level || '—').toUpperCase()}`,
      `Intake: ${s.intake || '—'}`,
      `Target: ${s.intended_master_course || '—'}`,
    ].join('   |   ');
    doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(...MUTED);
    doc.text(doc.splitTextToSize(vit, W - 4)[0], M + 2, y + 3.6);
    y += 5.5;
    tableHeader();

    s.applications.forEach((app, idx) => {
      const cells = [
        String(idx + 1),
        app.university_name || '—',
        app.program_name || '—',
        fmtDate(app.application_start_date),
        fmtDate(app.application_end_date),
        app.application_method || '—',
        app.german_requirement || '—',
        app.ielts_requirement || '—',
        STATUS_LABEL[app.status] || app.status || '—',
        fmtFees(app),
      ];
      doc.setFontSize(7);
      const wrapped = cells.map((c, i) => doc.splitTextToSize(c, cols[i].w - 3) as string[]);
      const lines = Math.max(...wrapped.map((w) => w.length), 1);
      const rowH = lines * 3.1 + 2;
      if (y + rowH > PH - 10) { newPage(); tableHeader(); }
      if (idx % 2 === 1) { doc.setFillColor(250, 250, 251); doc.rect(M, y, W, rowH, 'F'); }
      wrapped.forEach((w, i) => {
        const col = i === 2 ? MUTED : INK;
        doc.setFont('helvetica', i === 1 || i === 8 ? 'bold' : 'normal').setTextColor(col[0], col[1], col[2]);
        doc.text(w, colX[i] + 1.5, y + 3.2);
      });
      doc.setDrawColor(...LINE); doc.setLineWidth(0.15);
      doc.line(M, y + rowH, PW - M, y + rowH);
      y += rowH;
    });
    y += 3;
  }

  footer();
  return doc;
}

export async function generateShortlistPdf(students: ShortlistStudent[], opts?: { singleStudent?: boolean }) {
  const doc = await buildShortlistPdfDoc(students, opts);
  const stamp = new Date().toISOString().slice(0, 10);
  const name = opts?.singleStudent && students[0]
    ? `Shortlist_${(students[0].full_name || 'student').replace(/\s+/g, '_')}_${stamp}.pdf`
    : `Student_Shortlists_${stamp}.pdf`;
  doc.save(name);
}
