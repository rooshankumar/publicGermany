import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Search, Eye, Download, Send, Calendar, User, Filter, Edit, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { downloadContractPDF, generateContractHTML, generateContractReference } from '@/lib/contractGenerator';
import InlineLoader from '@/components/InlineLoader';

interface Contract {
  id: string;
  contract_reference: string;
  student_name: string;
  student_email: string;
  student_phone: string | null;
  service_package: string;
  service_description: string | null;
  service_fee: string;
  payment_structure: string | null;
  status: string;
  created_at: string;
  updated_at: string;
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    servicePackage: '',
    serviceDescription: '',
    serviceFee: '',
    paymentStructure: '',
  });
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

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (contract: Contract) => {
    setDownloadingId(contract.id);
    try {
      await downloadContractPDF(contract.contract_html, `Contract-${contract.contract_reference}.pdf`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEditContract = (contract: Contract) => {
    if (contract.status !== 'draft') {
      toast({ title: 'Cannot Edit', description: 'Only draft contracts can be edited', variant: 'destructive' });
      return;
    }
    setEditingContract(contract);
    setEditForm({
      servicePackage: contract.service_package,
      serviceDescription: contract.service_description || '',
      serviceFee: contract.service_fee,
      paymentStructure: contract.payment_structure || '',
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingContract) return;

    setSaving(true);
    try {
      // Regenerate the contract HTML with updated data
      const newHtml = generateContractHTML({
        studentName: editingContract.student_name,
        studentEmail: editingContract.student_email,
        studentPhone: editingContract.student_phone || undefined,
        servicePackage: editForm.servicePackage,
        serviceDescription: editForm.serviceDescription,
        serviceFee: editForm.serviceFee,
        paymentStructure: editForm.paymentStructure,
        contractReference: editingContract.contract_reference,
      });

      const { error } = await (supabase as any)
        .from('contracts')
        .update({
          service_package: editForm.servicePackage,
          service_description: editForm.serviceDescription || null,
          service_fee: editForm.serviceFee,
          payment_structure: editForm.paymentStructure || null,
          contract_html: newHtml,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingContract.id);

      if (error) throw error;

      toast({ title: 'Saved', description: 'Contract updated successfully' });
      setShowEditDialog(false);
      setEditingContract(null);
      fetchContracts();
    } catch (error: any) {
      console.error('Error updating contract:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update contract', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
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
      <div className="space-y-3">
        <div>
          <h1 className="text-base font-bold text-foreground">Contract History</h1>
          <p className="text-[10px] text-muted-foreground">View and manage all generated contracts</p>
        </div>

        {/* Filters */}
        <Card className="shadow-none"><CardContent className="p-2.5">
          <p className="text-[10px] font-semibold mb-1.5">Search & Filter</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <Input placeholder="Search name or reference..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-7 text-xs" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="signed_by_admin">Signed by Admin</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Showing {filteredContracts.length} of {contracts.length}</p>
          </CardContent></Card>

        {/* Contracts Table */}
        <Card className="shadow-none"><CardContent className="p-0">
            {filteredContracts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[11px] text-muted-foreground">No contracts found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-muted/50 text-muted-foreground border-y">
                    <tr>
                      <th className="text-left p-1.5 font-medium">Ref</th>
                      <th className="text-left p-1.5 font-medium">Student</th>
                      <th className="text-left p-1.5 font-medium">Package</th>
                      <th className="text-left p-1.5 font-medium">Fee</th>
                      <th className="text-left p-1.5 font-medium">Status</th>
                      <th className="text-left p-1.5 font-medium">Created</th>
                      <th className="text-left p-1.5 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredContracts.map(contract => (
                      <tr key={contract.id} className="hover:bg-muted/30 border-b">
                        <td className="p-1.5 font-mono text-[10px]">{contract.contract_reference}</td>
                        <td className="p-1.5">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-[11px]">{contract.student_name}</span>
                          </div>
                        </td>
                        <td className="p-1.5 text-[11px]">{contract.service_package}</td>
                        <td className="p-1.5 text-[11px]">{contract.service_fee}</td>
                        <td className="p-1.5"><Badge className={`${statusColors[contract.status] || 'bg-muted'} text-[8px] px-1 py-0 h-4`}>{statusLabels[contract.status] || contract.status}</Badge></td>
                        <td className="p-1.5 text-[10px] whitespace-nowrap">{format(new Date(contract.created_at), 'MMM d, yyyy')}</td>
                        <td className="p-1.5">
                          <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleViewContract(contract)} title="View"><Eye className="h-3 w-3" /></Button>
                            {contract.status === 'draft' && (
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleEditContract(contract)} title="Edit"><Edit className="h-3 w-3" /></Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDownload(contract)} title="Download"><Download className="h-3 w-3" /></Button>
                          </div>
                        </td>
                      </tr>
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
                  {selectedContract.status === 'draft' && (
                    <Button variant="outline" onClick={() => {
                      setShowPreview(false);
                      handleEditContract(selectedContract);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Draft
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => handleDownload(selectedContract)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Contract Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Draft Contract</DialogTitle>
              <DialogDescription>
                Update the contract details for {editingContract?.student_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Service Package</Label>
                <Input
                  value={editForm.servicePackage}
                  onChange={(e) => setEditForm(prev => ({ ...prev, servicePackage: e.target.value }))}
                  placeholder="e.g., Admission Package"
                />
              </div>

              <div className="space-y-2">
                <Label>Service Fee</Label>
                <Input
                  value={editForm.serviceFee}
                  onChange={(e) => setEditForm(prev => ({ ...prev, serviceFee: e.target.value }))}
                  placeholder="e.g., ₹25,000"
                />
              </div>

              <div className="space-y-2">
                <Label>Service Description</Label>
                <Textarea
                  value={editForm.serviceDescription}
                  onChange={(e) => setEditForm(prev => ({ ...prev, serviceDescription: e.target.value }))}
                  placeholder="Describe the services..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Structure</Label>
                <Input
                  value={editForm.paymentStructure}
                  onChange={(e) => setEditForm(prev => ({ ...prev, paymentStructure: e.target.value }))}
                  placeholder="e.g., 50% Advance, 50% on Admission"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving || !editForm.servicePackage || !editForm.serviceFee}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
