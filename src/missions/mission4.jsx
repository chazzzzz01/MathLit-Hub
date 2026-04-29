// src/missions/mission4.jsx
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

  // Questions with correct answers randomized in different positions (1st, 2nd, 3rd, or 4th)
  const questions = [
    {
      title: "Question 1: Slope-Intercept Form",
      question: "What is the general form of the slope-intercept equation?",
      options: [
        "Ax + By = C",
        "y = mx + b",
        "y - y₁ = m(x - x₁)",
        "x = my + b"
      ],
      correct: 1,
      explanation: "The slope-intercept form is y = mx + b, where m is slope and b is y-intercept."
    },
    {
      title: "Question 2: y-intercept Meaning",
      question: "In the equation y = mx + b, what does b represent?",
      options: [
        "The slope of the line",
        "The y-intercept, where the line crosses the y-axis",
        "The x-intercept",
        "The rate of change"
      ],
      correct: 1,
      explanation: "b is the y-intercept, where the line crosses the y-axis."
    },
    {
      title: "Question 3: Negative Slope Meaning",
      question: "If the slope is -3, what does it mean?",
      options: [
        "The line increases from left to right",
        "The line decreases from left to right",
        "The line is horizontal",
        "The line is vertical"
      ],
      correct: 1,
      explanation: "A negative slope means the line decreases from left to right."
    },
    {
      title: "Question 4: Equation with Slope 2 and y-intercept 4",
      question: "Which equation represents a line with slope 2 and y-intercept 4?",
      options: [
        "y = 4x + 2",
        "y = 2x + 4",
        "y = -2x + 4",
        "y = 2x - 4"
      ],
      correct: 1,
      explanation: "Substitute into y = mx + b → y = 2x + 4."
    },
    {
      title: "Question 5: Equation with Slope -3 and y-intercept 2",
      question: "Find the equation of a line with slope -3 and y-intercept 2.",
      options: [
        "y = 3x + 2",
        "y = -3x - 2",
        "y = -3x + 2",
        "y = 3x - 2"
      ],
      correct: 2,
      explanation: "Substitute values in the formula y = mx + b → y = -3x + 2."
    },
    {
      title: "Question 6: Equation with Slope 1 and y-intercept -5",
      question: "What is the equation of a line with slope 1 and y-intercept -5?",
      options: [
        "y = x + 5",
        "y = -x - 5",
        "y = x - 5",
        "y = -x + 5"
      ],
      correct: 2,
      explanation: "Substitute into formula y = mx + b → y = 1x - 5."
    },
    {
      title: "Question 7: Identify Slope and y-intercept",
      question: "What is the slope and y-intercept of y = 4x - 7?",
      options: [
        "m = 4, b = 7",
        "m = -4, b = 7",
        "m = 4, b = -7",
        "m = -4, b = -7"
      ],
      correct: 2,
      explanation: "Compare with y = mx + b → m = 4, b = -7."
    },
    {
      title: "Question 8: Analyze y = x + 2",
      question: "Which statement is correct about the equation y = x + 2?",
      options: [
        "Slope is negative, y-intercept is 2",
        "Slope is 1 (positive), y-intercept is 2",
        "Slope is 0, y-intercept is 2",
        "Slope is 2, y-intercept is 1"
      ],
      correct: 1,
      explanation: "m = 1 (positive slope), b = 2."
    },
    {
      title: "Question 9: Real-world Application",
      question: "Which equation represents a line that passes through the y-axis at 3 and rises 2 units for every 1 unit to the right?",
      options: [
        "y = 2x + 3",
        "y = 3x + 2",
        "y = -2x + 3",
        "y = 2x - 3"
      ],
      correct: 0,
      explanation: "'Rises 2' means slope is 2 and 'y-intercept 3' means b = 3, so y = 2x + 3."
    },
    {
      title: "Question 10: Identify from Standard Form",
      question: "What is the slope and y-intercept of the equation 3x + y = 2?",
      options: [
        "m = 3, b = 2",
        "m = -3, b = 2",
        "m = 3, b = -2",
        "m = -3, b = -2"
      ],
      correct: 1,
      explanation: "Rewrite in slope-intercept form: y = -3x + 2 → m = -3, b = 2."
    }
  ];

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
          setCurrentStep(12); // Go to complete screen (last step index)
        }
      }
    };
    checkCompletion();
  }, [user?.dbId]);

  const steps = [
    {
      title: "📈 SLOPE AND Y-INTERCEPT MISSION",
      content: "Welcome to the Slope and y-intercept mission! Learn how to find the equation of a line using slope and y-intercept.",
      description: "The slope-intercept form is: y = mx + b, where m is the slope and b is the y-intercept.",
      showImage: true,
      imagePath: "/image1.png",
      type: "info"
    },
    {
      title: "Mission 3: Slope and y-intercept",
      content: (
        <div>
          <div style={styles.imageContainer}>
            <img 
              src="/image1.png" 
              alt="Slope and y-intercept Concept"
              style={styles.lessonImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23f3f4f6'/%3E%3Ctext x='200' y='120' text-anchor='middle' fill='%23666'%3ESlope and y-intercept Concept%3C/text%3E%3Ctext x='200' y='145' text-anchor='middle' fill='%23999' font-size='12'%3Ey = mx + b%3C/text%3E%3C/svg%3E";
              }}
            />
            <p style={styles.imageCaption}>Figure 1: Slope-Intercept Form (y = mx + b)</p>
          </div>
          
          <p style={{ marginBottom: '10px', fontSize: '14px', color: '#555' }}>
            <strong>𝒚 = 𝒎𝒙 + 𝒃</strong>
          </p>
          
          <div style={styles.exampleBox}>
            <h4 style={styles.exampleTitle}>📐 Example:</h4>
            <p>Find the equation of a line whose graph has a slope of <strong>-3</strong> and a y-intercept of <strong>2</strong>.</p>
            
            <div style={styles.solutionBox}>
              <p><strong>Solution:</strong> If the slope of a line and a y-intercept are known. Therefore, we will use the <strong>Slope-intercept Form</strong> defined as:</p>
              <div style={styles.formulaBox}>
                <strong>𝒚 = 𝒎𝒙 + 𝒃</strong>
              </div>
              
              <p><strong>Step 1.</strong> Identify the slope or m and y-intercept or b.</p>
              <p>✓ m = -3 and b = 2</p>
              
              <p><strong>Step 2.</strong> Substitute the given values into the formula: y = mx + b</p>
              <div style={styles.formulaBox}>
                y = (-3)x + (2)<br/>
                y = -3x + 2
              </div>
              
              <p><strong>Thus, the equation of a line whose graph has a slope of -3 and a y-intercept of 2 is:</strong></p>
              <div style={styles.resultBox}>
                y = -3x + 2 &nbsp;&nbsp;or&nbsp;&nbsp; 3x + y = 2 (standard form)
              </div>
            </div>
          </div>
        </div>
      ),
      type: "lesson"
    }
  ];

  // Add quiz steps dynamically from questions array
  for (let i = 0; i < questions.length; i++) {
    steps.push({
      ...questions[i],
      type: "quiz"
    });
  }

  // Add complete step
  steps.push({
    title: "Mission Complete! 🎉",
    content: "Congratulations! You've mastered the Slope and y-intercept mission!",
    result: "You now know how to find equations using slope and y-intercept!",
    note: "The slope-intercept form y = mx + b is one of the most useful forms in algebra!",
    type: "complete"
  });

  const avatarMessages = {
    happy: [
      "📈 Excellent! You're mastering slope-intercept form!",
      "✨ Perfect! y = mx + b is clear to you!",
      "🌟 Great job! Keep going!",
      "💫 You're becoming a linear equations expert!",
      "📏 The slope and y-intercept are easy for you now!",
      "📚 Excellent work! One step closer!",
      "🏆 Amazing! You've got this!"
    ],
    wrong: [
      "🤔 Oops! Let's review slope-intercept form!",
      "💡 Almost there! Remember: y = mx + b",
      "📚 Not quite right. Check your values!",
      "✨ Don't give up! Practice makes perfect!",
      "🎯 Keep trying! You'll master slope-intercept form!",
      "💪 Every mistake teaches us something! Try again!",
      "🌟 Focus on identifying m (slope) and b (y-intercept)!"
    ],
    info: [
      "💡 Remember: Slope-intercept form is y = mx + b!",
      "📈 m is the slope (rise/run), b is the y-intercept!",
      "🔢 A positive slope rises, negative slope falls!",
      "✨ The y-intercept is where the line crosses the y-axis!",
      "📚 Keep practicing your slope-intercept skills!"
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
      [stepIndex]: {
        selected: answerIndex,
        isCorrect: isCorrect
      }
    });
    
    setTimeout(() => {
      setFeedbackAvatar(null);
    }, 3000);
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
      onComplete();
    } else {
      navigate('/studenthub/missions');
    }
  };

  const handleComplete = async () => {
    if (isCompleting || isAlreadyCompleted) return;
    setIsCompleting(true);
    
    setShowConfetti(true);
    setCurrentAvatarMessage(`🏆 CONGRATULATIONS! You've mastered the Slope and y-intercept mission! +${MISSION_XP} XP! 🎉`);
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
                  alt="Slope and y-intercept Concept"
                  style={styles.infoImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23f3f4f6'/%3E%3Ctext x='200' y='120' text-anchor='middle' fill='%23666'%3ESlope and y-intercept Concept%3C/text%3E%3Ctext x='200' y='145' text-anchor='middle' fill='%23999' font-size='12'%3EImage: y = mx + b Illustration%3C/text%3E%3C/svg%3E";
                  }}
                />
                <p style={styles.imageCaption}>Figure 1: Slope-Intercept Form (y = mx + b)</p>
              </div>
            )}
            <div style={styles.formulaBox}>
              <p style={styles.formulaText}>Slope-Intercept Form: y = mx + b</p>
              <p style={styles.formulaSubtext}>m = slope, b = y-intercept</p>
            </div>
          </div>
        );

      case "lesson":
        return (
          <div style={styles.lessonContent}>
            {step.content}
          </div>
        );

      case "quiz":
        return (
          <div style={styles.quizContent}>
            <div style={styles.questionNumber}>
              Question {currentStep - 1} of {questions.length}
            </div>
            <p style={styles.questionText}>{step.question}</p>
            <div style={styles.optionsContainer}>
              {step.options.map((option, idx) => (
                <label 
                  key={idx} 
                  style={{
                    ...styles.optionLabel,
                    ...(currentAnswer && currentAnswer.selected === idx && idx === step.correct ? styles.correctOption : {}),
                    ...(currentAnswer && currentAnswer.selected === idx && idx !== step.correct ? styles.wrongOption : {})
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${currentStep}`}
                    value={idx}
                    checked={currentAnswer && currentAnswer.selected === idx}
                    onChange={() => handleAnswer(currentStep, idx)}
                    style={styles.radio}
                  />
                  <span style={styles.optionText}>{option}</span>
                </label>
              ))}
            </div>
            {currentAnswer && (
              <div style={currentAnswer.isCorrect ? styles.correctFeedback : styles.incorrectFeedback}>
                {currentAnswer.isCorrect ? 
                  `✅ Correct! ${step.explanation}` : 
                  `❌ Incorrect. ${step.explanation}`}
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
                  <span style={styles.resultIcon}>📈</span>
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
                  <span style={styles.resultIcon}>📈</span>
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
  const questionsCompleted = Object.keys(answers).filter(key => answers[key] && answers[key].isCorrect).length;
  const totalQuestions = questions.length;

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
            You've mastered Slope and y-intercept! 📈
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
          <span>📈 Questions Mastered: {questionsCompleted}/{totalQuestions}</span>
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
                ...(steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep]) ? styles.disabledButton : {})
              }}
              onClick={handleNext}
              disabled={steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep])}
            >
              Next →
            </button>
          </div>
        )}
        
        <div style={styles.stepIndicator}>
          {steps[currentStep].type === 'quiz' && !showRewardClaimed
            ? `Question ${currentStep - 1} of ${totalQuestions}` 
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
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23f59e0b'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
              } else if (feedbackAvatar === 'wrong') {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23ef4444'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 70 L65 70' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
              } else {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23f59e0b'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
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
    backgroundColor: '#f59e0b',
    transition: 'width 0.3s ease',
    borderRadius: '4px',
  },
  
  questionProgress: {
    textAlign: 'center',
    marginBottom: '15px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#f59e0b',
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
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  
  infoImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
  },
  
  lessonImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
  },
  
  imageCaption: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '8px',
    fontStyle: 'italic',
  },
  
  formulaBox: {
    backgroundColor: '#fef3c7',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    marginTop: '15px',
    border: '1px solid #f59e0b',
  },
  
  formulaText: {
    fontSize: '18px',
    fontFamily: 'monospace',
    color: '#d97706',
    fontWeight: 'bold',
  },
  
  formulaSubtext: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px',
  },
  
  lessonContent: {
    padding: '15px',
    lineHeight: '1.6',
  },
  
  exampleBox: {
    backgroundColor: '#f0f9ff',
    padding: '20px',
    borderRadius: '12px',
    marginTop: '15px',
    border: '1px solid #bae6fd',
  },
  
  exampleTitle: {
    color: '#0369a1',
    marginBottom: '15px',
    fontSize: '18px',
  },
  
  solutionBox: {
    backgroundColor: '#fefce8',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '10px',
    fontSize: '14px',
    border: '1px solid #fde047',
  },
  
  resultBox: {
    backgroundColor: '#dcfce7',
    padding: '12px',
    borderRadius: '6px',
    marginTop: '10px',
    textAlign: 'center',
    fontWeight: 'bold',
    border: '1px solid #86efac',
  },
  
  quizContent: {
    padding: '5px',
  },
  
  questionNumber: {
    fontSize: '14px',
    color: '#f59e0b',
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
  
  finalResultBox: {
    backgroundColor: '#fef3c7',
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
    color: '#d97706',
  },
  
  noteText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
    fontStyle: 'italic',
  },
  
  rewardBox: {
    backgroundColor: '#fef3c7',
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
    color: '#d97706',
  },
  
  claimButton: {
    backgroundColor: '#f59e0b',
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
    backgroundColor: '#fef3c7',
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
    color: '#92400e',
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
    backgroundColor: '#f59e0b',
    color: 'white',
    padding: '8px 18px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  
  disabledButton: {
    backgroundColor: '#fcd34d',
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
    maxWidth: '220px',
    position: 'relative',
    border: '2px solid #f59e0b',
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
    backgroundColor: '#f59e0b',
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
  },
  
  confettiMessage: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '16px',
    fontSize: '20px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
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
  },
  
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    maxWidth: '350px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
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
    border-color: #f59e0b;
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
    background-color: #d97706;
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

if (!document.querySelector('#mission4-styles')) {
  styleSheet.id = 'mission4-styles';
  document.head.appendChild(styleSheet);
}

export default Mission4;