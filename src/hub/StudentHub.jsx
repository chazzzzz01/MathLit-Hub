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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

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
      setUser(location.state.user);
    }
  }, [location.state, user, setUser]);

  // Redirect to homepage if at exactly /studenthub
  useEffect(() => {
    if (location.pathname === '/studenthub') {
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
    setUser(null);
    navigate("/");
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setOpenDropdown(null);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const navItems = [
    { path: "/studenthub/homepage", icon: AiFillHome, label: "Home" },
    { path: "/studenthub/missions", icon: MdAssignment, label: "Missions" },
    { path: "/studenthub/games", icon: IoGameController, label: "Games" },
    { path: "/studenthub/achievement", icon: GiAchievement, label: "Achievement" }
  ];

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
            {navItems.map((item, index) => (
              <div 
                key={index}
                style={styles.iconWrapper}
                onClick={() => handleNavigation(item.path)}
              >
                <item.icon size={24} color="white" />
                {!sidebarCollapsed && <span style={styles.iconText}>{item.label}</span>}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div style={styles.mobileOverlay} onClick={() => setMobileMenuOpen(false)}>
          <div style={styles.mobileSidebar} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mobileSidebarHeader}>
              <div style={styles.mobileLogo}>MathLit Hub</div>
              <button 
                style={styles.mobileCloseButton}
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiX size={24} color="#2563EB" />
              </button>
            </div>
            <div style={styles.mobileNavItems}>
              {navItems.map((item, index) => (
                <div 
                  key={index}
                  style={styles.mobileNavItem}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon size={22} color="#2563EB" />
                  <span style={styles.mobileNavText}>{item.label}</span>
                </div>
              ))}
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

          {/* Right side - Student name and profile icon */}
          <div style={styles.rightSection}>
            <span style={styles.studentName}>
              {user ? user.name.split(' ')[0] : 'Student'}
            </span>
            
            {/* Profile icon with dropdown */}
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

        {/* Content Area - Uses Outlet for nested routes */}
        <div style={styles.contentWrapper}>
          <div style={styles.content}>
            <Outlet />
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
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    minWidth: '220px',
    zIndex: 1000,
    animation: 'slideDown 0.2s ease',
  },
  dropdownEmail: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#333',
    backgroundColor: '#f8f9fa',
    wordBreak: 'break-all',
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
    .student-name {
      font-size: 14px;
    }
  }
  
  @media (max-width: 480px) {
    .student-name {
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

export default StudentHub;