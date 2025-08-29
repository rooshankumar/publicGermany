import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) setError(error.message);
      else setStudents(data || []);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Students</h1>
      <div className="bg-card rounded-lg shadow p-4">
        {loading ? <div>Loading...</div> : error ? <div className="text-red-500">{error}</div> : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student: any) => (
                <tr key={student.id} className="border-t">
                  <td>
                    <a href={`/admin/student-profile?id=${student.id}`} className="text-primary underline">
                      {student.full_name || student.name}
                    </a>
                  </td>
                  <td>{student.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
