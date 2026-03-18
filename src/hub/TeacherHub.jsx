import '../App.css';  // Changed from './App.css' to '../App.css'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiFillHome } from 'react-icons/ai'; // Home icon
import { FiPlus, FiUser } from 'react-icons/fi'; // Plus and Profile icons

function TeacherHub() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'plus' or 'profile' or null
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    navigate("/"); // go back to Get Started
    setOpenDropdown(null);
  };

  const handleHome = () => {
    navigate("/homepage");
    setOpenDropdown(null);
  };

  const handleStudentHub = () => {
    navigate("/studenthub");
    setOpenDropdown(null);
  };

  const handleTeacherHub = () => {
    navigate("/teacherhub");
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
        <div style={styles.iconWrapper} onClick={handleHome}>
          <AiFillHome size={24} color="white" />
          {!sidebarCollapsed && <span style={styles.iconText}>Home</span>}
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

          {/* Right side icons */}
          <div style={styles.rightIcons}>
            {/* Plus icon */}
            <div style={{ position: 'relative', marginRight: '15px' }}>
              <FiPlus
                size={24}
                color="white"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  setOpenDropdown(openDropdown === 'plus' ? null : 'plus')
                }
              />
              {openDropdown === 'plus' && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownItem} onClick={handleStudentHub}>
                    Student Hub
                  </div>
                  <div style={styles.dropdownItem} onClick={handleTeacherHub}>
                    Teacher Hub
                  </div>
                </div>
              )}
            </div>

            {/* Profile icon */}
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

        {/* Student Hub Content */}
        <div style={styles.content}>
          <h1>Teacher Hub</h1>
          <p>Welcome to the Teacher Hub! This is where students can access their learning materials.</p>
          
          {/* Add your student-specific content here */}
          <div style={styles.cardContainer}>
            <div style={styles.card}>
              <h3>My Courses</h3>
              <p>View your enrolled courses</p>
            </div>
            <div style={styles.card}>
              <h3>Assignments</h3>
              <p>Check pending assignments</p>
            </div>
            <div style={styles.card}>
              <h3>Grades</h3>
              <p>View your academic progress</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    height: '100vh',
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
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    cursor: 'pointer',
    width: '100%',
  },
  iconText: {
    marginLeft: '10px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '500',
  },
  main: {
    flex: 1,
    transition: 'margin-left 0.3s ease',
    paddingTop: '60px', // Add padding to account for fixed header
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
  rightIcons: {
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
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
  },
  dropdownItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
  },
  content: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
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
  },
};

export default TeacherHub;