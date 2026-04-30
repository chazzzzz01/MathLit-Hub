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

  // 10 Math Concept Questions (replaces equation-solving)
  const conceptQuestions = [
    { question: "Why does slope formula compare 'change in y' over 'change in x'?", options: ["To confuse students", "To measure rate of change", "To find intercept", "To avoid graphing"], correct: 1, explanation: "Slope measures rate of change: how y changes per unit of x." },
    { question: "A salary increases steadily every year. What does this imply?", options: ["Nonlinear graph", "Linear graph", "Circular graph", "No graph"], correct: 1, explanation: "Steady increase means constant rate of change → linear graph." },
    { question: "Two workers earn money at the same rate but start with different savings. What will their graphs look like?", options: ["Intersecting", "Parallel", "Same line", "Perpendicular"], correct: 1, explanation: "Same rate = same slope, different savings = different y-intercepts → parallel lines." },
    { question: "Which situation represents y = 4x − 8?", options: ["Starts at −8, increases by 4", "Starts at 8, decreases by 4", "Starts at 4, increases by 8", "Starts at 0, increases by 4"], correct: 0, explanation: "y = mx + b: m=4 (increase by 4), b=-8 (starts at -8)." },
    { question: "Why is it important to interpret equations in real life?", options: ["To memorize formulas", "To connect math to real situations", "To avoid solving", "To make equations longer"], correct: 1, explanation: "Interpreting equations helps apply math to practical scenarios." },
    { question: "Which describes x/5 + y/10 = 1?", options: ["Intercepts at (5,0) and (0,10)", "Slope 5", "No intercept", "Vertical line"], correct: 0, explanation: "Set y=0 → x/5=1 → x=5. Set x=0 → y/10=1 → y=10." },
    { question: "What does the x-intercept represent in real life?", options: ["Starting value", "When output becomes zero", "Rate of change", "Maximum slope"], correct: 1, explanation: "x-intercept is where y=0, often the 'break-even' or 'zero' point." },
    { question: "Why is graphing useful?", options: ["It replaces equations", "It visualizes relationships", "It removes variables", "It simplifies nothing"], correct: 1, explanation: "Graphs make relationships visible and easier to understand." },
    { question: "Which real-life situation could produce a negative slope?", options: ["Saving money", "Spending money over time", "Growing plants", "Increasing population"], correct: 1, explanation: "Spending money decreases your balance over time → negative slope." },
    { question: "A student says: 'All linear equations are useful in real life.' Which best justifies this?", options: ["They are easy", "They model constant change", "They use x and y", "They are straight"], correct: 1, explanation: "Linear equations model many real-life situations involving constant rates." }
  ];

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
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [defenseMode, setDefenseMode] = useState(false);
  const [powerUps, setPowerUps] = useState(() => {
    if (savedGameState && savedGameState.powerUps !== undefined) {
      return savedGameState.powerUps;
    }
    return { heal: 2, doubleDamage: 1, shield: 1 };
  });

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    if (savedGameState && savedGameState.currentQuestionIndex !== undefined) {
      return savedGameState.currentQuestionIndex;
    }
    return 0;
  });
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);

  const currentEnemy = enemies[currentEnemyIndex];
  const isBoss = currentEnemy.difficulty === 'Boss';
  const isLastEnemy = currentEnemyIndex === enemies.length - 1;
  const currentQuestion = conceptQuestions[currentQuestionIndex];

  // Save game state
  useEffect(() => {
    if (onGameStateUpdate && gameActive && !showCongratulations && !quizCompleted) {
      onGameStateUpdate({
        currentEnemyIndex,
        enemyHealth,
        playerHealth,
        challengeScore: score,
        feedback,
        gameActive,
        powerUps,
        attacksCount,
        correctAnswers,
        wrongAnswers,
        defenseMode,
        currentQuestionIndex,
        selectedOption,
        showExplanation,
        quizCompleted,
        waitingForNext
      });
    }
  }, [currentEnemyIndex, enemyHealth, playerHealth, score, feedback, gameActive, powerUps, attacksCount, correctAnswers, wrongAnswers, defenseMode, onGameStateUpdate, currentQuestionIndex, selectedOption, showExplanation, quizCompleted, waitingForNext]);

  // Send real-time score updates to parent
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
          wrongAnswers: wrongAnswers,
          accuracy: attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0
        }
      };
      window.parent.postMessage(scoreUpdate, '*');
      console.log('Sent score update to parent:', score);
    }
  }, [score, currentEnemyIndex, playerHealth, enemyHealth, attacksCount, correctAnswers, wrongAnswers]);

  // Handle messages from parent
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
            wrongAnswers: wrongAnswers,
            accuracy: attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0
          }
        };
        window.parent.postMessage(scoreUpdate, '*');
        console.log('Sent score response to parent:', score);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [score, currentEnemyIndex, playerHealth, enemyHealth, attacksCount, correctAnswers, wrongAnswers]);

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
        wrongAnswers: wrongAnswers,
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
    console.log('Correct Answers:', correctAnswers);
    console.log('Wrong Answers:', wrongAnswers);
    
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
  }, [enemies.length, currentEnemyIndex, attacksCount, correctAnswers, wrongAnswers, powerUps, sendGameResult]);

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
          accuracy: attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0,
          correctAnswers: correctAnswers,
          wrongAnswers: wrongAnswers
        }
      };
      
      localStorage.setItem('gameProgress', JSON.stringify(progress));
      console.log('Battle progress saved to localStorage:', progress.battle);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [enemies.length, currentEnemyIndex, attacksCount, correctAnswers, wrongAnswers]);

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

  // Handle quiz answer - CORRECT = ATTACK, WRONG = ENEMY ATTACKS
  const handleQuizAnswer = (optionIndex) => {
    if (selectedOption !== null || waitingForNext) return;
    
    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correct;
    
    // Send XP update
    if (window.parent !== window) {
      const xpUpdate = {
        type: 'XP_UPDATE',
        gameId: 'battle',
        xpChange: isCorrect ? 15 : -5,
        isCorrect: isCorrect,
        correctAnswer: currentQuestion.options[currentQuestion.correct],
        userAnswer: currentQuestion.options[optionIndex],
        question: currentQuestion.question,
        timestamp: new Date().toISOString()
      };
      window.parent.postMessage(xpUpdate, '*');
      console.log('Sent XP_UPDATE from Quiz Attack:', xpUpdate);
    }
    
    setAttacksCount(prev => prev + 1);
    
    if (isCorrect) {
      // CORRECT ANSWER = PLAYER ATTACKS ENEMY
      setCorrectAnswers(prev => prev + 1);
      
      let damage = currentEnemy ? currentEnemy.attack : 25;
      const doubleDamageActive = powerUps.doubleDamage === 0;
      
      if (doubleDamageActive) {
        damage *= 2;
        setFeedback(`🔥 CORRECT! CRITICAL HIT! ${damage} damage to ${currentEnemy.name}! +15 XP! ${currentQuestion.explanation}`);
        setPowerUps(prev => ({ ...prev, doubleDamage: 1 }));
      } else {
        setFeedback(`✅ CORRECT! You hit ${currentEnemy.name} for ${damage} damage! +15 XP! ${currentQuestion.explanation}`);
      }
      
      const newEnemyHealth = Math.max(0, enemyHealth - damage);
      setEnemyHealth(newEnemyHealth);
      
      const pointsEarned = (currentEnemy ? currentEnemy.points : 100) * (doubleDamageActive ? 2 : 1);
      const newScore = score + pointsEarned;
      setScore(newScore);
      if (onScore) onScore(newScore);
      
      // Check if enemy is defeated
      if (newEnemyHealth <= 0) {
        setFeedback(prev => `${prev}\n\n🎉 Victory! You defeated the ${currentEnemy.name}! +${pointsEarned} points!`);
        
        if (isLastEnemy) {
          setGameActive(false);
          setShowCongratulations(true);
          const finalScore = newScore;
          saveProgressToLocalStorage(true, finalScore);
          sendResultToParent(true, finalScore);
          if (onComplete) onComplete(true);
          if (clearSavedState) clearSavedState();
        } else {
          setWaitingForNext(true);
          setTimeout(() => {
            const nextIndex = currentEnemyIndex + 1;
            setCurrentEnemyIndex(nextIndex);
            setEnemyHealth(enemies[nextIndex].health);
            // Reset question index for new enemy (or continue? Let's continue from where we left off)
            // Move to next question
            if (currentQuestionIndex + 1 < conceptQuestions.length) {
              setCurrentQuestionIndex(prev => prev + 1);
            }
            setSelectedOption(null);
            setShowExplanation(false);
            setFeedback(`New enemy appears: ${enemies[nextIndex].name}!`);
            setWaitingForNext(false);
          }, 2000);
          return;
        }
      }
      
      // Move to next question after correct answer (if enemy not defeated)
      setWaitingForNext(true);
      setTimeout(() => {
        if (currentQuestionIndex + 1 < conceptQuestions.length) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedOption(null);
          setShowExplanation(false);
          setWaitingForNext(false);
          setFeedback("");
        } else {
          // All questions answered but enemies remain? Loop or complete?
          // For now, show completion
          setQuizCompleted(true);
          const bonusPoints = 500;
          const finalScore = score + pointsEarned + bonusPoints;
          setScore(finalScore);
          if (onScore) onScore(finalScore);
          setFeedback(`🎉 Quiz Complete! You've mastered the concepts! +${bonusPoints} bonus points!`);
          setGameActive(false);
          setShowCongratulations(true);
          saveProgressToLocalStorage(true, finalScore);
          sendResultToParent(true, finalScore);
          if (onComplete) onComplete(true);
          if (clearSavedState) clearSavedState();
        }
      }, 2500);
      
    } else {
      // WRONG ANSWER = ENEMY ATTACKS PLAYER
      setWrongAnswers(prev => prev + 1);
      
      let enemyDamage = currentEnemy ? Math.max(8, currentEnemy.attack) : 20;
      if (defenseMode) {
        enemyDamage = Math.floor(enemyDamage / 2);
        setFeedback(`❌ INCORRECT! ${currentEnemy ? currentEnemy.name : "Enemy"} counter-attacks for ${enemyDamage} damage (reduced by shield)! -5 XP!`);
        setDefenseMode(false);
      } else {
        setFeedback(`❌ INCORRECT! The correct answer was: ${currentQuestion.options[currentQuestion.correct]}. -5 XP! ${currentEnemy ? currentEnemy.name : "Enemy"} deals ${enemyDamage} damage! ${currentQuestion.explanation}`);
      }
      
      const newPlayerHealth = Math.max(0, playerHealth - enemyDamage);
      setPlayerHealth(newPlayerHealth);
      
      if (newPlayerHealth <= 0) {
        setGameActive(false);
        setFeedback("💀 Game Over! You have been defeated!");
        saveProgressToLocalStorage(false, score);
        sendResultToParent(false, score);
        if (onComplete) onComplete(false);
        return;
      }
      
      // Move to next question after wrong answer
      setWaitingForNext(true);
      setTimeout(() => {
        if (currentQuestionIndex + 1 < conceptQuestions.length) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedOption(null);
          setShowExplanation(false);
          setWaitingForNext(false);
          setFeedback("");
        } else {
          // All questions answered but game still active? Loop the questions?
          // Reset question index to 0 to continue fighting
          setCurrentQuestionIndex(0);
          setSelectedOption(null);
          setShowExplanation(false);
          setWaitingForNext(false);
          setFeedback("📚 New set of questions! Keep fighting!");
        }
      }, 2500);
    }
    
    setShowExplanation(true);
  };

  const getHealthBarColor = (health, maxHealth) => {
    const percentage = (health / maxHealth) * 100;
    if (percentage > 60) return '#4caf50';
    if (percentage > 30) return '#ff9800';
    return '#f44336';
  };

  if (showCongratulations) {
    const xpEarned = (correctAnswers * 15) - (wrongAnswers * 5);
    const bonusCompletionXP = quizCompleted ? 150 : 100;
    const totalXP = xpEarned + bonusCompletionXP;
    
    return (
      <div style={styles.completionContainer}>
        <div style={styles.completionCard}>
          <div style={styles.trophyIcon}>🏆</div>
          <h2 style={styles.completionTitle}>{quizCompleted ? "Quiz Master!" : "Victory!"}</h2>
          <p style={styles.completionText}>
            {quizCompleted 
              ? "You have mastered all math concepts! Outstanding!" 
              : "You have conquered all enemies in the Math Battle Arena!"}
          </p>
          <div style={styles.finalScore}>
            <div>Final Score: {score}</div>
            <div>{quizCompleted ? "Questions Answered: " : "Enemies Defeated: "}{quizCompleted ? conceptQuestions.length : enemies.length}/{quizCompleted ? conceptQuestions.length : enemies.length}</div>
            <div>Attacks Made: {attacksCount}</div>
            <div>✅ Correct Answers: {correctAnswers} (+{correctAnswers * 15} XP)</div>
            <div>❌ Wrong Answers: {wrongAnswers} (-{wrongAnswers * 5} XP)</div>
            <div>📊 Accuracy: {attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0}%</div>
            <div>⭐ XP Earned: {xpEarned}</div>
            <div>🎉 Completion Bonus: +{bonusCompletionXP} XP</div>
            <div style={{marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '8px', fontWeight: 'bold', color: '#ffd700'}}>
              Total XP: {totalXP}
            </div>
          </div>
          <button onClick={() => onComplete && onComplete(true)} style={styles.continueButton}>
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  if (!gameActive && !showCongratulations) {
    const xpEarned = (correctAnswers * 15) - (wrongAnswers * 5);
    return (
      <div style={styles.completionContainer}>
        <div style={styles.completionCard}>
          <div style={styles.sadIcon}>💀</div>
          <h2 style={styles.completionTitle}>Game Over</h2>
          <p style={styles.completionText}>You were defeated in battle. Try again!</p>
          <div style={styles.finalScore}>
            <div>Final Score: {score}</div>
            <div>Enemies Defeated: {currentEnemyIndex}/{enemies.length}</div>
            <div>✅ Correct Answers: {correctAnswers} (+{correctAnswers * 15} XP)</div>
            <div>❌ Wrong Answers: {wrongAnswers} (-{wrongAnswers * 5} XP)</div>
            <div>📊 Accuracy: {attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0}%</div>
            <div>⭐ XP Earned: {xpEarned}</div>
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

  // Main Game UI (Quiz Attack Mode - replacing equation solver)
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

        <div style={styles.vsDivider}>❓ QUIZ ❓</div>

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
          <div style={styles.equationText}>{currentQuestion.question}</div>
          <div style={styles.optionsGrid}>
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleQuizAnswer(idx)}
                disabled={selectedOption !== null || waitingForNext}
                style={{
                  ...styles.optionButton,
                  backgroundColor: selectedOption === idx 
                    ? (idx === currentQuestion.correct ? '#4caf50' : '#f44336')
                    : (selectedOption !== null && idx === currentQuestion.correct ? '#4caf50' : 'rgba(255,255,255,0.15)'),
                  cursor: (selectedOption !== null || waitingForNext) ? 'default' : 'pointer',
                  opacity: (selectedOption !== null || waitingForNext) && idx !== currentQuestion.correct && idx !== selectedOption ? 0.6 : 1
                }}
              >
                {String.fromCharCode(65 + idx)}. {option}
                {selectedOption === idx && (idx === currentQuestion.correct ? " ✓" : " ✗")}
              </button>
            ))}
          </div>
          {waitingForNext && (
            <div style={styles.waitingMessage}>
              ⏳ Moving to next...
            </div>
          )}
          {feedback && <div style={styles.feedback}>{feedback}</div>}
        </div>
      </div>

      <div style={styles.powerUpsSection}>
        <h3 style={styles.powerUpsTitle}>💪 POWER-UPS</h3>
        <div style={styles.powerUpsContainer}>
          <button 
            onClick={() => usePowerUp('heal')} 
            style={{...styles.powerUpButton, backgroundColor: '#4caf50'}}
            disabled={powerUps.heal === 0 || waitingForNext}
          >
            💚 Heal (+50 HP) {powerUps.heal > 0 ? `(${powerUps.heal})` : '(Used)'}
          </button>
          <button 
            onClick={() => usePowerUp('doubleDamage')} 
            style={{...styles.powerUpButton, backgroundColor: '#ff9800'}}
            disabled={powerUps.doubleDamage === 0 || waitingForNext}
          >
            ⚡ Double Damage {powerUps.doubleDamage > 0 ? `(${powerUps.doubleDamage})` : '(Used)'}
          </button>
          <button 
            onClick={() => usePowerUp('shield')} 
            style={{...styles.powerUpButton, backgroundColor: '#2196f3'}}
            disabled={powerUps.shield === 0 || waitingForNext}
          >
            🛡️ Shield (50% reduction) {powerUps.shield > 0 ? `(${powerUps.shield})` : '(Used)'}
          </button>
        </div>
      </div>
      
      <div style={styles.statsDisplay}>
        <div>❓ Questions: {currentQuestionIndex + 1}/{conceptQuestions.length}</div>
        <div>✅ Correct: {correctAnswers} (+{correctAnswers * 15} XP)</div>
        <div>❌ Wrong: {wrongAnswers} (-{wrongAnswers * 5} XP)</div>
        <div>📊 Accuracy: {attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0}%</div>
        <div>⭐ Total XP: {(correctAnswers * 15) - (wrongAnswers * 5)}</div>
        <div>⚔️ Attacks: {attacksCount}</div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    width: '95%',
    margin: '20px auto',
    padding: 'clamp(12px, 3vw, 20px)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 'clamp(12px, 3vw, 20px)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#fff',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'clamp(10px, 2vw, 15px) clamp(12px, 3vw, 20px)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 'clamp(8px, 2vw, 12px)',
    marginBottom: 'clamp(15px, 3vw, 20px)',
    backdropFilter: 'blur(10px)',
    flexWrap: 'wrap',
    gap: '10px',
  },
  scoreDisplay: {
    fontSize: 'clamp(18px, 5vw, 24px)',
    fontWeight: 'bold',
    color: '#ffd700',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  enemyCount: {
    fontSize: 'clamp(12px, 3vw, 16px)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  bossBadge: {
    backgroundColor: '#f44336',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: 'clamp(10px, 2.5vw, 12px)',
    fontWeight: 'bold',
  },
  battleArena: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: 'clamp(10px, 3vw, 20px)',
    marginBottom: 'clamp(20px, 4vw, 30px)',
    alignItems: 'center',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '20px',
    },
  },
  enemySection: {
    textAlign: 'center',
  },
  enemyCard: {
    padding: 'clamp(12px, 3vw, 20px)',
    borderRadius: 'clamp(12px, 3vw, 16px)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
    transition: 'transform 0.3s ease',
  },
  enemyName: {
    fontSize: 'clamp(20px, 6vw, 32px)',
    fontWeight: 'bold',
    marginBottom: '8px',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  enemyDifficulty: {
    fontSize: 'clamp(10px, 2.5vw, 14px)',
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
    padding: 'clamp(12px, 3vw, 20px)',
    borderRadius: 'clamp(12px, 3vw, 16px)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
  },
  playerName: {
    fontSize: 'clamp(20px, 6vw, 32px)',
    fontWeight: 'bold',
    marginBottom: '15px',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  vsDivider: {
    fontSize: 'clamp(28px, 8vw, 48px)',
    fontWeight: 'bold',
    color: '#ffd700',
    textShadow: '0 0 10px rgba(255,215,0,0.5)',
    animation: 'pulse 1.5s ease-in-out infinite',
    textAlign: 'center',
  },
  healthBarContainer: {
    width: '100%',
  },
  healthBarLabel: {
    fontSize: 'clamp(11px, 3vw, 14px)',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  healthBar: {
    width: '100%',
    height: 'clamp(20px, 5vw, 25px)',
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
    fontSize: 'clamp(10px, 2.5vw, 12px)',
    fontWeight: 'bold',
    color: '#fff',
  },
  mathChallenge: {
    marginBottom: 'clamp(20px, 4vw, 30px)',
  },
  equationBox: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    backdropFilter: 'blur(10px)',
    padding: 'clamp(20px, 5vw, 30px)',
    borderRadius: 'clamp(12px, 3vw, 16px)',
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  equationText: {
    fontSize: 'clamp(20px, 5vw, 28px)',
    fontWeight: 'bold',
    marginBottom: 'clamp(15px, 4vw, 25px)',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    wordBreak: 'break-word',
    lineHeight: 1.4,
  },
  optionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '10px',
  },
  optionButton: {
    padding: 'clamp(10px, 2.5vw, 14px) clamp(15px, 4vw, 20px)',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    textAlign: 'left',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.25)',
      transform: 'scale(1.01)',
    },
  },
  waitingMessage: {
    marginTop: 'clamp(15px, 3vw, 20px)',
    padding: 'clamp(8px, 2vw, 12px)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: '8px',
    fontSize: 'clamp(12px, 3vw, 14px)',
    color: '#ffd700',
    textAlign: 'center',
  },
  feedback: {
    marginTop: 'clamp(15px, 3vw, 20px)',
    padding: 'clamp(8px, 2vw, 12px)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '8px',
    fontSize: 'clamp(12px, 3vw, 14px)',
    color: '#ffd700',
    whiteSpace: 'pre-line',
    fontWeight: 'bold',
    wordBreak: 'break-word',
  },
  powerUpsSection: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 'clamp(15px, 3vw, 20px)',
    borderRadius: '12px',
    marginBottom: '15px',
    backdropFilter: 'blur(10px)',
  },
  powerUpsTitle: {
    fontSize: 'clamp(14px, 4vw, 18px)',
    marginBottom: '15px',
    color: '#ffd700',
    textAlign: 'center',
  },
  powerUpsContainer: {
    display: 'flex',
    gap: 'clamp(8px, 2vw, 15px)',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  powerUpButton: {
    padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 20px)',
    fontSize: 'clamp(11px, 3vw, 14px)',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    '@media (max-width: 480px)': {
      whiteSpace: 'normal',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  statsDisplay: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 'clamp(10px, 2vw, 12px) clamp(12px, 3vw, 20px)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: 'clamp(10px, 2.5vw, 14px)',
    backdropFilter: 'blur(10px)',
    flexWrap: 'wrap',
    gap: '10px',
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
    borderRadius: 'clamp(16px, 4vw, 20px)',
    padding: 'clamp(20px, 5vw, 40px)',
    textAlign: 'center',
    maxWidth: '450px',
    width: '90%',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    boxSizing: 'border-box',
  },
  trophyIcon: {
    fontSize: 'clamp(60px, 15vw, 80px)',
    marginBottom: '20px',
    animation: 'bounce 0.5s ease',
  },
  sadIcon: {
    fontSize: 'clamp(60px, 15vw, 80px)',
    marginBottom: '20px',
  },
  completionTitle: {
    fontSize: 'clamp(24px, 6vw, 36px)',
    marginBottom: '15px',
    color: '#ffd700',
  },
  completionText: {
    fontSize: 'clamp(14px, 4vw, 16px)',
    marginBottom: '20px',
    color: '#fff',
  },
  finalScore: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 'clamp(12px, 3vw, 15px)',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: 'clamp(12px, 3vw, 14px)',
    lineHeight: '1.8',
    color: '#fff',
  },
  continueButton: {
    padding: 'clamp(10px, 2.5vw, 12px) clamp(20px, 5vw, 30px)',
    fontSize: 'clamp(14px, 4vw, 16px)',
    backgroundColor: '#ffd700',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s',
    '&:hover': {
      transform: 'scale(1.02)',
      backgroundColor: '#ffed4e',
    },
  },
};

// Add responsive CSS with media queries
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
  
  button {
    transition: all 0.2s ease;
  }
  
  button:hover:not(:disabled) {
    transform: scale(1.02);
  }
  
  button:active:not(:disabled) {
    transform: scale(0.98);
  }
  
  /* Responsive design for tablets */
  @media (max-width: 768px) {
    .battle-arena {
      grid-template-columns: 1fr;
    }
  }
  
  /* Responsive design for mobile devices */
  @media (max-width: 480px) {
    .stats-display {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .power-ups-container {
      flex-direction: column;
      align-items: stretch;
    }
    
    .power-up-button {
      width: 100%;
    }
  }
  
  /* Touch-friendly improvements */
  @media (hover: none) and (pointer: coarse) {
    button {
      min-height: 44px;
      min-width: 44px;
    }
  }
`;
document.head.appendChild(styleSheet);

export default BattleArena;