// src/menu/Games.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaTrash, FaTimes } from 'react-icons/fa';
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
  const iframeRef = useRef(null);
  const [currentScore, setCurrentScore] = useState(null);

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
  }, [userData]);

  // Function to save score
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
            savedAt: new Date().toISOString()
          }
        }
      };
      
      localStorage.setItem('gameProgress', JSON.stringify(updatedProgress));
      
      if (updateUserData) {
        updateUserData({ gameProgress: updatedProgress });
      }
      
      return updatedProgress;
    });
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
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
    
    if (updateUserData) {
      updateUserData({ gameProgress: resetProgress });
    }
    
    setShowResetConfirm(false);
    showNotification('🗑️ All progress has been reset!', '#10b981');
  };

  const closeGame = () => {
    setGameModalOpen(false);
    setActiveGame(null);
    setCurrentScore(null);
    showNotification('💾 Game closed. Your progress has been saved!', '#3b82f6');
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
      features: ["4 Challenging Levels", "Timed Challenges", "Leaderboard Rankings", "Helpful Hints"],
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
                    'Play to earn points! Score updates in real-time'
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

  const ProgressDashboard = () => {
    const totalGames = Object.keys(games).length;
    const completedGames = Object.values(gameProgress).filter(game => game.completed === true).length;
    const totalHighScore = Object.values(gameProgress).reduce((sum, game) => sum + (game.highScore || 0), 0);
    const totalAttempts = Object.values(gameProgress).reduce((sum, game) => sum + (game.attempts || 0), 0);
    const completionPercentage = totalGames > 0 ? (completedGames / totalGames) * 100 : 0;
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
                <div style={styles.statCardValue}>{Math.round(completionPercentage)}%</div>
                <div style={styles.statCardLabel}>Completion Rate</div>
              </div>
            </div>
          </div>

          <div style={styles.privacyNote}>
            💡 Scores are saved automatically every time you earn points! Even if you close the game, your progress is preserved.
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

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>
          <GiConsoleController style={styles.titleIcon} />
          Math Games Arcade
        </h1>
        <p style={styles.subtitle}>Choose a game to start your mathematical adventure</p>
      </header>

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
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    borderRadius: '24px',
    color: 'white',
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
  resetButton: {
    marginLeft: 'auto',
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