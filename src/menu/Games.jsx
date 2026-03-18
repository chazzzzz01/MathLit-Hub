// src/menu/Game.jsx
import React, { useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import { GiPuzzle } from 'react-icons/gi';
import EquationEscapeRoom from '../games/EquationEscapeRoom';

function Game() {
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setGameStarted(true);
  };

  // Game Card Component
  const GameCard = () => (
    <div style={styles.cardContainer}>
      <div style={styles.cardContent}>
        <div style={styles.cardLeft}>
          <div style={styles.cardIcon}>
            <GiPuzzle size={48} color="#667eea" />
          </div>
          <div style={styles.cardText}>
            <h1 style={styles.cardTitle}>Equation Escape Room</h1>
            <p style={styles.cardDescription}>
              Solve linear equations to escape each room! Master slope-intercept form, 
              work with points, and tackle real-world word problems in this mathematical 
              adventure. Can you solve all 4 levels and make your escape?
            </p>
            <div style={styles.cardFeatures}>
              <span style={styles.feature}>🎯 4 Challenging Levels</span>
              <span style={styles.feature}>⏱️ Timed Challenges</span>
              <span style={styles.feature}>🏆 Leaderboard Rankings</span>
              <span style={styles.feature}>💡 Helpful Hints</span>
            </div>
          </div>
        </div>
        <button 
          style={styles.playButton} 
          onClick={startGame}
          className="playButton"
        >
          <FaPlay style={styles.playIcon} />
          Play Now
        </button>
      </div>
    </div>
  );

  return (
    <>
      {!gameStarted ? <GameCard /> : <EquationEscapeRoom />}
    </>
  );
}

const styles = {
  cardContainer: {
    maxWidth: '1000px',
    margin: '40px auto',
    padding: '20px',
  },
  cardContent: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '24px',
    padding: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '30px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    color: 'white',
  },
  cardLeft: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
    flex: 1,
  },
  cardIcon: {
    background: 'rgba(255,255,255,0.2)',
    padding: '16px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: '36px',
    fontWeight: '700',
    margin: '0 0 12px 0',
    color: 'white',
  },
  cardDescription: {
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 20px 0',
    opacity: '0.95',
  },
  cardFeatures: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  feature: {
    background: 'rgba(255,255,255,0.15)',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
  },
  playButton: {
    background: 'white',
    border: 'none',
    padding: '16px 32px',
    borderRadius: '50px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#667eea',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    whiteSpace: 'nowrap',
  },
  playIcon: {
    fontSize: '16px',
  },
};

// Add hover effect for play button
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .playButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  }
`;
document.head.appendChild(styleSheet);

export default Game;