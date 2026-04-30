// src/missions/mission4.jsx - FULLY RESPONSIVE (optimized for 308x748 and all screen sizes)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Mission4({ user, userData, updateUserData, onComplete }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackAvatar, setFeedbackAvatar] = useState(null);
  const [canProceed, setCanProceed] = useState(true);
  const [showAvatarMessage, setShowAvatarMessage] = useState(true);
  const [currentAvatarMessage, setCurrentAvatarMessage] = useState("📈 Welcome! Ready to learn about Slope and y-intercept?");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRewardClaimed, setShowRewardClaimed] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);

  const MISSION_ID = 4;
  const MISSION_XP = 500;

  const questions = [
    { question: "What is the general form of the slope-intercept equation?", options: ["Ax + By = C", "y = mx + b", "y - y₁ = m(x - x₁)", "x = my + b"], correct: 1, explanation: "The slope-intercept form is y = mx + b, where m is slope and b is y-intercept." },
    { question: "In the equation y = mx + b, what does b represent?", options: ["The slope", "The y-intercept", "The x-intercept", "The rate of change"], correct: 1, explanation: "b is the y-intercept, where the line crosses the y-axis." },
    { question: "If the slope is -3, what does it mean?", options: ["Line increases left to right", "Line decreases left to right", "Line is horizontal", "Line is vertical"], correct: 1, explanation: "A negative slope means the line decreases from left to right." },
    { question: "Which equation represents a line with slope 2 and y-intercept 4?", options: ["y = 4x + 2", "y = 2x + 4", "y = -2x + 4", "y = 2x - 4"], correct: 1, explanation: "Substitute into y = mx + b → y = 2x + 4." },
    { question: "Find the equation of a line with slope -3 and y-intercept 2.", options: ["y = 3x + 2", "y = -3x - 2", "y = -3x + 2", "y = 3x - 2"], correct: 2, explanation: "Substitute values: y = -3x + 2." },
    { question: "What is the equation of a line with slope 1 and y-intercept -5?", options: ["y = x + 5", "y = -x - 5", "y = x - 5", "y = -x + 5"], correct: 2, explanation: "y = 1x - 5 = x - 5." },
    { question: "What is the slope and y-intercept of y = 4x - 7?", options: ["m = 4, b = 7", "m = -4, b = 7", "m = 4, b = -7", "m = -4, b = -7"], correct: 2, explanation: "Compare with y = mx + b → m = 4, b = -7." },
    { question: "Which statement is correct about y = x + 2?", options: ["Slope negative, y-intercept 2", "Slope 1 (positive), y-intercept 2", "Slope 0, y-intercept 2", "Slope 2, y-intercept 1"], correct: 1, explanation: "m = 1 (positive slope), b = 2." },
    { question: "Which equation represents a line through y-axis at 3 and rises 2 units per 1 unit right?", options: ["y = 2x + 3", "y = 3x + 2", "y = -2x + 3", "y = 2x - 3"], correct: 0, explanation: "'Rises 2' means slope 2, 'y-intercept 3' means b = 3 → y = 2x + 3." },
    { question: "What is the slope and y-intercept of 3x + y = 2?", options: ["m = 3, b = 2", "m = -3, b = 2", "m = 3, b = -2", "m = -3, b = -2"], correct: 1, explanation: "Rewrite: y = -3x + 2 → m = -3, b = 2." }
  ];

  useEffect(() => {
    const checkCompletion = async () => {
      if (user?.dbId) {
        const { data } = await supabase.from('mission_progress').select('status').eq('mission_id', MISSION_ID).eq('student_id', user.dbId).maybeSingle();
        if (data?.status === 'completed') { setIsAlreadyCompleted(true); setShowRewardClaimed(true); setCurrentStep(12); }
      }
    };
    checkCompletion();
  }, [user?.dbId]);

  const steps = [
    { title: "📈 SLOPE AND Y-INTERCEPT MISSION", content: "Welcome to the Slope and y-intercept mission! Learn how to find the equation of a line using slope and y-intercept.", description: "The slope-intercept form is: y = mx + b, where m is the slope and b is the y-intercept.", type: "info" },
    { title: "Slope and y-intercept Lesson", content: (
      <div>
        <div style={respStyles4.imageContainer}><img src="/image1.png" alt="Slope and y-intercept" style={respStyles4.lessonImage} onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23f3f4f6'/%3E%3Ctext x='200' y='120' text-anchor='middle' fill='%23666'%3Ey = mx + b%3C/text%3E%3C/svg%3E"; }} /><p style={respStyles4.imageCaption}>Figure 1: Slope-Intercept Form (y = mx + b)</p></div>
        <div style={respStyles4.exampleBox}><h4 style={respStyles4.exampleTitle}>📐 Example:</h4><p>Find equation with slope <strong>-3</strong> and y-intercept <strong>2</strong>.</p>
        <div style={respStyles4.solutionBox}><p><strong>Solution:</strong> Use y = mx + b</p><p>m = -3, b = 2</p><p>y = -3x + 2</p><div style={respStyles4.resultBoxSmall}>y = -3x + 2 &nbsp;or&nbsp; 3x + y = 2</div></div></div>
      </div>
    ), type: "lesson" }
  ];
  for (let i = 0; i < questions.length; i++) { steps.push({ ...questions[i], type: "quiz" }); }
  steps.push({ title: "Mission Complete! 🎉", content: "Congratulations! You've mastered Slope and y-intercept!", result: "You now know how to find equations using slope and y-intercept!", note: "The slope-intercept form y = mx + b is one of the most useful forms!", type: "complete" });

  const avatarMessages = { happy: ["📈 Excellent!", "✨ Perfect!", "🌟 Great job!", "💫 You're an expert!", "📏 Slope is easy now!", "🏆 Amazing!"], wrong: ["🤔 Oops! Review y = mx + b!", "💡 Almost there!", "📚 Not quite right.", "✨ Don't give up!", "🎯 Keep trying!"], info: ["💡 Remember: y = mx + b!", "📈 m is slope, b is y-intercept!", "🔢 Positive slope rises, negative falls!", "✨ The y-intercept crosses the y-axis!"] };
  const getRandomMessage = (type) => avatarMessages[type][Math.floor(Math.random() * avatarMessages[type].length)];

  const handleResetMission = () => setShowResetConfirm(true);
  const confirmReset = () => { setCurrentStep(0); setAnswers({}); setShowConfetti(false); setFeedbackAvatar(null); setCanProceed(true); setShowAvatarMessage(true); setShowResetConfirm(false); setShowRewardClaimed(false); setIsAlreadyCompleted(false); setCurrentAvatarMessage("🔄 Mission reset! Let's start fresh! 💪"); setTimeout(() => setShowAvatarMessage(false), 3000); };
  const cancelReset = () => { setShowResetConfirm(false); setCurrentAvatarMessage("👍 Great choice! Let's continue!"); setShowAvatarMessage(true); setTimeout(() => setShowAvatarMessage(false), 2000); };

  const handleAnswer = (stepIndex, answerIndex) => {
    const step = steps[stepIndex]; const isCorrect = answerIndex === step.correct;
    setCurrentAvatarMessage(getRandomMessage(isCorrect ? 'happy' : 'wrong'));
    setFeedbackAvatar(isCorrect ? 'happy' : 'wrong'); setCanProceed(isCorrect); setShowAvatarMessage(true);
    setAnswers({ ...answers, [stepIndex]: { selected: answerIndex, isCorrect } });
    setTimeout(() => setFeedbackAvatar(null), 3000);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      if (steps[currentStep].type === 'quiz') {
        if (!answers[currentStep]) { setCurrentAvatarMessage("🤔 Please select an answer first!"); setFeedbackAvatar('wrong'); setShowAvatarMessage(true); setTimeout(() => setFeedbackAvatar(null), 2000); return; }
        if (!canProceed) { setCurrentAvatarMessage("📚 You need to answer correctly to continue!"); setFeedbackAvatar('wrong'); setShowAvatarMessage(true); setTimeout(() => setFeedbackAvatar(null), 2000); return; }
      }
      setCurrentStep(currentStep + 1); setCanProceed(true); setFeedbackAvatar(null);
      if (steps[currentStep + 1]?.type === 'quiz') { setCurrentAvatarMessage(getRandomMessage('info')); setShowAvatarMessage(true); setTimeout(() => setShowAvatarMessage(false), 3000); }
      else if (steps[currentStep + 1]?.type === 'complete') { setCurrentAvatarMessage("🎉 Complete the mission to claim your reward!"); setShowAvatarMessage(true); setTimeout(() => setShowAvatarMessage(false), 3000); }
      else setShowAvatarMessage(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      const prevStep = steps[currentStep - 1];
      if (prevStep.type === 'quiz') { const prevAnswer = answers[currentStep - 1]; setCanProceed(prevAnswer ? prevAnswer.isCorrect : true); }
      else setCanProceed(true);
      setFeedbackAvatar(null); setShowAvatarMessage(false);
    }
  };

  const saveMissionCompletion = async () => {
    if (!user?.dbId) return false;
    const { error } = await supabase.from('mission_progress').upsert({ mission_id: MISSION_ID, student_id: user.dbId, status: 'completed', completed_at: new Date().toISOString(), xp_earned: MISSION_XP }, { onConflict: 'mission_id,student_id' });
    return !error;
  };

  const goToMissionsList = () => { if (onComplete) onComplete(); else navigate('/studenthub/missions'); };

  const handleComplete = async () => {
    if (isCompleting || isAlreadyCompleted) return;
    setIsCompleting(true); setShowConfetti(true);
    setCurrentAvatarMessage(`🏆 CONGRATULATIONS! +${MISSION_XP} XP! 🎉`);
    setFeedbackAvatar('happy'); setShowAvatarMessage(true);
    await saveMissionCompletion();
    const currentProgress = userData?.progress || {};
    const completedMissions = currentProgress.completedMissions || [];
    if (!completedMissions.includes(MISSION_ID) && updateUserData) {
      const newTotalXP = (userData?.xp || 0) + MISSION_XP;
      updateUserData({ xp: newTotalXP, progress: { ...currentProgress, missionsCompleted: (currentProgress.missionsCompleted || 0) + 1, completedMissions: [...completedMissions, MISSION_ID], lastMissionCompleted: new Date().toISOString() } });
      window.dispatchEvent(new CustomEvent('xpUpdated', { detail: { newXP: newTotalXP, missionId: MISSION_ID } }));
    }
    setShowRewardClaimed(true); setIsAlreadyCompleted(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const renderStepContent = () => {
    const step = steps[currentStep]; const currentAnswer = answers[currentStep];
    if (step.type === "info") return (<div style={respStyles4.infoContent}><p style={respStyles4.contentText}>{step.content}</p><p style={respStyles4.descriptionText}>{step.description}</p><div style={respStyles4.formulaBoxSmall}><p style={respStyles4.formulaText}>y = mx + b</p><p style={respStyles4.formulaSubtext}>m = slope, b = y-intercept</p></div></div>);
    if (step.type === "lesson") return <div style={respStyles4.lessonContent}>{step.content}</div>;
    if (step.type === "quiz") return (<div style={respStyles4.quizContent}><div style={respStyles4.questionNumber}>Question {currentStep - 1} of {questions.length}</div><p style={respStyles4.questionText}>{step.question}</p><div style={respStyles4.optionsContainer}>{step.options.map((option, idx) => (<label key={idx} style={{ ...respStyles4.optionLabel, ...(currentAnswer && currentAnswer.selected === idx && idx === step.correct ? respStyles4.correctOption : {}), ...(currentAnswer && currentAnswer.selected === idx && idx !== step.correct ? respStyles4.wrongOption : {}) }}><input type="radio" name={`q-${currentStep}`} value={idx} checked={currentAnswer && currentAnswer.selected === idx} onChange={() => handleAnswer(currentStep, idx)} style={respStyles4.radio} /><span style={respStyles4.optionText}>{option}</span></label>))}</div>{currentAnswer && (<div style={currentAnswer.isCorrect ? respStyles4.correctFeedback : respStyles4.incorrectFeedback}>{currentAnswer.isCorrect ? `✅ Correct! ${step.explanation}` : `❌ Incorrect. ${step.explanation}`}</div>)}</div>);
    if (step.type === "complete") return (<div style={respStyles4.completeContent}>{!showRewardClaimed ? (<><p style={respStyles4.completeText}>{step.content}</p><div style={respStyles4.resultBoxSmall}><span>📈</span><span>{step.result}</span></div><p style={respStyles4.noteText}>{step.note}</p><div style={respStyles4.rewardBoxSmall}><span>🏆</span><span>+{MISSION_XP} XP!</span></div><button style={respStyles4.claimButton} onClick={handleComplete} disabled={isCompleting}>{isCompleting ? "Claiming..." : "🎁 Claim Reward"}</button></>) : (<><div style={respStyles4.claimedBox}><span>✅</span><p style={respStyles4.claimedText}>Completed! +{MISSION_XP} XP!</p></div><div style={respStyles4.resultBoxSmall}><span>📈</span><span>{step.result}</span></div><button style={respStyles4.missionsListButton} onClick={goToMissionsList}>📋 Back to Missions</button></>)}</div>);
    return null;
  };

  const getAvatarImage = () => { if (feedbackAvatar === 'happy') return '/avatar_happy.jpg'; if (feedbackAvatar === 'wrong') return '/avatar_wrong.jpg'; return '/avatar_happy.jpg'; };
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const questionsCompleted = Object.keys(answers).filter(key => answers[key] && answers[key].isCorrect).length;

  if (isAlreadyCompleted && currentStep !== steps.length - 1 && !showRewardClaimed) { setTimeout(() => { setCurrentStep(steps.length - 1); setShowRewardClaimed(true); }, 100); return null; }

  return (
    <div style={respStyles4.container}>
      {showConfetti && <div style={respStyles4.confettiOverlay}><div style={respStyles4.confettiMessage}>🎉 +{MISSION_XP} XP! 🎉<br />Slope & y-intercept Mastered! 📈</div></div>}
      {showResetConfirm && (<div style={respStyles4.modalOverlay}><div style={respStyles4.modalContent}><h3 style={respStyles4.modalTitle}>🔄 Reset Mission?</h3><p style={respStyles4.modalText}>Reset this mission? All progress will be lost.</p><div style={respStyles4.modalButtons}><button style={respStyles4.confirmResetBtn} onClick={confirmReset}>Yes, Reset</button><button style={respStyles4.cancelResetBtn} onClick={cancelReset}>Cancel</button></div></div></div>)}
      <div style={respStyles4.headerRow}>{!showRewardClaimed && <button style={respStyles4.resetButton} onClick={handleResetMission}>🔄 Reset</button>}</div>
      <div style={respStyles4.progressBar}><div style={{ ...respStyles4.progressFill, width: `${progressPercentage}%` }} /></div>
      {steps[currentStep].type === 'quiz' && !showRewardClaimed && <div style={respStyles4.questionProgress}>📈 Mastered: {questionsCompleted}/{questions.length}</div>}
      <div style={respStyles4.card}><h2 style={respStyles4.title}>{steps[currentStep].title}</h2><div style={respStyles4.scrollableContent}>{renderStepContent()}</div>
        {currentStep < steps.length - 1 && steps[currentStep].type !== 'complete' && !showRewardClaimed && (<div style={respStyles4.buttonContainer}>{currentStep > 0 && <button style={respStyles4.prevButton} onClick={handlePrevious}>← Prev</button>}<button style={{ ...respStyles4.nextButton, ...(steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep]) ? respStyles4.disabledButton : {}) }} onClick={handleNext} disabled={steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep])}>Next →</button></div>)}
        <div style={respStyles4.stepIndicator}>{steps[currentStep].type === 'quiz' && !showRewardClaimed ? `Q${currentStep - 1}/${questions.length}` : `Step ${currentStep + 1}/${steps.length}`}</div>
      </div>
      <div style={respStyles4.avatarContainer}><div style={respStyles4.bubbleContainer}>{showAvatarMessage && currentAvatarMessage && (<div style={respStyles4.speechBubble}><span style={respStyles4.bubbleText}>{currentAvatarMessage}</span><button onClick={() => setShowAvatarMessage(false)} style={respStyles4.closeBubble}>✕</button></div>)}{!showAvatarMessage && <button onClick={() => { setShowAvatarMessage(true); setCurrentAvatarMessage(getRandomMessage('info')); }} style={respStyles4.reopenBubble}>💬</button>}</div><div style={respStyles4.avatarWrapper}><img src={getAvatarImage()} alt="Assistant" style={respStyles4.avatarImage} onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23f59e0b'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"; }} /></div></div>
    </div>
  );
}

