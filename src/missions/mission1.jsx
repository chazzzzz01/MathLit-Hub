// src/missions/mission1.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Mission1({ user, userData, updateUserData, onComplete }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackAvatar, setFeedbackAvatar] = useState(null);
  const [canProceed, setCanProceed] = useState(true);
  const [showAvatarMessage, setShowAvatarMessage] = useState(true);
  const [currentAvatarMessage, setCurrentAvatarMessage] = useState("👋 Hey there! Ready to learn about Linear Equations? Let's go!");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRewardClaimed, setShowRewardClaimed] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);

  // Check if mission is already completed on load
  useEffect(() => {
    const checkCompletion = async () => {
      if (user?.dbId) {
        const { data } = await supabase
          .from('mission_progress')
          .select('status')
          .eq('mission_id', 1)
          .eq('student_id', user.dbId)
          .maybeSingle();
        
        if (data?.status === 'completed') {
          setIsAlreadyCompleted(true);
          setShowRewardClaimed(true);
          setCurrentStep(7); // Go to complete screen
        }
      }
    };
    checkCompletion();
  }, [user?.dbId]);

  const steps = [
    {
      title: "INTRODUCTION TO LINEAR EQUATIONS 📐",
      content: "A LINEAR EQUATION is a first-degree polynomial involving two variables, and its graph forms a straight line.",
      description: "Its standard form is expressed as Ax + By = C. The equation of a line can be found using different methods:",
      methods: [
        "✨ Two given points",
        "✨ Slope with a Point",
        "✨ Slope-Intercept Form",
        "✨ x- and y-Intercepts"
      ],
      type: "info"
    },
    {
      title: "Mission 1: Equation of a Line Using Two Points 🎯",
      content: "Find the equation of the line that passes through the points (1, 2) and (5, -2).",
      instruction: "Let's solve this step by step!",
      showGraph: true,
      imagePath: "/pics.png",
      type: "lesson"
    },
    {
      title: "Step 1: Identify the Points",
      question: "For the points (1, 2) and (5, -2), what are the values?",
      options: [
        "x₁=1, y₁=2, x₂=5, y₂=-2",
        "x₁=2, y₁=1, x₂=-2, y₂=5",
        "x₁=5, y₁=-2, x₂=1, y₂=2",
        "x₁=1, y₁=5, x₂=2, y₂=-2"
      ],
      correct: 0,
      explanation: "Correct! x₁=1, y₁=2, x₂=5, y₂=-2",
      type: "quiz"
    },
    {
      title: "Step 2: Use the Two-Point Formula",
      content: "The two-point form formula is:",
      formula: "y - y₁ = (y₂ - y₁)/(x₂ - x₁) × (x - x₁)",
      question: "Substitute the values into the formula:",
      options: [
        "y-2 = (2-(-2))/(1-5) × (x-1)",
        "y-2 = ((-2)-2)/(5-1) × (x-1)",
        "y+2 = (2-(-2))/(5-1) × (x+1)",
        "y-2 = (5-1)/((-2)-2) × (x-1)"
      ],
      correct: 1,
      explanation: "Correct! y-2 = ((-2)-2)/(5-1) × (x-1)",
      type: "quiz"
    },
    {
      title: "Step 3: Simplify the Slope",
      content: "Calculate the slope: (y₂ - y₁)/(x₂ - x₁)",
      question: "What is (-2 - 2)/(5 - 1)?",
      options: [
        "4/4 = 1",
        "-4/4 = -1",
        "0/4 = 0",
        "-4/6 = -2/3"
      ],
      correct: 1,
      explanation: "Correct! (-2-2) = -4 and (5-1) = 4, so -4/4 = -1",
      type: "quiz"
    },
    {
      title: "Step 4: Apply Distributive Property",
      content: "Now we have: y - 2 = -1(x - 1)",
      question: "After applying distributive property, what do we get?",
      options: [
        "y - 2 = -x - 1",
        "y - 2 = -x + 1",
        "y - 2 = x + 1",
        "y - 2 = -x - 2"
      ],
      correct: 1,
      explanation: "Correct! -1(x - 1) = -x + 1",
      type: "quiz"
    },
    {
      title: "Step 5: Apply Addition Property of Equality",
      content: "We have: y - 2 = -x + 1",
      question: "Add 2 to both sides. What is the final equation?",
      options: [
        "y = -x - 1",
        "y = x + 3",
        "y = -x + 3",
        "y = -x + 1"
      ],
      correct: 2,
      explanation: "Correct! y - 2 + 2 = -x + 1 + 2 → y = -x + 3",
      type: "quiz"
    },
    {
      title: "Mission Complete! 🎉",
      content: "Congratulations! You've found the equation of the line!",
      result: "The equation is: y = -x + 3",
      note: "This line passes through the points (1, 2) and (5, -2)",
      type: "complete"
    }
  ];

  const avatarMessages = {
    happy: [
      "🎉 Perfect! You're a math genius!",
      "✨ Amazing work! Keep going!",
      "🌟 Correct! You're on fire!",
      "💪 Great job! That's the way!",
      "🌸 You got it! So proud of you!",
      "📚 Excellent! One step closer!",
      "🏆 Nailed it! You're doing awesome!"
    ],
    wrong: [
      "🤔 Oops! Try again, you can do it!",
      "💡 Not quite right. Review the step!",
      "📚 Almost there! Give it another try!",
      "✨ Don't give up! Check the explanation!",
      "🎯 Keep trying! You'll get it!",
      "💪 It's okay! Let's try that again!",
      "🌟 You got this! Read carefully!"
    ],
    info: [
      "💡 Did you know? Linear equations form straight lines!",
      "📐 Let's learn about finding equations of lines!",
      "🎯 Follow each step carefully!",
      "✨ You're doing great! Keep it up!",
      "🌟 Remember: Practice makes perfect!"
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
        setCurrentAvatarMessage("📖 Let's learn how to find the equation of a line!");
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
          mission_id: 1,
          student_id: user.dbId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          xp_earned: 100,
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
      if (!completedIds.includes(1)) {
        completedIds.push(1);
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

  // Function to go to next mission (Mission 2 - Math Wizard)
  const goToNextMission = () => {
    if (onComplete) {
      onComplete(2); // Pass mission ID 2 to open next mission
    } else {
      navigate('/studenthub/missions?mission=2');
    }
  };

  const handleComplete = async () => {
    if (isCompleting || isAlreadyCompleted) return;
    setIsCompleting(true);
    
    setShowConfetti(true);
    setCurrentAvatarMessage("🏆 CONGRATULATIONS! You've mastered this mission! +100 XP! 🎉");
    setFeedbackAvatar('happy');
    setShowAvatarMessage(true);
    
    // Save to database
    await saveMissionCompletion();
    
    // Get current progress
    const currentProgress = userData?.progress || {};
    const completedMissions = currentProgress.completedMissions || [];
    const currentMissionsCompleted = currentProgress.missionsCompleted || 0;
    const currentTotalXP = userData?.xp || 0;
    
    if (!completedMissions.includes(1) && updateUserData) {
      const newTotalXP = currentTotalXP + 100;
      const newMissionsCompleted = currentMissionsCompleted + 1;
      
      // Update user data
      updateUserData({
        xp: newTotalXP,
        progress: {
          ...currentProgress,
          missionsCompleted: newMissionsCompleted,
          completedMissions: [...completedMissions, 1],
          lastMissionCompleted: new Date().toISOString(),
          totalXP: newTotalXP
        }
      });
      
      // Dispatch custom event to notify about XP update
      window.dispatchEvent(new CustomEvent('xpUpdated', { 
        detail: { newXP: newTotalXP, missionId: 1 }
      }));
      
      window.dispatchEvent(new CustomEvent('missionCompleted', {
        detail: { missionId: 1 }
      }));
    }
    
    // Show reward claimed message
    setShowRewardClaimed(true);
    setIsAlreadyCompleted(true);
    
    // Hide confetti after 2 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 2000);
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.type) {
      case "info":
        return (
          <div style={styles.infoContent}>
            <p style={styles.contentText}>{step.content}</p>
            <p style={styles.descriptionText}>{step.description}</p>
            <div style={styles.methodsContainer}>
              {step.methods.map((method, idx) => (
                <div key={idx} style={styles.methodBadge}>
                  {method}
                </div>
              ))}
            </div>
            <div style={styles.illustration}>
              📈📐✨
            </div>
          </div>
        );

      case "lesson":
        return (
          <div style={styles.lessonContent}>
            <p style={styles.contentText}>{step.content}</p>
            {step.showGraph && step.imagePath && (
              <div style={styles.graphContainer}>
                <img 
                  src={step.imagePath} 
                  alt="Line through points (1,2) and (5,-2)"
                  style={styles.graphImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%23666'%3EGraph: Line through (1,2) and (5,-2)%3C/text%3E%3C/svg%3E";
                  }}
                />
                <p style={styles.graphCaption}>Figure 1: Line passing through points (1, 2) and (5, -2)</p>
              </div>
            )}
            <div style={styles.exampleBox}>
              <h3 style={styles.exampleTitle}>Example:</h3>
              <p style={styles.exampleText}>Find the equation of the line that passes through the points (1, 2) and (5, -2)</p>
            </div>
            <p style={styles.instructionText}>{step.instruction}</p>
            <div style={styles.formulaBox}>
              <p style={styles.formulaText}>Two-Point Form: y - y₁ = (y₂ - y₁)/(x₂ - x₁) × (x - x₁)</p>
            </div>
          </div>
        );

      case "quiz":
        return (
          <div style={styles.quizContent}>
            {step.content && <p style={styles.contentText}>{step.content}</p>}
            {step.formula && (
              <div style={styles.formulaBox}>
                <p style={styles.formulaText}>{step.formula}</p>
              </div>
            )}
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
                  `❌ Not quite right. ${step.explanation}`}
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
                  <span style={styles.rewardText}>+100 XP Reward!</span>
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
                  <p style={styles.claimedText}>Mission Completed! +100 XP Earned!</p>
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
                  <button 
                    style={styles.nextMissionButton} 
                    onClick={goToNextMission}
                  >
                    🧙 Continue to Math Wizard →
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

  // If already completed, show the completed screen directly
  if (isAlreadyCompleted && currentStep !== 7) {
    setCurrentStep(7);
  }

  return (
    <div style={styles.container}>
      {showConfetti && (
        <div style={styles.confettiOverlay}>
          <div style={styles.confettiMessage}>
            🎉 +100 XP Earned! 🎉
            <br />
            You've mastered Mission 1!
            <br />
            <span style={styles.nextMissionHint}>✨ Math Wizard Mission unlocked! ✨</span>
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
      
      <div style={styles.progressBar}>
        <div 
          style={{
            ...styles.progressFill,
            width: `${((currentStep + 1) / steps.length) * 100}%`
          }}
        />
      </div>

      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h2 style={styles.title}>{steps[currentStep].title}</h2>
          {!showRewardClaimed && (
            <button style={styles.resetButton} onClick={handleResetMission} title="Reset Mission">
              🔄 Reset Mission
            </button>
          )}
        </div>
        
        <div style={styles.scrollableContent}>
          {renderStepContent()}
        </div>
        
        {currentStep < steps.length - 1 && steps[currentStep].type !== 'complete' && (
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
          Step {currentStep + 1} of {steps.length}
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

// Styles remain the same as before (keeping only the new styles)
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
  
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    marginBottom: '20px',
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    transition: 'width 0.3s ease',
    borderRadius: '4px',
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
  
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    flexWrap: 'wrap',
    gap: '10px',
    flexShrink: 0,
  },
  
  title: {
    fontSize: '24px',
    color: '#333',
    textAlign: 'center',
    flex: 1,
    margin: 0,
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
  
  contentText: {
    fontSize: '15px',
    color: '#666',
    lineHeight: '1.5',
    marginBottom: '12px',
  },
  
  descriptionText: {
    fontSize: '15px',
    color: '#555',
    lineHeight: '1.5',
    marginBottom: '12px',
    fontWeight: '500',
  },
  
  methodsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '15px',
    marginBottom: '15px',
    justifyContent: 'center',
  },
  
  methodBadge: {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
  },
  
  infoContent: {
    textAlign: 'center',
    padding: '15px',
  },
  
  lessonContent: {
    padding: '5px',
  },
  
  graphContainer: {
    textAlign: 'center',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  
  graphImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  
  graphCaption: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '6px',
    fontStyle: 'italic',
  },
  
  exampleBox: {
    backgroundColor: '#fef3c7',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
    borderLeft: '4px solid #f59e0b',
  },
  
  exampleTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#d97706',
    marginBottom: '8px',
  },
  
  exampleText: {
    fontSize: '14px',
    color: '#333',
  },
  
  instructionText: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: '12px',
  },
  
  formulaBox: {
    backgroundColor: '#f3f4f6',
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '12px',
    border: '1px solid #e5e7eb',
  },
  
  formulaText: {
    fontSize: '14px',
    fontFamily: 'monospace',
    color: '#2563eb',
    fontWeight: 'bold',
  },
  
  illustration: {
    fontSize: '40px',
    marginTop: '15px',
  },
  
  quizContent: {
    padding: '5px',
  },
  
  questionText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '12px',
  },
  
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '15px',
  },
  
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
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
    fontSize: '13px',
    color: '#333',
  },
  
  correctFeedback: {
    padding: '8px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    marginTop: '8px',
    fontSize: '13px',
  },
  
  incorrectFeedback: {
    padding: '8px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    marginTop: '8px',
    fontSize: '13px',
  },
  
  completeContent: {
    textAlign: 'center',
    padding: '15px',
  },
  
  completeText: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '15px',
  },
  
  resultBox: {
    backgroundColor: '#dbeafe',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  
  resultIcon: {
    fontSize: '22px',
  },
  
  resultText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1e40af',
  },
  
  noteText: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '15px',
    fontStyle: 'italic',
  },
  
  rewardBox: {
    backgroundColor: '#fef3c7',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  
  rewardIcon: {
    fontSize: '28px',
  },
  
  rewardText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#d97706',
  },
  
  claimButton: {
    backgroundColor: '#10b981',
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
    backgroundColor: '#d1fae5',
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
    color: '#065f46',
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
  
  nextMissionButton: {
    backgroundColor: '#8b5cf6',
    color: 'white',
    padding: '14px 24px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    width: '100%',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
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
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '8px 18px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  
  disabledButton: {
    backgroundColor: '#9ca3af',
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
    border: '2px solid #2563eb',
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
    backgroundColor: '#2563eb',
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
  
  nextMissionHint: {
    display: 'block',
    marginTop: '10px',
    fontSize: '14px',
    color: '#8b5cf6',
    fontWeight: 'bold',
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
    border-color: #2563eb;
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
    background-color: #059669;
    transform: translateY(-2px);
  }
  
  .missionsListButton:hover {
    background-color: #5a6268;
    transform: translateY(-2px);
  }
  
  .nextMissionButton:hover {
    background-color: #7c3aed;
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
document.head.appendChild(styleSheet);

export default Mission1;