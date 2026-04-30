// src/menu/CollaborationStudent.jsx
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
  
  // State to control blur effect
  const [isQuestionBlurred, setIsQuestionBlurred] = useState(true);
  const [countdownStarted, setCountdownStarted] = useState(false);
  
  // Team collaboration states
  const [showTeamAnswersModal, setShowTeamAnswersModal] = useState(false);
  const [teamAnswers, setTeamAnswers] = useState([]);
  const [loadingTeamAnswers, setLoadingTeamAnswers] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Collaboration features
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
  
  // Game session tracking
  const [studentUUID, setStudentUUID] = useState(null);
  const [currentGameSessionId, setCurrentGameSessionId] = useState(null);
  
  // Refs
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
    } catch (error) {
      return null;
    }
  };

  const startCountdown = useCallback((startTime, duration) => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    const start = new Date(startTime).getTime();
    const endTime = start + (duration * 1000);
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining > 0 && !countdownStarted) {
        setCountdownStarted(true);
        setIsQuestionBlurred(false);
        setCanAnswer(true);
      }
      
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        setCanAnswer(false);
        countdownIntervalRef.current = null;
      }
    };
    
    updateTimer();
    countdownIntervalRef.current = setInterval(updateTimer, 1000);
  }, [countdownStarted]);

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
      console.error('Error loading team info:', error);
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

  const resetRoundState = useCallback(() => {
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
    setIsQuestionBlurred(true);
    setCountdownStarted(false);
    setShowTeamAnswersModal(false);
    setShowCollaborationHub(false);
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const fetchTeamAnswers = useCallback(async () => {
    if (!currentGameSessionId || !teamInfo?.team || !selectedClass?.id) return;
    
    setLoadingTeamAnswers(true);
    try {
      const { data: teamAssignments } = await supabase
        .from('team_assignments')
        .select('student_id')
        .eq('class_id', selectedClass.id)
        .eq('team', teamInfo.team);
      
      if (!teamAssignments || teamAssignments.length === 0) {
        setLoadingTeamAnswers(false);
        return;
      }
      
      const teamStudentIds = teamAssignments.map(ta => ta.student_id);
      
      const { data: answers, error: answersError } = await supabase
        .from('student_answers')
        .select(`
          id,
          student_id,
          answer,
          created_at,
          students (id, name, user_id)
        `)
        .eq('session_id', currentGameSessionId)
        .in('student_id', teamStudentIds);
      
      if (answersError) throw answersError;
      
      const teamAnswersWithPoints = await Promise.all(
        (answers || []).map(async (answer) => {
          let userName = answer.students?.name || 'Student';
          
          if (answer.students?.user_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('name')
              .eq('id', answer.students.user_id)
              .maybeSingle();
            if (userData?.name) userName = userData.name;
          }
          
          const { data: pointData } = await supabase
            .from('student_points')
            .select('points')
            .eq('student_id', answer.student_id)
            .eq('class_id', selectedClass.id)
            .maybeSingle();
          
          const { data: roleData } = await supabase
            .from('team_assignments')
            .select('role')
            .eq('student_id', answer.student_id)
            .eq('class_id', selectedClass.id)
            .maybeSingle();
          
          return {
            id: answer.id,
            studentId: answer.student_id,
            studentName: userName,
            answer: answer.answer,
            points: pointData?.points || 0,
            role: roleData?.role || 'member',
            createdAt: answer.created_at,
            isCurrentUser: answer.student_id === studentUUID
          };
        })
      );
      
      teamAnswersWithPoints.sort((a, b) => b.points - a.points);
      setTeamAnswers(teamAnswersWithPoints);
    } catch (error) {
      console.error('Error fetching team answers:', error);
    } finally {
      setLoadingTeamAnswers(false);
    }
  }, [currentGameSessionId, teamInfo, selectedClass, studentUUID]);

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
      
      setAnswerSubmitted(true);
      setSubmitSuccess(true);
      setSubmittedAnswerText(studentAnswer);
      setRoundActive(false);
      
      await fetchTeamAnswers();
      setShowTeamAnswersModal(true);
      
      setTimeout(() => setSubmitSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error:', error);
      setSubmissionError(error.message || 'Failed to submit answer');
      setTimeout(() => setSubmissionError(null), 5000);
    } finally {
      setQuestionLoading(false);
    }
  };

  const refreshTeamAnswers = async () => {
    setRefreshKey(prev => prev + 1);
    await fetchTeamAnswers();
  };

  // Load brainstorming ideas
  const loadBrainstormIdeas = useCallback(async () => {
    if (!teamInfo?.team || !selectedClass?.id || !currentGameSessionId) return;
    
    try {
      const { data, error } = await supabase
        .from('brainstorm_ideas')
        .select('*, students(name)')
        .eq('class_id', selectedClass.id)
        .eq('team', teamInfo.team)
        .eq('session_id', currentGameSessionId)
        .order('votes', { ascending: false })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setBrainstormIdeas(data || []);
    } catch (error) {
      console.error('Error loading brainstorm ideas:', error);
    }
  }, [teamInfo, selectedClass, currentGameSessionId]);

  // Add brainstorm idea
  const addBrainstormIdea = async () => {
    if (!newIdea.trim()) return;
    if (!teamInfo?.team || !selectedClass?.id || !studentUUID) return;
    
    setSubmittingIdea(true);
    try {
      const { error } = await supabase
        .from('brainstorm_ideas')
        .insert({
          class_id: selectedClass.id,
          team: teamInfo.team,
          session_id: currentGameSessionId,
          student_id: studentUUID,
          idea: newIdea.trim(),
          votes: 0,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setNewIdea('');
      await loadBrainstormIdeas();
    } catch (error) {
      console.error('Error adding idea:', error);
    } finally {
      setSubmittingIdea(false);
    }
  };

  // Vote on brainstorm idea
  const voteIdea = async (ideaId, currentVotes) => {
    if (!studentUUID) return;
    
    try {
      const { data: existingVote } = await supabase
        .from('idea_votes')
        .select('id')
        .eq('idea_id', ideaId)
        .eq('student_id', studentUUID)
        .maybeSingle();
      
      if (existingVote) {
        await supabase
          .from('idea_votes')
          .delete()
          .eq('id', existingVote.id);
        
        await supabase
          .from('brainstorm_ideas')
          .update({ votes: currentVotes - 1 })
          .eq('id', ideaId);
      } else {
        await supabase
          .from('idea_votes')
          .insert({
            idea_id: ideaId,
            student_id: studentUUID,
            created_at: new Date().toISOString()
          });
        
        await supabase
          .from('brainstorm_ideas')
          .update({ votes: currentVotes + 1 })
          .eq('id', ideaId);
      }
      
      await loadBrainstormIdeas();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Load team discussion
  const loadTeamDiscussion = useCallback(async () => {
    if (!teamInfo?.team || !selectedClass?.id || !currentGameSessionId) return;
    
    try {
      const { data, error } = await supabase
        .from('team_discussion')
        .select('*, students(name)')
        .eq('class_id', selectedClass.id)
        .eq('team', teamInfo.team)
        .eq('session_id', currentGameSessionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setTeamDiscussion(data || []);
    } catch (error) {
      console.error('Error loading discussion:', error);
    }
  }, [teamInfo, selectedClass, currentGameSessionId]);

  // Send discussion message
  const sendDiscussionMessage = async () => {
    if (!newMessage.trim()) return;
    if (!teamInfo?.team || !selectedClass?.id || !studentUUID) return;
    
    setSubmittingMessage(true);
    try {
      const { error } = await supabase
        .from('team_discussion')
        .insert({
          class_id: selectedClass.id,
          team: teamInfo.team,
          session_id: currentGameSessionId,
          student_id: studentUUID,
          message: newMessage.trim(),
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setNewMessage('');
      await loadTeamDiscussion();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSubmittingMessage(false);
    }
  };

  const checkForActiveGameSession = useCallback(async () => {
    if (isProcessingRef.current) return;
    if (!selectedClass?.id || !studentUUID || !teamInfo) return;
    
    isProcessingRef.current = true;
    
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
      
      const isNewSession = gameSession && lastProcessedSessionRef.current !== gameSession.id;
      
      if (gameSession && isNewSession) {
        console.log('🎮 Game session started!', gameSession.id);
        lastProcessedSessionRef.current = gameSession.id;
        
        setCurrentGameSessionId(gameSession.id);
        setCurrentQuestion(gameSession.current_question);
        setRoundActive(true);
        setWaitingForTeacher(false);
        setCanAnswer(false);
        setAnswerSubmitted(false);
        setStudentAnswer('');
        setIsQuestionBlurred(true);
        setCountdownStarted(false);
        
        // Load collaboration data for new session
        setTimeout(() => {
          loadBrainstormIdeas();
          loadTeamDiscussion();
        }, 500);
        
        if (gameSession.current_question?.timeLimit && gameSession.current_question?.started_at) {
          startCountdown(
            gameSession.current_question.started_at, 
            gameSession.current_question.timeLimit
          );
        }
      }
      
      if (currentGameSessionId && !gameSession) {
        console.log('🏁 Round ended');
        setRoundActive(false);
        setRoundEnded(true);
        setCanAnswer(false);
        setIsQuestionBlurred(true);
        setCountdownStarted(false);
        setWaitingForTeacher(true);
        setReadySubmitted(true);
        setIsReady(true);
        setCurrentGameSessionId(null);
        lastProcessedSessionRef.current = null;
        
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
      
    } catch (error) {
      console.error('Polling error:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [selectedClass?.id, studentUUID, teamInfo, currentGameSessionId, startCountdown, loadBrainstormIdeas, loadTeamDiscussion]);

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
      
      setIsReady(false);
      setReadySubmitted(false);
      setWaitingForTeacher(false);
      
    } catch (error) {
      console.error('Error canceling ready status:', error);
      setReadyError(error.message || 'Failed to cancel ready status.');
      setTimeout(() => setReadyError(null), 3000);
    }
  };

  const resetAfterAnswer = useCallback(() => {
    setShowTeamAnswersModal(false);
    setShowCollaborationHub(false);
    setAnswerSubmitted(false);
    setRoundActive(false);
    setCurrentQuestion(null);
    setSubmittedAnswerText('');
    setStudentAnswer('');
    setCurrentGameSessionId(null);
    setIsQuestionBlurred(true);
    setCountdownStarted(false);
    setWaitingForTeacher(true);
    setReadySubmitted(true);
    setIsReady(true);
    lastProcessedSessionRef.current = null;
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Polling management
  useEffect(() => {
    if (!selectedClass?.id || !studentUUID || !teamInfo) return;
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if ((waitingForTeacher || roundActive) && !answerSubmitted) {
      pollingIntervalRef.current = setInterval(() => {
        checkForActiveGameSession();
      }, 3000);
      checkForActiveGameSession();
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [selectedClass?.id, studentUUID, teamInfo?.team, waitingForTeacher, roundActive, answerSubmitted, checkForActiveGameSession]);

  // Polling for collaboration data during active round
  useEffect(() => {
    if (!roundActive || !currentGameSessionId || !teamInfo?.team) return;
    
    const collaborationInterval = setInterval(() => {
      loadTeamDiscussion();
      if (showBrainstorming) loadBrainstormIdeas();
    }, 5000);
    
    return () => clearInterval(collaborationInterval);
  }, [roundActive, currentGameSessionId, teamInfo?.team, showBrainstorming, loadTeamDiscussion, loadBrainstormIdeas]);

  // Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      isProcessingRef.current = false;
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
  
  const getAwardRank = (index) => {
    switch(index) {
      case 0: return { medal: '🥇', label: '1st Place', color: '#fbbf24' };
      case 1: return { medal: '🥈', label: '2nd Place', color: '#94a3b8' };
      case 2: return { medal: '🥉', label: '3rd Place', color: '#cd7f32' };
      default: return { medal: '📋', label: `${index + 1}th Place`, color: '#64748b' };
    }
  };

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
    lastProcessedSessionRef.current = null;
    
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

              {/* Collaboration Hub Button */}
              {roundActive && !answerSubmitted && (
                <button 
                  style={styles.collaborationHubButton}
                  onClick={() => setShowCollaborationHub(true)}
                >
                  <FiMessageSquare size={18} />
                  Team Collaboration Hub
                  <span style={styles.collaborationBadge}>Brainstorm & Discuss</span>
                </button>
              )}

              {/* Waiting for teacher message */}
              {waitingForTeacher && !roundActive && !roundEnded && !answerSubmitted && (
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
                    >
                      <FiX size={18} /> Not Ready
                    </button>
                  </div>
                </div>
              )}

              {/* Question round */}
              {roundActive && currentQuestion && !answerSubmitted && (
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
                    {isQuestionBlurred && !countdownStarted && (
                      <div style={styles.blurredQuestionContainer}>
                        <div style={styles.blurredQuestionContent}>
                          <div style={styles.blurIcon}>🔒</div>
                          <p style={styles.blurredText}>Question is locked</p>
                          <p style={styles.blurredSubtext}>Wait for the timer to start...</p>
                        </div>
                        <div style={styles.blurredOverlay}>
                          <p style={styles.blurredQuestionText}>
                            {currentQuestion.text}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {!isQuestionBlurred && countdownStarted && (
                      <>
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
                        
                        {submissionError && (
                          <div style={styles.errorMessage}>
                            <FiAlertCircle size={20} color="#ef4444" />
                            <span>{submissionError}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {answerSubmitted && !showTeamAnswersModal && (
                <div style={styles.submittedSuccessCard}>
                  <FiCheckCircle size={48} color="#10b981" />
                  <h3>Answer Submitted Successfully!</h3>
                  <p>Your answer: "{submittedAnswerText}"</p>
                  <p>Loading team results...</p>
                  <div style={styles.loadingSpinnerSmall}></div>
                </div>
              )}

              {roundEnded && !answerSubmitted && (
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
                      setWaitingForTeacher(true);
                      setReadySubmitted(true);
                      setIsReady(true);
                      setIsQuestionBlurred(true);
                      setCountdownStarted(false);
                      setShowTeamAnswersModal(false);
                      lastProcessedSessionRef.current = null;
                    }}
                  >
                    Close
                  </button>
                </div>
              )}

              {!waitingForTeacher && !roundActive && !roundEnded && !answerSubmitted && (
                <button style={styles.readyButton} onClick={handleReady}>
                  <FiUserCheck size={20} /> I'm Ready! - Team {teamInfo.team}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Team Answers Modal */}
      {showTeamAnswersModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <FiAward size={24} color="#f59e0b" />
                <h2 style={styles.modalTitle}>Team {teamInfo?.team} - Answers & Awards</h2>
              </div>
              <button 
                style={styles.modalCloseButton}
                onClick={resetAfterAnswer}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              {loadingTeamAnswers ? (
                <div style={styles.modalLoading}>
                  <div style={styles.loadingSpinnerSmall}></div>
                  <p>Loading team answers...</p>
                </div>
              ) : teamAnswers.length === 0 ? (
                <div style={styles.noAnswersContainer}>
                  <p>No team answers submitted yet.</p>
                  <p>Other team members will appear here once they submit.</p>
                  <button 
                    style={styles.refreshButton}
                    onClick={refreshTeamAnswers}
                  >
                    <FiRefreshCw size={16} />
                    <span>Refresh</span>
                  </button>
                </div>
              ) : (
                <>
                  <div style={styles.answersSummary}>
                    <FiUsers size={16} />
                    <span>{teamAnswers.length} / {teamMembers.length} team members have answered</span>
                  </div>
                  
                  <div style={styles.awardsList}>
                    {teamAnswers.map((member, index) => {
                      const award = getAwardRank(index);
                      return (
                        <div 
                          key={member.id} 
                          style={{
                            ...styles.awardCard,
                            ...(member.isCurrentUser ? styles.currentUserAwardCard : {}),
                            borderLeftColor: award.color
                          }}
                        >
                          <div style={styles.awardRank}>
                            <span style={styles.awardMedal}>{award.medal}</span>
                            <span style={styles.awardPlace}>{award.label}</span>
                          </div>
                          <div style={styles.awardAvatar}>
                            <div style={styles.awardAvatarInner}>
                              {member.studentName?.charAt(0) || 'S'}
                            </div>
                          </div>
                          <div style={styles.awardDetails}>
                            <div style={styles.awardName}>
                              {member.studentName}
                              {member.isCurrentUser && <span style={styles.youBadge}> (You)</span>}
                            </div>
                            <div style={styles.awardRole}>
                              {getRoleIcon(member.role)}
                              <span>{getRoleInfo(member.role).label}</span>
                            </div>
                            <div style={styles.awardAnswer}>
                              <strong>Answer:</strong> "{member.answer}"
                            </div>
                            <div style={styles.awardPoints}>
                              <FiStar size={14} color="#f59e0b" />
                              <span>{member.points} points awarded</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={styles.collaborationSummary}>
                    <FiSun size={18} color="#f59e0b" />
                    <p>💡 Team Collaboration Tip: Discuss your answers and learn from each other's approaches!</p>
                  </div>
                </>
              )}
            </div>
            
            <div style={styles.modalFooter}>
              <button 
                style={styles.closeModalButton}
                onClick={resetAfterAnswer}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Hub Modal */}
      {showCollaborationHub && (
        <div style={styles.modalOverlay}>
          <div style={styles.collaborationModalContainer}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <FiMessageSquare size={24} color="#8b5cf6" />
                <h2 style={styles.modalTitle}>Team {teamInfo?.team} Collaboration Hub</h2>
              </div>
              <button 
                style={styles.modalCloseButton}
                onClick={() => setShowCollaborationHub(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div style={styles.collaborationTabs}>
              <button 
                style={!showBrainstorming ? styles.activeTab : styles.tab}
                onClick={() => setShowBrainstorming(false)}
              >
                <FiMessageSquare size={16} />
                Team Discussion
              </button>
              <button 
                style={showBrainstorming ? styles.activeTab : styles.tab}
                onClick={() => {
                  setShowBrainstorming(true);
                  loadBrainstormIdeas();
                }}
              >
                <FiSun size={16} />
                Brainstorming
              </button>
            </div>
            
            <div style={styles.modalBody}>
              {!showBrainstorming ? (
                <div style={styles.discussionSection}>
                  <div style={styles.discussionMessages}>
                    {teamDiscussion.length === 0 ? (
                      <div style={styles.emptyDiscussion}>
                        <FiMessageSquare size={48} color="#cbd5e1" />
                        <p>No messages yet. Start the collaboration!</p>
                        <p style={styles.emptySubtext}>Discuss the question and share ideas with your team</p>
                      </div>
                    ) : (
                      teamDiscussion.map((msg) => (
                        <div key={msg.id} style={styles.discussionMessage}>
                          <div style={styles.messageAvatar}>
                            {msg.students?.name?.charAt(0) || 'S'}
                          </div>
                          <div style={styles.messageContent}>
                            <div style={styles.messageHeader}>
                              <span style={styles.messageName}>{msg.students?.name || 'Student'}</span>
                              <span style={styles.messageTime}>
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p style={styles.messageText}>{msg.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div style={styles.messageInputArea}>
                    <textarea
                      style={styles.messageInput}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message here..."
                      rows={2}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendDiscussionMessage();
                        }
                      }}
                    />
                    <button 
                      style={styles.sendMessageButton}
                      onClick={sendDiscussionMessage}
                      disabled={submittingMessage || !newMessage.trim()}
                    >
                      <FiSend size={16} />
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.brainstormSection}>
                  <div style={styles.brainstormHeader}>
                    <FiSun size={20} color="#f59e0b" />
                    <h3 style={styles.brainstormHeaderTitle}>Brainstorm Ideas</h3>
                    <p style={styles.brainstormHeaderText}>Share your ideas and vote on the best solutions!</p>
                  </div>
                  
                  <div style={styles.brainstormInputArea}>
                    <textarea
                      style={styles.brainstormInput}
                      value={newIdea}
                      onChange={(e) => setNewIdea(e.target.value)}
                      placeholder="Share your idea for solving this question..."
                      rows={2}
                    />
                    <button 
                      style={styles.addIdeaButton}
                      onClick={addBrainstormIdea}
                      disabled={submittingIdea || !newIdea.trim()}
                    >
                      <FiSun size={16} />
                      Add Idea
                    </button>
                  </div>
                  
                  <div style={styles.ideasList}>
                    {brainstormIdeas.length === 0 ? (
                      <div style={styles.emptyIdeas}>
                        <FiSun size={48} color="#cbd5e1" />
                        <p>No ideas yet. Be the first to share!</p>
                      </div>
                    ) : (
                      brainstormIdeas.map((idea) => (
                        <div key={idea.id} style={styles.ideaCard}>
                          <div style={styles.ideaVotes}>
                            <button 
                              style={styles.voteButton}
                              onClick={() => voteIdea(idea.id, idea.votes)}
                            >
                              👍
                            </button>
                            <span style={styles.voteCount}>{idea.votes || 0}</span>
                          </div>
                          <div style={styles.ideaContent}>
                            <p style={styles.ideaText}>{idea.idea}</p>
                            <div style={styles.ideaMeta}>
                              <span style={styles.ideaAuthor}>by {idea.students?.name || 'Student'}</span>
                              <span style={styles.ideaTime}>
                                {new Date(idea.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div style={styles.modalFooter}>
              <button 
                style={styles.closeModalButton}
                onClick={() => setShowCollaborationHub(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
  loadingSpinnerSmall: {
    width: '32px',
    height: '32px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginTop: '12px',
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
  collaborationHubButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  collaborationBadge: {
    position: 'absolute',
    right: '12px',
    fontSize: '10px',
    background: 'rgba(255,255,255,0.2)',
    padding: '4px 8px',
    borderRadius: '20px',
    fontWeight: '400',
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
  blurredQuestionContainer: {
    position: 'relative',
    marginBottom: '20px',
  },
  blurredQuestionContent: {
    textAlign: 'center',
    padding: '30px 20px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '16px',
    border: '2px dashed rgba(255,255,255,0.3)',
  },
  blurIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  blurredText: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  blurredSubtext: {
    fontSize: '13px',
    opacity: 0.8,
  },
  blurredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backdropFilter: 'blur(8px)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  blurredQuestionText: {
    fontSize: 'clamp(15px, 4vw, 18px)',
    lineHeight: '1.5',
    textAlign: 'center',
    color: 'transparent',
    textShadow: '0 0 8px rgba(255,255,255,0.5)',
    filter: 'blur(4px)',
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
  submittedSuccessCard: {
    textAlign: 'center',
    padding: '32px 20px',
    background: '#d1fae5',
    borderRadius: '20px',
    marginTop: '20px',
    border: '1px solid #10b981',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    backdropFilter: 'blur(4px)',
    padding: '20px',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: '28px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'modalSlideIn 0.3s ease',
  },
  collaborationModalContainer: {
    backgroundColor: 'white',
    borderRadius: '28px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'modalSlideIn 0.3s ease',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  modalTitle: {
    fontSize: 'clamp(18px, 5vw, 22px)',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  modalCloseButton: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '40px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#64748b',
  },
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  closeModalButton: {
    padding: '10px 24px',
    background: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  modalLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '48px',
    color: '#64748b',
  },
  noAnswersContainer: {
    textAlign: 'center',
    padding: '48px 20px',
    color: '#64748b',
  },
  answersSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    background: '#e0e7ff',
    borderRadius: '12px',
    marginBottom: '16px',
    fontSize: '13px',
    color: '#4338ca',
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '40px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  awardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  awardCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '20px',
    borderLeft: '4px solid',
    transition: 'all 0.2s ease',
    flexWrap: 'wrap',
  },
  currentUserAwardCard: {
    background: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 100%)',
    border: '1px solid #c7d2fe',
  },
  awardRank: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '70px',
    gap: '4px',
  },
  awardMedal: {
    fontSize: '32px',
  },
  awardPlace: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#475569',
  },
  awardAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  awardAvatarInner: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '700',
    fontSize: '18px',
  },
  awardDetails: {
    flex: 1,
    minWidth: '180px',
  },
  awardName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  youBadge: {
    fontSize: '10px',
    fontWeight: '500',
    color: '#6366f1',
    background: '#c7d2fe',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  awardRole: {
    fontSize: '11px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginBottom: '8px',
  },
  awardAnswer: {
    fontSize: '13px',
    color: '#334155',
    marginBottom: '6px',
    wordBreak: 'break-word',
  },
  awardPoints: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#d97706',
  },
  collaborationSummary: {
    marginTop: '24px',
    padding: '16px',
    background: '#fef3c7',
    borderRadius: '16px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#92400e',
    border: '1px solid #fde68a',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'center',
  },
  collaborationTabs: {
    display: 'flex',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 24px',
  },
  tab: {
    flex: 1,
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    flex: 1,
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    color: '#8b5cf6',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderBottom: '2px solid #8b5cf6',
    transition: 'all 0.2s ease',
  },
  discussionSection: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  discussionMessages: {
    flex: 1,
    maxHeight: '400px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '16px',
  },
  emptyDiscussion: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#94a3b8',
  },
  emptySubtext: {
    fontSize: '12px',
    marginTop: '8px',
  },
  discussionMessage: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '12px',
  },
  messageAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
    flexShrink: 0,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  messageName: {
    fontWeight: '600',
    fontSize: '13px',
    color: '#1e293b',
  },
  messageTime: {
    fontSize: '10px',
    color: '#94a3b8',
  },
  messageText: {
    fontSize: '13px',
    color: '#334155',
    lineHeight: '1.5',
    margin: 0,
  },
  messageInputArea: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  messageInput: {
    flex: 1,
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '13px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  sendMessageButton: {
    padding: '12px 20px',
    background: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  brainstormSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  brainstormHeader: {
    textAlign: 'center',
    padding: '16px',
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    borderRadius: '16px',
  },
  brainstormHeaderTitle: {
    margin: '8px 0 4px 0',
    fontSize: '18px',
    color: '#92400e',
  },
  brainstormHeaderText: {
    margin: 0,
    fontSize: '12px',
    color: '#b45309',
  },
  brainstormInputArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  brainstormInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '13px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  addIdeaButton: {
    padding: '10px 20px',
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  ideasList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  emptyIdeas: {
    textAlign: 'center',
    padding: '40px',
    color: '#94a3b8',
  },
  ideaCard: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  ideaVotes: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  voteButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
    transition: 'transform 0.2s ease',
  },
  voteCount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
  },
  ideaContent: {
    flex: 1,
  },
  ideaText: {
    fontSize: '14px',
    color: '#1e293b',
    margin: '0 0 8px 0',
    lineHeight: '1.5',
  },
  ideaMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '11px',
    color: '#94a3b8',
  },
  ideaAuthor: {
    fontWeight: '500',
  },
  ideaTime: {
    fontSize: '10px',
  },
};

// Add animations
const styleSheetGlobal = document.createElement("style");
styleSheetGlobal.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  button, .dropdownButton, .submitButton, .readyButton, .dismissResultButton, .retryButton, .cancelReadyButton, .refreshButton, .modalCloseButton, .closeModalButton, .collaborationHubButton, .sendMessageButton, .addIdeaButton, .voteButton {
    transition: all 0.2s ease;
  }
  
  button:hover, .dropdownButton:hover, .submitButton:hover, .readyButton:hover, .dismissResultButton:hover, .retryButton:hover, .refreshButton:hover, .modalCloseButton:hover, .closeModalButton:hover, .collaborationHubButton:hover, .sendMessageButton:hover, .addIdeaButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .voteButton:hover {
    transform: scale(1.1);
  }
  
  .cancelReadyButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239,68,68,0.3);
    background: #dc2626;
  }
  
  @media (max-width: 768px) {
    .memberCardModern, .awardCard, .ideaCard, .discussionMessage {
      flex-direction: column;
      text-align: center;
    }
    
    .collaborationBadge {
      display: none;
    }
    
    .ideaVotes {
      flex-direction: row;
      justify-content: center;
      gap: 8px;
    }
    
    .messageInputArea {
      flex-direction: column;
    }
  }
  
  @media (max-width: 480px) {
    .modalContainer, .collaborationModalContainer {
      margin: 16px;
      border-radius: 20px;
    }
    
    .collaborationTabs {
      padding: 0 16px;
    }
    
    .tab, .activeTab {
      padding: 10px 12px;
      font-size: 12px;
    }
  }
`;
document.head.appendChild(styleSheetGlobal);

export default CollaborationStudent;