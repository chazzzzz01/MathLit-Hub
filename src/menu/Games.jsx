// src/menu/Games.jsx (or Game.jsx)
import React from 'react';
import { FaPlay, FaArrowLeft } from 'react-icons/fa';
import { GiPuzzle, GiSwordsEmblem, GiConsoleController } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';

function Games() {
  const navigate = useNavigate();

  const games = {
    equation: {
      id: 'equation',
      title: "Equation Escape Room",
      description: "Solve linear equations to escape each room! Master slope-intercept form, work with points, and tackle real-world word problems in this mathematical adventure.",
      shortDescription: "Solve equations to escape! Master slope-intercept and word problems.",
      icon: <GiPuzzle size={48} />,
      color: "#3b82f6",
      bgColor: "#dbeafe",
      difficulty: "Beginner to Advanced",
      timeEstimate: "15-20 min",
      features: ["4 Challenging Levels", "Timed Challenges", "Leaderboard Rankings", "Helpful Hints"],
      path: "/game/equation",
      buttonText: "Play Now"
    },
    battle: {
      id: 'battle',
      title: "Math Battle Arena",
      description: "Enter the arena and test your math skills in epic turn-based combat! Solve equations to attack, answer quickly to defend, and use power-ups to defeat increasingly difficult enemies.",
      shortDescription: "Epic turn-based combat! Solve equations to attack and defend.",
      icon: <GiSwordsEmblem size={48} />,
      color: "#8b5cf6",
      bgColor: "#ede9fe",
      difficulty: "Intermediate to Expert",
      timeEstimate: "20-30 min",
      features: ["Turn-based Combat", "Math Challenges", "Power-ups", "3 Enemy Waves", "Boss Battles"],
      path: "/game/battle",
      buttonText: "Play Now"
    },
    spaceShooter: {
      id: 'spaceShooter',
      title: "Math Space Shooter",
      description: "Defend your spaceship from incoming asteroids while solving math problems! Answer equations correctly to fire your weapons and destroy targets.",
      shortDescription: "Fast-paced action! Solve math problems to destroy asteroids.",
      icon: <GiConsoleController size={48} />,
      color: "#f59e0b",
      bgColor: "#fef3c7",
      difficulty: "Beginner to Intermediate",
      timeEstimate: "15-25 min",
      features: ["Fast-paced Action", "Math-based Weapons", "Upgrade System", "Multiple Enemy Types"],
      path: "/game/spaceshooter",
      buttonText: "Play Now"
    },
  };

  const handleStartGame = (gameId) => {
    const gamePath = games[gameId].path;
    // Open in new tab
    window.open(gamePath, '_blank');
    
    // Alternative: Open in same tab
    // navigate(gamePath);
  };

  const GameCard = ({ game, onStart }) => (
    <div style={styles.cardContainer} className="game-card">
      <div style={styles.cardContent}>
        <div style={styles.cardLeft}>
          <div style={{
            ...styles.cardIcon,
            backgroundColor: game.bgColor,
            color: game.color
          }}>
            {game.icon}
          </div>
          <div style={styles.cardText}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>{game.title}</h2>
              <span style={{
                ...styles.difficultyBadge,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
              }}>
                {game.difficulty}
              </span>
            </div>
            <p style={styles.cardDescription}>{game.description}</p>
            
            <div style={styles.featuresList}>
              {game.features.map((feature, index) => (
                <span key={index} style={styles.featureTag}>{feature}</span>
              ))}
            </div>
            
            <div style={styles.cardMeta}>
              <span style={styles.timeEstimate}>⏱️ {game.timeEstimate}</span>
            </div>
          </div>
        </div>
        
        <button 
          style={styles.startButton} 
          onClick={() => onStart(game.id)}
          className="start-button"
        >
          <FaPlay style={styles.playIcon} />
          {game.buttonText}
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>
          <GiConsoleController style={styles.titleIcon} />
          Math Games Arcade
        </h1>
        <p style={styles.subtitle}>Choose a game to start your mathematical adventure</p>
      </header>

      <ProgressDashboard />

      <div style={styles.gamesGrid}>
        {Object.values(games).map(game => (
          <GameCard 
            key={game.id} 
            game={game} 
            onStart={handleStartGame}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: 'clamp(12px, 4vw, 24px)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
    width: '100%',
    boxSizing: 'border-box',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '20px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    borderRadius: 'clamp(12px, 3vw, 24px)',
    color: 'white',
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
  },
  headerContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: 'clamp(24px, 8vw, 48px)',
    fontWeight: '700',
    margin: '0 0 clamp(8px, 2vw, 16px) 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'clamp(8px, 3vw, 16px)',
    flexWrap: 'wrap',
  },
  titleIcon: {
    fontSize: 'clamp(28px, 8vw, 56px)',
  },
  subtitle: {
    fontSize: 'clamp(14px, 4vw, 18px)',
    opacity: '0.95',
    margin: 0,
    lineHeight: 1.4,
  },
  dashboardContainer: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '30px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  dashboardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f3f4f6',
  },
  userInfoText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '5px 0 0 0',
  },
  dashboardIcon: {
    fontSize: '28px',
    color: '#3b82f6',
  },
  dashboardTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px',
  },
  statCard: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    transition: 'box-shadow 0.2s',
  },
  statCardIcon: {
    fontSize: '32px',
    color: '#3b82f6',
  },
  statCardInfo: {
    flex: 1,
  },
  statCardValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 1,
  },
  statCardLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '5px',
  },
  gameProgressSection: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '15px',
  },
  gameProgressList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  gameProgressItem: {
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  gameProgressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  gameProgressName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  gameProgressPercent: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6',
  },
  progressBarContainer: {
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressBar: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  gameStats: {
    display: 'flex',
    gap: '15px',
    fontSize: '12px',
    color: '#6b7280',
    flexWrap: 'wrap',
  },
  notPlayedText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  privacyNote: {
    marginTop: '20px',
    padding: '12px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#92400e',
  },
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
    gap: 'clamp(16px, 4vw, 24px)',
    width: '100%',
  },
  cardContainer: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(16px, 4vw, 24px)',
    height: '100%',
  },
  cardLeft: {
    display: 'flex',
    gap: 'clamp(12px, 4vw, 20px)',
    alignItems: 'flex-start',
    flex: 1,
  },
  cardIcon: {
    width: 'clamp(60px, 15vw, 80px)',
    height: 'clamp(60px, 15vw, 80px)',
    borderRadius: 'clamp(10px, 2.5vw, 16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'transform 0.3s ease',
  },
  cardText: {
    flex: 1,
    minWidth: 0, // Prevents overflow
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 'clamp(8px, 2vw, 12px)',
    flexWrap: 'wrap',
    gap: '8px',
  },
  cardTitle: {
    fontSize: 'clamp(18px, 5vw, 22px)',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    lineHeight: 1.3,
  },
  difficultyBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: 'clamp(10px, 3vw, 12px)',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  cardDescription: {
    fontSize: 'clamp(13px, 3.5vw, 14px)',
    color: '#6b7280',
    margin: '0 0 clamp(12px, 3vw, 16px) 0',
    lineHeight: '1.5',
  },
  featuresList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: 'clamp(12px, 3vw, 16px)',
  },
  featureTag: {
    background: '#f3f4f6',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: 'clamp(10px, 2.5vw, 11px)',
    color: '#4b5563',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  timeEstimate: {
    fontSize: 'clamp(11px, 3vw, 12px)',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  startButton: {
    width: '100%',
    padding: 'clamp(10px, 3vw, 14px)',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 'clamp(8px, 2vw, 12px)',
    fontSize: 'clamp(13px, 3.5vw, 15px)',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: 'auto',
  },
  playIcon: {
    fontSize: 'clamp(12px, 3vw, 14px)',
  },
};

// Add hover effect styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .game-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important;
  }
  
  .start-button:hover {
    opacity: 0.9;
    transform: scale(1.02);
  }
`;
document.head.appendChild(styleSheet);

export default Games;