const respStyles4 = {
  container: { padding: '10px', minHeight: '100vh', backgroundColor: '#f3f4f6', boxSizing: 'border-box', width: '100%', '@media (min-width: 769px)': { padding: '20px' } },
  headerRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' },
  resetButton: { backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', minHeight: '36px' },
  progressBar: { width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', marginBottom: '8px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#f59e0b', transition: 'width 0.3s ease' },
  questionProgress: { textAlign: 'center', marginBottom: '10px', fontSize: '10px', fontWeight: 'bold', color: '#f59e0b' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 160px)', overflow: 'hidden', '@media (min-width: 769px)': { padding: '25px', maxHeight: 'calc(100vh - 200px)' } },
  scrollableContent: { flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '10px' },
  title: { fontSize: '16px', color: '#333', textAlign: 'center', marginBottom: '10px', flexShrink: 0 },
  infoContent: { textAlign: 'center', padding: '8px' },
  contentText: { fontSize: '13px', color: '#666', lineHeight: '1.4', marginBottom: '8px' },
  descriptionText: { fontSize: '12px', color: '#555', lineHeight: '1.4', marginBottom: '8px' },
  formulaBoxSmall: { backgroundColor: '#fef3c7', padding: '10px', borderRadius: '8px', textAlign: 'center', marginTop: '10px' },
  formulaText: { fontSize: '14px', fontFamily: 'monospace', color: '#d97706', fontWeight: 'bold' },
  formulaSubtext: { fontSize: '10px', color: '#666', marginTop: '4px' },
  lessonContent: { padding: '8px', lineHeight: '1.5', fontSize: '12px' },
  quizContent: { padding: '4px' },
  questionNumber: { fontSize: '11px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' },
  questionText: { fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '12px', textAlign: 'center' },
  optionsContainer: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' },
  optionLabel: { display: 'flex', alignItems: 'center', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' },
  correctOption: { backgroundColor: '#d1fae5', borderColor: '#10b981' },
  wrongOption: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  radio: { marginRight: '8px', cursor: 'pointer', width: '16px', height: '16px' },
  optionText: { fontSize: '11px', color: '#333' },
  correctFeedback: { padding: '8px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '8px', marginTop: '8px', fontSize: '11px' },
  incorrectFeedback: { padding: '8px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginTop: '8px', fontSize: '11px' },
  completeContent: { textAlign: 'center', padding: '8px' },
  completeText: { fontSize: '14px', color: '#333', marginBottom: '12px' },
  resultBoxSmall: { backgroundColor: '#fef3c7', padding: '10px', borderRadius: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' },
  noteText: { fontSize: '11px', color: '#666', marginBottom: '12px', fontStyle: 'italic' },
  rewardBoxSmall: { backgroundColor: '#fef3c7', padding: '10px', borderRadius: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  claimButton: { backgroundColor: '#f59e0b', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '100%', minHeight: '44px' },
  claimedBox: { backgroundColor: '#fef3c7', padding: '10px', borderRadius: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' },
  claimedText: { fontSize: '12px', fontWeight: 'bold', color: '#92400e', margin: 0 },
  missionsListButton: { backgroundColor: '#6b7280', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '100%', minHeight: '44px' },
  buttonContainer: { display: 'flex', justifyContent: 'space-between', marginTop: '10px', gap: '8px', flexShrink: 0 },
  prevButton: { backgroundColor: '#6b7280', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', minHeight: '36px' },
  nextButton: { backgroundColor: '#f59e0b', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', minHeight: '36px' },
  disabledButton: { backgroundColor: '#fcd34d', cursor: 'not-allowed', opacity: 0.6 },
  stepIndicator: { textAlign: 'center', marginTop: '10px', fontSize: '10px', color: '#999', flexShrink: 0 },
  avatarContainer: { position: 'fixed', bottom: '10px', right: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 100 },
  bubbleContainer: { marginBottom: '6px', marginRight: '4px' },
  speechBubble: { backgroundColor: 'white', padding: '6px 10px', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', maxWidth: '160px', border: '2px solid #f59e0b' },
  bubbleText: { fontSize: '9px', color: '#333', lineHeight: '1.3' },
  closeBubble: { marginLeft: '6px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '9px', color: '#999' },
  reopenBubble: { borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', backgroundColor: '#f59e0b', color: 'white', border: 'none', fontSize: '16px', marginRight: '4px', marginBottom: '4px' },
  avatarWrapper: { width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', border: '2px solid white', '@media (min-width: 769px)': { width: '70px', height: '70px' } },
  avatarImage: { width: '100%', height: '100%', objectFit: 'cover' },
  confettiOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  confettiMessage: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', fontSize: '16px', textAlign: 'center', maxWidth: '80%' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' },
  modalContent: { backgroundColor: 'white', borderRadius: '16px', padding: '16px', maxWidth: '300px', width: '90%', textAlign: 'center' },
  modalTitle: { fontSize: '16px', marginBottom: '10px', color: '#ef4444' },
  modalText: { fontSize: '12px', color: '#555', marginBottom: '16px', lineHeight: '1.4' },
  modalButtons: { display: 'flex', gap: '10px', justifyContent: 'center', flexDirection: 'column', '@media (min-width: 481px)': { flexDirection: 'row' } },
  confirmResetBtn: { backgroundColor: '#ef4444', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', minHeight: '40px' },
  cancelResetBtn: { backgroundColor: '#6b7280', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', minHeight: '40px' },
  imageContainer: { textAlign: 'center', margin: '10px 0', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '10px' },
  lessonImage: { maxWidth: '100%', height: 'auto', borderRadius: '8px' },
  imageCaption: { fontSize: '10px', color: '#6b7280', marginTop: '6px', fontStyle: 'italic' },
  exampleBox: { backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '10px', marginTop: '12px' },
  exampleTitle: { color: '#0369a1', marginBottom: '8px', fontSize: '14px' },
  solutionBox: { backgroundColor: '#fefce8', padding: '10px', borderRadius: '8px', marginTop: '8px', fontSize: '11px' },
  resultBoxSmall: { backgroundColor: '#dcfce7', padding: '8px', borderRadius: '6px', marginTop: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }
};

const styleSheet4 = document.createElement("style");
styleSheet4.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } } button:active { transform: scale(0.98); } @media (max-width: 480px) { button, .optionLabel { min-height: 40px; } } @media (max-width: 360px) { .title { font-size: 14px !important; } .questionText { font-size: 12px !important; } .optionText { font-size: 10px !important; } .avatarWrapper { width: 45px !important; height: 45px !important; } }`;
if (!document.querySelector('#mission4-responsive-styles')) { styleSheet4.id = 'mission4-responsive-styles'; document.head.appendChild(styleSheet4); }

export default Mission4;