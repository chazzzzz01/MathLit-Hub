 
import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaTrash, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { GiPuzzle, GiSwordsEmblem, GiConsoleController } from 'react-icons/gi';
import { useOutletContext } from 'react-router-dom';

function Games() {
  const { user, userData, updateUserData } = useOutletContext() || {};
  const [gameProgress, setGameProgress] = useState({
    equation: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 },
    battle: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 },
    spaceShooter: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 }
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [showDetailedProgress, setShowDetailedProgress] = useState(false);
  const iframeRef = useRef(null);
  const [currentScore, setCurrentScore] = useState(null);
  const [xpPoints, setXpPoints] = useState(userData?.xp || 0);
  const [notification, setNotification] = useState(null);

  const updateXP = (points, reason = '') => {
    const newXP = Math.max(0, (xpPoints + points));
    setXpPoints(newXP);
    
    if (updateUserData) {
      updateUserData({ 
        ...userData,
        xp: newXP,
        lastXPUpdate: {
          points: points,
          reason: reason,
          timestamp: new Date().toISOString(),
          newTotal: newXP
        }
      });
    }
    
    if (points > 0) {
      showNotification(`+${points} XP! ${reason}`, '#10b981');
    } else if (points < 0) {
      showNotification(`${points} XP (${reason})`, '#ef4444');
    }
  };

  useEffect(() => {
    if (userData?.gameProgress) {
      setGameProgress(userData.gameProgress);
    } else {
      const savedProgress = localStorage.getItem('gameProgress');
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        const updated = {
          equation: { ...parsed.equation, lastScore: parsed.equation?.lastScore || 0 },
          battle: { ...parsed.battle, lastScore: parsed.battle?.lastScore || 0 },
          spaceShooter: { ...parsed.spaceShooter, lastScore: parsed.spaceShooter?.lastScore || 0 }
        };
        setGameProgress(updated);
      }
    }
    if (userData?.xp !== undefined) {
      setXpPoints(userData.xp);
    }
  }, [userData]);

  const saveGameScore = (gameId, score, completed = false, stats = {}) => {
    setGameProgress(prevProgress => {
      const currentGameProgress = prevProgress[gameId] || {
        completed: false,
        highScore: 0,
        attempts: 0,
        bestTime: null,
        lastPlayed: null,
        lastScore: 0
      };
      
      const newHighScore = Math.max(currentGameProgress.highScore || 0, score || 0);
      const isCompleted = completed || currentGameProgress.completed;
      
      const shouldIncrementAttempts = !currentGameProgress.lastGameStats || 
                                      Date.now() - new Date(currentGameProgress.lastPlayed || 0).getTime() > 60000;
      
      if (stats.correctAnswers !== undefined || stats.wrongAnswers !== undefined) {
        const correctAnswers = stats.correctAnswers || 0;
        const wrongAnswers = stats.wrongAnswers || 0;
        const xpGain = (correctAnswers * 10) - (wrongAnswers * 5);
        if (xpGain !== 0) updateXP(xpGain, `${gameId} game: ${correctAnswers} correct, ${wrongAnswers} wrong`);
      }
      
      if (completed && !currentGameProgress.completed) {
        updateXP(50, `Completed ${gameId} game!`);
        showNotification(`🎉 Bonus 50 XP!`, '#f59e0b');
      }
      
      if (score > currentGameProgress.highScore && currentGameProgress.highScore > 0) {
        const bonusXP = Math.floor(score / 10);
        updateXP(bonusXP, `New high score in ${gameId}!`);
        showNotification(`🏆 New High Score! +${bonusXP} XP!`, '#f59e0b');
      }
      
      const updatedProgress = {
        ...prevProgress,
        [gameId]: {
          ...currentGameProgress,
          completed: isCompleted,
          highScore: newHighScore,
          lastScore: score,
          attempts: shouldIncrementAttempts ? (currentGameProgress.attempts || 0) + 1 : currentGameProgress.attempts,
          lastPlayed: new Date().toISOString(),
          lastGameStats: { ...stats, finalScore: score, savedAt: new Date().toISOString() }
        }
      };
      
      localStorage.setItem('gameProgress', JSON.stringify(updatedProgress));
      const totalScores = calculateTotalScores(updatedProgress);
      
      if (updateUserData) {
        updateUserData({ ...userData, gameProgress: updatedProgress, xp: xpPoints, totalScores });
      }
      return updatedProgress;
    });
  };
  
  const calculateTotalScores = (progress) => {
    if (!progress) return 0;
    const equationScore = progress.equation?.highScore || 0;
    const battleScore = progress.battle?.highScore || 0;
    const spaceScore = progress.spaceShooter?.highScore || 0;
    return equationScore + battleScore + spaceScore;
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SCORE_UPDATE') {
        const { gameId, score, stats } = event.data;
        setCurrentScore(score);
        saveGameScore(gameId, score, false, stats);
        showNotification(`🎯 Score: ${score}`, '#3b82f6');
      }
      if (event.data && event.data.type === 'GAME_RESULT') {
        const { gameId, completed, score, stats } = event.data;
        saveGameScore(gameId, score, completed, stats);
        setCurrentScore(score);
        if (completed) {
          showNotification(`🏆 Completed! Score: ${score}`, '#10b981');
          setTimeout(() => closeGame(), 2000);
        } else {
          showNotification(`💀 Game Over! Score: ${score}`, '#ef4444');
        }
      }
      if (event.data && event.data.type === 'ANSWER_RESULT') {
        const { isCorrect, gameId, pointsEarned = 10 } = event.data;
        if (isCorrect) {
          updateXP(pointsEarned, `Correct in ${gameId}!`);
          showNotification(`✓ Correct! +${pointsEarned} XP`, '#10b981');
        } else {
          updateXP(-5, `Wrong in ${gameId}`);
          showNotification(`✗ Wrong! -5 XP`, '#ef4444');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [xpPoints, userData, updateUserData]);

  const showNotification = (message, color) => {
    const id = Date.now();
    setNotification({ id, message, color });
    setTimeout(() => setNotification(prev => prev?.id === id ? null : prev), 3000);
  };

  const resetAllProgress = () => {
    const resetProgress = {
      equation: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 },
      battle: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 },
      spaceShooter: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 }
    };
    
    setGameProgress(resetProgress);
    localStorage.setItem('gameProgress', JSON.stringify(resetProgress));
    
    const resetXP = window.confirm('Reset XP points to 0 as well?');
    if (resetXP) {
      setXpPoints(0);
      if (updateUserData) updateUserData({ ...userData, gameProgress: resetProgress, xp: 0, totalScores: 0 });
      if (user?.email) {
        localStorage.setItem(`userXP_${user.email}`, '0');
        localStorage.setItem(`userTotalScores_${user.email}`, '0');
      }
      showNotification('🗑️ All progress and XP reset!', '#10b981');
    } else {
      if (updateUserData) updateUserData({ ...userData, gameProgress: resetProgress });
      showNotification('🗑️ Game progress reset! (XP kept)', '#10b981');
    }
    setShowResetConfirm(false);
    window.dispatchEvent(new CustomEvent('progressReset', { detail: { reset: true, timestamp: Date.now(), resetXP } }));
  };

  const closeGame = () => {
    setGameModalOpen(false);
    setActiveGame(null);
    setCurrentScore(null);
    showNotification('💾 Game closed. Progress saved!', '#3b82f6');
  };

  const calculateOverallProgress = () => {
    const games = ['equation', 'battle', 'spaceShooter'];
    let totalProgress = 0;
    games.forEach(gameId => {
      const game = gameProgress[gameId];
      if (!game) return;
      const completionScore = game.completed ? 100 : 0;
      const maxScores = { equation: 1000, battle: 1000, spaceShooter: 1000 };
      const highScorePercent = Math.min(100, (game.highScore / maxScores[gameId]) * 100);
      const attemptsScore = Math.min(100, (game.attempts / 3) * 100);
      totalProgress += (completionScore * 0.5) + (highScorePercent * 0.3) + (attemptsScore * 0.2);
    });
    return totalProgress / games.length;
  };

  const ProgressDashboard = () => {
    const totalGames = Object.keys(games).length;
    const completedGames = Object.values(gameProgress).filter(game => game.completed === true).length;
    const totalHighScore = Object.values(gameProgress).reduce((sum, game) => sum + (game.highScore || 0), 0);
    const totalAttempts = Object.values(gameProgress).reduce((sum, game) => sum + (game.attempts || 0), 0);
    const overallProgress = calculateOverallProgress();
    const userName = user?.name || user?.email?.split('@')[0] || 'Student';

    return (
      <div style={styles.dashboardContainer}>
        <div style={styles.dashboardHeader}>
          <GiConsoleController style={styles.dashboardIcon} />
          <div style={styles.headerText}>
            <h2 style={styles.dashboardTitle}>Your Progress</h2>
            <p style={styles.userInfoText}>Welcome, {userName}!</p>
          </div>
          <div style={styles.xpDisplay}>
            <span style={styles.xpIcon}>⭐</span>
            <span style={styles.xpValue}>{xpPoints} XP</span>
          </div>
          <button onClick={() => setShowResetConfirm(true)} style={styles.resetButton}>
            <FaTrash style={styles.resetIcon} /><span>Reset</span>
          </button>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}><div style={styles.statCardIcon}>🎮</div><div style={styles.statCardInfo}><div style={styles.statCardValue}>{completedGames}/{totalGames}</div><div style={styles.statCardLabel}>Completed</div></div></div>
          <div style={styles.statCard}><div style={styles.statCardIcon}>🏆</div><div style={styles.statCardInfo}><div style={styles.statCardValue}>{totalHighScore}</div><div style={styles.statCardLabel}>Total Score</div></div></div>
          <div style={styles.statCard}><div style={styles.statCardIcon}>🎯</div><div style={styles.statCardInfo}><div style={styles.statCardValue}>{totalAttempts}</div><div style={styles.statCardLabel}>Attempts</div></div></div>
          <div style={styles.statCard}><div style={styles.statCardIcon}>📊</div><div style={styles.statCardInfo}><div style={styles.statCardValue}>{Math.round(overallProgress)}%</div><div style={styles.statCardLabel}>Progress</div></div></div>
        </div>

        <div style={styles.dropdownContainer}>
          <button style={styles.dropdownHeader} onClick={() => setShowDetailedProgress(!showDetailedProgress)}>
            <div style={styles.dropdownTitleSection}>
              <span style={styles.dropdownIcon}>📊</span>
              <span style={styles.dropdownTitle}>Game Details</span>
              <span style={styles.dropdownBadge}>{Object.values(gameProgress).filter(g => g.completed).length}/3</span>
            </div>
            {showDetailedProgress ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
          </button>
          
          {showDetailedProgress && (
            <div style={styles.dropdownContent}>
              {Object.entries(gameProgress).map(([gameId, progress]) => {
                const maxScore = { equation: 1000, battle: 1000, spaceShooter: 1000 }[gameId];
                const gameTitle = { equation: 'Equation Escape', battle: 'Math Battle', spaceShooter: 'Space Shooter' }[gameId];
                const highScorePercent = Math.min(100, (progress.highScore / maxScore) * 100);
                const attemptsPercent = Math.min(100, (progress.attempts / 3) * 100);
                return (
                  <div key={gameId} style={styles.progressItem}>
                    <div style={styles.progressHeader}><span style={styles.progressGameTitle}>{gameTitle}</span><span style={styles.progressStats}>{progress.completed ? '✓' : '○'} | Score: {progress.highScore} | Attempts: {progress.attempts}</span></div>
                    <div style={styles.progressBarContainer}>
                      <div style={styles.progressLabels}><span>Complete</span><span>{progress.completed ? '100%' : '0%'}</span></div>
                      <div style={styles.progressBarBackground}><div style={{...styles.progressBarFill, width: progress.completed ? '100%' : '0%', backgroundColor: '#10b981'}} /></div>
                      <div style={styles.progressLabels}><span>High Score</span><span>{Math.round(highScorePercent)}%</span></div>
                      <div style={styles.progressBarBackground}><div style={{...styles.progressBarFill, width: `${highScorePercent}%`, backgroundColor: '#f59e0b'}} /></div>
                      <div style={styles.progressLabels}><span>Engagement</span><span>{Math.round(attemptsPercent)}%</span></div>
                      <div style={styles.progressBarBackground}><div style={{...styles.progressBarFill, width: `${attemptsPercent}%`, backgroundColor: '#3b82f6'}} /></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const GameCard = ({ game, onStart }) => {
    const progress = gameProgress[game.id];
    const highScore = progress?.highScore || 0;
    
    return (
      <div style={styles.cardContainer}>
        <div style={styles.cardContent}>
          <div style={styles.cardLeft}>
            <div style={{...styles.cardIcon, backgroundColor: game.bgColor, color: game.color}}>{game.icon}</div>
            <div style={styles.cardText}>
              <div style={styles.cardHeader}><h2 style={styles.cardTitle}>{game.title}</h2><span style={styles.difficultyBadge}>{game.difficulty}</span></div>
              <p style={styles.cardDescription}>{game.description}</p>
              <div style={styles.featuresList}>{game.features.map((f, i) => <span key={i} style={styles.featureTag}>{f}</span>)}</div>
              <div style={styles.cardMeta}><span style={styles.timeEstimate}>⏱️ {game.timeEstimate}</span>{progress?.completed && <span style={styles.completedBadge}>✓ Completed</span>}{highScore > 0 && <span style={styles.bestScore}>🏆 {highScore}</span>}</div>
            </div>
          </div>
          <button style={styles.startButton} onClick={() => onStart(game.id)}><FaPlay style={styles.playIcon} /> Play</button>
        </div>
      </div>
    );
  };

  const games = {
    equation: { id: 'equation', title: "Equation Escape", description: "Solve linear equations to escape each room!", icon: <GiPuzzle size={36} />, color: "#3b82f6", bgColor: "#dbeafe", difficulty: "Easy", timeEstimate: "15 min", features: ["Levels", "Timed", "Hints"], path: "/game/equation" },
    battle: { id: 'battle', title: "Math Battle", description: "Epic turn-based combat! Solve equations to attack!", icon: <GiSwordsEmblem size={36} />, color: "#8b5cf6", bgColor: "#ede9fe", difficulty: "Hard", timeEstimate: "25 min", features: ["Combat", "Power-ups", "Bosses"], path: "/game/battle" },
    spaceShooter: { id: 'spaceShooter', title: "Space Shooter", description: "Defend your ship by solving math problems!", icon: <GiConsoleController size={36} />, color: "#f59e0b", bgColor: "#fef3c7", difficulty: "Medium", timeEstimate: "20 min", features: ["Action", "Upgrades", "Enemies"], path: "/game/spaceshooter" }
  };

  const handleStartGame = (gameId) => {
    const gamePath = games[gameId].path;
    setActiveGame(gameId);
    setGameModalOpen(true);
    setCurrentScore(null);
  };

  const renderActiveGame = () => {
    if (!activeGame || !gameModalOpen) return null;
    const game = games[activeGame];
    return (
      <div style={styles.gameModalOverlay}>
        <div style={styles.gameModalContainer}>
          <div style={styles.gameModalHeader}>
            <div style={styles.gameModalTitleSection}>
              <div style={styles.gameModalIcon}>{game.icon}</div>
              <div><h2 style={styles.gameModalTitle}>{game.title}</h2><p style={styles.gameModalSubtitle}>{currentScore !== null ? <span style={{color:'#ffd93d'}}>🎯 Score: {currentScore}</span> : '+10 XP/correct, -5 XP/wrong'}</p></div>
            </div>
            <button onClick={closeGame} style={styles.closeButton}><FaTimes /></button>
          </div>
          <div style={styles.gameModalContent}><iframe ref={iframeRef} src={game.path} style={styles.gameIframe} title={game.title} allowFullScreen /></div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <ProgressDashboard />
      <div style={styles.gamesGrid}>{Object.values(games).map(game => <GameCard key={game.id} game={game} onStart={handleStartGame} />)}</div>
      {renderActiveGame()}
      {notification && <div style={{...styles.notification, backgroundColor: notification.color}}>{notification.message}</div>}
      {showResetConfirm && (<div style={styles.modalOverlay} onClick={() => setShowResetConfirm(false)}><div style={styles.modalContent} onClick={(e) => e.stopPropagation()}><h3 style={styles.modalTitle}>Reset All Progress?</h3><p style={styles.modalText}>This cannot be undone. All progress and scores will be deleted.</p><div style={styles.modalButtons}><button onClick={() => setShowResetConfirm(false)} style={styles.modalCancelButton}>Cancel</button><button onClick={resetAllProgress} style={styles.modalConfirmButton}>Reset Everything</button></div></div></div>)}
    </div>
  );
}

export const getGameTotalScores = (gameProgress) => {
  if (!gameProgress) return { totalHighScore: 0, totalLastScores: 0, equationScore: 0, battleScore: 0, spaceShooterScore: 0 };
  return {
    totalHighScore: Object.values(gameProgress).reduce((sum, g) => sum + (g.highScore || 0), 0),
    totalLastScores: Object.values(gameProgress).reduce((sum, g) => sum + (g.lastScore || 0), 0),
    equationScore: gameProgress.equation?.highScore || 0,
    battleScore: gameProgress.battle?.highScore || 0,
    spaceShooterScore: gameProgress.spaceShooter?.highScore || 0
  };
};

const styles = {
  container: { width: '100%', maxWidth: '100%', margin: '0', padding: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#f3f4f6', minHeight: '100vh', boxSizing: 'border-box', '@media (min-width: 769px)': { padding: '24px', maxWidth: '1400px', margin: '0 auto' } },
  dashboardContainer: { background: 'white', borderRadius: '12px', padding: '14px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', '@media (min-width: 769px)': { padding: '24px', marginBottom: '30px', borderRadius: '16px' } },
  dashboardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', '@media (min-width: 640px)': { gap: '12px' } },
  headerText: { flex: '1', minWidth: '120px' },
  userInfoText: { fontSize: '10px', color: '#6b7280', margin: '4px 0 0 0', '@media (min-width: 769px)': { fontSize: '14px' } },
  dashboardIcon: { fontSize: '20px', color: '#3b82f6', '@media (min-width: 769px)': { fontSize: '28px' } },
  dashboardTitle: { fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0, '@media (min-width: 769px)': { fontSize: '24px' } },
  xpDisplay: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fef3c7', padding: '4px 10px', borderRadius: '16px', fontWeight: 'bold', '@media (min-width: 769px)': { padding: '8px 16px', gap: '8px' } },
  xpIcon: { fontSize: '14px', '@media (min-width: 769px)': { fontSize: '20px' } },
  xpValue: { fontSize: '14px', color: '#f59e0b', '@media (min-width: 769px)': { fontSize: '18px' } },
  resetButton: { padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '500', minHeight: '36px', '@media (min-width: 769px)': { padding: '8px 16px', fontSize: '14px', gap: '8px' } },
  resetIcon: { fontSize: '10px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px', '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }, '@media (min-width: 769px)': { gap: '15px', marginBottom: '30px' } },
  statCard: { background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', '@media (min-width: 769px)': { padding: '20px', gap: '15px' } },
  statCardIcon: { fontSize: '22px', color: '#3b82f6', '@media (min-width: 769px)': { fontSize: '32px' } },
  statCardInfo: { flex: 1 },
  statCardValue: { fontSize: '20px', fontWeight: 'bold', color: '#1f2937', lineHeight: 1, '@media (min-width: 769px)': { fontSize: '28px' } },
  statCardLabel: { fontSize: '10px', color: '#6b7280', marginTop: '3px', '@media (min-width: 769px)': { fontSize: '13px', marginTop: '5px' } },
  dropdownContainer: { marginTop: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' },
  dropdownHeader: { width: '100%', padding: '12px', backgroundColor: '#f9fafb', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#1f2937', fontFamily: 'inherit', '@media (min-width: 769px)': { padding: '16px 20px', fontSize: '16px' } },
  dropdownTitleSection: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  dropdownIcon: { fontSize: '14px', '@media (min-width: 769px)': { fontSize: '20px' } },
  dropdownTitle: { fontWeight: '600', fontSize: '12px', '@media (min-width: 769px)': { fontSize: '16px' } },
  dropdownBadge: { padding: '2px 8px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '16px', fontSize: '10px', fontWeight: '500', '@media (min-width: 769px)': { padding: '4px 12px', fontSize: '12px' } },
  dropdownContent: { padding: '12px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb', '@media (min-width: 769px)': { padding: '20px' } },
  progressItem: { marginBottom: '12px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '8px', '@media (min-width: 769px)': { marginBottom: '20px', padding: '15px' } },
  progressHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' },
  progressGameTitle: { fontSize: '13px', fontWeight: '600', color: '#374151', '@media (min-width: 769px)': { fontSize: '16px' } },
  progressStats: { fontSize: '9px', color: '#6b7280', '@media (min-width: 769px)': { fontSize: '12px' } },
  progressBarContainer: { marginTop: '6px' },
  progressLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#6b7280', marginBottom: '3px', '@media (min-width: 769px)': { fontSize: '12px', marginBottom: '4px' } },
  progressBarBackground: { backgroundColor: '#e5e7eb', borderRadius: '10px', height: '5px', overflow: 'hidden', marginBottom: '8px', '@media (min-width: 769px)': { height: '8px', marginBottom: '12px' } },
  progressBarFill: { height: '100%', borderRadius: '10px', transition: 'width 0.3s ease' },
  gamesGrid: { display: 'flex', flexDirection: 'column', gap: '12px', '@media (min-width: 860px)': { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' } },
  cardContainer: { background: 'white', borderRadius: '14px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', '@media (min-width: 769px)': { padding: '24px', borderRadius: '16px' } },
  cardContent: { display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' },
  cardLeft: { display: 'flex', gap: '12px', alignItems: 'flex-start', '@media (max-width: 480px)': { flexDirection: 'column', alignItems: 'center', textAlign: 'center' }, '@media (min-width: 769px)': { gap: '20px' } },
  cardIcon: { width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, '@media (min-width: 769px)': { width: '80px', height: '80px', borderRadius: '16px' } },
  cardText: { flex: 1 },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px', '@media (max-width: 480px)': { justifyContent: 'center' } },
  cardTitle: { fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0, '@media (min-width: 769px)': { fontSize: '22px' } },
  difficultyBadge: { padding: '3px 8px', borderRadius: '16px', fontSize: '9px', fontWeight: '600', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: 'white', '@media (min-width: 769px)': { padding: '4px 12px', fontSize: '12px' } },
  cardDescription: { fontSize: '11px', color: '#6b7280', margin: '0 0 10px 0', lineHeight: '1.4', '@media (min-width: 769px)': { fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' } },
  featuresList: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px', '@media (max-width: 480px)': { justifyContent: 'center' }, '@media (min-width: 769px)': { gap: '6px', marginBottom: '16px' } },
  featureTag: { background: '#f3f4f6', padding: '2px 6px', borderRadius: '10px', fontSize: '9px', color: '#4b5563', fontWeight: '500', '@media (min-width: 769px)': { padding: '4px 10px', fontSize: '11px' } },
  cardMeta: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', '@media (max-width: 480px)': { justifyContent: 'center' } },
  timeEstimate: { fontSize: '9px', color: '#6b7280', '@media (min-width: 769px)': { fontSize: '12px' } },
  bestScore: { fontSize: '9px', color: '#f59e0b', fontWeight: 'bold', '@media (min-width: 769px)': { fontSize: '12px' } },
  completedBadge: { fontSize: '9px', color: '#10b981', fontWeight: 'bold', '@media (min-width: 769px)': { fontSize: '12px' } },
  startButton: { width: '100%', padding: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', minHeight: '40px', '@media (min-width: 769px)': { padding: '14px', fontSize: '15px', borderRadius: '12px', gap: '8px' } },
  playIcon: { fontSize: '11px', '@media (min-width: 769px)': { fontSize: '14px' } },
  gameModalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '8px' },
  gameModalContainer: { backgroundColor: '#1a1a2e', borderRadius: '16px', width: '100%', height: '95%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', '@media (min-width: 769px)': { width: '95%', maxWidth: '1400px', height: '90%', borderRadius: '20px' } },
  gameModalHeader: { padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2a2a4a', flexShrink: 0, '@media (min-width: 769px)': { padding: '20px 24px' } },
  gameModalTitleSection: { display: 'flex', alignItems: 'center', gap: '10px' },
  gameModalIcon: { fontSize: '24px', color: '#ffd93d', '@media (min-width: 769px)': { fontSize: '32px' } },
  gameModalTitle: { fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0, '@media (min-width: 769px)': { fontSize: '24px' } },
  gameModalSubtitle: { fontSize: '9px', color: '#aaa', margin: '2px 0 0 0', '@media (min-width: 769px)': { fontSize: '12px', marginTop: '4px' } },
  closeButton: { background: 'rgba(255,255,255,0.1)', border: 'none', fontSize: '14px', cursor: 'pointer', color: '#fff', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', '@media (min-width: 769px)': { fontSize: '20px', width: '40px', height: '40px' } },
  gameModalContent: { flex: 1, overflow: 'auto', backgroundColor: '#1a1a2e' },
  gameIframe: { width: '100%', height: '100%', border: 'none', backgroundColor: '#1a1a2e' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' },
  modalContent: { backgroundColor: 'white', borderRadius: '14px', padding: '16px', maxWidth: '320px', width: '90%', '@media (min-width: 769px)': { borderRadius: '16px', padding: '24px', maxWidth: '400px' } },
  modalTitle: { fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', '@media (min-width: 769px)': { fontSize: '20px', marginBottom: '16px' } },
  modalText: { fontSize: '12px', color: '#6b7280', marginBottom: '16px', '@media (min-width: 769px)': { fontSize: '14px', marginBottom: '24px' } },
  modalButtons: { display: 'flex', gap: '10px', justifyContent: 'flex-end', flexDirection: 'column', '@media (min-width: 481px)': { flexDirection: 'row' } },
  modalCancelButton: { padding: '8px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', minHeight: '40px', '@media (min-width: 481px)': { padding: '8px 16px', width: 'auto' } },
  modalConfirmButton: { padding: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', minHeight: '40px', '@media (min-width: 481px)': { padding: '8px 16px', width: 'auto' } },
  notification: { position: 'fixed', bottom: '10px', right: '10px', left: '10px', padding: '10px', borderRadius: '8px', zIndex: 10002, animation: 'slideIn 0.3s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontWeight: 'bold', color: 'white', textAlign: 'center', fontSize: '12px', '@media (min-width: 481px)': { bottom: '20px', right: '20px', left: 'auto', padding: '12px 20px', fontSize: '14px' } }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `.game-card:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.1) !important; } button:hover { opacity: 0.9; } button:active { transform: scale(0.97); } @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @media (max-width: 480px) { button, .optionLabel { min-height: 40px; } } @media (max-width: 360px) { .dashboardTitle { font-size: 14px !important; } .statCardValue { font-size: 16px !important; } .statCardLabel { font-size: 8px !important; } .cardTitle { font-size: 14px !important; } }`;
if (!document.querySelector('#games-responsive-styles')) { styleSheet.id = 'games-responsive-styles'; document.head.appendChild(styleSheet); }

export default Games;