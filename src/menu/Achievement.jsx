import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { GiAchievement, GiTrophy } from 'react-icons/gi';
import { FaStar, FaBolt } from 'react-icons/fa';
import { MdLock, MdEmojiEvents, MdTrendingUp } from 'react-icons/md';
import { leaderboardService } from '../services/leaderboardService';

function Achievement() {
  // Get user data from context with error handling
  const context = useOutletContext();
  const { user, userData, updateUserData, getUserIdentifier, getUserXP } = context || {};
  
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [gameXP, setGameXP] = useState(0);
  const [userRank, setUserRank] = useState(null);
  const [totalScores, setTotalScores] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [error, setError] = useState(null);
  
  // Add refs to prevent multiple loads
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const initialLoadRef = useRef(true);

  // Function to get icon component based on type
  const getIconForAchievement = (iconType, size = 24) => {
    switch(iconType) {
      case 'star':
        return React.createElement(FaStar, { size, key: 'star-icon' });
      case 'bolt':
        return React.createElement(FaBolt, { size, key: 'bolt-icon' });
      case 'trophy':
        return React.createElement(GiTrophy, { size, key: 'trophy-icon' });
      case 'achievement':
        return React.createElement(GiAchievement, { size, key: 'achievement-icon' });
      default:
        return React.createElement(FaStar, { size, key: 'default-icon' });
    }
  };



  // Helper function to check if an achievement is unlocked based on game progress
  const checkIfAchievementUnlocked = useCallback((achievement, gameProgress) => {
    if (!gameProgress) return false;
    
    try {
      switch (achievement.requirementType) {
        case 'gameCompleted':
          return Object.values(gameProgress).some(game => game?.completed === true);
        case 'allGamesCompleted':
          return Object.values(gameProgress).every(game => game?.completed === true);
        case 'equationCompleted':
          return gameProgress.equation?.completed === true;
        case 'battleCompleted':
          return gameProgress.battle?.completed === true;
        case 'spaceCompleted':
          return gameProgress.spaceShooter?.completed === true;
        case 'score500':
          return Object.values(gameProgress).some(game => (game?.highScore || 0) >= 500);
        case 'score1000':
          return Object.values(gameProgress).some(game => (game?.highScore || 0) >= 1000);
        case 'equationScore':
          return (gameProgress.equation?.highScore || 0) >= 800;
        case 'battleScore':
          return (gameProgress.battle?.highScore || 0) >= 800;
        case 'spaceScore':
          return (gameProgress.spaceShooter?.highScore || 0) >= 800;
        case 'attempts5':
          return Object.values(gameProgress).some(game => (game?.attempts || 0) >= 5);
        case 'attempts10':
          return Object.values(gameProgress).some(game => (game?.attempts || 0) >= 10);
        default:
          return false;
      }
    } catch (err) {
      console.error('Error checking achievement:', err);
      return false;
    }
  }, []);

  // Helper function to get achievement progress
  const getAchievementProgress = useCallback((achievement, gameProgress) => {
    if (!gameProgress) return 0;
    
    try {
      switch (achievement.requirementType) {
        case 'gameCompleted':
          return Object.values(gameProgress).filter(game => game?.completed === true).length;
        case 'allGamesCompleted':
          return Object.values(gameProgress).filter(game => game?.completed === true).length;
        case 'equationCompleted':
          return gameProgress.equation?.completed ? 1 : 0;
        case 'battleCompleted':
          return gameProgress.battle?.completed ? 1 : 0;
        case 'spaceCompleted':
          return gameProgress.spaceShooter?.completed ? 1 : 0;
        case 'score500':
          return Math.max(...Object.values(gameProgress).map(game => game?.highScore || 0));
        case 'score1000':
          return Math.max(...Object.values(gameProgress).map(game => game?.highScore || 0));
        case 'equationScore':
          return gameProgress.equation?.highScore || 0;
        case 'battleScore':
          return gameProgress.battle?.highScore || 0;
        case 'spaceScore':
          return gameProgress.spaceShooter?.highScore || 0;
        case 'attempts5':
          return Math.max(...Object.values(gameProgress).map(game => game?.attempts || 0));
        case 'attempts10':
          return Math.max(...Object.values(gameProgress).map(game => game?.attempts || 0));
        default:
          return 0;
      }
    } catch (err) {
      console.error('Error getting progress:', err);
      return 0;
    }
  }, []);

  // Helper function to calculate total scores from game progress
  const calculateTotalScores = useCallback((gameProgress) => {
    if (!gameProgress) return 0;
    const equationScore = gameProgress.equation?.highScore || 0;
    const battleScore = gameProgress.battle?.highScore || 0;
    const spaceScore = gameProgress.spaceShooter?.highScore || 0;
    return equationScore + battleScore + spaceScore;
  }, []);

  // Get username from user data
  const getUserName = useCallback(() => {
    try {
      if (getUserIdentifier && typeof getUserIdentifier === 'function') {
        const identifier = getUserIdentifier();
        if (identifier) return identifier;
      }
      if (userData?.username) return userData.username;
      if (user?.name) return user.name;
      if (user?.username) return user.username;
      if (user?.email) return user.email.split('@')[0];
      return 'Player';
    } catch (err) {
      console.error('Error getting username:', err);
      return 'Player';
    }
  }, [getUserIdentifier, userData, user]);

  // Save to localStorage with game progress
  const saveToLocalStorage = useCallback((email, xp, scores, achievements, gameProgress) => {
    if (!email) return;
    try {
      localStorage.setItem(`userXP_${email}`, xp.toString());
      localStorage.setItem(`userTotalScores_${email}`, scores.toString());
      if (achievements) {
        localStorage.setItem(`achievements_${email}`, JSON.stringify(achievements));
      }
      if (gameProgress) {
        localStorage.setItem(`gameProgress_${email}`, JSON.stringify(gameProgress));
      }
      console.log('💾 Saved to localStorage:', { xp, scores, hasGameProgress: !!gameProgress });
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, []);

  // Load leaderboard data from Supabase
  const loadLeaderboardData = useCallback(async () => {
    try {
      console.log('🔄 Loading leaderboard data...');
      const leaderboard = await leaderboardService.getLeaderboard();
      
      const filteredLeaderboard = leaderboard.filter(entry => 
        entry && 
        entry.email && 
        !entry.email.includes('test') && 
        !entry.email.includes('guest') &&
        entry.username !== 'Guest'
      );
      setLeaderboardData(filteredLeaderboard);
      
      if (user?.email) {
        const userIndex = filteredLeaderboard.findIndex(entry => entry.email === user.email);
        if (userIndex !== -1) {
          setUserRank(userIndex + 1);
          console.log(`🏆 User rank: #${userIndex + 1}`);
        } else {
          setUserRank(null);
        }
      }
      
      console.log('✅ Leaderboard loaded:', filteredLeaderboard.length, 'players');
    } catch (error) {
      console.error('❌ Error loading leaderboard:', error);
      setError('Failed to load leaderboard data');
    }
  }, [user?.email]);

  // Force update leaderboard with latest data
  const forceUpdateLeaderboard = useCallback(async () => {
    if (!user?.email || user.email === 'guest') return;
    
    try {
      const latestGameProgress = userData?.gameProgress || {};
      const latestScores = calculateTotalScores(latestGameProgress);
      const latestGameXP = getUserXP && typeof getUserXP === 'function' ? getUserXP() : (userData?.xp || 0);
      const username = getUserName();
      
      console.log('📊 Force updating leaderboard with dashboard values');
      
      await leaderboardService.forceUpdateLeaderboard(user.email, username, latestGameXP, latestScores);
      
      setTotalScores(latestScores);
      setGameXP(latestGameXP);
      await loadLeaderboardData();
      setLastUpdate(Date.now());
      
    } catch (error) {
      console.error('❌ Error force updating leaderboard:', error);
      setError('Failed to update leaderboard');
    }
  }, [user, userData, loadLeaderboardData, getUserXP, getUserName, calculateTotalScores]);

  // Main load function with improved persistence
  const loadUserData = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log('Already loading, skipping...');
      return;
    }
    
    if (!user?.email) {
      console.log('Waiting for user to log in...');
      setLoading(false);
      return;
    }

    console.log(`🔄 Loading achievements for user: ${user.email}`);
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // FIRST: Try to get data from Supabase
      let gameProgress = userData?.gameProgress || {};
      let userXP = userData?.xp || 0;
      let userTotalScores = userData?.totalScores || 0;
      
      console.log('📊 Data from Supabase:', { 
        hasGameProgress: Object.keys(gameProgress).length > 0,
        userXP, 
        userTotalScores 
      });
      
      // If Supabase data is empty or incomplete, try localStorage
      if (Object.keys(gameProgress).length === 0) {
        const savedProgress = localStorage.getItem(`gameProgress_${user.email}`);
        if (savedProgress) {
          gameProgress = JSON.parse(savedProgress);
          console.log('📀 Loaded game progress from localStorage:', gameProgress);
        }
      }
      
      if (userXP === 0) {
        const savedXP = localStorage.getItem(`userXP_${user.email}`);
        if (savedXP && !isNaN(parseInt(savedXP))) {
          userXP = parseInt(savedXP);
          console.log('📀 Loaded XP from localStorage:', userXP);
        }
      }
      
      if (userTotalScores === 0) {
        const savedScores = localStorage.getItem(`userTotalScores_${user.email}`);
        if (savedScores && !isNaN(parseInt(savedScores))) {
          userTotalScores = parseInt(savedScores);
          console.log('📀 Loaded total scores from localStorage:', userTotalScores);
        } else {
          // Calculate from game progress if not stored
          userTotalScores = calculateTotalScores(gameProgress);
          console.log('📊 Calculated total scores from game progress:', userTotalScores);
        }
      }
      
      // If we have data in localStorage but not in Supabase, sync it up
      if ((userXP > 0 || userTotalScores > 0) && (!userData?.xp || userData.xp === 0)) {
        console.log('🔄 Syncing localStorage data to Supabase');
        if (updateUserData && typeof updateUserData === 'function') {
          await updateUserData({
            ...userData,
            gameProgress,
            xp: userXP,
            totalScores: userTotalScores
          });
        }
      }
      
      setGameXP(userXP);
      setTotalScores(userTotalScores);
      
      // Get achievements from Supabase
      let userAchievements = await leaderboardService.getUserAchievements(user.email);
      
      if (!userAchievements || userAchievements.length === 0) {
        console.log('Creating new achievements for user');
        userAchievements = achievementTemplates.current.map(template => {
          const shouldBeUnlocked = checkIfAchievementUnlocked(template, gameProgress);
          const progressValue = getAchievementProgress(template, gameProgress);
          
          return {
            ...template,
            unlocked: shouldBeUnlocked,
            unlockedDate: shouldBeUnlocked ? new Date().toISOString() : null,
            progress: Math.min(progressValue, template.total)
          };
        });
        
        await leaderboardService.updateUserAchievements(user.email, userAchievements);
      } else {
        // Update existing achievements based on latest game progress
        let updatedAchievements = [...userAchievements];
        let hasChanges = false;
        
        updatedAchievements = updatedAchievements.map(achievement => {
          if (!achievement.unlocked) {
            const progressValue = getAchievementProgress(achievement, gameProgress);
            const newProgress = Math.min(progressValue, achievement.total);
            const nowUnlocked = newProgress >= achievement.total;
            
            if (nowUnlocked && !achievement.unlocked) {
              console.log(`🎉 Achievement unlocked: ${achievement.name}`);
              hasChanges = true;
              return {
                ...achievement,
                unlocked: true,
                unlockedDate: new Date().toISOString(),
                progress: newProgress
              };
            } else if (newProgress !== achievement.progress) {
              hasChanges = true;
              return {
                ...achievement,
                progress: newProgress
              };
            }
          }
          return achievement;
        });
        
        if (hasChanges) {
          await leaderboardService.updateUserAchievements(user.email, updatedAchievements);
        }
        userAchievements = updatedAchievements;
      }
      
      setAchievements(userAchievements);
      
      // Save to localStorage for future refreshes
      saveToLocalStorage(user.email, userXP, userTotalScores, userAchievements, gameProgress);
      
      await forceUpdateLeaderboard();
      await loadLeaderboardData();
      
      if (updateUserData && typeof updateUserData === 'function') {
        updateUserData({ 
          ...userData,
          gameProgress,
          achievements: userAchievements,
          xp: userXP,
          username: getUserName(),
          totalScores: userTotalScores
        });
      }
      
      hasLoadedRef.current = true;
      
    } catch (error) {
      console.error('❌ Error loading achievements:', error);
      setError('Failed to load achievements. Please try again later.');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [user, userData, updateUserData, loadLeaderboardData, forceUpdateLeaderboard, getUserXP, getUserName, calculateTotalScores, checkIfAchievementUnlocked, getAchievementProgress, saveToLocalStorage]);

  // Initial load with improved checks
  useEffect(() => {
    // Check if user is logged in and we haven't loaded data
    if (user?.email && !hasLoadedRef.current && !isLoadingRef.current) {
      console.log('🎯 Initial load triggered');
      loadUserData();
    } else if (!user?.email && !loading) {
      setLoading(false);
    }
    
    // Listen for storage events (for cross-tab synchronization)
    const handleStorageChange = (e) => {
      if (e.key === `userXP_${user?.email}` || 
          e.key === `userTotalScores_${user?.email}` ||
          e.key === `gameProgress_${user?.email}`) {
        console.log('🔄 Storage changed, reloading data');
        loadUserData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user?.email, loadUserData, loading]);

  // Listen for game completion messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && (event.data.type === 'SCORE_UPDATE' || 
          event.data.type === 'GAME_RESULT' || 
          event.data.type === 'XP_UPDATE')) {
        console.log('📨 Received game update message:', event.data);
        setTimeout(() => {
          if (!isLoadingRef.current) {
            loadUserData();
          }
        }, 500); // Increased delay to ensure data is saved
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadUserData]);

  // Periodic refresh
  useEffect(() => {
    if (!user?.email || !hasLoadedRef.current) return;
    
    const interval = setInterval(() => {
      if (!isLoadingRef.current && !loading && hasLoadedRef.current) {
        console.log('🔄 Periodic refresh');
        forceUpdateLeaderboard();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user?.email, forceUpdateLeaderboard, loading]);

  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'common': return '#10b981';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getRarityBadge = (rarity) => {
    switch(rarity) {
      case 'common': return '🟢 Common';
      case 'rare': return '🔵 Rare';
      case 'epic': return '🟣 Epic';
      case 'legendary': return '🟡 Legendary';
      default: return '⚪ Unknown';
    }
  };

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.unlocked).length,
    achievementsXP: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + (a.xpReward || 0), 0),
    gameXP: gameXP,
    totalXP: gameXP,
    totalCoins: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + (a.coinReward || 0), 0),
    totalScores: totalScores
  };

  const currentUserData = leaderboardData.find(entry => entry.email === user?.email);
  
  const getRankBadge = (rank) => {
    if (rank === 1) return { emoji: '🥇', text: 'GOLD', color: '#f59e0b' };
    if (rank === 2) return { emoji: '🥈', text: 'SILVER', color: '#94a3b8' };
    if (rank === 3) return { emoji: '🥉', text: 'BRONZE', color: '#cd7f32' };
    return null;
  };

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorContent}>
          <GiAchievement size={64} color="#ef4444" />
          <h3>Error Loading Achievements</h3>
          <p>{error}</p>
          <button onClick={() => loadUserData()} style={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading && achievements.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading your achievements...</p>
      </div>
    );
  }

  if (!user?.email) {
    return (
      <div style={styles.emptyState}>
        <GiAchievement size={64} color="#d1d5db" />
        <h3>Please log in to view achievements</h3>
        <p>Sign in to track your progress and earn rewards!</p>
      </div>
    );
  }

  const rankBadge = userRank && getRankBadge(userRank);
  const displayUsername = getUserName();
  const currentXP = getUserXP && typeof getUserXP === 'function' ? getUserXP() : gameXP;

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <GiAchievement size={40} color="#f59e0b" />
            <h1 style={styles.title}>Achievement Gallery</h1>
          </div>
          <p style={styles.subtitle}>Track your progress and earn rewards!</p>
          {user && (
            <div style={styles.userInfo}>
              <span>Logged in as: <strong>{displayUsername}</strong> ({user.email})</span>
              <span style={styles.xpBadge}>⭐ {currentXP} XP</span>
              <span style={styles.scoreBadge}>🎯 {totalScores} Total Score</span>
              <span style={styles.lastUpdateBadge}>Last updated: {new Date(lastUpdate).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* User Rank Card */}
        {userRank && currentUserData && (
          <div style={styles.userRankCard}>
            <div style={styles.userRankHeader}>
              <MdTrendingUp size={24} color="#f59e0b" />
              <h3>Your Global Ranking</h3>
              <button onClick={() => forceUpdateLeaderboard()} style={styles.refreshButton}>
                🔄 Refresh
              </button>
            </div>
            <div style={styles.userRankContent}>
              <div style={styles.rankDisplay}>
                {rankBadge ? (
                  <>
                    <span style={styles.rankEmoji}>{rankBadge.emoji}</span>
                    <div style={styles.rankInfo}>
                      <span style={styles.rankNumberLarge}>#{userRank}</span>
                      <span style={{...styles.rankBadgeText, backgroundColor: rankBadge.color}}>
                        {rankBadge.text}
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={styles.rankInfo}>
                    <span style={styles.rankNumberLarge}>#{userRank}</span>
                    <span style={styles.rankPosition}>Overall Rank</span>
                  </div>
                )}
              </div>
              <div style={styles.userStats}>
                <div style={styles.userStatItem}>
                  <span style={styles.userStatLabel}>Username</span>
                  <span style={styles.userStatValue}>{currentUserData.username || displayUsername}</span>
                </div>
                <div style={styles.userStatItem}>
                  <span style={styles.userStatLabel}>Total Score</span>
                  <span style={styles.userStatValue}>{stats.totalScores}</span>
                </div>
                <div style={styles.userStatItem}>
                  <span style={styles.userStatLabel}>Total XP</span>
                  <span style={styles.userStatValue}>{stats.gameXP}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <GiTrophy size={32} color="#f59e0b" />
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>Total Achievements</span>
              <span style={styles.statValue}>{stats.total}</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <GiTrophy size={32} color="#10b981" />
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>Unlocked</span>
              <span style={styles.statValue}>{stats.unlocked}</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <FaBolt size={32} color="#f59e0b" />
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>Achievements XP</span>
              <span style={styles.statValue}>{stats.achievementsXP}</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <FaStar size={32} color="#f59e0b" />
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>Game XP</span>
              <span style={styles.statValue}>{stats.gameXP}</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <GiTrophy size={32} color="#f59e0b" />
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>Total XP</span>
              <span style={{...styles.statValue, color: '#f59e0b', fontWeight: 'bold'}}>
                {stats.gameXP}
              </span>
            </div>
          </div>
          <div style={styles.statCard}>
            <GiTrophy size={32} color="#059669" />
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>Total Score</span>
              <span style={{...styles.statValue, color: '#059669', fontWeight: 'bold'}}>
                {stats.totalScores}
              </span>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div style={styles.leaderboardSection}>
          <div style={styles.sectionHeader}>
            <GiTrophy size={28} color="#f59e0b" />
            <h2 style={styles.sectionTitle}>Global Leaderboard</h2>
            <span style={styles.playerCount}>{leaderboardData.length} Players</span>
            <button onClick={() => forceUpdateLeaderboard()} style={styles.smallRefreshButton}>
              🔄 Refresh
            </button>
          </div>
          <div style={styles.tableContainer}>
            <table style={styles.leaderboardTable}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Rank</th>
                  <th style={styles.tableHeader}>Username</th>
                  <th style={styles.tableHeader}>Total Score</th>
                  <th style={styles.tableHeader}>XP Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.length > 0 ? (
                  leaderboardData.map((entry, index) => {
                    const isCurrentUser = entry.email === user?.email;
                    const userDisplayName = entry.username || entry.email?.split('@')[0];
                    
                    return (
                      <tr 
                        key={entry.email || index} 
                        style={isCurrentUser ? styles.currentUserRow : styles.tableRow}
                        className={isCurrentUser ? 'current-user-row' : ''}
                      >
                        <td style={styles.tableCell}>
                          {index === 0 && <span style={styles.medal}>🥇</span>}
                          {index === 1 && <span style={styles.medal}>🥈</span>}
                          {index === 2 && <span style={styles.medal}>🥉</span>}
                          {index > 2 && <span style={styles.rankNumber}>{index + 1}</span>}
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.usernameContainer}>
                            <span style={isCurrentUser ? styles.currentUser : styles.username}>
                              {userDisplayName}
                            </span>
                            {isCurrentUser && (
                              <span style={styles.youBadge}>You</span>
                            )}
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={styles.scoreValue}>
                            {isCurrentUser ? stats.totalScores : (entry.totalScores?.toLocaleString() || 0)}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.xpContainer}>
                            <FaBolt size={14} color="#f59e0b" />
                            <span style={styles.xpValue}>
                              {isCurrentUser ? stats.gameXP : (entry.totalXP?.toLocaleString() || 0)} XP
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={styles.emptyTableMessage}>
                      No players on the leaderboard yet. Start playing to be the first!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Achievements Grid */}
        <div style={styles.achievementsGrid}>
          {achievements.length > 0 ? (
            achievements.map(achievement => (
              <div
                key={achievement.id}
                style={{
                  ...styles.achievementCard,
                  opacity: achievement.unlocked ? 1 : 0.8,
                  borderLeft: `4px solid ${getRarityColor(achievement.rarity)}`,
                }}
                className="achievement-card"
              >
                <div style={{ ...styles.achievementIcon, backgroundColor: achievement.color + '20', color: achievement.color }}>
                  {getIconForAchievement(achievement.iconType, 24)}
                </div>

                <div style={styles.achievementContent}>
                  <div style={styles.achievementHeader}>
                    <h3 style={styles.achievementName}>{achievement.name}</h3>
                    <span style={{ ...styles.rarityBadge, backgroundColor: getRarityColor(achievement.rarity) + '20', color: getRarityColor(achievement.rarity) }}>
                      {getRarityBadge(achievement.rarity)}
                    </span>
                  </div>

                  <p style={styles.achievementDescription}>{achievement.description}</p>

                  {!achievement.unlocked && (
                    <div style={styles.progressContainer}>
                      <div style={styles.progressBarSmall}>
                        <div 
                          style={{
                            ...styles.progressFill,
                            width: `${(achievement.progress / achievement.total) * 100}%`,
                            backgroundColor: getRarityColor(achievement.rarity)
                          }}
                        />
                      </div>
                      <span style={styles.progressText}>
                        {achievement.progress}/{achievement.total}
                      </span>
                    </div>
                  )}

                  <div style={styles.achievementRewards}>
                    <div style={styles.reward}>
                      <FaBolt size={12} color="#f59e0b" />
                      <span style={styles.rewardValue}>{achievement.xpReward} XP</span>
                    </div>
                    <div style={styles.reward}>
                      <GiTrophy size={12} color="#f59e0b" />
                      <span style={styles.rewardValue}>{achievement.coinReward} coins</span>
                    </div>
                  </div>

                  {achievement.unlocked && achievement.unlockedDate && (
                    <div style={styles.unlockedInfo}>
                      <MdEmojiEvents size={14} color="#10b981" />
                      <span style={styles.unlockedDate}>
                        Unlocked on {new Date(achievement.unlockedDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {!achievement.unlocked && (
                  <div style={styles.lockedIcon}>
                    <MdLock size={20} color="#9ca3af" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>
              <GiAchievement size={64} color="#d1d5db" />
              <h3 style={styles.emptyTitle}>No achievements found</h3>
              <p style={styles.emptyText}>Start playing games to earn achievements!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '20px 0',
  },
  contentWrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
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
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
  },
  errorContent: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '400px',
  },
  retryButton: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
    margin: 0,
  },
  userInfo: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    flexWrap: 'wrap',
  },
  xpBadge: {
    backgroundColor: '#fef3c7',
    color: '#f59e0b',
    padding: '4px 12px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '13px',
  },
  scoreBadge: {
    backgroundColor: '#d1fae5',
    color: '#059669',
    padding: '4px 12px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '13px',
  },
  lastUpdateBadge: {
    fontSize: '11px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  refreshButton: {
    marginLeft: 'auto',
    padding: '6px 12px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
  },
  smallRefreshButton: {
    marginLeft: '10px',
    padding: '4px 10px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    color: '#374151',
    transition: 'all 0.2s',
  },
  userRankCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '30px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  userRankHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
  },
  userRankContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '20px',
  },
  rankDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  rankEmoji: {
    fontSize: '48px',
  },
  rankInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  rankNumberLarge: {
    fontSize: '48px',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  rankBadgeText: {
    fontSize: '12px',
    padding: '4px 12px',
    borderRadius: '20px',
    marginTop: '5px',
    fontWeight: 'bold',
  },
  rankPosition: {
    fontSize: '14px',
    opacity: 0.9,
  },
  userStats: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap',
  },
  userStatItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '10px 20px',
    borderRadius: '8px',
    minWidth: '100px',
  },
  userStatLabel: {
    fontSize: '12px',
    opacity: 0.8,
    marginBottom: '5px',
  },
  userStatValue: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  leaderboardSection: {
    marginBottom: '30px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #f3f4f6',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  playerCount: {
    marginLeft: 'auto',
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  leaderboardTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    textAlign: 'left',
    padding: '12px',
    backgroundColor: '#f9fafb',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
  },
  tableRow: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  currentUserRow: {
    borderBottom: '1px solid #f3f4f6',
    backgroundColor: '#fef3c7',
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)',
    transition: 'all 0.2s ease',
  },
  tableCell: {
    padding: '14px 12px',
    color: '#4b5563',
  },
  medal: {
    fontSize: '20px',
  },
  rankNumber: {
    fontWeight: '600',
    color: '#6b7280',
  },
  usernameContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  username: {
    fontWeight: '500',
    color: '#374151',
  },
  currentUser: {
    fontWeight: '700',
    color: '#f59e0b',
  },
  youBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: '#f59e0b',
    color: 'white',
    fontWeight: '600',
  },
  scoreValue: {
    fontWeight: '600',
    color: '#059669',
  },
  xpContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  xpValue: {
    fontWeight: '600',
    color: '#f59e0b',
  },
  emptyTableMessage: {
    textAlign: 'center',
    padding: '40px',
    color: '#9ca3af',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
  },
  achievementsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '15px',
    position: 'relative',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  achievementIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  achievementContent: {
    flex: 1,
  },
  achievementHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  achievementName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  rarityBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '12px',
    fontWeight: '500',
  },
  achievementDescription: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '12px',
    lineHeight: '1.4',
  },
  progressContainer: {
    marginBottom: '12px',
  },
  progressBarSmall: {
    width: '100%',
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '4px',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '11px',
    color: '#6b7280',
  },
  achievementRewards: {
    display: 'flex',
    gap: '15px',
    marginBottom: '8px',
  },
  reward: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  rewardValue: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#4b5563',
  },
  unlockedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  unlockedDate: {
    fontSize: '11px',
    color: '#10b981',
  },
  lockedIcon: {
    position: 'absolute',
    top: '10px',
    right: '10px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '40px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginTop: '20px',
    marginBottom: '10px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
};

// Add keyframes for spinner animation
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .achievement-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
    }
    
    .current-user-row:hover {
      background-color: #fef3c7 !important;
      transform: scale(1.01);
    }
    
    tr:not(.current-user-row):hover {
      background-color: #f9fafb;
    }
    
    button:hover {
      transform: scale(1.02);
    }
    
    button:active {
      transform: scale(0.98);
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Achievement;