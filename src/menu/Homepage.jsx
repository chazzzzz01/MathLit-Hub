import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AiFillHome } from 'react-icons/ai';

function Homepage() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <AiFillHome size={80} color="#2563eb" style={styles.icon} />
        <h1 style={styles.title}>Welcome to Home Icon</h1>
        <p style={styles.subtitle}>You've successfully navigated to the homepage!</p>
        
        <div style={styles.cardContainer}>
          <div style={styles.card}>
            <h3>Dashboard</h3>
            <p>View your personalized dashboard</p>
          </div>
          <div style={styles.card}>
            <h3>Profile</h3>
            <p>Manage your account settings</p>
          </div>
          <div style={styles.card}>
            <h3>Settings</h3>
            <p>Customize your preferences</p>
          </div>
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
    maxWidth: '800px',
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
    marginBottom: '40px',
  },
  cardContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '0',
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    },
  },
  button: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#1d4ed8',
    },
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