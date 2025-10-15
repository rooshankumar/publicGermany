import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  GraduationCap,
  BookOpen,
  FileText,
  Download,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// --- Study Material Interface ---
interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  exam: string;
  level: string;
  type: string;
  category: string;
  image_url?: string; // Front page image
  view_url?: string;
  download_url?: string;
  external_url?: string;
  tags: string[];
  isNew?: boolean;
}

// --- General Resource Interface ---
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

// --- Sample Images for Books ---
const ieltsBooks: StudyMaterial[] = [
  {
    id: 'ielts-19',
    title: 'Cambridge IELTS 19 Academic',
    description: 'Official Cambridge IELTS 19 Academic book (PDF).',
    exam: 'IELTS',
    level: 'Academic',
    type: 'PDF',
    category: 'IELTS',
    view_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/Cambridge%2019%20Academic.pdf',
    download_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/Cambridge%2019%20Academic.pdf',
    image_url: 'https://tse3.mm.bing.net/th/id/OIP.ua8f9rYf7f2g97Ste1YS5AHaEK?pid=Api',
    tags: ['ielts', 'cambridge', '19'],
  },
  {
    id: 'ielts-18',
    title: 'Cambridge IELTS 18 Academic',
    description: 'Official Cambridge IELTS 18 Academic book (PDF).',
    exam: 'IELTS',
    level: 'Academic',
    type: 'PDF',
    category: 'IELTS',
    view_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/Cambridge%2018_compressed.pdf',
    download_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/Cambridge%2018_compressed.pdf',
    image_url: 'data:image/jpeg;base64,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',
    tags: ['ielts', 'cambridge', '18'],
  },
  {
    id: 'ielts-17',
    title: 'Cambridge IELTS 17 Academic',
    description: 'Official Cambridge IELTS 17 Academic book (PDF).',
    exam: 'IELTS',
    level: 'Academic',
    type: 'PDF',
    category: 'IELTS',
    view_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/Cambridge%20IELTS%2017.pdf',
    download_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/IELTS%20/Cambridge%20IELTS%2017.pdf',
    image_url: 'https://tse4.mm.bing.net/th/id/OIP.TENWPRAiKRLgpWugzW3WpgHaHa?pid=Api',
    tags: ['ielts', 'cambridge', '17'],
  },
];

const germanMaterials: StudyMaterial[] = [
  {
    id: 'goethe-a1',
    title: 'Goethe A1 Handwritten Notes',
    description: 'Official handwritten notes for Goethe A1. Ideal for beginners.',
    exam: 'Goethe',
    level: 'A1',
    type: 'PDF',
    category: 'German',
    view_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/A1.pdf',
    download_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/A1.pdf',
    image_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/ChatGPT%20Image%20Oct%2015,%202025,%2008_55_11%20AM-overlay.png',
    tags: ['goethe', 'a1', 'pdf'],
  },
  {
    id: 'goethe-a2',
    title: 'Goethe A2 Handwritten Notes',
    description: 'Official handwritten notes for Goethe A2 exam.',
    exam: 'Goethe',
    level: 'A2',
    type: 'PDF',
    category: 'German',
    view_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/A2.pdf',
    download_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/A2.pdf',
    image_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/ChatGPT%20Image%20Oct%2015,%202025,%2008_55_11%20AM-overlay.png',
    tags: ['goethe', 'a2', 'pdf'],
  },
  // New German learning PDFs
  {
    id: 'arbeitsbuch-b1',
    title: 'Arbeitsbuch B1.1',
    description: 'Practice workbook for German B1.1 level with exercises and solutions.',
    exam: 'Goethe',
    level: 'B1.1',
    type: 'PDF',
    category: 'German',
    isNew: true,
    view_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/Arbeitsbuch%20B1.1.pdf',
    download_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/Arbeitsbuch%20B1.1.pdf',
    image_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/ChatGPT%20Image%20Oct%2015,%202025,%2008_55_11%20AM-overlay.png',
    tags: ['german', 'b1', 'workbook'],
  },
  {
    id: 'german-made-simple',
    title: 'German Made Simple',
    description: 'Comprehensive guide to learn German from basics to advanced level.',
    exam: 'General',
    level: 'A1-B2',
    type: 'PDF',
    category: 'German',
    isNew: true,
    view_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/German%20Made%20Simple_%20Learn%20to%20Speak%20and%20Understand%20German%20Quickly%20and%20Easily%20-%20PDF%20Room.pdf',
    download_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/German%20Made%20Simple_%20Learn%20to%20Speak%20and%20Understand%20German%20Quickly%20and%20Easily%20-%20PDF%20Room.pdf',
    image_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/ChatGPT%20Image%20Oct%2015,%202025,%2008_55_11%20AM-overlay.png',
    tags: ['german', 'textbook', 'comprehensive'],
  },
  {
    id: 'kursbuch-b1-1',
    title: 'Kursbuch B1.1',
    description: 'Main coursebook for German B1.1 level with texts and exercises.',
    exam: 'Goethe',
    level: 'B1.1',
    type: 'PDF',
    category: 'German',
    isNew: true,
    view_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/Kursbuch%20B1.1.pdf',
    download_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/Kursbuch%20B1.1.pdf',
    image_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/ChatGPT%20Image%20Oct%2015,%202025,%2008_55_11%20AM-overlay.png',
    tags: ['german', 'b1', 'coursebook'],
  },
  {
    id: 'kursbuch-b1-2',
    title: 'Kursbuch B1.2',
    description: 'Main coursebook for German B1.2 level with texts and exercises.',
    exam: 'Goethe',
    level: 'B1.2',
    type: 'PDF',
    category: 'German',
    isNew: true,
    view_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/Kursbuch%20B1.2.pdf',
    download_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/Kursbuch%20B1.2.pdf',
    image_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/ChatGPT%20Image%20Oct%2015,%202025,%2008_55_11%20AM-overlay.png',
    tags: ['german', 'b1', 'coursebook'],
  },
];

