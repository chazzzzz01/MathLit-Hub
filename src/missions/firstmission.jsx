// src/missions/firstmission.jsx
import React, { useState, useEffect } from 'react';
import { IoMdLock, IoMdUnlock, IoMdArrowForward, IoMdRefresh } from 'react-icons/io';
import { FaTrophy, FaStar, FaBrain } from 'react-icons/fa';
import { GiSecretBook, GiFinishLine } from 'react-icons/gi';
import { MdAccessTime } from 'react-icons/md';

function FirstMission() {
  const [currentStep, setCurrentStep] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [missionComplete, setMissionComplete] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // State for answers
  const [answers, setAnswers] = useState({
    slope: '',
    intercept: '',
    equation: '',
    verification: ''
  });

  // Mission data
  const mission = {
    title: "The Point Portal",
    description: "Two points hold the key to the first lock. Find their relationship!",
    icon: <GiSecretBook size={32} />,
    color: "#3b82f6",
    bgColor: "#dbeafe",
    points: { p1: { x: 2, y: 4 }, p2: { x: 5, y: 10 } },
    hint: "Slope = (y₂ - y₁) / (x₂ - x₁). Then use y = mx + b to find intercept.",
    timeLimit: 300, // 5 minutes
    steps: [
      {
        id: 1,
        title: "Find the Slope",
        instruction: "Calculate the slope (m) using the two points",
        input: "slope"
      },
      {
        id: 2,
        title: "Find the Y-Intercept",
        instruction: "Calculate the y-intercept (b) using y = mx + b",
        input: "intercept"
      },
      {
        id: 3,
        title: "Write the Equation",
        instruction: "Write the equation in slope-intercept form (y = mx + b)",
        input: "equation"
      },
      {
        id: 4,
        title: "Verification",
        instruction: "Verify your equation works for the second point",
        input: "verification"
      }
    ]
  };

  // Timer effect
  useEffect(() => {
    if (!missionComplete && timeElapsed < mission.timeLimit) {
      const timer = setTimeout(() => setTimeElapsed(timeElapsed + 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeElapsed >= mission.timeLimit) {
      setFeedback('⏰ Time\'s up! Try again!');
    }
  }, [timeElapsed, missionComplete]);

  // Helper functions
  const calculateSlope = () => {
    const p1 = mission.points.p1;
    const p2 = mission.points.p2;
    return (p2.y - p1.y) / (p2.x - p1.x);
  };

  const calculateIntercept = () => {
    const slope = calculateSlope();
    const point = mission.points.p1;
    return point.y - (slope * point.x);
  };

  const correctSlope = calculateSlope();
  const correctIntercept = calculateIntercept();
  const correctEquation = `y = ${correctSlope}x + ${correctIntercept}`;

  const checkStep = () => {
    setAttempts(attempts + 1);

    if (currentStep === 1) {
      // Check slope
      const userSlope = parseFloat(answers.slope);
      if (Math.abs(userSlope - correctSlope) < 0.01) {
        setFeedback('✅ Correct slope! Moving to next step.');
        setScore(score + 10);
        setCurrentStep(2);
        setShowHint(false);
        setFeedback('');
      } else {
        setFeedback('❌ Incorrect slope. Try again!');
      }
    } 
    else if (currentStep === 2) {
      // Check intercept
      const userIntercept = parseFloat(answers.intercept);
      if (Math.abs(userIntercept - correctIntercept) < 0.01) {
        setFeedback('✅ Correct y-intercept! Moving to next step.');
        setScore(score + 10);
        setCurrentStep(3);
        setShowHint(false);
        setFeedback('');
      } else {
        setFeedback('❌ Incorrect y-intercept. Try again!');
      }
    }
    else if (currentStep === 3) {
      // Check equation
      const userEquation = answers.equation.replace(/\s+/g, '').toLowerCase();
      const normalizedCorrect = correctEquation.replace(/\s+/g, '').toLowerCase();
      
      if (userEquation === normalizedCorrect) {
        setFeedback('✅ Correct equation! Moving to final verification.');
        setScore(score + 10);
        setCurrentStep(4);
        setShowHint(false);
        setFeedback('');
      } else {
        setFeedback('❌ Incorrect equation. Make sure it\'s in y = mx + b form.');
      }
    }
    else if (currentStep === 4) {
      // Verification - check if they can apply the equation
      const p2 = mission.points.p2;
      const expectedY = correctSlope * p2.x + correctIntercept;
      const userY = parseFloat(answers.verification);
      
      if (Math.abs(userY - expectedY) < 0.01) {
        setFeedback('🎉 MISSION COMPLETE! You\'ve mastered The Point Portal!');
        setScore(score + 20);
        setMissionComplete(true);
      } else {
        setFeedback(`❌ When x = ${p2.x}, y should be ${expectedY}. Try again!`);
      }
    }
  };

  const resetMission = () => {
    setCurrentStep(1);
    setScore(0);
    setFeedback('');
    setMissionComplete(false);
    setTimeElapsed(0);
    setAttempts(0);
    setShowHint(false);
    setAnswers({
      slope: '',
      intercept: '',
      equation: '',
      verification: ''
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatTimeRemaining = () => {
    const remaining = mission.timeLimit - timeElapsed;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={styles.container}>
      {/* Mission Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            <GiSecretBook style={styles.titleIcon} />
            {mission.title}
          </h1>
          <div style={styles.stats}>
            <div style={styles.stat}>
              <FaTrophy color="#f59e0b" />
              <span style={styles.statText}>{score} pts</span>
            </div>
            <div style={styles.stat}>
              <MdAccessTime color="#3b82f6" />
              <span style={styles.statText}>{formatTimeRemaining()}</span>
            </div>
            <div style={styles.stat}>
              <FaStar color="#fbbf24" />
              <span style={styles.statText}>Step {currentStep}/4</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.attempts}>{attempts} attempts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Mission Area */}
      {!missionComplete ? (
        <div style={styles.missionArea}>
          {/* Step Progress */}
          <div style={styles.progressBar}>
            {mission.steps.map(step => (
              <div
                key={step.id}
                style={{
                  ...styles.progressStep,
                  backgroundColor: step.id < currentStep ? '#10b981' : 
                                 step.id === currentStep ? mission.color : '#e5e7eb',
                  color: step.id <= currentStep ? 'white' : '#6b7280',
                }}
              >
                {step.id}
              </div>
            ))}
          </div>

          {/* Mission Info */}
          <div style={styles.missionInfo}>
            <div style={{
              ...styles.missionIconLarge,
              backgroundColor: mission.bgColor,
              color: mission.color
            }}>
              {mission.icon}
            </div>
            <div style={styles.missionText}>
              <h2 style={styles.missionStepTitle}>{mission.steps[currentStep - 1].title}</h2>
              <p style={styles.missionDescription}>{mission.steps[currentStep - 1].instruction}</p>
            </div>
          </div>

          {/* Points Display */}
          <div style={styles.pointsBox}>
            <p style={styles.pointsText}>Point 1: ({mission.points.p1.x}, {mission.points.p1.y})</p>
            <p style={styles.pointsText}>Point 2: ({mission.points.p2.x}, {mission.points.p2.y})</p>
          </div>

          {/* Hint Toggle */}
          <button 
            style={styles.hintBtn}
            onClick={() => setShowHint(!showHint)}
          >
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </button>
          
          {showHint && (
            <div style={styles.hintBox}>
              <strong>💡 Hint:</strong> {mission.hint}
            </div>
          )}

          {/* Input Fields based on current step */}
          <div style={styles.inputSection}>
            {currentStep === 1 && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Slope (m):</label>
                <input
                  type="number"
                  step="0.1"
                  value={answers.slope}
                  onChange={(e) => setAnswers({...answers, slope: e.target.value})}
                  placeholder="Enter the slope"
                  style={styles.input}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Y-intercept (b):</label>
                <input
                  type="number"
                  step="0.1"
                  value={answers.intercept}
                  onChange={(e) => setAnswers({...answers, intercept: e.target.value})}
                  placeholder="Enter the y-intercept"
                  style={styles.input}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Equation (y = mx + b):</label>
                <input
                  type="text"
                  value={answers.equation}
                  onChange={(e) => setAnswers({...answers, equation: e.target.value})}
                  placeholder="e.g., y = 2x + 0"
                  style={styles.input}
                />
              </div>
            )}

            {currentStep === 4 && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  For point 2 ({mission.points.p2.x}, ?), what is y?
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={answers.verification}
                  onChange={(e) => setAnswers({...answers, verification: e.target.value})}
                  placeholder="Enter the y-value"
                  style={styles.input}
                />
              </div>
            )}

            <button style={styles.checkBtn} onClick={checkStep}>
              {currentStep === 4 ? 'Complete Mission' : 'Next Step'} <IoMdArrowForward />
            </button>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div style={{
              ...styles.feedback,
              backgroundColor: feedback.includes('✅') || feedback.includes('🎉') ? '#10b981' : '#ef4444'
            }}>
              {feedback}
            </div>
          )}
        </div>
      ) : (
        // Victory Screen
        <div style={styles.victoryScreen}>
          <GiFinishLine size={80} color="#f59e0b" />
          <h2 style={styles.victoryTitle}>MISSION COMPLETE!</h2>
          <p style={styles.victoryText}>You've mastered The Point Portal!</p>
          <div style={styles.victoryStats}>
            <div style={styles.victoryStat}>
              <FaTrophy size={24} color="#f59e0b" />
              <span style={styles.victoryStatValue}>{score}</span>
              <span>Final Score</span>
            </div>
            <div style={styles.victoryStat}>
              <MdAccessTime size={24} color="#3b82f6" />
              <span style={styles.victoryStatValue}>{formatTime(timeElapsed)}</span>
              <span>Time</span>
            </div>
            <div style={styles.victoryStat}>
              <FaBrain size={24} color="#8b5cf6" />
              <span style={styles.victoryStatValue}>{attempts}</span>
              <span>Attempts</span>
            </div>
          </div>
          <button style={styles.resetBtn} onClick={resetMission}>
            <IoMdRefresh /> Restart Mission
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    color: 'white',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  titleIcon: {
    fontSize: '28px',
  },
  stats: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255,255,255,0.2)',
    padding: '6px 10px',
    borderRadius: '20px',
    fontSize: '13px',
  },
  statText: {
    fontWeight: '500',
  },
  attempts: {
    background: 'rgba(0,0,0,0.2)',
    padding: '2px 6px',
    borderRadius: '12px',
  },
  missionArea: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  progressBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  progressStep: {
    flex: 1,
    height: '8px',
    borderRadius: '4px',
    position: 'relative',
    '::after': {
      content: 'attr(data-step)',
      position: 'absolute',
      top: '-20px',
      left: '50%',
      transform: 'translateX(-50%)',
    },
  },
  missionInfo: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '2px solid #f3f4f6',
  },
  missionIconLarge: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionText: {
    flex: 1,
  },
  missionStepTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  missionDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  pointsBox: {
    background: '#f3f4f6',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-around',
  },
  pointsText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2563eb',
    margin: 0,
  },
  hintBtn: {
    background: '#f3f4f6',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#4b5563',
    cursor: 'pointer',
    marginBottom: '15px',
  },
  hintBox: {
    background: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '20px',
    fontSize: '13px',
    color: '#92400e',
  },
  inputSection: {
    marginTop: '20px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
    ':focus': {
      outline: 'none',
      borderColor: '#3b82f6',
    },
  },
  checkBtn: {
    width: '100%',
    padding: '12px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      background: '#1d4ed8',
    },
  },
  feedback: {
    marginTop: '20px',
    padding: '12px',
    borderRadius: '6px',
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
    animation: 'slideIn 0.3s ease',
  },
  victoryScreen: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  victoryTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#f59e0b',
    margin: '20px 0 10px 0',
  },
  victoryText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '30px',
  },
  victoryStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  victoryStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  victoryStatValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
  },
  resetBtn: {
    padding: '10px 24px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      background: '#2563eb',
    },
  },
};

// Add animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);

export default FirstMission;