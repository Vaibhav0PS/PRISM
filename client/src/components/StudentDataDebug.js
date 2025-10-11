import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const StudentDataDebug = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkStudentData();
  }, []);

  const checkStudentData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Checking student data in database...');
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching students:', error);
        setError(error.message);
        return;
      }
      
      console.log('📊 Students data:', data);
      setStudents(data || []);
      
    } catch (err) {
      console.error('💥 Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fixStudentData = async (studentId) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student || !student.documents) return;

      // Convert old format to new format
      const documents = Array.isArray(student.documents) ? student.documents : 
                       typeof student.documents === 'string' ? JSON.parse(student.documents) : [];
      
      const documentUrls = documents.map(doc => doc.url || doc);
      const documentTypes = documents.map(doc => doc.type || 'other');

      const { error } = await supabase
        .from('students')
        .update({
          documents_url: documentUrls,
          document_types: documentTypes
        })
        .eq('id', studentId);

      if (error) throw error;

      alert('Student data fixed! Refresh to see changes.');
      checkStudentData();
      
    } catch (err) {
      console.error('Error fixing student data:', err);
      alert('Error fixing data: ' + err.message);
    }
  };

  if (loading) {
    return <div className="p-4">Loading student data...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 m-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Student Data Debug</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          Error: {error}
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={checkStudentData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Refresh Data
        </button>
      </div>

      {students.length === 0 ? (
        <p className="text-gray-500">No students found in database.</p>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <div key={student.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{student.student_name}</h4>
                <span className="text-sm text-gray-500">ID: {student.student_id}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Old documents field:</strong>
                  <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto">
                    {JSON.stringify(student.documents, null, 2) || 'null'}
                  </pre>
                </div>
                
                <div>
                  <strong>documents_url field:</strong>
                  <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto">
                    {JSON.stringify(student.documents_url, null, 2) || 'null'}
                  </pre>
                </div>
                
                <div>
                  <strong>document_types field:</strong>
                  <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto">
                    {JSON.stringify(student.document_types, null, 2) || 'null'}
                  </pre>
                </div>
              </div>

              {student.documents && !student.documents_url && (
                <div className="mt-3">
                  <button
                    onClick={() => fixStudentData(student.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Fix Data Format
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDataDebug;