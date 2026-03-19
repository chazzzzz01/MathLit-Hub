// src/menu/Missions.jsx
import React, { useState } from 'react';
import { FaPlay, FaArrowLeft } from 'react-icons/fa';
import { GiSecretBook, GiPuzzle } from 'react-icons/gi';
import FirstMission from '../missions/firstmission.jsx';

function Missions() {
  const [activeMission, setActiveMission] = useState(null);

  const missions = {
    first: {
      id: 'first',
      title: "The Point Portal",
      description: "Two points hold the key to the first lock. Find their relationship! Learn the fundamentals of slope-intercept form.",
      icon: <GiSecretBook size={48} />,
      color: "#3b82f6",
      bgColor: "#dbeafe",
      difficulty: "Beginner",
      timeEstimate: "5-10 min",
      skills: ["Slope Calculation", "Y-Intercept", "Linear Equations"],
      component: FirstMission
    },
    // You can add more missions here later
    second: {
      id: 'second',
      title: "Slope-Intercept Chamber",
      description: "A slope and a point guide the way. Write the equation to proceed!",
      icon: <GiPuzzle size={48} />,
      color: "#8b5cf6",
      bgColor: "#ede9fe",
      difficulty: "Intermediate",
      timeEstimate: "10-15 min",
      skills: ["Point-Slope Form", "Equation Writing"],
      component: null // Add component when created
    },
    third: {
      id: 'third',
      title: "Real-World Riddle",
      description: "Decode real-life situations to find mathematical patterns!",
      icon: <GiPuzzle size={48} />,
      color: "#10b981",
      bgColor: "#d1fae5",
      difficulty: "Advanced",
      timeEstimate: "15-20 min",
      skills: ["Word Problems", "Application"],
      component: null // Add component when created
    }
  };

  const MissionCard = ({ mission, onStart }) => (
    <div style={styles.cardContainer}>
      <div style={styles.cardContent}>
        <div style={styles.cardLeft}>
          <div style={{
            ...styles.cardIcon,
            backgroundColor: mission.bgColor,
            color: mission.color
          }}>
            {mission.icon}
          </div>
          <div style={styles.cardText}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>{mission.title}</h2>
              <span style={{
                ...styles.difficultyBadge,
                backgroundColor: 
                  mission.difficulty === 'Beginner' ? '#10b981' :
                  mission.difficulty === 'Intermediate' ? '#f59e0b' : '#ef4444'
              }}>
                {mission.difficulty}
              </span>
            </div>
            <p style={styles.cardDescription}>{mission.description}</p>
            
            <div style={styles.skillsList}>
              {mission.skills.map((skill, index) => (
                <span key={index} style={styles.skillTag}>{skill}</span>
              ))}
            </div>
            
            <div style={styles.cardMeta}>
              <span style={styles.timeEstimate}>⏱️ {mission.timeEstimate}</span>
            </div>
          </div>
        </div>
        
        <button 
          style={styles.startButton} 
          onClick={() => onStart(mission.id)}
          disabled={!mission.component}
          className={!mission.component ? 'disabled' : ''}
        >
          <FaPlay style={styles.playIcon} />
          {mission.component ? 'Start Mission' : 'Coming Soon'}
        </button>
      </div>
    </div>
  );

  const MissionDetail = ({ mission, onBack }) => {
    const MissionComponent = mission.component;
    return (
      <div style={styles.missionDetail}>
        <button style={styles.backButton} onClick={onBack}>
          <FaArrowLeft /> Back to Missions
        </button>
        <MissionComponent />
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>
          <GiSecretBook style={styles.titleIcon} />
          Math Missions
        </h1>
        <p style={styles.subtitle}>Choose a mission to start your mathematical journey</p>
      </header>

      {!activeMission ? (
        <div style={styles.missionsGrid}>
          {Object.values(missions).map(mission => (
            <MissionCard 
              key={mission.id} 
              mission={mission} 
              onStart={(id) => setActiveMission(id)}
            />
          ))}
        </div>
      ) : (
        <MissionDetail 
          mission={missions[activeMission]} 
          onBack={() => setActiveMission(null)}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    borderRadius: '16px',
    color: 'white',
  },
  title: {
    fontSize: '42px',
    fontWeight: '700',
    margin: '0 0 10px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  titleIcon: {
    fontSize: '48px',
  },
  subtitle: {
    fontSize: '18px',
    opacity: '0.9',
    margin: 0,
  },
  missionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  cardContainer: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
    },
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  cardLeft: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  difficultyBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  cardDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 12px 0',
    lineHeight: '1.5',
  },
  skillsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '12px',
  },
  skillTag: {
    background: '#f3f4f6',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#4b5563',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  timeEstimate: {
    fontSize: '12px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  startButton: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    ':hover': {
      opacity: '0.9',
    },
    ':disabled': {
      background: '#9ca3af',
      cursor: 'not-allowed',
    },
  },
  playIcon: {
    fontSize: '12px',
  },
  missionDetail: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    fontSize: '15px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    marginBottom: '20px',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f3f4f6',
    },
  },
};

// Add hover effect styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .playButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  }
  
  .disabled {
    opacity: 0.7;
    cursor: not-allowed !important;
  }
  
  .disabled:hover {
    opacity: 0.7;
    transform: none;
  }
`;
document.head.appendChild(styleSheet);

export default Missions;