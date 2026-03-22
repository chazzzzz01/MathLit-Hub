// src/menu/Games.jsx (or Game.jsx)
import React, { useState, useEffect } from 'react';
import { FaPlay, FaArrowLeft, FaClock, FaStar, FaGamepad } from 'react-icons/fa';
import { GiPuzzle, GiSwordsEmblem, GiConsoleController } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';

function Games() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      features: ["Turn-based Combat", "Math Challenges", "Power-ups", "10 Enemy Waves", "Boss Battles"],
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
    window.open(gamePath, '_blank');
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
                background: `linear-gradient(135deg, ${game.color} 0%, ${game.color}cc 100%)`
              }}>
                {game.difficulty}
              </span>
            </div>
            <p style={styles.cardDescription}>
              {isMobile ? game.shortDescription : game.description}
            </p>
            
            <div style={styles.featuresList}>
              {game.features.slice(0, isMobile ? 2 : 4).map((feature, index) => (
                <span key={index} style={styles.featureTag}>{feature}</span>
              ))}
            </div>
            
            <div style={styles.cardMeta}>
              <span style={styles.timeEstimate}>
                <FaClock style={styles.metaIcon} />
                {game.timeEstimate}
              </span>
              <span style={styles.difficultyTag}>
                <FaStar style={styles.metaIcon} />
                {game.difficulty.split(' ')[0]}
              </span>
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
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            <FaGamepad style={styles.titleIcon} />
            Math Games Arcade
          </h1>
          <p style={styles.subtitle}>Choose a game to start your mathematical adventure</p>
        </div>
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
    maxWidth: '1400px',
    margin: '0 auto',
    padding: 'clamp(12px, 4vw, 24px)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f3f4f6',
    minHeight: '100vh',
    width: '100%',
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    marginBottom: 'clamp(24px, 6vw, 48px)',
    padding: 'clamp(24px, 8vw, 48px) clamp(16px, 5vw, 32px)',
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
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
    gap: 'clamp(16px, 4vw, 24px)',
    width: '100%',
  },
  cardContainer: {
    background: 'white',
    borderRadius: 'clamp(12px, 3vw, 20px)',
    padding: 'clamp(16px, 4vw, 24px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
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
    gap: 'clamp(12px, 3vw, 16px)',
    flexWrap: 'wrap',
  },
  timeEstimate: {
    fontSize: 'clamp(11px, 3vw, 12px)',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  difficultyTag: {
    fontSize: 'clamp(11px, 3vw, 12px)',
    color: '#8b5cf6',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: '500',
  },
  metaIcon: {
    fontSize: 'clamp(10px, 2.5vw, 12px)',
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

// Add responsive styles and animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .game-card {
    animation: slideUp 0.4s ease forwards;
    opacity: 0;
  }
  
  .game-card:nth-child(1) { animation-delay: 0.1s; }
  .game-card:nth-child(2) { animation-delay: 0.2s; }
  .game-card:nth-child(3) { animation-delay: 0.3s; }
  
  .game-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important;
  }
  
  .game-card:hover .card-icon {
    transform: scale(1.05);
  }
  
  .start-button:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59,130,246,0.3);
  }
  
  .start-button:active {
    transform: translateY(0);
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .card-left {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .card-header {
      justify-content: center;
    }
    
    .features-list {
      justify-content: center;
    }
    
    .card-meta {
      justify-content: center;
    }
    
    .card-description {
      text-align: center;
    }
  }
  
  @media (max-width: 480px) {
    .games-grid {
      grid-template-columns: 1fr;
    }
    
    .card-icon {
      margin-bottom: 8px;
    }
    
    .card-title {
      font-size: 18px;
    }
    
    .difficulty-badge {
      font-size: 10px;
      padding: 3px 8px;
    }
    
    .feature-tag {
      font-size: 9px;
      padding: 3px 8px;
    }
    
    .start-button {
      padding: 10px;
      font-size: 13px;
    }
  }
  
  @media (min-width: 1200px) {
    .games-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  /* Touch-friendly for mobile */
  @media (max-width: 768px) {
    .start-button {
      min-height: 44px;
    }
    
    .game-card {
      cursor: default;
    }
    
    .feature-tag {
      white-space: normal;
      text-align: center;
    }
  }
  
  /* Smooth transitions */
  * {
    transition: all 0.2s ease-in-out;
  }
  
  /* Better text rendering */
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;
document.head.appendChild(styleSheet);

export default Games;