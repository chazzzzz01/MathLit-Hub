import React from 'react';
import { useOutletContext } from 'react-router-dom';

function Missions() {
  const { user, userData, updateUserData } = useOutletContext();

  const completeMission = (missionId) => {
    if (updateUserData) {
      const currentProgress = userData?.progress || {};
      const completedMissions = currentProgress.completedMissions || [];
      
      if (!completedMissions.includes(missionId)) {
        updateUserData({
          progress: {
            ...currentProgress,
            missionsCompleted: (currentProgress.missionsCompleted || 0) + 1,
            completedMissions: [...completedMissions, missionId],
            lastMissionCompleted: new Date().toISOString()
          }
        });
        alert(`Mission completed! Great job, ${user?.name?.split(' ')[0]}!`);
      } else {
        alert('You already completed this mission!');
      }
    }
  };

  const missions = [
    { id: 1, title: "First Steps", description: "Complete your first lesson", xp: 100 },
    { id: 2, title: "Math Wizard", description: "Solve 10 equations correctly", xp: 250 },
    { id: 3, title: "Game Master", description: "Play 3 games", xp: 150 },
  ];

  const completedMissions = userData?.progress?.completedMissions || [];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎯 Your Missions</h1>
      <p style={styles.subtitle}>Complete missions to earn XP and track your progress, {user?.name?.split(' ')[0]}!</p>
      
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
                onClick={() => completeMission(mission.id)}
              >
                Complete Mission
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={styles.statsCard}>
        <h3>Your Progress</h3>
        <p>Missions Completed: {userData?.progress?.missionsCompleted || 0}</p>
        <p>Total XP: {(userData?.progress?.missionsCompleted || 0) * 100}</p>
        {userData?.progress?.lastMissionCompleted && (
          <p>Last Mission: {new Date(userData.progress.lastMissionCompleted).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    fontSize: '32px',
    color: '#333',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
  },
  missionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  missionCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
    },
  },
  completedMission: {
    backgroundColor: '#f0f7ff',
    border: '1px solid #2563eb',
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
  },
  xpBadge: {
    backgroundColor: '#f59e0b',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  missionDescription: {
    color: '#666',
    marginBottom: '15px',
  },
  completeButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    ':hover': {
      backgroundColor: '#1d4ed8',
    },
  },
  completedBadge: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
};

export default Missions;