// src/games/EquationEscapeRoom.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlay, FaSave } from 'react-icons/fa';
import EscapeRoom from './equation-function/EscapeRoom.jsx';

const EquationEscapeRoom = () => {
  const navigate = useNavigate();
  const [activeGameMode, setActiveGameMode] = useState('start');
  const [challengeScore, setChallengeScore] = useState(0);
  const [gameResultSent, setGameResultSent] = useState(false);
  const [puzzlesCompleted, setPuzzlesCompleted] = useState(0);
  const [playTime, setPlayTime] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [savedGameState, setSavedGameState] = useState(null);
  const [shouldLoadSaved, setShouldLoadSaved] = useState(false);

  // Check for saved game state on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('equationEscapeRoomState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (Date.now() - parsedState.timestamp < twentyFourHours) {
          setSavedGameState(parsedState);
        } else {
          localStorage.removeItem('equationEscapeRoomState');
        }
      } catch (error) {
        console.error('Error loading saved game state:', error);
      }
    }
  }, []);

  const saveGameState = useCallback((gameState) => {
    const stateToSave = {
      currentPuzzle: gameState.currentPuzzle !== undefined ? gameState.currentPuzzle : 0,
      puzzlesCompleted: gameState.puzzlesCompleted !== undefined ? gameState.puzzlesCompleted : 0,
      challengeScore: gameState.challengeScore !== undefined ? gameState.challengeScore : 0,
      timeLeft: gameState.timeLeft !== undefined ? gameState.timeLeft : 360,
      attempts: gameState.attempts !== undefined ? gameState.attempts : 0,
      feedback: gameState.feedback || '',
      showHint: gameState.showHint || false,
      timestamp: Date.now(),
      gameActive: gameState.gameActive !== undefined ? gameState.gameActive : true,
      shuffledPuzzles: gameState.shuffledPuzzles
    };
    localStorage.setItem('equationEscapeRoomState', JSON.stringify(stateToSave));
    setSavedGameState(stateToSave);
  }, []);

  const clearSavedGameState = useCallback(() => {
    localStorage.removeItem('equationEscapeRoomState');
    setSavedGameState(null);
    setShouldLoadSaved(false);
  }, []);

  // Only send result from wrapper, not from EscapeRoom
  const sendGameResult = useCallback((completed, timeRemaining, timeSpentSeconds, puzzlesCompletedCount, extraStats = {}) => {
    if (gameResultSent) return;
    
    const totalPuzzles = 20;
    const accuracy = extraStats?.accuracy || ((puzzlesCompletedCount / totalPuzzles) * 100).toFixed(1);
    const bonusPoints = extraStats?.bonusPoints || 0;
    const finalScore = extraStats?.finalScore || (completed ? 1000 : (puzzlesCompletedCount * 50));
    
    const gameResult = {
      type: 'GAME_RESULT',
      gameId: 'equation',
      completed: completed,
      score: finalScore,
      timeSpent: timeSpentSeconds,
      timestamp: new Date().toISOString(),
      stats: {
        puzzlesCompleted: puzzlesCompletedCount,
        totalPuzzles: totalPuzzles,
        completionPercentage: ((puzzlesCompletedCount / totalPuzzles) * 100).toFixed(1),
        accuracy: accuracy,
        bonusPoints: bonusPoints,
        finalScore: finalScore,
        timeRemaining: timeRemaining,
        playTime: timeSpentSeconds,
        ...extraStats
      }
    };
    
    console.log('Sending equation game result from wrapper:', gameResult);
    
    // Send to parent window (Games component)
    if (window.opener) {
      window.opener.postMessage(gameResult, '*');
      console.log('Game result sent to parent window from wrapper');
      setGameResultSent(true);
    } else {
      console.warn('No window.opener found in wrapper');
    }
    
    // Also store in localStorage for debugging
    const previousResults = localStorage.getItem('equationGameResults');
    const results = previousResults ? JSON.parse(previousResults) : [];
    results.push(gameResult);
    localStorage.setItem('equationGameResults', JSON.stringify(results.slice(-10)));
  }, [gameResultSent]);

  const handleBack = () => {
    if (activeGameMode !== 'start') {
      setActiveGameMode('start');
    }
  };

  const startEscapeRoom = (loadSaved = false) => {
    setActiveGameMode('escape');
    setGameStartTime(Date.now());
    setShouldLoadSaved(loadSaved);
    setGameResultSent(false);
    setPlayTime(0); // Reset play time when starting new game
    
    if (!loadSaved) {
      clearSavedGameState();
    }
  };

  const handleEscapeComplete = useCallback((completed) => {
    if (completed) {
      clearSavedGameState();
    }
    setActiveGameMode('start');
  }, [clearSavedGameState]);

  const handleGameStateUpdate = useCallback((gameState) => {
    saveGameState(gameState);
    
    if (gameState.puzzlesCompleted !== undefined) {
      setPuzzlesCompleted(gameState.puzzlesCompleted);
    }
    if (gameState.challengeScore !== undefined) {
      setChallengeScore(gameState.challengeScore);
    }
    if (gameState.timeLeft !== undefined) {
      // Calculate elapsed time (6 minutes = 360 seconds)
      const elapsedTime = 360 - gameState.timeLeft;
      setPlayTime(elapsedTime);
    }
  }, [saveGameState]);

  const formatTimeRemaining = (timeLeft) => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear any intervals or timeouts if needed
      setGameStartTime(null);
    };
  }, []);

  return (
    <div style={styles.container}>
      {activeGameMode !== 'start' && (
        <button onClick={handleBack} style={styles.backButton}>
          <FaArrowLeft style={styles.backIcon} />
          <span style={styles.backText}>Back to Menu</span>
        </button>
      )}

      {activeGameMode === 'start' && (
        <div style={styles.startContainer}>
          <div style={styles.header}>
            <h1 style={styles.title}>EQUATION ESCAPE ROOM</h1>
            <p style={styles.subtitle}>Master Linear Equations & Escape!</p>
          </div>
          <div style={styles.modeSelection}>
            <div style={styles.modeCards}>
              <div style={styles.modeCard}>
                <div style={styles.modeIcon}>🚪</div>
                <h3 style={styles.modeCardTitle}>Escape Room</h3>
                <p style={styles.modeDescription}>Solve 20 linear equation puzzles to escape the room in 6 minutes!</p>
                <div style={styles.modeFeatures}>
                  <span style={styles.featureBadge}>⭐ 20 Puzzles</span>
                  <span style={styles.featureBadge}>⏱️ 6 Minutes</span>
                  <span style={styles.featureBadge}>🎯 Classic Mode</span>
                </div>
                
                {savedGameState && (
                  <div style={styles.continueWrapper}>
                    <button 
                      onClick={() => startEscapeRoom(true)} 
                      style={styles.continueButton}
                    >
                      <FaPlay style={styles.continueButtonIcon} />
                      Continue Game
                      <span style={styles.continueBadge}>
                        {savedGameState.puzzlesCompleted || 0}/20 • {formatTimeRemaining(savedGameState.timeLeft || 360)}
                      </span>
                    </button>
                  </div>
                )}
                
                <div onClick={() => startEscapeRoom(false)} style={styles.modeDifficulty}>
                  Click to start
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeGameMode === 'escape' && (
        <div style={styles.gameFullContainer}>
          <EscapeRoom 
            onComplete={handleEscapeComplete}
            onScore={setChallengeScore}
            challengeScore={challengeScore}
            sendGameResult={sendGameResult}
            onGameStateUpdate={handleGameStateUpdate}
            savedGameState={shouldLoadSaved ? savedGameState : null}
            clearSavedState={clearSavedGameState}
          />
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },
  startContainer: {
    width: '100%',
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '80px 20px',
  },
  gameFullContainer: {
    width: '100%',
    minHeight: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  backButton: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    backgroundColor: '#4a6fa5',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s',
    zIndex: 1000,
  },
  backIcon: {
    fontSize: '16px',
  },
  backText: {
    fontWeight: 'bold',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    width: '100%',
  },
  title: {
    fontSize: '48px',
    marginBottom: '15px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: 'bold',
    letterSpacing: '2px',
    lineHeight: '1.2',
    padding: '0 20px',
  },
  subtitle: {
    fontSize: '20px',
    color: '#aaa',
    fontWeight: '500',
    lineHeight: '1.4',
    padding: '0 20px',
  },
  modeSelection: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modeCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '25px',
    maxWidth: '400px',
    width: '100%',
  },
  modeCard: {
    backgroundColor: '#2a2a4a',
    borderRadius: '15px',
    padding: '30px 30px',
    textAlign: 'center',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    position: 'relative',
  },
  modeCardTitle: {
    fontSize: '28px',
    marginBottom: '12px',
    color: '#ffd93d',
    fontWeight: 'bold',
    lineHeight: '1.3',
  },
  modeDescription: {
    fontSize: '16px',
    color: '#ccc',
    marginBottom: '18px',
    lineHeight: '1.5',
    padding: '0 10px',
  },
  modeIcon: {
    fontSize: '56px',
    marginBottom: '15px',
  },
  modeFeatures: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    margin: '15px 0',
    flexWrap: 'wrap',
  },
  featureBadge: {
    backgroundColor: '#4a6fa5',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#fff',
    whiteSpace: 'nowrap',
  },
  modeDifficulty: {
    display: 'inline-block',
    marginTop: '12px',
    padding: '8px 20px',
    backgroundColor: '#667eea',
    borderRadius: '25px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  continueWrapper: {
    marginBottom: '8px',
  },
  continueButton: {
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '25px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    width: '100%',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  },
  continueButtonIcon: {
    fontSize: '12px',
  },
  continueBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: '2px 6px',
    borderRadius: '12px',
    fontSize: '11px',
    marginLeft: '6px',
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  button:hover {
    opacity: 0.9;
  }
  
  div[style*="cursor: pointer"]:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);

export default EquationEscapeRoom;