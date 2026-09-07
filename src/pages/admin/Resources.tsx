import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ResourceUpload from '@/components/admin/ResourceUpload';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-bold">Resources</h1>
            <p className="text-[10px] text-muted-foreground">Upload and manage study materials</p>
          </div>
          <Button size="sm" className="h-7 text-[10px]" onClick={() => setShowUpload(!showUpload)} variant={showUpload ? "outline" : "default"}>
            {showUpload ? 'Cancel' : <><Plus className="h-3 w-3 mr-1" /> Add</>}
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
          <TabsList className="h-7 p-0.5">
            <TabsTrigger value="all" className="text-[10px] h-6">All</TabsTrigger>
            <TabsTrigger value="IELTS" className="text-[10px] h-6">IELTS</TabsTrigger>
            <TabsTrigger value="German" className="text-[10px] h-6">German</TabsTrigger>
            <TabsTrigger value="Additional" className="text-[10px] h-6">Additional</TabsTrigger>
          </TabsList>

          {['all', 'IELTS', 'German', 'Additional'].map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border shadow-sm">
                  <table className="w-full text-[11px]"><thead className="bg-muted/50 text-muted-foreground border-y"><tr>
  <th className="text-left p-1.5 font-medium">Title</th><th className="text-left p-1.5 font-medium">Category</th><th className="text-left p-1.5 font-medium">Type</th><th className="text-left p-1.5 font-medium">Exam/Level</th><th className="text-left p-1.5 font-medium">Actions</th></tr></thead><tbody className="divide-y">
                      {resources
                        .filter(r => category === 'all' || r.category === category)
                        .map((resource) => (
                          <tr key={resource.id} className="border-b hover:bg-muted/30">
                            <td className="p-1.5">
                              <p className="text-[11px] font-medium truncate max-w-[160px]">{resource.title}</p>
                              {resource.description && <p className="text-[9px] text-muted-foreground line-clamp-1">{resource.description}</p>}
                            </td>
                            <td className="p-1.5"><Badge className="text-[8px] px-1 py-0 h-4">{resource.category}</Badge></td>
                            <td className="p-1.5 text-[10px]">{resource.type}</td>
                            <td className="p-1.5">
                              {resource.exam && <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">{resource.exam}</Badge>}
                            </td>
                            <td className="p-1.5">
                              <div className="flex items-center gap-1">
                                {resource.view_url && (
                                  <a href={resource.view_url} target="_blank" className="p-1 rounded hover:bg-muted/60" title="View"><FileText className="h-3 w-3" /></a>
                                )}
                                {resource.external_url && (
                                  <a href={resource.external_url} target="_blank" className="p-1 rounded hover:bg-muted/60" title="Visit"><ExternalLink className="h-3 w-3" /></a>
                                )}
                                <button onClick={() => handleDelete(resource.id, getFilePathFromUrl(resource.view_url))} className="p-1 rounded hover:bg-destructive/10 text-destructive" title="Delete">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {resources.filter(r => category === 'all' || r.category === category).length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-[11px] text-muted-foreground">
                            No resources found in this category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
