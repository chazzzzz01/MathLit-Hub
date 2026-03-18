import React, { useState } from 'react';
import { MdAssignment, MdStar, MdLock, MdCheckCircle, MdTimer } from 'react-icons/md';
import { FaCoins, FaTrophy, FaMedal } from 'react-icons/fa';
import { GiAchievement } from 'react-icons/gi';

function Missions() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [missions, setMissions] = useState([
    {
      id: 1,
      title: "Math Master - Addition",
      description: "Complete 20 addition problems with 90% accuracy",
      category: "math",
      xpReward: 100,
      coinReward: 50,
      timeEstimate: "15 mins",
      difficulty: "Easy",
      completed: false,
      locked: false,
      progress: 0,
      total: 20
    },
    {
      id: 2,
      title: "Reading Comprehension",
      description: "Read 3 stories and answer questions",
      category: "reading",
      xpReward: 150,
      coinReward: 75,
      timeEstimate: "20 mins",
      difficulty: "Medium",
      completed: false,
      locked: false,
      progress: 1,
      total: 3
    },
    {
      id: 3,
      title: "Science Explorer",
      description: "Complete the virtual lab experiment",
      category: "science",
      xpReward: 200,
      coinReward: 100,
      timeEstimate: "25 mins",
      difficulty: "Hard",
      completed: true,
      locked: false,
      progress: 5,
      total: 5
    },
    {
      id: 4,
      title: "Spelling Bee Champion",
      description: "Spell 15 words correctly",
      category: "language",
      xpReward: 120,
      coinReward: 60,
      timeEstimate: "10 mins",
      difficulty: "Easy",
      completed: false,
      locked: true,
      progress: 0,
      total: 15
    },
    {
      id: 5,
      title: "Multiplication Tables",
      description: "Master the 7x table",
      category: "math",
      xpReward: 180,
      coinReward: 90,
      timeEstimate: "20 mins",
      difficulty: "Medium",
      completed: false,
      locked: false,
      progress: 8,
      total: 12
    },
    {
      id: 6,
      title: "Creative Writing",
      description: "Write a short story with 100 words",
      category: "writing",
      xpReward: 250,
      coinReward: 125,
      timeEstimate: "30 mins",
      difficulty: "Hard",
      completed: false,
      locked: false,
      progress: 0,
      total: 1
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Missions', icon: <MdAssignment size={18} /> },
    { id: 'math', name: 'Math', icon: '🔢' },
    { id: 'reading', name: 'Reading', icon: '📚' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'language', name: 'Language', icon: '🗣️' },
    { id: 'writing', name: 'Writing', icon: '✏️' }
  ];

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredMissions = selectedCategory === 'all' 
    ? missions 
    : missions.filter(m => m.category === selectedCategory);

  const handleStartMission = (missionId) => {
    // Navigate to mission details or start the mission
    console.log(`Starting mission ${missionId}`);
    // You can use navigate here if needed
  };

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <h1 style={styles.title}>🎯 Daily Missions</h1>
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <FaCoins color="#f59e0b" size={24} />
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>Total Coins</span>
              <span style={styles.statValue}>1,250</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <FaTrophy color="#2563eb" size={24} />
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>XP Earned</span>
              <span style={styles.statValue}>3,450</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <GiAchievement color="#8b5cf6" size={24} />
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>Completed</span>
              <span style={styles.statValue}>12/24</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div style={styles.categories}>
        {categories.map(category => (
          <button
            key={category.id}
            style={{
              ...styles.categoryButton,
              backgroundColor: selectedCategory === category.id ? '#2563eb' : 'white',
              color: selectedCategory === category.id ? 'white' : '#374151',
              border: selectedCategory === category.id ? 'none' : '1px solid #e5e7eb',
            }}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span style={styles.categoryIcon}>{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Missions Grid */}
      <div style={styles.missionsGrid}>
        {filteredMissions.map(mission => (
          <div
            key={mission.id}
            style={{
              ...styles.missionCard,
              opacity: mission.locked ? 0.6 : 1,
              cursor: mission.locked ? 'not-allowed' : 'pointer',
              borderLeft: mission.completed ? '4px solid #10b981' : '4px solid #2563eb',
            }}
            onClick={() => !mission.locked && !mission.completed && handleStartMission(mission.id)}
          >
            {mission.locked && (
              <div style={styles.lockedOverlay}>
                <MdLock size={32} color="white" />
              </div>
            )}

            <div style={styles.missionHeader}>
              <h3 style={styles.missionTitle}>{mission.title}</h3>
              {mission.completed && (
                <MdCheckCircle color="#10b981" size={24} />
              )}
            </div>

            <p style={styles.missionDescription}>{mission.description}</p>

            {/* Progress Bar */}
            {!mission.completed && !mission.locked && (
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div 
                    style={{
                      ...styles.progressFill,
                      width: `${(mission.progress / mission.total) * 100}%`,
                    }}
                  />
                </div>
                <span style={styles.progressText}>
                  {mission.progress}/{mission.total}
                </span>
              </div>
            )}

            <div style={styles.missionDetails}>
              <div style={styles.difficultyBadge}>
                <span style={{
                  ...styles.difficultyDot,
                  backgroundColor: getDifficultyColor(mission.difficulty)
                }} />
                {mission.difficulty}
              </div>

              <div style={styles.timeBadge}>
                <MdTimer size={14} />
                {mission.timeEstimate}
              </div>
            </div>

            <div style={styles.rewardsSection}>
              <div style={styles.reward}>
                <FaTrophy size={14} color="#fbbf24" />
                <span style={styles.rewardText}>{mission.xpReward} XP</span>
              </div>
              <div style={styles.reward}>
                <FaCoins size={14} color="#f59e0b" />
                <span style={styles.rewardText}>{mission.coinReward} coins</span>
              </div>
            </div>

            {!mission.completed && !mission.locked && (
              <button 
                style={styles.startButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartMission(mission.id);
                }}
              >
                Start Mission
              </button>
            )}

            {mission.completed && (
              <div style={styles.completedBadge}>
                <MdCheckCircle size={16} />
                Completed
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '20px',
  },
  statsContainer: {
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
  categories: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '30px',
  },
  categoryButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    border: 'none',
  },
  categoryIcon: {
    fontSize: '16px',
  },
  missionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  missionCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative',
    overflow: 'hidden',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    },
  },
  missionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  missionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    flex: 1,
  },
  missionDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '15px',
    lineHeight: '1.5',
  },
  progressContainer: {
    marginBottom: '15px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '5px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '12px',
    color: '#6b7280',
  },
  missionDetails: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
  },
  difficultyBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    padding: '4px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    color: '#374151',
  },
  difficultyDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  timeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    padding: '4px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    color: '#374151',
  },
  rewardsSection: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
    paddingTop: '10px',
    borderTop: '1px solid #e5e7eb',
  },
  reward: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  rewardText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  startButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#1d4ed8',
    },
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  completedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#10b981',
    fontSize: '14px',
    fontWeight: '500',
    justifyContent: 'center',
    marginTop: '10px',
  },
};

export default Missions; 