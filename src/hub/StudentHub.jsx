// src/hub/StudentHub.jsx
import '../App.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AiFillHome } from 'react-icons/ai';
import { FiUser, FiMenu, FiX, FiChevronDown, FiEdit2, FiUsers } from 'react-icons/fi';
import { GiAchievement } from 'react-icons/gi';
import { IoGameController } from 'react-icons/io5';
import { MdAssignment } from 'react-icons/md';
import { useUser } from '../context/UserContext';
import { classService } from '../services/classService';

function StudentHub() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [showLockModal, setShowLockModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const { user, setUser, userData, updateUserData } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const usernameInputRef = useRef(null);

  // Load joined classes - defined as useCallback so it can be passed to children
  const loadJoinedClasses = useCallback(async () => {
    if (!user?.dbId) {
      setLoadingClasses(false);
      return;
    }
    
    try {
      setLoadingClasses(true);
      const classes = await classService.getStudentClasses(user.dbId);
      setJoinedClasses(classes);
      console.log('Joined classes loaded:', classes.length);
      return classes;
    } catch (error) {
      console.error('Error loading joined classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  }, [user?.dbId]);

  // Check if user has access to Missions/Games
  const hasClassAccess = useCallback(() => {
    return joinedClasses.length > 0;
  }, [joinedClasses.length]);

  // Set up event listener for class changes (for real-time updates)
  useEffect(() => {
    // Listen for custom event when classes are updated from other components
    const handleClassesUpdated = () => {
      console.log('Classes updated event received, reloading...');
      loadJoinedClasses();
    };
    
    // Listen for storage events (in case of multiple tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'classesUpdated' || e.key === 'userClasses') {
        console.log('Storage change detected, reloading classes...');
        loadJoinedClasses();
      }
    };
    
    window.addEventListener('classesUpdated', handleClassesUpdated);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('classesUpdated', handleClassesUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadJoinedClasses]);

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

  // Load classes when user is available
  useEffect(() => {
    if (user?.dbId) {
      loadJoinedClasses();
    }
  }, [user?.dbId, loadJoinedClasses]);

  // Redirect to homepage if at exactly /studenthub
  useEffect(() => {
    if (location.pathname === '/studenthub') {
      console.log('Redirecting to homepage');
      navigate('/studenthub/homepage', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Show lock modal
  const showAccessDeniedModal = (destination) => {
    setPendingNavigation(destination);
    setShowLockModal(true);
  };

  // Handle navigation with access check
  const handleMissionsClick = () => {
    if (hasClassAccess()) {
      navigate("/studenthub/missions");
    } else {
      showAccessDeniedModal('missions');
    }
    setOpenDropdown(null);
    closeSidebar();
  };

  const handleGamesClick = () => {
    if (hasClassAccess()) {
      navigate("/studenthub/games");
    } else {
      showAccessDeniedModal('games');
    }
    setOpenDropdown(null);
    closeSidebar();
  };

  const handleHomeClick = () => {
    navigate("/studenthub/homepage");
    setOpenDropdown(null);
    closeSidebar();
  };

  const handleAchievementClick = () => {
    navigate("/studenthub/achievement");
    setOpenDropdown(null);
    closeSidebar();
  };

  // Handle Collaboration Center click - Navigates to collaboration page
  const handleCollaborationClick = () => {
    navigate("/studenthub/collaboration");
    setOpenDropdown(null);
    closeSidebar();
  };

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

  // Function to manually refresh classes (can be called from child components)
  const refreshClasses = async () => {
    console.log('Manually refreshing classes...');
    await loadJoinedClasses();
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('classesUpdated'));
    // Store in localStorage for cross-tab communication
    localStorage.setItem('classesUpdated', Date.now().toString());
    return joinedClasses;
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

          {/* Missions Icon - Auto-locks/unlocks based on class access */}
          <div 
            style={styles.iconWrapper}
            onClick={handleMissionsClick}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <MdAssignment size={24} color="white" />
            {(!sidebarCollapsed || isMobile) && (
              <div style={styles.iconTextWrapper}>
                <span style={styles.iconText}>Missions</span>
                {!hasClassAccess() && !loadingClasses && (
                  <span style={styles.lockIcon}>🔒</span>
                )}
              </div>
            )}
          </div>

          {/* Games Icon - Auto-locks/unlocks based on class access */}
          <div 
            style={styles.iconWrapper}
            onClick={handleGamesClick}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <IoGameController size={24} color="white" />
            {(!sidebarCollapsed || isMobile) && (
              <div style={styles.iconTextWrapper}>
                <span style={styles.iconText}>Games</span>
                {!hasClassAccess() && !loadingClasses && (
                  <span style={styles.lockIcon}>🔒</span>
                )}
              </div>
            )}
          </div>

          {/* Collaboration Center Icon - Always accessible */}
          <div 
            style={styles.iconWrapper}
            onClick={handleCollaborationClick}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <FiUsers size={24} color="white" />
            {(!sidebarCollapsed || isMobile) && <span style={styles.iconText}>Collaboration</span>}
          </div>

          {/* Achievement Icon - Always accessible */}
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
            {/* Combined Profile Area - Click anywhere shows the same dropdown */}
            <div style={styles.profileContainer} ref={dropdownRef}>
              <div style={styles.profileContent} onClick={handleProfileClick}>
                {/* Name and XP Section */}
                <div style={styles.profileInfo}>
                  <span style={styles.studentName}>
                    {getUserIdentifier()}
                  </span>
                  <span style={styles.xpPoints}>
                    ⭐ {getUserXP()} XP
                  </span>
                </div>
                
                {/* Chevron Icon */}
                <FiChevronDown 
                  size={18} 
                  color="white" 
                  style={{
                    ...styles.chevronIcon,
                    transform: openDropdown === 'profile' ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
                
                {/* Avatar */}
                {user?.picture ? (
                  <img 
                    src={user.picture}
                    alt={user.name}
                    style={styles.userAvatar}
                  />
                ) : (
                  <FiUser
                    size={24}
                    color="white"
                    style={styles.userIcon}
                  />
                )}
              </div>
              
              {/* Profile Dropdown */}
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
                    <div style={styles.dropdownInfoItem}>
                      <span style={styles.infoLabel}>📚 Classes:</span>
                      <span style={styles.infoValue}>{joinedClasses.length}</span>
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
                  
                  {/* Logout Button */}
                  <div style={styles.logoutItem} onClick={handleLogout}>
                    🚪 Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area - Pass user data and joined classes to child routes */}
        <div style={styles.contentWrapper}>
          <div style={styles.content}>
            <Outlet context={{ 
              user, 
              userData, 
              updateUserData, 
              getUserIdentifier,
              getUserXP,
              joinedClasses,
              loadingClasses,
              hasClassAccess: hasClassAccess(),
              refreshClasses,
              loadJoinedClasses
            }} />
          </div>
        </div>
      </main>

      {/* Lock Modal - Shown when trying to access locked features without joining a class */}
      {showLockModal && (
        <div style={styles.modalOverlay} onClick={() => setShowLockModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalIcon}>🔒</div>
              <h2 style={styles.modalTitle}>Access Locked</h2>
              <button 
                style={styles.modalCloseButton} 
                onClick={() => setShowLockModal(false)}
              >
                ×
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <p style={styles.modalMessage}>
                You need to join a class first to access {pendingNavigation === 'missions' ? 'missions' : 'games'}!
              </p>
              <p style={styles.modalSubMessage}>
                Join a class using the class code provided by your teacher to unlock all features and start your learning journey.
              </p>
              
              <div style={styles.modalActions}>
                <button 
                  style={styles.modalCancelButton}
                  onClick={() => setShowLockModal(false)}
                >
                  Cancel
                </button>
                <button 
                  style={styles.modalJoinButton}
                  onClick={() => {
                    setShowLockModal(false);
                    navigate("/studenthub/homepage");
                    // Scroll to join class section after navigation
                    setTimeout(() => {
                      const joinSection = document.querySelector('[data-join-class-section]');
                      if (joinSection) {
                        joinSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                >
                  Join a Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  iconTextWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  iconText: {
    marginLeft: '12px',
    color: 'white',
    fontSize: '15px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  lockIcon: {
    fontSize: '12px',
    opacity: 0.7,
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
  profileContainer: {
    position: 'relative',
  },
  profileContent: {
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
  profileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
    top: 'calc(100% + 10px)',
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
  dropdownDivider: {
    height: '1px',
    backgroundColor: '#e0e0e0',
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
  // Lock Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '20px',
    maxWidth: '450px',
    width: '90%',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.3s ease',
  },
  modalHeader: {
    padding: '24px 24px 16px 24px',
    textAlign: 'center',
    position: 'relative',
    borderBottom: '1px solid #e5e7eb',
  },
  modalIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  modalCloseButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#9ca3af',
    transition: 'color 0.2s',
    padding: '4px 8px',
    borderRadius: '8px',
    ':hover': {
      color: '#ef4444',
      backgroundColor: '#fee2e2',
    },
  },
  modalBody: {
    padding: '24px',
  },
  modalMessage: {
    fontSize: '16px',
    color: '#374151',
    textAlign: 'center',
    marginBottom: '12px',
    fontWeight: '500',
  },
  modalSubMessage: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  modalCancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#e5e7eb',
      transform: 'translateY(-1px)',
    },
  },
  modalJoinButton: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
    },
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
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
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