// src/menu/Homepage.jsx - FULLY RESPONSIVE (optimized for 308x748 and all screen sizes)
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  FiTrash2, FiArrowLeft, FiBookOpen, FiUsers, FiCalendar, 
  FiClock, FiStar, FiTrendingUp, FiAward, FiTarget,
  FiCopy, FiCheck, FiUser
} from 'react-icons/fi';
import { IoGameController } from 'react-icons/io5';
import { getGameTotalScores } from './Games';
import { classService } from '../services/classService';
import ClassView from './ClassView.jsx';

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
  
  // Remove Class State (for students)
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [classToRemove, setClassToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Selected Class for detailed view
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Copy State
  const [copied, setCopied] = useState(false);

  // Function to refresh classes - completely reload from database
  const refreshClasses = useCallback(async () => {
    if (contextRefreshClasses) {
      await contextRefreshClasses();
    }
    await loadJoinedClasses();
  }, [contextRefreshClasses]);

  // Load joined classes from database
  const loadJoinedClasses = useCallback(async () => {
    if (!user?.dbId) {
      setLoadingClasses(false);
      return;
    }
    
    try {
      setLoadingClasses(true);
      console.log('Loading classes for user:', user.dbId);
      
      // Fetch fresh data from database
      const classes = await classService.getStudentClasses(user.dbId);
      
      console.log('Classes loaded from DB:', classes.length);
      
      const classesWithTeacherNames = classes.map(enrollment => ({
        ...enrollment,
        class: {
          ...enrollment.class,
          teacher_name: enrollment.class.teacher?.name || enrollment.class.teacher_name || 'Teacher'
        }
      }));
      
      // Update state with fresh data
      setJoinedClasses(classesWithTeacherNames);
      
    } catch (error) {
      console.error('Error loading joined classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  }, [user?.dbId]);

  useEffect(() => {
    const gameProgress = userData?.gameProgress || JSON.parse(localStorage.getItem('gameProgress')) || null;
    if (gameProgress) {
      const scores = getGameTotalScores(gameProgress);
      setTotalScores(scores);
    }
    
    if (user?.dbId) {
      loadJoinedClasses();
    } else {
      setLoadingClasses(false);
    }
  }, [userData, user?.dbId, loadJoinedClasses]);

  // Listen for class deletion events
  useEffect(() => {
    const handleClassDeleted = (event) => {
      console.log('📢 Class deleted event received:', event.detail);
      // Immediately remove from state
      setJoinedClasses(prevClasses => {
        const filtered = prevClasses.filter(c => c.class_id !== event.detail.classId);
        console.log('Removed class, remaining:', filtered.length);
        return filtered;
      });
      if (selectedClass && selectedClass.id === event.detail.classId) {
        closeClassView();
      }
    };
    
    const handleClassesUpdated = () => {
      console.log('Classes updated event received, reloading...');
      if (user?.dbId) {
        loadJoinedClasses();
      }
    };
    
    window.addEventListener('classDeleted', handleClassDeleted);
    window.addEventListener('classesUpdated', handleClassesUpdated);
    
    return () => {
      window.removeEventListener('classDeleted', handleClassDeleted);
      window.removeEventListener('classesUpdated', handleClassesUpdated);
    };
  }, [selectedClass, user?.dbId, loadJoinedClasses]);

  const openClassView = (classId, classData) => {
    setSelectedClass({ id: classId, ...classData });
  };

  const closeClassView = () => {
    setSelectedClass(null);
  };

  const userName = user?.name || user?.email?.split('@')[0] || 'Student';
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const validateClassCode = (code) => {
    const classCodeRegex = /^[A-Za-z0-9\-_\.@#$%&*+=?!~]{4,30}$/;
    return classCodeRegex.test(code);
  };

  const copyToClipboard = async () => {
    if (!classCode) return;
    try {
      await navigator.clipboard.writeText(classCode);
      setCopied(true);
      setJoinSuccess('Code copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setJoinSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClassCodeChange = (e) => {
    let value = e.target.value;
    setClassCode(value);
    setJoinError('');
    setJoinSuccess('');
    setClassDetails(null);
  };

  const handlePreviewClass = async () => {
    setJoinError('');
    setClassDetails(null);
    
    if (!classCode.trim()) {
      setJoinError('Please enter a class code');
      return;
    }
    
    if (!validateClassCode(classCode)) {
      setJoinError('Invalid class code format. Code should be 4-30 characters and can include letters (A-Z, a-z), numbers (0-9), and symbols (- _ . @ # $ % & * + = ? ! ~)');
      return;
    }
    
    setIsJoining(true);
    
    try {
      const classData = await classService.getClassByCode(classCode);
      
      // Exact match verification
      if (!classData || classData.code !== classCode) {
        setJoinError(`No class found with exact code "${classCode}". Please check the code and try again.`);
        setIsJoining(false);
        return;
      }
      
      // Check if student is already enrolled in this class
      const isCurrentlyJoined = await classService.isStudentInClass(user?.dbId, classData.id);
      
      if (isCurrentlyJoined) {
        setJoinError('You are already a member of this class!');
        setIsJoining(false);
        return;
      }
      
      let teacherName = 'Teacher';
      if (classData.teacher_name && classData.teacher_name !== 'Teacher') {
        teacherName = classData.teacher_name;
      } else if (classData.teacher?.name && classData.teacher.name !== 'Teacher') {
        teacherName = classData.teacher.name;
      } else if (classData.teacher?.user?.name && classData.teacher.user.name !== 'Teacher') {
        teacherName = classData.teacher.user.name;
      }
      
      setClassDetails({
        id: classData.id,
        name: classData.name,
        code: classData.code,
        teacherName: teacherName,
        description: classData.description || `Join ${classData.name} to start learning and earning points!`,
        icon: getClassIcon(classData.name),
        studentsCount: classData.students_count || 0,
        createdAt: classData.created_at
      });
      setShowJoinModal(true);
      
    } catch (error) {
      console.error('Error checking class:', error);
      setJoinError('Network error. Please try again.');
    } finally {
      setIsJoining(false);
    }
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

  const handleJoinClass = async () => {
    if (!user?.dbId) {
      setJoinError('Please log in to join a class');
      return;
    }
    
    setIsJoining(true);
    setJoinError('');
    
    try {
      const result = await classService.joinClass(user.dbId, classCode);
      
      if (result.success) {
        setJoinSuccess(`Successfully joined ${result.class.name}! 🎉`);
        setShowJoinModal(false);
        setClassDetails(null);
        setClassCode('');
        setShowJoinForm(false);
        // Refresh the classes list immediately
        await loadJoinedClasses();
        setTimeout(() => setJoinSuccess(''), 3000);
      } else {
        setJoinError(result.message || 'Failed to join class. Please try again.');
        setShowJoinModal(false);
      }
    } catch (error) {
      console.error('Error joining class:', error);
      setJoinError(error.message || 'Failed to join class. Please try again.');
      setShowJoinModal(false);
    } finally {
      setIsJoining(false);
    }
  };

  const handleRemoveClick = (e, enrollment) => {
    e.stopPropagation();
    setClassToRemove(enrollment);
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!user?.dbId || !classToRemove) return;
    
    setIsRemoving(true);
    
    try {
      console.log('Attempting to remove class:', classToRemove.class_id, classToRemove.class.name);
      
      // Remove from database
      const result = await classService.removeStudentFromClass(
        classToRemove.class_id, 
        user.dbId
      );
      
      console.log('Remove result:', result);
      
      if (result.success) {
        // IMMEDIATELY remove from local state - this is the key fix
        setJoinedClasses(prevClasses => {
          const filtered = prevClasses.filter(c => c.class_id !== classToRemove.class_id);
          console.log('Class removed from state. Before:', prevClasses.length, 'After:', filtered.length);
          return filtered;
        });
        
        // Clear the class from the selected view if it's open
        if (selectedClass && selectedClass.id === classToRemove.class_id) {
          closeClassView();
        }
        
        // Dispatch events to notify all components
        const deleteEvent = new CustomEvent('classDeleted', { 
          detail: { 
            classId: classToRemove.class_id, 
            className: classToRemove.class.name,
            timestamp: Date.now() 
          }
        });
        window.dispatchEvent(deleteEvent);
        
        const updateEvent = new Event('classesUpdated');
        window.dispatchEvent(updateEvent);
        
        // Show success message
        setJoinSuccess(`Successfully left ${classToRemove.class.name}`);
        setShowRemoveModal(false);
        setClassToRemove(null);
        
        // Force a fresh reload from database to ensure consistency
        setTimeout(async () => {
          await loadJoinedClasses();
        }, 100);
        
        setTimeout(() => setJoinSuccess(''), 3000);
      } else {
        setJoinError(result.message || 'Failed to leave class. Please try again.');
      }
    } catch (error) {
      console.error('Error leaving class:', error);
      setJoinError('Failed to leave class. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveModal(false);
    setClassToRemove(null);
  };

  const hasJoinedClasses = joinedClasses.length > 0;

  // If a class is selected, render ClassView component
  if (selectedClass) {
    return (
      <ClassView 
        classId={selectedClass.id} 
        classData={selectedClass}
        onBack={closeClassView}
      />
    );
  }

  // Main view (Class List)
  return (
    <div style={styles.container}>
      <div style={styles.welcomeCard}>
        <div style={styles.welcomeHeader}>
          <div style={styles.welcomeIcon}>🎮</div>
          <div style={styles.welcomeTextContainer}>
            <h1 style={styles.welcomeTitle}>Welcome back, {userName}!</h1>
            <p style={styles.welcomeDate}>{currentDate}</p>
          </div>
        </div>
        <p style={styles.welcomeMessage}>
          Ready to continue your learning journey? Check out your progress below and start playing to earn more points!
        </p>
      </div>

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
                  setClassDetails(null);
                }}
              >
                ✕
              </button>
            </div>
            
            <p style={styles.joinClassDescription}>
              Enter the class code provided by your teacher to join and start learning!
            </p>
            
            <div style={styles.joinClassForm}>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  style={styles.joinClassInput}
                  className="joinClassInput"
                  placeholder="Enter class code (e.g., Math123, Learn-123, Study@2024)"
                  value={classCode}
                  onChange={handleClassCodeChange}
                  maxLength="30"
                  autoFocus
                />
                {classCode && (
                  <button 
                    style={styles.copyButtonInline}
                    onClick={copyToClipboard}
                    title="Copy to clipboard"
                  >
                    {copied ? <FiCheck size={14} color="#10b981" /> : <FiCopy size={14} />}
                  </button>
                )}
              </div>
              <div style={styles.joinClassButtons}>
                <button 
                  style={styles.cancelJoinButton}
                  onClick={() => {
                    setShowJoinForm(false);
                    setClassCode('');
                    setJoinError('');
                    setJoinSuccess('');
                    setClassDetails(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  style={styles.previewButton}
                  onClick={handlePreviewClass}
                  disabled={isJoining || !classCode.trim()}
                >
                  {isJoining ? 'Checking...' : 'Preview'}
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
              <p style={styles.exampleTitle}>💡 Example Class Codes:</p>
              <p style={styles.exampleText}>• MATH101 • Learn-123 • Study@2024 • GAME_CODE • Class#1</p>
              <p style={styles.exampleText}>• Codes can include letters, numbers, and symbols</p>
              <p style={styles.exampleText}>• Make sure to enter the exact code as provided by your teacher</p>
              <p style={styles.exampleText}>• Class codes must match exactly (case-sensitive)</p>
            </div>
          </div>
        )}
      </div>

      {!loadingClasses && (
        <div style={styles.myClassesSection}>
          <h2 style={styles.sectionTitle}>
            My Classes ({joinedClasses.length})
          </h2>
          {hasJoinedClasses ? (
            <div style={styles.classesGrid}>
              {joinedClasses.map((enrollment) => {
                const teacherName = enrollment.class.teacher?.name || enrollment.class.teacher_name || 'Teacher';
                return (
                  <div 
                    key={enrollment.class_id} 
                    style={styles.classCard}
                    onClick={() => openClassView(enrollment.class_id, enrollment.class)}
                  >
                    <div style={styles.classIcon}>{getClassIcon(enrollment.class.name)}</div>
                    <div style={styles.classInfo}>
                      <div style={styles.classHeader}>
                        <h3 style={styles.className}>{enrollment.class.name}</h3>
                        <button 
                          style={styles.leaveClassButton}
                          onClick={(e) => handleRemoveClick(e, enrollment)}
                          title="Leave this class"
                        >
                          Leave Class
                        </button>
                      </div>
                      <p style={styles.classTeacher}>
                        <FiUser size={10} style={styles.inlineIcon} />
                        <span style={styles.label}>Teacher:</span> 
                        <strong style={styles.teacherName}>{teacherName}</strong>
                      </p>
                      <div style={styles.classCodeContainer}>
                        <span style={styles.classCodeLabel}>Code:</span>
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
                        Tap to open <FiArrowLeft style={{transform: 'rotate(180deg)'}} size={12} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !showJoinForm && (
            <div style={styles.noClassesCard}>
              <div style={styles.noClassesIcon}>📚</div>
              <h3 style={styles.noClassesTitle}>No Classes Yet</h3>
              <p style={styles.noClassesText}>Tap "Join a New Class" to get started!</p>
              <p style={styles.noClassesSubtext}>Enter the class code your teacher gave you</p>
            </div>
          )}
        </div>
      )}

      {loadingClasses && (
        <div style={styles.loadingClassesContainer}>
          <div style={styles.loadingSpinnerSmall}></div>
          <p>Loading your classes...</p>
        </div>
      )}

      {showJoinModal && classDetails && (
        <div style={styles.modalOverlay} onClick={() => {
          setShowJoinModal(false);
          setClassDetails(null);
        }}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Confirm Join</h2>
              <button style={styles.modalClose} onClick={() => {
                setShowJoinModal(false);
                setClassDetails(null);
              }}>×</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.classPreview}>
                <div style={styles.previewIcon}>{classDetails.icon}</div>
                <h3 style={styles.previewName}>{classDetails.name}</h3>
                <div style={styles.previewTeacherInfo}>
                  <FiUser size={14} />
                  <span style={styles.previewTeacherLabel}>Teacher:</span>
                  <strong style={styles.previewTeacherName}>{classDetails.teacherName}</strong>
                </div>
                <p style={styles.previewCode}>Code: <strong>{classDetails.code}</strong></p>
                <p style={styles.previewStudents}>{classDetails.studentsCount} students</p>
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
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveModal && classToRemove && (
        <div style={styles.modalOverlay} onClick={handleCancelRemove}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Leave Class</h2>
              <button style={styles.modalClose} onClick={handleCancelRemove}>×</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.classPreview}>
                <div style={styles.previewIcon}>{getClassIcon(classToRemove.class.name)}</div>
                <h3 style={styles.previewName}>{classToRemove.class.name}</h3>
                <p style={styles.previewCode}>Code: {classToRemove.class.code}</p>
              </div>
              
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}>⚠️</span>
                <p style={styles.warningText}>
                  Are you sure you want to leave this class? You will lose access to all class content and your progress will be reset. You can rejoin later with the class code.
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
                {isRemoving ? 'Leaving...' : 'Yes, Leave Class'}
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
    width: '100%',
    maxWidth: '100%',
    margin: '0',
    padding: '12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box',
    '@media (min-width: 769px)': { 
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px'
    },
  },
  inlineIcon: { 
    marginRight: '2px', 
    verticalAlign: 'middle' 
  },
  teacherName: { 
    color: '#2563eb', 
    fontWeight: '600', 
    marginLeft: '2px',
    fontSize: 'inherit'
  },
  welcomeCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '16px',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    '@media (min-width: 769px)': { 
      borderRadius: '20px',
      padding: '32px',
      marginBottom: '32px'
    },
  },
  welcomeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap',
    '@media (min-width: 769px)': { 
      gap: '16px',
      marginBottom: '16px'
    },
  },
  welcomeIcon: {
    fontSize: '32px',
    flexShrink: 0,
    '@media (min-width: 769px)': { fontSize: '48px' },
  },
  welcomeTextContainer: {
    flex: 1,
    '@media (max-width: 480px)': { textAlign: 'center' },
  },
  welcomeTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
    '@media (min-width: 769px)': { fontSize: '28px' },
  },
  welcomeDate: {
    fontSize: '10px',
    opacity: 0.9,
    margin: '4px 0 0 0',
    '@media (min-width: 769px)': { fontSize: '14px', marginTop: '8px' },
  },
  welcomeMessage: {
    fontSize: '12px',
    opacity: 0.95,
    margin: 0,
    lineHeight: 1.4,
    '@media (min-width: 769px)': { fontSize: '16px', lineHeight: 1.5 },
  },
  joinClassContainer: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    '@media (min-width: 769px)': { marginBottom: '40px' },
  },
  joinClassButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
    width: '100%',
    justifyContent: 'center',
    '@media (min-width: 769px)': { 
      padding: '16px 32px',
      fontSize: '18px',
      gap: '12px',
      width: 'auto',
      minWidth: '200px'
    },
  },
  joinIcon: {
    fontSize: '18px',
    '@media (min-width: 769px)': { fontSize: '24px' },
  },
  joinClassCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '16px',
    width: '100%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    position: 'relative',
    boxSizing: 'border-box',
    '@media (min-width: 769px)': { 
      padding: '32px',
      maxWidth: '600px',
      borderRadius: '20px'
    },
  },
  joinClassHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    position: 'relative',
    flexWrap: 'wrap',
    '@media (min-width: 769px)': { 
      gap: '12px',
      marginBottom: '20px'
    },
  },
  joinClassIcon: {
    fontSize: '20px',
    '@media (min-width: 769px)': { fontSize: '28px' },
  },
  joinClassTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0,
    flex: 1,
    '@media (min-width: 769px)': { fontSize: '24px' },
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: '4px',
    borderRadius: '8px',
    transition: 'all 0.2s',
    minHeight: '36px',
    minWidth: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (min-width: 769px)': { 
      fontSize: '24px',
      minHeight: '44px',
      minWidth: '44px'
    },
  },
  joinClassDescription: {
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '16px',
    lineHeight: 1.4,
    '@media (min-width: 769px)': { 
      fontSize: '14px', 
      marginBottom: '24px',
      lineHeight: 1.5
    },
  },
  joinClassForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '12px',
    width: '100%',
    '@media (min-width: 769px)': { 
      gap: '16px',
      marginBottom: '16px'
    },
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  joinClassInput: {
    width: '100%',
    padding: '10px 12px',
    paddingRight: '35px',
    fontSize: '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
    '@media (min-width: 769px)': { 
      padding: '14px 18px',
      paddingRight: '40px',
      fontSize: '16px',
    },
  },
  copyButtonInline: {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    minWidth: '28px',
    minHeight: '28px',
    '@media (min-width: 769px)': { 
      right: '10px',
      minWidth: '32px',
      minHeight: '32px',
    },
  },
  joinClassButtons: {
    display: 'flex',
    gap: '8px',
    width: '100%',
    flexDirection: 'column',
    '@media (min-width: 481px)': { 
      flexDirection: 'row',
      gap: '12px'
    },
  },
  cancelJoinButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    minHeight: '40px',
    '@media (min-width: 769px)': { 
      padding: '12px',
      fontSize: '14px',
      minHeight: '44px'
    },
  },
  previewButton: {
    flex: 1,
    padding: '10px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    minHeight: '40px',
    '@media (min-width: 769px)': { 
      padding: '12px',
      fontSize: '14px',
      minHeight: '44px'
    },
  },
  errorMessage: {
    marginTop: '12px',
    padding: '8px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px',
    fontSize: '11px',
    textAlign: 'center',
    wordBreak: 'break-word',
    '@media (min-width: 769px)': { 
      marginTop: '16px',
      padding: '12px',
      fontSize: '14px'
    },
  },
  successMessage: {
    marginTop: '12px',
    padding: '8px',
    backgroundColor: '#d1fae5',
    color: '#059669',
    borderRadius: '8px',
    fontSize: '11px',
    textAlign: 'center',
    wordBreak: 'break-word',
    '@media (min-width: 769px)': { 
      marginTop: '16px',
      padding: '12px',
      fontSize: '14px'
    },
  },
  exampleCodes: {
    marginTop: '12px',
    padding: '8px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    textAlign: 'center',
    '@media (min-width: 769px)': { 
      marginTop: '20px',
      padding: '12px'
    },
  },
  exampleTitle: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#166534',
    margin: '0 0 2px 0',
    '@media (min-width: 769px)': { fontSize: '12px', marginBottom: '4px' },
  },
  exampleText: {
    fontSize: '9px',
    color: '#166534',
    margin: '2px 0',
    '@media (min-width: 769px)': { fontSize: '11px' },
  },
  myClassesSection: {
    marginBottom: '20px',
    width: '100%',
    '@media (min-width: 769px)': { marginBottom: '40px' },
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '12px',
    textAlign: 'center',
    '@media (min-width: 769px)': { 
      fontSize: '24px', 
      marginBottom: '20px',
      textAlign: 'left'
    },
  },
  classesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    '@media (min-width: 769px)': { 
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '20px'
    },
  },
  classCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    gap: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    '@media (min-width: 769px)': { 
      padding: '20px',
      gap: '16px',
      borderRadius: '16px'
    },
  },
  classIcon: {
    fontSize: '36px',
    flexShrink: 0,
    '@media (min-width: 769px)': { fontSize: '48px' },
  },
  classInfo: {
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  classHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    flexWrap: 'wrap',
    gap: '8px',
    '@media (min-width: 769px)': { marginBottom: '8px' },
  },
  className: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    wordBreak: 'break-word',
    '@media (min-width: 769px)': { fontSize: '18px' },
  },
  leaveClassButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#ef4444',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
    '@media (min-width: 769px)': { 
      fontSize: '13px',
      padding: '6px 12px',
    },
  },
  label: {
    fontWeight: '500',
    color: '#6b7280',
    fontSize: '10px',
    '@media (min-width: 769px)': { fontSize: '13px' },
  },
  classTeacher: {
    fontSize: '10px',
    color: '#374151',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    flexWrap: 'wrap',
    '@media (min-width: 769px)': { 
      fontSize: '13px',
      marginBottom: '8px',
      gap: '4px'
    },
  },
  classCodeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '6px',
    padding: '4px 6px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    flexWrap: 'wrap',
    '@media (min-width: 769px)': { 
      gap: '8px',
      marginBottom: '8px',
      padding: '6px 10px',
      borderRadius: '6px'
    },
  },
  classCodeLabel: {
    fontSize: '9px',
    color: '#6b7280',
    fontWeight: '500',
    '@media (min-width: 769px)': { fontSize: '12px' },
  },
  classCode: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#3b82f6',
    fontFamily: 'monospace',
    letterSpacing: '0.5px',
    wordBreak: 'break-all',
    '@media (min-width: 769px)': { fontSize: '14px', letterSpacing: '1px' },
  },
  joinedDate: {
    fontSize: '9px',
    color: '#6b7280',
    marginBottom: '6px',
    '@media (min-width: 769px)': { 
      fontSize: '12px',
      marginBottom: '8px'
    },
  },
  progressBar: {
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '6px',
    '@media (min-width: 769px)': { 
      height: '6px',
      marginTop: '8px'
    },
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '9px',
    color: '#6b7280',
    marginTop: '2px',
    '@media (min-width: 769px)': { 
      fontSize: '11px',
      marginTop: '4px'
    },
  },
  openClassButton: {
    marginTop: '8px',
    fontSize: '10px',
    color: '#667eea',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: '500',
    '@media (min-width: 769px)': { 
      marginTop: '12px',
      fontSize: '12px',
      gap: '6px'
    },
  },
  loadingClassesContainer: {
    textAlign: 'center',
    padding: '24px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    marginBottom: '20px',
    '@media (min-width: 769px)': { 
      padding: '40px',
      marginBottom: '40px'
    },
  },
  loadingSpinnerSmall: {
    width: '24px',
    height: '24px',
    border: '2px solid #f3f4f6',
    borderTop: '2px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 8px',
    '@media (min-width: 769px)': { 
      width: '30px',
      height: '30px',
      borderWidth: '3px',
      marginBottom: '12px'
    },
  },
  noClassesCard: {
    textAlign: 'center',
    padding: '32px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    '@media (min-width: 769px)': { 
      padding: '60px 20px',
    },
  },
  noClassesIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    '@media (min-width: 769px)': { 
      fontSize: '64px',
      marginBottom: '16px'
    },
  },
  noClassesTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '6px',
    '@media (min-width: 769px)': { 
      fontSize: '20px',
      marginBottom: '8px'
    },
  },
  noClassesText: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
    '@media (min-width: 769px)': { 
      fontSize: '16px',
      marginBottom: '8px'
    },
  },
  noClassesSubtext: {
    fontSize: '10px',
    color: '#9ca3af',
    '@media (min-width: 769px)': { fontSize: '14px' },
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '12px',
    '@media (min-width: 769px)': { padding: '20px' },
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    maxWidth: 'calc(100% - 24px)',
    width: '100%',
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    '@media (min-width: 769px)': { 
      borderRadius: '20px',
      maxWidth: '450px',
      maxHeight: '90vh'
    },
  },
  modalHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    '@media (min-width: 769px)': { padding: '20px 24px' },
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
    '@media (min-width: 769px)': { fontSize: '20px' },
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    color: '#9ca3af',
    transition: 'color 0.2s',
    minWidth: '36px',
    minHeight: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (min-width: 769px)': { 
      fontSize: '28px',
      minWidth: '44px',
      minHeight: '44px'
    },
  },
  modalBody: {
    padding: '16px',
    '@media (min-width: 769px)': { padding: '24px' },
  },
  classPreview: {
    textAlign: 'center',
  },
  previewIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    '@media (min-width: 769px)': { 
      fontSize: '64px', 
      marginBottom: '16px' 
    },
  },
  previewName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px',
    wordBreak: 'break-word',
    '@media (min-width: 769px)': { 
      fontSize: '24px', 
      marginBottom: '12px' 
    },
  },
  previewTeacherInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    marginBottom: '8px',
    padding: '6px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '11px',
    color: '#374151',
    flexWrap: 'wrap',
    '@media (min-width: 769px)': { 
      gap: '8px',
      marginBottom: '12px',
      padding: '8px',
      fontSize: '14px'
    },
  },
  previewTeacherLabel: {
    fontWeight: '500',
    color: '#6b7280',
  },
  previewTeacherName: {
    color: '#2563eb',
    fontWeight: '600',
  },
  previewCode: {
    fontSize: '12px',
    marginBottom: '6px',
    wordBreak: 'break-word',
    '@media (min-width: 769px)': { 
      fontSize: '16px',
      marginBottom: '8px'
    },
  },
  previewStudents: {
    fontSize: '10px',
    color: '#6b7280',
    marginBottom: '6px',
    '@media (min-width: 769px)': { 
      fontSize: '13px', 
      marginBottom: '12px' 
    },
  },
  previewDescription: {
    fontSize: '11px',
    color: '#374151',
    lineHeight: 1.4,
    marginTop: '8px',
    '@media (min-width: 769px)': { 
      fontSize: '14px',
      lineHeight: 1.5,
      marginTop: '12px'
    },
  },
  modalFooter: {
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    flexDirection: 'column',
    '@media (min-width: 481px)': { 
      flexDirection: 'row',
      gap: '12px'
    },
    '@media (min-width: 769px)': { 
      padding: '16px 24px'
    },
  },
  cancelButton: {
    padding: '10px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    minHeight: '40px',
    '@media (min-width: 481px)': { 
      padding: '10px 20px',
      minWidth: '100px'
    },
    '@media (min-width: 769px)': { 
      fontSize: '14px',
      minHeight: '44px'
    },
  },
  confirmButton: {
    padding: '10px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'transform 0.2s',
    minHeight: '40px',
    '@media (min-width: 481px)': { 
      padding: '10px 20px',
      minWidth: '100px'
    },
    '@media (min-width: 769px)': { 
      fontSize: '14px',
      minHeight: '44px'
    },
  },
  dangerButton: {
    padding: '10px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'transform 0.2s',
    minHeight: '40px',
    '@media (min-width: 481px)': { 
      padding: '10px 20px',
      minWidth: '100px'
    },
    '@media (min-width: 769px)': { 
      fontSize: '14px',
      minHeight: '44px'
    },
  },
  warningBox: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#fef3c7',
    borderRadius: '10px',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    '@media (min-width: 769px)': { 
      marginTop: '20px',
      padding: '16px',
      gap: '12px'
    },
  },
  warningIcon: {
    fontSize: '18px',
    flexShrink: 0,
    '@media (min-width: 769px)': { fontSize: '24px' },
  },
  warningText: {
    margin: 0,
    fontSize: '10px',
    color: '#92400e',
    lineHeight: 1.4,
    '@media (min-width: 769px)': { 
      fontSize: '14px',
      lineHeight: 1.5
    },
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes modalFadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  
  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  .classCard:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .joinClassButton:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
  .previewButton:hover:not(:disabled) { transform: translateY(-1px); }
  .cancelJoinButton:hover { background-color: #e5e7eb; }
  .closeButton:hover { background-color: #f3f4f6; }
  .leaveClassButton:hover { background-color: #fee2e2; color: #dc2626; }
  .copyButtonInline:hover { background-color: #e5e7eb; }
  .modalClose:hover { color: #ef4444; }
  .cancelButton:hover { background-color: #e5e7eb; }
  .confirmButton:hover:not(:disabled) { transform: translateY(-1px); }
  .dangerButton:hover:not(:disabled) { transform: translateY(-1px); }
  .joinClassInput:focus { border-color: #667eea; box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1); outline: none; }
  .modalContent { animation: modalFadeIn 0.2s ease-out; }
  .successMessage { animation: slideIn 0.3s ease-out; }
  .errorMessage { animation: shake 0.3s ease-in-out; }
  
  /* Touch optimizations for all mobile devices */
  @media (max-width: 768px) {
    button, .classCard, .tab {
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    button:active, .classCard:active {
      transform: scale(0.97);
      transition: transform 0.05s ease;
    }
    input, textarea, select {
      font-size: 16px !important;
    }
    button, .classCard .leaveClassButton, .closeButton, .modalClose, 
    .joinClassButton, .previewButton, .cancelJoinButton, 
    .cancelButton, .confirmButton, .dangerButton,
    .copyButtonInline {
      min-height: 40px;
    }
  }
  
  /* Specific optimizations for very small screens (308px width) */
  @media (max-width: 360px) {
    .welcomeTitle {
      font-size: 14px !important;
    }
    .welcomeIcon {
      font-size: 28px !important;
    }
    .classIcon {
      font-size: 28px !important;
    }
    .className {
      font-size: 12px !important;
    }
    .joinClassTitle {
      font-size: 14px !important;
    }
    .sectionTitle {
      font-size: 14px !important;
    }
    .joinClassButton {
      font-size: 12px !important;
      padding: 10px 16px !important;
    }
    .classCard {
      padding: 10px !important;
    }
    .classTeacher, .joinedDate, .progressText {
      font-size: 9px !important;
    }
    .previewName {
      font-size: 14px !important;
    }
    .previewIcon {
      font-size: 40px !important;
    }
    .leaveClassButton {
      font-size: 10px !important;
      padding: 3px 6px !important;
    }
    .exampleText {
      font-size: 8px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Homepage;