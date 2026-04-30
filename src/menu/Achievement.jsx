// src/components/Achievement.jsx - FULLY RESPONSIVE (optimized for 308x748 and all screen sizes)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { GiAchievement, GiTrophy } from 'react-icons/gi';
import { FaStar, FaBolt } from 'react-icons/fa';
import { MdLock, MdEmojiEvents, MdTrendingUp } from 'react-icons/md';
import { leaderboardService } from '../services/leaderboardService';

const ACHIEVEMENT_TEMPLATES = [
  { id: 'point_collector', name: 'Point Collector', description: 'Collect points across all games', requirementType: 'score1000', total: 1000, xpReward: 500, coinReward: 100, rarity: 'rare', iconType: 'star', color: '#8b5cf6' },
  { id: 'arena_champion', name: 'Arena Champion', description: 'Complete Math Battle Arena', requirementType: 'battleCompleted', total: 1, xpReward: 100, coinReward: 50, rarity: 'rare', iconType: 'trophy', color: '#3b82f6' }
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
  
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);
  const refreshIntervalRef = useRef(null);
  const isMobileRef = useRef(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

  const clearOldAchievementData = useCallback(async () => {
    if (!user?.email || dataCleared) return;
    try {
      await leaderboardService.updateUserAchievements(user.email, []);
      setDataCleared(true);
    } catch (error) { console.error('Error clearing old data:', error); }
  }, [user?.email, dataCleared]);

  const getIconForAchievement = (iconType, size = 24) => {
    switch(iconType) {
      case 'star': return React.createElement(FaStar, { size, key: 'star-icon' });
      case 'trophy': return React.createElement(GiTrophy, { size, key: 'trophy-icon' });
      default: return React.createElement(FaStar, { size, key: 'default-icon' });
    }
  };

  const checkIfAchievementUnlocked = useCallback((achievement, gameProgress) => {
    if (!gameProgress) return false;
    switch (achievement.requirementType) {
      case 'battleCompleted': return gameProgress.battle?.completed === true;
      case 'score1000': return Object.values(gameProgress).some(game => (game?.highScore || 0) >= 1000);
      default: return false;
    }
  }, []);

  const getAchievementProgress = useCallback((achievement, gameProgress) => {
    if (!gameProgress) return 0;
    switch (achievement.requirementType) {
      case 'battleCompleted': return gameProgress.battle?.completed ? 1 : 0;
      case 'score1000': return Math.max(...Object.values(gameProgress).map(game => game?.highScore || 0));
      default: return 0;
    }
  }, []);

  const calculateTotalScores = useCallback((gameProgress) => {
    if (!gameProgress) return 0;
    return (gameProgress.equation?.highScore || 0) + (gameProgress.battle?.highScore || 0) + (gameProgress.spaceShooter?.highScore || 0);
  }, []);

  const getUserName = useCallback(() => {
    try {
      if (getUserIdentifier && typeof getUserIdentifier === 'function') {
        const identifier = getUserIdentifier();
        if (identifier) return identifier;
      }
      if (userData?.username) return userData.username;
      if (user?.name) return user.name;
      if (user?.email) return user.email.split('@')[0];
      return 'Player';
    } catch (err) { return 'Player'; }
  }, [getUserIdentifier, userData, user]);

  const saveToLocalStorage = useCallback((email, xp, scores, achievements, gameProgress) => {
    if (!email) return;
    try {
      localStorage.setItem(`userXP_${email}`, xp.toString());
      localStorage.setItem(`userTotalScores_${email}`, scores.toString());
      if (achievements) localStorage.setItem(`achievements_${email}`, JSON.stringify(achievements));
      if (gameProgress) localStorage.setItem(`gameProgress_${email}`, JSON.stringify(gameProgress));
    } catch (error) { console.error('Error saving to localStorage:', error); }
  }, []);

  const loadLeaderboardData = useCallback(async () => {
    try {
      const leaderboard = await leaderboardService.getLeaderboard();
      const filteredLeaderboard = leaderboard.filter(entry => entry && entry.email && !entry.email.includes('test') && !entry.email.includes('guest'));
      if (mountedRef.current) {
        setLeaderboardData(filteredLeaderboard);
        if (user?.email) {
          const userIndex = filteredLeaderboard.findIndex(entry => entry.email === user.email);
          setUserRank(userIndex !== -1 ? userIndex + 1 : null);
        }
      }
    } catch (error) { console.error('Error loading leaderboard:', error); }
  }, [user?.email]);

  const forceUpdateLeaderboard = useCallback(async () => {
    if (!user?.email || isLoadingRef.current) return;
    try {
      const latestGameProgress = userData?.gameProgress || {};
      const latestScores = calculateTotalScores(latestGameProgress);
      const latestGameXP = getUserXP && typeof getUserXP === 'function' ? getUserXP() : (userData?.xp || 0);
      await leaderboardService.forceUpdateLeaderboard(user.email, getUserName(), latestGameXP, latestScores);
      if (mountedRef.current) { setTotalScores(latestScores); setGameXP(latestGameXP); await loadLeaderboardData(); setLastUpdate(Date.now()); }
    } catch (error) { console.error('Error force updating leaderboard:', error); }
  }, [user, userData, loadLeaderboardData, getUserXP, getUserName, calculateTotalScores]);

  const loadUserData = useCallback(async (isRetry = false) => {
    if (isLoadingRef.current || !user?.email) { if (mountedRef.current) setLoading(false); return; }
    isLoadingRef.current = true;
    if (mountedRef.current) setLoading(true);
    try {
      if (!dataCleared) await clearOldAchievementData();
      let gameProgress = userData?.gameProgress || {};
      let userXP = userData?.xp || 0;
      let userTotalScores = userData?.totalScores || 0;
      
      if (Object.keys(gameProgress).length === 0) {
        const savedProgress = localStorage.getItem(`gameProgress_${user.email}`);
        if (savedProgress) gameProgress = JSON.parse(savedProgress);
      }
      if (userXP === 0) {
        const savedXP = localStorage.getItem(`userXP_${user.email}`);
        if (savedXP && !isNaN(parseInt(savedXP))) userXP = parseInt(savedXP);
      }
      if (userTotalScores === 0) {
        const savedScores = localStorage.getItem(`userTotalScores_${user.email}`);
        if (savedScores && !isNaN(parseInt(savedScores))) userTotalScores = parseInt(savedScores);
        else userTotalScores = calculateTotalScores(gameProgress);
      }
      
      if ((userXP > 0 || userTotalScores > 0) && (!userData?.xp || userData.xp === 0) && updateUserData) {
        await updateUserData({ ...userData, gameProgress, xp: userXP, totalScores: userTotalScores });
      }
      if (mountedRef.current) { setGameXP(userXP); setTotalScores(userTotalScores); }
      
      let userAchievements = await leaderboardService.getUserAchievements(user.email);
      if (!userAchievements || userAchievements.length === 0 || userAchievements.length !== ACHIEVEMENT_TEMPLATES.length) {
        userAchievements = ACHIEVEMENT_TEMPLATES.map(template => ({ ...template, unlocked: checkIfAchievementUnlocked(template, gameProgress), unlockedDate: checkIfAchievementUnlocked(template, gameProgress) ? new Date().toISOString() : null, progress: Math.min(getAchievementProgress(template, gameProgress), template.total) }));
        await leaderboardService.updateUserAchievements(user.email, userAchievements);
      } else {
        let updatedAchievements = userAchievements.filter(a => ACHIEVEMENT_TEMPLATES.some(t => t.id === a.id));
        for (const template of ACHIEVEMENT_TEMPLATES) {
          if (!updatedAchievements.some(a => a.id === template.id)) {
            updatedAchievements.push({ ...template, unlocked: checkIfAchievementUnlocked(template, gameProgress), unlockedDate: checkIfAchievementUnlocked(template, gameProgress) ? new Date().toISOString() : null, progress: getAchievementProgress(template, gameProgress) });
          }
        }
        updatedAchievements = updatedAchievements.map(achievement => {
          const template = ACHIEVEMENT_TEMPLATES.find(t => t.id === achievement.id);
          if (template && !achievement.unlocked) {
            const progressValue = getAchievementProgress(template, gameProgress);
            if (progressValue >= template.total && !achievement.unlocked) return { ...achievement, unlocked: true, unlockedDate: new Date().toISOString(), progress: progressValue };
          }
          return achievement;
        });
        await leaderboardService.updateUserAchievements(user.email, updatedAchievements);
        userAchievements = updatedAchievements;
      }
      if (mountedRef.current) setAchievements(userAchievements);
      saveToLocalStorage(user.email, userXP, userTotalScores, userAchievements, gameProgress);
      loadLeaderboardData().catch(console.error);
      if (!isRetry) forceUpdateLeaderboard().catch(console.error);
      hasLoadedRef.current = true;
    } catch (error) { console.error('Error loading achievements:', error); if (mountedRef.current) setError('Failed to load achievements.'); }
    finally { if (mountedRef.current) setLoading(false); isLoadingRef.current = false; }
  }, [user, userData, updateUserData, loadLeaderboardData, forceUpdateLeaderboard, getUserXP, getUserName, calculateTotalScores, checkIfAchievementUnlocked, getAchievementProgress, saveToLocalStorage, clearOldAchievementData, dataCleared]);

  useEffect(() => { mountedRef.current = true; if (user?.email && !hasLoadedRef.current && !isLoadingRef.current) { const delay = isMobileRef.current ? 100 : 0; setTimeout(() => loadUserData(), delay); } else if (!user?.email) setLoading(false); return () => { mountedRef.current = false; }; }, [user?.email, loadUserData]);

  useEffect(() => {
    let messageTimeout = null;
    const handleMessage = (event) => {
      if (event.data && (event.data.type === 'SCORE_UPDATE' || event.data.type === 'GAME_RESULT' || event.data.type === 'XP_UPDATE')) {
        if (messageTimeout) clearTimeout(messageTimeout);
        messageTimeout = setTimeout(() => { if (!isLoadingRef.current && hasLoadedRef.current) loadUserData(true); }, isMobileRef.current ? 1000 : 500);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => { window.removeEventListener('message', handleMessage); if (messageTimeout) clearTimeout(messageTimeout); };
  }, [loadUserData]);

  useEffect(() => {
    if (!user?.email || !hasLoadedRef.current) return;
    refreshIntervalRef.current = setInterval(() => { if (!isLoadingRef.current && !loading && hasLoadedRef.current && mountedRef.current) forceUpdateLeaderboard(); }, isMobileRef.current ? 60000 : 30000);
    return () => { if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current); };
  }, [user?.email, forceUpdateLeaderboard, loading]);

  const getRarityColor = (rarity) => ({ common: '#10b981', rare: '#3b82f6', epic: '#8b5cf6', legendary: '#f59e0b' }[rarity] || '#6b7280');
  const getRarityBadge = (rarity) => ({ common: '🟢 Common', rare: '🔵 Rare', epic: '🟣 Epic', legendary: '🟡 Legendary' }[rarity] || '⚪ Unknown');

  const stats = { total: achievements.length, unlocked: achievements.filter(a => a.unlocked).length, achievementsXP: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + (a.xpReward || 0), 0), gameXP: gameXP, totalXP: gameXP, totalCoins: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + (a.coinReward || 0), 0), totalScores: totalScores };
  const currentUserData = leaderboardData.find(entry => entry.email === user?.email);
  const getRankBadge = (rank) => rank === 1 ? { emoji: '🥇', text: 'GOLD', color: '#f59e0b' } : rank === 2 ? { emoji: '🥈', text: 'SILVER', color: '#94a3b8' } : rank === 3 ? { emoji: '🥉', text: 'BRONZE', color: '#cd7f32' } : null;

  if (loading && achievements.length === 0) return (<div style={styles.loadingContainer}><div style={styles.loadingSpinner}></div><p>Loading achievements...</p></div>);
  if (error) return (<div style={styles.errorContainer}><div style={styles.errorContent}><GiAchievement size={48} color="#ef4444" /><h3>Error</h3><p>{error}</p><button onClick={() => loadUserData()} style={styles.retryButton}>Try Again</button></div></div>);
  if (!user?.email) return (<div style={styles.emptyState}><GiAchievement size={48} color="#d1d5db" /><h3>Please log in</h3><p>Sign in to track your progress!</p></div>);

  const rankBadge = userRank && getRankBadge(userRank);
  const displayUsername = getUserName();
  const currentXP = getUserXP && typeof getUserXP === 'function' ? getUserXP() : gameXP;

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.header}><div style={styles.titleSection}><GiAchievement size={32} color="#f59e0b" /><h1 style={styles.title}>Achievements</h1></div><p style={styles.subtitle}>Track your progress and earn rewards!</p>{user && (<div style={styles.userInfo}><span><strong>{displayUsername}</strong></span><span style={styles.xpBadge}>⭐ {currentXP} XP</span><span style={styles.scoreBadge}>🎯 {totalScores}</span></div>)}</div>

        {userRank && currentUserData && (<div style={styles.userRankCard}><div style={styles.userRankHeader}><MdTrendingUp size={20} color="#f59e0b" /><h3>Global Rank</h3><button onClick={() => forceUpdateLeaderboard()} style={styles.smallRefreshButton}>🔄</button></div><div style={styles.userRankContent}><div style={styles.rankDisplay}>{rankBadge ? (<><span style={styles.rankEmoji}>{rankBadge.emoji}</span><div><span style={styles.rankNumberLarge}>#{userRank}</span><span style={{...styles.rankBadgeText, backgroundColor: rankBadge.color}}>{rankBadge.text}</span></div></>) : (<div><span style={styles.rankNumberLarge}>#{userRank}</span><span style={styles.rankPosition}>Overall</span></div>)}</div><div style={styles.userStats}><div><span style={styles.userStatLabel}>Score</span><span style={styles.userStatValue}>{stats.totalScores}</span></div><div><span style={styles.userStatLabel}>XP</span><span style={styles.userStatValue}>{stats.gameXP}</span></div></div></div></div>)}

        <div style={styles.statsGrid}><div style={styles.statCard}><GiTrophy size={24} color="#f59e0b" /><div><span style={styles.statLabel}>Total</span><span style={styles.statValue}>{stats.total}</span></div></div><div style={styles.statCard}><GiTrophy size={24} color="#10b981" /><div><span style={styles.statLabel}>Unlocked</span><span style={styles.statValue}>{stats.unlocked}</span></div></div><div style={styles.statCard}><FaBolt size={24} color="#f59e0b" /><div><span style={styles.statLabel}>XP</span><span style={styles.statValue}>{stats.gameXP}</span></div></div><div style={styles.statCard}><FaStar size={24} color="#f59e0b" /><div><span style={styles.statLabel}>Score</span><span style={styles.statValue}>{stats.totalScores}</span></div></div></div>

        <div style={styles.leaderboardSection}><div style={styles.sectionHeader}><GiTrophy size={20} color="#f59e0b" /><h2 style={styles.sectionTitle}>Leaderboard</h2><span style={styles.playerCount}>{leaderboardData.length}</span></div><div style={styles.tableContainer}><table style={styles.leaderboardTable}><thead><tr><th style={styles.tableHeader}>Rank</th><th style={styles.tableHeader}>Player</th><th style={styles.tableHeader}>Score</th><th style={styles.tableHeader}>XP</th></tr></thead><tbody>{leaderboardData.length > 0 ? leaderboardData.slice(0, isMobileRef.current ? 20 : 50).map((entry, index) => { const isCurrentUser = entry.email === user?.email; return (<tr key={entry.email || index} style={isCurrentUser ? styles.currentUserRow : styles.tableRow}><td style={styles.tableCell}>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : <span style={styles.rankNumber}>{index + 1}</span>}</td><td style={styles.tableCell}><div style={styles.usernameContainer}><span style={isCurrentUser ? styles.currentUser : styles.username}>{entry.username || entry.email?.split('@')[0]}</span>{isCurrentUser && <span style={styles.youBadge}>You</span>}</div></td><td style={styles.tableCell}><span style={styles.scoreValue}>{isCurrentUser ? stats.totalScores : (entry.totalScores?.toLocaleString() || 0)}</span></td><td style={styles.tableCell}><div style={styles.xpContainer}><FaBolt size={12} color="#f59e0b" /><span style={styles.xpValue}>{isCurrentUser ? stats.gameXP : (entry.totalXP?.toLocaleString() || 0)} XP</span></div></td></tr>); }) : <tr><td colSpan="4" style={styles.emptyTableMessage}>No players yet</td></tr>}</tbody></table></div></div>

        <div style={{...styles.achievementsGrid, gridTemplateColumns: isMobileRef.current ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))'}}>
          {achievements.length > 0 ? achievements.map(achievement => (<div key={achievement.id} style={{...styles.achievementCard, opacity: achievement.unlocked ? 1 : 0.8, borderLeft: `4px solid ${getRarityColor(achievement.rarity)}`}}><div style={{...styles.achievementIcon, backgroundColor: achievement.color + '20', color: achievement.color}}>{getIconForAchievement(achievement.iconType, 20)}</div><div style={styles.achievementContent}><div style={styles.achievementHeader}><h3 style={styles.achievementName}>{achievement.name}</h3><span style={{...styles.rarityBadge, backgroundColor: getRarityColor(achievement.rarity) + '20', color: getRarityColor(achievement.rarity)}}>{getRarityBadge(achievement.rarity)}</span></div><p style={styles.achievementDescription}>{achievement.description}</p>{!achievement.unlocked && (<div style={styles.progressContainer}><div style={styles.progressBarSmall}><div style={{...styles.progressFill, width: `${(achievement.progress / achievement.total) * 100}%`, backgroundColor: getRarityColor(achievement.rarity)}} /></div><span style={styles.progressText}>{achievement.progress}/{achievement.total}</span></div>)}<div style={styles.achievementRewards}><div style={styles.reward}><FaBolt size={10} color="#f59e0b" /><span style={styles.rewardValue}>{achievement.xpReward} XP</span></div><div style={styles.reward}><GiTrophy size={10} color="#f59e0b" /><span style={styles.rewardValue}>{achievement.coinReward} 🪙</span></div></div>{achievement.unlocked && achievement.unlockedDate && (<div style={styles.unlockedInfo}><MdEmojiEvents size={12} color="#10b981" /><span style={styles.unlockedDate}>{new Date(achievement.unlockedDate).toLocaleDateString()}</span></div>)}</div>{!achievement.unlocked && <div style={styles.lockedIcon}><MdLock size={16} color="#9ca3af" /></div>}</div>)) : (<div style={styles.emptyStateSmall}><GiAchievement size={40} color="#d1d5db" /><p>No achievements yet. Play games to earn!</p></div>)}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { width: '100%', minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '12px 0', '@media (min-width: 769px)': { padding: '20px 0' } },
  contentWrapper: { maxWidth: '100%', margin: '0', padding: '0 12px', '@media (min-width: 769px)': { maxWidth: '1400px', margin: '0 auto', padding: '0 20px' } },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', padding: '20px' },
  loadingSpinner: { width: '36px', height: '36px', border: '3px solid #f3f4f6', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  errorContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '16px' },
  errorContent: { textAlign: 'center', padding: '24px', backgroundColor: 'white', borderRadius: '12px', maxWidth: '320px', width: '90%' },
  retryButton: { marginTop: '16px', padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', minHeight: '40px' },
  header: { marginBottom: '20px', textAlign: 'center' },
  titleSection: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0, '@media (min-width: 769px)': { fontSize: '36px' } },
  subtitle: { fontSize: '13px', color: '#6b7280', margin: 0, '@media (min-width: 769px)': { fontSize: '18px' } },
  userInfo: { marginTop: '8px', fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' },
  xpBadge: { backgroundColor: '#fef3c7', color: '#f59e0b', padding: '3px 10px', borderRadius: '16px', fontWeight: 'bold', fontSize: '11px' },
  scoreBadge: { backgroundColor: '#d1fae5', color: '#059669', padding: '3px 10px', borderRadius: '16px', fontWeight: 'bold', fontSize: '11px' },
  userRankCard: { backgroundColor: 'white', borderRadius: '12px', padding: '14px', marginBottom: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' },
  userRankHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.2)', flexWrap: 'wrap' },
  userRankContent: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' },
  rankDisplay: { display: 'flex', alignItems: 'center', gap: '10px' },
  rankEmoji: { fontSize: '32px', '@media (min-width: 769px)': { fontSize: '48px' } },
  rankNumberLarge: { fontSize: '28px', fontWeight: 'bold', lineHeight: 1, '@media (min-width: 769px)': { fontSize: '48px' } },
  rankBadgeText: { fontSize: '10px', padding: '2px 8px', borderRadius: '16px', marginTop: '3px', display: 'inline-block', fontWeight: 'bold' },
  rankPosition: { fontSize: '11px', opacity: 0.9 },
  userStats: { display: 'flex', gap: '15px' },
  userStatLabel: { fontSize: '10px', opacity: 0.8, display: 'block', '@media (min-width: 769px)': { fontSize: '12px' } },
  userStatValue: { fontSize: '16px', fontWeight: 'bold', '@media (min-width: 769px)': { fontSize: '20px' } },
  smallRefreshButton: { marginLeft: 'auto', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', color: 'white', minHeight: '32px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px', '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(4, 1fr)' }, '@media (min-width: 769px)': { gap: '20px' } },
  statCard: { backgroundColor: 'white', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', '@media (min-width: 769px)': { padding: '20px', gap: '15px' } },
  statLabel: { fontSize: '10px', color: '#6b7280', display: 'block', '@media (min-width: 769px)': { fontSize: '14px' } },
  statValue: { fontSize: '18px', fontWeight: '700', color: '#1f2937', '@media (min-width: 769px)': { fontSize: '24px' } },
  leaderboardSection: { marginBottom: '20px', backgroundColor: 'white', borderRadius: '12px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', '@media (min-width: 769px)': { padding: '20px', marginBottom: '30px' } },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0, '@media (min-width: 769px)': { fontSize: '24px' } },
  playerCount: { marginLeft: 'auto', fontSize: '11px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '16px' },
  tableContainer: { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
  leaderboardTable: { width: '100%', borderCollapse: 'collapse', minWidth: '300px' },
  tableHeader: { textAlign: 'left', padding: '8px 6px', backgroundColor: '#f9fafb', fontWeight: '600', color: '#374151', fontSize: '11px', '@media (min-width: 769px)': { padding: '12px', fontSize: '14px' } },
  tableRow: { borderBottom: '1px solid #f3f4f6' },
  currentUserRow: { borderBottom: '1px solid #f3f4f6', backgroundColor: '#fef3c7' },
  tableCell: { padding: '8px 6px', color: '#4b5563', fontSize: '10px', '@media (min-width: 769px)': { padding: '14px 12px', fontSize: '14px' } },
  rankNumber: { fontWeight: '600', color: '#6b7280', fontSize: '12px', '@media (min-width: 769px)': { fontSize: '14px' } },
  usernameContainer: { display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' },
  username: { fontWeight: '500', color: '#374151', fontSize: '10px', '@media (min-width: 769px)': { fontSize: '14px' } },
  currentUser: { fontWeight: '700', color: '#f59e0b', fontSize: '10px', '@media (min-width: 769px)': { fontSize: '14px' } },
  youBadge: { fontSize: '8px', padding: '1px 6px', borderRadius: '10px', backgroundColor: '#f59e0b', color: 'white', fontWeight: '600', '@media (min-width: 769px)': { fontSize: '11px', padding: '2px 8px' } },
  scoreValue: { fontWeight: '600', color: '#059669', fontSize: '10px', '@media (min-width: 769px)': { fontSize: '14px' } },
  xpContainer: { display: 'flex', alignItems: 'center', gap: '4px' },
  xpValue: { fontWeight: '600', color: '#f59e0b', fontSize: '10px', '@media (min-width: 769px)': { fontSize: '14px' } },
  emptyTableMessage: { textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '12px' },
  achievementsGrid: { display: 'grid', gap: '12px', marginBottom: '24px' },
  achievementCard: { backgroundColor: 'white', borderRadius: '12px', padding: '14px', display: 'flex', gap: '12px', position: 'relative', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', '@media (min-width: 769px)': { padding: '20px', gap: '15px' } },
  achievementIcon: { width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, '@media (min-width: 769px)': { width: '60px', height: '60px', borderRadius: '12px' } },
  achievementContent: { flex: 1, minWidth: 0 },
  achievementHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' },
  achievementName: { fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0, '@media (min-width: 769px)': { fontSize: '16px' } },
  rarityBadge: { fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: '500', '@media (min-width: 769px)': { fontSize: '11px', padding: '2px 8px' } },
  achievementDescription: { fontSize: '11px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.4', '@media (min-width: 769px)': { fontSize: '13px', marginBottom: '12px' } },
  progressContainer: { marginBottom: '8px' },
  progressBarSmall: { width: '100%', height: '3px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden', marginBottom: '3px' },
  progressFill: { height: '100%', transition: 'width 0.3s ease' },
  progressText: { fontSize: '9px', color: '#6b7280', '@media (min-width: 769px)': { fontSize: '11px' } },
  achievementRewards: { display: 'flex', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' },
  reward: { display: 'flex', alignItems: 'center', gap: '3px' },
  rewardValue: { fontSize: '10px', fontWeight: '500', color: '#4b5563', '@media (min-width: 769px)': { fontSize: '12px' } },
  unlockedInfo: { display: 'flex', alignItems: 'center', gap: '4px' },
  unlockedDate: { fontSize: '9px', color: '#10b981', '@media (min-width: 769px)': { fontSize: '11px' } },
  lockedIcon: { position: 'absolute', top: '8px', right: '8px' },
  emptyState: { textAlign: 'center', padding: '40px 16px', backgroundColor: 'white', borderRadius: '12px', marginBottom: '24px' },
  emptyStateSmall: { textAlign: 'center', padding: '32px 16px', backgroundColor: '#f9fafb', borderRadius: '12px' }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .achievement-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; } tr:not(.current-user-row):hover { background-color: #f9fafb; } button:hover { opacity: 0.9; } button:active { transform: scale(0.97); } @media (max-width: 480px) { button { min-height: 40px; } .stat-card { padding: 8px 10px !important; } .stat-value { font-size: 14px !important; } .user-rank-card { padding: 10px !important; } .rank-number-large { font-size: 22px !important; } } @media (max-width: 360px) { .title { font-size: 20px !important; } .achievement-name { font-size: 12px !important; } .achievement-description { font-size: 9px !important; } .stat-value { font-size: 12px !important; } .stat-label { font-size: 8px !important; } }`;
document.head.appendChild(styleSheet);

export default Achievement;