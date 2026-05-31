// src/games/SpaceShooter.jsx - FULLY RESPONSIVE with MUSIC & SOUND EFFECTS
// MOBILE OPTIMIZED - Larger text, left/right buttons on left, shoot button on right
// Canvas fills available space, all elements visible without scrolling
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaCrosshairs, FaVolumeUp, FaVolumeMute, FaMusic } from 'react-icons/fa';

class BackgroundMusic {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.3;
  }

  initAudio() {
    if (!this.audio) {
      this.audio = new Audio('/src/games/sounds/spec2.mp3');
      this.audio.loop = true;
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    return this.audio;
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.audio) {
      this.audio.volume = muted ? 0 : this.volume;
    }
  }

  setVolume(volume) {
    this.volume = volume;
    if (this.audio && !this.isMuted) {
      this.audio.volume = volume;
    }
  }

  startMusic() {
    if (this.isPlaying) return;
    this.initAudio();
    this.audio.play().catch(e => console.log('Audio play error:', e));
    this.isPlaying = true;
  }

  stopMusic() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.isPlaying = false;
  }

  resumeAudioContext() {
    if (this.audio && !this.isPlaying && !this.isMuted) {
      this.audio.play().catch(e => console.log('Resume error:', e));
      this.isPlaying = true;
    }
  }
}

