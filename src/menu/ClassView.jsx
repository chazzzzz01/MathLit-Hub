// src/menu/ClassView.jsx - FULLY RESPONSIVE WITH SELECTABLE ANNOUNCEMENTS & BULK DELETE
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiBookOpen, FiClock, FiStar, FiUsers, 
  FiCalendar, FiTrendingUp, FiCheck, FiCopy,
  FiAward, FiTarget, FiDollarSign, FiPieChart,
  FiBell, FiMail, FiArrowLeft, FiZap, FiBox, FiHexagon, FiUser,
  FiTrash2, FiCheckSquare, FiSquare
} from 'react-icons/fi';
import { IoGameController } from 'react-icons/io5';
import { classService } from '../services/classService';
import { supabase } from '../lib/supabase';

function ClassView({ classId, classData: passedClassData, onBack }) {
  const navigate = useNavigate();
  const [classData, setClassData] = useState(passedClassData || null);
  const [missions, setMissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userProgress, setUserProgress] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [teacherName, setTeacherName] = useState('Loading...');
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState(null);
  
  // New state for selectable announcements
  const [selectedAnnouncements, setSelectedAnnouncements] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  
  const [totalScores, setTotalScores] = useState({
    totalHighScore: 0,
    totalLastScores: 0,
    equationScore: 0,
    battleScore: 0,
    spaceShooterScore: 0
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

  // Helper function to get game total scores
  const getGameTotalScores = (gameProgress) => {
    if (!gameProgress) return { equationScore: 0, battleScore: 0, spaceShooterScore: 0, totalHighScore: 0, totalLastScores: 0 };
    
    const equationScore = gameProgress.equation?.highScore || 0;
    const battleScore = gameProgress.battle?.highScore || 0;
    const spaceShooterScore = gameProgress.spaceShooter?.highScore || 0;
    
    return {
      equationScore,
      battleScore,
      spaceShooterScore,
      totalHighScore: equationScore + battleScore + spaceShooterScore,
      totalLastScores: (gameProgress.equation?.lastScore || 0) + (gameProgress.battle?.lastScore || 0) + (gameProgress.spaceShooter?.lastScore || 0)
    };
  };

  useEffect(() => {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUserEmail(user.email);
    setCurrentUserId(user.dbId || user.id);
    
    // Check if user is teacher
    const isUserTeacher = user.role === 'teacher' || 
                         user.isTeacher === true || 
                         user.type === 'teacher' ||
                         user.userType === 'teacher';
    setIsTeacher(isUserTeacher);
    
    // Load game scores
    const savedProgress = localStorage.getItem('gameProgress');
    if (savedProgress) {
      const gameProgress = JSON.parse(savedProgress);
      const scores = getGameTotalScores(gameProgress);
      setTotalScores(scores);
    }
    
    if (classId) {
      loadClassData();
      loadAnnouncements();
    } else if (passedClassData) {
      loadClassDataFromProps();
      loadAnnouncements();
    }
  }, [classId, passedClassData]);

  // Reset selection when exiting selection mode
  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedAnnouncements(new Set());
      setSelectAll(false);
    }
  }, [isSelectionMode]);

  const loadClassDataFromProps = async () => {
    try {
      setLoading(true);
      
      const fullClassData = await classService.getClassById(passedClassData.id);
      
      let teacher = 'Teacher';
      if (fullClassData) {
        if (fullClassData.teacher_name) {
          teacher = fullClassData.teacher_name;
        } else if (fullClassData.teacher && fullClassData.teacher.name) {
          teacher = fullClassData.teacher.name;
        } else if (fullClassData.teacher && fullClassData.teacher.user && fullClassData.teacher.user.name) {
          teacher = fullClassData.teacher.user.name;
        }
      }
      
      if (teacher === 'Teacher' && passedClassData) {
        if (passedClassData.teacher_name) {
          teacher = passedClassData.teacher_name;
        } else if (passedClassData.teacher && passedClassData.teacher.name) {
          teacher = passedClassData.teacher.name;
        }
      }
      
      setTeacherName(teacher);
      
      setClassData({
        ...passedClassData,
        teacher_name: teacher,
        teacher: { name: teacher }
      });
      
      const classMissions = await classService.getClassMissions(passedClassData.id);
      setMissions(classMissions);
      
      const classStudents = await classService.getClassStudents(passedClassData.id);
      const enrichedStudents = await enrichStudentsWithProgress(classStudents);
      setStudents(enrichedStudents);
      calculateStats(enrichedStudents, classMissions);
      
      const enrollment = enrichedStudents.find(s => s.student_id === currentUserId);
      if (enrollment) {
        setUserProgress(enrollment.progress || 0);
      }
      
    } catch (error) {
      console.error('Error loading class data from props:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClassData = async () => {
    try {
      setLoading(true);
      
      const classDetails = await classService.getClassById(classId);
      
      if (!classDetails) {
        console.error('Class not found');
        setTeacherName('Teacher');
        return;
      }
      
      let teacher = 'Teacher';
      if (classDetails.teacher_name) {
        teacher = classDetails.teacher_name;
      } else if (classDetails.teacher && classDetails.teacher.name) {
        teacher = classDetails.teacher.name;
      } else if (classDetails.teacher && classDetails.teacher.user && classDetails.teacher.user.name) {
        teacher = classDetails.teacher.user.name;
      }
      
      setTeacherName(teacher);
      
      const updatedClassData = {
        ...classDetails,
        teacher_name: teacher,
        teacher: classDetails.teacher || { name: teacher }
      };
      setClassData(updatedClassData);
      
      const classMissions = await classService.getClassMissions(classId);
      setMissions(classMissions);
      
      const classStudents = await classService.getClassStudents(classId);
      const enrichedStudents = await enrichStudentsWithProgress(classStudents);
      setStudents(enrichedStudents);
      calculateStats(enrichedStudents, classMissions);
      
      const enrollment = enrichedStudents.find(s => s.student_id === currentUserId);
      if (enrollment) {
        setUserProgress(enrollment.progress || 0);
      }
      
    } catch (error) {
      console.error('Error loading class data:', error);
      setTeacherName('Teacher');
    } finally {
      setLoading(false);
    }
  };

  const enrichStudentsWithProgress = async (classStudents) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserEmail = user.email;
    
    return classStudents.map(enrollment => {
      const studentEmail = enrollment.users?.email;
      let gameProgress = null;
      let xp = 0;
      let totalGameScore = 0;
      
      if (studentEmail) {
        const savedProgress = localStorage.getItem(`gameProgress_${studentEmail}`);
        if (savedProgress) {
          gameProgress = JSON.parse(savedProgress);
        } else {
          const defaultProgress = localStorage.getItem('gameProgress');
          if (defaultProgress && studentEmail === currentUserEmail) {
            gameProgress = JSON.parse(defaultProgress);
          }
        }
        
        if (gameProgress) {
          totalGameScore = calculateTotalGameScore(gameProgress);
        }
        
        const savedXP = localStorage.getItem(`userXP_${studentEmail}`);
        if (savedXP) {
          xp = parseInt(savedXP) || 0;
        } else if (studentEmail === currentUserEmail) {
          const defaultXP = localStorage.getItem('userXP');
          if (defaultXP) {
            xp = parseInt(defaultXP) || 0;
          }
        }
      }
      
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
  };

  const calculateStats = (enrichedStudents, classMissions) => {
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
  };

  // Load announcements from localStorage
  const loadAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const allAnnouncements = JSON.parse(localStorage.getItem('announcements') || '[]');
      const classIdValue = classId || passedClassData?.id;
      const className = classData?.name || passedClassData?.name;
      
      let loadedAnnouncements = allAnnouncements.filter(
        a => String(a.class_id) === String(classIdValue)
      );
      
      if (className) {
        const nameMatches = allAnnouncements.filter(
          a => a.class_name === className && !loadedAnnouncements.some(existing => existing.id === a.id)
        );
        loadedAnnouncements = [...loadedAnnouncements, ...nameMatches];
      }
      
      loadedAnnouncements = loadedAnnouncements.filter((a, index, self) => 
        index === self.findIndex((t) => t.id === a.id)
      );
      
      loadedAnnouncements.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setAnnouncements(loadedAnnouncements);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  // Toggle selection of a single announcement
  const toggleSelectAnnouncement = (announcementId) => {
    const newSelected = new Set(selectedAnnouncements);
    if (newSelected.has(announcementId)) {
      newSelected.delete(announcementId);
    } else {
      newSelected.add(announcementId);
    }
    setSelectedAnnouncements(newSelected);
    setSelectAll(newSelected.size === announcements.length && announcements.length > 0);
  };

  // Toggle select all announcements
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedAnnouncements(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(announcements.map(a => a.id));
      setSelectedAnnouncements(allIds);
      setSelectAll(true);
    }
  };

  // Delete selected announcements
  const handleDeleteSelected = async () => {
    if (selectedAnnouncements.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedAnnouncements.size} announcement${selectedAnnouncements.size > 1 ? 's' : ''}? This action cannot be undone.`)) {
      setDeletingAnnouncementId('bulk');
      
      try {
        const allAnnouncements = JSON.parse(localStorage.getItem('announcements') || '[]');
        const updatedAnnouncements = allAnnouncements.filter(a => !selectedAnnouncements.has(a.id));
        localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
        
        // Try to delete from Supabase for each selected announcement
        for (const announcementId of selectedAnnouncements) {
          try {
            await supabase.from('announcements').delete().eq('id', announcementId);
          } catch (supabaseError) {
            // Ignore Supabase errors
          }
        }
        
        // Update state
        setAnnouncements(prev => prev.filter(a => !selectedAnnouncements.has(a.id)));
        setSelectedAnnouncements(new Set());
        setSelectAll(false);
        setIsSelectionMode(false);
        
      } catch (error) {
        console.error('Error deleting announcements:', error);
        alert('Failed to delete announcements. Please try again.');
      } finally {
        setDeletingAnnouncementId(null);
      }
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

  // Calculate overall game progress percentage
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
      
      const completionWeight = 0.5;
      const completionScore = game.completed ? 100 : 0;
      
      const maxScores = {
        equation: 1000,
        battle: 1000,
        spaceShooter: 1000
      };
      const highScoreWeight = 0.3;
      const highScorePercent = Math.min(100, (game.highScore / maxScores[gameId]) * 100);
      
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

  const formatAnnouncementDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getClassIcon = (className) => {
    const icons = {
      'math': '📐',
      'science': '🔬',
      'programming': '💻',
      'english': '📖',
      'history': '🏛️',
      'art': '🎨',
      'physics': '⚛️',
      'chemistry': '🧪',
      'biology': '🧬',
      'music': '🎵',
      'pe': '⚽'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
      if (className?.toLowerCase().includes(key)) {
        return icon;
      }
    }
    return '📚';
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/studenthub/homepage');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p>Loading class data...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p>Class not found</p>
          <button onClick={handleBack} style={styles.backButtonMain}>Back to Classes</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header with Back Button */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={handleBack}>
          <FiArrowLeft size={20} />
          <span style={styles.backButtonText}>Back to Classes</span>
        </button>
        <button style={styles.shareButton} onClick={copyToClipboard}>
          {copiedCode ? <FiCheck size={18} /> : <FiCopy size={18} />}
          <span>{copiedCode ? 'Copied!' : `Class Code: ${classData.code}`}</span>
        </button>
      </div>

      {/* Class Info */}
      <div style={styles.classInfo}>
        <div style={styles.classIcon}>
          <span style={styles.classIconEmoji}>{getClassIcon(classData.name)}</span>
        </div>
        <div style={styles.classDetails}>
          <h1 style={styles.className}>{classData.name}</h1>
          <div style={styles.classMeta}>
            <span style={styles.metaItem}>
              <FiUser size={14} />
              <strong style={styles.teacherNameHighlight}>Teacher: {teacherName}</strong>
            </span>
            <span style={styles.metaItem}>
              <FiUsers size={14} />
              {students.length} Students
            </span>
            <span style={styles.metaItem}>
              <FiCalendar size={14} />
              Created: {formatDate(classData.created_at)}
            </span>
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
          <span style={styles.progressPercent}>{userProgress}%</span>
        </div>
        <div style={styles.progressBarContainer}>
          <div style={{...styles.progressBar, width: `${userProgress}%`}} />
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsWrapper}>
        <div style={styles.tabs}>
          {['overview', 'announcements', 'missions', 'games', 'students'].map((tab) => (
            <button
              key={tab}
              style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'announcements') {
                  setIsSelectionMode(false);
                  setSelectedAnnouncements(new Set());
                }
              }}
            >
              {tab === 'overview' && <FiBookOpen size={14} />}
              {tab === 'announcements' && <FiBell size={14} />}
              {tab === 'missions' && <FiStar size={14} />}
              {tab === 'games' && <IoGameController size={14} />}
              {tab === 'students' && <FiUsers size={14} />}
              <span style={styles.tabText}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              {tab === 'missions' && missions.length > 0 && <span style={styles.tabBadge}>{missions.length}</span>}
              {tab === 'students' && students.length > 0 && <span style={styles.tabBadge}>{students.length}</span>}
              {tab === 'announcements' && announcements.length > 0 && <span style={styles.tabBadge}>{announcements.length}</span>}
            </button>
          ))}
        </div>
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
              <h3 style={styles.sectionTitle}>Class Information</h3>
              <div style={styles.quickStats}>
                <div style={styles.quickStatItem}>
                  <FiUser size={20} color="#2563eb" />
                  <div>
                    <div style={styles.quickStatValue}>{teacherName}</div>
                    <div style={styles.quickStatLabel}>Class Teacher</div>
                  </div>
                </div>
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

        {/* Announcements Tab with Selection and Bulk Delete */}
        {activeTab === 'announcements' && (
          <div>
            {/* Selection Mode Toggle and Bulk Delete Bar */}
            {isTeacher && announcements.length > 0 && (
              <div style={styles.selectionBar}>
                {!isSelectionMode ? (
                  <button 
                    style={styles.selectButton}
                    onClick={() => setIsSelectionMode(true)}
                  >
                    <FiCheckSquare size={16} />
                    Select Announcements
                  </button>
                ) : (
                  <div style={styles.bulkActions}>
                    <button 
                      style={styles.selectAllButton}
                      onClick={toggleSelectAll}
                    >
                      {selectAll ? <FiCheckSquare size={16} /> : <FiSquare size={16} />}
                      {selectAll ? 'Deselect All' : 'Select All'}
                    </button>
                    <button 
                      style={styles.bulkDeleteButton}
                      onClick={handleDeleteSelected}
                      disabled={selectedAnnouncements.size === 0 || deletingAnnouncementId === 'bulk'}
                    >
                      {deletingAnnouncementId === 'bulk' ? (
                        <div style={styles.deleteSpinnerSmall}></div>
                      ) : (
                        <FiTrash2 size={16} />
                      )}
                      Delete Selected ({selectedAnnouncements.size})
                    </button>
                    <button 
                      style={styles.cancelSelectButton}
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedAnnouncements(new Set());
                        setSelectAll(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Announcements List */}
            <div style={styles.scrollableContent}>
              {loadingAnnouncements ? (
                <div style={styles.loadingContainerSmall}>
                  <div style={styles.loadingSpinnerSmall}></div>
                  <p>Loading announcements...</p>
                </div>
              ) : announcements.length > 0 ? (
                <div style={styles.announcementsList}>
                  {announcements.map((announcement) => (
                    <div 
                      key={announcement.id} 
                      style={{
                        ...styles.announcementCard,
                        ...(isSelectionMode && selectedAnnouncements.has(announcement.id) ? styles.announcementCardSelected : {})
                      }}
                      onClick={() => {
                        if (isSelectionMode) {
                          toggleSelectAnnouncement(announcement.id);
                        }
                      }}
                    >
                      <div style={styles.announcementHeader}>
                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                          <div style={styles.checkboxContainer}>
                            {selectedAnnouncements.has(announcement.id) ? (
                              <FiCheckSquare size={22} color="#2563eb" />
                            ) : (
                              <FiSquare size={22} color="#9ca3af" />
                            )}
                          </div>
                        )}
                        
                        <div style={styles.announcementIcon}>
                          <FiMail size={20} color="#2563eb" />
                        </div>
                        
                        <div style={styles.announcementTitleSection}>
                          <h4 style={styles.announcementTitle}>{announcement.title}</h4>
                          <div style={styles.announcementMeta}>
                            <span style={styles.announcementTeacher}>
                              <FiUser size={12} style={{ marginRight: '4px' }} />
                              From: <strong>{announcement.teacher_name || teacherName}</strong>
                            </span>
                            <span style={styles.announcementDate}>
                              {formatAnnouncementDate(announcement.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Individual Delete Button (when not in selection mode) */}
                        {!isSelectionMode && isTeacher && (
                          <button
                            style={styles.deleteButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Delete this announcement?')) {
                                handleDeleteSelected([announcement.id]);
                              }
                            }}
                            title="Delete announcement"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div style={styles.announcementBody}>
                        <p style={styles.announcementMessage}>{announcement.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📢</div>
                  <h3>No Announcements Yet</h3>
                  <p>Check back later for updates from {teacherName}!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Missions Tab */}
        {activeTab === 'missions' && (
          <div style={styles.scrollableContent}>
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
                <p>Check back later for new missions from {teacherName}!</p>
              </div>
            )}
          </div>
        )}

        {/* Games Tab */}
        {activeTab === 'games' && (
          <div style={styles.scrollableContent}>
            <div style={styles.gamesGrid}>
              <div style={styles.gameCard} onClick={() => navigate('/studenthub/games/equation')}>
                <div style={styles.gameIcon}>🧮</div>
                <h4 style={styles.gameTitle}>Equation Game</h4>
                <p style={styles.gameDescription}>Solve math equations and earn points!</p>
                <div style={styles.gameScore}>Your Score: {totalScores.equationScore || 0}</div>
                <button style={styles.gameButton}>Play Now →</button>
              </div>

              <div style={styles.gameCard} onClick={() => navigate('/studenthub/games/battle')}>
                <div style={styles.gameIcon}>⚔️</div>
                <h4 style={styles.gameTitle}>Math Battle</h4>
                <p style={styles.gameDescription}>Battle against time in this math challenge!</p>
                <div style={styles.gameScore}>Your Score: {totalScores.battleScore || 0}</div>
                <button style={styles.gameButton}>Play Now →</button>
              </div>

              <div style={styles.gameCard} onClick={() => navigate('/studenthub/games/spaceshooter')}>
                <div style={styles.gameIcon}>🚀</div>
                <h4 style={styles.gameTitle}>Space Shooter</h4>
                <p style={styles.gameDescription}>Shoot asteroids and solve math problems!</p>
                <div style={styles.gameScore}>Your Score: {totalScores.spaceShooterScore || 0}</div>
                <button style={styles.gameButton}>Play Now →</button>
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div style={styles.scrollableContent}>
            {students.length > 0 ? (
              <div style={styles.studentsList}>
                {students.map((enrollment) => {
                  const gameProgress = enrollment.users?.gameProgress;
                  const equationDetails = calculateGameProgressDetails(gameProgress, 'equation');
                  const battleDetails = calculateGameProgressDetails(gameProgress, 'battle');
                  const spaceDetails = calculateGameProgressDetails(gameProgress, 'spaceShooter');
                  
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
                        
                        <div style={styles.studentProgressWrapper}>
                          <div style={styles.studentProgressBar}>
                            <div style={{...styles.studentProgressFill, width: `${enrollment.users?.gameProgressPercent || 0}%`}} />
                          </div>
                          <span style={styles.studentProgressText}>{enrollment.users?.gameProgressPercent || 0}% Overall</span>
                        </div>
                        
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
  );
}

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
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
  loadingContainerSmall: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    gap: '16px',
  },
  loadingSpinnerSmall: {
    width: '30px',
    height: '30px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '20px',
    margin: '40px',
  },
  backButtonMain: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    flexWrap: 'wrap',
    gap: '12px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    transition: 'all 0.2s',
  },
  backButtonText: {},
  shareButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  classInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    margin: '20px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    flexWrap: 'wrap',
  },
  classIcon: {
    width: '72px',
    height: '72px',
    backgroundColor: '#eff6ff',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  classIconEmoji: {
    fontSize: '36px',
  },
  classDetails: {
    flex: 1,
    minWidth: '180px',
  },
  className: {
    fontSize: 'clamp(20px, 5vw, 28px)',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '8px',
  },
  classMeta: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '10px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500',
  },
  teacherNameHighlight: {
    color: '#2563eb',
    fontWeight: '600',
  },
  classDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.5,
    marginTop: '8px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    margin: '0 20px 20px 20px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statIcon: {
    width: '44px',
    height: '44px',
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statInfo: {
    flex: 1,
    minWidth: '0',
  },
  statNumber: {
    fontSize: 'clamp(18px, 4vw, 28px)',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '2px',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '10px',
    color: '#6b7280',
    fontWeight: '500',
  },
  progressSection: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '18px',
    margin: '0 20px 20px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
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
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  tabsWrapper: {
    margin: '0 20px',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    borderBottom: '2px solid #e5e7eb',
    minWidth: 'min-content',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  tabText: {},
  tabBadge: {
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
    borderRadius: '12px',
    padding: '2px 6px',
    fontSize: '10px',
    fontWeight: '600',
    marginLeft: '4px',
  },
  activeTab: {
    color: '#2563eb',
    borderBottom: '2px solid #2563eb',
    marginBottom: '-2px',
  },
  tabContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    margin: '0 20px 20px 20px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  scrollableContent: {
    maxHeight: 'calc(100vh - 400px)',
    overflowY: 'auto',
    paddingRight: '8px',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '12px',
  },
  quickStatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
  },
  quickStatValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
  },
  quickStatLabel: {
    fontSize: '11px',
    color: '#6b7280',
  },
  // Selection Bar Styles
  selectionBar: {
    marginBottom: '20px',
    padding: '12px',
    backgroundColor: '#f0fdf4',
    borderRadius: '12px',
    border: '1px solid #bbf7d0',
  },
  selectButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  bulkActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  selectAllButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  bulkDeleteButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  cancelSelectButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  deleteSpinnerSmall: {
    width: '16px',
    height: '16px',
    border: '2px solid #e5e7eb',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
  announcementsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  announcementCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '14px',
    padding: '16px',
    transition: 'all 0.2s ease',
    position: 'relative',
    cursor: 'default',
  },
  announcementCardSelected: {
    backgroundColor: '#eff6ff',
    border: '2px solid #2563eb',
    boxShadow: '0 4px 12px rgba(37,99,235,0.15)',
  },
  announcementHeader: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  announcementIcon: {
    width: '36px',
    height: '36px',
    backgroundColor: '#eff6ff',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  announcementTitleSection: {
    flex: 1,
    minWidth: '150px',
  },
  announcementTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  announcementMeta: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  announcementTeacher: {
    fontSize: '11px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
  },
  announcementDate: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  deleteButton: {
    background: '#fee2e2',
    border: 'none',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    color: '#ef4444',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  announcementBody: {
    paddingLeft: '48px',
  },
  announcementMessage: {
    fontSize: '13px',
    color: '#4b5563',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  missionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  missionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '14px',
    padding: '16px',
  },
  missionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  missionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
  },
  missionStatus: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
    whiteSpace: 'nowrap',
  },
  missionDescription: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '10px',
  },
  missionDetails: {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  startButton: {
    padding: '6px 14px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
  },
  gameCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '14px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'center',
  },
  gameIcon: {
    fontSize: '40px',
    marginBottom: '10px',
  },
  gameTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '6px',
  },
  gameDescription: {
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  gameScore: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: '12px',
  },
  gameButton: {
    padding: '8px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    width: '100%',
  },
  studentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  studentCard: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '14px',
    flexWrap: 'wrap',
  },
  studentAvatar: {
    width: '44px',
    height: '44px',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '700',
    flexShrink: 0,
  },
  studentInfo: {
    flex: 1,
    minWidth: '180px',
  },
  studentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '2px',
  },
  studentName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1f2937',
  },
  studentXPBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    padding: '3px 8px',
    borderRadius: '20px',
  },
  studentEmail: {
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '10px',
    wordBreak: 'break-all',
  },
  studentProgressWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  studentProgressBar: {
    flex: 1,
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  studentProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    transition: 'width 0.3s ease',
  },
  studentProgressText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#10b981',
    whiteSpace: 'nowrap',
  },
  gameProgressGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  gameProgressItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  gameProgressIcon: {
    fontSize: '16px',
    width: '24px',
  },
  gameProgressBarWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: '100px',
  },
  gameProgressBarBg: {
    flex: 1,
    height: '5px',
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
    fontSize: '10px',
    color: '#6b7280',
    width: '40px',
  },
  gameProgressScore: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#1f2937',
    minWidth: '30px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  button {
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .backButton:hover {
    background-color: #e5e7eb;
    transform: translateX(-4px);
  }
  
  .shareButton:hover {
    background-color: #1d4ed8;
    transform: translateY(-2px);
  }
  
  .selectButton:hover {
    background-color: #1d4ed8;
    transform: translateY(-2px);
  }
  
  .selectAllButton:hover {
    background-color: #d1d5db;
  }
  
  .bulkDeleteButton:hover {
    background-color: #dc2626;
    transform: scale(1.02);
  }
  
  .cancelSelectButton:hover {
    background-color: #e5e7eb;
  }
  
  .deleteButton:hover {
    background-color: #fecaca;
    transform: scale(1.05);
  }
  
  .startButton:hover, .gameButton:hover {
    background-color: #1d4ed8;
    transform: translateY(-2px);
  }
  
  .gameCard:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .announcementCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  
  .tab:hover {
    color: #2563eb;
  }
  
  @media (max-width: 768px) {
    button, .gameCard, .tab, .announcementCard, .missionCard, .studentCard {
      -webkit-tap-highlight-color: rgba(0,0,0,0.05);
    }
    
    button:active, .gameCard:active, .tab:active {
      transform: scale(0.98);
      transition: transform 0.05s ease;
    }
    
    button, .tab, .startButton, .gameButton, .backButton, .shareButton, .deleteButton, .selectButton, .selectAllButton, .bulkDeleteButton, .cancelSelectButton {
      min-height: 44px;
      min-width: 44px;
    }
    
    .scrollableContent {
      scrollbar-width: thin;
    }
    
    .scrollableContent::-webkit-scrollbar {
      width: 4px;
    }
    
    .scrollableContent::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    .scrollableContent::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
  }
  
  @media (min-width: 768px) and (max-width: 1024px) {
    .statsGrid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .gamesGrid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 768px) {
    input, select, textarea {
      font-size: 16px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default ClassView;