const additionalResources: Resource[] = [
  {
    id: 'daad',
    title: 'DAAD Official Portal',
    description: 'Official German Academic Exchange Service portal.',
    category: 'guides',
    external_url: 'https://www.daad.de/',
    language: 'english',
    tags: ['daad', 'study', 'germany'],
    created_at: '2025-01-01',
  },
  {
    id: 'uni-assist',
    title: 'Uni-assist Portal',
    description: 'Application portal for German universities.',
    category: 'guides',
    external_url: 'https://www.uni-assist.de/en/',
    language: 'english',
    tags: ['uni-assist', 'applications'],
    created_at: '2025-01-01',
  },
  {
    id: 'aps',
    title: 'APS India Academic Evaluation',
    description: 'Official APS evaluation for Indian applicants.',
    category: 'requirements',
    external_url: 'https://www.aps-india.de/en/',
    language: 'english',
    tags: ['aps', 'india'],
    created_at: '2025-01-01',
  },
];

// Section configuration and theme colors
const sections = [
  {
    key: 'IELTS',
    label: 'IELTS Resources',
    icon: <GraduationCap className="h-8 w-8 text-blue-500" />,
    bg: 'bg-blue-50',
    materials: ieltsBooks,
    accent: 'border-blue-500',
  },
  {
    key: 'German',
    label: 'German Resources',
    icon: <BookOpen className="h-8 w-8 text-green-500" />,
    bg: 'bg-green-50',
    materials: germanMaterials,
    accent: 'border-green-500',
  },
  {
    key: 'Additional',
    label: 'Additional Resources',
    icon: <ExternalLink className="h-8 w-8 text-yellow-500" />,
    bg: 'bg-yellow-50',
    materials: [],
    accent: 'border-yellow-500',
  },
];

