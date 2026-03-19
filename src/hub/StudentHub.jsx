import '../App.css';
import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AiFillHome } from 'react-icons/ai';
import { FiUser } from 'react-icons/fi';
import { GiAchievement } from 'react-icons/gi';
import { IoGameController } from 'react-icons/io5';
import { MdAssignment } from 'react-icons/md';

function StudentHub() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to homepage if at exactly /studenthub
  useEffect(() => {
    if (location.pathname === '/studenthub') {
      navigate('/studenthub/homepage', { replace: true });
    }
  }, [location.pathname, navigate]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    navigate("/");
    setOpenDropdown(null);
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
      <aside
        style={{
          ...styles.sidebar,
          width: sidebarCollapsed ? '60px' : '220px',
        }}
      >
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
          {/* Hamburger fixed top-left */}
          <div style={styles.hamburger} onClick={toggleSidebar}>
            <div style={styles.bar}></div>
            <div style={styles.bar}></div>
            <div style={styles.bar}></div>
          </div>

          {/* Right side - Student name and profile icon */}
          <div style={styles.rightSection}>
            <span style={styles.studentName}>Student</span>
            
            {/* Profile icon with dropdown */}
            <div style={{ position: 'relative' }}>
              <FiUser
                size={24}
                color="white"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  setOpenDropdown(openDropdown === 'profile' ? null : 'profile')
                }
              />
              {openDropdown === 'profile' && (
                <div style={styles.dropdown}>
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
    transition: 'background-color 0.2s',
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
  dropdown: {
    position: 'absolute',
    top: '30px',
    right: 0,
    backgroundColor: 'white',
    color: 'black',
    borderRadius: '5px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    minWidth: '120px',
    zIndex: 1000,
  },
  dropdownItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f0f0f0',
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
    // This ensures the content area expands with its children
    display: 'flex',
    flexDirection: 'column',
  },
  // These styles are for the page components that will be rendered in Outlet
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

// Add this CSS to your App.css or global styles file
const globalStyles = `
  /* Ensure all page components take full height */
  .page-content {
    min-height: 100%;
    background-color: #f5f5f5;
    padding: 20px;
  }
  
  /* Make sure the Outlet container expands */
  .outlet-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  /* Ensure all direct children of Outlet take full height */
  .outlet-container > * {
    flex: 1;
    background-color: #f5f5f5;
  }
`;

export default StudentHub;