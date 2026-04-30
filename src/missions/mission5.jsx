// src/missions/mission5.jsx - FULLY RESPONSIVE (optimized for 308x748 and all screen sizes)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Mission5({ user, userData, updateUserData, onComplete }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackAvatar, setFeedbackAvatar] = useState(null);
  const [canProceed, setCanProceed] = useState(true);
  const [showAvatarMessage, setShowAvatarMessage] = useState(true);
  const [currentAvatarMessage, setCurrentAvatarMessage] = useState("📐 Welcome! Ready to learn about X and Y Intercepts?");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRewardClaimed, setShowRewardClaimed] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);

  const MISSION_ID = 5;
  const MISSION_XP = 600;

  const questions = [
    { question: "What is the standard Intercept-Form used when x-intercept (a) and y-intercept (b) are known?", options: ["Ax + By = C", "x/a + y/b = 1", "y - y₁ = m(x - x₁)", "y = mx + b"], correct: 1, explanation: "The Intercept Form is x/a + y/b = 1, where a is x-intercept and b is y-intercept." },
    { question: "What is the Intercept Form for line with x-intercept 4 and y-intercept -2?", options: ["x/4 + y/(-2) = 0", "x/4 - y/2 = 1", "x/(-2) + y/4 = 1", "4x - 2y = 1"], correct: 1, explanation: "Substitute a=4, b=-2 into x/a + y/b = 1 → x/4 - y/2 = 1." },
    { question: "Simplify x/4 + y/(-2) = 1 to Standard Form.", options: ["x + 2y = 4", "x - 2y = 4", "4x - 2y = 4", "x - y = 4"], correct: 1, explanation: "Multiply by 4: x - 2y = 4." },
    { question: "Line with x-intercept 4 and y-intercept -2 passes through which points?", options: ["(0,4) and (-2,0)", "(4,0) and (0,-2)", "(4,-2) and (0,0)", "(4,4) and (-2,-2)"], correct: 1, explanation: "x-intercept (4,0), y-intercept (0,-2)." },
    { question: "Intercept Form for x-intercept 5 and y-intercept 3?", options: ["x/3 + y/5 = 1", "x/5 + y/3 = 1", "5x + 3y = 1", "x - y = 2"], correct: 1, explanation: "x/5 + y/3 = 1." },
    { question: "Which form is x - 2y = 4?", options: ["Intercept Form", "Standard Form", "Slope Form", "Variable Form"], correct: 1, explanation: "x - 2y = 4 is Standard Form." },
    { question: "Convert x/5 + y/(-1) = 1 to standard form.", options: ["x + 5y = 5", "x - 5y = 5", "5x - y = 5", "x - y = 1"], correct: 1, explanation: "Multiply by 5: x - 5y = 5." },
    { question: "Which is equivalent to x - 2y = 4 in intercept form?", options: ["x/4 + y/2 = 1", "x/4 + y/(-2) = 1", "x/(-4) + y/2 = 1", "x/2 + y/4 = 1"], correct: 1, explanation: "Intercepts: (4,0) and (0,-2) → x/4 + y/(-2) = 1." },
    { question: "Line with x-intercept -3 and y-intercept 5?", options: ["x/3 + y/5 = 1", "x/(-3) + y/5 = 1", "x/5 + y/(-3) = 1", "x + y = 2"], correct: 1, explanation: "x/(-3) + y/5 = 1." },
    { question: "Equation with intercepts (8,0) and (0,-4)?", options: ["x/8 + y/4 = 1", "x/8 + y/(-4) = 1", "x/(-8) + y/4 = 1", "x + y = 4"], correct: 1, explanation: "x/8 + y/(-4) = 1." }
  ];

  useEffect(() => {
    const checkCompletion = async () => {
      if (user?.dbId) {
        const { data } = await supabase.from('mission_progress').select('status').eq('mission_id', MISSION_ID).eq('student_id', user.dbId).maybeSingle();
        if (data?.status === 'completed') { setIsAlreadyCompleted(true); setShowRewardClaimed(true); setCurrentStep(11); }
      }
    };
    checkCompletion();
  }, [user?.dbId]);

  const steps = [
    { title: "Mission 5: X and Y Intercepts", content: (
      <div>
        <div style={respStyles5.imageContainer}><img src="/image5.png" alt="X and Y Intercepts" style={respStyles5.lessonImage} onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23f3f4f6'/%3E%3Ctext x='200' y='120' text-anchor='middle' fill='%23666'%3EX and Y Intercepts%3C/text%3E%3C/svg%3E"; }} /><p style={respStyles5.imageCaption}>Figure 1: X and Y Intercepts</p></div>
        <div style={respStyles5.imageContainer}><img src="/image2.png" alt="Intercept Form Graph" style={respStyles5.lessonImage} onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23f0fdf4'/%3E%3Ctext x='200' y='120' text-anchor='middle' fill='%23666'%3Ex-intercept (4,0), y-intercept (0,-2)%3C/text%3E%3C/svg%3E"; }} /><p style={respStyles5.imageCaption}>Figure 2: Graph with intercepts (4,0) and (0,-2)</p></div>
        <div style={respStyles5.exampleBox}><h4 style={respStyles5.exampleTitle}>📐 Example:</h4><p>Find equation with x-intercept <strong>4</strong> and y-intercept <strong>-2</strong>.</p>
        <div style={respStyles5.solutionBox}><p><strong>Solution:</strong> Use x/a + y/b = 1</p><p>a = 4, b = -2</p><p>x/4 + y/(-2) = 1</p><p>Multiply by 4: x - 2y = 4</p><div style={respStyles5.resultBoxSmall}>x/4 + y/(-2) = 1 &nbsp;(intercept)<br/>x - 2y = 4 &nbsp;(standard)</div></div></div>
      </div>
    ), type: "lesson" }
  ];
  for (let i = 0; i < questions.length; i++) { steps.push({ ...questions[i], type: "quiz" }); }
  steps.push({ title: "Mission Complete! 🎉", content: "Congratulations! You've mastered X and Y Intercepts!", result: "You now know how to find equations using intercepts!", note: "The intercept form x/a + y/b = 1 is perfect when you know both intercepts!", type: "complete" });

  const avatarMessages = { happy: ["📐 Excellent!", "✨ Perfect!", "🌟 Great job!", "💫 You're an expert!", "📏 Intercepts are easy!", "🏆 Amazing!"], wrong: ["🤔 Oops! Review x/a + y/b = 1!", "💡 Almost there!", "📚 Not quite right.", "✨ Don't give up!", "🎯 Keep trying!"], info: ["💡 Remember: x/a + y/b = 1!", "📈 a is x-intercept, b is y-intercept!", "🔢 Intercepts are where line crosses axes!", "✨ Convert to standard form by multiplying!"] };
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
    if (step.type === "lesson") return <div style={respStyles5.lessonContent}>{step.content}</div>;
    if (step.type === "quiz") return (<div style={respStyles5.quizContent}><div style={respStyles5.questionNumber}>Question {currentStep} of {questions.length}</div><p style={respStyles5.questionText}>{step.question}</p><div style={respStyles5.optionsContainer}>{step.options.map((option, idx) => (<label key={idx} style={{ ...respStyles5.optionLabel, ...(currentAnswer && currentAnswer.selected === idx && idx === step.correct ? respStyles5.correctOption : {}), ...(currentAnswer && currentAnswer.selected === idx && idx !== step.correct ? respStyles5.wrongOption : {}) }}><input type="radio" name={`q-${currentStep}`} value={idx} checked={currentAnswer && currentAnswer.selected === idx} onChange={() => handleAnswer(currentStep, idx)} style={respStyles5.radio} /><span style={respStyles5.optionText}>{option}</span></label>))}</div>{currentAnswer && (<div style={currentAnswer.isCorrect ? respStyles5.correctFeedback : respStyles5.incorrectFeedback}>{currentAnswer.isCorrect ? `✅ Correct! ${step.explanation}` : `❌ Incorrect. ${step.explanation}`}</div>)}</div>);
    if (step.type === "complete") return (<div style={respStyles5.completeContent}>{!showRewardClaimed ? (<><p style={respStyles5.completeText}>{step.content}</p><div style={respStyles5.resultBoxSmall}><span>📐</span><span>{step.result}</span></div><p style={respStyles5.noteText}>{step.note}</p><div style={respStyles5.rewardBoxSmall}><span>🏆</span><span>+{MISSION_XP} XP!</span></div><button style={respStyles5.claimButton} onClick={handleComplete} disabled={isCompleting}>{isCompleting ? "Claiming..." : "🎁 Claim Reward"}</button></>) : (<><div style={respStyles5.claimedBox}><span>✅</span><p style={respStyles5.claimedText}>Completed! +{MISSION_XP} XP!</p></div><div style={respStyles5.resultBoxSmall}><span>📐</span><span>{step.result}</span></div><button style={respStyles5.missionsListButton} onClick={goToMissionsList}>📋 Back to Missions</button></>)}</div>);
    return null;
  };

  const getAvatarImage = () => { if (feedbackAvatar === 'happy') return '/avatar_happy.jpg'; if (feedbackAvatar === 'wrong') return '/avatar_wrong.jpg'; return '/avatar_happy.jpg'; };
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const questionsCompleted = Object.keys(answers).filter(key => answers[key] && answers[key].isCorrect).length;

  if (isAlreadyCompleted && currentStep !== steps.length - 1 && !showRewardClaimed) { setTimeout(() => { setCurrentStep(steps.length - 1); setShowRewardClaimed(true); }, 100); return null; }

  return (
    <div style={respStyles5.container}>
      {showConfetti && <div style={respStyles5.confettiOverlay}><div style={respStyles5.confettiMessage}>🎉 +{MISSION_XP} XP! 🎉<br />X & Y Intercepts Mastered! 📐</div></div>}
      {showResetConfirm && (<div style={respStyles5.modalOverlay}><div style={respStyles5.modalContent}><h3 style={respStyles5.modalTitle}>🔄 Reset Mission?</h3><p style={respStyles5.modalText}>Reset this mission? All progress will be lost.</p><div style={respStyles5.modalButtons}><button style={respStyles5.confirmResetBtn} onClick={confirmReset}>Yes, Reset</button><button style={respStyles5.cancelResetBtn} onClick={cancelReset}>Cancel</button></div></div></div>)}
      <div style={respStyles5.headerRow}>{!showRewardClaimed && <button style={respStyles5.resetButton} onClick={handleResetMission}>🔄 Reset</button>}</div>
      <div style={respStyles5.progressBar}><div style={{ ...respStyles5.progressFill, width: `${progressPercentage}%` }} /></div>
      {steps[currentStep].type === 'quiz' && !showRewardClaimed && <div style={respStyles5.questionProgress}>📐 Mastered: {questionsCompleted}/{questions.length}</div>}
      <div style={respStyles5.card}><h2 style={respStyles5.title}>{steps[currentStep].title}</h2><div style={respStyles5.scrollableContent}>{renderStepContent()}</div>
        {currentStep < steps.length - 1 && steps[currentStep].type !== 'complete' && !showRewardClaimed && (<div style={respStyles5.buttonContainer}>{currentStep > 0 && <button style={respStyles5.prevButton} onClick={handlePrevious}>← Prev</button>}<button style={{ ...respStyles5.nextButton, ...(steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep]) ? respStyles5.disabledButton : {}) }} onClick={handleNext} disabled={steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep])}>Next →</button></div>)}
        <div style={respStyles5.stepIndicator}>{steps[currentStep].type === 'quiz' && !showRewardClaimed ? `Q${currentStep}/${questions.length}` : `Step ${currentStep + 1}/${steps.length}`}</div>
      </div>
      <div style={respStyles5.avatarContainer}><div style={respStyles5.bubbleContainer}>{showAvatarMessage && currentAvatarMessage && (<div style={respStyles5.speechBubble}><span style={respStyles5.bubbleText}>{currentAvatarMessage}</span><button onClick={() => setShowAvatarMessage(false)} style={respStyles5.closeBubble}>✕</button></div>)}{!showAvatarMessage && <button onClick={() => { setShowAvatarMessage(true); setCurrentAvatarMessage(getRandomMessage('info')); }} style={respStyles5.reopenBubble}>💬</button>}</div><div style={respStyles5.avatarWrapper}><img src={getAvatarImage()} alt="Assistant" style={respStyles5.avatarImage} onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%238b5cf6'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"; }} /></div></div>
    </div>
  );
}

