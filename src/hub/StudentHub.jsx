import '../App.css';
import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AiFillHome } from 'react-icons/ai';
import { FiUser } from 'react-icons/fi';
import { GiAchievement } from 'react-icons/gi';
import { IoGameController } from 'react-icons/io5';
import { MdAssignment } from 'react-icons/md';
import { useUser } from '../context/UserContext';

function StudentHub() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const { user, setUser, logout, userData, updateUserData } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug: Log user data and current path
  useEffect(() => {
    console.log('StudentHub - User:', user);
    console.log('StudentHub - UserData:', userData);
    console.log('StudentHub - Current Path:', location.pathname);
  }, [user, userData, location.pathname]);

  // Get user data from navigation state only if user is not already set
  useEffect(() => {
    if (location.state?.user && !user) {
      console.log('Setting user from location state:', location.state.user);
      setUser(location.state.user);
    }
  }, [location.state, user, setUser]);

  // Redirect to homepage if at exactly /studenthub
  useEffect(() => {
    if (location.pathname === '/studenthub') {
      console.log('Redirecting to homepage');
      navigate('/studenthub/homepage', { replace: true });
    }
  }, [location.pathname, navigate]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setOpenDropdown(null);
  };

  const handleHomeClick = () => {
    console.log('Navigating to homepage');
    navigate("/studenthub/homepage");
    setOpenDropdown(null);
  };

  const handleMissionsClick = () => {
    console.log('Navigating to missions');
    navigate("/studenthub/missions");
    setOpenDropdown(null);
  };

  const handleGamesClick = () => {
    console.log('Navigating to games');
    navigate("/studenthub/games");
    setOpenDropdown(null);
  };

  const handleAchievementClick = () => {
    console.log('Navigating to achievement');
    navigate("/studenthub/achievement");
    setOpenDropdown(null);
  };

  // Get user identifier for display
  const getUserIdentifier = () => {
    if (user && user.email) {
      return user.email.split('@')[0];
    }
    return 'Student';
  };

  // If no user, show loading
  if (!user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <aside
        style={{
          ...styles.sidebar,
          width: sidebarCollapsed ? '60px' : '220px',
        }}
      >
        <div 
          style={{
            ...styles.iconWrapper,
            backgroundColor: location.pathname.includes('/studenthub/homepage') ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
          }} 
          onClick={handleHomeClick}
        >
          <AiFillHome size={24} color="white" />
          {!sidebarCollapsed && <span style={styles.iconText}>Home</span>}
        </div>

        <div 
          style={{
            ...styles.iconWrapper,
            backgroundColor: location.pathname.includes('/studenthub/missions') ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
          }} 
          onClick={handleMissionsClick}
        >
          <MdAssignment size={24} color="white" />
          {!sidebarCollapsed && <span style={styles.iconText}>Missions</span>}
        </div>

        <div 
          style={{
            ...styles.iconWrapper,
            backgroundColor: location.pathname.includes('/studenthub/games') ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
          }} 
          onClick={handleGamesClick}
        >
          <IoGameController size={24} color="white" />
          {!sidebarCollapsed && <span style={styles.iconText}>Games</span>}
        </div>

        <div 
          style={{
            ...styles.iconWrapper,
            backgroundColor: location.pathname.includes('/studenthub/achievement') ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
          }} 
          onClick={handleAchievementClick}
        >
          <GiAchievement size={24} color="white" />
          {!sidebarCollapsed && <span style={styles.iconText}>Achievement</span>}
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          ...styles.main,
          marginLeft: sidebarCollapsed ? '60px' : '220px',
        }}
      >
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.hamburger} onClick={toggleSidebar}>
            <div style={styles.bar}></div>
            <div style={styles.bar}></div>
            <div style={styles.bar}></div>
          </div>

          <div style={styles.rightSection}>
            <span style={styles.studentName}>
              {getUserIdentifier()}
            </span>
            
            <div style={{ position: 'relative' }}>
              {user?.picture ? (
                <img 
                  src={user.picture}
                  alt={user.name}
                  style={styles.userAvatar}
                  onClick={() =>
                    setOpenDropdown(openDropdown === 'profile' ? null : 'profile')
                  }
                />
              ) : (
                <FiUser
                  size={24}
                  color="white"
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    setOpenDropdown(openDropdown === 'profile' ? null : 'profile')
                  }
                />
              )}
              {openDropdown === 'profile' && (
                <div style={styles.dropdown}>
                  {user && (
                    <>
                      <div style={styles.dropdownEmail}>{user.email}</div>
                      <div style={styles.dropdownUserId}>
                        Username: {getUserIdentifier()}
                      </div>
                      {userData && (
                        <div style={styles.dropdownStats}>
                          <div>🎓 Member since: {new Date(userData.createdAt).toLocaleDateString()}</div>
                          <div>🕒 Last login: {new Date(userData.lastLogin).toLocaleDateString()}</div>
                          <div>🏆 XP: {userData.totalXP || 0}</div>
                          <div>💰 Coins: {userData.totalCoins || 0}</div>
                        </div>
                      )}
                      <div style={styles.dropdownDivider}></div>
                    </>
                  )}
                  <div style={styles.dropdownItem} onClick={handleLogout}>
                    Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area - Pass user data to child routes */}
        <div style={styles.contentWrapper}>
          <div style={styles.content}>
            <Outlet context={{ 
              user, 
              userData, 
              updateUserData, 
              getUserIdentifier 
            }} />
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '20px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  sidebar: {
    position: 'fixed',
    top: '60px',
    left: 0,
    height: 'calc(100vh - 60px)',
    backgroundColor: '#2563eb',
    transition: 'width 0.3s ease',
    zIndex: 100,
    paddingTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 10px',
    cursor: 'pointer',
    width: '100%',
    marginBottom: '5px',
    borderRadius: '0 20px 20px 0',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  iconText: {
    marginLeft: '12px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  main: {
    flex: 1,
    transition: 'margin-left 0.3s ease',
    paddingTop: '60px',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    height: '60px',
    width: '100%',
    backgroundColor: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    boxSizing: 'border-box',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 150,
  },
  hamburger: {
    position: 'fixed',
    top: '15px',
    left: '15px',
    width: '30px',
    height: '25px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
    zIndex: 200,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    gap: '15px',
  },
  studentName: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '500',
    marginRight: '5px',
  },
  bar: {
    height: '4px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '2px',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    objectFit: 'cover',
    border: '2px solid white',
  },
  dropdown: {
    position: 'absolute',
    top: '40px',
    right: 0,
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    minWidth: '280px',
    zIndex: 1000,
  },
  dropdownEmail: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#333',
    backgroundColor: '#f8f9fa',
    wordBreak: 'break-all',
    borderBottom: '1px solid #e0e0e0',
  },
  dropdownUserId: {
    padding: '8px 16px',
    fontSize: '12px',
    color: '#666',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e0e0e0',
  },
  dropdownStats: {
    padding: '10px 16px',
    fontSize: '12px',
    color: '#666',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e0e0e0',
    lineHeight: '1.6',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: '#e0e0e0',
  },
  dropdownItem: {
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    color: '#dc2626',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'center',
    ':hover': {
      backgroundColor: '#fee2e2',
    },
  },
  contentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    flex: 1,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  },
};

// Add keyframes for spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default StudentHub;