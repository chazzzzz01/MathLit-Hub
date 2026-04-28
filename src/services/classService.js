// src/services/classService.js
import { supabase } from '../lib/supabase';

export const classService = {
  // ========== HELPER: Get current user with better error handling ==========
  async getCurrentUser() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        return null;
      }
      
      if (session?.user) {
        console.log('✅ User found via session:', session.user.email);
        return session.user;
      }
      
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
      
      const realUser = await this.getRealUserFromAuth();
      
      const finalEmail = realUser?.email || email || '';
      const finalName = realUser?.name || name || finalEmail?.split('@')[0] || '';
      
      let { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();
      
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking user:', selectError);
      }
      
      if (existingUser) {
        console.log('✅ Existing user found:', existingUser.id);
        return existingUser;
      }
      
      const { data: doubleCheck, error: doubleCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();
      
      if (doubleCheck) {
        console.log('✅ User found on double check:', doubleCheck.id);
        return doubleCheck;
      }
      
      console.log('📝 Creating new user:', authUserId);
      
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
        if (insertError.code === '23505') {
          console.log('⚠️ Duplicate user detected, fetching...');
          const { data: retryUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUserId)
            .maybeSingle();
          
          if (retryUser) return retryUser;
        }
        console.error('Error creating user:', insertError);
        return null;
      }
      
      console.log('✅ Created new user:', newUser.id);
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
      
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking student:', selectError);
      }
      
      if (existingStudent) {
        console.log('✅ Existing student found:', existingStudent.id);
        return existingStudent;
      }
      
      const { data: doubleCheck, error: doubleCheckError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (doubleCheck) {
        console.log('✅ Student found on double check:', doubleCheck.id);
        return doubleCheck;
      }
      
      console.log('📝 Creating new student for user:', authUserId);
      
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
        if (insertError.code === '23505') {
          console.log('⚠️ Duplicate detected, fetching existing student...');
          const { data: retryStudent } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', authUserId)
            .maybeSingle();
          
          if (retryStudent) {
            console.log('✅ Found existing student after duplicate:', retryStudent.id);
            return retryStudent;
          }
        }
        console.error('Error creating student:', insertError);
        return null;
      }
      
      console.log('✅ Created new student:', newStudent.id);
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
        .select(`
          *,
          user:user_id (
            id,
            name,
            email,
            avatar_url
          )
        `)
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

  // ========== HELPER: Get teacher by teacher ID ==========
  async getTeacherById(teacherId) {
    try {
      if (!teacherId) return null;
      
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          *,
          user:user_id (
            id,
            name,
            email,
            avatar_url
          )
        `)
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
      
      if (error) {
        console.error('Error getting user by ID:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserById:', error);
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

      // FIXED: Removed 'description' field - only insert fields that exist in the table
      const insertData = {
        name: classData.name,
        code: classData.code.toUpperCase(),
        teacher_id: teacher.id,
        students_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Only add description if the column exists (check optional)
      if (classData.description && typeof classData.description === 'string') {
        // If you want to add description later, add the column to your table
        console.log('Note: Description field will be added when you run the SQL migration');
        // insertData.description = classData.description; // Uncomment after adding column
      }
      
      console.log('📝 Creating class with data:', insertData);
      
      const { data, error } = await supabase
        .from('classes')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create class: ${error.message}`);
      }
      
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
        .select(`
          *,
          teacher:teacher_id (
            id,
            user_id,
            name,
            email,
            user:user_id (
              id,
              name,
              email
            )
          )
        `)
        .eq('teacher_id', teacher.id)
        .order('created_at', { ascending: false });
      
      if (error) return [];
      
      const enrichedData = (data || []).map(cls => ({
        ...cls,
        teacher_name: cls.teacher?.user?.name || cls.teacher?.name || 'Teacher'
      }));
      
      return enrichedData;
    } catch (error) {
      console.error('Error in getTeacherClasses:', error);
      return [];
    }
  },

  async getClassById(classId) {
    try {
      if (!classId) return null;
      
      console.log('📚 Fetching class by ID:', classId);
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          teacher:teacher_id (
            id,
            user_id,
            name,
            email,
            user:user_id (
              id,
              name,
              email,
              avatar_url
            )
          )
        `)
        .eq('id', classId)
        .maybeSingle();
      
      if (error) {
        console.error('Error getting class by ID:', error);
        return null;
      }
      
      if (!data) return null;
      
      let teacherName = 'Teacher';
      
      if (data.teacher) {
        if (data.teacher.user && data.teacher.user.name) {
          teacherName = data.teacher.user.name;
        } 
        else if (data.teacher.name) {
          teacherName = data.teacher.name;
        }
        else if (data.teacher_id) {
          const teacherDetails = await this.getTeacherById(data.teacher_id);
          if (teacherDetails && teacherDetails.user && teacherDetails.user.name) {
            teacherName = teacherDetails.user.name;
          } else if (teacherDetails && teacherDetails.name) {
            teacherName = teacherDetails.name;
          }
        }
      }
      
      if (teacherName === 'Teacher' && data.teacher_id) {
        const { data: teacherUser } = await supabase
          .from('teachers')
          .select('user_id')
          .eq('id', data.teacher_id)
          .maybeSingle();
        
        if (teacherUser && teacherUser.user_id) {
          const userData = await this.getUserById(teacherUser.user_id);
          if (userData && userData.name) {
            teacherName = userData.name;
          }
        }
      }
      
      console.log('👨‍🏫 Teacher name found:', teacherName);
      
      return {
        ...data,
        teacher_name: teacherName,
        teacher: data.teacher ? {
          ...data.teacher,
          name: teacherName
        } : { name: teacherName }
      };
      
    } catch (error) {
      console.error('Error in getClassById:', error);
      return null;
    }
  },

  async getClassByCode(code) {
    try {
      if (!code) return null;
      
      const upperCode = code.toUpperCase().trim();
      
      console.log('🔍 Looking for class with code:', upperCode);
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          teacher:teacher_id (
            id,
            user_id,
            name,
            email,
            user:user_id (
              id,
              name,
              email,
              avatar_url
            )
          )
        `)
        .eq('code', upperCode)
        .maybeSingle();

      if (error) {
        console.error('Error getting class by code:', error);
        return null;
      }
      
      if (!data) return null;
      
      let teacherName = 'Teacher';
      
      if (data.teacher) {
        if (data.teacher.user && data.teacher.user.name) {
          teacherName = data.teacher.user.name;
        } else if (data.teacher.name) {
          teacherName = data.teacher.name;
        } else if (data.teacher_id) {
          const teacherDetails = await this.getTeacherById(data.teacher_id);
          if (teacherDetails && teacherDetails.user && teacherDetails.user.name) {
            teacherName = teacherDetails.user.name;
          } else if (teacherDetails && teacherDetails.name) {
            teacherName = teacherDetails.name;
          }
        }
      }
      
      const { count: studentsCount, error: countError } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', data.id);
      
      return {
        ...data,
        teacher_name: teacherName,
        teacher: data.teacher ? {
          ...data.teacher,
          name: teacherName
        } : { name: teacherName },
        students_count: countError ? 0 : (studentsCount || 0)
      };
      
    } catch (error) {
      console.error('Error in getClassByCode:', error);
      return null;
    }
  },

  async getStudentClasses(authUserId) {
    try {
      if (!authUserId) return [];
      
      console.log('📚 Getting classes for student:', authUserId);
      
      const student = await this.getStudentByUserId(authUserId);
      if (!student) {
        console.log('No student record found');
        return [];
      }
      
      let enrollments = [];
      
      try {
        const { data, error } = await supabase
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
        
        if (!error) {
          enrollments = data || [];
        } else {
          console.warn('Error fetching enrollments:', error.message);
          enrollments = [];
        }
      } catch (err) {
        console.error('Error in enrollment query:', err);
        enrollments = [];
      }
      
      if (!enrollments || enrollments.length === 0) {
        console.log('No enrollments found');
        return [];
      }
      
      console.log(`Found ${enrollments.length} enrollments`);
      
      const enrichedEnrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          let teacherName = 'Teacher';
          let teacherData = null;
          
          if (enrollment.class && enrollment.class.teacher_id) {
            const { data: teacher, error: teacherError } = await supabase
              .from('teachers')
              .select(`
                id,
                user_id,
                name,
                email,
                user:user_id (
                  id,
                  name,
                  email
                )
              `)
              .eq('id', enrollment.class.teacher_id)
              .maybeSingle();
            
            if (!teacherError && teacher) {
              teacherData = teacher;
              teacherName = teacher.user?.name || teacher.name || 'Teacher';
            }
            
            if (teacherName === 'Teacher' && enrollment.class.teacher_id) {
              const { data: teacherRecord } = await supabase
                .from('teachers')
                .select('user_id')
                .eq('id', enrollment.class.teacher_id)
                .maybeSingle();
              
              if (teacherRecord && teacherRecord.user_id) {
                const userData = await this.getUserById(teacherRecord.user_id);
                if (userData && userData.name) {
                  teacherName = userData.name;
                }
              }
            }
          }
          
          return {
            ...enrollment,
            class: {
              ...enrollment.class,
              teacher_name: teacherName,
              teacher: teacherData || { name: teacherName }
            }
          };
        })
      );
      
      console.log('✅ Found classes with teacher names:', enrichedEnrollments.length);
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
      if (isAlreadyJoined) {
        throw new Error('You are already a member of this class!');
      }

      const { data: existingEnrollment, error: checkError } = await supabase
        .from('class_students')
        .select('id')
        .eq('class_id', classData.id)
        .eq('student_id', student.id)
        .maybeSingle();
      
      if (existingEnrollment) {
        throw new Error('You are already enrolled in this class');
      }

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

      if (error) {
        if (error.code === '23505') {
          throw new Error('You are already a member of this class!');
        }
        throw new Error(`Failed to join class: ${error.message}`);
      }

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

  async getClassStudents(classId) {
    try {
      if (!classId) return [];
      
      console.log('📋 Getting students for class:', classId);
      
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_students')
        .select(`
          id,
          class_id,
          student_id,
          joined_at,
          progress,
          updated_at,
          students:student_id (
            id,
            user_id,
            email,
            name,
            created_at
          )
        `)
        .eq('class_id', classId);
      
      if (enrollError) {
        console.error('Error getting enrollments:', enrollError);
        return [];
      }
      
      if (!enrollments || enrollments.length === 0) return [];
      
      const userIds = [...new Set(
        enrollments
          .map(e => e.students?.user_id)
          .filter(id => id)
      )];
      
      let usersMap = {};
      if (userIds.length > 0) {
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .in('id', userIds);
        
        if (!userError && users) {
          usersMap = Object.fromEntries(users.map(u => [u.id, u]));
          console.log('✅ Found users with real names:', Object.keys(usersMap).length);
        }
      }
      
      const { data: points } = await supabase
        .from('student_points')
        .select('student_id, points')
        .eq('class_id', classId);
      
      const pointsMap = {};
      if (points) {
        points.forEach(p => { pointsMap[p.student_id] = p.points; });
      }
      
      const result = enrollments.map(enrollment => {
        const student = enrollment.students;
        const user = student ? usersMap[student.user_id] : null;
        
        return {
          id: enrollment.id,
          class_id: enrollment.class_id,
          student_id: enrollment.student_id,
          joined_at: enrollment.joined_at,
          progress: enrollment.progress || 0,
          updated_at: enrollment.updated_at,
          points: pointsMap[enrollment.student_id] || 0,
          users: {
            id: user?.id,
            name: user?.name || student?.name || 'Student',
            email: user?.email || student?.email || '',
            avatar_url: user?.avatar_url || null
          }
        };
      });
      
      console.log('📋 Returning students:', result.length);
      return result;
      
    } catch (error) {
      console.error('Error in getClassStudents:', error);
      return [];
    }
  },

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

  // ========== DELETE CLASS - COMPLETELY REMOVES FROM DATABASE ==========
  async deleteClass(classId, teacherAuthUserId) {
    try {
      if (!classId) throw new Error('Class ID is required');
      if (!teacherAuthUserId) throw new Error('Teacher authorization required');
      
      // Verify the teacher owns this class
      const teacher = await this.getTeacherByUserId(teacherAuthUserId);
      if (!teacher) throw new Error('Teacher not found');
      
      // Get class to verify ownership
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', classId)
        .maybeSingle();
      
      if (classError) throw new Error('Class not found');
      if (classData.teacher_id !== teacher.id) {
        throw new Error('You do not have permission to delete this class');
      }
      
      console.log(`🗑️ Deleting class ${classId} and all related data...`);
      
      // 1. Delete student points
      const { error: pointsError } = await supabase
        .from('student_points')
        .delete()
        .eq('class_id', classId);
      
      if (pointsError) {
        console.warn('Error deleting student points:', pointsError);
      }
      
      // 2. Delete team assignments
      const { error: teamError } = await supabase
        .from('team_assignments')
        .delete()
        .eq('class_id', classId);
      
      if (teamError) {
        console.warn('Error deleting team assignments:', teamError);
      }
      
      // 3. Delete student ready statuses
      const { error: readyStatusError } = await supabase
        .from('student_ready_status')
        .delete()
        .eq('class_id', classId);
      
      if (readyStatusError) {
        console.warn('Error deleting ready statuses:', readyStatusError);
      }
      
      // 4. Delete announcements
      const { error: announcementsError } = await supabase
        .from('announcements')
        .delete()
        .eq('class_id', classId);
      
      if (announcementsError) {
        console.warn('Error deleting announcements:', announcementsError);
      }
      
      // 5. Delete missions
      const { error: missionsError } = await supabase
        .from('missions')
        .delete()
        .eq('class_id', classId);
      
      if (missionsError) {
        console.warn('Error deleting missions:', missionsError);
      }
      
      // 6. Delete class students (enrollments)
      const { error: enrollmentsError } = await supabase
        .from('class_students')
        .delete()
        .eq('class_id', classId);
      
      if (enrollmentsError) {
        console.warn('Error deleting enrollments:', enrollmentsError);
      }
      
      // 7. Finally, delete the class itself
      const { error: deleteError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);
      
      if (deleteError) {
        throw new Error(`Failed to delete class: ${deleteError.message}`);
      }
      
      console.log(`✅ Class ${classId} and all related data deleted successfully`);
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('classDeleted', { 
          detail: { classId, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
      }
      
      return { 
        success: true, 
        message: 'Class and all related data deleted successfully' 
      };
      
    } catch (error) {
      console.error('Error in deleteClass:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to delete class' 
      };
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

  // ========== CLASS ANNOUNCEMENTS ==========
  async getClassAnnouncements(classId) {
    try {
      if (!classId) return [];
      
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          teacher:teacher_id (
            id,
            name,
            user:user_id (
              id,
              name,
              email
            )
          )
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting announcements:', error);
        return [];
      }
      
      const enrichedData = (data || []).map(announcement => ({
        ...announcement,
        teacher_name: announcement.teacher?.user?.name || announcement.teacher?.name || 'Teacher'
      }));
      
      return enrichedData;
    } catch (error) {
      console.error('Error in getClassAnnouncements:', error);
      return [];
    }
  },

  async createAnnouncement(announcementData) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          ...announcementData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in createAnnouncement:', error);
      throw error;
    }
  },

  // ========== TEAM ASSIGNMENT MANAGEMENT ==========
  
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
      
      const { data: existing, error: checkError } = await supabase
        .from('team_assignments')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', studentId)
        .maybeSingle();
      
      let result;
      
      if (existing) {
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
        
        if (error) throw error;
        result = data;
      } else {
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
        
        if (error) throw error;
        result = data;
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
      
      if (error) throw error;
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
      
      if (error) return null;
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
      
      if (error) return [];
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
      
      const { data: existing, error: checkError } = await supabase
        .from('student_ready_status')
        .select('id')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .maybeSingle();
      
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
      
      if (error) return [];
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
      
      if (error) return false;
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
      
      if (error) return false;
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
      
      const { data: existing, error: checkError } = await supabase
        .from('student_points')
        .select('id, points')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .maybeSingle();
      
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
      
      if (error) return [];
      
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