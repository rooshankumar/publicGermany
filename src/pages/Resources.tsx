import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  FileText, 
  ExternalLink, 
  BookOpen,
  GraduationCap,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ResourceFetcher } from '@/components/ResourceFetcher';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'forms' | 'guides' | 'templates' | 'requirements' | 'checklists';
  file_url?: string;
  external_url?: string;
  language: 'english' | 'german';
  tags: string[];
  created_at: string;
}

const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const { toast } = useToast();

  // Mock data - in real app this would come from Supabase
  const mockResources: Resource[] = [
    {
      id: '1',
      title: 'APS Certificate Application Form',
      description: 'Official form for APS certificate application with instructions',
      category: 'forms',
      file_url: '/resources/aps-form.pdf',
      language: 'english',
      tags: ['aps', 'certificate', 'application', 'form'],
      created_at: '2024-01-15'
    },
    {
      id: '2',
      title: 'University Application Guide 2024',
      description: 'Complete guide for applying to German universities including deadlines and requirements',
      category: 'guides',
      external_url: 'https://daad.de/university-guide',
      language: 'english',
      tags: ['university', 'application', 'guide', 'daad'],
      created_at: '2024-01-10'
    },
    {
      id: '3',
      title: 'Statement of Purpose Template',
      description: 'Professional template for writing Statement of Purpose for German universities',
      category: 'templates',
      file_url: '/resources/sop-template.docx',
      language: 'english',
      tags: ['sop', 'template', 'writing', 'application'],
      created_at: '2024-01-08'
    },
    {
      id: '4',
      title: 'Visa Requirements Checklist',
      description: 'Complete checklist of documents required for German student visa',
      category: 'checklists',
      file_url: '/resources/visa-checklist.pdf',
      language: 'english',
      tags: ['visa', 'checklist', 'documents', 'germany'],
      created_at: '2024-01-05'
    },
    {
      id: '5',
      title: 'Studienkolleg Aufnahmeprüfung Vorbereitung',
      description: 'Preparation guide for Studienkolleg entrance examination',
      category: 'guides',
      file_url: '/resources/stk-preparation-de.pdf',
      language: 'german',
      tags: ['studienkolleg', 'test', 'preparation', 'entrance'],
      created_at: '2024-01-03'
    },
    {
      id: '6',
      title: 'CV Template for German Applications',
      description: 'Europass-style CV template specifically designed for German university applications',
      category: 'templates',
      file_url: '/resources/cv-template-german.docx',
      language: 'english',
      tags: ['cv', 'template', 'europass', 'application'],
      created_at: '2024-01-01'
    }
  ];

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResources(mockResources);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
    const matchesLanguage = languageFilter === 'all' || resource.language === languageFilter;
    return matchesSearch && matchesCategory && matchesLanguage;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'forms': return <FileText className="h-5 w-5" />;
      case 'guides': return <BookOpen className="h-5 w-5" />;
      case 'templates': return <FileText className="h-5 w-5" />;
      case 'requirements': return <GraduationCap className="h-5 w-5" />;
      case 'checklists': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'forms': return 'bg-primary/10 text-primary';
      case 'guides': return 'bg-success/10 text-success';
      case 'templates': return 'bg-warning/10 text-warning';
      case 'requirements': return 'bg-secondary/10 text-secondary';
      case 'checklists': return 'bg-accent/50 text-foreground';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getLanguageBadge = (language: string) => {
    return (
      <Badge variant={language === 'english' ? 'default' : 'secondary'}>
        {language === 'english' ? 'EN' : 'DE'}
      </Badge>
    );
  };

  const handleDownload = (resource: Resource) => {
    if (resource.file_url) {
      // In a real app, this would be a proper download
      toast({
        title: "Download started",
        description: `Downloading ${resource.title}...`,
      });
    } else if (resource.external_url) {
      window.open(resource.external_url, '_blank');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Resources</h1>
          <p className="text-muted-foreground">
            Access important forms, guides, and templates for your Germany study journey
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search resources, tags, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="forms">Forms</SelectItem>
                    <SelectItem value="guides">Guides</SelectItem>
                    <SelectItem value="templates">Templates</SelectItem>
                    <SelectItem value="requirements">Requirements</SelectItem>
                    <SelectItem value="checklists">Checklists</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Fetcher Component */}
        <ResourceFetcher />

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-10 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : filteredResources.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No resources found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : (
            filteredResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${getCategoryColor(resource.category)}`}>
                        {getCategoryIcon(resource.category)}
                      </div>
                      {getLanguageBadge(resource.language)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {resource.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight">
                    {resource.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {resource.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{resource.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    className="w-full" 
                    variant={resource.file_url ? "default" : "outline"}
                    onClick={() => handleDownload(resource)}
                  >
                    {resource.file_url ? (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Link
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Links Section */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>
              Important external resources for your Germany study journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                asChild
              >
                <a href="https://www.daad.de" target="_blank" rel="noopener noreferrer">
                  <GraduationCap className="h-5 w-5" />
                  <span className="text-xs text-center">DAAD Portal</span>
                </a>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                asChild
              >
                <a href="https://www.aps.org.cn" target="_blank" rel="noopener noreferrer">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs text-center">APS Portal</span>
                </a>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                asChild
              >
                <a href="https://www.uni-assist.de" target="_blank" rel="noopener noreferrer">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-xs text-center">Uni-assist</span>
                </a>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                asChild
              >
                <a href="https://www.germany.travel/en/ms/german-missions/visa.html" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-5 w-5" />
                  <span className="text-xs text-center">Visa Info</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Resources;