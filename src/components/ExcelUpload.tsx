import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExcelData {
  university_name: string;
  program_name: string;
  ielts_requirement: string | null;
  german_requirement: string | null;
  fees_eur: number | null;
  application_end_date: string | null;
  application_method: string | null;
  required_tests: string | null;
  portal_link: string | null;
  notes: string | null;
  status: 'draft' | 'submitted' | 'interview' | 'offer' | 'rejected';
}

interface ExcelUploadProps {
  onUpload: (data: ExcelData[]) => void;
}

export function ExcelUpload({ onUpload }: ExcelUploadProps) {
  const [previewData, setPreviewData] = useState<ExcelData[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

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
        const transformedData = jsonData.map((row: any) => ({
          university_name: row.university_name || row.University || '',
          program_name: row.program_name || row.Program || '',
          ielts_requirement: row.ielts_requirement || row.IELTS || null,
          german_requirement: row.german_requirement || row.German || null,
          fees_eur: row.fees_eur || row.Fees ? Number(row.fees_eur || row.Fees) : null,
          application_end_date: row.application_end_date || row.Deadline || row.end_date || null,
          application_method: row.application_method || row.Application || null,
          required_tests: row.required_tests || row.Test || null,
          portal_link: row.portal_link || row['Portal Link'] || null,
          notes: row.notes || row.NOTE || row.Notes || null,
          status: (row.status as ExcelData['status']) || 'draft'
        }));

        setPreviewData(transformedData);
        setIsPreviewOpen(true);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        toast({
          title: 'Error',
          description: 'Failed to parse Excel file. Please check the format.',
          variant: 'destructive'
        });
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
                  <TableHead>Deadline</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Tests</TableHead>
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
                    <TableCell>{row.application_end_date || '-'}</TableCell>
                    <TableCell>{row.application_method || '-'}</TableCell>
                    <TableCell>{row.required_tests || '-'}</TableCell>
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