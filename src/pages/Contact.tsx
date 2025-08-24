import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Contact = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact & Support</h1>
          <p className="text-muted-foreground">Get in touch with our team</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Coming soon - Multiple ways to get support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page will include contact forms, support channels, and FAQ.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Contact;