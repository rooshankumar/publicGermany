import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelTemplateProps {
  onDownload?: () => void;
}

export function ExcelTemplate({ onDownload }: ExcelTemplateProps) {
  const downloadTemplate = () => {
    // Template data structure
    const templateData = [
      {
        university_name: 'Example University',
        program_name: 'Master of Computer Science',
        ielts_requirement: '6.5 overall',
        german_requirement: 'B2 level',
        fees_eur: 500,
        application_end_date: '2025-07-15',
        application_method: 'Uni-assist',
        required_tests: 'TestAS',
        portal_link: 'https://example.uni-assist.de',
        notes: 'Optional notes here',
        status: 'draft'
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Applications Template');

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