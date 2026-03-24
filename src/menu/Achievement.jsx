import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { GiAchievement, GiTrophy, GiMedal, GiStarMedal, GiLaurelCrown, GiCupcake } from 'react-icons/gi';
import { FaMedal, FaStar, FaCrown, FaRocket, FaBolt, FaShieldAlt } from 'react-icons/fa';
import { MdLock, MdEmojiEvents, MdTimeline, MdTrendingUp, MdSchool, MdCode } from 'react-icons/md';
import { IoMdTrophy } from 'react-icons/io';
import { RiMedalLine } from 'react-icons/ri';

function Achievement() {
  // Get user data from context
  const { user, userData, updateUserData, getUserIdentifier } = useOutletContext();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [showUnlocked, setShowUnlocked] = useState(true);
  const [showLocked, setShowLocked] = useState(true);
  const [achievements, setAchievements] = useState([]);

  // Define the base achievement templates
  const achievementTemplates = [
    // Math Achievements
    {
      id: 1,
      name: "Math Novice",
      description: "Complete 10 math problems correctly",
      category: "math",
      rarity: "common",
      xpReward: 50,
      coinReward: 25,
      icon: <FaStar size={24} />,
      total: 10,
      color: "#3b82f6",
      requirementType: "mathProblems",
      requirementValue: 10
    },
    {
      id: 2,
      name: "Math Whiz",
      description: "Complete 50 math problems correctly",
      category: "math",
      rarity: "rare",
      xpReward: 150,
      coinReward: 75,
      icon: <FaBolt size={24} />,
      total: 50,
      color: "#8b5cf6",
      requirementType: "mathProblems",
      requirementValue: 50
    },
    {
      id: 3,
      name: "Math Master",
      description: "Complete 100 math problems correctly",
      category: "math",
      rarity: "epic",
      xpReward: 300,
      coinReward: 150,
      icon: <GiTrophy size={24} />,
      total: 100,
      color: "#f59e0b",
      requirementType: "mathProblems",
      requirementValue: 100
    },
    // Reading Achievements
    {
      id: 4,
      name: "Bookworm Beginner",
      description: "Read 5 stories",
      category: "reading",
      rarity: "common",
      xpReward: 50,
      coinReward: 25,
      icon: <FaStar size={24} />,
      total: 5,
      color: "#10b981",
      requirementType: "storiesRead",
      requirementValue: 5
    },
    {
      id: 5,
      name: "Story Explorer",
      description: "Read 20 stories",
      category: "reading",
      rarity: "rare",
      xpReward: 150,
      coinReward: 75,
      icon: <RiMedalLine size={24} />,
      total: 20,
      color: "#14b8a6",
      requirementType: "storiesRead",
      requirementValue: 20
    },
    {
      id: 6,
      name: "Reading Champion",
      description: "Read 50 stories",
      category: "reading",
      rarity: "epic",
      xpReward: 300,
      coinReward: 150,
      icon: <FaCrown size={24} />,
      total: 50,
      color: "#ef4444",
      requirementType: "storiesRead",
      requirementValue: 50
    },
    // Science Achievements
    {
      id: 7,
      name: "Science Explorer",
      description: "Complete 5 science experiments",
      category: "science",
      rarity: "common",
      xpReward: 50,
      coinReward: 25,
      icon: <FaStar size={24} />,
      total: 5,
      color: "#6366f1",
      requirementType: "scienceExperiments",
      requirementValue: 5
    },
    {
      id: 8,
      name: "Lab Assistant",
      description: "Complete 15 science experiments",
      category: "science",
      rarity: "rare",
      xpReward: 150,
      coinReward: 75,
      icon: <FaShieldAlt size={24} />,
      total: 15,
      color: "#a855f7",
      requirementType: "scienceExperiments",
      requirementValue: 15
    },
    // Language Achievements
    {
      id: 9,
      name: "Word Collector",
      description: "Learn 20 new words",
      category: "language",
      rarity: "common",
      xpReward: 50,
      coinReward: 25,
      icon: <FaStar size={24} />,
      total: 20,
      color: "#ec4899",
      requirementType: "wordsLearned",
      requirementValue: 20
    },
    {
      id: 10,
      name: "Vocabulary Builder",
      description: "Learn 50 new words",
      category: "language",
      rarity: "rare",
      xpReward: 150,
      coinReward: 75,
      icon: <GiMedal size={24} />,
      total: 50,
      color: "#d946ef",
      requirementType: "wordsLearned",
      requirementValue: 50
    },
    // Special Achievements
    {
      id: 11,
      name: "Perfect Score",
      description: "Get 100% on any quiz",
      category: "special",
      rarity: "epic",
      xpReward: 500,
      coinReward: 250,
      icon: <GiLaurelCrown size={24} />,
      total: 1,
      color: "#f97316",
      requirementType: "perfectScore",
      requirementValue: 1
    },
    {
      id: 12,
      name: "Speed Demon",
      description: "Complete a mission in under 5 minutes",
      category: "special",
      rarity: "rare",
      xpReward: 200,
      coinReward: 100,
      icon: <FaRocket size={24} />,
      total: 1,
      color: "#06b6d4",
      requirementType: "speedRun",
      requirementValue: 1
    },
    {
      id: 13,
      name: "Streak Master",
      description: "Maintain a 7-day learning streak",
      category: "special",
      rarity: "epic",
      xpReward: 400,
      coinReward: 200,
      icon: <GiCupcake size={24} />,
      total: 7,
      color: "#84cc16",
      requirementType: "learningStreak",
      requirementValue: 7
    },
    {
      id: 14,
      name: "Achievement Hunter",
      description: "Unlock 10 achievements",
      category: "special",
      rarity: "legendary",
      xpReward: 1000,
      coinReward: 500,
      icon: <GiAchievement size={24} />,
      total: 10,
      color: "#eab308",
      requirementType: "achievementCount",
      requirementValue: 10
    }
  ];

  // Load user achievements from userData
  useEffect(() => {
    if (!user || !user.email) {
      console.log('No user found, waiting for user data...');
      return;
    }

    try {
      // Get user-specific achievement data
      let userAchievements = userData?.achievements || [];
      
      // If no achievements data exists, initialize with default unlocked ones
      if (userAchievements.length === 0) {
        // Check which achievements should be unlocked based on user stats
        const initialAchievements = achievementTemplates.map(template => {
          const shouldBeUnlocked = checkIfAchievementUnlocked(template, userData);
          return {
            ...template,
            unlocked: shouldBeUnlocked,
            unlockedDate: shouldBeUnlocked ? new Date().toISOString() : null,
            progress: shouldBeUnlocked ? template.total : 0
          };
        });
        
        userAchievements = initialAchievements;
        
        // Save initial achievements to userData
        if (updateUserData) {
          updateUserData({
            achievements: userAchievements
          });
        }
      }
      
      setAchievements(userAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  }, [user, userData]); // Re-run when user or userData changes

  // Check if an achievement should be unlocked based on user stats
  const checkIfAchievementUnlocked = (template, userStats) => {
    if (!userStats) return false;
    
    switch(template.requirementType) {
      case 'mathProblems':
        return (userStats.mathProblemsCompleted || 0) >= template.requirementValue;
      case 'storiesRead':
        return (userStats.storiesRead || 0) >= template.requirementValue;
      case 'scienceExperiments':
        return (userStats.scienceExperiments || 0) >= template.requirementValue;
      case 'wordsLearned':
        return (userStats.wordsLearned || 0) >= template.requirementValue;
      case 'perfectScore':
        return (userStats.perfectScores || 0) >= template.requirementValue;
      case 'speedRun':
        return (userStats.speedRuns || 0) >= template.requirementValue;
      case 'learningStreak':
        return (userStats.learningStreak || 0) >= template.requirementValue;
      case 'achievementCount':
        return (userStats.unlockedAchievements || 0) >= template.requirementValue;
      default:
        return false;
    }
  };

  // Update achievement progress based on user activity
  const updateAchievementProgress = (achievementId, progress) => {
    setAchievements(prev => {
      const updated = prev.map(achievement => {
        if (achievement.id === achievementId && !achievement.unlocked) {
          const newProgress = Math.min(achievement.total, progress);
          const nowUnlocked = newProgress >= achievement.total;
          
          if (nowUnlocked && !achievement.unlocked) {
            // Achievement just unlocked!
            console.log(`🎉 Achievement unlocked: ${achievement.name} for user ${user?.email}`);
            
            // Update user stats with XP and coins
            if (updateUserData) {
              const currentStats = userData || {};
              updateUserData({
                totalXP: (currentStats.totalXP || 0) + achievement.xpReward,
                totalCoins: (currentStats.totalCoins || 0) + achievement.coinReward,
                unlockedAchievements: (currentStats.unlockedAchievements || 0) + 1
              });
            }
            
            return {
              ...achievement,
              unlocked: true,
              unlockedDate: new Date().toISOString(),
              progress: newProgress
            };
          }
          
          return {
            ...achievement,
            progress: newProgress
          };
        }
        return achievement;
      });
      
      // Save updated achievements to userData
      if (updateUserData) {
        updateUserData({ achievements: updated });
      }
      
      return updated;
    });
  };

  // Listen for achievement updates from other components
  useEffect(() => {
    const handleAchievementUpdate = (event) => {
      if (event.data && event.data.type === 'ACHIEVEMENT_UPDATE') {
        const { achievementId, progress } = event.data;
        updateAchievementProgress(achievementId, progress);
      }
    };
    
    window.addEventListener('message', handleAchievementUpdate);
    
    return () => {
      window.removeEventListener('message', handleAchievementUpdate);
    };
  }, [user, updateUserData]);

  const categories = [
    { id: 'all', name: 'All Categories', icon: <GiAchievement /> },
    { id: 'math', name: 'Math', icon: '🔢' },
    { id: 'reading', name: 'Reading', icon: '📚' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'language', name: 'Language', icon: '🗣️' },
    { id: 'special', name: 'Special', icon: '✨' }
  ];

  const rarities = [
    { id: 'all', name: 'All Rarities', color: '#6b7280' },
    { id: 'common', name: 'Common', color: '#10b981' },
    { id: 'rare', name: 'Rare', color: '#3b82f6' },
    { id: 'epic', name: 'Epic', color: '#8b5cf6' },
    { id: 'legendary', name: 'Legendary', color: '#f59e0b' }
  ];

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

  const filteredAchievements = achievements.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;
    const rarityMatch = selectedRarity === 'all' || achievement.rarity === selectedRarity;
    const statusMatch = (showUnlocked && achievement.unlocked) || (showLocked && !achievement.unlocked);
    return categoryMatch && rarityMatch && statusMatch;
  });

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.unlocked).length,
    locked: achievements.filter(a => !a.unlocked).length,
    totalXP: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0),
    totalCoins: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.coinReward, 0),
    completionRate: achievements.length > 0 ? Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100) : 0
  };

  // Show loading state if no user
  if (!user || !user.email) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading your achievements...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <GiAchievement size={40} color="#f59e0b" />
          <h1 style={styles.title}>Achievement Gallery</h1>
        </div>
        <p style={styles.subtitle}>Track your progress and earn rewards, {user?.name?.split(' ')[0] || getUserIdentifier()}!</p>
      </div>

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
          <FaMedal size={32} color="#10b981" />
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Unlocked</span>
            <span style={styles.statValue}>{stats.unlocked}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <MdLock size={32} color="#ef4444" />
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Locked</span>
            <span style={styles.statValue}>{stats.locked}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <MdTimeline size={32} color="#8b5cf6" />
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Completion Rate</span>
            <span style={styles.statValue}>{stats.completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div style={styles.progressOverview}>
        <div style={styles.progressHeader}>
          <h3 style={styles.progressTitle}>Overall Progress</h3>
          <span style={styles.progressPercentage}>{stats.completionRate}%</span>
        </div>
        <div style={styles.progressBarContainer}>
          <div 
            style={{
              ...styles.progressBar,
              width: `${stats.completionRate}%`,
              backgroundColor: stats.completionRate > 66 ? '#10b981' : stats.completionRate > 33 ? '#f59e0b' : '#ef4444'
            }}
          />
        </div>
        <div style={styles.rewardsSummary}>
          <div style={styles.rewardItem}>
            <FaBolt size={16} color="#f59e0b" />
            <span style={styles.rewardText}>{stats.totalXP} Total XP Earned</span>
          </div>
          <div style={styles.rewardItem}>
            <GiTrophy size={16} color="#f59e0b" />
            <span style={styles.rewardText}>{stats.totalCoins} Total Coins Earned</span>
          </div>
        </div>
      </div>

      {/* Privacy Note */}
      <div style={styles.privacyNote}>
        <p>🔒 Your achievements are private and only visible to you, {user?.name?.split(' ')[0] || 'Student'}.</p>
      </div>

      {/* Filters */}
      <div style={styles.filtersSection}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Category:</label>
          <div style={styles.filterButtons}>
            {categories.map(category => (
              <button
                key={category.id}
                style={{
                  ...styles.filterButton,
                  backgroundColor: selectedCategory === category.id ? '#2563eb' : 'white',
                  color: selectedCategory === category.id ? 'white' : '#374151',
                }}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span style={styles.filterIcon}>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Rarity:</label>
          <div style={styles.filterButtons}>
            {rarities.map(rarity => (
              <button
                key={rarity.id}
                style={{
                  ...styles.filterButton,
                  backgroundColor: selectedRarity === rarity.id ? rarity.color : 'white',
                  color: selectedRarity === rarity.id ? 'white' : '#374151',
                  border: selectedRarity === rarity.id ? 'none' : `2px solid ${rarity.color}`,
                }}
                onClick={() => setSelectedRarity(rarity.id)}
              >
                {rarity.name}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Status:</label>
          <div style={styles.statusFilters}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showUnlocked}
                onChange={(e) => setShowUnlocked(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>Unlocked</span>
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showLocked}
                onChange={(e) => setShowLocked(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>Locked</span>
            </label>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div style={styles.achievementsGrid}>
        {filteredAchievements.map(achievement => (
          <div
            key={achievement.id}
            style={{
              ...styles.achievementCard,
              opacity: achievement.unlocked ? 1 : 0.8,
              borderLeft: `4px solid ${getRarityColor(achievement.rarity)}`,
            }}
          >
            {/* Achievement Icon */}
            <div style={{ ...styles.achievementIcon, backgroundColor: achievement.color + '20', color: achievement.color }}>
              {achievement.icon}
            </div>

            {/* Achievement Content */}
            <div style={styles.achievementContent}>
              <div style={styles.achievementHeader}>
                <h3 style={styles.achievementName}>{achievement.name}</h3>
                <span style={{ ...styles.rarityBadge, backgroundColor: getRarityColor(achievement.rarity) + '20', color: getRarityColor(achievement.rarity) }}>
                  {getRarityBadge(achievement.rarity)}
                </span>
              </div>

              <p style={styles.achievementDescription}>{achievement.description}</p>

              {/* Progress Bar for locked achievements */}
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

              {/* Rewards */}
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

              {/* Unlocked Date */}
              {achievement.unlocked && achievement.unlockedDate && (
                <div style={styles.unlockedInfo}>
                  <MdEmojiEvents size={14} color="#10b981" />
                  <span style={styles.unlockedDate}>
                    Unlocked on {new Date(achievement.unlockedDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Locked Overlay */}
            {!achievement.unlocked && (
              <div style={styles.lockedIcon}>
                <MdLock size={20} color="#9ca3af" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div style={styles.emptyState}>
          <GiAchievement size={64} color="#d1d5db" />
          <h3 style={styles.emptyTitle}>No achievements found</h3>
          <p style={styles.emptyText}>Try adjusting your filters to see more achievements</p>
        </div>
      )}

      {/* Next Achievements Preview */}
      {achievements.filter(a => !a.unlocked).length > 0 && (
        <div style={styles.nextAchievements}>
          <h3 style={styles.nextTitle}>🎯 Next Achievements to Unlock</h3>
          <div style={styles.nextGrid}>
            {achievements.filter(a => !a.unlocked).slice(0, 3).map(achievement => (
              <div key={achievement.id} style={styles.nextCard}>
                <div style={{ ...styles.nextIcon, backgroundColor: achievement.color + '20', color: achievement.color }}>
                  {achievement.icon}
                </div>
                <div style={styles.nextInfo}>
                  <h4 style={styles.nextName}>{achievement.name}</h4>
                  <p style={styles.nextDesc}>{achievement.description}</p>
                  <div style={styles.nextProgress}>
                    <div style={styles.nextProgressBar}>
                      <div 
                        style={{
                          ...styles.nextProgressFill,
                          width: `${(achievement.progress / achievement.total) * 100}%`,
                          backgroundColor: achievement.color
                        }}
                      />
                    </div>
                    <span style={styles.nextProgressText}>
                      {achievement.progress}/{achievement.total}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
  progressOverview: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  progressTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  progressPercentage: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2563eb',
  },
  progressBarContainer: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '15px',
  },
  progressBar: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  rewardsSummary: {
    display: 'flex',
    gap: '20px',
  },
  rewardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  rewardText: {
    fontSize: '14px',
    color: '#4b5563',
  },
  filtersSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px',
  },
  filterGroup: {
    marginBottom: '15px',
    ':last-child': {
      marginBottom: 0,
    },
  },
  filterLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
  },
  filterButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  filterIcon: {
    fontSize: '16px',
  },
  statusFilters: {
    display: 'flex',
    gap: '20px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '14px',
    color: '#374151',
  },
  achievementsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
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
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    },
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
  nextAchievements: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  nextTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
  },
  nextGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
  },
  nextCard: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  nextIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nextInfo: {
    flex: 1,
  },
  nextName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    marginBottom: '4px',
  },
  nextDesc: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  nextProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  nextProgressBar: {
    flex: 1,
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  nextProgressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  nextProgressText: {
    fontSize: '11px',
    color: '#6b7280',
    minWidth: '40px',
  },
};

// Add keyframes for spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Achievement;