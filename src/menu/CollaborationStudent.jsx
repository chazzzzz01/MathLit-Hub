// src/menu/CollaborationStudent.jsx
import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FiBookOpen, FiChevronDown, FiUsers, FiUser, FiUserCheck, FiUserX, 
  FiUserPlus, FiStar, FiClock, FiSend, FiCheckCircle, 
  FiXCircle, FiAward, FiAlertCircle, FiZap, FiLock, FiRefreshCw
} from 'react-icons/fi';
import { classService } from '../services/classService';
import { supabase } from '../lib/supabase';

function CollaborationStudent() {
  const { user, userData } = useOutletContext();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [error, setError] = useState(null);
  const [studentPoints, setStudentPoints] = useState(0);
  const [teamTotalPoints, setTeamTotalPoints] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [isReady, setIsReady] = useState(false);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [currentRound, setCurrentRound] = useState(null);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [roundEnded, setRoundEnded] = useState(false);
  const [roundResult, setRoundResult] = useState(null);
  const [waitingForResults, setWaitingForResults] = useState(false);
  const [submittedAnswerText, setSubmittedAnswerText] = useState('');
  const [readySubmitted, setReadySubmitted] = useState(false);
  const [teacherStartedRound, setTeacherStartedRound] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [readyError, setReadyError] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  
  const [isQuestionLocked, setIsQuestionLocked] = useState(true);
  const [teacherClickedStart, setTeacherClickedStart] = useState(false);
  const [roundStarting, setRoundStarting] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  
  const [studentUUID, setStudentUUID] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [waitingForTeacher, setWaitingForTeacher] = useState(false);
  
  // New states for real-time question receiving
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [roundActive, setRoundActive] = useState(false);
  const [canAnswer, setCanAnswer] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  
  const dropdownRef = useRef(null);
  const submittedAnswerRef = useRef(null);
  const gameSessionSubscriptionRef = useRef(null);
  const roundStatusSubscriptionRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  let countdownInterval = null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get the auth user ID from the user object
  const getAuthUserId = () => {
    if (user?.id) return user.id;
    if (user?.dbId) return user.dbId;
    if (userData?.id) return userData.id;
    if (userData?.dbId) return userData.dbId;
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.id) return parsedUser.id;
        if (parsedUser?.dbId) return parsedUser.dbId;
      } catch (e) {}
    }
    return null;
  };

  // Countdown timer function
  const startCountdown = (endsAt) => {
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endsAt).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        setCanAnswer(false);
        setIsQuestionLocked(true);
      }
    }, 1000);
  };

  // Check answer against correct answer
  const checkAnswerAgainstCorrect = async (correctAnswer, studentAns) => {
    if (!studentAns) return;
    
    const isCorrect = studentAns.trim().toLowerCase() === correctAnswer.toLowerCase();
    
    setRoundResult({
      isCorrect: isCorrect,
      correctAnswer: correctAnswer,
      yourAnswer: studentAns,
      pointsEarned: isCorrect ? 10 : 0
    });
    
    setRoundEnded(true);
    setRoundActive(false);
    setCanAnswer(false);
    
    // Update points if correct
    if (isCorrect && studentUUID && selectedClass?.id) {
      try {
        const currentPoints = await classService.getStudentPoints(selectedClass.id, studentUUID);
        await classService.updateStudentPoints(selectedClass.id, studentUUID, currentPoints + 10);
        await loadStudentPoints(selectedClass.id);
        
        // Update team total
        const { data: teamPoints } = await supabase
          .from('student_points')
          .select('points')
          .eq('class_id', selectedClass.id)
          .in('student_id', teamMembers.map(m => m.id));
        
        const total = teamPoints?.reduce((sum, p) => sum + (p.points || 0), 0) || 0;
        setTeamTotalPoints(total);
        
      } catch (error) {
        console.error('Error updating points:', error);
      }
    }
  };

  // Submit answer function
  const submitAnswer = async () => {
    if (!canAnswer || answerSubmitted) {
      setSubmissionError('Cannot submit answer at this time');
      return;
    }
    
    if (!studentAnswer.trim()) {
      setSubmissionError('Please enter your answer');
      return;
    }
    
    setQuestionLoading(true);
    setSubmissionError(null);
    
    try {
      // Get current game session
      const { data: gameSession, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('class_id', selectedClass.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (sessionError) throw sessionError;
      
      if (!gameSession) {
        throw new Error('No active game session found');
      }
      
      // Update team answers
      const teamAnswers = gameSession.team_answers || {};
      teamAnswers[teamInfo?.team] = studentAnswer;
      
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({
          team_answers: teamAnswers,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameSession.id);
      
      if (updateError) throw updateError;
      
      setAnswerSubmitted(true);
      setSubmitSuccess(true);
      setSubmittedAnswerText(studentAnswer);
      
      console.log('Answer submitted successfully');
      
      // Check if both teams have answered
      const { data: updatedSession } = await supabase
        .from('game_sessions')
        .select('team_answers')
        .eq('id', gameSession.id)
        .single();
      
      const answers = updatedSession?.team_answers || {};
      const bothTeamsAnswered = answers.A && answers.B;
      
      if (bothTeamsAnswered) {
        // End round automatically
        await supabase
          .from('round_status')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('class_id', selectedClass.id);
          
        await supabase
          .from('game_sessions')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', gameSession.id);
      }
      
    } catch (error) {
      console.error('Error submitting answer:', error);
      setSubmissionError(error.message || 'Failed to submit answer');
    } finally {
      setQuestionLoading(false);
    }
  };

  // Fetch or create student UUID
  const fetchOrCreateStudentUUID = async () => {
    const authUserId = getAuthUserId();
    
    if (!authUserId) {
      console.error('No auth user ID available');
      return null;
    }
    
    try {
      console.log('Fetching/creating student for auth user ID:', authUserId);
      
      let { data: existingStudent, error: fetchError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error fetching student:', fetchError);
      }
      
      if (existingStudent) {
        console.log('✅ Found existing student UUID:', existingStudent.id);
        setStudentUUID(existingStudent.id);
        return existingStudent.id;
      }
      
      console.log('Creating new student record...');
      
      const userEmail = user?.email || userData?.email || '';
      const userName = user?.name || userData?.name || user?.user_metadata?.name || userEmail?.split('@')[0] || 'Student';
      
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUserId)
        .maybeSingle();
      
      if (!existingUser) {
        await supabase
          .from('users')
          .insert({
            id: authUserId,
            email: userEmail,
            name: userName,
            role: 'student',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      const { data: newStudent, error: insertError } = await supabase
        .from('students')
        .insert({
          user_id: authUserId,
          name: userName,
          email: userEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error('Error creating student:', insertError);
        return null;
      }
      
      console.log('✅ Created new student UUID:', newStudent.id);
      setStudentUUID(newStudent.id);
      return newStudent.id;
    } catch (error) {
      console.error('Error in fetchOrCreateStudentUUID:', error);
      return null;
    }
  };

  // Load student points
  const loadStudentPoints = async (classId) => {
    if (!classId) return;
    
    try {
      const authUserId = getAuthUserId();
      if (!authUserId) return;
      
      const points = await classService.getStudentProgress(classId, authUserId);
      setStudentPoints(points);
    } catch (error) {
      console.error('Error loading student points:', error);
      setStudentPoints(0);
    }
  };

  // Load team info
  const loadTeamInfo = async (classId) => {
    const studentId = studentUUID;
    if (!studentId || !classId) return;
    
    setLoadingTeam(true);
    
    try {
      console.log('Loading team info for student:', studentId, 'class:', classId);
      
      const { data: assignment, error: assignmentError } = await supabase
        .from('team_assignments')
        .select('*')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .maybeSingle();
      
      if (assignmentError) throw assignmentError;
      
      if (assignment && assignment.team) {
        setTeamInfo({
          team: assignment.team,
          role: assignment.role,
          assignedAt: assignment.updated_at
        });
        
        const { data: teamAssignments, error: teamError } = await supabase
          .from('team_assignments')
          .select('*, student:students(*)')
          .eq('class_id', classId)
          .eq('team', assignment.team);
        
        if (teamError) throw teamError;
        
        const memberDetails = await Promise.all(
          (teamAssignments || []).map(async (ta) => {
            let userName = ta.student?.name || 'Student';
            let userEmail = ta.student?.email || '';
            
            if (ta.student?.user_id) {
              const { data: userData } = await supabase
                .from('users')
                .select('name, email')
                .eq('id', ta.student.user_id)
                .maybeSingle();
              if (userData) {
                userName = userData.name || userName;
                userEmail = userData.email || userEmail;
              }
            }
            
            const { data: pointData } = await supabase
              .from('student_points')
              .select('points')
              .eq('student_id', ta.student_id)
              .eq('class_id', classId)
              .maybeSingle();
            
            const points = pointData?.points || 0;
            
            return {
              id: ta.student_id,
              name: userName,
              email: userEmail,
              role: ta.role,
              isCurrentUser: ta.student_id === studentId,
              points: points
            };
          })
        );
        
        setTeamMembers(memberDetails);
        
        const total = memberDetails.reduce((sum, m) => sum + (m.points || 0), 0);
        setTeamTotalPoints(total);
      } else {
        setTeamInfo(null);
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error loading team info:', error);
      setTeamInfo(null);
      setTeamMembers([]);
    } finally {
      setLoadingTeam(false);
    }
  };

  // Load student classes
  const loadStudentClasses = async () => {
    const authUserId = getAuthUserId();
    
    if (!authUserId) {
      console.error('No auth user ID available');
      setError('Please log in again to continue.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Loading classes for auth user ID:', authUserId);
      
      const uuid = await fetchOrCreateStudentUUID();
      if (!uuid) {
        setError('Unable to create or find your student record.');
        setLoading(false);
        return;
      }
      
      const studentClasses = await classService.getStudentClasses(authUserId);
      console.log('Loaded student classes:', studentClasses);
      
      setClasses(studentClasses || []);
      
      if (studentClasses && studentClasses.length > 0 && !selectedClass) {
        const firstEnrollment = studentClasses[0];
        setSelectedClass({
          id: firstEnrollment.class_id,
          name: firstEnrollment.class?.name,
          code: firstEnrollment.class?.code,
          teacher: firstEnrollment.class?.teacher
        });
        
        await loadTeamInfo(firstEnrollment.class_id);
        await loadStudentPoints(firstEnrollment.class_id);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load your classes. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription for round status
  useEffect(() => {
    if (!selectedClass?.id || !studentUUID) return;
    
    console.log('Setting up real-time subscription for class:', selectedClass.id);
    
    // Subscribe to round_status changes
    const roundSubscription = supabase
      .channel(`round_status_${selectedClass.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'round_status',
          filter: `class_id=eq.${selectedClass.id}`
        },
        (payload) => {
          console.log('Round status changed:', payload);
          
          if (payload.new && payload.new.is_active === true) {
            // Round started
            setRoundActive(true);
            setCurrentQuestion(payload.new.question_data);
            setTimeLeft(payload.new.time_limit || 20);
            setCanAnswer(true);
            setAnswerSubmitted(false);
            setSubmitSuccess(false);
            setStudentAnswer('');
            setIsQuestionLocked(false);
            setRoundEnded(false);
            setRoundResult(null);
            
            // Start countdown timer
            if (payload.new.ends_at) {
              startCountdown(payload.new.ends_at);
            }
            
          } else if (payload.new && payload.new.is_active === false && payload.old?.is_active === true) {
            // Round ended - check answers
            setRoundActive(false);
            setCanAnswer(false);
            setIsQuestionLocked(true);
            
            if (countdownInterval) clearInterval(countdownInterval);
            
            // Get the final answers from game session
            const checkAnswers = async () => {
              const { data: gameSession } = await supabase
                .from('game_sessions')
                .select('team_answers')
                .eq('class_id', selectedClass.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
              
              const teamAnswers = gameSession?.team_answers || {};
              const myAnswer = teamAnswers[teamInfo?.team];
              
              if (myAnswer && payload.new.question_data?.answer) {
                checkAnswerAgainstCorrect(payload.new.question_data.answer, myAnswer);
              }
            };
            
            checkAnswers();
          }
        }
      )
      .subscribe();
    
    // Subscribe to game_sessions changes
    const gameSessionSubscription = supabase
      .channel(`game_sessions_${selectedClass.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `class_id=eq.${selectedClass.id}`
        },
        (payload) => {
          console.log('Game session changed:', payload);
          
          if (payload.new?.status === 'active') {
            setTeacherStartedRound(true);
            setRoundStarting(false);
          }
        }
      )
      .subscribe();
    
    // Check for existing active round
    const checkActiveRound = async () => {
      const { data: activeRound } = await supabase
        .from('round_status')
        .select('*')
        .eq('class_id', selectedClass.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (activeRound) {
        setRoundActive(true);
        setCurrentQuestion(activeRound.question_data);
        setTimeLeft(activeRound.time_limit || 20);
        setCanAnswer(true);
        setIsQuestionLocked(false);
        
        if (activeRound.ends_at) {
          startCountdown(activeRound.ends_at);
        }
      }
    };
    
    checkActiveRound();
    
    return () => {
      roundSubscription.unsubscribe();
      gameSessionSubscription.unsubscribe();
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [selectedClass?.id, studentUUID, teamInfo?.team]);

  // Initialize component
  useEffect(() => {
    const init = async () => {
      const authUserId = getAuthUserId();
      
      if (!authUserId) {
        console.log('No auth user ID found, waiting for user data...');
        setLoading(false);
        setInitialized(true);
        return;
      }
      
      console.log('Initializing with auth user ID:', authUserId);
      await loadStudentClasses();
      setInitialized(true);
    };
    
    init();
  }, [user?.id, user?.dbId, userData?.id, userData?.dbId]);

  // Refresh function
  const refreshClasses = async () => {
    setLoading(true);
    await loadStudentClasses();
  };

  const handleClassSelect = async (classItem) => {
    if (!classItem?.id) return;
    
    setSelectedClass(classItem);
    setShowDropdown(false);
    
    await loadTeamInfo(classItem.id);
    await loadStudentPoints(classItem.id);
    
    setIsReady(false);
    setReadySubmitted(false);
    setIsRoundActive(false);
    setAnswerSubmitted(false);
    setRoundEnded(false);
    setRoundResult(null);
    setStudentAnswer('');
    setWaitingForResults(false);
    setSubmittedAnswerText('');
    setCurrentRound(null);
    setTeacherStartedRound(false);
    setIsQuestionLocked(true);
    setWaitingForTeacher(false);
    setRoundActive(false);
    setCanAnswer(false);
    setCurrentQuestion(null);
  };

  // Fixed handleReady - no onConflict, direct insert
  const handleReady = async () => {
    if (!selectedClass?.id || !teamInfo?.team) {
      setReadyError('No class or team selected.');
      return;
    }
    
    if (readySubmitted || !studentUUID) {
      setReadyError('Already marked ready or no student ID.');
      return;
    }
    
    setReadyError(null);
    
    try {
      console.log('Marking student as ready:', { student_id: studentUUID, class_id: selectedClass.id, team: teamInfo.team });
      
      // Direct insert without onConflict - will fail if duplicate, but we check first
      const { error: insertError } = await supabase
        .from('student_ready_status')
        .insert({
          student_id: studentUUID,
          class_id: selectedClass.id,
          team: teamInfo.team,
          is_ready: true,
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        // If duplicate, try to update instead
        if (insertError.code === '23505') {
          console.log('Duplicate entry, updating existing...');
          const { error: updateError } = await supabase
            .from('student_ready_status')
            .update({
              team: teamInfo.team,
              is_ready: true,
              updated_at: new Date().toISOString()
            })
            .eq('student_id', studentUUID)
            .eq('class_id', selectedClass.id);
          
          if (updateError) throw updateError;
        } else {
          throw insertError;
        }
      }
      
      console.log('✅ Student ready status saved');
      setIsReady(true);
      setReadySubmitted(true);
      setWaitingForTeacher(true);
      
    } catch (error) {
      console.error('Error saving ready status:', error);
      setReadyError(error.message || 'Failed to set ready status.');
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'analyzer': return <FiUserCheck size={16} />;
      case 'checker': return <FiUserX size={16} />;
      case 'solver': return <FiUserPlus size={16} />;
      default: return <FiUser size={16} />;
    }
  };

  const getRoleInfo = (role) => {
    switch(role) {
      case 'analyzer':
        return { label: 'Analyzer', description: 'You analyze problems and break them down', color: '#8b5cf6', bgColor: '#ede9fe' };
      case 'checker':
        return { label: 'Checker', description: 'You verify answers and check for errors', color: '#f59e0b', bgColor: '#fed7aa' };
      case 'solver':
        return { label: 'Solver', description: 'You solve problems and find solutions', color: '#10b981', bgColor: '#d1fae5' };
      default:
        return { label: 'Not Assigned', description: 'You haven\'t been assigned to a team yet', color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const getTeamColor = (team) => team === 'A' ? '#3b82f6' : '#ef4444';
  const getTeamBgColor = (team) => team === 'A' ? '#eff6ff' : '#fef2f2';

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.headerSection}>
          <div style={styles.headerLeft}>
            <h1 style={styles.mainTitle}>Student Dashboard</h1>
            <p style={styles.subtitle}>Track your progress and collaborate with your team</p>
          </div>
          <button onClick={refreshClasses} style={styles.refreshButton} title="Refresh Classes">
            <FiRefreshCw size={18} />
            Refresh
          </button>
        </div>

        {debugInfo && (
          <div style={styles.debugPanel}>
            <strong>🔍 Debug:</strong> {debugInfo}
          </div>
        )}

        {error && (
          <div style={styles.errorCard}>
            <FiAlertCircle size={48} color="#ef4444" />
            <h2>Error Loading Classes</h2>
            <p>{error}</p>
            <button onClick={refreshClasses} style={styles.retryButton}>Try Again</button>
          </div>
        )}

        <div style={styles.selectionCard}>
          <div style={styles.selectionHeader}>
            <FiBookOpen size={20} color="#6366f1" />
            <span style={styles.selectionTitle}>Select Your Class</span>
            {classes.length > 0 && <span style={styles.classCount}>{classes.length} class{classes.length !== 1 ? 'es' : ''}</span>}
          </div>
          
          <div style={styles.customDropdown} ref={dropdownRef}>
            <button 
              style={styles.dropdownButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
            >
              <div style={styles.dropdownButtonContent}>
                {selectedClass ? (
                  <>
                    <div style={styles.selectedClassIcon}>📚</div>
                    <div style={styles.selectedClassInfo}>
                      <span style={styles.selectedClassName}>{selectedClass.name}</span>
                      <span style={styles.selectedClassCode}>Code: {selectedClass.code}</span>
                    </div>
                  </>
                ) : (
                  <span style={styles.placeholderText}>
                    {classes.length > 0 ? 'Select a class' : 'No classes joined yet'}
                  </span>
                )}
              </div>
              <FiChevronDown size={20} style={{
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }} />
            </button>
            
            {showDropdown && (
              <div style={styles.dropdownMenu}>
                {classes.length === 0 ? (
                  <div style={styles.emptyDropdown}>
                    <div style={styles.emptyIcon}>📚</div>
                    <p>You haven't joined any classes yet</p>
                    <p style={styles.emptySubtext}>Go to the Home page and click "Join a New Class" to get started!</p>
                  </div>
                ) : (
                  classes.map((enrollment) => (
                    <div
                      key={enrollment.class_id}
                      style={{
                        ...styles.dropdownItem,
                        ...(selectedClass?.id === enrollment.class_id ? styles.dropdownItemSelected : {})
                      }}
                      onClick={() => handleClassSelect({
                        id: enrollment.class_id,
                        name: enrollment.class?.name,
                        code: enrollment.class?.code,
                        teacher: enrollment.class?.teacher
                      })}
                    >
                      <div style={styles.dropdownItemContent}>
                        <div style={styles.dropdownItemIcon}>📚</div>
                        <div style={styles.dropdownItemInfo}>
                          <span style={styles.dropdownItemName}>
                            {enrollment.class?.name || 'Unnamed Class'}
                          </span>
                          <span style={styles.dropdownItemTeacher}>
                            👨‍🏫 {enrollment.class?.teacher?.name || 'Unknown Teacher'}
                          </span>
                        </div>
                      </div>
                      <span style={styles.joinedDate}>
                        📅 Joined: {new Date(enrollment.joined_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {readyError && (
          <div style={styles.errorCardSmall}>
            <FiAlertCircle size={20} color="#ef4444" />
            <p>{readyError}</p>
            <button onClick={() => setReadyError(null)} style={styles.dismissButton}>Dismiss</button>
          </div>
        )}

        {selectedClass && !teamInfo && !loadingTeam && (
          <div style={styles.noTeamCard}>
            <div style={styles.noTeamIcon}>👥</div>
            <h3>No Team Assigned Yet</h3>
            <p>You have joined <strong>{selectedClass.name}</strong> but haven't been assigned to a team yet.</p>
            <p>Please wait for your teacher to assign you to a team.</p>
          </div>
        )}

        {selectedClass && teamInfo && (
          <>
            <div style={styles.pointsDashboard}>
              <div style={styles.pointsCard}>
                <div style={styles.pointsCardLeft}>
                  <div style={styles.pointsIcon}>
                    <FiAward size={28} color="#f59e0b" />
                  </div>
                  <div style={styles.pointsInfo}>
                    <span style={styles.pointsLabel}>Your Points</span>
                    <span style={styles.pointsValue}>{studentPoints}</span>
                  </div>
                </div>
                <div style={styles.pointsCardRight}>
                  <div style={styles.teamPointsIcon}>
                    <FiUsers size={20} color="#6366f1" />
                  </div>
                  <div style={styles.teamPointsInfo}>
                    <span style={styles.teamPointsLabel}>Team {teamInfo.team} Total</span>
                    <span style={styles.teamPointsValue}>{teamTotalPoints}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.teamInfoCard}>
              <div style={styles.teamHeaderSection}>
                <div style={{
                  ...styles.teamBadge,
                  background: `linear-gradient(135deg, ${getTeamBgColor(teamInfo.team)} 0%, white 100%)`,
                  borderLeftColor: getTeamColor(teamInfo.team)
                }}>
                  <div style={styles.teamBadgeContent}>
                    <span style={styles.teamBadgeIcon}>
                      {teamInfo.team === 'A' ? '⚡' : '🔥'}
                    </span>
                    <div style={styles.teamBadgeText}>
                      <span style={styles.teamBadgeLabel}>Your Team</span>
                      <span style={{...styles.teamBadgeLetter, color: getTeamColor(teamInfo.team)}}>
                        Team {teamInfo.team}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.roleCardModern}>
                <div style={{
                  ...styles.roleIconModern,
                  backgroundColor: getRoleInfo(teamInfo.role).bgColor,
                  color: getRoleInfo(teamInfo.role).color
                }}>
                  {getRoleIcon(teamInfo.role)}
                </div>
                <div style={styles.roleInfoModern}>
                  <h3 style={styles.roleTitleModern}>Your Role: {getRoleInfo(teamInfo.role).label}</h3>
                  <p style={styles.roleDescriptionModern}>{getRoleInfo(teamInfo.role).description}</p>
                </div>
              </div>

              <div style={styles.membersSection}>
                <div style={styles.sectionHeader}>
                  <FiUsers size={20} color="#6366f1" />
                  <h3 style={styles.sectionTitle}>Team {teamInfo.team} Members</h3>
                  <span style={styles.memberCount}>{teamMembers.length} members</span>
                </div>
                
                <div style={styles.membersGrid}>
                  {teamMembers.map((member) => (
                    <div key={member.id} style={{
                      ...styles.memberCardModern,
                      ...(member.isCurrentUser ? styles.currentUserCardModern : {})
                    }}>
                      <div style={styles.memberAvatarModern}>
                        <div style={styles.avatarPlaceholderModern}>
                          {member.name?.charAt(0) || 'S'}
                        </div>
                      </div>
                      <div style={styles.memberInfoModern}>
                        <div style={styles.memberNameModern}>
                          {member.name}
                          {member.isCurrentUser && <span style={styles.youBadgeModern}>(You)</span>}
                        </div>
                        <div style={styles.memberRoleModern}>
                          {getRoleIcon(member.role)}
                          <span>{getRoleInfo(member.role).label}</span>
                        </div>
                        <div style={styles.memberPointsModern}>
                          <FiStar size={12} color="#f59e0b" />
                          <span>{member.points} points</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Section - Shows when round is active */}
              {roundActive && currentQuestion && (
                <div style={styles.questionCard}>
                  <div style={styles.questionHeader}>
                    <FiZap size={24} color="#f59e0b" />
                    <h3 style={styles.questionTitle}>Current Question</h3>
                    <div style={styles.timerDisplay}>
                      <FiClock size={16} />
                      <span>{timeLeft}s</span>
                    </div>
                  </div>
                  
                  <div style={styles.questionBody}>
                    <p style={styles.questionText}>{currentQuestion.text}</p>
                    
                    {!answerSubmitted && canAnswer && (
                      <div style={styles.answerArea}>
                        <textarea
                          style={styles.answerInput}
                          value={studentAnswer}
                          onChange={(e) => setStudentAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          rows={3}
                          disabled={!canAnswer || answerSubmitted}
                        />
                        <button 
                          style={styles.submitButton}
                          onClick={submitAnswer}
                          disabled={!canAnswer || answerSubmitted || questionLoading}
                        >
                          {questionLoading ? (
                            'Submitting...'
                          ) : (
                            <>
                              <FiSend size={18} />
                              Submit Answer
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {answerSubmitted && submitSuccess && (
                      <div style={styles.submittedMessage}>
                        <FiCheckCircle size={24} color="#10b981" />
                        <div>
                          <strong>Answer Submitted!</strong>
                          <p>Your answer: "{submittedAnswerText}"</p>
                          <p>Waiting for team or teacher to proceed...</p>
                        </div>
                      </div>
                    )}
                    
                    {submissionError && (
                      <div style={styles.errorMessage}>
                        <FiAlertCircle size={20} color="#ef4444" />
                        <span>{submissionError}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Round Results */}
              {roundEnded && roundResult && (
                <div style={roundResult.isCorrect ? styles.resultCardCorrect : styles.resultCardIncorrect}>
                  <div style={styles.resultIcon}>
                    {roundResult.isCorrect ? <FiCheckCircle size={48} color="#10b981" /> : <FiXCircle size={48} color="#ef4444" />}
                  </div>
                  <h3>{roundResult.isCorrect ? 'Correct!' : 'Incorrect'}</h3>
                  <p>Your answer: "{roundResult.yourAnswer}"</p>
                  <p>Correct answer: "{roundResult.correctAnswer}"</p>
                  {roundResult.isCorrect && (
                    <p style={styles.pointsEarned}>+{roundResult.pointsEarned} points!</p>
                  )}
                  <button 
                    style={styles.dismissResultButton}
                    onClick={() => {
                      setRoundEnded(false);
                      setRoundResult(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Ready Section */}
              {!isReady && !waitingForTeacher && !roundActive && (
                <button style={styles.readyButton} onClick={handleReady}>
                  <FiUserCheck size={20} />
                  I'm Ready! - Team {teamInfo.team}
                </button>
              )}
              
              {waitingForTeacher && !roundActive && (
                <div style={styles.waitingMessageModern}>
                  <span>⏳</span>
                  <p>You are ready! Waiting for teacher to start the game...</p>
                </div>
              )}

              {roundActive && (
                <div style={styles.roundActiveMessage}>
                  <FiZap size={20} color="#f59e0b" />
                  <p>Round in progress! Submit your answer before time runs out.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #f9fafb 100%)',
    padding: '32px 24px',
    margin: 0,
    boxSizing: 'border-box',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    gap: '20px',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #f9fafb 100%)',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '14px',
  },
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    flex: 1,
  },
  mainTitle: {
    fontSize: '32px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '8px 0 0 0',
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    transition: 'all 0.2s',
  },
  selectionCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '20px 24px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
  },
  selectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e2e8f0',
  },
  selectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
  },
  classCount: {
    fontSize: '12px',
    color: '#64748b',
    background: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: '20px',
    marginLeft: 'auto',
  },
  customDropdown: {
    position: 'relative',
    width: '100%',
  },
  dropdownButton: {
    width: '100%',
    padding: '14px 18px',
    background: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  dropdownButtonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
  },
  selectedClassIcon: {
    fontSize: '24px',
  },
  selectedClassInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  selectedClassName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
  },
  selectedClassCode: {
    fontSize: '12px',
    color: '#64748b',
  },
  placeholderText: {
    color: '#94a3b8',
    fontSize: '14px',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    right: 0,
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    zIndex: 1000,
    maxHeight: '320px',
    overflowY: 'auto',
  },
  dropdownItem: {
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.2s',
  },
  dropdownItemSelected: {
    background: '#eef2ff',
  },
  dropdownItemContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  dropdownItemIcon: {
    fontSize: '20px',
  },
  dropdownItemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  dropdownItemName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e293b',
  },
  dropdownItemTeacher: {
    fontSize: '11px',
    color: '#64748b',
  },
  joinedDate: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  emptyDropdown: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#64748b',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  emptySubtext: {
    fontSize: '12px',
    marginTop: '8px',
    color: '#94a3b8',
  },
  errorCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '16px',
    padding: '40px',
    background: '#fee2e2',
    borderRadius: '16px',
    marginBottom: '20px',
    border: '1px solid #fecaca',
    color: '#dc2626',
    textAlign: 'center',
  },
  errorCardSmall: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    background: '#fee2e2',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid #fecaca',
    color: '#dc2626',
  },
  dismissButton: {
    marginLeft: 'auto',
    padding: '4px 12px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  retryButton: {
    marginTop: '16px',
    padding: '10px 24px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  debugPanel: {
    background: '#1e293b',
    color: '#a5f3fc',
    padding: '8px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '12px',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },
  pointsDashboard: {
    marginBottom: '24px',
  },
  pointsCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    border: '1px solid #fde68a',
  },
  pointsCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  pointsIcon: {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    borderRadius: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  pointsLabel: {
    fontSize: '12px',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  pointsValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#d97706',
    lineHeight: 1,
  },
  pointsCardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 20px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  teamPointsIcon: {
    width: '40px',
    height: '40px',
    background: '#eef2ff',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamPointsInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  teamPointsLabel: {
    fontSize: '11px',
    color: '#64748b',
  },
  teamPointsValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#6366f1',
  },
  teamInfoCard: {
    background: 'white',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
  },
  teamHeaderSection: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '32px',
  },
  teamBadge: {
    display: 'inline-flex',
    padding: '4px',
    borderRadius: '60px',
    borderLeft: '4px solid',
    background: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  teamBadgeContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 28px',
  },
  teamBadgeIcon: {
    fontSize: '32px',
  },
  teamBadgeText: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  teamBadgeLabel: {
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  teamBadgeLetter: {
    fontSize: '28px',
    fontWeight: '700',
  },
  roleCardModern: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    background: '#f8fafc',
    borderRadius: '20px',
    marginBottom: '32px',
  },
  roleIconModern: {
    width: '64px',
    height: '64px',
    borderRadius: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
  },
  roleInfoModern: {
    flex: 1,
  },
  roleTitleModern: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '6px',
    color: '#1e293b',
  },
  roleDescriptionModern: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  membersSection: {
    marginBottom: '32px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  memberCount: {
    fontSize: '12px',
    color: '#64748b',
    background: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  membersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  memberCardModern: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '16px',
    transition: 'all 0.2s',
  },
  currentUserCardModern: {
    background: '#eef2ff',
    border: '2px solid #c7d2fe',
  },
  memberAvatarModern: {
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarPlaceholderModern: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '18px',
  },
  memberInfoModern: {
    flex: 1,
  },
  memberNameModern: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  youBadgeModern: {
    fontSize: '10px',
    fontWeight: '500',
    color: '#6366f1',
    background: '#c7d2fe',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  memberRoleModern: {
    fontSize: '12px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px',
  },
  memberPointsModern: {
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#f59e0b',
  },
  questionCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    padding: '24px',
    marginTop: '24px',
    color: 'white',
  },
  questionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
  },
  questionTitle: {
    flex: 1,
    margin: 0,
    fontSize: '20px',
  },
  timerDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '20px',
    fontSize: '16px',
    fontWeight: '600',
  },
  questionBody: {
    marginTop: '16px',
  },
  questionText: {
    fontSize: '18px',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  answerArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  answerInput: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  submittedMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '12px',
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    background: 'rgba(239,68,68,0.2)',
    borderRadius: '8px',
    color: '#fecaca',
  },
  resultCardCorrect: {
    textAlign: 'center',
    padding: '24px',
    background: '#d1fae5',
    borderRadius: '16px',
    marginTop: '20px',
    border: '2px solid #10b981',
  },
  resultCardIncorrect: {
    textAlign: 'center',
    padding: '24px',
    background: '#fee2e2',
    borderRadius: '16px',
    marginTop: '20px',
    border: '2px solid #ef4444',
  },
  resultIcon: {
    marginBottom: '12px',
  },
  pointsEarned: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: '12px',
  },
  dismissResultButton: {
    marginTop: '16px',
    padding: '8px 24px',
    background: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  readyButton: {
    width: '100%',
    padding: '14px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.2s',
    marginTop: '20px',
  },
  waitingMessageModern: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px',
    background: '#fef3c7',
    borderRadius: '12px',
    color: '#92400e',
    marginTop: '20px',
  },
  roundActiveMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '20px',
    padding: '12px 16px',
    background: '#ede9fe',
    borderRadius: '10px',
    color: '#6d28d9',
    fontSize: '14px',
    fontWeight: '500',
  },
  noTeamCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    border: '2px solid #fef3c7',
    backgroundColor: '#fffbeb',
  },
  noTeamIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
};

// Add global animations
const styleSheetGlobal = document.createElement("style");
styleSheetGlobal.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheetGlobal);

export default CollaborationStudent;