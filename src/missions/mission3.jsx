// src/missions/mission3.jsx - FULLY RESPONSIVE (optimized for 308x748 and all screen sizes)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Mission3({ user, userData, updateUserData, onComplete }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackAvatar, setFeedbackAvatar] = useState(null);
  const [canProceed, setCanProceed] = useState(true);
  const [showAvatarMessage, setShowAvatarMessage] = useState(true);
  const [currentAvatarMessage, setCurrentAvatarMessage] = useState("📐 Welcome! Ready to learn about Slope and a Point?");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRewardClaimed, setShowRewardClaimed] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);

  const MISSION_ID = 3;
  const MISSION_XP = 400;

  const questions = [
    {
      question: "What is the formula of the point-slope form of a linear equation?",
      options: ["y = mx + b", "y - y₁ = m(x - x₁)", "y = x + b", "y₁ - y = m(x₁ - x)"],
      correct: 1,
      explanation: "Point-slope form uses a known slope m and a point (x₁, y₁): y - y₁ = m(x - x₁)."
    },
    {
      question: "What does the slope represent?",
      options: ["The y-intercept", "The highest point", "The rate of change", "The x-intercept"],
      correct: 2,
      explanation: "Slope tells how steep the line is or how y changes with respect to x."
    },
    {
      question: "What is the equation of a line with slope 3 passing through (2, -1)?",
      options: ["y - 1 = 3(x + 2)", "y + 1 = 3(x + 2)", "y - 1 = 3(x - 2)", "y + 1 = 3(x - 2)"],
      correct: 3,
      explanation: "Substitute m=3, x₁=2, y₁=-1: y - (-1) = 3(x - 2) → y + 1 = 3(x - 2)"
    },
    {
      question: "Find the equation of the line with slope -4 passing through (0, 5).",
      options: ["y - 5 = -4(x - 0)", "y + 5 = -4(x - 0)", "y - 5 = 4(x - 0)", "y + 5 = 4(x - 0)"],
      correct: 0,
      explanation: "Substitute m=-4, x₁=0, y₁=5: y - 5 = -4(x - 0)"
    },
    {
      question: "In the equation y - 2 = 5(x - 1), what is the slope?",
      options: ["2", "1", "-5", "5"],
      correct: 3,
      explanation: "The slope is the coefficient of (x - x₁), which is 5."
    },
    {
      question: "How do the graphs of y - 3 = 2(x - 4) and y - 3 = -2(x - 4) differ?",
      options: ["Same line", "One increases, one decreases", "Both horizontal", "Overlap exactly"],
      correct: 1,
      explanation: "Positive slope rises from left to right; negative slope falls from left to right."
    },
    {
      question: "Is the equation y - 5 = 3(x + 2) correct for slope 3 and point (-2, 5)?",
      options: ["No, slope wrong", "Yes, follows formula", "No, point incorrect", "Yes, but only after simplifying"],
      correct: 1,
      explanation: "x + 2 is the same as x - (-2), so it is correct for point (-2, 5)."
    },
    {
      question: "Which is the correct equation for slope 1 and point (3, 2)?",
      options: ["y + 2 = 1(x - 3)", "y - 3 = 1(x - 2)", "y - 2 = 1(x - 3)", "y + 3 = 1(x + 2)"],
      correct: 2,
      explanation: "Substitute correctly: y - y₁ = m(x - x₁) → y - 2 = 1(x - 3)"
    },
    {
      question: "Which is a correct example of a point-slope equation?",
      options: ["y = 4x + 2", "y - 4 = 2(x - 1)", "y = x - 5", "y = 3x"],
      correct: 1,
      explanation: "y - 4 = 2(x - 1) is in point-slope form: y - y₁ = m(x - x₁)."
    },
    {
      question: "Which situation can be modeled using point-slope form?",
      options: ["Circle's radius changing", "Constant value not changing", "Random pattern", "Decreasing temperature at constant rate"],
      correct: 3,
      explanation: "Linear equations represent constant rate of change, which can be modeled using point-slope form."
    }
  ];

  const steps = [
    { title: "📐 SLOPE AND A POINT MISSION", content: "Welcome to the Slope and a Point mission! Learn how to find the equation of a line using a given slope and a point.", description: "The point-slope form is: y - y₁ = m(x - x₁). Let's master this concept!", type: "info" },
    {
      title: "Lesson: Slope and a Point",
      content: (
        <div>
          <p style={respStyles.paragraph}><strong>m</strong> and <strong>(x₁, y₁)</strong></p>
          <div style={respStyles.imageContainer}>
            <img src="/image.png" alt="Slope and Point Graph" style={respStyles.lessonImage}
              onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect width='500' height='300' fill='%23f3f4f6'/%3E%3Ctext x='250' y='150' text-anchor='middle' fill='%23666' font-size='16'%3ESlope = -2, Point (1, 5)%3C/text%3E%3C/svg%3E"; }} />
            <p style={respStyles.imageCaption}>Figure 1: Line with slope -2 passing through point (1, 5)</p>
          </div>
          <div style={respStyles.exampleBox}>
            <h4 style={respStyles.exampleTitle}>📐 Example:</h4>
            <p>Write the equation of a line with slope <strong>-2</strong> through point <strong>(1, 5)</strong>.</p>
            <div style={respStyles.solutionBox}>
              <p><strong>Solution:</strong> Use <strong>Point-slope Form</strong>: y - y₁ = m(x - x₁)</p>
              <p><strong>Step 1.</strong> m = -2, x₁ = 1, y₁ = 5</p>
              <p><strong>Step 2.</strong> Substitute: y - 5 = -2(x - 1)</p>
              <p><strong>Step 3.</strong> Distribute: y - 5 = -2x + 2</p>
              <p><strong>Step 4.</strong> Add 5: y = -2x + 7</p>
              <div style={respStyles.resultBoxSmall}>y = -2x + 7 &nbsp;or&nbsp; 2x + y = 7</div>
            </div>
          </div>
        </div>
      ),
      type: "lesson"
    }
  ];

  for (let i = 0; i < questions.length; i++) {
    steps.push({ ...questions[i], title: `Question ${i + 1}`, type: "quiz" });
  }
  steps.push({ title: "Mission Complete! 🎉", content: "Congratulations! You've mastered the Slope and a Point mission!", result: "You now know how to find equations using slope and a point!", note: "The point-slope form is a powerful tool!", type: "complete" });

  const avatarMessages = {
    happy: ["📐 Excellent!", "✨ Perfect!", "🌟 Great job!", "💫 You're an expert!", "📏 Slope is rising!", "🏆 Amazing!"],
    wrong: ["🤔 Oops! Review point-slope form!", "💡 Almost there! y - y₁ = m(x - x₁)", "📚 Not quite right.", "✨ Don't give up!", "🎯 Keep trying!", "💪 Every mistake teaches us!"],
    info: ["💡 Remember: y - y₁ = m(x - x₁)!", "📐 Positive slope rises, negative falls!", "🔢 Slope m tells steepness!", "✨ Practice substituting values!"]
  };

  const getRandomMessage = (type) => avatarMessages[type][Math.floor(Math.random() * avatarMessages[type].length)];

  useEffect(() => {
    const checkCompletion = async () => {
      if (user?.dbId) {
        const { data } = await supabase.from('mission_progress').select('status').eq('mission_id', MISSION_ID).eq('student_id', user.dbId).maybeSingle();
        if (data?.status === 'completed') { setIsAlreadyCompleted(true); setShowRewardClaimed(true); setCurrentStep(steps.length - 1); }
      }
    };
    checkCompletion();
  }, [user?.dbId]);

  const handleResetMission = () => setShowResetConfirm(true);
  const confirmReset = () => {
    setCurrentStep(0); setAnswers({}); setShowConfetti(false); setFeedbackAvatar(null);
    setCanProceed(true); setShowAvatarMessage(true); setShowResetConfirm(false);
    setShowRewardClaimed(false); setIsAlreadyCompleted(false);
    setCurrentAvatarMessage("🔄 Mission reset! Let's start fresh! 💪");
    setTimeout(() => setShowAvatarMessage(false), 3000);
  };
  const cancelReset = () => {
    setShowResetConfirm(false);
    setCurrentAvatarMessage("👍 Great choice! Let's continue!");
    setShowAvatarMessage(true);
    setTimeout(() => setShowAvatarMessage(false), 2000);
  };

  const handleAnswer = (stepIndex, answerIndex) => {
    const step = steps[stepIndex];
    const isCorrect = answerIndex === step.correct;
    setCurrentAvatarMessage(getRandomMessage(isCorrect ? 'happy' : 'wrong'));
    setFeedbackAvatar(isCorrect ? 'happy' : 'wrong');
    setCanProceed(isCorrect);
    setShowAvatarMessage(true);
    setAnswers({ ...answers, [stepIndex]: { selected: answerIndex, isCorrect } });
    setTimeout(() => setFeedbackAvatar(null), 3000);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      if (steps[currentStep].type === 'quiz') {
        if (!answers[currentStep]) {
          setCurrentAvatarMessage("🤔 Please select an answer first!");
          setFeedbackAvatar('wrong'); setShowAvatarMessage(true);
          setTimeout(() => setFeedbackAvatar(null), 2000);
          return;
        }
        if (!canProceed) {
          setCurrentAvatarMessage("📚 You need to answer correctly to continue!");
          setFeedbackAvatar('wrong'); setShowAvatarMessage(true);
          setTimeout(() => setFeedbackAvatar(null), 2000);
          return;
        }
      }
      setCurrentStep(currentStep + 1);
      setCanProceed(true);
      setFeedbackAvatar(null);
      if (steps[currentStep + 1]?.type === 'quiz') {
        setCurrentAvatarMessage(getRandomMessage('info'));
        setShowAvatarMessage(true);
        setTimeout(() => setShowAvatarMessage(false), 3000);
      } else if (steps[currentStep + 1]?.type === 'complete') {
        setCurrentAvatarMessage("🎉 Complete the mission to claim your reward!");
        setShowAvatarMessage(true);
        setTimeout(() => setShowAvatarMessage(false), 3000);
      } else setShowAvatarMessage(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      const prevStep = steps[currentStep - 1];
      if (prevStep.type === 'quiz') {
        const prevAnswer = answers[currentStep - 1];
        setCanProceed(prevAnswer ? prevAnswer.isCorrect : true);
      } else setCanProceed(true);
      setFeedbackAvatar(null);
      setShowAvatarMessage(false);
    }
  };

  const saveMissionCompletion = async () => {
    if (!user?.dbId) return false;
    const { error } = await supabase.from('mission_progress').upsert({
      mission_id: MISSION_ID, student_id: user.dbId, status: 'completed',
      completed_at: new Date().toISOString(), xp_earned: MISSION_XP
    }, { onConflict: 'mission_id,student_id' });
    return !error;
  };

  const goToMissionsList = () => { if (onComplete) onComplete(); else navigate('/studenthub/missions'); };

  const handleComplete = async () => {
    if (isCompleting || isAlreadyCompleted) return;
    setIsCompleting(true);
    setShowConfetti(true);
    setCurrentAvatarMessage(`🏆 CONGRATULATIONS! +${MISSION_XP} XP! 🎉`);
    setFeedbackAvatar('happy');
    setShowAvatarMessage(true);
    await saveMissionCompletion();
    const currentProgress = userData?.progress || {};
    const completedMissions = currentProgress.completedMissions || [];
    if (!completedMissions.includes(MISSION_ID) && updateUserData) {
      const newTotalXP = (userData?.xp || 0) + MISSION_XP;
      updateUserData({
        xp: newTotalXP,
        progress: { ...currentProgress, missionsCompleted: (currentProgress.missionsCompleted || 0) + 1, completedMissions: [...completedMissions, MISSION_ID], lastMissionCompleted: new Date().toISOString() }
      });
      window.dispatchEvent(new CustomEvent('xpUpdated', { detail: { newXP: newTotalXP, missionId: MISSION_ID } }));
    }
    setShowRewardClaimed(true);
    setIsAlreadyCompleted(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    const currentAnswer = answers[currentStep];
    if (step.type === "info") return (
      <div style={respStyles.infoContent}>
        <p style={respStyles.contentText}>{step.content}</p>
        <p style={respStyles.descriptionText}>{step.description}</p>
        <div style={respStyles.formulaBoxSmall}><p style={respStyles.formulaText}>Point-Slope Form: y - y₁ = m(x - x₁)</p></div>
      </div>
    );
    if (step.type === "lesson") return <div style={respStyles.lessonContent}>{step.content}</div>;
    if (step.type === "quiz") return (
      <div style={respStyles.quizContent}>
        <div style={respStyles.questionNumber}>Question {currentStep - 1} of {questions.length}</div>
        <p style={respStyles.questionText}>{step.question}</p>
        <div style={respStyles.optionsContainer}>
          {step.options.map((option, idx) => (
            <label key={idx} style={{ ...respStyles.optionLabel, ...(currentAnswer && currentAnswer.selected === idx && idx === step.correct ? respStyles.correctOption : {}), ...(currentAnswer && currentAnswer.selected === idx && idx !== step.correct ? respStyles.wrongOption : {}) }}>
              <input type="radio" name={`q-${currentStep}`} value={idx} checked={currentAnswer && currentAnswer.selected === idx} onChange={() => handleAnswer(currentStep, idx)} style={respStyles.radio} />
              <span style={respStyles.optionText}>{option}</span>
            </label>
          ))}
        </div>
        {currentAnswer && (
          <div style={currentAnswer.isCorrect ? respStyles.correctFeedback : respStyles.incorrectFeedback}>
            {currentAnswer.isCorrect ? `✅ Correct! ${step.explanation}` : `❌ Incorrect. ${step.explanation}`}
          </div>
        )}
      </div>
    );
    if (step.type === "complete") return (
      <div style={respStyles.completeContent}>
        {!showRewardClaimed ? (
          <>
            <p style={respStyles.completeText}>{step.content}</p>
            <div style={respStyles.resultBoxSmall}><span>📐</span><span>{step.result}</span></div>
            <p style={respStyles.noteText}>{step.note}</p>
            <div style={respStyles.rewardBoxSmall}><span>🏆</span><span>+{MISSION_XP} XP Reward!</span></div>
            <button style={respStyles.claimButton} onClick={handleComplete} disabled={isCompleting}>{isCompleting ? "Claiming..." : "🎁 Claim Your Reward"}</button>
          </>
        ) : (
          <>
            <div style={respStyles.claimedBox}><span>✅</span><p style={respStyles.claimedText}>Mission Completed! +{MISSION_XP} XP!</p></div>
            <div style={respStyles.resultBoxSmall}><span>📐</span><span>{step.result}</span></div>
            <button style={respStyles.missionsListButton} onClick={goToMissionsList}>📋 Back to All Missions</button>
          </>
        )}
      </div>
    );
    return null;
  };

  const getAvatarImage = () => {
    if (feedbackAvatar === 'happy') return '/avatar_happy.jpg';
    if (feedbackAvatar === 'wrong') return '/avatar_wrong.jpg';
    return '/avatar_happy.jpg';
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const questionsCompleted = Object.keys(answers).filter(key => answers[key] && answers[key].isCorrect).length;

  if (isAlreadyCompleted && currentStep !== steps.length - 1 && !showRewardClaimed) {
    setTimeout(() => { setCurrentStep(steps.length - 1); setShowRewardClaimed(true); }, 100);
    return null;
  }

  return (
    <div style={respStyles.container}>
      {showConfetti && <div style={respStyles.confettiOverlay}><div style={respStyles.confettiMessage}>🎉 +{MISSION_XP} XP! 🎉<br />Slope and a Point Mastered! 📐</div></div>}
      {showResetConfirm && (
        <div style={respStyles.modalOverlay}>
          <div style={respStyles.modalContent}>
            <h3 style={respStyles.modalTitle}>🔄 Reset Mission?</h3>
            <p style={respStyles.modalText}>Reset this mission? All progress will be lost.</p>
            <div style={respStyles.modalButtons}>
              <button style={respStyles.confirmResetBtn} onClick={confirmReset}>Yes, Reset</button>
              <button style={respStyles.cancelResetBtn} onClick={cancelReset}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div style={respStyles.headerRow}>{!showRewardClaimed && <button style={respStyles.resetButton} onClick={handleResetMission}>🔄 Reset</button>}</div>
      <div style={respStyles.progressBar}><div style={{ ...respStyles.progressFill, width: `${progressPercentage}%` }} /></div>
      {steps[currentStep].type === 'quiz' && !showRewardClaimed && <div style={respStyles.questionProgress}>📐 Mastered: {questionsCompleted}/{questions.length}</div>}
      <div style={respStyles.card}>
        <h2 style={respStyles.title}>{steps[currentStep].title}</h2>
        <div style={respStyles.scrollableContent}>{renderStepContent()}</div>
        {currentStep < steps.length - 1 && steps[currentStep].type !== 'complete' && !showRewardClaimed && (
          <div style={respStyles.buttonContainer}>
            {currentStep > 0 && <button style={respStyles.prevButton} onClick={handlePrevious}>← Prev</button>}
            <button style={{ ...respStyles.nextButton, ...(steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep]) ? respStyles.disabledButton : {}) }} onClick={handleNext} disabled={steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep])}>Next →</button>
          </div>
        )}
        <div style={respStyles.stepIndicator}>{steps[currentStep].type === 'quiz' && !showRewardClaimed ? `Q${currentStep - 1}/${questions.length}` : `Step ${currentStep + 1}/${steps.length}`}</div>
      </div>
      <div style={respStyles.avatarContainer}>
        <div style={respStyles.bubbleContainer}>
          {showAvatarMessage && currentAvatarMessage && (
            <div style={respStyles.speechBubble}><span style={respStyles.bubbleText}>{currentAvatarMessage}</span><button onClick={() => setShowAvatarMessage(false)} style={respStyles.closeBubble}>✕</button></div>
          )}
          {!showAvatarMessage && <button onClick={() => { setShowAvatarMessage(true); setCurrentAvatarMessage(getRandomMessage('info')); }} style={respStyles.reopenBubble}>💬</button>}
        </div>
        <div style={respStyles.avatarWrapper}><img src={getAvatarImage()} alt="Assistant" style={respStyles.avatarImage} onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2310b981'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"; }} /></div>
      </div>
    </div>
  );
}

