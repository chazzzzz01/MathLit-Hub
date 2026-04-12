// src/missions/mission1.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Mission1({ user, userData, updateUserData, onComplete }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);

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
      imagePath: "/pics.png", // Path to your image
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

  const handleAnswer = (stepIndex, answerIndex) => {
    setAnswers({
      ...answers,
      [stepIndex]: answerIndex
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Check if it's a quiz step and answer is required
      if (steps[currentStep].type === 'quiz' && answers[currentStep] === undefined) {
        alert("Please select an answer before continuing!");
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setShowConfetti(true);
    
    // Update user progress
    if (updateUserData) {
      const currentProgress = userData?.progress || {};
      const completedMissions = currentProgress.completedMissions || [];
      
      if (!completedMissions.includes(1)) {
        updateUserData({
          progress: {
            ...currentProgress,
            missionsCompleted: (currentProgress.missionsCompleted || 0) + 1,
            completedMissions: [...completedMissions, 1],
            lastMissionCompleted: new Date().toISOString(),
            totalXP: (currentProgress.totalXP || 0) + 100
          }
        });
      }
    }
    
    // Call onComplete callback if provided
    if (onComplete) {
      setTimeout(() => onComplete(), 2000);
    } else {
      // Navigate back to missions after 2 seconds
      setTimeout(() => navigate('/studenthub/missions'), 2000);
    }
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
                <label key={idx} style={styles.optionLabel}>
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
            <p style={styles.completeText}>{step.content}</p>
            <div style={styles.resultBox}>
              <span style={styles.resultIcon}>📐</span>
              <span style={styles.resultText}>{step.result}</span>
            </div>
            <p style={styles.noteText}>{step.note}</p>
            <div style={styles.rewardBox}>
              <span style={styles.rewardIcon}>🏆</span>
              <span style={styles.rewardText}>+100 XP Earned!</span>
            </div>
            <button style={styles.finishButton} onClick={handleComplete}>
              Claim Your Reward
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      {showConfetti && (
        <div style={styles.confettiOverlay}>
          <div style={styles.confettiMessage}>
            🎉 Mission Complete! 🎉
            <br />
            You earned 100 XP!
            <br />
            The equation is y = -x + 3
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
        <h2 style={styles.title}>{steps[currentStep].title}</h2>
        
        {renderStepContent()}
        
        <div style={styles.buttonContainer}>
          {currentStep > 0 && (
            <button style={styles.prevButton} onClick={handlePrevious}>
              ← Previous
            </button>
          )}
          
          {currentStep < steps.length - 1 && (
            <button style={styles.nextButton} onClick={handleNext}>
              Next →
            </button>
          )}
        </div>
        
        <div style={styles.stepIndicator}>
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
  },
  
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    marginBottom: '30px',
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    transition: 'width 0.3s ease',
    borderRadius: '4px',
  },
  
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  
  title: {
    fontSize: '28px',
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center',
  },
  
  contentText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '15px',
  },
  
  descriptionText: {
    fontSize: '16px',
    color: '#555',
    lineHeight: '1.6',
    marginBottom: '15px',
    fontWeight: '500',
  },
  
  methodsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '20px',
    marginBottom: '20px',
    justifyContent: 'center',
  },
  
  methodBadge: {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
  },
  
  infoContent: {
    textAlign: 'center',
    padding: '20px',
  },
  
  lessonContent: {
    padding: '10px',
  },
  
  graphContainer: {
    textAlign: 'center',
    marginBottom: '20px',
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
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '8px',
    fontStyle: 'italic',
  },
  
  exampleBox: {
    backgroundColor: '#fef3c7',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    borderLeft: '4px solid #f59e0b',
  },
  
  exampleTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#d97706',
    marginBottom: '10px',
  },
  
  exampleText: {
    fontSize: '16px',
    color: '#333',
  },
  
  instructionText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: '15px',
  },
  
  formulaBox: {
    backgroundColor: '#f3f4f6',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '15px',
    border: '1px solid #e5e7eb',
  },
  
  formulaText: {
    fontSize: '16px',
    fontFamily: 'monospace',
    color: '#2563eb',
    fontWeight: 'bold',
  },
  
  illustration: {
    fontSize: '48px',
    marginTop: '20px',
  },
  
  quizContent: {
    padding: '10px',
  },
  
  questionText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px',
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
    padding: '10px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
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
  },
  
  incorrectFeedback: {
    padding: '10px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    marginTop: '10px',
  },
  
  completeContent: {
    textAlign: 'center',
    padding: '20px',
  },
  
  completeText: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '20px',
  },
  
  resultBox: {
    backgroundColor: '#dbeafe',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  
  resultIcon: {
    fontSize: '24px',
  },
  
  resultText: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1e40af',
  },
  
  noteText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
    fontStyle: 'italic',
  },
  
  rewardBox: {
    backgroundColor: '#fef3c7',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  
  rewardIcon: {
    fontSize: '32px',
  },
  
  rewardText: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#d97706',
  },
  
  finishButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '14px 28px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'background 0.2s',
  },
  
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '30px',
    gap: '10px',
  },
  
  prevButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  
  nextButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  
  stepIndicator: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px',
    color: '#999',
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
    padding: '30px',
    borderRadius: '16px',
    fontSize: '24px',
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
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  button:active {
    transform: translateY(0);
  }
  
  .optionLabel:hover {
    background-color: #f3f4f6;
    border-color: #2563eb;
  }
`;
document.head.appendChild(styleSheet);

export default Mission1;