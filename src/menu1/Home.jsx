import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { FiPlus, FiBookOpen, FiUsers, FiCopy, FiCheck, FiTrash2, FiArrowLeft, FiX, FiCheckCircle } from 'react-icons/fi';
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
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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
      showToast('Failed to load classes. Please refresh the page.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.dbId) {
      loadClasses();
    }
  }, [user?.dbId]);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

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
      showToast('Please enter a class name', 'error');
      return;
    }
    
    if (!user?.dbId) {
      showToast('User not authenticated. Please sign in again.', 'error');
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
      
      showToast(`Class "${className}" created successfully! Code: ${newClassCode}`, 'success');
      setShowCreateClass(false);
      setClassName('');
      setClassCode('');
    } catch (error) {
      console.error('Error creating class:', error);
      showToast('Failed to create class. Please try again.', 'error');
    }
  };

  // Handle delete class click - Show modal instead of confirm
  const handleDeleteClick = (classItem, event) => {
    event.stopPropagation();
    setClassToDelete(classItem);
    setShowDeleteModal(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    
    setIsDeleting(true);
    try {
      await classService.deleteClass(classToDelete.id);
      
      // Remove from local state
      const updatedClasses = classes.filter(c => c.id !== classToDelete.id);
      setClasses(updatedClasses);
      
      // Dispatch event to notify other components
      const event = new CustomEvent('classDeleted', { 
        detail: { classId: classToDelete.id, timestamp: Date.now() }
      });
      window.dispatchEvent(event);
      
      // Show success toast
      showToast(`Class "${classToDelete.name}" deleted successfully!`, 'success');
      
      setShowDeleteModal(false);
      setClassToDelete(null);
    } catch (error) {
      console.error('Error deleting class:', error);
      showToast('Failed to delete class. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setClassToDelete(null);
    setIsDeleting(false);
  };

  const copyToClipboard = (code, event) => {
    event.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Class code "${code}" copied to clipboard!`, 'success');
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
      {/* Toast Notification */}
      {toast.show && (
        <div style={{...styles.toast, ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess)}}>
          <FiCheckCircle size={20} />
          <span style={styles.toastMessage}>{toast.message}</span>
        </div>
      )}

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
                <div style={styles.formHeader}>
                  <h3 style={styles.formTitle}>Create a New Class</h3>
                  <button 
                    style={styles.formCloseButton}
                    onClick={() => {
                      setShowCreateClass(false);
                      setClassName('');
                      setClassCode('');
                    }}
                  >
                    <FiX size={20} />
                  </button>
                </div>
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
                        onClick={(e) => handleDeleteClick(classItem, e)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && classToDelete && (
        <div style={styles.modalOverlay} onClick={handleCancelDelete}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Delete Class</h2>
              <button style={styles.modalClose} onClick={handleCancelDelete}>
                <FiX size={20} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.warningIcon}>⚠️</div>
              <h3 style={styles.warningTitle}>Are you sure?</h3>
              <p style={styles.warningText}>
                You are about to delete <strong>"{classToDelete.name}"</strong>
              </p>
              <p style={styles.warningDescription}>
                This action cannot be undone. All students, missions, and data associated with this class will be permanently deleted.
              </p>
              <div style={styles.classPreviewBox}>
                <div style={styles.previewIcon}>📚</div>
                <div style={styles.previewInfo}>
                  <div style={styles.previewName}>{classToDelete.name}</div>
                  <div style={styles.previewCode}>Code: {classToDelete.code}</div>
                  <div style={styles.previewStudents}>
                    <FiUsers size={12} /> {classToDelete.students_count || 0} Students
                  </div>
                </div>
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button 
                style={styles.cancelButton} 
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                style={styles.deleteConfirmButton}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Class'}
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
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '0',
    margin: '0',
    position: 'relative',
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
  // Toast Notification Styles
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    zIndex: 2000,
    animation: 'slideInRight 0.3s ease',
    backdropFilter: 'blur(10px)',
  },
  toastSuccess: {
    backgroundColor: '#10b981',
    color: 'white',
  },
  toastError: {
    backgroundColor: '#ef4444',
    color: 'white',
  },
  toastMessage: {
    fontSize: '14px',
    fontWeight: '500',
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
  },
  createClassForm: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    animation: 'fadeIn 0.3s ease',
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  formCloseButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    color: '#9ca3af',
    transition: 'all 0.2s',
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
    transition: 'border-color 0.2s',
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
    transition: 'border-color 0.2s',
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
  },
  formButtons: {
    display: 'flex',
    gap: '12px',
  },
  submitButton: {
    flex: 1,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
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
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
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
    animation: 'fadeIn 0.3s ease',
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
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    color: '#9ca3af',
    transition: 'all 0.2s',
  },
  modalBody: {
    padding: '24px',
    textAlign: 'center',
  },
  warningIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  warningTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '12px',
  },
  warningText: {
    fontSize: '16px',
    color: '#374151',
    marginBottom: '8px',
  },
  warningDescription: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '20px',
    lineHeight: 1.5,
  },
  classPreviewBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  previewIcon: {
    fontSize: '32px',
  },
  previewInfo: {
    flex: 1,
    textAlign: 'left',
  },
  previewName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  previewCode: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  previewStudents: {
    fontSize: '11px',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  deleteConfirmButton: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'transform 0.2s',
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
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .createClassButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
  
  .classCard:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  }
  
  .deleteButton:hover {
    background-color: #fee2e2;
  }
  
  .copyButton:hover {
    background-color: #e5e7eb;
  }
  
  .submitButton:hover {
    opacity: 0.9;
  }
  
  .cancelButton:hover {
    background-color: #e5e7eb;
  }
  
  .generateButton:hover {
    background-color: #e5e7eb;
  }
  
  .generateCodeButton:hover {
    background-color: #e5e7eb;
  }
  
  .formCloseButton:hover {
    background-color: #f3f4f6;
    color: #ef4444;
  }
  
  .modalClose:hover {
    background-color: #f3f4f6;
    color: #ef4444;
  }
  
  .deleteConfirmButton:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  .input:focus, .codeInput:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;
document.head.appendChild(styleSheet);

export default Home;