import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  BookOpen,
  GraduationCap,
  FileText,
  Download,
  Search,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';


// --- Study Materials Data Structure ---
interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  exam: string;
  level: string;
  type: string;
  view_url?: string;
  download_url?: string;
  external_url?: string;
  tags: string[];
}


// --- Main Resource Interface (Unchanged) ---
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


// --- Static Study Materials Section (shown at top) ---
const studyMaterials: StudyMaterial[] = [
  {
    id: 'a1-note',
    title: 'Goethe A1 Handwritten Notes (Official)',
    description: 'Official handwritten notes for Goethe A1. Ideal for beginners preparing for Zertifikat A1.',
    exam: 'Goethe',
    level: 'A1',
    type: 'Handwritten Notes (PDF)',
    view_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/A1.pdf',
    download_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/A1.pdf',
    tags: ['pdf', 'handwritten', 'goethe', 'a1']
  },
  {
    id: 'a2-note',
    title: 'Goethe A2 Handwritten Notes (Official)',
    description: 'Official handwritten notes for Goethe A2. Structured for A2 exam preparation.',
    exam: 'Goethe',
    level: 'A2',
    type: 'Handwritten Notes (PDF)',
    view_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/A2.pdf',
    download_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/A2.pdf',
    tags: ['pdf', 'handwritten', 'goethe', 'a2']
  },
  {
    id: 'goethe-all',
    title: 'Goethe Official Practice Materials (A1–C2)',
    description: 'Official practice sets, online trainings, and sample exams for all Goethe levels.',
    exam: 'Goethe',
    level: 'A1–C2',
    type: 'Official Resource',
    external_url: 'https://www.goethe.de/en/spr/prf/ueb.html',
    tags: ['goethe', 'practice', 'all-levels', 'official']
  },
  {
    id: 'telc-materials',
    title: 'telc Official Teaching & Practice Materials',
    description: 'Free worksheets, vocabulary, audio, and print resources for telc A1–C2 exams.',
    exam: 'telc',
    level: 'A1–C2',
    type: 'Official Resource',
    external_url: 'https://www.telc.net/en/teaching-materials/',
    tags: ['telc', 'official', 'practice', 'all-levels']
  },
  {
    id: 'goethe-a1-online',
    title: 'Goethe A1 Online Practice',
    description: 'Official model papers, practice sets, and speaking video for Goethe-Zertifikat A1.',
    exam: 'Goethe',
    level: 'A1',
    type: 'Official Resource',
    external_url: 'https://www.goethe.de/ins/mm/en/spr/prf/gzsd1/ueb.html',
    tags: ['goethe', 'a1', 'practice', 'official']
  },
  {
    id: 'telc-a1-video',
    title: 'Best Books for TELC A1 German',
    description: 'YouTube guide to best books and resources for TELC A1 exam (2025).',
    exam: 'telc',
    level: 'A1',
    type: 'Video Resource',
    external_url: 'https://www.youtube.com/watch?v=kz4NYKEEgi8',
    tags: ['telc', 'a1', 'video', 'books']
];


// --- Main Resources Page Component ---
const Resources = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm] = useState('');
  const [categoryFilter] = useState('all');
  const [languageFilter] = useState('all');

  // --- Example existing resource entries ---
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
    setResources(mockResources);
    setLoading(false);
  }, []);

  // --- Filtering logic (unchanged as before) ---
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
    const matchesLanguage = languageFilter === 'all' || resource.language === languageFilter;
    return matchesSearch && matchesCategory && matchesLanguage;
  });

  // --- Category color for badge ---
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'guides': return 'bg-success/10 text-success';
      case 'requirements': return 'bg-secondary/10 text-secondary';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  // --- Reusable study-material actions buttons ---
  const renderMaterialActions = (material: StudyMaterial) => (
    <div className="mt-4 flex gap-2">
      {material.view_url && (
        <Button variant="outline" onClick={() => window.open(material.view_url!, '_blank', 'noopener,noreferrer')}>
          View PDF <FileText className="inline h-4 w-4 ml-1" />
        </Button>
      )}
      {material.download_url && (
        <Button variant="outline" onClick={() => window.open(material.download_url!, '_blank', 'noopener,noreferrer')}>
          Download <Download className="inline h-4 w-4 ml-1" />
        </Button>
      )}
      {material.external_url && (
        <Button variant="outline" onClick={() => window.open(material.external_url!, '_blank', 'noopener,noreferrer')}>
          Visit <ExternalLink className="inline h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );

  // --- Main UI ---
  const content = (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Resources</h1>
        <p className="text-muted-foreground">
          Important official resources, exclusive notes, and portals for your Germany study & language journey
        </p>
      </div>
      {/* ---- Study Materials Section (Always on Top) ---- */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-3 flex items-center gap-2">
          <GraduationCap className="inline h-6 w-6" />
          Study & Exam Materials
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {studyMaterials.map((material) => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="p-2 rounded-lg bg-primary/5 text-primary font-semibold">
                  {material.exam}
                  <span className="ml-2 text-xs text-muted-foreground">{material.level}</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-md">{material.title}</CardTitle>
                <CardDescription>{material.description}</CardDescription>
                <div className="flex flex-wrap gap-1 mt-2">
                  {material.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                {renderMaterialActions(material)}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {/* ---- General Resource Links List (as before) ---- */}
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
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => window.open(resource.external_url, '_blank', 'noopener,noreferrer')}
                >
                  Visit Link <ExternalLink className="inline h-4 w-4 ml-1" />
                </Button>
              </CardContent>
  }
];

useEffect(() => {
  setLoading(true);
  setResources(mockResources);
  setLoading(false);
}, []);

// --- Filtering logic (unchanged as before) ---
const filteredResources = resources.filter(resource => {
  const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
  const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
  const matchesLanguage = languageFilter === 'all' || resource.language === languageFilter;
  return matchesSearch && matchesCategory && matchesLanguage;
});

// --- Category color for badge ---
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'guides': return 'bg-success/10 text-success';
    case 'requirements': return 'bg-secondary/10 text-secondary';
    default: return 'bg-muted/10 text-muted-foreground';
  }
};

// --- Reusable study-material actions buttons ---
const renderMaterialActions = (material: StudyMaterial) => (
  <div className="mt-4 flex gap-2">
    {material.view_url && (
      <Button variant="outline" onClick={() => window.open(material.view_url!, '_blank', 'noopener,noreferrer')}>
        View PDF <FileText className="inline h-4 w-4 ml-1" />
      </Button>
    )}
    {material.download_url && (
      <Button variant="outline" onClick={() => window.open(material.download_url!, '_blank', 'noopener,noreferrer')}>
        Download <Download className="inline h-4 w-4 ml-1" />
      </Button>
    )}
    {material.external_url && (
      <Button variant="outline" onClick={() => window.open(material.external_url!, '_blank', 'noopener,noreferrer')}>
        Visit <ExternalLink className="inline h-4 w-4 ml-1" />
      </Button>
    )}
  </div>
);

// --- Main UI ---
const content = (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-2">Resources</h1>
      <p className="text-muted-foreground">
        Important official resources, exclusive notes, and portals for your Germany study & language journey
      </p>
    </div>
    {/* ---- Study Materials Section (Always on Top) ---- */}
    <div>
      <h2 className="text-2xl font-semibold text-foreground mb-3 flex items-center gap-2">
        <GraduationCap className="inline h-6 w-6" />
        Study & Exam Materials
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {studyMaterials.map((material) => (
          <Card key={material.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="p-2 rounded-lg bg-primary/5 text-primary font-semibold">
                {material.exam}
                <span className="ml-2 text-xs text-muted-foreground">{material.level}</span>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-md">{material.title}</CardTitle>
              <CardDescription>{material.description}</CardDescription>
              <div className="flex flex-wrap gap-1 mt-2">
                {material.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
              {renderMaterialActions(material)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    {/* ---- General Resource Links List (as before) ---- */}
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
                variant="outline"
                className="mt-4 w-full"
                onClick={() => window.open(resource.external_url, '_blank', 'noopener,noreferrer')}
              >
                Visit Link <ExternalLink className="inline h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  </div>
);

if (user) {
  return (
    <Layout>
      {content}
    </Layout>
  );
}

return (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/') }>
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>
      {content}
    </div>
  </div>
);

export default Resources;
