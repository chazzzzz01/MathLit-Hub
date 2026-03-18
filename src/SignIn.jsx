import { useNavigate } from "react-router-dom";
import { useState } from "react";

function SignIn() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleContinue = () => {
    if (selectedRole === 'student') {
      navigate("/studenthub");
    } else if (selectedRole === 'teacher') {
      navigate("/teacherhub");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome Back!</h1>
        <p style={styles.subtitle}>Select your role to continue</p>
        
        <div style={styles.roleContainer}>
          {/* Student Option */}
          <div 
            style={{
              ...styles.roleCard,
              ...(selectedRole === 'student' ? styles.selectedRole : {})
            }}
            onClick={() => setSelectedRole('student')}
          >
            <div style={styles.roleIcon}>👨‍🎓</div>
            <h3 style={styles.roleTitle}>Student</h3>
            <p style={styles.roleDescription}>Access your courses, assignments, and grades</p>
          </div>

          {/* Teacher Option */}
          <div 
            style={{
              ...styles.roleCard,
              ...(selectedRole === 'teacher' ? styles.selectedRole : {})
            }}
            onClick={() => setSelectedRole('teacher')}
          >
            <div style={styles.roleIcon}>👨‍🏫</div>
            <h3 style={styles.roleTitle}>Teacher</h3>
            <p style={styles.roleDescription}>Manage classes, create assignments, and grade students</p>
          </div>
        </div>

        <button 
          style={{
            ...styles.button,
            ...(selectedRole ? {} : styles.buttonDisabled)
          }}
          onClick={handleContinue}
          disabled={!selectedRole}
        >
          Continue as {selectedRole ? (selectedRole === 'student' ? 'Student' : 'Teacher') : ''}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    width: '90%',
  },
  title: {
    fontSize: '32px',
    color: '#333',
    marginBottom: '10px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
    textAlign: 'center',
  },
  roleContainer: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  roleCard: {
    flex: '1',
    minWidth: '200px',
    padding: '20px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    '&:hover': {
      borderColor: '#2563eb',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(37,99,235,0.2)',
    },
  },
  selectedRole: {
    borderColor: '#2563eb',
    backgroundColor: '#f0f7ff',
    boxShadow: '0 4px 8px rgba(37,99,235,0.2)',
  },
  roleIcon: {
    fontSize: '48px',
    marginBottom: '10px',
  },
  roleTitle: {
    fontSize: '20px',
    color: '#333',
    marginBottom: '8px',
  },
  roleDescription: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
  },
  button: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '12px 24px',
    fontSize: '18px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: '#1d4ed8',
    },
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
    '&:hover': {
      backgroundColor: '#cccccc',
    },
  },
};

export default SignIn; 