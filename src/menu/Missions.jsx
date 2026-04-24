import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Mission1 from '../missions/mission1';
import Mission2 from '../missions/mission2';
import Mission3 from '../missions/mission3';
import Mission4 from '../missions/mission4';

function Missions() {
  const { user, userData, updateUserData } = useOutletContext();
  const [showMessage, setShowMessage] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [selectedMission, setSelectedMission] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const [localCompletedMissions, setLocalCompletedMissions] = useState([]);
  const [localTotalXP, setLocalTotalXP] = useState(0);
  const navigate = useNavigate();

  const messages = [
    "👋 Hey there! Ready for some missions?",
    "✨ You're doing amazing!",
    "🎯 Complete missions to earn XP!",
    "💪 Keep up the great work!",
    "🌟 You're on fire today!",
    "🌸 You got this!",
    "💖 Proud of your progress!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Sync local state with userData
  useEffect(() => {
    if (userData?.progress?.completedMissions) {
      setLocalCompletedMissions(userData.progress.completedMissions);
    }
    if (userData?.xp !== undefined) {
      setLocalTotalXP(userData.xp);
    }
  }, [userData]);

  const handleMissionClick = (missionId) => {
    // Check if mission is already completed
    if (localCompletedMissions.includes(missionId)) {
      setLockMessage(`You have already completed ${missions.find(m => m.id === missionId)?.title}!`);
      setShowLockModal(true);
      return;
    }
    
    // Check if mission is locked
    if (missionId === 2 && !isMission1Completed()) {
      setLockMessage("Complete Mission 1 (Linear Equations) first to unlock the Math Wizard challenge!");
      setShowLockModal(true);
      return;
    }
    if (missionId === 3 && !isMission2Completed()) {
      setLockMessage("Complete Mission 2 (Math Wizard) first to unlock the Slope and a Point mission!");
      setShowLockModal(true);
      return;
    }
    if (missionId === 4 && !isMission3Completed()) {
      setLockMessage("Complete Mission 3 (Slope and a Point) first to unlock the Slope and y-intercept mission!");
      setShowLockModal(true);
      return;
    }
    setSelectedMission(missionId);
  };

  const handleBackToMissions = () => {
    setSelectedMission(null);
    // Refresh local state when returning from mission
    if (userData?.progress?.completedMissions) {
      setLocalCompletedMissions(userData.progress.completedMissions);
    }
    if (userData?.xp !== undefined) {
      setLocalTotalXP(userData.xp);
    }
  };

  const closeLockModal = () => {
    setShowLockModal(false);
    setLockMessage("");
  };

  // Reset all progress function
  const handleResetProgress = () => {
    setShowResetConfirm(true);
  };

  const confirmResetProgress = () => {
    if (updateUserData) {
      // Reset user progress completely
      updateUserData({
        xp: 0,
        progress: {
          missionsCompleted: 0,
          completedMissions: [],
          lastMissionCompleted: null,
          totalXP: 0
        }
      });
      // Update local state immediately
      setLocalCompletedMissions([]);
      setLocalTotalXP(0);
    }
    setShowResetConfirm(false);
    setShowMessage(true);
    setMessageIndex(0);
    setTimeout(() => {
      alert("✅ Your progress has been reset successfully!");
    }, 100);
  };

  const cancelResetProgress = () => {
    setShowResetConfirm(false);
  };

  // Check mission completion status using local state
  const isMission1Completed = () => {
    return localCompletedMissions.includes(1);
  };

  const isMission2Completed = () => {
    return localCompletedMissions.includes(2);
  };

  const isMission3Completed = () => {
    return localCompletedMissions.includes(3);
  };

  const isMission4Completed = () => {
    return localCompletedMissions.includes(4);
  };

  const missions = [
    { id: 1, title: "Linear Equations", description: "Learn to find equation of a line using two points", xp: 100, locked: false },
    { id: 2, title: "Math Wizard", description: "Master linear equation concepts with 10 challenging questions", xp: 250, locked: !isMission1Completed() && !localCompletedMissions.includes(1) },
    { id: 3, title: "Slope and a Point", description: "Learn to find equation of a line using slope and a point", xp: 400, locked: !isMission2Completed() && !localCompletedMissions.includes(2) },
    { id: 4, title: "Slope and y-intercept", description: "Learn to find equation of a line using slope and y-intercept", xp: 500, locked: !isMission3Completed() && !localCompletedMissions.includes(3) },
  ];

  // Calculate total XP from completed missions
  const calculateTotalXP = () => {
    let total = 0;
    localCompletedMissions.forEach(missionId => {
      const mission = missions.find(m => m.id === missionId);
      if (mission) {
        total += mission.xp;
      }
    });
    return total;
  };

  const displayTotalXP = localTotalXP || calculateTotalXP();

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
      <Mission2 
        user={user}
        userData={userData}
        updateUserData={updateUserData}
        onComplete={handleBackToMissions}
      />
    );
  }

  if (selectedMission === 3) {
    return (
      <Mission3 
        user={user}
        userData={userData}
        updateUserData={updateUserData}
        onComplete={handleBackToMissions}
      />
    );
  }

  if (selectedMission === 4) {
    return (
      <Mission4 
        user={user}
        userData={userData}
        updateUserData={updateUserData}
        onComplete={handleBackToMissions}
      />
    );
  }

  return (
    <div style={styles.container}>
      {/* Lock Modal - Shows when trying to access locked or completed mission */}
      {showLockModal && (
        <div style={styles.modalOverlay} onClick={closeLockModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}>{lockMessage.includes("already completed") ? "✅" : "🔒"}</div>
            <h3 style={styles.modalTitle}>{lockMessage.includes("already completed") ? "Mission Already Completed!" : "Mission Locked!"}</h3>
            <p style={styles.modalText}>{lockMessage}</p>
            <div style={styles.modalButtons}>
              <button style={styles.modalCloseBtn} onClick={closeLockModal}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalIcon}>⚠️</div>
            <h3 style={styles.modalTitle}>Reset All Progress?</h3>
            <p style={styles.modalText}>
              This action will permanently erase all your mission progress, including:
            </p>
            <ul style={styles.modalList}>
              <li>✓ Completed missions</li>
              <li>✓ Earned XP points</li>
              <li>✓ Mission answers</li>
            </ul>
            <p style={styles.modalWarning}>This action cannot be undone!</p>
            <div style={styles.modalButtons}>
              <button style={styles.confirmResetBtn} onClick={confirmResetProgress}>
                Yes, Reset Everything
              </button>
              <button style={styles.cancelResetBtn} onClick={cancelResetProgress}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>🎯 Your Missions</h1>
          <p style={styles.subtitle}>
            Complete missions to earn XP and track your progress, {user?.name?.split(' ')[0] || 'Student'}!
          </p>
        </div>
        <button style={styles.resetProgressButton} onClick={handleResetProgress}>
          🔄 Reset Progress
        </button>
      </div>

      <div style={styles.missionsGrid}>
        {missions.map(mission => (
          <div
            key={mission.id}
            style={{
              ...styles.missionCard,
              ...(localCompletedMissions.includes(mission.id) ? styles.completedMission : {}),
              ...(mission.locked && !localCompletedMissions.includes(mission.id) ? styles.lockedMission : {})
            }}
          >
            <div style={styles.missionHeader}>
              <h3 style={styles.missionTitle}>
                {localCompletedMissions.includes(mission.id) && '✅ '}
                {mission.locked && !localCompletedMissions.includes(mission.id) && '🔒 '}
                {mission.title}
              </h3>
              <span style={styles.xpBadge}>+{mission.xp} XP</span>
            </div>

            <p style={styles.missionDescription}>{mission.description}</p>

            {localCompletedMissions.includes(mission.id) ? (
              <div style={styles.completedBadge}>✓ Completed</div>
            ) : (
              <button
                style={{
                  ...styles.completeButton,
                  ...(mission.locked ? styles.lockedButton : {})
                }}
                onClick={() => handleMissionClick(mission.id)}
                disabled={mission.locked}
              >
                {mission.locked ? '🔒 Locked' : 'Start Mission'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={styles.statsCard}>
        <h3 style={styles.statsTitle}>Your Progress</h3>
        <div style={styles.progressStats}>
          <div style={styles.statItem}>
            <span style={styles.statEmoji}>📋</span>
            <div>
              <p style={styles.statLabel}>Missions Completed</p>
              <p style={styles.statValue}>{localCompletedMissions.length} / {missions.length}</p>
            </div>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statEmoji}>⭐</span>
            <div>
              <p style={styles.statLabel}>Total XP Earned</p>
              <p style={styles.statValue}>{displayTotalXP} XP</p>
            </div>
          </div>
          {userData?.progress?.lastMissionCompleted && (
            <div style={styles.statItem}>
              <span style={styles.statEmoji}>📅</span>
              <div>
                <p style={styles.statLabel}>Last Mission</p>
                <p style={styles.statValue}>{new Date(userData.progress.lastMissionCompleted).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div style={styles.progressBarContainer}>
          <div style={styles.progressBarLabel}>
            <span>Overall Progress</span>
            <span>{Math.round((localCompletedMissions.length / missions.length) * 100)}%</span>
          </div>
          <div style={styles.progressBarTrack}>
            <div 
              style={{
                ...styles.progressBarFill,
                width: `${(localCompletedMissions.length / missions.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* FLOATING ASSISTANT on Right Side */}
      <div style={styles.avatarContainer}>
        <div style={styles.bubbleContainer}>
          {showMessage ? (
            <div style={styles.speechBubble}>
              <span style={styles.bubbleText}>{messages[messageIndex]}</span>
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
            alt="Learning Assistant"
            style={styles.avatarImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%232563eb'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
            }}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },

  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px',
    marginBottom: '20px',
  },

  title: {
    fontSize: '32px',
    color: '#333',
    marginBottom: '10px',
  },

  subtitle: {
    fontSize: '16px',
    color: '#666',
  },

  resetProgressButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  missionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },

  missionCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },

  completedMission: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #22c55e',
  },

  lockedMission: {
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    opacity: 0.8,
  },

  missionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },

  missionTitle: {
    fontSize: '20px',
    color: '#333',
    margin: 0,
  },

  xpBadge: {
    backgroundColor: '#f59e0b',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  },

  missionDescription: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '15px',
    lineHeight: '1.5',
  },

  completeButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    width: '100%',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },

  lockedButton: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
    opacity: 0.7,
  },

  completedBadge: {
    backgroundColor: '#22c55e',
    color: 'white',
    padding: '10px 20px',
    textAlign: 'center',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
  },

  statsCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },

  statsTitle: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '15px',
  },

  progressStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },

  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  statEmoji: {
    fontSize: '24px',
  },

  statLabel: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '2px',
  },

  statValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },

  progressBarContainer: {
    marginTop: '15px',
  },

  progressBarLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
  },

  progressBarTrack: {
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },

  // Avatar Assistant Styles
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
    marginBottom: '10px',
  },

  speechBubble: {
    backgroundColor: 'white',
    padding: '12px 15px',
    borderRadius: '18px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
    animation: 'bubblePop 0.3s ease-out',
    maxWidth: '220px',
    position: 'relative',
    border: '2px solid #2563eb',
  },

  bubbleText: {
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.4',
  },

  closeBubble: {
    marginLeft: '10px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: '12px',
    color: '#999',
    padding: '2px 5px',
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
    marginRight: '10px',
    marginBottom: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'all 0.2s',
  },

  avatarWrapper: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    overflow: 'hidden',
    animation: 'float 3s ease-in-out infinite',
    backgroundColor: '#f0f0f0',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    border: '3px solid white',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    animation: 'fadeIn 0.2s',
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '25px',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    animation: 'bounce 0.3s',
  },

  modalIcon: {
    fontSize: '48px',
    marginBottom: '10px',
  },

  modalTitle: {
    fontSize: '22px',
    marginBottom: '15px',
    color: '#ef4444',
  },

  modalText: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '15px',
    lineHeight: '1.5',
  },

  modalList: {
    textAlign: 'left',
    marginBottom: '15px',
    paddingLeft: '20px',
    color: '#666',
    fontSize: '13px',
  },

  modalWarning: {
    fontSize: '12px',
    color: '#ef4444',
    fontWeight: 'bold',
    marginBottom: '20px',
    padding: '8px',
    backgroundColor: '#fee2e2',
    borderRadius: '8px',
  },

  modalButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
  },

  modalCloseBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '10px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },

  confirmResetBtn: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },

  cancelResetBtn: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
};

// Add animations to document
const styleSheet = document.createElement("style");
styleSheet.innerHTML = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
  }

  @keyframes bubblePop {
    0% { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes bounce {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }

  button:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    transition: all 0.2s;
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  .missionCard:hover:not(.lockedMission) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .avatarWrapper:hover {
    transform: scale(1.05);
  }

  .resetProgressButton:hover {
    background-color: #dc2626;
  }

  .confirmResetBtn:hover {
    background-color: #dc2626;
  }

  .cancelResetBtn:hover {
    background-color: #5a6268;
  }

  .modalCloseBtn:hover {
    background-color: #1e4db9;
  }
`;

// Only add styleSheet if it doesn't already exist
if (!document.querySelector('#missions-styles')) {
  styleSheet.id = 'missions-styles';
  document.head.appendChild(styleSheet);
}

export default Missions;