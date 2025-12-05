import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Search, Eye, Download, Send, Calendar, User, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { downloadContractPDF } from '@/lib/contractGenerator';
import InlineLoader from '@/components/InlineLoader';

interface Contract {
  id: string;
  contract_reference: string;
  student_name: string;
  student_email: string;
  service_package: string;
  service_fee: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  contract_html: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  signed_by_admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  sent: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  viewed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  signed_by_admin: 'Signed by Admin',
  sent: 'Sent',
  viewed: 'Viewed',
  completed: 'Completed',
};

export default function ContractHistory() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchTerm, statusFilter]);

  const fetchContracts = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      toast({ title: 'Error', description: 'Failed to load contracts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filterContracts = () => {
    let filtered = contracts;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.student_name.toLowerCase().includes(term) ||
        c.contract_reference.toLowerCase().includes(term) ||
        c.service_package.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    setFilteredContracts(filtered);
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowPreview(true);
  };

  const handleDownload = (contract: Contract) => {
    downloadContractPDF(contract.contract_html, `Contract-${contract.contract_reference}.pdf`);
  };

  if (loading) {
    return (
      <Layout>
        <InlineLoader label="Loading contracts" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contract History</h1>
          <p className="text-muted-foreground">View and manage all generated contracts</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-4 w-4" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, reference, or package..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="signed_by_admin">Signed by Admin</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredContracts.length} of {contracts.length} contracts
            </p>
          </CardContent>
        </Card>

        {/* Contracts Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contracts ({filteredContracts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredContracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No contracts found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map(contract => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-mono text-sm">
                          {contract.contract_reference}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{contract.student_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{contract.service_package}</TableCell>
                        <TableCell>{contract.service_fee}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[contract.status] || 'bg-muted'}>
                            {statusLabels[contract.status] || contract.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(contract.created_at), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewContract(contract)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(contract)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Contract: {selectedContract?.contract_reference}
              </DialogTitle>
            </DialogHeader>
            
            {selectedContract && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedContract.student_name}</span>
                  </div>
                  <Badge className={statusColors[selectedContract.status] || 'bg-muted'}>
                    {statusLabels[selectedContract.status] || selectedContract.status}
                  </Badge>
                  {selectedContract.sent_at && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Send className="h-3 w-3" />
                      Sent: {format(new Date(selectedContract.sent_at), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>

                <div 
                  className="border rounded-lg p-4 bg-white text-black"
                  dangerouslySetInnerHTML={{ __html: selectedContract.contract_html }}
                />

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => handleDownload(selectedContract)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
