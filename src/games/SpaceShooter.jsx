// src/games/SpaceShooter.jsx - FULLY RESPONSIVE with MUSIC & SOUND EFFECTS
// Fixed for small mobile devices (274x879)
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaCrosshairs, FaVolumeUp, FaVolumeMute, FaMusic } from 'react-icons/fa';

// Background Music using Web Audio API
class BackgroundMusic {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.3;
    this.audioContext = null;
    this.source = null;
    this.gainNode = null;
    this.useWebAudio = true;
  }

  initWebAudio() {
    if (!this.audioContext && window.AudioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.isMuted ? 0 : this.volume;
      this.startMelody();
    }
    return this.audioContext;
  }

  startMelody() {
    if (!this.audioContext || this.source) return;
    
    const playNote = (freq, startTime, duration) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.gainNode);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.15;
      osc.start(startTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);
      osc.stop(startTime + duration);
    };
    
    const scheduleLoop = () => {
      if (!this.isPlaying) return;
      const now = this.audioContext.currentTime;
      const pattern = [261.63, 293.66, 329.63, 261.63, 329.63, 293.66, 261.63];
      pattern.forEach((freq, i) => {
        playNote(freq, now + i * 0.3, 0.25);
      });
      this.timeoutId = setTimeout(() => scheduleLoop(), pattern.length * 300);
    };
    
    scheduleLoop();
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.gainNode) this.gainNode.gain.value = muted ? 0 : this.volume;
  }

  setVolume(volume) {
    this.volume = volume;
    if (this.gainNode && !this.isMuted) this.gainNode.gain.value = volume;
  }

  startMusic() {
    if (this.isPlaying) return;
    this.initWebAudio();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    this.isPlaying = true;
  }

  stopMusic() {
    this.isPlaying = false;
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }

  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    if (!this.isPlaying && !this.isMuted) this.startMusic();
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
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 400, height: 400 });
  
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
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const backgroundMusic = useRef(null);
  const sfxAudioContext = useRef(null);

  const gameRef = useRef({
    player: { x: 180, y: 340, width: 40, height: 40 },
    bullets: [],
    enemies: [],
    particles: [],
    keys: {},
    frame: 0,
    lastShot: 0,
    gameActive: false,
    waitingForSpace: false,
    spawnTimer: 0,
    baseEnemySpeed: 0.7,
    currentSpeedMultiplier: 1.0,
    spawnDelay: 130,
  });

  const xpSoFar = React.useMemo(() => (correctAnswers * 10) - (wrongAnswers * 5), [correctAnswers, wrongAnswers]);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 2500);
  }, []);

  useEffect(() => {
    const savedMusicMute = localStorage.getItem('spaceShooterMusicMuted');
    const savedSfxMute = localStorage.getItem('spaceShooterSfxMuted');
    const savedVolume = localStorage.getItem('spaceShooterMusicVolume');
    if (savedMusicMute !== null) setIsMusicMuted(savedMusicMute === 'true');
    if (savedSfxMute !== null) setIsSoundEffectsMuted(savedSfxMute === 'true');
    if (savedVolume !== null) setMusicVolume(parseFloat(savedVolume));
  }, []);

  useEffect(() => {
    backgroundMusic.current = new BackgroundMusic();
    backgroundMusic.current.setMuted(isMusicMuted);
    backgroundMusic.current.setVolume(musicVolume);
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      sfxAudioContext.current = new AudioCtx();
    } catch(e) {}
    return () => {
      if (backgroundMusic.current) backgroundMusic.current.stopMusic();
      if (sfxAudioContext.current) sfxAudioContext.current.close();
    };
  }, []);

  useEffect(() => {
    if (backgroundMusic.current) {
      backgroundMusic.current.setMuted(isMusicMuted);
      if (gameState === 'playing' && !showLevelAnnouncement && !isMusicMuted) {
        backgroundMusic.current.startMusic();
      } else if (gameState !== 'playing') {
        backgroundMusic.current.stopMusic();
      }
    }
  }, [gameState, showLevelAnnouncement, isMusicMuted]);

  useEffect(() => {
    if (backgroundMusic.current) backgroundMusic.current.setVolume(musicVolume);
  }, [musicVolume]);

  const toggleMusic = () => {
    const newMute = !isMusicMuted;
    setIsMusicMuted(newMute);
    localStorage.setItem('spaceShooterMusicMuted', newMute);
    if (backgroundMusic.current) backgroundMusic.current.setMuted(newMute);
    setShowMusicNote(true);
    setTimeout(() => setShowMusicNote(false), 1000);
  };

  const toggleSoundEffects = () => {
    const newMute = !isSoundEffectsMuted;
    setIsSoundEffectsMuted(newMute);
    localStorage.setItem('spaceShooterSfxMuted', newMute);
  };

  const handleMusicVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setMusicVolume(vol);
    if (backgroundMusic.current) backgroundMusic.current.setVolume(vol);
    localStorage.setItem('spaceShooterMusicVolume', vol);
  };

  const playShootSound = useCallback(() => {
    if (isSoundEffectsMuted || !sfxAudioContext.current) return;
    try {
      const ctx = sfxAudioContext.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square'; osc.frequency.value = 880;
      gain.gain.value = 0.1;
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  }, [isSoundEffectsMuted]);

  const playExplosionSound = useCallback(() => {
    if (isSoundEffectsMuted || !sfxAudioContext.current) return;
    try {
      const ctx = sfxAudioContext.current;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth'; osc.frequency.value = 200; gain.gain.value = 0.15;
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch(e) {}
  }, [isSoundEffectsMuted]);

  const playLevelUpSound = useCallback(() => {
    if (isSoundEffectsMuted || !sfxAudioContext.current) return;
    try {
      const ctx = sfxAudioContext.current;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.value = freq; gain.gain.value = 0.1;
        osc.start(ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + idx * 0.1 + 0.3);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
      });
    } catch(e) {}
  }, [isSoundEffectsMuted]);

  const playGameOverSound = useCallback(() => {
    if (isSoundEffectsMuted || !sfxAudioContext.current) return;
    try {
      const ctx = sfxAudioContext.current;
      [440, 349.23, 261.63].forEach((freq, idx) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sawtooth'; osc.frequency.value = freq; gain.gain.value = 0.15;
        osc.start(ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + idx * 0.15 + 0.4);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.4);
      });
    } catch(e) {}
  }, [isSoundEffectsMuted]);

  const playCorrectSound = useCallback(() => {
    if (isSoundEffectsMuted || !sfxAudioContext.current) return;
    try {
      const ctx = sfxAudioContext.current;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = 523.25; gain.gain.value = 0.12;
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2);
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  }, [isSoundEffectsMuted]);

  const playWrongSound = useCallback(() => {
    if (isSoundEffectsMuted || !sfxAudioContext.current) return;
    try {
      const ctx = sfxAudioContext.current;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'triangle'; osc.frequency.value = 174.61; gain.gain.value = 0.12;
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(130.81, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.4);
    } catch(e) {}
  }, [isSoundEffectsMuted]);

  const resumeAudio = useCallback(() => {
    if (backgroundMusic.current) backgroundMusic.current.resumeAudioContext();
    if (sfxAudioContext.current && sfxAudioContext.current.state === 'suspended') {
      sfxAudioContext.current.resume();
    }
  }, []);

  const sendXPUpdate = useCallback((isCorrect, userAnswer, correctAnswer, questionText) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'XP_UPDATE', gameId: 'spaceShooter', xpChange: isCorrect ? 10 : -5, isCorrect, correctAnswer, userAnswer, equation: questionText }, '*');
    }
  }, []);

  const sendScoreUpdate = useCallback(() => {
    if (window.parent !== window && gameState === 'playing') {
      window.parent.postMessage({ type: 'SCORE_UPDATE', gameId: 'spaceShooter', score, stats: { level, correctShots: totalCorrect, totalShots, accuracy: totalShots > 0 ? Math.round((totalCorrect / totalShots) * 100) : 0, wrongShots: totalWrong, timeSpent, xpEarned: xpSoFar, correctAnswers, wrongAnswers } }, '*');
    }
  }, [score, level, totalCorrect, totalShots, totalWrong, timeSpent, xpSoFar, correctAnswers, wrongAnswers, gameState]);

  const sendGameResult = useCallback((completed, finalScore, timeSpentSeconds, stats) => {
    if (gameResultSent) return;
    const xpEarned = (correctAnswers * 10) - (wrongAnswers * 5);
    const gameResult = { type: 'GAME_RESULT', gameId: 'spaceShooter', completed, score: finalScore, timeSpent: timeSpentSeconds, stats: { finalScore, correctAnswers, wrongAnswers, totalAnswers: totalShots, accuracy: stats.totalShots > 0 ? Math.round((stats.correctShots / stats.totalShots) * 100) : 0, highestLevel: stats.highestLevel, totalShots, xpEarned, correctShots: stats.correctShots, wrongShots: stats.wrongShots } };
    if (window.parent !== window) window.parent.postMessage(gameResult, '*');
    setGameResultSent(true);
  }, [gameResultSent, correctAnswers, wrongAnswers, totalShots]);

  const handleBackToGames = () => {
    if (gameState === 'playing' && !gameResultSent && gameStartTime) {
      sendGameResult(false, score, Math.floor((Date.now() - gameStartTime) / 1000), { correctShots: totalCorrect, totalShots, highestLevel: level, wrongShots: totalWrong });
    }
    if (backgroundMusic.current) backgroundMusic.current.stopMusic();
    navigate('/studenthub/games');
  };

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && gameStartTime && !gameResultSent) {
      timer = setInterval(() => setTimeSpent(Math.floor((Date.now() - gameStartTime) / 1000)), 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, gameStartTime, gameResultSent]);

  // FIXED: Responsive canvas sizing for small screens
  useEffect(() => {
    const updateCanvasSize = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const isMobileDevice = viewportWidth <= 768;
      setIsMobile(isMobileDevice);
      
      // Calculate available space
      const questionHeight = isMobileDevice ? 90 : 100;
      const topControlsHeight = 50;
      const mobileControlsHeight = isMobileDevice ? 80 : 0;
      const bottomPadding = 20;
      
      const availableHeight = viewportHeight - questionHeight - topControlsHeight - mobileControlsHeight - bottomPadding;
      const availableWidth = viewportWidth - 20;
      
      // Make canvas square but fit within available space
      let canvasSize = Math.min(availableWidth, availableHeight, 500); // Max 500px on mobile
      canvasSize = Math.max(280, canvasSize); // Minimum 280px
      
      // Update player position based on new canvas size
      const scale = canvasSize / 800;
      gameRef.current.player.x = (canvasSize / 2) - 20;
      gameRef.current.player.y = canvasSize - 60;
      gameRef.current.player.width = 40 * scale;
      gameRef.current.player.height = 40 * scale;
      
      setCanvasDimensions({
        width: canvasSize,
        height: canvasSize
      });
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

  const getRandomQuestion = useCallback(() => {
    const newQuestions = [...questions];
    if (currentQuestion) {
      const filtered = newQuestions.filter(q => q.text !== currentQuestion.text);
      if (filtered.length > 0) {
        return filtered[Math.floor(Math.random() * filtered.length)];
      }
    }
    return newQuestions[Math.floor(Math.random() * newQuestions.length)];
  }, [currentQuestion]);

  const calculateEnemyDimensions = useCallback((text) => {
    let displayText = text;
    if (displayText && displayText.includes('. ')) {
      displayText = displayText.substring(displayText.indexOf('. ') + 2);
    }
    const width = Math.min(300, Math.max(160, displayText.length * 8 + 40));
    let height = 65;
    if (displayText.length > 25) height = 80;
    if (displayText.length > 35) height = 95;
    return { width, height };
  }, []);

  const getRequiredCorrectShots = useCallback((currentLevel) => {
    if (currentLevel === 1) return 3;
    if (currentLevel === 2) return 3;
    if (currentLevel === 3) return 4;
    return currentLevel + 1;
  }, []);

  const getLevelFallSpeed = useCallback((currentLevel) => {
    if (currentLevel === 1) return 1.0;
    if (currentLevel === 2) return 1.6;
    if (currentLevel === 3) return 2.3;
    if (currentLevel === 4) return 3.1;
    return 1 + (currentLevel - 1) * 0.7;
  }, []);

  const createEnemy = useCallback(() => {
    if (!currentQuestion) return null;
    const allOptions = [...currentQuestion.options];
    const correctOptionText = allOptions.find(opt => opt.startsWith(currentQuestion.correctAnswer));
    const wrongOptions = allOptions.filter(opt => !opt.startsWith(currentQuestion.correctAnswer));
    const isCorrect = Math.random() < 0.4;
    const displayAnswer = isCorrect ? correctOptionText : wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    const fallSpeed = gameRef.current.baseEnemySpeed * getLevelFallSpeed(level) * gameRef.current.currentSpeedMultiplier;
    const dimensions = calculateEnemyDimensions(displayAnswer);
    const canvasWidth = canvasDimensions.width;
    
    return { 
      id: Math.random(), 
      x: Math.random() * (canvasWidth - dimensions.width - 10), 
      y: -60, 
      width: dimensions.width, 
      height: dimensions.height, 
      speed: fallSpeed,
      horizontalSpeed: (0.6 + Math.random() * 0.8) * Math.min(4.0, getLevelFallSpeed(level) * 0.8), 
      direction: Math.random() < 0.5 ? -1 : 1, 
      questionText: currentQuestion.text, 
      displayAnswer, 
      isCorrect, 
      correctAnswerLetter: currentQuestion.correctAnswer, 
      allOptions: currentQuestion.options, 
      explanation: currentQuestion.explanation 
    };
  }, [currentQuestion, level, calculateEnemyDimensions, getLevelFallSpeed, canvasDimensions.width]);

  const advanceToNextLevel = useCallback(() => {
    playLevelUpSound();
    const newLevel = level + 1;
    setLevel(newLevel); 
    setHighestLevel(h => Math.max(h, newLevel)); 
    gameRef.current.currentSpeedMultiplier = 1.0; 
    gameRef.current.spawnDelay = Math.max(30, 130 - (newLevel - 1) * 20); 
    setLevelAnnouncement(`LEVEL ${newLevel}`); 
    setShowLevelAnnouncement(true); 
    gameRef.current.waitingForSpace = true; 
    gameRef.current.gameActive = false; 
    setCurrentQuestion(getRandomQuestion()); 
    gameRef.current.enemies = []; 
    gameRef.current.bullets = []; 
    const enemyCount = Math.min(8, 2 + Math.floor(newLevel / 1.5)); 
    for (let i = 0; i < enemyCount; i++) { 
      const e = createEnemy(); 
      if (e) { 
        e.y = -60 - (i * 55); 
        gameRef.current.enemies.push(e); 
      } 
    } 
    const nextRequired = getRequiredCorrectShots(newLevel);
    const fallSpeedBonus = Math.round((getLevelFallSpeed(newLevel) - 1) * 100);
    showNotification(`⭐ LEVEL UP! Level ${newLevel} 💨 +${fallSpeedBonus}% speed! Need ${nextRequired} correct!`, 'success');
    setCorrectShots(0);
    
    setTimeout(() => { 
      if (gameRef.current.waitingForSpace) { 
        setShowLevelAnnouncement(false); 
        gameRef.current.waitingForSpace = false; 
        gameRef.current.gameActive = true; 
      } 
    }, 2500);
  }, [level, getRandomQuestion, createEnemy, playLevelUpSound, showNotification, getRequiredCorrectShots, getLevelFallSpeed]);

  const initLevel = useCallback(() => {
    gameRef.current.enemies = []; 
    gameRef.current.bullets = []; 
    gameRef.current.particles = []; 
    gameRef.current.spawnTimer = 0; 
    gameRef.current.baseEnemySpeed = 0.7; 
    gameRef.current.currentSpeedMultiplier = 1.0; 
    gameRef.current.spawnDelay = 130;
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
    setCurrentQuestion(getRandomQuestion());
    for (let i = 0; i < 3; i++) { 
      const e = createEnemy(); 
      if (e) { 
        e.y = -60 - (i * 55); 
        gameRef.current.enemies.push(e); 
      } 
    }
    setLevelAnnouncement('LEVEL 1');
    setShowLevelAnnouncement(true);
    gameRef.current.waitingForSpace = true;
    gameRef.current.gameActive = false;
    setTimeout(() => { 
      if (gameRef.current.waitingForSpace) { 
        setShowLevelAnnouncement(false); 
        gameRef.current.waitingForSpace = false; 
        gameRef.current.gameActive = true; 
      } 
    }, 2500);
  }, [getRandomQuestion, createEnemy]);

  const startGame = () => {
    resumeAudio();
    gameRef.current.gameActive = false;
    gameRef.current.waitingForSpace = false;
    setGameState('playing');
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
    if (now - gameRef.current.lastShot < 280) return;
    playShootSound();
    setTotalShots(prev => prev + 1);
    const playerX = gameRef.current.player.x;
    const playerY = gameRef.current.player.y;
    gameRef.current.bullets.push({ x: playerX + 18, y: playerY - 20, width: 5, height: 12, speed: 8 });
    gameRef.current.lastShot = now;
  }, [playShootSound]);

  const increaseSpeed = useCallback(() => {
    gameRef.current.currentSpeedMultiplier = Math.min(2.5, gameRef.current.currentSpeedMultiplier + 0.12);
    const fallSpeed = gameRef.current.baseEnemySpeed * getLevelFallSpeed(level) * gameRef.current.currentSpeedMultiplier;
    gameRef.current.enemies.forEach(enemy => { 
      enemy.speed = fallSpeed; 
      enemy.horizontalSpeed = (0.6 + Math.random() * 0.8) * Math.min(4.0, getLevelFallSpeed(level) * 0.8); 
    });
    gameRef.current.spawnDelay = Math.max(30, 130 - (gameRef.current.currentSpeedMultiplier - 1) * 40 - (level - 1) * 15);
  }, [level, getLevelFallSpeed]);

  const moveLeft = () => { 
    const minX = 0;
    const maxX = canvasDimensions.width - 40;
    gameRef.current.player.x = Math.max(minX, gameRef.current.player.x - 38);
  };
  
  const moveRight = () => { 
    const maxX = canvasDimensions.width - 40;
    gameRef.current.player.x = Math.min(maxX, gameRef.current.player.x + 38);
  };
  
  const handleMobileShoot = () => shoot();

  const updateGame = useCallback(() => {
    const game = gameRef.current;
    const canvasWidth = canvasDimensions.width;
    
    if (!game.gameActive || game.waitingForSpace) return;
    
    if (game.keys['ArrowLeft']) game.player.x -= 6;
    if (game.keys['ArrowRight']) game.player.x += 6;
    game.player.x = Math.max(0, Math.min(canvasWidth - 40, game.player.x));
    
    if (game.keys['Space']) shoot();
    
    game.bullets = game.bullets.filter(b => { b.y -= b.speed; return b.y > -20; });
    
    game.spawnTimer++;
    const maxEnemies = Math.min(9, 3 + Math.floor(level / 1.5));
    if (game.spawnTimer > (game.spawnDelay || 130) && game.enemies.length < maxEnemies) { 
      const newEnemy = createEnemy(); 
      if (newEnemy) { 
        newEnemy.y = -60; 
        newEnemy.x = Math.random() * (canvasWidth - newEnemy.width - 10); 
        game.enemies.push(newEnemy); 
        game.spawnTimer = 0; 
      } 
    }
    
    game.enemies.forEach(e => { 
      e.x += e.horizontalSpeed * e.direction; 
      if (e.x <= 0 || e.x >= canvasWidth - e.width) e.direction *= -1; 
      e.y += e.speed; 
    });
    game.enemies = game.enemies.filter(e => e.y < canvasWidth + 50);
    
    for (let bi = game.bullets.length - 1; bi >= 0; bi--) {
      const b = game.bullets[bi];
      for (let ei = game.enemies.length - 1; ei >= 0; ei--) {
        const e = game.enemies[ei];
        if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
          sendXPUpdate(e.isCorrect, e.displayAnswer, e.correctAnswerLetter, e.questionText);
          if (e.isCorrect) {
            playCorrectSound();
            setCorrectAnswers(prev => prev + 1); 
            setScore(s => s + 100); 
            setTotalCorrect(prev => prev + 1);
            setCorrectShots(prev => { 
              const newCorrect = prev + 1;
              const required = getRequiredCorrectShots(level);
              showNotification(`✅ +100! (${newCorrect}/${required})`, 'success');
              return newCorrect; 
            });
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
            setWrongAnswers(prev => prev + 1); 
            setTotalWrong(prev => prev + 1);
            setWrongShots(prev => { 
              const newWrong = prev + 1; 
              setScore(s => Math.max(0, s - 10)); 
              showNotification(`❌ -10! (${newWrong}/3 mistakes)`, 'error');
              game.currentSpeedMultiplier = 1.0; 
              game.spawnDelay = Math.max(45, 130 - (level - 1) * 15); 
              const fallSpeed = game.baseEnemySpeed * getLevelFallSpeed(level);
              game.enemies.forEach(enemy => { 
                enemy.speed = fallSpeed; 
                enemy.horizontalSpeed = (0.6 + Math.random() * 0.6) * Math.min(3.0, getLevelFallSpeed(level) * 0.6); 
              }); 
              for (let i = 0; i < 15; i++) game.particles.push({ x: e.x + e.width/2, y: e.y + e.height/2, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, life: 20 }); 
              if (newWrong >= 3) { 
                playGameOverSound();
                game.gameActive = false; 
                const finalTimeSpent = Math.floor((Date.now() - (gameStartTime || Date.now())) / 1000); 
                sendGameResult(false, score, finalTimeSpent, { correctShots: totalCorrect, totalShots, highestLevel: level, wrongShots: totalWrong + 1 }); 
                setGameState('gameOver'); 
                setShowLevelAnnouncement(false);
                showNotification('💀 Game Over!', 'error');
              } 
              return newWrong; 
            });
          }
          playExplosionSound();
          game.bullets.splice(bi, 1); 
          game.enemies.splice(ei, 1); 
          break;
        }
      }
    }
    
    const requiredCorrectShots = getRequiredCorrectShots(level);
    if (correctShots >= requiredCorrectShots && game.gameActive && !game.waitingForSpace) {
      advanceToNextLevel();
    }
    
    game.particles = game.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });
    sendScoreUpdate();
  }, [currentQuestion, getRandomQuestion, increaseSpeed, correctShots, level, advanceToNextLevel, gameStartTime, score, totalCorrect, totalShots, totalWrong, sendXPUpdate, sendGameResult, sendScoreUpdate, shoot, createEnemy, calculateEnemyDimensions, playCorrectSound, playWrongSound, playExplosionSound, playGameOverSound, showNotification, getRequiredCorrectShots, getLevelFallSpeed, canvasDimensions.width]);

  const drawGame = useCallback((ctx) => {
    const game = gameRef.current;
    const canvasWidth = canvasDimensions.width;
    const canvasHeight = canvasDimensions.height;
    const scale = canvasWidth / 800;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, `rgb(${10 + level * 2}, ${10 + level}, ${40 + level * 3})`); 
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient; 
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.fillStyle = 'white';
    const starCount = Math.min(100, Math.floor(canvasWidth / 8));
    for (let i = 0; i < starCount; i++) ctx.fillRect((i * 131) % canvasWidth, (i * 253) % canvasHeight, 1.5, 1.5);
    
    // Player ship (scaled)
    const px = game.player.x;
    const py = game.player.y;
    ctx.fillStyle = '#ff6600';
    ctx.beginPath(); 
    ctx.moveTo(px + 5 * scale, py + 15 * scale); 
    ctx.lineTo(px + 15 * scale, py + 10 * scale); 
    ctx.lineTo(px + 15 * scale, py + 20 * scale); 
    ctx.fill();
    ctx.fillStyle = '#00ffff';
    ctx.beginPath(); 
    ctx.moveTo(px + 20 * scale, py); 
    ctx.lineTo(px + 5 * scale, py + 20 * scale); 
    ctx.lineTo(px + 20 * scale, py + 15 * scale); 
    ctx.lineTo(px + 35 * scale, py + 20 * scale); 
    ctx.fill();
    ctx.fillStyle = '#0099ff'; 
    ctx.fillRect(px + 15 * scale, py + 12 * scale, 10 * scale, 15 * scale);
    ctx.fillStyle = '#ff4400'; 
    ctx.fillRect(px + 32 * scale, py + 27 * scale, 6 * scale, 10 * scale);
    
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
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(e.x, e.y, e.width, e.height);
      ctx.fillStyle = '#111122';
      ctx.fillRect(e.x + 2, e.y + 2, e.width - 4, e.height - 4);
      
      ctx.strokeStyle = '#ffcc44';
      ctx.lineWidth = 2;
      ctx.strokeRect(e.x + 2, e.y + 2, e.width - 4, e.height - 4);
      
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(e.x + 5, e.y + 8, 10, 8);
      ctx.fillRect(e.x + e.width - 15, e.y + 8, 10, 8);
      
      let displayText = e.displayAnswer;
      if (displayText && displayText.includes('. ')) {
        displayText = displayText.substring(displayText.indexOf('. ') + 2);
      }
      
      let fontSize = Math.max(11, Math.min(16, Math.floor(e.width / 12)));
      ctx.font = `bold ${fontSize}px "Segoe UI", Arial`;
      let textWidth = ctx.measureText(displayText || "?").width;
      
      while (textWidth > e.width - 20 && fontSize > 10) {
        fontSize--;
        ctx.font = `bold ${fontSize}px "Segoe UI", Arial`;
        textWidth = ctx.measureText(displayText || "?").width;
      }
      
      const textX = e.x + (e.width / 2) - (textWidth / 2);
      const textY = e.y + (e.height / 2) + 6;
      
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(displayText || "?", textX, textY);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(displayText || "?", textX, textY);
      
      ctx.font = `bold ${Math.max(11, 13)}px Arial`;
      if (e.isCorrect) {
        ctx.fillStyle = '#44ff44';
        ctx.fillText("✓", e.x + e.width - 18, e.y + 18);
      } else {
        ctx.fillStyle = '#ff4444';
        ctx.fillText("✗", e.x + e.width - 18, e.y + 18);
      }
    });
    
    // Level announcement
    if (showLevelAnnouncement && gameState === 'playing') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.92)'; 
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = '#ffd700'; 
      ctx.font = `bold ${Math.max(28, 36 * scale)}px Arial`; 
      const levelX = canvasWidth/2 - ctx.measureText(levelAnnouncement).width / 2;
      ctx.fillText(levelAnnouncement, levelX, canvasHeight/2 - 20);
      ctx.fillStyle = '#ffffff'; 
      ctx.font = `bold ${Math.max(14, 18 * scale)}px Arial`; 
      const spaceX = canvasWidth/2 - ctx.measureText('Tap/Click to start!').width / 2;
      ctx.fillText('Tap/Click to start!', spaceX, canvasHeight/2 + 30);
    }
    
    // Stats panel - right side
    if (!showLevelAnnouncement && game.gameActive && gameState === 'playing') {
      const rightX = canvasWidth - 95;
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${Math.max(14, 18 * scale)}px Arial`;
      ctx.fillText(`🎯 ${score}`, rightX, 30);
      
      ctx.fillStyle = '#00ccff';
      ctx.font = `bold ${Math.max(11, 14 * scale)}px Arial`;
      ctx.fillText(`LVL ${level}`, rightX + 10, 55);
      
      ctx.fillStyle = wrongShots >= 2 ? '#ff6666' : '#ffffff';
      ctx.font = `${Math.max(10, 12 * scale)}px Arial`;
      ctx.fillText(`⚠️ ${wrongShots}/3`, rightX + 15, 75);
      
      const requiredCorrect = getRequiredCorrectShots(level);
      const progress = (correctShots / requiredCorrect) * 100;
      ctx.fillStyle = '#333333';
      ctx.fillRect(rightX, 85, 80, 5);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(rightX, 85, (progress / 100) * 80, 5);
    }
  }, [showLevelAnnouncement, levelAnnouncement, wrongShots, level, correctShots, gameState, canvasDimensions, getRequiredCorrectShots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    let animationId;
    const loop = () => { 
      if (gameState === 'playing') updateGame(); 
      if (ctx) {
        ctx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
        drawGame(ctx); 
      }
      animationId = requestAnimationFrame(loop); 
    };
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [gameState, updateGame, drawGame, canvasDimensions]);

  useEffect(() => {
    const handleKeyDown = (e) => { 
      if (e.code === 'Space') { e.preventDefault(); gameRef.current.keys['Space'] = true; } 
      else if (e.key === 'ArrowLeft') { e.preventDefault(); gameRef.current.keys['ArrowLeft'] = true; } 
      else if (e.key === 'ArrowRight') { e.preventDefault(); gameRef.current.keys['ArrowRight'] = true; } 
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

      {/* Notification */}
      {notification.show && (
        <div style={{
          ...styles.notification,
          backgroundColor: notification.type === 'success' ? '#10b981' : (notification.type === 'error' ? '#ef4444' : '#3b82f6')
        }}>
          {notification.message}
        </div>
      )}
      
      {/* Question Display */}
      {gameState === 'playing' && currentQuestion && !showLevelAnnouncement && (
        <div style={styles.questionContainer}>
          <div style={styles.questionText}>
            📖 {currentQuestion.text}
          </div>
          <div style={styles.questionHint}>
            🎯 Level {level} - Need {getRequiredCorrectShots(level)} correct!
          </div>
        </div>
      )}
      
      <div style={styles.gameWrapper}>
        <canvas 
          ref={canvasRef} 
          width={canvasDimensions.width} 
          height={canvasDimensions.height} 
          style={{
            ...styles.canvas,
            width: `${canvasDimensions.width}px`,
            height: `${canvasDimensions.height}px`,
            touchAction: 'none',
            display: 'block'
          }} 
        />
        
        {/* Menu Overlay - FIXED for small screens */}
        {gameState === 'menu' && (
          <div style={styles.menuOverlay}>
            <div style={styles.menuContent}>
              <h1 style={styles.gameTitle}>🚀 Equation Shooter</h1>
              <p style={styles.gameSubtitle}>Shoot the correct answer!</p>
              <div style={styles.features}>
                <p>🎯 Read the question above</p>
                <p>🔫 Shoot the CORRECT answer</p>
                <p>⚠️ 3 mistakes = Game Over!</p>
                <p>⭐ +10 XP per correct</p>
                <p>💨 Enemies fall FASTER each level!</p>
              </div>
              <button onClick={startGame} style={styles.startButton}>START GAME</button>
            </div>
          </div>
        )}
        
        {/* Game Over Overlay */}
        {gameState === 'gameOver' && (
          <div style={styles.gameOverOverlay}>
            <div style={styles.gameOverContent}>
              <h2 style={styles.gameOverTitle}>💀 Game Over</h2>
              <p style={styles.finalScore}>Score: {score}</p>
              <p>⭐ Level: {highestLevel}</p>
              <p>✅ Correct: {correctAnswers}</p>
              <p>❌ Wrong: {wrongAnswers}</p>
              <p>🎯 Accuracy: {totalShots > 0 ? Math.round((totalCorrect / totalShots) * 100) : 0}%</p>
              <p>⭐ Total XP: {totalXPEarned}</p>
              <button onClick={startGame} style={styles.retryButton}>PLAY AGAIN</button>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Controls */}
      {isMobile && gameState === 'playing' && !showLevelAnnouncement && (
        <div style={styles.mobileControlsContainer}>
          <div style={styles.movementControls}>
            <button onTouchStart={moveLeft} onMouseDown={moveLeft} style={styles.mobileButton}>
              <FaArrowLeft size={28} />
            </button>
            <button onTouchStart={moveRight} onMouseDown={moveRight} style={styles.mobileButton}>
              <FaArrowRight size={28} />
            </button>
          </div>
          <div style={styles.shootControl}>
            <button onTouchStart={handleMobileShoot} onMouseDown={handleMobileShoot} style={styles.shootButtonMobile}>
              <FaCrosshairs size={32} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { 
    width: '100vw', 
    height: '100vh',
    background: 'linear-gradient(135deg, #0a0a2a 0%, #050518 100%)', 
    margin: 0,
    padding: 0,
    boxSizing: 'border-box', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
    overflow: 'auto'
  },
  musicControls: { 
    position: 'fixed', 
    top: '8px', 
    right: '8px', 
    display: 'flex', 
    gap: '6px', 
    alignItems: 'center', 
    zIndex: 1001, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    padding: '5px 10px', 
    borderRadius: '30px', 
    backdropFilter: 'blur(4px)',
  },
  musicButton: { 
    backgroundColor: '#4a6fa5', 
    color: 'white', 
    border: 'none', 
    width: '32px', 
    height: '32px', 
    borderRadius: '50%', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '14px',
  },
  volumeSlider: { 
    width: '60px', 
    height: '3px', 
    cursor: 'pointer', 
    backgroundColor: '#667eea', 
    borderRadius: '4px', 
    accentColor: '#ffd700',
  },
  musicNoteAnimation: { 
    position: 'fixed', 
    top: '50%', 
    left: '50%', 
    transform: 'translate(-50%, -50%)', 
    fontSize: '45px', 
    animation: 'musicNote 0.9s ease-out', 
    pointerEvents: 'none', 
    zIndex: 2000, 
  },
  notification: {
    position: 'fixed',
    bottom: '20px',
    right: '10px',
    padding: '8px 15px',
    borderRadius: '10px',
    zIndex: 10002,
    animation: 'slideInRight 0.3s ease-out',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontSize: '12px',
    maxWidth: '200px',
    wordBreak: 'break-word',
  },
  questionContainer: {
    width: '95%',
    maxWidth: '500px',
    margin: '5px auto 8px auto',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(25,35,70,0.9))',
    borderRadius: '16px',
    border: '1px solid rgba(255,215,0,0.4)',
    textAlign: 'center',
    zIndex: 5,
  },
  questionText: {
    color: '#ffd700',
    fontSize: 'clamp(12px, 3.5vw, 16px)',
    fontWeight: 'bold',
    lineHeight: '1.3',
  },
  questionHint: {
    color: '#88ff88',
    fontSize: 'clamp(10px, 2.5vw, 12px)',
    marginTop: '4px',
  },
  gameWrapper: { 
    position: 'relative', 
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: '0px',
  },
  canvas: { 
    display: 'block', 
    border: '2px solid rgba(255,215,0,0.4)', 
    borderRadius: '12px', 
    touchAction: 'none',
    backgroundColor: '#000',
    boxShadow: '0 5px 20px rgba(0,0,0,0.5)',
  },
  menuOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    background: 'rgba(0,0,0,0.95)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: '12px',
    zIndex: 10,
  },
  menuContent: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: '12px', 
    padding: '20px 25px', 
    textAlign: 'center', 
    width: '85%',
    maxWidth: '350px',
    background: 'linear-gradient(145deg, rgba(25,35,70,0.98), rgba(15,20,45,0.99))',
    borderRadius: '30px',
    border: '2px solid rgba(255,215,0,0.5)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
  },
  gameTitle: { 
    fontSize: 'clamp(22px, 6vw, 32px)', 
    textAlign: 'center', 
    color: '#ffd700', 
    margin: 0,
  },
  gameSubtitle: { 
    fontSize: 'clamp(14px, 3.5vw, 18px)', 
    textAlign: 'center', 
    margin: 0,
    color: '#aaddff',
  },
  features: { 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    padding: '12px 20px', 
    borderRadius: '20px', 
    textAlign: 'left', 
    width: '100%', 
    fontSize: 'clamp(11px, 3vw, 13px)', 
    border: '1px solid rgba(255,255,255,0.2)',
    lineHeight: '1.8',
    margin: '5px 0',
  },
  startButton: { 
    padding: '10px 25px', 
    fontSize: 'clamp(16px, 4.5vw, 20px)', 
    fontWeight: 'bold', 
    background: 'linear-gradient(135deg, #4CAF50, #2e7d32)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '50px', 
    cursor: 'pointer', 
    width: '80%',
    marginTop: '5px',
  },
  gameOverOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    background: 'rgba(0,0,0,0.96)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: '12px',
    zIndex: 10,
  },
  gameOverContent: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: '8px', 
    padding: '20px 30px',
    backgroundColor: 'rgba(30,20,50,0.98)',
    borderRadius: '30px',
    width: '80%',
    maxWidth: '300px',
    textAlign: 'center',
    border: '2px solid #ff8888',
  },
  gameOverTitle: { 
    fontSize: 'clamp(24px, 6vw, 32px)', 
    color: '#ff6b6b', 
    margin: 0,
  },
  finalScore: { 
    fontSize: 'clamp(20px, 5vw, 26px)', 
    margin: '5px 0', 
    fontWeight: 'bold',
    color: '#ffd700',
  },
  retryButton: { 
    padding: '8px 25px', 
    fontSize: 'clamp(14px, 4vw, 16px)', 
    fontWeight: 'bold', 
    background: 'linear-gradient(135deg, #2196F3, #0b5e9e)', 
    color: 'white', 
    border: 'none', 
    borderRadius: '50px', 
    cursor: 'pointer', 
    marginTop: '8px',
  },
  mobileControlsContainer: {
    position: 'fixed',
    bottom: '15px',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 15px',
    zIndex: 100,
    pointerEvents: 'none',
  },
  movementControls: {
    display: 'flex',
    gap: '15px',
    pointerEvents: 'auto',
  },
  shootControl: {
    pointerEvents: 'auto',
  },
  mobileButton: { 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    border: '2px solid rgba(255,215,0,0.8)', 
    borderRadius: '50px', 
    width: '55px', 
    height: '55px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    color: '#ffd700', 
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
  },
  shootButtonMobile: { 
    backgroundColor: 'rgba(255,60,60,0.9)', 
    border: '3px solid #ffaa55', 
    borderRadius: '50px', 
    width: '65px', 
    height: '65px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    color: 'white', 
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
  }
};

// Inject keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  button:active { transform: scale(0.95); } 
  @keyframes musicNote { 
    0% { transform: translate(-50%, -50%) scale(0.5) rotate(0deg); opacity: 1; } 
    100% { transform: translate(-50%, -180%) scale(1.5) rotate(25deg); opacity: 0; } 
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
  }
  input[type="range"] { -webkit-appearance: none; background: #667eea; outline: none; height: 3px; border-radius: 3px; } 
  input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #ffd93d; cursor: pointer; border: none; } 
`;
document.head.appendChild(styleSheet);

export default SpaceShooter;