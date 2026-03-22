// src/games/SpaceShooter.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const SpaceShooter = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [targetEquation, setTargetEquation] = useState(null);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [showLevelAnnouncement, setShowLevelAnnouncement] = useState(false);
  const [levelAnnouncement, setLevelAnnouncement] = useState('');
  const [wrongShots, setWrongShots] = useState(0);
  const [correctShots, setCorrectShots] = useState(0); // Track consecutive correct shots for speed

  const gameRef = useRef({
    player: { x: 380, y: 550, width: 40, height: 40 },
    bullets: [],
    enemies: [],
    particles: [],
    keys: {},
    frame: 0,
    lastShot: 0,
    gameActive: false,
    waitingForSpace: false,
    spawnTimer: 0,
    baseEnemySpeed: 0.8, // Starting speed
    currentSpeedMultiplier: 1.0, // Speed multiplier that increases with correct answers
  });

  const handleBackToGames = () => {
    navigate('/studenthub/games');
  };

  // ------------------ LINEAR EQUATIONS ------------------
  const generateLinearEquation = useCallback(() => {
    // Generate linear equations in the form: ax + b = c
    // Solve for x: x = (c - b) / a
    
    const a = Math.floor(Math.random() * 5) + 2; // 2-6
    const b = Math.floor(Math.random() * 10) + 1; // 1-10
    const x = Math.floor(Math.random() * 10) + 1; // 1-10
    const c = (a * x) + b;
    
    return { 
      equation: `${a}x + ${b} = ${c}`, 
      answer: x, 
      type: 'linear' 
    };
  }, []);

  const generateWrongAnswers = (correct) => {
    const arr = [];
    const range = 3;
    while (arr.length < 3) {
      let w = correct + (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * range) + 1);
      if (w > 0 && w !== correct && !arr.includes(w)) arr.push(w);
    }
    return arr;
  };

  const createEnemy = useCallback(() => {
    if (!targetEquation) return null;

    const wrong = generateWrongAnswers(targetEquation.answer);
    const isCorrect = Math.random() < 0.4; // 40% chance for correct answer
    
    // Calculate current speed based on multiplier
    const currentSpeed = gameRef.current.baseEnemySpeed * gameRef.current.currentSpeedMultiplier;

    return {
      id: Math.random(),
      x: Math.random() * (750 - 70),
      y: -60,
      width: 70,
      height: 55,
      speed: currentSpeed,
      horizontalSpeed: (0.5 + Math.random() * 0.5) * Math.min(2.0, gameRef.current.currentSpeedMultiplier),
      direction: (Math.random() < 0.5 ? -1 : 1),
      equation: targetEquation.equation,
      answer: isCorrect ? targetEquation.answer : wrong[Math.floor(Math.random() * wrong.length)],
      isCorrect,
    };
  }, [targetEquation]);

  const showLevelStart = (levelNum) => {
    setLevelAnnouncement(`LEVEL ${levelNum}`);
    setShowLevelAnnouncement(true);
    gameRef.current.waitingForSpace = true;
    gameRef.current.gameActive = false;
    
    setTimeout(() => {
      if (gameRef.current.waitingForSpace) {
        setShowLevelAnnouncement(false);
        gameRef.current.waitingForSpace = false;
        gameRef.current.gameActive = true;
      }
    }, 3000);
  };

  // Handle space key for level start
  useEffect(() => {
    const handleSpaceToStart = (e) => {
      if (e.code === 'Space' && showLevelAnnouncement && gameRef.current.waitingForSpace) {
        e.preventDefault();
        setShowLevelAnnouncement(false);
        gameRef.current.waitingForSpace = false;
        gameRef.current.gameActive = true;
      }
    };
    
    window.addEventListener('keydown', handleSpaceToStart);
    return () => window.removeEventListener('keydown', handleSpaceToStart);
  }, [showLevelAnnouncement]);

  // ------------------ INIT ------------------
  const initLevel = useCallback(() => {
    const game = gameRef.current;
    
    game.enemies = [];
    game.bullets = [];
    game.particles = [];
    game.spawnTimer = 0;
    game.baseEnemySpeed = 0.8;
    game.currentSpeedMultiplier = 1.0;
    setWrongShots(0);
    setCorrectShots(0);

    const eq = generateLinearEquation();
    setTargetEquation(eq);

    // Start with 3 enemies
    for (let i = 0; i < 3; i++) {
      const e = createEnemy();
      if (e) {
        e.y = -60 - (i * 40);
        game.enemies.push(e);
      }
    }
    
    showLevelStart(1);
  }, [generateLinearEquation, createEnemy]);

  const startGame = () => {
    const game = gameRef.current;

    game.gameActive = false;
    game.waitingForSpace = false;
    game.player = { x: 380, y: 550, width: 40, height: 40 };
    game.bullets = [];
    game.enemies = [];
    game.keys = {};
    game.lastShot = 0;
    game.spawnTimer = 0;
    game.baseEnemySpeed = 0.8;
    game.currentSpeedMultiplier = 1.0;

    setScore(0);
    setLevel(1);
    setWrongShots(0);
    setCorrectShots(0);
    setGameState('playing');
    setShowLevelAnnouncement(false);

    setTimeout(() => {
      initLevel();
    }, 100);
  };

  // ------------------ SHOOT ------------------
  const shoot = () => {
    const game = gameRef.current;
    const now = Date.now();

    if (now - game.lastShot < 300) return;

    game.bullets.push({
      x: game.player.x + 18,
      y: game.player.y - 20,
      width: 4,
      height: 10,
      speed: 7
    });

    game.lastShot = now;
  };

  // Function to increase game speed
  const increaseSpeed = useCallback(() => {
    const game = gameRef.current;
    // Increase multiplier by 0.1 each correct answer, max speed 3x
    game.currentSpeedMultiplier = Math.min(3.0, game.currentSpeedMultiplier + 0.1);
    
    // Update all existing enemies with new speed
    game.enemies.forEach(enemy => {
      const newSpeed = game.baseEnemySpeed * game.currentSpeedMultiplier;
      enemy.speed = newSpeed;
      enemy.horizontalSpeed = (0.5 + Math.random() * 0.5) * Math.min(2.0, game.currentSpeedMultiplier);
    });
    
    // Update spawn rate - spawn faster as speed increases
    // Spawn timer threshold reduces from 120 to 60 frames as speed increases
    const newSpawnDelay = Math.max(60, 120 - (game.currentSpeedMultiplier - 1) * 30);
    game.spawnDelay = newSpawnDelay;
    
    console.log(`Speed increased! Multiplier: ${game.currentSpeedMultiplier.toFixed(1)}x, Spawn delay: ${newSpawnDelay}`);
  }, []);

  // ------------------ UPDATE ------------------
  const updateGame = useCallback(() => {
    const game = gameRef.current;
    if (!game.gameActive || game.waitingForSpace) return;

    // Player movement
    if (game.keys['ArrowLeft']) game.player.x -= 5;
    if (game.keys['ArrowRight']) game.player.x += 5;
    game.player.x = Math.max(0, Math.min(760, game.player.x));

    // Shooting
    if (game.keys['Space']) shoot();

    // Update bullets
    game.bullets = game.bullets.filter(b => {
      b.y -= b.speed;
      return b.y > -20;
    });

    // Spawn new enemies with dynamic timing based on speed
    game.spawnTimer++;
    const spawnDelay = game.spawnDelay || 120;
    if (game.spawnTimer > spawnDelay && game.enemies.length < 8) {
      const newEnemy = createEnemy();
      if (newEnemy) {
        newEnemy.y = -60;
        newEnemy.x = Math.random() * 730;
        game.enemies.push(newEnemy);
        game.spawnTimer = 0;
      }
    }

    // Update enemies
    game.enemies.forEach(e => {
      e.x += e.horizontalSpeed * e.direction;
      if (e.x <= 0 || e.x >= 730) e.direction *= -1;
      e.y += e.speed;
    });

    // Remove enemies that go off screen
    game.enemies = game.enemies.filter(e => e.y < 650);

    // Collision detection
    for (let bi = game.bullets.length - 1; bi >= 0; bi--) {
      const b = game.bullets[bi];

      for (let ei = game.enemies.length - 1; ei >= 0; ei--) {
        const e = game.enemies[ei];

        if (
          b.x < e.x + e.width &&
          b.x + b.width > e.x &&
          b.y < e.y + e.height &&
          b.y + b.height > e.y
        ) {
          // Check if answer matches target
          if (e.answer === targetEquation.answer) {
            setScore(s => s + 100);
            setCorrectShots(prev => {
              const newCorrectShots = prev + 1;
              setFeedback({ 
                message: `+100 Correct! x = ${e.answer} | Speed: ${(gameRef.current.currentSpeedMultiplier).toFixed(1)}x`, 
                type: 'success' 
              });
              return newCorrectShots;
            });
            
            // Add particle effect
            for (let i = 0; i < 20; i++) {
              game.particles.push({
                x: e.x + e.width/2,
                y: e.y + e.height/2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30
              });
            }
            
            // INCREASE GAME SPEED ON CORRECT ANSWER
            increaseSpeed();
            
            // GENERATE NEW EQUATION AFTER CORRECT ANSWER
            const newEquation = generateLinearEquation();
            setTargetEquation(newEquation);
            
            // Update all remaining enemies to use the new equation
            game.enemies.forEach(enemy => {
              enemy.equation = newEquation.equation;
            });
          } else {
            // WRONG ANSWER - Reset speed multiplier on wrong answer
            setWrongShots(prev => {
              const newWrongShots = prev + 1;
              setScore(s => Math.max(0, s - 10));
              setFeedback({ 
                message: `-10 Wrong! Answer was ${targetEquation.answer} (${newWrongShots}/3 mistakes) | Speed reset!`, 
                type: 'error' 
              });
              
              // Reset speed multiplier on wrong answer
              gameRef.current.currentSpeedMultiplier = 1.0;
              gameRef.current.spawnDelay = 120;
              
              // Update all existing enemies with reset speed
              gameRef.current.enemies.forEach(enemy => {
                const newSpeed = gameRef.current.baseEnemySpeed * gameRef.current.currentSpeedMultiplier;
                enemy.speed = newSpeed;
                enemy.horizontalSpeed = (0.5 + Math.random() * 0.5);
              });
              
              // Add particle effect
              for (let i = 0; i < 15; i++) {
                game.particles.push({
                  x: e.x + e.width/2,
                  y: e.y + e.height/2,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  life: 20
                });
              }
              
              // Check if player has made 3 wrong shots
              if (newWrongShots >= 3) {
                game.gameActive = false;
                game.waitingForSpace = false;
                setGameState('gameOver');
                setFeedback({ message: 'Game Over! 3 wrong answers!', type: 'error' });
              }
              
              return newWrongShots;
            });
          }

          game.bullets.splice(bi, 1);
          game.enemies.splice(ei, 1);
          break;
        }
      }
    }
    
    // Update particles
    game.particles = game.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });
  }, [targetEquation, generateLinearEquation, increaseSpeed]);

  // ------------------ DRAW ------------------
  const drawGame = useCallback((ctx) => {
    const game = gameRef.current;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#0a0a2a');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    
    // Draw stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 150; i++) {
      ctx.fillRect((i * 131) % 800, (i * 253) % 600, 1.5, 1.5);
    }

    // Player ship
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00ffff';
    
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(game.player.x + 20, game.player.y);
    ctx.lineTo(game.player.x + 5, game.player.y + 20);
    ctx.lineTo(game.player.x + 20, game.player.y + 15);
    ctx.lineTo(game.player.x + 35, game.player.y + 20);
    ctx.fill();
    
    ctx.fillStyle = '#0099ff';
    ctx.fillRect(game.player.x + 15, game.player.y + 12, 10, 15);
    
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(game.player.x + 18, game.player.y + 27, 4, 10);
    
    ctx.restore();

    // Bullets
    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ffff00';
    game.bullets.forEach(b => {
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // Particles
    game.particles.forEach(p => {
      ctx.fillStyle = `rgba(255, 100, 0, ${p.life / 30})`;
      ctx.fillRect(p.x, p.y, 4, 4);
    });

    // Draw enemies
    game.enemies.forEach(e => {
      ctx.shadowBlur = 5;
      
      // Enemy body - color changes with speed (more red as speed increases)
      const speedFactor = Math.min(1, (game.currentSpeedMultiplier - 1) / 2);
      const intensity = 255 - Math.floor(100 * speedFactor);
      const gradient = ctx.createLinearGradient(e.x, e.y, e.x + e.width, e.y + e.height);
      gradient.addColorStop(0, `rgb(255, ${intensity}, ${intensity})`);
      gradient.addColorStop(1, `rgb(170, ${Math.floor(intensity * 0.6)}, ${Math.floor(intensity * 0.6)})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(e.x, e.y, e.width, e.height);
      
      // Enemy details
      ctx.fillStyle = '#882222';
      ctx.fillRect(e.x + 10, e.y + 12, e.width - 20, 6);
      ctx.fillRect(e.x + 10, e.y + 30, e.width - 20, 6);
      
      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(e.x + 12, e.y + 8, 10, 6);
      ctx.fillRect(e.x + e.width - 22, e.y + 8, 10, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(e.x + 14, e.y + 9, 6, 4);
      ctx.fillRect(e.x + e.width - 20, e.y + 9, 6, 4);
      
      // NUMBER DISPLAY
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.shadowBlur = 3;
      ctx.shadowColor = '#000000';
      ctx.fillText(e.answer, e.x + 27, e.y + 45);
      
      // Simple border - all enemies have same border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(e.x + 2, e.y + 2, e.width - 4, e.height - 4);
    });

    ctx.shadowBlur = 0;

    // Show feedback message
    if (feedback.message) {
      ctx.fillStyle = feedback.type === 'success' ? '#4caf50' : '#f44336';
      ctx.font = 'bold 24px Arial';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'black';
      ctx.fillText(feedback.message, 180, 100);
      
      setTimeout(() => {
        setFeedback({ message: '', type: '' });
      }, 1500);
    }

    // Level Announcement
    if (showLevelAnnouncement) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, 800, 600);
      
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 48px Arial';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff6600';
      ctx.fillText(levelAnnouncement, 280, 280);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '28px Arial';
      ctx.fillText('Press SPACE to start!', 290, 360);
      ctx.fillStyle = '#88ff88';
      ctx.font = '20px Arial';
      ctx.fillText('Solve for x in each equation!', 290, 420);
      ctx.shadowBlur = 0;
    }

    // UI Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Mistakes: ${wrongShots}/3`, 20, 70);
    
    // Speed indicator
    const speedColor = game.currentSpeedMultiplier > 2 ? '#ff4444' : (game.currentSpeedMultiplier > 1.5 ? '#ffaa44' : '#88ff88');
    ctx.fillStyle = speedColor;
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`SPEED: ${game.currentSpeedMultiplier.toFixed(1)}x`, 20, 100);
    
    // Target linear equation
    if (targetEquation && !showLevelAnnouncement && game.gameActive) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 28px Arial';
      ctx.fillText(`Solve: ${targetEquation.equation}`, 260, 50);
      ctx.fillStyle = '#88ff88';
      ctx.font = '18px Arial';
      ctx.fillText('Find x = ?', 360, 85);
    }
    
    // Controls
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    ctx.fillText('← →  Move', 20, 575);
    ctx.fillText('SPACE  Shoot', 20, 595);
    
    // Enemy counter
    if (!showLevelAnnouncement && game.gameActive) {
      ctx.fillStyle = '#ff8888';
      ctx.font = '18px Arial';
      ctx.fillText(`Enemies: ${game.enemies.length}`, 700, 40);
    }
    
    game.frame++;
  }, [score, targetEquation, feedback, showLevelAnnouncement, levelAnnouncement, wrongShots]);

  // ------------------ LOOP ------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let id;
    const loop = () => {
      if (gameState === 'playing') updateGame();
      drawGame(ctx);
      id = requestAnimationFrame(loop);
    };
    loop();

    return () => cancelAnimationFrame(id);
  }, [gameState, updateGame, drawGame]);

  // ------------------ KEY HANDLERS ------------------
  useEffect(() => {
    const down = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        gameRef.current.keys['Space'] = true;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        gameRef.current.keys[e.key] = true;
      }
    };

    const up = (e) => {
      if (e.code === 'Space') {
        gameRef.current.keys['Space'] = false;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        gameRef.current.keys[e.key] = false;
      }
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  return (
    <div style={styles.container}>
      <button onClick={handleBackToGames} style={styles.backButton}>
        <FaArrowLeft style={styles.backIcon} />
        Back to Games
      </button>
      
      <div style={styles.gameWrapper}>
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          style={styles.canvas}
        />

        {gameState === 'menu' && (
          <div style={styles.menuOverlay}>
            <h1 style={styles.gameTitle}>🚀 Linear Equation Shooter 🚀</h1>
            <p style={styles.gameSubtitle}>Solve linear equations by shooting the correct x value!</p>
            <div style={styles.features}>
              <p>📐 <strong style={{color: '#ffd700'}}>Linear Equations:</strong> ax + b = c</p>
              <p>🎯 Example: <strong style={{color: '#88ff88'}}>3x + 5 = 14</strong> → Solve for x (x = 3)</p>
              <p>💡 Shoot enemies with the <strong style={{color: '#ffff00'}}>correct x value</strong> to earn points!</p>
              <p>⚠️ Shooting wrong answers loses 10 points AND counts as a mistake!</p>
              <p>💀 Make 3 mistakes and the game is over!</p>
              <p>⚡ <strong style={{color: '#ffaa44'}}>SPEED MECHANIC:</strong> Each correct answer increases enemy speed by 10%!</p>
              <p>🔥 Make a mistake and speed resets to normal!</p>
              <p>🔄 New enemies spawn faster as speed increases!</p>
            </div>
            <button onClick={startGame} style={styles.startButton}>
              Start Game
            </button>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div style={styles.gameOverOverlay}>
            <h2 style={styles.gameOverTitle}>💀 Game Over 💀</h2>
            <p style={styles.finalScore}>Final Score: {score}</p>
            <p style={styles.finalScore}>You made 3 mistakes!</p>
            <button onClick={startGame} style={styles.retryButton}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    zIndex: 1000,
    transition: 'all 0.3s',
    backdropFilter: 'blur(10px)',
    ':hover': {
      backgroundColor: 'rgba(0,0,0,0.9)',
      transform: 'scale(1.05)',
    }
  },
  backIcon: {
    fontSize: '16px',
  },
  gameWrapper: {
    position: 'relative',
    display: 'inline-block',
    margin: '40px auto 0 auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: 'auto',
    maxWidth: '800px',
    border: '3px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    color: 'white',
    backdropFilter: 'blur(5px)',
  },
  gameTitle: {
    fontSize: 'clamp(24px, 5vw, 36px)',
    marginBottom: '10px',
    textAlign: 'center',
    color: '#ffd700',
  },
  gameSubtitle: {
    fontSize: 'clamp(14px, 3vw, 18px)',
    textAlign: 'center',
    marginBottom: '10px',
  },
  features: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: '20px 30px',
    borderRadius: '10px',
    marginTop: '10px',
    textAlign: 'left',
    lineHeight: '1.8',
  },
  startButton: {
    padding: '12px 30px',
    fontSize: '18px',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    marginTop: '20px',
    ':hover': {
      transform: 'scale(1.05)',
    }
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.95)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    color: 'white',
  },
  gameOverTitle: {
    fontSize: 'clamp(28px, 6vw, 42px)',
    color: '#ff6b6b',
  },
  finalScore: {
    fontSize: 'clamp(18px, 4vw, 24px)',
  },
  retryButton: {
    padding: '12px 30px',
    fontSize: '18px',
    background: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    marginTop: '20px',
    ':hover': {
      transform: 'scale(1.05)',
    }
  }
};

export default SpaceShooter;