const respStyles5 = {
  container: { padding: '10px', minHeight: '100vh', backgroundColor: '#f3f4f6', boxSizing: 'border-box', width: '100%', '@media (min-width: 769px)': { padding: '20px' } },
  headerRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' },
  resetButton: { backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', minHeight: '36px' },
  progressBar: { width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', marginBottom: '8px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#8b5cf6', transition: 'width 0.3s ease' },
  questionProgress: { textAlign: 'center', marginBottom: '10px', fontSize: '10px', fontWeight: 'bold', color: '#8b5cf6' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 160px)', overflow: 'hidden', '@media (min-width: 769px)': { padding: '25px', maxHeight: 'calc(100vh - 200px)' } },
  scrollableContent: { flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '10px' },
  title: { fontSize: '16px', color: '#333', textAlign: 'center', marginBottom: '10px', flexShrink: 0 },
  lessonContent: { padding: '8px', lineHeight: '1.5', fontSize: '12px' },
  quizContent: { padding: '4px' },
  questionNumber: { fontSize: '11px', color: '#8b5cf6', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' },
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
  resultBoxSmall: { backgroundColor: '#ede9fe', padding: '10px', borderRadius: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' },
  noteText: { fontSize: '11px', color: '#666', marginBottom: '12px', fontStyle: 'italic' },
  rewardBoxSmall: { backgroundColor: '#ede9fe', padding: '10px', borderRadius: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  claimButton: { backgroundColor: '#8b5cf6', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '100%', minHeight: '44px' },
  claimedBox: { backgroundColor: '#ede9fe', padding: '10px', borderRadius: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' },
  claimedText: { fontSize: '12px', fontWeight: 'bold', color: '#5b21b6', margin: 0 },
  missionsListButton: { backgroundColor: '#6b7280', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '100%', minHeight: '44px' },
  buttonContainer: { display: 'flex', justifyContent: 'space-between', marginTop: '10px', gap: '8px', flexShrink: 0 },
  prevButton: { backgroundColor: '#6b7280', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', minHeight: '36px' },
  nextButton: { backgroundColor: '#8b5cf6', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', minHeight: '36px' },
  disabledButton: { backgroundColor: '#c4b5fd', cursor: 'not-allowed', opacity: 0.6 },
  stepIndicator: { textAlign: 'center', marginTop: '10px', fontSize: '10px', color: '#999', flexShrink: 0 },
  avatarContainer: { position: 'fixed', bottom: '10px', right: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 100 },
  bubbleContainer: { marginBottom: '6px', marginRight: '4px' },
  speechBubble: { backgroundColor: 'white', padding: '6px 10px', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', maxWidth: '160px', border: '2px solid #8b5cf6' },
  bubbleText: { fontSize: '9px', color: '#333', lineHeight: '1.3' },
  closeBubble: { marginLeft: '6px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '9px', color: '#999' },
  reopenBubble: { borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', backgroundColor: '#8b5cf6', color: 'white', border: 'none', fontSize: '16px', marginRight: '4px', marginBottom: '4px' },
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

const styleSheet5 = document.createElement("style");
styleSheet5.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } } button:active { transform: scale(0.98); } @media (max-width: 480px) { button, .optionLabel { min-height: 40px; } } @media (max-width: 360px) { .title { font-size: 14px !important; } .questionText { font-size: 12px !important; } .optionText { font-size: 10px !important; } .avatarWrapper { width: 45px !important; height: 45px !important; } }`;
if (!document.querySelector('#mission5-responsive-styles')) { styleSheet5.id = 'mission5-responsive-styles'; document.head.appendChild(styleSheet5); }

export default Mission5;