import '../App.css';
import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AiFillHome } from 'react-icons/ai';
import { FiUser, FiMenu, FiX } from 'react-icons/fi';
import { GiAchievement } from 'react-icons/gi';
import { IoGameController } from 'react-icons/io5';
import { MdAssignment } from 'react-icons/md';
import { useUser } from '../context/UserContext';

function StudentHub() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const { user, setUser } = useUser(); // Use context instead of local state
  const navigate = useNavigate();
  const location = useLocation();

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
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleLogout = () => {
    setUser(null); // Clear user data on logout
    navigate("/");
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  const handleHomeClick = () => {
    navigate("/studenthub/homepage");
    setOpenDropdown(null);
  };

  const handleMissionsClick = () => {
    navigate("/studenthub/missions");
    setOpenDropdown(null);
  };

  const handleGamesClick = () => {
    navigate("/studenthub/games");
    setOpenDropdown(null);
  };

  const handleAchievementClick = () => {
    navigate("/studenthub/achievement");
    setOpenDropdown(null);
  };

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      
        style={{
          ...styles.sidebar,
          width: sidebarCollapsed ? '60px' : '220px',
        }}
      
        {/* Home Icon */}
        <div 
          style={styles.iconWrapper}
          onClick={handleHomeClick}
        >
          <AiFillHome size={24} color="white" />
          {!sidebarCollapsed && <span style={styles.iconText}>Home</span>}
        </div>

        {/* Missions Icon */}
        <div 
          style={styles.iconWrapper}
          onClick={handleMissionsClick}
        >
          <MdAssignment size={24} color="white" />
          {!sidebarCollapsed && <span style={styles.iconText}>Missions</span>}
        </div>

        {/* Games Icon */}
        <div 
          style={styles.iconWrapper}
          onClick={handleGamesClick}
        >
          <IoGameController size={24} color="white" />
          {!sidebarCollapsed && <span style={styles.iconText}>Games</span>}
        </div>

        {/* Achievement Icon */}
        <div 
          style={styles.iconWrapper}
          onClick={handleAchievementClick}
        >
          <GiAchievement size={24} color="white" />
          {!sidebarCollapsed && <span style={styles.iconText}>Achievement</span>}
        </div>
      

      {/* Main content */}
      <main
        style={{
          ...styles.main,
          ...(!isMobile && {
            marginLeft: sidebarCollapsed ? '70px' : '260px',
          })
        }}
      >
        {/* Header */}
        <header style={styles.header}>
          {/* Hamburger fixed top-left */}
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
                  style={styles.userIcon}
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
    top: '70px',
    left: 0,
    height: 'calc(100vh - 70px)',
    backgroundColor: '#2563eb',
    transition: 'width 0.3s ease',
    zIndex: 100,
    paddingTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
  },
  sidebarContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    width: '100%',
    marginBottom: '8px',
    borderRadius: '0 20px 20px 0',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      transform: 'translateX(4px)',
    },
  },
  iconText: {
    marginLeft: '12px',
    color: 'white',
    fontSize: '15px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  main: {
    flex: 1,
    transition: 'margin-left 0.3s ease',
    paddingTop: '70px',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    height: '70px',
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
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  hamburgerButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  studentName: {
    color: 'white',
    fontSize: 'clamp(14px, 4vw, 16px)',
    fontWeight: '500',
  },
  userIcon: {
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    ':hover': {
      opacity: 0.8,
    },
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    cursor: 'pointer',
    objectFit: 'cover',
    border: '2px solid white',
    transition: 'transform 0.2s',
    ':hover': {
      transform: 'scale(1.05)',
    },
  },
  dropdown: {
    position: 'absolute',
    top: '45px',
    right: 0,
    backgroundColor: 'white',
    color: 'black',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    minWidth: '200px',
    zIndex: 1000,
    animation: 'slideDown 0.2s ease',
  },
  dropdownEmail: {
    padding: '12px 16px',
    fontSize: '13px',
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
    padding: 'clamp(16px, 4vw, 24px)',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    flex: 1,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  },
  pageContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  cardContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '30px',
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    },
  },
};

export default StudentHub;