const SpaceShooter = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

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
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 800 });
  
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameResultSent, setGameResultSent] = useState(false);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [highestLevel, setHighestLevel] = useState(1);
  const [totalShots, setTotalShots] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSoundEffectsMuted, setIsSoundEffectsMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [showMusicNote, setShowMusicNote] = useState(false);
  
  const backgroundMusic = useRef(null);
  const sfxAudioContext = useRef(null);

  const gameRef = useRef({
    player: { x: 380, y: 750, width: 40, height: 40 },
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

  useEffect(() => {
    const savedMusicMute = localStorage.getItem('spaceShooterMusicMuted');
    const savedSfxMute = localStorage.getItem('spaceShooterSfxMuted');
    const savedVolume = localStorage.getItem('spaceShooterMusicVolume');
    
    if (savedMusicMute !== null) setIsMusicMuted(savedMusicMute === 'true');
    if (savedSfxMute !== null) setIsSoundEffectsMuted(savedSfxMute === 'true');
    if (savedVolume !== null) {
      const vol = parseFloat(savedVolume);
      setMusicVolume(vol);
      if (backgroundMusic.current) backgroundMusic.current.setVolume(vol);
    }
  }, []);

  useEffect(() => {
    backgroundMusic.current = new BackgroundMusic();
    backgroundMusic.current.setMuted(isMusicMuted);
    backgroundMusic.current.setVolume(musicVolume);
    
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      sfxAudioContext.current = new AudioCtx();
    } catch(e) {
      console.log('Web Audio API for SFX not supported');
    }
    
    return () => {
      if (backgroundMusic.current) {
        backgroundMusic.current.stopMusic();
      }
      if (sfxAudioContext.current) {
        sfxAudioContext.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (backgroundMusic.current) {
      backgroundMusic.current.setMuted(isMusicMuted);
      if (gameState === 'playing' && !showLevelAnnouncement && !isMusicMuted) {
        backgroundMusic.current.startMusic();
      } else {
        backgroundMusic.current.stopMusic();
      }
    }
  }, [gameState, showLevelAnnouncement, isMusicMuted]);

  useEffect(() => {
    if (backgroundMusic.current) {
      backgroundMusic.current.setVolume(musicVolume);
    }
  }, [musicVolume]);

  const toggleMusic = () => {
    const newMuteState = !isMusicMuted;
    setIsMusicMuted(newMuteState);
    localStorage.setItem('spaceShooterMusicMuted', newMuteState);
    if (backgroundMusic.current) backgroundMusic.current.setMuted(newMuteState);
    setShowMusicNote(true);
    setTimeout(() => setShowMusicNote(false), 1000);
  };

  const toggleSoundEffects = () => {
    const newMuteState = !isSoundEffectsMuted;
    setIsSoundEffectsMuted(newMuteState);
    localStorage.setItem('spaceShooterSfxMuted', newMuteState);
  };

  const handleMusicVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setMusicVolume(newVolume);
    if (backgroundMusic.current) backgroundMusic.current.setVolume(newVolume);
    localStorage.setItem('spaceShooterMusicVolume', newVolume);
  };

  const playShootSound = useCallback(() => {
    if (isSoundEffectsMuted || !sfxAudioContext.current) return;
    try {
      const ctx = sfxAudioContext.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = 'square';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.1;
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.log('Error playing shoot sound:', error);
    }
  }, [isSoundEffectsMuted]);

  const playExplosionSound = useCallback(() => {
    if (isSoundEffectsMuted || !sfxAudioContext.current) return;
    try {
      const ctx = sfxAudioContext.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 200;
      gain.gain.value = 0.15;
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
      oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (error) {
      console.log('Error playing explosion sound:', error);
    }
  }, [isSoundEffectsMuted]);

  const playLevelUpSound = useCallback(() => {
    if (isSoundEffectsMuted || !sfxAudioContext.current) return;
    try {
      const ctx = sfxAudioContext.current;
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        gain.gain.value = 0.1;
        oscillator.start(ctx.currentTime + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + index * 0.1 + 0.3);
        oscillator.stop(ctx.currentTime + index * 0.1 + 0.3);
      });
    } catch (error) {
      console.log('Error playing level up sound:', error);
    }
  }, [isSoundEffectsMuted]);

  const playGameOverSound = useCallback(() => {
    if (isSoundEffectsMuted || !sfxAudioContext.current) return;
    try {
      const ctx = sfxAudioContext.current;
      const notes = [440, 349.23, 261.63];
      notes.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = freq;
        gain.gain.value = 0.15;
        oscillator.start(ctx.currentTime + index * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + index * 0.15 + 0.4);
        oscillator.stop(ctx.currentTime + index * 0.15 + 0.4);
      });
    } catch (error) {
      console.log('Error playing game over sound:', error);
    }
  }, [isSoundEffectsMuted]);

  const playCorrectSound = useCallback(() => {
    if (isSoundEffectsMuted || !sfxAudioContext.current) return;
    try {
      const ctx = sfxAudioContext.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 523.25;
      gain.gain.value = 0.12;
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2);
      oscillator.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.log('Error playing correct sound:', error);
    }
  }, [isSoundEffectsMuted]);

  const playWrongSound = useCallback(() => {
    if (isSoundEffectsMuted || !sfxAudioContext.current) return;
    try {
      const ctx = sfxAudioContext.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = 'triangle';
      oscillator.frequency.value = 174.61;
      gain.gain.value = 0.12;
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
      oscillator.frequency.exponentialRampToValueAtTime(130.81, ctx.currentTime + 0.3);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (error) {
      console.log('Error playing wrong sound:', error);
    }
  }, [isSoundEffectsMuted]);

  const resumeAudio = useCallback(() => {
    if (backgroundMusic.current) {
      backgroundMusic.current.resumeAudioContext();
    }
    if (sfxAudioContext.current && sfxAudioContext.current.state === 'suspended') {
      sfxAudioContext.current.resume();
    }
  }, []);

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
    if (backgroundMusic.current) {
      backgroundMusic.current.stopMusic();
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

  // Fit canvas to mobile screen
  useEffect(() => {
    const updateCanvasSize = () => {
      const isMobileDevice = window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
      
      const viewportHeight = window.innerHeight;
      const topOffset = isMobileDevice ? 50 : 55;
      const bottomOffset = isMobileDevice ? 85 : 20;
      const availableHeight = viewportHeight - topOffset - bottomOffset;
      
      let canvasWidth, canvasHeight;
      
      if (isMobileDevice) {
        canvasHeight = Math.min(availableHeight, window.innerWidth - 16);
        canvasWidth = canvasHeight;
        
        if (canvasWidth > window.innerWidth - 16) {
          canvasWidth = window.innerWidth - 16;
          canvasHeight = canvasWidth;
        }
      } else {
        canvasHeight = Math.min(800, availableHeight);
        canvasWidth = canvasHeight;
      }
      
      setCanvasSize({
        width: canvasWidth,
        height: canvasHeight
      });
      
      if (canvasRef.current) {
        canvasRef.current.style.width = `${canvasWidth}px`;
        canvasRef.current.style.height = `${canvasHeight}px`;
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    window.addEventListener('orientationchange', updateCanvasSize);
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('orientationchange', updateCanvasSize);
    };
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

  const calculateEnemyDimensions = useCallback((text) => {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `bold 15px "Courier New", monospace`;
    
    let displayText = text;
    if (displayText && displayText.includes('. ')) {
      displayText = displayText.substring(displayText.indexOf('. ') + 2);
    }
    
    const textWidth = ctx.measureText(displayText).width;
    const width = Math.min(250, Math.max(140, textWidth + 35));
    let height = 70;
    if (textWidth > 160) height = 85;
    if (textWidth > 210) height = 100;
    
    return { width, height };
  }, []);

  const createEnemy = useCallback(() => {
    if (!currentQuestion) return null;
    const allOptions = [...currentQuestion.options];
    const correctOptionText = allOptions.find(opt => opt.startsWith(currentQuestion.correctAnswer));
    const wrongOptions = allOptions.filter(opt => !opt.startsWith(currentQuestion.correctAnswer));
    const isCorrect = Math.random() < 0.4;
    const displayAnswer = isCorrect ? correctOptionText : wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    const levelBaseSpeed = gameRef.current.baseEnemySpeed * (1 + (level - 1) * 0.15);
    
    const dimensions = calculateEnemyDimensions(displayAnswer);
    
    return { 
      id: Math.random(), 
      x: Math.random() * (800 - dimensions.width - 10), 
      y: -60, 
      width: dimensions.width, 
      height: dimensions.height, 
      speed: levelBaseSpeed * gameRef.current.currentSpeedMultiplier, 
      horizontalSpeed: (0.5 + Math.random() * 0.5) * Math.min(2.5, (level * 0.1) * gameRef.current.currentSpeedMultiplier), 
      direction: Math.random() < 0.5 ? -1 : 1, 
      questionText: currentQuestion.text, 
      displayAnswer, 
      isCorrect, 
      correctAnswerLetter: currentQuestion.correctAnswer, 
      allOptions: currentQuestion.options, 
      explanation: currentQuestion.explanation 
    };
  }, [currentQuestion, level, calculateEnemyDimensions]);

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
    playLevelUpSound();
    setLevel(prev => { const newLevel = prev + 1; setHighestLevel(h => Math.max(h, newLevel)); gameRef.current.currentSpeedMultiplier = 1.0; gameRef.current.spawnDelay = Math.max(60, 120 - (newLevel - 1) * 8); setLevelAnnouncement(`LEVEL ${newLevel}`); setShowLevelAnnouncement(true); gameRef.current.waitingForSpace = true; gameRef.current.gameActive = false; setCurrentQuestion(getRandomQuestion()); gameRef.current.enemies = []; gameRef.current.bullets = []; const enemyCount = Math.min(4, 2 + Math.floor(newLevel / 3)); for (let i = 0; i < enemyCount; i++) { const e = createEnemy(); if (e) { e.y = -60 - (i * 50); gameRef.current.enemies.push(e); } } setFeedback({ message: `🔥 LEVEL UP! Level ${newLevel} 🔥`, type: 'success' }); return newLevel; });
    setCorrectShots(0);
  }, [getRandomQuestion, createEnemy, playLevelUpSound]);

  const initLevel = useCallback(() => {
    gameRef.current.enemies = []; gameRef.current.bullets = []; gameRef.current.particles = []; gameRef.current.spawnTimer = 0; gameRef.current.baseEnemySpeed = 0.8; gameRef.current.currentSpeedMultiplier = 1.0; gameRef.current.spawnDelay = 120;
    setWrongShots(0); setCorrectShots(0); setLevel(1); setHighestLevel(1); setTotalCorrect(0); setTotalWrong(0); setTotalShots(0); setScore(0); setCorrectAnswers(0); setWrongAnswers(0);
    setCurrentQuestion(getRandomQuestion());
    for (let i = 0; i < 3; i++) { const e = createEnemy(); if (e) { e.y = -60 - (i * 50); gameRef.current.enemies.push(e); } }
    showLevelStart(1);
  }, [getRandomQuestion, createEnemy]);

  const startGame = () => {
    resumeAudio();
    gameRef.current.gameActive = false;
    gameRef.current.waitingForSpace = false;
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
    gameRef.current.enemies = [];
    gameRef.current.bullets = [];
    gameRef.current.particles = [];
    setTimeout(() => initLevel(), 100);
  };

  const shoot = useCallback(() => {
    const now = Date.now();
    if (now - gameRef.current.lastShot < 300) return;
    playShootSound();
    setTotalShots(prev => prev + 1);
    gameRef.current.bullets.push({ x: gameRef.current.player.x + 35, y: gameRef.current.player.y - 20, width: 4, height: 10, speed: 7 });
    gameRef.current.lastShot = now;
  }, [playShootSound]);

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
    const maxEnemies = Math.min(5, 3 + Math.floor(level / 2));
    if (game.spawnTimer > (game.spawnDelay || 120) && game.enemies.length < maxEnemies) { const newEnemy = createEnemy(); if (newEnemy) { newEnemy.y = -60; newEnemy.x = Math.random() * (800 - newEnemy.width - 10); game.enemies.push(newEnemy); game.spawnTimer = 0; } }
    game.enemies.forEach(e => { 
      e.x += e.horizontalSpeed * e.direction; 
      if (e.x <= 0 || e.x >= 800 - e.width) e.direction *= -1; 
      e.y += e.speed; 
    });
    game.enemies = game.enemies.filter(e => e.y < 850);
    for (let bi = game.bullets.length - 1; bi >= 0; bi--) {
      const b = game.bullets[bi];
      for (let ei = game.enemies.length - 1; ei >= 0; ei--) {
        const e = game.enemies[ei];
        if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
          sendXPUpdate(e.isCorrect, e.displayAnswer, e.correctAnswerLetter, e.questionText);
          if (e.isCorrect) {
            playCorrectSound();
            setCorrectAnswers(prev => prev + 1); setScore(s => s + 100); setTotalCorrect(prev => prev + 1);
            setCorrectShots(prev => { setFeedback({ message: `+100 Correct! +10 XP! Speed: ${game.currentSpeedMultiplier.toFixed(1)}x | Level: ${level}`, type: 'success' }); return prev + 1; });
            for (let i = 0; i < 20; i++) game.particles.push({ x: e.x + e.width/2, y: e.y + e.height/2, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 30 });
            increaseSpeed();
            setCurrentQuestion(getRandomQuestion());
            game.enemies.forEach(enemy => { 
              enemy.questionText = currentQuestion?.text || ""; 
              enemy.allOptions = currentQuestion?.options || []; 
              enemy.correctAnswerLetter = currentQuestion?.correctAnswer || "A"; 
              const wrongOps = (currentQuestion?.options || []).filter(opt => !opt.startsWith(currentQuestion?.correctAnswer || "")); 
              const isEnemyCorrect = Math.random() < 0.4; 
              enemy.isCorrect = isEnemyCorrect; 
              const newAnswer = isEnemyCorrect ? (currentQuestion?.options || []).find(opt => opt.startsWith(currentQuestion?.correctAnswer || "")) : wrongOps[Math.floor(Math.random() * wrongOps.length)];
              enemy.displayAnswer = newAnswer;
              const newDimensions = calculateEnemyDimensions(newAnswer);
              enemy.width = newDimensions.width;
              enemy.height = newDimensions.height;
            });
          } else {
            playWrongSound();
            setWrongAnswers(prev => prev + 1); setTotalWrong(prev => prev + 1);
            setWrongShots(prev => { const newWrong = prev + 1; setScore(s => Math.max(0, s - 10)); setFeedback({ message: `-10 Wrong! ❌ | Correct: ${e.allOptions.find(opt => opt.startsWith(e.correctAnswerLetter))} (-5 XP!) (${newWrong}/3 mistakes) | Speed reset!`, type: 'error' }); game.currentSpeedMultiplier = 1.0; game.spawnDelay = Math.max(60, 120 - (level - 1) * 8); const levelBaseSpeed = game.baseEnemySpeed * (1 + (level - 1) * 0.15); game.enemies.forEach(enemy => { enemy.speed = levelBaseSpeed; enemy.horizontalSpeed = (0.5 + Math.random() * 0.5) * Math.min(2.5, (level * 0.1)); }); for (let i = 0; i < 15; i++) game.particles.push({ x: e.x + e.width/2, y: e.y + e.height/2, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 20 }); if (newWrong >= 3) { 
                playGameOverSound();
                game.gameActive = false; 
                const finalTimeSpent = Math.floor((Date.now() - (gameStartTime || Date.now())) / 1000); 
                sendGameResult(false, score, finalTimeSpent, { correctShots: totalCorrect, totalShots, highestLevel: level, wrongShots: totalWrong + 1 }); 
                setGameState('gameOver'); 
                setShowLevelAnnouncement(false);
                setFeedback({ message: 'Game Over! 3 wrong answers!', type: 'error' }); 
              } 
              return newWrong; 
            });
          }
          playExplosionSound();
          game.bullets.splice(bi, 1); game.enemies.splice(ei, 1); break;
        }
      }
    }
    const requiredCorrectShots = 5 + Math.floor(level / 2);
    if (correctShots >= requiredCorrectShots && game.gameActive && !game.waitingForSpace) advanceToNextLevel();
    game.particles = game.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });
  }, [currentQuestion, getRandomQuestion, increaseSpeed, correctShots, level, advanceToNextLevel, gameStartTime, score, totalCorrect, totalShots, totalWrong, sendXPUpdate, sendGameResult, shoot, createEnemy, calculateEnemyDimensions, playCorrectSound, playWrongSound, playExplosionSound, playGameOverSound]);

  const drawGame = useCallback((ctx) => {
    const game = gameRef.current;
    const scale = canvasSize.width / 800;
    
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 800);
    gradient.addColorStop(0, `rgb(${10 + level * 2}, ${10 + level}, ${40 + level * 3})`);
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 800);
    
    // Stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 150; i++) {
      ctx.fillRect((i * 131) % 800, (i * 253) % 800, 1.5, 1.5);
    }
    
    // Player ship
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
    
    // Bullets
    ctx.fillStyle = '#ffff00';
    game.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
    
    // Particles
    game.particles.forEach(p => {
      ctx.fillStyle = `rgba(255, 100, 0, ${p.life / 30})`;
      ctx.fillRect(p.x, p.y, 3, 3);
    });
    
    // Enemies
    game.enemies.forEach(e => {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(e.x, e.y, e.width, e.height);
      ctx.fillStyle = '#16213e';
      ctx.fillRect(e.x + 3, e.y + 3, e.width - 6, e.height - 6);
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(e.x + 8, e.y + 10, 10, 7);
      ctx.fillRect(e.x + e.width - 18, e.y + 10, 10, 7);
      
      ctx.fillStyle = '#e0e0e0';
      
      let displayText = e.displayAnswer;
      if (displayText && displayText.includes('. ')) {
        displayText = displayText.substring(displayText.indexOf('. ') + 2);
      }
      
      let fontSize = Math.max(13, Math.min(18, 15 * scale));
      ctx.font = `bold ${fontSize}px "Courier New", monospace`;
      let textWidth = ctx.measureText(displayText || "?").width;
      
      while (textWidth > e.width - 16 && fontSize > 10) {
        fontSize--;
        ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        textWidth = ctx.measureText(displayText || "?").width;
      }
      
      const textX = e.x + (e.width / 2) - (textWidth / 2);
      const textY = e.y + (e.height / 2) + 6;
      
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 3;
      ctx.fillText(displayText || "?", textX, textY);
      ctx.shadowBlur = 0;
      
      ctx.strokeStyle = '#ffaa44';
      ctx.lineWidth = 2;
      ctx.strokeRect(e.x + 2, e.y + 2, e.width - 4, e.height - 4);
    });
    
    // Feedback
    if (feedback.message && gameState === 'playing') {
      ctx.fillStyle = feedback.type === 'success' ? '#4caf50' : '#f44336';
      ctx.font = `bold ${Math.max(14, Math.min(22, 16 * scale))}px Arial`;
      const msgX = 400 - ctx.measureText(feedback.message).width / 2;
      ctx.fillText(feedback.message, msgX, 90);
      setTimeout(() => setFeedback({ message: '', type: '' }), 1500);
    }
    
    // Level announcement
    if (showLevelAnnouncement && gameState === 'playing') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, 800, 800);
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${Math.max(32, Math.min(55, 38 * scale))}px Arial`;
      const levelX = 400 - ctx.measureText(levelAnnouncement).width / 2;
      ctx.fillText(levelAnnouncement, levelX, 380);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(16, Math.min(26, 19 * scale))}px Arial`;
      const spaceX = 400 - ctx.measureText('Press SPACE to start!').width / 2;
      ctx.fillText('Press SPACE to start!', spaceX, 460);
      ctx.fillStyle = '#88ff88';
      ctx.font = `${Math.max(13, Math.min(20, 15 * scale))}px Arial`;
      const shootX = 400 - ctx.measureText('Shoot the correct answer!').width / 2;
      ctx.fillText('Shoot the correct answer!', shootX, 520);
    }
    
    // UI Stats - larger text for mobile
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(14, Math.min(22, 16 * scale))}px Arial`;
    ctx.fillText(`Score: ${score}`, 8, 30);
    ctx.fillText(`Mistakes: ${wrongShots}/3`, 8, 58);
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${Math.max(18, Math.min(28, 20 * scale))}px Arial`;
    ctx.fillText(`LVL ${level}`, 8, 92);
    ctx.fillStyle = '#aaffaa';
    ctx.font = `bold ${Math.max(11, Math.min(17, 13 * scale))}px Arial`;
    ctx.fillText(`XP: ${xpSoFar}`, 8, 115);
    
    // Speed indicator
    ctx.fillStyle = game.currentSpeedMultiplier > 2 ? '#ff4444' : (game.currentSpeedMultiplier > 1.5 ? '#ffaa44' : '#88ff88');
    ctx.fillText(`⚡${game.currentSpeedMultiplier.toFixed(1)}x`, 8, 138);
    
    // Progress bar
    const requiredCorrect = 5 + Math.floor(level / 2);
    const progress = (correctShots / requiredCorrect) * 100;
    ctx.fillStyle = '#666666';
    ctx.fillRect(8, 152, 110, 8);
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(8, 152, (progress / 100) * 110, 8);
    ctx.fillStyle = '#cccccc';
    ctx.font = `${Math.max(10, Math.min(15, 12 * scale))}px Arial`;
    ctx.fillText(`${correctShots}/${requiredCorrect}`, 8, 149);
    
    // Accuracy
    if (totalShots > 0) {
      ctx.fillStyle = '#88ff88';
      ctx.fillText(`Acc: ${Math.round((totalCorrect / totalShots) * 100)}%`, 8, 175);
    }
    
    // Question at top - larger and centered
    if (currentQuestion && !showLevelAnnouncement && game.gameActive && gameState === 'playing') {
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${Math.max(13, Math.min(19, 15 * scale))}px Arial`;
      let qText = currentQuestion.text;
      const maxWidth = Math.min(500, 650 * scale);
      const words = qText.split(' ');
      let lines = [];
      let currentLine = '';
      
      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);
      
      let yOffset = 28;
      for (let i = 0; i < lines.length; i++) {
        const lineX = 400 - ctx.measureText(lines[i]).width / 2;
        ctx.fillText(lines[i], lineX, yOffset);
        yOffset += 22;
      }
      
      ctx.fillStyle = '#88ff88';
      ctx.font = `bold ${Math.max(11, Math.min(17, 13 * scale))}px Arial`;
      const shootX = 400 - ctx.measureText('▼ SHOOT CORRECT ANSWER ▼').width / 2;
      ctx.fillText('▼ SHOOT CORRECT ANSWER ▼', shootX, yOffset + 10);
    }
    
    // Enemy count and timer
    if (!showLevelAnnouncement && game.gameActive && gameState === 'playing') {
      ctx.fillStyle = '#ff8888';
      ctx.font = `bold ${Math.max(12, Math.min(18, 14 * scale))}px Arial`;
      ctx.fillText(`👾 ${game.enemies.length}`, 740, 30);
    }
    if (gameState === 'playing' && !showLevelAnnouncement) {
      ctx.fillStyle = '#aaaaaa';
      const mins = Math.floor(timeSpent / 60);
      const secs = timeSpent % 60;
      ctx.fillText(`⏱ ${mins}:${secs.toString().padStart(2, '0')}`, 735, 58);
    }
  }, [score, currentQuestion, feedback, showLevelAnnouncement, levelAnnouncement, wrongShots, level, correctShots, totalShots, totalCorrect, gameState, timeSpent, xpSoFar, canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    let animationId;
    const loop = () => {
      if (gameState === 'playing') updateGame();
      if (ctx) drawGame(ctx);
      animationId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [gameState, updateGame, drawGame]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        gameRef.current.keys['Space'] = true;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        gameRef.current.keys['ArrowLeft'] = true;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        gameRef.current.keys['ArrowRight'] = true;
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') gameRef.current.keys['Space'] = false;
      else if (e.key === 'ArrowLeft') gameRef.current.keys['ArrowLeft'] = false;
      else if (e.key === 'ArrowRight') gameRef.current.keys['ArrowRight'] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const totalXPEarned = (correctAnswers * 10) - (wrongAnswers * 5);

  return (
    <div style={styles.container} onClick={resumeAudio} ref={containerRef}>
      {/* Music Controls */}
      <div style={styles.musicControls}>
        <button onClick={toggleMusic} style={styles.musicButton}>
          {isMusicMuted ? <FaVolumeMute /> : <FaMusic />}
        </button>
        <button onClick={toggleSoundEffects} style={styles.musicButton}>
          {isSoundEffectsMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
        <input type="range" min="0" max="1" step="0.01" value={musicVolume} onChange={handleMusicVolumeChange} style={styles.volumeSlider} />
      </div>
      
      {showMusicNote && <div style={styles.musicNoteAnimation}>🎵</div>}

      <div style={styles.topBar}>
        <button onClick={handleBackToGames} style={styles.backButton}>
          <FaArrowLeft style={styles.backIcon} /> Back
        </button>
      </div>
      
      <div style={styles.gameWrapper}>
        <canvas
          ref={canvasRef}
          width={800}
          height={800}
          style={{
            ...styles.canvas,
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            touchAction: 'none',
            display: 'block'
          }}
        />
        
        {gameState === 'menu' && (
          <div style={{...styles.menuOverlay, width: canvasSize.width, height: canvasSize.height}}>
            <div style={styles.menuContent}>
              <h1 style={styles.gameTitle}>🚀 Equation Shooter</h1>
              <p style={styles.gameSubtitle}>Shoot the correct answer!</p>
              <div style={styles.features}>
                <p>🎯 Read the question</p>
                <p>🔫 Shoot CORRECT answer!</p>
                <p>⚠️ 3 mistakes = Game Over!</p>
                <p>⭐ +10 XP/correct, -5 XP/wrong</p>
              </div>
              <button onClick={startGame} style={styles.startButton}>Start Game</button>
            </div>
          </div>
        )}
        
        {gameState === 'gameOver' && (
          <div style={{...styles.gameOverOverlay, width: canvasSize.width, height: canvasSize.height}}>
            <div style={styles.gameOverContent}>
              <h2 style={styles.gameOverTitle}>💀 Game Over</h2>
              <p style={styles.finalScore}>Score: {score}</p>
              <p>Level {highestLevel}</p>
              <p>✅ {correctAnswers} (+{correctAnswers * 10} XP)</p>
              <p>❌ {wrongAnswers} (-{wrongAnswers * 5} XP)</p>
              <p>⭐ XP: {totalXPEarned}</p>
              <button onClick={startGame} style={styles.retryButton}>Play Again</button>
            </div>
          </div>
        )}
      </div>
      
      {isMobile && gameState === 'playing' && !showLevelAnnouncement && (
        <div style={styles.mobileControls}>
          <div style={styles.leftControls}>
            <button onTouchStart={moveLeft} onMouseDown={moveLeft} style={styles.mobileButton}>
              <FaArrowLeft size={30} />
            </button>
            <button onTouchStart={moveRight} onMouseDown={moveRight} style={styles.mobileButton}>
              <FaArrowRight size={30} />
            </button>
          </div>
          <div style={styles.rightControls}>
            <button onTouchStart={handleMobileShoot} onMouseDown={handleMobileShoot} style={{...styles.mobileButton, ...styles.shootButton}}>
              <FaCrosshairs size={30} />
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
    height: '100vh',
    background: 'linear-gradient(135deg, #1a1a3e 0%, #0a0a2a 100%)',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  musicControls: {
    position: 'fixed',
    top: '8px',
    right: '8px',
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    zIndex: 1001,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: '5px 8px',
    borderRadius: '25px',
  },
  musicButton: {
    backgroundColor: '#4a6fa5',
    color: 'white',
    border: 'none',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
  },
  volumeSlider: {
    width: '65px',
    height: '3px',
    cursor: 'pointer',
    backgroundColor: '#667eea',
    borderRadius: '3px',
  },
  musicNoteAnimation: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '50px',
    animation: 'musicNote 1s ease-out',
    pointerEvents: 'none',
    zIndex: 2000,
  },
  topBar: {
    position: 'fixed',
    top: '8px',
    left: '8px',
    zIndex: 1000,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  backIcon: {
    fontSize: '13px',
  },
  gameWrapper: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  canvas: {
    display: 'block',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    touchAction: 'none',
    backgroundColor: '#000',
    boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    background: 'rgba(0,0,0,0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    zIndex: 10,
  },
  menuContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '15px',
    textAlign: 'center',
    width: '85%',
    maxWidth: '280px',
  },
  gameTitle: {
    fontSize: '22px',
    textAlign: 'center',
    color: '#ffd700',
    margin: 0,
  },
  gameSubtitle: {
    fontSize: '13px',
    textAlign: 'center',
    margin: 0,
  },
  features: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: '10px',
    borderRadius: '10px',
    textAlign: 'left',
    width: '100%',
    fontSize: '11px',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  startButton: {
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
    color: 'white',
    border: 'none',
    borderRadius: '40px',
    cursor: 'pointer',
    minWidth: '130px',
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    background: 'rgba(0,0,0,0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    zIndex: 10,
  },
  gameOverContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '15px',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: '12px',
    minWidth: '180px',
    textAlign: 'center',
  },
  gameOverTitle: {
    fontSize: '22px',
    color: '#ff6b6b',
    margin: 0,
  },
  finalScore: {
    fontSize: '16px',
    margin: '3px 0',
    fontWeight: 'bold',
  },
  retryButton: {
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #2196F3, #1976D2)',
    color: 'white',
    border: 'none',
    borderRadius: '40px',
    cursor: 'pointer',
    marginTop: '5px',
  },
  mobileControls: {
    position: 'fixed',
    bottom: '15px',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 100,
    borderTop: '1px solid rgba(255,255,255,0.2)',
  },
  leftControls: {
    display: 'flex',
    gap: '25px',
  },
  rightControls: {
    display: 'flex',
  },
  mobileButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: '2px solid rgba(255,255,255,0.6)',
    borderRadius: '60px',
    width: '65px',
    height: '65px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
  },
  shootButton: {
    backgroundColor: 'rgba(255,80,80,0.85)',
    borderColor: '#ffaa55',
  }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  button:hover:enabled { transform: scale(1.05); }
  button:active { transform: scale(0.95); }
  @keyframes musicNote {
    0% { transform: translate(-50%, -50%) scale(0.5) rotate(0deg); opacity: 1; }
    100% { transform: translate(-50%, -150%) scale(1.5) rotate(20deg); opacity: 0; }
  }
  input[type="range"] { -webkit-appearance: none; background: #667eea; outline: none; }
  input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #ffd93d; cursor: pointer; }
`;
document.head.appendChild(styleSheet);

export default SpaceShooter;