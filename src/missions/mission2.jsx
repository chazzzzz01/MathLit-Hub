// src/missions/mission2.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Mission2({ user, userData, updateUserData, onComplete }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackAvatar, setFeedbackAvatar] = useState(null);
  const [canProceed, setCanProceed] = useState(true);
  const [showAvatarMessage, setShowAvatarMessage] = useState(true);
  const [currentAvatarMessage, setCurrentAvatarMessage] = useState("🧙 Welcome, young wizard! Ready to master linear equations?");
  const [isCompleting, setIsCompleting] = useState(false);

  const steps = [
    {
      title: "🧙 MATH WIZARD CHALLENGE",
      content: "Welcome to the Math Wizard challenge! Answer these 10 questions about linear equations to prove your magical math skills!",
      description: "Each correct answer brings you closer to becoming a Math Wizard. Let's begin your journey!",
      type: "info"
    },
    {
      title: "Question 1: Linear Equation Definition",
      question: "What is a linear equation in two variables?",
      options: [
        "An equation with variables raised to the second power",
        "An equation with variables raised only to the first power, and its graph forms a straight line",
        "An equation with three variables",
        "An equation that forms a circle"
      ],
      correct: 1,
      explanation: "A first-degree equation whose graph is a straight line",
      wrongExplanation: "An equation with variables raised to powers greater than 1",
      type: "quiz"
    },
    {
      title: "Question 2: Standard Form",
      question: "What is the standard form of a linear equation?",
      options: [
        "y = mx + b",
        "ax² + bx + c = 0",
        "Ax + By = C",
        "x + y = 0"
      ],
      correct: 2,
      explanation: "Ax + By = C",
      wrongExplanation: "y = mx + b",
      type: "quiz"
    },
    {
      title: "Question 3: Graph of Linear Equation",
      question: "Why is the graph of a linear equation a straight line?",
      options: [
        "Because it has a constant slope (rate of change)",
        "Because it has a variable slope",
        "Because it curves at the ends",
        "Because it has no slope"
      ],
      correct: 0,
      explanation: "Because the rate of change is constant",
      wrongExplanation: "Because the variables are squared",
      type: "quiz"
    },
    {
      title: "Question 4: Two Points Determine a Line",
      question: "How can two points determine a line?",
      options: [
        "They allow you to compute the area",
        "They allow you to compute the slope and define the line's direction",
        "They determine the y-intercept only",
        "They determine the x-intercept only"
      ],
      correct: 1,
      explanation: "They give the slope and direction of the line",
      wrongExplanation: "They create a curve",
      type: "quiz"
    },
    {
      title: "Question 5: Calculate Slope",
      question: "What is the slope of the line passing through (2, 4) and (6, 8)?",
      options: [
        "Slope = 0",
        "Slope = 2",
        "Slope = 1",
        "Slope = 4"
      ],
      correct: 2,
      explanation: "1",
      wrongExplanation: "2",
      type: "quiz"
    },
    {
      title: "Question 6: Equation from Two Points",
      question: "What is the equation of the line passing through (0, 3) and (4, 7)?",
      options: [
        "y = x + 3",
        "y = 2x + 3",
        "y = x - 3",
        "y = 4x + 3"
      ],
      correct: 0,
      explanation: "y = x + 3",
      wrongExplanation: "y = x - 3",
      type: "quiz"
    },
    {
      title: "Question 7: Comparing Slopes",
      question: "Compare the slopes of the lines through (1, 2) & (3, 6) and (2, 5) & (4, 9). What do you notice?",
      options: [
        "First slope = 1, Second slope = 2",
        "First slope = 2, Second slope = 2 (Both slopes are equal)",
        "First slope = 3, Second slope = 1",
        "First slope = 4, Second slope = 4"
      ],
      correct: 1,
      explanation: "They are equal",
      wrongExplanation: "One is negative",
      type: "quiz"
    },
    {
      title: "Question 8: Parallel Lines",
      question: "Two lines pass through the points (1, 3) & (3, 7) and (2, 4) & (4, 8). What can you conclude about the two lines?",
      options: [
        "They are perpendicular",
        "They are the same line",
        "They are parallel (same slope, different lines)",
        "They intersect at one point"
      ],
      correct: 2,
      explanation: "The lines are parallel",
      wrongExplanation: "The lines are perpendicular",
      type: "quiz"
    },
    {
      title: "Question 9: Verify Slope Claim",
      question: "A student claims the slope of the line through (1, 2) and (3, 4) is 1. Is the student correct?",
      options: [
        "No, the slope is 0",
        "No, the slope is 2",
        "Yes, the slope is 1",
        "No, the slope is 3"
      ],
      correct: 2,
      explanation: "Yes, because the slope is 1",
      wrongExplanation: "Yes, because the points are equal",
      type: "quiz"
    },
    {
      title: "Question 10: Create Points for Equation",
      question: "If you create two ordered pairs of points that will generate the linear equation y = -x + 4, which points will you pick?",
      options: [
        "(0, 4) and (4, 0)",
        "(1, 4) and (2, 4)",
        "(0, 0) and (4, 4)",
        "(1, 5) and (2, 6)"
      ],
      correct: 0,
      explanation: "(0, 4) and (4, 0)",
      wrongExplanation: "(1, 1) and (2, 2)",
      type: "quiz"
    },
    {
      title: "Mission Complete! 🎉",
      content: "Congratulations, Math Wizard! You've mastered all 10 linear equation concepts!",
      result: "You are now a certified Math Wizard!",
      note: "You've proven your magical math abilities in linear equations!",
      type: "complete"
    }
  ];

  const avatarMessages = {
    happy: [
      "✨ Amazing! You're a true wizard!",
      "🧙 Perfect spell casting!",
      "🌟 Magical answer! Keep going!",
      "💫 You're mastering the arcane arts!",
      "🔮 The crystal ball shows success!",
      "📚 Excellent! One step closer to wizardry!",
      "🏆 Magical performance!"
    ],
    wrong: [
      "🤔 Oops! Let's review the linear equation concept!",
      "💡 Almost there! Try casting the spell again!",
      "📚 Not quite right. Check your understanding!",
      "✨ Don't give up! Practice makes perfect!",
      "🎯 Keep trying! The magic is within you!",
      "💪 Every wizard makes mistakes! Try again!",
      "🌟 Focus your magical energy!"
    ],
    info: [
      "💡 Remember: Linear equations have a constant slope!",
      "🧙 A true wizard masters the standard form Ax + By = C!",
      "🔮 Two points uniquely determine a line!",
      "✨ Practice finding slope using the formula!",
      "📚 Keep practicing your linear equation skills!"
    ]
  };

  const getRandomMessage = (type) => {
    const messages = avatarMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
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

  const handleComplete = () => {
    if (isCompleting) return;
    setIsCompleting(true);
    
    setShowConfetti(true);
    setCurrentAvatarMessage("🏆 CONGRATULATIONS, MATH WIZARD! You've mastered all 10 linear equation concepts! +250 XP! 🎉");
    setFeedbackAvatar('happy');
    setShowAvatarMessage(true);
    
    const currentProgress = userData?.progress || {};
    const completedMissions = currentProgress.completedMissions || [];
    const currentMissionsCompleted = currentProgress.missionsCompleted || 0;
    const currentTotalXP = userData?.xp || 0;
    
    if (!completedMissions.includes(2) && updateUserData) {
      const newTotalXP = currentTotalXP + 250;
      const newMissionsCompleted = currentMissionsCompleted + 1;
      
      updateUserData({
        xp: newTotalXP,
        progress: {
          ...currentProgress,
          missionsCompleted: newMissionsCompleted,
          completedMissions: [...completedMissions, 2],
          lastMissionCompleted: new Date().toISOString(),
          totalXP: newTotalXP
        }
      });
      
      window.dispatchEvent(new CustomEvent('xpUpdated', { 
        detail: { newXP: newTotalXP, missionId: 2 }
      }));
    }
    
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      } else {
        navigate('/studenthub/missions');
      }
    }, 3000);
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
            <div style={styles.wizardContainer}>
              <div style={styles.wizardBadge}>🧙</div>
              <div style={styles.wizardBadge}>🔮</div>
              <div style={styles.wizardBadge}>✨</div>
            </div>
          </div>
        );

      case "quiz":
        return (
          <div style={styles.quizContent}>
            <div style={styles.equationNumber}>
              Question {currentStep} of {steps.length - 2}
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
                  `✅ ${step.explanation}` : 
                  `❌ ${step.wrongExplanation}`}
              </div>
            )}
          </div>
        );

      case "complete":
        return (
          <div style={styles.completeContent}>
            <p style={styles.completeText}>{step.content}</p>
            <div style={styles.resultBox}>
              <span style={styles.resultIcon}>🧙</span>
              <span style={styles.resultText}>{step.result}</span>
            </div>
            <p style={styles.noteText}>{step.note}</p>
            <div style={styles.rewardBox}>
              <span style={styles.rewardIcon}>🏆</span>
              <span style={styles.rewardText}>+250 XP Earned!</span>
            </div>
            <button style={styles.finishButton} onClick={handleComplete} disabled={isCompleting}>
              {isCompleting ? "Completing..." : "Claim Your Wizard Reward"}
            </button>
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

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const questionsCompleted = Object.keys(answers).filter(key => answers[key] && answers[key].isCorrect).length;

  return (
    <div style={styles.container}>
      {showConfetti && (
        <div style={styles.confettiOverlay}>
          <div style={styles.confettiMessage}>
            🎉 Mission Complete! 🎉
            <br />
            You earned 250 XP!
            <br />
            You are now a Math Wizard! 🧙
          </div>
        </div>
      )}
      
      <div style={styles.progressBar}>
        <div 
          style={{
            ...styles.progressFill,
            width: `${progressPercentage}%`
          }}
        />
      </div>

      {steps[currentStep].type === 'quiz' && (
        <div style={styles.equationProgress}>
          <span>🧙 Questions Mastered: {questionsCompleted}/{steps.length - 2}</span>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={styles.title}>{steps[currentStep].title}</h2>
        
        <div style={styles.scrollableContent}>
          {renderStepContent()}
        </div>
        
        <div style={styles.buttonContainer}>
          {currentStep > 0 && (
            <button style={styles.prevButton} onClick={handlePrevious}>
              ← Previous
            </button>
          )}
          
          {currentStep < steps.length - 1 && steps[currentStep].type !== 'complete' && (
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
          )}
        </div>
        
        <div style={styles.stepIndicator}>
          {steps[currentStep].type === 'quiz' 
            ? `Question ${currentStep} of ${steps.length - 2}` 
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
  
  equationProgress: {
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
  
  wizardContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '20px',
  },
  
  wizardBadge: {
    fontSize: '40px',
  },
  
  quizContent: {
    padding: '5px',
  },
  
  equationNumber: {
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
  
  finishButton: {
    backgroundColor: '#8b5cf6',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background 0.2s',
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

export default Mission2;