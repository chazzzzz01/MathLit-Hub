// src/menu/CollaborationStudent.jsx
import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FiBookOpen, FiChevronDown, FiUsers, FiUser, FiUserCheck, FiUserX, 
  FiUserPlus, FiStar, FiClock, FiSend, FiCheckCircle, 
  FiXCircle, FiAward, FiAlertCircle, FiZap, FiRefreshCw, FiX
} from 'react-icons/fi';
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
  
  // Ready states
  const [isReady, setIsReady] = useState(false);
  const [readySubmitted, setReadySubmitted] = useState(false);
  const [readyError, setReadyError] = useState(null);
  const [waitingForTeacher, setWaitingForTeacher] = useState(false);
  
  // Round states
  const [roundActive, setRoundActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canAnswer, setCanAnswer] = useState(false);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [submittedAnswerText, setSubmittedAnswerText] = useState('');
  const [submissionError, setSubmissionError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [roundEnded, setRoundEnded] = useState(false);
  
  // Game session tracking
  const [studentUUID, setStudentUUID] = useState(null);
  const [currentGameSessionId, setCurrentGameSessionId] = useState(null);
  
  const dropdownRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAuthUserId = () => {
    try {
      if (user?.id) return user.id;
      if (user?.dbId) return user.dbId;
      if (userData?.id) return userData.id;
      if (userData?.dbId) return userData.dbId;
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          return parsedUser?.id || parsedUser?.dbId || null;
        } catch (e) {}
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const startCountdown = (startTime, duration) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    const start = new Date(startTime).getTime();
    const endTime = start + (duration * 1000);
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        setCanAnswer(false);
      }
    };
    
    updateTimer();
    countdownIntervalRef.current = setInterval(updateTimer, 1000);
  };

  const fetchOrCreateStudentUUID = async () => {
    const authUserId = getAuthUserId();
    if (!authUserId) return null;
    
    try {
      let { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (existingStudent) {
        setStudentUUID(existingStudent.id);
        return existingStudent.id;
      }
      
      const userEmail = user?.email || userData?.email || '';
      const userName = user?.name || userData?.name || userEmail?.split('@')[0] || 'Student';
      
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
      
      if (insertError) return null;
      
      setStudentUUID(newStudent.id);
      return newStudent.id;
    } catch (error) {
      return null;
    }
  };

  const loadStudentPoints = async (classId) => {
    if (!classId || !studentUUID) return;
    try {
      const { data } = await supabase
        .from('student_points')
        .select('points')
        .eq('student_id', studentUUID)
        .eq('class_id', classId)
        .maybeSingle();
      setStudentPoints(data?.points || 0);
    } catch (error) {}
  };

  const loadTeamInfo = async (classId) => {
    if (!studentUUID || !classId) return;
    
    setLoadingTeam(true);
    try {
      const { data: assignment } = await supabase
        .from('team_assignments')
        .select('*')
        .eq('student_id', studentUUID)
        .eq('class_id', classId)
        .maybeSingle();
      
      if (assignment?.team) {
        setTeamInfo({
          team: assignment.team,
          role: assignment.role,
          assignedAt: assignment.updated_at
        });
        
        const { data: teamAssignments } = await supabase
          .from('team_assignments')
          .select('*, students(id, name, user_id)')
          .eq('class_id', classId)
          .eq('team', assignment.team);
        
        const memberDetails = await Promise.all(
          (teamAssignments || []).map(async (ta) => {
            let userName = ta.students?.name || 'Student';
            
            if (ta.students?.user_id) {
              const { data: userData } = await supabase
                .from('users')
                .select('name')
                .eq('id', ta.students.user_id)
                .maybeSingle();
              if (userData) userName = userData.name || userName;
            }
            
            const { data: pointData } = await supabase
              .from('student_points')
              .select('points')
              .eq('student_id', ta.student_id)
              .eq('class_id', classId)
              .maybeSingle();
            
            return {
              id: ta.student_id,
              name: userName,
              role: ta.role,
              isCurrentUser: ta.student_id === studentUUID,
              points: pointData?.points || 0
            };
          })
        );
        
        setTeamMembers(memberDetails);
        const total = memberDetails.reduce((sum, m) => sum + m.points, 0);
        setTeamTotalPoints(total);
      }
    } catch (error) {
    } finally {
      setLoadingTeam(false);
    }
  };

  const loadStudentClasses = async () => {
    const authUserId = getAuthUserId();
    if (!authUserId) {
      setError('Please log in again.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const uuid = await fetchOrCreateStudentUUID();
      if (!uuid) {
        setError('Unable to create student record.');
        setLoading(false);
        return;
      }
      
      const { data: enrollments } = await supabase
        .from('class_students')
        .select(`
          id,
          class_id,
          joined_at,
          classes (
            id,
            name,
            code,
            teacher_id,
            students_count
          )
        `)
        .eq('student_id', uuid);
      
      const enrichedClasses = await Promise.all(
        (enrollments || []).map(async (enrollment) => {
          let teacherName = 'Teacher';
          const classData = enrollment.classes;
          
          if (classData?.teacher_id) {
            const { data: teacher } = await supabase
              .from('teachers')
              .select('name, user_id')
              .eq('id', classData.teacher_id)
              .maybeSingle();
            
            if (teacher?.user_id) {
              const { data: user } = await supabase
                .from('users')
                .select('name')
                .eq('id', teacher.user_id)
                .maybeSingle();
              if (user?.name) teacherName = user.name;
            } else if (teacher?.name) {
              teacherName = teacher.name;
            }
          }
          
          return {
            id: enrollment.id,
            class_id: enrollment.class_id,
            joined_at: enrollment.joined_at,
            class: {
              ...classData,
              teacher_name: teacherName
            }
          };
        })
      );
      
      setClasses(enrichedClasses || []);
      
      if (enrichedClasses?.length > 0 && !selectedClass) {
        const firstEnrollment = enrichedClasses[0];
        setSelectedClass({
          id: firstEnrollment.class_id,
          name: firstEnrollment.class?.name,
          code: firstEnrollment.class?.code,
          teacher: firstEnrollment.class?.teacher_name
        });
        await loadTeamInfo(firstEnrollment.class_id);
        await loadStudentPoints(firstEnrollment.class_id);
      }
    } catch (error) {
      setError('Failed to load your classes. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const resetRoundState = () => {
    setRoundActive(false);
    setCurrentQuestion(null);
    setTimeLeft(0);
    setCanAnswer(false);
    setStudentAnswer('');
    setAnswerSubmitted(false);
    setSubmittedAnswerText('');
    setSubmissionError(null);
    setSubmitSuccess(false);
    setQuestionLoading(false);
    setRoundEnded(false);
    setCurrentGameSessionId(null);
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

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
      console.log('📤 SUBMITTING ANSWER...');
      
      const { data: gameSession, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('class_id', selectedClass.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (sessionError) throw sessionError;
      if (!gameSession) throw new Error('No active game session found');
      
      const { error: answerError } = await supabase
        .from('student_answers')
        .insert({
          session_id: gameSession.id,
          student_id: studentUUID,
          answer: studentAnswer.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (answerError) throw answerError;
      
      console.log('✅ ANSWER SAVED!');
      
      setAnswerSubmitted(true);
      setSubmitSuccess(true);
      setSubmittedAnswerText(studentAnswer);
      
      setTimeout(() => setSubmitSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error:', error);
      setSubmissionError(error.message || 'Failed to submit answer');
      setTimeout(() => setSubmissionError(null), 5000);
    } finally {
      setQuestionLoading(false);
    }
  };

  // SIMPLE POLLING FUNCTION - NO SUBSCRIPTIONS
  const checkForActiveGameSession = async () => {
    if (!waitingForTeacher || !selectedClass?.id || !studentUUID || !teamInfo) {
      return;
    }
    
    try {
      const { data: gameSession, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('class_id', selectedClass.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      // New game session started
      if (gameSession && currentGameSessionId !== gameSession.id) {
        console.log('🎮 Game session started!');
        
        setCurrentGameSessionId(gameSession.id);
        setCurrentQuestion(gameSession.current_question);
        setRoundActive(true);
        setCanAnswer(true);
        setAnswerSubmitted(false);
        setStudentAnswer('');
        
        if (gameSession.current_question?.timeLimit && gameSession.current_question?.started_at) {
          startCountdown(
            gameSession.current_question.started_at, 
            gameSession.current_question.timeLimit
          );
        }
      }
      
      // Check if current session ended (no active session found)
      if (currentGameSessionId && !gameSession) {
        console.log('🏁 Round ended');
        setRoundActive(false);
        setRoundEnded(true);
        setCanAnswer(false);
        setWaitingForTeacher(false);
        setReadySubmitted(false);
        setIsReady(false);
      }
      
    } catch (error) {
      console.error('Polling error:', error);
    }
  };

  const handleReady = async () => {
    if (!selectedClass?.id || !teamInfo?.team) {
      setReadyError('No class or team selected.');
      return;
    }
    
    if (readySubmitted || !studentUUID) {
      setReadyError('Already marked ready.');
      return;
    }
    
    setReadyError(null);
    
    try {
      const { error: insertError } = await supabase
        .from('student_ready_status')
        .upsert({
          student_id: studentUUID,
          class_id: selectedClass.id,
          team: teamInfo.team,
          is_ready: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,class_id'
        });
      
      if (insertError) throw insertError;
      
      setIsReady(true);
      setReadySubmitted(true);
      setWaitingForTeacher(true);
      
      console.log('✅ Ready for team', teamInfo.team);
      
    } catch (error) {
      console.error('Error:', error);
      setReadyError(error.message || 'Failed to set ready status.');
    }
  };

  const handleCancelReady = async () => {
    if (!selectedClass?.id || !teamInfo?.team || !studentUUID) {
      setReadyError('Cannot cancel at this time.');
      return;
    }
    
    setReadyError(null);
    
    try {
      // Update the ready status to false
      const { error: updateError } = await supabase
        .from('student_ready_status')
        .upsert({
          student_id: studentUUID,
          class_id: selectedClass.id,
          team: teamInfo.team,
          is_ready: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,class_id'
        });
      
      if (updateError) throw updateError;
      
      // Reset all ready-related states
      setIsReady(false);
      setReadySubmitted(false);
      setWaitingForTeacher(false);
      
      console.log('❌ Cancelled ready status for team', teamInfo.team);
      
    } catch (error) {
      console.error('Error canceling ready status:', error);
      setReadyError(error.message || 'Failed to cancel ready status.');
      setTimeout(() => setReadyError(null), 3000);
    }
  };

  // Start polling when waiting for teacher
  useEffect(() => {
    if (!selectedClass?.id || !studentUUID || !teamInfo) return;
    
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Only poll if waiting for teacher OR round is active
    if (waitingForTeacher || roundActive) {
      console.log('🔄 Starting polling (every 3 seconds)...');
      pollingIntervalRef.current = setInterval(() => {
        checkForActiveGameSession();
      }, 3000);
    }
    
    // Cleanup on unmount or dependency change
    return () => {
      if (pollingIntervalRef.current) {
        console.log('🛑 Stopping polling');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [selectedClass?.id, studentUUID, teamInfo?.team, waitingForTeacher, roundActive]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const getRoleIcon = (role) => {
    switch(role) {
      case 'analyzer': return <FiUserCheck size={14} />;
      case 'checker': return <FiUserX size={14} />;
      case 'solver': return <FiUserPlus size={14} />;
      default: return <FiUser size={14} />;
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
        return { label: 'Not Assigned', description: 'Wait for teacher to assign you to a team', color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const getTeamColor = (team) => team === 'A' ? '#3b82f6' : '#ef4444';
  const getTeamBgColor = (team) => team === 'A' ? '#eff6ff' : '#fef2f2';

  useEffect(() => {
    const init = async () => {
      const authUserId = getAuthUserId();
      if (!authUserId) {
        setLoading(false);
        return;
      }
      await loadStudentClasses();
    };
    init();
  }, []);

  const refreshClasses = async () => {
    setLoading(true);
    await loadStudentClasses();
  };

  const handleClassSelect = async (classItem) => {
    if (!classItem?.id) return;
    
    setSelectedClass(classItem);
    setShowDropdown(false);
    
    setIsReady(false);
    setReadySubmitted(false);
    setWaitingForTeacher(false);
    resetRoundState();
    
    await loadTeamInfo(classItem.id);
    await loadStudentPoints(classItem.id);
  };

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
        {/* Header Section - Matching teacher style */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.mainTitle}>Student Dashboard</h1>
            <p style={styles.subtitle}>Collaborate with your team and answer questions when the teacher starts</p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.classSelectorWrapper}>
              <div style={styles.customDropdown} ref={dropdownRef}>
                <button 
                  style={styles.dropdownButton}
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div style={styles.dropdownButtonContent}>
                    {selectedClass ? (
                      <>
                        <FiBookOpen size={18} color="#6366f1" />
                        <span style={styles.selectedClassName}>{selectedClass.name}</span>
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
                            teacher: enrollment.class?.teacher_name
                          })}
                        >
                          <div style={styles.dropdownItemContent}>
                            <FiBookOpen size={16} color="#6b7280" />
                            <span style={styles.dropdownItemName}>
                              {enrollment.class?.name || 'Unnamed Class'}
                            </span>
                          </div>
                          <span style={styles.studentCount}>
                            <FiUsers size={12} /> 👨‍🏫 {enrollment.class?.teacher_name || 'Unknown Teacher'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={styles.errorCard}>
            <FiAlertCircle size={48} color="#ef4444" />
            <h2>Error Loading Classes</h2>
            <p>{error}</p>
            <button onClick={refreshClasses} style={styles.retryButton}>Try Again</button>
          </div>
        )}

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
            <p>You have joined <strong>{selectedClass.name}</strong> but haven't been assigned to a team.</p>
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
                    <span style={styles.teamBadgeIcon}>{teamInfo.team === 'A' ? '⚡' : '🔥'}</span>
                    <div style={styles.teamBadgeText}>
                      <span style={styles.teamBadgeLabel}>Your Team</span>
                      <span style={{...styles.teamBadgeLetter, color: getTeamColor(teamInfo.team)}}>Team {teamInfo.team}</span>
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

              {/* Waiting for teacher message with cancel button */}
              {waitingForTeacher && !roundActive && !roundEnded && (
                <div style={styles.waitingMessageModern}>
                  <div style={styles.waitingContent}>
                    <div style={styles.waitingIconSection}>
                      <span style={styles.waitingSpinner}>⏳</span>
                      <div>
                        <div style={styles.waitingTitle}>Waiting for Teacher</div>
                        <p style={styles.waitingText}>You are ready! Waiting for teacher to start the game...</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleCancelReady}
                      style={styles.cancelReadyButton}
                      title="Cancel ready status"
                    >
                      <FiX size={18} /> Not Ready
                    </button>
                  </div>
                </div>
              )}

              {/* Question round - only shows when roundActive is true */}
              {roundActive && currentQuestion && (
                <div style={styles.questionCard}>
                  <div style={styles.questionHeader}>
                    <FiZap size={24} color="#f59e0b" />
                    <h3 style={styles.questionTitle}>Current Question</h3>
                    {timeLeft > 0 && (
                      <div style={styles.timerDisplay}>
                        <FiClock size={16} />
                        <span>{timeLeft}s</span>
                      </div>
                    )}
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
                          disabled={!canAnswer || answerSubmitted || questionLoading}
                        />
                        <button 
                          style={styles.submitButton}
                          onClick={submitAnswer}
                          disabled={!canAnswer || answerSubmitted || questionLoading}
                        >
                          {questionLoading ? 'Submitting...' : <><FiSend size={18} /> Submit Answer</>}
                        </button>
                      </div>
                    )}
                    
                    {answerSubmitted && (
                      <div style={styles.submittedMessage}>
                        <FiCheckCircle size={24} color="#10b981" />
                        <div>
                          <strong>Answer Submitted!</strong>
                          <p>Your answer: "{submittedAnswerText}"</p>
                          <p>Waiting for teacher to end the round...</p>
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

              {roundEnded && (
                <div style={styles.resultCardEnded}>
                  <div style={styles.resultIcon}>
                    <FiCheckCircle size={48} color="#10b981" />
                  </div>
                  <h3>Round Ended!</h3>
                  <p>Your answer: "{submittedAnswerText || 'No answer submitted'}"</p>
                  <button 
                    style={styles.dismissResultButton}
                    onClick={() => {
                      setRoundEnded(false);
                      setRoundActive(false);
                      setCurrentQuestion(null);
                      setAnswerSubmitted(false);
                      setSubmittedAnswerText('');
                      setStudentAnswer('');
                      setCurrentGameSessionId(null);
                      setWaitingForTeacher(false);
                      setReadySubmitted(false);
                      setIsReady(false);
                    }}
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Ready button - only shows when not waiting and no active round */}
              {!roundActive && !roundEnded && !waitingForTeacher && (
                <button style={styles.readyButton} onClick={handleReady}>
                  <FiUserCheck size={20} /> I'm Ready! - Team {teamInfo.team}
                </button>
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
    padding: '24px 16px',
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '8px 0 0 0',
  },
  classSelectorWrapper: {
    minWidth: '260px',
  },
  customDropdown: {
    position: 'relative',
    width: '100%',
  },
  dropdownButton: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  dropdownButtonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  selectedClassName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#0f172a',
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
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
    zIndex: 1000,
    maxHeight: '300px',
    overflowY: 'auto',
  },
  dropdownItem: {
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s',
    borderBottom: '1px solid #f1f5f9',
  },
  dropdownItemSelected: {
    backgroundColor: '#eef2ff',
  },
  dropdownItemContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dropdownItemName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#0f172a',
  },
  studentCount: {
    fontSize: '12px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  emptyDropdown: {
    padding: '30px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '13px',
  },
  emptyIcon: {
    fontSize: '40px',
    marginBottom: '10px',
  },
  errorCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '12px',
    padding: '32px 20px',
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
    padding: '10px 16px',
    background: '#fee2e2',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid #fecaca',
    color: '#dc2626',
    flexWrap: 'wrap',
  },
  dismissButton: {
    marginLeft: 'auto',
    padding: '4px 12px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
  },
  retryButton: {
    marginTop: '12px',
    padding: '8px 20px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  pointsDashboard: {
    marginBottom: '20px',
  },
  pointsCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
    borderRadius: '20px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #fde68a',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pointsCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
  },
  pointsIcon: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    borderRadius: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pointsInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  pointsLabel: {
    fontSize: '11px',
    color: '#92400e',
    textTransform: 'uppercase',
  },
  pointsValue: {
    fontSize: 'clamp(26px, 6vw, 36px)',
    fontWeight: '700',
    color: '#d97706',
    lineHeight: 1,
  },
  pointsCardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    background: 'white',
    borderRadius: '16px',
    flexWrap: 'wrap',
  },
  teamPointsIcon: {
    width: '36px',
    height: '36px',
    background: '#eef2ff',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  teamPointsInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  teamPointsLabel: {
    fontSize: '10px',
    color: '#64748b',
  },
  teamPointsValue: {
    fontSize: 'clamp(16px, 4vw, 20px)',
    fontWeight: '700',
    color: '#6366f1',
  },
  teamInfoCard: {
    background: 'white',
    borderRadius: '24px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
  },
  teamHeaderSection: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  teamBadge: {
    display: 'inline-flex',
    padding: '4px',
    borderRadius: '60px',
    borderLeft: '4px solid',
    background: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  teamBadgeContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 20px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  teamBadgeIcon: {
    fontSize: 'clamp(24px, 6vw, 32px)',
  },
  teamBadgeText: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  teamBadgeLabel: {
    fontSize: '10px',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  teamBadgeLetter: {
    fontSize: 'clamp(20px, 5vw, 28px)',
    fontWeight: '700',
  },
  roleCardModern: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '20px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  roleIconModern: {
    width: '56px',
    height: '56px',
    borderRadius: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0,
  },
  roleInfoModern: {
    flex: 1,
    minWidth: '160px',
  },
  roleTitleModern: {
    fontSize: 'clamp(15px, 4vw, 18px)',
    fontWeight: '600',
    marginBottom: '4px',
    color: '#1e293b',
  },
  roleDescriptionModern: {
    fontSize: 'clamp(11px, 3vw, 13px)',
    color: '#64748b',
    margin: 0,
  },
  membersSection: {
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    paddingBottom: '10px',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 'clamp(15px, 4vw, 18px)',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  memberCount: {
    fontSize: '11px',
    color: '#64748b',
    background: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  membersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '14px',
  },
  memberCardModern: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px',
    background: '#f8fafc',
    borderRadius: '16px',
    flexWrap: 'wrap',
  },
  currentUserCardModern: {
    background: '#eef2ff',
    border: '1px solid #c7d2fe',
  },
  memberAvatarModern: {
    width: '44px',
    height: '44px',
    borderRadius: '22px',
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
    fontSize: '16px',
  },
  memberInfoModern: {
    flex: 1,
    minWidth: '140px',
  },
  memberNameModern: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  youBadgeModern: {
    fontSize: '9px',
    fontWeight: '500',
    color: '#6366f1',
    background: '#c7d2fe',
    padding: '2px 6px',
    borderRadius: '20px',
  },
  memberRoleModern: {
    fontSize: '11px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginBottom: '4px',
    flexWrap: 'wrap',
  },
  memberPointsModern: {
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: '#f59e0b',
  },
  questionCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    padding: '20px',
    marginTop: '20px',
    color: 'white',
  },
  questionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
    flexWrap: 'wrap',
  },
  questionTitle: {
    flex: 1,
    margin: 0,
    fontSize: 'clamp(16px, 4vw, 20px)',
  },
  timerDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  questionBody: {
    marginTop: '12px',
  },
  questionText: {
    fontSize: 'clamp(15px, 4vw, 18px)',
    lineHeight: '1.5',
    marginBottom: '20px',
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
    fontSize: '13px',
    fontFamily: 'inherit',
    resize: 'vertical',
    color: '#333',
    backgroundColor: 'white',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  submittedMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '12px',
    flexWrap: 'wrap',
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    background: 'rgba(239,68,68,0.2)',
    borderRadius: '8px',
    color: '#fecaca',
    flexWrap: 'wrap',
  },
  resultCardEnded: {
    textAlign: 'center',
    padding: '20px',
    background: '#d1fae5',
    borderRadius: '16px',
    marginTop: '20px',
    border: '1px solid #10b981',
  },
  resultIcon: {
    marginBottom: '10px',
  },
  dismissResultButton: {
    marginTop: '12px',
    padding: '6px 20px',
    background: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  readyButton: {
    width: '100%',
    padding: '12px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: 'clamp(13px, 4vw, 15px)',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '20px',
    transition: 'all 0.2s ease',
    flexWrap: 'wrap',
  },
  waitingMessageModern: {
    background: '#fef3c7',
    borderRadius: '12px',
    marginTop: '20px',
    border: '1px solid #fde68a',
  },
  waitingContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  waitingIconSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  waitingSpinner: {
    fontSize: '24px',
    animation: 'spin 2s linear infinite',
  },
  waitingTitle: {
    fontWeight: '600',
    color: '#92400e',
    marginBottom: '2px',
  },
  waitingText: {
    fontSize: '13px',
    color: '#b45309',
    margin: 0,
  },
  cancelReadyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  noTeamCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '32px 20px',
    textAlign: 'center',
    border: '1px solid #fef3c7',
    backgroundColor: '#fffbeb',
  },
  noTeamIcon: {
    fontSize: 'clamp(48px, 12vw, 64px)',
    marginBottom: '12px',
  },
};

// Add hover effects and animations
const styleSheetGlobal = document.createElement("style");
styleSheetGlobal.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 640px) {
    .refresh-button-text {
      display: none;
    }
  }
  
  button, .dropdownButton, .submitButton, .readyButton, .dismissResultButton, .retryButton, .cancelReadyButton {
    transition: all 0.2s ease;
  }
  
  button:hover, .dropdownButton:hover, .submitButton:hover, .readyButton:hover, .dismissResultButton:hover, .retryButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .cancelReadyButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(239,68,68,0.3);
    background: #dc2626;
  }
  
  button:active, .dropdownButton:active, .submitButton:active, .readyButton:active, .cancelReadyButton:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    .memberCardModern {
      flex-direction: column;
      text-align: center;
    }
    
    .memberInfoModern {
      text-align: center;
    }
    
    .memberNameModern {
      justify-content: center;
    }
    
    .memberRoleModern {
      justify-content: center;
    }
    
    .memberPointsModern {
      justify-content: center;
    }
    
    .roleCardModern {
      text-align: center;
      justify-content: center;
    }
    
    .roleInfoModern {
      text-align: center;
    }
    
    .teamBadgeContent {
      flex-direction: column;
      text-align: center;
    }
    
    .teamBadgeText {
      text-align: center;
    }
    
    .pointsCard {
      flex-direction: column;
      text-align: center;
    }
    
    .pointsCardLeft {
      justify-content: center;
    }
    
    .pointsCardRight {
      justify-content: center;
    }
    
    .submittedMessage {
      flex-direction: column;
      text-align: center;
    }
    
    .errorCardSmall {
      flex-direction: column;
      text-align: center;
    }
    
    .dismissButton {
      margin-left: 0;
    }
    
    .header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .headerRight {
      width: 100%;
    }
    
    .classSelectorWrapper {
      width: 100%;
    }
    
    .waitingContent {
      flex-direction: column;
      text-align: center;
    }
    
    .waitingIconSection {
      flex-direction: column;
      text-align: center;
    }
    
    .cancelReadyButton {
      width: 100%;
      justify-content: center;
    }
  }
  
  @media (max-width: 480px) {
    .dropdownItem {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .studentCount {
      margin-left: 26px;
    }
  }
`;
document.head.appendChild(styleSheetGlobal);

export default CollaborationStudent;