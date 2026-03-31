import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ResourceUpload from '@/components/admin/ResourceUpload';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  ExternalLink, 
  Download, 
  Trash2, 
  Plus, 
  LayoutGrid, 
  Table as TableIcon,
  Loader2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const AdminResources = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to fetch resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleDelete = async (id: string, filePath?: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      // 1. Delete from storage if view_url exists and is from our bucket
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('resources')
          .remove([filePath]);
        if (storageError) console.error('Error deleting from storage:', storageError);
      }

      // 2. Delete from DB
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
      fetchResources();
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    }
  };

  const getFilePathFromUrl = (url: string) => {
    if (!url) return undefined;
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/resources/');
      return pathParts.length > 1 ? decodeURIComponent(pathParts[1]) : undefined;
    } catch (e) {
      return undefined;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
          <div>
            <h1 className="text-3xl font-bold">Manage Resources</h1>
            <p className="text-muted-foreground mt-1">Upload and manage study materials and external links</p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)} variant={showUpload ? "outline" : "default"}>
            {showUpload ? <Trash2 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {showUpload ? "Cancel" : "Add New Resource"}
          </Button>
        </div>

        {showUpload && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <ResourceUpload onUploadSuccess={() => {
              setShowUpload(false);
              fetchResources();
            }} />
          </div>
        )}

        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="IELTS">IELTS</TabsTrigger>
              <TabsTrigger value="German">German</TabsTrigger>
              <TabsTrigger value="Additional">Additional</TabsTrigger>
            </TabsList>
          </div>

          {['all', 'IELTS', 'German', 'Additional'].map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Exam/Level</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resources
                        .filter(r => category === 'all' || r.category === category)
                        .map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell className="font-medium">
                              <div>
                                {resource.title}
                                <div className="text-xs text-muted-foreground line-clamp-1">{resource.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{resource.category}</Badge>
                            </TableCell>
                            <TableCell>{resource.type}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {resource.exam && <Badge variant="outline">{resource.exam}</Badge>}
                                {resource.level && <Badge variant="outline">{resource.level}</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {resource.view_url && (
                                  <Button variant="ghost" size="icon" asChild title="View">
                                    <a href={resource.view_url} target="_blank" rel="noopener noreferrer">
                                      <FileText className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                {resource.external_url && (
                                  <Button variant="ghost" size="icon" asChild title="Visit Link">
                                    <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(resource.id, getFilePathFromUrl(resource.view_url))}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      {resources.filter(r => category === 'all' || r.category === category).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            No resources found in this category.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminResources;
