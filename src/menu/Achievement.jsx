import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { GiAchievement, GiTrophy } from 'react-icons/gi';
import { FaStar, FaBolt } from 'react-icons/fa';
import { MdLock, MdEmojiEvents, MdTrendingUp } from 'react-icons/md';
import { leaderboardService } from '../services/leaderboardService';

// Achievement templates - ADD THIS ARRAY (only the achievements you want to keep)
const ACHIEVEMENT_TEMPLATES = [
  // Point Collector Achievement
  {
    id: 'point_collector',
    name: 'Point Collector',
    description: 'Collect points across all games',
    requirementType: 'score1000',
    total: 1000,
    xpReward: 500,
    coinReward: 100,
    rarity: 'rare',
    iconType: 'star',
    color: '#8b5cf6'
  },
  // Arena Champion Achievement
  {
    id: 'arena_champion',
    name: 'Arena Champion',
    description: 'Complete Math Battle Arena',
    requirementType: 'battleCompleted',
    total: 1,
    xpReward: 100,
    coinReward: 50,
    rarity: 'rare',
    iconType: 'trophy',
    color: '#3b82f6'
  },
  // Add more achievements you want to keep here
  // DO NOT include First Steps, Battle Legend, Perfect Score, 
  // Galactic Hero, Dedicated Player, or Try Hard
];

