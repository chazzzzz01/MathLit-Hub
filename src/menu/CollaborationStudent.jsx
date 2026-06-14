// src/menu/CollaborationStudent.jsx - FULLY RESPONSIVE (optimized for 308x748 and all screen sizes)
import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FiBookOpen, FiChevronDown, FiUsers, FiUser, FiUserCheck, FiUserX, 
  FiUserPlus, FiStar, FiClock, FiSend, FiCheckCircle, 
  FiXCircle, FiAward, FiAlertCircle, FiZap, FiRefreshCw, FiX,
  FiMessageSquare, FiSun, FiEdit3, FiShare2, FiEye, FiEyeOff
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
  
  const [isReady, setIsReady] = useState(false);
  const [readySubmitted, setReadySubmitted] = useState(false);
  const [readyError, setReadyError] = useState(null);
  const [waitingForTeacher, setWaitingForTeacher] = useState(false);
  
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
  
  const [isQuestionBlurred, setIsQuestionBlurred] = useState(true);
  const [countdownStarted, setCountdownStarted] = useState(false);
  
  const [showTeamAnswersModal, setShowTeamAnswersModal] = useState(false);
  const [teamAnswers, setTeamAnswers] = useState([]);
  const [loadingTeamAnswers, setLoadingTeamAnswers] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [showCollaborationHub, setShowCollaborationHub] = useState(false);
  const [teamNotes, setTeamNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [showBrainstorming, setShowBrainstorming] = useState(false);
  const [brainstormIdeas, setBrainstormIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState('');
  const [submittingIdea, setSubmittingIdea] = useState(false);
  const [teamDiscussion, setTeamDiscussion] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [submittingMessage, setSubmittingMessage] = useState(false);
  
  const [studentUUID, setStudentUUID] = useState(null);
  const [currentGameSessionId, setCurrentGameSessionId] = useState(null);
  
  const dropdownRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastProcessedSessionRef = useRef(null);

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
    } catch (error) { return null; }
  };

  const startCountdown = useCallback((startTime, duration) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    const start = new Date(startTime).getTime();
    const endTime = start + (duration * 1000);
    const updateTimer = () => {
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
      if (remaining > 0 && !countdownStarted) { setCountdownStarted(true); setIsQuestionBlurred(false); setCanAnswer(true); }
      if (remaining <= 0) { clearInterval(countdownIntervalRef.current); setCanAnswer(false); countdownIntervalRef.current = null; }
    };
    updateTimer();
    countdownIntervalRef.current = setInterval(updateTimer, 1000);
  }, [countdownStarted]);

  const fetchOrCreateStudentUUID = async () => {
    const authUserId = getAuthUserId();
    if (!authUserId) return null;
    try {
      let { data: existingStudent } = await supabase.from('students').select('id').eq('user_id', authUserId).maybeSingle();
      if (existingStudent) { setStudentUUID(existingStudent.id); return existingStudent.id; }
      const userEmail = user?.email || userData?.email || '';
      const userName = user?.name || userData?.name || userEmail?.split('@')[0] || 'Student';
      const { data: newStudent, error: insertError } = await supabase.from('students').insert({ user_id: authUserId, name: userName, email: userEmail }).select('id').single();
      if (insertError) return null;
      setStudentUUID(newStudent.id);
      return newStudent.id;
    } catch (error) { return null; }
  };

  const loadStudentPoints = async (classId) => {
    if (!classId || !studentUUID) return;
    try {
      const { data } = await supabase.from('student_points').select('points').eq('student_id', studentUUID).eq('class_id', classId).maybeSingle();
      setStudentPoints(data?.points || 0);
    } catch (error) {}
  };

  const loadTeamInfo = async (classId) => {
    if (!studentUUID || !classId) return;
    setLoadingTeam(true);
    try {
      const { data: assignment } = await supabase.from('team_assignments').select('*').eq('student_id', studentUUID).eq('class_id', classId).maybeSingle();
      if (assignment?.team) {
        setTeamInfo({ team: assignment.team, role: assignment.role, assignedAt: assignment.updated_at });
        const { data: teamAssignments } = await supabase.from('team_assignments').select('*, students(id, name, user_id)').eq('class_id', classId).eq('team', assignment.team);
        const memberDetails = await Promise.all((teamAssignments || []).map(async (ta) => {
          let userName = ta.students?.name || 'Student';
          if (ta.students?.user_id) {
            const { data: userData } = await supabase.from('users').select('name').eq('id', ta.students.user_id).maybeSingle();
            if (userData) userName = userData.name || userName;
          }
          const { data: pointData } = await supabase.from('student_points').select('points').eq('student_id', ta.student_id).eq('class_id', classId).maybeSingle();
          return { id: ta.student_id, name: userName, role: ta.role, isCurrentUser: ta.student_id === studentUUID, points: pointData?.points || 0 };
        }));
        setTeamMembers(memberDetails);
        const total = memberDetails.reduce((sum, m) => sum + m.points, 0);
        setTeamTotalPoints(total);
      }
    } catch (error) { console.error('Error loading team info:', error); }
    finally { setLoadingTeam(false); }
  };

  const loadStudentClasses = async () => {
    const authUserId = getAuthUserId();
    if (!authUserId) { setError('Please log in again.'); setLoading(false); return; }
    try {
      setLoading(true);
      const uuid = await fetchOrCreateStudentUUID();
      if (!uuid) { setError('Unable to create student record.'); setLoading(false); return; }
      const { data: enrollments } = await supabase.from('class_students').select(`id,class_id,joined_at,classes(id,name,code,teacher_id,students_count)`).eq('student_id', uuid);
      const enrichedClasses = await Promise.all((enrollments || []).map(async (enrollment) => {
        let teacherName = 'Teacher';
        if (enrollment.classes?.teacher_id) {
          const { data: teacher } = await supabase.from('teachers').select('name, user_id').eq('id', enrollment.classes.teacher_id).maybeSingle();
          if (teacher?.user_id) {
            const { data: user } = await supabase.from('users').select('name').eq('id', teacher.user_id).maybeSingle();
            if (user?.name) teacherName = user.name;
          } else if (teacher?.name) teacherName = teacher.name;
        }
        return { id: enrollment.id, class_id: enrollment.class_id, joined_at: enrollment.joined_at, class: { ...enrollment.classes, teacher_name: teacherName } };
      }));
      setClasses(enrichedClasses || []);
      if (enrichedClasses?.length > 0 && !selectedClass) {
        const firstEnrollment = enrichedClasses[0];
        setSelectedClass({ id: firstEnrollment.class_id, name: firstEnrollment.class?.name, code: firstEnrollment.class?.code, teacher: firstEnrollment.class?.teacher_name });
        await loadTeamInfo(firstEnrollment.class_id);
        await loadStudentPoints(firstEnrollment.class_id);
      }
    } catch (error) { setError('Failed to load your classes.'); }
    finally { setLoading(false); }
  };

  const resetRoundState = useCallback(() => {
    setRoundActive(false); setCurrentQuestion(null); setTimeLeft(0); setCanAnswer(false);
    setStudentAnswer(''); setAnswerSubmitted(false); setSubmittedAnswerText(''); setSubmissionError(null);
    setSubmitSuccess(false); setQuestionLoading(false); setRoundEnded(false); setCurrentGameSessionId(null);
    setIsQuestionBlurred(true); setCountdownStarted(false); setShowTeamAnswersModal(false); setShowCollaborationHub(false);
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
  }, []);

  const fetchTeamAnswers = useCallback(async () => {
    if (!currentGameSessionId || !teamInfo?.team || !selectedClass?.id) return;
    setLoadingTeamAnswers(true);
    try {
      const { data: teamAssignments } = await supabase.from('team_assignments').select('student_id').eq('class_id', selectedClass.id).eq('team', teamInfo.team);
      if (!teamAssignments || teamAssignments.length === 0) { setLoadingTeamAnswers(false); return; }
      const teamStudentIds = teamAssignments.map(ta => ta.student_id);
      const { data: answers } = await supabase.from('student_answers').select(`id,student_id,answer,created_at,students(id,name,user_id)`).eq('session_id', currentGameSessionId).in('student_id', teamStudentIds);
      const teamAnswersWithPoints = await Promise.all((answers || []).map(async (answer) => {
        let userName = answer.students?.name || 'Student';
        if (answer.students?.user_id) {
          const { data: userData } = await supabase.from('users').select('name').eq('id', answer.students.user_id).maybeSingle();
          if (userData?.name) userName = userData.name;
        }
        const { data: pointData } = await supabase.from('student_points').select('points').eq('student_id', answer.student_id).eq('class_id', selectedClass.id).maybeSingle();
        const { data: roleData } = await supabase.from('team_assignments').select('role').eq('student_id', answer.student_id).eq('class_id', selectedClass.id).maybeSingle();
        return { id: answer.id, studentId: answer.student_id, studentName: userName, answer: answer.answer, points: pointData?.points || 0, role: roleData?.role || 'member', createdAt: answer.created_at, isCurrentUser: answer.student_id === studentUUID };
      }));
      teamAnswersWithPoints.sort((a, b) => b.points - a.points);
      setTeamAnswers(teamAnswersWithPoints);
    } catch (error) { console.error('Error fetching team answers:', error); }
    finally { setLoadingTeamAnswers(false); }
  }, [currentGameSessionId, teamInfo, selectedClass, studentUUID]);

  const submitAnswer = async () => {
    if (!canAnswer || answerSubmitted) { setSubmissionError('Cannot submit at this time'); return; }
    if (!studentAnswer.trim()) { setSubmissionError('Please enter your answer'); return; }
    setQuestionLoading(true); setSubmissionError(null);
    try {
      const { data: gameSession } = await supabase.from('game_sessions').select('*').eq('class_id', selectedClass.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!gameSession) throw new Error('No active game session found');
      const { error: answerError } = await supabase.from('student_answers').insert({ session_id: gameSession.id, student_id: studentUUID, answer: studentAnswer.trim() });
      if (answerError) throw answerError;
      setAnswerSubmitted(true); setSubmitSuccess(true); setSubmittedAnswerText(studentAnswer); setRoundActive(false);
      await fetchTeamAnswers();
      setShowTeamAnswersModal(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) { setSubmissionError(error.message || 'Failed to submit answer'); setTimeout(() => setSubmissionError(null), 5000); }
    finally { setQuestionLoading(false); }
  };

  const refreshTeamAnswers = async () => { setRefreshKey(prev => prev + 1); await fetchTeamAnswers(); };

  const loadBrainstormIdeas = useCallback(async () => {
    if (!teamInfo?.team || !selectedClass?.id || !currentGameSessionId) return;
    try {
      const { data } = await supabase.from('brainstorm_ideas').select('*, students(name)').eq('class_id', selectedClass.id).eq('team', teamInfo.team).eq('session_id', currentGameSessionId).order('votes', { ascending: false });
      setBrainstormIdeas(data || []);
    } catch (error) { console.error('Error loading brainstorm ideas:', error); }
  }, [teamInfo, selectedClass, currentGameSessionId]);

  const addBrainstormIdea = async () => {
    if (!newIdea.trim() || !teamInfo?.team || !selectedClass?.id || !studentUUID) return;
    setSubmittingIdea(true);
    try {
      const { error } = await supabase.from('brainstorm_ideas').insert({ class_id: selectedClass.id, team: teamInfo.team, session_id: currentGameSessionId, student_id: studentUUID, idea: newIdea.trim(), votes: 0 });
      if (error) throw error;
      setNewIdea(''); await loadBrainstormIdeas();
    } catch (error) { console.error('Error adding idea:', error); }
    finally { setSubmittingIdea(false); }
  };

  const voteIdea = async (ideaId, currentVotes) => {
    if (!studentUUID) return;
    try {
      const { data: existingVote } = await supabase.from('idea_votes').select('id').eq('idea_id', ideaId).eq('student_id', studentUUID).maybeSingle();
      if (existingVote) {
        await supabase.from('idea_votes').delete().eq('id', existingVote.id);
        await supabase.from('brainstorm_ideas').update({ votes: currentVotes - 1 }).eq('id', ideaId);
      } else {
        await supabase.from('idea_votes').insert({ idea_id: ideaId, student_id: studentUUID });
        await supabase.from('brainstorm_ideas').update({ votes: currentVotes + 1 }).eq('id', ideaId);
      }
      await loadBrainstormIdeas();
    } catch (error) { console.error('Error voting:', error); }
  };

  const loadTeamDiscussion = useCallback(async () => {
    if (!teamInfo?.team || !selectedClass?.id || !currentGameSessionId) return;
    try {
      const { data } = await supabase.from('team_discussion').select('*, students(name)').eq('class_id', selectedClass.id).eq('team', teamInfo.team).eq('session_id', currentGameSessionId).order('created_at', { ascending: true });
      setTeamDiscussion(data || []);
    } catch (error) { console.error('Error loading discussion:', error); }
  }, [teamInfo, selectedClass, currentGameSessionId]);

  const sendDiscussionMessage = async () => {
    if (!newMessage.trim() || !teamInfo?.team || !selectedClass?.id || !studentUUID) return;
    setSubmittingMessage(true);
    try {
      const { error } = await supabase.from('team_discussion').insert({ class_id: selectedClass.id, team: teamInfo.team, session_id: currentGameSessionId, student_id: studentUUID, message: newMessage.trim() });
      if (error) throw error;
      setNewMessage(''); await loadTeamDiscussion();
    } catch (error) { console.error('Error sending message:', error); }
    finally { setSubmittingMessage(false); }
  };

  const checkForActiveGameSession = useCallback(async () => {
    if (isProcessingRef.current) return;
    if (!selectedClass?.id || !studentUUID || !teamInfo) return;
    isProcessingRef.current = true;
    try {
      const { data: gameSession } = await supabase.from('game_sessions').select('*').eq('class_id', selectedClass.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
      const isNewSession = gameSession && lastProcessedSessionRef.current !== gameSession.id;
      if (gameSession && isNewSession) {
        lastProcessedSessionRef.current = gameSession.id;
        setCurrentGameSessionId(gameSession.id);
        setCurrentQuestion(gameSession.current_question);
        setRoundActive(true); setWaitingForTeacher(false); setCanAnswer(false); setAnswerSubmitted(false);
        setStudentAnswer(''); setIsQuestionBlurred(true); setCountdownStarted(false);
        setTimeout(() => { loadBrainstormIdeas(); loadTeamDiscussion(); }, 500);
        if (gameSession.current_question?.timeLimit && gameSession.current_question?.started_at) {
          startCountdown(gameSession.current_question.started_at, gameSession.current_question.timeLimit);
        }
      }
      if (currentGameSessionId && !gameSession) {
        setRoundActive(false); setRoundEnded(true); setCanAnswer(false); setIsQuestionBlurred(true);
        setCountdownStarted(false); setWaitingForTeacher(true); setReadySubmitted(true); setIsReady(true);
        setCurrentGameSessionId(null); lastProcessedSessionRef.current = null;
        if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
      }
    } catch (error) { console.error('Polling error:', error); }
    finally { isProcessingRef.current = false; }
  }, [selectedClass?.id, studentUUID, teamInfo, currentGameSessionId, startCountdown, loadBrainstormIdeas, loadTeamDiscussion]);

  const handleReady = async () => {
    if (!selectedClass?.id || !teamInfo?.team) { setReadyError('No class or team selected.'); return; }
    if (readySubmitted || !studentUUID) { setReadyError('Already marked ready.'); return; }
    setReadyError(null);
    try {
      const { error } = await supabase.from('student_ready_status').upsert({ student_id: studentUUID, class_id: selectedClass.id, team: teamInfo.team, is_ready: true }, { onConflict: 'student_id,class_id' });
      if (error) throw error;
      setIsReady(true); setReadySubmitted(true); setWaitingForTeacher(true);
    } catch (error) { setReadyError(error.message || 'Failed to set ready status.'); }
  };

  const handleCancelReady = async () => {
    if (!selectedClass?.id || !teamInfo?.team || !studentUUID) { setReadyError('Cannot cancel at this time.'); return; }
    setReadyError(null);
    try {
      const { error } = await supabase.from('student_ready_status').upsert({ student_id: studentUUID, class_id: selectedClass.id, team: teamInfo.team, is_ready: false }, { onConflict: 'student_id,class_id' });
      if (error) throw error;
      setIsReady(false); setReadySubmitted(false); setWaitingForTeacher(false);
    } catch (error) { setReadyError(error.message || 'Failed to cancel ready status.'); setTimeout(() => setReadyError(null), 3000); }
  };

  const resetAfterAnswer = useCallback(() => {
    setShowTeamAnswersModal(false); setShowCollaborationHub(false); setAnswerSubmitted(false);
    setRoundActive(false); setCurrentQuestion(null); setSubmittedAnswerText(''); setStudentAnswer('');
    setCurrentGameSessionId(null); setIsQuestionBlurred(true); setCountdownStarted(false);
    setWaitingForTeacher(true); setReadySubmitted(true); setIsReady(true); lastProcessedSessionRef.current = null;
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
  }, []);

  useEffect(() => {
    if (!selectedClass?.id || !studentUUID || !teamInfo) return;
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if ((waitingForTeacher || roundActive) && !answerSubmitted) {
      pollingIntervalRef.current = setInterval(() => { checkForActiveGameSession(); }, 3000);
      checkForActiveGameSession();
    }
    return () => { if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); };
  }, [selectedClass?.id, studentUUID, teamInfo?.team, waitingForTeacher, roundActive, answerSubmitted, checkForActiveGameSession]);

  useEffect(() => {
    if (!roundActive || !currentGameSessionId || !teamInfo?.team) return;
    const collaborationInterval = setInterval(() => { loadTeamDiscussion(); if (showBrainstorming) loadBrainstormIdeas(); }, 5000);
    return () => clearInterval(collaborationInterval);
  }, [roundActive, currentGameSessionId, teamInfo?.team, showBrainstorming, loadTeamDiscussion, loadBrainstormIdeas]);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      isProcessingRef.current = false;
    };
  }, []);

  useEffect(() => {
    const init = async () => { const authUserId = getAuthUserId(); if (authUserId) await loadStudentClasses(); else setLoading(false); };
    init();
  }, []);

  const refreshClasses = async () => { setLoading(true); await loadStudentClasses(); };

  const handleClassSelect = async (classItem) => {
    if (!classItem?.id) return;
    setSelectedClass(classItem); setShowDropdown(false);
    setIsReady(false); setReadySubmitted(false); setWaitingForTeacher(false);
    resetRoundState(); lastProcessedSessionRef.current = null;
    await loadTeamInfo(classItem.id); await loadStudentPoints(classItem.id);
  };

  const getRoleIcon = (role) => {
    if (role === 'analyzer') return <FiUserCheck size={12} />;
    if (role === 'checker') return <FiUserX size={12} />;
    if (role === 'solver') return <FiUserPlus size={12} />;
    return <FiUser size={12} />;
  };

  const getRoleInfo = (role) => {
    if (role === 'analyzer') return { label: 'Analyzer', description: 'You analyze problems and break them down', color: '#8b5cf6', bgColor: '#ede9fe' };
    if (role === 'checker') return { label: 'Checker', description: 'You verify answers and check for errors', color: '#f59e0b', bgColor: '#fed7aa' };
    if (role === 'solver') return { label: 'Solver', description: 'You solve problems and find solutions', color: '#10b981', bgColor: '#d1fae5' };
    return { label: 'Not Assigned', description: 'Wait for teacher to assign you to a team', color: '#6b7280', bgColor: '#f3f4f6' };
  };

  const getTeamColor = (team) => team === 'A' ? '#3b82f6' : '#ef4444';
  const getTeamBgColor = (team) => team === 'A' ? '#eff6ff' : '#fef2f2';
  
  const getAwardRank = (index) => {
    if (index === 0) return { medal: '🥇', label: '1st Place', color: '#fbbf24' };
    if (index === 1) return { medal: '🥈', label: '2nd Place', color: '#94a3b8' };
    if (index === 2) return { medal: '🥉', label: '3rd Place', color: '#cd7f32' };
    return { medal: '📋', label: `${index + 1}th Place`, color: '#64748b' };
  };

  if (loading) {
    return (<div style={styles.loadingContainer}><div style={styles.loadingSpinner}></div><p>Loading your dashboard...</p></div>);
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerLeft}><h1 style={styles.mainTitle}>Student Dashboard</h1><p style={styles.subtitle}>Collaborate with your team</p></div>
          <div style={styles.headerRight}><div style={styles.classSelectorWrapper}><div style={styles.customDropdown} ref={dropdownRef}><button style={styles.dropdownButton} onClick={() => setShowDropdown(!showDropdown)}><div style={styles.dropdownButtonContent}>{selectedClass ? (<><FiBookOpen size={16} /><span style={styles.selectedClassName}>{selectedClass.name}</span></>) : (<span style={styles.placeholderText}>{classes.length > 0 ? 'Select a class' : 'No classes'}</span>)}</div><FiChevronDown size={18} style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} /></button>{showDropdown && (<div style={styles.dropdownMenu}>{classes.length === 0 ? (<div style={styles.emptyDropdown}><div>📚</div><p>No classes joined</p></div>) : (classes.map((enrollment) => (<div key={enrollment.class_id} style={{...styles.dropdownItem, ...(selectedClass?.id === enrollment.class_id ? styles.dropdownItemSelected : {})}} onClick={() => handleClassSelect({ id: enrollment.class_id, name: enrollment.class?.name, code: enrollment.class?.code, teacher: enrollment.class?.teacher_name })}><div style={styles.dropdownItemContent}><FiBookOpen size={14} /><span style={styles.dropdownItemName}>{enrollment.class?.name || 'Unnamed Class'}</span></div><span style={styles.studentCount}><FiUsers size={10} /> {enrollment.class?.teacher_name || 'Teacher'}</span></div>)))}</div>)}</div></div></div>
        </div>

        {error && (<div style={styles.errorCard}><FiAlertCircle size={40} color="#ef4444" /><h2>Error</h2><p>{error}</p><button onClick={refreshClasses} style={styles.retryButton}>Try Again</button></div>)}
        {readyError && (<div style={styles.errorCardSmall}><FiAlertCircle size={16} color="#ef4444" /><p>{readyError}</p><button onClick={() => setReadyError(null)} style={styles.dismissButton}>Dismiss</button></div>)}

        {selectedClass && !teamInfo && !loadingTeam && (<div style={styles.noTeamCard}><div style={styles.noTeamIcon}>👥</div><h3>No Team Assigned</h3><p>Joined <strong>{selectedClass.name}</strong> but not assigned to a team yet.</p></div>)}

        {selectedClass && teamInfo && (<>
          <div style={styles.pointsDashboard}><div style={styles.pointsCard}><div style={styles.pointsCardLeft}><div style={styles.pointsIcon}><FiAward size={24} color="#f59e0b" /></div><div><span style={styles.pointsLabel}>Your Points</span><span style={styles.pointsValue}>{studentPoints}</span></div></div><div style={styles.pointsCardRight}><div><FiUsers size={16} color="#6366f1" /></div><div><span style={styles.teamPointsLabel}>Team {teamInfo.team}</span><span style={styles.teamPointsValue}>{teamTotalPoints}</span></div></div></div></div>

          <div style={styles.teamInfoCard}>
            <div style={styles.teamHeaderSection}><div style={{...styles.teamBadge, background: `linear-gradient(135deg, ${getTeamBgColor(teamInfo.team)} 0%, white 100%)`, borderLeftColor: getTeamColor(teamInfo.team)}}><div style={styles.teamBadgeContent}><span style={styles.teamBadgeIcon}>{teamInfo.team === 'A' ? '⚡' : '🔥'}</span><div><span style={styles.teamBadgeLabel}>Your Team</span><span style={{...styles.teamBadgeLetter, color: getTeamColor(teamInfo.team)}}>Team {teamInfo.team}</span></div></div></div></div>

            <div style={styles.roleCardModern}><div style={{...styles.roleIconModern, backgroundColor: getRoleInfo(teamInfo.role).bgColor, color: getRoleInfo(teamInfo.role).color}}>{getRoleIcon(teamInfo.role)}</div><div><h3 style={styles.roleTitleModern}>Role: {getRoleInfo(teamInfo.role).label}</h3><p style={styles.roleDescriptionModern}>{getRoleInfo(teamInfo.role).description}</p></div></div>

            <div style={styles.membersSection}><div style={styles.sectionHeader}><FiUsers size={18} /><h3 style={styles.sectionTitle}>Team {teamInfo.team} Members</h3><span style={styles.memberCount}>{teamMembers.length}</span></div><div style={styles.membersGrid}>{teamMembers.map((member) => (<div key={member.id} style={{...styles.memberCardModern, ...(member.isCurrentUser ? styles.currentUserCardModern : {})}}><div style={styles.memberAvatarModern}><div style={styles.avatarPlaceholderModern}>{member.name?.charAt(0) || 'S'}</div></div><div><div style={styles.memberNameModern}>{member.name}{member.isCurrentUser && <span style={styles.youBadgeModern}>(You)</span>}</div><div style={styles.memberRoleModern}>{getRoleIcon(member.role)}{getRoleInfo(member.role).label}</div><div style={styles.memberPointsModern}><FiStar size={10} color="#f59e0b" />{member.points} pts</div></div></div>))}</div></div>

            

            {waitingForTeacher && !roundActive && !roundEnded && !answerSubmitted && (<div style={styles.waitingMessageModern}><div style={styles.waitingContent}><div style={styles.waitingIconSection}><span style={styles.waitingSpinner}>⏳</span><div><div style={styles.waitingTitle}>Waiting for Teacher</div><p style={styles.waitingText}>You are ready! Waiting for game to start...</p></div></div><button onClick={handleCancelReady} style={styles.cancelReadyButton}><FiX size={14} /> Not Ready</button></div></div>)}

            {roundActive && currentQuestion && !answerSubmitted && (<div style={styles.questionCard}><div style={styles.questionHeader}><FiZap size={20} color="#f59e0b" /><h3 style={styles.questionTitle}>Current Question</h3>{timeLeft > 0 && (<div style={styles.timerDisplay}><FiClock size={12} /><span>{timeLeft}s</span></div>)}</div><div style={styles.questionBody}>{isQuestionBlurred && !countdownStarted && (<div style={styles.blurredQuestionContainer}><div style={styles.blurredQuestionContent}><div style={styles.blurIcon}>🔒</div><p style={styles.blurredText}>Question locked</p><p style={styles.blurredSubtext}>Wait for timer...</p></div><div style={styles.blurredOverlay}><p style={styles.blurredQuestionText}>{currentQuestion.text}</p></div></div>)}{!isQuestionBlurred && countdownStarted && (<><p style={styles.questionText}>{currentQuestion.text}</p>{!answerSubmitted && canAnswer && (<div style={styles.answerArea}><textarea style={styles.answerInput} value={studentAnswer} onChange={(e) => setStudentAnswer(e.target.value)} placeholder="Type your answer..." rows={2} disabled={!canAnswer || answerSubmitted || questionLoading} /><button style={styles.submitButton} onClick={submitAnswer} disabled={!canAnswer || answerSubmitted || questionLoading}>{questionLoading ? 'Submitting...' : <><FiSend size={14} /> Submit</>}</button></div>)}{submissionError && (<div style={styles.errorMessage}><FiAlertCircle size={14} color="#ef4444" /><span>{submissionError}</span></div>)}</>)}</div></div>)}

            {answerSubmitted && !showTeamAnswersModal && (<div style={styles.submittedSuccessCard}><FiCheckCircle size={40} color="#10b981" /><h3>Answer Submitted!</h3><p>"{submittedAnswerText}"</p><div style={styles.loadingSpinnerSmall}></div></div>)}

            {roundEnded && !answerSubmitted && (<div style={styles.resultCardEnded}><FiCheckCircle size={40} color="#10b981" /><h3>Round Ended!</h3><p>Your answer: "{submittedAnswerText || 'None'}"</p><button style={styles.dismissResultButton} onClick={() => { setRoundEnded(false); setRoundActive(false); setCurrentQuestion(null); setAnswerSubmitted(false); setSubmittedAnswerText(''); setStudentAnswer(''); setCurrentGameSessionId(null); setWaitingForTeacher(true); setReadySubmitted(true); setIsReady(true); setIsQuestionBlurred(true); setCountdownStarted(false); setShowTeamAnswersModal(false); }}>Close</button></div>)}

            {!waitingForTeacher && !roundActive && !roundEnded && !answerSubmitted && (<button style={styles.readyButton} onClick={handleReady}><FiUserCheck size={16} /> I'm Ready! - Team {teamInfo.team}</button>)}
          </div>
        </>)}
      </div>

      {showTeamAnswersModal && (<div style={styles.modalOverlay}><div style={styles.modalContainer}><div style={styles.modalHeader}><div><FiAward size={20} color="#f59e0b" /><h2 style={styles.modalTitle}>Team {teamInfo?.team} Results</h2></div><button style={styles.modalCloseButton} onClick={resetAfterAnswer}><FiX size={18} /></button></div><div style={styles.modalBody}>{loadingTeamAnswers ? (<div style={styles.modalLoading}><div style={styles.loadingSpinnerSmall}></div><p>Loading...</p></div>) : teamAnswers.length === 0 ? (<div style={styles.noAnswersContainer}><p>No answers yet.</p><button style={styles.refreshButton} onClick={refreshTeamAnswers}><FiRefreshCw size={12} /> Refresh</button></div>) : (<><div style={styles.answersSummary}><FiUsers size={12} /> {teamAnswers.length}/{teamMembers.length} answered</div><div style={styles.awardsList}>{teamAnswers.map((member, index) => { const award = getAwardRank(index); return (<div key={member.id} style={{...styles.awardCard, borderLeftColor: award.color, ...(member.isCurrentUser ? styles.currentUserAwardCard : {})}}><div><span style={styles.awardMedal}>{award.medal}</span><span style={styles.awardPlace}>{award.label}</span></div><div style={styles.awardAvatar}><div style={styles.awardAvatarInner}>{member.studentName?.charAt(0) || 'S'}</div></div><div><div style={styles.awardName}>{member.studentName}{member.isCurrentUser && <span style={styles.youBadge}>(You)</span>}</div><div style={styles.awardRole}>{getRoleIcon(member.role)}{getRoleInfo(member.role).label}</div><div style={styles.awardAnswer}><strong>Answer:</strong> "{member.answer}"</div><div style={styles.awardPoints}><FiStar size={12} color="#f59e0b" />{member.points} pts</div></div></div>); })}</div></>)}</div><div style={styles.modalFooter}><button style={styles.closeModalButton} onClick={resetAfterAnswer}>Close</button></div></div></div>)}

      {showCollaborationHub && (<div style={styles.modalOverlay}><div style={styles.collaborationModalContainer}><div style={styles.modalHeader}><div><FiMessageSquare size={20} color="#8b5cf6" /><h2 style={styles.modalTitle}>Team {teamInfo?.team} Collaboration</h2></div><button style={styles.modalCloseButton} onClick={() => setShowCollaborationHub(false)}><FiX size={18} /></button></div><div style={styles.collaborationTabs}><button style={!showBrainstorming ? styles.activeTab : styles.tab} onClick={() => setShowBrainstorming(false)}><FiMessageSquare size={14} /> Discussion</button><button style={showBrainstorming ? styles.activeTab : styles.tab} onClick={() => { setShowBrainstorming(true); loadBrainstormIdeas(); }}><FiSun size={14} /> Brainstorm</button></div><div style={styles.modalBody}>{!showBrainstorming ? (<div><div style={styles.discussionMessages}>{teamDiscussion.length === 0 ? (<div style={styles.emptyDiscussion}><FiMessageSquare size={36} color="#cbd5e1" /><p>No messages yet</p></div>) : (teamDiscussion.map((msg) => (<div key={msg.id} style={styles.discussionMessage}><div style={styles.messageAvatar}>{msg.students?.name?.charAt(0) || 'S'}</div><div><div style={styles.messageHeader}><span style={styles.messageName}>{msg.students?.name || 'Student'}</span><span style={styles.messageTime}>{new Date(msg.created_at).toLocaleTimeString()}</span></div><p style={styles.messageText}>{msg.message}</p></div></div>)))}</div><div style={styles.messageInputArea}><textarea style={styles.messageInput} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type message..." rows={2} /><button style={styles.sendMessageButton} onClick={sendDiscussionMessage} disabled={submittingMessage || !newMessage.trim()}><FiSend size={12} /> Send</button></div></div>) : (<div><div style={styles.brainstormHeader}><FiSun size={20} color="#f59e0b" /><h3 style={styles.brainstormHeaderTitle}>Brainstorm Ideas</h3><p>Share and vote on ideas!</p></div><div style={styles.brainstormInputArea}><textarea style={styles.brainstormInput} value={newIdea} onChange={(e) => setNewIdea(e.target.value)} placeholder="Share your idea..." rows={2} /><button style={styles.addIdeaButton} onClick={addBrainstormIdea} disabled={submittingIdea || !newIdea.trim()}><FiSun size={12} /> Add Idea</button></div><div style={styles.ideasList}>{brainstormIdeas.length === 0 ? (<div style={styles.emptyIdeas}><FiSun size={36} color="#cbd5e1" /><p>No ideas yet. Be first!</p></div>) : (brainstormIdeas.map((idea) => (<div key={idea.id} style={styles.ideaCard}><div style={styles.ideaVotes}><button style={styles.voteButton} onClick={() => voteIdea(idea.id, idea.votes)}>👍</button><span style={styles.voteCount}>{idea.votes || 0}</span></div><div><p style={styles.ideaText}>{idea.idea}</p><div style={styles.ideaMeta}><span style={styles.ideaAuthor}>by {idea.students?.name || 'Student'}</span><span style={styles.ideaTime}>{new Date(idea.created_at).toLocaleTimeString()}</span></div></div></div>)))}</div></div>)}</div><div style={styles.modalFooter}><button style={styles.closeModalButton} onClick={() => setShowCollaborationHub(false)}>Close</button></div></div></div>)}
    </div>
  );
}

const styles = {
  container: { width: '100%', minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #f9fafb 100%)', padding: '16px', boxSizing: 'border-box', '@media (min-width: 769px)': { padding: '24px' } },
  content: { maxWidth: '1200px', margin: '0 auto' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', padding: '16px' },
  loadingSpinner: { width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingSpinnerSmall: { width: '24px', height: '24px', border: '3px solid #e2e8f0', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', marginTop: '8px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  headerLeft: { flex: 1 }, headerRight: { display: 'flex', alignItems: 'center' },
  mainTitle: { fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0, '@media (min-width: 769px)': { fontSize: '28px' } },
  subtitle: { fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', '@media (min-width: 769px)': { fontSize: '14px' } },
  classSelectorWrapper: { minWidth: '200px', width: '100%', '@media (min-width: 480px)': { width: 'auto' } },
  customDropdown: { position: 'relative', width: '100%' },
  dropdownButton: { width: '100%', padding: '10px 12px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '8px', minHeight: '44px' },
  dropdownButtonContent: { display: 'flex', alignItems: 'center', gap: '8px' },
  selectedClassName: { fontSize: '13px', fontWeight: '500', color: '#0f172a' },
  placeholderText: { color: '#94a3b8', fontSize: '13px' },
  dropdownMenu: { position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: '250px', overflowY: 'auto' },
  dropdownItem: { padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '6px' },
  dropdownItemSelected: { backgroundColor: '#eef2ff' },
  dropdownItemContent: { display: 'flex', alignItems: 'center', gap: '8px' },
  dropdownItemName: { fontSize: '12px', fontWeight: '500', color: '#0f172a' },
  studentCount: { fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' },
  emptyDropdown: { padding: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b' },
  errorCard: { textAlign: 'center', padding: '24px 16px', background: '#fee2e2', borderRadius: '16px', marginBottom: '16px' },
  errorCardSmall: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#fee2e2', borderRadius: '10px', marginBottom: '16px', flexWrap: 'wrap' },
  dismissButton: { marginLeft: 'auto', padding: '4px 10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', minHeight: '32px' },
  retryButton: { marginTop: '8px', padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', minHeight: '36px' },
  pointsDashboard: { marginBottom: '16px' },
  pointsCard: { background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)', borderRadius: '16px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  pointsCardLeft: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  pointsIcon: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pointsLabel: { fontSize: '9px', color: '#92400e' },
  pointsValue: { fontSize: '22px', fontWeight: '700', color: '#d97706', lineHeight: 1, '@media (min-width: 769px)': { fontSize: '36px' } },
  pointsCardRight: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'white', borderRadius: '12px' },
  teamPointsLabel: { fontSize: '9px', color: '#64748b' },
  teamPointsValue: { fontSize: '14px', fontWeight: '700', color: '#6366f1' },
  teamInfoCard: { background: 'white', borderRadius: '20px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', '@media (min-width: 769px)': { padding: '20px' } },
  teamHeaderSection: { display: 'flex', justifyContent: 'center', marginBottom: '16px' },
  teamBadge: { display: 'inline-flex', padding: '2px', borderRadius: '40px', borderLeft: '3px solid', background: 'white' },
  teamBadgeContent: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px' },
  teamBadgeIcon: { fontSize: '20px', '@media (min-width: 769px)': { fontSize: '28px' } },
  teamBadgeLabel: { fontSize: '8px', color: '#64748b' },
  teamBadgeLetter: { fontSize: '18px', fontWeight: '700', '@media (min-width: 769px)': { fontSize: '24px' } },
  roleCardModern: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '16px', marginBottom: '16px', flexWrap: 'wrap' },
  roleIconModern: { width: '44px', height: '44px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 },
  roleTitleModern: { fontSize: '14px', fontWeight: '600', marginBottom: '2px', color: '#1e293b', '@media (min-width: 769px)': { fontSize: '16px' } },
  roleDescriptionModern: { fontSize: '10px', color: '#64748b', margin: 0 },
  membersSection: { marginBottom: '16px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' },
  sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0, '@media (min-width: 769px)': { fontSize: '16px' } },
  memberCount: { fontSize: '9px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '16px' },
  membersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' },
  memberCardModern: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f8fafc', borderRadius: '12px', flexWrap: 'wrap' },
  currentUserCardModern: { background: '#eef2ff', border: '1px solid #c7d2fe' },
  memberAvatarModern: { width: '36px', height: '36px', borderRadius: '18px', flexShrink: 0 },
  avatarPlaceholderModern: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '14px', borderRadius: '18px' },
  memberNameModern: { fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' },
  youBadgeModern: { fontSize: '8px', fontWeight: '500', color: '#6366f1', background: '#c7d2fe', padding: '1px 4px', borderRadius: '12px' },
  memberRoleModern: { fontSize: '9px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px', flexWrap: 'wrap' },
  memberPointsModern: { fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' },
  collaborationHubButton: { width: '100%', padding: '10px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px', position: 'relative', minHeight: '44px' },
  collaborationBadge: { position: 'absolute', right: '8px', fontSize: '8px', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '16px', '@media (max-width: 480px)': { display: 'none' } },
  questionCard: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '16px', marginTop: '16px', color: 'white' },
  questionHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.2)', flexWrap: 'wrap' },
  questionTitle: { flex: 1, margin: 0, fontSize: '14px', fontWeight: '600', '@media (min-width: 769px)': { fontSize: '18px' } },
  timerDisplay: { display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', fontSize: '12px', fontWeight: '600' },
  questionBody: { marginTop: '8px' },
  questionText: { fontSize: '14px', lineHeight: '1.5', marginBottom: '16px', '@media (min-width: 769px)': { fontSize: '16px' } },
  blurredQuestionContainer: { position: 'relative', marginBottom: '16px' },
  blurredQuestionContent: { textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', border: '2px dashed rgba(255,255,255,0.3)' },
  blurIcon: { fontSize: '36px', marginBottom: '6px' },
  blurredText: { fontSize: '14px', fontWeight: '600', marginBottom: '4px' },
  blurredSubtext: { fontSize: '10px', opacity: 0.8 },
  blurredOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  blurredQuestionText: { fontSize: '14px', lineHeight: '1.5', textAlign: 'center', color: 'transparent', textShadow: '0 0 6px rgba(255,255,255,0.5)', filter: 'blur(3px)' },
  answerArea: { display: 'flex', flexDirection: 'column', gap: '10px' },
  answerInput: { width: '100%', padding: '10px', borderRadius: '10px', border: 'none', fontSize: '12px', fontFamily: 'inherit', resize: 'vertical', color: '#333', backgroundColor: 'white' },
  submitButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 16px', background: 'white', color: '#667eea', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', minHeight: '40px' },
  submittedSuccessCard: { textAlign: 'center', padding: '20px', background: '#d1fae5', borderRadius: '16px', marginTop: '16px' },
  errorMessage: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: 'rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '11px', flexWrap: 'wrap' },
  resultCardEnded: { textAlign: 'center', padding: '16px', background: '#d1fae5', borderRadius: '16px', marginTop: '16px' },
  dismissResultButton: { marginTop: '8px', padding: '6px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', minHeight: '36px' },
  readyButton: { width: '100%', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '16px', minHeight: '44px' },
  waitingMessageModern: { background: '#fef3c7', borderRadius: '12px', marginTop: '16px' },
  waitingContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', flexWrap: 'wrap', gap: '10px' },
  waitingIconSection: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1 },
  waitingSpinner: { fontSize: '20px', animation: 'spin 2s linear infinite' },
  waitingTitle: { fontWeight: '600', color: '#92400e', fontSize: '13px' },
  waitingText: { fontSize: '10px', color: '#b45309', margin: 0 },
  cancelReadyButton: { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', minHeight: '36px' },
  noTeamCard: { background: 'white', borderRadius: '16px', padding: '24px 16px', textAlign: 'center', backgroundColor: '#fffbeb' },
  noTeamIcon: { fontSize: '40px', marginBottom: '8px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)', padding: '12px' },
  modalContainer: { backgroundColor: 'white', borderRadius: '20px', maxWidth: '600px', width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', '@media (min-width: 769px)': { maxWidth: '700px' } },
  collaborationModalContainer: { backgroundColor: 'white', borderRadius: '20px', maxWidth: '600px', width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', '@media (min-width: 769px)': { maxWidth: '800px' } },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' },
  modalHeaderLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  modalTitle: { fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0, '@media (min-width: 769px)': { fontSize: '20px' } },
  modalCloseButton: { background: '#f1f5f9', border: 'none', borderRadius: '30px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  modalBody: { flex: 1, overflowY: 'auto', padding: '14px 16px' },
  modalFooter: { padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' },
  closeModalButton: { padding: '8px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', minHeight: '40px' },
  modalLoading: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '30px', color: '#64748b' },
  noAnswersContainer: { textAlign: 'center', padding: '30px', color: '#64748b' },
  answersSummary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: '#e0e7ff', borderRadius: '10px', marginBottom: '12px', fontSize: '11px', flexWrap: 'wrap' },
  refreshButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '30px', fontSize: '11px', cursor: 'pointer' },
  awardsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  awardCard: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f8fafc', borderRadius: '16px', borderLeft: '3px solid', flexWrap: 'wrap' },
  currentUserAwardCard: { background: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 100%)' },
  awardRank: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '50px', gap: '2px' },
  awardMedal: { fontSize: '24px' },
  awardPlace: { fontSize: '9px', fontWeight: '600', color: '#475569' },
  awardAvatar: { width: '36px', height: '36px', borderRadius: '18px', flexShrink: 0 },
  awardAvatarInner: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px', borderRadius: '18px' },
  awardDetails: { flex: 1, minWidth: '140px' },
  awardName: { fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' },
  youBadge: { fontSize: '8px', fontWeight: '500', color: '#6366f1', background: '#c7d2fe', padding: '1px 6px', borderRadius: '12px' },
  awardRole: { fontSize: '9px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', flexWrap: 'wrap' },
  awardAnswer: { fontSize: '10px', color: '#334155', marginBottom: '4px', wordBreak: 'break-word' },
  awardPoints: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: '500', color: '#d97706' },
  collaborationTabs: { display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 12px' },
  tab: { flex: 1, padding: '8px 12px', background: 'none', border: 'none', fontSize: '11px', fontWeight: '500', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', '@media (min-width: 769px)': { padding: '12px 16px', fontSize: '14px' } },
  activeTab: { flex: 1, padding: '8px 12px', background: 'none', border: 'none', fontSize: '11px', fontWeight: '600', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderBottom: '2px solid #8b5cf6', '@media (min-width: 769px)': { padding: '12px 16px', fontSize: '14px' } },
  discussionMessages: { maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' },
  emptyDiscussion: { textAlign: 'center', padding: '30px', color: '#94a3b8' },
  discussionMessage: { display: 'flex', gap: '8px', padding: '10px', background: '#f8fafc', borderRadius: '10px', flexWrap: 'wrap' },
  messageAvatar: { width: '28px', height: '28px', borderRadius: '14px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '11px', flexShrink: 0 },
  messageContent: { flex: 1, minWidth: '120px' },
  messageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' },
  messageName: { fontWeight: '600', fontSize: '11px', color: '#1e293b' },
  messageTime: { fontSize: '8px', color: '#94a3b8' },
  messageText: { fontSize: '10px', color: '#334155', lineHeight: '1.4', margin: 0 },
  messageInputArea: { display: 'flex', gap: '8px', marginTop: '8px', flexDirection: 'column' },
  messageInput: { padding: '8px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '11px', fontFamily: 'inherit', resize: 'vertical' },
  sendMessageButton: { padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '38px' },
  brainstormSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  brainstormHeader: { textAlign: 'center', padding: '12px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '12px' },
  brainstormHeaderTitle: { margin: '4px 0 2px 0', fontSize: '14px', color: '#92400e' },
  brainstormHeaderText: { margin: 0, fontSize: '10px', color: '#b45309' },
  brainstormInputArea: { display: 'flex', flexDirection: 'column', gap: '8px' },
  brainstormInput: { padding: '8px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '11px', fontFamily: 'inherit', resize: 'vertical' },
  addIdeaButton: { padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '38px' },
  ideasList: { maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
  emptyIdeas: { textAlign: 'center', padding: '24px', color: '#94a3b8' },
  ideaCard: { display: 'flex', gap: '10px', padding: '10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap' },
  ideaVotes: { display: 'flex', alignItems: 'center', gap: '4px' },
  voteButton: { background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', padding: '2px' },
  voteCount: { fontSize: '12px', fontWeight: '600', color: '#475569' },
  ideaContent: { flex: 1, minWidth: '120px' },
  ideaText: { fontSize: '11px', color: '#1e293b', margin: '0 0 4px 0', lineHeight: '1.4' },
  ideaMeta: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '8px', color: '#94a3b8' },
  ideaAuthor: { fontWeight: '500' },
  ideaTime: { fontSize: '8px' }
};

const styleSheetGlobal = document.createElement("style");
styleSheetGlobal.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } @keyframes modalSlideIn { from { opacity: 0; transform: translateY(-15px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } } button, .dropdownButton, .submitButton, .readyButton, .dismissResultButton, .retryButton, .cancelReadyButton, .refreshButton, .modalCloseButton, .closeModalButton, .collaborationHubButton, .sendMessageButton, .addIdeaButton, .voteButton { transition: all 0.2s ease; } button:active, .dropdownButton:active { transform: scale(0.97); } .voteButton:hover { transform: scale(1.1); } @media (max-width: 480px) { button, .dropdownButton, .submitButton, .readyButton, .cancelReadyButton, .closeModalButton, .sendMessageButton, .addIdeaButton { min-height: 40px; } .memberCardModern, .awardCard, .ideaCard, .discussionMessage { flex-direction: column; text-align: center; align-items: center; } .ideaVotes { flex-direction: row; align-items: center; } .messageInputArea { flex-direction: column; } .collaborationBadge { display: none; } } @media (max-width: 360px) { .mainTitle { font-size: 18px !important; } .pointsValue { font-size: 18px !important; } .teamBadgeLetter { font-size: 14px !important; } .questionText { font-size: 12px !important; } }`;
document.head.appendChild(styleSheetGlobal);

export default CollaborationStudent;