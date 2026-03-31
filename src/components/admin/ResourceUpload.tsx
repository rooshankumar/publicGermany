import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";

const ResourceUpload = ({ onUploadSuccess }: { onUploadSuccess?: () => void }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'IELTS',
  });

  const DEFAULT_IMAGES: Record<string, string> = {
    'German': 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/ChatGPT%20Image%20Oct%2015,%202025,%2008_55_11%20AM-overlay.png',
    'IELTS': 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/ChatGPT%20Image%20Mar%2031,%202026,%2010_37_41%20PM.png',
    'Additional': 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/ChatGPT%20Image%20Mar%2031,%202026,%2010_39_41%20PM.png'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = ['application/pdf', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.toLowerCase().endsWith('.mp3')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Audio file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "File required", description: "Select a PDF or Audio", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${formData.category}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('resources').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('resources').getPublicUrl(filePath);
      const fileType = file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3') ? 'Audio' : 'PDF';
      const imageUrl = DEFAULT_IMAGES[formData.category] || DEFAULT_IMAGES['Additional'];

      const { error: dbError } = await supabase.from('resources').insert([{
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: fileType,
        download_url: publicUrl,
        view_url: publicUrl,
        image_url: imageUrl,
      }]);

      if (dbError) throw dbError;

      toast({ title: "Success", description: "Uploaded!" });
      setFormData({ title: '', description: '', category: 'IELTS' });
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs">Title</Label>
            <Input id="title" required size={1} className="h-8 text-sm" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="category" className="text-xs">Category</Label>
            <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IELTS">IELTS</SelectItem>
                <SelectItem value="German">German</SelectItem>
                <SelectItem value="Additional">Additional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="file" className="text-xs">File (PDF/Audio)</Label>
            <Input id="file" type="file" accept=".pdf,audio/*" onChange={handleFileChange} className="h-8 text-sm cursor-pointer py-1" />
          </div>
          <Button type="submit" size="sm" className="h-8" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="mr-2 h-4 w-4" /> Upload</>}
          </Button>
          <div className="md:col-span-4 space-y-1">
            <Label htmlFor="description" className="text-xs">Description</Label>
            <Input id="description" required className="h-8 text-sm" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." />
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResourceUpload;
