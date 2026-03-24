import React, { useState, useEffect } from 'react';
import { FaPlay, FaArrowLeft, FaTrophy, FaChartLine, FaClock, FaStar, FaGamepad } from 'react-icons/fa';
import { GiPuzzle, GiSwordsEmblem, GiConsoleController } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';

function Games() {
  const navigate = useNavigate();
  const { user, userData, updateUserData, getUserIdentifier } = useOutletContext();
  
  const [gameStats, setGameStats] = useState({
    totalPlayTime: 0,
    totalGamesPlayed: 0,
    totalAchievements: 0,
    overallProgress: 0
  });

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

  useEffect(() => {
    if (!user || !user.email) {
      console.log('No user found, waiting for user data...');
      return;
    }

    try {
      if (userData && userData.gameStats) {
        const savedStats = userData.gameStats;
        setGameStats({
          totalPlayTime: savedStats.totalPlayTime || 0,
          totalGamesPlayed: savedStats.totalGamesPlayed || 0,
          totalAchievements: savedStats.totalAchievements || 0,
          overallProgress: savedStats.overallProgress || 0
        });
      }
      
      if (userData && userData.gameProgress) {
        const loadedProgress = userData.gameProgress;
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
        calculateOverallStats(mergedProgress);
      }
    } catch (error) {
      console.error('Error loading game stats:', error);
    }
  }, [user, userData]);

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
    
    const overallProgress = gameCount > 0 ? Math.floor(totalProgress / gameCount) : 0;
    
    setGameStats(prev => ({
      ...prev,
      totalPlayTime,
      totalGamesPlayed,
      totalAchievements,
      overallProgress
    }));

    if (updateUserData && user && user.email) {
      updateUserData({
        gameStats: {
          totalPlayTime,
          totalGamesPlayed,
          totalAchievements,
          overallProgress
        },
        gameProgress: progress
      });
    }
  };

  useEffect(() => {
    const handleGameResult = (event) => {
      console.log('Received message event:', event.data);
      if (event.data && event.data.type === 'GAME_RESULT') {
        const result = event.data;
        console.log(`Game result received for user: ${user?.email}`, result);
        updateGameStats(result);
      }
    };
    
    window.addEventListener('message', handleGameResult);
    
    return () => {
      window.removeEventListener('message', handleGameResult);
    };
  }, [user, updateUserData]);

  const updateGameStats = (result) => {
    if (!result || !result.gameId) {
      console.log('Invalid result:', result);
      return;
    }
    if (!user || !user.email) {
      console.log('Cannot update stats: No user logged in');
      return;
    }

    console.log(`Updating game stats for user: ${user.email}`);
    console.log('Game result details:', result);
    
    setGameProgress(prev => {
      const updated = { ...prev };
      const gameId = result.gameId;
      
      console.log(`Processing ${gameId} game result`);
      
      if (!updated[gameId]) {
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
      
      updated[gameId].timesPlayed = (updated[gameId].timesPlayed || 0) + 1;
      console.log(`Times played: ${updated[gameId].timesPlayed}`);
      
      const timePlayed = result.playTime || result.timeSpent || 0;
      updated[gameId].totalTimePlayed = (updated[gameId].totalTimePlayed || 0) + timePlayed;
      console.log(`Total time played: ${updated[gameId].totalTimePlayed} seconds`);
      
      let newProgress = 0;
      
      if (gameId === 'equation') {
        const puzzlesCompleted = result.puzzlesCompleted || 0;
        newProgress = Math.min(100, Math.floor((puzzlesCompleted / 7) * 100));
        updated[gameId].progress = Math.max(updated[gameId].progress || 0, newProgress);
        
        if (result.stats) {
          updated[gameId].accuracy = result.stats.accuracy || 0;
          updated[gameId].totalCorrect = result.stats.correctAnswers || 0;
          updated[gameId].totalAttempts = result.stats.totalAnswers || 0;
        }
      } 
      else if (gameId === 'battle') {
        const enemiesDefeated = result.stats?.enemiesDefeated || 0;
        newProgress = Math.min(100, Math.floor((enemiesDefeated / 3) * 100));
        updated[gameId].progress = Math.max(updated[gameId].progress || 0, newProgress);
        console.log(`Battle progress: ${newProgress}% (${enemiesDefeated}/3 enemies defeated)`);
        
        if (result.stats) {
          updated[gameId].accuracy = result.stats.accuracy || 0;
          updated[gameId].totalCorrect = result.stats.correctAnswers || 0;
          updated[gameId].totalAttempts = result.stats.totalAnswers || 0;
          updated[gameId].maxCombo = Math.max(updated[gameId].maxCombo || 0, result.stats.maxCombo || 0);
          updated[gameId].enemiesDefeated = result.stats.enemiesDefeated || 0;
          console.log(`Battle stats - Accuracy: ${updated[gameId].accuracy}%, Max Combo: x${updated[gameId].maxCombo}`);
        }
      } 
      else if (gameId === 'spaceShooter') {
        if (result.stats) {
          const highestLevel = result.stats.highestLevel || 1;
          newProgress = Math.min(100, Math.floor((highestLevel / 10) * 100));
          updated[gameId].progress = Math.max(updated[gameId].progress || 0, newProgress);
          
          updated[gameId].accuracy = result.stats.accuracy || 0;
          updated[gameId].totalCorrect = result.stats.correctAnswers || 0;
          updated[gameId].totalAttempts = result.stats.totalAnswers || 0;
        }
      }
      
      const score = result.score || 0;
      if (score > (updated[gameId].highScore || 0)) {
        updated[gameId].highScore = score;
        console.log(`New high score: ${score}`);
      }
      
      if (result.completed && updated[gameId].achievements === 0) {
        updated[gameId].achievements = 1;
        console.log('Achievement unlocked!');
      }
      
      if (result.completed && result.timeSpent) {
        const timeSpent = result.timeSpent;
        if (!updated[gameId].bestTime || timeSpent < updated[gameId].bestTime) {
          updated[gameId].bestTime = timeSpent;
          console.log(`New best time: ${timeSpent} seconds`);
        }
      }
      
      console.log(`Updated progress for ${gameId}:`, updated[gameId]);
      calculateOverallStats(updated);
      
      return updated;
    });
  };
  
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
    console.log(`Opening game: ${gameId} at path: ${gamePath}`);
    console.log('Current user:', user);
    
    const gameWindow = window.open(gamePath, '_blank');
    
    if (!gameWindow) {
      console.log('Popup blocked! Please allow popups for this site.');
      alert('Please allow popups for this site to play games.');
      return;
    }
    
    setTimeout(() => {
      if (gameWindow && !gameWindow.closed) {
        gameWindow.postMessage({
          type: 'USER_INFO',
          user: {
            email: user?.email,
            name: user?.name,
            picture: user?.picture
          }
        }, window.location.origin);
        console.log('User info sent to game window');
      }
    }, 1000);
  };

  if (!user || !user.email) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading your gaming profile...</p>
      </div>
    );
  }

  const ProgressDashboard = () => (
    <div style={styles.dashboardContainer}>
      <div style={styles.dashboardHeader}>
        <FaGamepad style={styles.dashboardIcon} />
        <div>
          <h2 style={styles.dashboardTitle}>Your Gaming Progress</h2>
          <p style={styles.userInfoText}>Player: {user?.name?.split(' ')[0] || getUserIdentifier()}</p>
        </div>
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
                      {game.id === 'battle' && progress?.enemiesDefeated > 0 && (
                        <span>👾 Enemies: {progress.enemiesDefeated}/3</span>
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
      
      <div style={styles.privacyNote}>
        <p>🔒 Your game progress is private and only visible to you.</p>
      </div>
    </div>
  );

  const GameCard = ({ game, onStart }) => {
    const progress = gameProgress[game.id];
    const hasPlayed = progress && progress.timesPlayed > 0;
    
    return (
      <div style={styles.cardContainer}>
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
        <p style={styles.subtitle}>Choose a game to start your mathematical adventure, {user?.name?.split(' ')[0] || 'Student'}!</p>
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '20px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
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
    transition: 'box-shadow 0.2s',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '20px',
  },
  cardContainer: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'box-shadow 0.2s',
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

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .stat-card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;
document.head.appendChild(styleSheet);

export default Games;