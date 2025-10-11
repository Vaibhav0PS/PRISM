import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const StudentsManager = ({ school }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null); // eslint-disable-line no-unused-vars
    const [uploading, setUploading] = useState(false); // eslint-disable-line no-unused-vars

    const [studentForm, setStudentForm] = useState({
        student_name: '',
        student_id: '',
        class_grade: '',
        father_name: '',
        mother_name: '',
        date_of_birth: '',
        gender: 'male',
        category: 'general',
        phone_number: '',
        address: '',
        scholarship_eligible: false,
        scholarship_amount: '',
        documents: []
    });

    const [selectedFiles, setSelectedFiles] = useState([]);

    useEffect(() => {
        if (school) {
            loadStudents();
        }
    }, [school]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('school_id', school.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStudents(data || []);
        } catch (err) {
            console.error('Error loading students:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const uploadDocuments = async (studentId) => {
        if (selectedFiles.length === 0) return [];

        const uploadedDocs = [];
        setUploading(true);

        try {
            for (const file of selectedFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${studentId}/${Date.now()}.${fileExt}`;
                
                const { data, error } = await supabase.storage
                    .from('student-documents')
                    .upload(fileName, file);

                if (error) throw error;

                uploadedDocs.push({
                    name: file.name,
                    url: data.path,
                    type: file.type,
                    size: file.size
                });
            }
        } catch (err) {
            console.error('Error uploading documents:', err);
            throw err;
        } finally {
            setUploading(false);
        }

        return uploadedDocs;
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            // First, insert the student
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .insert([{
                    ...studentForm,
                    school_id: school.id
                }])
                .select()
                .single();

            if (studentError) throw studentError;

            // Upload documents if any
            let documents = [];
            if (selectedFiles.length > 0) {
                documents = await uploadDocuments(studentData.id);
                
                // Update student with document URLs
                const { error: updateError } = await supabase
                    .from('students')
                    .update({ documents: documents })
                    .eq('id', studentData.id);

                if (updateError) throw updateError;
            }

            // Reset form and reload students
            setStudentForm({
                student_name: '',
                student_id: '',
                class_grade: '',
                father_name: '',
                mother_name: '',
                date_of_birth: '',
                gender: 'male',
                category: 'general',
                phone_number: '',
                address: '',
                scholarship_eligible: false,
                scholarship_amount: '',
                documents: []
            });
            setSelectedFiles([]);
            setShowAddForm(false);
            loadStudents();
        } catch (err) {
            console.error('Error adding student:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
    };

    if (!school) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Please register your school first to manage students.</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Students Management</h3>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                    >
                        Add Student
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                        {error}
                    </div>
                )}

                {showAddForm && (
                    <div className="border border-gray-200 rounded-lg p-4 mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Add New Student</h4>
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Student Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={studentForm.student_name}
                                        onChange={(e) => setStudentForm({ ...studentForm, student_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Student ID</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={studentForm.student_id}
                                        onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Class/Grade</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={studentForm.class_grade}
                                        onChange={(e) => setStudentForm({ ...studentForm, class_grade: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                                    <select
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={studentForm.gender}
                                        onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={studentForm.father_name}
                                        onChange={(e) => setStudentForm({ ...studentForm, father_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mother's Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={studentForm.mother_name}
                                        onChange={(e) => setStudentForm({ ...studentForm, mother_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={studentForm.date_of_birth}
                                        onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={studentForm.phone_number}
                                        onChange={(e) => setStudentForm({ ...studentForm, phone_number: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            {/* Document Upload Section */}
                            <div className="border-t pt-4">
                                <h5 className="text-md font-medium text-gray-900 mb-3">Student Documents</h5>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Upload Documents (Birth Certificate, ID Proof, etc.)
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        onChange={handleFileSelect}
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB each)
                                    </p>
                                    {selectedFiles.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                                            <ul className="mt-1 text-sm text-gray-600">
                                                {selectedFiles.map((file, index) => (
                                                    <li key={index} className="flex items-center">
                                                        <span>📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                                >
                                    {loading ? 'Adding...' : 'Add Student'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Students List */}
                {loading && !showAddForm ? (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading students...</p>
                    </div>
                ) : students.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Class
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Gender
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Documents
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.map((student) => (
                                    <tr key={student.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {student.student_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.student_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.class_grade}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                            {student.gender}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.documents && student.documents.length > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {student.documents.length} docs
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    No docs
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedStudent(student)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                View
                                            </button>
                                            <button className="text-red-600 hover:text-red-900">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No students added yet.</p>
                        <p className="text-sm text-gray-400 mt-2">Click "Add Student" to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentsManager; 