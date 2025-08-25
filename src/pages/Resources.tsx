import Layout from '@/components/Layout';
import { ResourceFetcher } from '@/components/ResourceFetcher';

const Resources = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resources</h1>
          <p className="text-muted-foreground">Fetch the latest guides and resources for studying in Germany</p>
        </div>
        
        <ResourceFetcher />
      </div>
    </Layout>
  );
};

export default Resources;