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
  start_date: string | null;
  end_date: string | null;
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
        
        // Try reading as normal (horizontal format)
        let jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelData[];

        console.log('📊 Raw Excel data:', jsonData);
        console.log('📊 Total rows read:', jsonData.length);
        
        // Check if data is in vertical format (transposed)
        // If first row has keys like '__EMPTY', '__EMPTY_1', etc., it's likely vertical
        if (jsonData.length > 0) {
          const firstRowKeys = Object.keys(jsonData[0]);
          console.log('📊 Column names found:', firstRowKeys);
          
          // Detect vertical format: if we have __EMPTY columns or single column with field names
          const isVertical = firstRowKeys.some(key => key.startsWith('__EMPTY')) || 
                            (jsonData.length > 10 && firstRowKeys.length === 1);
          
          if (isVertical) {
            console.log('🔄 Detected VERTICAL format - Auto-transposing...');
            // Read the raw data without headers
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            // Transpose the data (swap rows and columns)
            const transposed: any[][] = [];
            const maxCols = Math.max(...rawData.map(row => row.length));
            
            for (let col = 0; col < maxCols; col++) {
              const newRow: any[] = [];
              for (let row = 0; row < rawData.length; row++) {
                newRow.push(rawData[row][col] || '');
              }
              transposed.push(newRow);
            }
            
            // Convert transposed data back to JSON with first row as headers
            const headers = transposed[0];
            jsonData = transposed.slice(1).map(row => {
              const obj: any = {};
              headers.forEach((header: string, idx: number) => {
                if (header) obj[header] = row[idx];
              });
              return obj;
            });
            
            console.log('✅ Transposed data:', jsonData);
            toast({
              title: '🔄 Auto-fixed format',
              description: 'Detected vertical data and automatically converted it to the correct format!',
            });
          }
          
          console.log('📊 First row sample:', jsonData[0]);
        }

        // Transform data to match required format and filter out blank rows
        const transformedData = jsonData
          .map((row: any, index: number) => {
            // Get university and program names - try multiple column name variations
            const uniName = (
              row.university_name || 
              row.University || 
              row['University Name'] ||
              row.university ||
              row.UNIVERSITY_NAME ||
              row.uni ||
              row.Uni ||
              ''
            ).toString().trim();
            
            const progName = (
              row.program_name || 
              row.Program || 
              row['Program Name'] ||
              row.program ||
              row.PROGRAM_NAME ||
              row.Programme ||
              row.Course ||
              ''
            ).toString().trim();
            
            // Smart date parsing - handle multiple formats and extract BOTH start and end dates
            let startDate = null;
            let endDate = null;
            let appDate = row.application_end_date || row.Deadline || row.end_date || row.deadline || row.DATE || null;
            
            if (appDate !== null && appDate !== undefined && appDate !== '') {
              // Check if it's an Excel serial number (number type or numeric string)
              if (typeof appDate === 'number' || (typeof appDate === 'string' && /^\d+$/.test(appDate))) {
                // Convert Excel serial date to JavaScript Date
                const excelEpoch = new Date(1899, 11, 30);
                const serialNumber = typeof appDate === 'number' ? appDate : parseInt(appDate);
                const jsDate = new Date(excelEpoch.getTime() + serialNumber * 86400000);
                
                // Format as YYYY-MM-DD
                const year = jsDate.getFullYear();
                const month = String(jsDate.getMonth() + 1).padStart(2, '0');
                const day = String(jsDate.getDate()).padStart(2, '0');
                endDate = `${year}-${month}-${day}`;
              }
              // Handle string dates
              else if (typeof appDate === 'string') {
                // Normalize different dash characters (-, –, —) to standard dash
                appDate = appDate.replace(/[–—]/g, '-');
                
                const monthMap: any = {
                  'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
                  'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                };
                
                // Handle formats like "Nov 15 - Jan 15", "Dec 15 - Jan 15", "Aug 1 - Nov 15"
                const dateRangeMatch = appDate.match(/([A-Za-z]+)\s+(\d+)\s*-\s*([A-Za-z]+)\s+(\d+)/);
                if (dateRangeMatch) {
                  const [, startMonth, startDay, endMonth, endDay] = dateRangeMatch;
                  
                  const startMonthNum = parseInt(monthMap[startMonth] || '01');
                  const endMonthNum = parseInt(monthMap[endMonth] || '01');
                  
                  // Smart year detection based on current date
                  const now = new Date();
                  const currentYear = now.getFullYear();
                  const currentMonth = now.getMonth() + 1; // 0-indexed, so add 1
                  
                  // Start date: if month is before current month, assume next year
                  // Otherwise, use current year
                  let startYear = startMonthNum < currentMonth ? currentYear + 1 : currentYear;
                  
                  // End date: if end month is before start month, it's next year after start
                  // Otherwise, same year as start
                  let endYear = endMonthNum < startMonthNum ? startYear + 1 : startYear;
                  
                  // Parse start date
                  startDate = `${startYear}-${startMonthNum.toString().padStart(2, '0')}-${startDay.padStart(2, '0')}`;
                  
                  // Parse end date
                  endDate = `${endYear}-${endMonthNum.toString().padStart(2, '0')}-${endDay.padStart(2, '0')}`;
                }
                // Handle single date like "Nov 15", "Oct 31"
                else {
                  const singleDateMatch = appDate.match(/([A-Za-z]+)\s+(\d+)/);
                  if (singleDateMatch) {
                    const [, month, day] = singleDateMatch;
                    const monthNum = monthMap[month] || '01';
                    endDate = `2025-${monthNum}-${day.padStart(2, '0')}`;
                    // If only one date, assume it's the deadline (end date)
                    startDate = null;
                  }
                  // If already in YYYY-MM-DD format, use as end date
                  else if (/^\d{4}-\d{2}-\d{2}$/.test(appDate)) {
                    endDate = appDate;
                  }
                }
              }
            }
            
            // Smart fee parsing - handle numbers with/without currency symbols
            let fees = row.fees_eur || row.Fees || row.Fee || row.fees || row.FEES || null;
            if (fees) {
              // Remove currency symbols and parse
              const feeStr = fees.toString().replace(/[€$₹,\s]/g, '');
              const feeMatch = feeStr.match(/\d+/);
              fees = feeMatch ? Number(feeMatch[0]) : null;
            }
            
            // Normalize IELTS requirement
            let ielts = row.ielts_requirement || row.IELTS || row.ielts || row.Ielts || null;
            if (ielts) {
              ielts = ielts.toString().trim();
              // If it's just a number, assume it's the overall score
              if (/^\d+(\.\d+)?$/.test(ielts)) {
                ielts = `${ielts} overall`;
              }
            }
            
            // Normalize German requirement
            let german = row.german_requirement || row.German || row.german || row.GERMAN || null;
            if (german) {
              german = german.toString().trim();
              // Convert "NA", "N/A", "None", "No" to null
              if (/^(NA|N\/A|None|No|-)$/i.test(german)) {
                german = null;
              }
            }
            
            // Normalize status
            let status = row.status || row.Status || row.STATUS || 'draft';
            status = status.toString().toLowerCase().trim();
            // Map common variations
            const statusMap: any = {
              'applied': 'submitted',
              'pending': 'submitted',
              'accepted': 'offer',
              'waitlisted': 'interview',
              'waitlist': 'interview'
            };
            status = statusMap[status] || status;
            // Validate status
            if (!['draft', 'submitted', 'interview', 'offer', 'rejected'].includes(status)) {
              status = 'draft';
            }
            
            return {
              university_name: uniName,
              program_name: progName,
              ielts_requirement: ielts,
              german_requirement: german,
              fees_eur: fees,
              start_date: startDate,
              end_date: endDate,
              application_method: row.application_method || row.Application || row.Method || null,
              required_tests: row.required_tests || row.Test || row.Tests || null,
              portal_link: row.portal_link || row['Portal Link'] || row.link || row.Link || null,
              notes: row.notes || row.NOTE || row.Notes || row.note || null,
              status: status as ExcelData['status']
            };
          })
          .filter(row => {
            // Filter out completely blank rows or rows with only whitespace
            const hasUni = row.university_name && row.university_name.length > 0;
            const hasProg = row.program_name && row.program_name.length > 0;
            return hasUni && hasProg;
          }); // Filter out blank rows

        console.log('✅ Filtered data:', transformedData);
        console.log('✅ Valid rows:', transformedData.length);
        console.log('📅 Parsed dates:', transformedData.map(r => ({ 
          uni: r.university_name, 
          start: r.start_date,
          end: r.end_date 
        })));

        if (transformedData.length === 0) {
          toast({
            title: 'No valid data',
            description: 'Excel file must have university_name and program_name columns with data.',
            variant: 'destructive'
          });
          return;
        }

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
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
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
                    <TableCell>{row.start_date || '-'}</TableCell>
                    <TableCell>{row.end_date || '-'}</TableCell>
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