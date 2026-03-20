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
      navigate("/studenthub");
    } else if (selectedRole === 'teacher') {
      navigate("/teacherhub");
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

// Add the styles object here
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    maxWidth: '700px',
    width: '100%',
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
  googleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    padding: '14px 24px',
    backgroundColor: '#fff',
    border: '1px solid #dadce0',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#3c4043',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginBottom: '30px',
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
    width: '20px',
    height: '20px',
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
  termsText: {
    fontSize: '12px',
    color: '#999',
    marginTop: '20px',
    textAlign: 'center',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '30px',
  },
  userAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '4px',
  },
  userEmail: {
    fontSize: '14px',
    color: '#666',
  },
  userActions: {
    display: 'flex',
    gap: '10px',
  },
  switchAccountButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #2563eb',
    borderRadius: '6px',
    color: '#2563eb',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    ':hover': {
      backgroundColor: '#2563eb',
      color: 'white',
    },
  },
  signOutButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #dc2626',
    borderRadius: '6px',
    color: '#dc2626',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    ':hover': {
      backgroundColor: '#dc2626',
      color: 'white',
    },
  },
  roleSelectionContainer: {
    marginTop: '20px',
  },
  roleSelectionTitle: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '10px',
    textAlign: 'center',
  },
  rolePrompt: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
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
    minWidth: '220px',
    padding: '30px 20px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'center',
    position: 'relative',
    ':hover': {
      borderColor: '#2563eb',
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 16px rgba(37,99,235,0.2)',
    },
  },
  roleCardPreview: {
    opacity: '0.9',
    ':hover': {
      borderColor: '#2563eb',
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 16px rgba(37,99,235,0.2)',
    },
  },
  selectedRole: {
    borderColor: '#2563eb',
    backgroundColor: '#f0f7ff',
    boxShadow: '0 8px 16px rgba(37,99,235,0.2)',
  },
  roleIcon: {
    fontSize: '64px',
    marginBottom: '15px',
  },
  roleTitle: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '10px',
  },
  roleDescription: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.6',
  },
  selectedBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '16px 32px',
    fontSize: '18px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.3s',
    fontWeight: '600',
    ':hover': {
      backgroundColor: '#1d4ed8',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(37,99,235,0.3)',
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
};

// Add this CSS animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default SignIn;