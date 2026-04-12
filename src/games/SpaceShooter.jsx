// src/games/SpaceShooter.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaCrosshairs } from 'react-icons/fa';

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
  const [correctShots, setCorrectShots] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [touchMove, setTouchMove] = useState({ active: false, x: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // Game tracking stats
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameResultSent, setGameResultSent] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [highestLevel, setHighestLevel] = useState(1);
  const [totalShots, setTotalShots] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  
  // ✅ XP tracking (matches other games)
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);

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
    baseEnemySpeed: 0.8,
    currentSpeedMultiplier: 1.0,
  });

  // ✅ Calculate XP earned so far
  const xpSoFar = (correctAnswers * 10) - (wrongAnswers * 5);

  // ✅ Send XP_UPDATE to parent (consistent with other games)
  const sendXPUpdate = useCallback((isCorrect, userAnswer, correctAnswer, equation) => {
    if (window.parent !== window) {
      const xpUpdate = {
        type: 'XP_UPDATE',
        gameId: 'spaceShooter',
        xpChange: isCorrect ? 10 : -5,
        isCorrect: isCorrect,
        correctAnswer: correctAnswer,
        userAnswer: userAnswer,
        equation: equation,
        timestamp: new Date().toISOString()
      };
      window.parent.postMessage(xpUpdate, '*');
      console.log('Sent XP_UPDATE from Space Shooter:', xpUpdate);
    }
  }, []);

  // ✅ Send real-time score updates to parent
  const sendScoreUpdate = useCallback((currentScore, currentStats) => {
    if (window.parent !== window) {
      const scoreUpdate = {
        type: 'SCORE_UPDATE',
        gameId: 'spaceShooter',
        score: currentScore,
        stats: {
          level: level,
          correctShots: totalCorrect,
          totalShots: totalShots,
          accuracy: totalShots > 0 ? Math.round((totalCorrect / totalShots) * 100) : 0,
          wrongShots: totalWrong,
          timeSpent: Math.floor((Date.now() - gameStartTime) / 1000) || 0,
          xpEarned: xpSoFar,
          correctAnswers: correctAnswers,
          wrongAnswers: wrongAnswers
        }
      };
      window.parent.postMessage(scoreUpdate, '*');
      console.log('Sent score update to parent:', currentScore);
    }
  }, [level, totalCorrect, totalShots, totalWrong, gameStartTime, xpSoFar, correctAnswers, wrongAnswers]);

  // ✅ Send score update whenever score changes
  useEffect(() => {
    if (gameState === 'playing' && !showLevelAnnouncement) {
      sendScoreUpdate(score, {
        level,
        correctShots: totalCorrect,
        totalShots: totalShots,
        wrongShots: totalWrong,
        xpEarned: xpSoFar
      });
    }
  }, [score, gameState, showLevelAnnouncement, level, totalCorrect, totalShots, totalWrong, sendScoreUpdate, xpSoFar]);

  // Function to send game result to parent window
  const sendGameResult = (completed, finalScore, timeSpentSeconds, stats) => {
    if (gameResultSent) return; // Prevent sending multiple times
    
    // Calculate accuracy
    const accuracy = stats.totalShots > 0 
      ? Math.round((stats.correctShots / stats.totalShots) * 100) 
      : 0;
    
    const xpEarned = (correctAnswers * 10) - (wrongAnswers * 5);
    
    const gameResult = {
      type: 'GAME_RESULT',
      gameId: 'spaceShooter',
      completed: completed,
      score: finalScore,
      timeSpent: timeSpentSeconds,
      timestamp: new Date().toISOString(),
      stats: {
        finalScore: finalScore,
        correctAnswers: correctAnswers,
        wrongAnswers: wrongAnswers,
        totalAnswers: totalShots,
        accuracy: accuracy,
        highestLevel: stats.highestLevel,
        totalShots: totalShots,
        xpEarned: xpEarned,
        correctShots: stats.correctShots,
        wrongShots: stats.wrongShots
      }
    };
    
    console.log('=== SENDING SPACE SHOOTER GAME RESULT ===');
    console.log('Final Score:', finalScore);
    console.log('Completed:', completed);
    console.log('Correct Answers:', correctAnswers);
    console.log('Wrong Answers:', wrongAnswers);
    console.log('XP Earned:', xpEarned);
    console.log('Game Result:', gameResult);
    
    // Send to parent window (for iframe)
    if (window.parent !== window) {
      window.parent.postMessage(gameResult, '*');
      console.log('Sent to parent window');
    }
    
    // Send to opener (for popup)
    if (window.opener) {
      window.opener.postMessage(gameResult, '*');
      console.log('Sent to opener');
    }
    
    setGameResultSent(true);
    
    // Also store in localStorage for backup
    const previousResults = localStorage.getItem('spaceShooterResults');
    const results = previousResults ? JSON.parse(previousResults) : [];
    results.push(gameResult);
    localStorage.setItem('spaceShooterResults', JSON.stringify(results));
  };

  // ✅ Handle messages from parent (like score requests)
  useEffect(() => {
    const handleMessage = (event) => {
      console.log('SpaceShooter received message:', event.data);
      
      if (event.data && event.data.type === 'REQUEST_SCORE') {
        // Send current score back to parent
        const scoreUpdate = {
          type: 'SCORE_UPDATE',
          gameId: 'spaceShooter',
          score: score,
          stats: {
            level: level,
            correctShots: totalCorrect,
            totalShots: totalShots,
            accuracy: totalShots > 0 ? Math.round((totalCorrect / totalShots) * 100) : 0,
            wrongShots: totalWrong,
            timeSpent: Math.floor((Date.now() - gameStartTime) / 1000) || 0,
            xpEarned: xpSoFar,
            correctAnswers: correctAnswers,
            wrongAnswers: wrongAnswers
          }
        };
        if (window.parent !== window) {
          window.parent.postMessage(scoreUpdate, '*');
        }
        console.log('Sent score response to parent:', score);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [score, level, totalCorrect, totalShots, totalWrong, gameStartTime, xpSoFar, correctAnswers, wrongAnswers]);

  const handleBackToGames = () => {
    // Send result if game is in progress but not completed
    if (gameState === 'playing' && !gameResultSent && gameStartTime) {
      const currentTimeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
      sendGameResult(false, score, currentTimeSpent, {
        correctShots: totalCorrect,
        totalShots: totalShots,
        highestLevel: level,
        wrongShots: totalWrong
      });
    }
    navigate('/studenthub/games');
  };

  // Update time spent during gameplay
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && gameStartTime && !gameResultSent) {
      timer = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, gameStartTime, gameResultSent]);

  // Detect if device is mobile and calculate canvas scale
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
      
      // Calculate canvas scale based on container width
      const container = document.querySelector('.game-wrapper');
      if (container) {
        const containerWidth = container.clientWidth;
        const scale = containerWidth / 800;
        setCanvasScale(Math.min(scale, 1));
      }
      
      // Set canvas size based on device
      if (isMobileDevice) {
        setCanvasSize({ width: 800, height: 600 });
      } else {
        setCanvasSize({ width: 800, height: 600 });
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Add resize observer for canvas container
    const resizeObserver = new ResizeObserver(() => {
      const container = document.querySelector('.game-wrapper');
      if (container) {
        const containerWidth = container.clientWidth;
        const scale = containerWidth / 800;
        setCanvasScale(Math.min(scale, 1));
      }
    });
    
    const gameWrapper = document.querySelector('.game-wrapper');
    if (gameWrapper) {
      resizeObserver.observe(gameWrapper);
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      resizeObserver.disconnect();
    };
  }, []);

  // Convert screen coordinates to canvas coordinates
  const getCanvasCoordinates = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  // ------------------ LINEAR EQUATIONS ------------------
  const generateLinearEquation = useCallback(() => {
    const a = Math.floor(Math.random() * 5) + 2;
    const b = Math.floor(Math.random() * 10) + 1;
    const x = Math.floor(Math.random() * 10) + 1;
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
    const isCorrect = Math.random() < 0.4;
    
    const levelBaseSpeed = gameRef.current.baseEnemySpeed * (1 + (level - 1) * 0.15);
    const currentSpeed = levelBaseSpeed * gameRef.current.currentSpeedMultiplier;

    return {
      id: Math.random(),
      x: Math.random() * (750 - 70),
      y: -60,
      width: 70,
      height: 55,
      speed: currentSpeed,
      horizontalSpeed: (0.5 + Math.random() * 0.5) * Math.min(2.5, (level * 0.1) * gameRef.current.currentSpeedMultiplier),
      direction: (Math.random() < 0.5 ? -1 : 1),
      equation: targetEquation.equation,
      answer: isCorrect ? targetEquation.answer : wrong[Math.floor(Math.random() * wrong.length)],
      isCorrect,
    };
  }, [targetEquation, level]);

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

  const advanceToNextLevel = useCallback(() => {
    setLevel(prevLevel => {
      const newLevel = prevLevel + 1;
      setHighestLevel(prevHighest => Math.max(prevHighest, newLevel));
      
      gameRef.current.currentSpeedMultiplier = 1.0;
      gameRef.current.spawnDelay = Math.max(60, 120 - (newLevel - 1) * 8);
      
      setLevelAnnouncement(`LEVEL ${newLevel}`);
      setShowLevelAnnouncement(true);
      gameRef.current.waitingForSpace = true;
      gameRef.current.gameActive = false;
      
      const eq = generateLinearEquation();
      setTargetEquation(eq);
      
      gameRef.current.enemies = [];
      gameRef.current.bullets = [];
      
      const enemyCount = Math.min(5, 3 + Math.floor(newLevel / 3));
      for (let i = 0; i < enemyCount; i++) {
        const e = createEnemy();
        if (e) {
          e.y = -60 - (i * 50);
          gameRef.current.enemies.push(e);
        }
      }
      
      setFeedback({ message: `🔥 LEVEL UP! Entering Level ${newLevel} 🔥`, type: 'success' });
      
      return newLevel;
    });
    
    setCorrectShots(0);
  }, [generateLinearEquation, createEnemy]);

  const initLevel = useCallback(() => {
    const game = gameRef.current;
    
    game.enemies = [];
    game.bullets = [];
    game.particles = [];
    game.spawnTimer = 0;
    game.baseEnemySpeed = 0.8;
    game.currentSpeedMultiplier = 1.0;
    game.spawnDelay = 120;
    setWrongShots(0);
    setCorrectShots(0);
    setLevel(1);
    setHighestLevel(1);
    setTotalCorrect(0);
    setTotalWrong(0);
    setTotalShots(0);
    setScore(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);

    const eq = generateLinearEquation();
    setTargetEquation(eq);

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
    game.spawnDelay = 120;

    setScore(0);
    setLevel(1);
    setWrongShots(0);
    setCorrectShots(0);
    setTotalCorrect(0);
    setTotalWrong(0);
    setTotalShots(0);
    setHighestLevel(1);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setGameState('playing');
    setShowLevelAnnouncement(false);
    setGameStartTime(Date.now());
    setGameResultSent(false);
    setTimeSpent(0);

    setTimeout(() => {
      initLevel();
    }, 100);
  };

  const shoot = () => {
    const game = gameRef.current;
    const now = Date.now();

    if (now - game.lastShot < 300) return;
    
    setTotalShots(prev => prev + 1);

    game.bullets.push({
      x: game.player.x + 35,
      y: game.player.y - 20,
      width: 4,
      height: 10,
      speed: 7
    });

    game.lastShot = now;
  };

  const increaseSpeed = useCallback(() => {
    const game = gameRef.current;
    game.currentSpeedMultiplier = Math.min(2.5, game.currentSpeedMultiplier + 0.1);
    
    game.enemies.forEach(enemy => {
      const levelBaseSpeed = game.baseEnemySpeed * (1 + (level - 1) * 0.15);
      const newSpeed = levelBaseSpeed * game.currentSpeedMultiplier;
      enemy.speed = newSpeed;
      enemy.horizontalSpeed = (0.5 + Math.random() * 0.5) * Math.min(2.5, (level * 0.1) * game.currentSpeedMultiplier);
    });
    
    const newSpawnDelay = Math.max(50, 120 - (game.currentSpeedMultiplier - 1) * 30 - (level - 1) * 3);
    game.spawnDelay = newSpawnDelay;
  }, [level]);

  // Mobile controls
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvasCoords = getCanvasCoordinates(touch.clientX, touch.clientY);
    setTouchMove({ active: true, x: canvasCoords.x });
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (touchMove.active) {
      const touch = e.touches[0];
      const canvasCoords = getCanvasCoordinates(touch.clientX, touch.clientY);
      const newX = Math.max(0, Math.min(760, canvasCoords.x - 20));
      gameRef.current.player.x = newX;
      setTouchMove(prev => ({ ...prev, x: canvasCoords.x }));
    }
  };

  const handleTouchEnd = () => {
    setTouchMove({ active: false, x: 0 });
  };

  const moveLeft = () => {
    gameRef.current.player.x = Math.max(0, gameRef.current.player.x - 35);
  };

  const moveRight = () => {
    gameRef.current.player.x = Math.min(760, gameRef.current.player.x + 35);
  };

  const handleMobileShoot = () => {
    shoot();
  };

  const updateGame = useCallback(() => {
    const game = gameRef.current;
    if (!game.gameActive || game.waitingForSpace) return;

    if (game.keys['ArrowLeft']) game.player.x -= 5;
    if (game.keys['ArrowRight']) game.player.x += 5;
    game.player.x = Math.max(0, Math.min(760, game.player.x));

    if (game.keys['Space']) shoot();

    game.bullets = game.bullets.filter(b => {
      b.y -= b.speed;
      return b.y > -20;
    });

    game.spawnTimer++;
    const maxEnemies = Math.min(12, 8 + Math.floor(level / 2));
    const spawnDelay = game.spawnDelay || 120;
    if (game.spawnTimer > spawnDelay && game.enemies.length < maxEnemies) {
      const newEnemy = createEnemy();
      if (newEnemy) {
        newEnemy.y = -60;
        newEnemy.x = Math.random() * 730;
        game.enemies.push(newEnemy);
        game.spawnTimer = 0;
      }
    }

    game.enemies.forEach(e => {
      e.x += e.horizontalSpeed * e.direction;
      if (e.x <= 0 || e.x >= 730) e.direction *= -1;
      e.y += e.speed;
    });

    game.enemies = game.enemies.filter(e => e.y < 650);

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
          const isCorrectHit = e.answer === targetEquation.answer;
          
          // ✅ Send XP_UPDATE for consistent tracking
          sendXPUpdate(isCorrectHit, e.answer, targetEquation.answer, targetEquation.equation);
          
          if (isCorrectHit) {
            // ✅ Update XP tracking variables
            setCorrectAnswers(prev => prev + 1);
            setScore(s => s + 100);
            setTotalCorrect(prev => prev + 1);
            setCorrectShots(prev => {
              const newCorrectShots = prev + 1;
              setFeedback({ 
                message: `+100 Correct! x = ${e.answer} | +10 XP! | Speed: ${(gameRef.current.currentSpeedMultiplier).toFixed(1)}x | Level: ${level}`, 
                type: 'success' 
              });
              return newCorrectShots;
            });
            
            for (let i = 0; i < 20; i++) {
              game.particles.push({
                x: e.x + e.width/2,
                y: e.y + e.height/2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30
              });
            }
            
            increaseSpeed();
            
            const newEquation = generateLinearEquation();
            setTargetEquation(newEquation);
            
            game.enemies.forEach(enemy => {
              enemy.equation = newEquation.equation;
            });
          } else {
            // ✅ Update XP tracking variables
            setWrongAnswers(prev => prev + 1);
            setTotalWrong(prev => prev + 1);
            setWrongShots(prev => {
              const newWrongShots = prev + 1;
              setScore(s => Math.max(0, s - 10));
              setFeedback({ 
                message: `-10 Wrong! Answer was ${targetEquation.answer} (-5 XP!) (${newWrongShots}/3 mistakes) | Speed reset!`, 
                type: 'error' 
              });
              
              gameRef.current.currentSpeedMultiplier = 1.0;
              const levelBaseSpeed = gameRef.current.baseEnemySpeed * (1 + (level - 1) * 0.15);
              gameRef.current.spawnDelay = Math.max(60, 120 - (level - 1) * 8);
              
              gameRef.current.enemies.forEach(enemy => {
                const newSpeed = levelBaseSpeed * gameRef.current.currentSpeedMultiplier;
                enemy.speed = newSpeed;
                enemy.horizontalSpeed = (0.5 + Math.random() * 0.5) * Math.min(2.5, (level * 0.1));
              });
              
              for (let i = 0; i < 15; i++) {
                game.particles.push({
                  x: e.x + e.width/2,
                  y: e.y + e.height/2,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  life: 20
                });
              }
              
              if (newWrongShots >= 3) {
                game.gameActive = false;
                game.waitingForSpace = false;
                const finalTimeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
                sendGameResult(false, score, finalTimeSpent, {
                  correctShots: totalCorrect,
                  totalShots: totalShots,
                  highestLevel: level,
                  wrongShots: totalWrong + 1
                });
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
    
    const requiredCorrectShots = 5 + Math.floor(level / 2);
    if (correctShots >= requiredCorrectShots && game.gameActive && !game.waitingForSpace) {
      advanceToNextLevel();
    }
    
    game.particles = game.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      return p.life > 0;
    });
  }, [targetEquation, generateLinearEquation, increaseSpeed, correctShots, level, advanceToNextLevel, gameStartTime, score, totalCorrect, totalShots, totalWrong, sendXPUpdate]);

  const drawGame = useCallback((ctx) => {
    const game = gameRef.current;

    const intensity = Math.min(0.5, 0.2 + (level - 1) * 0.05);
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, `rgb(${10 + level * 2}, ${10 + level}, ${40 + level * 3})`);
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    
    ctx.fillStyle = 'white';
    const starCount = 150 + Math.floor(level * 5);
    for (let i = 0; i < starCount; i++) {
      ctx.fillRect((i * 131) % 800, (i * 253) % 600, 1.5, 1.5);
    }

    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00ffff';
    
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(game.player.x + 5, game.player.y + 15);
    ctx.lineTo(game.player.x + 15, game.player.y + 10);
    ctx.lineTo(game.player.x + 15, game.player.y + 20);
    ctx.fill();
    
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(game.player.x + 20, game.player.y);
    ctx.lineTo(game.player.x + 5, game.player.y + 20);
    ctx.lineTo(game.player.x + 20, game.player.y + 15);
    ctx.lineTo(game.player.x + 35, game.player.y + 20);
    ctx.fill();
    
    ctx.fillStyle = '#0099ff';
    ctx.fillRect(game.player.x + 15, game.player.y + 12, 10, 15);
    
    ctx.fillStyle = '#ff4400';
    ctx.fillRect(game.player.x + 32, game.player.y + 27, 6, 10);
    
    ctx.fillStyle = '#ffaa44';
    ctx.beginPath();
    ctx.moveTo(game.player.x + 8, game.player.y + 18);
    ctx.lineTo(game.player.x + 3, game.player.y + 18);
    ctx.lineTo(game.player.x + 5, game.player.y + 15);
    ctx.lineTo(game.player.x + 8, game.player.y + 18);
    ctx.fill();
    
    ctx.restore();

    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ffff00';
    game.bullets.forEach(b => {
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    game.particles.forEach(p => {
      ctx.fillStyle = `rgba(255, 100, 0, ${p.life / 30})`;
      ctx.fillRect(p.x, p.y, 4, 4);
    });

    game.enemies.forEach(e => {
      ctx.shadowBlur = 5;
      
      const speedFactor = Math.min(1, (game.currentSpeedMultiplier - 1) / 2);
      const levelFactor = Math.min(0.7, (level - 1) * 0.1);
      const intensity = 255 - Math.floor(100 * speedFactor) - Math.floor(50 * levelFactor);
      const gradient = ctx.createLinearGradient(e.x, e.y, e.x + e.width, e.y + e.height);
      gradient.addColorStop(0, `rgb(255, ${Math.max(100, intensity)}, ${Math.max(100, intensity)})`);
      gradient.addColorStop(1, `rgb(170, ${Math.floor(intensity * 0.6)}, ${Math.floor(intensity * 0.6)})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(e.x, e.y, e.width, e.height);
      
      ctx.fillStyle = '#882222';
      ctx.fillRect(e.x + 10, e.y + 12, e.width - 20, 6);
      ctx.fillRect(e.x + 10, e.y + 30, e.width - 20, 6);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(e.x + 12, e.y + 8, 10, 6);
      ctx.fillRect(e.x + e.width - 22, e.y + 8, 10, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(e.x + 14, e.y + 9, 6, 4);
      ctx.fillRect(e.x + e.width - 20, e.y + 9, 6, 4);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.min(28, Math.max(18, 28 * canvasScale))}px "Courier New", monospace`;
      ctx.shadowBlur = 3;
      ctx.shadowColor = '#000000';
      ctx.fillText(e.answer, e.x + 27, e.y + 45);
      
      ctx.strokeStyle = level > 3 ? '#ffaa44' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(e.x + 2, e.y + 2, e.width - 4, e.height - 4);
    });

    ctx.shadowBlur = 0;

    if (feedback.message) {
      ctx.fillStyle = feedback.type === 'success' ? '#4caf50' : '#f44336';
      ctx.font = `bold ${Math.min(24, Math.max(16, 24 * canvasScale))}px Arial`;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'black';
      ctx.fillText(feedback.message, 180, 100);
      
      setTimeout(() => {
        setFeedback({ message: '', type: '' });
      }, 1500);
    }

    if (showLevelAnnouncement) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, 800, 600);
      
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${Math.min(48, Math.max(32, 48 * canvasScale))}px Arial`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff6600';
      ctx.fillText(levelAnnouncement, 280, 280);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.min(28, Math.max(20, 28 * canvasScale))}px Arial`;
      ctx.fillText('Press SPACE to start!', 290, 360);
      ctx.fillStyle = '#88ff88';
      ctx.font = `${Math.min(20, Math.max(14, 20 * canvasScale))}px Arial`;
      ctx.fillText('Solve for x in each equation!', 290, 420);
      ctx.shadowBlur = 0;
    }

    // Adjust font sizes based on screen size
    const titleFontSize = Math.min(22, Math.max(16, 22 * canvasScale));
    const subFontSize = Math.min(18, Math.max(12, 18 * canvasScale));
    const smallFontSize = Math.min(16, Math.max(10, 16 * canvasScale));
    const tinyFontSize = Math.min(12, Math.max(8, 12 * canvasScale));
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${titleFontSize}px Arial`;
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Mistakes: ${wrongShots}/3`, 20, 70);
    
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${Math.min(28, Math.max(20, 28 * canvasScale))}px Arial`;
    ctx.fillText(`LEVEL ${level}`, 20, 120);
    
    // ✅ Display XP earned (consistent with other games)
    ctx.fillStyle = '#aaffaa';
    ctx.font = `bold ${subFontSize}px Arial`;
    ctx.fillText(`⭐ XP: ${xpSoFar} (+${correctAnswers * 10}/-${wrongAnswers * 5})`, 20, 150);
    
    const speedColor = game.currentSpeedMultiplier > 2 ? '#ff4444' : (game.currentSpeedMultiplier > 1.5 ? '#ffaa44' : '#88ff88');
    ctx.fillStyle = speedColor;
    ctx.font = `bold ${subFontSize}px Arial`;
    ctx.fillText(`SPEED: ${game.currentSpeedMultiplier.toFixed(1)}x`, 20, 180);
    
    const requiredCorrect = 5 + Math.floor(level / 2);
    const progress = (correctShots / requiredCorrect) * 100;
    ctx.fillStyle = '#666666';
    ctx.fillRect(20, 200, 150, 12);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(20, 200, (progress / 100) * 150, 12);
    ctx.fillStyle = '#cccccc';
    ctx.font = `${smallFontSize}px Arial`;
    ctx.fillText(`${correctShots}/${requiredCorrect} correct to level up`, 20, 195);
    
    // Display accuracy stats
    if (totalShots > 0) {
      const accuracy = Math.round((totalCorrect / totalShots) * 100);
      ctx.fillStyle = '#88ff88';
      ctx.font = `${smallFontSize}px Arial`;
      ctx.fillText(`Accuracy: ${accuracy}% (${totalCorrect}/${totalShots})`, 20, 230);
    }
    
    // ✅ Display XP breakdown (consistent with other games)
    ctx.fillStyle = '#ffaa88';
    ctx.font = `${tinyFontSize}px Arial`;
    ctx.fillText(`+10 XP/correct, -5 XP/wrong`, 20, 250);
    ctx.fillText(`✅ Correct: ${correctAnswers} | ❌ Wrong: ${wrongAnswers}`, 20, 265);
    
    if (targetEquation && !showLevelAnnouncement && game.gameActive) {
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${Math.min(28, Math.max(20, 28 * canvasScale))}px Arial`;
      ctx.fillText(`Solve: ${targetEquation.equation}`, 260, 50);
      ctx.fillStyle = '#88ff88';
      ctx.font = `${subFontSize}px Arial`;
      ctx.fillText('Find x = ?', 360, 85);
    }
    
    ctx.fillStyle = '#888888';
    ctx.font = `${smallFontSize}px Arial`;
    if (!isMobile) {
      ctx.fillText('← →  Move', 20, 575);
      ctx.fillText('SPACE  Shoot', 20, 595);
    } else {
      ctx.fillText('Use buttons below', 20, 575);
      ctx.fillText('←  →  🔫', 20, 595);
    }
    
    if (!showLevelAnnouncement && game.gameActive) {
      ctx.fillStyle = '#ff8888';
      ctx.font = `${smallFontSize}px Arial`;
      ctx.fillText(`Enemies: ${game.enemies.length}`, 700, 40);
    }
    
    // Display timer
    if (gameState === 'playing' && !showLevelAnnouncement) {
      ctx.fillStyle = '#aaaaaa';
      ctx.font = `${tinyFontSize}px Arial`;
      const minutes = Math.floor(timeSpent / 60);
      const seconds = timeSpent % 60;
      ctx.fillText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, 700, 70);
    }
    
    game.frame++;
  }, [score, targetEquation, feedback, showLevelAnnouncement, levelAnnouncement, wrongShots, level, correctShots, isMobile, totalShots, totalCorrect, gameState, timeSpent, xpSoFar, correctAnswers, wrongAnswers, canvasScale]);

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

  const totalXPEarned = (correctAnswers * 10) - (wrongAnswers * 5);
  const completionBonus = gameState === 'gameOver' ? 0 : (level >= 5 ? 100 : 0);

  return (
    <div style={styles.container}>
      {/* Back button - always visible */}
      <button onClick={handleBackToGames} style={styles.backButton}>
        <FaArrowLeft style={styles.backIcon} />
        Back to Games
      </button>
      
      <div className="game-wrapper" style={styles.gameWrapper}>
        <canvas 
          ref={canvasRef} 
          width={canvasSize.width} 
          height={canvasSize.height} 
          style={{
            ...styles.canvas,
            width: '100%',
            height: 'auto',
            maxWidth: `${canvasSize.width}px`,
            display: 'block',
            margin: '0 auto'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {gameState === 'menu' && (
          <div style={styles.menuOverlay}>
            <div style={styles.menuContent}>
              <h1 style={styles.gameTitle}>🚀 Linear Equation Shooter 🚀</h1>
              <p style={styles.gameSubtitle}>Solve linear equations by shooting the correct x value!</p>
              <div style={styles.features}>
                <p>📐 <strong style={{color: '#ffd700'}}>Linear Equations:</strong> ax + b = c</p>
                <p>🎯 Example: <strong style={{color: '#88ff88'}}>3x + 5 = 14</strong> → Solve for x (x = 3)</p>
                <p>💡 Shoot enemies with the <strong style={{color: '#ffff00'}}>correct x value</strong> to earn points!</p>
                <p>⚠️ Shooting wrong answers loses 10 points AND counts as a mistake!</p>
                <p>⭐ <strong style={{color: '#aaffaa'}}>XP SYSTEM:</strong> +10 XP per correct answer, -5 XP per wrong answer!</p>
                <p>💀 Make 3 mistakes and the game is over!</p>
                <p>⭐ <strong style={{color: '#ffaa44'}}>LEVEL SYSTEM:</strong> Each level is faster than the last!</p>
                <p>⚡ <strong style={{color: '#ffaa44'}}>SPEED MECHANIC:</strong> Each correct answer increases enemy speed by 10%!</p>
                <p>🔥 Make a mistake and speed resets to normal!</p>
                <p>🔄 New enemies spawn faster as speed increases!</p>
                <p>🏆 <strong style={{color: '#ffd700'}}>LEVEL UP:</strong> Get 5+ correct answers to advance to the next level!</p>
                <p>📊 <strong style={{color: '#88ff88'}}>PROGRESS TRACKING:</strong> Your XP and stats are saved!</p>
              </div>
              <button onClick={startGame} style={styles.startButton}>
                Start Game
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div style={styles.gameOverOverlay}>
            <div style={styles.gameOverContent}>
              <h2 style={styles.gameOverTitle}>💀 Game Over 💀</h2>
              <p style={styles.finalScore}>Final Score: {score}</p>
              <p style={styles.finalScore}>You reached Level {highestLevel}</p>
              <p style={styles.finalScore}>✅ Correct Answers: {correctAnswers} (+{correctAnswers * 10} XP)</p>
              <p style={styles.finalScore}>❌ Wrong Answers: {wrongAnswers} (-{wrongAnswers * 5} XP)</p>
              <p style={styles.finalScore}>⭐ Total XP Earned: {totalXPEarned}</p>
              <p style={styles.finalScore}>Accuracy: {totalShots > 0 ? Math.round((totalCorrect / totalShots) * 100) : 0}% ({totalCorrect}/{totalShots})</p>
              <p style={styles.finalScore}>Time: {Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, '0')}</p>
              <p style={styles.finalScore}>You made 3 mistakes!</p>
              <button onClick={startGame} style={styles.retryButton}>
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls - Fixed layout: arrows on left, shoot button on right */}
      {isMobile && gameState === 'playing' && !showLevelAnnouncement && (
        <div style={styles.mobileControls}>
          <div style={styles.leftControls}>
            <button 
              onTouchStart={moveLeft} 
              onMouseDown={moveLeft}
              style={styles.mobileButton}
            >
              <FaArrowLeft size={28} />
            </button>
            <button 
              onTouchStart={moveRight} 
              onMouseDown={moveRight}
              style={styles.mobileButton}
            >
              <FaArrowRight size={28} />
            </button>
          </div>
          <div style={styles.rightControls}>
            <button 
              onTouchStart={handleMobileShoot} 
              onMouseDown={handleMobileShoot}
              style={{...styles.mobileButton, ...styles.shootButton}}
            >
              <FaCrosshairs size={28} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 'clamp(10px, 3vw, 20px)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'fixed',
    top: 'clamp(10px, 2vw, 20px)',
    left: 'clamp(10px, 2vw, 20px)',
    backgroundColor: 'rgba(0,0,0,0.85)',
    color: 'white',
    border: '2px solid rgba(255,255,255,0.3)',
    padding: 'clamp(8px, 2vw, 12px) clamp(15px, 3vw, 20px)',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: 'clamp(12px, 3vw, 16px)',
    fontWeight: 'bold',
    zIndex: 1000,
    transition: 'all 0.3s',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  backIcon: {
    fontSize: 'clamp(12px, 3vw, 16px)',
  },
  gameWrapper: {
    position: 'relative',
    display: 'inline-block',
    margin: 'clamp(60px, 10vh, 80px) auto 0 auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    borderRadius: '10px',
    overflow: 'hidden',
    width: '100%',
    maxWidth: 'min(800px, 95vw)',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: 'auto',
    border: '3px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    touchAction: 'none',
    cursor: 'none',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    backdropFilter: 'blur(8px)',
    zIndex: 10,
    overflow: 'auto',
  },
  menuContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'clamp(15px, 4vh, 20px)',
    padding: 'clamp(20px, 5vh, 30px)',
    textAlign: 'center',
    width: '100%',
    maxWidth: 'min(600px, 90vw)',
    margin: 'auto',
  },
  gameTitle: {
    fontSize: 'clamp(20px, 6vw, 36px)',
    marginBottom: '10px',
    textAlign: 'center',
    color: '#ffd700',
  },
  gameSubtitle: {
    fontSize: 'clamp(12px, 3vw, 18px)',
    textAlign: 'center',
    marginBottom: '10px',
  },
  features: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 'clamp(12px, 3vw, 20px)',
    borderRadius: '10px',
    marginTop: '10px',
    textAlign: 'left',
    lineHeight: '1.6',
    width: '100%',
    fontSize: 'clamp(11px, 2.5vw, 16px)',
    border: '1px solid rgba(255,255,255,0.2)',
    maxHeight: 'min(60vh, 400px)',
    overflow: 'auto',
  },
  startButton: {
    padding: 'clamp(12px, 3vw, 14px) clamp(30px, 8vw, 40px)',
    fontSize: 'clamp(16px, 4vw, 20px)',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    marginTop: '20px',
    boxShadow: '0 4px 15px rgba(76,175,80,0.3)',
    minWidth: 'clamp(160px, 40vw, 200px)',
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    textAlign: 'center',
    padding: 'clamp(15px, 4vh, 20px)',
    zIndex: 10,
  },
  gameOverContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'clamp(12px, 3vh, 20px)',
    padding: 'clamp(15px, 4vh, 20px)',
  },
  gameOverTitle: {
    fontSize: 'clamp(24px, 6vw, 42px)',
    color: '#ff6b6b',
    marginBottom: '10px',
  },
  finalScore: {
    fontSize: 'clamp(14px, 3.5vw, 24px)',
    margin: '5px 0',
  },
  retryButton: {
    padding: 'clamp(10px, 2.5vw, 12px) clamp(25px, 6vw, 35px)',
    fontSize: 'clamp(14px, 3.5vw, 18px)',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #2196F3, #1976D2)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    marginTop: '20px',
    boxShadow: '0 4px 15px rgba(33,150,243,0.3)',
    minWidth: 'clamp(140px, 35vw, 160px)',
  },
  mobileControls: {
    position: 'fixed',
    bottom: 'clamp(10px, 3vh, 20px)',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'clamp(10px, 2vh, 15px) clamp(15px, 4vw, 30px)',
    backgroundColor: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(15px)',
    zIndex: 100,
    borderTop: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 -5px 20px rgba(0,0,0,0.3)',
  },
  leftControls: {
    display: 'flex',
    gap: 'clamp(15px, 5vw, 20px)',
  },
  rightControls: {
    display: 'flex',
  },
  mobileButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: '2px solid rgba(255,255,255,0.6)',
    borderRadius: '60px',
    width: 'clamp(55px, 13vw, 70px)',
    height: 'clamp(55px, 13vw, 70px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
    fontSize: '24px',
    touchAction: 'manipulation',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
  shootButton: {
    backgroundColor: 'rgba(255,80,80,0.8)',
    borderColor: '#ffaa44',
    boxShadow: '0 0 15px rgba(255,80,80,0.5)',
  }
};

// Add hover effects with CSS (since inline styles don't support :hover)
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  button:hover {
    transform: scale(1.05);
    transition: transform 0.2s;
  }
  button:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    button:hover {
      transform: none;
    }
    button:active {
      transform: scale(0.95);
    }
    
    .game-wrapper {
      margin-top: 70px !important;
    }
  }
  
  @media (max-width: 480px) {
    .game-wrapper {
      margin-top: 65px !important;
    }
  }
  
  /* Scrollbar styling for features section */
  .game-wrapper + div ~ div div::-webkit-scrollbar {
    width: 6px;
  }
  
  .game-wrapper + div ~ div div::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
  }
  
  .game-wrapper + div ~ div div::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
  }
`;
document.head.appendChild(styleSheet);

export default SpaceShooter;