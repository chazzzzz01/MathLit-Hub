// src/menu/Homepage.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getGameTotalScores } from './Games';

function Homepage() {
  const { user, userData } = useOutletContext() || {};
  const [totalScores, setTotalScores] = useState({
    totalHighScore: 0,
    totalLastScores: 0,
    equationScore: 0,
    battleScore: 0,
    spaceShooterScore: 0
  });

  useEffect(() => {
    // Get total scores from userData or localStorage
    const gameProgress = userData?.gameProgress || JSON.parse(localStorage.getItem('gameProgress')) || null;
    if (gameProgress) {
      const scores = getGameTotalScores(gameProgress);
      setTotalScores(scores);
    }
  }, [userData]);

  const userName = user?.name || user?.email?.split('@')[0] || 'Student';
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div style={styles.container}>
      <div style={styles.welcomeCard}>
        <div style={styles.welcomeHeader}>
          <div style={styles.welcomeIcon}>🎮</div>
          <div>
            <h1 style={styles.welcomeTitle}>Welcome back, {userName}!</h1>
            <p style={styles.welcomeDate}>{currentDate}</p>
          </div>
        </div>
        <p style={styles.welcomeMessage}>
          Ready to continue your learning journey? Check out your progress below and start playing to earn more points!
        </p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🏆</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{totalScores.totalHighScore}</div>
            <div style={styles.statLabel}>Total High Score</div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎯</div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{totalScores.totalLastScores}</div>
            <div style={styles.statLabel}>Recent Total Score</div>
          </div>
        </div>
      </div>

      <div style={styles.scoresSection}>
        <h2 style={styles.sectionTitle}>Game High Scores</h2>
        <div style={styles.scoresGrid}>
          <div style={styles.scoreCard}>
            <div style={styles.scoreCardIcon}>🧩</div>
            <div>
              <div style={styles.scoreCardTitle}>Equation Escape</div>
              <div style={styles.scoreCardValue}>{totalScores.equationScore} points</div>
            </div>
          </div>
          
          <div style={styles.scoreCard}>
            <div style={styles.scoreCardIcon}>⚔️</div>
            <div>
              <div style={styles.scoreCardTitle}>Math Battle</div>
              <div style={styles.scoreCardValue}>{totalScores.battleScore} points</div>
            </div>
          </div>
          
          <div style={styles.scoreCard}>
            <div style={styles.scoreCardIcon}>🚀</div>
            <div>
              <div style={styles.scoreCardTitle}>Space Shooter</div>
              <div style={styles.scoreCardValue}>{totalScores.spaceShooterScore} points</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.achievementSection}>
        <h2 style={styles.sectionTitle}>Recent Achievements</h2>
        <div style={styles.achievementMessage}>
          <p>🎯 Keep playing to unlock more achievements!</p>
          <p style={styles.achievementSubtext}>Complete all games to earn special badges</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  welcomeCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '32px',
    color: 'white',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  },
  welcomeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  welcomeIcon: {
    fontSize: '48px',
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
  },
  welcomeDate: {
    fontSize: '14px',
    opacity: 0.9,
    margin: '8px 0 0 0',
  },
  welcomeMessage: {
    fontSize: '16px',
    opacity: 0.95,
    margin: 0,
    lineHeight: 1.5,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
    },
  },
  statIcon: {
    fontSize: '48px',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '8px',
  },
  scoresSection: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 20px 0',
  },
  scoresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  scoreCard: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#f3f4f6',
      transform: 'translateX(4px)',
    },
  },
  scoreCardIcon: {
    fontSize: '36px',
  },
  scoreCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  scoreCardValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  achievementSection: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
  },
  achievementMessage: {
    marginTop: '8px',
  },
  achievementSubtext: {
    fontSize: '14px',
    color: '#92400e',
    marginTop: '8px',
  },
};

export default Homepage;