// src/missions/mission5.jsx
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
  const [currentAvatarMessage, setCurrentAvatarMessage] = useState("📐 Welcome! Ready to learn about Point-Slope Form?");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRewardClaimed, setShowRewardClaimed] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);

  const MISSION_ID = 5;
  const MISSION_XP = 600;

  // Check if mission is already completed on load
  useEffect(() => {
    const checkCompletion = async () => {
      if (user?.dbId) {
        const { data } = await supabase
          .from('mission_progress')
          .select('status')
          .eq('mission_id', MISSION_ID)
          .eq('student_id', user.dbId)
          .maybeSingle();
        
        if (data?.status === 'completed') {
          setIsAlreadyCompleted(true);
          setShowRewardClaimed(true);
          setCurrentStep(10); // Go to complete screen (last step index)
        }
      }
    };
    checkCompletion();
  }, [user?.dbId]);

  const steps = [
    {
      title: "📐 POINT-SLOPE FORM MISSION",
      content: "Welcome to the Point-Slope Form mission! Learn how to find the equation of a line using a point and the slope.",
      description: "The point-slope form is: y - y₁ = m(x - x₁), where m is the slope and (x₁, y₁) is a point on the line.",
      showImage: true,
      imagePath: "/image5.png",
      type: "info"
    },
    {
      title: "Example: Point-Slope Form",
      content: "Example: Find the equation of a line that passes through the point (2, 3) with a slope of 4.",
      solution: "Step 1: Identify the point (x₁, y₁) = (2, 3) and slope m = 4\nStep 2: Substitute into y - y₁ = m(x - x₁)\ny - 3 = 4(x - 2)\nStep 3: Simplify to slope-intercept form\ny - 3 = 4x - 8\ny = 4x - 5\nFinal equation: y = 4x - 5 (slope-intercept form) or 4x - y = 5 (standard form)",
      type: "lesson"
    },
    {
      title: "Question 1: Point-Slope Form",
      question: "What is the general form of the point-slope equation?",
      options: [
        "y = mx + b",
        "Ax + By = C",
        "y - y₁ = m(x - x₁)",
        "x/a + y/b = 1"
      ],
      correct: 2,
      explanation: "The point-slope form is y - y₁ = m(x - x₁), where m is the slope and (x₁, y₁) is a point on the line.",
      type: "quiz"
    },
    {
      title: "Question 2: Identify Components",
      question: "In the equation y - 5 = 2(x - 3), what is the slope and what point does it pass through?",
      options: [
        "m = 5, point (2, 3)",
        "m = 2, point (3, 5)",
        "m = 2, point (5, 3)",
        "m = 3, point (2, 5)"
      ],
      correct: 1,
      explanation: "Comparing with y - y₁ = m(x - x₁), we have m = 2, x₁ = 3, y₁ = 5, so the point is (3, 5).",
      type: "quiz"
    },
    {
      title: "Question 3: Using Point-Slope Form",
      question: "Which equation represents a line with slope -2 passing through the point (1, 4)?",
      options: [
        "y - 4 = -2(x - 1)",
        "y + 4 = -2(x + 1)",
        "y - 1 = -2(x - 4)",
        "y - 4 = 2(x - 1)"
      ],
      correct: 0,
      explanation: "Substitute m = -2, x₁ = 1, y₁ = 4 into y - y₁ = m(x - x₁) → y - 4 = -2(x - 1).",
      type: "quiz"
    },
    {
      title: "Question 4: Convert to Slope-Intercept",
      question: "Convert y - 3 = 5(x - 2) to slope-intercept form (y = mx + b).",
      options: [
        "y = 5x + 7",
        "y = 5x - 7",
        "y = 5x + 13",
        "y = 5x - 13"
      ],
      correct: 1,
      explanation: "y - 3 = 5(x - 2) → y - 3 = 5x - 10 → y = 5x - 7.",
      type: "quiz"
    },
    {
      title: "Question 5: Find Equation from Point and Slope",
      question: "Find the equation of a line with slope 3 passing through the point (-2, 5).",
      options: [
        "y = 3x + 11",
        "y = 3x - 1",
        "y = 3x + 1",
        "y = 3x - 11"
      ],
      correct: 0,
      explanation: "y - 5 = 3(x + 2) → y - 5 = 3x + 6 → y = 3x + 11.",
      type: "quiz"
    },
    {
      title: "Question 6: Identify Point and Slope",
      question: "For the equation y + 4 = -3(x - 6), what is the point and slope?",
      options: [
        "(4, 6), m = -3",
        "(-4, 6), m = -3",
        "(6, -4), m = -3",
        "(-6, 4), m = -3"
      ],
      correct: 2,
      explanation: "Rewrite as y - (-4) = -3(x - 6), so point is (6, -4) and m = -3.",
      type: "quiz"
    },
    {
      title: "Question 7: Real-World Application",
      question: "A line passes through the point (4, -2) with a slope of -1/2. What is its equation in slope-intercept form?",
      options: [
        "y = -1/2x",
        "y = -1/2x + 2",
        "y = -1/2x - 4",
        "y = -1/2x - 2"
      ],
      correct: 0,
      explanation: "y - (-2) = -1/2(x - 4) → y + 2 = -1/2x + 2 → y = -1/2x.",
      type: "quiz"
    },
    {
      title: "Question 8: Standard Form Conversion",
      question: "Convert y - 2 = 4(x - 1) to standard form (Ax + By = C).",
      options: [
        "4x - y = 2",
        "4x + y = 2",
        "4x - y = -2",
        "4x + y = -2"
      ],
      correct: 0,
      explanation: "y - 2 = 4x - 4 → y = 4x - 2 → 4x - y = 2.",
      type: "quiz"
    },
    {
      title: "Question 9: Two Points to Point-Slope",
      question: "What is the point-slope form of the line passing through (2, 5) and (4, 11)?",
      options: [
        "y - 5 = 3(x - 2)",
        "y - 2 = 3(x - 5)",
        "y - 5 = 6(x - 2)",
        "y - 11 = 3(x - 4)"
      ],
      correct: 0,
      explanation: "Slope = (11-5)/(4-2) = 6/2 = 3. Using point (2, 5): y - 5 = 3(x - 2).",
      type: "quiz"
    },
    {
      title: "Mission Complete! 🎉",
      content: "Congratulations! You've mastered the Point-Slope Form mission!",
      result: "You now know how to find equations using a point and slope!",
      note: "The point-slope form y - y₁ = m(x - x₁) is perfect when you know a point and the slope!",
      type: "complete"
    }
  ];

  const avatarMessages = {
    happy: [
      "📐 Excellent! You're mastering point-slope form!",
      "✨ Perfect! y - y₁ = m(x - x₁) is clear to you!",
      "🌟 Great job! Keep going!",
      "💫 You're becoming a linear equations expert!",
      "📏 The point-slope form is easy for you now!",
      "📚 Excellent work! One step closer!",
      "🏆 Amazing! You've got this!"
    ],
    wrong: [
      "🤔 Oops! Let's review point-slope form!",
      "💡 Almost there! Remember: y - y₁ = m(x - x₁)",
      "📚 Not quite right. Check your substitution!",
      "✨ Don't give up! Practice makes perfect!",
      "🎯 Keep trying! You'll master point-slope form!",
      "💪 Every mistake teaches us something! Try again!",
      "🌟 Focus on identifying m, x₁, and y₁ correctly!"
    ],
    info: [
      "💡 Remember: Point-slope form is y - y₁ = m(x - x₁)!",
      "📈 m is the slope, (x₁, y₁) is a point on the line!",
      "🔢 The point-slope form is great when you know a point and slope!",
      "✨ You can convert point-slope to slope-intercept by distributing!",
      "📚 Keep practicing your point-slope skills!"
    ]
  };

  const getRandomMessage = (type) => {
    const messages = avatarMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleResetMission = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowConfetti(false);
    setFeedbackAvatar(null);
    setCanProceed(true);
    setShowAvatarMessage(true);
    setShowResetConfirm(false);
    setShowRewardClaimed(false);
    setIsAlreadyCompleted(false);
    setCurrentAvatarMessage("🔄 Mission reset! Let's start fresh! You can do this! 💪");
    
    setTimeout(() => {
      setShowAvatarMessage(false);
    }, 3000);
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
    setCurrentAvatarMessage("👍 Great choice! Let's continue with your progress!");
    setShowAvatarMessage(true);
    setTimeout(() => {
      setShowAvatarMessage(false);
    }, 2000);
  };

  const handleAnswer = (stepIndex, answerIndex) => {
    const step = steps[stepIndex];
    const isCorrect = answerIndex === step.correct;
    
    const messageType = isCorrect ? 'happy' : 'wrong';
    const randomMessage = getRandomMessage(messageType);
    setCurrentAvatarMessage(randomMessage);
    
    setFeedbackAvatar(isCorrect ? 'happy' : 'wrong');
    setCanProceed(isCorrect);
    setShowAvatarMessage(true);
    
    setAnswers({
      ...answers,
      [stepIndex]: answerIndex
    });
    
    setTimeout(() => {
      setFeedbackAvatar(null);
    }, 3000);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      if (steps[currentStep].type === 'quiz') {
        if (answers[currentStep] === undefined) {
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
      } else if (steps[currentStep + 1]?.type === 'lesson') {
        setCurrentAvatarMessage("📖 Let's learn how to use point-slope form!");
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
        setCanProceed(prevAnswer === prevStep.correct);
      } else {
        setCanProceed(true);
      }
      setFeedbackAvatar(null);
      setShowAvatarMessage(false);
    }
  };

  // Save mission completion to database
  const saveMissionCompletion = async () => {
    try {
      if (!user?.dbId) return false;
      
      const { error } = await supabase
        .from('mission_progress')
        .upsert({
          mission_id: MISSION_ID,
          student_id: user.dbId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          xp_earned: MISSION_XP,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'mission_id,student_id'
        });
      
      if (error) {
        console.error('Error saving mission progress:', error);
        return false;
      }
      
      // Save to localStorage as backup
      const storedCompleted = localStorage.getItem('completedMissions');
      let completedIds = storedCompleted ? JSON.parse(storedCompleted) : [];
      if (!completedIds.includes(MISSION_ID)) {
        completedIds.push(MISSION_ID);
        localStorage.setItem('completedMissions', JSON.stringify(completedIds));
      }
      
      return true;
    } catch (error) {
      console.error('Error in saveMissionCompletion:', error);
      return false;
    }
  };

  // Function to go to mission list (back to all missions)
  const goToMissionsList = () => {
    if (onComplete) {
      onComplete(); // Go back to missions list
    } else {
      navigate('/studenthub/missions');
    }
  };

  const handleComplete = async () => {
    if (isCompleting || isAlreadyCompleted) return;
    setIsCompleting(true);
    
    setShowConfetti(true);
    setCurrentAvatarMessage(`🏆 CONGRATULATIONS! You've mastered the Point-Slope Form mission! +${MISSION_XP} XP! 🎉`);
    setFeedbackAvatar('happy');
    setShowAvatarMessage(true);
    
    // Save to database
    await saveMissionCompletion();
    
    const currentProgress = userData?.progress || {};
    const completedMissions = currentProgress.completedMissions || [];
    const currentMissionsCompleted = currentProgress.missionsCompleted || 0;
    const currentTotalXP = userData?.xp || 0;
    
    if (!completedMissions.includes(MISSION_ID) && updateUserData) {
      const newTotalXP = currentTotalXP + MISSION_XP;
      const newMissionsCompleted = currentMissionsCompleted + 1;
      
      updateUserData({
        xp: newTotalXP,
        progress: {
          ...currentProgress,
          missionsCompleted: newMissionsCompleted,
          completedMissions: [...completedMissions, MISSION_ID],
          lastMissionCompleted: new Date().toISOString(),
          totalXP: newTotalXP
        }
      });
      
      window.dispatchEvent(new CustomEvent('xpUpdated', { 
        detail: { newXP: newTotalXP, missionId: MISSION_ID }
      }));
      
      window.dispatchEvent(new CustomEvent('missionCompleted', {
        detail: { missionId: MISSION_ID }
      }));
    }
    
    setShowRewardClaimed(true);
    setIsAlreadyCompleted(true);
    
    setTimeout(() => {
      setShowConfetti(false);
    }, 2000);
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    const currentAnswer = answers[currentStep];

    switch (step.type) {
      case "info":
        return (
          <div style={styles.infoContent}>
            <p style={styles.contentText}>{step.content}</p>
            <p style={styles.descriptionText}>{step.description}</p>
            {step.showImage && step.imagePath && (
              <div style={styles.imageContainer}>
                <img 
                  src={step.imagePath} 
                  alt="Point-Slope Form Concept"
                  style={styles.infoImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23f3f4f6'/%3E%3Ctext x='200' y='120' text-anchor='middle' fill='%23666'%3EPoint-Slope Form Concept%3C/text%3E%3Ctext x='200' y='145' text-anchor='middle' fill='%23999' font-size='12'%3EImage: y - y₁ = m(x - x₁) Illustration%3C/text%3E%3C/svg%3E";
                  }}
                />
                <p style={styles.imageCaption}>Figure 1: Point-Slope Form (y - y₁ = m(x - x₁))</p>
              </div>
            )}
            <div style={styles.formulaBox}>
              <p style={styles.formulaText}>Point-Slope Form: y - y₁ = m(x - x₁)</p>
              <p style={styles.formulaSubtext}>m = slope, (x₁, y₁) = a point on the line</p>
            </div>
          </div>
        );

      case "lesson":
        return (
          <div style={styles.lessonContent}>
            <p style={styles.contentText}>{step.content}</p>
            <div style={styles.exampleBox}>
              <h3 style={styles.exampleTitle}>Solution:</h3>
              <pre style={styles.solutionText}>{step.solution}</pre>
            </div>
          </div>
        );

      case "quiz":
        return (
          <div style={styles.quizContent}>
            <div style={styles.questionNumber}>
              Question {currentStep - 1} of {steps.length - 2}
            </div>
            <p style={styles.questionText}>{step.question}</p>
            <div style={styles.optionsContainer}>
              {step.options.map((option, idx) => (
                <label 
                  key={idx} 
                  style={{
                    ...styles.optionLabel,
                    ...(answers[currentStep] === idx && idx === step.correct ? styles.correctOption : {}),
                    ...(answers[currentStep] === idx && idx !== step.correct ? styles.wrongOption : {})
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${currentStep}`}
                    value={idx}
                    checked={answers[currentStep] === idx}
                    onChange={() => handleAnswer(currentStep, idx)}
                    style={styles.radio}
                  />
                  <span style={styles.optionText}>{option}</span>
                </label>
              ))}
            </div>
            {answers[currentStep] !== undefined && (
              <div style={answers[currentStep] === step.correct ? styles.correctFeedback : styles.incorrectFeedback}>
                {answers[currentStep] === step.correct ? 
                  `✅ ${step.explanation}` : 
                  `❌ ${step.explanation}`}
              </div>
            )}
          </div>
        );

      case "complete":
        return (
          <div style={styles.completeContent}>
            {!showRewardClaimed ? (
              <>
                <p style={styles.completeText}>{step.content}</p>
                <div style={styles.resultBox}>
                  <span style={styles.resultIcon}>📐</span>
                  <span style={styles.resultText}>{step.result}</span>
                </div>
                <p style={styles.noteText}>{step.note}</p>
                <div style={styles.rewardBox}>
                  <span style={styles.rewardIcon}>🏆</span>
                  <span style={styles.rewardText}>+{MISSION_XP} XP Reward!</span>
                </div>
                <button 
                  style={styles.claimButton} 
                  onClick={handleComplete}
                  disabled={isCompleting}
                >
                  {isCompleting ? "Claiming..." : "🎁 Claim Your Reward"}
                </button>
              </>
            ) : (
              <>
                <div style={styles.claimedBox}>
                  <span style={styles.claimedIcon}>✅</span>
                  <p style={styles.claimedText}>Mission Completed! +{MISSION_XP} XP Earned!</p>
                </div>
                <div style={styles.resultBox}>
                  <span style={styles.resultIcon}>📐</span>
                  <span style={styles.resultText}>{step.result}</span>
                </div>
                <div style={styles.actionButtons}>
                  <button 
                    style={styles.missionsListButton} 
                    onClick={goToMissionsList}
                  >
                    📋 Back to All Missions
                  </button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getAvatarImage = () => {
    if (feedbackAvatar === 'happy') return '/avatar_happy.jpg';
    if (feedbackAvatar === 'wrong') return '/avatar_wrong.jpg';
    return '/avatar_happy.jpg';
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const questionsCompleted = Math.max(0, currentStep - 1);

  // If already completed, show the completed screen directly
  if (isAlreadyCompleted && currentStep !== steps.length - 1 && !showRewardClaimed) {
    setTimeout(() => {
      setCurrentStep(steps.length - 1);
      setShowRewardClaimed(true);
    }, 100);
    return null;
  }

  return (
    <div style={styles.container}>
      {showConfetti && (
        <div style={styles.confettiOverlay}>
          <div style={styles.confettiMessage}>
            🎉 +{MISSION_XP} XP Earned! 🎉
            <br />
            You've mastered Point-Slope Form! 📐
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>🔄 Reset Mission?</h3>
            <p style={styles.modalText}>Are you sure you want to reset this mission? All your progress will be lost.</p>
            <div style={styles.modalButtons}>
              <button style={styles.confirmResetBtn} onClick={confirmReset}>
                Yes, Reset
              </button>
              <button style={styles.cancelResetBtn} onClick={cancelReset}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={styles.headerRow}>
        {!showRewardClaimed && (
          <button style={styles.resetButton} onClick={handleResetMission} title="Reset Mission">
            🔄 Reset Mission
          </button>
        )}
      </div>

      <div style={styles.progressBar}>
        <div 
          style={{
            ...styles.progressFill,
            width: `${progressPercentage}%`
          }}
        />
      </div>

      {steps[currentStep].type === 'quiz' && !showRewardClaimed && (
        <div style={styles.questionProgress}>
          <span>📐 Questions Mastered: {questionsCompleted}/{steps.length - 2}</span>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={styles.title}>{steps[currentStep].title}</h2>
        
        <div style={styles.scrollableContent}>
          {renderStepContent()}
        </div>
        
        {currentStep < steps.length - 1 && steps[currentStep].type !== 'complete' && !showRewardClaimed && (
          <div style={styles.buttonContainer}>
            {currentStep > 0 && (
              <button style={styles.prevButton} onClick={handlePrevious}>
                ← Previous
              </button>
            )}
            
            <button 
              style={{
                ...styles.nextButton,
                ...(steps[currentStep].type === 'quiz' && (!canProceed || answers[currentStep] === undefined) ? styles.disabledButton : {})
              }}
              onClick={handleNext}
              disabled={steps[currentStep].type === 'quiz' && (!canProceed || answers[currentStep] === undefined)}
            >
              Next →
            </button>
          </div>
        )}
        
        <div style={styles.stepIndicator}>
          {steps[currentStep].type === 'quiz' && !showRewardClaimed
            ? `Question ${currentStep - 1} of ${steps.length - 2}` 
            : `Step ${currentStep + 1} of ${steps.length}`}
        </div>
      </div>

      {/* Avatar Assistant at Bottom */}
      <div style={styles.avatarContainer}>
        <div style={styles.bubbleContainer}>
          {showAvatarMessage && currentAvatarMessage && (
            <div style={styles.speechBubble}>
              <span style={styles.bubbleText}>{currentAvatarMessage}</span>
              <button 
                onClick={() => setShowAvatarMessage(false)} 
                style={styles.closeBubble}
              >
                ✕
              </button>
            </div>
          )}
          {!showAvatarMessage && (
            <button 
              onClick={() => {
                setShowAvatarMessage(true);
                setCurrentAvatarMessage(getRandomMessage('info'));
              }} 
              style={styles.reopenBubble}
            >
              💬
            </button>
          )}
        </div>

        <div style={styles.avatarWrapper}>
          <img
            src={getAvatarImage()}
            alt="Learning Assistant"
            style={styles.avatarImage}
            onError={(e) => {
              e.target.onerror = null;
              if (feedbackAvatar === 'happy') {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%232563eb'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
              } else if (feedbackAvatar === 'wrong') {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23ef4444'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 70 L65 70' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
              } else {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%232563eb'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    flexDirection: 'column',
  },
  
  headerRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '10px',
  },
  
  resetButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    marginBottom: '10px',
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    transition: 'width 0.3s ease',
    borderRadius: '4px',
  },
  
  questionProgress: {
    textAlign: 'center',
    marginBottom: '15px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '25px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 180px)',
    overflow: 'hidden',
  },
  
  scrollableContent: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '10px',
    marginBottom: '15px',
  },
  
  title: {
    fontSize: '24px',
    color: '#333',
    textAlign: 'center',
    marginBottom: '15px',
    flexShrink: 0,
  },
  
  infoContent: {
    textAlign: 'center',
    padding: '15px',
  },
  
  contentText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '12px',
  },
  
  descriptionText: {
    fontSize: '15px',
    color: '#555',
    lineHeight: '1.5',
    marginBottom: '12px',
  },
  
  imageContainer: {
    textAlign: 'center',
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  
  infoImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  
  imageCaption: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '8px',
    fontStyle: 'italic',
  },
  
  formulaBox: {
    backgroundColor: '#ede9fe',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    marginTop: '15px',
    border: '1px solid #8b5cf6',
  },
  
  formulaText: {
    fontSize: '18px',
    fontFamily: 'monospace',
    color: '#6d28d9',
    fontWeight: 'bold',
  },
  
  formulaSubtext: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px',
  },
  
  lessonContent: {
    padding: '5px',
  },
  
  exampleBox: {
    backgroundColor: '#ede9fe',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '15px',
    borderLeft: '4px solid #8b5cf6',
  },
  
  exampleTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#6d28d9',
    marginBottom: '10px',
  },
  
  solutionText: {
    fontSize: '14px',
    color: '#333',
    whiteSpace: 'pre-wrap',
    fontFamily: 'monospace',
    lineHeight: '1.6',
  },
  
  quizContent: {
    padding: '5px',
  },
  
  questionNumber: {
    fontSize: '14px',
    color: '#8b5cf6',
    fontWeight: 'bold',
    marginBottom: '15px',
    textAlign: 'center',
  },
  
  questionText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center',
  },
  
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  correctOption: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  
  wrongOption: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  
  radio: {
    marginRight: '10px',
    cursor: 'pointer',
  },
  
  optionText: {
    fontSize: '14px',
    color: '#333',
  },
  
  correctFeedback: {
    padding: '10px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    marginTop: '10px',
    fontSize: '13px',
  },
  
  incorrectFeedback: {
    padding: '10px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    marginTop: '10px',
    fontSize: '13px',
  },
  
  completeContent: {
    textAlign: 'center',
    padding: '15px',
  },
  
  completeText: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '20px',
  },
  
  resultBox: {
    backgroundColor: '#ede9fe',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  
  resultIcon: {
    fontSize: '32px',
  },
  
  resultText: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#6d28d9',
  },
  
  noteText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
    fontStyle: 'italic',
  },
  
  rewardBox: {
    backgroundColor: '#ede9fe',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  
  rewardIcon: {
    fontSize: '28px',
  },
  
  rewardText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#6d28d9',
  },
  
  claimButton: {
    backgroundColor: '#8b5cf6',
    color: 'white',
    padding: '14px 24px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    width: '100%',
    transition: 'all 0.2s',
  },
  
  claimedBox: {
    backgroundColor: '#ede9fe',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  
  claimedIcon: {
    fontSize: '24px',
  },
  
  claimedText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#5b21b6',
    margin: 0,
  },
  
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '15px',
  },
  
  missionsListButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    width: '100%',
    transition: 'all 0.2s',
  },
  
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '15px',
    gap: '10px',
    flexShrink: 0,
  },
  
  prevButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '8px 18px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  
  nextButton: {
    backgroundColor: '#8b5cf6',
    color: 'white',
    padding: '8px 18px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  
  disabledButton: {
    backgroundColor: '#c4b5fd',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  
  stepIndicator: {
    textAlign: 'center',
    marginTop: '12px',
    fontSize: '12px',
    color: '#999',
    flexShrink: 0,
  },
  
  avatarContainer: {
    position: 'fixed',
    bottom: '15px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    zIndex: 100,
  },
  
  bubbleContainer: {
    marginBottom: '8px',
    marginRight: '5px',
  },
  
  speechBubble: {
    backgroundColor: 'white',
    padding: '8px 12px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    animation: 'bubblePop 0.3s ease-out',
    maxWidth: '220px',
    position: 'relative',
    border: '2px solid #8b5cf6',
  },
  
  bubbleText: {
    fontSize: '12px',
    color: '#333',
    lineHeight: '1.4',
  },
  
  closeBubble: {
    marginLeft: '8px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: '11px',
    color: '#999',
    padding: '2px 4px',
  },
  
  reopenBubble: {
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    cursor: 'pointer',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    fontSize: '18px',
    marginRight: '5px',
    marginBottom: '5px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'all 0.2s',
  },
  
  avatarWrapper: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    overflow: 'hidden',
    animation: 'float 3s ease-in-out infinite',
    backgroundColor: '#f0f0f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    border: '3px solid white',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  
  confettiOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s',
  },
  
  confettiMessage: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '16px',
    fontSize: '20px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    animation: 'bounce 0.5s',
  },
  
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    animation: 'fadeIn 0.2s',
  },
  
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '350px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    animation: 'bounce 0.3s',
  },
  
  modalTitle: {
    fontSize: '20px',
    marginBottom: '12px',
    color: '#ef4444',
  },
  
  modalText: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  
  confirmResetBtn: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '8px 18px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  
  cancelResetBtn: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '8px 18px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
};

// Add animations to document
const styleSheet = document.createElement("style");
styleSheet.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes bounce {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes bubblePop {
    0% { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  button:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .optionLabel:hover {
    background-color: #f3f4f6;
    border-color: #8b5cf6;
  }
  
  .avatarWrapper:hover {
    transform: scale(1.05);
  }
  
  .resetButton:hover {
    background-color: #dc2626;
  }
  
  .confirmResetBtn:hover {
    background-color: #dc2626;
  }
  
  .cancelResetBtn:hover {
    background-color: #5a6268;
  }
  
  .claimButton:hover {
    background-color: #7c3aed;
    transform: translateY(-2px);
  }
  
  .missionsListButton:hover {
    background-color: #5a6268;
    transform: translateY(-2px);
  }
  
  .scrollableContent::-webkit-scrollbar {
    width: 6px;
  }
  
  .scrollableContent::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .scrollableContent::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  
  .scrollableContent::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

if (!document.querySelector('#mission5-styles')) {
  styleSheet.id = 'mission5-styles';
  document.head.appendChild(styleSheet);
}

export default Mission5;