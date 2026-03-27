import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { GiAchievement, GiTrophy } from 'react-icons/gi';
import { FaStar, FaBolt } from 'react-icons/fa';
import { MdLock, MdEmojiEvents, MdTrendingUp } from 'react-icons/md';
import { leaderboardService } from '../services/leaderboardService';

function Achievement() {
  // Get user data from context
  const { user, userData, updateUserData, getUserIdentifier, getUserXP } = useOutletContext() || {};
  
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [gameXP, setGameXP] = useState(0); // XP from games
  const [userRank, setUserRank] = useState(null); // Store user's rank
  const [totalScores, setTotalScores] = useState(0); // Total scores from all games
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Debug: Log user data when component mounts or updates
  useEffect(() => {
    console.log('🔍 Achievement Component - User Data:', {
      user: user,
      userData: userData,
      username: getUserIdentifier ? getUserIdentifier() : (userData?.username || user?.username || user?.email?.split('@')[0]),
      xp: getUserXP ? getUserXP() : userData?.xp,
      gameProgress: userData?.gameProgress
    });
  }, [user, userData, getUserIdentifier, getUserXP]);

  // Define the base achievement templates
  const achievementTemplates = [
    // Game Completion Achievements
    {
      id: 1,
      name: "First Steps",
      description: "Complete your first game",
      rarity: "common",
      xpReward: 50,
      coinReward: 25,
      icon: <FaStar size={24} />,
      total: 1,
      color: "#3b82f6",
      requirementType: "gameCompleted",
      requirementValue: 1
    },
    {
      id: 2,
      name: "Math Master",
      description: "Complete all three games",
      rarity: "epic",
      xpReward: 300,
      coinReward: 150,
      icon: <GiTrophy size={24} />,
      total: 3,
      color: "#f59e0b",
      requirementType: "allGamesCompleted",
      requirementValue: 3
    },
    {
      id: 3,
      name: "Equation Hero",
      description: "Complete Equation Escape Room",
      rarity: "rare",
      xpReward: 100,
      coinReward: 50,
      icon: <FaStar size={24} />,
      total: 1,
      color: "#3b82f6",
      requirementType: "equationCompleted",
      requirementValue: 1
    },
    {
      id: 4,
      name: "Battle Legend",
      description: "Complete Math Battle Arena",
      rarity: "rare",
      xpReward: 100,
      coinReward: 50,
      icon: <FaBolt size={24} />,
      total: 1,
      color: "#8b5cf6",
      requirementType: "battleCompleted",
      requirementValue: 1
    },
    {
      id: 5,
      name: "Space Defender",
      description: "Complete Math Space Shooter",
      rarity: "rare",
      xpReward: 100,
      coinReward: 50,
      icon: <FaBolt size={24} />,
      total: 1,
      color: "#f59e0b",
      requirementType: "spaceCompleted",
      requirementValue: 1
    },
    // High Score Achievements
    {
      id: 6,
      name: "Point Collector",
      description: "Achieve a high score of 500 in any game",
      rarity: "rare",
      xpReward: 75,
      coinReward: 40,
      icon: <GiTrophy size={24} />,
      total: 500,
      color: "#10b981",
      requirementType: "score500",
      requirementValue: 500
    },
    {
      id: 7,
      name: "Perfect Score",
      description: "Achieve a perfect score of 1000 in any game",
      rarity: "epic",
      xpReward: 150,
      coinReward: 75,
      icon: <GiTrophy size={24} />,
      total: 1000,
      color: "#f97316",
      requirementType: "score1000",
      requirementValue: 1000
    },
    {
      id: 8,
      name: "Puzzle Master",
      description: "Score 800+ in Equation Escape",
      rarity: "rare",
      xpReward: 125,
      coinReward: 60,
      icon: <FaStar size={24} />,
      total: 800,
      color: "#3b82f6",
      requirementType: "equationScore",
      requirementValue: 800
    },
    {
      id: 9,
      name: "Arena Champion",
      description: "Score 800+ in Math Battle",
      rarity: "rare",
      xpReward: 125,
      coinReward: 60,
      icon: <GiTrophy size={24} />,
      total: 800,
      color: "#8b5cf6",
      requirementType: "battleScore",
      requirementValue: 800
    },
    {
      id: 10,
      name: "Galactic Hero",
      description: "Score 800+ in Space Shooter",
      rarity: "rare",
      xpReward: 125,
      coinReward: 60,
      icon: <FaStar size={24} />,
      total: 800,
      color: "#f59e0b",
      requirementType: "spaceScore",
      requirementValue: 800
    },
    // Engagement Achievements
    {
      id: 11,
      name: "Dedicated Player",
      description: "Play any game 5 times",
      rarity: "common",
      xpReward: 60,
      coinReward: 30,
      icon: <FaBolt size={24} />,
      total: 5,
      color: "#14b8a6",
      requirementType: "attempts5",
      requirementValue: 5
    },
    {
      id: 12,
      name: "Try Hard",
      description: "Play any game 10 times",
      rarity: "rare",
      xpReward: 100,
      coinReward: 50,
      icon: <FaBolt size={24} />,
      total: 10,
      color: "#a855f7",
      requirementType: "attempts10",
      requirementValue: 10
    }
  ];

  // Helper function to check if an achievement is unlocked based on game progress
  const checkIfAchievementUnlocked = (achievement, gameProgress) => {
    if (!gameProgress) return false;
    
    switch (achievement.requirementType) {
      case 'gameCompleted':
        return Object.values(gameProgress).some(game => game.completed === true);
      
      case 'allGamesCompleted':
        return Object.values(gameProgress).every(game => game.completed === true);
      
      case 'equationCompleted':
        return gameProgress.equation?.completed === true;
      
      case 'battleCompleted':
        return gameProgress.battle?.completed === true;
      
      case 'spaceCompleted':
        return gameProgress.spaceShooter?.completed === true;
      
      case 'score500':
        return Object.values(gameProgress).some(game => (game.highScore || 0) >= 500);
      
      case 'score1000':
        return Object.values(gameProgress).some(game => (game.highScore || 0) >= 1000);
      
      case 'equationScore':
        return (gameProgress.equation?.highScore || 0) >= 800;
      
      case 'battleScore':
        return (gameProgress.battle?.highScore || 0) >= 800;
      
      case 'spaceScore':
        return (gameProgress.spaceShooter?.highScore || 0) >= 800;
      
      case 'attempts5':
        return Object.values(gameProgress).some(game => (game.attempts || 0) >= 5);
      
      case 'attempts10':
        return Object.values(gameProgress).some(game => (game.attempts || 0) >= 10);
      
      default:
        return false;
    }
  };

  // Helper function to get achievement progress
  const getAchievementProgress = (achievement, gameProgress) => {
    if (!gameProgress) return 0;
    
    switch (achievement.requirementType) {
      case 'gameCompleted':
        return Object.values(gameProgress).filter(game => game.completed === true).length;
      
      case 'allGamesCompleted':
        return Object.values(gameProgress).filter(game => game.completed === true).length;
      
      case 'equationCompleted':
        return gameProgress.equation?.completed ? 1 : 0;
      
      case 'battleCompleted':
        return gameProgress.battle?.completed ? 1 : 0;
      
      case 'spaceCompleted':
        return gameProgress.spaceShooter?.completed ? 1 : 0;
      
      case 'score500':
        return Math.max(...Object.values(gameProgress).map(game => game.highScore || 0));
      
      case 'score1000':
        return Math.max(...Object.values(gameProgress).map(game => game.highScore || 0));
      
      case 'equationScore':
        return gameProgress.equation?.highScore || 0;
      
      case 'battleScore':
        return gameProgress.battle?.highScore || 0;
      
      case 'spaceScore':
        return gameProgress.spaceShooter?.highScore || 0;
      
      case 'attempts5':
        return Math.max(...Object.values(gameProgress).map(game => game.attempts || 0));
      
      case 'attempts10':
        return Math.max(...Object.values(gameProgress).map(game => game.attempts || 0));
      
      default:
        return 0;
    }
  };

  // Helper function to calculate total scores from game progress
  const calculateTotalScores = (gameProgress) => {
    if (!gameProgress) return 0;
    const equationScore = gameProgress.equation?.highScore || 0;
    const battleScore = gameProgress.battle?.highScore || 0;
    const spaceScore = gameProgress.spaceShooter?.highScore || 0;
    return equationScore + battleScore + spaceScore;
  };

  // Get username from user data using the same method as StudentHub
  const getUserName = useCallback(() => {
    // First try the getUserIdentifier function from context
    if (getUserIdentifier) {
      return getUserIdentifier();
    }
    // Then try userData
    if (userData?.username) {
      return userData.username;
    }
    // Then try user object
    if (user?.name) {
      return user.name;
    }
    if (user?.username) {
      return user.username;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Player';
  }, [getUserIdentifier, userData, user]);

  // Load leaderboard data from Supabase
  const loadLeaderboardData = useCallback(async () => {
    try {
      console.log('🔄 Loading leaderboard data...');
      const leaderboard = await leaderboardService.getLeaderboard();
      console.log('📊 Raw leaderboard data:', leaderboard);
      
      const filteredLeaderboard = leaderboard.filter(entry => 
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
          console.log('User not found in leaderboard');
        }
      }
      
      console.log('✅ Leaderboard loaded:', filteredLeaderboard.length, 'players');
    } catch (error) {
      console.error('❌ Error loading leaderboard:', error);
    }
  }, [user?.email]);

  // Force update leaderboard with latest data from dashboard
  const forceUpdateLeaderboard = useCallback(async () => {
    if (!user?.email || user.email === 'guest') return;
    
    try {
      // Get the latest game progress and XP from userData (this is the source of truth)
      const latestGameProgress = userData?.gameProgress || {};
      
      // Calculate total scores from all games
      const latestScores = calculateTotalScores(latestGameProgress);
      
      // Get latest XP from userData or from getUserXP function
      const latestXP = getUserXP ? getUserXP() : (userData?.xp || 0);
      
      // Calculate achievements XP
      const achievementsXP = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + (a.xpReward || 0), 0);
      
      // Total XP = Game XP + Achievements XP
      const totalXP = latestXP + achievementsXP;
      
      const username = getUserName();
      
      console.log('📊 Force updating leaderboard with dashboard values:', {
        email: user.email,
        username,
        totalXP,
        totalScores: latestScores,
        gameXP: latestXP,
        achievementsXP
      });
      
      // Update Supabase with current dashboard values
      await leaderboardService.forceUpdateLeaderboard(user.email, username, totalXP, latestScores);
      console.log('✅ Leaderboard force updated with dashboard values');
      
      // Update local state to match
      setTotalScores(latestScores);
      setGameXP(latestXP);
      
      // Reload leaderboard after update
      await loadLeaderboardData();
      setLastUpdate(Date.now());
      
    } catch (error) {
      console.error('❌ Error force updating leaderboard:', error);
    }
  }, [user, userData, achievements, loadLeaderboardData, getUserXP, getUserName]);

  // Load user achievements and data
  const loadUserData = useCallback(async () => {
    if (!user?.email) {
      console.log('Waiting for user to log in...');
      setLoading(false);
      return;
    }

    console.log(`🔄 Loading achievements for user: ${user.email}`);
    setLoading(true);
    
    try {
      // Get game progress from userData (source of truth)
      let gameProgress = userData?.gameProgress || {};
      
      // If no userData, try localStorage
      if (Object.keys(gameProgress).length === 0) {
        const savedProgress = localStorage.getItem('gameProgress');
        if (savedProgress) {
          gameProgress = JSON.parse(savedProgress);
          console.log('Game progress from localStorage:', gameProgress);
        }
      }
      
      // Calculate total scores
      const totalScoresValue = calculateTotalScores(gameProgress);
      setTotalScores(totalScoresValue);
      
      // Load XP from userData (source of truth)
      let loadedXP = getUserXP ? getUserXP() : (userData?.xp || 0);
      
      // If no userData, try localStorage
      if (loadedXP === 0 && user?.email) {
        const savedXP = localStorage.getItem(`userXP_${user.email}`);
        if (savedXP && !isNaN(parseInt(savedXP))) {
          loadedXP = parseInt(savedXP);
        }
      }
      setGameXP(loadedXP);
      
      console.log('✅ Dashboard values loaded:', {
        gameXP: loadedXP,
        totalScores: totalScoresValue,
        gameProgress
      });
      
      // Get achievements from Supabase
      let userAchievements = await leaderboardService.getUserAchievements(user.email);
      
      if (!userAchievements || userAchievements.length === 0) {
        console.log('Creating new achievements for user');
        userAchievements = achievementTemplates.map(template => {
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
        // Update existing achievements progress
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
      
      // Save to localStorage as backup
      localStorage.setItem(`achievements_${user.email}`, JSON.stringify(userAchievements));
      
      // Force update leaderboard with current dashboard values
      await forceUpdateLeaderboard();
      
      // Load leaderboard data
      await loadLeaderboardData();
      
      // Update userData if needed
      if (updateUserData) {
        updateUserData({ 
          ...userData,
          achievements: userAchievements,
          xp: loadedXP,
          username: getUserName()
        });
      }
      
    } catch (error) {
      console.error('❌ Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [user, userData, updateUserData, loadLeaderboardData, forceUpdateLeaderboard, getUserXP, getUserName]);

  // Initial load
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Listen for messages from Games component to update leaderboard
  useEffect(() => {
    const handleMessage = (event) => {
      console.log('📨 Message received in Achievement:', event.data);
      
      if (event.data && event.data.type === 'SCORE_UPDATE') {
        console.log('📊 Score update received, refreshing data...');
        // Refresh all data
        loadUserData();
      }
      
      if (event.data && event.data.type === 'GAME_RESULT') {
        console.log('🎮 Game result received, refreshing data...');
        // Refresh all data after a short delay
        setTimeout(() => loadUserData(), 500);
      }
      
      if (event.data && event.data.type === 'XP_UPDATE') {
        console.log('⭐ XP update received, refreshing leaderboard...');
        // Refresh leaderboard immediately for XP changes
        setTimeout(() => forceUpdateLeaderboard(), 100);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadUserData, forceUpdateLeaderboard]);

  // Periodic refresh of leaderboard (every 10 seconds)
  useEffect(() => {
    if (!user?.email) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Periodic leaderboard refresh...');
      forceUpdateLeaderboard();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [user?.email, forceUpdateLeaderboard]);

  // Refresh when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.email) {
        console.log('👁️ Page became visible, refreshing data...');
        forceUpdateLeaderboard();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.email, forceUpdateLeaderboard]);

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
    totalXP: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + (a.xpReward || 0), 0) + gameXP,
    totalCoins: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + (a.coinReward || 0), 0),
    totalScores: totalScores
  };

  const leaderboardTotals = {
    totalScores: leaderboardData.reduce((sum, entry) => sum + (entry.totalScores || 0), 0),
    totalXP: leaderboardData.reduce((sum, entry) => sum + (entry.totalXP || 0), 0),
    totalPlayers: leaderboardData.length
  };

  const currentUserData = leaderboardData.find(entry => entry.email === user?.email);
  
  const getRankBadge = (rank) => {
    if (rank === 1) return { emoji: '🥇', text: 'GOLD', color: '#f59e0b' };
    if (rank === 2) return { emoji: '🥈', text: 'SILVER', color: '#94a3b8' };
    if (rank === 3) return { emoji: '🥉', text: 'BRONZE', color: '#cd7f32' };
    return null;
  };

  if (loading) {
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
  const currentXP = getUserXP ? getUserXP() : gameXP;

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
              <button onClick={forceUpdateLeaderboard} style={styles.refreshButton}>
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
                  <span style={styles.userStatValue}>{stats.totalXP}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview - Dashboard */}
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
                {stats.totalXP}
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
            <button onClick={forceUpdateLeaderboard} style={styles.smallRefreshButton}>
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
                        key={entry.email} 
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
                              {isCurrentUser ? stats.totalXP : (entry.totalXP?.toLocaleString() || 0)} XP
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

        {/* Privacy Note */}
       

        {/* Achievements Grid */}
        <div style={styles.achievementsGrid}>
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              style={{
                ...styles.achievementCard,
                opacity: achievement.unlocked ? 1 : 0.8,
                borderLeft: `4px solid ${getRarityColor(achievement.rarity)}`,
              }}
            >
              <div style={{ ...styles.achievementIcon, backgroundColor: achievement.color + '20', color: achievement.color }}>
                {achievement.icon}
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
          ))}
        </div>

        {achievements.length === 0 && (
          <div style={styles.emptyState}>
            <GiAchievement size={64} color="#d1d5db" />
            <h3 style={styles.emptyTitle}>No achievements found</h3>
            <p style={styles.emptyText}>Start playing games to earn achievements!</p>
          </div>
        )}
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
  lastUpdateBadge: {
    fontSize: '11px',
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
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
  privacyNote: {
    marginBottom: '20px',
    padding: '12px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#92400e',
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

export default Achievement;