const Resources = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'IELTS' | 'German' | 'Additional'>('IELTS');

  const renderMaterialActions = (material: StudyMaterial) => (
    <div className="mt-3 flex gap-2 flex-wrap">
      {material.view_url && (
        <Button asChild variant="outline" className="flex-1 min-w-[110px]">
          <a href={material.view_url} target="_blank" rel="noopener noreferrer">
            View <FileText className="inline ml-1 h-4 w-4" />
          </a>
        </Button>
      )}
      {material.download_url && (
        <Button asChild variant="outline" className="flex-1 min-w-[110px]">
          <a href={material.download_url} download>
            Download <Download className="inline ml-1 h-4 w-4" />
          </a>
        </Button>
      )}
      {material.external_url && (
        <Button asChild variant="outline" className="flex-1 min-w-[110px]">
          <a href={material.external_url} target="_blank" rel="noopener noreferrer">
            Visit <ExternalLink className="inline ml-1 h-4 w-4" />
          </a>
        </Button>
      )}
    </div>
  );

  // Grid for study materials
  const renderMaterialsGrid = (materials: StudyMaterial[], accent: string) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-6 animate-fadein">
      {materials.map((mat) => (
        <Card key={mat.id} className="glass-card border-border/30 hover:shadow-glass-dark transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] flex flex-col h-full group">
          <CardHeader className="p-0 overflow-hidden relative">
            {mat.image_url && (
              <div className="relative overflow-hidden">
                <img
                  src={mat.image_url}
                  alt={mat.title}
                  className="w-full h-44 object-contain bg-gradient-to-br from-background to-muted/30 rounded-t-xl border-b transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            )}
          </CardHeader>
          <CardContent className="flex flex-col flex-grow p-5">
            <CardTitle className="text-lg font-bold line-clamp-2 mb-2 text-foreground group-hover:text-primary transition-colors">{mat.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">{mat.description}</CardDescription>
            <div className="flex flex-wrap gap-1.5 mt-auto mb-3">
              <Badge variant="secondary" className="text-xs font-semibold bg-primary/10 text-primary border-primary/20">{mat.exam}</Badge>
              <Badge variant="outline" className="text-xs font-medium border-border/40">{mat.level}</Badge>
              {mat.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs bg-accent/10 text-foreground/80">{tag}</Badge>
              ))}
            </div>
            {renderMaterialActions(mat)}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Grid for additional resource links
  const renderAdditionalGrid = (resources: Resource[], accent: string) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-6 animate-fadein">
      {resources.map((res) => (
        <Card key={res.id} className="glass-card border-border/30 hover:shadow-glass-dark transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] flex flex-col h-full group">
          <CardContent className="flex flex-col flex-grow p-5">
            <CardTitle className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
              <a
                href={res.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {res.title}
              </a>
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">{res.description}</CardDescription>
            <div className="flex flex-wrap gap-1.5 mt-auto mb-3">
              {res.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs bg-accent/10 text-foreground/80">{tag}</Badge>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-2 w-full glass-subtle border-border/40 hover:bg-primary/10 hover:text-primary font-semibold transition-all">
              <a href={res.external_url} target="_blank" rel="noopener noreferrer">
                Visit <ExternalLink className="inline ml-1 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-2 sm:px-6 py-10 space-y-8">
        <div className="glass-panel p-6 border-border/30">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Resources</h1>
          <p className="text-muted-foreground">
            Explore major study material sets and all official portals for your exam and university needs.
          </p>
        </div>
        {/* Section Tabs */}
        <div className="flex flex-wrap gap-4 justify-between items-stretch">
          {sections.map((sec) => (
            <button
              key={sec.key}
              type="button"
              className={`flex-grow px-6 py-4 glass-panel shadow-glass font-semibold hover:shadow-glass-dark focus:shadow-glass-dark border-2 
                ${activeSection === sec.key ? `${sec.accent} border-primary/50` : 'border-transparent'} flex flex-col gap-1 items-center transition-all group hover:-translate-y-0.5`}
              onClick={() => setActiveSection(sec.key as typeof activeSection)}
              tabIndex={0}
            >
              {sec.icon}
              <span className={`mt-2 text-base font-semibold ${activeSection === sec.key ? 'text-primary' : 'text-muted-foreground'}`}>
                {sec.label}
              </span>
              <ArrowRight className={`group-hover:translate-x-2 transition ml-0 h-5 w-5 opacity-60`} />
            </button>
          ))}
        </div>
        {/* Section Grids */}
        <div>
          {activeSection === 'IELTS' && renderMaterialsGrid(ieltsBooks, sections[0].accent)}
          {activeSection === 'German' && renderMaterialsGrid(germanMaterials, sections[1].accent)}
          {activeSection === 'Additional' && renderAdditionalGrid(additionalResources, sections[2].accent)}
        </div>
      </div>
      {/* Fade in animation style */}
      <style>
        {`
          .animate-fadein {
            animation: fade-in .4s cubic-bezier(.12,.92,.57,1.15);
          }
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.98);}
            to { opacity: 1; transform: scale(1);}
          }
          .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;}
          .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;}
        `}
      </style>
    </Layout>
  );
};

export default Resources;
