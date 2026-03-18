import React, { useState } from 'react';
import { IoGameController, IoTrophy, IoTime, IoStar } from 'react-icons/io5';
import { FaPuzzlePiece, FaBrain, FaCalculator, FaBook, FaFlask, FaMusic, FaPalette } from 'react-icons/fa';
import { GiPuzzle, GiSmart, GiTeacher, GiBrainstorm } from 'react-icons/gi';
import { MdLeaderboard, MdLock, MdPlayArrow, MdAccessTime } from 'react-icons/md';

function Games() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [games, setGames] = useState([
    {
      id: 1,
      title: "Math Challenge",
      description: "Test your arithmetic skills with fun puzzles",
      category: "math",
      difficulty: "Easy",
      players: 1234,
      rating: 4.5,
      timePerRound: "5 min",
      icon: <FaCalculator size={32} />,
      color: "#3b82f6",
      bgColor: "#dbeafe",
      achievements: 8,
      highScore: 1500,
      locked: false,
      popular: true
    },
    {
      id: 2,
      title: "Word Wizard",
      description: "Build vocabulary and spelling skills",
      category: "language",
      difficulty: "Medium",
      players: 987,
      rating: 4.8,
      timePerRound: "10 min",
      icon: <FaBook size={32} />,
      color: "#8b5cf6",
      bgColor: "#ede9fe",
      achievements: 12,
      highScore: 3200,
      locked: false,
      popular: true
    },
    {
      id: 3,
      title: "Science Explorer",
      description: "Discover fascinating science facts",
      category: "science",
      difficulty: "Hard",
      players: 756,
      rating: 4.3,
      timePerRound: "15 min",
      icon: <FaFlask size={32} />,
      color: "#10b981",
      bgColor: "#d1fae5",
      achievements: 10,
      highScore: 2800,
      locked: false,
      popular: false
    },
    {
      id: 4,
      title: "Memory Master",
      description: "Train your brain with memory games",
      category: "brain",
      difficulty: "Medium",
      players: 1567,
      rating: 4.9,
      timePerRound: "8 min",
      icon: <FaBrain size={32} />,
      color: "#ef4444",
      bgColor: "#fee2e2",
      achievements: 15,
      highScore: 4200,
      locked: false,
      popular: true
    },
    {
      id: 5,
      title: "Puzzle Planet",
      description: "Solve challenging puzzles",
      category: "puzzle",
      difficulty: "Medium",
      players: 892,
      rating: 4.6,
      timePerRound: "12 min",
      icon: <FaPuzzlePiece size={32} />,
      color: "#f59e0b",
      bgColor: "#fef3c7",
      achievements: 9,
      highScore: 2100,
      locked: true,
      popular: false
    },
    {
      id: 6,
      title: "Music Maestro",
      description: "Learn music theory and rhythms",
      category: "music",
      difficulty: "Easy",
      players: 567,
      rating: 4.4,
      timePerRound: "7 min",
      icon: <FaMusic size={32} />,
      color: "#ec4899",
      bgColor: "#fce7f3",
      achievements: 6,
      highScore: 1800,
      locked: false,
      popular: false
    },
    {
      id: 7,
      title: "Art Studio",
      description: "Creative drawing challenges",
      category: "art",
      difficulty: "Easy",
      players: 678,
      rating: 4.7,
      timePerRound: "20 min",
      icon: <FaPalette size={32} />,
      color: "#14b8a6",
      bgColor: "#ccfbf1",
      achievements: 7,
      highScore: 1950,
      locked: false,
      popular: false
    },
    {
      id: 8,
      title: "Logic Grid",
      description: "Solve complex logic puzzles",
      category: "puzzle",
      difficulty: "Hard",
      players: 445,
      rating: 4.2,
      timePerRound: "25 min",
      icon: <GiPuzzle size={32} />,
      color: "#6366f1",
      bgColor: "#e0e7ff",
      achievements: 11,
      highScore: 3500,
      locked: false,
      popular: false
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Games', icon: <IoGameController /> },
    { id: 'math', name: 'Math', icon: <FaCalculator /> },
    { id: 'language', name: 'Language', icon: <FaBook /> },
    { id: 'science', name: 'Science', icon: <FaFlask /> },
    { id: 'brain', name: 'Brain Training', icon: <GiBrainstorm /> },
    { id: 'puzzle', name: 'Puzzles', icon: <FaPuzzlePiece /> },
    { id: 'music', name: 'Music', icon: <FaMusic /> },
    { id: 'art', name: 'Art', icon: <FaPalette /> }
  ];

  const difficulties = ['all', 'Easy', 'Medium', 'Hard'];

  const getDifficultyStars = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return '⭐';
      case 'Medium': return '⭐⭐';
      case 'Hard': return '⭐⭐⭐';
      default: return '';
    }
  };

  const filteredGames = games.filter(game => {
    const categoryMatch = selectedCategory === 'all' || game.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || game.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const handlePlayGame = (gameId) => {
    // Navigate to game or start game
    console.log(`Starting game ${gameId}`);
  };

  const featuredGames = games.filter(game => game.popular).slice(0, 3);

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            <IoGameController style={styles.heroIcon} />
            Game Zone
          </h1>
          <p style={styles.heroSubtitle}>Learn while having fun! Play educational games and earn rewards.</p>
        </div>
      </div>

      {/* Featured Games */}
      {featuredGames.length > 0 && (
        <div style={styles.featuredSection}>
          <h2 style={styles.sectionTitle}>🔥 Featured Games</h2>
          <div style={styles.featuredGrid}>
            {featuredGames.map(game => (
              <div key={game.id} style={styles.featuredCard}>
                <div style={{ ...styles.featuredIcon, backgroundColor: game.bgColor, color: game.color }}>
                  {game.icon}
                </div>
                <div style={styles.featuredInfo}>
                  <h3 style={styles.featuredTitle}>{game.title}</h3>
                  <p style={styles.featuredDescription}>{game.description}</p>
                  <div style={styles.featuredStats}>
                    <span style={styles.featuredStat}>
                      <IoTime /> {game.timePerRound}
                    </span>
                    <span style={styles.featuredStat}>
                      <IoStar /> {game.rating}
                    </span>
                  </div>
                  <button 
                    style={styles.playNowButton}
                    onClick={() => handlePlayGame(game.id)}
                  >
                    <MdPlayArrow /> Play Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filtersSection}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Category:</label>
          <div style={styles.categoryFilters}>
            {categories.map(category => (
              <button
                key={category.id}
                style={{
                  ...styles.categoryButton,
                  backgroundColor: selectedCategory === category.id ? category.color : 'white',
                  color: selectedCategory === category.id ? 'white' : '#374151',
                  border: selectedCategory === category.id ? 'none' : '1px solid #e5e7eb',
                }}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span style={styles.categoryIcon}>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Difficulty:</label>
          <div style={styles.difficultyFilters}>
            {difficulties.map(difficulty => (
              <button
                key={difficulty}
                style={{
                  ...styles.difficultyButton,
                  backgroundColor: selectedDifficulty === difficulty ? '#2563eb' : 'white',
                  color: selectedDifficulty === difficulty ? 'white' : '#374151',
                }}
                onClick={() => setSelectedDifficulty(difficulty)}
              >
                {difficulty === 'all' ? 'All Levels' : `${difficulty} ${getDifficultyStars(difficulty)}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div style={styles.gamesGrid}>
        {filteredGames.map(game => (
          <div
            key={game.id}
            style={{
              ...styles.gameCard,
              opacity: game.locked ? 0.6 : 1,
              cursor: game.locked ? 'not-allowed' : 'pointer',
            }}
            onClick={() => !game.locked && handlePlayGame(game.id)}
          >
            {game.locked && (
              <div style={styles.lockedBadge}>
                <MdLock size={20} />
                <span>Locked</span>
              </div>
            )}

            <div style={{ ...styles.gameIcon, backgroundColor: game.bgColor, color: game.color }}>
              {game.icon}
            </div>

            <h3 style={styles.gameTitle}>{game.title}</h3>
            <p style={styles.gameDescription}>{game.description}</p>

            <div style={styles.gameTags}>
              <span style={styles.difficultyTag}>
                {getDifficultyStars(game.difficulty)}
              </span>
              <span style={styles.categoryTag}>
                {categories.find(c => c.id === game.category)?.name}
              </span>
            </div>

            <div style={styles.gameStats}>
              <div style={styles.stat}>
                <IoTime size={14} color="#6b7280" />
                <span style={styles.statText}>{game.timePerRound}</span>
              </div>
              <div style={styles.stat}>
                <IoStar size={14} color="#fbbf24" />
                <span style={styles.statText}>{game.rating}</span>
              </div>
              <div style={styles.stat}>
                <IoTrophy size={14} color="#f59e0b" />
                <span style={styles.statText}>{game.achievements}</span>
              </div>
            </div>

            <div style={styles.gameFooter}>
              <div style={styles.players}>
                <span style={styles.playersCount}>{game.players.toLocaleString()}</span>
                <span style={styles.playersLabel}>players</span>
              </div>
              <div style={styles.highScore}>
                <span style={styles.highScoreLabel}>High Score:</span>
                <span style={styles.highScoreValue}>{game.highScore}</span>
              </div>
            </div>

            {!game.locked && (
              <button 
                style={styles.playButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayGame(game.id);
                }}
              >
                <MdPlayArrow size={18} />
                Play Game
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Leaderboard Preview */}
      <div style={styles.leaderboardPreview}>
        <div style={styles.leaderboardHeader}>
          <MdLeaderboard size={24} color="#f59e0b" />
          <h2 style={styles.leaderboardTitle}>Top Players This Week</h2>
        </div>
        <div style={styles.leaderboardList}>
          {[1, 2, 3, 4, 5].map(position => (
            <div key={position} style={styles.leaderboardItem}>
              <span style={styles.position}>#{position}</span>
              <div style={styles.playerInfo}>
                <div style={styles.playerAvatar}>
                  {String.fromCharCode(64 + position)}
                </div>
                <span style={styles.playerName}>Player {position}</span>
              </div>
              <span style={styles.playerScore}>
                {Math.floor(5000 / position).toLocaleString()} pts
              </span>
            </div>
          ))}
        </div>
        <button style={styles.viewAllButton}>
          View Full Leaderboard
        </button>
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
  hero: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    padding: '40px',
    marginBottom: '30px',
    color: 'white',
  },
  heroContent: {
    maxWidth: '600px',
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  heroIcon: {
    fontSize: '40px',
  },
  heroSubtitle: {
    fontSize: '18px',
    opacity: 0.9,
  },
  featuredSection: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
  },
  featuredGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  featuredCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  featuredIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredInfo: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  featuredDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  featuredStats: {
    display: 'flex',
    gap: '15px',
    marginBottom: '10px',
  },
  featuredStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#6b7280',
  },
  playNowButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#1d4ed8',
    },
  },
  filtersSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  filterGroup: {
    marginBottom: '15px',
  },
  filterLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
  },
  categoryFilters: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  categoryButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: 'none',
    transition: 'all 0.2s',
  },
  categoryIcon: {
    fontSize: '16px',
  },
  difficultyFilters: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  difficultyButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s',
  },
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  gameCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    },
  },
  lockedBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    zIndex: 10,
  },
  gameIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  gameTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  gameDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px',
    lineHeight: '1.4',
  },
  gameTags: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  difficultyTag: {
    fontSize: '12px',
    padding: '2px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
  },
  categoryTag: {
    fontSize: '12px',
    padding: '2px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
  },
  gameStats: {
    display: 'flex',
    gap: '15px',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  statText: {
    fontSize: '12px',
    color: '#6b7280',
  },
  gameFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  players: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  playersCount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  playersLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  highScore: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  highScoreLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  highScoreValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f59e0b',
  },
  playButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#1d4ed8',
    },
  },
  leaderboardPreview: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  leaderboardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  leaderboardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
  },
  leaderboardList: {
    marginBottom: '20px',
  },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px',
    borderBottom: '1px solid #e5e7eb',
    ':last-child': {
      borderBottom: 'none',
    },
  },
  position: {
    width: '40px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
  },
  playerInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  playerAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
  },
  playerName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
  },
  playerScore: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f59e0b',
  },
  viewAllButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#e5e7eb',
    },
  },
};

export default Games;