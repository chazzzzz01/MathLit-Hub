// src/games/equation-function/EscapeRoom.jsx
import React, { useState, useEffect, useCallback } from 'react';

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

  // Original puzzles array
  const originalPuzzles = [
    { equation: "x + 5 = 12", answer: 7, hint: "Subtract 5 from both sides", explanation: "x = 12 - 5 = 7", difficulty: "Basic" },
    { equation: "x - 8 = 15", answer: 23, hint: "Add 8 to both sides", explanation: "x = 15 + 8 = 23", difficulty: "Basic" },
    { equation: "3x = 21", answer: 7, hint: "Divide both sides by 3", explanation: "x = 21 ÷ 3 = 7", difficulty: "Basic" },
    { equation: "x/4 = 6", answer: 24, hint: "Multiply both sides by 4", explanation: "x = 6 × 4 = 24", difficulty: "Basic" },
    { equation: "2x + 3 = 11", answer: 4, hint: "Subtract 3, then divide by 2", explanation: "2x = 8 → x = 4", difficulty: "Intermediate" },
    { equation: "5x - 7 = 18", answer: 5, hint: "Add 7, then divide by 5", explanation: "5x = 25 → x = 5", difficulty: "Intermediate" },
    { equation: "3x + 8 = 20", answer: 4, hint: "Subtract 8, then divide by 3", explanation: "3x = 12 → x = 4", difficulty: "Intermediate" },
    { equation: "4x - 9 = 15", answer: 6, hint: "Add 9, then divide by 4", explanation: "4x = 24 → x = 6", difficulty: "Intermediate" },
    { equation: "3x + 2 = x + 10", answer: 4, hint: "Subtract x, then subtract 2", explanation: "2x = 8 → x = 4", difficulty: "Advanced" },
    { equation: "5x - 3 = 2x + 12", answer: 5, hint: "Subtract 2x, then add 3", explanation: "3x = 15 → x = 5", difficulty: "Advanced" },
    { equation: "7x + 4 = 3x + 24", answer: 5, hint: "Subtract 3x, then subtract 4", explanation: "4x = 20 → x = 5", difficulty: "Advanced" },
    { equation: "2x + 5 = 4x - 3", answer: 4, hint: "Subtract 2x, then add 3", explanation: "8 = 2x → x = 4", difficulty: "Advanced" },
    { equation: "2(x + 3) = 14", answer: 4, hint: "Divide by 2, then subtract 3", explanation: "x + 3 = 7 → x = 4", difficulty: "Intermediate" },
    { equation: "3(x - 4) = 15", answer: 9, hint: "Divide by 3, then add 4", explanation: "x - 4 = 5 → x = 9", difficulty: "Intermediate" },
    { equation: "4(2x + 1) = 36", answer: 4, hint: "Divide by 4, then subtract 1, divide by 2", explanation: "2x + 1 = 9 → 2x = 8 → x = 4", difficulty: "Advanced" },
    { equation: "(x/2) + 3 = 8", answer: 10, hint: "Subtract 3, multiply by 2", explanation: "x/2 = 5 → x = 10", difficulty: "Intermediate" },
    { equation: "(2x/3) = 8", answer: 12, hint: "Multiply by 3, divide by 2", explanation: "2x = 24 → x = 12", difficulty: "Intermediate" },
    { equation: "(x/4) - 2 = 3", answer: 20, hint: "Add 2, multiply by 4", explanation: "x/4 = 5 → x = 20", difficulty: "Intermediate" },
    { equation: "Three times a number plus 5 equals 20", answer: 5, hint: "Equation: 3x + 5 = 20", explanation: "3x = 15 → x = 5", difficulty: "Advanced" },
    { equation: "Twice a number plus 7 equals 19", answer: 6, hint: "Equation: 2x + 7 = 19", explanation: "2x = 12 → x = 6", difficulty: "Advanced" }
  ];

  // Initialize puzzles - either from saved state or shuffled
  const [puzzles, setPuzzles] = useState(() => {
    if (savedGameState && savedGameState.shuffledPuzzles) {
      return savedGameState.shuffledPuzzles;
    }
    return shuffleArray(originalPuzzles);
  });

  const [currentPuzzle, setCurrentPuzzle] = useState(() => {
    if (savedGameState && savedGameState.currentPuzzle !== undefined) {
      return savedGameState.currentPuzzle;
    }
    return 0;
  });
  const [userAnswer, setUserAnswer] = useState('');
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
    return 360;
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

  // Track XP-related stats
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

  const totalPuzzles = puzzles.length;
  const xpSoFar = (correctAnswers * 10) - (wrongAnswers * 5);

  // ✅ Send real-time score updates to parent
  const sendScoreUpdate = useCallback(() => {
    if (window.parent !== window) {
      const progress = ((currentPuzzle) / totalPuzzles) * 100;
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
          xpEarned: xpSoFar
        }
      };
      window.parent.postMessage(scoreUpdate, '*');
      console.log('Sent score update to parent:', score);
    }
  }, [score, puzzlesCompleted, currentPuzzle, totalPuzzles, timeLeft, attempts, correctAnswers, wrongAnswers, xpSoFar]);

  // ✅ Send score update whenever score changes
  useEffect(() => {
    if (gameActive && !showCongratulations) {
      sendScoreUpdate();
    }
  }, [score, gameActive, showCongratulations, sendScoreUpdate]);

  // ✅ Handle messages from parent (like score requests)
  useEffect(() => {
    const handleMessage = (event) => {
      console.log('EscapeRoom received message:', event.data);
      
      if (event.data && event.data.type === 'REQUEST_SCORE') {
        const progress = ((currentPuzzle) / totalPuzzles) * 100;
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
            xpEarned: xpSoFar
          }
        };
        if (window.parent !== window) {
          window.parent.postMessage(scoreUpdate, '*');
        }
        console.log('Sent score response to parent:', score);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [score, puzzlesCompleted, currentPuzzle, totalPuzzles, timeLeft, attempts, correctAnswers, wrongAnswers, xpSoFar]);

  // Helper function to send game result to parent
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
        xpEarned: xpEarned
      }
    };

    console.log('=== SENDING EQUATION GAME RESULT ===');
    console.log('Final Score:', finalScore);
    console.log('Completed:', completed);
    console.log('Correct Answers:', correctAnswers);
    console.log('Wrong Answers:', wrongAnswers);
    console.log('XP Earned:', xpEarned);
    console.log('Game Result:', gameResult);
    
    if (window.parent !== window) {
      try {
        window.parent.postMessage(gameResult, '*');
        console.log('Game result sent to parent window (iframe)');
      } catch (error) {
        console.error('Error sending to parent:', error);
      }
    }
    
    if (window.opener) {
      try {
        window.opener.postMessage(gameResult, '*');
        console.log('Game result sent to opener window');
      } catch (error) {
        console.error('Error sending to opener:', error);
      }
    }
    
    if (sendGameResult) {
      sendGameResult(completed, finalScore, timeSpent, puzzlesCompletedCount, gameResult.stats);
    }
  }, [totalPuzzles, timeLeft, correctAnswers, wrongAnswers, sendGameResult]);

  // Helper function to save progress to localStorage
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
          xpBreakdown: xpBreakdown
        }
      };
      
      localStorage.setItem('gameProgress', JSON.stringify(progress));
      console.log('Progress saved to localStorage:', progress.equation);
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'gameProgress',
        newValue: JSON.stringify(progress),
        oldValue: existingProgress
      }));
      
      return progress;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [totalPuzzles, correctAnswers, wrongAnswers]);

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
        wrongAnswers
      });
    }
  }, [currentPuzzle, puzzlesCompleted, score, timeLeft, attempts, feedback, showHint, gameActive, puzzles, onGameStateUpdate, correctAnswers, wrongAnswers]);

  useEffect(() => {
    if (gameActive && timeLeft > 0 && currentPuzzle < totalPuzzles) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameActive(false);
            setFeedback("Time's up! Game over!");
            
            const timeSpent = 360;
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
  }, [gameActive, currentPuzzle, timeLeft, puzzlesCompleted, score, totalPuzzles, saveProgressToLocalStorage, sendResultToParent, onComplete]);

  const checkAnswer = useCallback(() => {
    if (!gameActive) return;
    
    const answer = parseFloat(userAnswer);
    const currentPuzzleData = puzzles[currentPuzzle];
    
    if (isNaN(answer)) {
      setFeedback("Please enter a valid number!");
      return;
    }
    
    const isCorrect = Math.abs(answer - currentPuzzleData.answer) < 0.01;
    
    // ✅ SEND XP UPDATE TO PARENT (CORRECT = +10 XP, WRONG = -5 XP)
    if (window.parent !== window) {
      const xpUpdate = {
        type: 'XP_UPDATE',
        gameId: 'equation',
        xpChange: isCorrect ? 10 : -5,
        isCorrect: isCorrect,
        correctAnswer: currentPuzzleData.answer,
        userAnswer: answer,
        equation: currentPuzzleData.equation,
        timestamp: new Date().toISOString()
      };
      window.parent.postMessage(xpUpdate, '*');
      console.log('Sent XP_UPDATE from Escape Room:', xpUpdate);
    }
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      
      const pointsEarned = 100;
      const newScore = score + pointsEarned;
      setScore(newScore);
      if (onScore) onScore(newScore);
      
      const newPuzzlesCompleted = puzzlesCompleted + 1;
      setPuzzlesCompleted(newPuzzlesCompleted);
      
      setFeedback(`✅ Correct! ${currentPuzzleData.explanation} (+10 XP!)`);
      setShowHint(false);
      setUserAnswer('');
      setAttempts(0);
      
      if (currentPuzzle + 1 < totalPuzzles) {
        setCurrentPuzzle(currentPuzzle + 1);
      } else {
        setGameActive(false);
        setShowCongratulations(true);
        
        const bonusPoints = Math.floor(timeLeft * 2);
        const finalScore = newScore + bonusPoints;
        setScore(finalScore);
        if (onScore) onScore(finalScore);
        
        const timeSpent = 360 - timeLeft;
        const accuracy = ((newPuzzlesCompleted / totalPuzzles) * 100).toFixed(1);
        
        setFeedback(`🎉 Congratulations! Bonus: +${bonusPoints} points!`);
        
        saveProgressToLocalStorage(true, finalScore, timeSpent, newPuzzlesCompleted, accuracy, bonusPoints);
        sendResultToParent(true, finalScore, timeSpent, newPuzzlesCompleted, accuracy, bonusPoints);
        
        if (onComplete) {
          onComplete(true);
        }
        if (clearSavedState) clearSavedState();
      }
    } else {
      setWrongAnswers(prev => prev + 1);
      
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 2) {
        setFeedback(`❌ Incorrect. Answer: ${currentPuzzleData.answer}. ${currentPuzzleData.explanation} (-5 XP!)`);
        setShowHint(true);
      } else {
        setFeedback(`❌ Incorrect. ${currentPuzzleData.hint} (-5 XP!)`);
      }
      setUserAnswer('');
    }
  }, [userAnswer, currentPuzzle, gameActive, score, puzzlesCompleted, timeLeft, attempts, puzzles, totalPuzzles, onScore, onComplete, saveProgressToLocalStorage, sendResultToParent, clearSavedState]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') checkAnswer();
  };

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

  if (showCongratulations) {
    const xpEarned = (correctAnswers * 10) - (wrongAnswers * 5);
    const bonusCompletionXP = 50;
    const totalXP = xpEarned + (puzzlesCompleted === totalPuzzles ? bonusCompletionXP : 0);
    
    return (
      <div style={styles.completionContainer}>
        <div style={styles.completionCard}>
          <div style={styles.trophyIcon}>🏆</div>
          <h2 style={styles.completionTitle}>You Escaped!</h2>
          <p style={styles.completionText}>Congratulations! You've mastered all {totalPuzzles} puzzles!</p>
          <div style={styles.finalScore}>
            <div>Final Score: {score}</div>
            <div>Time Remaining: {formatTime(timeLeft)}</div>
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
          <div style={styles.sadIcon}>😢</div>
          <h2 style={styles.completionTitle}>Game Over</h2>
          <p style={styles.completionText}>You couldn't escape this time. Try again!</p>
          <div style={styles.finalScore}>
            <div>Final Score: {score}</div>
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
  const progress = ((currentPuzzle) / totalPuzzles) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.scoreTimeContainer}>
          <div style={styles.score}>⭐ Score: {score}</div>
          <div style={styles.timer}>⏱️ {formatTime(timeLeft)}</div>
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
        <div style={styles.progressText}>Puzzle {currentPuzzle + 1} of {totalPuzzles}</div>
      </div>

      <div style={styles.centeredContent}>
        <div style={styles.equationCard}>
          <div style={{...styles.difficultyBadge, backgroundColor: getDifficultyColor(currentPuzzleData.difficulty)}}>
            {currentPuzzleData.difficulty}
          </div>
          
          <div style={styles.equationWrapper}>
            <div style={styles.equationLabel}>🔐 SOLVE FOR X</div>
            <div style={styles.equationText}>{currentPuzzleData.equation}</div>
          </div>

          <div style={styles.answerContainer}>
            <div style={styles.answerLabel}>📝 ENTER YOUR ANSWER</div>
            <div style={styles.answerInputWrapper}>
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer here... (+10 XP if correct, -5 XP if wrong)"
                style={styles.answerInput}
                autoFocus
              />
              <button onClick={checkAnswer} style={styles.answerSubmitButton}>
                ✓ SUBMIT
              </button>
            </div>
          </div>

          {feedback && <div style={styles.feedback}>{feedback}</div>}
          
          {showHint && (
            <div style={styles.hint}>
              <strong>💡 Hint:</strong> {currentPuzzleData.hint}
            </div>
          )}

          <div style={styles.stats}>
            <div style={styles.attempts}>📝 Attempts: {attempts}</div>
            <div style={styles.xpStats}>✅ {correctAnswers} correct | ❌ {wrongAnswers} wrong</div>
            <button onClick={() => setShowHint(!showHint)} style={styles.hintButton}>
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
          </div>
        </div>

        <div style={styles.tipsCard}>
          <h4 style={styles.tipsTitle}>📚 Solving Tips</h4>
          <ul style={styles.tipsList}>
            <li>✓ Isolate the variable (x) on one side</li>
            <li>✓ Perform the same operation on both sides</li>
            <li>✓ Check your answer by plugging it back in</li>
            <li>⭐ +10 XP per correct answer, -5 XP per wrong answer</li>
            {currentPuzzleData.difficulty === 'Basic' && <li>✓ Use inverse operations</li>}
            {currentPuzzleData.difficulty === 'Intermediate' && <li>✓ Combine like terms first</li>}
            {currentPuzzleData.difficulty === 'Advanced' && <li>✓ Get all x terms on one side</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    width: '95%',
    margin: '20px auto',
    padding: '30px',
    backgroundColor: '#2a2a4a',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
  },
  header: {
    marginBottom: '25px',
  },
  scoreTimeContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
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
  centeredContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
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
  equationWrapper: {
    marginBottom: '25px',
    padding: '30px',
    backgroundColor: '#0a0a1a',
    borderRadius: '12px',
    border: '2px solid #4caf50',
    boxShadow: '0 0 15px rgba(76, 175, 80, 0.2)',
  },
  equationLabel: {
    fontSize: '11px',
    color: '#ffd93d',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginBottom: '12px',
    fontWeight: 'bold',
  },
  equationText: {
    fontSize: '32px',
    margin: '0',
    color: '#fff',
    fontFamily: 'monospace',
    textAlign: 'center',
    fontWeight: 'bold',
    wordBreak: 'break-word',
    lineHeight: '1.3',
  },
  answerContainer: {
    marginBottom: '25px',
    padding: '25px',
    backgroundColor: '#0f0f1f',
    borderRadius: '16px',
    border: '2px solid #ff9800',
    boxShadow: '0 0 20px rgba(255, 152, 0, 0.3)',
  },
  answerLabel: {
    fontSize: '14px',
    color: '#ff9800',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginBottom: '15px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  answerInputWrapper: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
  },
  answerInput: {
    flex: 2,
    padding: '18px 20px',
    fontSize: '18px',
    border: '2px solid #ff9800',
    borderRadius: '12px',
    backgroundColor: '#fff',
    color: '#333',
    outline: 'none',
    transition: 'all 0.3s',
    fontWeight: '500',
    textAlign: 'center',
  },
  answerSubmitButton: {
    flex: 1,
    padding: '18px 24px',
    fontSize: '16px',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
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