import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  FiUsers, FiBookOpen, FiTrendingUp, FiAward, 
  FiClock, FiCalendar, FiPlus, FiCopy, FiCheck,
  FiArrowLeft, FiMoreVertical, FiTrash2,
  FiUserPlus
} from 'react-icons/fi';
import { classService } from '../services/classService';

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
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageProgress: 0,
    activeMissions: 0,
    completionRate: 0
  });

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
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backButton} onClick={() => navigate('/teacherhub/home')}>
            <FiArrowLeft size={20} />
            Back to Classes
          </button>
          <div style={styles.headerActions}>
            <button style={styles.shareButton} onClick={copyToClipboard}>
              {copiedCode ? <FiCheck size={18} /> : <FiCopy size={18} />}
              <span>{copiedCode ? 'Copied!' : `Share Code: ${displayClass.code}`}</span>
            </button>
            <button style={styles.menuButton}>
              <FiMoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Class Info */}
        <div style={styles.classInfo}>
          <div style={styles.classIcon}>
            <FiBookOpen size={32} color="#2563eb" />
          </div>
          <div style={styles.classDetails}>
            <h1 style={styles.className}>{displayClass.name}</h1>
            <div style={styles.classMeta}>
              <span style={styles.metaItem}><FiUsers size={14} />{stats.totalStudents} Students</span>
              <span style={styles.metaItem}><FiCalendar size={14} />Created: {new Date(displayClass.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {['overview', 'students', 'missions', 'analytics'].map((tab) => (
            <button
              key={tab}
              style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'students' && ` (${stats.totalStudents})`}
              {tab === 'missions' && ` (${missions.length})`}
            </button>
          ))}
        </div>

        {/* Tab Content - No scrollbar */}
        <div style={styles.tabContent}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
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
                    <p style={styles.statLabel}>Avg. Progress</p>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}><FiAward size={24} color="#f59e0b" /></div>
                  <div style={styles.statInfo}>
                    <h3 style={styles.statNumber}>{stats.activeMissions}</h3>
                    <p style={styles.statLabel}>Active Missions</p>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}><FiClock size={24} color="#8b5cf6" /></div>
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
                      <FiUserPlus size={16} color="#10b981" />
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
                  <FiPlus size={16} /> Add Student
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
                      <FiTrash2 size={16} color="#ef4444" />
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
                  <FiPlus size={16} /> Create Mission
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
                      style={{ ...styles.modalInput, minHeight: '80px' }}
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px',
    width: '100%',
    boxSizing: 'border-box',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    gap: '20px',
    backgroundColor: '#f9fafb',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
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
  menuButton: {
    padding: '10px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '32px',
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
    fontSize: '32px',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '10px',
  },
  classMeta: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '28px',
    borderBottom: '2px solid #e5e7eb',
  },
  tab: {
    padding: '14px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
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
    overflow: 'visible',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
    marginBottom: '36px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statIcon: {
    width: '56px',
    height: '56px',
    backgroundColor: '#eff6ff',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '6px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '24px',
  },
  recentActivity: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px',
    borderBottom: '1px solid #f3f4f6',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: '14px',
    color: '#1f2937',
    marginBottom: '4px',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  tabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  addButton: {
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
  studentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '20px',
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    position: 'relative',
  },
  studentAvatar: {
    width: '52px',
    height: '52px',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: '700',
    flexShrink: 0,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  studentEmail: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '6px',
  },
  studentProgress: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500',
  },
  studentDate: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '4px',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    position: 'absolute',
    top: '14px',
    right: '14px',
  },
  studentProgressBar: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '0 0 14px 14px',
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
    gap: '18px',
  },
  missionCard: {
    backgroundColor: 'white',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  missionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  missionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
  },
  missionDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '14px',
  },
  missionStatus: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  missionDetails: {
    display: 'flex',
    gap: '20px',
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500',
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
  },
  analyticsCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '28px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  analyticsTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '18px',
  },
  bigStat: {
    fontSize: '54px',
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: '18px',
  },
  analyticsSubtext: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '14px',
  },
  progressBar: {
    height: '10px',
    backgroundColor: '#e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  emptyStudents: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
    color: '#6b7280',
  },
  emptyMissions: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
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
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '36px',
    width: '90%',
    maxWidth: '520px',
  },
  modalTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '18px',
  },
  modalText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '18px',
  },
  modalInput: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    marginBottom: '24px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalButtons: {
    display: 'flex',
    gap: '14px',
  },
  modalSubmit: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  modalCancel: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Classes;