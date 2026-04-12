// src/menu/Games.jsx
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

  // Function to update XP
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
    
    // Show notification for XP change
    if (points > 0) {
      showNotification(`+${points} XP! ${reason}`, '#10b981');
    } else if (points < 0) {
      showNotification(`${points} XP (${reason})`, '#ef4444');
    }
  };

  // Function to get total scores from all games
  const getTotalScores = () => {
    const totalHighScore = Object.values(gameProgress).reduce((sum, game) => sum + (game.highScore || 0), 0);
    const totalLastScores = Object.values(gameProgress).reduce((sum, game) => sum + (game.lastScore || 0), 0);
    return {
      totalHighScore,
      totalLastScores,
      equationScore: gameProgress.equation?.highScore || 0,
      battleScore: gameProgress.battle?.highScore || 0,
      spaceShooterScore: gameProgress.spaceShooter?.highScore || 0,
      allGameProgress: gameProgress
    };
  };

  // Load saved progress from userData when component mounts
  useEffect(() => {
    console.log('=== Games Component Mounted ===');
    
    if (userData?.gameProgress) {
      console.log('Loading progress from userData:', userData.gameProgress);
      setGameProgress(userData.gameProgress);
    } else {
      const savedProgress = localStorage.getItem('gameProgress');
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        console.log('Loading progress from localStorage:', parsed);
        const updated = {
          equation: { ...parsed.equation, lastScore: parsed.equation?.lastScore || 0 },
          battle: { ...parsed.battle, lastScore: parsed.battle?.lastScore || 0 },
          spaceShooter: { ...parsed.spaceShooter, lastScore: parsed.spaceShooter?.lastScore || 0 }
        };
        setGameProgress(updated);
      }
    }
    
    // Load XP from userData
    if (userData?.xp !== undefined) {
      setXpPoints(userData.xp);
    }
  }, [userData]);

  // Function to save score and award XP
  const saveGameScore = (gameId, score, completed = false, stats = {}) => {
    console.log(`Saving score for ${gameId}: ${score}, Completed: ${completed}`);
    
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
      
      // Award XP based on performance
      if (stats.correctAnswers !== undefined || stats.wrongAnswers !== undefined) {
        const correctAnswers = stats.correctAnswers || 0;
        const wrongAnswers = stats.wrongAnswers || 0;
        
        // Award XP: +10 per correct answer, -5 per wrong answer
        const xpGain = (correctAnswers * 10) - (wrongAnswers * 5);
        
        if (xpGain !== 0) {
          const reason = `${gameId} game: ${correctAnswers} correct, ${wrongAnswers} wrong`;
          updateXP(xpGain, reason);
        }
      }
      
      // Bonus XP for completing a game
      if (completed && !currentGameProgress.completed) {
        updateXP(50, `Completed ${gameId} game!`);
        showNotification(`🎉 Bonus 50 XP for completing the game!`, '#f59e0b');
      }
      
      // Bonus XP for achieving new high score
      if (score > currentGameProgress.highScore && currentGameProgress.highScore > 0) {
        const bonusXP = Math.floor(score / 10); // 10% of score as bonus XP
        updateXP(bonusXP, `New high score in ${gameId}! (+${bonusXP} XP bonus)`);
        showNotification(`🏆 New High Score! +${bonusXP} XP Bonus!`, '#f59e0b');
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
          lastGameStats: {
            ...stats,
            finalScore: score,
            savedAt: new Date().toISOString(),
            xpEarned: stats.correctAnswers ? (stats.correctAnswers * 10) - (stats.wrongAnswers * 5) : 0
          }
        }
      };
      
      localStorage.setItem('gameProgress', JSON.stringify(updatedProgress));
      
      // Calculate total scores for leaderboard
      const totalScores = calculateTotalScores(updatedProgress);
      
      if (updateUserData) {
        updateUserData({ 
          ...userData,
          gameProgress: updatedProgress,
          xp: xpPoints + (stats.correctAnswers ? (stats.correctAnswers * 10) - (stats.wrongAnswers * 5) : 0),
          totalScores: totalScores
        });
      }
      
      return updatedProgress;
    });
  };
  
  // Helper function to calculate total scores
  const calculateTotalScores = (progress) => {
    if (!progress) return 0;
    const equationScore = progress.equation?.highScore || 0;
    const battleScore = progress.battle?.highScore || 0;
    const spaceScore = progress.spaceShooter?.highScore || 0;
    return equationScore + battleScore + spaceScore;
  };

  // Listen for messages from iframe
  useEffect(() => {
    console.log('Setting up message listener for iframe');
    
    const handleMessage = (event) => {
      console.log('=== Message Received ===', event.data);
      
      if (event.data && event.data.type === 'SCORE_UPDATE') {
        const { gameId, score, stats } = event.data;
        console.log(`Score update from ${gameId}: ${score}`);
        setCurrentScore(score);
        saveGameScore(gameId, score, false, stats);
        showNotification(`🎯 Current Score: ${score}`, '#3b82f6');
      }
      
      if (event.data && event.data.type === 'GAME_RESULT') {
        const { gameId, completed, score, stats } = event.data;
        console.log(`Game result from ${gameId}: Completed: ${completed}, Score: ${score}`);
        saveGameScore(gameId, score, completed, stats);
        setCurrentScore(score);
        
        if (completed) {
          showNotification(`🏆 Game Completed! Final Score: ${score}`, '#10b981');
          setTimeout(() => closeGame(), 2000);
        } else {
          showNotification(`💀 Game Over! Score: ${score}`, '#ef4444');
        }
      }
      
      // Handle individual answer results for real-time XP updates
      if (event.data && event.data.type === 'ANSWER_RESULT') {
        const { isCorrect, gameId, pointsEarned = 10 } = event.data;
        
        if (isCorrect) {
          updateXP(pointsEarned, `Correct answer in ${gameId}!`);
          showNotification(`✓ Correct! +${pointsEarned} XP`, '#10b981');
        } else {
          updateXP(-5, `Wrong answer in ${gameId}`);
          showNotification(`✗ Wrong! -5 XP`, '#ef4444');
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [xpPoints, userData, updateUserData]);

  const showNotification = (message, color) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${color};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10002;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-weight: bold;
    `;
    notification.innerHTML = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const resetAllProgress = () => {
    const resetProgress = {
      equation: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 },
      battle: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 },
      spaceShooter: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 }
    };
    
    setGameProgress(resetProgress);
    localStorage.setItem('gameProgress', JSON.stringify(resetProgress));
    
    // Show confirmation dialog for XP reset
    const resetXP = window.confirm('Do you also want to reset XP points to 0?');
    
    if (resetXP) {
      setXpPoints(0);
      
      // Update userData with both reset progress and XP
      if (updateUserData) {
        updateUserData({ 
          ...userData,
          gameProgress: resetProgress,
          xp: 0,
          totalScores: 0, // Also reset total scores
          lastXPUpdate: {
            points: -xpPoints, // Record the XP loss
            reason: 'Reset all progress',
            timestamp: new Date().toISOString(),
            newTotal: 0
          }
        });
      }
      
      // Also clear XP from localStorage
      if (user?.email) {
        localStorage.setItem(`userXP_${user.email}`, '0');
        localStorage.setItem(`userTotalScores_${user.email}`, '0');
        localStorage.setItem(`gameProgress_${user.email}`, JSON.stringify(resetProgress));
      }
      
      showNotification('🗑️ All progress and XP have been reset!', '#10b981');
    } else {
      // Only reset game progress, keep XP
      if (updateUserData) {
        updateUserData({ 
          ...userData,
          gameProgress: resetProgress
        });
      }
      
      // Also update localStorage
      if (user?.email) {
        localStorage.setItem(`gameProgress_${user.email}`, JSON.stringify(resetProgress));
      }
      
      showNotification('🗑️ Game progress has been reset! (XP kept)', '#10b981');
    }
    
    setShowResetConfirm(false);
    
    // Force a refresh of the achievement component by dispatching a custom event
    window.dispatchEvent(new CustomEvent('progressReset', { 
      detail: { reset: true, timestamp: Date.now(), resetXP: resetXP } 
    }));
  };

  const closeGame = () => {
    setGameModalOpen(false);
    setActiveGame(null);
    setCurrentScore(null);
    showNotification('💾 Game closed. Your progress has been saved!', '#3b82f6');
  };

  // Function to calculate overall progress percentage across all games
  const calculateOverallProgress = () => {
    const games = ['equation', 'battle', 'spaceShooter'];
    let totalProgress = 0;
    
    games.forEach(gameId => {
      const game = gameProgress[gameId];
      if (!game) return;
      
      // Calculate progress for each game (0-100%)
      let gameProgressPercent = 0;
      
      // Factor 1: Completion status (50% weight)
      const completionWeight = 0.5;
      const completionScore = game.completed ? 100 : 0;
      
      // Factor 2: High score progress (30% weight)
      // Assuming max possible scores for each game (you can adjust these values)
      const maxScores = {
        equation: 1000,
        battle: 1000,
        spaceShooter: 1000
      };
      const highScoreWeight = 0.3;
      const highScorePercent = Math.min(100, (game.highScore / maxScores[gameId]) * 100);
      
      // Factor 3: Attempts/engagement (20% weight)
      const attemptsWeight = 0.2;
      // Consider at least 3 attempts as good engagement
      const attemptsScore = Math.min(100, (game.attempts / 3) * 100);
      
      // Calculate weighted progress for this game
      gameProgressPercent = (completionScore * completionWeight) + 
                           (highScorePercent * highScoreWeight) + 
                           (attemptsScore * attemptsWeight);
      
      totalProgress += gameProgressPercent;
    });
    
    // Average across all 3 games
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
      <>
        <div style={styles.dashboardContainer}>
          <div style={styles.dashboardHeader}>
            <GiConsoleController style={styles.dashboardIcon} />
            <div>
              <h2 style={styles.dashboardTitle}>Your Progress</h2>
              <p style={styles.userInfoText}>Welcome back, {userName}!</p>
            </div>
            <div style={styles.xpDisplay}>
              <span style={styles.xpIcon}>⭐</span>
              <span style={styles.xpValue}>{xpPoints} XP</span>
            </div>
            <button onClick={() => setShowResetConfirm(true)} style={styles.resetButton}>
              <FaTrash style={styles.resetIcon} />
              Reset Progress
            </button>
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statCardIcon}>🎮</div>
              <div style={styles.statCardInfo}>
                <div style={styles.statCardValue}>{completedGames}/{totalGames}</div>
                <div style={styles.statCardLabel}>Games Completed</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statCardIcon}>🏆</div>
              <div style={styles.statCardInfo}>
                <div style={styles.statCardValue}>{totalHighScore}</div>
                <div style={styles.statCardLabel}>Total High Score</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statCardIcon}>🎯</div>
              <div style={styles.statCardInfo}>
                <div style={styles.statCardValue}>{totalAttempts}</div>
                <div style={styles.statCardLabel}>Total Attempts</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statCardIcon}>📊</div>
              <div style={styles.statCardInfo}>
                <div style={styles.statCardValue}>{Math.round(overallProgress)}%</div>
                <div style={styles.statCardLabel}>Overall Progress</div>
              </div>
            </div>
          </div>

          {/* Dropdown for detailed progress */}
          <div style={styles.dropdownContainer}>
            <button 
              style={styles.dropdownHeader} 
              onClick={() => setShowDetailedProgress(!showDetailedProgress)}
              className="dropdown-button"
            >
              <div style={styles.dropdownTitleSection}>
                <span style={styles.dropdownIcon}>📊</span>
                <span style={styles.dropdownTitle}>Game Progress Details</span>
                <span style={styles.dropdownBadge}>
                  {Object.values(gameProgress).filter(g => g.completed).length}/3 Completed
                </span>
              </div>
              {showDetailedProgress ? <FaChevronUp /> : <FaChevronDown />}
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
                      <div style={styles.progressHeader}>
                        <span style={styles.progressGameTitle}>{gameTitle}</span>
                        <span style={styles.progressStats}>
                          {progress.completed ? '✓ Completed' : 'In Progress'} | 
                          High Score: {progress.highScore} | 
                          Attempts: {progress.attempts}
                        </span>
                      </div>
                      <div style={styles.progressBarContainer}>
                        <div style={styles.progressLabels}>
                          <span>Completion</span>
                          <span>{progress.completed ? '100%' : '0%'}</span>
                        </div>
                        <div style={styles.progressBarBackground}>
                          <div style={{...styles.progressBarFill, width: progress.completed ? '100%' : '0%', backgroundColor: '#10b981'}} />
                        </div>
                        <div style={styles.progressLabels}>
                          <span>High Score Progress</span>
                          <span>{Math.round(highScorePercent)}%</span>
                        </div>
                        <div style={styles.progressBarBackground}>
                          <div style={{...styles.progressBarFill, width: `${highScorePercent}%`, backgroundColor: '#f59e0b'}} />
                        </div>
                        <div style={styles.progressLabels}>
                          <span>Engagement (Attempts)</span>
                          <span>{Math.round(attemptsPercent)}%</span>
                        </div>
                        <div style={styles.progressBarBackground}>
                          <div style={{...styles.progressBarFill, width: `${attemptsPercent}%`, backgroundColor: '#3b82f6'}} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {showResetConfirm && (
          <div style={styles.modalOverlay} onClick={() => setShowResetConfirm(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>Reset All Progress?</h3>
              <p style={styles.modalText}>
                This action cannot be undone. All your game progress, high scores, and achievements will be permanently deleted.
              </p>
              <div style={styles.modalButtons}>
                <button onClick={() => setShowResetConfirm(false)} style={styles.modalCancelButton}>
                  Cancel
                </button>
                <button onClick={resetAllProgress} style={styles.modalConfirmButton}>
                  Yes, Reset Everything
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const GameCard = ({ game, onStart }) => {
    const progress = gameProgress[game.id];
    const highScore = progress?.highScore || 0;
    
    return (
      <div style={styles.cardContainer} className="game-card">
        <div style={styles.cardContent}>
          <div style={styles.cardLeft}>
            <div style={{
              ...styles.cardIcon,
              backgroundColor: game.bgColor,
              color: game.color
            }}>
              {game.icon}
            </div>
            <div style={styles.cardText}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>{game.title}</h2>
                <span style={styles.difficultyBadge}>{game.difficulty}</span>
              </div>
              <p style={styles.cardDescription}>{game.description}</p>
              
              <div style={styles.featuresList}>
                {game.features.map((feature, index) => (
                  <span key={index} style={styles.featureTag}>{feature}</span>
                ))}
              </div>
              
              <div style={styles.cardMeta}>
                <span style={styles.timeEstimate}>⏱️ {game.timeEstimate}</span>
                {progress?.completed && (
                  <span style={styles.completedBadge}>✓ Completed</span>
                )}
                {highScore > 0 && (
                  <span style={styles.bestScore}>🏆 Best Score: {highScore}</span>
                )}
              </div>
            </div>
          </div>
          
          <button style={styles.startButton} onClick={() => onStart(game.id)}>
            <FaPlay style={styles.playIcon} />
            Play Now
          </button>
        </div>
      </div>
    );
  };

  const games = {
    equation: {
      id: 'equation',
      title: "Equation Escape Room",
      description: "Solve linear equations to escape each room! Master slope-intercept form, work with points, and tackle real-world word problems in this mathematical adventure.",
      icon: <GiPuzzle size={48} />,
      color: "#3b82f6",
      bgColor: "#dbeafe",
      difficulty: "Beginner to Advanced",
      timeEstimate: "15-20 min",
      features: ["Challenging Levels", "Timed Challenges", "Helpful Hints"],
      path: "/game/equation",
    },
    battle: {
      id: 'battle',
      title: "Math Battle Arena",
      description: "Enter the arena and test your math skills in epic turn-based combat! Solve equations to attack, answer quickly to defend, and use power-ups to defeat increasingly difficult enemies.",
      icon: <GiSwordsEmblem size={48} />,
      color: "#8b5cf6",
      bgColor: "#ede9fe",
      difficulty: "Intermediate to Expert",
      timeEstimate: "20-30 min",
      features: ["Turn-based Combat", "Math Challenges", "Power-ups", "8 Enemy Waves", "Boss Battles"],
      path: "/game/battle",
    },
    spaceShooter: {
      id: 'spaceShooter',
      title: "Math Space Shooter",
      description: "Defend your spaceship from incoming asteroids while solving math problems! Answer equations correctly to fire your weapons and destroy targets.",
      icon: <GiConsoleController size={48} />,
      color: "#f59e0b",
      bgColor: "#fef3c7",
      difficulty: "Beginner to Intermediate",
      timeEstimate: "15-25 min",
      features: ["Fast-paced Action", "Math-based Weapons", "Upgrade System", "Multiple Enemy Types"],
      path: "/game/spaceshooter",
    },
  };

  const handleStartGame = (gameId) => {
    const gamePath = games[gameId].path;
    setActiveGame(gameId);
    setGameModalOpen(true);
    setCurrentScore(null);
    console.log(`Opening game: ${gameId} in iframe modal at ${gamePath}`);
  };

  const renderActiveGame = () => {
    if (!activeGame || !gameModalOpen) return null;
    const game = games[activeGame];
    const gamePath = game.path;
    
    return (
      <div style={styles.gameModalOverlay}>
        <div style={styles.gameModalContainer}>
          <div style={styles.gameModalHeader}>
            <div style={styles.gameModalTitleSection}>
              <div style={styles.gameModalIcon}>{game.icon}</div>
              <div>
                <h2 style={styles.gameModalTitle}>{game.title}</h2>
                <p style={styles.gameModalSubtitle}>
                  {currentScore !== null ? (
                    <span style={{ color: '#ffd93d', fontWeight: 'bold' }}>🎯 Current Score: {currentScore}</span>
                  ) : (
                    'Play to earn XP! +10 XP per correct answer, -5 XP per wrong answer'
                  )}
                </p>
              </div>
            </div>
            <button onClick={closeGame} style={styles.closeButton} title="Save Progress & Close">
              <FaTimes />
            </button>
          </div>
          <div style={styles.gameModalContent}>
            <iframe
              ref={iframeRef}
              src={gamePath}
              style={styles.gameIframe}
              title={game.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <ProgressDashboard />

      <div style={styles.gamesGrid}>
        {Object.values(games).map(game => (
          <GameCard key={game.id} game={game} onStart={handleStartGame} />
        ))}
      </div>

      {renderActiveGame()}
    </div>
  );
}

// Export the getTotalScores function for use in other components
export const getGameTotalScores = (gameProgress) => {
  if (!gameProgress) return { totalHighScore: 0, totalLastScores: 0 };
  const totalHighScore = Object.values(gameProgress).reduce((sum, game) => sum + (game.highScore || 0), 0);
  const totalLastScores = Object.values(gameProgress).reduce((sum, game) => sum + (game.lastScore || 0), 0);
  return {
    totalHighScore,
    totalLastScores,
    equationScore: gameProgress.equation?.highScore || 0,
    battleScore: gameProgress.battle?.highScore || 0,
    spaceShooterScore: gameProgress.spaceShooter?.highScore || 0
  };
};

// Styles
const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
  },
  
  title: {
    fontSize: '48px',
    fontWeight: '700',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  titleIcon: {
    fontSize: '56px',
  },
  subtitle: {
    fontSize: '18px',
    opacity: '0.95',
    margin: 0,
  },
  dashboardContainer: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '30px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  dashboardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f3f4f6',
    flexWrap: 'wrap',
  },
  userInfoText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '5px 0 0 0',
  },
  dashboardIcon: {
    fontSize: '28px',
    color: '#3b82f6',
  },
  dashboardTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  xpDisplay: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fef3c7',
    padding: '8px 16px',
    borderRadius: '20px',
    fontWeight: 'bold',
  },
  xpIcon: {
    fontSize: '20px',
  },
  xpValue: {
    fontSize: '18px',
    color: '#f59e0b',
  },
  resetButton: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
  resetIcon: {
    fontSize: '14px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px',
  },
  statCard: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  statCardIcon: {
    fontSize: '32px',
    color: '#3b82f6',
  },
  statCardInfo: {
    flex: 1,
  },
  statCardValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 1,
  },
  statCardLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '5px',
  },
  dropdownContainer: {
    marginTop: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  dropdownHeader: {
    width: '100%',
    padding: '16px 20px',
    backgroundColor: '#f9fafb',
    border: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    color: '#1f2937',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  dropdownTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dropdownIcon: {
    fontSize: '20px',
  },
  dropdownTitle: {
    fontWeight: '600',
  },
  dropdownBadge: {
    padding: '4px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  dropdownContent: {
    padding: '20px',
    backgroundColor: 'white',
    borderTop: '1px solid #e5e7eb',
    animation: 'slideDown 0.3s ease',
  },
  progressItem: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  progressGameTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
  },
  progressStats: {
    fontSize: '12px',
    color: '#6b7280',
  },
  progressBarContainer: {
    marginTop: '8px',
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  progressBarBackground: {
    backgroundColor: '#e5e7eb',
    borderRadius: '10px',
    height: '8px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.3s ease',
  },
  privacyNote: {
    marginTop: '20px',
    padding: '12px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#92400e',
  },
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '24px',
  },
  cardContainer: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    height: '100%',
  },
  cardLeft: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    flex: 1,
  },
  cardIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  difficultyBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
  },
  cardDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 16px 0',
    lineHeight: '1.5',
  },
  featuresList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '16px',
  },
  featureTag: {
    background: '#f3f4f6',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#4b5563',
    fontWeight: '500',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  timeEstimate: {
    fontSize: '12px',
    color: '#6b7280',
  },
  bestScore: {
    fontSize: '12px',
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  completedBadge: {
    fontSize: '12px',
    color: '#10b981',
    fontWeight: 'bold',
  },
  startButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  playIcon: {
    fontSize: '14px',
  },
  gameModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10001,
  },
  gameModalContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: '20px',
    width: '95%',
    maxWidth: '1400px',
    height: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  gameModalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a4a',
    flexShrink: 0,
  },
  gameModalTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  gameModalIcon: {
    fontSize: '32px',
    color: '#ffd93d',
  },
  gameModalTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  gameModalSubtitle: {
    fontSize: '12px',
    color: '#aaa',
    margin: '4px 0 0 0',
  },
  closeButton: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#fff',
    padding: '10px',
    borderRadius: '8px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
  },
  gameModalContent: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#1a1a2e',
  },
  gameIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: '#1a1a2e',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 16px 0',
  },
  modalText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  modalConfirmButton: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .game-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important;
  }
  
  button:hover {
    transform: scale(1.02);
  }
  
  button:active {
    transform: scale(0.98);
  }
  
  .dropdown-button:hover {
    background-color: #f3f4f6 !important;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Games;