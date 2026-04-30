// src/games/EquationEscapeRoom.jsx - FULLY RESPONSIVE (optimized for 308x748 and all screen sizes)
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

  useEffect(() => {
    const savedState = localStorage.getItem('equationEscapeRoomState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (Date.now() - parsedState.timestamp < twentyFourHours) setSavedGameState(parsedState);
        else localStorage.removeItem('equationEscapeRoomState');
      } catch (error) { console.error('Error loading saved game state:', error); }
    }
  }, []);

  const saveGameState = useCallback((gameState) => {
    const stateToSave = {
      currentPuzzle: gameState.currentPuzzle ?? 0,
      puzzlesCompleted: gameState.puzzlesCompleted ?? 0,
      challengeScore: gameState.challengeScore ?? 0,
      timeLeft: gameState.timeLeft ?? 360,
      attempts: gameState.attempts ?? 0,
      feedback: gameState.feedback || '',
      showHint: gameState.showHint || false,
      timestamp: Date.now(),
      gameActive: gameState.gameActive ?? true,
      shuffledPuzzles: gameState.shuffledPuzzles,
      correctAnswers: gameState.correctAnswers ?? 0,
      wrongAnswers: gameState.wrongAnswers ?? 0,
      lives: gameState.lives ?? 3,
      playerPosition: gameState.playerPosition ?? 0
    };
    localStorage.setItem('equationEscapeRoomState', JSON.stringify(stateToSave));
    setSavedGameState(stateToSave);
  }, []);

  const clearSavedGameState = useCallback(() => {
    localStorage.removeItem('equationEscapeRoomState');
    setSavedGameState(null);
    setShouldLoadSaved(false);
  }, []);

  const sendGameResult = useCallback((completed, timeRemaining, timeSpentSeconds, puzzlesCompletedCount, extraStats = {}) => {
    if (gameResultSent) return;
    const totalPuzzles = 10;
    const accuracy = extraStats?.accuracy || ((puzzlesCompletedCount / totalPuzzles) * 100).toFixed(1);
    const bonusPoints = extraStats?.bonusPoints || 0;
    const finalScore = extraStats?.finalScore || (completed ? 1000 : (puzzlesCompletedCount * 50));
    const gameResult = { type: 'GAME_RESULT', gameId: 'equation', completed: completed, score: finalScore, timeSpent: timeSpentSeconds, timestamp: new Date().toISOString(), stats: { puzzlesCompleted: puzzlesCompletedCount, totalPuzzles, completionPercentage: ((puzzlesCompletedCount / totalPuzzles) * 100).toFixed(1), accuracy, bonusPoints, finalScore, timeRemaining, playTime: timeSpentSeconds, ...extraStats } };
    if (window.opener) { window.opener.postMessage(gameResult, '*'); setGameResultSent(true); }
    const previousResults = localStorage.getItem('equationGameResults');
    const results = previousResults ? JSON.parse(previousResults) : [];
    results.push(gameResult);
    localStorage.setItem('equationGameResults', JSON.stringify(results.slice(-10)));
  }, [gameResultSent]);

  const handleBack = () => { if (activeGameMode !== 'start') setActiveGameMode('start'); };
  const startEscapeRoom = (loadSaved = false) => { setActiveGameMode('escape'); setGameStartTime(Date.now()); setShouldLoadSaved(loadSaved); setGameResultSent(false); setPlayTime(0); if (!loadSaved) clearSavedGameState(); };
  const handleEscapeComplete = useCallback((completed) => { if (completed) clearSavedGameState(); setActiveGameMode('start'); }, [clearSavedGameState]);
  const handleGameStateUpdate = useCallback((gameState) => { saveGameState(gameState); if (gameState.puzzlesCompleted !== undefined) setPuzzlesCompleted(gameState.puzzlesCompleted); if (gameState.challengeScore !== undefined) setChallengeScore(gameState.challengeScore); if (gameState.timeLeft !== undefined) setPlayTime(360 - gameState.timeLeft); }, [saveGameState]);
  const formatTimeRemaining = (timeLeft) => `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  useEffect(() => { return () => setGameStartTime(null); }, []);

  return (
    <div style={styles.container}>
      {activeGameMode !== 'start' && (<button onClick={handleBack} style={styles.backButton}><FaArrowLeft style={styles.backIcon} /><span style={styles.backText}>Back</span></button>)}
      {activeGameMode === 'start' && (<div style={styles.startContainer}><div style={styles.header}><h1 style={styles.title}>EQUATION ESCAPE</h1><p style={styles.subtitle}>Master Linear Equations & Escape!</p></div><div style={styles.modeSelection}><div style={styles.modeCards}><div style={styles.modeCard}><div style={styles.modeIcon}>🚪</div><h3 style={styles.modeCardTitle}>Escape Room</h3><p style={styles.modeDescription}>Solve 10 linear equation puzzles to escape in 6 minutes!</p><div style={styles.modeFeatures}><span style={styles.featureBadge}>⭐ 10 Puzzles</span><span style={styles.featureBadge}>⏱️ 6 Minutes</span><span style={styles.featureBadge}>🎯 Classic</span></div>{savedGameState && (<div style={styles.continueWrapper}><button onClick={() => startEscapeRoom(true)} style={styles.continueButton}><FaPlay style={styles.continueButtonIcon} /> Continue <span style={styles.continueBadge}>{savedGameState.puzzlesCompleted || 0}/10 • {formatTimeRemaining(savedGameState.timeLeft || 360)}</span></button></div>)}<div onClick={() => startEscapeRoom(false)} style={styles.modeDifficulty}>Start Game</div></div></div></div></div>)}
      {activeGameMode === 'escape' && (<div style={styles.gameFullContainer}><EscapeRoom onComplete={handleEscapeComplete} onScore={setChallengeScore} challengeScore={challengeScore} sendGameResult={sendGameResult} onGameStateUpdate={handleGameStateUpdate} savedGameState={shouldLoadSaved ? savedGameState : null} clearSavedState={clearSavedGameState} /></div>)}
    </div>
  );
};

const styles = {
  container: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', backgroundColor: '#1a1a2e', color: '#fff', fontFamily: 'Arial, sans-serif', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' },
  startContainer: { width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 16px', '@media (min-width: 769px)': { padding: '80px 20px' } },
  gameFullContainer: { width: '100%', minHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', '@media (min-width: 769px)': { padding: '20px' } },
  backButton: { position: 'fixed', top: '12px', left: '12px', backgroundColor: '#4a6fa5', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', zIndex: 1000, minHeight: '40px', '@media (min-width: 769px)': { top: '20px', left: '20px', padding: '10px 20px', fontSize: '14px', gap: '8px' } },
  backIcon: { fontSize: '12px', '@media (min-width: 769px)': { fontSize: '16px' } },
  backText: { fontWeight: 'bold' },
  header: { textAlign: 'center', marginBottom: '30px', width: '100%' },
  title: { fontSize: '28px', marginBottom: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 'bold', letterSpacing: '1px', padding: '0 16px', '@media (min-width: 769px)': { fontSize: '48px', marginBottom: '15px', letterSpacing: '2px' } },
  subtitle: { fontSize: '14px', color: '#aaa', fontWeight: '500', padding: '0 16px', '@media (min-width: 769px)': { fontSize: '20px' } },
  modeSelection: { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' },
  modeCards: { display: 'grid', gridTemplateColumns: '1fr', gap: '16px', maxWidth: '320px', width: '100%', '@media (min-width: 480px)': { maxWidth: '360px' }, '@media (min-width: 769px)': { maxWidth: '400px', gap: '25px' } },
  modeCard: { backgroundColor: '#2a2a4a', borderRadius: '12px', padding: '20px', textAlign: 'center', transition: 'all 0.3s', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', '@media (min-width: 769px)': { padding: '30px' } },
  modeCardTitle: { fontSize: '20px', marginBottom: '8px', color: '#ffd93d', fontWeight: 'bold', '@media (min-width: 769px)': { fontSize: '28px' } },
  modeDescription: { fontSize: '11px', color: '#ccc', marginBottom: '12px', lineHeight: '1.4', padding: '0 8px', '@media (min-width: 769px)': { fontSize: '16px', marginBottom: '18px' } },
  modeIcon: { fontSize: '40px', marginBottom: '10px', '@media (min-width: 769px)': { fontSize: '56px', marginBottom: '15px' } },
  modeFeatures: { display: 'flex', justifyContent: 'center', gap: '8px', margin: '10px 0', flexWrap: 'wrap' },
  featureBadge: { backgroundColor: '#4a6fa5', padding: '3px 8px', borderRadius: '16px', fontSize: '9px', fontWeight: 'bold', color: '#fff', '@media (min-width: 769px)': { padding: '5px 12px', fontSize: '12px' } },
  modeDifficulty: { display: 'inline-block', marginTop: '10px', padding: '8px 20px', backgroundColor: '#667eea', borderRadius: '25px', fontSize: '12px', fontWeight: 'bold', color: '#fff', cursor: 'pointer', transition: 'all 0.3s', '@media (min-width: 769px)': { marginTop: '12px', padding: '8px 20px', fontSize: '14px' } },
  continueWrapper: { marginBottom: '8px' },
  continueButton: { backgroundColor: '#ff9800', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold', width: '100%', minHeight: '36px', '@media (min-width: 769px)': { padding: '8px 16px', fontSize: '14px', gap: '8px' } },
  continueButtonIcon: { fontSize: '10px', '@media (min-width: 769px)': { fontSize: '12px' } },
  continueBadge: { backgroundColor: 'rgba(0,0,0,0.25)', padding: '2px 5px', borderRadius: '10px', fontSize: '9px', marginLeft: '4px', '@media (min-width: 769px)': { fontSize: '11px' } }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `button:hover { opacity: 0.9; } div[style*="cursor: pointer"]:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.4); } @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @media (max-width: 480px) { button { min-height: 40px; } }`;
document.head.appendChild(styleSheet);

export default EquationEscapeRoom;