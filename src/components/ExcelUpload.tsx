import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload } from 'lucide-react';

interface ExcelData {
  university_name: string;
  program_name: string;
  ielts_requirement: string | null;
  german_requirement: string | null;
  fees_eur: number | null;
  end_date: string | null;
  application_method: string | null;
  status: 'draft' | 'submitted' | 'interview' | 'offer' | 'rejected';
}

interface ExcelUploadProps {
  onUpload: (data: ExcelData[]) => void;
}

export function ExcelUpload({ onUpload }: ExcelUploadProps) {
  const [previewData, setPreviewData] = useState<ExcelData[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelData[];

        // Transform data to match required format
        const transformedData = jsonData.map(row => ({
          university_name: row.university_name || '',
          program_name: row.program_name || '',
          ielts_requirement: row.ielts_requirement || null,
          german_requirement: row.german_requirement || null,
          fees_eur: row.fees_eur ? Number(row.fees_eur) : null,
          end_date: row.end_date || null,
          application_method: row.application_method || null,
          status: (row.status as ExcelData['status']) || 'draft'
        }));

        setPreviewData(transformedData);
        setIsPreviewOpen(true);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmUpload = () => {
    onUpload(previewData);
    setIsPreviewOpen(false);
    setPreviewData([]);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => document.getElementById('excel-upload')?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Excel
        </Button>
        <input
          id="excel-upload"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview Upload Data</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>University</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>IELTS</TableHead>
                  <TableHead>German</TableHead>
                  <TableHead>Fees (EUR)</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.university_name}</TableCell>
                    <TableCell>{row.program_name}</TableCell>
                    <TableCell>{row.ielts_requirement || '-'}</TableCell>
                    <TableCell>{row.german_requirement || '-'}</TableCell>
                    <TableCell>{row.fees_eur || '-'}</TableCell>
                    <TableCell>{row.end_date || '-'}</TableCell>
                    <TableCell>{row.application_method || '-'}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmUpload}>
              Confirm Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}