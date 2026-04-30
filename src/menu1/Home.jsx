// src/menu/Home.jsx - FULLY RESPONSIVE (optimized for 308x748 and all screen sizes)
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
  const [classDescription, setClassDescription] = useState('');
  const [classes, setClasses] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const loadClasses = async () => {
    if (!user?.dbId) return;
    try {
      setLoading(true);
      const teacherClasses = await classService.getTeacherClasses(user.dbId);
      setClasses(teacherClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
      showToast('Failed to load classes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.dbId) loadClasses();
  }, [user?.dbId]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const generateClassCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += characters.charAt(Math.floor(Math.random() * characters.length));
    return code;
  };

  const handleCreateClass = async () => {
    if (!className.trim()) { showToast('Please enter a class name', 'error'); return; }
    if (!user?.dbId) { showToast('Please sign in again.', 'error'); return; }
    try {
      const newClassCode = classCode || generateClassCode();
      const classData = { name: className.trim(), code: newClassCode.toUpperCase() };
      const newClass = await classService.createClass(classData, user.dbId);
      setClasses([newClass, ...classes]);
      showToast(`Class "${className}" created! Code: ${newClassCode}`, 'success');
      setShowCreateClass(false);
      setClassName('');
      setClassCode('');
      setClassDescription('');
    } catch (error) {
      console.error('Error creating class:', error);
      showToast(error.message || 'Failed to create class.', 'error');
    }
  };

  const handleDeleteClick = (classItem, event) => {
    event.stopPropagation();
    setClassToDelete(classItem);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    setIsDeleting(true);
    try {
      await classService.deleteClass(classToDelete.id);
      const updatedClasses = classes.filter(c => c.id !== classToDelete.id);
      setClasses(updatedClasses);
      window.dispatchEvent(new CustomEvent('classDeleted', { detail: { classId: classToDelete.id, timestamp: Date.now() } }));
      showToast(`Class "${classToDelete.name}" deleted!`, 'success');
      setShowDeleteModal(false);
      setClassToDelete(null);
    } catch (error) {
      console.error('Error deleting class:', error);
      showToast('Failed to delete class.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setClassToDelete(null);
    setIsDeleting(false);
  };

  const copyToClipboard = (code, event) => {
    event.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Code "${code}" copied!`, 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleClassClick = (classItem) => {
    navigate(`/teacherhub/classes/${classItem.id}`, { state: { classData: classItem } });
  };

  if (loading) {
    return (<div style={styles.loadingContainer}><div style={styles.loadingSpinner}></div><p>Loading your classes...</p></div>);
  }

  return (
    <div style={styles.container}>
      {toast.show && (<div style={{...styles.toast, ...(toast.type === 'error' ? styles.toastError : styles.toastSuccess)}}><FiCheckCircle size={16} /><span style={styles.toastMessage}>{toast.message}</span></div>)}

      <div style={styles.contentWrapper}>
        <div style={styles.welcomeHeader}><h1 style={styles.welcomeTitle}>Welcome, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Teacher'}! 👋</h1><p style={styles.welcomeSubtitle}>Create classes and share the code with your students.</p></div>

        <div style={styles.createClassSection}><div style={styles.createClassContainer}>{!showCreateClass ? (<button style={styles.createClassButton} onClick={() => setShowCreateClass(true)}><FiPlus size={24} /><span>Create New Class</span></button>) : (<div style={styles.createClassForm}><div style={styles.formHeader}><h3 style={styles.formTitle}>Create Class</h3><button style={styles.formCloseButton} onClick={() => { setShowCreateClass(false); setClassName(''); setClassCode(''); setClassDescription(''); }}><FiX size={18} /></button></div><input type="text" placeholder="Class Name *" value={className} onChange={(e) => setClassName(e.target.value)} style={styles.input} autoFocus /><div style={styles.codeInputContainer}><input type="text" placeholder="Class Code (optional)" value={classCode} onChange={(e) => setClassCode(e.target.value.toUpperCase())} style={styles.codeInput} maxLength="10" />{classCode && (<button style={styles.generateButton} onClick={() => setClassCode(generateClassCode())}>Generate</button>)}</div>{!classCode && (<button style={styles.generateCodeButton} onClick={() => setClassCode(generateClassCode())}>Generate Random Code</button>)}<div style={styles.formButtons}><button style={styles.submitButton} onClick={handleCreateClass}>Create</button><button style={styles.cancelButton} onClick={() => { setShowCreateClass(false); setClassName(''); setClassCode(''); setClassDescription(''); }}>Cancel</button></div></div>)}</div></div>

        {classes.length > 0 && (<div style={styles.classesSection}><h2 style={styles.sectionTitle}>My Classes ({classes.length})</h2><div style={styles.classesGrid}>{classes.map((classItem) => (<div key={classItem.id} style={styles.classCard} onClick={() => handleClassClick(classItem)}><div style={styles.classIcon}><FiBookOpen size={20} color="#2563eb" /></div><div style={styles.classInfo}><div style={styles.classHeader}><h3 style={styles.className}>{classItem.name}</h3><button style={styles.deleteButton} onClick={(e) => handleDeleteClick(classItem, e)}><FiTrash2 size={14} color="#ef4444" /></button></div><div style={styles.classCodeContainer}><span style={styles.classCodeLabel}>Code:</span><code style={styles.classCode}>{classItem.code}</code><button style={styles.copyButton} onClick={(e) => copyToClipboard(classItem.code, e)}>{copiedCode === classItem.code ? <FiCheck size={14} color="#10b981" /> : <FiCopy size={14} color="#6b7280" />}</button></div><div style={styles.classStats}><span style={styles.classStat}><FiUsers size={12} /> {classItem.students_count || 0} Students</span><span style={styles.classStat}>📅 {new Date(classItem.created_at).toLocaleDateString()}</span></div></div></div>))}</div></div>)}

        {classes.length === 0 && !showCreateClass && (<div style={styles.emptyState}><div style={styles.emptyIcon}>📚</div><h3 style={styles.emptyTitle}>No Classes Yet</h3><p style={styles.emptyText}>Click above to create your first class</p><p style={styles.emptySubtext}>Students will need the class code to join</p></div>)}
      </div>

      {showDeleteModal && classToDelete && (<div style={styles.modalOverlay} onClick={handleCancelDelete}><div style={styles.modalContent} onClick={(e) => e.stopPropagation()}><div style={styles.modalHeader}><h2 style={styles.modalTitle}>Delete Class</h2><button style={styles.modalClose} onClick={handleCancelDelete}><FiX size={18} /></button></div><div style={styles.modalBody}><div style={styles.warningIcon}>⚠️</div><h3 style={styles.warningTitle}>Are you sure?</h3><p style={styles.warningText}>Delete <strong>"{classToDelete.name}"</strong>?</p><p style={styles.warningDescription}>This cannot be undone. All data will be permanently deleted.</p><div style={styles.classPreviewBox}><div style={styles.previewIcon}>📚</div><div style={styles.previewInfo}><div style={styles.previewName}>{classToDelete.name}</div><div style={styles.previewCode}>Code: {classToDelete.code}</div><div style={styles.previewStudents}><FiUsers size={10} /> {classToDelete.students_count || 0} Students</div></div></div></div><div style={styles.modalFooter}><button style={styles.cancelButtonModal} onClick={handleCancelDelete} disabled={isDeleting}>Cancel</button><button style={styles.deleteConfirmButton} onClick={handleConfirmDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</button></div></div></div>)}
    </div>
  );
}

const styles = {
  container: { width: '100%', minHeight: '100vh', backgroundColor: '#f9fafb', padding: '0', margin: '0', position: 'relative' },
  contentWrapper: { maxWidth: '1200px', margin: '0 auto', padding: '20px 16px', width: '100%', boxSizing: 'border-box', '@media (min-width: 769px)': { padding: '40px 24px' } },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '16px', backgroundColor: '#f9fafb', padding: '16px' },
  loadingSpinner: { width: '36px', height: '36px', border: '3px solid #f3f4f6', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', '@media (min-width: 769px)': { width: '40px', height: '40px', borderWidth: '4px' } },
  toast: { position: 'fixed', top: '12px', right: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 2000, animation: 'slideInRight 0.3s ease', '@media (min-width: 481px)': { top: '20px', right: '20px', left: 'auto', padding: '12px 20px' } },
  toastSuccess: { backgroundColor: '#10b981', color: 'white' },
  toastError: { backgroundColor: '#ef4444', color: 'white' },
  toastMessage: { fontSize: '12px', fontWeight: '500', '@media (min-width: 769px)': { fontSize: '14px' } },
  welcomeHeader: { marginBottom: '24px', textAlign: 'center', '@media (min-width: 769px)': { marginBottom: '48px' } },
  welcomeTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '6px', '@media (min-width: 769px)': { fontSize: '32px', marginBottom: '8px' } },
  welcomeSubtitle: { fontSize: '12px', color: '#6b7280', '@media (min-width: 769px)': { fontSize: '16px' } },
  createClassSection: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px', '@media (min-width: 769px)': { marginBottom: '48px' } },
  createClassContainer: { width: '100%', maxWidth: '500px' },
  createClassButton: { width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '14px 20px', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', minHeight: '52px', '@media (min-width: 769px)': { padding: '20px 32px', fontSize: '20px', gap: '12px' } },
  createClassForm: { backgroundColor: 'white', padding: '20px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', animation: 'fadeIn 0.3s ease', '@media (min-width: 769px)': { padding: '32px', borderRadius: '16px' } },
  formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  formTitle: { fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0, '@media (min-width: 769px)': { fontSize: '24px' } },
  formCloseButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: '#9ca3af', minWidth: '32px', minHeight: '32px' },
  input: { width: '100%', padding: '10px 14px', fontSize: '14px', border: '2px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px', outline: 'none', boxSizing: 'border-box', '@media (min-width: 769px)': { padding: '12px 16px', fontSize: '16px', marginBottom: '16px' } },
  codeInputContainer: { display: 'flex', gap: '8px', marginBottom: '10px' },
  codeInput: { flex: 1, padding: '10px 14px', fontSize: '14px', border: '2px solid #e5e7eb', borderRadius: '8px', outline: 'none', textTransform: 'uppercase', '@media (min-width: 769px)': { padding: '12px 16px', fontSize: '16px' } },
  generateButton: { padding: '10px 16px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', minWidth: '70px', '@media (min-width: 769px)': { padding: '12px 20px', fontSize: '14px' } },
  generateCodeButton: { width: '100%', padding: '8px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', marginBottom: '16px', '@media (min-width: 769px)': { padding: '10px', fontSize: '14px', marginBottom: '24px' } },
  formButtons: { display: 'flex', gap: '10px' },
  submitButton: { flex: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '40px', '@media (min-width: 769px)': { padding: '12px', fontSize: '16px' } },
  cancelButton: { flex: 1, backgroundColor: '#f3f4f6', color: '#6b7280', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', minHeight: '40px', '@media (min-width: 769px)': { padding: '12px', fontSize: '16px' } },
  cancelButtonModal: { padding: '8px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', minHeight: '38px', '@media (min-width: 769px)': { padding: '10px 24px', fontSize: '14px' } },
  classesSection: { marginTop: '24px', '@media (min-width: 769px)': { marginTop: '48px' } },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', '@media (min-width: 769px)': { fontSize: '24px', marginBottom: '24px' } },
  classesGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '12px', '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }, '@media (min-width: 769px)': { gap: '20px' } },
  classCard: { backgroundColor: 'white', borderRadius: '12px', padding: '14px', display: 'flex', gap: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', '@media (min-width: 769px)': { padding: '20px', gap: '16px' } },
  classIcon: { width: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, '@media (min-width: 769px)': { width: '48px', height: '48px', borderRadius: '12px' } },
  classInfo: { flex: 1, minWidth: 0 },
  classHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' },
  className: { fontSize: '15px', fontWeight: '600', color: '#1f2937', margin: 0, wordBreak: 'break-word', '@media (min-width: 769px)': { fontSize: '18px' } },
  deleteButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', minWidth: '32px', minHeight: '32px' },
  classCodeContainer: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', padding: '6px 8px', backgroundColor: '#f9fafb', borderRadius: '6px', flexWrap: 'wrap' },
  classCodeLabel: { fontSize: '10px', color: '#6b7280', fontWeight: '500', '@media (min-width: 769px)': { fontSize: '12px' } },
  classCode: { fontSize: '13px', fontWeight: '700', color: '#2563eb', fontFamily: 'monospace', letterSpacing: '0.5px', wordBreak: 'break-all', '@media (min-width: 769px)': { fontSize: '16px', letterSpacing: '1px' } },
  copyButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', minWidth: '28px', minHeight: '28px' },
  classStats: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  classStat: { fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '3px', '@media (min-width: 769px)': { fontSize: '13px', gap: '4px' } },
  emptyState: { textAlign: 'center', padding: '40px 16px', backgroundColor: 'white', borderRadius: '14px', marginTop: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', '@media (min-width: 769px)': { padding: '60px 20px', marginTop: '48px', borderRadius: '16px' } },
  emptyIcon: { fontSize: '48px', marginBottom: '12px', '@media (min-width: 769px)': { fontSize: '64px', marginBottom: '16px' } },
  emptyTitle: { fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '6px', '@media (min-width: 769px)': { fontSize: '20px', marginBottom: '8px' } },
  emptyText: { fontSize: '13px', color: '#6b7280', marginBottom: '6px', '@media (min-width: 769px)': { fontSize: '16px', marginBottom: '8px' } },
  emptySubtext: { fontSize: '11px', color: '#9ca3af', '@media (min-width: 769px)': { fontSize: '14px' } },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' },
  modalContent: { backgroundColor: 'white', borderRadius: '16px', maxWidth: '400px', width: '100%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'fadeIn 0.3s ease', '@media (min-width: 769px)': { maxWidth: '450px', borderRadius: '20px' } },
  modalHeader: { padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', '@media (min-width: 769px)': { padding: '20px 24px' } },
  modalTitle: { fontSize: '16px', fontWeight: '700', color: '#1f2937', margin: 0, '@media (min-width: 769px)': { fontSize: '20px' } },
  modalClose: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', color: '#9ca3af', minWidth: '32px', minHeight: '32px' },
  modalBody: { padding: '20px 16px', textAlign: 'center', '@media (min-width: 769px)': { padding: '24px' } },
  warningIcon: { fontSize: '48px', marginBottom: '12px', '@media (min-width: 769px)': { fontSize: '64px', marginBottom: '16px' } },
  warningTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '8px', '@media (min-width: 769px)': { fontSize: '22px', marginBottom: '12px' } },
  warningText: { fontSize: '13px', color: '#374151', marginBottom: '6px', '@media (min-width: 769px)': { fontSize: '16px', marginBottom: '8px' } },
  warningDescription: { fontSize: '11px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.4', '@media (min-width: 769px)': { fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' } },
  classPreviewBox: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  previewIcon: { fontSize: '28px' },
  previewInfo: { flex: 1, textAlign: 'left', minWidth: '120px' },
  previewName: { fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '2px' },
  previewCode: { fontSize: '10px', color: '#6b7280', marginBottom: '2px' },
  previewStudents: { fontSize: '10px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '3px' },
  modalFooter: { padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '10px', '@media (min-width: 769px)': { padding: '16px 24px', gap: '12px' } },
  deleteConfirmButton: { padding: '8px 20px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', minHeight: '38px', '@media (min-width: 769px)': { padding: '10px 24px', fontSize: '14px' } }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } } @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } } .createClassButton:hover { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(102,126,234,0.4); } .classCard:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); } .deleteButton:hover { background-color: #fee2e2; } .copyButton:hover { background-color: #e5e7eb; } .submitButton:hover { opacity: 0.9; } .cancelButton:hover, .cancelButtonModal:hover { background-color: #e5e7eb; } .deleteConfirmButton:hover:not(:disabled) { transform: translateY(-1px); } .input:focus, .codeInput:focus { border-color: #667eea; box-shadow: 0 0 0 2px rgba(102,126,234,0.1); } button:active { transform: scale(0.97); } @media (max-width: 480px) { button { min-height: 40px; } .createClassButton { min-height: 48px; } .classCode { font-size: 11px !important; } .className { font-size: 13px !important; } .stat-value { font-size: 20px !important; } } @media (max-width: 360px) { .welcomeTitle { font-size: 18px !important; } .sectionTitle { font-size: 16px !important; } .classCard { padding: 10px !important; } .classCode { font-size: 10px !important; } }`;
document.head.appendChild(styleSheet);

export default Home;