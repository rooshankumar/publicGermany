import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ExternalLink, 
  BookOpen,
  GraduationCap,
  Search,
  Filter
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'guides' | 'requirements';
  external_url: string;
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

  const mockResources: Resource[] = [
    {
      id: '1',
      title: 'DAAD Official Portal',
      description: 'Official German Academic Exchange Service for international students',
      category: 'guides',
      external_url: 'https://www.daad.de/',
      language: 'english',
      tags: ['daad', 'official', 'study', 'germany'],
      created_at: '2025-01-01'
    },
    {
      id: '2',
      title: 'APS India Academic Evaluation Centre',
      description: 'Official APS procedure and guidelines for Indian applicants',
      category: 'requirements',
      external_url: 'https://www.aps-india.de/en/',
      language: 'english',
      tags: ['aps', 'certificate', 'india', 'official'],
      created_at: '2025-01-01'
    },
    {
      id: '3',
      title: 'Uni-assist Portal',
      description: 'Portal for application processing to German universities',
      category: 'guides',
      external_url: 'https://www.uni-assist.de/en/',
      language: 'english',
      tags: ['uni-assist', 'applications', 'universities'],
      created_at: '2025-01-01'
    },
    {
      id: '4',
      title: 'German Missions Visa Information',
      description: 'Official German visa information and guidelines for India',
      category: 'requirements',
      external_url: 'https://india.diplo.de/in-en/service/2552164-2552164',
      language: 'english',
      tags: ['visa', 'germany', 'official', 'india'],
      created_at: '2025-01-01'
    },
    {
      id: '5',
      title: 'Study in Germany - Official Portal',
      description: 'Information portal for studying in Germany with language, visa, and university advice',
      category: 'guides',
      external_url: 'https://www.study-in-germany.de/en/',
      language: 'english',
      tags: ['study', 'germany', 'language', 'official'],
      created_at: '2025-01-01'
    },
    {
      id: '6',
      title: 'Goethe-Institut - Learn German',
      description: 'Official site for German language courses and certification worldwide',
      category: 'guides',
      external_url: 'https://www.goethe.de/en/index.html',
      language: 'english',
      tags: ['german', 'language', 'goethe', 'certification'],
      created_at: '2025-01-01'
    }
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setResources(mockResources);
      setLoading(false);
    }, 500);
  }, []);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
    const matchesLanguage = languageFilter === 'all' || resource.language === languageFilter;
    return matchesSearch && matchesCategory && matchesLanguage;
  });

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'guides': return 'bg-success/10 text-success';
      case 'requirements': return 'bg-secondary/10 text-secondary';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Resources</h1>
          <p className="text-muted-foreground">
            Important official resources and portals for your Germany study journey
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
              <Input
                placeholder="Search resources, tags, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="guides">Guides</SelectItem>
                  <SelectItem value="requirements">Requirements</SelectItem>
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
          </CardContent>
        </Card>

        {/* Resources List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
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
              <p className="text-muted-foreground">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            filteredResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className={`p-2 rounded-lg ${getCategoryColor(resource.category)}`}>
                    <BookOpen className="h-5 w-5 text-inherit" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg">
                    <a href={resource.external_url} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                      {resource.title}
                    </a>
                  </CardTitle>
                  <CardDescription className="text-sm">{resource.description}</CardDescription>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {resource.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-4 w-full"
                  >
                    <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                      Visit Link <ExternalLink className="inline h-4 w-4 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Resources;
