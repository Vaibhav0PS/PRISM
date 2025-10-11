// Debug script to check student data in Supabase
import { supabase } from './client/src/lib/supabase.js';

const checkStudentData = async () => {
  try {
    console.log('🔍 Checking student data in database...');
    
    // Get all students
    const { data: students, error } = await supabase
      .from('students')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching students:', error);
      return;
    }
    
    console.log('📊 Total students found:', students?.length || 0);
    
    if (students && students.length > 0) {
      students.forEach((student, index) => {
        console.log(`\n👤 Student ${index + 1}:`);
        console.log('  Name:', student.student_name);
        console.log('  ID:', student.student_id);
        console.log('  Documents field:', student.documents);
        console.log('  Documents URL field:', student.documents_url);
        console.log('  Document types field:', student.document_types);
        console.log('  Raw data:', JSON.stringify(student, null, 2));
      });
    } else {
      console.log('📝 No students found in database');
    }
    
  } catch (err) {
    console.error('💥 Error:', err);
  }
};

// Run the check
checkStudentData();