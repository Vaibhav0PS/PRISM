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
    const [documentTypes, setDocumentTypes] = useState([]);

    useEffect(() => {
        if (school) {
            loadStudents();
        }
    }, [school]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Loading students for school:', school.id);

            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('school_id', school.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Students loading error:', error);
                throw error;
            }
            
            console.log('Students loaded:', data);
            setStudents(data || []);
        } catch (err) {
            console.error('Error loading students:', err);
            if (err.message.includes('relation "public.students" does not exist')) {
                setError('Students table not found. Please set up the database first.');
            } else {
                setError(`Failed to load students: ${err.message}`);
            }
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
                // Create a unique filename
                const fileExt = file.name.split('.').pop();
                const fileName = `${studentId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `student-documents/${fileName}`;

                try {
                    // Try to upload to Supabase storage
                    const { error } = await supabase.storage
                        .from('documents')
                        .upload(filePath, file);

                    if (error) {
                        console.warn('Storage upload failed, using fallback:', error);
                        // Fallback: create a data URL for local viewing
                        const reader = new FileReader();
                        const dataUrl = await new Promise((resolve) => {
                            reader.onload = (e) => resolve(e.target.result);
                            reader.readAsDataURL(file);
                        });
                        
                        uploadedDocs.push({
                            name: file.name,
                            url: dataUrl, // Data URL for local viewing
                            type: documentTypes[uploadedDocs.length] || getDocumentType(file.name),
                            size: file.size,
                            uploaded: false
                        });
                    } else {
                        // Get public URL
                        const { data: urlData } = supabase.storage
                            .from('documents')
                            .getPublicUrl(filePath);

                        console.log('File uploaded successfully:', filePath, urlData.publicUrl);

                        uploadedDocs.push({
                            name: file.name,
                            url: urlData.publicUrl,
                            type: documentTypes[uploadedDocs.length] || getDocumentType(file.name),
                            size: file.size,
                            uploaded: true
                        });
                    }
                } catch (uploadError) {
                    console.warn('Individual file upload failed:', uploadError);
                    // Create a placeholder for failed uploads
                    uploadedDocs.push({
                        name: file.name,
                        url: `data:text/plain;base64,${btoa('Document upload pending')}`,
                        type: documentTypes[uploadedDocs.length] || getDocumentType(file.name),
                        size: file.size,
                        uploaded: false
                    });
                }
            }
            
            console.log('Documents processed:', uploadedDocs);
        } catch (err) {
            console.error('Error processing documents:', err);
            // Don't throw error - continue with student creation
        } finally {
            setUploading(false);
        }

        return uploadedDocs;
    };

    const getDocumentType = (fileName) => {
        const name = fileName.toLowerCase();
        if (name.includes('birth') || name.includes('certificate')) return 'id_proof';
        if (name.includes('income')) return 'income_certificate';
        if (name.includes('caste')) return 'caste_certificate';
        if (name.includes('photo') || name.includes('image')) return 'photo';
        if (name.includes('mark') || name.includes('grade')) return 'marksheet';
        if (name.includes('bank') || name.includes('passbook')) return 'bank_passbook';
        return 'other';
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            console.log('Starting student creation...');

            // Prepare student data
            const studentData = {
                school_id: school.id,
                student_name: studentForm.student_name,
                student_id: studentForm.student_id,
                class_grade: studentForm.class_grade,
                father_name: studentForm.father_name || null,
                mother_name: studentForm.mother_name || null,
                date_of_birth: studentForm.date_of_birth || null,
                gender: studentForm.gender,
                category: studentForm.category,
                phone_number: studentForm.phone_number || null,
                address: studentForm.address || null,
                scholarship_eligible: studentForm.scholarship_eligible,
                scholarship_amount: studentForm.scholarship_amount ? parseFloat(studentForm.scholarship_amount) : null
            };

            console.log('Inserting student data:', studentData);

            // Insert the student
            const { data: insertedStudent, error: studentError } = await supabase
                .from('students')
                .insert([studentData])
                .select()
                .single();

            if (studentError) {
                console.error('Student insertion error:', studentError);
                throw studentError;
            }

            console.log('Student created successfully:', insertedStudent);

            // Handle documents
            if (selectedFiles.length > 0) {
                console.log('Processing documents...');
                const documents = await uploadDocuments(insertedStudent.id);
                
                if (documents.length > 0) {
                    // Extract URLs and types for database schema compatibility
                    const documentUrls = documents.map(doc => doc.url);
                    const documentTypes = documents.map(doc => doc.type || 'other');
                    
                    console.log('Updating student with documents:', {
                        studentId: insertedStudent.id,
                        documentUrls,
                        documentTypes
                    });
                    
                    const { error: updateError } = await supabase
                        .from('students')
                        .update({ 
                            documents_url: documentUrls,
                            document_types: documentTypes
                        })
                        .eq('id', insertedStudent.id);

                    if (updateError) {
                        console.error('Document update failed:', updateError);
                        setError(`Documents uploaded but failed to link to student: ${updateError.message}`);
                    } else {
                        console.log('Documents successfully linked to student');
                    }
                } else {
                    console.warn('No documents were processed');
                }
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
            setDocumentTypes([]);
            setShowAddForm(false);
            
            console.log('Reloading students...');
            await loadStudents();
            
            console.log('Student creation process completed!');
        } catch (err) {
            console.error('Error adding student:', err);
            setError(`Failed to add student: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
        // Initialize document types array
        setDocumentTypes(files.map(() => 'other'));
    };

    const handleDocumentTypeChange = (index, type) => {
        const newTypes = [...documentTypes];
        newTypes[index] = type;
        setDocumentTypes(newTypes);
    };

    const fixExistingStudentDocuments = async () => {
        try {
            setLoading(true);
            console.log('Fixing existing student documents...');

            // First, try to add missing columns if they don't exist
            try {
                await supabase.rpc('exec', {
                    sql: `
                        ALTER TABLE public.students 
                        ADD COLUMN IF NOT EXISTS documents_url TEXT[] DEFAULT '{}';
                        
                        ALTER TABLE public.students 
                        ADD COLUMN IF NOT EXISTS document_types TEXT[] DEFAULT '{}';
                    `
                });
            } catch (alterError) {
                console.warn('Could not add columns via RPC, they may already exist:', alterError);
            }

            // Get all students with old document format
            const { data: studentsToFix, error: fetchError } = await supabase
                .from('students')
                .select('*')
                .eq('school_id', school.id);

            if (fetchError) {
                if (fetchError.message.includes('column') && fetchError.message.includes('does not exist')) {
                    setError('Database columns missing. Please run the SQL script from QUICK-FIX-DOCUMENTS.md in your Supabase dashboard first.');
                    return;
                }
                throw fetchError;
            }

            console.log('Students to fix:', studentsToFix);

            let fixedCount = 0;
            for (const student of studentsToFix || []) {
                if (student.documents && (!student.documents_url || student.documents_url.length === 0)) {
                    try {
                        // Parse documents if it's a string
                        const docs = typeof student.documents === 'string' 
                            ? JSON.parse(student.documents) 
                            : student.documents;

                        if (Array.isArray(docs) && docs.length > 0) {
                            const documentUrls = docs.map(doc => doc.url || doc);
                            const documentTypes = docs.map(doc => doc.type || 'other');

                            const { error: updateError } = await supabase
                                .from('students')
                                .update({
                                    documents_url: documentUrls,
                                    document_types: documentTypes
                                })
                                .eq('id', student.id);

                            if (updateError) {
                                console.error(`Failed to fix student ${student.student_name}:`, updateError);
                                if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
                                    setError('Database columns missing. Please run: ALTER TABLE students ADD COLUMN documents_url TEXT[], ADD COLUMN document_types TEXT[] in Supabase SQL Editor.');
                                    return;
                                }
                            } else {
                                console.log(`Fixed documents for student ${student.student_name}`);
                                fixedCount++;
                            }
                        }
                    } catch (parseError) {
                        console.error(`Failed to parse documents for student ${student.student_name}:`, parseError);
                    }
                }
            }

            // Reload students to see the changes
            await loadStudents();
            
            if (fixedCount > 0) {
                alert(`Fixed documents for ${fixedCount} students!`);
            } else {
                alert('No students needed document fixes, or columns are missing. Check QUICK-FIX-DOCUMENTS.md for setup instructions.');
            }

        } catch (err) {
            console.error('Error fixing student documents:', err);
            setError(`Failed to fix documents: ${err.message}`);
        } finally {
            setLoading(false);
        }
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
                    <div className="flex space-x-2">
                        <button
                            onClick={fixExistingStudentDocuments}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                        >
                            Fix Documents
                        </button>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                        >
                            Add Student
                        </button>
                    </div>
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
                                            <div className="mt-1 space-y-2">
                                                {selectedFiles.map((file, index) => (
                                                    <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                                                        <span className="text-sm text-gray-600 flex-1">
                                                            📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                        </span>
                                                        <select
                                                            value={documentTypes[index] || 'other'}
                                                            onChange={(e) => handleDocumentTypeChange(index, e.target.value)}
                                                            className="text-xs border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            <option value="id_proof">ID Proof</option>
                                                            <option value="income_certificate">Income Certificate</option>
                                                            <option value="caste_certificate">Caste Certificate</option>
                                                            <option value="photo">Photo</option>
                                                            <option value="marksheet">Marksheet</option>
                                                            <option value="bank_passbook">Bank Passbook</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
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
                                            {student.documents_url && student.documents_url.length > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {student.documents_url.length} docs
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