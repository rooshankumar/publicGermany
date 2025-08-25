import Layout from '@/components/Layout';
import { ContactForm } from '@/components/ContactForm';

const Contact = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact & Support</h1>
          <p className="text-muted-foreground">Get in touch with our team</p>
        </div>
        
        <ContactForm />
      </div>
    </Layout>
  );
};

export default Contact;