function Achievement() {
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
  const [dataCleared, setDataCleared] = useState(false);
  
  // Refs for preventing multiple loads
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);
  const refreshIntervalRef = useRef(null);
  const isMobileRef = useRef(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

  // Function to clear old achievement data
  const clearOldAchievementData = useCallback(async () => {
    if (!user?.email || dataCleared) return;
    
    try {
      console.log('🧹 Clearing old achievement data...');
      
      // Clear from localStorage
      localStorage.removeItem(`achievements_${user.email}`);
      
      // Clear from Supabase - set empty achievements array
      await leaderboardService.updateUserAchievements(user.email, []);
      
      setDataCleared(true);
      console.log('✅ Old achievement data cleared');
    } catch (error) {
      console.error('Error clearing old data:', error);
    }
  }, [user?.email, dataCleared]);

  // Function to get icon component
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

  const calculateTotalScores = useCallback((gameProgress) => {
    if (!gameProgress) return 0;
    const equationScore = gameProgress.equation?.highScore || 0;
    const battleScore = gameProgress.battle?.highScore || 0;
    const spaceScore = gameProgress.spaceShooter?.highScore || 0;
    return equationScore + battleScore + spaceScore;
  }, []);

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
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, []);

  const loadLeaderboardData = useCallback(async () => {
    try {
      const leaderboard = await leaderboardService.getLeaderboard();
      
      const filteredLeaderboard = leaderboard.filter(entry => 
        entry && 
        entry.email && 
        !entry.email.includes('test') && 
        !entry.email.includes('guest') &&
        entry.username !== 'Guest'
      );
      
      if (mountedRef.current) {
        setLeaderboardData(filteredLeaderboard);
        
        if (user?.email) {
          const userIndex = filteredLeaderboard.findIndex(entry => entry.email === user.email);
          if (userIndex !== -1) {
            setUserRank(userIndex + 1);
          } else {
            setUserRank(null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      if (mountedRef.current) {
        setError('Failed to load leaderboard data');
      }
    }
  }, [user?.email]);

  const forceUpdateLeaderboard = useCallback(async () => {
    if (!user?.email || user.email === 'guest') return;
    if (isLoadingRef.current) return;
    
    try {
      const latestGameProgress = userData?.gameProgress || {};
      const latestScores = calculateTotalScores(latestGameProgress);
      const latestGameXP = getUserXP && typeof getUserXP === 'function' ? getUserXP() : (userData?.xp || 0);
      const username = getUserName();
      
      await leaderboardService.forceUpdateLeaderboard(user.email, username, latestGameXP, latestScores);
      
      if (mountedRef.current) {
        setTotalScores(latestScores);
        setGameXP(latestGameXP);
        await loadLeaderboardData();
        setLastUpdate(Date.now());
      }
    } catch (error) {
      console.error('Error force updating leaderboard:', error);
    }
  }, [user, userData, loadLeaderboardData, getUserXP, getUserName, calculateTotalScores]);

  // Main load function with improved mobile handling
  const loadUserData = useCallback(async (isRetry = false) => {
    // Prevent concurrent loads
    if (isLoadingRef.current) {
      console.log('Already loading, skipping...');
      return;
    }
    
    if (!user?.email) {
      if (mountedRef.current) setLoading(false);
      return;
    }

    console.log(`Loading achievements for user: ${user.email}`);
    isLoadingRef.current = true;
    
    if (mountedRef.current) setLoading(true);
    
    try {
      // First, clear old achievement data if needed
      if (!dataCleared) {
        await clearOldAchievementData();
      }
      
      // Get data from Supabase
      let gameProgress = userData?.gameProgress || {};
      let userXP = userData?.xp || 0;
      let userTotalScores = userData?.totalScores || 0;
      
      // Try localStorage if Supabase data is empty
      if (Object.keys(gameProgress).length === 0) {
        const savedProgress = localStorage.getItem(`gameProgress_${user.email}`);
        if (savedProgress) {
          gameProgress = JSON.parse(savedProgress);
        }
      }
      
      if (userXP === 0) {
        const savedXP = localStorage.getItem(`userXP_${user.email}`);
        if (savedXP && !isNaN(parseInt(savedXP))) {
          userXP = parseInt(savedXP);
        }
      }
      
      if (userTotalScores === 0) {
        const savedScores = localStorage.getItem(`userTotalScores_${user.email}`);
        if (savedScores && !isNaN(parseInt(savedScores))) {
          userTotalScores = parseInt(savedScores);
        } else {
          userTotalScores = calculateTotalScores(gameProgress);
        }
      }
      
      // Sync localStorage data to Supabase if needed
      if ((userXP > 0 || userTotalScores > 0) && (!userData?.xp || userData.xp === 0) && updateUserData) {
        await updateUserData({
          ...userData,
          gameProgress,
          xp: userXP,
          totalScores: userTotalScores
        });
      }
      
      if (mountedRef.current) {
        setGameXP(userXP);
        setTotalScores(userTotalScores);
      }
      
      // Get achievements - now with the new templates only
      let userAchievements = await leaderboardService.getUserAchievements(user.email);
      
      // If no achievements or if there are achievements but they're from old templates
      if (!userAchievements || userAchievements.length === 0 || userAchievements.length !== ACHIEVEMENT_TEMPLATES.length) {
        // Create fresh achievements from templates
        userAchievements = ACHIEVEMENT_TEMPLATES.map(template => {
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
        console.log('✅ Created new achievements from templates');
      } else {
        // Update existing achievements but only keep ones that match our templates
        let updatedAchievements = [...userAchievements];
        let hasChanges = false;
        
        // Filter out achievements that aren't in our templates
        updatedAchievements = updatedAchievements.filter(achievement => 
          ACHIEVEMENT_TEMPLATES.some(template => template.id === achievement.id)
        );
        
        // Add any missing achievements from templates
        for (const template of ACHIEVEMENT_TEMPLATES) {
          if (!updatedAchievements.some(a => a.id === template.id)) {
            const newAchievement = {
              ...template,
              unlocked: checkIfAchievementUnlocked(template, gameProgress),
              unlockedDate: checkIfAchievementUnlocked(template, gameProgress) ? new Date().toISOString() : null,
              progress: getAchievementProgress(template, gameProgress)
            };
            updatedAchievements.push(newAchievement);
            hasChanges = true;
          }
        }
        
        // Update progress for existing achievements
        updatedAchievements = updatedAchievements.map(achievement => {
          const template = ACHIEVEMENT_TEMPLATES.find(t => t.id === achievement.id);
          if (template && !achievement.unlocked) {
            const progressValue = getAchievementProgress(template, gameProgress);
            const newProgress = Math.min(progressValue, template.total);
            const nowUnlocked = newProgress >= template.total;
            
            if (nowUnlocked && !achievement.unlocked) {
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
      
      if (mountedRef.current) {
        setAchievements(userAchievements);
      }
      
      // Save to localStorage
      saveToLocalStorage(user.email, userXP, userTotalScores, userAchievements, gameProgress);
      
      // Load leaderboard data (but don't wait for it)
      loadLeaderboardData().catch(console.error);
      
      // Force update leaderboard in background
      if (!isRetry) {
        forceUpdateLeaderboard().catch(console.error);
      }
      
      hasLoadedRef.current = true;
      
    } catch (error) {
      console.error('Error loading achievements:', error);
      if (mountedRef.current) {
        setError('Failed to load achievements. Please try again later.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, [user, userData, updateUserData, loadLeaderboardData, forceUpdateLeaderboard, getUserXP, getUserName, calculateTotalScores, checkIfAchievementUnlocked, getAchievementProgress, saveToLocalStorage, clearOldAchievementData, dataCleared]);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    
    if (user?.email && !hasLoadedRef.current && !isLoadingRef.current) {
      // Add a small delay on mobile to ensure DOM is ready
      const delay = isMobileRef.current ? 100 : 0;
      const timer = setTimeout(() => {
        loadUserData();
      }, delay);
      return () => clearTimeout(timer);
    } else if (!user?.email) {
      setLoading(false);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [user?.email, loadUserData]);

  // Listen for game completion messages (with debounce)
  useEffect(() => {
    let messageTimeout = null;
    
    const handleMessage = (event) => {
      if (event.data && (event.data.type === 'SCORE_UPDATE' || 
          event.data.type === 'GAME_RESULT' || 
          event.data.type === 'XP_UPDATE')) {
        
        // Debounce reload on mobile to prevent multiple rapid reloads
        if (messageTimeout) clearTimeout(messageTimeout);
        messageTimeout = setTimeout(() => {
          if (!isLoadingRef.current && hasLoadedRef.current) {
            loadUserData(true);
          }
        }, isMobileRef.current ? 1000 : 500);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (messageTimeout) clearTimeout(messageTimeout);
    };
  }, [loadUserData]);

  // Periodic refresh - longer interval on mobile to save battery
  useEffect(() => {
    if (!user?.email || !hasLoadedRef.current) return;
    
    // Longer interval on mobile (60s vs 30s)
    const intervalTime = isMobileRef.current ? 60000 : 30000;
    
    refreshIntervalRef.current = setInterval(() => {
      if (!isLoadingRef.current && !loading && hasLoadedRef.current && mountedRef.current) {
        forceUpdateLeaderboard();
      }
    }, intervalTime);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
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

  // Show loading only on first load
  if (loading && achievements.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading your achievements...</p>
      </div>
    );
  }

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
              <span>Logged in as: <strong>{displayUsername}</strong></span>
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
                  leaderboardData.slice(0, isMobileRef.current ? 20 : 50).map((entry, index) => {
                    const isCurrentUser = entry.email === user?.email;
                    const userDisplayName = entry.username || entry.email?.split('@')[0];
                    
                    return (
                      <tr 
                        key={entry.email || index} 
                        style={isCurrentUser ? styles.currentUserRow : styles.tableRow}
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

        {/* Achievements Grid - Responsive columns */}
        <div style={{
          ...styles.achievementsGrid,
          gridTemplateColumns: isMobileRef.current 
            ? '1fr' 
            : 'repeat(auto-fill, minmax(380px, 1fr))'
        }}>
          {achievements.length > 0 ? (
            achievements.map(achievement => (
              <div
                key={achievement.id}
                style={{
                  ...styles.achievementCard,
                  opacity: achievement.unlocked ? 1 : 0.8,
                  borderLeft: `4px solid ${getRarityColor(achievement.rarity)}`,
                }}
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

// ... rest of the styles remain the same ...

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
    WebkitOverflowScrolling: 'touch', // Better scrolling on iOS
  },
  leaderboardTable: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '300px', // Ensure table doesn't get too small on mobile
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
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 12px !important;
      }
      
      .stat-card {
        padding: 12px !important;
      }
      
      .stat-value {
        font-size: 18px !important;
      }
      
      .leaderboard-section {
        padding: 12px !important;
      }
      
      .table-cell {
        padding: 8px 6px !important;
        font-size: 12px !important;
      }
      
      .username-container {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      
      .you-badge {
        font-size: 9px !important;
        padding: 1px 6px !important;
      }
      
      .medal {
        font-size: 16px !important;
      }
      
      .rank-number {
        font-size: 12px !important;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Achievement;