// src/services/classService.js
import { supabase } from '../lib/supabase';

export const classService = {
  // ========== HELPER: Get current user ==========
  async getCurrentUser() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        return null;
      }
      
      if (session?.user) {
        return session.user;
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return null;
      }
      
      return user || null;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },

  // ========== HELPER: Get real user data from Google Auth ==========
  async getRealUserFromAuth() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      };
    } catch (error) {
      console.error('Error in getRealUserFromAuth:', error);
      return null;
    }
  },

  // ========== HELPER: Get or create user ==========
  async getOrCreateUser(authUserId, email, name) {
    try {
      if (!authUserId) return null;
      
      let { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();
      
      if (existingUser) return existingUser;
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email: email || '',
          name: name || email?.split('@')[0] || '',
          role: 'student',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        if (insertError.code === '23505') {
          const { data: retryUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUserId)
            .maybeSingle();
          return retryUser;
        }
        return null;
      }
      
      return newUser;
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      return null;
    }
  },

  // ========== HELPER: Get or create student ==========
  async getOrCreateStudent(authUserId, email, name) {
    try {
      if (!authUserId) return null;
      
      const user = await this.getOrCreateUser(authUserId, email, name);
      if (!user) return null;
      
      let { data: existingStudent, error: selectError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (existingStudent) return existingStudent;
      
      const { data: newStudent, error: insertError } = await supabase
        .from('students')
        .insert({
          user_id: authUserId,
          email: user.email,
          name: user.name,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        if (insertError.code === '23505') {
          const { data: retryStudent } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', authUserId)
            .maybeSingle();
          return retryStudent;
        }
        return null;
      }
      
      return newStudent;
    } catch (error) {
      console.error('Error in getOrCreateStudent:', error);
      return null;
    }
  },

  // ========== HELPER: Get student by user ID ==========
  async getStudentByUserId(authUserId) {
    try {
      if (!authUserId) return null;
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error in getStudentByUserId:', error);
      return null;
    }
  },

  // ========== HELPER: Get teacher by user ID ==========
  async getTeacherByUserId(authUserId) {
    try {
      if (!authUserId) return null;
      
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (error) {
        console.error('Error getting teacher:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getTeacherByUserId:', error);
      return null;
    }
  },

  // ========== HELPER: Get teacher by ID ==========
  async getTeacherById(teacherId) {
    try {
      if (!teacherId) return null;
      
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .maybeSingle();
      
      if (error) {
        console.error('Error getting teacher by ID:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getTeacherById:', error);
      return null;
    }
  },

  // ========== HELPER: Get user by ID ==========
  async getUserById(userId) {
    try {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, role')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  },

  // ========== HELPER: Create or get teacher ==========
  async getOrCreateTeacher(authUserId, email, name) {
    try {
      if (!authUserId) return null;
      
      const user = await this.getOrCreateUser(authUserId, email, name);
      if (!user) return null;
      
      let { data: existingTeacher, error: selectError } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (existingTeacher) return existingTeacher;
      
      const { data: newTeacher, error: insertError } = await supabase
        .from('teachers')
        .insert({
          user_id: authUserId,
          email: user.email,
          name: user.name,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) return null;
      return newTeacher;
    } catch (error) {
      console.error('Error in getOrCreateTeacher:', error);
      return null;
    }
  },

  // ========== CLASS MANAGEMENT ==========

  async createClass(classData, teacherAuthUserId) {
    try {
      if (!teacherAuthUserId) throw new Error('Teacher ID is required');
      
      const teacher = await this.getTeacherByUserId(teacherAuthUserId);
      if (!teacher) throw new Error('Could not find teacher record');
      
      const { data: existingClass } = await supabase
        .from('classes')
        .select('code')
        .eq('code', classData.code.toUpperCase())
        .maybeSingle();

      if (existingClass) throw new Error('Class code already exists');

      const insertData = {
        name: classData.name,
        code: classData.code.toUpperCase(),
        teacher_id: teacher.id,
        students_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📝 Creating class:', insertData);
      
      const { data, error } = await supabase
        .from('classes')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create class: ${error.message}`);
      
      console.log('✅ Class created:', data);
      return data;
    } catch (error) {
      console.error('Error in createClass:', error);
      throw error;
    }
  },

  // ========== FIXED: Get teacher classes ==========
  async getTeacherClasses(teacherAuthUserId) {
    try {
      if (!teacherAuthUserId) return [];
      
      const teacher = await this.getTeacherByUserId(teacherAuthUserId);
      if (!teacher) {
        console.log('No teacher record found for user:', teacherAuthUserId);
        return [];
      }
      
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', teacher.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching classes:', error);
        return [];
      }
      
      console.log(`📚 Found ${data?.length || 0} classes for teacher`);
      return data || [];
    } catch (error) {
      console.error('Error in getTeacherClasses:', error);
      return [];
    }
  },

  // ========== FIXED: Get class by ID ==========
  async getClassById(classId) {
    try {
      if (!classId) return null;
      
      console.log('📚 Fetching class by ID:', classId);
      
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .maybeSingle();
      
      if (error) {
        console.error('Error getting class:', error);
        return null;
      }
      
      if (!data) {
        console.log('Class not found:', classId);
        return null;
      }
      
      let teacherName = 'Teacher';
      if (data.teacher_id) {
        const teacher = await this.getTeacherById(data.teacher_id);
        if (teacher) {
          teacherName = teacher.name || 'Teacher';
          if (teacher.user_id && (!teacherName || teacherName === 'Teacher')) {
            const user = await this.getUserById(teacher.user_id);
            if (user?.name) teacherName = user.name;
          }
        }
      }
      
      console.log('✅ Class found:', data.name, 'Teacher:', teacherName);
      
      return {
        ...data,
        teacher_name: teacherName
      };
      
    } catch (error) {
      console.error('Error in getClassById:', error);
      return null;
    }
  },

  // ========== FIXED: Get class by code ==========
  async getClassByCode(code) {
    try {
      if (!code) return null;
      
      const upperCode = code.toUpperCase().trim();
      console.log('🔍 Looking for class with code:', upperCode);
      
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('code', upperCode)
        .maybeSingle();

      if (error) {
        console.error('Error getting class by code:', error);
        return null;
      }
      
      if (!data) {
        console.log('No class found with code:', upperCode);
        return null;
      }
      
      let teacherName = 'Teacher';
      if (data.teacher_id) {
        const teacher = await this.getTeacherById(data.teacher_id);
        if (teacher) {
          teacherName = teacher.name || 'Teacher';
          if (teacher.user_id && teacherName === 'Teacher') {
            const user = await this.getUserById(teacher.user_id);
            if (user?.name) teacherName = user.name;
          }
        }
      }
      
      const { count: studentsCount, error: countError } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', data.id);
      
      console.log('✅ Class found:', data.name);
      
      return {
        ...data,
        teacher_name: teacherName,
        students_count: countError ? 0 : (studentsCount || 0)
      };
      
    } catch (error) {
      console.error('Error in getClassByCode:', error);
      return null;
    }
  },

  // ========== FIXED: Get class with students ==========
  async getClassWithStudents(classId) {
    try {
      if (!classId) return null;
      
      console.log('📋 Fetching class with students for ID:', classId);
      
      const classData = await this.getClassById(classId);
      if (!classData) return null;
      
      const students = await this.getClassStudents(classId);
      classData.students = students;
      
      return classData;
      
    } catch (error) {
      console.error('Error in getClassWithStudents:', error);
      return null;
    }
  },

  // ========== FIXED: Get class students ==========
  async getClassStudents(classId) {
    try {
      if (!classId) return [];
      
      console.log('📋 Getting students for class:', classId);
      
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_students')
        .select('*')
        .eq('class_id', classId);
      
      if (enrollError) {
        console.error('Error getting enrollments:', enrollError);
        return [];
      }
      
      if (!enrollments || enrollments.length === 0) {
        console.log('No students found for class');
        return [];
      }
      
      const studentsWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          const { data: student, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', enrollment.student_id)
            .maybeSingle();
          
          let userDetails = null;
          if (student?.user_id) {
            const { data: user } = await supabase
              .from('users')
              .select('id, name, email, avatar_url')
              .eq('id', student.user_id)
              .maybeSingle();
            userDetails = user;
          }
          
          return {
            id: enrollment.id,
            class_id: enrollment.class_id,
            student_id: enrollment.student_id,
            joined_at: enrollment.joined_at,
            progress: enrollment.progress || 0,
            updated_at: enrollment.updated_at,
            student_name: student?.name || userDetails?.name || 'Student',
            student_email: student?.email || userDetails?.email || '',
            user: userDetails
          };
        })
      );
      
      console.log('📋 Returning students:', studentsWithDetails.length);
      return studentsWithDetails;
      
    } catch (error) {
      console.error('Error in getClassStudents:', error);
      return [];
    }
  },

  // ========== FIXED: Get student classes (THIS WAS THE MAIN ISSUE) ==========
  async getStudentClasses(authUserId) {
    try {
      if (!authUserId) {
        console.log('No authUserId provided');
        return [];
      }
      
      console.log('📚 Getting classes for student:', authUserId);
      
      // First get the student record
      const student = await this.getStudentByUserId(authUserId);
      if (!student) {
        console.log('No student record found for user:', authUserId);
        return [];
      }
      
      console.log('✅ Found student record:', student.id);
      
      // Get enrollments - SIMPLE query without joins
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_students')
        .select('*')
        .eq('student_id', student.id)
        .order('joined_at', { ascending: false });
      
      if (enrollError) {
        console.error('Error fetching enrollments:', enrollError);
        return [];
      }
      
      if (!enrollments || enrollments.length === 0) {
        console.log('No enrollments found for student');
        return [];
      }
      
      console.log(`Found ${enrollments.length} enrollment(s)`);
      
      // Get class details for each enrollment
      const enrichedEnrollments = [];
      for (const enrollment of enrollments) {
        const classData = await this.getClassById(enrollment.class_id);
        if (classData) {
          enrichedEnrollments.push({
            ...enrollment,
            class: classData
          });
        } else {
          console.warn('Class not found for enrollment:', enrollment.class_id);
        }
      }
      
      console.log(`✅ Returning ${enrichedEnrollments.length} classes with details`);
      return enrichedEnrollments;
      
    } catch (error) {
      console.error('Error in getStudentClasses:', error);
      return [];
    }
  },

  // ========== FIXED: Join class ==========
  async joinClass(authUserId, classCode) {
    try {
      if (!authUserId || !classCode) {
        throw new Error('User ID and class code are required');
      }

      console.log('🔍 Joining class with code:', classCode);
      
      // First, try to get existing student
      let student = await this.getStudentByUserId(authUserId);
      
      if (!student) {
        console.log('No student record found, creating one...');
        const realUser = await this.getRealUserFromAuth();
        student = await this.getOrCreateStudent(authUserId, realUser?.email, realUser?.name);
      }
      
      if (!student) {
        throw new Error('Could not create or find student record');
      }
      
      console.log('✅ Student record found/created:', student.id);
      
      // Get the class by code
      const classData = await this.getClassByCode(classCode);
      if (!classData) {
        throw new Error(`Class not found with code: ${classCode}`);
      }
      
      console.log('✅ Class found:', classData.name);
      
      // Check if already enrolled
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('class_students')
        .select('id')
        .eq('class_id', classData.id)
        .eq('student_id', student.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking enrollment:', checkError);
      }
      
      if (existingEnrollment) {
        throw new Error('You are already a member of this class!');
      }

      // Join the class
      const { data: enrollment, error: joinError } = await supabase
        .from('class_students')
        .insert({
          class_id: classData.id,
          student_id: student.id,
          joined_at: new Date().toISOString(),
          progress: 0
        })
        .select()
        .single();

      if (joinError) {
        console.error('Error joining class:', joinError);
        throw new Error(`Failed to join class: ${joinError.message}`);
      }

      console.log('✅ Successfully joined class!');
      
      // Update student count
      await this.updateStudentCount(classData.id);
      
      // Update localStorage and dispatch event
      if (typeof window !== 'undefined') {
        localStorage.setItem('hasActiveClass', 'true');
        localStorage.setItem('activeClassId', classData.id);
        localStorage.setItem('activeClassName', classData.name);
        
        const event = new CustomEvent('classStatusChanged', {
          detail: {
            hasActiveClass: true,
            classCount: 1,
            classId: classData.id,
            className: classData.name,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(event);
        console.log('📢 Dispatched classStatusChanged event');
      }

      return {
        success: true,
        message: `Successfully joined ${classData.name}!`,
        class: classData,
        enrollment: enrollment
      };
      
    } catch (error) {
      console.error('Error in joinClass:', error);
      throw error;
    }
  },

  async isStudentInClass(studentId, classId) {
    try {
      if (!studentId || !classId) return false;
      
      const { data, error } = await supabase
        .from('class_students')
        .select('id')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .maybeSingle();
      
      return !!data;
    } catch (error) {
      return false;
    }
  },

  async updateStudentCount(classId) {
    try {
      if (!classId) return 0;
      
      const { count, error: countError } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId);

      if (countError) {
        console.error('Error counting students:', countError);
        return 0;
      }

      const { error } = await supabase
        .from('classes')
        .update({ students_count: count, updated_at: new Date().toISOString() })
        .eq('id', classId);

      if (error) {
        console.error('Error updating student count:', error);
      }
      
      console.log(`Updated student count for class ${classId}: ${count}`);
      return count;
    } catch (error) {
      console.error('Error in updateStudentCount:', error);
      return 0;
    }
  },

  // ========== DELETE CLASS ==========
  async deleteClass(classId, teacherAuthUserId) {
    try {
      if (!classId) throw new Error('Class ID is required');
      if (!teacherAuthUserId) throw new Error('Teacher authorization required');
      
      const teacher = await this.getTeacherByUserId(teacherAuthUserId);
      if (!teacher) throw new Error('Teacher not found');
      
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', classId)
        .maybeSingle();
      
      if (classError) throw new Error('Class not found');
      if (classData.teacher_id !== teacher.id) {
        throw new Error('You do not have permission to delete this class');
      }
      
      // Delete related records
      await supabase.from('class_students').delete().eq('class_id', classId);
      await supabase.from('classes').delete().eq('id', classId);
      
      return { success: true, message: 'Class deleted successfully' };
      
    } catch (error) {
      console.error('Error in deleteClass:', error);
      return { success: false, message: error.message };
    }
  },

  // ========== SIMPLIFIED METHODS FOR OTHER FEATURES ==========
  
  async hasAnyClass(authUserId) {
    const classes = await this.getStudentClasses(authUserId);
    return classes.length > 0;
  },

  async getUserClassStatus(authUserId) {
    const classes = await this.getStudentClasses(authUserId);
    return {
      hasClass: classes.length > 0,
      classCount: classes.length,
      classes: classes
    };
  },

  async updateClass(classId, updates) {
    const { data, error } = await supabase
      .from('classes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', classId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async removeStudentFromClass(classId, authUserId) {
    const student = await this.getStudentByUserId(authUserId);
    if (!student) return { success: false, message: 'Student not found' };
    
    await supabase.from('class_students').delete().eq('class_id', classId).eq('student_id', student.id);
    await this.updateStudentCount(classId);
    
    return { success: true, message: 'Removed from class' };
  },

  async getClassAnnouncements(classId) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });
    
    return error ? [] : (data || []);
  },

  async createAnnouncement(announcementData) {
    const { data, error } = await supabase
      .from('announcements')
      .insert({ ...announcementData, created_at: new Date().toISOString() })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getClassMissions(classId) {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('class_id', classId)
      .order('due_date', { ascending: true });
    
    return error ? [] : (data || []);
  },

  async createMission(missionData) {
    const { data, error } = await supabase
      .from('missions')
      .insert({ ...missionData, created_at: new Date().toISOString() })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateMission(missionId, updates) {
    const { data, error } = await supabase
      .from('missions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', missionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteMission(missionId) {
    const { error } = await supabase.from('missions').delete().eq('id', missionId);
    if (error) throw error;
    return true;
  },

  async updateStudentPoints(classId, studentId, pointsDelta) {
    const { data: existing, error: checkError } = await supabase
      .from('student_points')
      .select('id, points')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .maybeSingle();
    
    if (existing) {
      const { data, error } = await supabase
        .from('student_points')
        .update({ points: (existing.points || 0) + pointsDelta, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('student_points')
        .insert({ student_id: studentId, class_id: classId, points: Math.max(0, pointsDelta), created_at: new Date().toISOString() })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  async getClassLeaderboard(classId) {
    const { data, error } = await supabase
      .from('student_points')
      .select('*, student:students(*)')
      .eq('class_id', classId)
      .order('points', { ascending: false });
    
    return error ? [] : (data || []);
  },

  // Team methods
  async getClassTeamAssignments(classId) {
    const { data, error } = await supabase
      .from('team_assignments')
      .select('*')
      .eq('class_id', classId);
    
    return error ? [] : (data || []);
  },

  async assignStudentToTeam(classId, studentId, team, role) {
    const { data: existing, error: checkError } = await supabase
      .from('team_assignments')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .maybeSingle();
    
    if (existing) {
      const { data, error } = await supabase
        .from('team_assignments')
        .update({ team, role, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('team_assignments')
        .insert({ class_id: classId, student_id: studentId, team, role, updated_at: new Date().toISOString() })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  async getStudentTeamAssignment(studentId, classId) {
    const { data, error } = await supabase
      .from('team_assignments')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .maybeSingle();
    
    return error ? null : data;
  }
};

export default classService;