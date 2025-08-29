import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
  const { data, error } = await supabase.from('service_requests').select('*');
      if (error) setError(error.message);
      else setRequests(data || []);
      setLoading(false);
    };
    fetchRequests();
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Requests</h1>
      <div className="bg-card rounded-lg shadow p-4">
        {loading ? <div>Loading...</div> : error ? <div className="text-red-500">{error}</div> : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req: any) => (
                <tr key={req.id} className="border-t">
                  <td>{req.student_name || req.student}</td>
                  <td>{req.status}</td>
                  <td>{req.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
