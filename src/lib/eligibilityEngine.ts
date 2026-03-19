/**
 * Professional Eligibility Evaluation Engine
 * 3-Layer System: Academic Core → Profile Strength → Overall Assessment
 */

export interface ProfileInput {
  full_name?: string | null;
  email?: string | null;
  citizenship?: string | null;
  residence_country?: string | null;
  
  // Academic Background
  bachelor_degree_name?: string | null;
  bachelor_field?: string | null;
  university_name?: string | null;
  country_of_education?: string | null;
  bachelor_duration_years?: number | string | null;
  bachelor_credits_ects?: number | string | null;
  bachelor_cgpa_percentage?: string | null;
  min_passing_grade?: string | null;
  max_grade?: string | null;

  // Language
  ielts_toefl_score?: string | null;
  english_test_type?: 'IELTS' | 'TOEFL' | 'None' | null;
  english_test_status?: 'Completed' | 'Planned' | null;
  german_level?: string | null;

  // Intended Program
  intended_master_course?: string | null;
  intake?: string | null;

  // Experience
  work_experience_years?: number | string | null;
  internship_experience?: string | null;
  relevant_projects?: string | null;

  // Status
  has_aps_certificate?: 'Not Applied' | 'Applied' | 'Verified' | boolean | string | null;
  previous_germany_applications?: boolean | string | null;
}

// ─── Types ───────────────────────────────────────────────────────────────

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';

export interface HardCheck {
  label: string;
  status: CheckStatus;
  detail: string;
  value?: string;
}

export interface ScoreParameter {
  label: string;
  weight: number;
  score: number; // 0-10
  detail: string;
}

export interface GradeConversion {
  originalValue: string;
  germanGrade: number;
  classification: string;
  classificationColor: string;
}

