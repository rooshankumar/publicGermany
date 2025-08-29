import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('applications').select('*');
      if (error) setError(error.message);
      else setApplications(data || []);
      setLoading(false);
    };
    fetchApplications();
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Applications</h1>
      <div className="bg-card rounded-lg shadow p-4">
        {loading ? <div>Loading...</div> : error ? <div className="text-red-500">{error}</div> : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Student</th>
                <th>University</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app: any) => (
                <tr key={app.id} className="border-t">
                  <td>{app.student_name || app.student}</td>
                  <td>{app.university}</td>
                  <td>{app.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
