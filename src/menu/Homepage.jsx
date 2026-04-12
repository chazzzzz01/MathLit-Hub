// src/menu/Homepage.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  FiTrash2, FiArrowLeft, FiBookOpen, FiUsers, FiCalendar, 
  FiClock, FiStar, FiTrendingUp, FiAward, FiTarget,
  FiCopy, FiCheck
} from 'react-icons/fi';
import { IoGameController } from 'react-icons/io5';
import { getGameTotalScores } from './Games';
import { classService } from '../services/classService';

function Homepage() {
  const { user, userData, refreshClasses: contextRefreshClasses } = useOutletContext() || {};
  const navigate = useNavigate();
  const [totalScores, setTotalScores] = useState({
    totalHighScore: 0,
    totalLastScores: 0,
    equationScore: 0,
    battleScore: 0,
    spaceShooterScore: 0
  });
  
  // Join Class State
  const [classCode, setClassCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [classDetails, setClassDetails] = useState(null);
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  
  // Remove Class State
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [classToRemove, setClassToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Selected Class for detailed view
  const [selectedClass, setSelectedClass] = useState(null);
  const [classMissions, setClassMissions] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [loadingClassDetails, setLoadingClassDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userProgress, setUserProgress] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [classStats, setClassStats] = useState({
    totalStudents: 0,
    averageProgress: 0,
    activeMissions: 0,
    completionRate: 0
  });

  // Function to refresh classes (uses context function if available)
  const refreshClasses = async () => {
    if (contextRefreshClasses) {
      await contextRefreshClasses();
    }
    await loadJoinedClasses();
  };

  useEffect(() => {
    // Get total scores from userData or localStorage
    const gameProgress = userData?.gameProgress || JSON.parse(localStorage.getItem('gameProgress')) || null;
    if (gameProgress) {
      const scores = getGameTotalScores(gameProgress);
      setTotalScores(scores);
    }
    
    // Load joined classes if user is logged in
    if (user?.dbId) {
      loadJoinedClasses();
    } else {
      setLoadingClasses(false);
    }
  }, [userData, user?.dbId]);

  const loadJoinedClasses = async () => {
    try {
      setLoadingClasses(true);
      const classes = await classService.getStudentClasses(user.dbId);
      setJoinedClasses(classes);
      console.log('Joined classes loaded:', classes.length);
      
      // Dispatch event to notify StudentHub about class changes
      window.dispatchEvent(new Event('classesUpdated'));
      localStorage.setItem('classesUpdated', Date.now().toString());
    } catch (error) {
      console.error('Error loading joined classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadClassDetails = async (classId, classData) => {
    try {
      setLoadingClassDetails(true);
      setSelectedClass({ 
        id: classId, 
        name: classData.name,
        code: classData.code,
        description: classData.description,
        created_at: classData.created_at
      });
      
      // Load missions for this class
      const missions = await classService.getClassMissions(classId);
      setClassMissions(missions);
      
      // Load students for this class
      const students = await classService.getClassStudents(classId);
      setClassStudents(students);
      
      // Get user progress for this class
      const enrollment = students.find(s => s.student_id === user?.dbId);
      if (enrollment) {
        setUserProgress(enrollment.progress || 0);
      } else {
        setUserProgress(0);
      }
      
      // Calculate stats
      const totalStudents = students.length;
      const avgProgress = students.length > 0 
        ? Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / students.length)
        : 0;
      const activeMissions = missions.filter(m => m.status === 'active').length;
      const completionRate = missions.length > 0
        ? Math.round((missions.filter(m => m.status === 'completed').length / missions.length) * 100)
        : 0;
      
      setClassStats({ totalStudents, averageProgress: avgProgress, activeMissions, completionRate });
      
      console.log('Missions for class:', missions);
    } catch (error) {
      console.error('Error loading class details:', error);
    } finally {
      setLoadingClassDetails(false);
    }
  };

  const closeClassView = () => {
    setSelectedClass(null);
    setClassMissions([]);
    setClassStudents([]);
    setActiveTab('overview');
    setUserProgress(0);
    setCopiedCode(false);
  };

  const copyToClipboard = (code) => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'No date';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMissionStatus = (mission) => {
    const now = new Date();
    const dueDate = new Date(mission.due_date);
    
    if (mission.status === 'completed') return { label: 'Completed', color: '#10b981' };
    if (dueDate < now) return { label: 'Overdue', color: '#ef4444' };
    if (mission.status === 'active') return { label: 'Active', color: '#3b82f6' };
    return { label: 'Upcoming', color: '#f59e0b' };
  };

  const userName = user?.name || user?.email?.split('@')[0] || 'Student';
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Handle class code input change
  const handleClassCodeChange = (e) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, '');
    setClassCode(value);
    setJoinError('');
    setJoinSuccess('');
  };

  // Validate class code format
  const validateClassCode = (code) => {
    const classCodeRegex = /^[A-Z0-9]{6,8}$/;
    return classCodeRegex.test(code);
  };

  // Handle preview class (check if class exists)
  const handlePreviewClass = async () => {
    if (!classCode.trim()) {
      setJoinError('Please enter a class code');
      return;
    }
    
    if (!validateClassCode(classCode)) {
      setJoinError('Invalid class code format. Code should be 6-8 characters (letters and numbers only)');
      return;
    }
    
    setIsJoining(true);
    setJoinError('');
    
    try {
      // Check if class exists in Supabase
      const classData = await classService.getClassByCode(classCode);
      
      if (!classData) {
        setJoinError('Class not found. Please check the code and try again.');
        return;
      }
      
      // Check if student is already in this class
      const isAlreadyJoined = await classService.isStudentInClass(user?.dbId, classData.id);
      
      if (isAlreadyJoined) {
        setJoinError('You are already a member of this class!');
        return;
      }
      
      // Show class details in modal
      setClassDetails({
        id: classData.id,
        name: classData.name,
        code: classData.code,
        teacher: classData.teacher || { name: 'Teacher' },
        description: `Join ${classData.name} to start learning and earning points!`,
        icon: getClassIcon(classData.name),
        studentsCount: classData.students_count || 0
      });
      setShowJoinModal(true);
      
    } catch (error) {
      console.error('Error checking class:', error);
      setJoinError('Network error. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  // Helper function to get class icon based on name
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

  // Handle joining a class
  const handleJoinClass = async () => {
    if (!user?.dbId) {
      setJoinError('Please log in to join a class');
      return;
    }
    
    setIsJoining(true);
    setJoinError('');
    
    try {
      // Join the class in Supabase
      const result = await classService.joinClass(user.dbId, classCode);
      
      if (result.success) {
        setJoinSuccess(`Successfully joined ${result.class.name}! 🎉`);
        setShowJoinModal(false);
        setClassDetails(null);
        setClassCode('');
        setShowJoinForm(false);
        
        // Reload joined classes and refresh context
        await refreshClasses();
        
        // Close success message after 3 seconds
        setTimeout(() => setJoinSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error joining class:', error);
      setJoinError(error.message || 'Failed to join class. Please try again.');
      setShowJoinModal(false);
    } finally {
      setIsJoining(false);
    }
  };

  // Handle remove class click
  const handleRemoveClick = (e, enrollment) => {
    e.stopPropagation();
    setClassToRemove(enrollment);
    setShowRemoveModal(true);
  };

  // Handle confirm remove
  const handleConfirmRemove = async () => {
    if (!user?.dbId || !classToRemove) return;
    
    setIsRemoving(true);
    
    try {
      const result = await classService.removeStudentFromClass(
        classToRemove.class_id, 
        user.dbId
      );
      
      if (result.success) {
        setJoinSuccess(`Successfully removed from ${classToRemove.class.name}`);
        setShowRemoveModal(false);
        setClassToRemove(null);
        
        // Reload joined classes and refresh context
        await refreshClasses();
        
        // If we're viewing the removed class, close it
        if (selectedClass && selectedClass.id === classToRemove.class_id) {
          closeClassView();
        }
        
        // Close success message after 3 seconds
        setTimeout(() => setJoinSuccess(''), 3000);
      } else {
        setJoinError(result.message || 'Failed to remove from class');
      }
    } catch (error) {
      console.error('Error removing from class:', error);
      setJoinError('Failed to remove from class. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  // Handle cancel remove
  const handleCancelRemove = () => {
    setShowRemoveModal(false);
    setClassToRemove(null);
  };

  const hasJoinedClasses = joinedClasses.length > 0;

  // If a class is selected, show the class detail view
  if (selectedClass) {
    return (
      <div style={styles.container}>
        <div style={styles.classDetailContainer}>
          {/* Header */}
          <div style={styles.classDetailHeader}>
            <button style={styles.backButton} onClick={closeClassView}>
              <FiArrowLeft size={20} />
              Back to Classes
            </button>
            <div style={styles.headerActions}>
              <button 
                style={styles.shareButton} 
                onClick={() => copyToClipboard(selectedClass.code)}
              >
                {copiedCode ? <FiCheck size={18} /> : <FiCopy size={18} />}
                <span>{copiedCode ? 'Copied!' : `Class Code: ${selectedClass.code || 'N/A'}`}</span>
              </button>
            </div>
          </div>

          {/* Class Info */}
          <div style={styles.classInfoCard}>
            <div style={styles.classIconLarge}>{getClassIcon(selectedClass.name)}</div>
            <div style={styles.classInfoContent}>
              <h1 style={styles.className}>{selectedClass.name}</h1>
              <div style={styles.classMeta}>
                <div style={styles.metaItem}>
                  <FiUsers size={16} />
                  <span>{classStats.totalStudents} Students</span>
                </div>
                <div style={styles.metaItem}>
                  <FiCalendar size={16} />
                  <span>Created: {formatDate(selectedClass.created_at)}</span>
                </div>
              </div>
              {selectedClass.description && (
                <p style={styles.classDescription}>{selectedClass.description}</p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}><FiUsers size={24} color="#2563eb" /></div>
              <div style={styles.statInfo}>
                <h3 style={styles.statNumber}>{classStats.totalStudents}</h3>
                <p style={styles.statLabel}>Total Students</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}><FiTrendingUp size={24} color="#10b981" /></div>
              <div style={styles.statInfo}>
                <h3 style={styles.statNumber}>{classStats.averageProgress}%</h3>
                <p style={styles.statLabel}>Class Avg. Progress</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}><FiAward size={24} color="#f59e0b" /></div>
              <div style={styles.statInfo}>
                <h3 style={styles.statNumber}>{classStats.activeMissions}</h3>
                <p style={styles.statLabel}>Active Missions</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}><FiTarget size={24} color="#8b5cf6" /></div>
              <div style={styles.statInfo}>
                <h3 style={styles.statNumber}>{userProgress}%</h3>
                <p style={styles.statLabel}>Your Progress</p>
              </div>
            </div>
          </div>

          {/* Your Progress Bar */}
          <div style={styles.progressCard}>
            <div style={styles.progressHeader}>
              <FiTrendingUp size={20} color="#2563eb" />
              <span style={styles.progressTitle}>Your Learning Progress</span>
            </div>
            <div style={styles.progressStats}>
              <div style={styles.progressPercent}>{userProgress}%</div>
              <div style={styles.progressBarContainer}>
                <div style={{...styles.progressBar, width: `${userProgress}%`}} />
              </div>
              <p style={styles.progressSubtext}>Keep going! Complete missions to increase your progress.</p>
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
                {tab === 'missions' && ` (${classMissions.length})`}
                {tab === 'students' && ` (${classStats.totalStudents})`}
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
                    {selectedClass.description || "No description provided for this class."}
                  </p>
                </div>
                
                <div style={styles.overviewSection}>
                  <h3 style={styles.sectionTitle}>Quick Stats</h3>
                  <div style={styles.quickStats}>
                    <div style={styles.quickStatItem}>
                      <FiClock size={20} color="#2563eb" />
                      <div>
                        <div style={styles.quickStatValue}>{classMissions.length}</div>
                        <div style={styles.quickStatLabel}>Total Missions</div>
                      </div>
                    </div>
                    <div style={styles.quickStatItem}>
                      <FiAward size={20} color="#f59e0b" />
                      <div>
                        <div style={styles.quickStatValue}>{classStats.completionRate}%</div>
                        <div style={styles.quickStatLabel}>Completion Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Missions Tab */}
            {activeTab === 'missions' && (
              <div>
                {loadingClassDetails ? (
                  <div style={styles.loadingMissions}>
                    <div style={styles.loadingSpinnerSmall}></div>
                    <p>Loading missions...</p>
                  </div>
                ) : classMissions.length > 0 ? (
                  <div style={styles.missionsList}>
                    {classMissions.map((mission) => {
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

            {/* Games Tab */}
            {activeTab === 'games' && (
              <div>
                <div style={styles.gamesGrid}>
                  <div style={styles.gameCard} onClick={() => navigate('/studenthub/games/equation')}>
                    <div style={styles.gameIcon}>🧮</div>
                    <h4 style={styles.gameTitle}>Equation Game</h4>
                    <p style={styles.gameDescription}>Solve math equations and earn points!</p>
                    <div style={styles.gameScore}>Score: {totalScores.equationScore || 0}</div>
                    <button style={styles.gameButton}>Play Now →</button>
                  </div>

                  <div style={styles.gameCard} onClick={() => navigate('/studenthub/games/battle')}>
                    <div style={styles.gameIcon}>⚔️</div>
                    <h4 style={styles.gameTitle}>Math Battle</h4>
                    <p style={styles.gameDescription}>Battle against time in this math challenge!</p>
                    <div style={styles.gameScore}>Score: {totalScores.battleScore || 0}</div>
                    <button style={styles.gameButton}>Play Now →</button>
                  </div>

                  <div style={styles.gameCard} onClick={() => navigate('/studenthub/games/spaceshooter')}>
                    <div style={styles.gameIcon}>🚀</div>
                    <h4 style={styles.gameTitle}>Space Shooter</h4>
                    <p style={styles.gameDescription}>Shoot asteroids and solve math problems!</p>
                    <div style={styles.gameScore}>Score: {totalScores.spaceShooterScore || 0}</div>
                    <button style={styles.gameButton}>Play Now →</button>
                  </div>
                </div>
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div>
                {loadingClassDetails ? (
                  <div style={styles.loadingMissions}>
                    <div style={styles.loadingSpinnerSmall}></div>
                    <p>Loading students...</p>
                  </div>
                ) : classStudents.length > 0 ? (
                  <div style={styles.studentsList}>
                    {classStudents.map((enrollment) => (
                      <div key={enrollment.id} style={styles.studentCard}>
                        <div style={styles.studentAvatar}>
                          {enrollment.users?.name?.charAt(0) || 'S'}
                        </div>
                        <div style={styles.studentInfo}>
                          <h4 style={styles.studentName}>{enrollment.users?.name || 'Student'}</h4>
                          <p style={styles.studentEmail}>{enrollment.users?.email}</p>
                          <div style={styles.studentProgressWrapper}>
                            <div style={styles.studentProgressBar}>
                              <div style={{...styles.studentProgressFill, width: `${enrollment.progress || 0}%`}} />
                            </div>
                            <span style={styles.studentProgressText}>{enrollment.progress || 0}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
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

  // Main view (class list)
  return (
    <div style={styles.container}>
      {/* Welcome Card */}
      <div style={styles.welcomeCard}>
        <div style={styles.welcomeHeader}>
          <div style={styles.welcomeIcon}>🎮</div>
          <div>
            <h1 style={styles.welcomeTitle}>Welcome back, {userName}!</h1>
            <p style={styles.welcomeDate}>{currentDate}</p>
          </div>
        </div>
        <p style={styles.welcomeMessage}>
          Ready to continue your learning journey? Check out your progress below and start playing to earn more points!
        </p>
      </div>

      {/* Join Class Section */}
      <div style={styles.joinClassContainer}>
        {!showJoinForm ? (
          <button 
            style={styles.joinClassButton}
            onClick={() => setShowJoinForm(true)}
          >
            <span style={styles.joinIcon}>➕</span>
            Join a New Class
          </button>
        ) : (
          <div style={styles.joinClassCard}>
            <div style={styles.joinClassHeader}>
              <span style={styles.joinClassIcon}>➕</span>
              <h2 style={styles.joinClassTitle}>Join a New Class</h2>
              <button 
                style={styles.closeButton}
                onClick={() => {
                  setShowJoinForm(false);
                  setClassCode('');
                  setJoinError('');
                  setJoinSuccess('');
                }}
              >
                ✕
              </button>
            </div>
            
            <p style={styles.joinClassDescription}>
              Enter the class code provided by your teacher to join and start learning!
            </p>
            
            <div style={styles.joinClassForm}>
              <input
                type="text"
                style={styles.joinClassInput}
                placeholder="Enter class code (e.g., MATH101)"
                value={classCode}
                onChange={handleClassCodeChange}
                maxLength="8"
                autoFocus
              />
              <div style={styles.joinClassButtons}>
                <button 
                  style={styles.cancelJoinButton}
                  onClick={() => {
                    setShowJoinForm(false);
                    setClassCode('');
                    setJoinError('');
                    setJoinSuccess('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  style={styles.previewButton}
                  onClick={handlePreviewClass}
                  disabled={isJoining || !classCode.trim()}
                >
                  {isJoining ? 'Checking...' : 'Preview Class'}
                </button>
              </div>
            </div>
            
            {joinError && (
              <div style={styles.errorMessage}>
                ⚠ {joinError}
              </div>
            )}
            
            {joinSuccess && (
              <div style={styles.successMessage}>
                ✓ {joinSuccess}
              </div>
            )}
            
            <div style={styles.exampleCodes}>
              <p style={styles.exampleTitle}>💡 Tip:</p>
              <p style={styles.exampleText}>Ask your teacher for the 6-digit class code</p>
            </div>
          </div>
        )}
      </div>

      {/* My Classes Section */}
      {!loadingClasses && hasJoinedClasses && (
        <div style={styles.myClassesSection}>
          <h2 style={styles.sectionTitle}>My Classes ({joinedClasses.length})</h2>
          <div style={styles.classesGrid}>
            {joinedClasses.map((enrollment) => (
              <div 
                key={enrollment.class_id} 
                style={styles.classCard}
                onClick={() => loadClassDetails(enrollment.class_id, enrollment.class)}
              >
                <div style={styles.classIcon}>{getClassIcon(enrollment.class.name)}</div>
                <div style={styles.classInfo}>
                  <div style={styles.classHeader}>
                    <h3 style={styles.className}>{enrollment.class.name}</h3>
                    <button 
                      style={styles.deleteButton}
                      onClick={(e) => handleRemoveClick(e, enrollment)}
                      title="Remove from class"
                    >
                      <FiTrash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                  <p style={styles.classTeacher}>
                    <span style={styles.label}>Teacher:</span> {enrollment.class.teacher?.name || 'Teacher'}
                  </p>
                  <div style={styles.classCodeContainer}>
                    <span style={styles.classCodeLabel}>Class Code:</span>
                    <code style={styles.classCode}>{enrollment.class.code}</code>
                  </div>
                  <p style={styles.joinedDate}>
                    <span style={styles.label}>Joined:</span> {new Date(enrollment.joined_at).toLocaleDateString()}
                  </p>
                  <div style={styles.progressBar}>
                    <div style={{...styles.progressFill, width: `${enrollment.progress || 0}%`}} />
                  </div>
                  <p style={styles.progressText}>Progress: {enrollment.progress || 0}%</p>
                  <div style={styles.openClassButton}>
                    Click to open class <FiArrowLeft style={{transform: 'rotate(180deg)'}} size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State for Classes */}
      {loadingClasses && (
        <div style={styles.loadingClassesContainer}>
          <div style={styles.loadingSpinnerSmall}></div>
          <p>Loading your classes...</p>
        </div>
      )}

      {/* No Classes Message */}
      {!loadingClasses && !hasJoinedClasses && !showJoinForm && (
        <div style={styles.noClassesCard}>
          <div style={styles.noClassesIcon}>📚</div>
          <h3 style={styles.noClassesTitle}>No Classes Yet</h3>
          <p style={styles.noClassesText}>Click "Join a New Class" above to get started!</p>
          <p style={styles.noClassesSubtext}>Enter the class code your teacher gave you</p>
        </div>
      )}

      {/* Join Class Modal */}
      {showJoinModal && classDetails && (
        <div style={styles.modalOverlay} onClick={() => {
          setShowJoinModal(false);
          setClassDetails(null);
        }}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Confirm Join Class</h2>
              <button style={styles.modalClose} onClick={() => {
                setShowJoinModal(false);
                setClassDetails(null);
              }}>×</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.classPreview}>
                <div style={styles.previewIcon}>{classDetails.icon}</div>
                <h3 style={styles.previewName}>{classDetails.name}</h3>
                <p style={styles.previewCode}>Code: {classDetails.code}</p>
                <p style={styles.previewTeacher}>Teacher: {classDetails.teacher?.name || 'Teacher'}</p>
                <p style={styles.previewStudents}>{classDetails.studentsCount} students enrolled</p>
                <p style={styles.previewDescription}>{classDetails.description}</p>
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={() => {
                setShowJoinModal(false);
                setClassDetails(null);
              }}>
                Cancel
              </button>
              <button 
                style={styles.confirmButton}
                onClick={handleJoinClass}
                disabled={isJoining}
              >
                {isJoining ? 'Joining...' : 'Confirm Join'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Class Confirmation Modal */}
      {showRemoveModal && classToRemove && (
        <div style={styles.modalOverlay} onClick={handleCancelRemove}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Remove from Class</h2>
              <button style={styles.modalClose} onClick={handleCancelRemove}>×</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.classPreview}>
                <div style={styles.previewIcon}>{getClassIcon(classToRemove.class.name)}</div>
                <h3 style={styles.previewName}>{classToRemove.class.name}</h3>
                <p style={styles.previewCode}>Code: {classToRemove.class.code}</p>
                <p style={styles.previewTeacher}>
                  Teacher: {classToRemove.class.teacher?.name || 'Teacher'}
                </p>
              </div>
              
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}>⚠️</span>
                <p style={styles.warningText}>
                  Are you sure you want to remove yourself from this class? 
                  You will lose access to class materials and your progress will be reset.
                </p>
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button 
                style={styles.cancelButton} 
                onClick={handleCancelRemove}
                disabled={isRemoving}
              >
                Cancel
              </button>
              <button 
                style={styles.dangerButton}
                onClick={handleConfirmRemove}
                disabled={isRemoving}
              >
                {isRemoving ? 'Removing...' : 'Yes, Remove Me'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  // Class Detail View Styles
  classDetailContainer: {
    width: '100%',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    transition: 'all 0.2s',
  },
  classDetailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
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
    transition: 'all 0.2s',
  },
  classInfoCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '24px',
    padding: '28px',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  classIconLarge: {
    fontSize: '64px',
    backgroundColor: '#f3f4f6',
    width: '100px',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '20px',
  },
  classInfoContent: {
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
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
  progressCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  progressHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  progressTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
  },
  progressStats: {
    textAlign: 'center',
  },
  progressPercent: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#10b981',
    marginBottom: '12px',
  },
  progressBarContainer: {
    height: '10px',
    backgroundColor: '#e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: '6px',
    transition: 'width 0.3s ease',
  },
  progressSubtext: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '8px',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '28px',
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
    marginTop: '28px',
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '20px',
  },
  gameCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
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
    marginBottom: '12px',
  },
  gameScore: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: '16px',
  },
  gameButton: {
    padding: '8px 16px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    width: '100%',
    transition: 'all 0.2s',
  },
  studentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  studentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '12px',
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
  studentName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  studentEmail: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  studentProgressWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
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
    fontSize: '12px',
    fontWeight: '600',
    color: '#10b981',
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
  loadingMissions: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
  },
  loadingSpinnerSmall: {
    width: '30px',
    height: '30px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 12px',
  },
  // Welcome Card Styles
  welcomeCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '32px',
    color: 'white',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  },
  welcomeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  welcomeIcon: {
    fontSize: '48px',
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
  },
  welcomeDate: {
    fontSize: '14px',
    opacity: 0.9,
    margin: '8px 0 0 0',
  },
  welcomeMessage: {
    fontSize: '16px',
    opacity: 0.95,
    margin: 0,
    lineHeight: 1.5,
  },
  // Join Class Styles
  joinClassContainer: {
    marginBottom: '40px',
    display: 'flex',
    justifyContent: 'center',
  },
  joinClassButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '16px 32px',
    borderRadius: '16px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
  joinIcon: {
    fontSize: '24px',
  },
  joinClassCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '32px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    position: 'relative',
  },
  joinClassHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    position: 'relative',
  },
  joinClassIcon: {
    fontSize: '28px',
  },
  joinClassTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    flex: 1,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: '4px 8px',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  joinClassDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  joinClassForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '16px',
  },
  joinClassInput: {
    width: '100%',
    padding: '14px 18px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'monospace',
    textAlign: 'center',
    letterSpacing: '1px',
    boxSizing: 'border-box',
  },
  joinClassButtons: {
    display: 'flex',
    gap: '12px',
  },
  cancelJoinButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  previewButton: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  errorMessage: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '10px',
    fontSize: '14px',
    textAlign: 'center',
  },
  successMessage: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#d1fae5',
    color: '#059669',
    borderRadius: '10px',
    fontSize: '14px',
    textAlign: 'center',
  },
  exampleCodes: {
    marginTop: '20px',
    padding: '12px',
    backgroundColor: '#f0fdf4',
    borderRadius: '10px',
    textAlign: 'center',
  },
  exampleTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#166534',
    margin: '0 0 4px 0',
  },
  exampleText: {
    fontSize: '12px',
    color: '#166534',
    margin: 0,
  },
  // My Classes Section Styles
  myClassesSection: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '20px',
  },
  classesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  classCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  classIcon: {
    fontSize: '48px',
  },
  classInfo: {
    flex: 1,
  },
  classHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  className: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
  },
  label: {
    fontWeight: '500',
    color: '#6b7280',
  },
  classTeacher: {
    fontSize: '13px',
    color: '#374151',
    marginBottom: '8px',
  },
  classCodeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    padding: '6px 10px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
  },
  classCodeLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  classCode: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#3b82f6',
    fontFamily: 'monospace',
    letterSpacing: '1px',
  },
  joinedDate: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  progressBar: {
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '8px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px',
  },
  openClassButton: {
    marginTop: '12px',
    fontSize: '12px',
    color: '#667eea',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '500',
  },
  loadingClassesContainer: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
    marginBottom: '40px',
  },
  noClassesCard: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
    marginBottom: '40px',
  },
  noClassesIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  noClassesTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  noClassesText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  noClassesSubtext: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '20px',
    maxWidth: '450px',
    width: '90%',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#9ca3af',
    transition: 'color 0.2s',
  },
  modalBody: {
    padding: '24px',
  },
  classPreview: {
    textAlign: 'center',
  },
  previewIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  previewName: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '12px',
  },
  previewCode: {
    fontSize: '16px',
    color: '#3b82f6',
    marginBottom: '8px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  previewTeacher: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  previewStudents: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  previewDescription: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: 1.5,
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  confirmButton: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'transform 0.2s',
  },
  dangerButton: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'transform 0.2s',
  },
  warningBox: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#fef3c7',
    borderRadius: '12px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: '24px',
  },
  warningText: {
    margin: 0,
    fontSize: '14px',
    color: '#92400e',
    lineHeight: 1.5,
  },
};

// Add global animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .backButton:hover {
    background-color: #e5e7eb;
    transform: translateX(-4px);
  }
  
  .shareButton:hover {
    background-color: #1d4ed8;
    transform: translateY(-2px);
  }
  
  .startButton:hover, .gameButton:hover {
    background-color: #1d4ed8;
    transform: translateY(-2px);
  }
  
  .gameCard:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  }
  
  .classCard:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  }
  
  .joinClassButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
  
  .previewButton:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  .cancelJoinButton:hover {
    background-color: #e5e7eb;
  }
  
  .closeButton:hover {
    background-color: #f3f4f6;
  }
  
  .deleteButton:hover {
    background-color: #fee2e2;
  }
  
  .modalClose:hover {
    color: #ef4444;
  }
  
  .cancelButton:hover {
    background-color: #e5e7eb;
  }
  
  .confirmButton:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  .dangerButton:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  .joinClassInput:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    outline: none;
  }
  
  .tab:hover {
    color: #2563eb;
  }
`;
document.head.appendChild(styleSheet);

export default Homepage;