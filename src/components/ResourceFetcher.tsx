import { useState } from 'react';
import InlineLoader from '@/components/InlineLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Globe, ExternalLink, Clock, BookOpen } from 'lucide-react';

interface FetchedResource {
  title: string;
  description: string;
  url: string;
  content: string;
  fetchedAt: string;
}

const PRESET_RESOURCES = [
  { 
    name: "DAAD Official", 
    url: "https://www.daad.de/en/",
    description: "Official German Academic Exchange Service"
  },
  { 
    name: "Study in Germany", 
    url: "https://www.study-in-germany.de/en/",
    description: "Official portal for international students"
  },
  { 
    name: "APS India", 
    url: "https://www.germany.travel/en/ms/german-missions-abroad/india/services/aps.html",
    description: "Academic Evaluation Centre India"
  },
  { 
    name: "Make-it-in-germany", 
    url: "https://www.make-it-in-germany.com/en/",
    description: "Official portal for skilled professionals"
  }
];

export const ResourceFetcher = () => {
  const [customUrl, setCustomUrl] = useState('');
  const [fetchedResources, setFetchedResources] = useState<FetchedResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchResource = async (url: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://rzbnrlfujjxyrypbafdp.supabase.co/functions/v1/fetch-resource', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Ym5ybGZ1amp4eXJ5cGJhZmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMjM5MzAsImV4cCI6MjA3MTU5OTkzMH0.hX9mqiIt4mBjyvk8Y5HrM6b5VvPQwRbA4ZvsCqyQ05o`
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) throw new Error('Failed to fetch resource');

      const data = await response.json();
      const newResource: FetchedResource = {
        title: data.title || 'Untitled Resource',
        description: data.description || 'No description available',
        url: url,
        content: data.content || '',
        fetchedAt: new Date().toISOString()
      };

      setFetchedResources(prev => [newResource, ...prev]);
      setCustomUrl('');
      
      toast({
        title: "Resource fetched!",
        description: `Successfully fetched content from ${new URL(url).hostname}`,
      });
    } catch (error) {
      console.error('Failed to fetch resource:', error);
      toast({
        title: "Error",
        description: "Failed to fetch resource. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (url: string) => {
    fetchResource(url);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      fetchResource(customUrl.trim());
    }
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Resource Fetcher
          </CardTitle>
          <CardDescription>
            Fetch the latest information from official German study abroad websites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && <InlineLoader label="Fetching resource" />}
          <div>
            <h4 className="font-medium mb-3">Quick Access Resources</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESET_RESOURCES.map((resource, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => handlePresetClick(resource.url)}
                  disabled={isLoading}
                >
                  <div className="text-left">
                    <div className="font-medium">{resource.name}</div>
                    <div className="text-xs text-muted-foreground">{resource.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-3">Custom URL</h4>
            <form onSubmit={handleCustomSubmit} className="flex gap-2">
              <Input
                placeholder="Enter any website URL..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                type="url"
              />
              <Button type="submit" disabled={isLoading || !customUrl.trim()}>
                {isLoading ? "Fetching..." : "Fetch"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {fetchedResources.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Fetched Resources</h3>
          {fetchedResources.map((resource, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(resource.fetchedAt).toLocaleDateString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ExternalLink className="w-4 h-4" />
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {resource.url}
                    </a>
                  </div>
                  
                  {resource.content && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <BookOpen className="w-4 h-4" />
                        Content Preview
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md text-sm">
                        {truncateContent(resource.content)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};