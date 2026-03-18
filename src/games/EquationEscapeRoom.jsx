// src/games/EquationEscapeRoom.jsx
import React, { useState, useEffect } from 'react';
import { IoMdLock, IoMdUnlock, IoMdArrowForward, IoMdRefresh } from 'react-icons/io';
import { FaCalculator, FaChartLine, FaBrain, FaTrophy, FaStar } from 'react-icons/fa';
import { GiSecretBook, GiPuzzle, GiFinishLine } from 'react-icons/gi';
import { MdAccessTime, MdLeaderboard } from 'react-icons/md';

function EquationEscapeRoom() {
  // Remove the gameStarted state from here - it's controlled by Game.jsx
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  const [gameComplete, setGameComplete] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  
  // State for level inputs
  const [level1Answers, setLevel1Answers] = useState({ slope: '', intercept: '' });
  const [level2Answers, setLevel2Answers] = useState({ equation: '', intercept: '' });
  const [level3Answers, setLevel3Answers] = useState({ slope: '', intercept: '', equation: '' });
  const [finalAnswers, setFinalAnswers] = useState({
    slope: '',
    intercept: '',
    equation: '',
    xIntercept: '',
    yIntercept: ''
  });

  // Level data
  const levels = {
    1: {
      title: "The Point Portal",
      description: "Two points hold the key to the first lock. Find their relationship!",
      icon: <GiSecretBook size={32} />,
      color: "#3b82f6",
      bgColor: "#dbeafe",
      points: { p1: { x: 2, y: 4 }, p2: { x: 5, y: 10 } },
      hint: "Slope = (y₂ - y₁) / (x₂ - x₁). Then use y = mx + b to find intercept.",
      timeLimit: 300 // 5 minutes
    },
    2: {
      title: "Slope-Intercept Chamber",
      description: "A slope and a point guide the way. Write the equation to proceed!",
      icon: <FaChartLine size={32} />,
      color: "#8b5cf6",
      bgColor: "#ede9fe",
      slope: 3,
      point: { x: 1, y: 5 },
      hint: "Plug the point into y = mx + b to find b, then write the full equation.",
      timeLimit: 300
    },
    3: {
      title: "Real-World Riddle",
      description: "Decode this real-life situation to find the mathematical pattern!",
      icon: <FaBrain size={32} />,
      color: "#10b981",
      bgColor: "#d1fae5",
      problem: {
        text: "A cell phone plan costs $30 per month plus $0.10 per text message. " +
               "Find the slope, y-intercept, and equation of the cost function.",
        monthlyFee: 30,
        perTextCost: 0.10
      },
      hint: "The monthly fee is your y-intercept. The cost per text is your slope.",
      timeLimit: 400
    },
    4: {
      title: "Final Boss: The Equation Fortress",
      description: "All concepts combined! Find every piece of the puzzle to escape!",
      icon: <GiFinishLine size={32} />,
      color: "#ef4444",
      bgColor: "#fee2e2",
      points: { p1: { x: -2, y: 1 }, p2: { x: 4, y: 7 } },
      hint: "Find slope first, then intercept. Use these to write equation and find both intercepts.",
      timeLimit: 600
    }
  };

  // Timer effect - remove gameStarted dependency
  useEffect(() => {
    if (!gameComplete && timeElapsed < levels[currentLevel].timeLimit) {
      const timer = setTimeout(() => setTimeElapsed(timeElapsed + 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeElapsed >= levels[currentLevel].timeLimit) {
      setFeedback('⏰ Time\'s up! Try again!');
    }
  }, [timeElapsed, gameComplete, currentLevel]);

  // Helper functions
  const calculateSlope = (p1, p2) => (p2.y - p1.y) / (p2.x - p1.x);
  const calculateIntercept = (point, slope) => point.y - (slope * point.x);

  // Level 1 check
  const checkLevel1 = () => {
    setAttempts(attempts + 1);
    const correctSlope = calculateSlope(levels[1].points.p1, levels[1].points.p2);
    const correctIntercept = calculateIntercept(levels[1].points.p1, correctSlope);
    
    const userSlope = parseFloat(level1Answers.slope);
    const userIntercept = parseFloat(level1Answers.intercept);
    
    if (Math.abs(userSlope - correctSlope) < 0.01 && 
        Math.abs(userIntercept - correctIntercept) < 0.01) {
      setFeedback('✅ Portal unlocked! +10 points!');
      setScore(score + 10);
      setUnlockedLevels([...unlockedLevels, 2]);
      setTimeout(() => {
        setCurrentLevel(2);
        setTimeElapsed(0);
        setShowHint(false);
        setFeedback('');
      }, 2000);
    } else {
      setFeedback('❌ Lock remains closed. Check your calculations!');
    }
  };

  // Level 2 check
  const checkLevel2 = () => {
    setAttempts(attempts + 1);
    const correctIntercept = calculateIntercept(levels[2].point, levels[2].slope);
    const correctEquation = `y = ${levels[2].slope}x + ${correctIntercept}`;
    
    const userEquation = level2Answers.equation.replace(/\s+/g, '').toLowerCase();
    const normalizedCorrect = correctEquation.replace(/\s+/g, '').toLowerCase();
    
    if (userEquation === normalizedCorrect && 
        parseFloat(level2Answers.intercept) === correctIntercept) {
      setFeedback('✅ Chamber unlocked! +15 points!');
      setScore(score + 15);
      setUnlockedLevels([...unlockedLevels, 3]);
      setTimeout(() => {
        setCurrentLevel(3);
        setTimeElapsed(0);
        setShowHint(false);
        setFeedback('');
      }, 2000);
    } else {
      setFeedback('❌ The equation doesn\'t match. Try again!');
    }
  };

  // Level 3 check
  const checkLevel3 = () => {
    setAttempts(attempts + 1);
    const correctSlope = levels[3].problem.perTextCost;
    const correctIntercept = levels[3].problem.monthlyFee;
    const correctEquation = `y = ${correctSlope}x + ${correctIntercept}`;
    
    const userSlope = parseFloat(level3Answers.slope);
    const userIntercept = parseFloat(level3Answers.intercept);
    const userEquation = level3Answers.equation.replace(/\s+/g, '').toLowerCase();
    const normalizedCorrect = correctEquation.replace(/\s+/g, '').toLowerCase();
    
    if (Math.abs(userSlope - correctSlope) < 0.01 && 
        Math.abs(userIntercept - correctIntercept) < 0.01 &&
        userEquation === normalizedCorrect) {
      setFeedback('✅ Riddle solved! +20 points!');
      setScore(score + 20);
      setUnlockedLevels([...unlockedLevels, 4]);
      setTimeout(() => {
        setCurrentLevel(4);
        setTimeElapsed(0);
        setShowHint(false);
        setFeedback('');
      }, 2000);
    } else {
      setFeedback('❌ Think about what slope and intercept mean in this context.');
    }
  };

  // Final boss check
  const checkFinalBoss = () => {
    setAttempts(attempts + 1);
    const correctSlope = calculateSlope(levels[4].points.p1, levels[4].points.p2);
    const correctIntercept = calculateIntercept(levels[4].points.p1, correctSlope);
    const correctEquation = `y = ${correctSlope.toFixed(1)}x + ${correctIntercept.toFixed(1)}`;
    const correctXIntercept = -correctIntercept / correctSlope;
    const correctYIntercept = correctIntercept;
    
    const userSlope = parseFloat(finalAnswers.slope);
    const userIntercept = parseFloat(finalAnswers.intercept);
    const userEquation = finalAnswers.equation.replace(/\s+/g, '').toLowerCase();
    const normalizedCorrect = correctEquation.replace(/\s+/g, '').toLowerCase();
    const userXIntercept = parseFloat(finalAnswers.xIntercept);
    const userYIntercept = parseFloat(finalAnswers.yIntercept);
    
    if (Math.abs(userSlope - correctSlope) < 0.1 &&
        Math.abs(userIntercept - correctIntercept) < 0.1 &&
        userEquation === normalizedCorrect &&
        Math.abs(userXIntercept - correctXIntercept) < 0.1 &&
        Math.abs(userYIntercept - correctYIntercept) < 0.1) {
      setFeedback('🎉 CONGRATULATIONS! You\'ve escaped! +50 points! 🎉');
      setScore(score + 50);
      setGameComplete(true);
    } else {
      setFeedback('❌ The final lock holds strong. Check all components carefully.');
    }
  };

  const resetGame = () => {
    setCurrentLevel(1);
    setScore(0);
    setFeedback('');
    setUnlockedLevels([1]);
    setGameComplete(false);
    setTimeElapsed(0);
    setAttempts(0);
    setShowHint(false);
    setLevel1Answers({ slope: '', intercept: '' });
    setLevel2Answers({ equation: '', intercept: '' });
    setLevel3Answers({ slope: '', intercept: '', equation: '' });
    setFinalAnswers({ slope: '', intercept: '', equation: '', xIntercept: '', yIntercept: '' });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor((levels[currentLevel].timeLimit - seconds) / 60);
    const secs = (levels[currentLevel].timeLimit - seconds) % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Always render the game content since Game.jsx controls when to show this component
  return (
    <div style={styles.container}>
      {/* Game Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            <GiPuzzle style={styles.titleIcon} />
            Equation Escape Room
          </h1>
          <div style={styles.stats}>
            <div style={styles.stat}>
              <FaTrophy color="#f59e0b" />
              <span style={styles.statText}>{score} pts</span>
            </div>
            <div style={styles.stat}>
              <MdAccessTime color="#3b82f6" />
              <span style={styles.statText}>{formatTime(timeElapsed)}</span>
            </div>
            <div style={styles.stat}>
              <FaStar color="#fbbf24" />
              <span style={styles.statText}>Level {currentLevel}/4</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.attempts}>{attempts} attempts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Level Navigation */}
      <div style={styles.levelNav}>
        {[1, 2, 3, 4].map(level => (
          <button
            key={level}
            style={{
              ...styles.levelBtn,
              backgroundColor: unlockedLevels.includes(level) 
                ? (currentLevel === level ? levels[level].color : '#fff')
                : '#e5e7eb',
              color: unlockedLevels.includes(level)
                ? (currentLevel === level ? '#fff' : '#374151')
                : '#9ca3af',
              border: currentLevel === level ? `2px solid ${levels[level].color}` : 'none',
              cursor: unlockedLevels.includes(level) ? 'pointer' : 'not-allowed',
            }}
            onClick={() => unlockedLevels.includes(level) && setCurrentLevel(level)}
            disabled={!unlockedLevels.includes(level)}
          >
            {unlockedLevels.includes(level) ? (
              <IoMdUnlock style={styles.levelIcon} />
            ) : (
              <IoMdLock style={styles.levelIcon} />
            )}
            Level {level}
          </button>
        ))}
      </div>

      {/* Main Game Area */}
      {!gameComplete ? (
        <div style={styles.gameArea}>
          {/* Level Info */}
          <div style={styles.levelInfo}>
            <div style={{
              ...styles.levelIconLarge,
              backgroundColor: levels[currentLevel].bgColor,
              color: levels[currentLevel].color
            }}>
              {levels[currentLevel].icon}
            </div>
            <div style={styles.levelText}>
              <h2 style={styles.levelTitle}>{levels[currentLevel].title}</h2>
              <p style={styles.levelDescription}>{levels[currentLevel].description}</p>
            </div>
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
              <strong>💡 Hint:</strong> {levels[currentLevel].hint}
            </div>
          )}

          {/* Level 1 Content */}
          {currentLevel === 1 && (
            <div style={styles.levelContent}>
              <div style={styles.problemBox}>
                <p>Find the slope and y-intercept that connect these points:</p>
                <p style={styles.points}>Point 1: ({levels[1].points.p1.x}, {levels[1].points.p1.y})</p>
                <p style={styles.points}>Point 2: ({levels[1].points.p2.x}, {levels[1].points.p2.y})</p>
              </div>
              
              <div style={styles.inputGroup}>
                <label>Slope (m):</label>
                <input
                  type="number"
                  step="0.1"
                  value={level1Answers.slope}
                  onChange={(e) => setLevel1Answers({...level1Answers, slope: e.target.value})}
                  placeholder="Enter slope"
                  style={styles.input}
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label>Y-intercept (b):</label>
                <input
                  type="number"
                  step="0.1"
                  value={level1Answers.intercept}
                  onChange={(e) => setLevel1Answers({...level1Answers, intercept: e.target.value})}
                  placeholder="Enter y-intercept"
                  style={styles.input}
                />
              </div>
              
              <button style={styles.checkBtn} onClick={checkLevel1}>
                Unlock Level <IoMdArrowForward />
              </button>
            </div>
          )}

          {/* Level 2 Content */}
          {currentLevel === 2 && (
            <div style={styles.levelContent}>
              <div style={styles.problemBox}>
                <p>Given a slope of <strong>{levels[2].slope}</strong> and point</p>
                <p style={styles.points}>({levels[2].point.x}, {levels[2].point.y})</p>
                <p>Write the equation in slope-intercept form!</p>
              </div>
              
              <div style={styles.inputGroup}>
                <label>Equation (y = mx + b):</label>
                <input
                  type="text"
                  value={level2Answers.equation}
                  onChange={(e) => setLevel2Answers({...level2Answers, equation: e.target.value})}
                  placeholder="e.g., y = 3x + 2"
                  style={styles.input}
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label>Y-intercept (b):</label>
                <input
                  type="number"
                  step="0.1"
                  value={level2Answers.intercept}
                  onChange={(e) => setLevel2Answers({...level2Answers, intercept: e.target.value})}
                  placeholder="Enter y-intercept"
                  style={styles.input}
                />
              </div>
              
              <button style={styles.checkBtn} onClick={checkLevel2}>
                Unlock Level <IoMdArrowForward />
              </button>
            </div>
          )}

          {/* Level 3 Content */}
          {currentLevel === 3 && (
            <div style={styles.levelContent}>
              <div style={styles.problemBox}>
                <p style={styles.wordProblem}>{levels[3].problem.text}</p>
              </div>
              
              <div style={styles.inputGroup}>
                <label>Slope (cost per text):</label>
                <input
                  type="number"
                  step="0.01"
                  value={level3Answers.slope}
                  onChange={(e) => setLevel3Answers({...level3Answers, slope: e.target.value})}
                  placeholder="Enter slope"
                  style={styles.input}
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label>Y-intercept (monthly fee):</label>
                <input
                  type="number"
                  step="0.1"
                  value={level3Answers.intercept}
                  onChange={(e) => setLevel3Answers({...level3Answers, intercept: e.target.value})}
                  placeholder="Enter y-intercept"
                  style={styles.input}
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label>Equation:</label>
                <input
                  type="text"
                  value={level3Answers.equation}
                  onChange={(e) => setLevel3Answers({...level3Answers, equation: e.target.value})}
                  placeholder="e.g., y = 0.10x + 30"
                  style={styles.input}
                />
              </div>
              
              <button style={styles.checkBtn} onClick={checkLevel3}>
                Unlock Level <IoMdArrowForward />
              </button>
            </div>
          )}

          {/* Level 4 Content */}
          {currentLevel === 4 && (
            <div style={styles.levelContent}>
              <div style={styles.problemBox}>
                <p>Final Challenge! From these two points, find everything:</p>
                <p style={styles.points}>Point 1: ({levels[4].points.p1.x}, {levels[4].points.p1.y})</p>
                <p style={styles.points}>Point 2: ({levels[4].points.p2.x}, {levels[4].points.p2.y})</p>
              </div>
              
              <div style={styles.inputGrid}>
                <div style={styles.inputGroup}>
                  <label>Slope:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={finalAnswers.slope}
                    onChange={(e) => setFinalAnswers({...finalAnswers, slope: e.target.value})}
                    placeholder="Slope"
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.inputGroup}>
                  <label>Y-intercept:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={finalAnswers.intercept}
                    onChange={(e) => setFinalAnswers({...finalAnswers, intercept: e.target.value})}
                    placeholder="Y-intercept"
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.inputGroup}>
                  <label>Equation:</label>
                  <input
                    type="text"
                    value={finalAnswers.equation}
                    onChange={(e) => setFinalAnswers({...finalAnswers, equation: e.target.value})}
                    placeholder="Equation"
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.inputGroup}>
                  <label>X-intercept:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={finalAnswers.xIntercept}
                    onChange={(e) => setFinalAnswers({...finalAnswers, xIntercept: e.target.value})}
                    placeholder="X-intercept"
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.inputGroup}>
                  <label>Y-intercept:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={finalAnswers.yIntercept}
                    onChange={(e) => setFinalAnswers({...finalAnswers, yIntercept: e.target.value})}
                    placeholder="Y-intercept"
                    style={styles.input}
                  />
                </div>
              </div>
              
              <button style={{...styles.checkBtn, backgroundColor: '#ef4444'}} onClick={checkFinalBoss}>
                Attempt Final Escape! <IoMdArrowForward />
              </button>
            </div>
          )}

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
          <h2 style={styles.victoryTitle}>ESCAPE SUCCESSFUL!</h2>
          <p style={styles.victoryText}>You've mastered linear equations!</p>
          <div style={styles.victoryStats}>
            <div style={styles.victoryStat}>
              <FaTrophy size={24} color="#f59e0b" />
              <span style={styles.victoryStatValue}>{score}</span>
              <span>Final Score</span>
            </div>
            <div style={styles.victoryStat}>
              <MdAccessTime size={24} color="#3b82f6" />
              <span style={styles.victoryStatValue}>{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</span>
              <span>Total Time</span>
            </div>
            <div style={styles.victoryStat}>
              <FaBrain size={24} color="#8b5cf6" />
              <span style={styles.victoryStatValue}>{attempts}</span>
              <span>Attempts</span>
            </div>
          </div>
          <button style={styles.resetBtn} onClick={resetGame}>
            <IoMdRefresh /> Play Again
          </button>
        </div>
      )}

      {/* Leaderboard Preview */}
      <div style={styles.leaderboardPreview}>
        <div style={styles.leaderboardHeader}>
          <MdLeaderboard size={24} color="#f59e0b" />
          <h3 style={styles.leaderboardTitle}>Escape Room Champions</h3>
        </div>
        <div style={styles.leaderboardList}>
          {[
            { name: 'MathMaster', score: 95, time: '4:32' },
            { name: 'EquationPro', score: 90, time: '5:15' },
            { name: 'SlopeKing', score: 85, time: '6:00' },
            { name: 'InterceptQueen', score: 80, time: '6:45' },
            { name: 'NumberNinja', score: 75, time: '7:20' }
          ].map((player, index) => (
            <div key={index} style={styles.leaderboardItem}>
              <span style={styles.position}>#{index + 1}</span>
              <span style={styles.playerName}>{player.name}</span>
              <span style={styles.playerScore}>{player.score} pts</span>
              <span style={styles.playerTime}>{player.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    padding: '24px',
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
    fontSize: '28px',
    fontWeight: '700',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  titleIcon: {
    fontSize: '32px',
  },
  stats: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255,255,255,0.2)',
    padding: '8px 12px',
    borderRadius: '20px',
    fontSize: '14px',
  },
  statText: {
    fontWeight: '500',
  },
  attempts: {
    background: 'rgba(0,0,0,0.2)',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  levelNav: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  levelBtn: {
    flex: 1,
    minWidth: '100px',
    padding: '12px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  levelIcon: {
    fontSize: '16px',
  },
  gameArea: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  levelInfo: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '2px solid #f3f4f6',
  },
  levelIconLarge: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    flex: 1,
  },
  levelTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  levelDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  hintBtn: {
    background: '#f3f4f6',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#4b5563',
    cursor: 'pointer',
    marginBottom: '15px',
  },
  hintBox: {
    background: '#fef3c7',
    border: '1px solid #fbbf24',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#92400e',
  },
  levelContent: {
    animation: 'fadeIn 0.3s ease',
  },
  problemBox: {
    background: '#f9fafb',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
    fontSize: '16px',
    lineHeight: '1.6',
    border: '1px solid #e5e7eb',
  },
  points: {
    fontFamily: 'monospace',
    fontSize: '18px',
    fontWeight: '600',
    color: '#2563eb',
    margin: '5px 0',
  },
  wordProblem: {
    fontSize: '16px',
    color: '#374151',
    lineHeight: '1.6',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    marginTop: '6px',
    transition: 'border-color 0.2s',
  },
  inputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  checkBtn: {
    width: '100%',
    padding: '14px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  feedback: {
    marginTop: '20px',
    padding: '15px',
    borderRadius: '8px',
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
    animation: 'slideIn 0.3s ease',
  },
  victoryScreen: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    marginBottom: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  victoryTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#f59e0b',
    margin: '20px 0 10px 0',
  },
  victoryText: {
    fontSize: '18px',
    color: '#6b7280',
    marginBottom: '30px',
  },
  victoryStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  victoryStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  victoryStatValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
  },
  resetBtn: {
    padding: '12px 30px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  leaderboardPreview: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  leaderboardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
  },
  leaderboardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  leaderboardItem: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 80px 60px',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#f9fafb',
    borderRadius: '8px',
    fontSize: '14px',
  },
  position: {
    fontWeight: '600',
    color: '#6b7280',
  },
  playerName: {
    fontWeight: '500',
    color: '#1f2937',
  },
  playerScore: {
    fontWeight: '600',
    color: '#f59e0b',
    textAlign: 'right',
  },
  playerTime: {
    color: '#6b7280',
    textAlign: 'right',
  },
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
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

export default EquationEscapeRoom;