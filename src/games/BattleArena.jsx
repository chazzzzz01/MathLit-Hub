// src/games/BattleArena.jsx
import React, { useState, useEffect, useCallback } from 'react';

const BattleArena = ({ 
  onComplete, 
  onScore, 
  challengeScore, 
  sendGameResult,
  onGameStateUpdate,
  savedGameState,
  clearSavedState
}) => {
  // Enemy types with different difficulty levels
  const enemies = [
    { name: "Slime", health: 50, maxHealth: 50, attack: 10, defense: 2, difficulty: "Basic", points: 100, color: "#8bc34a" },
    { name: "Goblin", health: 80, maxHealth: 80, attack: 15, defense: 5, difficulty: "Basic", points: 150, color: "#cddc39" },
    { name: "Orc", health: 120, maxHealth: 120, attack: 20, defense: 8, difficulty: "Intermediate", points: 200, color: "#ff9800" },
    { name: "Troll", health: 150, maxHealth: 150, attack: 25, defense: 10, difficulty: "Intermediate", points: 250, color: "#f44336" },
    { name: "Dark Knight", health: 200, maxHealth: 200, attack: 30, defense: 15, difficulty: "Advanced", points: 350, color: "#9c27b0" },
    { name: "Dragon", health: 300, maxHealth: 300, attack: 40, defense: 20, difficulty: "Advanced", points: 500, color: "#e91e63" },
    { name: "Math Wizard", health: 250, maxHealth: 250, attack: 35, defense: 18, difficulty: "Expert", points: 450, color: "#3f51b5" },
    { name: "Equation Lord", health: 400, maxHealth: 400, attack: 50, defense: 25, difficulty: "Boss", points: 800, color: "#d32f2f" }
  ];

  // ✅ FIXED: Proper equation solver
  const solveEquation = (equation) => {
    try {
      equation = equation.replace(/\s/g, '');
      const sides = equation.split('=');
      if (sides.length !== 2) return null;
      
      let left = sides[0];
      let right = sides[1];
      
      while (left.includes('(') || right.includes('(')) {
        const expandParentheses = (expr) => {
          const match = expr.match(/(\d*)\(([^)]+)\)/);
          if (match) {
            const multiplier = match[1] === '' ? 1 : parseInt(match[1]);
            const inner = match[2];
            const terms = inner.split(/([+-])/);
            let expanded = '';
            let currentSign = '+';
            
            for (let i = 0; i < terms.length; i++) {
              const term = terms[i];
              if (term === '+' || term === '-') {
                currentSign = term;
              } else if (term.trim()) {
                const multiplied = multiplier * parseInt(term) || term;
                expanded += `${currentSign}${multiplied}`;
              }
            }
            return expr.replace(match[0], expanded.replace(/^\+/, ''));
          }
          return expr;
        };
        
        left = expandParentheses(left);
        right = expandParentheses(right);
      }
      
      let leftCoeff = 0;
      let rightConst = 0;
      
      const leftTerms = left.split(/([+-])/);
      let currentSign = '+';
      for (let i = 0; i < leftTerms.length; i++) {
        const term = leftTerms[i];
        if (term === '+' || term === '-') {
          currentSign = term;
        } else if (term && term !== '') {
          const sign = currentSign === '+' ? 1 : -1;
          if (term.includes('x')) {
            const coeff = term === 'x' ? 1 : parseInt(term.replace('x', '')) || 1;
            leftCoeff += sign * coeff;
          } else {
            rightConst -= sign * parseInt(term);
          }
        }
      }
      
      const rightTerms = right.split(/([+-])/);
      currentSign = '+';
      for (let i = 0; i < rightTerms.length; i++) {
        const term = rightTerms[i];
        if (term === '+' || term === '-') {
          currentSign = term;
        } else if (term && term !== '') {
          const sign = currentSign === '+' ? 1 : -1;
          if (term.includes('x')) {
            const coeff = term === 'x' ? 1 : parseInt(term.replace('x', '')) || 1;
            leftCoeff -= sign * coeff;
          } else {
            rightConst += sign * parseInt(term);
          }
        }
      }
      
      if (leftCoeff === 0) return null;
      const answer = rightConst / leftCoeff;
      return Math.round(answer * 10) / 10;
      
    } catch (error) {
      console.error('Error solving equation:', error);
      return null;
    }
  };
  
  // ✅ FIXED: Reliable equation generator
  const generateEquation = (difficulty) => {
    const generateBasic = () => {
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 20) + 1;
      const c = a * Math.floor(Math.random() * 10) + b + Math.floor(Math.random() * 10);
      return `${a}x + ${b} = ${c}`;
    };
    
    const generateIntermediate = () => {
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 15) + 5;
      const c = Math.floor(Math.random() * 40) + 20;
      return `${a}x + ${b} = ${c}`;
    };
    
    const generateAdvanced = () => {
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 10) + 3;
      const c = Math.floor(Math.random() * 4) + 2;
      const d = Math.floor(Math.random() * 20) + 10;
      return `${a}x + ${b} = ${c}x + ${d}`;
    };
    
    const generateExpert = () => {
      const a = Math.floor(Math.random() * 10) + 5;
      const b = Math.floor(Math.random() * 5) + 2;
      const c = Math.floor(Math.random() * 50) + 30;
      return `${a}(x + ${b}) = ${c}`;
    };
    
    const generateBoss = () => {
      const a = Math.floor(Math.random() * 15) + 8;
      const b = Math.floor(Math.random() * 25) + 10;
      const c = Math.floor(Math.random() * 10) + 5;
      const d = Math.floor(Math.random() * 40) + 20;
      return `${a}x + ${b} = ${c}x + ${d}`;
    };
    
    let equation;
    switch(difficulty) {
      case 'Basic':
        equation = generateBasic();
        break;
      case 'Intermediate':
        equation = generateIntermediate();
        break;
      case 'Advanced':
        equation = generateAdvanced();
        break;
      case 'Expert':
        equation = generateExpert();
        break;
      case 'Boss':
        equation = generateBoss();
        break;
      default:
        equation = generateBasic();
    }
    
    const answer = solveEquation(equation);
    
    if (answer === null || isNaN(answer)) {
      const x = Math.floor(Math.random() * 20) + 1;
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 20) + 1;
      equation = `${a}x + ${b} = ${a * x + b}`;
      return { equation, answer: x };
    }
    
    return { equation, answer };
  };

  // Game state
  const [currentEnemyIndex, setCurrentEnemyIndex] = useState(() => {
    if (savedGameState && savedGameState.currentEnemyIndex !== undefined) {
      return savedGameState.currentEnemyIndex;
    }
    return 0;
  });
  
  const [enemyHealth, setEnemyHealth] = useState(() => {
    if (savedGameState && savedGameState.enemyHealth !== undefined) {
      return savedGameState.enemyHealth;
    }
    return enemies[0].health;
  });
  
  const [playerHealth, setPlayerHealth] = useState(() => {
    if (savedGameState && savedGameState.playerHealth !== undefined) {
      return savedGameState.playerHealth;
    }
    return 200;
  });
  
  const [score, setScore] = useState(() => {
    if (savedGameState && savedGameState.challengeScore !== undefined) {
      return savedGameState.challengeScore;
    }
    return challengeScore || 0;
  });
  
  const [currentEquation, setCurrentEquation] = useState(() => {
    if (savedGameState && savedGameState.currentEquation) {
      return savedGameState.currentEquation;
    }
    const enemy = enemies[currentEnemyIndex];
    const { equation, answer } = generateEquation(enemy.difficulty);
    return { equation, answer, userAnswer: '' };
  });
  
  const [feedback, setFeedback] = useState(() => {
    if (savedGameState && savedGameState.feedback) {
      return savedGameState.feedback;
    }
    return '';
  });
  
  const [gameActive, setGameActive] = useState(() => {
    if (savedGameState && savedGameState.gameActive !== undefined) {
      return savedGameState.gameActive;
    }
    return true;
  });
  
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [attacksCount, setAttacksCount] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [defenseMode, setDefenseMode] = useState(false);
  const [powerUps, setPowerUps] = useState(() => {
    if (savedGameState && savedGameState.powerUps !== undefined) {
      return savedGameState.powerUps;
    }
    return { heal: 2, doubleDamage: 1, shield: 1 };
  });

  const currentEnemy = enemies[currentEnemyIndex];
  const isBoss = currentEnemy.difficulty === 'Boss';
  const isLastEnemy = currentEnemyIndex === enemies.length - 1;

  // Save game state
  useEffect(() => {
    if (onGameStateUpdate && gameActive && !showCongratulations) {
      onGameStateUpdate({
        currentEnemyIndex,
        enemyHealth,
        playerHealth,
        challengeScore: score,
        currentEquation,
        feedback,
        gameActive,
        powerUps,
        attacksCount,
        correctAnswers,
        defenseMode
      });
    }
  }, [currentEnemyIndex, enemyHealth, playerHealth, score, currentEquation, feedback, gameActive, powerUps, attacksCount, correctAnswers, defenseMode, onGameStateUpdate]);

  // ✅ Send real-time score updates to parent
  useEffect(() => {
    if (window.parent !== window) {
      const scoreUpdate = {
        type: 'SCORE_UPDATE',
        gameId: 'battle',
        score: score,
        stats: {
          currentEnemy: currentEnemyIndex,
          playerHealth: playerHealth,
          enemyHealth: enemyHealth,
          attacksMade: attacksCount,
          correctAnswers: correctAnswers,
          accuracy: attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0
        }
      };
      window.parent.postMessage(scoreUpdate, '*');
      console.log('Sent score update to parent:', score);
    }
  }, [score, currentEnemyIndex, playerHealth, enemyHealth, attacksCount, correctAnswers]);

  // ✅ Handle messages from parent
  useEffect(() => {
    const handleMessage = (event) => {
      console.log('BattleArena received message:', event.data);
      
      if (event.data && event.data.type === 'REQUEST_SCORE') {
        const scoreUpdate = {
          type: 'SCORE_UPDATE',
          gameId: 'battle',
          score: score,
          stats: {
            currentEnemy: currentEnemyIndex,
            playerHealth: playerHealth,
            enemyHealth: enemyHealth,
            attacksMade: attacksCount,
            correctAnswers: correctAnswers,
            accuracy: attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0
          }
        };
        window.parent.postMessage(scoreUpdate, '*');
        console.log('Sent score response to parent:', score);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [score, currentEnemyIndex, playerHealth, enemyHealth, attacksCount, correctAnswers]);

  // Send game result
  const sendResultToParent = useCallback((completed, finalScore) => {
    const totalEnemies = enemies.length;
    const accuracy = attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0;
    
    const gameResult = {
      type: 'GAME_RESULT',
      gameId: 'battle',
      completed: completed,
      score: finalScore,
      timeSpent: 0,
      stats: {
        finalScore: finalScore,
        totalEnemies: totalEnemies,
        enemiesDefeated: currentEnemyIndex + (completed ? 1 : 0),
        accuracy: accuracy,
        attacksMade: attacksCount,
        correctAnswers: correctAnswers,
        powerUpsUsed: {
          heals: 2 - powerUps.heal,
          doubleDamage: 1 - powerUps.doubleDamage,
          shield: 1 - powerUps.shield
        }
      }
    };

    console.log('=== SENDING BATTLE GAME RESULT ===');
    console.log('Final Score:', finalScore);
    console.log('Completed:', completed);
    
    if (window.parent !== window) {
      window.parent.postMessage(gameResult, '*');
      console.log('Sent to parent window');
    }
    
    if (window.opener) {
      window.opener.postMessage(gameResult, '*');
      console.log('Sent to opener');
    }
    
    if (sendGameResult) {
      sendGameResult(completed, finalScore, 0, currentEnemyIndex + (completed ? 1 : 0), gameResult.stats);
      console.log('Called sendGameResult prop');
    }
  }, [enemies.length, currentEnemyIndex, attacksCount, correctAnswers, powerUps, sendGameResult]);

  // Save progress to localStorage
  const saveProgressToLocalStorage = useCallback((completed, finalScore) => {
    try {
      console.log('=== SAVING BATTLE PROGRESS ===');
      console.log('Final Score:', finalScore);
      console.log('Completed:', completed);
      
      const existingProgress = localStorage.getItem('gameProgress');
      let progress = existingProgress ? JSON.parse(existingProgress) : {
        equation: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 },
        battle: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 },
        spaceShooter: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 }
      };
      
      const currentBattle = progress.battle || {
        completed: false,
        highScore: 0,
        attempts: 0,
        bestTime: null,
        lastPlayed: null,
        lastScore: 0
      };
      
      const newHighScore = Math.max(currentBattle.highScore || 0, finalScore || 0);
      const newAttempts = (currentBattle.attempts || 0) + 1;
      
      progress.battle = {
        ...currentBattle,
        completed: completed || currentBattle.completed,
        highScore: newHighScore,
        lastScore: finalScore,
        attempts: newAttempts,
        bestTime: currentBattle.bestTime,
        lastPlayed: new Date().toISOString(),
        lastGameStats: {
          enemiesDefeated: currentEnemyIndex + (completed ? 1 : 0),
          totalEnemies: enemies.length,
          finalScore: finalScore,
          accuracy: attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0
        }
      };
      
      localStorage.setItem('gameProgress', JSON.stringify(progress));
      console.log('Battle progress saved to localStorage:', progress.battle);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [enemies.length, currentEnemyIndex, attacksCount, correctAnswers]);

  const usePowerUp = (type) => {
    if (powerUps[type] > 0) {
      setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
      
      switch(type) {
        case 'heal':
          setPlayerHealth(prev => Math.min(prev + 50, 200));
          setFeedback("💚 You used a healing potion! +50 HP");
          break;
        case 'doubleDamage':
          setDefenseMode(false);
          setFeedback("⚡ Double damage activated! Your next attack will deal 2x damage!");
          break;
        case 'shield':
          setDefenseMode(true);
          setFeedback("🛡️ Shield activated! Next enemy attack will be reduced by 50%!");
          break;
        default:
          break;
      }
    } else {
      setFeedback(`No ${type} power-ups left!`);
    }
  };

  const handleAttack = () => {
    if (!gameActive) return;
    
    const userAnswer = parseFloat(currentEquation.userAnswer);
    
    if (isNaN(userAnswer)) {
      setFeedback("⚠️ Please enter a valid answer!");
      return;
    }
    
    const isCorrect = Math.abs(userAnswer - currentEquation.answer) < 0.01;
    setAttacksCount(prev => prev + 1);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      
      let damage = currentEnemy.attack;
      const doubleDamageActive = powerUps.doubleDamage === 0;
      
      if (doubleDamageActive) {
        damage *= 2;
        setFeedback(`🔥 CRITICAL HIT! ${damage} damage!`);
        setPowerUps(prev => ({ ...prev, doubleDamage: 1 }));
      } else {
        setFeedback(`⚔️ You hit the ${currentEnemy.name} for ${damage} damage!`);
      }
      
      const newEnemyHealth = Math.max(0, enemyHealth - damage);
      setEnemyHealth(newEnemyHealth);
      
      const pointsEarned = currentEnemy.points * (doubleDamageActive ? 2 : 1);
      const newScore = score + pointsEarned;
      setScore(newScore);
      if (onScore) onScore(newScore);
      
      if (newEnemyHealth <= 0) {
        setFeedback(`🎉 Victory! You defeated the ${currentEnemy.name}! +${pointsEarned} points!`);
        
        if (isLastEnemy) {
          setGameActive(false);
          setShowCongratulations(true);
          
          const finalScore = newScore;
          saveProgressToLocalStorage(true, finalScore);
          sendResultToParent(true, finalScore);
          
          if (onComplete) onComplete(true);
          if (clearSavedState) clearSavedState();
        } else {
          setTimeout(() => {
            const nextIndex = currentEnemyIndex + 1;
            setCurrentEnemyIndex(nextIndex);
            setEnemyHealth(enemies[nextIndex].health);
            
            const { equation, answer } = generateEquation(enemies[nextIndex].difficulty);
            setCurrentEquation({ equation, answer, userAnswer: '' });
            setFeedback(`New enemy appears: ${enemies[nextIndex].name}!`);
          }, 1500);
        }
      } else {
        setTimeout(() => {
          let enemyDamage = Math.max(5, currentEnemy.attack - currentEnemy.defense);
          
          if (defenseMode) {
            enemyDamage = Math.floor(enemyDamage / 2);
            setFeedback(`🛡️ Shield reduced damage to ${enemyDamage}!`);
            setDefenseMode(false);
          }
          
          const newPlayerHealth = Math.max(0, playerHealth - enemyDamage);
          setPlayerHealth(newPlayerHealth);
          
          setFeedback(prev => prev + `\n💔 ${currentEnemy.name} counter-attacks for ${enemyDamage} damage!`);
          
          if (newPlayerHealth <= 0) {
            setGameActive(false);
            setFeedback("💀 Game Over! You have been defeated!");
            saveProgressToLocalStorage(false, score);
            sendResultToParent(false, score);
            if (onComplete) onComplete(false);
          }
        }, 500);
        
        const { equation, answer } = generateEquation(currentEnemy.difficulty);
        setCurrentEquation({ equation, answer, userAnswer: '' });
      }
    } else {
      setFeedback(`❌ Incorrect! The correct answer was ${currentEquation.answer}. The enemy counter-attacks!`);
      
      let enemyDamage = Math.max(8, currentEnemy.attack);
      if (defenseMode) {
        enemyDamage = Math.floor(enemyDamage / 2);
        setDefenseMode(false);
      }
      
      const newPlayerHealth = Math.max(0, playerHealth - enemyDamage);
      setPlayerHealth(newPlayerHealth);
      
      if (newPlayerHealth <= 0) {
        setGameActive(false);
        setFeedback("💀 Game Over! You have been defeated!");
        saveProgressToLocalStorage(false, score);
        sendResultToParent(false, score);
        if (onComplete) onComplete(false);
      }
      
      setCurrentEquation(prev => ({ ...prev, userAnswer: '' }));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleAttack();
  };

  const getHealthBarColor = (health, maxHealth) => {
    const percentage = (health / maxHealth) * 100;
    if (percentage > 60) return '#4caf50';
    if (percentage > 30) return '#ff9800';
    return '#f44336';
  };

  if (showCongratulations) {
    return (
      <div style={styles.completionContainer}>
        <div style={styles.completionCard}>
          <div style={styles.trophyIcon}>🏆</div>
          <h2 style={styles.completionTitle}>Victory!</h2>
          <p style={styles.completionText}>You have conquered all enemies in the Math Battle Arena!</p>
          <div style={styles.finalScore}>
            <div>Final Score: {score}</div>
            <div>Enemies Defeated: {enemies.length}/{enemies.length}</div>
            <div>Attacks Made: {attacksCount}</div>
            <div>Accuracy: {attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0}%</div>
          </div>
          <button onClick={() => onComplete && onComplete(true)} style={styles.continueButton}>
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  if (!gameActive) {
    return (
      <div style={styles.completionContainer}>
        <div style={styles.completionCard}>
          <div style={styles.sadIcon}>💀</div>
          <h2 style={styles.completionTitle}>Game Over</h2>
          <p style={styles.completionText}>You were defeated in battle. Try again!</p>
          <div style={styles.finalScore}>
            <div>Final Score: {score}</div>
            <div>Enemies Defeated: {currentEnemyIndex}/{enemies.length}</div>
            <div>Accuracy: {attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0}%</div>
          </div>
          <button onClick={() => {
            clearSavedState?.();
            onComplete && onComplete(false);
          }} style={styles.continueButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const playerHealthPercent = (playerHealth / 200) * 100;
  const enemyHealthPercent = (enemyHealth / currentEnemy.maxHealth) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.scoreDisplay}>⭐ Score: {score}</div>
        <div style={styles.enemyCount}>
          Enemy: {currentEnemyIndex + 1} / {enemies.length}
          {isBoss && <span style={styles.bossBadge}>BOSS</span>}
        </div>
      </div>

      <div style={styles.battleArena}>
        <div style={styles.enemySection}>
          <div style={{...styles.enemyCard, backgroundColor: currentEnemy.color}}>
            <div style={styles.enemyName}>{currentEnemy.name}</div>
            <div style={styles.enemyDifficulty}>{currentEnemy.difficulty}</div>
            <div style={styles.healthBarContainer}>
              <div style={styles.healthBarLabel}>Health: {enemyHealth}/{currentEnemy.maxHealth}</div>
              <div style={styles.healthBar}>
                <div style={{
                  ...styles.healthFill,
                  width: `${enemyHealthPercent}%`,
                  backgroundColor: getHealthBarColor(enemyHealth, currentEnemy.maxHealth)
                }} />
              </div>
            </div>
          </div>
        </div>

        <div style={styles.vsDivider}>⚔️ VS ⚔️</div>

        <div style={styles.playerSection}>
          <div style={styles.playerCard}>
            <div style={styles.playerName}>You</div>
            <div style={styles.healthBarContainer}>
              <div style={styles.healthBarLabel}>Health: {playerHealth}/200</div>
              <div style={styles.healthBar}>
                <div style={{
                  ...styles.healthFill,
                  width: `${playerHealthPercent}%`,
                  backgroundColor: getHealthBarColor(playerHealth, 200)
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.mathChallenge}>
        <div style={styles.equationBox}>
          <div style={styles.equationText}>{currentEquation.equation}</div>
          <div style={styles.inputArea}>
            <input
              type="number"
              step="0.1"
              value={currentEquation.userAnswer}
              onChange={(e) => setCurrentEquation(prev => ({ ...prev, userAnswer: e.target.value }))}
              onKeyPress={handleKeyPress}
              placeholder="Enter your answer..."
              style={styles.answerInput}
              autoFocus
            />
            <button onClick={handleAttack} style={styles.attackButton}>
              ⚔️ ATTACK!
            </button>
          </div>
          {feedback && <div style={styles.feedback}>{feedback}</div>}
        </div>
      </div>

      <div style={styles.powerUpsSection}>
        <h3 style={styles.powerUpsTitle}>💪 POWER-UPS</h3>
        <div style={styles.powerUpsContainer}>
          <button 
            onClick={() => usePowerUp('heal')} 
            style={{...styles.powerUpButton, backgroundColor: '#4caf50'}}
            disabled={powerUps.heal === 0}
          >
            💚 Heal (+50 HP) {powerUps.heal > 0 ? `(${powerUps.heal})` : '(Used)'}
          </button>
          <button 
            onClick={() => usePowerUp('doubleDamage')} 
            style={{...styles.powerUpButton, backgroundColor: '#ff9800'}}
            disabled={powerUps.doubleDamage === 0}
          >
            ⚡ Double Damage {powerUps.doubleDamage > 0 ? `(${powerUps.doubleDamage})` : '(Used)'}
          </button>
          <button 
            onClick={() => usePowerUp('shield')} 
            style={{...styles.powerUpButton, backgroundColor: '#2196f3'}}
            disabled={powerUps.shield === 0}
          >
            🛡️ Shield (50% reduction) {powerUps.shield > 0 ? `(${powerUps.shield})` : '(Used)'}
          </button>
        </div>
      </div>
      
      <div style={styles.statsDisplay}>
        <div>⚔️ Attacks: {attacksCount}</div>
        <div>✅ Correct: {correctAnswers}</div>
        <div>📊 Accuracy: {attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0}%</div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    width: '95%',
    margin: '20px auto',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    marginBottom: '20px',
    backdropFilter: 'blur(10px)',
  },
  scoreDisplay: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffd700',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  enemyCount: {
    fontSize: '16px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  bossBadge: {
    backgroundColor: '#f44336',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  battleArena: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: '20px',
    marginBottom: '30px',
    alignItems: 'center',
  },
  enemySection: {
    textAlign: 'center',
  },
  enemyCard: {
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
    transition: 'transform 0.3s ease',
  },
  enemyName: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  enemyDifficulty: {
    fontSize: '14px',
    marginBottom: '15px',
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  playerSection: {
    textAlign: 'center',
  },
  playerCard: {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
  },
  playerName: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '15px',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  vsDivider: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#ffd700',
    textShadow: '0 0 10px rgba(255,215,0,0.5)',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  healthBarContainer: {
    width: '100%',
  },
  healthBarLabel: {
    fontSize: '14px',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  healthBar: {
    width: '100%',
    height: '25px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
  },
  healthFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#fff',
  },
  mathChallenge: {
    marginBottom: '30px',
  },
  equationBox: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    backdropFilter: 'blur(10px)',
    padding: '30px',
    borderRadius: '16px',
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  equationText: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '25px',
    fontFamily: 'monospace',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    letterSpacing: '2px',
  },
  inputArea: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  answerInput: {
    flex: 2,
    maxWidth: '300px',
    padding: '15px 20px',
    fontSize: '18px',
    border: '2px solid #ffd700',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.95)',
    color: '#333',
    outline: 'none',
    textAlign: 'center',
    fontWeight: 'bold',
    transition: 'all 0.3s',
  },
  attackButton: {
    padding: '15px 40px',
    fontSize: '18px',
    backgroundColor: '#ff4757',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  feedback: {
    marginTop: '20px',
    padding: '12px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#ffd700',
    whiteSpace: 'pre-line',
    fontWeight: 'bold',
  },
  powerUpsSection: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '15px',
    backdropFilter: 'blur(10px)',
  },
  powerUpsTitle: {
    fontSize: '18px',
    marginBottom: '15px',
    color: '#ffd700',
    textAlign: 'center',
  },
  powerUpsContainer: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  powerUpButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statsDisplay: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 20px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    backdropFilter: 'blur(10px)',
  },
  completionContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '500px',
    padding: '20px',
  },
  completionCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '450px',
    width: '90%',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
  },
  trophyIcon: {
    fontSize: '80px',
    marginBottom: '20px',
    animation: 'bounce 0.5s ease',
  },
  sadIcon: {
    fontSize: '80px',
    marginBottom: '20px',
  },
  completionTitle: {
    fontSize: '36px',
    marginBottom: '15px',
    color: '#ffd700',
  },
  completionText: {
    fontSize: '16px',
    marginBottom: '20px',
    color: '#fff',
  },
  finalScore: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: '14px',
    lineHeight: '1.8',
    color: '#fff',
  },
  continueButton: {
    padding: '12px 30px',
    fontSize: '16px',
    backgroundColor: '#ffd700',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s',
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.9;
    }
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }
  
  .attack-button:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
  }
  
  .attack-button:active {
    transform: scale(0.95);
  }
  
  .answer-input:focus {
    border-color: #ff4757;
    box-shadow: 0 0 10px rgba(255,71,87,0.5);
  }
  
  button {
    transition: all 0.2s ease;
  }
  
  button:hover {
    transform: scale(1.02);
  }
  
  button:active {
    transform: scale(0.98);
  }
`;
document.head.appendChild(styleSheet);

export default BattleArena;