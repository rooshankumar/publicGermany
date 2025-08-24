import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Resources = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resources</h1>
          <p className="text-muted-foreground">Guides and resources for studying in Germany</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Study Guides & Resources</CardTitle>
            <CardDescription>
              Coming soon - Curated guides for your Germany study journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This section will include guides for APS, visa process, university applications, and more.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Resources;