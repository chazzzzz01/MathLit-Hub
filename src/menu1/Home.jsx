import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { FiPlus, FiBookOpen, FiUsers, FiCopy, FiCheck, FiTrash2 } from 'react-icons/fi';
import { classService } from '../services/classService';

function Home() {
  const { user, userData } = useOutletContext();
  const navigate = useNavigate();
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [classes, setClasses] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load classes from Supabase
  const loadClasses = async () => {
    if (!user?.dbId) return;
    
    try {
      setLoading(true);
      const teacherClasses = await classService.getTeacherClasses(user.dbId);
      setClasses(teacherClasses);
      console.log('Loaded classes from Supabase:', teacherClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
      alert('Failed to load classes. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.dbId) {
      loadClasses();
    }
  }, [user?.dbId]);

  // Generate a random class code
  const generateClassCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const handleCreateClass = async () => {
    if (!className.trim()) {
      alert('Please enter a class name');
      return;
    }
    
    if (!user?.dbId) {
      alert('User not authenticated. Please sign in again.');
      return;
    }
    
    try {
      const newClassCode = classCode || generateClassCode();
      
      // Create class in Supabase
      const newClass = await classService.createClass(
        {
          name: className,
          code: newClassCode
        },
        user.dbId
      );
      
      // Update local state
      setClasses([newClass, ...classes]);
      
      alert(`Class "${className}" created successfully!\n\nClass Code: ${newClassCode}\n\nShare this code with students to join.`);
      setShowCreateClass(false);
      setClassName('');
      setClassCode('');
    } catch (error) {
      console.error('Error creating class:', error);
      alert('Failed to create class. Please try again.');
    }
  };

  const handleDeleteClass = async (classId, event) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      try {
        await classService.deleteClass(classId);
        const updatedClasses = classes.filter(c => c.id !== classId);
        setClasses(updatedClasses);
        alert('Class deleted successfully!');
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Failed to delete class. Please try again.');
      }
    }
  };

  const copyToClipboard = (code, event) => {
    event.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleClassClick = (classItem) => {
    navigate(`/teacherhub/classes/${classItem.id}`, { 
      state: { classData: classItem } 
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading your classes...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        {/* Welcome Header */}
        <div style={styles.welcomeHeader}>
          <h1 style={styles.welcomeTitle}>
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'Teacher'}! 👋
          </h1>
          <p style={styles.welcomeSubtitle}>
            Create classes and share the code with your students.
          </p>
        </div>

        {/* Create Class Section - Centered */}
        <div style={styles.createClassSection}>
          <div style={styles.createClassContainer}>
            {!showCreateClass ? (
              <button 
                style={styles.createClassButton}
                onClick={() => setShowCreateClass(true)}
              >
                <FiPlus size={28} />
                <span>Create New Class</span>
              </button>
            ) : (
              <div style={styles.createClassForm}>
                <h3 style={styles.formTitle}>Create a New Class</h3>
                <input
                  type="text"
                  placeholder="Class Name *"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  style={styles.input}
                  autoFocus
                />
                <div style={styles.codeInputContainer}>
                  <input
                    type="text"
                    placeholder="Class Code (optional)"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    style={styles.codeInput}
                    maxLength="10"
                  />
                  {classCode && (
                    <button 
                      style={styles.generateButton}
                      onClick={() => setClassCode(generateClassCode())}
                    >
                      Generate
                    </button>
                  )}
                </div>
                {!classCode && (
                  <button 
                    style={styles.generateCodeButton}
                    onClick={() => setClassCode(generateClassCode())}
                  >
                    Generate Random Code
                  </button>
                )}
                <div style={styles.formButtons}>
                  <button 
                    style={styles.submitButton}
                    onClick={handleCreateClass}
                  >
                    Create Class
                  </button>
                  <button 
                    style={styles.cancelButton}
                    onClick={() => {
                      setShowCreateClass(false);
                      setClassName('');
                      setClassCode('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* My Classes Section */}
        {classes.length > 0 && (
          <div style={styles.classesSection}>
            <h2 style={styles.sectionTitle}>My Classes ({classes.length})</h2>
            <div style={styles.classesGrid}>
              {classes.map((classItem) => (
                <div 
                  key={classItem.id} 
                  style={styles.classCard}
                  onClick={() => handleClassClick(classItem)}
                >
                  <div style={styles.classIcon}>
                    <FiBookOpen size={24} color="#2563eb" />
                  </div>
                  <div style={styles.classInfo}>
                    <div style={styles.classHeader}>
                      <h3 style={styles.className}>{classItem.name}</h3>
                      <button 
                        style={styles.deleteButton}
                        onClick={(e) => handleDeleteClass(classItem.id, e)}
                        title="Delete class"
                      >
                        <FiTrash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                    <div style={styles.classCodeContainer}>
                      <span style={styles.classCodeLabel}>Class Code:</span>
                      <code style={styles.classCode}>{classItem.code}</code>
                      <button 
                        style={styles.copyButton}
                        onClick={(e) => copyToClipboard(classItem.code, e)}
                        title="Copy to clipboard"
                      >
                        {copiedCode === classItem.code ? <FiCheck size={16} color="#10b981" /> : <FiCopy size={16} color="#6b7280" />}
                      </button>
                    </div>
                    <div style={styles.classStats}>
                      <span style={styles.classStat}>
                        <FiUsers size={14} />
                        {classItem.students_count || 0} Students
                      </span>
                      <span style={styles.classStat}>
                        📅 {new Date(classItem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {classes.length === 0 && !showCreateClass && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📚</div>
            <h3 style={styles.emptyTitle}>No Classes Yet</h3>
            <p style={styles.emptyText}>Click the button above to create your first class</p>
            <p style={styles.emptySubtext}>Students will need the class code to join</p>
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
    backgroundColor: '#f9fafb',
    padding: '0',
    margin: '0',
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
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  welcomeHeader: {
    marginBottom: '48px',
    textAlign: 'center',
  },
  welcomeTitle: {
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
  },
  welcomeSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
  },
  createClassSection: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '48px',
  },
  createClassContainer: {
    width: '100%',
    maxWidth: '500px',
  },
  createClassButton: {
    width: '100%',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '20px 32px',
    borderRadius: '16px',
    fontSize: '20px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    ':hover': {
      backgroundColor: '#1d4ed8',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(37,99,235,0.3)',
    },
  },
  createClassForm: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '24px',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '16px',
    outline: 'none',
    boxSizing: 'border-box',
    ':focus': {
      borderColor: '#2563eb',
    },
  },
  codeInputContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  codeInput: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    textTransform: 'uppercase',
    ':focus': {
      borderColor: '#2563eb',
    },
  },
  generateButton: {
    padding: '12px 20px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#e5e7eb',
    },
  },
  generateCodeButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginBottom: '24px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#e5e7eb',
    },
  },
  formButtons: {
    display: 'flex',
    gap: '12px',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#1d4ed8',
    },
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#e5e7eb',
    },
  },
  classesSection: {
    marginTop: '48px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '24px',
  },
  classesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  classCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    position: 'relative',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  },
  classIcon: {
    width: '48px',
    height: '48px',
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
    ':hover': {
      backgroundColor: '#fee2e2',
    },
  },
  classCodeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    padding: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
  },
  classCodeLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  classCode: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#2563eb',
    fontFamily: 'monospace',
    letterSpacing: '1px',
  },
  copyButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#e5e7eb',
    },
  },
  classStats: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  classStat: {
    fontSize: '13px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '16px',
    marginTop: '48px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#9ca3af',
  },
};

// Add global animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);

export default Home;