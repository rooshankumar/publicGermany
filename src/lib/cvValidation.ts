import { useAuth } from '@/hooks/useAuth';

export interface CVCompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  warnings: string[];
  contentMetrics: {
    totalCharacters: number;
    educationCount: number;
    workCount: number;
    publicationCount: number;
    estimatedPages: number;
    mayExceedTwoPages: boolean;
  };
}

/**
 * Validates CV completeness before PDF generation
 * Ensures institutional-grade minimum standards
 */
export function validateCVCompletion(
  profile: any,
  educations: any[],
  workExperiences: any[],
  languages: any[],
  publications: any[]
): CVCompletionStatus {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  let completionPoints = 0;
  const totalPoints = 12; // Total validation points

  // Required fields
  if (!profile?.full_name) missingFields.push('Full Name');
  else completionPoints++;

  if (!profile?.date_of_birth) missingFields.push('Date of Birth');
  else completionPoints++;

  if (!profile?.nationality) missingFields.push('Nationality');
  else completionPoints++;

  if (!profile?.gender) missingFields.push('Gender');
  else completionPoints++;

  if (!profile?.phone) missingFields.push('Phone Number');
  else completionPoints++;

  if (!profile?.passport_number) missingFields.push('Passport Number');
  else completionPoints++;

  // At least one education
  if (!educations || educations.length === 0) {
    missingFields.push('At least one Education entry');
  } else {
    completionPoints++;
    const edu = educations[0];
    if (!edu.final_grade) warnings.push('Education: Missing final grade');
    if (!edu.total_credits) warnings.push('Education: Missing credits');
  }

  // At least one language
  if (!languages || languages.length === 0) {
    missingFields.push('At least one Language');
  } else {
    completionPoints++;
  }

  // CGPA in education
  if (educations?.[0] && educations[0].final_grade) completionPoints++;
  else if (educations?.length > 0) warnings.push('Missing CGPA in education');

  // Credits in education
  if (educations?.[0] && educations[0].total_credits) completionPoints++;
  else if (educations?.length > 0) warnings.push('Missing Credits in education');

  // Optional but recommended
  if (!workExperiences || workExperiences.length === 0) {
    warnings.push('No work experience listed (optional but recommended)');
  } else {
    completionPoints++;
  }

  // Calculate content metrics
  const calculateContentSize = (): {
    totalCharacters: number;
    estimatedPages: number;
  } => {
    let totalChars = 0;

    // Profile
    totalChars += (profile?.full_name?.length || 0) + (profile?.address_street?.length || 0);

    // Educations
    educations?.forEach(e => {
      totalChars += (e.degree_title?.length || 0) + (e.field_of_study?.length || 0) + 
                   (e.institution?.length || 0) + (e.thesis_title?.length || 0) + 
                   (e.key_subjects?.length || 0);
    });

    // Work
    workExperiences?.forEach(w => {
      totalChars += (w.job_title?.length || 0) + (w.organisation?.length || 0) + 
                   (w.description?.length || 0);
    });

    // Publications
    publications?.forEach(p => {
      totalChars += (p.title?.length || 0) + (p.journal?.length || 0) + 
                   (p.description?.length || 0);
    });

    // Estimate pages: ~3000-3500 chars per page in academic format
    const estimatedPages = Math.ceil(totalChars / 3200);

    return { totalCharacters: totalChars, estimatedPages };
  };

  const { totalCharacters, estimatedPages } = calculateContentSize();
  const mayExceedTwoPages = estimatedPages > 2;

  if (mayExceedTwoPages) {
    warnings.push(
      `Estimated ${estimatedPages} pages. Monitor content length or use Compact Mode.`
    );
  }

  const completionPercentage = Math.round((completionPoints / totalPoints) * 100);

  return {
    isComplete: missingFields.length === 0,
    completionPercentage,
    missingFields,
    warnings,
    contentMetrics: {
      totalCharacters,
      educationCount: educations?.length || 0,
      workCount: workExperiences?.length || 0,
      publicationCount: publications?.length || 0,
      estimatedPages,
      mayExceedTwoPages,
    },
  };
}

/**
 * Formats validation errors for user display
 */
export function formatValidationErrors(
  status: CVCompletionStatus
): { title: string; description: string } {
  if (status.isComplete) {
    return {
      title: 'CV Complete',
      description: `${status.completionPercentage}% complete. Ready for PDF generation.`,
    };
  }

  return {
    title: 'CV Incomplete',
    description: `Missing: ${status.missingFields.join(', ')}. Please complete these fields first.`,
  };
}

/**
 * Formats warnings for user display
 */
export function formatValidationWarnings(status: CVCompletionStatus): string[] {
  return status.warnings;
}
