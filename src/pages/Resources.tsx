import React, { useState, useEffect } from 'react';
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
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from "@/integrations/supabase/client";

// --- Interfaces ---
interface Resource {
  id: string;
  title: string;
  description: string;
  exam?: string;
  level?: string;
  type?: string;
  category: 'IELTS' | 'German' | 'Additional';
  image_url?: string;
  view_url?: string;
  download_url?: string;
  external_url?: string;
  tags: string[];
  is_new?: boolean;
}

const Resources = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'IELTS' | 'German' | 'Additional'>('IELTS');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setResources((data as unknown as Resource[]) || []);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const sections = [
    {
      key: 'IELTS',
      label: 'IELTS Resources',
      icon: <GraduationCap className="h-8 w-8 text-blue-500" />,
      accent: 'border-blue-500',
    },
    {
      key: 'German',
      label: 'German Resources',
      icon: <BookOpen className="h-8 w-8 text-green-500" />,
      accent: 'border-green-500',
    },
    {
      key: 'Additional',
      label: 'Additional Resources',
      icon: <ExternalLink className="h-8 w-8 text-yellow-500" />,
      accent: 'border-yellow-500',
    },
  ] as const;

  const renderMaterialActions = (material: Resource) => (
    <div className="mt-auto pt-4 flex gap-2 flex-wrap">
      {material.view_url && (
        <Button asChild variant="outline" className="flex-1 min-w-[110px] border-primary/20 hover:bg-primary/5">
          <a href={material.view_url} target="_blank" rel="noopener noreferrer">
            <FileText className="mr-2 h-4 w-4" /> View
          </a>
        </Button>
      )}
      {material.download_url && (
        <Button asChild className="flex-1 min-w-[110px] shadow-sm">
          <a href={material.download_url} download target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" /> Download
          </a>
        </Button>
      )}
      {material.external_url && !material.download_url && (
        <Button asChild variant="outline" className="flex-1 min-w-[110px]">
          <a href={material.external_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" /> Visit
          </a>
        </Button>
      )}
    </div>
  );

  const renderResourcesGrid = (filteredResources: Resource[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-6 animate-fadein">
      {filteredResources.map((res) => (
        <Card key={res.id} className="glass-card border-border/30 hover:shadow-glass-dark transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] flex flex-col h-full group">
          <CardHeader className="p-0 overflow-hidden relative">
            {res.image_url ? (
              <div className="relative overflow-hidden">
                <img
                  src={res.image_url}
                  alt={res.title}
                  className="w-full h-44 object-contain bg-gradient-to-br from-background to-muted/30 rounded-t-xl border-b transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ) : (
              <div className="w-full h-44 bg-muted/20 flex items-center justify-center rounded-t-xl border-b">
                <FileText className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
          </CardHeader>
          <CardContent className="flex flex-col flex-grow p-5">
            <div className="flex justify-between items-start mb-2 gap-2">
              <CardTitle className="text-lg font-bold line-clamp-2 text-foreground group-hover:text-primary transition-colors">{res.title}</CardTitle>
              {res.type && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold bg-muted/50">
                  {res.type}
                </Badge>
              )}
            </div>
            <CardDescription className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{res.description}</CardDescription>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {res.exam && <Badge variant="secondary" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">{res.exam}</Badge>}
              {res.level && <Badge variant="outline" className="text-[10px] font-medium border-border/40">{res.level}</Badge>}
              {res.tags?.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] bg-accent/10 text-foreground/80 lowercase">#{tag}</Badge>
              ))}
            </div>
            {renderMaterialActions(res)}
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

        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading resources...</p>
            </div>
          ) : (
            <>
              {renderResourcesGrid(resources.filter(r => r.category === activeSection))}
              {resources.filter(r => r.category === activeSection).length === 0 && (
                <div className="text-center py-20 glass-panel border-dashed border-2">
                  <p className="text-muted-foreground italic">No resources found in this category yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
