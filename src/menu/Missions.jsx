import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Mission1 from '../missions/mission1';

function Missions() {
  const { user, userData, updateUserData } = useOutletContext();
  const [showMessage, setShowMessage] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [selectedMission, setSelectedMission] = useState(null);
  const navigate = useNavigate();

  const messages = [
    "👋 Hey there! Ready for some missions?",
    "✨ You're doing amazing!",
    "🎯 Complete missions to earn XP!",
    "💪 Keep up the great work!",
    "🌟 You're on fire today!",
    "🌸 You got this, girl!",
    "💖 Proud of your progress!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMissionClick = (missionId) => {
    setSelectedMission(missionId);
  };

  const handleBackToMissions = () => {
    setSelectedMission(null);
  };

  const missions = [
    { id: 1, title: "First Steps", description: "Complete your first lesson", xp: 100 },
    { id: 2, title: "Math Wizard", description: "Solve 10 equations correctly", xp: 250 },
    { id: 3, title: "Game Master", description: "Play 3 games", xp: 150 },
  ];

  const completedMissions = userData?.progress?.completedMissions || [];

  // If a mission is selected, show the mission component
  if (selectedMission === 1) {
    return (
      <Mission1 
        user={user}
        userData={userData}
        updateUserData={updateUserData}
        onComplete={handleBackToMissions}
      />
    );
  }

  if (selectedMission === 2) {
    return (
      <div style={styles.comingSoon}>
        <h2>🚀 Mission 2 Coming Soon!</h2>
        <p>Math Wizard mission is under development.</p>
        <button onClick={handleBackToMissions} style={styles.backButton}>
          ← Back to Missions
        </button>
      </div>
    );
  }

  if (selectedMission === 3) {
    return (
      <div style={styles.comingSoon}>
        <h2>🎮 Mission 3 Coming Soon!</h2>
        <p>Game Master mission is under development.</p>
        <button onClick={handleBackToMissions} style={styles.backButton}>
          ← Back to Missions
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎯 Your Missions</h1>
      <p style={styles.subtitle}>
        Complete missions to earn XP and track your progress, {user?.name?.split(' ')[0]}!
      </p>

      <div style={styles.missionsGrid}>
        {missions.map(mission => (
          <div
            key={mission.id}
            style={{
              ...styles.missionCard,
              ...(completedMissions.includes(mission.id) ? styles.completedMission : {})
            }}
          >
            <div style={styles.missionHeader}>
              <h3 style={styles.missionTitle}>{mission.title}</h3>
              <span style={styles.xpBadge}>+{mission.xp} XP</span>
            </div>

            <p style={styles.missionDescription}>{mission.description}</p>

            {completedMissions.includes(mission.id) ? (
              <div style={styles.completedBadge}>✓ Completed</div>
            ) : (
              <button
                style={styles.completeButton}
                onClick={() => handleMissionClick(mission.id)}
              >
                Start Mission
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={styles.statsCard}>
        <h3 style={styles.statsTitle}>Your Progress</h3>
        <p style={styles.statsText}>
          Missions Completed: {userData?.progress?.missionsCompleted || 0}
        </p>
        <p style={styles.statsText}>
          Total XP: {(userData?.progress?.missionsCompleted || 0) * 100}
        </p>
        {userData?.progress?.lastMissionCompleted && (
          <p style={styles.statsText}>
            Last Mission: {new Date(userData.progress.lastMissionCompleted).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* ✅ FLOATING ASSISTANT */}
      <div style={styles.avatarContainer}>
        <div style={styles.bubbleContainer}>
          {showMessage ? (
            <div style={styles.speechBubble}>
              {messages[messageIndex]}
              <button onClick={() => setShowMessage(false)} style={styles.closeBubble}>
                ✕
              </button>
            </div>
          ) : (
            <button onClick={() => setShowMessage(true)} style={styles.reopenBubble}>
              💬
            </button>
          )}
        </div>

        <div style={styles.avatarWrapper}>
          <img
            src="/avatar_happy.jpg"
            alt="assistant"
            style={styles.avatarImage}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '15px',
    minHeight: '100vh',
  },

  title: {
    fontSize: '28px',
    color: '#333',
  },

  subtitle: {
    color: '#666',
    marginBottom: '20px',
  },

  missionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '15px',
  },

  missionCard: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },

  completedMission: {
    backgroundColor: '#f0f7ff',
    border: '1px solid #2563eb',
  },

  missionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
  },

  missionTitle: {
    fontSize: '18px',
  },

  xpBadge: {
    backgroundColor: '#f59e0b',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
  },

  missionDescription: {
    color: '#666',
  },

  completeButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '10px',
    border: 'none',
    borderRadius: '4px',
    width: '100%',
    cursor: 'pointer',
  },

  completedBadge: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '10px',
    textAlign: 'center',
    borderRadius: '4px',
  },

  statsCard: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
  },

  statsTitle: {
    marginBottom: '10px',
  },

  statsText: {
    color: '#666',
  },

  comingSoon: {
    textAlign: 'center',
    padding: '50px',
    backgroundColor: 'white',
    borderRadius: '16px',
    margin: '50px auto',
    maxWidth: '500px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },

  backButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px',
  },

  avatarContainer: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 1000,
  },

  bubbleContainer: {
    marginRight: '10px',
    marginBottom: '20px',
  },

  speechBubble: {
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '15px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    animation: 'bubblePop 0.3s',
    maxWidth: '200px',
    position: 'relative',
    bottom: '10px',
  },

  closeBubble: {
    marginLeft: '10px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: '14px',
  },

  reopenBubble: {
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    fontSize: '20px',
    position: 'relative',
    bottom: '10px',
  },

  avatarWrapper: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    overflow: 'hidden',
    animation: 'float 3s ease-in-out infinite',
    backgroundColor: 'transparent',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
};

// Add animations to document
const styleSheet = document.createElement("style");
styleSheet.innerHTML = `
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

@keyframes bubblePop {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  transition: all 0.2s;
}

button:active {
  transform: translateY(0);
}
`;
document.head.appendChild(styleSheet);

export default Missions;