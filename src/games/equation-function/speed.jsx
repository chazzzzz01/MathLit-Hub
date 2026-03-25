// src/games/equation-function/speed.jsx
import React, { useState, useEffect } from 'react';

const SpeedChallenge = ({ onComplete, onScore }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentEquation, setCurrentEquation] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [message, setMessage] = useState('');
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [equationsSolved, setEquationsSolved] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Generate random linear equation based on difficulty
  const generateLinearEquation = () => {
    // Select equation type based on difficulty
    const types = ['one-step', 'two-step', 'variables-both-sides', 'distributive', 'fraction'];
    let type;
    
    if (difficulty === 1) {
      type = 'one-step';
    } else if (difficulty === 2) {
      type = Math.random() > 0.5 ? 'one-step' : 'two-step';
    } else if (difficulty === 3) {
      type = Math.random() > 0.3 ? 'two-step' : 'variables-both-sides';
    } else if (difficulty === 4) {
      type = types[Math.floor(Math.random() * 4)];
    } else {
      type = types[Math.floor(Math.random() * types.length)];
    }
    
    let equation, solution, variable = 'x';
    
    switch(type) {
      case 'one-step':
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 50) + 1;
        const op = Math.random() > 0.5 ? '+' : '-';
        
        if (op === '+') {
          equation = `${variable} + ${a} = ${b}`;
          solution = b - a;
        } else {
          equation = `${variable} - ${a} = ${b}`;
          solution = b + a;
        }
        break;
        
      case 'two-step':
        const coeff = Math.floor(Math.random() * 8) + 2;
        const constant = Math.floor(Math.random() * 20) + 1;
        const result = coeff * Math.floor(Math.random() * 15) + constant;
        equation = `${coeff}${variable} + ${constant} = ${result}`;
        solution = (result - constant) / coeff;
        break;
        
      case 'variables-both-sides':
        const leftCoeff = Math.floor(Math.random() * 6) + 2;
        const rightCoeff = Math.floor(Math.random() * 4) + 1;
        const leftConst = Math.floor(Math.random() * 15) + 1;
        const rightConst = Math.floor(Math.random() * 15) + 1;
        
        equation = `${leftCoeff}${variable} + ${leftConst} = ${rightCoeff}${variable} + ${rightConst}`;
        solution = (rightConst - leftConst) / (leftCoeff - rightCoeff);
        break;
        
      case 'distributive':
        const outer = Math.floor(Math.random() * 5) + 2;
        const innerCoeff = Math.floor(Math.random() * 3) + 1;
        const innerConst = Math.floor(Math.random() * 8) + 1;
        const eqResult = Math.floor(Math.random() * 50) + 20;
        
        equation = `${outer}(${innerCoeff}${variable} + ${innerConst}) = ${eqResult}`;
        solution = (eqResult / outer - innerConst) / innerCoeff;
        break;
        
      default: // fraction
        const numerator = Math.floor(Math.random() * 8) + 2;
        const denominator = Math.floor(Math.random() * 4) + 2;
        const fracConst = Math.floor(Math.random() * 10) + 1;
        const fracResult = Math.floor(Math.random() * 30) + 10;
        
        equation = `${numerator}/${denominator}${variable} + ${fracConst} = ${fracResult}`;
        solution = ((fracResult - fracConst) * denominator) / numerator;
        break;
    }
    
    // Round solution to 2 decimal places if it's not an integer
    solution = Math.round(solution * 100) / 100;
    
    return {
      text: equation,
      answer: solution,
      type: type
    };
  };

  // Generate equation for the current difficulty
  const generateEquation = () => {
    return generateLinearEquation();
  };

  // Timer effect
  useEffect(() => {
    let timer;
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameActive(false);
            const finalScore = score + (streak * 10);
            if (onComplete) onComplete(finalScore);
            if (onScore) onScore(finalScore);
            setMessage(`⏰ Time's up! Final score: ${finalScore}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameActive, timeLeft, score, streak, onComplete, onScore]);

  // Initialize first equation
  useEffect(() => {
    setCurrentEquation(generateEquation());
  }, []);

  // Update difficulty based on equations solved
  useEffect(() => {
    if (equationsSolved >= 20) {
      setDifficulty(5);
    } else if (equationsSolved >= 15) {
      setDifficulty(4);
    } else if (equationsSolved >= 10) {
      setDifficulty(3);
    } else if (equationsSolved >= 5) {
      setDifficulty(2);
    } else {
      setDifficulty(1);
    }
  }, [equationsSolved]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!gameActive) return;
    
    const userNum = parseFloat(userAnswer);
    if (isNaN(userNum)) {
      setMessage('❌ Please enter a number!');
      return;
    }
    
    // Allow small rounding errors (within 0.01)
    const isCorrect = Math.abs(userNum - currentEquation.answer) < 0.01;
    
    if (isCorrect) {
      // Calculate points based on difficulty and speed
      const basePoints = 10 * difficulty;
      const speedBonus = Math.max(0, Math.floor(30 / (equationsSolved % 10 + 1)));
      const streakBonus = streak * 3;
      const pointsEarned = basePoints + speedBonus + streakBonus;
      
      setScore(prev => prev + pointsEarned);
      setStreak(prev => prev + 1);
      setEquationsSolved(prev => prev + 1);
      setShowHint(false);
      
      // Difficulty increase message
      if (equationsSolved + 1 === 5) {
        setMessage(`🚀 Difficulty increased! +${pointsEarned} points! 🚀`);
      } else if (equationsSolved + 1 === 10) {
        setMessage(`⚡ You're on fire! Difficulty increased! +${pointsEarned} points! ⚡`);
      } else if (equationsSolved + 1 === 15) {
        setMessage(`🔥 MASTER MODE ACTIVATED! +${pointsEarned} points! 🔥`);
      } else if (equationsSolved + 1 === 20) {
        setMessage(`🏆 LEGENDARY MODE! +${pointsEarned} points! 🏆`);
      } else if (streak + 1 === 5) {
        setMessage(`✨ Amazing! 5 in a row! +${pointsEarned} points! ✨`);
      } else if (streak + 1 === 10) {
        setMessage(`🌟 GODLIKE! 10 streak! +${pointsEarned} points! 🌟`);
      } else {
        setMessage(`✅ Correct! +${pointsEarned} points! Streak: ${streak + 1}`);
      }
      
      setCurrentEquation(generateEquation());
      setUserAnswer('');
    } else {
      setStreak(0);
      // Don't show the correct answer, just give a generic error message
      setMessage(`❌ Wrong! Your streak is broken. Try again!`);
      setUserAnswer('');
    }
  };

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const resetGame = () => {
    setTimeLeft(60);
    setScore(0);
    setGameActive(true);
    setStreak(0);
    setMessage('');
    setUserAnswer('');
    setDifficulty(1);
    setEquationsSolved(0);
    setShowHint(false);
    setCurrentEquation(generateEquation());
  };

  const getDifficultyColor = () => {
    switch(difficulty) {
      case 1: return '#4caf50';
      case 2: return '#8bc34a';
      case 3: return '#ffc107';
      case 4: return '#ff9800';
      case 5: return '#f44336';
      default: return '#4caf50';
    }
  };

  const getDifficultyName = () => {
    switch(difficulty) {
      case 1: return 'Easy';
      case 2: return 'Normal';
      case 3: return 'Hard';
      case 4: return 'Expert';
      case 5: return 'Master';
      default: return 'Easy';
    }
  };

  const getHint = () => {
    if (!currentEquation) return '';
    
    switch(currentEquation.type) {
      case 'one-step':
        return '💡 Hint: To solve for x, perform the inverse operation on both sides.';
      case 'two-step':
        return '💡 Hint: First subtract the constant, then divide by the coefficient.';
      case 'variables-both-sides':
        return '💡 Hint: Get all x terms on one side and constants on the other.';
      case 'distributive':
        return '💡 Hint: First distribute the number outside the parentheses.';
      case 'fraction':
        return '💡 Hint: Multiply both sides by the denominator to clear the fraction.';
      default:
        return '💡 Hint: Isolate x by performing inverse operations.';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.statsContainer}>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>⏱️ Time</div>
          <div style={styles.statValue}>{formatTime()}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>⭐ Score</div>
          <div style={styles.statValue}>{score}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>🔥 Streak</div>
          <div style={styles.statValue}>{streak}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>📊 Level</div>
          <div style={{...styles.statValue, color: getDifficultyColor()}}>
            {getDifficultyName()}
          </div>
        </div>
      </div>

      {gameActive ? (
        <div style={styles.gameArea}>
          <div style={styles.equationCard}>
            <h2 style={styles.equation}>Solve for x:</h2>
            <div style={styles.equationDisplay}>{currentEquation?.text}</div>
            {currentEquation?.type === 'fraction' && (
              <div style={styles.hintBadge}>📐 Fraction equation</div>
            )}
            {currentEquation?.type === 'distributive' && (
              <div style={styles.hintBadge}>📦 Distributive property</div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} style={styles.inputForm}>
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Enter x = ?"
              style={styles.input}
              step="any"
              autoFocus
              disabled={!gameActive}
            />
            <button type="submit" style={styles.submitBtn} disabled={!gameActive}>
              ✓ Submit
            </button>
            <button 
              type="button" 
              style={styles.hintBtn}
              onClick={() => setShowHint(!showHint)}
            >
              💡 Hint
            </button>
          </form>
          
          {message && (
            <div style={message.includes('Correct') ? styles.successMessage : styles.errorMessage}>
              {message}
            </div>
          )}
          
          {showHint && (
            <div style={styles.hintContainer}>
              {getHint()}
            </div>
          )}
          
          <div style={styles.progress}>
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${(equationsSolved / 20) * 100}%`,
                  backgroundColor: getDifficultyColor()
                }}
              ></div>
            </div>
            <div style={styles.progressText}>
              {equationsSolved} equations solved • Next level at {difficulty === 1 ? 5 : difficulty === 2 ? 10 : difficulty === 3 ? 15 : difficulty === 4 ? 20 : 'MAX'}
            </div>
          </div>
          
          <div style={styles.tips}>
            <p>📚 Tips:</p>
            <p>• Solve linear equations by isolating x</p>
            <p>• Difficulty increases as you solve more equations!</p>
            <p>• Current difficulty: {getDifficultyName()} - Points ×{difficulty}</p>
            <p>• 5 streak: +3 bonus • 10 streak: +6 bonus</p>
            <p>• Speed bonus: Answer quickly for extra points!</p>
            {difficulty >= 3 && (
              <p style={styles.warning}>⚠️ Watch out for fractions and variables on both sides!</p>
            )}
          </div>
        </div>
      ) : (
        <div style={styles.endScreen}>
          <h2 style={styles.endTitle}>🎯 Speed Challenge Complete! 🎯</h2>
          <p style={styles.finalScore}>Final Score: {score + (streak * 10)}</p>
          <p style={styles.equationsSolved}>Equations Solved: {equationsSolved}</p>
          <p style={styles.stats}>
            {score >= 1000 && "🏆 MATH LEGEND! 🏆"}
            {score >= 500 && score < 1000 && "⚡ SPEED DEMON! ⚡"}
            {score >= 200 && score < 500 && "👍 MATH WARRIOR! 👍"}
            {score >= 100 && score < 200 && "💪 KEEP GOING! 💪"}
            {score < 100 && "📚 PRACTICE MAKES PERFECT! 📚"}
          </p>
          <button onClick={resetGame} style={styles.resetBtn}>
            🔄 Play Again
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#2a2a4a',
    borderRadius: '15px',
    padding: '30px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '30px',
    gap: '10px',
    flexWrap: 'wrap',
  },
  statBox: {
    backgroundColor: '#1e1e2e',
    padding: '15px',
    borderRadius: '10px',
    textAlign: 'center',
    flex: 1,
    minWidth: '80px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#aaa',
    marginBottom: '5px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffd93d',
  },
  gameArea: {
    textAlign: 'center',
  },
  equationCard: {
    backgroundColor: '#1e1e2e',
    padding: '30px',
    borderRadius: '15px',
    marginBottom: '30px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    position: 'relative',
  },
  equation: {
    fontSize: '24px',
    color: '#ffd93d',
    margin: '0 0 15px 0',
    fontFamily: 'monospace',
  },
  equationDisplay: {
    fontSize: '42px',
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  hintBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#ff9800',
    color: '#1e1e2e',
    padding: '4px 8px',
    borderRadius: '5px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  inputForm: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  input: {
    padding: '12px 20px',
    fontSize: '18px',
    borderRadius: '8px',
    border: '2px solid #4a6fa5',
    backgroundColor: '#1e1e2e',
    color: '#fff',
    width: '200px',
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '12px 30px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    '&:hover': {
      backgroundColor: '#45a049',
      transform: 'scale(1.05)',
    },
    '&:disabled': {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed',
    },
  },
  hintBtn: {
    backgroundColor: '#ff9800',
    color: 'white',
    padding: '12px 30px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    '&:hover': {
      backgroundColor: '#f57c00',
      transform: 'scale(1.05)',
    },
  },
  successMessage: {
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '16px',
    backgroundColor: '#1e1e2e',
    color: '#4caf50',
    animation: 'slideIn 0.3s',
    borderLeft: '4px solid #4caf50',
  },
  errorMessage: {
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '16px',
    backgroundColor: '#1e1e2e',
    color: '#f44336',
    animation: 'shake 0.3s',
    borderLeft: '4px solid #f44336',
  },
  hintContainer: {
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    backgroundColor: '#1e1e2e',
    color: '#ffd93d',
    textAlign: 'center',
    borderLeft: '4px solid #ff9800',
  },
  progress: {
    marginTop: '20px',
    marginBottom: '20px',
  },
  progressBar: {
    width: '100%',
    height: '10px',
    backgroundColor: '#1e1e2e',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  progressText: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#aaa',
  },
  tips: {
    marginTop: '30px',
    padding: '15px',
    backgroundColor: '#1e1e2e',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#aaa',
    textAlign: 'left',
  },
  warning: {
    color: '#ff9800',
    marginTop: '8px',
  },
  endScreen: {
    textAlign: 'center',
    padding: '20px',
  },
  endTitle: {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#ffd93d',
  },
  finalScore: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#fff',
  },
  equationsSolved: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#4ecdc4',
  },
  stats: {
    fontSize: '18px',
    marginBottom: '30px',
    color: '#4caf50',
  },
  resetBtn: {
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '12px 30px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    '&:hover': {
      backgroundColor: '#45a049',
      transform: 'scale(1.05)',
    },
  },
};

export default SpeedChallenge;