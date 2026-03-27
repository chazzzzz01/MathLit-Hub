import '../App.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AiFillHome } from 'react-icons/ai';
import { FiUser, FiMenu, FiX, FiChevronDown, FiEdit2 } from 'react-icons/fi';
import { GiAchievement } from 'react-icons/gi';
import { IoGameController } from 'react-icons/io5';
import { MdAssignment } from 'react-icons/md';
import { useUser } from '../context/UserContext';

function StudentHub() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const { user, setUser, userData, updateUserData } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const usernameInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
        setIsEditingUsername(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingUsername && usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, [isEditingUsername]);

  // Get user identifier (name or email)
  const getUserIdentifier = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Student';
  };

  // Get user XP points
  const getUserXP = () => {
    return userData?.xp || 0;
  };

  // Check screen size for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const closeSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/");
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  const handleHomeClick = () => {
    navigate("/studenthub/homepage");
    setOpenDropdown(null);
    closeSidebar();
  };

  const handleMissionsClick = () => {
    navigate("/studenthub/missions");
    setOpenDropdown(null);
    closeSidebar();
  };

  const handleGamesClick = () => {
    navigate("/studenthub/games");
    setOpenDropdown(null);
    closeSidebar();
  };

  const handleAchievementClick = () => {
    navigate("/studenthub/achievement");
    setOpenDropdown(null);
    closeSidebar();
  };

  const handleProfileClick = () => {
    setOpenDropdown(openDropdown === 'profile' ? null : 'profile');
    setIsEditingUsername(false);
  };

  const handleEditUsername = () => {
    setEditedUsername(getUserIdentifier());
    setIsEditingUsername(true);
  };

  const handleSaveUsername = () => {
    if (editedUsername.trim() && editedUsername !== getUserIdentifier()) {
      // Update user context
      const updatedUser = { ...user, name: editedUsername.trim() };
      setUser(updatedUser);
      
      // Also update in userData if needed
      if (updateUserData) {
        updateUserData({ ...userData, name: editedUsername.trim() });
      }
    }
    setIsEditingUsername(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveUsername();
    } else if (e.key === 'Escape') {
      setIsEditingUsername(false);
    }
  };

  // Determine sidebar width and visibility
  const sidebarWidth = sidebarCollapsed ? '60px' : '220px';
  const sidebarDisplay = isMobile && !mobileMenuOpen ? 'none' : 'flex';

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <div
        style={{
          ...styles.sidebar,
          width: isMobile ? '220px' : sidebarWidth,
          display: sidebarDisplay,
          transform: isMobile && mobileMenuOpen ? 'translateX(0)' : isMobile ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.3s ease, width 0.3s ease',
        }}
      >
        <div style={styles.sidebarContent}>
          {/* Home Icon */}
          <div 
            style={styles.iconWrapper}
            onClick={handleHomeClick}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <AiFillHome size={24} color="white" />
            {(!sidebarCollapsed || isMobile) && <span style={styles.iconText}>Home</span>}
          </div>

          {/* Missions Icon */}
          <div 
            style={styles.iconWrapper}
            onClick={handleMissionsClick}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <MdAssignment size={24} color="white" />
            {(!sidebarCollapsed || isMobile) && <span style={styles.iconText}>Missions</span>}
          </div>

          {/* Games Icon */}
          <div 
            style={styles.iconWrapper}
            onClick={handleGamesClick}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <IoGameController size={24} color="white" />
            {(!sidebarCollapsed || isMobile) && <span style={styles.iconText}>Games</span>}
          </div>

          {/* Achievement Icon */}
          <div 
            style={styles.iconWrapper}
            onClick={handleAchievementClick}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <GiAchievement size={24} color="white" />
            {(!sidebarCollapsed || isMobile) && <span style={styles.iconText}>Achievement</span>}
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          style={styles.mobileOverlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main
        style={{
          ...styles.main,
          marginLeft: !isMobile ? (sidebarCollapsed ? '70px' : '260px') : '0',
          transition: 'margin-left 0.3s ease',
        }}
      >
        {/* Header */}
        <header style={styles.header}>
          {/* Hamburger button */}
          <button onClick={toggleSidebar} style={styles.hamburgerButton}>
            {isMobile && mobileMenuOpen ? (
              <FiX size={24} color="white" />
            ) : (
              <FiMenu size={24} color="white" />
            )}
          </button>

          <div style={styles.rightSection}>
            {/* Profile Button with Chevron and XP Points */}
            <div style={styles.profileButton} onClick={handleProfileClick}>
              <span style={styles.studentName}>
                {getUserIdentifier()}
              </span>
              <span style={styles.xpPoints}>
                ⭐ {getUserXP()} XP
              </span>
              <FiChevronDown 
                size={18} 
                color="white" 
                style={{
                  ...styles.chevronIcon,
                  transform: openDropdown === 'profile' ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </div>
            
            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              {user?.picture ? (
                <img 
                  src={user.picture}
                  alt={user.name}
                  style={styles.userAvatar}
                  onClick={handleProfileClick}
                />
              ) : (
                <FiUser
                  size={24}
                  color="white"
                  style={styles.userIcon}
                  onClick={handleProfileClick}
                />
              )}
              
              {openDropdown === 'profile' && (
                <div style={styles.dropdown}>
                  {/* User Header */}
                  <div style={styles.dropdownHeader}>
                    {user?.picture ? (
                      <img src={user.picture} alt={user.name} style={styles.dropdownAvatar} />
                    ) : (
                      <div style={styles.dropdownAvatarPlaceholder}>
                        {getUserIdentifier().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={styles.dropdownUserInfo}>
                      <div style={styles.dropdownName}>{user?.name || getUserIdentifier()}</div>
                      <div style={styles.dropdownEmail}>{user?.email}</div>
                    </div>
                  </div>
                  
                  <div style={styles.dropdownDivider}></div>
                  
                  {/* Account Info Section */}
                  <div style={styles.dropdownSection}>
                    <div style={styles.dropdownSectionTitle}>Account Information</div>
                    <div style={styles.dropdownInfoItem}>
                      <span style={styles.infoLabel}>📧 Email:</span>
                      <span style={styles.infoValue}>{user?.email || 'Not provided'}</span>
                    </div>
                    <div style={styles.dropdownInfoItem}>
                      <span style={styles.infoLabel}>👤 Username:</span>
                      {isEditingUsername ? (
                        <div style={styles.editUsernameContainer}>
                          <input
                            ref={usernameInputRef}
                            type="text"
                            value={editedUsername}
                            onChange={(e) => setEditedUsername(e.target.value)}
                            onKeyDown={handleKeyPress}
                            style={styles.usernameInput}
                            maxLength={50}
                          />
                          <button onClick={handleSaveUsername} style={styles.saveButton}>
                            Save
                          </button>
                        </div>
                      ) : (
                        <div style={styles.usernameValueContainer}>
                          <span style={styles.infoValue}>{getUserIdentifier()}</span>
                          <FiEdit2 
                            size={14} 
                            style={styles.editIcon}
                            onClick={handleEditUsername}
                          />
                        </div>
                      )}
                    </div>
                    <div style={styles.dropdownInfoItem}>
                      <span style={styles.infoLabel}>⭐ XP Points:</span>
                      <span style={styles.infoValue}>{getUserXP()} XP</span>
                    </div>
                    {userData && userData.lastLogin && (
                      <div style={styles.dropdownInfoItem}>
                        <span style={styles.infoLabel}>🕒 Last login:</span>
                        <span style={styles.infoValue}>
                          {new Date(userData.lastLogin).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div style={styles.dropdownDivider}></div>
                  
                  <div style={styles.dropdownDivider}></div>
                  
            
                  
                  <div style={styles.dropdownDivider}></div>
                  
                  {/* Logout Button */}
                  <div style={styles.logoutItem} onClick={handleLogout}>
                    🚪 Logout
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
              getUserIdentifier,
              getUserXP
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
    width: '100%',
    position: 'relative',
    backgroundColor: '#ffffff',
    overflowX: 'hidden',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '20px',
    backgroundColor: '#ffffff',
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
    minHeight: '100vh',
    backgroundColor: '#ffffff',
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
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  studentName: {
    color: 'white',
    fontSize: 'clamp(14px, 4vw, 16px)',
    fontWeight: '500',
  },
  xpPoints: {
    color: '#FFD700',
    fontSize: 'clamp(12px, 3vw, 14px)',
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '4px 8px',
    borderRadius: '12px',
    marginLeft: '4px',
  },
  chevronIcon: {
    transition: 'transform 0.2s ease',
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
    top: '50px',
    right: 0,
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    minWidth: '320px',
    zIndex: 1000,
    animation: 'slideDown 0.2s ease',
  },
  dropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
  },
  dropdownAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  dropdownAvatarPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  dropdownUserInfo: {
    flex: 1,
  },
  dropdownName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
  },
  dropdownEmail: {
    fontSize: '12px',
    color: '#666',
    wordBreak: 'break-all',
  },
  dropdownSection: {
    padding: '12px 16px',
  },
  dropdownSectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: '12px',
    letterSpacing: '0.5px',
  },
  dropdownInfoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    fontSize: '13px',
    borderBottom: '1px solid #f0f0f0',
  },
  infoLabel: {
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    color: '#333',
    textAlign: 'right',
  },
  usernameValueContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  editIcon: {
    cursor: 'pointer',
    color: '#666',
    transition: 'color 0.2s',
    ':hover': {
      color: '#2563eb',
    },
  },
  editUsernameContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  usernameInput: {
    padding: '4px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    width: '120px',
    outline: 'none',
    ':focus': {
      borderColor: '#2563eb',
    },
  },
  saveButton: {
    padding: '4px 8px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#1e4db9',
    },
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  statBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
  },
  statBadgeValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statBadgeLabel: {
    fontSize: '11px',
    color: '#666',
    marginTop: '4px',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: '#e0e0e0',
  },
  dropdownItem: {
    padding: '10px 0',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '14px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    ':hover': {
      color: '#2563eb',
    },
  },
  logoutItem: {
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '14px',
    color: '#dc2626',
    fontWeight: '500',
    textAlign: 'center',
    ':hover': {
      backgroundColor: '#fee2e2',
    },
  },
  mobileOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  contentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    marginTop: '70px',
  },
  content: {
    padding: 'clamp(16px, 4vw, 24px)',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    flex: 1,
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  button:hover {
    opacity: 0.9;
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body, html {
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }
`;
document.head.appendChild(styleSheet);

export default StudentHub;