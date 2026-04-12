import '../App.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { FiUser, FiMenu, FiX, FiHome, FiBarChart2, FiChevronDown, FiEdit2 } from 'react-icons/fi';
import { MdPeople, MdTrendingUp } from 'react-icons/md';
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

  // Redirect to home if at exactly /teacherhub
  useEffect(() => {
    if (location.pathname === '/teacherhub') {
      console.log('Redirecting to home');
      navigate('/teacherhub/home', { replace: true });
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
    logout();
    navigate("/");
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path) => {
    console.log('Navigating to:', path);
    navigate(path);
    setOpenDropdown(null);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
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
    { path: "/teacherhub/students", icon: MdPeople, label: "Students" },
    { path: "/teacherhub/progress", icon: MdTrendingUp, label: "Progress" }
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
      {/* Sidebar - Desktop */}
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
                >
                  <item.icon size={24} color="white" />
                  {!sidebarCollapsed && <span style={styles.iconText}>{item.label}</span>}
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div style={styles.mobileOverlay} onClick={() => setMobileMenuOpen(false)}>
          <div style={styles.mobileSidebar} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mobileSidebarHeader}>
              <div style={styles.mobileLogo}>MathLit Teacher Hub</div>
              <button 
                style={styles.mobileCloseButton}
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiX size={24} color="#2563EB" />
              </button>
            </div>
            <div style={styles.mobileNavItems}>
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <div 
                    key={index}
                    style={{
                      ...styles.mobileNavItem,
                      backgroundColor: isActive ? '#f0f7ff' : 'transparent',
                    }}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <item.icon size={22} color={isActive ? "#2563EB" : "#6b7280"} />
                    <span style={{
                      ...styles.mobileNavText,
                      color: isActive ? '#2563EB' : '#333',
                      fontWeight: isActive ? '600' : '500'
                    }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
              <div style={styles.mobileDivider}></div>
              <div 
                style={styles.mobileNavItem}
                onClick={handleLogout}
              >
                <FiUser size={22} color="#dc2626" />
                <span style={{...styles.mobileNavText, color: '#dc2626'}}>Logout</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
          {/* Hamburger Menu Button */}
          <button style={styles.hamburgerButton} onClick={toggleSidebar}>
            <FiMenu size={24} color="white" />
          </button>

          {/* Right section - Teacher name and profile icon */}
          <div style={styles.rightSection}>
            <div style={styles.profileContainer} ref={dropdownRef}>
              <div style={styles.profileContent} onClick={handleProfileClick}>
                <span style={styles.teacherName}>
                  {getUserIdentifier()}
                </span>
                <FiChevronDown 
                  size={18} 
                  color="white" 
                  style={{
                    ...styles.chevronIcon,
                    transform: openDropdown === 'profile' ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
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
                  
                  {/* Account Information Section */}
                  <div style={styles.dropdownSection}>
                    <div style={styles.dropdownSectionTitle}>Account Information</div>
                    
                    {/* Username with Edit */}
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
                    
                    {/* Member Since */}
                    <div style={styles.dropdownInfoItem}>
                      <span style={styles.infoLabel}>🎓 Member since:</span>
                      <span style={styles.infoValue}>
                        {formatDate(teacherStats.memberSince || user?.createdAt || userData?.createdAt)}
                      </span>
                    </div>
                    
                    {/* Last Login */}
                    <div style={styles.dropdownInfoItem}>
                      <span style={styles.infoLabel}>🕒 Last login:</span>
                      <span style={styles.infoValue}>
                        {formatDate(teacherStats.lastLogin || user?.lastLogin || userData?.lastLogin)}
                      </span>
                    </div>
                    
                    {/* Teacher Statistics */}
                    <div style={styles.dropdownStatsSection}>
                      <div style={styles.dropdownSectionTitle}>Teaching Statistics</div>
                      <div style={styles.dropdownInfoItem}>
                        <span style={styles.infoLabel}>📚 Active Classes:</span>
                        <span style={styles.infoValue}>{teacherStats.activeClasses}</span>
                      </div>
                      <div style={styles.dropdownInfoItem}>
                        <span style={styles.infoLabel}>👥 Total Students:</span>
                        <span style={styles.infoValue}>{teacherStats.totalStudents}</span>
                      </div>
                    </div>
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

        {/* Content Area - Uses Outlet for nested routes */}
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
    transition: 'all 0.2s',
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
  teacherName: {
    color: 'white',
    fontSize: 'clamp(14px, 4vw, 16px)',
    fontWeight: '500',
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
    fontSize: '11px',
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
  dropdownStatsSection: {
    marginTop: '8px',
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
    boxSizing: 'border-box',
  },
  
  // Mobile Menu Styles
  mobileOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease',
  },
  mobileSidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '280px',
    height: '100vh',
    backgroundColor: 'white',
    boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
    animation: 'slideInLeft 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
  },
  mobileSidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  mobileLogo: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#2563EB',
  },
  mobileCloseButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  mobileNavItems: {
    flex: 1,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  mobileNavItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f0f7ff',
      transform: 'translateX(4px)',
    },
  },
  mobileNavText: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#333',
  },
  mobileDivider: {
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '12px 0',
  },
};

// Add animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes slideInLeft {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
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
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .teacher-name {
      font-size: 14px;
    }
  }
  
  @media (max-width: 480px) {
    .teacher-name {
      display: none;
    }
    
    .content {
      padding: 12px;
    }
  }
  
  /* Better touch targets for mobile */
  @media (max-width: 768px) {
    button, [role="button"], .mobile-nav-item {
      min-height: 44px;
    }
  }
  
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
`;
document.head.appendChild(styleSheet);

export default TeacherHub;