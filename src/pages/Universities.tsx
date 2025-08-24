import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Universities = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Universities</h1>
          <p className="text-muted-foreground">Browse and shortlist German universities</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>University Search & Shortlisting</CardTitle>
            <CardDescription>
              Coming soon - Browse German universities and create your shortlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This feature will include university search, filters, and shortlisting capabilities.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Universities;