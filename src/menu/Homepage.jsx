import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { AiFillHome } from 'react-icons/ai';

function Homepage() {
  // Get user data from context
  const { user, userData, updateUserData, getUserIdentifier } = useOutletContext();

  // This is a personalized message that only the current user can see
  const getPersonalizedMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <AiFillHome size={80} color="#2563eb" style={styles.icon} />
        
        {/* Personalized welcome message */}
        <h1 style={styles.title}>
          {getPersonalizedMessage()}, {user?.name?.split(' ')[0] || getUserIdentifier()}! 👋
        </h1>
        
        <p style={styles.subtitle}>
          Welcome to your personal learning space, {user?.email}
        </p>
        
        {/* User Stats Card - Personal to this user */}
        <div style={styles.statsCard}>
          <h3 style={styles.statsTitle}>📊 Your Stats</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{userData?.gameStats?.gamesPlayed || 0}</div>
              <div style={styles.statLabel}>Games Played</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{userData?.achievements?.length || 0}</div>
              <div style={styles.statLabel}>Achievements</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>{userData?.progress?.missionsCompleted || 0}</div>
              <div style={styles.statLabel}>Missions Done</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statValue}>
                {new Date(userData?.createdAt).toLocaleDateString() || 'Today'}
              </div>
              <div style={styles.statLabel}>Member Since</div>
            </div>
          </div>
        </div>

        <div style={styles.cardContainer}>
          <div style={styles.card}>
            <h3>📚 Recent Activity</h3>
            <p>Your last login: {new Date(userData?.lastLogin).toLocaleString()}</p>
            <p style={styles.smallText}>Only you can see this information</p>
          </div>
          
          <div style={styles.card}>
            <h3>🏆 Your Progress</h3>
            <p>Keep up the great work, {user?.name?.split(' ')[0] || 'Student'}!</p>
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progressFill,
                width: `${Math.min(100, ((userData?.achievements?.length || 0) / 10) * 100)}%`
              }}></div>
            </div>
            <p style={styles.smallText}>{userData?.achievements?.length || 0}/10 achievements</p>
          </div>
          
          <div style={styles.card}>
            <h3>⚙️ Your Settings</h3>
            <p>Customize your learning experience</p>
            <button 
              style={styles.smallButton}
              onClick={() => {
                if (updateUserData) {
                  updateUserData({
                    settings: {
                      ...userData?.settings,
                      lastVisited: new Date().toISOString()
                    }
                  });
                  alert('Settings updated! This is saved only for your account.');
                }
              }}
            >
              Update Preferences
            </button>
          </div>
        </div>

        <div style={styles.note}>
          <p>🔒 This is your personal space. Your data is private and only accessible by you.</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '10vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  content: {
    textAlign: 'center',
    maxWidth: '1000px',
    width: '100%',
  },
  icon: {
    marginBottom: '20px',
    animation: 'bounce 2s infinite',
  },
  title: {
    fontSize: '36px',
    color: '#333',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '30px',
  },
  statsCard: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '30px',
    color: 'white',
  },
  statsTitle: {
    fontSize: '20px',
    marginBottom: '15px',
    textAlign: 'center',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '20px',
  },
  statItem: {
    textAlign: 'center',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '12px',
    opacity: 0.9,
  },
  cardContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    textAlign: 'left',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    },
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '10px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    transition: 'width 0.3s ease',
  },
  smallText: {
    fontSize: '12px',
    color: '#999',
    marginTop: '8px',
  },
  smallButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
    fontSize: '12px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#1d4ed8',
    },
  },
  note: {
    marginTop: '30px',
    padding: '15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    color: '#856404',
    fontSize: '14px',
  },
};

// Add keyframes for bounce animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;
document.head.appendChild(styleSheet);

export default Homepage;