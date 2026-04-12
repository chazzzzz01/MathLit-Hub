import { supabase } from '../lib/supabase';

export const classService = {
  // Create a new class
  async createClass(classData, teacherId) {
    try {
      // Check if class code already exists
      const { data: existingClass } = await supabase
        .from('classes')
        .select('code')
        .eq('code', classData.code.toUpperCase())
        .maybeSingle();

      if (existingClass) {
        throw new Error('Class code already exists');
      }

      const { data, error } = await supabase
        .from('classes')
        .insert([{
          name: classData.name,
          code: classData.code.toUpperCase(),
          teacher_id: teacherId,
          students_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in createClass:', error);
      throw error;
    }
  },

  // Get all classes for a teacher
  async getTeacherClasses(teacherId) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get a single class by ID
  async getClassById(classId) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  // Get class by code (for joining) - SIMPLIFIED
  async getClassByCode(code) {
    try {
      if (!code) {
        console.error('No code provided');
        return null;
      }
      
      const upperCode = code.toUpperCase().trim();
      console.log('Searching for class with code:', upperCode);
      
      // Simple query - no joins
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('code', upperCode)
        .maybeSingle();

      if (error) {
        console.error('Error in getClassByCode:', error);
        return null;
      }
      
      if (!data) {
        console.log(`No class found with code: ${upperCode}`);
        return null;
      }
      
      console.log('Class found:', data);
      return data;
    } catch (error) {
      console.error('Error in getClassByCode:', error);
      return null;
    }
  },

  // Check if student is already in class
  async isStudentInClass(studentId, classId) {
    try {
      if (!studentId || !classId) return false;
      
      const { data, error } = await supabase
        .from('class_students')
        .select('*')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error in isStudentInClass:', error);
      return false;
    }
  },

  // Join a class as student
  async joinClass(studentId, classCode) {
    try {
      if (!studentId) {
        throw new Error('Student ID is required');
      }
      
      if (!classCode) {
        throw new Error('Class code is required');
      }

      // First, get the class by code
      const classData = await this.getClassByCode(classCode);
      
      if (!classData) {
        throw new Error(`Class not found with code: ${classCode}`);
      }

      // Check if student is already in this class
      const isAlreadyJoined = await this.isStudentInClass(studentId, classData.id);
      
      if (isAlreadyJoined) {
        throw new Error('You are already a member of this class!');
      }

      // Add student to class
      const { data, error } = await supabase
        .from('class_students')
        .insert([{
          class_id: classData.id,
          student_id: studentId,
          joined_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Update the students count in the class
      await this.updateStudentCount(classData.id);

      // Get teacher info separately if needed
      let teacherInfo = null;
      if (classData.teacher_id) {
        const { data: teacher } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', classData.teacher_id)
          .maybeSingle();
        teacherInfo = teacher;
      }

      return {
        success: true,
        class: {
          ...classData,
          teacher: teacherInfo
        },
        enrollment: data
      };
    } catch (error) {
      console.error('Error in joinClass:', error);
      throw error;
    }
  },

  // Get all classes for a student - SIMPLIFIED
  async getStudentClasses(studentId) {
    try {
      // Get enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_students')
        .select('*')
        .eq('student_id', studentId)
        .order('joined_at', { ascending: false });

      if (enrollError) throw enrollError;
      
      if (!enrollments || enrollments.length === 0) {
        return [];
      }
      
      // Get class IDs
      const classIds = enrollments.map(e => e.class_id);
      
      // Get class details
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds);
      
      if (classError) throw classError;
      
      // Get teacher IDs
      const teacherIds = [...new Set(classes.map(c => c.teacher_id).filter(id => id))];
      
      // Get teacher info
      let teachers = [];
      if (teacherIds.length > 0) {
        const { data: teacherData } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', teacherIds);
        if (teacherData) teachers = teacherData;
      }
      
      // Create teacher map
      const teacherMap = {};
      teachers.forEach(teacher => {
        teacherMap[teacher.id] = teacher;
      });
      
      // Combine data
      const result = enrollments.map(enrollment => {
        const classData = classes.find(c => c.id === enrollment.class_id);
        return {
          ...enrollment,
          class: {
            ...classData,
            teacher: classData ? teacherMap[classData.teacher_id] : null
          }
        };
      });
      
      return result;
    } catch (error) {
      console.error('Error in getStudentClasses:', error);
      return [];
    }
  },

  // Get class details with students - SIMPLIFIED
  async getClassWithStudents(classId) {
    try {
      // Get class details
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .maybeSingle();

      if (classError) throw classError;
      if (!classData) return null;
      
      // Get teacher info
      if (classData.teacher_id) {
        const { data: teacherData } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', classData.teacher_id)
          .maybeSingle();
        if (teacherData) classData.teacher = teacherData;
      }
      
      // Get students in class
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_students')
        .select('*')
        .eq('class_id', classId);
      
      if (enrollError) throw enrollError;
      
      if (enrollments && enrollments.length > 0) {
        const studentIds = enrollments.map(e => e.student_id);
        const { data: students } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', studentIds);
        
        if (students) {
          const studentMap = {};
          students.forEach(student => {
            studentMap[student.id] = student;
          });
          
          classData.students = enrollments.map(enrollment => ({
            ...enrollment,
            student: studentMap[enrollment.student_id]
          }));
        }
      } else {
        classData.students = [];
      }
      
      return classData;
    } catch (error) {
      console.error('Error in getClassWithStudents:', error);
      return null;
    }
  },

  // Update student count
  async updateStudentCount(classId) {
    try {
      const { count, error: countError } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId);

      if (countError) throw countError;

      const { error } = await supabase
        .from('classes')
        .update({ 
          students_count: count,
          updated_at: new Date().toISOString()
        })
        .eq('id', classId);

      if (error) throw error;
      return count;
    } catch (error) {
      console.error('Error in updateStudentCount:', error);
      throw error;
    }
  },

  // Delete a class
  async deleteClass(classId) {
    try {
      // First delete all class-student relationships
      const { error: linkError } = await supabase
        .from('class_students')
        .delete()
        .eq('class_id', classId);

      if (linkError) {
        console.error('Error deleting class-student links:', linkError);
      }

      // Then delete the class
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);
    
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in deleteClass:', error);
      throw error;
    }
  },

  // Update class
  async updateClass(classId, updates) {
    const { data, error } = await supabase
      .from('classes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', classId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  // Get students for a class - SIMPLIFIED
  async getClassStudents(classId) {
    try {
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_students')
        .select('*')
        .eq('class_id', classId);
      
      if (enrollError) throw enrollError;
      
      if (!enrollments || enrollments.length === 0) {
        return [];
      }
      
      const studentIds = enrollments.map(e => e.student_id);
      const { data: students, error: studentError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', studentIds);
      
      if (studentError) throw studentError;
      
      const studentMap = {};
      students.forEach(student => {
        studentMap[student.id] = student;
      });
      
      return enrollments.map(enrollment => ({
        ...enrollment,
        users: studentMap[enrollment.student_id]
      }));
    } catch (error) {
      console.error('Error in getClassStudents:', error);
      return [];
    }
  },

  // Add student to class (alternative method)
  async addStudentToClass(classId, studentId) {
    try {
      const exists = await this.isStudentInClass(studentId, classId);
      if (exists) {
        throw new Error('Student is already in this class');
      }

      const { data, error } = await supabase
        .from('class_students')
        .insert([{
          class_id: classId,
          student_id: studentId,
          joined_at: new Date().toISOString()
        }])
        .select()
        .single();
    
      if (error) throw error;
      
      await this.updateStudentCount(classId);
      
      return data;
    } catch (error) {
      console.error('Error in addStudentToClass:', error);
      throw error;
    }
  },

  // Remove student from class (for teachers removing a student)
  async removeStudentFromClass(classId, studentId) {
    try {
      const { error } = await supabase
        .from('class_students')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      await this.updateStudentCount(classId);
      
      return {
        success: true,
        message: 'Successfully removed student from class'
      };
    } catch (error) {
      console.error('Error in removeStudentFromClass:', error);
      return {
        success: false,
        message: error.message || 'Failed to remove student from class'
      };
    }
  },

  // Get missions for a class
  async getClassMissions(classId) {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('class_id', classId)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Create a mission
  async createMission(missionData) {
    const { data, error } = await supabase
      .from('missions')
      .insert([{
        ...missionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update mission
  async updateMission(missionId, updates) {
    const { data, error } = await supabase
      .from('missions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', missionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete mission
  async deleteMission(missionId) {
    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', missionId);
    
    if (error) throw error;
    return true;
  },

  // Get student progress for a class
  async getStudentProgress(classId, studentId) {
    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('class_id', classId)
      .eq('user_id', studentId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  // Update or create student progress
  async updateStudentProgress(progressData) {
    const { data, error } = await supabase
      .from('student_progress')
      .upsert([{
        ...progressData,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};