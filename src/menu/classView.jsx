// src/menu/ClassView.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiX, FiBookOpen, FiClock, FiStar, FiUsers, 
  FiCalendar, FiTrendingUp, FiCheck, FiCopy,
  FiAward, FiTarget, FiDollarSign, FiPieChart
} from 'react-icons/fi';
import { IoGameController } from 'react-icons/io5';
import { classService } from '../services/classService';

function ClassView({ classId, onClose }) {
  const [classData, setClassData] = useState(null);
  const [missions, setMissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userProgress, setUserProgress] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [currentUserProgress, setCurrentUserProgress] = useState({
    equation: { completed: false, highScore: 0, attempts: 0, progressPercent: 0 },
    battle: { completed: false, highScore: 0, attempts: 0, progressPercent: 0 },
    spaceShooter: { completed: false, highScore: 0, attempts: 0, progressPercent: 0 },
    overall: 0,
    xp: 0
  });
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageProgress: 0,
    activeMissions: 0,
    completionRate: 0,
    totalXP: 0,
    averageXP: 0,
    totalGameScore: 0,
    averageGameScore: 0
  });

  useEffect(() => {
    if (classId) {
      loadClassData();
    }
    // Get current user email from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUserEmail(user.email);
    
    // Load current user's progress
    loadCurrentUserProgress(user.email);
  }, [classId]);

  // Load current user's game progress from the correct localStorage key
  const loadCurrentUserProgress = (email) => {
    if (!email) return;
    
    // Games.jsx saves progress under 'gameProgress' key (not email-specific for current user)
    const savedProgress = localStorage.getItem('gameProgress');
    const savedXP = localStorage.getItem(`userXP_${email}`);
    
    if (savedProgress) {
      const gameProgress = JSON.parse(savedProgress);
      const equationDetails = calculateGameProgressDetails(gameProgress, 'equation');
      const battleDetails = calculateGameProgressDetails(gameProgress, 'battle');
      const spaceDetails = calculateGameProgressDetails(gameProgress, 'spaceShooter');
      const overall = calculateOverallProgress(gameProgress);
      
      setCurrentUserProgress({
        equation: equationDetails,
        battle: battleDetails,
        spaceShooter: spaceDetails,
        overall: overall,
        xp: savedXP ? parseInt(savedXP) : 0
      });
      
      setUserProgress(overall);
    }
  };

  const loadClassData = async () => {
    try {
      setLoading(true);
      
      const classDetails = await classService.getClassById(classId);
      setClassData(classDetails);
      
      const classMissions = await classService.getClassMissions(classId);
      setMissions(classMissions);
      
      const classStudents = await classService.getClassStudents(classId);
      
      // Enrich students with game progress data
      const enrichedStudents = classStudents.map(enrollment => {
        const studentEmail = enrollment.users?.email;
        let gameProgress = null;
        let xp = 0;
        let totalGameScore = 0;
        
        if (studentEmail) {
          // Load game progress - Games.jsx saves under 'gameProgress' key for current user
          // For other students, we need to check if they have saved progress
          const savedProgress = localStorage.getItem(`gameProgress_${studentEmail}`);
          if (savedProgress) {
            gameProgress = JSON.parse(savedProgress);
          } else {
            // Try the default gameProgress key (might be current user's)
            const defaultProgress = localStorage.getItem('gameProgress');
            if (defaultProgress && studentEmail === currentUserEmail) {
              gameProgress = JSON.parse(defaultProgress);
            }
          }
          
          if (gameProgress) {
            totalGameScore = calculateTotalGameScore(gameProgress);
          }
          
          // Load XP from student-specific localStorage
          const savedXP = localStorage.getItem(`userXP_${studentEmail}`);
          if (savedXP) {
            xp = parseInt(savedXP) || 0;
          } else if (studentEmail === currentUserEmail) {
            // Try to get XP from default location
            const defaultXP = localStorage.getItem('userXP');
            if (defaultXP) {
              xp = parseInt(defaultXP) || 0;
            }
          }
        }
        
        // Calculate overall game progress percentage
        const gameProgressPercent = calculateOverallProgress(gameProgress);
        
        return {
          ...enrollment,
          users: {
            ...enrollment.users,
            gameProgress,
            xp,
            totalGameScore,
            gameProgressPercent
          }
        };
      });
      
      setStudents(enrichedStudents);
      
      // Calculate enhanced stats
      const totalStudents = enrichedStudents.length;
      const avgProgress = totalStudents > 0 
        ? Math.round(enrichedStudents.reduce((sum, s) => sum + (s.users?.gameProgressPercent || 0), 0) / totalStudents)
        : 0;
      const activeMissions = classMissions.filter(m => m.status === 'active').length;
      const completionRate = classMissions.length > 0
        ? Math.round((classMissions.filter(m => m.status === 'completed').length / classMissions.length) * 100)
        : 0;
      const totalXP = enrichedStudents.reduce((sum, s) => sum + (s.users?.xp || 0), 0);
      const averageXP = totalStudents > 0 ? Math.round(totalXP / totalStudents) : 0;
      const totalGameScore = enrichedStudents.reduce((sum, s) => sum + (s.users?.totalGameScore || 0), 0);
      const averageGameScore = totalStudents > 0 ? Math.round(totalGameScore / totalStudents) : 0;
      
      setStats({ 
        totalStudents, 
        averageProgress: avgProgress, 
        activeMissions, 
        completionRate,
        totalXP,
        averageXP,
        totalGameScore,
        averageGameScore
      });
      
    } catch (error) {
      console.error('Error loading class data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total game score across all games
  const calculateTotalGameScore = (gameProgress) => {
    if (!gameProgress) return 0;
    const equationScore = gameProgress.equation?.highScore || 0;
    const battleScore = gameProgress.battle?.highScore || 0;
    const spaceScore = gameProgress.spaceShooter?.highScore || 0;
    return equationScore + battleScore + spaceScore;
  };

  // Calculate overall game progress percentage across all three games
  const calculateOverallProgress = (gameProgress) => {
    if (!gameProgress) return 0;
    
    const games = ['equation', 'battle', 'spaceShooter'];
    let totalProgress = 0;
    let validGames = 0;
    
    games.forEach(gameId => {
      const game = gameProgress[gameId];
      if (!game) return;
      
      validGames++;
      let gameProgressPercent = 0;
      
      // Factor 1: Completion status (50% weight)
      const completionWeight = 0.5;
      const completionScore = game.completed ? 100 : 0;
      
      // Factor 2: High score progress (30% weight)
      const maxScores = {
        equation: 1000,
        battle: 1000,
        spaceShooter: 1000
      };
      const highScoreWeight = 0.3;
      const highScorePercent = Math.min(100, (game.highScore / maxScores[gameId]) * 100);
      
      // Factor 3: Attempts/engagement (20% weight)
      const attemptsWeight = 0.2;
      const attemptsScore = Math.min(100, (game.attempts / 3) * 100);
      
      gameProgressPercent = (completionScore * completionWeight) + 
                           (highScorePercent * highScoreWeight) + 
                           (attemptsScore * attemptsWeight);
      
      totalProgress += gameProgressPercent;
    });
    
    return validGames > 0 ? Math.round(totalProgress / validGames) : 0;
  };

  // Calculate individual game progress details
  const calculateGameProgressDetails = (gameProgress, gameId) => {
    if (!gameProgress || !gameProgress[gameId]) {
      return { completed: false, highScore: 0, attempts: 0, progressPercent: 0, lastScore: 0 };
    }
    
    const game = gameProgress[gameId];
    const maxScores = {
      equation: 1000,
      battle: 1000,
      spaceShooter: 1000
    };
    
    const completionWeight = 0.5;
    const completionScore = game.completed ? 100 : 0;
    const highScoreWeight = 0.3;
    const highScorePercent = Math.min(100, (game.highScore / maxScores[gameId]) * 100);
    const attemptsWeight = 0.2;
    const attemptsScore = Math.min(100, (game.attempts / 3) * 100);
    
    const progressPercent = Math.round(
      (completionScore * completionWeight) + 
      (highScorePercent * highScoreWeight) + 
      (attemptsScore * attemptsWeight)
    );
    
    return {
      completed: game.completed,
      highScore: game.highScore,
      attempts: game.attempts,
      lastScore: game.lastScore,
      lastPlayed: game.lastPlayed,
      progressPercent
    };
  };

  // Get individual game progress for a student
  const getGameProgressDetails = (gameProgress, gameId) => {
    return calculateGameProgressDetails(gameProgress, gameId);
  };

  const copyToClipboard = () => {
    const code = classData?.code;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getMissionStatus = (mission) => {
    const now = new Date();
    const dueDate = new Date(mission.due_date);
    
    if (mission.status === 'completed') return { label: 'Completed', color: '#10b981' };
    if (dueDate < now) return { label: 'Overdue', color: '#ef4444' };
    if (mission.status === 'active') return { label: 'Active', color: '#3b82f6' };
    return { label: 'Upcoming', color: '#f59e0b' };
  };

  const formatDate = (date) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading class data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.errorContainer}>
            <p>Class not found</p>
            <button onClick={onClose} style={styles.closeErrorButton}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button style={styles.closeButton} onClick={onClose}>
          <FiX size={24} />
        </button>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerActions}>
            <button style={styles.shareButton} onClick={copyToClipboard}>
              {copiedCode ? <FiCheck size={18} /> : <FiCopy size={18} />}
              <span>{copiedCode ? 'Copied!' : `Class Code: ${classData.code}`}</span>
            </button>
          </div>
        </div>

        {/* Class Info */}
        <div style={styles.classInfo}>
          <div style={styles.classIcon}>
            <FiBookOpen size={32} color="#2563eb" />
          </div>
          <div style={styles.classDetails}>
            <h1 style={styles.className}>{classData.name}</h1>
            <div style={styles.classMeta}>
              <span style={styles.metaItem}><FiUsers size={14} />{students.length} Students</span>
              <span style={styles.metaItem}><FiCalendar size={14} />Created: {formatDate(classData.created_at)}</span>
            </div>
            {classData.description && (
              <p style={styles.classDescription}>{classData.description}</p>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}><FiUsers size={24} color="#2563eb" /></div>
            <div style={styles.statInfo}>
              <h3 style={styles.statNumber}>{stats.totalStudents}</h3>
              <p style={styles.statLabel}>Total Students</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}><FiTrendingUp size={24} color="#10b981" /></div>
            <div style={styles.statInfo}>
              <h3 style={styles.statNumber}>{stats.averageProgress}%</h3>
              <p style={styles.statLabel}>Avg. Game Progress</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}><FiAward size={24} color="#f59e0b" /></div>
            <div style={styles.statInfo}>
              <h3 style={styles.statNumber}>{stats.averageXP}</h3>
              <p style={styles.statLabel}>Avg. XP Points</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}><FiPieChart size={24} color="#8b5cf6" /></div>
            <div style={styles.statInfo}>
              <h3 style={styles.statNumber}>{stats.averageGameScore}</h3>
              <p style={styles.statLabel}>Avg. Game Score</p>
            </div>
          </div>
        </div>

        {/* Your Progress Section */}
        <div style={styles.progressSection}>
          <div style={styles.progressLabel}>
            <span>Your Overall Game Progress</span>
            <span style={styles.progressPercent}>{currentUserProgress.overall}%</span>
          </div>
          <div style={styles.progressBarContainer}>
            <div style={{...styles.progressBar, width: `${currentUserProgress.overall}%`}} />
          </div>
          
          {/* Your Individual Game Progress */}
          <div style={styles.yourGameProgress}>
            <div style={styles.yourGameProgressItem}>
              <span>🧮 Equation</span>
              <div style={styles.yourGameProgressBar}>
                <div style={{width: `${currentUserProgress.equation.progressPercent}%`, backgroundColor: '#3b82f6', height: '100%', borderRadius: '3px'}} />
              </div>
              <span>{currentUserProgress.equation.progressPercent}%</span>
            </div>
            <div style={styles.yourGameProgressItem}>
              <span>⚔️ Battle</span>
              <div style={styles.yourGameProgressBar}>
                <div style={{width: `${currentUserProgress.battle.progressPercent}%`, backgroundColor: '#8b5cf6', height: '100%', borderRadius: '3px'}} />
              </div>
              <span>{currentUserProgress.battle.progressPercent}%</span>
            </div>
            <div style={styles.yourGameProgressItem}>
              <span>🚀 Space</span>
              <div style={styles.yourGameProgressBar}>
                <div style={{width: `${currentUserProgress.spaceShooter.progressPercent}%`, backgroundColor: '#f59e0b', height: '100%', borderRadius: '3px'}} />
              </div>
              <span>{currentUserProgress.spaceShooter.progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {['overview', 'missions', 'games', 'students'].map((tab) => (
            <button
              key={tab}
              style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview' && <FiBookOpen size={14} />}
              {tab === 'missions' && <FiStar size={14} />}
              {tab === 'games' && <IoGameController size={14} />}
              {tab === 'students' && <FiUsers size={14} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'missions' && ` (${missions.length})`}
              {tab === 'students' && ` (${students.length})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div style={styles.overviewSection}>
                <h3 style={styles.sectionTitle}>About This Class</h3>
                <p style={styles.overviewText}>
                  {classData.description || "No description provided for this class."}
                </p>
              </div>
              
              <div style={styles.overviewSection}>
                <h3 style={styles.sectionTitle}>Class Performance</h3>
                <div style={styles.quickStats}>
                  <div style={styles.quickStatItem}>
                    <FiClock size={20} color="#2563eb" />
                    <div>
                      <div style={styles.quickStatValue}>{missions.length}</div>
                      <div style={styles.quickStatLabel}>Total Missions</div>
                    </div>
                  </div>
                  <div style={styles.quickStatItem}>
                    <FiAward size={20} color="#f59e0b" />
                    <div>
                      <div style={styles.quickStatValue}>{stats.completionRate}%</div>
                      <div style={styles.quickStatLabel}>Mission Completion</div>
                    </div>
                  </div>
                  <div style={styles.quickStatItem}>
                    <FiDollarSign size={20} color="#10b981" />
                    <div>
                      <div style={styles.quickStatValue}>{stats.totalXP}</div>
                      <div style={styles.quickStatLabel}>Total XP Earned</div>
                    </div>
                  </div>
                  <div style={styles.quickStatItem}>
                    <IoGameController size={20} color="#8b5cf6" />
                    <div>
                      <div style={styles.quickStatValue}>{stats.totalGameScore}</div>
                      <div style={styles.quickStatLabel}>Total Game Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Missions Tab */}
          {activeTab === 'missions' && (
            <div>
              {missions.length > 0 ? (
                <div style={styles.missionsList}>
                  {missions.map((mission) => {
                    const status = getMissionStatus(mission);
                    return (
                      <div key={mission.id} style={styles.missionCard}>
                        <div style={styles.missionHeader}>
                          <h4 style={styles.missionTitle}>{mission.title}</h4>
                          <span style={{...styles.missionStatus, backgroundColor: status.color}}>
                            {status.label}
                          </span>
                        </div>
                        {mission.description && (
                          <p style={styles.missionDescription}>{mission.description}</p>
                        )}
                        <div style={styles.missionDetails}>
                          <span style={styles.detailItem}>
                            <FiStar size={14} /> {mission.xp_reward || 100} XP
                          </span>
                          {mission.due_date && (
                            <span style={styles.detailItem}>
                              <FiClock size={14} /> Due: {formatDate(mission.due_date)}
                            </span>
                          )}
                        </div>
                        {status.label !== 'Completed' && status.label !== 'Overdue' && (
                          <button style={styles.startButton}>
                            Start Mission →
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📭</div>
                  <h3>No Missions Yet</h3>
                  <p>Check back later for new missions from your teacher!</p>
                </div>
              )}
            </div>
          )}

          {/* Games Tab - Shows all games with class average progress */}
          {activeTab === 'games' && (
            <div>
              <div style={styles.gamesGrid}>
                {/* Equation Game Card */}
                <div style={styles.gameCard}>
                  <div style={styles.gameIcon}>🧮</div>
                  <h4 style={styles.gameTitle}>Equation Escape Room</h4>
                  <p style={styles.gameDescription}>Solve linear equations to escape each room!</p>
                  <div style={styles.gameStatsRow}>
                    <div style={styles.gameStat}>
                      <span style={styles.gameStatLabel}>Class Avg:</span>
                      <span style={styles.gameStatValue}>
                        {Math.round(students.reduce((sum, s) => {
                          const details = getGameProgressDetails(s.users?.gameProgress, 'equation');
                          return sum + details.progressPercent;
                        }, 0) / (students.length || 1))}%
                      </span>
                    </div>
                    <div style={styles.gameStat}>
                      <span style={styles.gameStatLabel}>Completed:</span>
                      <span style={styles.gameStatValue}>
                        {students.filter(s => getGameProgressDetails(s.users?.gameProgress, 'equation').completed).length}/{students.length}
                      </span>
                    </div>
                  </div>
                  <button style={styles.gameButton} onClick={() => window.location.href = '/game/equation'}>
                    Play Now →
                  </button>
                </div>

                {/* Math Battle Game Card */}
                <div style={styles.gameCard}>
                  <div style={styles.gameIcon}>⚔️</div>
                  <h4 style={styles.gameTitle}>Math Battle Arena</h4>
                  <p style={styles.gameDescription}>Test your math skills in epic turn-based combat!</p>
                  <div style={styles.gameStatsRow}>
                    <div style={styles.gameStat}>
                      <span style={styles.gameStatLabel}>Class Avg:</span>
                      <span style={styles.gameStatValue}>
                        {Math.round(students.reduce((sum, s) => {
                          const details = getGameProgressDetails(s.users?.gameProgress, 'battle');
                          return sum + details.progressPercent;
                        }, 0) / (students.length || 1))}%
                      </span>
                    </div>
                    <div style={styles.gameStat}>
                      <span style={styles.gameStatLabel}>Completed:</span>
                      <span style={styles.gameStatValue}>
                        {students.filter(s => getGameProgressDetails(s.users?.gameProgress, 'battle').completed).length}/{students.length}
                      </span>
                    </div>
                  </div>
                  <button style={styles.gameButton} onClick={() => window.location.href = '/game/battle'}>
                    Play Now →
                  </button>
                </div>

                {/* Space Shooter Game Card */}
                <div style={styles.gameCard}>
                  <div style={styles.gameIcon}>🚀</div>
                  <h4 style={styles.gameTitle}>Math Space Shooter</h4>
                  <p style={styles.gameDescription}>Defend your ship while solving math problems!</p>
                  <div style={styles.gameStatsRow}>
                    <div style={styles.gameStat}>
                      <span style={styles.gameStatLabel}>Class Avg:</span>
                      <span style={styles.gameStatValue}>
                        {Math.round(students.reduce((sum, s) => {
                          const details = getGameProgressDetails(s.users?.gameProgress, 'spaceShooter');
                          return sum + details.progressPercent;
                        }, 0) / (students.length || 1))}%
                      </span>
                    </div>
                    <div style={styles.gameStat}>
                      <span style={styles.gameStatLabel}>Completed:</span>
                      <span style={styles.gameStatValue}>
                        {students.filter(s => getGameProgressDetails(s.users?.gameProgress, 'spaceShooter').completed).length}/{students.length}
                      </span>
                    </div>
                  </div>
                  <button style={styles.gameButton} onClick={() => window.location.href = '/game/spaceshooter'}>
                    Play Now →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Students Tab - Shows each student with detailed game progress */}
          {activeTab === 'students' && (
            <div>
              {students.length > 0 ? (
                <div style={styles.studentsList}>
                  {students.map((enrollment) => {
                    const gameProgress = enrollment.users?.gameProgress;
                    const equationDetails = getGameProgressDetails(gameProgress, 'equation');
                    const battleDetails = getGameProgressDetails(gameProgress, 'battle');
                    const spaceDetails = getGameProgressDetails(gameProgress, 'spaceShooter');
                    
                    return (
                      <div key={enrollment.id} style={styles.studentCard}>
                        <div style={styles.studentAvatar}>
                          {enrollment.users?.name?.charAt(0) || 'S'}
                        </div>
                        <div style={styles.studentInfo}>
                          <div style={styles.studentHeader}>
                            <h4 style={styles.studentName}>{enrollment.users?.name || 'Student'}</h4>
                            <span style={styles.studentXPBadge}>⭐ {enrollment.users?.xp || 0} XP</span>
                          </div>
                          <p style={styles.studentEmail}>{enrollment.users?.email}</p>
                          
                          {/* Overall Game Progress */}
                          <div style={styles.studentProgressWrapper}>
                            <div style={styles.studentProgressBar}>
                              <div style={{...styles.studentProgressFill, width: `${enrollment.users?.gameProgressPercent || 0}%`}} />
                            </div>
                            <span style={styles.studentProgressText}>{enrollment.users?.gameProgressPercent || 0}% Overall</span>
                          </div>
                          
                          {/* Individual Game Progress */}
                          <div style={styles.gameProgressGrid}>
                            <div style={styles.gameProgressItem}>
                              <span style={styles.gameProgressIcon}>🧮</span>
                              <div style={styles.gameProgressBarWrapper}>
                                <div style={styles.gameProgressBarBg}>
                                  <div style={{...styles.gameProgressBarFill, width: `${equationDetails.progressPercent}%`, backgroundColor: '#3b82f6'}} />
                                </div>
                                <span style={styles.gameProgressLabel}>Equation</span>
                              </div>
                              <span style={styles.gameProgressScore}>{equationDetails.highScore}</span>
                              {equationDetails.completed && <FiCheck size={14} color="#10b981" />}
                            </div>
                            
                            <div style={styles.gameProgressItem}>
                              <span style={styles.gameProgressIcon}>⚔️</span>
                              <div style={styles.gameProgressBarWrapper}>
                                <div style={styles.gameProgressBarBg}>
                                  <div style={{...styles.gameProgressBarFill, width: `${battleDetails.progressPercent}%`, backgroundColor: '#8b5cf6'}} />
                                </div>
                                <span style={styles.gameProgressLabel}>Battle</span>
                              </div>
                              <span style={styles.gameProgressScore}>{battleDetails.highScore}</span>
                              {battleDetails.completed && <FiCheck size={14} color="#10b981" />}
                            </div>
                            
                            <div style={styles.gameProgressItem}>
                              <span style={styles.gameProgressIcon}>🚀</span>
                              <div style={styles.gameProgressBarWrapper}>
                                <div style={styles.gameProgressBarBg}>
                                  <div style={{...styles.gameProgressBarFill, width: `${spaceDetails.progressPercent}%`, backgroundColor: '#f59e0b'}} />
                                </div>
                                <span style={styles.gameProgressLabel}>Space</span>
                              </div>
                              <span style={styles.gameProgressScore}>{spaceDetails.highScore}</span>
                              {spaceDetails.completed && <FiCheck size={14} color="#10b981" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>👥</div>
                  <h3>No Students Yet</h3>
                  <p>Be the first to join this class!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease',
  },
  modalContent: {
    backgroundColor: '#f9fafb',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '1000px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    animation: 'slideUp 0.3s ease',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  closeButton: {
    position: 'sticky',
    top: '20px',
    right: '20px',
    float: 'right',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.2s',
    margin: '20px 20px 0 0',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
    gap: '20px',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '60px',
  },
  closeErrorButton: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '20px 32px 0 32px',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  shareButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  classInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    margin: '0 32px 24px 32px',
    padding: '28px',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  classIcon: {
    width: '72px',
    height: '72px',
    backgroundColor: '#eff6ff',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classDetails: {
    flex: 1,
  },
  className: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '10px',
  },
  classMeta: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
  },
  classDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.5,
    marginTop: '8px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    margin: '0 32px 24px 32px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500',
  },
  progressSection: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    margin: '0 32px 24px 32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  progressPercent: {
    color: '#10b981',
    fontWeight: '700',
  },
  progressBarContainer: {
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  yourGameProgress: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  yourGameProgressItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px',
    fontSize: '13px',
  },
  yourGameProgressBar: {
    flex: 1,
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    margin: '0 32px',
    borderBottom: '2px solid #e5e7eb',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    color: '#2563eb',
    borderBottom: '2px solid #2563eb',
    marginBottom: '-2px',
  },
  tabContent: {
    padding: '28px 32px 32px 32px',
  },
  overviewSection: {
    marginBottom: '28px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '16px',
  },
  overviewText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.6,
  },
  quickStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  quickStatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
  },
  quickStatValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
  },
  quickStatLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  missionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  missionCard: {
    backgroundColor: 'white',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  missionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  missionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
  },
  missionStatus: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  missionDescription: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  missionDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: '16px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  startButton: {
    padding: '8px 16px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  gameCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  gameIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  gameTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
  },
  gameDescription: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  gameStatsRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '10px',
  },
  gameStat: {
    flex: 1,
    textAlign: 'center',
  },
  gameStatLabel: {
    fontSize: '10px',
    color: '#6b7280',
    display: 'block',
    marginBottom: '4px',
  },
  gameStatValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
  },
  gameButton: {
    padding: '10px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    width: '100%',
  },
  studentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  studentCard: {
    display: 'flex',
    gap: '16px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  studentAvatar: {
    width: '48px',
    height: '48px',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    flexShrink: 0,
  },
  studentInfo: {
    flex: 1,
  },
  studentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '4px',
  },
  studentName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
  },
  studentXPBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  studentEmail: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  studentProgressWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  studentProgressBar: {
    flex: 1,
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  studentProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    transition: 'width 0.3s ease',
  },
  studentProgressText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#10b981',
  },
  gameProgressGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '8px',
  },
  gameProgressItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  gameProgressIcon: {
    fontSize: '18px',
    width: '28px',
  },
  gameProgressBarWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  gameProgressBarBg: {
    flex: 1,
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  gameProgressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  gameProgressLabel: {
    fontSize: '11px',
    color: '#6b7280',
    width: '45px',
  },
  gameProgressScore: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#1f2937',
    minWidth: '35px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .gameCard:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  }
  
  .closeButton:hover {
    background-color: #f3f4f6;
    transform: scale(1.1);
  }
  
  .startButton:hover, .gameButton:hover {
    background-color: #1d4ed8;
    transform: translateY(-2px);
  }
`;
document.head.appendChild(styleSheet);

export default ClassView;