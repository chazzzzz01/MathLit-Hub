import '../App.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { FiUser, FiMenu, FiX, FiHome, FiBarChart2, FiChevronDown, FiEdit2 } from 'react-icons/fi';
import { MdPeople } from 'react-icons/md';
import { useUser } from '../context/UserContext';
import { classService } from '../services/classService';

function TeacherHub() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [teacherStats, setTeacherStats] = useState({
    totalStudents: 0,
    activeClasses: 0,
    memberSince: null,
    lastLogin: null
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const { user, setUser, logout, userData, updateUserData } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const usernameInputRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Debug: Log user data and current path
  useEffect(() => {
    console.log('TeacherHub - User:', user);
    console.log('TeacherHub - UserData:', userData);
    console.log('TeacherHub - Current Path:', location.pathname);
  }, [user, userData, location.pathname]);

  // Load teacher statistics
  useEffect(() => {
    loadTeacherStats();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
        setIsEditingUsername(false);
      }
      // Close mobile menu when clicking outside
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        const hamburgerButton = document.querySelector('.hamburger-button');
        if (hamburgerButton && !hamburgerButton.contains(event.target)) {
          setMobileMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingUsername && usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, [isEditingUsername]);

  const loadTeacherStats = async () => {
    if (!user?.dbId) {
      setLoadingStats(false);
      return;
    }

    try {
      setLoadingStats(true);
      
      // Get all classes created by this teacher
      const teacherClasses = await classService.getTeacherClasses(user.dbId);
      
      let totalStudentsCount = 0;
      
      // Calculate total students across all classes
      for (const classItem of teacherClasses) {
        const students = await classService.getClassStudents(classItem.id);
        totalStudentsCount += students.length;
      }
      
      setTeacherStats({
        totalStudents: totalStudentsCount,
        activeClasses: teacherClasses.length,
        memberSince: user?.createdAt || userData?.createdAt || new Date(),
        lastLogin: user?.lastLogin || userData?.lastLogin || new Date()
      });
      
    } catch (error) {
      console.error('Error loading teacher stats:', error);
      // Fallback to userData if available
      setTeacherStats({
        totalStudents: userData?.teacherStats?.studentsCount || 0,
        activeClasses: userData?.teacherStats?.activeClasses || 0,
        memberSince: user?.createdAt || userData?.createdAt || new Date(),
        lastLogin: user?.lastLogin || userData?.lastLogin || new Date()
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // Check screen size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // On desktop, ensure mobile menu is closed when resizing up
      if (!mobile) {
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

  // IMPORTANT FIX: Modified redirect to handle all routes properly
  useEffect(() => {
    // Only redirect if we're exactly at /teacherhub with no additional path
    if (location.pathname === '/teacherhub') {
      console.log('Redirecting to home');
      navigate('/teacherhub/home', { replace: true });
    }
  }, [location.pathname, navigate]);

  const toggleSidebar = () => {
    if (isMobile) {
      // Toggle mobile menu - if open, close it; if closed, open it
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      // On desktop, toggle sidebar collapse state
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path) => {
    console.log('Navigating to:', path);
    navigate(path);
    setOpenDropdown(null);
    closeSidebar();
  };

  const handleProfileClick = () => {
    setOpenDropdown(openDropdown === 'profile' ? null : 'profile');
    setIsEditingUsername(false);
  };

  // Get user identifier for display
  const getUserIdentifier = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Teacher';
  };

  // Get user XP points (for consistency with StudentHub, though teachers might not have XP)
  const getUserXP = () => {
    return userData?.xp || 0;
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

  const formatDate = (date) => {
    if (!date) return 'Not available';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Teacher navigation items
  const navItems = [
    { path: "/teacherhub/home", icon: FiHome, label: "Home" },
    { path: "/teacherhub/dashboard", icon: FiBarChart2, label: "Dashboard" },
    { path: "/teacherhub/collaboration", icon: MdPeople, label: "Collaboration" }
  ];

  // Mobile navigation items
  const mobileNavItems = [
    { path: "/teacherhub/home", icon: FiHome, label: "Home" },
    { path: "/teacherhub/dashboard", icon: FiBarChart2, label: "Dashboard" },
    { path: "/teacherhub/collaboration", icon: MdPeople, label: "Collaboration" }
  ];

  // If no user, show loading
  if (!user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading your teacher dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Sidebar - Desktop only */}
      {!isMobile && (
        <aside
          style={{
            ...styles.sidebar,
            width: sidebarCollapsed ? '70px' : '260px',
          }}
        >
          <div style={styles.sidebarContent}>
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <div 
                  key={index}
                  style={{
                    ...styles.iconWrapper,
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  }}
                  onClick={() => handleNavigation(item.path)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <item.icon size={24} color="white" />
                  {!sidebarCollapsed && <span style={styles.iconText}>{item.label}</span>}
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* Main content */}
      <main
        style={{
          ...styles.main,
          marginLeft: !isMobile ? (sidebarCollapsed ? '70px' : '260px') : '0',
          transition: 'margin-left 0.3s ease',
        }}
      >
        {/* Header - Matching StudentHub exactly */}
        <header style={styles.header}>
          {/* Left section - Hamburger button */}
          <div style={styles.leftSection}>
            <button 
              className="hamburger-button"
              onClick={toggleSidebar} 
              style={styles.hamburgerButton}
              title={!isMobile ? (sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar") : "Menu"}
            >
              {!isMobile && sidebarCollapsed ? <FiMenu size={24} color="white" /> : 
               !isMobile && !sidebarCollapsed ? <FiX size={24} color="white" /> :
               <FiMenu size={24} color="white" />}
            </button>
          </div>

          {/* Right section - Profile (matches StudentHub exactly) */}
          <div style={styles.rightSection}>
            <div style={styles.profileContainer} ref={dropdownRef}>
              <div style={styles.profileContent} onClick={handleProfileClick}>
                {/* Name and XP Section */}
                <div style={styles.profileInfo}>
                  <span style={styles.teacherName}>
                    {getUserIdentifier()}
                  </span>
                  {getUserXP() > 0 && (
                    <span style={styles.xpPoints}>
                      ⭐ {getUserXP()} XP
                    </span>
                  )}
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
              
              {/* Profile Dropdown - Matches StudentHub exactly */}
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
                    {getUserXP() > 0 && (
                      <div style={styles.dropdownInfoItem}>
                        <span style={styles.infoLabel}>⭐ XP Points:</span>
                        <span style={styles.infoValue}>{getUserXP()} XP</span>
                      </div>
                    )}
                    <div style={styles.dropdownInfoItem}>
                      <span style={styles.infoLabel}>📚 Active Classes:</span>
                      <span style={styles.infoValue}>{teacherStats.activeClasses}</span>
                    </div>
                    <div style={styles.dropdownInfoItem}>
                      <span style={styles.infoLabel}>👥 Total Students:</span>
                      <span style={styles.infoValue}>{teacherStats.totalStudents}</span>
                    </div>
                    <div style={styles.dropdownInfoItem}>
                      <span style={styles.infoLabel}>🎓 Member since:</span>
                      <span style={styles.infoValue}>
                        {formatDate(teacherStats.memberSince || user?.createdAt || userData?.createdAt)}
                      </span>
                    </div>
                    {(userData?.lastLogin || teacherStats.lastLogin) && (
                      <div style={styles.dropdownInfoItem}>
                        <span style={styles.infoLabel}>🕒 Last login:</span>
                        <span style={styles.infoValue}>
                          {formatDate(teacherStats.lastLogin || user?.lastLogin || userData?.lastLogin)}
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

        {/* Mobile Dropdown Menu - Shows below header when hamburger clicked on mobile */}
        {isMobile && mobileMenuOpen && (
          <div ref={mobileMenuRef} style={styles.mobileDropdownMenu}>
            {mobileNavItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <div 
                  key={index}
                  style={{
                    ...styles.mobileMenuItem,
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                  }}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon size={20} color={isActive ? '#2563eb' : '#666'} />
                  <span style={{
                    ...styles.mobileMenuText,
                    color: isActive ? '#2563eb' : '#333',
                    fontWeight: isActive ? '600' : '500',
                  }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Content Area */}
        <div style={styles.contentWrapper}>
          <div style={styles.content}>
            <Outlet context={{ 
              user, 
              userData, 
              updateUserData, 
              getUserIdentifier,
              teacherStats,
              loadingStats
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
    backgroundColor: '#f5f5f5',
    overflowX: 'hidden',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '20px',
    backgroundColor: '#f5f5f5',
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
    transition: 'all 0.2s',
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
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
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
    marginLeft: 'auto',
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
  teacherName: {
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
  contentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
    marginTop: '70px',
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
  
  // Mobile Dropdown Menu Styles
  mobileDropdownMenu: {
    position: 'fixed',
    top: '70px',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 140,
    animation: 'slideDown 0.3s ease',
    borderBottom: '1px solid #e0e0e0',
  },
  mobileMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderBottom: '1px solid #f0f0f0',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  mobileMenuText: {
    fontSize: '16px',
    fontWeight: '500',
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
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
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
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
    background-color: #f5f5f5;
    margin: 0;
    padding: 0;
  }
`;
document.head.appendChild(styleSheet);

export default TeacherHub;