export interface EvaluationResult {
  // Layer 1
  hardChecks: HardCheck[];
  gradeConversion: GradeConversion | null;
  // Layer 2
  scoreParameters: ScoreParameter[];
  profileStrengthScore: number; // 0-100
  profileStrengthLabel: string;
  // Layer 3
  preliminaryStatus: string;
  admissionProbability: string;
  admissionProbabilityColor: string;
  recommendations: string[];
  overallStatus: 'eligible' | 'conditional' | 'needs-improvement';
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function parseNum(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === '') return 0;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function isIndian(country: string | null | undefined): boolean {
  if (!country) return false;
  return country.toLowerCase().includes('india');
}

function resolveBoolean(val: boolean | string | null | undefined): boolean | null {
  if (typeof val === 'boolean') return val;
  if (val === 'yes' || val === 'true') return true;
  if (val === 'no' || val === 'false') return false;
  return null;
}

// ─── German Grade Conversion ─────────────────────────────────────────────

export function convertToGermanGrade(p: ProfileInput): GradeConversion | null {
  if (!p.bachelor_cgpa_percentage) return null;
  const studentGrade = parseFloat(p.bachelor_cgpa_percentage);
  if (isNaN(studentGrade) || studentGrade <= 0) return null;

  let maxGrade = p.max_grade ? parseFloat(p.max_grade) : (studentGrade <= 10 ? 10 : 100);
  let passGrade = p.min_passing_grade ? parseFloat(p.min_passing_grade) : (studentGrade <= 10 ? 4 : 40);

  let germanGrade = 1 + 3 * ((maxGrade - studentGrade) / (maxGrade - passGrade));
  germanGrade = Math.round(germanGrade * 100) / 100;

  // Clamp
  if (germanGrade < 1.0) germanGrade = 1.0;
  if (germanGrade > 5.0) germanGrade = 5.0;

  let classification: string;
  let classificationColor: string;

  if (germanGrade <= 2.5) {
    classification = 'Competitive';
    classificationColor = '#16a34a';
  } else if (germanGrade <= 3.0) {
    classification = 'Acceptable';
    classificationColor = '#d97706';
  } else if (germanGrade <= 3.5) {
    classification = 'Risk Zone';
    classificationColor = '#ea580c';
  } else {
    classification = 'Low Probability';
    classificationColor = '#dc2626';
  }

  return {
    originalValue: `${studentGrade} (Scale: ${passGrade}-${maxGrade})`,
    germanGrade,
    classification,
    classificationColor,
  };
}

// ─── LAYER 1: Academic Core Eligibility ──────────────────────────────────

function evaluateHardChecks(p: ProfileInput): { checks: HardCheck[]; grade: GradeConversion | null } {
  const checks: HardCheck[] = [];

  // 1. Degree Recognition
  const duration = parseNum(p.bachelor_duration_years);
  
  if (p.bachelor_degree_name) {
    if (duration >= 4) {
      checks.push({ label: 'Degree Recognition', status: 'pass', detail: `${duration}-year degree — Meets standard requirement`, value: `${duration} years` });
    } else if (duration === 3) {
      checks.push({ label: 'Degree Recognition', status: 'pass', detail: '3-year degree — Meets minimum duration requirement', value: '3 years' });
    } else if (duration > 0) {
      checks.push({ label: 'Degree Recognition', status: 'fail', detail: `${duration}-year degree — Below minimum 3-year requirement`, value: `${duration} years` });
    } else {
      checks.push({ label: 'Degree Recognition', status: 'warn', detail: 'Degree duration not specified', value: 'Not provided' });
    }
  } else {
    checks.push({ label: 'Degree Recognition', status: 'fail', detail: 'Bachelor degree not provided', value: 'Missing' });
  }

  // 2. ECTS Evaluation
  const ects = parseNum(p.bachelor_credits_ects);
  if (ects > 0) {
    if (ects >= 180) {
      checks.push({ label: 'ECTS Credits', status: 'pass', detail: `${ects} ECTS — Meets 180 ECTS standard`, value: `${ects} ECTS` });
    } else if (ects >= 150) {
      checks.push({ label: 'ECTS Credits', status: 'warn', detail: `${ects} ECTS — Below 180 standard; some programs may accept`, value: `${ects} ECTS` });
    } else {
      checks.push({ label: 'ECTS Credits', status: 'fail', detail: `${ects} ECTS — Significantly below 180 ECTS requirement`, value: `${ects} ECTS` });
    }
  } else if (duration >= 4) {
    checks.push({ label: 'ECTS Credits', status: 'pass', detail: '4-year degree typically equivalent to 240 ECTS', value: '~240 (estimated)' });
  } else if (duration === 3) {
    checks.push({ label: 'ECTS Credits', status: 'pass', detail: '3-year degree typically equivalent to 180 ECTS', value: '~180 (estimated)' });
  } else {
    checks.push({ label: 'ECTS Credits', status: 'warn', detail: 'ECTS not provided', value: 'Not provided' });
  }

  // 3. Grade Evaluation
  const grade = convertToGermanGrade(p);
  if (grade) {
    const statusMap: Record<string, CheckStatus> = {
      'Competitive': 'pass',
      'Acceptable': 'warn',
      'Risk Zone': 'warn',
      'Low Probability': 'fail',
    };
    checks.push({
      label: 'German Grade',
      status: statusMap[grade.classification] || 'warn',
      detail: `German Grade ${grade.germanGrade.toFixed(2)} — ${grade.classification}`,
      value: grade.germanGrade.toFixed(2),
    });
  } else {
    checks.push({ label: 'German Grade', status: 'warn', detail: 'CGPA details not provided', value: 'Not provided' });
  }

  // 4. English Proficiency
  if (p.ielts_toefl_score) {
    const score = parseFloat(p.ielts_toefl_score);
    const isIELTS = p.english_test_type === 'IELTS' || score <= 9;
    if (!isNaN(score)) {
      if (isIELTS) {
        if (score >= 6.5) {
          checks.push({ label: 'English Proficiency', status: 'pass', detail: `IELTS ${score} — Meets standard requirements`, value: `IELTS ${score}` });
        } else if (score >= 6.0) {
          checks.push({ label: 'English Proficiency', status: 'warn', detail: `IELTS ${score} — Below 6.5; some universities may accept`, value: `IELTS ${score}` });
        } else {
          checks.push({ label: 'English Proficiency', status: 'fail', detail: `IELTS ${score} — Below minimum requirement (6.0)`, value: `IELTS ${score}` });
        }
      } else { // TOEFL
        if (score >= 90) {
          checks.push({ label: 'English Proficiency', status: 'pass', detail: `TOEFL ${score} — Meets standard requirements`, value: `TOEFL ${score}` });
        } else if (score >= 80) {
          checks.push({ label: 'English Proficiency', status: 'warn', detail: `TOEFL ${score} — Below 90; some universities may accept`, value: `TOEFL ${score}` });
        } else {
          checks.push({ label: 'English Proficiency', status: 'fail', detail: `TOEFL ${score} — Below minimum requirement (80)`, value: `TOEFL ${score}` });
        }
      }
    }
  } else {
    checks.push({ label: 'English Proficiency', status: 'warn', detail: 'Test score not provided', value: 'Not provided' });
  }

  // 5. APS Certificate
  const india = isIndian(p.country_of_education) || isIndian(p.citizenship);
  if (india) {
    const aps = p.has_aps_certificate;
    if (aps === 'Verified' || aps === true) {
      checks.push({ label: 'APS Certificate', status: 'pass', detail: 'APS verified — Mandatory requirement fulfilled', value: 'Verified' });
    } else if (aps === 'Applied') {
      checks.push({ label: 'APS Certificate', status: 'warn', detail: 'APS applied — Pending verification', value: 'Applied' });
    } else {
      checks.push({ label: 'APS Certificate', status: 'fail', detail: 'APS certificate missing — Mandatory for Indian students', value: 'Missing' });
    }
  }

  return { checks, grade };
}

// ─── LAYER 2: Profile Strength Index ─────────────────────────────────────

function evaluateProfileStrength(p: ProfileInput, grade: GradeConversion | null): ScoreParameter[] {
  const params: ScoreParameter[] = [];

  // 1. CGPA Strength (25%)
  let cgpaScore = 0;
  if (grade) {
    if (grade.germanGrade <= 1.5) cgpaScore = 10;
    else if (grade.germanGrade <= 2.0) cgpaScore = 9;
    else if (grade.germanGrade <= 2.5) cgpaScore = 8;
    else if (grade.germanGrade <= 3.0) cgpaScore = 6;
    else if (grade.germanGrade <= 3.5) cgpaScore = 4;
    else cgpaScore = 2;
  }
  params.push({ label: 'Academic Grade Strength', weight: 0.25, score: cgpaScore, detail: grade ? `German Grade ${grade.germanGrade.toFixed(2)}` : 'Not provided' });

  // 2. Subject Relevance (25%)
  let subjectScore = 5; 
  if (p.bachelor_field && p.intended_master_course) {
    const field = p.bachelor_field.toLowerCase();
    const course = p.intended_master_course.toLowerCase();
    const commonKeywords = ['computer', 'science', 'engineering', 'data', 'information', 'technology', 'mechanical', 'electrical', 'electronics', 'civil', 'business', 'management', 'economics', 'mathematics', 'physics', 'chemistry', 'biology', 'ai', 'robotics', 'automotive'];
    
    const fieldTokens = field.split(/[\s,/-]+/);
    const courseTokens = course.split(/[\s,/-]+/);
    
    const overlap = fieldTokens.filter(t => courseTokens.includes(t) && commonKeywords.includes(t)).length;
    
    if (overlap >= 2) subjectScore = 10;
    else if (overlap >= 1) subjectScore = 8;
    else subjectScore = 5;
  }
  params.push({ label: 'Subject Relevance', weight: 0.25, score: subjectScore, detail: p.bachelor_field ? `${p.bachelor_field}` : 'Not provided' });

  // 3. English Proficiency (15%)
  let englishScore = 0;
  if (p.ielts_toefl_score) {
    const s = parseFloat(p.ielts_toefl_score);
    const isIELTS = p.english_test_type === 'IELTS' || s <= 9;
    if (!isNaN(s)) {
      if (isIELTS) {
        if (s >= 7.5) englishScore = 10;
        else if (s >= 7.0) englishScore = 9;
        else if (s >= 6.5) englishScore = 8;
        else if (s >= 6.0) englishScore = 6;
        else englishScore = 3;
      } else { // TOEFL
        if (s >= 105) englishScore = 10;
        else if (s >= 100) englishScore = 9;
        else if (s >= 90) englishScore = 8;
        else if (s >= 80) englishScore = 6;
        else englishScore = 3;
      }
    }
  }
  params.push({ label: 'English Language Score', weight: 0.15, score: englishScore, detail: p.ielts_toefl_score ? `Score: ${p.ielts_toefl_score}` : 'Not provided' });

  // 4. Work Experience (10%)
  const workYears = parseNum(p.work_experience_years);
  let workScore = 0;
  if (workYears >= 3) workScore = 10;
  else if (workYears >= 2) workScore = 8;
  else if (workYears >= 1) workScore = 6;
  else if (workYears > 0) workScore = 4;
  params.push({ label: 'Work Experience', weight: 0.10, score: workScore, detail: workYears > 0 ? `${workYears} year(s)` : 'None' });

  // 5. Degree Duration/Credits (10%)
  const dur = parseNum(p.bachelor_duration_years);
  let durScore = 0;
  if (dur >= 4) durScore = 10;
  else if (dur >= 3) durScore = 7;
  params.push({ label: 'Degree Duration / Credits', weight: 0.10, score: durScore, detail: dur > 0 ? `${dur} years` : 'Not provided' });

  // 6. German Language (10%)
  let germanScore = 0;
  if (p.german_level) {
    const lvl = p.german_level.toLowerCase();
    if (['c1', 'c2'].includes(lvl)) germanScore = 10;
    else if (lvl === 'b2') germanScore = 8;
    else if (lvl === 'b1') germanScore = 6;
    else if (lvl === 'a2') germanScore = 4;
    else if (lvl === 'a1') germanScore = 2;
  }
  params.push({ label: 'German Language', weight: 0.10, score: germanScore, detail: p.german_level && p.german_level !== 'none' ? `Level: ${p.german_level.toUpperCase()}` : 'None' });

  // 7. APS Status (5%)
  const india = isIndian(p.country_of_education) || isIndian(p.citizenship);
  let apsScore = 10;
  if (india) {
    const aps = p.has_aps_certificate;
    if (aps === 'Verified' || aps === true) apsScore = 10;
    else if (aps === 'Applied') apsScore = 7;
    else apsScore = 0;
  }
  params.push({ label: 'APS Status', weight: 0.05, score: apsScore, detail: india ? (String(p.has_aps_certificate) || 'Missing') : 'Not required' });

  return params;
}

// ─── LAYER 3: Overall Assessment ─────────────────────────────────────────

function generateRecommendations(p: ProfileInput, checks: HardCheck[], score: number, grade: GradeConversion | null): string[] {
  const recs: string[] = [];

  const failChecks = checks.filter(c => c.status === 'fail');
  const warnChecks = checks.filter(c => c.status === 'warn');

  // APS
  if (failChecks.find(c => c.label === 'APS Certificate')) {
    recs.push('Obtain APS certificate — it is mandatory for Indian students applying to German universities.');
  }

  // Grade
  if (grade && grade.germanGrade > 3.0) {
    recs.push('Consider programs with flexible GPA requirements or universities that accept conditional admission.');
  }

  // IELTS
  if (failChecks.find(c => c.label === 'English Proficiency') || warnChecks.find(c => c.label === 'English Proficiency')) {
    recs.push('Improve English proficiency score — target IELTS 6.5+ or TOEFL 90+ for most programs.');
  }

  // Duration
  if (warnChecks.find(c => c.label === 'Degree Recognition')) {
    recs.push('For 3-year degree holders: consider APS STK pathway or universities that accept 3-year degrees with additional qualifications.');
  }

  // ECTS
  if (failChecks.find(c => c.label === 'ECTS Credits') || warnChecks.find(c => c.label === 'ECTS Credits')) {
    recs.push('Complete additional courses or certifications to bridge the ECTS gap.');
  }

  // Subject relevance
  if (!p.bachelor_field || !p.intended_master_course) {
    recs.push('Complete your profile with bachelor field and intended master course for accurate subject match analysis.');
  }

  // Work experience
  if (parseNum(p.work_experience_years) === 0 && score < 70) {
    recs.push('Relevant work experience or internships can strengthen your application profile.');
  }

  // General
  if (score >= 70 && recs.length === 0) {
    recs.push('Your profile is competitive — apply early and target universities matching your academic background.');
  }

  if (p.intake) {
    recs.push(`Target intake: ${p.intake} — ensure all applications are submitted before deadlines.`);
  }

  return recs.slice(0, 5);
}

// ─── Main Evaluation Function ────────────────────────────────────────────

export function evaluateEligibility(profile: ProfileInput): EvaluationResult {
  // Layer 1
  const { checks, grade } = evaluateHardChecks(profile);

  // Layer 2
  const scoreParams = evaluateProfileStrength(profile, grade);
  const totalWeighted = scoreParams.reduce((sum, p) => sum + p.score * p.weight, 0);
  const profileStrengthScore = Math.round(totalWeighted * 10);

  let profileStrengthLabel: string;
  if (profileStrengthScore >= 85) profileStrengthLabel = 'Strong Candidate';
  else if (profileStrengthScore >= 70) profileStrengthLabel = 'Competitive';
  else if (profileStrengthScore >= 55) profileStrengthLabel = 'Moderate';
  else profileStrengthLabel = 'Needs Improvement';

  // Layer 3
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;

  let overallStatus: 'eligible' | 'conditional' | 'needs-improvement';
  let preliminaryStatus: string;
  let admissionProbability: string;
  let admissionProbabilityColor: string;

  if (failCount === 0 && profileStrengthScore >= 70) {
    overallStatus = 'eligible';
    preliminaryStatus = 'Academically Eligible — Profile Meets Requirements';
    admissionProbability = 'High';
    admissionProbabilityColor = '#16a34a';
  } else if (failCount === 0 && profileStrengthScore >= 55) {
    overallStatus = 'eligible';
    preliminaryStatus = 'Academically Eligible — Minor Gaps Identified';
    admissionProbability = 'Moderate to High';
    admissionProbabilityColor = '#65a30d';
  } else if (failCount <= 1 && profileStrengthScore >= 45) {
    overallStatus = 'conditional';
    preliminaryStatus = 'Conditionally Eligible — Action Items Required';
    admissionProbability = 'Moderate';
    admissionProbabilityColor = '#d97706';
  } else {
    overallStatus = 'needs-improvement';
    preliminaryStatus = 'Needs Improvement — Critical Gaps Identified';
    admissionProbability = 'Low';
    admissionProbabilityColor = '#dc2626';
  }

  const recommendations = generateRecommendations(profile, checks, profileStrengthScore, grade);

  return {
    hardChecks: checks,
    gradeConversion: grade,
    scoreParameters: scoreParams,
    profileStrengthScore,
    profileStrengthLabel,
    preliminaryStatus,
    admissionProbability,
    admissionProbabilityColor,
    recommendations,
    overallStatus,
  };
}
