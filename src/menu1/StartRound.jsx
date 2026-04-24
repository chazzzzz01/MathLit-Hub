// src/menu1/StartRound.jsx
import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FiClock, FiCheckCircle, FiXCircle, FiUsers, FiAlertCircle, FiSend, FiStar, FiAward, FiPlus, FiMinus, FiRefreshCw } from 'react-icons/fi';
import { supabase } from '../lib/supabase';

const animationStyles = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  .answer-updated {
    animation: pulse 0.5s ease-in-out;
  }
`;

function StartRound({ onClose, teamA, teamB, classId, className, onPointsAwarded }) {
  const { user } = useOutletContext();
  const [timeLeft, setTimeLeft] = useState(20);
  const [isActive, setIsActive] = useState(false);
  const [isReadyPhase, setIsReadyPhase] = useState(true);
  const [teamAnswers, setTeamAnswers] = useState({ A: null, B: null });
  const [submittedStatus, setSubmittedStatus] = useState({ A: false, B: false });
  const [roundEnded, setRoundEnded] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  const [pointsPhase, setPointsPhase] = useState(false);
  const [teamPoints, setTeamPoints] = useState({ A: 0, B: 0 });
  const [teamPointsAwarded, setTeamPointsAwarded] = useState({ A: false, B: false });
  const [showSuccessMessage, setShowSuccessMessage] = useState(null);
  
  const [teamAReadyStudents, setTeamAReadyStudents] = useState([]);
  const [teamBReadyStudents, setTeamBReadyStudents] = useState([]);
  const [readyCountdown, setReadyCountdown] = useState(null);
  const [canStartRound, setCanStartRound] = useState(false);
  const [error, setError] = useState(null);
  
  const [studentAnswers, setStudentAnswers] = useState({ A: [], B: [] });
  const [answerUpdateTrigger, setAnswerUpdateTrigger] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const timerIntervalRef = useRef(null);
  const readinessSubscriptionRef = useRef(null);
  const answersSubscriptionRef = useRef(null);
  const answerPollIntervalRef = useRef(null);
  
  const question = {
    text: "Find the equation of the line passing through (1, 2) and (5, 10)",
    answer: "y = 2x",
    explanation: "Step 1: Calculate slope (m) = (y2 - y1)/(x2 - x1) = (10 - 2)/(5 - 1) = 8/4 = 2\nStep 2: Use point-slope form: y - y1 = m(x - x1)\nStep 3: y - 2 = 2(x - 1)\nStep 4: y - 2 = 2x - 2\nStep 5: y = 2x"
  };

  // ============================================================
  // FETCH TEAM ANSWERS - AGGREGATE FROM INDIVIDUAL STUDENT ANSWERS
  // ============================================================
  const fetchTeamAnswers = async () => {
    if (!sessionId) {
      console.log('No session ID yet, skipping answer fetch');
      return;
    }
    
    try {
      console.log(`📡 Fetching answers for session ${sessionId}...`);
      
      const { data: answers, error } = await supabase
        .from('student_answers')
        .select(`
          *,
          students!inner (
            id,
            name,
            team,
            role
          )
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching answers:', error);
        return;
      }
      
      console.log(`📝 Retrieved ${answers?.length || 0} answers from database`);
      
      const teamAAnswerMap = new Map();
      const teamBAnswerMap = new Map();
      
      answers?.forEach(answer => {
        const studentTeam = answer.students?.team;
        const studentId = answer.student_id;
        const answerText = answer.answer;
        const studentName = answer.students?.name;
        const studentRole = answer.students?.role;
        const submittedAt = answer.created_at;
        const updatedAt = answer.updated_at;
        
        if (studentTeam === 'A') {
          if (!teamAAnswerMap.has(studentId) || new Date(updatedAt) > new Date(teamAAnswerMap.get(studentId).submittedAt)) {
            teamAAnswerMap.set(studentId, { 
              studentId, 
              name: studentName, 
              role: studentRole, 
              answer: answerText, 
              submittedAt,
              updatedAt
            });
          }
        } else if (studentTeam === 'B') {
          if (!teamBAnswerMap.has(studentId) || new Date(updatedAt) > new Date(teamBAnswerMap.get(studentId).submittedAt)) {
            teamBAnswerMap.set(studentId, { 
              studentId, 
              name: studentName, 
              role: studentRole, 
              answer: answerText, 
              submittedAt,
              updatedAt
            });
          }
        }
      });
      
      const teamAList = Array.from(teamAAnswerMap.values());
      const teamBList = Array.from(teamBAnswerMap.values());
      
      teamAList.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
      teamBList.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
      
      setStudentAnswers({ A: teamAList, B: teamBList });
      
      const teamAAnswerValues = teamAList.map(item => item.answer).filter(a => a && a.trim());
      const teamBAnswerValues = teamBList.map(item => item.answer).filter(a => a && a.trim());
      
      const teamAFinalAnswer = getMostCommonAnswer(teamAAnswerValues);
      const teamBFinalAnswer = getMostCommonAnswer(teamBAnswerValues);
      
      const previousTeamA = teamAnswers.A;
      const previousTeamB = teamAnswers.B;
      
      if (previousTeamA !== teamAFinalAnswer) {
        console.log(`🔄 Team A answer changed from "${previousTeamA}" to "${teamAFinalAnswer}"`);
        setAnswerUpdateTrigger(prev => prev + 1);
        setLastUpdated('A');
        setTimeout(() => setLastUpdated(null), 500);
      }
      
      if (previousTeamB !== teamBFinalAnswer) {
        console.log(`🔄 Team B answer changed from "${previousTeamB}" to "${teamBFinalAnswer}"`);
        setAnswerUpdateTrigger(prev => prev + 1);
        setLastUpdated('B');
        setTimeout(() => setLastUpdated(null), 500);
      }
      
      setTeamAnswers({ 
        A: teamAFinalAnswer, 
        B: teamBFinalAnswer 
      });
      setSubmittedStatus({ 
        A: teamAFinalAnswer !== null, 
        B: teamBFinalAnswer !== null 
      });
      
    } catch (error) {
      console.error('Error in fetchTeamAnswers:', error);
    }
  };

  const getMostCommonAnswer = (answers) => {
    if (!answers || answers.length === 0) return null;
    
    const validAnswers = answers.filter(a => a && a.trim());
    if (validAnswers.length === 0) return null;
    
    const frequency = {};
    validAnswers.forEach(answer => {
      const normalized = answer.trim().toLowerCase();
      frequency[normalized] = (frequency[normalized] || 0) + 1;
    });
    
    let mostCommon = null;
    let maxCount = 0;
    
    for (const [answer, count] of Object.entries(frequency)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = answer;
      }
    }
    
    const originalAnswer = validAnswers.find(a => a.trim().toLowerCase() === mostCommon);
    return originalAnswer || mostCommon;
  };

  // ============================================================
  // FETCH READY STATUS FROM SUPABASE
  // ============================================================
  const fetchReadyStatus = async () => {
    try {
      const { data: allReadyStatuses, error } = await supabase
        .from('student_ready_status')
        .select('*')
        .eq('class_id', classId);
      
      if (error) throw error;
      
      const readyStatuses = allReadyStatuses?.filter(rs => rs.is_ready === true) || [];
      
      const teamAReady = [];
      const teamBReady = [];
      
      teamA.forEach(student => {
        const isReady = readyStatuses?.some(rs => rs.student_id === student.id);
        if (isReady) teamAReady.push(student.id);
      });
      
      teamB.forEach(student => {
        const isReady = readyStatuses?.some(rs => rs.student_id === student.id);
        if (isReady) teamBReady.push(student.id);
      });
      
      setTeamAReadyStudents(teamAReady);
      setTeamBReadyStudents(teamBReady);
      
      console.log('Team A ready:', teamAReady.length, '/', teamA.length);
      console.log('Team B ready:', teamBReady.length, '/', teamB.length);
    } catch (error) {
      console.error('Error fetching ready status:', error);
    }
  };

  useEffect(() => {
    const clearOldReadyStatuses = async () => {
      console.log('Clearing old ready statuses for class:', classId);
      const { error } = await supabase
        .from('student_ready_status')
        .delete()
        .eq('class_id', classId);
      
      if (error) {
        console.error('Error clearing old ready statuses:', error);
      } else {
        console.log('Cleared old ready statuses successfully');
      }
    };
    
    clearOldReadyStatuses();
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    
    fetchReadyStatus();
    
    const subscription = supabase
      .channel('student_ready_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_ready_status',
          filter: `class_id=eq.${classId}`
        },
        (payload) => {
          console.log('🔔 Ready status changed:', payload);
          fetchReadyStatus();
        }
      )
      .subscribe();
    
    readinessSubscriptionRef.current = subscription;
    
    const interval = setInterval(fetchReadyStatus, 3000);
    
    return () => {
      if (readinessSubscriptionRef.current) {
        supabase.removeChannel(readinessSubscriptionRef.current);
      }
      clearInterval(interval);
    };
  }, [classId, teamA, teamB]);

  const allTeamAReady = teamA.length > 0 && teamAReadyStudents.length === teamA.length;
  const allTeamBReady = teamB.length > 0 && teamBReadyStudents.length === teamB.length;
  const allTeamsReady = allTeamAReady && allTeamBReady;

  useEffect(() => {
    setCanStartRound(allTeamsReady);
  }, [allTeamsReady]);

  const handleStartRound = () => {
    if (!canStartRound) {
      if (!allTeamAReady && teamA.length > 0) {
        alert(`Team A: ${teamAReadyStudents.length}/${teamA.length} members ready. Please wait for all team members to click "I'm Ready".`);
      } else if (!allTeamBReady && teamB.length > 0) {
        alert(`Team B: ${teamBReadyStudents.length}/${teamB.length} members ready. Please wait for all team members to click "I'm Ready".`);
      } else {
        alert('Please wait for all team members to click "I\'m Ready" before starting the round.');
      }
      return;
    }
    setReadyCountdown(3);
  };

  useEffect(() => {
    if (readyCountdown === null) return;
    if (readyCountdown > 0) {
      const timer = setTimeout(() => setReadyCountdown(readyCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (readyCountdown === 0) {
      startGameRound();
      setReadyCountdown(null);
    }
  }, [readyCountdown]);

  // ============================================================
  // START GAME ROUND
  // ============================================================
  const startGameRound = async () => {
    setError(null);
    
    try {
      const roundStartTime = new Date().toISOString();
      
      console.log('Starting round with class ID:', classId);
      
      const { data, error } = await supabase
        .from('game_sessions')
        .insert([{
          class_id: classId,
          current_round: 1,
          current_question: {
            text: question.text,
            answer: question.answer,
            explanation: question.explanation,
            timeLimit: 20,
            started_at: roundStartTime
          },
          team_answers: {},
          status: 'active',
          started_at: roundStartTime,
          updated_at: roundStartTime
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      if (!data || !data.id) {
        throw new Error('Failed to create game session');
      }
      
      console.log('✅ Game session created:', data.id);
      
      setSessionId(data.id);
      setIsReadyPhase(false);
      setIsActive(true);
      setTimeLeft(20);
      
      startTimer(20, data.id, roundStartTime);
      
      const { error: deleteError } = await supabase
        .from('student_ready_status')
        .delete()
        .eq('class_id', classId);
      
      if (deleteError) {
        console.error('Error clearing ready statuses:', deleteError);
      } else {
        console.log('Cleared all ready statuses after round start');
      }
      
      setupAnswerListeners(data.id);
      
    } catch (error) {
      console.error('Error starting game round:', error);
      setError(error.message);
      alert(`Failed to start round: ${error.message}. Please try again.`);
    }
  };

  const setupAnswerListeners = (sessionIdParam) => {
    console.log(`🔔 Setting up answer listeners for session ${sessionIdParam}`);
    
    fetchTeamAnswers();
    
    if (answerPollIntervalRef.current) {
      clearInterval(answerPollIntervalRef.current);
    }
    answerPollIntervalRef.current = setInterval(() => {
      if (isActive) {
        fetchTeamAnswers();
      }
    }, 2000);
    
    if (answersSubscriptionRef.current) {
      supabase.removeChannel(answersSubscriptionRef.current);
    }
    
    const subscription = supabase
      .channel(`answers_${sessionIdParam}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_answers',
          filter: `session_id=eq.${sessionIdParam}`
        },
        (payload) => {
          console.log('🔔 NEW ANSWER INSERTED!', payload);
          fetchTeamAnswers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_answers',
          filter: `session_id=eq.${sessionIdParam}`
        },
        (payload) => {
          console.log('🔔 ANSWER UPDATED!', payload);
          fetchTeamAnswers();
        }
      )
      .subscribe((status) => {
        console.log(`📡 Answer subscription status: ${status}`);
      });
    
    answersSubscriptionRef.current = subscription;
  };

  const startTimer = (duration, sessionIdParam, roundStartTime) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    let timeRemaining = duration;
    if (roundStartTime) {
      const startTime = new Date(roundStartTime).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      timeRemaining = Math.max(0, duration - elapsedSeconds);
    }
    
    setTimeLeft(timeRemaining);
    
    if (timeRemaining <= 0) {
      endRound();
      return;
    }
    
    const interval = setInterval(() => {
      if (timeRemaining > 0) {
        timeRemaining--;
        setTimeLeft(timeRemaining);
      }
      
      if (timeRemaining <= 0) {
        clearInterval(interval);
        timerIntervalRef.current = null;
        endRound();
      }
    }, 1000);
    
    timerIntervalRef.current = interval;
  };

  const endRound = async () => {
    if (!isActive && roundEnded) return;
    
    console.log('🏁 Ending round...');
    
    await fetchTeamAnswers();
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (answerPollIntervalRef.current) {
      clearInterval(answerPollIntervalRef.current);
      answerPollIntervalRef.current = null;
    }
    
    if (answersSubscriptionRef.current) {
      supabase.removeChannel(answersSubscriptionRef.current);
      answersSubscriptionRef.current = null;
    }
    
    setIsActive(false);
    setRoundEnded(true);
    
    const teamAResult = getTeamResult('A');
    const teamBResult = getTeamResult('B');
    
    console.log('Final Team A result:', teamAResult);
    console.log('Final Team B result:', teamBResult);
    
    if (sessionId) {
      try {
        await supabase
          .from('game_sessions')
          .update({ 
            status: 'completed', 
            updated_at: new Date().toISOString(),
            round_results: {
              A: { correct: teamAResult.correct, answer: teamAnswers.A },
              B: { correct: teamBResult.correct, answer: teamAnswers.B }
            }
          })
          .eq('id', sessionId);
        console.log('Game session updated with results');
      } catch (error) {
        console.error('Error updating game session:', error);
      }
    }
  };

  const checkAnswer = (answer) => {
    if (!answer) return null;
    const normalizedAnswer = answer.trim().toLowerCase().replace(/\s/g, '');
    const normalizedCorrect = question.answer.toLowerCase().replace(/\s/g, '');
    return normalizedAnswer === normalizedCorrect;
  };

  const getTeamResult = (team) => {
    const answer = teamAnswers[team];
    if (!answer) return { correct: false, answer: null };
    return { correct: checkAnswer(answer), answer: answer };
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (answerPollIntervalRef.current) {
        clearInterval(answerPollIntervalRef.current);
      }
      if (answersSubscriptionRef.current) {
        supabase.removeChannel(answersSubscriptionRef.current);
      }
    };
  }, []);

  const awardTeamPoints = async (team, points) => {
    if (points <= 0) {
      setShowSuccessMessage({ team, message: 'Please enter a valid point value (greater than 0)' });
      setTimeout(() => setShowSuccessMessage(null), 3000);
      return;
    }
    
    if (teamPointsAwarded[team]) {
      setShowSuccessMessage({ team, message: `Team ${team} has already received points for this round!` });
      setTimeout(() => setShowSuccessMessage(null), 3000);
      return;
    }
    
    const students = team === 'A' ? teamA : teamB;
    
    if (students.length === 0) {
      setShowSuccessMessage({ team, message: `Team ${team} has no members to award points to!` });
      setTimeout(() => setShowSuccessMessage(null), 3000);
      return;
    }
    
    try {
      console.log(`🎯 Awarding ${points} points to each member of Team ${team}`);
      
      for (const student of students) {
        const { data: existing } = await supabase
          .from('student_points')
          .select('points')
          .eq('student_id', student.id)
          .eq('class_id', classId)
          .maybeSingle();
        
        const currentPoints = existing?.points || 0;
        const newPoints = currentPoints + points;
        
        const { error: upsertError } = await supabase
          .from('student_points')
          .upsert({
            student_id: student.id,
            class_id: classId,
            points: newPoints,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'student_id,class_id'
          });
        
        if (upsertError) throw upsertError;
      }
      
      setTeamPointsAwarded(prev => ({ ...prev, [team]: true }));
      setShowSuccessMessage({ team, message: `✓ Team ${team} awarded ${points} points to each member!` });
      
      if (onPointsAwarded) {
        await onPointsAwarded();
      }
      
      setTimeout(() => setShowSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Error awarding points:', error);
      setShowSuccessMessage({ team, message: `Error: ${error.message || 'Failed to award points'}` });
      setTimeout(() => setShowSuccessMessage(null), 3000);
    }
  };

  const goToPointsPhase = () => setPointsPhase(true);
  const isTeacher = true;

  const renderAnswerDisplay = (team) => {
    const hasAnswer = submittedStatus[team];
    const answer = teamAnswers[team];
    const isRoundEnded = roundEnded;
    const isRoundActive = isActive;
    const isHighlighted = lastUpdated === team;
    
    if (hasAnswer && answer) {
      return (
        <div className={isHighlighted ? 'answer-updated' : ''} style={styles.answerContent}>
          <span style={styles.answerText}>"{answer}"</span>
          {isRoundEnded && (
            getTeamResult(team).correct ? 
              <FiCheckCircle style={styles.correctIcon} /> : 
              <FiXCircle style={styles.incorrectIcon} />
          )}
        </div>
      );
    } else if (isRoundActive) {
      return (
        <div style={styles.waitingAnswer}>
          <FiAlertCircle size={16} />
          <span>Waiting for answers from team members...</span>
        </div>
      );
    } else if (isRoundEnded) {
      return (
        <div style={styles.waitingAnswer}>
          <FiXCircle size={16} color="#ef4444" />
          <span>No answers submitted</span>
        </div>
      );
    } else {
      return (
        <div style={styles.waitingAnswer}>
          <FiAlertCircle size={16} />
          <span>Waiting for answers...</span>
        </div>
      );
    }
  };

  const renderStudentAnswers = (team) => {
    const answers = studentAnswers[team];
    const teamMembersList = team === 'A' ? teamA : teamB;
    const submittedCount = answers.length;
    const totalCount = teamMembersList?.length || 0;
    
    const submittedMap = new Map();
    answers.forEach(answer => {
      submittedMap.set(answer.studentId, answer);
    });
    
    const allStudents = teamMembersList.map(member => {
      const submitted = submittedMap.get(member.id);
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        answer: submitted?.answer || null,
        submittedAt: submitted?.submittedAt || null,
        hasSubmitted: !!submitted
      };
    });
    
    if (allStudents.length === 0) {
      return (
        <div style={styles.noAnswersMessage}>
          <FiAlertCircle size={14} />
          <span>No team members assigned yet</span>
        </div>
      );
    }
    
    return (
      <div style={styles.studentAnswersList}>
        <div style={styles.submissionStats}>
          <FiUsers size={14} />
          <span>{submittedCount}/{totalCount} students have submitted answers</span>
        </div>
        {allStudents.map((student) => {
          const isCorrect = student.answer ? checkAnswer(student.answer) : false;
          return (
            <div key={student.id} style={student.hasSubmitted ? styles.studentAnswerItem : styles.studentAnswerItemMissing}>
              <div style={styles.studentAnswerHeader}>
                <span style={styles.studentName}>
                  {student.name}
                  {student.role && <span style={styles.studentRoleBadge}>({student.role})</span>}
                </span>
                {student.hasSubmitted ? (
                  <span style={styles.submittedBadge}>✅ Submitted</span>
                ) : (
                  <span style={styles.notSubmittedBadge}>⏳ Not Submitted</span>
                )}
              </div>
              {student.hasSubmitted ? (
                <div style={styles.studentAnswerContent}>
                  <span style={styles.studentAnswerText}>"{student.answer}"</span>
                  {!isActive && roundEnded && (
                    isCorrect ? 
                      <FiCheckCircle size={16} color="#10b981" /> : 
                      <FiXCircle size={16} color="#ef4444" />
                  )}
                </div>
              ) : (
                <div style={styles.studentAnswerMissing}>
                  <FiAlertCircle size={12} color="#9ca3af" />
                  <span>No answer yet</span>
                </div>
              )}
              {student.submittedAt && (
                <div style={styles.submittedTime}>
                  Submitted: {new Date(student.submittedAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getSubmissionStats = () => {
    const teamASubmitted = studentAnswers.A.length;
    const teamBSubmitted = studentAnswers.B.length;
    const teamATotal = teamA?.length || 0;
    const teamBTotal = teamB?.length || 0;
    
    return {
      teamA: { submitted: teamASubmitted, total: teamATotal, percentage: teamATotal > 0 ? (teamASubmitted / teamATotal) * 100 : 0 },
      teamB: { submitted: teamBSubmitted, total: teamBTotal, percentage: teamBTotal > 0 ? (teamBSubmitted / teamBTotal) * 100 : 0 }
    };
  };

  const stats = getSubmissionStats();

  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchTeamAnswers();
  };

  return (
    <>
      <style>{animationStyles}</style>
      <div style={styles.modalOverlay} onClick={(roundEnded && !pointsPhase) ? onClose : undefined}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.header}>
            <h2 style={styles.title}>🎯 Live Math Challenge</h2>
            <h3 style={styles.className}>{className || 'Class'}</h3>
            {!roundEnded && isTeacher && isActive && (
              <>
                <button style={styles.refreshButton} onClick={handleManualRefresh}>
                  <FiRefreshCw size={16} /> Refresh Answers
                </button>
                <button style={styles.endEarlyButton} onClick={endRound}>End Round Early</button>
              </>
            )}
            <button style={styles.closeButton} onClick={onClose}>×</button>
          </div>

          {isReadyPhase && (
            <div style={styles.readyPhaseContainer}>
              <h3 style={styles.readyTitle}>🎮 Getting Teams Ready</h3>
              <p style={styles.readySubtitle}>Waiting for all team members to confirm they're ready...</p>
              
              <div style={styles.teamsReadyContainer}>
                <div style={styles.teamReadyCardA}>
                  <div style={styles.teamReadyHeaderA}>
                    <FiUsers size={24} />
                    <h3>Team A</h3>
                    <span style={styles.memberCount}>{teamAReadyStudents.length}/{teamA.length} Ready</span>
                  </div>
                  <div style={styles.readyStatus}>
                    {allTeamAReady ? (
                      <div style={styles.readyStatusReady}><FiCheckCircle size={24} color="#10b981" /><span>All Ready!</span></div>
                    ) : (
                      <div style={styles.readyStatusWaiting}><FiAlertCircle size={24} color="#f59e0b" /><span>Waiting for {teamA.length - teamAReadyStudents.length} more...</span></div>
                    )}
                  </div>
                  <div style={styles.teamMembersReadyList}>
                    <strong>Team Members:</strong>
                    {teamA.map(student => {
                      const isReady = teamAReadyStudents.includes(student.id);
                      return (
                        <div key={student.id} style={styles.memberReadyItem}>
                          <span>{student.name}</span>
                          <span style={isReady ? styles.readyBadge : styles.notReadyBadge}>
                            {isReady ? '✅ Ready' : '⏳ Not Ready'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={styles.teamReadyCardB}>
                  <div style={styles.teamReadyHeaderB}>
                    <FiUsers size={24} />
                    <h3>Team B</h3>
                    <span style={styles.memberCount}>{teamBReadyStudents.length}/{teamB.length} Ready</span>
                  </div>
                  <div style={styles.readyStatus}>
                    {allTeamBReady ? (
                      <div style={styles.readyStatusReady}><FiCheckCircle size={24} color="#10b981" /><span>All Ready!</span></div>
                    ) : (
                      <div style={styles.readyStatusWaiting}><FiAlertCircle size={24} color="#f59e0b" /><span>Waiting for {teamB.length - teamBReadyStudents.length} more...</span></div>
                    )}
                  </div>
                  <div style={styles.teamMembersReadyList}>
                    <strong>Team Members:</strong>
                    {teamB.map(student => {
                      const isReady = teamBReadyStudents.includes(student.id);
                      return (
                        <div key={student.id} style={styles.memberReadyItem}>
                          <span>{student.name}</span>
                          <span style={isReady ? styles.readyBadge : styles.notReadyBadge}>
                            {isReady ? '✅ Ready' : '⏳ Not Ready'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {!canStartRound && (
                <div style={styles.waitingInfo}>
                  <FiAlertCircle size={20} color="#f59e0b" />
                  <p>
                    {!allTeamAReady && teamA.length > 0 && !allTeamBReady && teamB.length > 0 && "Waiting for both teams..."}
                    {!allTeamAReady && teamA.length > 0 && allTeamBReady && "Waiting for Team A members to click 'I'm Ready'..."}
                    {allTeamAReady && !allTeamBReady && teamB.length > 0 && "Waiting for Team B members to click 'I'm Ready'..."}
                  </p>
                </div>
              )}

              {canStartRound && readyCountdown === null && (
                <div style={styles.allReadyInfo}>
                  <FiCheckCircle size={20} color="#10b981" />
                  <p>All teams are ready! Click "Start Round" to begin.</p>
                  <button style={styles.startRoundButton} onClick={handleStartRound}>Start Round</button>
                </div>
              )}

              {readyCountdown !== null && (
                <div style={styles.countdownContainer}>
                  <div style={styles.countdownNumber}>{readyCountdown}</div>
                  <p>Round starting soon!</p>
                </div>
              )}
            </div>
          )}

          {!isReadyPhase && (
            <>
              <div style={styles.timerSection}>
                <div style={styles.timerCircle}>
                  <FiClock size={40} color={timeLeft < 5 ? '#ef4444' : '#3b82f6'} />
                  <div style={styles.timerText}>
                    <span style={styles.timerNumber}>{timeLeft}</span>
                    <span style={styles.timerLabel}>seconds left</span>
                  </div>
                </div>
                <div style={styles.timerBar}>
                  <div style={{...styles.timerProgress, width: `${(timeLeft / 20) * 100}%`, backgroundColor: timeLeft < 5 ? '#ef4444' : '#10b981'}} />
                </div>
                <div style={styles.timerStatus}>
                  {isActive ? '⏱️ Round in progress...' : '🏁 Round ended!'}
                </div>
              </div>

              <div style={styles.questionCard}>
                <h3 style={styles.questionTitle}>📝 Question</h3>
                <p style={styles.questionText}>{question?.text || 'Loading...'}</p>
                {roundEnded && (
                  <div style={styles.correctAnswerBox}>
                    <strong>✅ Correct Answer:</strong> {question?.answer || 'N/A'}
                  </div>
                )}
              </div>
            </>
          )}

          {isTeacher && !isReadyPhase && (
            <div style={styles.teamsContainer}>
              <div style={styles.teamCardA}>
                <div style={styles.teamHeaderA}>
                  <FiUsers size={24} />
                  <h3 style={styles.teamTitle}>Team A</h3>
                  <div style={styles.teamStats}>
                    <span style={styles.memberCount}>{teamA?.length || 0} members</span>
                    <span style={styles.submissionCount}>
                      {stats.teamA.submitted}/{stats.teamA.total} submitted
                    </span>
                  </div>
                </div>
                
                <div style={styles.answerSection}>
                  <div style={styles.answerLabel}>
                    🏆 Team Answer (Majority Vote)
                    {isActive && stats.teamA.submitted > 0 && (
                      <span style={styles.liveBadge}>LIVE</span>
                    )}
                  </div>
                  <div style={styles.answerDisplay}>
                    {renderAnswerDisplay('A')}
                  </div>
                  {isActive && stats.teamA.submitted > 0 && (
                    <div style={styles.majorityInfo}>
                      Based on {stats.teamA.submitted} student answer{stats.teamA.submitted !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                <div style={styles.individualAnswersSection}>
                  <div style={styles.individualAnswersHeader}>
                    <FiUsers size={16} />
                    <span>Individual Student Answers</span>
                    <span style={styles.answerCount}>
                      {studentAnswers.A.length}/{teamA?.length || 0} submitted
                    </span>
                  </div>
                  {renderStudentAnswers('A')}
                </div>

                <div style={styles.membersList}>
                  <strong>👥 Team Members:</strong>
                  {teamA?.map(student => (
                    <div key={student.id} style={styles.memberItem}>
                      <span>{student.name}</span>
                      <span style={styles.roleBadge(student.role)}>{student.role || 'member'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.teamCardB}>
                <div style={styles.teamHeaderB}>
                  <FiUsers size={24} />
                  <h3 style={styles.teamTitle}>Team B</h3>
                  <div style={styles.teamStats}>
                    <span style={styles.memberCount}>{teamB?.length || 0} members</span>
                    <span style={styles.submissionCount}>
                      {stats.teamB.submitted}/{stats.teamB.total} submitted
                    </span>
                  </div>
                </div>
                
                <div style={styles.answerSection}>
                  <div style={styles.answerLabel}>
                    🏆 Team Answer (Majority Vote)
                    {isActive && stats.teamB.submitted > 0 && (
                      <span style={styles.liveBadge}>LIVE</span>
                    )}
                  </div>
                  <div style={styles.answerDisplay}>
                    {renderAnswerDisplay('B')}
                  </div>
                  {isActive && stats.teamB.submitted > 0 && (
                    <div style={styles.majorityInfo}>
                      Based on {stats.teamB.submitted} student answer{stats.teamB.submitted !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                <div style={styles.individualAnswersSection}>
                  <div style={styles.individualAnswersHeader}>
                    <FiUsers size={16} />
                    <span>Individual Student Answers</span>
                    <span style={styles.answerCount}>
                      {studentAnswers.B.length}/{teamB?.length || 0} submitted
                    </span>
                  </div>
                  {renderStudentAnswers('B')}
                </div>

                <div style={styles.membersList}>
                  <strong>👥 Team Members:</strong>
                  {teamB?.map(student => (
                    <div key={student.id} style={styles.memberItem}>
                      <span>{student.name}</span>
                      <span style={styles.roleBadge(student.role)}>{student.role || 'member'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isTeacher && roundEnded && !pointsPhase && (
            <div style={styles.summaryCard}>
              <h3>🏆 Round Summary</h3>
              <div style={styles.summaryGrid}>
                <div style={styles.summaryItem}>
                  <strong>Team A:</strong> 
                  <span style={getTeamResult('A').correct ? styles.correctText : styles.incorrectText}>
                    {getTeamResult('A').correct ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                  {submittedStatus.A && <div style={styles.summaryAnswer}>Team Answer: {teamAnswers.A}</div>}
                  {!submittedStatus.A && <div style={styles.summaryAnswer}>❌ No team answer</div>}
                  <div style={styles.summarySubsection}>
                    <strong>Individual Answers:</strong>
                    {studentAnswers.A.map((ans, idx) => (
                      <div key={idx} style={styles.summaryIndividualAnswer}>
                        • {ans.name}: "{ans.answer}" {checkAnswer(ans.answer) ? '✓' : '✗'}
                      </div>
                    ))}
                    {teamA?.filter(member => !studentAnswers.A.some(a => a.studentId === member.id)).map((member, idx) => (
                      <div key={`missing-${idx}`} style={styles.summaryIndividualAnswerMissing}>
                        • {member.name}: ❌ No answer submitted
                      </div>
                    ))}
                  </div>
                </div>
                <div style={styles.summaryItem}>
                  <strong>Team B:</strong> 
                  <span style={getTeamResult('B').correct ? styles.correctText : styles.incorrectText}>
                    {getTeamResult('B').correct ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                  {submittedStatus.B && <div style={styles.summaryAnswer}>Team Answer: {teamAnswers.B}</div>}
                  {!submittedStatus.B && <div style={styles.summaryAnswer}>❌ No team answer</div>}
                  <div style={styles.summarySubsection}>
                    <strong>Individual Answers:</strong>
                    {studentAnswers.B.map((ans, idx) => (
                      <div key={idx} style={styles.summaryIndividualAnswer}>
                        • {ans.name}: "{ans.answer}" {checkAnswer(ans.answer) ? '✓' : '✗'}
                      </div>
                    ))}
                    {teamB?.filter(member => !studentAnswers.B.some(a => a.studentId === member.id)).map((member, idx) => (
                      <div key={`missing-${idx}`} style={styles.summaryIndividualAnswerMissing}>
                        • {member.name}: ❌ No answer submitted
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={styles.explanationBox}>
                <strong>📖 Solution Explanation:</strong>
                <p style={styles.explanationText}>{question.explanation}</p>
              </div>
              <button style={styles.awardPointsButton} onClick={goToPointsPhase}>
                <FiAward size={20} /> Award Points to Teams
              </button>
            </div>
          )}

          {pointsPhase && (
            <div style={styles.pointsPhaseContainer}>
              <div style={styles.pointsHeader}>
                <FiAward size={32} color="#f59e0b" />
                <h2 style={styles.pointsTitle}>Award Points</h2>
                <p style={styles.pointsSubtitle}>Give points to teams. Each team member will receive the same points!</p>
              </div>

              <div style={styles.pointsTeamsContainer}>
                <div style={teamPointsAwarded.A ? styles.pointsCardAAwarded : styles.pointsCardA}>
                  <div style={styles.pointsCardHeader}>
                    <div style={styles.teamIconWrapperA}><FiUsers size={28} /></div>
                    <div>
                      <h3 style={styles.pointsTeamTitle}>Team A</h3>
                      <span style={styles.pointsMemberCount}>{teamA?.length || 0} members</span>
                    </div>
                    {teamPointsAwarded.A && <div style={styles.awardedBadge}><FiCheckCircle size={16} /> Points Awarded</div>}
                  </div>
                  <div style={styles.pointsDisplay}>
                    <div style={styles.pointsInfo}>
                      <div style={styles.pointsLabel}>Points per member:</div>
                      {teamPointsAwarded.A ? (
                        <div style={styles.pointsValueAwarded}><FiStar size={24} color="#f59e0b" /><span>{teamPoints.A} point{teamPoints.A !== 1 ? 's' : ''}</span></div>
                      ) : (
                        <div style={styles.pointsInputWrapper}>
                          <button style={styles.pointsAdjustBtn} onClick={() => setTeamPoints(prev => ({ ...prev, A: Math.max(0, prev.A - 1) }))}><FiMinus size={16} /></button>
                          <input type="number" min="0" value={teamPoints.A} onChange={(e) => setTeamPoints(prev => ({ ...prev, A: Math.max(0, parseInt(e.target.value) || 0) }))} style={styles.pointsInput} />
                          <button style={styles.pointsAdjustBtn} onClick={() => setTeamPoints(prev => ({ ...prev, A: prev.A + 1 }))}><FiPlus size={16} /></button>
                        </div>
                      )}
                    </div>
                    <div style={styles.totalPointsInfo}>
                      <span>Total points awarded:</span>
                      <strong>{teamPointsAwarded.A ? teamPoints.A * (teamA?.length || 0) : 0}</strong>
                      <span style={styles.pointsBreakdown}>({teamPoints.A} × {teamA?.length || 0} members)</span>
                    </div>
                  </div>
                  {!teamPointsAwarded.A && (teamA?.length || 0) > 0 && (
                    <button style={styles.awardTeamButton} onClick={() => awardTeamPoints('A', teamPoints.A)}>
                      <FiSend size={18} /> Award {teamPoints.A} Point{teamPoints.A !== 1 ? 's' : ''} to Team A
                    </button>
                  )}
                  {teamPointsAwarded.A && (
                    <div style={styles.membersPointsSummary}>
                      <strong>📊 Points awarded to:</strong>
                      <div style={styles.membersPointsList}>
                        {teamA?.map(student => (
                          <div key={student.id} style={styles.memberPointsItem}>
                            <span>{student.name}</span>
                            <span style={styles.memberPointsValue}>+{teamPoints.A} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={teamPointsAwarded.B ? styles.pointsCardBAwarded : styles.pointsCardB}>
                  <div style={styles.pointsCardHeader}>
                    <div style={styles.teamIconWrapperB}><FiUsers size={28} /></div>
                    <div>
                      <h3 style={styles.pointsTeamTitle}>Team B</h3>
                      <span style={styles.pointsMemberCount}>{teamB?.length || 0} members</span>
                    </div>
                    {teamPointsAwarded.B && <div style={styles.awardedBadge}><FiCheckCircle size={16} /> Points Awarded</div>}
                  </div>
                  <div style={styles.pointsDisplay}>
                    <div style={styles.pointsInfo}>
                      <div style={styles.pointsLabel}>Points per member:</div>
                      {teamPointsAwarded.B ? (
                        <div style={styles.pointsValueAwarded}><FiStar size={24} color="#f59e0b" /><span>{teamPoints.B} point{teamPoints.B !== 1 ? 's' : ''}</span></div>
                      ) : (
                        <div style={styles.pointsInputWrapper}>
                          <button style={styles.pointsAdjustBtn} onClick={() => setTeamPoints(prev => ({ ...prev, B: Math.max(0, prev.B - 1) }))}><FiMinus size={16} /></button>
                          <input type="number" min="0" value={teamPoints.B} onChange={(e) => setTeamPoints(prev => ({ ...prev, B: Math.max(0, parseInt(e.target.value) || 0) }))} style={styles.pointsInput} />
                          <button style={styles.pointsAdjustBtn} onClick={() => setTeamPoints(prev => ({ ...prev, B: prev.B + 1 }))}><FiPlus size={16} /></button>
                        </div>
                      )}
                    </div>
                    <div style={styles.totalPointsInfo}>
                      <span>Total points awarded:</span>
                      <strong>{teamPointsAwarded.B ? teamPoints.B * (teamB?.length || 0) : 0}</strong>
                      <span style={styles.pointsBreakdown}>({teamPoints.B} × {teamB?.length || 0} members)</span>
                    </div>
                  </div>
                  {!teamPointsAwarded.B && (teamB?.length || 0) > 0 && (
                    <button style={styles.awardTeamButton} onClick={() => awardTeamPoints('B', teamPoints.B)}>
                      <FiSend size={18} /> Award {teamPoints.B} Point{teamPoints.B !== 1 ? 's' : ''} to Team B
                    </button>
                  )}
                  {teamPointsAwarded.B && (
                    <div style={styles.membersPointsSummary}>
                      <strong>📊 Points awarded to:</strong>
                      <div style={styles.membersPointsList}>
                        {teamB?.map(student => (
                          <div key={student.id} style={styles.memberPointsItem}>
                            <span>{student.name}</span>
                            <span style={styles.memberPointsValue}>+{teamPoints.B} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {showSuccessMessage && (
                <div style={showSuccessMessage.team === 'A' ? styles.successMessageA : styles.successMessageB}>
                  <FiCheckCircle size={20} />
                  <span>{showSuccessMessage.message}</span>
                </div>
              )}

              <div style={styles.pointsActions}>
                <button style={styles.backToSummaryButton} onClick={() => setPointsPhase(false)}>Back to Summary</button>
                <button style={styles.finishRoundButton} onClick={onClose}><FiCheckCircle size={18} /> Finish Round</button>
              </div>
            </div>
          )}

          <div style={styles.buttonContainer}>
            <button style={styles.closeButtonMain} onClick={onClose}>{roundEnded ? 'Close Round' : 'Exit'}</button>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  modalOverlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 1000, 
    overflow: 'auto', 
    padding: '20px' 
  },
  modal: { 
    backgroundColor: 'white', 
    borderRadius: '20px', 
    padding: '30px', 
    width: '90%', 
    maxWidth: '1400px', 
    maxHeight: '90vh', 
    overflowY: 'auto', 
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)' 
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '24px', 
    gap: '16px', 
    flexWrap: 'wrap' 
  },
  title: { 
    fontSize: '24px', 
    fontWeight: '700', 
    color: '#1f2937', 
    margin: 0 
  },
  className: { 
    fontSize: '18px', 
    color: '#6b7280', 
    margin: 0 
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  endEarlyButton: { 
    padding: '8px 16px', 
    backgroundColor: '#ef4444', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    fontSize: '14px', 
    fontWeight: '500', 
    cursor: 'pointer' 
  },
  closeButton: { 
    background: 'none', 
    border: 'none', 
    fontSize: '32px', 
    cursor: 'pointer', 
    color: '#6b7280', 
    padding: '0 8px' 
  },
  readyPhaseContainer: { 
    padding: '20px', 
    backgroundColor: '#f0fdf4', 
    borderRadius: '16px', 
    marginBottom: '20px', 
    border: '2px solid #bbf7d0' 
  },
  readyTitle: { 
    fontSize: '24px', 
    fontWeight: '700', 
    color: '#166534', 
    textAlign: 'center', 
    marginBottom: '8px' 
  },
  readySubtitle: { 
    textAlign: 'center', 
    color: '#15803d', 
    marginBottom: '24px' 
  },
  teamsReadyContainer: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '24px', 
    marginBottom: '24px' 
  },
  teamReadyCardA: { 
    backgroundColor: '#eff6ff', 
    borderRadius: '16px', 
    padding: '20px', 
    border: '2px solid #bfdbfe' 
  },
  teamReadyCardB: { 
    backgroundColor: '#fce7f3', 
    borderRadius: '16px', 
    padding: '20px', 
    border: '2px solid #fbcfe8' 
  },
  teamReadyHeaderA: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    marginBottom: '16px', 
    paddingBottom: '12px', 
    borderBottom: '2px solid #bfdbfe' 
  },
  teamReadyHeaderB: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    marginBottom: '16px', 
    paddingBottom: '12px', 
    borderBottom: '2px solid #fbcfe8' 
  },
  memberCount: { 
    fontSize: '12px', 
    color: '#6b7280', 
    backgroundColor: 'white', 
    padding: '4px 8px', 
    borderRadius: '20px' 
  },
  readyStatus: { 
    textAlign: 'center', 
    padding: '16px', 
    backgroundColor: 'white', 
    borderRadius: '12px', 
    marginBottom: '16px' 
  },
  readyStatusReady: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px', 
    color: '#10b981', 
    fontWeight: '600' 
  },
  readyStatusWaiting: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px', 
    color: '#f59e0b', 
    fontWeight: '600' 
  },
  teamMembersReadyList: { 
    marginTop: '12px' 
  },
  memberReadyItem: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '8px 0', 
    fontSize: '13px', 
    borderBottom: '1px solid #e5e7eb' 
  },
  readyBadge: { 
    padding: '2px 8px', 
    borderRadius: '12px', 
    fontSize: '11px', 
    fontWeight: '500', 
    backgroundColor: '#d1fae5', 
    color: '#065f46' 
  },
  notReadyBadge: { 
    padding: '2px 8px', 
    borderRadius: '12px', 
    fontSize: '11px', 
    fontWeight: '500', 
    backgroundColor: '#fee2e2', 
    color: '#991b1b' 
  },
  startRoundButton: { 
    marginTop: '16px', 
    padding: '12px 24px', 
    backgroundColor: '#10b981', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    fontSize: '18px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: '8px' 
  },
  countdownContainer: { 
    textAlign: 'center', 
    padding: '20px', 
    backgroundColor: '#1e293b', 
    borderRadius: '12px', 
    marginTop: '16px' 
  },
  countdownNumber: { 
    fontSize: '64px', 
    fontWeight: 'bold', 
    color: '#fbbf24', 
    fontFamily: 'monospace' 
  },
  waitingInfo: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px', 
    padding: '12px', 
    backgroundColor: '#fef3c7', 
    borderRadius: '8px', 
    color: '#92400e', 
    marginTop: '16px' 
  },
  allReadyInfo: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '12px', 
    padding: '16px', 
    backgroundColor: '#d1fae5', 
    borderRadius: '8px', 
    color: '#065f46', 
    marginTop: '16px', 
    flexDirection: 'column' 
  },
  timerSection: { 
    textAlign: 'center', 
    marginBottom: '30px', 
    padding: '20px', 
    backgroundColor: '#f9fafb', 
    borderRadius: '16px' 
  },
  timerCircle: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: '12px', 
    marginBottom: '16px' 
  },
  timerText: { 
    textAlign: 'center' 
  },
  timerNumber: { 
    fontSize: '48px', 
    fontWeight: 'bold', 
    fontFamily: 'monospace', 
    display: 'block', 
    color: '#1f2937' 
  },
  timerLabel: { 
    fontSize: '14px', 
    color: '#6b7280' 
  },
  timerBar: { 
    width: '100%', 
    height: '10px', 
    backgroundColor: '#e5e7eb', 
    borderRadius: '5px', 
    overflow: 'hidden', 
    marginBottom: '12px' 
  },
  timerProgress: { 
    height: '100%', 
    transition: 'width 1s linear', 
    borderRadius: '5px' 
  },
  timerStatus: { 
    fontSize: '14px', 
    fontWeight: '500', 
    color: '#6b7280' 
  },
  questionCard: { 
    backgroundColor: '#f3f4f6', 
    padding: '20px', 
    borderRadius: '12px', 
    marginBottom: '30px' 
  },
  questionTitle: { 
    fontSize: '18px', 
    fontWeight: '600', 
    marginBottom: '12px', 
    color: '#374151' 
  },
  questionText: { 
    fontSize: '20px', 
    fontWeight: '500', 
    color: '#1f2937', 
    margin: '0 0 16px 0' 
  },
  correctAnswerBox: { 
    backgroundColor: '#d1fae5', 
    padding: '12px', 
    borderRadius: '8px', 
    color: '#065f46', 
    marginTop: '12px' 
  },
  teamsContainer: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '24px', 
    marginBottom: '30px' 
  },
  teamCardA: { 
    backgroundColor: '#eff6ff', 
    borderRadius: '16px', 
    padding: '20px', 
    border: '2px solid #bfdbfe' 
  },
  teamCardB: { 
    backgroundColor: '#fce7f3', 
    borderRadius: '16px', 
    padding: '20px', 
    border: '2px solid #fbcfe8' 
  },
  teamHeaderA: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    gap: '12px', 
    marginBottom: '20px', 
    paddingBottom: '12px', 
    borderBottom: '2px solid #bfdbfe',
    flexWrap: 'wrap'
  },
  teamHeaderB: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    gap: '12px', 
    marginBottom: '20px', 
    paddingBottom: '12px', 
    borderBottom: '2px solid #fbcfe8',
    flexWrap: 'wrap'
  },
  teamTitle: { 
    fontSize: '20px', 
    fontWeight: '600', 
    margin: 0 
  },
  teamStats: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  submissionCount: {
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: 'white',
    padding: '4px 8px',
    borderRadius: '20px'
  },
  answerSection: { 
    marginBottom: '20px' 
  },
  answerLabel: { 
    fontSize: '14px', 
    fontWeight: '500', 
    marginBottom: '8px', 
    color: '#4b5563',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  liveBadge: {
    fontSize: '10px',
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '10px',
    animation: 'pulse 1s infinite'
  },
  answerDisplay: { 
    backgroundColor: 'white', 
    padding: '16px', 
    borderRadius: '10px', 
    marginBottom: '12px', 
    minHeight: '70px' 
  },
  answerContent: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    gap: '12px' 
  },
  answerText: { 
    fontSize: '16px', 
    fontWeight: '500', 
    color: '#1f2937', 
    flex: 1, 
    wordBreak: 'break-all' 
  },
  waitingAnswer: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    color: '#9ca3af', 
    fontStyle: 'italic' 
  },
  correctIcon: { 
    color: '#10b981', 
    fontSize: '24px' 
  },
  incorrectIcon: { 
    color: '#ef4444', 
    fontSize: '24px' 
  },
  majorityInfo: {
    fontSize: '11px',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: '8px'
  },
  individualAnswersSection: { 
    marginTop: '20px', 
    marginBottom: '20px', 
    padding: '12px', 
    backgroundColor: 'rgba(255,255,255,0.5)', 
    borderRadius: '10px' 
  },
  individualAnswersHeader: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    marginBottom: '12px', 
    paddingBottom: '8px', 
    borderBottom: '1px solid #e5e7eb', 
    fontSize: '14px', 
    fontWeight: '500', 
    color: '#4b5563' 
  },
  answerCount: { 
    marginLeft: 'auto', 
    fontSize: '12px', 
    backgroundColor: '#e5e7eb', 
    padding: '2px 8px', 
    borderRadius: '12px' 
  },
  studentAnswersList: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px' 
  },
  submissionStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#166534',
    marginBottom: '8px'
  },
  studentAnswerItem: { 
    backgroundColor: 'white', 
    padding: '10px', 
    borderRadius: '8px', 
    border: '1px solid #e5e7eb' 
  },
  studentAnswerItemMissing: { 
    backgroundColor: '#fef2f2', 
    padding: '10px', 
    borderRadius: '8px', 
    border: '1px solid #fecaca' 
  },
  studentAnswerHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '6px' 
  },
  studentName: { 
    fontSize: '13px', 
    fontWeight: '600', 
    color: '#1f2937' 
  },
  studentRoleBadge: {
    fontSize: '10px',
    fontWeight: 'normal',
    color: '#6b7280',
    marginLeft: '6px'
  },
  submittedBadge: {
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '10px',
    backgroundColor: '#d1fae5',
    color: '#065f46'
  },
  notSubmittedBadge: {
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '10px',
    backgroundColor: '#fee2e2',
    color: '#991b1b'
  },
  studentAnswerContent: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    gap: '8px' 
  },
  studentAnswerText: { 
    fontSize: '13px', 
    color: '#374151', 
    fontFamily: 'monospace', 
    flex: 1 
  },
  studentAnswerMissing: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#9ca3af',
    fontSize: '12px',
    fontStyle: 'italic'
  },
  submittedTime: { 
    fontSize: '10px', 
    color: '#9ca3af', 
    marginTop: '4px' 
  },
  noAnswersMessage: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px', 
    padding: '12px', 
    backgroundColor: '#f9fafb', 
    borderRadius: '8px', 
    color: '#9ca3af', 
    fontSize: '13px', 
    fontStyle: 'italic' 
  },
  membersList: { 
    marginTop: '16px', 
    paddingTop: '16px', 
    borderTop: '1px solid #e5e7eb' 
  },
  memberItem: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '8px 0', 
    fontSize: '14px', 
    borderBottom: '1px solid #f3f4f6' 
  },
  roleBadge: (role) => ({ 
    padding: '2px 8px', 
    borderRadius: '10px', 
    fontSize: '11px', 
    fontWeight: '500', 
    backgroundColor: role === 'analyzer' ? '#ede9fe' : role === 'checker' ? '#fed7aa' : '#d1fae5', 
    color: role === 'analyzer' ? '#6d28d9' : role === 'checker' ? '#92400e' : '#065f46' 
  }),
  summaryCard: { 
    backgroundColor: '#fef3c7', 
    padding: '20px', 
    borderRadius: '12px', 
    marginBottom: '20px' 
  },
  summaryGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '16px', 
    marginTop: '16px', 
    marginBottom: '16px' 
  },
  summaryItem: { 
    padding: '12px', 
    backgroundColor: 'white', 
    borderRadius: '8px' 
  },
  summaryAnswer: { 
    fontSize: '12px', 
    color: '#6b7280', 
    marginTop: '4px' 
  },
  summarySubsection: { 
    marginTop: '8px', 
    paddingTop: '8px', 
    borderTop: '1px solid #e5e7eb', 
    fontSize: '12px' 
  },
  summaryIndividualAnswer: { 
    marginTop: '4px', 
    marginLeft: '8px', 
    fontSize: '11px', 
    color: '#4b5563' 
  },
  summaryIndividualAnswerMissing: { 
    marginTop: '4px', 
    marginLeft: '8px', 
    fontSize: '11px', 
    color: '#dc2626' 
  },
  correctText: { 
    color: '#10b981', 
    fontWeight: '600', 
    marginLeft: '8px' 
  },
  incorrectText: { 
    color: '#ef4444', 
    fontWeight: '600', 
    marginLeft: '8px' 
  },
  explanationBox: { 
    marginTop: '16px', 
    padding: '16px', 
    backgroundColor: 'white', 
    borderRadius: '8px' 
  },
  explanationText: { 
    marginTop: '8px', 
    lineHeight: '1.6', 
    whiteSpace: 'pre-line' 
  },
  awardPointsButton: { 
    width: '100%', 
    marginTop: '16px', 
    padding: '12px', 
    backgroundColor: '#f59e0b', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    fontSize: '16px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px' 
  },
  pointsPhaseContainer: { 
    marginTop: '20px' 
  },
  pointsHeader: { 
    textAlign: 'center', 
    marginBottom: '30px' 
  },
  pointsTitle: { 
    fontSize: '28px', 
    fontWeight: '700', 
    color: '#1f2937', 
    marginTop: '12px', 
    marginBottom: '8px' 
  },
  pointsSubtitle: { 
    color: '#6b7280', 
    fontSize: '14px' 
  },
  pointsTeamsContainer: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '24px', 
    marginBottom: '30px' 
  },
  pointsCardA: { 
    backgroundColor: '#eff6ff', 
    borderRadius: '20px', 
    padding: '24px', 
    border: '2px solid #bfdbfe', 
    transition: 'all 0.3s' 
  },
  pointsCardAAwarded: { 
    backgroundColor: '#eff6ff', 
    borderRadius: '20px', 
    padding: '24px', 
    border: '2px solid #bfdbfe', 
    opacity: 0.85 
  },
  pointsCardB: { 
    backgroundColor: '#fce7f3', 
    borderRadius: '20px', 
    padding: '24px', 
    border: '2px solid #fbcfe8', 
    transition: 'all 0.3s' 
  },
  pointsCardBAwarded: { 
    backgroundColor: '#fce7f3', 
    borderRadius: '20px', 
    padding: '24px', 
    border: '2px solid #fbcfe8', 
    opacity: 0.85 
  },
  pointsCardHeader: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px', 
    marginBottom: '24px', 
    paddingBottom: '16px', 
    borderBottom: '1px solid #e5e7eb' 
  },
  teamIconWrapperA: { 
    backgroundColor: '#dbeafe', 
    padding: '12px', 
    borderRadius: '12px', 
    color: '#2563eb' 
  },
  teamIconWrapperB: { 
    backgroundColor: '#fce7f3', 
    padding: '12px', 
    borderRadius: '12px', 
    color: '#db2777' 
  },
  pointsTeamTitle: { 
    fontSize: '22px', 
    fontWeight: '700', 
    margin: 0, 
    color: '#1f2937' 
  },
  pointsMemberCount: { 
    fontSize: '12px', 
    color: '#6b7280' 
  },
  awardedBadge: { 
    marginLeft: 'auto', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px', 
    backgroundColor: '#10b981', 
    color: 'white', 
    padding: '6px 12px', 
    borderRadius: '20px', 
    fontSize: '12px', 
    fontWeight: '500' 
  },
  pointsDisplay: { 
    marginBottom: '24px' 
  },
  pointsInfo: { 
    marginBottom: '16px' 
  },
  pointsLabel: { 
    fontSize: '14px', 
    color: '#6b7280', 
    marginBottom: '8px' 
  },
  pointsValueAwarded: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    fontSize: '24px', 
    fontWeight: '700', 
    color: '#f59e0b' 
  },
  pointsInputWrapper: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px' 
  },
  pointsAdjustBtn: { 
    width: '36px', 
    height: '36px', 
    borderRadius: '8px', 
    border: '1px solid #d1d5db', 
    backgroundColor: 'white', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  pointsInput: { 
    width: '80px', 
    height: '48px', 
    textAlign: 'center', 
    fontSize: '20px', 
    fontWeight: '600', 
    border: '2px solid #e5e7eb', 
    borderRadius: '10px', 
    padding: '0 8px' 
  },
  totalPointsInfo: { 
    backgroundColor: 'white', 
    padding: '12px', 
    borderRadius: '8px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    fontSize: '14px' 
  },
  pointsBreakdown: { 
    fontSize: '12px', 
    color: '#9ca3af' 
  },
  awardTeamButton: { 
    width: '100%', 
    padding: '12px', 
    backgroundColor: '#10b981', 
    color: 'white', 
    border: 'none', 
    borderRadius: '10px', 
    fontSize: '16px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px' 
  },
  membersPointsSummary: { 
    marginTop: '20px', 
    paddingTop: '16px', 
    borderTop: '1px solid #e5e7eb' 
  },
  membersPointsList: { 
    marginTop: '12px' 
  },
  memberPointsItem: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '8px 0', 
    fontSize: '14px', 
    borderBottom: '1px solid #f3f4f6' 
  },
  memberPointsValue: { 
    fontWeight: '600', 
    color: '#10b981' 
  },
  successMessageA: { 
    position: 'fixed', 
    top: '20px', 
    left: '50%', 
    transform: 'translateX(-50%)', 
    backgroundColor: '#dbeafe', 
    color: '#1e40af', 
    padding: '12px 24px', 
    borderRadius: '12px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    fontSize: '14px', 
    fontWeight: '500', 
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
    zIndex: 2000, 
    border: '2px solid #bfdbfe', 
    animation: 'slideDown 0.3s ease-out' 
  },
  successMessageB: { 
    position: 'fixed', 
    top: '20px', 
    left: '50%', 
    transform: 'translateX(-50%)', 
    backgroundColor: '#fce7f3', 
    color: '#9d174d', 
    padding: '12px 24px', 
    borderRadius: '12px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    fontSize: '14px', 
    fontWeight: '500', 
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
    zIndex: 2000, 
    border: '2px solid #fbcfe8', 
    animation: 'slideDown 0.3s ease-out' 
  },
  pointsActions: { 
    display: 'flex', 
    justifyContent: 'center', 
    gap: '16px', 
    marginTop: '20px' 
  },
  backToSummaryButton: { 
    padding: '12px 24px', 
    backgroundColor: '#6b7280', 
    color: 'white', 
    border: 'none', 
    borderRadius: '10px', 
    fontSize: '14px', 
    fontWeight: '500', 
    cursor: 'pointer' 
  },
  finishRoundButton: { 
    padding: '12px 32px', 
    backgroundColor: '#3b82f6', 
    color: 'white', 
    border: 'none', 
    borderRadius: '10px', 
    fontSize: '14px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px' 
  },
  buttonContainer: { 
    display: 'flex', 
    justifyContent: 'center', 
    gap: '16px', 
    marginTop: '20px' 
  },
  closeButtonMain: { 
    padding: '12px 32px', 
    backgroundColor: '#3b82f6', 
    color: 'white', 
    border: 'none', 
    borderRadius: '10px', 
    fontSize: '16px', 
    fontWeight: '600', 
    cursor: 'pointer' 
  }
};

export default StartRound;