// src/games/SpaceShooter.jsx - FULLY RESPONSIVE (optimized for 308x748 and all screen sizes)
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaCrosshairs } from 'react-icons/fa';

const SpaceShooter = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [showLevelAnnouncement, setShowLevelAnnouncement] = useState(false);
  const [levelAnnouncement, setLevelAnnouncement] = useState('');
  const [wrongShots, setWrongShots] = useState(0);
  const [correctShots, setCorrectShots] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameResultSent, setGameResultSent] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [highestLevel, setHighestLevel] = useState(1);
  const [totalShots, setTotalShots] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
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
    spawnDelay: 120,
  });

  const xpSoFar = React.useMemo(() => (correctAnswers * 10) - (wrongAnswers * 5), [correctAnswers, wrongAnswers]);

  const sendXPUpdate = useCallback((isCorrect, userAnswer, correctAnswer, questionText) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'XP_UPDATE', gameId: 'spaceShooter', xpChange: isCorrect ? 10 : -5, isCorrect, correctAnswer, userAnswer, equation: questionText }, '*');
    }
  }, []);

  const sendScoreUpdate = useCallback((currentScore, currentStats) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'SCORE_UPDATE', gameId: 'spaceShooter', score: currentScore, stats: { level, correctShots: totalCorrect, totalShots, accuracy: totalShots > 0 ? Math.round((totalCorrect / totalShots) * 100) : 0, wrongShots: totalWrong, timeSpent: Math.floor((Date.now() - (gameStartTime || Date.now())) / 1000) || 0, xpEarned: xpSoFar, correctAnswers, wrongAnswers } }, '*');
    }
  }, [level, totalCorrect, totalShots, totalWrong, gameStartTime, xpSoFar, correctAnswers, wrongAnswers]);

  useEffect(() => {
    if (gameState === 'playing' && !showLevelAnnouncement) sendScoreUpdate(score, {});
  }, [score, gameState, showLevelAnnouncement, sendScoreUpdate]);

  const sendGameResult = useCallback((completed, finalScore, timeSpentSeconds, stats) => {
    if (gameResultSent) return;
    const accuracy = stats.totalShots > 0 ? Math.round((stats.correctShots / stats.totalShots) * 100) : 0;
    const xpEarned = (correctAnswers * 10) - (wrongAnswers * 5);
    const gameResult = { type: 'GAME_RESULT', gameId: 'spaceShooter', completed, score: finalScore, timeSpent: timeSpentSeconds, stats: { finalScore, correctAnswers, wrongAnswers, totalAnswers: totalShots, accuracy, highestLevel: stats.highestLevel, totalShots, xpEarned, correctShots: stats.correctShots, wrongShots: stats.wrongShots } };
    if (window.parent !== window) window.parent.postMessage(gameResult, '*');
    if (window.opener) window.opener.postMessage(gameResult, '*');
    setGameResultSent(true);
  }, [gameResultSent, correctAnswers, wrongAnswers, totalShots]);

  // Handle messages from parent
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'REQUEST_SCORE') {
        window.parent.postMessage({ type: 'SCORE_UPDATE', gameId: 'spaceShooter', score, stats: { level, correctShots: totalCorrect, totalShots, accuracy: totalShots > 0 ? Math.round((totalCorrect / totalShots) * 100) : 0, wrongShots: totalWrong, timeSpent: Math.floor((Date.now() - (gameStartTime || Date.now())) / 1000) || 0, xpEarned: xpSoFar, correctAnswers, wrongAnswers } }, '*');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [score, level, totalCorrect, totalShots, totalWrong, gameStartTime, xpSoFar, correctAnswers, wrongAnswers]);

  const handleBackToGames = () => {
    if (gameState === 'playing' && !gameResultSent && gameStartTime) {
      const currentTimeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
      sendGameResult(false, score, currentTimeSpent, { correctShots: totalCorrect, totalShots, highestLevel: level, wrongShots: totalWrong });
    }
    navigate('/studenthub/games');
  };

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && gameStartTime && !gameResultSent) {
      timer = setInterval(() => setTimeSpent(Math.floor((Date.now() - gameStartTime) / 1000)), 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, gameStartTime, gameResultSent]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const questions = [
    { text: "A linear equation always makes a straight line because:", correctAnswer: "B", options: ["A. Because x is always positive", "B. Because the rate of change is constant", "C. Because the graph curves upward", "D. Because y is always bigger than x"], explanation: "Constant rate of change creates a straight line." },
    { text: "A tricycle fare increases by ₱5 per kilometer. What does this tell you about the graph?", correctAnswer: "C", options: ["A. It is curved", "B. It is horizontal", "C. It is a straight line rising", "D. It is decreasing"], explanation: "Constant increase = straight line upward." },
    { text: "A water container already has 20 liters before filling starts. What does 20 represent?", correctAnswer: "B", options: ["A. Rate of filling", "B. Initial amount", "C. Final amount", "D. Time"], explanation: "Y-intercept = starting value before change." },
    { text: "A phone load starts at ₱100 and decreases by ₱10 per hour. Which equation represents this?", correctAnswer: "B", options: ["A. y = 10x + 100", "B. y = -10x + 100", "C. y = 100x - 10", "D. y = -10x - 100"], explanation: "Decrease = negative slope, start = 100." },
    { text: "In a savings plan, the slope is 50. What does this mean?", correctAnswer: "B", options: ["A. You start with ₱50", "B. You save ₱50 each time period", "C. You lose ₱50", "D. You have ₱50 total"], explanation: "Slope = change per unit time." },
    { text: "Which situation best matches y = 3x + 2?", correctAnswer: "B", options: ["A. Starting at 3, adding 2 each time", "B. Starting at 2, adding 3 each time", "C. Starting at 3, subtracting 2", "D. Starting at 2, subtracting 3"], explanation: "b=2 (start), m=3 (increase)." },
    { text: "Why is a negative slope important in real life?", correctAnswer: "B", options: ["A. It shows no change", "B. It shows decrease over time", "C. It shows doubling", "D. It shows randomness"], explanation: "Negative slope = decreasing relationship." },
    { text: "Why is intercept form useful in real-life problems?", correctAnswer: "A", options: ["A. It shows exact crossing points on axes", "B. It avoids using slope", "C. It makes equations longer", "D. It removes variables"], explanation: "Shows where graph meets axes." },
    { text: "A budget line crosses (0,500) and (5,0). What does (5,0) mean?", correctAnswer: "B", options: ["A. You have ₱5 left", "B. You can buy 5 items with no money left", "C. You earn ₱5", "D. You spend ₱500"], explanation: "X-intercept = max quantity when money = 0." },
    { text: "If two lines have same slope but different intercepts, what does this mean?", correctAnswer: "B", options: ["A. Same starting point", "B. Same rate but different starting values", "C. Different rates", "D. Same line"], explanation: "Same slope = same rate, different intercepts = different starts." }
  ];

  const getRandomQuestion = useCallback(() => questions[Math.floor(Math.random() * questions.length)], []);

  const createEnemy = useCallback(() => {
    if (!currentQuestion) return null;
    const allOptions = [...currentQuestion.options];
    const correctOptionText = allOptions.find(opt => opt.startsWith(currentQuestion.correctAnswer));
    const wrongOptions = allOptions.filter(opt => !opt.startsWith(currentQuestion.correctAnswer));
    const isCorrect = Math.random() < 0.4;
    const displayAnswer = isCorrect ? correctOptionText : wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    const levelBaseSpeed = gameRef.current.baseEnemySpeed * (1 + (level - 1) * 0.15);
    return { id: Math.random(), x: Math.random() * 730, y: -60, width: 70, height: 55, speed: levelBaseSpeed * gameRef.current.currentSpeedMultiplier, horizontalSpeed: (0.5 + Math.random() * 0.5) * Math.min(2.5, (level * 0.1) * gameRef.current.currentSpeedMultiplier), direction: Math.random() < 0.5 ? -1 : 1, questionText: currentQuestion.text, displayAnswer, isCorrect, correctAnswerLetter: currentQuestion.correctAnswer, allOptions: currentQuestion.options, explanation: currentQuestion.explanation };
  }, [currentQuestion, level]);

  const showLevelStart = (levelNum) => {
    setLevelAnnouncement(`LEVEL ${levelNum}`);
    setShowLevelAnnouncement(true);
    gameRef.current.waitingForSpace = true;
    gameRef.current.gameActive = false;
    setTimeout(() => { if (gameRef.current.waitingForSpace) { setShowLevelAnnouncement(false); gameRef.current.waitingForSpace = false; gameRef.current.gameActive = true; } }, 3000);
  };

  useEffect(() => {
    const handleSpaceToStart = (e) => { if (e.code === 'Space' && showLevelAnnouncement && gameRef.current.waitingForSpace) { e.preventDefault(); setShowLevelAnnouncement(false); gameRef.current.waitingForSpace = false; gameRef.current.gameActive = true; } };
    window.addEventListener('keydown', handleSpaceToStart);
    return () => window.removeEventListener('keydown', handleSpaceToStart);
  }, [showLevelAnnouncement]);

  const advanceToNextLevel = useCallback(() => {
    setLevel(prev => { const newLevel = prev + 1; setHighestLevel(h => Math.max(h, newLevel)); gameRef.current.currentSpeedMultiplier = 1.0; gameRef.current.spawnDelay = Math.max(60, 120 - (newLevel - 1) * 8); setLevelAnnouncement(`LEVEL ${newLevel}`); setShowLevelAnnouncement(true); gameRef.current.waitingForSpace = true; gameRef.current.gameActive = false; setCurrentQuestion(getRandomQuestion()); gameRef.current.enemies = []; gameRef.current.bullets = []; const enemyCount = Math.min(5, 3 + Math.floor(newLevel / 3)); for (let i = 0; i < enemyCount; i++) { const e = createEnemy(); if (e) { e.y = -60 - (i * 50); gameRef.current.enemies.push(e); } } setFeedback({ message: `🔥 LEVEL UP! Level ${newLevel} 🔥`, type: 'success' }); return newLevel; });
    setCorrectShots(0);
  }, [getRandomQuestion, createEnemy]);

  const initLevel = useCallback(() => {
    gameRef.current.enemies = []; gameRef.current.bullets = []; gameRef.current.particles = []; gameRef.current.spawnTimer = 0; gameRef.current.baseEnemySpeed = 0.8; gameRef.current.currentSpeedMultiplier = 1.0; gameRef.current.spawnDelay = 120;
    setWrongShots(0); setCorrectShots(0); setLevel(1); setHighestLevel(1); setTotalCorrect(0); setTotalWrong(0); setTotalShots(0); setScore(0); setCorrectAnswers(0); setWrongAnswers(0);
    setCurrentQuestion(getRandomQuestion());
    for (let i = 0; i < 3; i++) { const e = createEnemy(); if (e) { e.y = -60 - (i * 40); gameRef.current.enemies.push(e); } }
    showLevelStart(1);
  }, [getRandomQuestion, createEnemy]);

  const startGame = () => {
    gameRef.current.gameActive = false; gameRef.current.waitingForSpace = false;
    setScore(0); setLevel(1); setWrongShots(0); setCorrectShots(0); setTotalCorrect(0); setTotalWrong(0); setTotalShots(0); setHighestLevel(1); setCorrectAnswers(0); setWrongAnswers(0);
    setGameState('playing'); setShowLevelAnnouncement(false); setGameStartTime(Date.now()); setGameResultSent(false); setTimeSpent(0);
    setTimeout(() => initLevel(), 100);
  };

  const shoot = useCallback(() => {
    const now = Date.now();
    if (now - gameRef.current.lastShot < 300) return;
    setTotalShots(prev => prev + 1);
    gameRef.current.bullets.push({ x: gameRef.current.player.x + 35, y: gameRef.current.player.y - 20, width: 4, height: 10, speed: 7 });
    gameRef.current.lastShot = now;
  }, []);

  const increaseSpeed = useCallback(() => {
    gameRef.current.currentSpeedMultiplier = Math.min(2.5, gameRef.current.currentSpeedMultiplier + 0.1);
    const levelBaseSpeed = gameRef.current.baseEnemySpeed * (1 + (level - 1) * 0.15);
    gameRef.current.enemies.forEach(enemy => { enemy.speed = levelBaseSpeed * gameRef.current.currentSpeedMultiplier; enemy.horizontalSpeed = (0.5 + Math.random() * 0.5) * Math.min(2.5, (level * 0.1) * gameRef.current.currentSpeedMultiplier); });
    gameRef.current.spawnDelay = Math.max(50, 120 - (gameRef.current.currentSpeedMultiplier - 1) * 30 - (level - 1) * 3);
  }, [level]);

  const moveLeft = () => { gameRef.current.player.x = Math.max(0, gameRef.current.player.x - 35); };
  const moveRight = () => { gameRef.current.player.x = Math.min(760, gameRef.current.player.x + 35); };
  const handleMobileShoot = () => shoot();

  const updateGame = useCallback(() => {
    const game = gameRef.current;
    if (!game.gameActive || game.waitingForSpace) return;
    if (game.keys['ArrowLeft']) game.player.x -= 5;
    if (game.keys['ArrowRight']) game.player.x += 5;
    game.player.x = Math.max(0, Math.min(760, game.player.x));
    if (game.keys['Space']) shoot();
    game.bullets = game.bullets.filter(b => { b.y -= b.speed; return b.y > -20; });
    game.spawnTimer++;
    const maxEnemies = Math.min(12, 8 + Math.floor(level / 2));
    if (game.spawnTimer > (game.spawnDelay || 120) && game.enemies.length < maxEnemies) { const newEnemy = createEnemy(); if (newEnemy) { newEnemy.y = -60; newEnemy.x = Math.random() * 730; game.enemies.push(newEnemy); game.spawnTimer = 0; } }
    game.enemies.forEach(e => { e.x += e.horizontalSpeed * e.direction; if (e.x <= 0 || e.x >= 730) e.direction *= -1; e.y += e.speed; });
    game.enemies = game.enemies.filter(e => e.y < 650);
    for (let bi = game.bullets.length - 1; bi >= 0; bi--) {
      const b = game.bullets[bi];
      for (let ei = game.enemies.length - 1; ei >= 0; ei--) {
        const e = game.enemies[ei];
        if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
          sendXPUpdate(e.isCorrect, e.displayAnswer, e.correctAnswerLetter, e.questionText);
          if (e.isCorrect) {
            setCorrectAnswers(prev => prev + 1); setScore(s => s + 100); setTotalCorrect(prev => prev + 1);
            setCorrectShots(prev => { setFeedback({ message: `+100 Correct! +10 XP! Speed: ${game.currentSpeedMultiplier.toFixed(1)}x | Level: ${level}`, type: 'success' }); return prev + 1; });
            for (let i = 0; i < 20; i++) game.particles.push({ x: e.x + e.width/2, y: e.y + e.height/2, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 30 });
            increaseSpeed();
            setCurrentQuestion(getRandomQuestion());
            game.enemies.forEach(enemy => { enemy.questionText = currentQuestion?.text || ""; enemy.allOptions = currentQuestion?.options || []; enemy.correctAnswerLetter = currentQuestion?.correctAnswer || "A"; const wrongOps = (currentQuestion?.options || []).filter(opt => !opt.startsWith(currentQuestion?.correctAnswer || "")); const isEnemyCorrect = Math.random() < 0.4; enemy.isCorrect = isEnemyCorrect; enemy.displayAnswer = isEnemyCorrect ? (currentQuestion?.options || []).find(opt => opt.startsWith(currentQuestion?.correctAnswer || "")) : wrongOps[Math.floor(Math.random() * wrongOps.length)]; });
          } else {
            setWrongAnswers(prev => prev + 1); setTotalWrong(prev => prev + 1);
            setWrongShots(prev => { const newWrong = prev + 1; setScore(s => Math.max(0, s - 10)); setFeedback({ message: `-10 Wrong! ❌ | Correct: ${e.allOptions.find(opt => opt.startsWith(e.correctAnswerLetter))} (-5 XP!) (${newWrong}/3 mistakes) | Speed reset!`, type: 'error' }); game.currentSpeedMultiplier = 1.0; game.spawnDelay = Math.max(60, 120 - (level - 1) * 8); const levelBaseSpeed = game.baseEnemySpeed * (1 + (level - 1) * 0.15); game.enemies.forEach(enemy => { enemy.speed = levelBaseSpeed; enemy.horizontalSpeed = (0.5 + Math.random() * 0.5) * Math.min(2.5, (level * 0.1)); }); for (let i = 0; i < 15; i++) game.particles.push({ x: e.x + e.width/2, y: e.y + e.height/2, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 20 }); if (newWrong >= 3) { game.gameActive = false; const finalTimeSpent = Math.floor((Date.now() - (gameStartTime || Date.now())) / 1000); sendGameResult(false, score, finalTimeSpent, { correctShots: totalCorrect, totalShots, highestLevel: level, wrongShots: totalWrong + 1 }); setGameState('gameOver'); setFeedback({ message: 'Game Over! 3 wrong answers!', type: 'error' }); } return newWrong; });
          }
          game.bullets.splice(bi, 1); game.enemies.splice(ei, 1); break;
        }
      }
    }
    const requiredCorrectShots = 5 + Math.floor(level / 2);
    if (correctShots >= requiredCorrectShots && game.gameActive && !game.waitingForSpace) advanceToNextLevel();
    game.particles = game.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });
  }, [currentQuestion, getRandomQuestion, increaseSpeed, correctShots, level, advanceToNextLevel, gameStartTime, score, totalCorrect, totalShots, totalWrong, sendXPUpdate, sendGameResult, shoot, createEnemy]);

  const drawGame = useCallback((ctx) => {
    const game = gameRef.current;
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, `rgb(${10 + level * 2}, ${10 + level}, ${40 + level * 3})`); gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = 'white';
    for (let i = 0; i < 150 + Math.floor(level * 5); i++) ctx.fillRect((i * 131) % 800, (i * 253) % 600, 1.5, 1.5);
    ctx.fillStyle = '#ff6600';
    ctx.beginPath(); ctx.moveTo(game.player.x + 5, game.player.y + 15); ctx.lineTo(game.player.x + 15, game.player.y + 10); ctx.lineTo(game.player.x + 15, game.player.y + 20); ctx.fill();
    ctx.fillStyle = '#00ffff';
    ctx.beginPath(); ctx.moveTo(game.player.x + 20, game.player.y); ctx.lineTo(game.player.x + 5, game.player.y + 20); ctx.lineTo(game.player.x + 20, game.player.y + 15); ctx.lineTo(game.player.x + 35, game.player.y + 20); ctx.fill();
    ctx.fillStyle = '#0099ff'; ctx.fillRect(game.player.x + 15, game.player.y + 12, 10, 15);
    ctx.fillStyle = '#ff4400'; ctx.fillRect(game.player.x + 32, game.player.y + 27, 6, 10);
    ctx.fillStyle = '#ffff00';
    game.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
    game.particles.forEach(p => { ctx.fillStyle = `rgba(255, 100, 0, ${p.life / 30})`; ctx.fillRect(p.x, p.y, 4, 4); });
    game.enemies.forEach(e => {
      const gradient = ctx.createLinearGradient(e.x, e.y, e.x + e.width, e.y + e.height);
      gradient.addColorStop(0, `rgb(255, ${255 - Math.floor(100 * (game.currentSpeedMultiplier - 1))}, ${255 - Math.floor(100 * (game.currentSpeedMultiplier - 1))})`);
      gradient.addColorStop(1, `rgb(170, ${Math.floor((255 - Math.floor(100 * (game.currentSpeedMultiplier - 1))) * 0.6)}, ${Math.floor((255 - Math.floor(100 * (game.currentSpeedMultiplier - 1))) * 0.6)})`);
      ctx.fillStyle = gradient; ctx.fillRect(e.x, e.y, e.width, e.height);
      ctx.fillStyle = '#882222'; ctx.fillRect(e.x + 10, e.y + 12, e.width - 20, 6); ctx.fillRect(e.x + 10, e.y + 30, e.width - 20, 6);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(e.x + 12, e.y + 8, 10, 6); ctx.fillRect(e.x + e.width - 22, e.y + 8, 10, 6);
      ctx.fillStyle = '#000000'; ctx.fillRect(e.x + 14, e.y + 9, 6, 4); ctx.fillRect(e.x + e.width - 20, e.y + 9, 6, 4);
      ctx.fillStyle = '#ffffff'; ctx.font = `bold ${Math.min(20, Math.max(14, 20 * (window.innerWidth / 1000)))}px "Courier New", monospace`;
      let displayText = e.displayAnswer; if (displayText?.length > 30) displayText = displayText.substring(0, 27) + '...';
      ctx.fillText(displayText || "?", e.x + 5, e.y + 45);
      ctx.strokeStyle = level > 3 ? '#ffaa44' : '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(e.x + 2, e.y + 2, e.width - 4, e.height - 4);
    });
    if (feedback.message) { ctx.fillStyle = feedback.type === 'success' ? '#4caf50' : '#f44336'; ctx.font = `bold ${Math.min(20, Math.max(14, 20 * (window.innerWidth / 1000)))}px Arial`; ctx.fillText(feedback.message, 180, 100); setTimeout(() => setFeedback({ message: '', type: '' }), 1500); }
    if (showLevelAnnouncement) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ffd700'; ctx.font = `bold ${Math.min(40, Math.max(28, 40 * (window.innerWidth / 1000)))}px Arial`; ctx.fillText(levelAnnouncement, 280, 280);
      ctx.fillStyle = '#ffffff'; ctx.font = `${Math.min(22, Math.max(16, 22 * (window.innerWidth / 1000)))}px Arial`; ctx.fillText('Press SPACE to start!', 290, 360);
      ctx.fillStyle = '#88ff88'; ctx.font = `${Math.min(16, Math.max(12, 16 * (window.innerWidth / 1000)))}px Arial`; ctx.fillText('Shoot the correct answer for each question!', 250, 420);
    }
    const titleFont = Math.min(18, Math.max(12, 18 * (window.innerWidth / 1000)));
    ctx.fillStyle = '#ffffff'; ctx.font = `bold ${titleFont}px Arial`; ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Mistakes: ${wrongShots}/3`, 20, 70);
    ctx.fillStyle = '#ffd700'; ctx.font = `bold ${Math.min(24, Math.max(18, 24 * (window.innerWidth / 1000)))}px Arial`; ctx.fillText(`LEVEL ${level}`, 20, 120);
    ctx.fillStyle = '#aaffaa'; ctx.font = `bold ${Math.min(16, Math.max(12, 16 * (window.innerWidth / 1000)))}px Arial`; ctx.fillText(`⭐ XP: ${xpSoFar} (+${correctAnswers * 10}/-${wrongAnswers * 5})`, 20, 150);
    ctx.fillStyle = game.currentSpeedMultiplier > 2 ? '#ff4444' : (game.currentSpeedMultiplier > 1.5 ? '#ffaa44' : '#88ff88');
    ctx.fillText(`SPEED: ${game.currentSpeedMultiplier.toFixed(1)}x`, 20, 180);
    const requiredCorrect = 5 + Math.floor(level / 2); const progress = (correctShots / requiredCorrect) * 100;
    ctx.fillStyle = '#666666'; ctx.fillRect(20, 200, 150, 12);
    ctx.fillStyle = '#4caf50'; ctx.fillRect(20, 200, (progress / 100) * 150, 12);
    ctx.fillStyle = '#cccccc'; ctx.font = `${Math.min(14, Math.max(10, 14 * (window.innerWidth / 1000)))}px Arial`; ctx.fillText(`${correctShots}/${requiredCorrect} to level up`, 20, 195);
    if (totalShots > 0) { ctx.fillStyle = '#88ff88'; ctx.fillText(`Accuracy: ${Math.round((totalCorrect / totalShots) * 100)}% (${totalCorrect}/${totalShots})`, 20, 230); }
    ctx.fillStyle = '#ffaa88'; ctx.font = `${Math.min(12, Math.max(8, 12 * (window.innerWidth / 1000)))}px Arial`; ctx.fillText(`+10 XP/correct, -5 XP/wrong`, 20, 250);
    ctx.fillText(`✅ ${correctAnswers} | ❌ ${wrongAnswers}`, 20, 265);
    if (currentQuestion && !showLevelAnnouncement && game.gameActive) {
      ctx.fillStyle = '#ffd700'; ctx.font = `bold ${Math.min(18, Math.max(13, 18 * (window.innerWidth / 1000)))}px Arial`;
      let qText = currentQuestion.text; if (qText?.length > 40) qText = qText.substring(0, 37) + '...';
      ctx.fillText(`Q: ${qText || ""}`, 200, 40);
      ctx.fillStyle = '#88ff88'; ctx.font = `${Math.min(14, Math.max(10, 14 * (window.innerWidth / 1000)))}px Arial`; ctx.fillText('Shoot the correct answer!', 260, 70);
    }
    if (!showLevelAnnouncement && game.gameActive && !isMobile) { ctx.fillStyle = '#888888'; ctx.font = `${Math.min(12, Math.max(8, 12 * (window.innerWidth / 1000)))}px Arial`; ctx.fillText('← → Move', 20, 575); ctx.fillText('SPACE Shoot', 20, 595); }
    if (!showLevelAnnouncement && game.gameActive) { ctx.fillStyle = '#ff8888'; ctx.fillText(`Enemies: ${game.enemies.length}`, 700, 40); }
    if (gameState === 'playing' && !showLevelAnnouncement) { ctx.fillStyle = '#aaaaaa'; const mins = Math.floor(timeSpent / 60); const secs = timeSpent % 60; ctx.fillText(`Time: ${mins}:${secs.toString().padStart(2, '0')}`, 700, 70); }
  }, [score, currentQuestion, feedback, showLevelAnnouncement, levelAnnouncement, wrongShots, level, correctShots, isMobile, totalShots, totalCorrect, gameState, timeSpent, xpSoFar, correctAnswers, wrongAnswers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    let animationId;
    const loop = () => { if (gameState === 'playing') updateGame(); if (ctx) drawGame(ctx); animationId = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [gameState, updateGame, drawGame]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.code === 'Space') { e.preventDefault(); gameRef.current.keys['Space'] = true; } else if (e.key === 'ArrowLeft') { e.preventDefault(); gameRef.current.keys['ArrowLeft'] = true; } else if (e.key === 'ArrowRight') { e.preventDefault(); gameRef.current.keys['ArrowRight'] = true; } };
    const handleKeyUp = (e) => { if (e.code === 'Space') gameRef.current.keys['Space'] = false; else if (e.key === 'ArrowLeft') gameRef.current.keys['ArrowLeft'] = false; else if (e.key === 'ArrowRight') gameRef.current.keys['ArrowRight'] = false; };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  const totalXPEarned = (correctAnswers * 10) - (wrongAnswers * 5);

  return (
    <div style={styles.container}>
      <button onClick={handleBackToGames} style={styles.backButton}><FaArrowLeft style={styles.backIcon} /> Back</button>
      <div style={styles.gameWrapper}>
        <canvas ref={canvasRef} width={800} height={600} style={styles.canvas} />
        {gameState === 'menu' && (
          <div style={styles.menuOverlay}><div style={styles.menuContent}><h1 style={styles.gameTitle}>🚀 Equation Shooter 🚀</h1><p style={styles.gameSubtitle}>Shoot the correct answer!</p><div style={styles.features}><p><strong>How to Play:</strong></p><p>🎯 Read the question at the top</p><p>💡 Each enemy has an answer choice</p><p>🔫 Shoot the CORRECT answer!</p><p>⚠️ Wrong answer = -10 points + mistake</p><p>⭐ +10 XP/correct, -5 XP/wrong</p><p>💀 3 mistakes = Game Over!</p><p>⚡ Each correct = speed increase!</p></div><button onClick={startGame} style={styles.startButton}>Start Game</button></div></div>
        )}
        {gameState === 'gameOver' && (
          <div style={styles.gameOverOverlay}><div style={styles.gameOverContent}><h2 style={styles.gameOverTitle}>💀 Game Over 💀</h2><p style={styles.finalScore}>Score: {score}</p><p>Level {highestLevel}</p><p>✅ Correct: {correctAnswers} (+{correctAnswers * 10} XP)</p><p>❌ Wrong: {wrongAnswers} (-{wrongAnswers * 5} XP)</p><p>⭐ XP: {totalXPEarned}</p><p>Accuracy: {totalShots > 0 ? Math.round((totalCorrect / totalShots) * 100) : 0}%</p><p>Time: {Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, '0')}</p><button onClick={startGame} style={styles.retryButton}>Play Again</button></div></div>
        )}
      </div>
      {isMobile && gameState === 'playing' && !showLevelAnnouncement && (
        <div style={styles.mobileControls}><div style={styles.leftControls}><button onTouchStart={moveLeft} onMouseDown={moveLeft} style={styles.mobileButton}><FaArrowLeft size={24} /></button><button onTouchStart={moveRight} onMouseDown={moveRight} style={styles.mobileButton}><FaArrowRight size={24} /></button></div><div style={styles.rightControls}><button onTouchStart={handleMobileShoot} onMouseDown={handleMobileShoot} style={{...styles.mobileButton, ...styles.shootButton}}><FaCrosshairs size={24} /></button></div></div>
      )}
    </div>
  );
};

const styles = {
  container: { width: '100%', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', '@media (min-width: 769px)': { padding: '20px' } },
  backButton: { position: 'fixed', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.85)', color: 'white', border: '2px solid rgba(255,255,255,0.3)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', zIndex: 1000, '@media (min-width: 769px)': { top: '20px', left: '20px', padding: '12px 20px', fontSize: '16px', gap: '8px' } },
  backIcon: { fontSize: '12px', '@media (min-width: 769px)': { fontSize: '16px' } },
  gameWrapper: { position: 'relative', display: 'inline-block', margin: '70px auto 0 auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden', width: '100%', maxWidth: '800px', '@media (min-width: 769px)': { marginTop: '80px' } },
  canvas: { display: 'block', width: '100%', height: 'auto', border: '3px solid rgba(255,255,255,0.2)', borderRadius: '10px', touchAction: 'none' },
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10, overflow: 'auto' },
  menuContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '20px', textAlign: 'center', width: '100%', maxWidth: '500px' },
  gameTitle: { fontSize: '24px', textAlign: 'center', color: '#ffd700', '@media (min-width: 769px)': { fontSize: '36px' } },
  gameSubtitle: { fontSize: '13px', textAlign: 'center', '@media (min-width: 769px)': { fontSize: '18px' } },
  features: { backgroundColor: 'rgba(0,0,0,0.7)', padding: '15px', borderRadius: '10px', marginTop: '10px', textAlign: 'left', lineHeight: '1.6', width: '100%', fontSize: '11px', border: '1px solid rgba(255,255,255,0.2)', maxHeight: '300px', overflow: 'auto', '@media (min-width: 769px)': { padding: '20px', fontSize: '16px', maxHeight: '400px' } },
  startButton: { padding: '12px 30px', fontSize: '16px', fontWeight: 'bold', background: 'linear-gradient(135deg, #4CAF50, #45a049)', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', minWidth: '160px', '@media (min-width: 769px)': { padding: '14px 40px', fontSize: '20px', minWidth: '200px' } },
  gameOverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '15px', zIndex: 10 },
  gameOverContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px' },
  gameOverTitle: { fontSize: '24px', color: '#ff6b6b', '@media (min-width: 769px)': { fontSize: '42px' } },
  finalScore: { fontSize: '14px', margin: '3px 0', '@media (min-width: 769px)': { fontSize: '24px', margin: '5px 0' } },
  retryButton: { padding: '10px 25px', fontSize: '14px', fontWeight: 'bold', background: 'linear-gradient(135deg, #2196F3, #1976D2)', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', minWidth: '140px', '@media (min-width: 769px)': { padding: '12px 35px', fontSize: '18px', minWidth: '160px' } },
  mobileControls: { position: 'fixed', bottom: '10px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, borderTop: '1px solid rgba(255,255,255,0.2)' },
  leftControls: { display: 'flex', gap: '15px' },
  rightControls: { display: 'flex' },
  mobileButton: { backgroundColor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '50px', width: '55px', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', '@media (min-width: 769px)': { width: '70px', height: '70px' } },
  shootButton: { backgroundColor: 'rgba(255,80,80,0.8)', borderColor: '#ffaa44' }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `button:hover:enabled { transform: scale(1.05); } button:active { transform: scale(0.95); } @media (max-width: 480px) { button { min-height: 44px; } .gameTitle { font-size: 20px !important; } .gameSubtitle { font-size: 11px !important; } .features { font-size: 9px !important; } .mobileButton { width: 48px !important; height: 48px !important; } .mobileControls { padding: 8px 12px !important; gap: 12px !important; } } @media (max-width: 360px) { .mobileButton { width: 44px !important; height: 44px !important; } .leftControls { gap: 10px !important; } }`;
document.head.appendChild(styleSheet);

export default SpaceShooter;