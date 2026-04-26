import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from './lib/supabase';

function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Check for existing user session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.role) {
        setSelectedRole(parsedUser.role);
      }
    }
  }, []);

  // Function to save or get user from Supabase
  const getOrCreateUser = async (userData) => {
    try {
      console.log('Getting/Creating user:', userData.email);
      
      // First, try to get existing user - use maybeSingle() to avoid 406 errors
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .maybeSingle();
      
      // If user exists, return it
      if (existingUser) {
        console.log('User found:', existingUser);
        return existingUser;
      }
      
      // Check if error is not just "no rows returned"
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }
      
      // No user found, create new user
      console.log('User not found, creating new user...');
      
      const newUserId = userData.sub || userData.id || crypto.randomUUID();
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          google_id: userData.sub || userData.id,
          email: userData.email,
          name: userData.name,
          avatar_url: userData.picture,
          role: null
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Insert error:', insertError);
        
        // If insert fails because user already exists (race condition), try fetching again
        if (insertError.code === '23505') { // Unique violation
          console.log('User was created by another request, fetching again...');
          const { data: retryUser, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('email', userData.email)
            .maybeSingle();
          
          if (retryUser) {
            return retryUser;
          }
        }
        
        throw insertError;
      }
      
      console.log('User created:', newUser);
      return newUser;
      
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      throw error;
    }
  };

  // Listen for Google OAuth response
  useEffect(() => {
    const handleMessage = async (event) => {
      // Make sure the message is from our origin
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'google-auth-success') {
        const userData = event.data.user;
        console.log('Received Google auth success:', userData);
        
        try {
          setLoading(true);
          
          // Get or create user in Supabase
          const dbUser = await getOrCreateUser(userData);
          
          // Create user object with database info
          const userWithDbInfo = {
            name: userData.name,
            email: userData.email,
            picture: userData.picture,
            dbId: dbUser.id,
            role: dbUser.role,
            googleId: userData.sub || userData.id
          };
          
          setUser(userWithDbInfo);
          localStorage.setItem('user', JSON.stringify(userWithDbInfo));
          console.log('User saved successfully:', userWithDbInfo);
          
        } catch (error) {
          console.error('Error saving user:', error);
          alert(`Failed to save user information: ${error.message || 'Please check if tables exist in Supabase'}`);
        } finally {
          setLoading(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGoogleSignIn = () => {
    setLoading(true);
    
    const clientId = '1065159934891-est3sn4f9i99tff0cf7bcjgcnudg9cg4.apps.googleusercontent.com';
    const redirectUri = `${window.location.origin}/auth/callback`;
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=id_token token` +
      `&scope=openid profile email` +
      `&prompt=select_account` +
      `&nonce=${Math.random().toString(36).substring(7)}`;

    const popup = window.open(
      authUrl,
      'google-signin',
      'width=500,height=600,left=200,top=100'
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = authUrl;
    }

    setTimeout(() => {
      if (loading) {
        setLoading(false);
        alert('Sign in is taking longer than expected. Please try again.');
      }
    }, 30000);
  };

  const handleSignOut = () => {
    setUser(null);
    setSelectedRole(null);
    setAgreeToTerms(false);
    localStorage.removeItem('user');
    localStorage.removeItem('teacherClasses');
  };

  const handleSwitchAccount = () => {
    handleGoogleSignIn();
  };

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    
    if (user && user.dbId) {
      try {
        setSavingRole(true);
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ role: role })
          .eq('id', user.dbId)
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        const updatedUserWithRole = { ...user, role: updatedUser.role };
        setUser(updatedUserWithRole);
        localStorage.setItem('user', JSON.stringify(updatedUserWithRole));
        
      } catch (error) {
        console.error('Error saving role:', error);
        alert('Failed to save role. Please try again.');
      } finally {
        setSavingRole(false);
      }
    }
  };

  const handleContinue = async () => {
    // Validate terms agreement
    if (!agreeToTerms) {
      alert('Please agree to the Terms of Service and Privacy Policy before continuing');
      return;
    }
    
    // Validate that user has selected a role
    if (!selectedRole) {
      alert('Please select a role (Student or Teacher) before continuing');
      return;
    }
    
    if (!user) {
      alert('Please sign in first');
      return;
    }
    
    // Save the role to database if not already saved
    if (user.dbId && (!user.role || user.role !== selectedRole)) {
      try {
        setSavingRole(true);
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ role: selectedRole })
          .eq('id', user.dbId)
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        const updatedUserWithRole = { ...user, role: updatedUser.role };
        setUser(updatedUserWithRole);
        localStorage.setItem('user', JSON.stringify(updatedUserWithRole));
        
      } catch (error) {
        console.error('Error saving role:', error);
        alert('Failed to save your role. Please try again.');
        setSavingRole(false);
        return;
      } finally {
        setSavingRole(false);
      }
    }
    
    // Navigate based on selected role
    if (selectedRole === 'student') {
      navigate("/studenthub", { state: { user: { ...user, role: selectedRole } } });
    } else if (selectedRole === 'teacher') {
      navigate("/teacherhub", { state: { user: { ...user, role: selectedRole } } });
    }
  };

  // Terms of Service Modal
  const TermsModal = () => (
    <div style={styles.modalOverlay} onClick={() => setShowTermsModal(false)}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Terms of Service</h2>
          <button style={styles.modalClose} onClick={() => setShowTermsModal(false)}>✕</button>
        </div>
        <div style={styles.modalBody}>
          <p style={styles.modalText}>
            <strong>MathLit (SHELD) Hub</strong> is a web-based instructional platform developed for academic and research purposes, specifically to support learning in finding the equation of a line.
          </p>
          <p style={styles.modalText}>By continuing to use this platform, you agree to:</p>
          <ul style={styles.modalList}>
            <li>Use the platform for educational purposes only</li>
            <li>Participate responsibly and respectfully, especially in collaborative activities</li>
            <li>Allow the collection of limited data (e.g., name, responses, scores) for academic research and platform improvement</li>
          </ul>
          <p style={styles.modalText}>
            All information gathered will be kept confidential and will not be used for commercial purposes.
          </p>
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.modalButton} onClick={() => setShowTermsModal(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Privacy Policy Modal
  const PrivacyModal = () => (
    <div style={styles.modalOverlay} onClick={() => setShowPrivacyModal(false)}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Privacy Policy</h2>
          <button style={styles.modalClose} onClick={() => setShowPrivacyModal(false)}>✕</button>
        </div>
        <div style={styles.modalBody}>
          <p style={styles.modalText}>
            <strong>MathLit (SHELD) Hub Privacy Notice</strong>
          </p>
          <p style={styles.modalText}>
            This privacy policy explains how MathLit Hub collects, uses, and protects your information.
          </p>
          <h3 style={styles.modalSubtitle}>Information We Collect</h3>
          <ul style={styles.modalList}>
            <li>Name and email address (via Google Sign-In)</li>
            <li>User role (Student or Teacher)</li>
            <li>Learning progress, scores, and responses to activities</li>
            <li>Platform usage data for research purposes</li>
          </ul>
          <h3 style={styles.modalSubtitle}>How We Use Your Information</h3>
          <ul style={styles.modalList}>
            <li>To provide and improve the learning platform</li>
            <li>For academic research on mathematics education</li>
            <li>To track progress and personalize learning experiences</li>
            <li>To communicate important platform updates</li>
          </ul>
          <h3 style={styles.modalSubtitle}>Data Protection</h3>
          <p style={styles.modalText}>
            All data is kept confidential and secure. We do not sell or share your personal information with third parties for commercial purposes. Your data is used solely for educational and research purposes within MathLit Hub.
          </p>
          <h3 style={styles.modalSubtitle}>Contact Us</h3>
          <p style={styles.modalText}>
            If you have questions about this privacy policy, please contact the MathLit Hub administrators.
          </p>
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.modalButton} onClick={() => setShowPrivacyModal(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Component for handling image errors with a reliable fallback
  const SafeImage = ({ src, alt, style }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [error, setError] = useState(false);

    // Data URI fallback avatar (initials-based)
    const getInitialsAvatar = () => {
      if (!user?.name) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%234A90E2'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='24' font-family='Arial' font-weight='bold'%3E?%3C/text%3E%3C/svg%3E";
      
      const initials = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      
      return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%234A90E2'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='24' font-family='Arial' font-weight='bold'%3E${initials}%3C/text%3E%3C/svg%3E`;
    };

    const handleError = () => {
      if (!error) {
        setError(true);
        // Use initials avatar as fallback instead of via.placeholder.com
        setImgSrc(getInitialsAvatar());
      }
    };

    return (
      <img 
        src={imgSrc} 
        alt={alt} 
        style={style}
        onError={handleError}
      />
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome to MathLit-Hub!</h1>
        <p style={styles.subtitle}>
          {user ? `Hello, ${user.name.split(' ')[0]}!` : 'Sign in to continue your learning journey'}
        </p>
        
        {user && (
          <div style={styles.userInfo}>
            <SafeImage 
              src={user.picture} 
              alt={user.name}
              style={styles.userAvatar}
            />
            <div style={styles.userDetails}>
              <h3 style={styles.userName}>{user.name}</h3>
              <p style={styles.userEmail}>{user.email}</p>
              {user.role && (
                <p style={styles.userRole}>
                  Role: {user.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                </p>
              )}
            </div>
            <div style={styles.userActions}>
              <button 
                style={styles.switchAccountButton}
                onClick={handleSwitchAccount}
                disabled={loading || savingRole}
              >
                Switch Account
              </button>
              <button 
                style={styles.signOutButton}
                onClick={handleSignOut}
                disabled={loading || savingRole}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

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
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
                Sign in with Google
              </>
            )}
          </button>
        )}

        <div style={styles.roleSelectionContainer}>
          <h2 style={styles.roleSelectionTitle}>Select your role</h2>
          <p style={styles.rolePrompt}>
            {user 
              ? (user.role 
                  ? `You are currently signed in as a ${user.role}. You can change your role below.`
                  : 'Choose how you want to use MathLit-Hub')
              : 'Choose your role to preview, then sign in to continue'}
          </p>
          
          <div style={styles.roleContainer}>
            <div 
              style={{
                ...styles.roleCard,
                ...(selectedRole === 'student' ? styles.selectedRole : {}),
                ...(!user ? styles.roleCardPreview : {})
              }}
              onClick={() => user && handleRoleSelect('student')}
            >
              <div style={styles.roleIcon}>👨‍🎓</div>
              <h3 style={styles.roleTitle}>Student</h3>
              <p style={styles.roleDescription}>Access your courses, assignments, and grades</p>
              {selectedRole === 'student' && (
                <div style={styles.selectedBadge}>✓ Selected</div>
              )}
            </div>

            <div 
              style={{
                ...styles.roleCard,
                ...(selectedRole === 'teacher' ? styles.selectedRole : {}),
                ...(!user ? styles.roleCardPreview : {})
              }}
              onClick={() => user && handleRoleSelect('teacher')}
            >
              <div style={styles.roleIcon}>👨‍🏫</div>
              <h3 style={styles.roleTitle}>Teacher</h3>
              <p style={styles.roleDescription}>Manage classes, create assignments, and grade students</p>
              {selectedRole === 'teacher' && (
                <div style={styles.selectedBadge}>✓ Selected</div>
              )}
            </div>
          </div>

          {/* Terms of Service and Privacy Policy with Checkbox */}
          <div style={styles.termsContainer}>
            <div 
              style={styles.checkboxWrapper}
              onClick={() => setAgreeToTerms(!agreeToTerms)}
            >
              <div style={{
                ...styles.circleCheckbox,
                ...(agreeToTerms ? styles.circleCheckboxChecked : {})
              }}>
                {agreeToTerms && <span style={styles.checkmark}>✓</span>}
              </div>
            </div>
            <div style={styles.termsTextWrapper}>
              <span style={styles.termsPrefix}>I agree to the </span>
              <span 
                style={styles.termsLink}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTermsModal(true);
                }}
              >
                Terms of Service
              </span>
              <span style={styles.termsPrefix}> and </span>
              <span 
                style={styles.termsLink}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPrivacyModal(true);
                }}
              >
                Privacy Policy
              </span>
            </div>
          </div>

          <button 
            style={{
              ...styles.continueButton,
              ...((!selectedRole || !user || savingRole || !agreeToTerms) ? styles.buttonDisabled : {})
            }}
            onClick={handleContinue}
            disabled={!selectedRole || !user || savingRole || !agreeToTerms}
          >
            {savingRole ? (
              <div style={styles.loadingContainer}>
                <span style={styles.loadingSpinner}></span>
                <span>Saving role...</span>
              </div>
            ) : (
              !user 
                ? 'Sign in with Google to continue' 
                : !selectedRole 
                  ? 'Select a role to continue'
                  : !agreeToTerms
                    ? 'Agree to Terms to continue'
                    : `Continue as ${selectedRole === 'student' ? 'Student' : 'Teacher'}`
            )}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showTermsModal && <TermsModal />}
      {showPrivacyModal && <PrivacyModal />}
    </div>
  );
}

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
    marginBottom: '4px',
  },
  userRole: {
    fontSize: 'clamp(10px, 2.5vw, 12px)',
    color: '#2563eb',
    fontWeight: '500',
    marginTop: '4px',
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
  },
  roleCardPreview: {
    opacity: '0.95',
    cursor: 'default',
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
  termsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: 'clamp(20px, 5vw, 24px)',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    flexWrap: 'wrap',
  },
  checkboxWrapper: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCheckbox: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: '2px solid #2563eb',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  circleCheckboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  termsTextWrapper: {
    flex: 1,
    fontSize: 'clamp(11px, 3vw, 13px)',
    lineHeight: 1.4,
  },
  termsPrefix: {
    color: '#555',
  },
  termsLink: {
    color: '#2563eb',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: '500',
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
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'background 0.2s',
  },
  modalBody: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  modalText: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.6',
    marginBottom: '12px',
  },
  modalSubtitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginTop: '16px',
    marginBottom: '8px',
  },
  modalList: {
    margin: '8px 0 16px 20px',
    padding: 0,
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  modalButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '8px 20px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};

// Add global styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

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

  * {
    transition: all 0.2s ease-in-out;
  }

  button, [role="button"], .role-card {
    touch-action: manipulation;
  }
`;
document.head.appendChild(styleSheet);

export default SignIn;