// src/missions/mission2.jsx - FULLY RESPONSIVE (optimized for 308x748 and all screen sizes)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Mission2({ user, userData, updateUserData, onComplete, saveToDatabase }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackAvatar, setFeedbackAvatar] = useState(null);
  const [canProceed, setCanProceed] = useState(true);
  const [showAvatarMessage, setShowAvatarMessage] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [currentAvatarMessage, setCurrentAvatarMessage] = useState("🧙 Welcome, young wizard! Ready to master linear equations?");
  const [isCompleting, setIsCompleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const questions = [
    {
      title: "Question 1: Linear Equation Definition",
      question: "What is a linear equation in two variables?",
      options: [
        "A first-degree equation whose graph is a straight line",
        "An equation with variables raised to powers greater than 1",
        "An equation whose graph is a curve",
        "An equation with no variables"
      ],
      correct: 0,
      explanation: "A linear equation has variables raised only to the first power, and its graph forms a straight line."
    },
    {
      title: "Question 2: Standard Form",
      question: "What is the standard form of a linear equation?",
      options: [
        "y = mx + b",
        "Ax + By = C",
        "x² + y² = r²",
        "y = x²"
      ],
      correct: 1,
      explanation: "The standard form is written as Ax + By = C, where A, B, and C are constants."
    },
    {
      title: "Question 3: Graph of Linear Equation",
      question: "Why is the graph of a linear equation a straight line?",
      options: [
        "Because it forms a curve",
        "Because the variables are squared",
        "Because it has no solution",
        "Because the rate of change is constant"
      ],
      correct: 3,
      explanation: "A linear equation has a constant slope (rate of change), which results in a straight line."
    },
    {
      title: "Question 4: Two Points Determine a Line",
      question: "How can two points determine a line?",
      options: [
        "They create a curve",
        "They give the slope and direction of the line",
        "They form a triangle",
        "They are not enough"
      ],
      correct: 1,
      explanation: "Two points uniquely determine a line because they allow you to compute the slope and define the line's direction."
    },
    {
      title: "Question 5: Calculate Slope",
      question: "What is the slope of the line passing through (2, 4) and (6, 8)?",
      options: ["1", "2", "-1", "4"],
      correct: 0,
      explanation: "Slope = (8-4)/(6-2) = 4/4 = 1"
    },
    {
      title: "Question 6: Equation from Two Points",
      question: "What is the equation of the line passing through (0, 3) and (4, 7)?",
      options: ["y = x + 3", "y = x - 3", "y = 2x + 3", "y = 4x + 7"],
      correct: 0,
      explanation: "Following the steps: x₁=0, y₁=3, x₂=4, y₂=7. y-3 = (7-3)/(4-0)(x-0) → y-3 = 4/4(x) → y-3 = x → y = x + 3"
    },
    {
      title: "Question 7: Comparing Slopes",
      question: "Compare the slopes of the lines through (1, 2) & (3, 6) and (2, 5) & (4, 9). What do you notice?",
      options: ["They are equal", "One is negative", "They are different", "One is zero"],
      correct: 0,
      explanation: "First slope = (6-2)/(3-1) = 4/2 = 2, Second slope = (9-5)/(4-2) = 4/2 = 2. Both slopes are equal."
    },
    {
      title: "Question 8: Parallel Lines",
      question: "Two lines pass through the points (1, 3) & (3, 7) and (2, 4) & (4, 8). What can you conclude?",
      options: [
        "The lines intersect at one point",
        "The lines are perpendicular",
        "The lines are parallel",
        "The lines are the same"
      ],
      correct: 2,
      explanation: "First line slope = (7-3)/(3-1)=4/2=2, Second line slope = (8-4)/(4-2)=4/2=2. Same slope means parallel."
    },
    {
      title: "Question 9: Verify Slope Claim",
      question: "A student claims the slope of the line through (1, 2) and (3, 4) is 1. Is the student correct?",
      options: [
        "Yes, because the slope is 1",
        "Yes, because the points are equal",
        "No, the slope is 2",
        "No, the slope is -1"
      ],
      correct: 0,
      explanation: "Slope = (4-2)/(3-1) = 2/2 = 1. The student is correct."
    },
    {
      title: "Question 10: Create Points for Equation",
      question: "If you create two ordered pairs of points that will generate the linear equation y = -x + 4, which points will you pick?",
      options: [
        "(0, 4) and (4, 0)",
        "(1, 1) and (2, 2)",
        "(0, 0) and (4, 4)",
        "(2, 4) and (4, 8)"
      ],
      correct: 0,
      explanation: "Slope = (0-4)/(4-0) = -4/4 = -1. When x=0, y=4 gives (0,4). When x=4, y=0 gives (4,0). Both satisfy y = -x + 4."
    }
  ];

  const steps = [
    {
      title: "🧙 MATH WIZARD CHALLENGE",
      content: "Welcome to the Math Wizard challenge! Answer these 10 questions about linear equations to prove your magical math skills!",
      description: "Each correct answer brings you closer to becoming a Math Wizard. Let's begin your journey!",
      type: "info"
    },
    {
      title: "LINEAR EQUATIONS - Lesson",
      content: (
        <div>
          <p style={lessonStyles.paragraph}>
            <strong>LINEAR EQUATION</strong> is a first-degree polynomial involving two variables, and its graph forms a straight line.
          </p>
          <p style={lessonStyles.paragraph}>
            Its standard form is expressed as <strong>Ax + By = C</strong>. The equation of a line can be found using different methods.
          </p>
          
          <div style={lessonStyles.imageContainer}>
            <img 
              src="/pics.png" 
              alt="Linear Equation Graph"
              style={lessonStyles.lessonImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect width='500' height='300' fill='%23f3f4f6'/%3E%3Cline x1='100' y1='200' x2='400' y2='100' stroke='%238b5cf6' stroke-width='3'/%3E%3Ccircle cx='120' cy='190' r='6' fill='%23ef4444'/%3E%3Ctext x='110' y='180' font-size='12' fill='%23ef4444'%3E(1,2)%3C/text%3E%3Ccircle cx='380' cy='110' r='6' fill='%23ef4444'/%3E%3Ctext x='370' y='100' font-size='12' fill='%23ef4444'%3E(5,-2)%3C/text%3E%3Ctext x='250' y='280' text-anchor='middle' fill='%23666' font-size='14'%3ELine: y = -x + 3%3C/text%3E%3C/svg%3E";
              }}
            />
            <p style={lessonStyles.imageCaption}>Figure 1: Line passing through points (1, 2) and (5, -2)</p>
          </div>
          
          <div style={lessonStyles.exampleBox}>
            <h4 style={lessonStyles.exampleTitle}>📐 Mission: Equation of a Line Using Two Points</h4>
            <p><strong>Two points:</strong> (x₁, y₁) and (x₂, y₂)</p>
            <p><strong>Example:</strong> Find the equation of the line through (1, 2) and (5, -2).</p>
            
            <div style={lessonStyles.solutionBox}>
              <p><strong>Solution:</strong> Use the <strong>Two-point Form</strong>:</p>
              <div style={lessonStyles.formulaBox}>
                <strong>y - y₁ = (y₂ - y₁)/(x₂ - x₁) × (x - x₁)</strong>
              </div>
              
              <p><strong>Step 1.</strong> Identify points: (x₁, y₁) = (1, 2); (x₂, y₂) = (5, -2)</p>
              <p><strong>Step 2.</strong> Substitute: y - 2 = [(-2) - 2]/[(5) - 1] × (x - 1)</p>
              <p><strong>Step 3.</strong> Simplify: y - 2 = (-4)/(4) × (x - 1) → y - 2 = -1 × (x - 1)</p>
              <p><strong>Step 4.</strong> Distribute: y - 2 = -x + 1</p>
              <p><strong>Step 5.</strong> Add 2 to both sides: y = -x + 3</p>
              
              <div style={lessonStyles.resultBox}>
                y = -x + 3 &nbsp;&nbsp;or&nbsp;&nbsp; x + y = 3
              </div>
            </div>
          </div>
        </div>
      ),
      type: "lesson"
    }
  ];

  for (let i = 0; i < questions.length; i++) {
    steps.push({ ...questions[i], type: "quiz" });
  }

  steps.push({
    title: "Mission Complete! 🎉",
    content: "Congratulations, Math Wizard! You've mastered all linear equation concepts!",
    result: "The equation is: y = -x + 3",
    note: "This line passes through the points (1, 2) and (5, -2)",
    type: "complete"
  });

  const avatarMessages = {
    happy: [
      "✨ Amazing! You're a true wizard!",
      "🧙 Perfect spell casting!",
      "🌟 Magical answer! Keep going!",
      "💫 You're mastering the arcane arts!",
      "🔮 The crystal ball shows success!",
      "📚 Excellent! One step closer!",
      "🏆 Magical performance! +250 XP awaits!"
    ],
    wrong: [
      "🤔 Oops! Let's review the linear equation concept!",
      "💡 Almost there! Try casting the spell again!",
      "📚 Not quite right. Check your understanding!",
      "✨ Don't give up! Practice makes perfect!",
      "🎯 Keep trying! The magic is within you!"
    ],
    info: [
      "💡 Remember: Linear equations have a constant slope!",
      "🧙 A true wizard masters the standard form Ax + By = C!",
      "🔮 Two points uniquely determine a line!",
      "✨ Practice finding slope using m = (y₂-y₁)/(x₂-x₁)!"
    ]
  };

  const getRandomMessage = (type) => {
    const messages = avatarMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleResetMission = () => setShowResetConfirm(true);

  const confirmReset = async () => {
    setIsResetting(true);
    try {
      if (user?.dbId) {
        await supabase.from('mission_progress').delete().eq('mission_id', 2).eq('student_id', user.dbId);
      }
      setCurrentStep(0);
      setAnswers({});
      setShowConfetti(false);
      setFeedbackAvatar(null);
      setCanProceed(true);
      setShowAvatarMessage(true);
      setShowResetConfirm(false);
      setCurrentAvatarMessage("🔄 Mission reset! Let's start fresh! You can do this! 💪");
      setTimeout(() => setShowAvatarMessage(false), 3000);
    } catch (error) {
      console.error('Error resetting mission:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
    setCurrentAvatarMessage("👍 Great choice! Let's continue with your wizard training!");
    setShowAvatarMessage(true);
    setTimeout(() => setShowAvatarMessage(false), 2000);
  };

  const handleAnswer = (stepIndex, answerIndex) => {
    const step = steps[stepIndex];
    const isCorrect = answerIndex === step.correct;
    const messageType = isCorrect ? 'happy' : 'wrong';
    setCurrentAvatarMessage(getRandomMessage(messageType));
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
          setFeedbackAvatar('wrong');
          setShowAvatarMessage(true);
          setTimeout(() => setFeedbackAvatar(null), 2000);
          return;
        }
        if (!canProceed) {
          setCurrentAvatarMessage("📚 You need to answer correctly to continue! Try again!");
          setFeedbackAvatar('wrong');
          setShowAvatarMessage(true);
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
        setCurrentAvatarMessage("🎉 You're almost there! Complete the mission to claim your reward!");
        setShowAvatarMessage(true);
        setTimeout(() => setShowAvatarMessage(false), 3000);
      } else {
        setShowAvatarMessage(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      const prevStep = steps[currentStep - 1];
      if (prevStep.type === 'quiz') {
        const prevAnswer = answers[currentStep - 1];
        setCanProceed(prevAnswer ? prevAnswer.isCorrect : true);
      } else {
        setCanProceed(true);
      }
      setFeedbackAvatar(null);
      setShowAvatarMessage(false);
    }
  };

  const saveMissionCompletion = async () => {
    try {
      if (!user?.dbId) return false;
      const { error } = await supabase.from('mission_progress').upsert({
        mission_id: 2, student_id: user.dbId, status: 'completed',
        completed_at: new Date().toISOString(), xp_earned: 250
      }, { onConflict: 'mission_id,student_id' });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving mission:', error);
      return false;
    }
  };

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    setShowConfetti(true);
    setCurrentAvatarMessage("🏆 CONGRATULATIONS, MATH WIZARD! You've mastered all linear equation concepts! +250 XP! 🎉");
    setFeedbackAvatar('happy');
    setShowAvatarMessage(true);

    const currentProgress = userData?.progress || {};
    const completedMissions = currentProgress.completedMissions || [];
    
    if (!completedMissions.includes(2)) {
      await saveMissionCompletion();
      const newTotalXP = (userData?.xp || 0) + 250;
      if (updateUserData) {
        updateUserData({
          xp: newTotalXP,
          progress: {
            ...currentProgress,
            missionsCompleted: (currentProgress.missionsCompleted || 0) + 1,
            completedMissions: [...completedMissions, 2],
            lastMissionCompleted: new Date().toISOString()
          }
        });
      }
      window.dispatchEvent(new CustomEvent('xpUpdated', { detail: { newXP: newTotalXP, missionId: 2 } }));
    }

    setTimeout(() => {
      if (onComplete) onComplete(true);
      else navigate('/studenthub/missions');
    }, 3000);
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    const currentAnswer = answers[currentStep];

    switch (step.type) {
      case "info":
        return (
          <div style={responsiveStyles.infoContent}>
            <p style={responsiveStyles.contentText}>{step.content}</p>
            <p style={responsiveStyles.descriptionText}>{step.description}</p>
            <div style={responsiveStyles.wizardContainer}>
              <span style={responsiveStyles.wizardBadge}>🧙</span>
              <span style={responsiveStyles.wizardBadge}>🔮</span>
              <span style={responsiveStyles.wizardBadge}>✨</span>
            </div>
            <div style={responsiveStyles.rewardPreview}>
              <span>🏆 Complete all questions to earn</span>
              <span style={responsiveStyles.rewardPreviewAmount}>+250 XP!</span>
            </div>
          </div>
        );
      case "lesson":
        return <div style={responsiveStyles.lessonContent}>{step.content}</div>;
      case "quiz":
        return (
          <div style={responsiveStyles.quizContent}>
            <div style={responsiveStyles.equationNumber}>Question {currentStep - 1} of {questions.length}</div>
            <p style={responsiveStyles.questionText}>{step.question}</p>
            <div style={responsiveStyles.optionsContainer}>
              {step.options.map((option, idx) => (
                <label key={idx} style={{
                  ...responsiveStyles.optionLabel,
                  ...(currentAnswer && currentAnswer.selected === idx && idx === step.correct ? responsiveStyles.correctOption : {}),
                  ...(currentAnswer && currentAnswer.selected === idx && idx !== step.correct ? responsiveStyles.wrongOption : {})
                }}>
                  <input type="radio" name={`q-${currentStep}`} value={idx}
                    checked={currentAnswer && currentAnswer.selected === idx}
                    onChange={() => handleAnswer(currentStep, idx)}
                    style={responsiveStyles.radio} />
                  <span style={responsiveStyles.optionText}>{option}</span>
                </label>
              ))}
            </div>
            {currentAnswer && (
              <div style={currentAnswer.isCorrect ? responsiveStyles.correctFeedback : responsiveStyles.incorrectFeedback}>
                {currentAnswer.isCorrect ? `✅ Correct! ${step.explanation}` : `❌ Incorrect. ${step.explanation}`}
              </div>
            )}
          </div>
        );
      case "complete":
        return (
          <div style={responsiveStyles.completeContent}>
            <p style={responsiveStyles.completeText}>{step.content}</p>
            <div style={responsiveStyles.resultBox}>
              <span style={responsiveStyles.resultIcon}>📐</span>
              <span style={responsiveStyles.resultText}>{step.result}</span>
            </div>
            <p style={responsiveStyles.noteText}>{step.note}</p>
            <div style={responsiveStyles.rewardBox}>
              <span style={responsiveStyles.rewardIcon}>🏆</span>
              <span style={responsiveStyles.rewardText}>+250 XP Earned!</span>
            </div>
            <button style={responsiveStyles.finishButton} onClick={handleComplete} disabled={isCompleting}>
              {isCompleting ? "Completing..." : "Claim Your Wizard Reward"}
            </button>
          </div>
        );
      default: return null;
    }
  };

  const getAvatarImage = () => {
    if (feedbackAvatar === 'happy') return '/avatar_happy.jpg';
    if (feedbackAvatar === 'wrong') return '/avatar_wrong.jpg';
    return '/avatar_happy.jpg';
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const questionsCompleted = Object.keys(answers).filter(key => answers[key] && answers[key].isCorrect).length;

  return (
    <div style={responsiveStyles.container}>
      {showConfetti && (
        <div style={responsiveStyles.confettiOverlay}>
          <div style={responsiveStyles.confettiMessage}>🎉 Mission Complete! 🎉<br />You earned 250 XP!<br />You are now a Math Wizard! 🧙</div>
        </div>
      )}

      {showResetConfirm && (
        <div style={responsiveStyles.modalOverlay}>
          <div style={responsiveStyles.modalContent}>
            <h3 style={responsiveStyles.modalTitle}>🔄 Reset Mission?</h3>
            <p style={responsiveStyles.modalText}>Are you sure you want to reset this mission? All your progress will be lost.</p>
            <div style={responsiveStyles.modalButtons}>
              <button style={responsiveStyles.confirmResetBtn} onClick={confirmReset} disabled={isResetting}>
                {isResetting ? 'Resetting...' : 'Yes, Reset'}
              </button>
              <button style={responsiveStyles.cancelResetBtn} onClick={cancelReset}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={responsiveStyles.headerRow}>
        <button style={responsiveStyles.resetButton} onClick={handleResetMission}>🔄 Reset</button>
      </div>

      <div style={responsiveStyles.progressBar}>
        <div style={{ ...responsiveStyles.progressFill, width: `${progressPercentage}%` }} />
      </div>

      {steps[currentStep].type === 'quiz' && (
        <div style={responsiveStyles.equationProgress}>
          <span>🧙 Mastered: {questionsCompleted}/{questions.length}</span>
          <span style={responsiveStyles.xpPreview}>✨ +250 XP</span>
        </div>
      )}

      <div style={responsiveStyles.card}>
        <h2 style={responsiveStyles.title}>{steps[currentStep].title}</h2>
        <div style={responsiveStyles.scrollableContent}>{renderStepContent()}</div>
        
        <div style={responsiveStyles.buttonContainer}>
          {currentStep > 0 && <button style={responsiveStyles.prevButton} onClick={handlePrevious}>← Prev</button>}
          {currentStep < steps.length - 1 && steps[currentStep].type !== 'complete' && (
            <button style={{
              ...responsiveStyles.nextButton,
              ...(steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep]) ? responsiveStyles.disabledButton : {})
            }} onClick={handleNext} disabled={steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep])}>
              Next →
            </button>
          )}
        </div>
        
        <div style={responsiveStyles.stepIndicator}>
          {steps[currentStep].type === 'quiz' ? `Q${currentStep - 1}/${questions.length}` : `Step ${currentStep + 1}/${steps.length}`}
        </div>
      </div>

      <div style={responsiveStyles.avatarContainer}>
        <div style={responsiveStyles.bubbleContainer}>
          {showAvatarMessage && currentAvatarMessage && (
            <div style={responsiveStyles.speechBubble}>
              <span style={responsiveStyles.bubbleText}>{currentAvatarMessage}</span>
              <button onClick={() => setShowAvatarMessage(false)} style={responsiveStyles.closeBubble}>✕</button>
            </div>
          )}
          {!showAvatarMessage && (
            <button onClick={() => { setShowAvatarMessage(true); setCurrentAvatarMessage(getRandomMessage('info')); }} style={responsiveStyles.reopenBubble}>💬</button>
          )}
        </div>
        <div style={responsiveStyles.avatarWrapper}>
          <img src={getAvatarImage()} alt="Assistant" style={responsiveStyles.avatarImage}
            onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%238b5cf6'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"; }} />
        </div>
      </div>
    </div>
  );
}

