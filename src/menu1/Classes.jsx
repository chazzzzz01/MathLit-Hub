import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  FiUsers, FiBookOpen, FiTrendingUp, FiAward, 
  FiClock, FiCalendar, FiPlus, FiCopy, FiCheck,
  FiArrowLeft, FiMoreVertical, FiTrash2,
  FiUserPlus, FiBell, FiSend, FiAlertCircle, FiChevronDown
} from 'react-icons/fi';
import { classService } from '../services/classService';
import { supabase } from '../lib/supabase';

function Classes() {
  const location = useLocation();
  const navigate = useNavigate();
  const { classId } = useParams();
  const classData = location.state?.classData;
  
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [missions, setMissions] = useState([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentCode, setStudentCode] = useState('');
  const [showCreateMission, setShowCreateMission] = useState(false);
  const [newMission, setNewMission] = useState({ title: '', dueDate: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  // Announcement states
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState('');
  const [announcementError, setAnnouncementError] = useState('');
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageProgress: 0,
    activeMissions: 0,
    completionRate: 0
  });

  // Check screen size for dropdown
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 480);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    loadClassData();
  }, [classId, classData]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      const id = classId || classData?.id;
      
      if (!id) {
        navigate('/teacherhub/home');
        return;
      }
      
      const classDetails = await classService.getClassWithStudents(id);
      if (!classDetails) {
        alert('Class not found');
        navigate('/teacherhub/home');
        return;
      }
      
      setClassInfo(classDetails);
      const studentsList = await classService.getClassStudents(id);
      setStudents(studentsList);
      const missionsList = await classService.getClassMissions(id);
      setMissions(missionsList);
      
      const totalStudents = studentsList.length;
      const avgProgress = studentsList.length > 0 
        ? Math.round(studentsList.reduce((sum, s) => sum + (s.progress || 0), 0) / studentsList.length)
        : 0;
      const activeMissions = missionsList.filter(m => m.status === 'active').length;
      const completionRate = missionsList.length > 0
        ? Math.round((missionsList.filter(m => m.status === 'completed').length / missionsList.length) * 100)
        : 0;
      
      setStats({ totalStudents, averageProgress: avgProgress, activeMissions, completionRate });
    } catch (error) {
      console.error('Error loading class data:', error);
      alert('Failed to load class data.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const code = classInfo?.code || classData?.code;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleAddStudent = async () => {
    if (!studentCode.trim()) {
      alert('Please enter a student code');
      return;
    }
    alert(`Student with code ${studentCode} would be added.`);
    setShowAddStudent(false);
    setStudentCode('');
    await loadClassData();
  };

  const handleCreateMission = async () => {
    if (!newMission.title || !newMission.dueDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const missionData = {
        class_id: classInfo?.id || classData?.id,
        title: newMission.title,
        description: newMission.description || '',
        due_date: new Date(newMission.dueDate).toISOString(),
        total_points: 100,
        status: 'active'
      };
      
      const mission = await classService.createMission(missionData);
      setMissions([...missions, mission]);
      setShowCreateMission(false);
      setNewMission({ title: '', dueDate: '', description: '' });
      alert(`Mission created successfully!`);
      setStats(prev => ({ ...prev, activeMissions: prev.activeMissions + 1 }));
    } catch (error) {
      console.error('Error creating mission:', error);
      alert('Failed to create mission.');
    }
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    if (window.confirm(`Remove ${studentName} from this class?`)) {
      try {
        await classService.removeStudentFromClass(classInfo?.id || classData?.id, studentId);
        await loadClassData();
        alert(`${studentName} has been removed.`);
      } catch (error) {
        console.error('Error removing student:', error);
        alert('Failed to remove student.');
      }
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      setAnnouncementError('Please enter both a title and message');
      setTimeout(() => setAnnouncementError(''), 3000);
      return;
    }
    
    setSendingAnnouncement(true);
    setAnnouncementError('');
    
    try {
      const classIdToUse = classInfo?.id || classData?.id;
      if (!classIdToUse) {
        throw new Error('Class not found');
      }
      
      const teacherId = localStorage.getItem('userId') || 'teacher_001';
      const teacherName = localStorage.getItem('userName') || classInfo?.teacher_name || 'Teacher';
      
      const announcementData = {
        id: Date.now(),
        class_id: classIdToUse,
        class_name: classInfo?.name || classData?.name,
        teacher_id: teacherId,
        teacher_name: teacherName,
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        created_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('announcements')
        .insert({
          class_id: classIdToUse,
          teacher_id: teacherId,
          teacher_name: teacherName,
          title: announcementData.title,
          message: announcementData.message,
          created_at: announcementData.created_at
        });
      
      if (insertError) {
        const existing = JSON.parse(localStorage.getItem('announcements') || '[]');
        existing.push(announcementData);
        localStorage.setItem('announcements', JSON.stringify(existing));
      }
      
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setShowAnnouncementModal(false);
      setAnnouncementSuccess(`✅ Announcement sent to "${classInfo?.name || classData?.name}"!`);
      setTimeout(() => setAnnouncementSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error sending announcement:', error);
      setAnnouncementError(error.message || 'Failed to send announcement');
      setTimeout(() => setAnnouncementError(''), 4000);
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: null },
    { id: 'students', label: `Students (${stats.totalStudents})`, icon: null },
    { id: 'missions', label: `Missions (${missions.length})`, icon: null },
    { id: 'analytics', label: 'Analytics', icon: null },
    { id: 'announcements', label: 'Announcements', icon: FiBell }
  ];

  const getCurrentTabLabel = () => {
    const tab = tabs.find(t => t.id === activeTab);
    return tab ? tab.label : 'Overview';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading class data...</p>
      </div>
    );
  }

  const displayClass = classInfo || classData;
  if (!displayClass) {
    return (
      <div style={styles.loadingContainer}>
        <p>Class not found</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        {/* Success/Error Toasts */}
        {announcementSuccess && (
          <div style={styles.successToast}>
            <FiCheck size={14} />
            <span>{announcementSuccess}</span>
          </div>
        )}
        
        {announcementError && (
          <div style={styles.errorToast}>
            <FiAlertCircle size={14} />
            <span>{announcementError}</span>
          </div>
        )}

        {/* Announcement Modal */}
        {showAnnouncementModal && (
          <div style={styles.modalOverlay} onClick={() => setShowAnnouncementModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}><FiBell size={16} /> Send Announcement</h3>
                <button onClick={() => setShowAnnouncementModal(false)} style={styles.modalClose}>×</button>
              </div>
              <div style={styles.modalBody}>
                <input 
                  type="text" 
                  placeholder="Announcement Title" 
                  value={announcementTitle} 
                  onChange={(e) => setAnnouncementTitle(e.target.value)} 
                  style={styles.formInput} 
                />
                <textarea 
                  placeholder="Announcement Message" 
                  value={announcementMessage} 
                  onChange={(e) => setAnnouncementMessage(e.target.value)} 
                  rows={4} 
                  style={styles.formTextarea} 
                />
                <div style={styles.classInfoBadge}>
                  <FiUsers size={12} />
                  <span>Sending to: <strong>{displayClass.name}</strong> ({stats.totalStudents} students)</span>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button onClick={() => setShowAnnouncementModal(false)} style={styles.cancelButton}>Cancel</button>
                <button onClick={handleSendAnnouncement} disabled={sendingAnnouncement} style={styles.sendButton}>
                  {sendingAnnouncement ? 'Sending...' : <><FiSend size={12} /> Send</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backButton} onClick={() => navigate('/teacherhub/home')}>
            <FiArrowLeft size={18} />
            <span>Back</span>
          </button>
          <div style={styles.headerActions}>
            <button style={styles.shareButton} onClick={copyToClipboard}>
              {copiedCode ? <FiCheck size={14} /> : <FiCopy size={14} />}
              <span>{copiedCode ? 'Copied!' : `Code: ${displayClass.code}`}</span>
            </button>
            <button style={styles.menuButton}>
              <FiMoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Class Info */}
        <div style={styles.classInfo}>
          <div style={styles.classIcon}>
            <FiBookOpen size={24} color="#2563eb" />
          </div>
          <div style={styles.classDetails}>
            <h1 style={styles.className}>{displayClass.name}</h1>
            <div style={styles.classMeta}>
              <span style={styles.metaItem}><FiUsers size={11} />{stats.totalStudents} Students</span>
              <span style={styles.metaItem}><FiCalendar size={11} />{new Date(displayClass.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Tabs - Dropdown for small screens, normal tabs for larger screens */}
        {isSmallScreen ? (
          <div style={styles.dropdownContainer}>
            <button 
              style={styles.dropdownButton}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{getCurrentTabLabel()}</span>
              <FiChevronDown size={16} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>
            {isDropdownOpen && (
              <div style={styles.dropdownMenu}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    style={{
                      ...styles.dropdownItem,
                      ...(activeTab === tab.id ? styles.dropdownItemActive : {})
                    }}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {tab.icon && <tab.icon size={14} style={{ marginRight: '8px' }} />}
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={styles.tabsWrapper}>
            <div style={styles.tabs}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  style={{ ...styles.tab, ...(activeTab === tab.id ? styles.activeTab : {}) }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}><FiUsers size={18} color="#2563eb" /></div>
                  <div style={styles.statInfo}>
                    <h3 style={styles.statNumber}>{stats.totalStudents}</h3>
                    <p style={styles.statLabel}>Total Students</p>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}><FiTrendingUp size={18} color="#10b981" /></div>
                  <div style={styles.statInfo}>
                    <h3 style={styles.statNumber}>{stats.averageProgress}%</h3>
                    <p style={styles.statLabel}>Avg. Progress</p>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}><FiAward size={18} color="#f59e0b" /></div>
                  <div style={styles.statInfo}>
                    <h3 style={styles.statNumber}>{stats.activeMissions}</h3>
                    <p style={styles.statLabel}>Active Missions</p>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}><FiClock size={18} color="#8b5cf6" /></div>
                  <div style={styles.statInfo}>
                    <h3 style={styles.statNumber}>{stats.completionRate}%</h3>
                    <p style={styles.statLabel}>Completion Rate</p>
                  </div>
                </div>
              </div>

              <div style={styles.recentActivity}>
                <h3 style={styles.sectionTitle}>Recent Activity</h3>
                <div style={styles.activityList}>
                  {students.slice(0, 5).map((student) => (
                    <div key={student.id} style={styles.activityItem}>
                      <FiUserPlus size={12} color="#10b981" />
                      <div style={styles.activityContent}>
                        <p style={styles.activityText}>{student.users?.name || 'Student'} joined the class</p>
                        <span style={styles.activityTime}>{new Date(student.joined_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {students.length === 0 && (
                    <div style={styles.activityItem}>
                      <p style={styles.activityText}>No students have joined yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              <div style={styles.tabHeader}>
                <h3 style={styles.sectionTitle}>Class Students ({students.length})</h3>
                <button style={styles.addButton} onClick={() => setShowAddStudent(true)}>
                  <FiPlus size={14} /> Add Student
                </button>
              </div>

              {showAddStudent && (
                <div style={styles.modalOverlay} onClick={() => setShowAddStudent(false)}>
                  <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <h3 style={styles.modalTitle}>Add Student to Class</h3>
                    <p style={styles.modalText}>Enter the student's email or name:</p>
                    <input
                      type="text"
                      placeholder="Student Email or Name"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      style={styles.modalInput}
                    />
                    <div style={styles.modalButtons}>
                      <button style={styles.modalSubmit} onClick={handleAddStudent}>Add Student</button>
                      <button style={styles.modalCancel} onClick={() => setShowAddStudent(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.studentsGrid}>
                {students.map((enrollment) => (
                  <div key={enrollment.id} style={styles.studentCard}>
                    <div style={styles.studentAvatar}>{enrollment.users?.name?.charAt(0) || 'S'}</div>
                    <div style={styles.studentInfo}>
                      <h4 style={styles.studentName}>{enrollment.users?.name || 'Student'}</h4>
                      <p style={styles.studentEmail}>{enrollment.users?.email}</p>
                      <p style={styles.studentProgress}>Progress: {enrollment.progress || 0}%</p>
                      <p style={styles.studentDate}>Joined: {new Date(enrollment.joined_at).toLocaleDateString()}</p>
                    </div>
                    <button style={styles.removeButton} onClick={() => handleRemoveStudent(enrollment.student_id, enrollment.users?.name)}>
                      <FiTrash2 size={14} color="#ef4444" />
                    </button>
                    <div style={styles.studentProgressBar}>
                      <div style={{ ...styles.progressFill, width: `${enrollment.progress || 0}%` }} />
                    </div>
                  </div>
                ))}
                {students.length === 0 && (
                  <div style={styles.emptyStudents}>
                    <p>No students have joined this class yet.</p>
                    <p>Share the class code: <strong>{displayClass.code}</strong></p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Missions Tab */}
          {activeTab === 'missions' && (
            <div>
              <div style={styles.tabHeader}>
                <h3 style={styles.sectionTitle}>Class Missions</h3>
                <button style={styles.addButton} onClick={() => setShowCreateMission(true)}>
                  <FiPlus size={14} /> Create Mission
                </button>
              </div>

              {showCreateMission && (
                <div style={styles.modalOverlay} onClick={() => setShowCreateMission(false)}>
                  <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <h3 style={styles.modalTitle}>Create New Mission</h3>
                    <input
                      type="text"
                      placeholder="Mission Title *"
                      value={newMission.title}
                      onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                      style={styles.modalInput}
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={newMission.description}
                      onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                      style={{ ...styles.modalInput, minHeight: '70px' }}
                    />
                    <input
                      type="date"
                      value={newMission.dueDate}
                      onChange={(e) => setNewMission({ ...newMission, dueDate: e.target.value })}
                      style={styles.modalInput}
                    />
                    <div style={styles.modalButtons}>
                      <button style={styles.modalSubmit} onClick={handleCreateMission}>Create Mission</button>
                      <button style={styles.modalCancel} onClick={() => setShowCreateMission(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.missionsList}>
                {missions.map((mission) => (
                  <div key={mission.id} style={styles.missionCard}>
                    <div style={styles.missionHeader}>
                      <h4 style={styles.missionTitle}>{mission.title}</h4>
                      <span style={{ ...styles.missionStatus, backgroundColor: mission.status === 'active' ? '#10b981' : '#6b7280' }}>
                        {mission.status}
                      </span>
                    </div>
                    {mission.description && <p style={styles.missionDescription}>{mission.description}</p>}
                    <div style={styles.missionDetails}>
                      <span>Due: {new Date(mission.due_date).toLocaleDateString()}</span>
                      <span>Points: {mission.total_points}</span>
                    </div>
                  </div>
                ))}
                {missions.length === 0 && (
                  <div style={styles.emptyMissions}>
                    <p>No missions created yet.</p>
                    <p>Click "Create Mission" to get started!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <h3 style={styles.sectionTitle}>Class Performance</h3>
              <div style={styles.analyticsGrid}>
                <div style={styles.analyticsCard}>
                  <h4 style={styles.analyticsTitle}>Overall Progress</h4>
                  <div style={styles.bigStat}>{stats.averageProgress}%</div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${stats.averageProgress}%` }} />
                  </div>
                  <p style={styles.analyticsSubtext}>Average progress across all students</p>
                </div>
                <div style={styles.analyticsCard}>
                  <h4 style={styles.analyticsTitle}>Mission Completion</h4>
                  <div style={styles.bigStat}>{stats.completionRate}%</div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${stats.completionRate}%` }} />
                  </div>
                  <p style={styles.analyticsSubtext}>Completed vs total missions</p>
                </div>
                <div style={styles.analyticsCard}>
                  <h4 style={styles.analyticsTitle}>Student Engagement</h4>
                  <div style={styles.bigStat}>{stats.totalStudents}</div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${Math.min(100, (stats.totalStudents / 30) * 100)}%` }} />
                  </div>
                  <p style={styles.analyticsSubtext}>Total students enrolled</p>
                </div>
              </div>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div>
              <div style={styles.announcementContainer}>
                <div style={styles.announcementHeader}>
                  <FiBell size={28} color="#2563eb" />
                  <h3 style={styles.sectionTitle}>Send Announcement</h3>
                </div>
                <p style={styles.announcementSubtext}>
                  Send important updates, reminders, or motivational messages to all students in {displayClass.name}.
                </p>
                
                <div style={styles.announcementForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Announcement Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Mission Update, Reminder, Congratulations!"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      style={styles.formInput}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Message</label>
                    <textarea
                      placeholder="Write your announcement message here..."
                      value={announcementMessage}
                      onChange={(e) => setAnnouncementMessage(e.target.value)}
                      rows={5}
                      style={styles.formTextarea}
                    />
                  </div>
                  
                  <div style={styles.classInfoBadgeLarge}>
                    <FiUsers size={16} />
                    <span>This announcement will be sent to <strong>{stats.totalStudents}</strong> student(s) in <strong>{displayClass.name}</strong></span>
                  </div>
                  
                  <button 
                    onClick={handleSendAnnouncement} 
                    disabled={sendingAnnouncement}
                    style={styles.sendAnnouncementButton}
                  >
                    {sendingAnnouncement ? (
                      'Sending...'
                    ) : (
                      <>
                        <FiSend size={16} />
                        Send Announcement to Class
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    margin: 0,
    padding: 0,
    overflowX: 'hidden',
  },
  contentWrapper: {
    maxWidth: '100%',
    margin: '0 auto',
    padding: '12px',
    width: '100%',
    boxSizing: 'border-box',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    gap: '16px',
    backgroundColor: '#f9fafb',
    padding: '20px',
    textAlign: 'center',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '10px',
    flexWrap: 'wrap',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  shareButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  menuButton: {
    padding: '8px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  classIcon: {
    width: '48px',
    height: '48px',
    backgroundColor: '#eff6ff',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  classDetails: {
    flex: 1,
    minWidth: 0,
  },
  className: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '6px',
    wordBreak: 'break-word',
  },
  classMeta: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '500',
  },
  // Dropdown styles for small screens
  dropdownContainer: {
    position: 'relative',
    marginBottom: '20px',
    width: '100%',
  },
  dropdownButton: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    transition: 'all 0.2s ease',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownItem: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontWeight: '600',
  },
  // Normal tabs for larger screens
  tabsWrapper: {
    overflowX: 'auto',
    marginBottom: '20px',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin',
  },
  tabs: {
    display: 'flex',
    gap: '2px',
    borderBottom: '2px solid #e5e7eb',
    minWidth: 'min-content',
  },
  tab: {
    padding: '10px 14px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
  },
  activeTab: {
    color: '#2563eb',
    borderBottom: '2px solid #2563eb',
    marginBottom: '-2px',
  },
  tabContent: {
    marginTop: '16px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: '#eff6ff',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statInfo: {
    flex: 1,
    minWidth: 0,
  },
  statNumber: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '2px',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '16px',
  },
  recentActivity: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
  },
  activityText: {
    fontSize: '13px',
    color: '#1f2937',
    marginBottom: '2px',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: '10px',
    color: '#9ca3af',
  },
  tabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  studentsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    position: 'relative',
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
    minWidth: 0,
  },
  studentName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  studentEmail: {
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '4px',
    wordBreak: 'break-all',
  },
  studentProgress: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  studentDate: {
    fontSize: '10px',
    color: '#9ca3af',
    marginTop: '2px',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    flexShrink: 0,
  },
  studentProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: '#e5e7eb',
    borderRadius: '0 0 12px 12px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    transition: 'width 0.3s ease',
  },
  missionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  missionCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  missionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    gap: '8px',
    flexWrap: 'wrap',
  },
  missionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
  },
  missionDescription: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '10px',
    lineHeight: 1.4,
  },
  missionStatus: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  missionDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '500',
  },
  analyticsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  analyticsCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  analyticsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '10px',
  },
  bigStat: {
    fontSize: '40px',
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: '12px',
  },
  analyticsSubtext: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '8px',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  emptyStudents: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    color: '#6b7280',
  },
  emptyMissions: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    color: '#6b7280',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    maxHeight: '85vh',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: 0,
    lineHeight: 1,
  },
  modalBody: {
    padding: '16px',
    overflowY: 'auto',
    maxHeight: 'calc(85vh - 120px)',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    width: '100%',
    maxWidth: '360px',
  },
  modalText: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  modalInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    marginBottom: '16px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
  },
  modalSubmit: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
  },
  modalCancel: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
  },
  announcementContainer: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  announcementHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  announcementSubtext: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '20px',
    lineHeight: 1.5,
  },
  announcementForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  formTextarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  classInfoBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    fontSize: '11px',
    color: '#1e40af',
    marginTop: '8px',
  },
  classInfoBadgeLarge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    backgroundColor: '#f0fdf4',
    borderRadius: '10px',
    fontSize: '12px',
    color: '#166534',
    border: '1px solid #bbf7d0',
  },
  sendAnnouncementButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '4px',
  },
  sendButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  cancelButton: {
    padding: '8px 14px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  successToast: {
    position: 'fixed',
    bottom: '16px',
    left: '16px',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '10px',
    fontSize: '12px',
    zIndex: 2000,
    textAlign: 'center',
    animation: 'slideInRight 0.3s ease',
  },
  errorToast: {
    position: 'fixed',
    bottom: '16px',
    left: '16px',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '10px',
    fontSize: '12px',
    zIndex: 2000,
    textAlign: 'center',
    animation: 'slideInRight 0.3s ease',
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  input:focus, textarea:focus {
    border-color: #2563eb;
    outline: none;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }
  button:hover {
    opacity: 0.9;
  }
  button:active {
    transform: scale(0.98);
  }
`;
document.head.appendChild(styleSheet);

export default Classes;