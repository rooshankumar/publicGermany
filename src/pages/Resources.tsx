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
  image_url?: string; // Front page image
  view_url?: string;
  download_url?: string;
  external_url?: string;
  tags: string[];
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
    view_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/A1.pdf',
    download_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/A1.pdf',
    image_url: 'data:image/jpeg;base64,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',
    tags: ['goethe', 'a1', 'pdf'],
  },
  {
    id: 'goethe-a2',
    title: 'Goethe A2 Handwritten Notes',
    description: 'Official handwritten notes for Goethe A2 exam.',
    exam: 'Goethe',
    level: 'A2',
    type: 'PDF',
    view_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/A2.pdf',
    download_url: 'https://rzbnrlfujjxyrypbafdp.supabase.co/storage/v1/object/public/resources/German/A2.pdf',
    image_url: 'data:image/png;base64,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',
    tags: ['goethe', 'a2', 'pdf'],
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
        <Card key={mat.id} className={`hover:shadow-xl transition-shadow flex flex-col h-full`}>
          <CardHeader className="p-0 overflow-hidden">
            {mat.image_url && (
              <img
                src={mat.image_url}
                alt={mat.title}
                className="w-full h-44 object-contain bg-white rounded-t-lg border-b border-dashed"
              />
            )}
          </CardHeader>
          <CardContent className="flex flex-col flex-grow p-5">
            <CardTitle className="text-lg font-semibold line-clamp-2 mb-1">{mat.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground line-clamp-3 mb-2">{mat.description}</CardDescription>
            <div className="flex flex-wrap gap-1 mt-auto mb-2">
              <Badge variant="secondary" className="text-xs">{mat.exam}</Badge>
              <Badge variant="outline" className="text-xs">{mat.level}</Badge>
              {mat.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
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
        <Card key={res.id} className={`hover:shadow-xl transition-shadow flex flex-col h-full`}>
          <CardContent className="flex flex-col flex-grow p-5">
            <CardTitle className="text-lg font-semibold mb-1">
              <a
                href={res.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                {res.title}
              </a>
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground line-clamp-3 mb-2">{res.description}</CardDescription>
            <div className="flex flex-wrap gap-1 mt-auto mb-2">
              {res.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-2 w-full">
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
        <div>
          <h1 className="text-3xl font-bold mb-2">Resources</h1>
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
              className={`flex-grow px-6 py-4 rounded-xl shadow-sm font-semibold bg-white hover:${sec.bg} focus:${sec.bg} border-2 
                ${activeSection === sec.key ? `${sec.accent} border-solid` : 'border-transparent'} flex flex-col gap-1 items-center transition-all group`}
              onClick={() => setActiveSection(sec.key as typeof activeSection)}
              tabIndex={0}
            >
              {sec.icon}
              <span className={`mt-2 text-base ${activeSection === sec.key ? 'text-primary' : 'text-muted-foreground'}`}>
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
