// src/menu/Games.jsx
import React, { useState, useEffect } from 'react';
import { FaPlay, FaArrowLeft, FaTrophy, FaChartLine, FaClock, FaStar, FaGamepad } from 'react-icons/fa';
import { GiPuzzle, GiSwordsEmblem, GiConsoleController } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';

function Games() {
  const navigate = useNavigate();
  const [gameStats, setGameStats] = useState({
    totalPlayTime: 0,
    totalGamesPlayed: 0,
    totalAchievements: 0,
    overallProgress: 0
  });

  // Store individual game progress with default values
  const [gameProgress, setGameProgress] = useState({
    equation: {
      progress: 0,
      highScore: 0,
      achievements: 0,
      timesPlayed: 0,
      bestTime: null,
      totalTimePlayed: 0,
      accuracy: 0,
      totalCorrect: 0,
      totalAttempts: 0
    },
    battle: {
      progress: 0,
      highScore: 0,
      achievements: 0,
      timesPlayed: 0,
      bestTime: null,
      totalTimePlayed: 0,
      accuracy: 0,
      totalCorrect: 0,
      totalAttempts: 0,
      maxCombo: 0,
      enemiesDefeated: 0
    },
    spaceShooter: {
      progress: 0,
      highScore: 0,
      achievements: 0,
      timesPlayed: 0,
      bestTime: null,
      totalTimePlayed: 0,
      accuracy: 0,
      totalCorrect: 0,
      totalAttempts: 0
    }
  });

  // Load game stats from localStorage with validation
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem('gameStats');
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        setGameStats({
          totalPlayTime: parsedStats.totalPlayTime || 0,
          totalGamesPlayed: parsedStats.totalGamesPlayed || 0,
          totalAchievements: parsedStats.totalAchievements || 0,
          overallProgress: parsedStats.overallProgress || 0
        });
      }
      
      const savedProgress = localStorage.getItem('gameProgress');
      if (savedProgress) {
        const loadedProgress = JSON.parse(savedProgress);
        
        // Merge loaded progress with default structure to ensure all fields exist
        const mergedProgress = { ...gameProgress };
        Object.keys(mergedProgress).forEach(gameId => {
          if (loadedProgress[gameId]) {
            mergedProgress[gameId] = {
              ...mergedProgress[gameId],
              ...loadedProgress[gameId]
            };
          }
        });
        
        setGameProgress(mergedProgress);
        
        // Calculate overall stats from loaded progress
        calculateOverallStats(mergedProgress);
      }
    } catch (error) {
      console.error('Error loading game stats:', error);
    }
  }, []);

  // Calculate overall stats from individual game progress with null checks
  const calculateOverallStats = (progress) => {
    let totalPlayTime = 0;
    let totalGamesPlayed = 0;
    let totalAchievements = 0;
    let totalProgress = 0;
    let gameCount = 0;
    
    Object.values(progress).forEach(game => {
      if (game) {
        totalPlayTime += game.totalTimePlayed || 0;
        totalGamesPlayed += game.timesPlayed || 0;
        totalAchievements += game.achievements || 0;
        if (game.progress > 0) {
          totalProgress += game.progress;
          gameCount++;
        }
      }
    });
    
    // Calculate overall progress as average of games that have been started
    const overallProgress = gameCount > 0 ? Math.floor(totalProgress / gameCount) : 0;
    
    setGameStats(prev => ({
      ...prev,
      totalPlayTime,
      totalGamesPlayed,
      totalAchievements,
      overallProgress
    }));
  };

  // Listen for game results from child windows
  useEffect(() => {
    const handleGameResult = (event) => {
      if (event.data && event.data.type === 'GAME_RESULT') {
        const result = event.data;
        console.log('Game result received:', result);
        
        updateGameStats(result);
      }
    };
    
    window.addEventListener('message', handleGameResult);
    
    return () => {
      window.removeEventListener('message', handleGameResult);
    };
  }, []);

  // Function to update game stats based on result with proper null checks
  const updateGameStats = (result) => {
    if (!result || !result.gameId) return;
    
    // Update individual game progress first
    setGameProgress(prev => {
      const updated = { ...prev };
      const gameId = result.gameId;
      
      if (!updated[gameId]) {
        // Initialize game if it doesn't exist
        updated[gameId] = {
          progress: 0,
          highScore: 0,
          achievements: 0,
          timesPlayed: 0,
          bestTime: null,
          totalTimePlayed: 0,
          accuracy: 0,
          totalCorrect: 0,
          totalAttempts: 0
        };
      }
      
      // Update times played
      updated[gameId].timesPlayed = (updated[gameId].timesPlayed || 0) + 1;
      
      // Update total time played for this game
      updated[gameId].totalTimePlayed = (updated[gameId].totalTimePlayed || 0) + (result.timeSpent || 0);
      
      // Update progress based on game type
      let newProgress = 0;
      
      if (gameId === 'equation') {
        // Equation game: 7 puzzles total
        const puzzlesCompleted = result.puzzlesCompleted || 0;
        newProgress = Math.min(100, Math.floor((puzzlesCompleted / 7) * 100));
        updated[gameId].progress = Math.max(updated[gameId].progress || 0, newProgress);
        
        // Update accuracy for equation game
        if (result.stats) {
          updated[gameId].accuracy = result.stats.accuracy || 0;
          updated[gameId].totalCorrect = result.stats.correctAnswers || 0;
          updated[gameId].totalAttempts = result.stats.totalAnswers || 0;
        }
      } 
      else if (gameId === 'battle') {
        // Battle game: 3 enemies total
        const enemiesDefeated = result.stats?.enemiesDefeated || 0;
        newProgress = Math.min(100, Math.floor((enemiesDefeated / 3) * 100));
        updated[gameId].progress = Math.max(updated[gameId].progress || 0, newProgress);
        
        // Update battle-specific stats
        if (result.stats) {
          updated[gameId].accuracy = result.stats.accuracy || 0;
          updated[gameId].totalCorrect = result.stats.correctAnswers || 0;
          updated[gameId].totalAttempts = result.stats.totalAnswers || 0;
          updated[gameId].maxCombo = Math.max(updated[gameId].maxCombo || 0, result.stats.maxCombo || 0);
          updated[gameId].enemiesDefeated = result.stats.enemiesDefeated || 0;
        }
      } 
      else if (gameId === 'spaceShooter') {
        // Space Shooter game: level-based progression
        // Progress based on highest level reached
        if (result.stats) {
          const highestLevel = result.stats.highestLevel || 1;
          newProgress = Math.min(100, Math.floor((highestLevel / 10) * 100));
          updated[gameId].progress = Math.max(updated[gameId].progress || 0, newProgress);
          
          updated[gameId].accuracy = result.stats.accuracy || 0;
          updated[gameId].totalCorrect = result.stats.correctAnswers || 0;
          updated[gameId].totalAttempts = result.stats.totalAnswers || 0;
        }
      }
      
      // Update high score if better
      const score = result.score || 0;
      if (score > (updated[gameId].highScore || 0)) {
        updated[gameId].highScore = score;
      }
      
      // Update achievements (1 achievement for completing the game)
      if (result.completed && updated[gameId].achievements === 0) {
        updated[gameId].achievements = 1;
        // Update total achievements in gameStats
        setGameStats(prevStats => ({
          ...prevStats,
          totalAchievements: (prevStats.totalAchievements || 0) + 1
        }));
      }
      
      // Update best time if completed
      if (result.completed && result.timeSpent) {
        const timeSpent = result.timeSpent;
        if (!updated[gameId].bestTime || timeSpent < updated[gameId].bestTime) {
          updated[gameId].bestTime = timeSpent;
        }
      }
      
      setGameStats(prevStats => ({
        ...prevStats,
        totalPlayTime: (prevStats.totalPlayTime || 0) + (result.timeSpent || 0),
        totalGamesPlayed: (prevStats.totalGamesPlayed || 0) + 1
      }));
      
      // Save to localStorage
      localStorage.setItem('gameProgress', JSON.stringify(updated));
      
      // Recalculate overall stats
      calculateOverallStats(updated);
      
      return updated;
    });
  };
  
  // Helper function to format time
  const formatTimeShort = (seconds) => {
    if (!seconds && seconds !== 0) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };
  
  // Helper function to get game title by ID
  const getGameTitle = (gameId) => {
    const games = {
      equation: "Equation Escape Room",
      battle: "Math Battle Arena",
      spaceShooter: "Math Space Shooter"
    };
    return games[gameId] || "Unknown Game";
  };

  // Format time display
  const formatTotalTime = (seconds) => {
    if (!seconds && seconds !== 0) return '0m';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  // Format time for display (seconds to mm:ss)
  const formatTimeDisplay = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
      buttonText: "Play Now"
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
      features: ["Turn-based Combat", "Math Challenges", "Power-ups", "3 Enemy Waves", "Boss Battles"],
      path: "/game/battle",
      buttonText: "Play Now"
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
      buttonText: "Play Now"
    },
  };

  const handleStartGame = (gameId) => {
    const gamePath = games[gameId].path;
    window.open(gamePath, '_blank');
  };

  const ProgressDashboard = () => (
    <div style={styles.dashboardContainer}>
      <div style={styles.dashboardHeader}>
        <FaGamepad style={styles.dashboardIcon} />
        <h2 style={styles.dashboardTitle}>Your Gaming Progress</h2>
      </div>
      
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <FaTrophy style={styles.statCardIcon} />
          <div style={styles.statCardInfo}>
            <div style={styles.statCardValue}>{gameStats.totalGamesPlayed || 0}</div>
            <div style={styles.statCardLabel}>Games Played</div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <FaStar style={styles.statCardIcon} />
          <div style={styles.statCardInfo}>
            <div style={styles.statCardValue}>{gameStats.totalAchievements || 0}</div>
            <div style={styles.statCardLabel}>Achievements Earned</div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <FaChartLine style={styles.statCardIcon} />
          <div style={styles.statCardInfo}>
            <div style={styles.statCardValue}>{gameStats.overallProgress || 0}%</div>
            <div style={styles.statCardLabel}>Overall Progress</div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <FaClock style={styles.statCardIcon} />
          <div style={styles.statCardInfo}>
            <div style={styles.statCardValue}>{formatTotalTime(gameStats.totalPlayTime)}</div>
            <div style={styles.statCardLabel}>Total Play Time</div>
          </div>
        </div>
      </div>
      
      <div style={styles.gameProgressSection}>
        <h3 style={styles.sectionTitle}>Game Progress Overview</h3>
        <div style={styles.gameProgressList}>
          {Object.values(games).map(game => {
            const progress = gameProgress[game.id];
            const hasPlayed = progress && progress.timesPlayed > 0;
            const progressValue = progress?.progress || 0;
            
            return (
              <div key={game.id} style={styles.gameProgressItem}>
                <div style={styles.gameProgressHeader}>
                  <span style={styles.gameProgressName}>{game.title}</span>
                  <span style={styles.gameProgressPercent}>
                    {hasPlayed ? `${progressValue}%` : 'Not Started'}
                  </span>
                </div>
                <div style={styles.progressBarContainer}>
                  <div style={{
                    ...styles.progressBar,
                    width: hasPlayed ? `${progressValue}%` : '0%',
                    background: hasPlayed ? `linear-gradient(135deg, ${game.color} 0%, ${game.color}cc 100%)` : '#e5e7eb'
                  }} />
                </div>
                <div style={styles.gameStats}>
                  {hasPlayed ? (
                    <>
                      <span>🏆 High Score: {progress?.highScore || 0}</span>
                      <span>⭐ {progress?.achievements || 0} Achievement{progress?.achievements !== 1 ? 's' : ''}</span>
                      <span>🎮 Played: {progress?.timesPlayed || 0} time{progress?.timesPlayed !== 1 ? 's' : ''}</span>
                      {progress?.bestTime && (
                        <span>⏱️ Best: {formatTimeDisplay(progress.bestTime)}</span>
                      )}
                      {progress?.totalTimePlayed > 0 && (
                        <span>⌛ Total: {formatTimeDisplay(progress.totalTimePlayed)}</span>
                      )}
                      {progress?.accuracy > 0 && (
                        <span>📊 Accuracy: {progress.accuracy}%</span>
                      )}
                      {game.id === 'battle' && progress?.maxCombo > 0 && (
                        <span>⚡ Max Combo: x{progress.maxCombo}</span>
                      )}
                    </>
                  ) : (
                    <span style={styles.notPlayedText}>🎮 Play to start tracking your progress!</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const GameCard = ({ game, onStart }) => {
    const progress = gameProgress[game.id];
    const hasPlayed = progress && progress.timesPlayed > 0;
    
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
                <span style={{
                  ...styles.difficultyBadge,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                }}>
                  {game.difficulty}
                </span>
              </div>
              <p style={styles.cardDescription}>{game.description}</p>
              
              <div style={styles.featuresList}>
                {game.features.map((feature, index) => (
                  <span key={index} style={styles.featureTag}>{feature}</span>
                ))}
              </div>
              
              <div style={styles.cardMeta}>
                <span style={styles.timeEstimate}>⏱️ {game.timeEstimate}</span>
                {hasPlayed && (
                  <div style={styles.miniStats}>
                    <span>🏆 {progress?.highScore || 0}</span>
                    <span>⭐ {progress?.achievements || 0}</span>
                    <span>🎮 {progress?.timesPlayed || 0}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button 
            style={styles.startButton} 
            onClick={() => onStart(game.id)}
            className="start-button"
          >
            <FaPlay style={styles.playIcon} />
            {game.buttonText}
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
          Math Games 
        </h1>
        <p style={styles.subtitle}>Choose a game to start your mathematical adventure</p>
      </header>

      <ProgressDashboard />

      <div style={styles.gamesGrid}>
        {Object.values(games).map(game => (
          <GameCard 
            key={game.id} 
            game={game} 
            onStart={handleStartGame}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    borderRadius: '16px',
    color: 'white',
  },
  title: {
    fontSize: '42px',
    fontWeight: '700',
    margin: '0 0 10px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  titleIcon: {
    fontSize: '48px',
  },
  subtitle: {
    fontSize: '18px',
    opacity: '0.9',
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
    transition: 'transform 0.2s',
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
  gameProgressSection: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '15px',
  },
  gameProgressList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  gameProgressItem: {
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  gameProgressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  gameProgressName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  gameProgressPercent: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6',
  },
  progressBarContainer: {
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressBar: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  gameStats: {
    display: 'flex',
    gap: '15px',
    fontSize: '12px',
    color: '#6b7280',
    flexWrap: 'wrap',
  },
  notPlayedText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '20px',
  },
  cardContainer: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  cardLeft: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '12px',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  difficultyBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  cardDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 12px 0',
    lineHeight: '1.5',
  },
  featuresList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '12px',
  },
  featureTag: {
    background: '#f3f4f6',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#4b5563',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  timeEstimate: {
    fontSize: '12px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  miniStats: {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    color: '#6b7280',
  },
  startButton: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  playIcon: {
    fontSize: '12px',
  },
};

// Add hover effect styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .game-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important;
  }
  
  .start-button:hover {
    opacity: 0.9;
    transform: scale(1.02);
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
  }
`;
document.head.appendChild(styleSheet);

export default Games;