import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function StudentProfile() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
  const { data, error } = await supabase.from('profiles').select('*, documents(*), files(*)').eq('id', id).single();
      if (error) setError(error.message);
      else setStudent(data);
      setLoading(false);
    };
    if (id) fetchStudent();
  }, [id]);

  const togglePayment = async () => {
    if (!student) return;
    const { error } = await supabase.from('payments').update({ complete: !student.payments?.complete }).eq('student_id', id);
    if (!error) setStudent({ ...student, payments: { ...student.payments, complete: !student.payments?.complete } });
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Student Profile</h1>
      <div className="bg-card rounded-lg shadow p-4 space-y-4">
        {loading ? <div>Loading...</div> : error ? <div className="text-red-500">{error}</div> : student && (
          <>
            <div>
              <div className="font-semibold">Name:</div>
              <div>{student.name}</div>
            </div>
            <div>
              <div className="font-semibold">Email:</div>
              <div>{student.email}</div>
            </div>
            <div>
              <div className="font-semibold">Documents:</div>
              <ul className="list-disc ml-6">
                {(student.documents || []).map((doc: any) => (
                  <li key={doc.id}><a href={doc.url} className="text-primary underline">{doc.name}</a></li>
                ))}
              </ul>
            </div>
            {/* Payment status removed: no payments table */}
          </>
        )}
      </div>
    </Layout>
  );
}
