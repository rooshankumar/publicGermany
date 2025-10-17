import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelTemplateProps {
  onDownload?: () => void;
}

export function ExcelTemplate({ onDownload }: ExcelTemplateProps) {
  const downloadTemplate = () => {
    // Template data structure with example rows
    const templateData = [
      {
        university_name: 'TU Dortmund University',
        program_name: 'M.Sc. Data Science',
        ielts_requirement: 'B2',
        german_requirement: 'NA',
        fees_eur: 300,
        application_end_date: '2025-01-15',
        application_method: 'Uni-assist',
        required_tests: 'Yes',
        portal_link: 'https://my.uni-assist.de',
        notes: 'Online self-assessment test required',
        status: 'draft'
      },
      {
        university_name: 'Trier University',
        program_name: 'M.Sc. Data Science',
        ielts_requirement: '6.0',
        german_requirement: 'NA',
        fees_eur: 380,
        application_end_date: '2025-01-15',
        application_method: 'Direct',
        required_tests: 'NA',
        portal_link: 'https://www.uni-trier.de',
        notes: '',
        status: 'draft'
      },
      // Add empty rows for users to fill
      ...Array(10).fill(null).map(() => ({
        university_name: '',
        program_name: '',
        ielts_requirement: '',
        german_requirement: '',
        fees_eur: '',
        application_end_date: '',
        application_method: '',
        required_tests: '',
        portal_link: '',
        notes: '',
        status: 'draft'
      }))
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 25 }, // university_name
      { wch: 30 }, // program_name
      { wch: 15 }, // ielts_requirement
      { wch: 15 }, // german_requirement
      { wch: 10 }, // fees_eur
      { wch: 15 }, // application_end_date
      { wch: 15 }, // application_method
      { wch: 15 }, // required_tests
      { wch: 25 }, // portal_link
      { wch: 20 }, // notes
      { wch: 10 }  // status
    ];

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Applications');

    // Download the file
    XLSX.writeFile(wb, 'applications-template.xlsx');
    
    if (onDownload) onDownload();
  };

  return (
    <Button variant="outline" onClick={downloadTemplate}>
      <Download className="mr-2 h-4 w-4" />
      Download Template
    </Button>
  );
}