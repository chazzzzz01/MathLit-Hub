// src/menu/Homepage.jsx - COMPLETE FIXED VERSION with proper deletion handling
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  FiTrash2, FiArrowLeft, FiBookOpen, FiUsers, FiCalendar, 
  FiClock, FiStar, FiTrendingUp, FiAward, FiTarget,
  FiCopy, FiCheck, FiUser
} from 'react-icons/fi';
import { IoGameController } from 'react-icons/io5';
import { getGameTotalScores } from './Games';
import { classService } from '../services/classService';
import ClassView from './ClassView';

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

  // Function to refresh classes
  const refreshClasses = async () => {
    if (contextRefreshClasses) {
      await contextRefreshClasses();
    }
    await loadJoinedClasses();
  };

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
  }, [userData, user?.dbId]);

  // Listen for class deletion events
  useEffect(() => {
    const handleClassDeleted = (event) => {
      console.log('📢 Class deleted event received:', event.detail);
      setJoinedClasses(prevClasses => prevClasses.filter(c => c.class_id !== event.detail.classId));
      if (selectedClass && selectedClass.id === event.detail.classId) {
        closeClassView();
      }
      setJoinSuccess('Class has been removed successfully!');
      setTimeout(() => setJoinSuccess(''), 3000);
    };
    
    window.addEventListener('classDeleted', handleClassDeleted);
    return () => {
      window.removeEventListener('classDeleted', handleClassDeleted);
    };
  }, [selectedClass]);

  const loadJoinedClasses = async () => {
    try {
      setLoadingClasses(true);
      const classes = await classService.getStudentClasses(user.dbId);
      
      const classesWithTeacherNames = classes.map(enrollment => ({
        ...enrollment,
        class: {
          ...enrollment.class,
          teacher_name: enrollment.class.teacher?.name || enrollment.class.teacher_name || 'Teacher'
        }
      }));
      
      setJoinedClasses(classesWithTeacherNames);
      
      window.dispatchEvent(new Event('classesUpdated'));
      localStorage.setItem('classesUpdated', Date.now().toString());
    } catch (error) {
      console.error('Error loading joined classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const openClassView = (classId, classData) => {
    setSelectedClass({ id: classId, ...classData });
  };

  const closeClassView = () => {
    setSelectedClass(null);
  };

  const formatDate = (date) => {
    if (!date) return 'No date';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const userName = user?.name || user?.email?.split('@')[0] || 'Student';
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleClassCodeChange = (e) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/\s/g, '');
    setClassCode(value);
    setJoinError('');
    setJoinSuccess('');
  };

  const validateClassCode = (code) => {
    const classCodeRegex = /^[A-Z0-9]{4,20}$/;
    return classCodeRegex.test(code);
  };

  const handlePreviewClass = async () => {
    if (!classCode.trim()) {
      setJoinError('Please enter a class code');
      return;
    }
    
    if (!validateClassCode(classCode)) {
      setJoinError('Invalid class code format. Code should be 4-20 characters (letters and numbers only, no spaces)');
      return;
    }
    
    setIsJoining(true);
    setJoinError('');
    
    try {
      const classData = await classService.getClassByCode(classCode);
      
      if (!classData) {
        setJoinError('Class not found. Please check the code and try again.');
        return;
      }
      
      const isAlreadyJoined = await classService.isStudentInClass(user?.dbId, classData.id);
      
      if (isAlreadyJoined) {
        setJoinError('You are already a member of this class!');
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
        await refreshClasses();
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

  const handleRemoveClick = (e, enrollment) => {
    e.stopPropagation();
    setClassToRemove(enrollment);
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!user?.dbId || !classToRemove) return;
    
    setIsRemoving(true);
    
    try {
      const result = await classService.removeStudentFromClass(
        classToRemove.class_id, 
        user.dbId
      );
      
      if (result.success) {
        setJoinedClasses(prevClasses => 
          prevClasses.filter(c => c.class_id !== classToRemove.class_id)
        );
        
        const event = new CustomEvent('classDeleted', { 
          detail: { classId: classToRemove.class_id, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
        
        setJoinSuccess(`Successfully removed from ${classToRemove.class.name}`);
        setShowRemoveModal(false);
        
        if (selectedClass && selectedClass.id === classToRemove.class_id) {
          closeClassView();
        }
        
        setTimeout(() => setJoinSuccess(''), 3000);
      } else {
        setJoinError(result.message || 'Failed to remove from class');
      }
    } catch (error) {
      console.error('Error removing from class:', error);
      setJoinError('Failed to remove from class. Please try again.');
    } finally {
      setIsRemoving(false);
      setClassToRemove(null);
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
          <div>
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
                placeholder="Enter class code (e.g., MATH2024ABC)"
                value={classCode}
                onChange={handleClassCodeChange}
                maxLength="20"
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
              <p style={styles.exampleText}>Ask your teacher for the class code (4-20 characters, letters and numbers only)</p>
            </div>
          </div>
        )}
      </div>

      {!loadingClasses && hasJoinedClasses && (
        <div style={styles.myClassesSection}>
          <h2 style={styles.sectionTitle}>My Classes ({joinedClasses.length})</h2>
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
                        style={styles.deleteButton}
                        onClick={(e) => handleRemoveClick(e, enrollment)}
                        title="Remove from class"
                      >
                        <FiTrash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                    <p style={styles.classTeacher}>
                      <FiUser size={12} style={styles.inlineIcon} />
                      <span style={styles.label}>Teacher:</span> 
                      <strong style={styles.teacherName}>{teacherName}</strong>
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
              );
            })}
          </div>
        </div>
      )}

      {loadingClasses && (
        <div style={styles.loadingClassesContainer}>
          <div style={styles.loadingSpinnerSmall}></div>
          <p>Loading your classes...</p>
        </div>
      )}

      {!loadingClasses && !hasJoinedClasses && !showJoinForm && (
        <div style={styles.noClassesCard}>
          <div style={styles.noClassesIcon}>📚</div>
          <h3 style={styles.noClassesTitle}>No Classes Yet</h3>
          <p style={styles.noClassesText}>Click "Join a New Class" above to get started!</p>
          <p style={styles.noClassesSubtext}>Enter the class code your teacher gave you</p>
        </div>
      )}

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
                <div style={styles.previewTeacherInfo}>
                  <FiUser size={16} />
                  <span style={styles.previewTeacherLabel}>Teacher:</span>
                  <strong style={styles.previewTeacherName}>{classDetails.teacherName}</strong>
                </div>
                <p style={styles.previewCode}>Class Code: <strong>{classDetails.code}</strong></p>
                <p style={styles.previewStudents}>{classDetails.studentsCount} students enrolled</p>
                {classDetails.createdAt && (
                  <p style={styles.previewDate}>Created: {formatDate(classDetails.createdAt)}</p>
                )}
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
                <div style={styles.previewTeacherInfo}>
                  <FiUser size={16} />
                  <span>Teacher: {classToRemove.class.teacher?.name || classToRemove.class.teacher_name || 'Teacher'}</span>
                </div>
                <p style={styles.previewCode}>Code: {classToRemove.class.code}</p>
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
    '@media (max-width: 768px)': { padding: '16px' },
    '@media (max-width: 480px)': { padding: '12px' },
  },
  inlineIcon: { marginRight: '4px', verticalAlign: 'middle' },
  teacherName: { color: '#2563eb', fontWeight: '600', marginLeft: '4px' },
  welcomeCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '32px',
    color: 'white',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    '@media (max-width: 768px)': { padding: '24px', marginBottom: '24px' },
    '@media (max-width: 480px)': { padding: '20px', marginBottom: '20px' },
  },
  welcomeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
    '@media (max-width: 480px)': { flexDirection: 'column', textAlign: 'center', gap: '8px' },
  },
  welcomeIcon: {
    fontSize: '48px',
    '@media (max-width: 480px)': { fontSize: '40px' },
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
    '@media (max-width: 768px)': { fontSize: '24px' },
    '@media (max-width: 480px)': { fontSize: '20px' },
  },
  welcomeDate: {
    fontSize: '14px',
    opacity: 0.9,
    margin: '8px 0 0 0',
    '@media (max-width: 480px)': { fontSize: '12px' },
  },
  welcomeMessage: {
    fontSize: '16px',
    opacity: 0.95,
    margin: 0,
    lineHeight: 1.5,
    '@media (max-width: 480px)': { fontSize: '14px' },
  },
  joinClassContainer: {
    marginBottom: '40px',
    display: 'flex',
    justifyContent: 'center',
    '@media (max-width: 768px)': { marginBottom: '30px' },
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
    '@media (max-width: 768px)': { padding: '14px 24px', fontSize: '16px' },
    '@media (max-width: 480px)': { padding: '12px 20px', fontSize: '14px', width: '100%', justifyContent: 'center' },
  },
  joinIcon: {
    fontSize: '24px',
    '@media (max-width: 480px)': { fontSize: '20px' },
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
    '@media (max-width: 768px)': { padding: '24px' },
    '@media (max-width: 480px)': { padding: '20px' },
  },
  joinClassHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    position: 'relative',
    '@media (max-width: 480px)': { flexWrap: 'wrap' },
  },
  joinClassIcon: {
    fontSize: '28px',
    '@media (max-width: 480px)': { fontSize: '24px' },
  },
  joinClassTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    flex: 1,
    '@media (max-width: 768px)': { fontSize: '20px' },
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
    minHeight: '44px',
    minWidth: '44px',
  },
  joinClassDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: 1.5,
    '@media (max-width: 480px)': { fontSize: '13px', marginBottom: '20px' },
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
    '@media (max-width: 480px)': { padding: '12px 16px', fontSize: '16px' },
  },
  joinClassButtons: {
    display: 'flex',
    gap: '12px',
    '@media (max-width: 480px)': { flexDirection: 'column' },
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
    '@media (max-width: 480px)': { padding: '12px' },
    minHeight: '44px',
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
    '@media (max-width: 480px)': { padding: '12px' },
    minHeight: '44px',
  },
  errorMessage: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '10px',
    fontSize: '14px',
    textAlign: 'center',
    '@media (max-width: 480px)': { fontSize: '12px', padding: '10px' },
  },
  successMessage: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#d1fae5',
    color: '#059669',
    borderRadius: '10px',
    fontSize: '14px',
    textAlign: 'center',
    '@media (max-width: 480px)': { fontSize: '12px', padding: '10px' },
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
  myClassesSection: {
    marginBottom: '40px',
    '@media (max-width: 768px)': { marginBottom: '30px' },
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '20px',
    '@media (max-width: 768px)': { fontSize: '20px', marginBottom: '16px' },
  },
  classesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
    '@media (max-width: 768px)': { gridTemplateColumns: '1fr', gap: '16px' },
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
    '@media (max-width: 480px)': { flexDirection: 'column', textAlign: 'center', padding: '16px' },
  },
  classIcon: {
    fontSize: '48px',
    '@media (max-width: 480px)': { fontSize: '40px' },
  },
  classInfo: {
    flex: 1,
  },
  classHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    '@media (max-width: 480px)': { justifyContent: 'center', gap: '8px' },
  },
  className: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    '@media (max-width: 768px)': { fontSize: '16px' },
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    minWidth: '40px',
    minHeight: '40px',
  },
  label: {
    fontWeight: '500',
    color: '#6b7280',
  },
  classTeacher: {
    fontSize: '13px',
    color: '#374151',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap',
    '@media (max-width: 480px)': { fontSize: '12px', justifyContent: 'center' },
  },
  classCodeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    padding: '6px 10px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    flexWrap: 'wrap',
    '@media (max-width: 480px)': { justifyContent: 'center' },
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
    '@media (max-width: 480px)': { justifyContent: 'center' },
  },
  loadingClassesContainer: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
    marginBottom: '40px',
    '@media (max-width: 768px)': { padding: '30px' },
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
  noClassesCard: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
    marginBottom: '40px',
    '@media (max-width: 768px)': { padding: '40px 20px' },
  },
  noClassesIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    '@media (max-width: 768px)': { fontSize: '48px' },
  },
  noClassesTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
    '@media (max-width: 768px)': { fontSize: '18px' },
  },
  noClassesText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '8px',
    '@media (max-width: 768px)': { fontSize: '14px' },
  },
  noClassesSubtext: {
    fontSize: '14px',
    color: '#9ca3af',
    '@media (max-width: 768px)': { fontSize: '12px' },
  },
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
    padding: '20px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '20px',
    maxWidth: '450px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    '@media (max-width: 480px)': { borderRadius: '16px', maxHeight: '85vh' },
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    '@media (max-width: 480px)': { padding: '16px 20px' },
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
    '@media (max-width: 480px)': { fontSize: '18px' },
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#9ca3af',
    transition: 'color 0.2s',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (max-width: 480px)': { fontSize: '24px' },
  },
  modalBody: {
    padding: '24px',
    '@media (max-width: 480px)': { padding: '20px' },
  },
  classPreview: {
    textAlign: 'center',
  },
  previewIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    '@media (max-width: 480px)': { fontSize: '48px', marginBottom: '12px' },
  },
  previewName: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '12px',
    '@media (max-width: 480px)': { fontSize: '20px', marginBottom: '8px' },
  },
  previewTeacherInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '12px',
    padding: '8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#374151',
    flexWrap: 'wrap',
    '@media (max-width: 480px)': { fontSize: '12px', marginBottom: '8px' },
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
    fontSize: '16px',
    marginBottom: '8px',
    '@media (max-width: 480px)': { fontSize: '14px' },
  },
  previewStudents: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '8px',
    '@media (max-width: 480px)': { fontSize: '12px', marginBottom: '12px' },
  },
  previewDate: {
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '16px',
    '@media (max-width: 480px)': { fontSize: '11px', marginBottom: '12px' },
  },
  previewDescription: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: 1.5,
    marginTop: '12px',
    '@media (max-width: 480px)': { fontSize: '13px' },
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    '@media (max-width: 480px)': { padding: '16px 20px', flexDirection: 'column' },
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
    '@media (max-width: 480px)': { padding: '12px', width: '100%' },
    minHeight: '44px',
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
    '@media (max-width: 480px)': { padding: '12px', width: '100%' },
    minHeight: '44px',
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
    '@media (max-width: 480px)': { padding: '12px', width: '100%' },
    minHeight: '44px',
  },
  warningBox: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#fef3c7',
    borderRadius: '12px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    '@media (max-width: 480px)': { padding: '12px', gap: '8px' },
  },
  warningIcon: {
    fontSize: '24px',
    '@media (max-width: 480px)': { fontSize: '20px' },
  },
  warningText: {
    margin: 0,
    fontSize: '14px',
    color: '#92400e',
    lineHeight: 1.5,
    '@media (max-width: 480px)': { fontSize: '12px' },
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
  
  .classCard:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
  .joinClassButton:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); }
  .previewButton:hover:not(:disabled) { transform: translateY(-1px); }
  .cancelJoinButton:hover { background-color: #e5e7eb; }
  .closeButton:hover { background-color: #f3f4f6; }
  .deleteButton:hover { background-color: #fee2e2; }
  .modalClose:hover { color: #ef4444; }
  .cancelButton:hover { background-color: #e5e7eb; }
  .confirmButton:hover:not(:disabled) { transform: translateY(-1px); }
  .dangerButton:hover:not(:disabled) { transform: translateY(-1px); }
  .joinClassInput:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); outline: none; }
  .modalContent { animation: modalFadeIn 0.2s ease-out; }
  .successMessage { animation: slideIn 0.3s ease-out; }
  .errorMessage { animation: shake 0.3s ease-in-out; }
  
  /* Mobile touch optimizations */
  @media (max-width: 768px) {
    button, .classCard, .tab {
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    button:active, .classCard:active {
      transform: scale(0.98);
      transition: transform 0.05s ease;
    }
    input, textarea, select {
      font-size: 16px !important;
    }
    button, .classCard, .deleteButton, .closeButton, .modalClose, 
    .joinClassButton, .previewButton, .cancelJoinButton, 
    .cancelButton, .confirmButton, .dangerButton {
      min-height: 44px;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Homepage;