const responsiveStyles = {
  container: {
    padding: '10px',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    position: 'relative',
    boxSizing: 'border-box',
    width: '100%',
    '@media (min-width: 769px)': { padding: '20px' }
  },
  headerRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' },
  resetButton: {
    backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', border: 'none',
    borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
    minHeight: '36px', '@media (min-width: 769px)': { padding: '8px 16px', fontSize: '13px', minHeight: '40px' }
  },
  progressBar: { width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', marginBottom: '8px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#8b5cf6', transition: 'width 0.3s ease' },
  equationProgress: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px',
    fontSize: '10px', fontWeight: 'bold', color: '#8b5cf6', padding: '6px 10px',
    backgroundColor: '#ede9fe', borderRadius: '8px', '@media (min-width: 769px)': { fontSize: '14px', padding: '8px 12px' }
  },
  xpPreview: { color: '#d97706', fontSize: '9px', '@media (min-width: 769px)': { fontSize: '12px' } },
  rewardPreview: { marginTop: '16px', padding: '10px', backgroundColor: '#fef3c7', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', flexWrap: 'wrap', gap: '6px' },
  rewardPreviewAmount: { fontWeight: 'bold', color: '#d97706', fontSize: '14px' },
  card: {
    backgroundColor: 'white', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 160px)', overflow: 'hidden',
    '@media (min-width: 769px)': { padding: '25px', borderRadius: '16px', maxHeight: 'calc(100vh - 200px)' }
  },
  scrollableContent: { flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '10px' },
  title: { fontSize: '16px', color: '#333', textAlign: 'center', marginBottom: '10px', flexShrink: 0, '@media (min-width: 769px)': { fontSize: '24px', marginBottom: '15px' } },
  infoContent: { textAlign: 'center', padding: '8px' },
  contentText: { fontSize: '13px', color: '#666', lineHeight: '1.4', marginBottom: '8px', '@media (min-width: 769px)': { fontSize: '15px' } },
  descriptionText: { fontSize: '12px', color: '#555', lineHeight: '1.4', marginBottom: '8px', '@media (min-width: 769px)': { fontSize: '15px' } },
  wizardContainer: { display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px' },
  wizardBadge: { fontSize: '28px', '@media (min-width: 769px)': { fontSize: '40px' } },
  lessonContent: { padding: '8px', lineHeight: '1.5', fontSize: '12px' },
  quizContent: { padding: '4px' },
  equationNumber: { fontSize: '11px', color: '#8b5cf6', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' },
  questionText: { fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '12px', '@media (min-width: 769px)': { fontSize: '18px', marginBottom: '20px' } },
  optionsContainer: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' },
  optionLabel: { display: 'flex', alignItems: 'center', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' },
  correctOption: { backgroundColor: '#d1fae5', borderColor: '#10b981' },
  wrongOption: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  radio: { marginRight: '8px', cursor: 'pointer', width: '16px', height: '16px' },
  optionText: { fontSize: '11px', color: '#333', '@media (min-width: 769px)': { fontSize: '14px' } },
  correctFeedback: { padding: '8px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '8px', marginTop: '8px', fontSize: '11px' },
  incorrectFeedback: { padding: '8px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginTop: '8px', fontSize: '11px' },
  completeContent: { textAlign: 'center', padding: '8px' },
  completeText: { fontSize: '14px', color: '#333', marginBottom: '12px', '@media (min-width: 769px)': { fontSize: '18px' } },
  resultBox: { backgroundColor: '#ede9fe', padding: '10px', borderRadius: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' },
  resultIcon: { fontSize: '24px' },
  resultText: { fontSize: '16px', fontWeight: 'bold', color: '#6d28d9' },
  noteText: { fontSize: '11px', color: '#666', marginBottom: '12px', fontStyle: 'italic' },
  rewardBox: { backgroundColor: '#fef3c7', padding: '10px', borderRadius: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  rewardIcon: { fontSize: '24px' },
  rewardText: { fontSize: '14px', fontWeight: 'bold', color: '#d97706' },
  finishButton: { backgroundColor: '#8b5cf6', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', width: '100%', minHeight: '44px' },
  buttonContainer: { display: 'flex', justifyContent: 'space-between', marginTop: '10px', gap: '8px', flexShrink: 0 },
  prevButton: { backgroundColor: '#6b7280', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', minHeight: '36px' },
  nextButton: { backgroundColor: '#8b5cf6', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', minHeight: '36px' },
  disabledButton: { backgroundColor: '#c4b5fd', cursor: 'not-allowed', opacity: 0.6 },
  stepIndicator: { textAlign: 'center', marginTop: '10px', fontSize: '10px', color: '#999', flexShrink: 0 },
  avatarContainer: { position: 'fixed', bottom: '10px', right: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 100 },
  bubbleContainer: { marginBottom: '6px', marginRight: '4px' },
  speechBubble: { backgroundColor: 'white', padding: '6px 10px', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', maxWidth: '160px', border: '2px solid #8b5cf6' },
  bubbleText: { fontSize: '9px', color: '#333', lineHeight: '1.3', '@media (min-width: 769px)': { fontSize: '12px' } },
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
  cancelResetBtn: { backgroundColor: '#6b7280', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', minHeight: '40px' }
};

const lessonStyles = {
  paragraph: { marginBottom: '10px', fontSize: '12px', color: '#555', '@media (min-width: 769px)': { fontSize: '14px' } },
  imageContainer: { textAlign: 'center', margin: '10px 0', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '10px' },
  lessonImage: { maxWidth: '100%', height: 'auto', borderRadius: '8px' },
  imageCaption: { fontSize: '10px', color: '#6b7280', marginTop: '6px', fontStyle: 'italic' },
  exampleBox: { backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '10px', marginTop: '12px' },
  exampleTitle: { color: '#0369a1', marginBottom: '10px', fontSize: '14px' },
  solutionBox: { backgroundColor: '#fefce8', padding: '10px', borderRadius: '8px', marginTop: '8px', fontSize: '11px' },
  formulaBox: { backgroundColor: '#e0f2fe', padding: '8px', borderRadius: '6px', margin: '8px 0', textAlign: 'center', fontSize: '11px' },
  resultBox: { backgroundColor: '#dcfce7', padding: '8px', borderRadius: '6px', marginTop: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }
};

const styleSheet = document.createElement("style");
styleSheet.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
@keyframes bubblePop { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
button:active { transform: scale(0.98); transition: transform 0.05s; }
@media (max-width: 480px) { button, .optionLabel { min-height: 40px; } input, textarea, select { font-size: 16px !important; } }
@media (max-width: 360px) { .title { font-size: 14px !important; } .questionText { font-size: 12px !important; } .optionText { font-size: 10px !important; } .avatarWrapper { width: 45px !important; height: 45px !important; } .speechBubble { max-width: 130px !important; } .bubbleText { font-size: 8px !important; } }`;
if (!document.querySelector('#mission2-responsive-styles')) { styleSheet.id = 'mission2-responsive-styles'; document.head.appendChild(styleSheet); }

export default Mission2;