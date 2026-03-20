import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = () => {
      try {
        let idToken = null;
        let userData = null;
        
        // Check URL hash for token
        if (window.location.hash) {
          const params = new URLSearchParams(window.location.hash.substring(1));
          idToken = params.get('id_token');
        }
        
        // Check URL search params as fallback
        if (!idToken && window.location.search) {
          const params = new URLSearchParams(window.location.search);
          idToken = params.get('id_token');
        }
        
        if (idToken) {
          // Decode JWT token
          const decodeJwtResponse = (token) => {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
          };

          userData = decodeJwtResponse(idToken);
          
          const userInfo = {
            name: userData.name,
            email: userData.email,
            picture: userData.picture
          };

          // Check if this is a popup window
          if (window.opener) {
            // Send message to parent window/ test
            window.opener.postMessage({
              type: 'google-auth-success',
              user: userInfo
            }, window.location.origin);
            
            // Close the popup
            window.close();
          } else {
            // If not a popup, redirect to signin with user data in state
            navigate('/signin', { state: { user: userInfo } });
          }
        } else {
          // No token found, redirect to signin
          navigate('/signin');
        }
      } catch (error) {
        console.error('Error processing auth response:', error);
        navigate('/signin');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>Completing sign in...</h2>
        <p style={{ color: '#666' }}>Please wait while we redirect you.</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AuthCallback;