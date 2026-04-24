// src/services/classService.js
import { supabase } from '../lib/supabase';

export const classService = {
  // ========== HELPER: Get current user with better error handling ==========
  async getCurrentUser() {
    try {
      // First try to get the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        return null;
      }
      
      if (session?.user) {
        console.log('✅ User found via session:', session.user.email);
        return session.user;
      }
      
      // If no session, try to get the user directly
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return null;
      }
      
      if (user) {
        console.log('✅ User found via getUser:', user.email);
        return user;
      }
      
      console.warn('⚠️ No authenticated user found');
      return null;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },

  // ========== HELPER: Get real user data from Google Auth ==========
  async getRealUserFromAuth() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting auth user:', error);
        return null;
      }
      if (!user) return null;
      
      // Extract real Google data
      const realName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user.email?.split('@')[0] || 
                      '';
      
      const realEmail = user.email || '';
      const realAvatar = user.user_metadata?.avatar_url || 
                        user.user_metadata?.picture || 
                        null;
      
      console.log('📧 Real Google user data:', { 
        id: user.id,
        email: realEmail, 
        name: realName, 
        avatar: realAvatar 
      });
      
      return {
        id: user.id,
        email: realEmail,
        name: realName,
        avatar_url: realAvatar
      };
    } catch (error) {
      console.error('Error in getRealUserFromAuth:', error);
      return null;
    }
  },

  // ========== HELPER: Ensure user is authenticated ==========
  async ensureAuthenticated() {
    const user = await this.getCurrentUser();
    if (!user) {
      // Try to refresh the session
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !session?.user) {
        throw new Error('User not authenticated. Please log in again.');
      }
      return session.user;
    }
    return user;
  },

  // ========== HELPER: Get or create user with real Google data ==========
  async getOrCreateUser(authUserId, email, name) {
    try {
      if (!authUserId) return null;
      
      // Get real data from Google Auth
      const realUser = await this.getRealUserFromAuth();
      
      const finalEmail = realUser?.email || email || '';
      const finalName = realUser?.name || name || finalEmail?.split('@')[0] || '';
      
      // First check if user exists
      let { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();
      
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking user:', selectError);
      }
      
      if (existingUser) {
        // If user exists but has placeholder data, update it
        if (existingUser.name === 'User' || existingUser.name === '' || existingUser.name === null ||
            existingUser.email === '' || existingUser.email === null) {
          
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              name: finalName,
              email: finalEmail,
              updated_at: new Date().toISOString()
            })
            .eq('id', authUserId)
            .select()
            .single();
          
          if (!updateError && updatedUser) {
            console.log('✅ Updated user with real Google data:', updatedUser);
            return updatedUser;
          }
        }
        return existingUser;
      }
      
      // Create new user with real Google data
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email: finalEmail,
          name: finalName,
          role: 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating user:', insertError);
        return null;
      }
      
      console.log('✅ Created user with real Google data:', newUser);
      return newUser;
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      return null;
    }
  },

  // ========== HELPER: Get or create student with real Google data ==========
  async getOrCreateStudent(authUserId, email, name) {
    try {
      if (!authUserId) return null;
      
      // First ensure user exists with real data
      const user = await this.getOrCreateUser(authUserId, email, name);
      if (!user) return null;
      
      // Check if student exists
      let { data: existingStudent, error: selectError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking student:', selectError);
      }
      
      if (existingStudent) {
        // Update if placeholder data
        if (existingStudent.name === 'Student' || existingStudent.name === 'User' || 
            existingStudent.name === '' || existingStudent.email === '') {
          
          const { data: updatedStudent, error: updateError } = await supabase
            .from('students')
            .update({
              name: user.name,
              email: user.email,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingStudent.id)
            .select()
            .single();
          
          if (!updateError && updatedStudent) {
            console.log('✅ Updated student with real Google data:', updatedStudent);
            return updatedStudent;
          }
        }
        return existingStudent;
      }
      
      // Create new student with real Google data
      const { data: newStudent, error: insertError } = await supabase
        .from('students')
        .insert({
          user_id: authUserId,
          email: user.email,
          name: user.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating student:', insertError);
        return null;
      }
      
      console.log('✅ Created student with real Google data:', newStudent);
      return newStudent;
    } catch (error) {
      console.error('Error in getOrCreateStudent:', error);
      return null;
    }
  },

  // ========== HELPER: Get student by auth user ID ==========
  async getStudentByUserId(authUserId) {
    try {
      if (!authUserId) return null;
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (error) {
        console.error('Error getting student:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getStudentByUserId:', error);
      return null;
    }
  },

  // ========== HELPER: Get teacher by auth user ID ==========
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

  // ========== HELPER: Create teacher record ==========
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating teacher:', insertError);
        return null;
      }
      
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
      
      const realUser = await this.getRealUserFromAuth();
      const teacherEmail = realUser?.email || '';
      const teacherName = realUser?.name || '';
      
      const teacher = await this.getOrCreateTeacher(teacherAuthUserId, teacherEmail, teacherName);
      if (!teacher) throw new Error('Could not create or find teacher record');
      
      const { data: existingClass } = await supabase
        .from('classes')
        .select('code')
        .eq('code', classData.code.toUpperCase())
        .maybeSingle();

      if (existingClass) throw new Error('Class code already exists');

      const { data, error } = await supabase
        .from('classes')
        .insert({
          name: classData.name,
          code: classData.code.toUpperCase(),
          teacher_id: teacher.id,
          students_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in createClass:', error);
      throw error;
    }
  },

  async getTeacherClasses(teacherAuthUserId) {
    try {
      if (!teacherAuthUserId) return [];
      
      const teacher = await this.getTeacherByUserId(teacherAuthUserId);
      if (!teacher) return [];
      
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', teacher.id)
        .order('created_at', { ascending: false });
      
      if (error) return [];
      return data || [];
    } catch (error) {
      console.error('Error in getTeacherClasses:', error);
      return [];
    }
  },

  async getClassById(classId) {
    try {
      if (!classId) return null;
      
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .maybeSingle();
      
      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error in getClassById:', error);
      return null;
    }
  },

  async getClassByCode(code) {
    try {
      if (!code) return null;
      
      const upperCode = code.toUpperCase().trim();
      
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('code', upperCode)
        .maybeSingle();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error in getClassByCode:', error);
      return null;
    }
  },

  async getStudentClasses(authUserId) {
    try {
      if (!authUserId) return [];
      
      const student = await this.getOrCreateStudent(authUserId);
      if (!student) return [];
      
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_students')
        .select(`
          id,
          class_id,
          student_id,
          joined_at,
          progress,
          updated_at,
          class:classes (
            id,
            name,
            code,
            teacher_id,
            students_count,
            created_at,
            updated_at
          )
        `)
        .eq('student_id', student.id)
        .order('joined_at', { ascending: false });

      if (enrollError) return [];
      if (!enrollments || enrollments.length === 0) return [];
      
      const enrichedEnrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          if (enrollment.class && enrollment.class.teacher_id) {
            const { data: teacher } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', enrollment.class.teacher_id)
              .maybeSingle();
            
            return {
              ...enrollment,
              class: {
                ...enrollment.class,
                teacher: teacher || { name: 'Unknown Teacher', email: '' }
              }
            };
          }
          return enrollment;
        })
      );
      
      return enrichedEnrollments;
    } catch (error) {
      console.error('Error in getStudentClasses:', error);
      return [];
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
      
      if (error) return false;
      return !!data;
    } catch (error) {
      console.error('Error in isStudentInClass:', error);
      return false;
    }
  },

  async joinClass(authUserId, classCode) {
    try {
      if (!authUserId || !classCode) {
        throw new Error('User ID and class code are required');
      }

      const realUser = await this.getRealUserFromAuth();
      const student = await this.getOrCreateStudent(authUserId, realUser?.email, realUser?.name);
      if (!student) throw new Error('Could not create or find student record');
      
      const classData = await this.getClassByCode(classCode);
      if (!classData) throw new Error(`Class not found with code: ${classCode}`);

      const isAlreadyJoined = await this.isStudentInClass(student.id, classData.id);
      if (isAlreadyJoined) throw new Error('You are already a member of this class!');

      const { data, error } = await supabase
        .from('class_students')
        .insert({
          class_id: classData.id,
          student_id: student.id,
          joined_at: new Date().toISOString(),
          progress: 0
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to join class: ${error.message}`);

      await this.updateStudentCount(classData.id);

      return {
        success: true,
        message: `Successfully joined ${classData.name}!`,
        class: classData,
        enrollment: data
      };
    } catch (error) {
      console.error('Error in joinClass:', error);
      throw error;
    }
  },

  // ========== GET CLASS WITH STUDENTS (with real Google names) ==========
  async getClassWithStudents(classId) {
    try {
      if (!classId) return null;
      
      console.log('📋 Fetching class with students for ID:', classId);
      
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .maybeSingle();

      if (classError) {
        console.error('Error getting class:', classError);
        return null;
      }
      
      if (!classData) return null;
      
      if (classData.teacher_id) {
        const { data: teacher } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', classData.teacher_id)
          .maybeSingle();
        
        if (teacher) classData.teacher = teacher;
      }
      
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_students')
        .select('*')
        .eq('class_id', classId);
      
      if (enrollError) {
        classData.students = [];
        return classData;
      }
      
      if (!enrollments || enrollments.length === 0) {
        classData.students = [];
        return classData;
      }
      
      const studentIds = enrollments.map(e => e.student_id);
      
      const { data: students } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds);
      
      const userIds = students?.map(s => s.user_id).filter(id => id) || [];
      
      let users = [];
      if (userIds.length > 0) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .in('id', userIds);
        
        if (userData) users = userData;
      }
      
      const userMap = {};
      users.forEach(user => { userMap[user.id] = user; });
      
      const studentMap = {};
      students?.forEach(student => { studentMap[student.id] = student; });
      
      const studentsWithDetails = enrollments.map(enrollment => {
        const student = studentMap[enrollment.student_id];
        const authUser = student ? userMap[student.user_id] : null;
        
        return {
          id: enrollment.id,
          class_id: enrollment.class_id,
          student_id: enrollment.student_id,
          joined_at: enrollment.joined_at,
          progress: enrollment.progress || 0,
          updated_at: enrollment.updated_at,
          users: {
            id: authUser?.id,
            name: authUser?.name || student?.name || 'Student',
            email: authUser?.email || student?.email || '',
            avatar_url: authUser?.avatar_url || null
          }
        };
      });
      
      classData.students = studentsWithDetails;
      return classData;
    } catch (error) {
      console.error('Error in getClassWithStudents:', error);
      return null;
    }
  },

  // ========== GET CLASS STUDENTS - Returns real Google names for Classes.jsx ==========
  async getClassStudents(classId) {
    try {
      if (!classId) return [];
      
      console.log('📋 Getting students for class:', classId);
      
      // Get enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_students')
        .select('*')
        .eq('class_id', classId);
      
      if (enrollError) {
        console.error('Error getting enrollments:', enrollError);
        return [];
      }
      
      if (!enrollments || enrollments.length === 0) return [];
      
      // Get student IDs
      const studentIds = enrollments.map(e => e.student_id);
      
      // Get students
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds);
      
      if (studentError) {
        console.error('Error getting students:', studentError);
        return [];
      }
      
      // Get user IDs from students
      const userIds = students?.map(s => s.user_id).filter(id => id) || [];
      
      // Get users from auth users table (this has real Google names!)
      let users = [];
      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .in('id', userIds);
        
        if (!userError && userData) {
          users = userData;
          console.log('✅ Found users with real Google names:', users.map(u => ({ name: u.name, email: u.email })));
        }
      }
      
      // Create lookup maps
      const userMap = {};
      users.forEach(user => { userMap[user.id] = user; });
      
      const studentMap = {};
      students?.forEach(student => { studentMap[student.id] = student; });
      
      // Get points for each student
      const pointsMap = {};
      for (const student of (students || [])) {
        const { data: pointData } = await supabase
          .from('student_points')
          .select('points')
          .eq('student_id', student.id)
          .eq('class_id', classId)
          .maybeSingle();
        
        pointsMap[student.id] = pointData?.points || 0;
      }
      
      // Combine all data - THIS IS WHAT CLASSES.JSX EXPECTS
      const result = enrollments.map(enrollment => {
        const student = studentMap[enrollment.student_id];
        const authUser = student ? userMap[student.user_id] : null;
        const points = pointsMap[enrollment.student_id] || 0;
        
        return {
          id: enrollment.id,
          class_id: enrollment.class_id,
          student_id: enrollment.student_id,
          joined_at: enrollment.joined_at,
          progress: enrollment.progress || 0,
          updated_at: enrollment.updated_at,
          points: points,
          // This users object is what Classes.jsx uses to display names and emails
          users: {
            id: authUser?.id,
            name: authUser?.name || student?.name || 'Student',
            email: authUser?.email || student?.email || '',
            avatar_url: authUser?.avatar_url || null
          }
        };
      });
      
      console.log('📋 Returning students with real Google names:', 
        result.map(r => ({ name: r.users?.name, email: r.users?.email, points: r.points })));
      
      return result;
    } catch (error) {
      console.error('Error in getClassStudents:', error);
      return [];
    }
  },

  async updateStudentCount(classId) {
    try {
      if (!classId) return 0;
      
      const { count, error: countError } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId);

      if (countError) return 0;

      const { error } = await supabase
        .from('classes')
        .update({ 
          students_count: count,
          updated_at: new Date().toISOString()
        })
        .eq('id', classId);

      if (error) console.error('Error updating student count:', error);
      return count;
    } catch (error) {
      console.error('Error in updateStudentCount:', error);
      return 0;
    }
  },

  async deleteClass(classId) {
    try {
      if (!classId) throw new Error('Class ID is required');
      
      await supabase.from('class_students').delete().eq('class_id', classId);
      const { error } = await supabase.from('classes').delete().eq('id', classId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in deleteClass:', error);
      throw error;
    }
  },

  async updateClass(classId, updates) {
    try {
      if (!classId) throw new Error('Class ID is required');
      
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
    } catch (error) {
      console.error('Error in updateClass:', error);
      throw error;
    }
  },

  async removeStudentFromClass(classId, studentId) {
    try {
      const { error } = await supabase
        .from('class_students')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId);
      
      if (error) throw error;
      await this.updateStudentCount(classId);
      
      return { success: true, message: 'Successfully removed from class' };
    } catch (error) {
      console.error('Error in removeStudentFromClass:', error);
      return { success: false, message: error.message || 'Failed to remove from class' };
    }
  },

  // ========== TEAM ASSIGNMENT MANAGEMENT (FIXED - NO AUTH CHECK) ==========
  
  async getClassTeamAssignments(classId) {
    try {
      if (!classId) return [];
      
      const { data, error } = await supabase
        .from('team_assignments')
        .select('*')
        .eq('class_id', classId);
      
      if (error) {
        console.error('Error getting team assignments:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getClassTeamAssignments:', error);
      return [];
    }
  },

  async assignStudentToTeam(classId, studentId, team, role) {
    try {
      if (!classId || !studentId || !team || !role) {
        throw new Error('Missing required fields for team assignment');
      }
      
      console.log('📝 Assigning student to team:', { classId, studentId, team, role });
      
      // First check if assignment exists
      const { data: existing, error: checkError } = await supabase
        .from('team_assignments')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', studentId)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing assignment:', checkError);
      }
      
      let result;
      
      if (existing) {
        // Update existing assignment
        const { data, error } = await supabase
          .from('team_assignments')
          .update({
            team: team,
            role: role,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating team assignment:', error);
          throw new Error(`Failed to update team assignment: ${error.message}`);
        }
        result = data;
        console.log('✅ Updated team assignment:', result);
      } else {
        // Create new assignment
        const { data, error } = await supabase
          .from('team_assignments')
          .insert({
            class_id: classId,
            student_id: studentId,
            team: team,
            role: role,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating team assignment:', error);
          throw new Error(`Failed to create team assignment: ${error.message}`);
        }
        result = data;
        console.log('✅ Created team assignment:', result);
      }
      
      return result;
    } catch (error) {
      console.error('Error in assignStudentToTeam:', error);
      throw error;
    }
  },

  async removeStudentFromTeam(classId, studentId) {
    try {
      const { error } = await supabase
        .from('team_assignments')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId);
      
      if (error) {
        console.error('Error removing team assignment:', error);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error in removeStudentFromTeam:', error);
      throw error;
    }
  },

  async getStudentTeamAssignment(studentId, classId) {
    try {
      if (!studentId || !classId) return null;
      
      const { data, error } = await supabase
        .from('team_assignments')
        .select('*')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .maybeSingle();
      
      if (error) {
        console.error('Error getting student team assignment:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error in getStudentTeamAssignment:', error);
      return null;
    }
  },

  async getStudentsByTeam(classId, team) {
    try {
      if (!classId || !team) return [];
      
      const { data, error } = await supabase
        .from('team_assignments')
        .select('*, student:students(*)')
        .eq('class_id', classId)
        .eq('team', team);
      
      if (error) {
        console.error('Error getting students by team:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getStudentsByTeam:', error);
      return [];
    }
  },

  // ========== STUDENT READY STATUS MANAGEMENT ==========

  async setStudentReadyStatus(studentId, classId, team, isReady) {
    try {
      if (!studentId || !classId) {
        throw new Error('Missing required fields');
      }
      
      // Check if status exists
      const { data: existing, error: checkError } = await supabase
        .from('student_ready_status')
        .select('id')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing status:', checkError);
      }
      
      let result;
      
      if (existing) {
        const { data, error } = await supabase
          .from('student_ready_status')
          .update({
            is_ready: isReady,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('student_ready_status')
          .insert({
            student_id: studentId,
            class_id: classId,
            team: team,
            is_ready: isReady,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      return result;
    } catch (error) {
      console.error('Error in setStudentReadyStatus:', error);
      throw error;
    }
  },

  async getStudentReadyStatuses(classId) {
    try {
      if (!classId) return [];
      
      const { data, error } = await supabase
        .from('student_ready_status')
        .select('*, student:students(*)')
        .eq('class_id', classId);
      
      if (error) {
        console.error('Error getting ready statuses:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getStudentReadyStatuses:', error);
      return [];
    }
  },

  async checkTeamReadyStatus(classId, team) {
    try {
      if (!classId || !team) return false;
      
      const { data, error } = await supabase
        .from('student_ready_status')
        .select('is_ready')
        .eq('class_id', classId)
        .eq('team', team);
      
      if (error) {
        console.error('Error checking team ready status:', error);
        return false;
      }
      
      // All team members must be ready
      if (!data || data.length === 0) return false;
      
      return data.every(status => status.is_ready === true);
    } catch (error) {
      console.error('Error in checkTeamReadyStatus:', error);
      return false;
    }
  },

  async resetTeamReadyStatus(classId, team) {
    try {
      if (!classId || !team) return false;
      
      const { error } = await supabase
        .from('student_ready_status')
        .update({
          is_ready: false,
          updated_at: new Date().toISOString()
        })
        .eq('class_id', classId)
        .eq('team', team);
      
      if (error) {
        console.error('Error resetting team ready status:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in resetTeamReadyStatus:', error);
      return false;
    }
  },

  // ========== MISSION MANAGEMENT ==========

  async getClassMissions(classId) {
    try {
      if (!classId) return [];
      
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('class_id', classId)
        .order('due_date', { ascending: true });
      
      if (error) return [];
      return data || [];
    } catch (error) {
      console.error('Error in getClassMissions:', error);
      return [];
    }
  },

  async createMission(missionData) {
    try {
      const { data, error } = await supabase
        .from('missions')
        .insert({
          ...missionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in createMission:', error);
      throw error;
    }
  },

  async updateMission(missionId, updates) {
    try {
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
    } catch (error) {
      console.error('Error in updateMission:', error);
      throw error;
    }
  },

  async deleteMission(missionId) {
    try {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', missionId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in deleteMission:', error);
      throw error;
    }
  },

  // ========== STUDENT POINTS MANAGEMENT ==========

  async updateStudentPoints(classId, studentId, pointsDelta) {
    try {
      if (!classId || !studentId) {
        throw new Error('Missing required fields');
      }
      
      // Check if points record exists
      const { data: existing, error: checkError } = await supabase
        .from('student_points')
        .select('id, points')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking points:', checkError);
      }
      
      let result;
      
      if (existing) {
        const newPoints = (existing.points || 0) + pointsDelta;
        const { data, error } = await supabase
          .from('student_points')
          .update({
            points: Math.max(0, newPoints),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('student_points')
          .insert({
            student_id: studentId,
            class_id: classId,
            points: Math.max(0, pointsDelta),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      return result;
    } catch (error) {
      console.error('Error in updateStudentPoints:', error);
      throw error;
    }
  },

  async getStudentPoints(classId, studentId) {
    try {
      if (!classId || !studentId) return 0;
      
      const { data, error } = await supabase
        .from('student_points')
        .select('points')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .maybeSingle();
      
      if (error) return 0;
      return data?.points || 0;
    } catch (error) {
      console.error('Error in getStudentPoints:', error);
      return 0;
    }
  },

  async getClassLeaderboard(classId) {
    try {
      if (!classId) return [];
      
      const { data, error } = await supabase
        .from('student_points')
        .select('*, student:students(*)')
        .eq('class_id', classId)
        .order('points', { ascending: false });
      
      if (error) {
        console.error('Error getting leaderboard:', error);
        return [];
      }
      
      // Enrich with Google user data
      const enrichedData = [];
      for (const item of (data || [])) {
        const student = item.student;
        if (student && student.user_id) {
          const { data: user } = await supabase
            .from('users')
            .select('name, email, avatar_url')
            .eq('id', student.user_id)
            .maybeSingle();
          
          enrichedData.push({
            ...item,
            student: {
              ...student,
              user: user || { name: student.name, email: student.email }
            }
          });
        } else {
          enrichedData.push(item);
        }
      }
      
      return enrichedData;
    } catch (error) {
      console.error('Error in getClassLeaderboard:', error);
      return [];
    }
  },

  // ========== STUDENT PROGRESS ==========

  async getStudentProgress(classId, authUserId) {
    try {
      const student = await this.getStudentByUserId(authUserId);
      if (!student) return 0;
      
      const { data, error } = await supabase
        .from('class_students')
        .select('progress')
        .eq('class_id', classId)
        .eq('student_id', student.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') return 0;
      return data?.progress || 0;
    } catch (error) {
      console.error('Error in getStudentProgress:', error);
      return 0;
    }
  },

  async updateStudentProgress(classId, authUserId, progress) {
    try {
      const student = await this.getStudentByUserId(authUserId);
      if (!student) return null;
      
      const { data, error } = await supabase
        .from('class_students')
        .update({
          progress: progress,
          updated_at: new Date().toISOString()
        })
        .eq('class_id', classId)
        .eq('student_id', student.id)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateStudentProgress:', error);
      throw error;
    }
  }
};

export default classService;