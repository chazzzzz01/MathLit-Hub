// src/menu/Games.jsx (or Game.jsx)
import React from 'react';
import { FaPlay, FaArrowLeft } from 'react-icons/fa';
import { GiPuzzle, GiSwordsEmblem, GiConsoleController } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';

function Games() {
  const navigate = useNavigate();

  const games = {
    equation: {
      id: 'equation',
      title: "Equation Escape Room",
      description: "Solve linear equations to escape each room! Master slope-intercept form, work with points, and tackle real-world word problems in this mathematical adventure.",
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
      icon: <GiSwordsEmblem size={48} />,
      color: "#8b5cf6",
      bgColor: "#ede9fe",
      difficulty: "Intermediate to Expert",
      timeEstimate: "20-30 min",
      features: ["Turn-based Combat", "Math Challenges", "Power-ups", "10 Enemy Waves", "Boss Battles"],
      path: "/game/battle",
      buttonText: "Play Now"
    },
    spaceShooter: {
      id: 'spaceShooter',
      title: "Math Space Shooter",
      description: "Defend your spaceship from incoming asteroids while solving math problems! Answer equations correctly to fire your weapons and destroy targets.",
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
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '20px',
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
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '8px',
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
  featuresList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '12px',
  },
  featureTag: {
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
  },
  playIcon: {
    fontSize: '12px',
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