const respStyles = {
  container: { padding: '10px', minHeight: '100vh', backgroundColor: '#f3f4f6', position: 'relative', boxSizing: 'border-box', width: '100%', '@media (min-width: 769px)': { padding: '20px' } },
  headerRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' },
  resetButton: { backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', minHeight: '36px' },
  progressBar: { width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', marginBottom: '8px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s ease' },
  questionProgress: { textAlign: 'center', marginBottom: '10px', fontSize: '10px', fontWeight: 'bold', color: '#10b981' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 160px)', overflow: 'hidden', '@media (min-width: 769px)': { padding: '25px', maxHeight: 'calc(100vh - 200px)' } },
  scrollableContent: { flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '10px' },
  title: { fontSize: '16px', color: '#333', textAlign: 'center', marginBottom: '10px', flexShrink: 0 },
  infoContent: { textAlign: 'center', padding: '8px' },
  contentText: { fontSize: '13px', color: '#666', lineHeight: '1.4', marginBottom: '8px' },
  descriptionText: { fontSize: '12px', color: '#555', lineHeight: '1.4', marginBottom: '8px' },
  formulaBoxSmall: { backgroundColor: '#f3f4f6', padding: '10px', borderRadius: '8px', textAlign: 'center', marginTop: '10px' },
  formulaText: { fontSize: '12px', fontFamily: 'monospace', color: '#10b981', fontWeight: 'bold' },
  lessonContent: { padding: '8px', lineHeight: '1.5', fontSize: '12px' },
  quizContent: { padding: '4px' },
  questionNumber: { fontSize: '11px', color: '#10b981', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' },
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
  rewardBoxSmall: { backgroundColor: '#fef3c7', padding: '10px', borderRadius: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  claimButton: { backgroundColor: '#10b981', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '100%', minHeight: '44px' },
  claimedBox: { backgroundColor: '#d1fae5', padding: '10px', borderRadius: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' },
  claimedText: { fontSize: '12px', fontWeight: 'bold', color: '#065f46', margin: 0 },
  missionsListButton: { backgroundColor: '#6b7280', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '100%', minHeight: '44px' },
  buttonContainer: { display: 'flex', justifyContent: 'space-between', marginTop: '10px', gap: '8px', flexShrink: 0 },
  prevButton: { backgroundColor: '#6b7280', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', minHeight: '36px' },
  nextButton: { backgroundColor: '#10b981', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', minHeight: '36px' },
  disabledButton: { backgroundColor: '#9ca3af', cursor: 'not-allowed', opacity: 0.6 },
  stepIndicator: { textAlign: 'center', marginTop: '10px', fontSize: '10px', color: '#999', flexShrink: 0 },
  avatarContainer: { position: 'fixed', bottom: '10px', right: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 100 },
  bubbleContainer: { marginBottom: '6px', marginRight: '4px' },
  speechBubble: { backgroundColor: 'white', padding: '6px 10px', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', maxWidth: '160px', border: '2px solid #10b981' },
  bubbleText: { fontSize: '9px', color: '#333', lineHeight: '1.3' },
  closeBubble: { marginLeft: '6px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '9px', color: '#999' },
  reopenBubble: { borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', backgroundColor: '#10b981', color: 'white', border: 'none', fontSize: '16px', marginRight: '4px', marginBottom: '4px' },
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
  paragraph: { marginBottom: '10px', fontSize: '12px', color: '#555' },
  imageContainer: { textAlign: 'center', margin: '10px 0', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '10px' },
  lessonImage: { maxWidth: '100%', height: 'auto', borderRadius: '8px' },
  imageCaption: { fontSize: '10px', color: '#6b7280', marginTop: '6px', fontStyle: 'italic' },
  exampleBox: { backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '10px', marginTop: '12px' },
  exampleTitle: { color: '#0369a1', marginBottom: '10px', fontSize: '14px' },
  solutionBox: { backgroundColor: '#fefce8', padding: '10px', borderRadius: '8px', marginTop: '8px', fontSize: '11px' },
  resultBoxSmall: { backgroundColor: '#dcfce7', padding: '8px', borderRadius: '6px', marginTop: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }
};

const styleSheet = document.createElement("style");
styleSheet.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
button:active { transform: scale(0.98); }
@media (max-width: 480px) { button, .optionLabel { min-height: 40px; } }
@media (max-width: 360px) { .title { font-size: 14px !important; } .questionText { font-size: 12px !important; } .optionText { font-size: 10px !important; } .avatarWrapper { width: 45px !important; height: 45px !important; } }`;
if (!document.querySelector('#mission3-responsive-styles')) { styleSheet.id = 'mission3-responsive-styles'; document.head.appendChild(styleSheet); }

export default Mission3;