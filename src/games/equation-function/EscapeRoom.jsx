// src/games/equation-function/EscapeRoom.jsx
import React, { useState, useEffect, useCallback } from 'react';

// Add styles once outside component
const animationStyles = `
  @keyframes shake {
    0% { transform: translate(1px, 1px) rotate(0deg); }
    10% { transform: translate(-1px, -2px) rotate(-1deg); }
    20% { transform: translate(-3px, 0px) rotate(1deg); }
    30% { transform: translate(3px, 2px) rotate(0deg); }
    40% { transform: translate(1px, -1px) rotate(1deg); }
    50% { transform: translate(-1px, 2px) rotate(-1deg); }
    60% { transform: translate(-3px, 1px) rotate(0deg); }
    70% { transform: translate(3px, 1px) rotate(-1deg); }
    80% { transform: translate(-1px, -1px) rotate(1deg); }
    90% { transform: translate(1px, 2px) rotate(0deg); }
    100% { transform: translate(1px, -2px) rotate(-1deg); }
  }
  
  @keyframes bounceIn {
    0% { transform: scale(0); opacity: 0; }
    80% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes fadeOut {
    0% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
  }
`;

// Check if styles are already added
if (!document.querySelector('#escape-room-styles')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = 'escape-room-styles';
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}

const EscapeRoom = ({ 
  onComplete, 
  onScore, 
  challengeScore, 
  sendGameResult,
  onGameStateUpdate,
  savedGameState,
  clearSavedState
}) => {
  // Function to shuffle array (Fisher-Yates algorithm)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Define all 10 multiple-choice puzzles with enemies
  const allPuzzles = [
    {
      type: "mc",
      question: "Two delivery services charge:\n• Service A: y = 50x + 20\n• Service B: y = 50x + 40\nWhat is the key difference?",
      options: ["Rate per km", "Starting fee", "Distance", "Speed"],
      correctOptionIndex: 1,
      hint: "Look at the constant term (y-intercept) in each equation. What is different between the two equations?",
      explanation: "The slope (50) is the same, but the y-intercepts (20 vs 40) are different.",
      difficulty: "Intermediate",
      enemy: { name: "Slope Shadow", emoji: "👤", attackMessage: "The Slope Shadow sinks its teeth into you! -1 Life!", biteMessage: "⚔️ The Shadow bites you for 1 damage!" },
      defeatMessage: "You saw past my identical slopes and found the intercept! POOF!"
    },
    {
      type: "mc",
      question: "Why are parallel lines important in real life?",
      options: ["They meet eventually", "They represent equal rates of change", "They always cross", "They are curved"],
      correctOptionIndex: 1,
      hint: "Think about two lines that never meet – what mathematical property stays the same between them?",
      explanation: "Parallel lines have the same slope, meaning they represent equal rates of change.",
      difficulty: "Basic",
      enemy: { name: "Parallel Phantom", emoji: "👻", attackMessage: "The Phantom phases through you! -1 Life!", biteMessage: "👻 The Phantom drains your energy!" },
      defeatMessage: "You understood parallelism! The Phantom fades away!"
    },
    {
      type: "mc",
      question: "A student says: 'If two lines don't intersect, they must be the same.' Is this correct?",
      options: ["Yes", "No"],
      correctOptionIndex: 1,
      hint: "Can two different lines never meet? Think about railroad tracks...",
      explanation: "Two lines can be parallel (same slope, different intercepts) – they never intersect but are different lines.",
      difficulty: "Basic",
      enemy: { name: "Intersection Imp", emoji: "👺", attackMessage: "The Imp claws at you! -1 Life!", biteMessage: "👺 The Imp's claws scratch deep!" },
      defeatMessage: "You corrected the imp! Parallel lines exist without meeting!"
    },
    {
      type: "mc",
      question: "Which situation fits a line with slope 0?",
      options: ["Increasing savings", "Constant temperature", "Decreasing water level", "Rising cost"],
      correctOptionIndex: 1,
      hint: "Slope 0 means no change over time. Which option stays exactly the same?",
      explanation: "Slope 0 means no change – a constant temperature doesn't increase or decrease.",
      difficulty: "Basic",
      enemy: { name: "Zero Sloth", emoji: "🦥", attackMessage: "The Sloth slowly bites you! -1 Life!", biteMessage: "🦥 The Sloth's lazy bite hurts!" },
      defeatMessage: "You woke the sloth! Zero slope means constant rate!"
    },
    {
      type: "mc",
      question: "Why do we use point-slope form?",
      options: ["To avoid using slope", "To use a known point and slope", "To find intercept only", "To graph curves"],
      correctOptionIndex: 1,
      hint: "The formula is y - y₁ = m(x - x₁). What information does this require?",
      explanation: "Point-slope form uses a known point (x₁, y₁) and the slope m to define a line.",
      difficulty: "Intermediate",
      enemy: { name: "Point Form Fiend", emoji: "😈", attackMessage: "The Fiend stabs you with its pitchfork! -1 Life!", biteMessage: "😈 The Fiend's attack burns!" },
      defeatMessage: "Point-slope form defeated! It uses a point and slope!"
    },
    {
      type: "mc",
      question: "A student used y − 3 = 2(x − 1). What does this show?",
      options: ["Starting value only", "A line using slope and a point", "Only intercept", "A curve"],
      correctOptionIndex: 1,
      hint: "This equation is in point-slope form: (y - y₁) = m(x - x₁). Identify m, x₁, and y₁.",
      explanation: "It shows a line with slope 2 passing through point (1, 3).",
      difficulty: "Intermediate",
      enemy: { name: "Form Confuser", emoji: "🃏", attackMessage: "The Confuser throws cards at you! -1 Life!", biteMessage: "🃏 Sharp cards cut deep!" },
      defeatMessage: "You recognized point-slope form! Slope 2 through (1,3)!"
    },
    {
      type: "mc",
      question: "Which real-life situation matches y − 5 = 3(x − 2)?",
      options: ["Starting at 5, increasing by 3 from point (2,5)", "Starting at 3, increasing by 5", "Starting at 2, decreasing by 5", "Random growth"],
      correctOptionIndex: 0,
      hint: "Rewrite in slope-intercept form: y = 3x - 1. What happens when x=2?",
      explanation: "When x=2, y=5; slope 3 means increases by 3 each step from that point.",
      difficulty: "Intermediate",
      enemy: { name: "Situation Sphinx", emoji: "🐪", attackMessage: "The Sphinx headbutts you! -1 Life!", biteMessage: "🐪 The Sphinx's charge hurts!" },
      defeatMessage: "The Sphinx bows! The equation starts at 5 from point (2,5)!"
    },
    {
      type: "mc",
      question: "A student writes y = 2x + 5 for a decreasing situation. What is wrong?",
      options: ["Intercept is wrong", "Slope should be negative", "x is incorrect", "Equation is quadratic"],
      correctOptionIndex: 1,
      hint: "What does the slope tell you about whether something increases or decreases?",
      explanation: "For a decreasing situation, the slope should be negative (e.g., y = -2x + 5).",
      difficulty: "Basic",
      enemy: { name: "Direction Demon", emoji: "👹", attackMessage: "The Demon smashes you with its club! -1 Life!", biteMessage: "👹 The Demon's club crushes!" },
      defeatMessage: "You corrected the slope! Decreasing needs negative slope!"
    },
    {
      type: "mc",
      question: "Why is slope-intercept form useful?",
      options: ["It hides slope", "It shows slope and starting value clearly", "It removes variables", "It only works for graphs"],
      correctOptionIndex: 1,
      hint: "In y = mx + b, what do m and b represent?",
      explanation: "Slope-intercept form (y = mx + b) clearly shows slope (m) and y-intercept (b).",
      difficulty: "Basic",
      enemy: { name: "Slope Intercept Skeleton", emoji: "💀", attackMessage: "The Skeleton scratches you with its bony fingers! -1 Life!", biteMessage: "💀 The Skeleton's claws rattle!" },
      defeatMessage: "The skeleton crumbles! Slope-intercept shows slope and starting value!"
    },
    {
      type: "mc",
      question: "Create a real-life meaning for y = −4x + 20",
      options: ["Starts at 20, decreases by 4 per unit", "Starts at 4, increases by 20", "Starts at 20, increases by 4", "Random change"],
      correctOptionIndex: 0,
      hint: "Identify the y-intercept (starting value) and slope (rate of change). Is the slope positive or negative?",
      explanation: "Starts at 20 (y-intercept), decreases by 4 each unit (negative slope).",
      difficulty: "Intermediate",
      enemy: { name: "Negative Knight", emoji: "⚔️", attackMessage: "The Knight slashes you with his sword! -1 Life!", biteMessage: "⚔️ The Knight's sword cuts deep!" },
      defeatMessage: "You defeated the knight! Starts at 20, decreases by 4 each time!"
    }
  ];

  // Initialize puzzles - either from saved state or shuffled
  const [puzzles, setPuzzles] = useState(() => {
    if (savedGameState && savedGameState.shuffledPuzzles) {
      return savedGameState.shuffledPuzzles;
    }
    return shuffleArray(allPuzzles);
  });

  const [currentPuzzle, setCurrentPuzzle] = useState(() => {
    if (savedGameState && savedGameState.currentPuzzle !== undefined) {
      return savedGameState.currentPuzzle;
    }
    return 0;
  });
  const [mcSelection, setMcSelection] = useState(null);
  const [feedback, setFeedback] = useState(() => {
    if (savedGameState && savedGameState.feedback) {
      return savedGameState.feedback;
    }
    return '';
  });
  const [score, setScore] = useState(() => {
    if (savedGameState && savedGameState.challengeScore !== undefined) {
      return savedGameState.challengeScore;
    }
    return challengeScore || 0;
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    if (savedGameState && savedGameState.timeLeft !== undefined) {
      return savedGameState.timeLeft;
    }
    return 300;
  });
  const [gameActive, setGameActive] = useState(() => {
    if (savedGameState && savedGameState.gameActive !== undefined) {
      return savedGameState.gameActive;
    }
    return true;
  });
  const [showHint, setShowHint] = useState(() => {
    if (savedGameState && savedGameState.showHint !== undefined) {
      return savedGameState.showHint;
    }
    return false;
  });
  const [puzzlesCompleted, setPuzzlesCompleted] = useState(() => {
    if (savedGameState && savedGameState.puzzlesCompleted !== undefined) {
      return savedGameState.puzzlesCompleted;
    }
    return 0;
  });
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [attempts, setAttempts] = useState(() => {
    if (savedGameState && savedGameState.attempts !== undefined) {
      return savedGameState.attempts;
    }
    return 0;
  });

  const [lives, setLives] = useState(() => {
    if (savedGameState && savedGameState.lives !== undefined) {
      return savedGameState.lives;
    }
    return 3;
  });

  const [playerPosition, setPlayerPosition] = useState(() => {
    if (savedGameState && savedGameState.playerPosition !== undefined) {
      return savedGameState.playerPosition;
    }
    return 0;
  });

  const [correctAnswers, setCorrectAnswers] = useState(() => {
    if (savedGameState && savedGameState.correctAnswers !== undefined) {
      return savedGameState.correctAnswers;
    }
    return 0;
  });
  const [wrongAnswers, setWrongAnswers] = useState(() => {
    if (savedGameState && savedGameState.wrongAnswers !== undefined) {
      return savedGameState.wrongAnswers;
    }
    return 0;
  });

  const [enemyAttacking, setEnemyAttacking] = useState(false);
  const [defeatedEnemy, setDefeatedEnemy] = useState(null);
  const [escapeDoorOpen, setEscapeDoorOpen] = useState(false);
  const [roomShake, setRoomShake] = useState(false);

  const totalPuzzles = puzzles.length;
  const xpSoFar = (correctAnswers * 10) - (wrongAnswers * 5);
  const distanceToDoor = 100 - playerPosition;

  useEffect(() => {
    if (puzzlesCompleted === totalPuzzles) {
      setEscapeDoorOpen(true);
    }
  }, [puzzlesCompleted, totalPuzzles]);

  const shakeRoom = () => {
    setRoomShake(true);
    setTimeout(() => setRoomShake(false), 300);
  };

  const triggerEnemyAttack = () => {
    setEnemyAttacking(true);
    setTimeout(() => setEnemyAttacking(false), 500);
  };

  const handlePlayerDeath = useCallback(() => {
    setGameActive(false);
    setFeedback("💀 GAME OVER! The enemies overwhelmed you! 💀");
    
    const timeSpent = 300 - timeLeft;
    const accuracy = ((puzzlesCompleted / totalPuzzles) * 100).toFixed(1);
    
    saveProgressToLocalStorage(false, score, timeSpent, puzzlesCompleted, accuracy);
    sendResultToParent(false, score, timeSpent, puzzlesCompleted, accuracy);
    
    if (onComplete) {
      onComplete(false);
    }
  }, [score, puzzlesCompleted, timeLeft, totalPuzzles, onComplete]);

  useEffect(() => {
    const newPosition = (puzzlesCompleted / totalPuzzles) * 100;
    setPlayerPosition(newPosition);
  }, [puzzlesCompleted, totalPuzzles]);

  useEffect(() => {
    if (lives <= 0 && gameActive) {
      handlePlayerDeath();
    }
  }, [lives, gameActive, handlePlayerDeath]);

  const sendScoreUpdate = useCallback(() => {
    if (window.parent !== window) {
      const progress = ((puzzlesCompleted) / totalPuzzles) * 100;
      const scoreUpdate = {
        type: 'SCORE_UPDATE',
        gameId: 'equation',
        score: score,
        stats: {
          puzzlesCompleted: puzzlesCompleted,
          totalPuzzles: totalPuzzles,
          progress: progress,
          currentPuzzle: currentPuzzle + 1,
          timeLeft: timeLeft,
          attempts: attempts,
          accuracy: ((puzzlesCompleted / totalPuzzles) * 100).toFixed(1),
          correctAnswers: correctAnswers,
          wrongAnswers: wrongAnswers,
          xpEarned: xpSoFar,
          lives: lives,
          playerPosition: playerPosition
        }
      };
      window.parent.postMessage(scoreUpdate, '*');
    }
  }, [score, puzzlesCompleted, currentPuzzle, totalPuzzles, timeLeft, attempts, correctAnswers, wrongAnswers, xpSoFar, lives, playerPosition]);

  useEffect(() => {
    if (gameActive && !showCongratulations) {
      sendScoreUpdate();
    }
  }, [score, gameActive, showCongratulations, sendScoreUpdate]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'REQUEST_SCORE') {
        const progress = ((puzzlesCompleted) / totalPuzzles) * 100;
        const scoreUpdate = {
          type: 'SCORE_UPDATE',
          gameId: 'equation',
          score: score,
          stats: {
            puzzlesCompleted: puzzlesCompleted,
            totalPuzzles: totalPuzzles,
            progress: progress,
            currentPuzzle: currentPuzzle + 1,
            timeLeft: timeLeft,
            attempts: attempts,
            accuracy: ((puzzlesCompleted / totalPuzzles) * 100).toFixed(1),
            correctAnswers: correctAnswers,
            wrongAnswers: wrongAnswers,
            xpEarned: xpSoFar,
            lives: lives,
            playerPosition: playerPosition
          }
        };
        if (window.parent !== window) {
          window.parent.postMessage(scoreUpdate, '*');
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [score, puzzlesCompleted, currentPuzzle, totalPuzzles, timeLeft, attempts, correctAnswers, wrongAnswers, xpSoFar, lives, playerPosition]);

  const sendResultToParent = useCallback((completed, finalScore, timeSpent, puzzlesCompletedCount, accuracy, bonusPoints = 0) => {
    const xpEarned = (correctAnswers * 10) - (wrongAnswers * 5);
    const gameResult = {
      type: 'GAME_RESULT',
      gameId: 'equation',
      completed: completed,
      score: finalScore,
      timeSpent: timeSpent,
      stats: {
        finalScore: finalScore,
        bonusPoints: bonusPoints,
        totalPuzzles: totalPuzzles,
        puzzlesCompleted: puzzlesCompletedCount,
        timeRemaining: timeLeft,
        accuracy: accuracy,
        baseScore: completed ? finalScore - bonusPoints : finalScore,
        progress: `${puzzlesCompletedCount}/${totalPuzzles}`,
        correctAnswers: correctAnswers,
        wrongAnswers: wrongAnswers,
        xpEarned: xpEarned,
        livesRemaining: lives,
        finalPosition: playerPosition
      }
    };
    
    if (window.parent !== window) {
      try {
        window.parent.postMessage(gameResult, '*');
      } catch (error) {
        console.error('Error sending to parent:', error);
      }
    }
    
    if (sendGameResult) {
      sendGameResult(completed, finalScore, timeSpent, puzzlesCompletedCount, gameResult.stats);
    }
  }, [totalPuzzles, timeLeft, correctAnswers, wrongAnswers, lives, playerPosition, sendGameResult]);

  const saveProgressToLocalStorage = useCallback((completed, finalScore, timeSpent, puzzlesCompletedCount, accuracy, bonusPoints = 0) => {
    try {
      const existingProgress = localStorage.getItem('gameProgress');
      let progress = existingProgress ? JSON.parse(existingProgress) : {
        equation: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0, totalXPEarned: 0 },
        battle: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0, totalXPEarned: 0 },
        spaceShooter: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0, totalXPEarned: 0 }
      };
      
      const xpEarned = (correctAnswers * 10) - (wrongAnswers * 5);
      const xpBreakdown = [];
      if (correctAnswers > 0) xpBreakdown.push(`${correctAnswers} correct: +${correctAnswers * 10} XP`);
      if (wrongAnswers > 0) xpBreakdown.push(`${wrongAnswers} wrong: -${wrongAnswers * 5} XP`);
      if (completed && !progress.equation?.completed) xpBreakdown.push(`Completion bonus: +50 XP`);
      
      const currentEquation = progress.equation || {
        completed: false,
        highScore: 0,
        attempts: 0,
        bestTime: null,
        lastPlayed: null,
        lastScore: 0,
        totalXPEarned: 0
      };
      
      const newHighScore = Math.max(currentEquation.highScore || 0, finalScore || 0);
      const newAttempts = (currentEquation.attempts || 0) + 1;
      const newTotalXPEarned = (currentEquation.totalXPEarned || 0) + Math.max(0, xpEarned);
      
      let newBestTime = currentEquation.bestTime;
      if (completed && timeSpent) {
        newBestTime = currentEquation.bestTime 
          ? Math.min(currentEquation.bestTime, timeSpent)
          : timeSpent;
      }
      
      progress.equation = {
        ...currentEquation,
        completed: completed || currentEquation.completed,
        highScore: newHighScore,
        lastScore: finalScore,
        totalXPEarned: newTotalXPEarned,
        attempts: newAttempts,
        bestTime: newBestTime,
        lastPlayed: new Date().toISOString(),
        lastGameStats: {
          puzzlesCompleted: puzzlesCompletedCount,
          totalPuzzles: totalPuzzles,
          completionPercentage: ((puzzlesCompletedCount / totalPuzzles) * 100).toFixed(1),
          accuracy: accuracy,
          bonusPoints: bonusPoints,
          finalScore: finalScore,
          timeSpent: timeSpent,
          correctAnswers: correctAnswers,
          wrongAnswers: wrongAnswers,
          xpEarned: xpEarned,
          xpBreakdown: xpBreakdown,
          livesRemaining: lives
        }
      };
      
      localStorage.setItem('gameProgress', JSON.stringify(progress));
      return progress;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [totalPuzzles, correctAnswers, wrongAnswers, lives]);

  useEffect(() => {
    if (onGameStateUpdate && gameActive && !showCongratulations) {
      onGameStateUpdate({
        currentPuzzle, 
        puzzlesCompleted, 
        challengeScore: score,
        timeLeft, 
        attempts, 
        feedback, 
        showHint, 
        gameActive,
        shuffledPuzzles: puzzles,
        correctAnswers,
        wrongAnswers,
        lives,
        playerPosition
      });
    }
  }, [currentPuzzle, puzzlesCompleted, score, timeLeft, attempts, feedback, showHint, gameActive, puzzles, onGameStateUpdate, correctAnswers, wrongAnswers, lives, playerPosition]);

  useEffect(() => {
    if (gameActive && timeLeft > 0 && currentPuzzle < totalPuzzles && lives > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameActive(false);
            setFeedback("Time's up! Game over!");
            
            const timeSpent = 300;
            const accuracy = ((puzzlesCompleted / totalPuzzles) * 100).toFixed(1);
            
            saveProgressToLocalStorage(false, score, timeSpent, puzzlesCompleted, accuracy);
            sendResultToParent(false, score, timeSpent, puzzlesCompleted, accuracy);
            
            if (onComplete) {
              onComplete(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameActive, currentPuzzle, timeLeft, puzzlesCompleted, score, totalPuzzles, lives, saveProgressToLocalStorage, sendResultToParent, onComplete]);

  const showEnemyDefeat = (enemy, defeatMessage) => {
    setDefeatedEnemy({ enemy, defeatMessage });
    setTimeout(() => setDefeatedEnemy(null), 1500);
  };

  const checkAnswer = useCallback(() => {
    if (!gameActive || lives <= 0) return;
    
    const currentPuzzleData = puzzles[currentPuzzle];
    
    if (mcSelection === null) {
      setFeedback("Please select an answer!");
      shakeRoom();
      return;
    }
    
    const isCorrect = (mcSelection === currentPuzzleData.correctOptionIndex);
    const explanationText = currentPuzzleData.explanation;
    
    if (window.parent !== window) {
      const xpUpdate = {
        type: 'XP_UPDATE',
        gameId: 'equation',
        xpChange: isCorrect ? 10 : -5,
        isCorrect: isCorrect,
        question: currentPuzzleData.question,
        timestamp: new Date().toISOString()
      };
      window.parent.postMessage(xpUpdate, '*');
    }
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      const pointsEarned = 100;
      const newScore = score + pointsEarned;
      setScore(newScore);
      if (onScore) onScore(newScore);
      
      const newPuzzlesCompleted = puzzlesCompleted + 1;
      setPuzzlesCompleted(newPuzzlesCompleted);
      
      if (currentPuzzleData.enemy) {
        showEnemyDefeat(currentPuzzleData.enemy, currentPuzzleData.defeatMessage);
      }
      
      setFeedback(`✅ Correct! +10 XP! ${explanationText} You move closer to the door!`);
      setShowHint(false);
      setMcSelection(null);
      setAttempts(0);
      
      if (currentPuzzle + 1 < totalPuzzles) {
        setCurrentPuzzle(currentPuzzle + 1);
      } else if (newPuzzlesCompleted === totalPuzzles) {
        setGameActive(false);
        setShowCongratulations(true);
        
        const bonusPoints = Math.floor(timeLeft * 2);
        const finalScore = newScore + bonusPoints;
        setScore(finalScore);
        if (onScore) onScore(finalScore);
        
        const timeSpent = 300 - timeLeft;
        const accuracy = ((newPuzzlesCompleted / totalPuzzles) * 100).toFixed(1);
        
        setFeedback(`🎉 Congratulations! Bonus: +${bonusPoints} points! You escaped!`);
        
        saveProgressToLocalStorage(true, finalScore, timeSpent, newPuzzlesCompleted, accuracy, bonusPoints);
        sendResultToParent(true, finalScore, timeSpent, newPuzzlesCompleted, accuracy, bonusPoints);
        
        if (onComplete) {
          onComplete(true);
        }
        if (clearSavedState) clearSavedState();
      }
    } else {
      shakeRoom();
      triggerEnemyAttack();
      
      const newLives = lives - 1;
      setLives(newLives);
      setWrongAnswers(prev => prev + 1);
      
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      const biteMessage = currentPuzzleData.enemy?.biteMessage || `The enemy bites you! -1 Life!`;
      
      if (newLives <= 0) {
        setFeedback(`💀 ${biteMessage} You have no lives left! GAME OVER! 💀`);
      } else if (newAttempts >= 2) {
        setFeedback(`❌ Incorrect. ${biteMessage} ${currentPuzzleData.hint} (-5 XP!) Lives left: ${newLives}`);
        setShowHint(true);
      } else {
        setFeedback(`❌ Incorrect. ${biteMessage} ${currentPuzzleData.hint} (-5 XP!) Lives left: ${newLives}`);
      }
      setMcSelection(null);
    }
  }, [mcSelection, currentPuzzle, gameActive, score, puzzlesCompleted, timeLeft, attempts, lives, puzzles, totalPuzzles, onScore, onComplete, saveProgressToLocalStorage, sendResultToParent, clearSavedState]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Basic': return '#4caf50';
      case 'Intermediate': return '#ff9800';
      case 'Advanced': return '#f44336';
      default: return '#667eea';
    }
  };

  const currentEnemy = puzzles[currentPuzzle]?.enemy;

  if (showCongratulations) {
    const xpEarned = (correctAnswers * 10) - (wrongAnswers * 5);
    const bonusCompletionXP = 50;
    const totalXP = xpEarned + (puzzlesCompleted === totalPuzzles ? bonusCompletionXP : 0);
    
    return (
      <div style={styles.completionContainer}>
        <div style={styles.completionCard}>
          <div style={styles.trophyIcon}>🏆</div>
          <h2 style={styles.completionTitle}>You Escaped!</h2>
          <p style={styles.completionText}>Congratulations! You've defeated all enemies and escaped the room!</p>
          <div style={styles.finalScore}>
            <div>Final Score: {score}</div>
            <div>Time Remaining: {formatTime(timeLeft)}</div>
            <div>Lives Remaining: {lives}</div>
            <div>Puzzles Completed: {puzzlesCompleted}/{totalPuzzles}</div>
            <div>Accuracy: {((puzzlesCompleted / totalPuzzles) * 100).toFixed(1)}%</div>
            <div>✅ Correct Answers: {correctAnswers} (+{correctAnswers * 10} XP)</div>
            <div>❌ Wrong Answers: {wrongAnswers} (-{wrongAnswers * 5} XP)</div>
            <div>⭐ XP Earned This Game: {xpEarned}</div>
            {puzzlesCompleted === totalPuzzles && (
              <div>🎉 Completion Bonus: +{bonusCompletionXP} XP</div>
            )}
            <div style={{marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '8px', fontWeight: 'bold', color: '#ffd700'}}>
              Total XP: {totalXP}
            </div>
          </div>
          <button onClick={() => onComplete && onComplete(true)} style={styles.continueButton}>Return to Menu</button>
        </div>
      </div>
    );
  }

  if (!gameActive && !showCongratulations) {
    const xpEarned = (correctAnswers * 10) - (wrongAnswers * 5);
    return (
      <div style={styles.completionContainer}>
        <div style={styles.completionCard}>
          <div style={styles.sadIcon}>💀</div>
          <h2 style={styles.completionTitle}>Game Over</h2>
          <p style={styles.completionText}>The enemies defeated you! Try again to escape!</p>
          <div style={styles.finalScore}>
            <div>Final Score: {score}</div>
            <div>Lives Lost: {3 - lives}</div>
            <div>Puzzles Completed: {puzzlesCompleted}/{totalPuzzles}</div>
            <div>Accuracy: {((puzzlesCompleted / totalPuzzles) * 100).toFixed(1)}%</div>
            <div>✅ Correct Answers: {correctAnswers} (+{correctAnswers * 10} XP)</div>
            <div>❌ Wrong Answers: {wrongAnswers} (-{wrongAnswers * 5} XP)</div>
            <div>⭐ XP Earned This Game: {xpEarned}</div>
          </div>
          <button onClick={() => { 
            clearSavedState?.(); 
            onComplete && onComplete(false);
          }} style={styles.continueButton}>Try Again</button>
        </div>
      </div>
    );
  }

  const currentPuzzleData = puzzles[currentPuzzle];
  const progress = ((puzzlesCompleted) / totalPuzzles) * 100;

  return (
    <div style={{...styles.container, animation: roomShake ? 'shake 0.3s ease-in-out 0s 2' : 'none'}}>
      {defeatedEnemy && (
        <div style={styles.enemyDefeatOverlay}>
          <div style={styles.enemyDefeatBubble}>
            <span style={styles.enemyDefeatEmoji}>{defeatedEnemy.enemy.emoji}</span>
            <span style={styles.enemyDefeatText}>{defeatedEnemy.defeatMessage}</span>
            <span style={styles.enemyDefeatXp}>+10 XP!</span>
          </div>
        </div>
      )}

      <div style={styles.visualRoom}>
        <div style={styles.roomWalls}>
          <div style={styles.roomWallLeft}></div>
          <div style={styles.roomWallRight}></div>
          <div style={styles.roomWallTop}></div>
          <div style={styles.roomFloor}></div>
          
          <div style={{...styles.escapeDoor, right: `${60 - (playerPosition * 0.5)}px`, ...(escapeDoorOpen ? styles.escapeDoorOpen : {})}}>
            <div style={styles.doorFrame}>
              <div style={styles.doorPanel}>
                {escapeDoorOpen ? (
                  <div style={styles.openDoorContent}>
                    <span style={styles.openDoorText}>🚪 ESCAPE →</span>
                  </div>
                ) : (
                  <div style={styles.lockedDoorContent}>
                    <span style={styles.lockedDoorText}>🔒 LOCKED</span>
                    <span style={styles.lockedDoorSubtext}>Move closer!</span>
                  </div>
                )}
              </div>
            </div>
            <div style={styles.doorKnob}></div>
          </div>

          <div style={styles.distanceIndicator}>
            <span>🚶‍♂️ Distance to door: {Math.max(0, Math.ceil(distanceToDoor))}%</span>
            <div style={styles.distanceBar}>
              <div style={{...styles.distanceFill, width: `${playerPosition}%`}}></div>
            </div>
          </div>
        </div>

        <div style={{...styles.enemySprite, animation: enemyAttacking ? 'enemyAttack 0.3s ease-in-out' : 'float 2s ease-in-out infinite'}}>
          <div style={styles.enemyAvatar}>
            <span style={styles.enemyEmoji}>{currentEnemy?.emoji || "👾"}</span>
            <div style={styles.enemyNameTag}>{currentEnemy?.name || "Mystery Monster"}</div>
          </div>
          <div style={styles.enemySpeechBubble}>
            <span style={styles.enemyQuote}>"{currentEnemy?.attackMessage || "Answer wrong and I bite you!"}"</span>
          </div>
        </div>

        <div style={{...styles.playerSprite, left: `${80 + (playerPosition * 1.5)}px`}}>
          <div style={styles.playerAvatar}>
            <span style={styles.playerEmoji}>🧙</span>
            <div style={styles.playerNameTag}>You</div>
          </div>
        </div>

        {enemyAttacking && (
          <div style={styles.bloodEffect}>
            <span>💀</span>
          </div>
        )}
      </div>

      <div style={styles.puzzleArea}>
        <div style={styles.header}>
          <div style={styles.scoreTimeContainer}>
            <div style={styles.score}>⭐ Score: {score}</div>
            <div style={styles.timer}>⏱️ {formatTime(timeLeft)}</div>
            <div style={styles.livesContainer}>
              <span>❤️ Lives: </span>
              {[...Array(3)].map((_, i) => (
                <span key={i} style={{color: i < lives ? '#ff4444' : '#333', fontSize: '20px'}}>
                  {i < lives ? '❤️' : '🖤'}
                </span>
              ))}
            </div>
          </div>
          <div style={styles.xpDisplay}>
            <span>⭐ XP This Game: {xpSoFar}</span>
            <span style={styles.xpBreakdown}>
              (+{correctAnswers * 10} / -{wrongAnswers * 5})
            </span>
          </div>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${progress}%`}} />
          </div>
          <div style={styles.progressText}>Enemies Defeated: {puzzlesCompleted} of {totalPuzzles}</div>
        </div>

        <div style={styles.equationCard}>
          <div style={{...styles.difficultyBadge, backgroundColor: getDifficultyColor(currentPuzzleData.difficulty)}}>
            {currentPuzzleData.difficulty} • Multiple Choice
          </div>
          
          <div style={styles.mcContainer}>
            <div style={styles.mcQuestionText}>{currentPuzzleData.question}</div>
            <div style={styles.optionsContainer}>
              {currentPuzzleData.options.map((option, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return (
                  <button
                    key={idx}
                    onClick={() => setMcSelection(idx)}
                    style={{
                      ...styles.optionButton,
                      backgroundColor: mcSelection === idx ? '#4caf50' : '#2a2a4a',
                      border: mcSelection === idx ? '2px solid #ffd93d' : '2px solid #4a4a6a',
                    }}
                  >
                    <span style={styles.optionLetter}>{letter}.</span>
                    <span style={styles.optionText}>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.answerContainer}>
            <button onClick={checkAnswer} style={{...styles.answerSubmitButton, width: '100%'}}>
              ⚔️ DEFEAT ENEMY ⚔️
            </button>
          </div>

          {feedback && <div style={feedback.includes('💀') ? styles.feedbackDeath : styles.feedback}>{feedback}</div>}
          
          {showHint && (
            <div style={styles.hint}>
              <strong>💡 Hint:</strong> {currentPuzzleData.hint}
            </div>
          )}

          <div style={styles.stats}>
            <div style={styles.attempts}>⚔️ Attempts: {attempts}</div>
            <div style={styles.xpStats}>✅ {correctAnswers} defeated | ❌ {wrongAnswers} misses</div>
            <button onClick={() => setShowHint(!showHint)} style={styles.hintButton}>
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
          </div>
        </div>

        <div style={styles.tipsCard}>
          <h4 style={styles.tipsTitle}>📚 Reasoning Tips</h4>
          <ul style={styles.tipsList}>
            <li>✓ Identify slope (rate) vs y-intercept (starting value)</li>
            <li>✓ Parallel lines = same slope, different intercepts</li>
            <li>✓ Negative slope = decreasing, positive = increasing</li>
            <li>✓ Point-slope form: y - y₁ = m(x - x₁)</li>
            <li>⭐ +10 XP per enemy defeated, -5 XP per miss</li>
            <li>⚠️ Each wrong answer = enemy bites you! (-1 Life)</li>
            <li>❤️ You have {lives} lives remaining. Reach 0 = GAME OVER!</li>
            <li>🚪 Each correct answer moves you closer to the door!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    width: '95%',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#1a1a2e',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
  },
  enemyDefeatOverlay: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  enemyDefeatBubble: {
    backgroundColor: '#ffd93d',
    padding: '15px 25px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
    animation: 'bounceIn 0.3s ease-out',
  },
  enemyDefeatEmoji: {
    fontSize: '36px',
  },
  enemyDefeatText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  enemyDefeatXp: {
    fontSize: '16px',
    color: '#4caf50',
    fontWeight: 'bold',
    backgroundColor: 'white',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  visualRoom: {
    position: 'relative',
    backgroundColor: '#2d1b0e',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    minHeight: '320px',
    boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), 0 5px 15px rgba(0,0,0,0.3)',
    border: '4px solid #5c3a1e',
    overflow: 'hidden',
  },
  roomWalls: {
    position: 'relative',
    height: '280px',
  },
  roomWallLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '20px',
    height: '100%',
    backgroundColor: '#8B6914',
    background: 'linear-gradient(180deg, #a07828 0%, #6b4c1a 100%)',
    borderRadius: '4px 0 0 4px',
  },
  roomWallRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '20px',
    height: '100%',
    backgroundColor: '#8B6914',
    background: 'linear-gradient(180deg, #a07828 0%, #6b4c1a 100%)',
    borderRadius: '0 4px 4px 0',
  },
  roomWallTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '20px',
    backgroundColor: '#8B6914',
    background: 'linear-gradient(90deg, #a07828 0%, #6b4c1a 100%)',
    borderRadius: '4px 4px 0 0',
  },
  roomFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '40px',
    backgroundColor: '#4a2a0a',
    background: 'repeating-linear-gradient(45deg, #5c3612, #5c3612 20px, #6b4015 20px, #6b4015 40px)',
    borderRadius: '0 0 12px 12px',
  },
  escapeDoor: {
    position: 'absolute',
    bottom: '40px',
    width: '80px',
    height: '140px',
    transition: 'all 0.5s ease',
    cursor: 'pointer',
    zIndex: 10,
  },
  escapeDoorOpen: {
    transform: 'translateX(10px)',
    opacity: 0.9,
  },
  doorFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3d2b1a',
    border: '3px solid #8B6914',
    borderRadius: '8px',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
    position: 'relative',
  },
  doorPanel: {
    width: '100%',
    height: '100%',
    backgroundColor: '#5c3d1e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  lockedDoorContent: {
    color: '#ff6b6b',
    fontSize: '10px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lockedDoorText: {
    display: 'block',
    fontSize: '14px',
  },
  lockedDoorSubtext: {
    display: 'block',
    fontSize: '8px',
    marginTop: '5px',
    color: '#aaa',
  },
  openDoorContent: {
    color: '#4caf50',
    fontSize: '14px',
    fontWeight: 'bold',
    transform: 'rotate(-90deg)',
    whiteSpace: 'nowrap',
  },
  openDoorText: {
    display: 'inline-block',
  },
  doorKnob: {
    position: 'absolute',
    right: '5px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '10px',
    height: '10px',
    backgroundColor: '#ffd700',
    borderRadius: '50%',
  },
  distanceIndicator: {
    position: 'absolute',
    bottom: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: '8px 15px',
    borderRadius: '20px',
    fontSize: '12px',
    color: 'white',
    textAlign: 'center',
    zIndex: 15,
  },
  distanceBar: {
    width: '150px',
    height: '6px',
    backgroundColor: '#333',
    borderRadius: '3px',
    marginTop: '5px',
    overflow: 'hidden',
  },
  distanceFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    transition: 'width 0.3s ease',
  },
  enemySprite: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    zIndex: 5,
  },
  enemyAvatar: {
    backgroundColor: '#2a1a0a',
    borderRadius: '50%',
    width: '80px',
    height: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #ff4444',
    boxShadow: '0 0 15px rgba(255,0,0,0.5)',
  },
  enemyEmoji: {
    fontSize: '42px',
  },
  enemyNameTag: {
    fontSize: '10px',
    backgroundColor: '#ff4444',
    padding: '2px 8px',
    borderRadius: '10px',
    marginTop: '4px',
    color: 'white',
    fontWeight: 'bold',
  },
  enemySpeechBubble: {
    position: 'absolute',
    top: '-50px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    padding: '8px 12px',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#333',
  },
  playerSprite: {
    position: 'absolute',
    bottom: '60px',
    textAlign: 'center',
    zIndex: 5,
    transition: 'left 0.3s ease',
  },
  playerAvatar: {
    backgroundColor: '#1a3a5c',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #4caf50',
    boxShadow: '0 0 10px rgba(76,175,80,0.5)',
  },
  playerEmoji: {
    fontSize: '32px',
  },
  playerNameTag: {
    fontSize: '8px',
    backgroundColor: '#4caf50',
    padding: '1px 6px',
    borderRadius: '10px',
    marginTop: '2px',
    color: 'white',
    fontWeight: 'bold',
  },
  bloodEffect: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '60px',
    opacity: 0.8,
    animation: 'fadeOut 0.5s ease-out',
    pointerEvents: 'none',
    zIndex: 20,
  },
  puzzleArea: {
    marginTop: '20px',
  },
  header: {
    marginBottom: '25px',
  },
  scoreTimeContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    flexWrap: 'wrap',
    gap: '10px',
  },
  score: {
    color: '#ffd93d',
    background: 'rgba(0,0,0,0.3)',
    padding: '5px 12px',
    borderRadius: '20px',
  },
  timer: {
    color: '#ff6b6b',
    background: 'rgba(0,0,0,0.3)',
    padding: '5px 12px',
    borderRadius: '20px',
  },
  livesContainer: {
    color: '#ff4444',
    background: 'rgba(0,0,0,0.3)',
    padding: '5px 12px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  xpDisplay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
    padding: '8px',
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ffd93d',
  },
  xpBreakdown: {
    fontSize: '11px',
    color: '#aaa',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#1e1e2e',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    transition: 'width 0.3s ease',
    borderRadius: '4px',
  },
  progressText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#aaa',
  },
  equationCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: '16px',
    padding: '30px',
    textAlign: 'center',
  },
  difficultyBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
    marginBottom: '25px',
    color: '#fff',
    textTransform: 'uppercase',
  },
  mcContainer: {
    marginBottom: '25px',
  },
  mcQuestionText: {
    fontSize: '20px',
    color: '#fff',
    marginBottom: '25px',
    lineHeight: '1.4',
    whiteSpace: 'pre-line',
    textAlign: 'center',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  optionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px 20px',
    backgroundColor: '#2a2a4a',
    border: '2px solid #4a4a6a',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
    fontSize: '16px',
    color: '#fff',
  },
  optionLetter: {
    fontWeight: 'bold',
    fontSize: '18px',
    minWidth: '30px',
    color: '#ffd93d',
  },
  optionText: {
    flex: 1,
  },
  answerContainer: {
    marginBottom: '25px',
    padding: '25px',
    backgroundColor: '#0f0f1f',
    borderRadius: '16px',
    border: '2px solid #ff9800',
    boxShadow: '0 0 20px rgba(255, 152, 0, 0.3)',
  },
  answerSubmitButton: {
    padding: '18px 24px',
    fontSize: '18px',
    backgroundColor: '#ff4444',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  feedback: {
    padding: '12px',
    marginBottom: '15px',
    backgroundColor: '#2a2a4a',
    borderRadius: '10px',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#fff',
  },
  feedbackDeath: {
    padding: '12px',
    marginBottom: '15px',
    backgroundColor: '#8b0000',
    borderRadius: '10px',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#fff',
    fontWeight: 'bold',
  },
  hint: {
    padding: '12px',
    marginBottom: '15px',
    backgroundColor: '#ff9800',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#fff',
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #3a3a5a',
    flexWrap: 'wrap',
    gap: '10px',
  },
  attempts: {
    fontSize: '13px',
    color: '#aaa',
  },
  xpStats: {
    fontSize: '13px',
    color: '#ffd93d',
    fontWeight: 'bold',
  },
  hintButton: {
    padding: '6px 14px',
    fontSize: '12px',
    backgroundColor: '#4a6fa5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tipsCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: '12px',
    padding: '18px',
  },
  tipsTitle: {
    fontSize: '16px',
    marginBottom: '12px',
    color: '#ffd93d',
  },
  tipsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.8',
    color: '#ccc',
  },
  completionContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    padding: '20px',
  },
  completionCard: {
    backgroundColor: '#2a2a4a',
    borderRadius: '20px',
    padding: '35px',
    textAlign: 'center',
    maxWidth: '450px',
    width: '90%',
  },
  trophyIcon: {
    fontSize: '56px',
    marginBottom: '15px',
  },
  sadIcon: {
    fontSize: '56px',
    marginBottom: '15px',
  },
  completionTitle: {
    fontSize: '28px',
    marginBottom: '15px',
    color: '#ffd93d',
  },
  completionText: {
    fontSize: '16px',
    marginBottom: '20px',
    color: '#ccc',
  },
  finalScore: {
    backgroundColor: '#1e1e2e',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: '14px',
    lineHeight: '1.8',
  },
  continueButton: {
    padding: '10px 25px',
    fontSize: '14px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};

export default EscapeRoom;