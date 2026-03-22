import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check for user data from navigation state (for redirect fallback)
  useEffect(() => {
    if (location.state?.user) {
      setUser(location.state.user);
      // Clear the state so it doesn't persist on refresh
      navigate('/signin', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Listen for the Google OAuth response from popup
  useEffect(() => {
    const handleMessage = (event) => {
      // Check if the message is from our origin for security
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'google-auth-success') {
        const userData = event.data.user;
        setUser({
          name: userData.name,
          email: userData.email,
          picture: userData.picture
        });
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGoogleSignIn = () => {
    setLoading(true);
    
    const clientId = '1065159934891-est3sn4f9i99tff0cf7bcjgcnudg9cg4.apps.googleusercontent.com';
    // Use the auth callback URL instead of the main URL
    const redirectUri = `${window.location.origin}/auth/callback`;
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=id_token token` +
      `&scope=openid profile email` +
      `&prompt=select_account` +
      `&nonce=${Math.random().toString(36).substring(7)}`;

    // Try to open in popup first
    const popup = window.open(
      authUrl,
      'google-signin',
      'width=500,height=600,left=200,top=100'
    );

    // If popup is blocked, fallback to redirect
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = authUrl;
    }

    // Optional: Add a timeout to reset loading if popup takes too long
    setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 30000); // Reset after 30 seconds
  };

  const handleSignOut = () => {
    setUser(null);
    setSelectedRole(null);
  };

  const handleSwitchAccount = () => {
    handleGoogleSignIn();
  };

  const handleContinue = () => {
    if (selectedRole === 'student') {
      // Pass user data to StudentHub
      navigate("/studenthub", { state: { user: user } });
    } else if (selectedRole === 'teacher') {
      // Pass user data to TeacherHub (if needed)
      navigate("/teacherhub", { state: { user: user } });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome to MathLit-Hub!</h1>
        <p style={styles.subtitle}>
          {user ? `Hello, ${user.name.split(' ')[0]}!` : 'Sign in to continue your learning journey'}
        </p>
        
        {/* User Info - Only show when signed in */}
        {user && (
          <div style={styles.userInfo}>
            <img 
              src={user.picture} 
              alt={user.name}
              style={styles.userAvatar}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/80";
              }}
            />
            <div style={styles.userDetails}>
              <h3 style={styles.userName}>{user.name}</h3>
              <p style={styles.userEmail}>{user.email}</p>
            </div>
            <div style={styles.userActions}>
              <button 
                style={styles.switchAccountButton}
                onClick={handleSwitchAccount}
              >
                Switch Account
              </button>
              <button 
                style={styles.signOutButton}
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Google Sign-In Button - Only show when not signed in */}
        {!user && (
          <button 
            style={styles.googleButton}
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <div style={styles.loadingContainer}>
                <span style={styles.loadingSpinner}></span>
                <span>Signing in...</span>
              </div>
            ) : (
              <>
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google logo" 
                  style={styles.googleIcon}
                />
                Sign in with Google
              </>
            )}
          </button>
        )}

        {/* Role Selection - Always Visible */}
        <div style={styles.roleSelectionContainer}>
          <h2 style={styles.roleSelectionTitle}>Select your role</h2>
          <p style={styles.rolePrompt}>
            {user 
              ? 'Choose how you want to use MathLit-Hub' 
              : 'Choose your role to preview, then sign in to continue'}
          </p>
          
          <div style={styles.roleContainer}>
            {/* Student Option */}
            <div 
              style={{
                ...styles.roleCard,
                ...(selectedRole === 'student' ? styles.selectedRole : {}),
                ...(!user ? styles.roleCardPreview : {})
              }}
              onClick={() => setSelectedRole('student')}
            >
              <div style={styles.roleIcon}>👨‍🎓</div>
              <h3 style={styles.roleTitle}>Student</h3>
              <p style={styles.roleDescription}>Access your courses, assignments, and grades</p>
              {selectedRole === 'student' && (
                <div style={styles.selectedBadge}>✓ Selected</div>
              )}
            </div>

            {/* Teacher Option */}
            <div 
              style={{
                ...styles.roleCard,
                ...(selectedRole === 'teacher' ? styles.selectedRole : {}),
                ...(!user ? styles.roleCardPreview : {})
              }}
              onClick={() => setSelectedRole('teacher')}
            >
              <div style={styles.roleIcon}>👨‍🏫</div>
              <h3 style={styles.roleTitle}>Teacher</h3>
              <p style={styles.roleDescription}>Manage classes, create assignments, and grade students</p>
              {selectedRole === 'teacher' && (
                <div style={styles.selectedBadge}>✓ Selected</div>
              )}
            </div>
          </div>

          <button 
            style={{
              ...styles.continueButton,
              ...(!selectedRole || !user ? styles.buttonDisabled : {})
            }}
            onClick={handleContinue}
            disabled={!selectedRole || !user}
          >
            {!user 
              ? 'Sign in with Google to continue' 
              : !selectedRole 
                ? 'Select a role to continue' 
                : `Continue as ${selectedRole === 'student' ? 'Student' : 'Teacher'}`}
          </button>
        </div>

        {/* Terms Text - Always visible */}
        <p style={styles.termsText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

// Responsive styles with full screen adaptation
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: '16px',
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: 'white',
    padding: 'clamp(20px, 5vw, 48px)',
    borderRadius: 'clamp(8px, 2vw, 12px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: 'min(700px, 100%)',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: 'clamp(20px, 6vw, 32px)',
    color: '#333',
    marginBottom: 'clamp(8px, 2vw, 12px)',
    textAlign: 'center',
    lineHeight: 1.2,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 'clamp(13px, 3.5vw, 16px)',
    color: '#666',
    marginBottom: 'clamp(20px, 5vw, 30px)',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  googleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: 'clamp(10px, 3vw, 14px) clamp(16px, 4vw, 24px)',
    backgroundColor: '#fff',
    border: '1px solid #dadce0',
    borderRadius: '8px',
    fontSize: 'clamp(13px, 3.5vw, 16px)',
    fontWeight: '500',
    color: '#3c4043',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: 'clamp(20px, 5vw, 30px)',
    boxSizing: 'border-box',
    ':hover': {
      backgroundColor: '#f8f9fa',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    ':disabled': {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
  },
  googleIcon: {
    width: 'clamp(16px, 4vw, 20px)',
    height: 'clamp(16px, 4vw, 20px)',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 'clamp(12px, 3vw, 20px)',
    padding: 'clamp(15px, 4vw, 20px)',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    marginBottom: 'clamp(20px, 5vw, 30px)',
    flexWrap: 'wrap',
    boxSizing: 'border-box',
  },
  userAvatar: {
    width: 'clamp(45px, 10vw, 60px)',
    height: 'clamp(45px, 10vw, 60px)',
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
  },
  userDetails: {
    flex: '1',
    minWidth: '140px',
  },
  userName: {
    fontSize: 'clamp(15px, 4vw, 18px)',
    color: '#333',
    marginBottom: '4px',
    fontWeight: '600',
    wordBreak: 'break-word',
  },
  userEmail: {
    fontSize: 'clamp(11px, 3vw, 14px)',
    color: '#666',
    wordBreak: 'break-word',
  },
  userActions: {
    display: 'flex',
    gap: 'clamp(8px, 2vw, 12px)',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  switchAccountButton: {
    padding: 'clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px)',
    backgroundColor: 'transparent',
    border: '1px solid #2563eb',
    borderRadius: '6px',
    color: '#2563eb',
    fontSize: 'clamp(11px, 3vw, 14px)',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: '#2563eb',
      color: 'white',
    },
  },
  signOutButton: {
    padding: 'clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px)',
    backgroundColor: 'transparent',
    border: '1px solid #dc2626',
    borderRadius: '6px',
    color: '#dc2626',
    fontSize: 'clamp(11px, 3vw, 14px)',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: '#dc2626',
      color: 'white',
    },
  },
  roleSelectionContainer: {
    marginTop: 'clamp(16px, 4vw, 20px)',
    width: '100%',
  },
  roleSelectionTitle: {
    fontSize: 'clamp(18px, 5vw, 24px)',
    color: '#333',
    marginBottom: 'clamp(8px, 2vw, 12px)',
    textAlign: 'center',
    fontWeight: '600',
  },
  rolePrompt: {
    fontSize: 'clamp(11px, 3vw, 14px)',
    color: '#666',
    marginBottom: 'clamp(16px, 4vw, 24px)',
    textAlign: 'center',
    lineHeight: 1.5,
    padding: '0 10px',
  },
  roleContainer: {
    display: 'flex',
    gap: 'clamp(16px, 4vw, 24px)',
    marginBottom: 'clamp(24px, 6vw, 32px)',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  roleCard: {
    flex: '1',
    minWidth: '260px',
    maxWidth: '100%',
    padding: 'clamp(20px, 5vw, 32px) clamp(16px, 4vw, 24px)',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    position: 'relative',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    ':hover': {
      borderColor: '#2563eb',
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 20px rgba(37,99,235,0.15)',
    },
  },
  roleCardPreview: {
    opacity: '0.95',
    ':hover': {
      borderColor: '#2563eb',
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 20px rgba(37,99,235,0.15)',
    },
  },
  selectedRole: {
    borderColor: '#2563eb',
    backgroundColor: '#f0f7ff',
    boxShadow: '0 8px 20px rgba(37,99,235,0.15)',
  },
  roleIcon: {
    fontSize: 'clamp(40px, 12vw, 64px)',
    marginBottom: 'clamp(12px, 3vw, 16px)',
  },
  roleTitle: {
    fontSize: 'clamp(18px, 5vw, 24px)',
    color: '#333',
    marginBottom: 'clamp(8px, 2vw, 12px)',
    fontWeight: '600',
  },
  roleDescription: {
    fontSize: 'clamp(12px, 3vw, 14px)',
    color: '#666',
    lineHeight: '1.5',
  },
  selectedBadge: {
    position: 'absolute',
    top: 'clamp(8px, 2vw, 12px)',
    right: 'clamp(8px, 2vw, 12px)',
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: 'clamp(10px, 2.5vw, 12px)',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: 'clamp(12px, 3.5vw, 16px) clamp(20px, 5vw, 32px)',
    fontSize: 'clamp(13px, 3.5vw, 18px)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.3s ease',
    fontWeight: '600',
    boxSizing: 'border-box',
    ':hover': {
      backgroundColor: '#1d4ed8',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(37,99,235,0.3)',
    },
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
    ':hover': {
      backgroundColor: '#cccccc',
      transform: 'none',
      boxShadow: 'none',
    },
  },
  termsText: {
    fontSize: 'clamp(10px, 2.5vw, 12px)',
    color: '#999',
    marginTop: 'clamp(16px, 4vw, 24px)',
    textAlign: 'center',
    lineHeight: 1.4,
  },
};

// Add global styles and animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive styles for all screen sizes */
  @media (max-width: 768px) {
    .user-info {
      flex-direction: column;
      text-align: center;
    }
    
    .user-details {
      text-align: center;
    }
    
    .user-actions {
      justify-content: center;
      width: 100%;
    }
  }

  @media (max-width: 640px) {
    .role-container {
      flex-direction: column;
      align-items: center;
    }
    
    .role-card {
      width: 100%;
      max-width: 100%;
    }
  }

  @media (max-width: 480px) {
    .user-info {
      flex-direction: column;
      text-align: center;
      padding: 16px;
    }
    
    .user-details {
      text-align: center;
      width: 100%;
    }
    
    .user-actions {
      flex-direction: column;
      width: 100%;
      gap: 10px;
    }
    
    .switch-account-button,
    .sign-out-button {
      width: 100%;
      text-align: center;
      white-space: normal;
    }
    
    .role-card {
      min-width: auto;
      padding: 20px 16px;
    }
    
    .continue-button {
      font-size: 14px;
      padding: 12px 20px;
    }
  }

  @media (max-width: 320px) {
    .card {
      padding: 16px;
    }
    
    .title {
      font-size: 18px;
    }
    
    .subtitle {
      font-size: 12px;
    }
    
    .role-title {
      font-size: 16px;
    }
    
    .role-description {
      font-size: 11px;
    }
  }

  @media (min-width: 1400px) {
    .card {
      max-width: 800px;
    }
    
    .title {
      font-size: 36px;
    }
    
    .role-card {
      min-width: 320px;
    }
  }

  /* Smooth transitions */
  * {
    transition: all 0.2s ease-in-out;
  }

  /* Better touch targets for mobile */
  button, [role="button"], .role-card {
    touch-action: manipulation;
  }
`;
document.head.appendChild(styleSheet);

export default SignIn;