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

  /* Mobile Responsive Styles */
  @media (max-width: 768px) {
    .modal {
      padding: 16px !important;
      width: 95% !important;
    }
    .teams-container {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
    .teams-ready-container {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
    .summary-grid {
      grid-template-columns: 1fr !important;
    }
    .points-teams-container {
      grid-template-columns: 1fr !important;
    }
    .header {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
    .team-header-a, .team-header-b {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
    .team-stats {
      flex-wrap: wrap !important;
    }
    .student-answer-header {
      flex-wrap: wrap !important;
      gap: 8px !important;
    }
    .points-card-header {
      flex-wrap: wrap !important;
    }
    .awarded-badge {
      margin-left: 0 !important;
    }
    .points-input-wrapper {
      flex-wrap: wrap !important;
    }
    .points-actions {
      flex-direction: column !important;
    }
    .points-actions button {
      width: 100% !important;
    }
  }

  @media (max-width: 480px) {
    .timer-number {
      font-size: 32px !important;
    }
    .question-text {
      font-size: 16px !important;
    }
    .team-title {
      font-size: 16px !important;
    }
    .points-team-title {
      font-size: 18px !important;
    }
    .member-item {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 6px !important;
    }
    .student-answer-content {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
    .answer-content {
      flex-direction: column !important;
      text-align: center !important;
    }
  }

  @media (max-width: 320px) {
    .modal {
      padding: 12px !important;
    }
    .timer-number {
      font-size: 28px !important;
    }
    .points-input {
      width: 60px !important;
      font-size: 16px !important;
    }
    .points-adjust-btn {
      width: 30px !important;
      height: 30px !important;
    }
    .member-count, .submission-count {
      font-size: 10px !important;
    }
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const timerIntervalRef = useRef(null);
  const readinessSubscriptionRef = useRef(null);
  const answersSubscriptionRef = useRef(null);
  const answerPollIntervalRef = useRef(null);
  
  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const question = {
    text: "Find the equation of the line passing through (1, 2) and (5, 10)",
    answer: "y = 2x",
    explanation: "Step 1: Calculate slope (m) = (y2 - y1)/(x2 - x1) = (10 - 2)/(5 - 1) = 8/4 = 2\nStep 2: Use point-slope form: y - y1 = m(x - x1)\nStep 3: y - 2 = 2(x - 1)\nStep 4: y - 2 = 2x - 2\nStep 5: y = 2x"
  };

  // ============================================================
  // FETCH STUDENT ANSWERS FOR A SPECIFIC SESSION
  // ============================================================
  const fetchStudentAnswers = async (sessionIdParam) => {
    if (!sessionIdParam) {
      console.log('No session ID provided');
      return [];
    }
    
    try {
      const { data: answers, error } = await supabase
        .from('student_answers')
        .select(`
          id,
          student_id,
          answer,
          created_at,
          updated_at,
          students (
            id,
            name,
            user_id
          )
        `)
        .eq('session_id', sessionIdParam)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching student answers:', error);
        return [];
      }
      
      console.log(`Fetched ${answers?.length || 0} answers for session ${sessionIdParam}`);
      return answers || [];
    } catch (error) {
      console.error('Error in fetchStudentAnswers:', error);
      return [];
    }
  };

  // ============================================================
  // GET TEAM ASSIGNMENTS FOR ALL STUDENTS
  // ============================================================
  const getTeamAssignments = async () => {
    try {
      const { data: assignments, error } = await supabase
        .from('team_assignments')
        .select('student_id, team, role')
        .eq('class_id', classId);
      
      if (error) {
        console.error('Error fetching team assignments:', error);
        return {};
      }
      
      const teamMap = {};
      assignments?.forEach(assignment => {
        teamMap[assignment.student_id] = {
          team: assignment.team,
          role: assignment.role
        };
      });
      
      console.log('Team assignments map:', teamMap);
      return teamMap;
    } catch (error) {
      console.error('Error in getTeamAssignments:', error);
      return {};
    }
  };

  // ============================================================
  // PROCESS ANSWERS BY TEAM
  // ============================================================
  const processAnswersByTeam = (answers, teamAssignments) => {
    const teamAAnswers = [];
    const teamBAnswers = [];
    const unassignedAnswers = [];
    
    answers?.forEach(answer => {
      const assignment = teamAssignments[answer.student_id];
      const studentName = answer.students?.name || 'Unknown Student';
      
      const answerData = {
        id: answer.id,
        studentId: answer.student_id,
        studentName: studentName,
        answer: answer.answer,
        submittedAt: answer.created_at,
        updatedAt: answer.updated_at
      };
      
      if (assignment?.team === 'A') {
        teamAAnswers.push(answerData);
        console.log(`Team A answer from ${studentName}: "${answer.answer}"`);
      } else if (assignment?.team === 'B') {
        teamBAnswers.push(answerData);
        console.log(`Team B answer from ${studentName}: "${answer.answer}"`);
      } else {
        unassignedAnswers.push(answerData);
        console.warn(`Unassigned student ${studentName} submitted answer: "${answer.answer}"`);
      }
    });
    
    return { teamAAnswers, teamBAnswers, unassignedAnswers };
  };

  // ============================================================
  // GET MOST COMMON ANSWER (MAJORITY VOTE)
  // ============================================================
  const getMajorityAnswer = (answers) => {
    if (!answers || answers.length === 0) return null;
    
    const validAnswers = answers.filter(a => a.answer && a.answer.trim());
    if (validAnswers.length === 0) return null;
    
    const frequency = {};
    validAnswers.forEach(item => {
      const normalizedAnswer = item.answer.trim().toLowerCase();
      frequency[normalizedAnswer] = (frequency[normalizedAnswer] || 0) + 1;
    });
    
    let maxCount = 0;
    let majorityAnswer = null;
    
    for (const [answer, count] of Object.entries(frequency)) {
      if (count > maxCount) {
        maxCount = count;
        majorityAnswer = answer;
      }
    }
    
    const originalAnswer = validAnswers.find(
      a => a.answer.trim().toLowerCase() === majorityAnswer
    );
    
    return originalAnswer ? originalAnswer.answer : majorityAnswer;
  };

  // ============================================================
  // FETCH AND PROCESS ALL ANSWERS FOR CURRENT SESSION
  // ============================================================
  const fetchAndProcessAnswers = async () => {
    if (!sessionId) {
      console.log('No active session ID, skipping answer fetch');
      return;
    }
    
    try {
      console.log(`📡 Fetching answers for session: ${sessionId}`);
      
      const answers = await fetchStudentAnswers(sessionId);
      const teamAssignments = await getTeamAssignments();
      const { teamAAnswers, teamBAnswers, unassignedAnswers } = processAnswersByTeam(answers, teamAssignments);
      
      if (unassignedAnswers.length > 0) {
        console.warn(`⚠️ ${unassignedAnswers.length} answers from unassigned students`);
      }
      
      setStudentAnswers({
        A: teamAAnswers,
        B: teamBAnswers
      });
      
      const teamAMajorityAnswer = getMajorityAnswer(teamAAnswers);
      const teamBMajorityAnswer = getMajorityAnswer(teamBAnswers);
      
      console.log(`🏆 Team A majority answer: "${teamAMajorityAnswer}" (from ${teamAAnswers.length} students)`);
      console.log(`🏆 Team B majority answer: "${teamBMajorityAnswer}" (from ${teamBAnswers.length} students)`);
      
      const previousTeamA = teamAnswers.A;
      const previousTeamB = teamAnswers.B;
      
      if (previousTeamA !== teamAMajorityAnswer) {
        setAnswerUpdateTrigger(prev => prev + 1);
        setLastUpdated('A');
        setTimeout(() => setLastUpdated(null), 500);
      }
      
      if (previousTeamB !== teamBMajorityAnswer) {
        setAnswerUpdateTrigger(prev => prev + 1);
        setLastUpdated('B');
        setTimeout(() => setLastUpdated(null), 500);
      }
      
      setTeamAnswers({
        A: teamAMajorityAnswer,
        B: teamBMajorityAnswer
      });
      
      setSubmittedStatus({
        A: teamAMajorityAnswer !== null,
        B: teamBMajorityAnswer !== null
      });
      
      console.log('✅ Answers processed successfully');
      
    } catch (error) {
      console.error('Error in fetchAndProcessAnswers:', error);
    }
  };

  // ============================================================
  // AUTO-ASSIGN UNASSIGNED STUDENTS TO TEAMS
  // ============================================================
  const autoAssignTeams = async () => {
    try {
      console.log('🔄 Auto-assigning teams for class:', classId);
      
      const { data: classStudents, error: classError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId);
      
      if (classError) {
        console.error('Error fetching class students:', classError);
        return;
      }
      
      if (!classStudents || classStudents.length === 0) {
        console.log('No students found in this class');
        return;
      }
      
      const { data: existingAssignments, error: existingError } = await supabase
        .from('team_assignments')
        .select('student_id')
        .eq('class_id', classId);
      
      if (existingError) {
        console.error('Error fetching existing assignments:', existingError);
        return;
      }
      
      const existingIds = new Set(existingAssignments?.map(a => a.student_id) || []);
      const unassignedStudents = classStudents.filter(cs => !existingIds.has(cs.student_id));
      
      if (unassignedStudents.length === 0) {
        console.log('All students already have team assignments');
        return;
      }
      
      console.log(`Found ${unassignedStudents.length} unassigned students`);
      
      const newAssignments = unassignedStudents.map((student, index) => ({
        student_id: student.student_id,
        class_id: classId,
        team: index % 2 === 0 ? 'A' : 'B',
        role: index % 3 === 0 ? 'analyzer' : index % 3 === 1 ? 'solver' : 'checker',
        updated_at: new Date().toISOString()
      }));
      
      const { error: insertError } = await supabase
        .from('team_assignments')
        .insert(newAssignments);
      
      if (insertError) {
        console.error('Error inserting assignments:', insertError);
        return;
      }
      
      console.log(`✅ Auto-assigned ${newAssignments.length} students to teams`);
      
      if (onPointsAwarded) {
        await onPointsAwarded();
      }
      
    } catch (error) {
      console.error('Error in autoAssignTeams:', error);
    }
  };

  // ============================================================
  // CLEAN UP OLD GAME SESSIONS
  // ============================================================
  const cleanupOldGameSessions = async () => {
    try {
      console.log('🧹 Cleaning up old game sessions for class:', classId);
      
      const { data: existingSessions, error: fetchError } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('class_id', classId)
        .in('status', ['active', 'pending']);
      
      if (fetchError) {
        console.error('Error fetching old sessions:', fetchError);
        return;
      }
      
      if (existingSessions && existingSessions.length > 0) {
        console.log(`Found ${existingSessions.length} old sessions to clean up`);
        
        for (const session of existingSessions) {
          const { error: deleteAnswersError } = await supabase
            .from('student_answers')
            .delete()
            .eq('session_id', session.id);
          
          if (deleteAnswersError) {
            console.error(`Error deleting answers for session ${session.id}:`, deleteAnswersError);
          }
        }
        
        const { error: deleteError } = await supabase
          .from('game_sessions')
          .delete()
          .eq('class_id', classId)
          .in('status', ['active', 'pending']);
        
        if (deleteError) {
          console.error('Error deleting old sessions:', deleteError);
        } else {
          console.log('✅ Old game sessions cleaned up');
        }
      }
    } catch (error) {
      console.error('Error cleaning up:', error);
    }
  };

  // ============================================================
  // CREATE GAME SESSION
  // ============================================================
  const createGameSession = async () => {
    const roundStartTime = new Date().toISOString();
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
    
    if (error) {
      console.error('Error creating game session:', error);
      throw error;
    }
    console.log('✅ New game session created:', data.id);
    return { id: data.id };
  };

  // ============================================================
  // UPDATE GAME SESSION
  // ============================================================
  const updateGameSession = async (sessionIdParam, updates) => {
    try {
      await supabase
        .from('game_sessions')
        .update(updates)
        .eq('id', sessionIdParam);
    } catch (error) {
      console.error('Error updating game session:', error);
    }
  };

  // ============================================================
  // FETCH READY STATUS
  // ============================================================
  const fetchReadyStatus = async () => {
    try {
      const { data: allReadyStatuses, error } = await supabase
        .from('student_ready_status')
        .select('*')
        .eq('class_id', classId);
      
      if (error) throw error;
      
      const teamAReady = [];
      const teamBReady = [];
      
      teamA.forEach(student => {
        const isReady = allReadyStatuses?.some(rs => rs.student_id === student.id && rs.is_ready);
        if (isReady) teamAReady.push(student.id);
      });
      
      teamB.forEach(student => {
        const isReady = allReadyStatuses?.some(rs => rs.student_id === student.id && rs.is_ready);
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
      .channel(`ready_${classId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'student_ready_status', 
        filter: `class_id=eq.${classId}` 
      }, () => {
        console.log('🔔 Ready status changed');
        fetchReadyStatus();
      })
      .subscribe();
    
    const interval = setInterval(fetchReadyStatus, 3000);
    
    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [classId, teamA, teamB]);

  const allTeamAReady = teamA.length > 0 && teamAReadyStudents.length === teamA.length;
  const allTeamBReady = teamB.length > 0 && teamBReadyStudents.length === teamB.length;
  const allTeamsReady = (teamA.length === 0 || allTeamAReady) && (teamB.length === 0 || allTeamBReady);

  useEffect(() => {
    setCanStartRound(allTeamsReady);
  }, [allTeamsReady]);

  const handleStartRound = () => {
    if (!canStartRound) {
      if (teamA.length > 0 && !allTeamAReady) {
        alert(`Team A: ${teamAReadyStudents.length}/${teamA.length} members ready. Please wait for all team members to click "I'm Ready".`);
      } else if (teamB.length > 0 && !allTeamBReady) {
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
    }
    startGameRound();
    setReadyCountdown(null);
  }, [readyCountdown]);

  // ============================================================
  // START GAME ROUND
  // ============================================================
  const startGameRound = async () => {
    setError(null);
    try {
      console.log('Step 1: Auto-assigning teams...');
      await autoAssignTeams();
      
      console.log('Step 2: Cleaning up old sessions...');
      await cleanupOldGameSessions();
      
      console.log('Step 3: Creating new game session...');
      const { id: newSessionId } = await createGameSession();
      
      setSessionId(newSessionId);
      setIsReadyPhase(false);
      setIsActive(true);
      setTimeLeft(20);
      
      startTimer(20, newSessionId, new Date().toISOString());
      
      await supabase.from('student_ready_status').delete().eq('class_id', classId);
      
      setupAnswerListeners(newSessionId);
      
      setTimeout(() => fetchAndProcessAnswers(), 500);
      
      console.log('✅ Round started successfully!');
      
    } catch (error) {
      console.error('Error starting game round:', error);
      setError(error.message);
      alert(`Failed to start round: ${error.message}`);
    }
  };

  const setupAnswerListeners = (sessionIdParam) => {
    console.log(`🔔 Setting up answer listeners for session ${sessionIdParam}`);
    
    fetchAndProcessAnswers();
    
    if (answerPollIntervalRef.current) clearInterval(answerPollIntervalRef.current);
    answerPollIntervalRef.current = setInterval(() => {
      if (isActive && sessionIdParam) {
        console.log('🔄 Polling for answers...');
        fetchAndProcessAnswers();
      }
    }, 2000);
    
    if (answersSubscriptionRef.current) supabase.removeChannel(answersSubscriptionRef.current);
    
    const subscription = supabase
      .channel(`answers_${sessionIdParam}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'student_answers', 
        filter: `session_id=eq.${sessionIdParam}` 
      }, (payload) => {
        console.log('🔔 New answer submitted!', payload.new);
        fetchAndProcessAnswers();
      })
      .subscribe();
    
    answersSubscriptionRef.current = subscription;
  };

  const startTimer = (duration, sessionIdParam, roundStartTime) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    let timeRemaining = duration;
    if (roundStartTime) {
      const elapsed = Math.floor((new Date() - new Date(roundStartTime)) / 1000);
      timeRemaining = Math.max(0, duration - elapsed);
    }
    setTimeLeft(timeRemaining);
    if (timeRemaining <= 0) { 
      endRound(); 
      return; 
    }
    
    timerIntervalRef.current = setInterval(() => {
      if (timeRemaining > 0) {
        timeRemaining--;
        setTimeLeft(timeRemaining);
      }
      if (timeRemaining <= 0) {
        clearInterval(timerIntervalRef.current);
        endRound();
      }
    }, 1000);
  };

  const endRound = async () => {
    if (!isActive && roundEnded) return;
    console.log('🏁 Ending round...');
    
    await fetchAndProcessAnswers();
    
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (answerPollIntervalRef.current) clearInterval(answerPollIntervalRef.current);
    if (answersSubscriptionRef.current) supabase.removeChannel(answersSubscriptionRef.current);
    
    setIsActive(false);
    setRoundEnded(true);
    
    const teamAResult = { correct: checkAnswer(teamAnswers.A), answer: teamAnswers.A };
    const teamBResult = { correct: checkAnswer(teamAnswers.B), answer: teamAnswers.B };
    
    if (sessionId) {
      await updateGameSession(sessionId, { 
        status: 'completed', 
        updated_at: new Date().toISOString(),
        round_results: { A: teamAResult, B: teamBResult }
      });
      console.log('Game session updated with results');
    }
  };

  const checkAnswer = (answer) => {
    if (!answer) return false;
    return answer.trim().toLowerCase().replace(/\s/g, '') === question.answer.toLowerCase().replace(/\s/g, '');
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (answerPollIntervalRef.current) clearInterval(answerPollIntervalRef.current);
      if (answersSubscriptionRef.current) supabase.removeChannel(answersSubscriptionRef.current);
    };
  }, []);

  const awardTeamPoints = async (team, points) => {
    if (points <= 0) {
      setShowSuccessMessage({ team, message: 'Please enter a valid point value' });
      setTimeout(() => setShowSuccessMessage(null), 3000);
      return;
    }
    if (teamPointsAwarded[team]) {
      setShowSuccessMessage({ team, message: `Team ${team} already received points!` });
      setTimeout(() => setShowSuccessMessage(null), 3000);
      return;
    }
    
    const students = team === 'A' ? teamA : teamB;
    if (!students || students.length === 0) {
      setShowSuccessMessage({ team, message: `Team ${team} has no members` });
      setTimeout(() => setShowSuccessMessage(null), 3000);
      return;
    }
    
    try {
      for (const student of students) {
        const { data: existing } = await supabase
          .from('student_points')
          .select('points')
          .eq('student_id', student.id)
          .eq('class_id', classId)
          .maybeSingle();
        
        await supabase
          .from('student_points')
          .upsert({
            student_id: student.id,
            class_id: classId,
            points: (existing?.points || 0) + points,
            updated_at: new Date().toISOString()
          }, { onConflict: 'student_id,class_id' });
      }
      setTeamPointsAwarded(prev => ({ ...prev, [team]: true }));
      setShowSuccessMessage({ team, message: `✓ Team ${team} awarded ${points} points to each member!` });
      if (onPointsAwarded) await onPointsAwarded();
      setTimeout(() => setShowSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Error awarding points:', error);
      setShowSuccessMessage({ team, message: `Error: ${error.message}` });
      setTimeout(() => setShowSuccessMessage(null), 3000);
    }
  };

  const goToPointsPhase = () => setPointsPhase(true);
  const isTeacher = true;

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================
  const renderAnswerDisplay = (team) => {
    const hasAnswer = submittedStatus[team];
    const answer = teamAnswers[team];
    const isHighlighted = lastUpdated === team;
    
    if (hasAnswer && answer) {
      return (
        <div className={isHighlighted ? 'answer-updated' : ''} style={styles.answerContent}>
          <span style={styles.answerText}>"{answer}"</span>
          {roundEnded && (checkAnswer(answer) ? <FiCheckCircle style={styles.correctIcon} /> : <FiXCircle style={styles.incorrectIcon} />)}
        </div>
      );
    }
    return <div style={styles.waitingAnswer}><FiAlertCircle size={16} /><span>{isActive ? 'Waiting for answers...' : 'No answers submitted'}</span></div>;
  };

  const renderStudentAnswers = (team) => {
    const answers = studentAnswers[team];
    const teamMembersList = team === 'A' ? teamA : teamB;
    
    if (!teamMembersList || teamMembersList.length === 0) {
      return (
        <div style={styles.noAnswersMessage}>
          <FiAlertCircle size={14} />
          <span>No team members assigned yet</span>
        </div>
      );
    }
    
    const answerMap = new Map();
    answers.forEach(answer => {
      answerMap.set(answer.studentId, answer);
    });
    
    const allStudents = teamMembersList.map(member => {
      const answer = answerMap.get(member.id);
      return {
        id: member.id,
        name: member.name,
        answer: answer?.answer || null,
        submittedAt: answer?.submittedAt || null,
        hasSubmitted: !!answer
      };
    });
    
    const submittedCount = answers.length;
    const totalCount = teamMembersList.length;
    
    return (
      <div style={styles.studentAnswersList}>
        <div style={styles.submissionStats}>
          <FiUsers size={isMobile ? 12 : 14} />
          <span style={{ fontWeight: 'bold' }}>{submittedCount}/{totalCount} students have submitted answers</span>
        </div>
        {allStudents.map((student) => {
          const isCorrect = student.answer ? checkAnswer(student.answer) : false;
          return (
            <div 
              key={student.id} 
              style={student.hasSubmitted ? styles.studentAnswerItem : styles.studentAnswerItemMissing}
            >
              <div style={styles.studentAnswerHeader}>
                <span style={styles.studentName}>
                  {student.name}
                  {student.hasSubmitted && <span style={{ color: '#10b981', marginLeft: '4px' }}>✓</span>}
                </span>
                {!isMobile && (student.hasSubmitted ? (
                  <span style={styles.submittedBadge}>✅ Submitted</span>
                ) : (
                  <span style={styles.notSubmittedBadge}>⏳ Not Submitted</span>
                ))}
              </div>
              {student.hasSubmitted ? (
                <div style={styles.studentAnswerContent}>
                  <span style={styles.studentAnswerText}>"{student.answer}"</span>
                  {roundEnded && (
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
              {student.submittedAt && !isMobile && (
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

  const stats = {
    teamA: { submitted: studentAnswers.A.length, total: teamA?.length || 0 },
    teamB: { submitted: studentAnswers.B.length, total: teamB?.length || 0 }
  };

  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchAndProcessAnswers();
  };

  return (
    <>
      <style>{animationStyles}</style>
      <div style={styles.modalOverlay} onClick={(roundEnded && !pointsPhase) ? onClose : undefined}>
        <div style={styles.modal} className="modal" onClick={(e) => e.stopPropagation()}>
          <div style={styles.header} className="header">
            <h2 style={styles.title}>🎯 Live Math Challenge</h2>
            <h3 style={styles.className}>{className || 'Class'}</h3>
            {!roundEnded && isActive && (
              <>
                <button style={styles.refreshButton} onClick={handleManualRefresh}>
                  <FiRefreshCw size={isMobile ? 12 : 16} /> {!isMobile && "Refresh Answers"}
                </button>
                <button style={styles.endEarlyButton} onClick={endRound}>End Round Early</button>
              </>
            )}
            <button style={styles.closeButton} onClick={onClose}>×</button>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <FiAlertCircle size={20} />
              <div><strong>Error:</strong> {error}</div>
            </div>
          )}

          {isReadyPhase ? (
            <div style={styles.readyPhaseContainer}>
              <h3 style={styles.readyTitle}>🎮 Getting Teams Ready</h3>
              <p style={styles.readySubtitle}>Waiting for all team members to confirm they're ready...</p>
              
              <div style={styles.teamsReadyContainer} className="teams-ready-container">
                <div style={styles.teamReadyCardA}>
                  <div style={styles.teamReadyHeaderA}>
                    <FiUsers size={isMobile ? 20 : 24} />
                    <h3>Team A</h3>
                    <span style={styles.memberCount}>{teamAReadyStudents.length}/{teamA.length} Ready</span>
                  </div>
                  <div style={styles.readyStatus}>
                    {allTeamAReady ? (
                      <div style={styles.readyStatusReady}><FiCheckCircle size={isMobile ? 20 : 24} color="#10b981" /><span>All Ready!</span></div>
                    ) : (
                      <div style={styles.readyStatusWaiting}><FiAlertCircle size={isMobile ? 20 : 24} color="#f59e0b" /><span>Waiting for {teamA.length - teamAReadyStudents.length} more...</span></div>
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
                    <FiUsers size={isMobile ? 20 : 24} />
                    <h3>Team B</h3>
                    <span style={styles.memberCount}>{teamBReadyStudents.length}/{teamB.length} Ready</span>
                  </div>
                  <div style={styles.readyStatus}>
                    {allTeamBReady ? (
                      <div style={styles.readyStatusReady}><FiCheckCircle size={isMobile ? 20 : 24} color="#10b981" /><span>All Ready!</span></div>
                    ) : (
                      <div style={styles.readyStatusWaiting}><FiAlertCircle size={isMobile ? 20 : 24} color="#f59e0b" /><span>Waiting for {teamB.length - teamBReadyStudents.length} more...</span></div>
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
                    {teamA.length > 0 && !allTeamAReady && teamB.length > 0 && !allTeamBReady && "Waiting for both teams..."}
                    {teamA.length > 0 && !allTeamAReady && (teamB.length === 0 || allTeamBReady) && "Waiting for Team A members to click 'I'm Ready'..."}
                    {(teamA.length === 0 || allTeamAReady) && teamB.length > 0 && !allTeamBReady && "Waiting for Team B members to click 'I'm Ready'..."}
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
          ) : (
            <>
              <div style={styles.timerSection}>
                <div style={styles.timerCircle}>
                  <FiClock size={isMobile ? 32 : 40} color={timeLeft < 5 ? '#ef4444' : '#3b82f6'} />
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
                <p style={styles.questionText}>{question.text}</p>
                {roundEnded && (
                  <div style={styles.correctAnswerBox}>
                    <strong>✅ Correct Answer:</strong> {question.answer}
                  </div>
                )}
              </div>
            </>
          )}

          {!isReadyPhase && (
            <div style={styles.teamsContainer} className="teams-container">
              {/* Team A Column */}
              <div style={styles.teamCardA}>
                <div style={styles.teamHeaderA} className="team-header-a">
                  <FiUsers size={isMobile ? 20 : 24} />
                  <h3 style={styles.teamTitle}>Team A</h3>
                  <div style={styles.teamStats} className="team-stats">
                    <span style={styles.memberCount}>{teamA?.length || 0} members</span>
                    <span style={styles.submissionCount}>
                      {stats.teamA.submitted}/{stats.teamA.total} submitted
                    </span>
                  </div>
                </div>
                
                <div style={styles.answerSection}>
                  <div style={styles.answerLabel}>
                    🏆 Team Answer (Majority Vote)
                    {isActive && stats.teamA.submitted > 0 && <span style={styles.liveBadge}>LIVE</span>}
                  </div>
                  <div style={styles.answerDisplay}>{renderAnswerDisplay('A')}</div>
                  {isActive && stats.teamA.submitted > 0 && (
                    <div style={styles.majorityInfo}>Based on {stats.teamA.submitted} student answer{stats.teamA.submitted !== 1 ? 's' : ''}</div>
                  )}
                </div>

                <div style={styles.individualAnswersSection}>
                  <div style={styles.individualAnswersHeader}>
                    <FiUsers size={isMobile ? 12 : 16} />
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
                    <div key={student.id} style={styles.memberItem} className="member-item">
                      <span>{student.name}</span>
                      <span style={{...styles.roleBadge, backgroundColor: styles.roleBadge(student.role).backgroundColor}}>{student.role || 'member'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team B Column */}
              <div style={styles.teamCardB}>
                <div style={styles.teamHeaderB} className="team-header-b">
                  <FiUsers size={isMobile ? 20 : 24} />
                  <h3 style={styles.teamTitle}>Team B</h3>
                  <div style={styles.teamStats} className="team-stats">
                    <span style={styles.memberCount}>{teamB?.length || 0} members</span>
                    <span style={styles.submissionCount}>
                      {stats.teamB.submitted}/{stats.teamB.total} submitted
                    </span>
                  </div>
                </div>
                
                <div style={styles.answerSection}>
                  <div style={styles.answerLabel}>
                    🏆 Team Answer (Majority Vote)
                    {isActive && stats.teamB.submitted > 0 && <span style={styles.liveBadge}>LIVE</span>}
                  </div>
                  <div style={styles.answerDisplay}>{renderAnswerDisplay('B')}</div>
                  {isActive && stats.teamB.submitted > 0 && (
                    <div style={styles.majorityInfo}>Based on {stats.teamB.submitted} student answer{stats.teamB.submitted !== 1 ? 's' : ''}</div>
                  )}
                </div>

                <div style={styles.individualAnswersSection}>
                  <div style={styles.individualAnswersHeader}>
                    <FiUsers size={isMobile ? 12 : 16} />
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
                    <div key={student.id} style={styles.memberItem} className="member-item">
                      <span>{student.name}</span>
                      <span style={{...styles.roleBadge, backgroundColor: styles.roleBadge(student.role).backgroundColor}}>{student.role || 'member'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {roundEnded && !pointsPhase && (
            <div style={styles.summaryCard}>
              <h3>🏆 Round Summary</h3>
              <div style={styles.summaryGrid} className="summary-grid">
                <div style={styles.summaryItem}>
                  <strong>Team A:</strong> 
                  <span style={checkAnswer(teamAnswers.A) ? styles.correctText : styles.incorrectText}>
                    {checkAnswer(teamAnswers.A) ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                  <div style={styles.summaryAnswer}>Team Answer: {teamAnswers.A || '❌ No answer'}</div>
                  <div style={styles.summarySubsection}>
                    <strong>Individual Answers:</strong>
                    {studentAnswers.A.map((ans, idx) => (
                      <div key={idx} style={styles.summaryIndividualAnswer}>
                        • {ans.studentName}: "{ans.answer}" {checkAnswer(ans.answer) ? '✓' : '✗'}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={styles.summaryItem}>
                  <strong>Team B:</strong> 
                  <span style={checkAnswer(teamAnswers.B) ? styles.correctText : styles.incorrectText}>
                    {checkAnswer(teamAnswers.B) ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                  <div style={styles.summaryAnswer}>Team Answer: {teamAnswers.B || '❌ No answer'}</div>
                  <div style={styles.summarySubsection}>
                    <strong>Individual Answers:</strong>
                    {studentAnswers.B.map((ans, idx) => (
                      <div key={idx} style={styles.summaryIndividualAnswer}>
                        • {ans.studentName}: "{ans.answer}" {checkAnswer(ans.answer) ? '✓' : '✗'}
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
                <FiAward size={isMobile ? 16 : 20} /> Award Points to Teams
              </button>
            </div>
          )}

          {pointsPhase && (
            <div style={styles.pointsPhaseContainer}>
              <div style={styles.pointsHeader}>
                <FiAward size={isMobile ? 28 : 32} color="#f59e0b" />
                <h2 style={styles.pointsTitle}>Award Points</h2>
                <p style={styles.pointsSubtitle}>Give points to teams. Each team member will receive the same points!</p>
              </div>

              <div style={styles.pointsTeamsContainer} className="points-teams-container">
                <div style={teamPointsAwarded.A ? styles.pointsCardAAwarded : styles.pointsCardA}>
                  <div style={styles.pointsCardHeader} className="points-card-header">
                    <div style={styles.teamIconWrapperA}><FiUsers size={isMobile ? 22 : 28} /></div>
                    <div>
                      <h3 style={styles.pointsTeamTitle}>Team A</h3>
                      <span style={styles.pointsMemberCount}>{teamA?.length || 0} members</span>
                    </div>
                    {teamPointsAwarded.A && <div style={styles.awardedBadge} className="awarded-badge"><FiCheckCircle size={16} /> Points Awarded</div>}
                  </div>
                  <div style={styles.pointsDisplay}>
                    <div style={styles.pointsInfo}>
                      <div style={styles.pointsLabel}>Points per member:</div>
                      {teamPointsAwarded.A ? (
                        <div style={styles.pointsValueAwarded}><FiStar size={isMobile ? 20 : 24} color="#f59e0b" /><span>{teamPoints.A} point{teamPoints.A !== 1 ? 's' : ''}</span></div>
                      ) : (
                        <div style={styles.pointsInputWrapper} className="points-input-wrapper">
                          <button style={styles.pointsAdjustBtn} className="points-adjust-btn" onClick={() => setTeamPoints(prev => ({ ...prev, A: Math.max(0, prev.A - 1) }))}><FiMinus size={isMobile ? 12 : 16} /></button>
                          <input type="number" min="0" value={teamPoints.A} onChange={(e) => setTeamPoints(prev => ({ ...prev, A: Math.max(0, parseInt(e.target.value) || 0) }))} style={styles.pointsInput} className="points-input" />
                          <button style={styles.pointsAdjustBtn} className="points-adjust-btn" onClick={() => setTeamPoints(prev => ({ ...prev, A: prev.A + 1 }))}><FiPlus size={isMobile ? 12 : 16} /></button>
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
                      <FiSend size={isMobile ? 14 : 18} /> Award {teamPoints.A} Point{teamPoints.A !== 1 ? 's' : ''} to Team A
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
                  <div style={styles.pointsCardHeader} className="points-card-header">
                    <div style={styles.teamIconWrapperB}><FiUsers size={isMobile ? 22 : 28} /></div>
                    <div>
                      <h3 style={styles.pointsTeamTitle}>Team B</h3>
                      <span style={styles.pointsMemberCount}>{teamB?.length || 0} members</span>
                    </div>
                    {teamPointsAwarded.B && <div style={styles.awardedBadge} className="awarded-badge"><FiCheckCircle size={16} /> Points Awarded</div>}
                  </div>
                  <div style={styles.pointsDisplay}>
                    <div style={styles.pointsInfo}>
                      <div style={styles.pointsLabel}>Points per member:</div>
                      {teamPointsAwarded.B ? (
                        <div style={styles.pointsValueAwarded}><FiStar size={isMobile ? 20 : 24} color="#f59e0b" /><span>{teamPoints.B} point{teamPoints.B !== 1 ? 's' : ''}</span></div>
                      ) : (
                        <div style={styles.pointsInputWrapper} className="points-input-wrapper">
                          <button style={styles.pointsAdjustBtn} className="points-adjust-btn" onClick={() => setTeamPoints(prev => ({ ...prev, B: Math.max(0, prev.B - 1) }))}><FiMinus size={isMobile ? 12 : 16} /></button>
                          <input type="number" min="0" value={teamPoints.B} onChange={(e) => setTeamPoints(prev => ({ ...prev, B: Math.max(0, parseInt(e.target.value) || 0) }))} style={styles.pointsInput} className="points-input" />
                          <button style={styles.pointsAdjustBtn} className="points-adjust-btn" onClick={() => setTeamPoints(prev => ({ ...prev, B: prev.B + 1 }))}><FiPlus size={isMobile ? 12 : 16} /></button>
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
                      <FiSend size={isMobile ? 14 : 18} /> Award {teamPoints.B} Point{teamPoints.B !== 1 ? 's' : ''} to Team B
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

              <div style={styles.pointsActions} className="points-actions">
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
    padding: 'clamp(12px, 4vw, 20px)' 
  },
  modal: { 
    backgroundColor: 'white', 
    borderRadius: '20px', 
    padding: 'clamp(16px, 5vw, 30px)', 
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
    fontSize: 'clamp(18px, 5vw, 24px)', 
    fontWeight: '700', 
    color: '#1f2937', 
    margin: 0 
  },
  className: { 
    fontSize: 'clamp(14px, 4vw, 18px)', 
    color: '#6b7280', 
    margin: 0 
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: 'clamp(12px, 3.5vw, 14px)',
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
    fontSize: 'clamp(12px, 3.5vw, 14px)', 
    fontWeight: '500', 
    cursor: 'pointer' 
  },
  closeButton: { 
    background: 'none', 
    border: 'none', 
    fontSize: 'clamp(24px, 6vw, 32px)', 
    cursor: 'pointer', 
    color: '#6b7280', 
    padding: '0 8px' 
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#991b1b',
    fontSize: 'clamp(12px, 3.5vw, 14px)'
  },
  readyPhaseContainer: { 
    padding: 'clamp(16px, 5vw, 20px)', 
    backgroundColor: '#f0fdf4', 
    borderRadius: '16px', 
    marginBottom: '20px', 
    border: '2px solid #bbf7d0' 
  },
  readyTitle: { 
    fontSize: 'clamp(18px, 5vw, 24px)', 
    fontWeight: '700', 
    color: '#166534', 
    textAlign: 'center', 
    marginBottom: '8px' 
  },
  readySubtitle: { 
    textAlign: 'center', 
    color: '#15803d', 
    marginBottom: '24px',
    fontSize: 'clamp(12px, 3.5vw, 14px)'
  },
  teamsReadyContainer: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: 'clamp(16px, 4vw, 24px)', 
    marginBottom: '24px' 
  },
  teamReadyCardA: { 
    backgroundColor: '#eff6ff', 
    borderRadius: '16px', 
    padding: 'clamp(16px, 5vw, 20px)', 
    border: '2px solid #bfdbfe' 
  },
  teamReadyCardB: { 
    backgroundColor: '#fce7f3', 
    borderRadius: '16px', 
    padding: 'clamp(16px, 5vw, 20px)', 
    border: '2px solid #fbcfe8' 
  },
  teamReadyHeaderA: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    marginBottom: '16px', 
    paddingBottom: '12px', 
    borderBottom: '2px solid #bfdbfe',
    flexWrap: 'wrap'
  },
  teamReadyHeaderB: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    marginBottom: '16px', 
    paddingBottom: '12px', 
    borderBottom: '2px solid #fbcfe8',
    flexWrap: 'wrap'
  },
  memberCount: { 
    fontSize: 'clamp(10px, 3vw, 12px)', 
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
    fontWeight: '600',
    fontSize: 'clamp(12px, 3.5vw, 14px)'
  },
  readyStatusWaiting: { 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#f59e0b',
    fontWeight: '600',
    fontSize: 'clamp(12px, 3.5vw, 14px)'
  },
  teamMembersReadyList: {
    marginTop: '12px'
  },
  memberReadyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    fontSize: 'clamp(11px, 3.5vw, 13px)',
    borderBottom: '1px solid #e5e7eb',
    flexWrap: 'wrap',
    gap: '8px'
  },
  readyBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '500',
    backgroundColor: '#d1fae5',
    color: '#065f46'
  },
  notReadyBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '500',
    backgroundColor: '#fee2e2',
    color: '#991b1b'
  },
  startRoundButton: {
    marginTop: '16px',
    padding: 'clamp(10px, 4vw, 12px) clamp(20px, 6vw, 24px)',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: 'clamp(14px, 4vw, 18px)',
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
    fontSize: 'clamp(48px, 15vw, 64px)',
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
    marginTop: '16px',
    fontSize: 'clamp(12px, 3.5vw, 14px)',
    flexWrap: 'wrap',
    textAlign: 'center'
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
    flexDirection: 'column',
    textAlign: 'center'
  },
  timerSection: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: 'clamp(16px, 5vw, 20px)',
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
    fontSize: 'clamp(32px, 10vw, 48px)',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    display: 'block',
    color: '#1f2937'
  },
  timerLabel: {
    fontSize: 'clamp(11px, 3.5vw, 14px)',
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
    fontSize: 'clamp(12px, 3.5vw, 14px)',
    fontWeight: '500',
    color: '#6b7280'
  },
  questionCard: {
    backgroundColor: '#f3f4f6',
    padding: 'clamp(16px, 5vw, 20px)',
    borderRadius: '12px',
    marginBottom: '30px'
  },
  questionTitle: {
    fontSize: 'clamp(14px, 4vw, 18px)',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#374151'
  },
  questionText: {
    fontSize: 'clamp(14px, 4.5vw, 20px)',
    fontWeight: '500',
    color: '#1f2937',
    margin: '0 0 16px 0',
    wordBreak: 'break-word'
  },
  correctAnswerBox: {
    backgroundColor: '#d1fae5',
    padding: '12px',
    borderRadius: '8px',
    color: '#065f46',
    marginTop: '12px',
    fontSize: 'clamp(12px, 3.5vw, 14px)'
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
    padding: 'clamp(16px, 5vw, 20px)',
    border: '2px solid #bfdbfe'
  },
  teamCardB: {
    backgroundColor: '#fce7f3',
    borderRadius: '16px',
    padding: 'clamp(16px, 5vw, 20px)',
    border: '2px solid #fbcfe8'
  },
  teamHeaderA: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'clamp(8px, 3vw, 12px)',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '2px solid #bfdbfe',
    flexWrap: 'wrap'
  },
  teamHeaderB: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'clamp(8px, 3vw, 12px)',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '2px solid #fbcfe8',
    flexWrap: 'wrap'
  },
  teamTitle: {
    fontSize: 'clamp(14px, 4vw, 20px)',
    fontWeight: '600',
    margin: 0
  },
  teamStats: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  memberCount: {
    fontSize: 'clamp(10px, 3vw, 12px)',
    color: '#6b7280',
    backgroundColor: 'white',
    padding: '4px 8px',
    borderRadius: '20px'
  },
  submissionCount: {
    fontSize: 'clamp(10px, 3vw, 12px)',
    color: '#6b7280',
    backgroundColor: 'white',
    padding: '4px 8px',
    borderRadius: '20px'
  },
  answerSection: {
    marginBottom: '20px'
  },
  answerLabel: {
    fontSize: 'clamp(12px, 3.5vw, 14px)',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#4b5563',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
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
    gap: '12px',
    flexWrap: 'wrap'
  },
  answerText: {
    fontSize: 'clamp(13px, 4vw, 16px)',
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
    fontStyle: 'italic',
    fontSize: 'clamp(12px, 3.5vw, 14px)'
  },
  correctIcon: {
    color: '#10b981',
    fontSize: 'clamp(20px, 6vw, 24px)'
  },
  incorrectIcon: {
    color: '#ef4444',
    fontSize: 'clamp(20px, 6vw, 24px)'
  },
  majorityInfo: {
    fontSize: 'clamp(10px, 3vw, 11px)',
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
    fontSize: 'clamp(12px, 3.5vw, 14px)',
    fontWeight: '500',
    color: '#4b5563',
    flexWrap: 'wrap'
  },
  answerCount: {
    marginLeft: 'auto',
    fontSize: 'clamp(10px, 3vw, 12px)',
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
    fontSize: 'clamp(11px, 3.5vw, 12px)',
    color: '#166534',
    marginBottom: '8px',
    flexWrap: 'wrap'
  },
  studentAnswerItem: {
    backgroundColor: 'white',
    padding: 'clamp(8px, 3vw, 10px)',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  studentAnswerItemMissing: {
    backgroundColor: '#fef2f2',
    padding: 'clamp(8px, 3vw, 10px)',
    borderRadius: '8px',
    border: '1px solid #fecaca'
  },
  studentAnswerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  studentName: {
    fontSize: 'clamp(12px, 3.5vw, 13px)',
    fontWeight: '600',
    color: '#1f2937'
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
    gap: '8px',
    flexWrap: 'wrap'
  },
  studentAnswerText: {
    fontSize: 'clamp(12px, 3.5vw, 13px)',
    color: '#374151',
    fontFamily: 'monospace',
    flex: 1,
    wordBreak: 'break-word'
  },
  studentAnswerMissing: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#9ca3af',
    fontSize: 'clamp(11px, 3.5vw, 12px)',
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
    fontSize: 'clamp(11px, 3.5vw, 13px)',
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
    fontSize: 'clamp(12px, 3.5vw, 14px)',
    borderBottom: '1px solid #f3f4f6',
    flexWrap: 'wrap',
    gap: '8px'
  },
  roleBadge: (role) => ({
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: '500',
    backgroundColor: role === 'analyzer' ? '#ede9fe' : role === 'checker' ? '#fed7aa' : '#d1fae5',
    color: role === 'analyzer' ? '#6d28d9' : role === 'checker' ? '#92400e' : '#065f46'
  }),
  summaryCard: {
    backgroundColor: '#fef3c7',
    padding: 'clamp(16px, 5vw, 20px)',
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
    padding: 'clamp(12px, 4vw, 12px)',
    backgroundColor: 'white',
    borderRadius: '8px',
    wordBreak: 'break-word'
  },
  summaryAnswer: {
    fontSize: 'clamp(11px, 3.5vw, 12px)',
    color: '#6b7280',
    marginTop: '4px'
  },
  summarySubsection: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #e5e7eb',
    fontSize: 'clamp(11px, 3.5vw, 12px)'
  },
  summaryIndividualAnswer: {
    marginTop: '4px',
    marginLeft: '8px',
    fontSize: 'clamp(10px, 3vw, 11px)',
    color: '#4b5563',
    wordBreak: 'break-word'
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
    whiteSpace: 'pre-line',
    fontSize: 'clamp(12px, 3.5vw, 14px)'
  },
  awardPointsButton: {
    width: '100%',
    marginTop: '16px',
    padding: 'clamp(10px, 4vw, 12px)',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: 'clamp(13px, 4vw, 16px)',
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
    fontSize: 'clamp(20px, 6vw, 28px)',
    fontWeight: '700',
    color: '#1f2937',
    marginTop: '12px',
    marginBottom: '8px'
  },
  pointsSubtitle: {
    color: '#6b7280',
    fontSize: 'clamp(12px, 3.5vw, 14px)'
  },
  pointsTeamsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'clamp(16px, 4vw, 24px)',
    marginBottom: '30px'
  },
  pointsCardA: {
    backgroundColor: '#eff6ff',
    borderRadius: '20px',
    padding: 'clamp(16px, 5vw, 24px)',
    border: '2px solid #bfdbfe',
    transition: 'all 0.3s'
  },
  pointsCardAAwarded: {
    backgroundColor: '#eff6ff',
    borderRadius: '20px',
    padding: 'clamp(16px, 5vw, 24px)',
    border: '2px solid #bfdbfe',
    opacity: 0.85
  },
  pointsCardB: {
    backgroundColor: '#fce7f3',
    borderRadius: '20px',
    padding: 'clamp(16px, 5vw, 24px)',
    border: '2px solid #fbcfe8',
    transition: 'all 0.3s'
  },
  pointsCardBAwarded: {
    backgroundColor: '#fce7f3',
    borderRadius: '20px',
    padding: 'clamp(16px, 5vw, 24px)',
    border: '2px solid #fbcfe8',
    opacity: 0.85
  },
  pointsCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
    flexWrap: 'wrap'
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
    fontSize: 'clamp(16px, 5vw, 22px)',
    fontWeight: '700',
    margin: 0,
    color: '#1f2937'
  },
  pointsMemberCount: {
    fontSize: 'clamp(11px, 3vw, 12px)',
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
    fontSize: 'clamp(10px, 3vw, 12px)',
    fontWeight: '500',
    flexWrap: 'wrap'
  },
  pointsDisplay: {
    marginBottom: '24px'
  },
  pointsInfo: {
    marginBottom: '16px'
  },
  pointsLabel: {
    fontSize: 'clamp(12px, 3.5vw, 14px)',
    color: '#6b7280',
    marginBottom: '8px'
  },
  pointsValueAwarded: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: 'clamp(18px, 5vw, 24px)',
    fontWeight: '700',
    color: '#f59e0b'
  },
  pointsInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  pointsAdjustBtn: {
    width: 'clamp(30px, 8vw, 36px)',
    height: 'clamp(30px, 8vw, 36px)',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pointsInput: {
    width: 'clamp(60px, 15vw, 80px)',
    height: 'clamp(40px, 10vw, 48px)',
    textAlign: 'center',
    fontSize: 'clamp(16px, 5vw, 20px)',
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
    fontSize: 'clamp(12px, 3.5vw, 14px)',
    flexWrap: 'wrap'
  },
  pointsBreakdown: {
    fontSize: 'clamp(10px, 3vw, 12px)',
    color: '#9ca3af'
  },
  awardTeamButton: {
    width: '100%',
    padding: 'clamp(10px, 4vw, 12px)',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: 'clamp(13px, 4vw, 16px)',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexWrap: 'wrap'
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
    fontSize: 'clamp(12px, 3.5vw, 14px)',
    borderBottom: '1px solid #f3f4f6',
    flexWrap: 'wrap',
    gap: '8px'
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
    padding: 'clamp(10px, 4vw, 12px) clamp(16px, 5vw, 24px)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: 'clamp(12px, 3.5vw, 14px)',
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
    padding: 'clamp(10px, 4vw, 12px) clamp(16px, 5vw, 24px)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: 'clamp(12px, 3.5vw, 14px)',
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
    padding: 'clamp(10px, 4vw, 12px) clamp(16px, 5vw, 24px)',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: 'clamp(12px, 3.5vw, 14px)',
    fontWeight: '500',
    cursor: 'pointer'
  },
  finishRoundButton: {
    padding: 'clamp(10px, 4vw, 12px) clamp(20px, 6vw, 32px)',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: 'clamp(12px, 3.5vw, 14px)',
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
    padding: 'clamp(10px, 4vw, 12px) clamp(20px, 6vw, 32px)',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: 'clamp(14px, 4vw, 16px)',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default StartRound; //