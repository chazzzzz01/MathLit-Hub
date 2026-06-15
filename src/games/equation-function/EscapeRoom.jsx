// src/games/equation-function/EscapeRoom.jsx - FULLY RESPONSIVE for 258x879 screens (Door Right, Player Left)
// FIX: Increased text sizes for better readability on both mobile and desktop without breaking layout
// REMOVED: Back button from active gameplay (now only shows on completion/game over screens)

import React, { useState, useEffect, useCallback, useRef } from 'react';

const animationStyles = `
  @keyframes shake { 0% { transform: translate(1px, 1px) rotate(0deg); } 10% { transform: translate(-1px, -2px) rotate(-1deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 30% { transform: translate(3px, 2px) rotate(0deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 50% { transform: translate(-1px, 2px) rotate(-1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 70% { transform: translate(3px, 1px) rotate(-1deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 90% { transform: translate(1px, 2px) rotate(0deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }
  @keyframes bounceIn { 0% { transform: scale(0); opacity: 0; } 80% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
  @keyframes fadeOut { 0% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); } 100% { opacity: 0; transform: translate(-50%, -50%) scale(2); } }
  @keyframes enemyAttack { 0% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.2); } 100% { transform: translate(-50%, -50%) scale(1); } }
  @keyframes correctFlash { 0% { background-color: rgba(76, 175, 80, 0); } 50% { background-color: rgba(76, 175, 80, 0.5); } 100% { background-color: rgba(76, 175, 80, 0); } }
  
  /* Mobile first - larger base text sizes for readability */
  @media (max-width: 480px) {
    @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-2px); } 100% { transform: translateY(0px); } }
    @keyframes enemyAttack { 0% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.05); } 100% { transform: translate(-50%, -50%) scale(1); } }
  }
`;

if (!document.querySelector('#escape-room-styles')) {
  const styleSheet = document.createElement("style");
  styleSheet.id = 'escape-room-styles';
  styleSheet.textContent = animationStyles;
  document.head.appendChild(styleSheet);
}

const EscapeRoom = ({ onComplete, onScore, challengeScore, sendGameResult, onGameStateUpdate, savedGameState, clearSavedState, isSfxMuted = false }) => {
  // Audio refs for MP3 files from src/games/sounds/
  const correctSoundRef = useRef(null);
  const wrongSoundRef = useRef(null);
  const enemyDefeatSoundRef = useRef(null);
  const gameOverSoundRef = useRef(null);
  const victorySoundRef = useRef(null);
  const doorSoundRef = useRef(null);
  const attackSoundRef = useRef(null);
  
  // Initialize audio elements with correct path
  useEffect(() => {
    const soundPath = '/src/games/sounds/';
    
    console.log('Attempting to load sounds from:', soundPath);
    
    correctSoundRef.current = new Audio(`${soundPath}clap.mp3`);
    wrongSoundRef.current = new Audio(`${soundPath}boo.mp3`);
    enemyDefeatSoundRef.current = new Audio(`${soundPath}enemy-defeat.mp3`);
    gameOverSoundRef.current = new Audio(`${soundPath}game-over.mp3`);
    victorySoundRef.current = new Audio(`${soundPath}victory.mp3`);
    doorSoundRef.current = new Audio(`${soundPath}door-open.mp3`);
    attackSoundRef.current = new Audio(`${soundPath}attack.mp3`);
    
    correctSoundRef.current.volume = 0.8;
    wrongSoundRef.current.volume = 0.7;
    enemyDefeatSoundRef.current.volume = 0.7;
    gameOverSoundRef.current.volume = 0.8;
    victorySoundRef.current.volume = 0.7;
    doorSoundRef.current.volume = 0.6;
    attackSoundRef.current.volume = 0.6;
    
    const handleCanPlay = (soundName) => {
      console.log(`✅ ${soundName} sound loaded successfully`);
    };
    
    const handleError = (soundName, e) => {
      console.error(`❌ Failed to load ${soundName} sound:`, e);
      const altPath = '/games/sounds/';
      console.log(`Trying alternative path: ${altPath}${soundName}.mp3`);
      const altAudio = new Audio(`${altPath}${soundName}.mp3`);
      if (soundName === 'clap') correctSoundRef.current = altAudio;
      if (soundName === 'boo') wrongSoundRef.current = altAudio;
      altAudio.volume = 0.7;
      altAudio.load();
    };
    
    correctSoundRef.current.addEventListener('canplaythrough', () => handleCanPlay('clap'));
    correctSoundRef.current.addEventListener('error', (e) => handleError('clap', e));
    wrongSoundRef.current.addEventListener('canplaythrough', () => handleCanPlay('boo'));
    wrongSoundRef.current.addEventListener('error', (e) => handleError('boo', e));
    
    correctSoundRef.current.load();
    wrongSoundRef.current.load();
    enemyDefeatSoundRef.current.load();
    gameOverSoundRef.current.load();
    victorySoundRef.current.load();
    doorSoundRef.current.load();
    attackSoundRef.current.load();
    
    return () => {
      const sounds = [correctSoundRef, wrongSoundRef, enemyDefeatSoundRef, gameOverSoundRef, victorySoundRef, doorSoundRef, attackSoundRef];
      sounds.forEach(sound => {
        if (sound.current) {
          sound.current.pause();
          sound.current.currentTime = 0;
          sound.current = null;
        }
      });
    };
  }, []);
  
  const playSound = (soundRef, soundName) => {
    if (!isSfxMuted && soundRef.current) {
      try {
        soundRef.current.currentTime = 0;
        const playPromise = soundRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log(`🔊 Playing ${soundName} sound`);
            })
            .catch(e => {
              console.log(`⚠️ Could not play ${soundName} sound:`, e);
              playFallbackSound(soundName);
            });
        }
      } catch(e) {
        console.log(`Sound error for ${soundName}:`, e);
        playFallbackSound(soundName);
      }
    } else if (!isSfxMuted) {
      console.log(`🎵 Using fallback sound for ${soundName}`);
      playFallbackSound(soundName);
    }
  };
  
  const playFallbackSound = (soundType) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const now = audioCtx.currentTime;
      
      if (soundType === 'correct') {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 523.25;
        gainNode.gain.value = 0.3;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.3);
        oscillator.stop(now + 0.3);
        
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.value = 659.25;
        gain2.gain.value = 0.2;
        osc2.start(now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.00001, now + 0.35);
        osc2.stop(now + 0.35);
      } else if (soundType === 'wrong') {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 220;
        oscillator.type = 'sawtooth';
        gainNode.gain.value = 0.25;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.5);
        oscillator.stop(now + 0.5);
        
        oscillator.frequency.setValueAtTime(220, now);
        oscillator.frequency.exponentialRampToValueAtTime(165, now + 0.3);
      } else if (soundType === 'defeat') {
        const freqs = [523.25, 659.25, 783.99];
        freqs.forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.value = freq;
          gain.gain.value = 0.2;
          osc.start(now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.00001, now + i * 0.15 + 0.4);
          osc.stop(now + i * 0.15 + 0.4);
        });
      }
    } catch(e) {
      console.log('Fallback sound error:', e);
    }
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const allPuzzles = [
    { type: "mc", question: "Two delivery services charge:\n• Service A: y = 50x + 20\n• Service B: y = 50x + 40\nWhat is the key difference?", options: ["Rate per km", "Starting fee", "Distance", "Speed"], correctOptionIndex: 1, hint: "Look at the constant term (y-intercept).", explanation: "The slope (50) is the same, but y-intercepts (20 vs 40) are different.", difficulty: "Intermediate", enemy: { name: "Slope Shadow", emoji: "👤", attackMessage: "The Slope Shadow sinks its teeth into you! -1 Life!", biteMessage: "⚔️ The Shadow bites you for 1 damage!" }, defeatMessage: "You saw past my identical slopes and found the intercept! POOF!" },
    { type: "mc", question: "Why are parallel lines important in real life?", options: ["They meet eventually", "They represent equal rates of change", "They always cross", "They are curved"], correctOptionIndex: 1, hint: "Think about two lines that never meet.", explanation: "Parallel lines have the same slope, representing equal rates of change.", difficulty: "Basic", enemy: { name: "Parallel Phantom", emoji: "👻", attackMessage: "The Phantom phases through you! -1 Life!", biteMessage: "👻 The Phantom drains your energy!" }, defeatMessage: "You understood parallelism! The Phantom fades away!" },
    { type: "mc", question: "A student says: 'If two lines don't intersect, they must be the same.' Is this correct?", options: ["Yes", "No"], correctOptionIndex: 1, hint: "Can two different lines never meet?", explanation: "Two lines can be parallel (same slope, different intercepts).", difficulty: "Basic", enemy: { name: "Intersection Imp", emoji: "👺", attackMessage: "The Imp claws at you! -1 Life!", biteMessage: "👺 The Imp's claws scratch deep!" }, defeatMessage: "You corrected the imp! Parallel lines exist without meeting!" },
    { type: "mc", question: "Which situation fits a line with slope 0?", options: ["Increasing savings", "Constant temperature", "Decreasing water level", "Rising cost"], correctOptionIndex: 1, hint: "Slope 0 means no change over time.", explanation: "Slope 0 means no change – constant temperature.", difficulty: "Basic", enemy: { name: "Zero Sloth", emoji: "🦥", attackMessage: "The Sloth slowly bites you! -1 Life!", biteMessage: "🦥 The Sloth's lazy bite hurts!" }, defeatMessage: "Zero slope means constant rate!" },
    { type: "mc", question: "Why do we use point-slope form?", options: ["To avoid using slope", "To use a known point and slope", "To find intercept only", "To graph curves"], correctOptionIndex: 1, hint: "The formula is y - y₁ = m(x - x₁).", explanation: "Point-slope form uses a known point (x₁, y₁) and slope m.", difficulty: "Intermediate", enemy: { name: "Point Form Fiend", emoji: "😈", attackMessage: "The Fiend stabs you! -1 Life!", biteMessage: "😈 The Fiend's attack burns!" }, defeatMessage: "Point-slope form uses a point and slope!" },
    { type: "mc", question: "A student used y − 3 = 2(x − 1). What does this show?", options: ["Starting value only", "A line using slope and a point", "Only intercept", "A curve"], correctOptionIndex: 1, hint: "This equation is in point-slope form.", explanation: "Shows a line with slope 2 through point (1, 3).", difficulty: "Intermediate", enemy: { name: "Form Confuser", emoji: "🃏", attackMessage: "The Confuser throws cards at you! -1 Life!", biteMessage: "🃏 Sharp cards cut deep!" }, defeatMessage: "You recognized point-slope form! Slope 2 through (1,3)!" },
    { type: "mc", question: "Which real-life situation matches y − 5 = 3(x − 2)?", options: ["Starting at 5, increasing by 3 from (2,5)", "Starting at 3, increasing by 5", "Starting at 2, decreasing by 5", "Random growth"], correctOptionIndex: 0, hint: "Rewrite in slope-intercept form: y = 3x - 1.", explanation: "When x=2, y=5; slope 3 means increases by 3.", difficulty: "Intermediate", enemy: { name: "Situation Sphinx", emoji: "🐪", attackMessage: "The Sphinx headbutts you! -1 Life!", biteMessage: "🐪 The Sphinx's charge hurts!" }, defeatMessage: "The Sphinx bows! The equation starts at 5 from (2,5)!" },
    { type: "mc", question: "A student writes y = 2x + 5 for a decreasing situation. What is wrong?", options: ["Intercept is wrong", "Slope should be negative", "x is incorrect", "Equation is quadratic"], correctOptionIndex: 1, hint: "What does slope tell about increase/decrease?", explanation: "Decreasing situations need negative slope.", difficulty: "Basic", enemy: { name: "Direction Demon", emoji: "👹", attackMessage: "The Demon smashes you! -1 Life!", biteMessage: "👹 The Demon's club crushes!" }, defeatMessage: "Decreasing needs negative slope!" },
    { type: "mc", question: "Why is slope-intercept form useful?", options: ["It hides slope", "It shows slope and starting value clearly", "It removes variables", "It only works for graphs"], correctOptionIndex: 1, hint: "In y = mx + b, what do m and b represent?", explanation: "Shows slope (m) and y-intercept (b) clearly.", difficulty: "Basic", enemy: { name: "Slope Intercept Skeleton", emoji: "💀", attackMessage: "The Skeleton scratches you! -1 Life!", biteMessage: "💀 The Skeleton's claws rattle!" }, defeatMessage: "Slope-intercept shows slope and starting value!" },
    { type: "mc", question: "Create a real-life meaning for y = −4x + 20", options: ["Starts at 20, decreases by 4 per unit", "Starts at 4, increases by 20", "Starts at 20, increases by 4", "Random change"], correctOptionIndex: 0, hint: "Identify y-intercept (starting) and slope (rate).", explanation: "Starts at 20 (y-intercept), decreases by 4 each unit.", difficulty: "Intermediate", enemy: { name: "Negative Knight", emoji: "⚔️", attackMessage: "The Knight slashes you! -1 Life!", biteMessage: "⚔️ The Knight's sword cuts deep!" }, defeatMessage: "Starts at 20, decreases by 4 each time!" }
  ];

  const [puzzles, setPuzzles] = useState(() => savedGameState?.shuffledPuzzles || shuffleArray(allPuzzles));
  const [currentPuzzle, setCurrentPuzzle] = useState(() => savedGameState?.currentPuzzle ?? 0);
  const [mcSelection, setMcSelection] = useState(null);
  const [feedback, setFeedback] = useState(() => savedGameState?.feedback || '');
  const [score, setScore] = useState(() => savedGameState?.challengeScore ?? (challengeScore || 0));
  const [timeLeft, setTimeLeft] = useState(() => savedGameState?.timeLeft ?? 300);
  const [gameActive, setGameActive] = useState(() => savedGameState?.gameActive ?? true);
  const [showHint, setShowHint] = useState(() => savedGameState?.showHint ?? false);
  const [puzzlesCompleted, setPuzzlesCompleted] = useState(() => savedGameState?.puzzlesCompleted ?? 0);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [attempts, setAttempts] = useState(() => savedGameState?.attempts ?? 0);
  const [lives, setLives] = useState(() => savedGameState?.lives ?? 3);
  const [playerPosition, setPlayerPosition] = useState(() => savedGameState?.playerPosition ?? 0);
  const [correctAnswers, setCorrectAnswers] = useState(() => savedGameState?.correctAnswers ?? 0);
  const [wrongAnswers, setWrongAnswers] = useState(() => savedGameState?.wrongAnswers ?? 0);
  const [enemyAttacking, setEnemyAttacking] = useState(false);
  const [defeatedEnemy, setDefeatedEnemy] = useState(null);
  const [escapeDoorOpen, setEscapeDoorOpen] = useState(false);
  const [roomShake, setRoomShake] = useState(false);
  const [correctFlash, setCorrectFlash] = useState(false);

  const totalPuzzles = puzzles.length;
  const xpSoFar = (correctAnswers * 10) - (wrongAnswers * 5);
  const distanceToDoor = 100 - playerPosition;

  useEffect(() => { if (puzzlesCompleted === totalPuzzles) setEscapeDoorOpen(true); }, [puzzlesCompleted, totalPuzzles]);
  
  const shakeRoom = () => { setRoomShake(true); setTimeout(() => setRoomShake(false), 300); };
  
  const triggerEnemyAttack = () => { 
    setEnemyAttacking(true); 
    playSound(attackSoundRef, 'attack');
    setTimeout(() => setEnemyAttacking(false), 500); 
  };

  const handlePlayerDeath = useCallback(() => {
    setGameActive(false);
    setFeedback("💀 GAME OVER! The enemies overwhelmed you! 💀");
    playSound(gameOverSoundRef, 'gameover');
    const timeSpent = 300 - timeLeft;
    const accuracy = ((puzzlesCompleted / totalPuzzles) * 100).toFixed(1);
    if (onComplete) onComplete(false);
  }, [puzzlesCompleted, timeLeft, totalPuzzles, onComplete]);

  useEffect(() => { setPlayerPosition((puzzlesCompleted / totalPuzzles) * 100); }, [puzzlesCompleted, totalPuzzles]);
  useEffect(() => { if (lives <= 0 && gameActive) handlePlayerDeath(); }, [lives, gameActive, handlePlayerDeath]);

  const sendScoreUpdate = useCallback(() => {
    if (window.parent !== window) {
      const progress = ((puzzlesCompleted) / totalPuzzles) * 100;
      window.parent.postMessage({ type: 'SCORE_UPDATE', gameId: 'equation', score: score, stats: { puzzlesCompleted, totalPuzzles, progress, currentPuzzle: currentPuzzle + 1, timeLeft, attempts, correctAnswers, wrongAnswers, xpEarned: xpSoFar, lives, playerPosition } }, '*');
    }
  }, [score, puzzlesCompleted, currentPuzzle, totalPuzzles, timeLeft, attempts, correctAnswers, wrongAnswers, xpSoFar, lives, playerPosition]);

  useEffect(() => { if (gameActive && !showCongratulations) sendScoreUpdate(); }, [score, gameActive, showCongratulations, sendScoreUpdate]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'REQUEST_SCORE') {
        const progress = ((puzzlesCompleted) / totalPuzzles) * 100;
        window.parent.postMessage({ type: 'SCORE_UPDATE', gameId: 'equation', score: score, stats: { puzzlesCompleted, totalPuzzles, progress, currentPuzzle: currentPuzzle + 1, timeLeft, attempts, correctAnswers, wrongAnswers, xpEarned: xpSoFar, lives, playerPosition } }, '*');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [score, puzzlesCompleted, currentPuzzle, totalPuzzles, timeLeft, attempts, correctAnswers, wrongAnswers, xpSoFar, lives, playerPosition]);

  const sendResultToParent = useCallback((completed, finalScore, timeSpent, puzzlesCompletedCount, accuracy, bonusPoints = 0) => {
    const xpEarned = (correctAnswers * 10) - (wrongAnswers * 5);
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'GAME_RESULT', gameId: 'equation', completed: completed, score: finalScore, timeSpent: timeSpent, stats: { finalScore, bonusPoints, totalPuzzles, puzzlesCompleted: puzzlesCompletedCount, timeRemaining: timeLeft, accuracy, progress: `${puzzlesCompletedCount}/${totalPuzzles}`, correctAnswers, wrongAnswers, xpEarned, livesRemaining: lives, finalPosition: playerPosition } }, '*');
    }
    if (sendGameResult) sendGameResult(completed, finalScore, timeSpent, puzzlesCompletedCount, { accuracy, bonusPoints, finalScore, correctAnswers, wrongAnswers, xpEarned });
  }, [totalPuzzles, timeLeft, correctAnswers, wrongAnswers, lives, playerPosition, sendGameResult]);

  const saveProgressToLocalStorage = useCallback((completed, finalScore, timeSpent, puzzlesCompletedCount, accuracy, bonusPoints = 0) => {
    try {
      const existingProgress = localStorage.getItem('gameProgress');
      let progress = existingProgress ? JSON.parse(existingProgress) : { equation: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0, totalXPEarned: 0 }, battle: {}, spaceShooter: {} };
      const xpEarned = (correctAnswers * 10) - (wrongAnswers * 5);
      const currentEquation = progress.equation || { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0, totalXPEarned: 0 };
      const newHighScore = Math.max(currentEquation.highScore || 0, finalScore || 0);
      const newAttempts = (currentEquation.attempts || 0) + 1;
      let newBestTime = currentEquation.bestTime;
      if (completed && timeSpent) newBestTime = currentEquation.bestTime ? Math.min(currentEquation.bestTime, timeSpent) : timeSpent;
      progress.equation = { ...currentEquation, completed: completed || currentEquation.completed, highScore: newHighScore, lastScore: finalScore, totalXPEarned: (currentEquation.totalXPEarned || 0) + Math.max(0, xpEarned), attempts: newAttempts, bestTime: newBestTime, lastPlayed: new Date().toISOString(), lastGameStats: { puzzlesCompleted: puzzlesCompletedCount, totalPuzzles, completionPercentage: ((puzzlesCompletedCount / totalPuzzles) * 100).toFixed(1), accuracy, bonusPoints, finalScore, timeSpent, correctAnswers, wrongAnswers, xpEarned, livesRemaining: lives } };
      localStorage.setItem('gameProgress', JSON.stringify(progress));
    } catch (error) { console.error('Error saving to localStorage:', error); }
  }, [totalPuzzles, correctAnswers, wrongAnswers, lives]);

  useEffect(() => {
    if (onGameStateUpdate && gameActive && !showCongratulations) {
      onGameStateUpdate({ currentPuzzle, puzzlesCompleted, challengeScore: score, timeLeft, attempts, feedback, showHint, gameActive, shuffledPuzzles: puzzles, correctAnswers, wrongAnswers, lives, playerPosition });
    }
  }, [currentPuzzle, puzzlesCompleted, score, timeLeft, attempts, feedback, showHint, gameActive, puzzles, onGameStateUpdate, correctAnswers, wrongAnswers, lives, playerPosition]);

  useEffect(() => {
    if (gameActive && timeLeft > 0 && currentPuzzle < totalPuzzles && lives > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameActive(false);
            setFeedback("Time's up! Game over!");
            playSound(gameOverSoundRef, 'gameover');
            const timeSpent = 300;
            const accuracy = ((puzzlesCompleted / totalPuzzles) * 100).toFixed(1);
            if (onComplete) onComplete(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameActive, currentPuzzle, timeLeft, puzzlesCompleted, totalPuzzles, lives, onComplete]);

  const showEnemyDefeat = (enemy, defeatMessage) => {
    setDefeatedEnemy({ enemy, defeatMessage });
    playSound(enemyDefeatSoundRef, 'defeat');
    setTimeout(() => setDefeatedEnemy(null), 1500);
  };

  const checkAnswer = useCallback(() => {
    if (!gameActive || lives <= 0) return;
    const currentPuzzleData = puzzles[currentPuzzle];
    if (mcSelection === null) { setFeedback("Please select an answer!"); shakeRoom(); return; }
    const isCorrect = (mcSelection === currentPuzzleData.correctOptionIndex);
    const explanationText = currentPuzzleData.explanation;
    
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'XP_UPDATE', gameId: 'equation', xpChange: isCorrect ? 10 : -5, isCorrect, question: currentPuzzleData.question, timestamp: new Date().toISOString() }, '*');
    }
    
    if (isCorrect) {
      console.log('👏 Playing clap sound for correct answer!');
      playSound(correctSoundRef, 'correct');
      setCorrectFlash(true);
      setTimeout(() => setCorrectFlash(false), 300);
      
      setCorrectAnswers(prev => prev + 1);
      const pointsEarned = 100;
      const newScore = score + pointsEarned;
      setScore(newScore);
      if (onScore) onScore(newScore);
      const newPuzzlesCompleted = puzzlesCompleted + 1;
      setPuzzlesCompleted(newPuzzlesCompleted);
      if (currentPuzzleData.enemy) showEnemyDefeat(currentPuzzleData.enemy, currentPuzzleData.defeatMessage);
      setFeedback(`✅ Correct! +10 XP! ${explanationText} You move closer to the door!`);
      setShowHint(false);
      setMcSelection(null);
      setAttempts(0);
      
      if (newPuzzlesCompleted === totalPuzzles) {
        playSound(doorSoundRef, 'door');
        setTimeout(() => playSound(victorySoundRef, 'victory'), 500);
      }
      
      if (currentPuzzle + 1 < totalPuzzles) {
        setCurrentPuzzle(currentPuzzle + 1);
      } else if (newPuzzlesCompleted === totalPuzzles) {
        setGameActive(false);
        setShowCongratulations(true);
        const bonusPoints = Math.floor(timeLeft * 2);
        const finalScore = newScore + bonusPoints;
        setScore(finalScore);
        if (onScore) onScore(finalScore);
        const timeSpent = 300 - timeLeft;
        const accuracy = ((newPuzzlesCompleted / totalPuzzles) * 100).toFixed(1);
        setFeedback(`🎉 Congratulations! Bonus: +${bonusPoints} points! You escaped!`);
        saveProgressToLocalStorage(true, finalScore, timeSpent, newPuzzlesCompleted, accuracy, bonusPoints);
        sendResultToParent(true, finalScore, timeSpent, newPuzzlesCompleted, accuracy, bonusPoints);
        if (onComplete) onComplete(true);
        if (clearSavedState) clearSavedState();
      }
    } else {
      console.log('👎 Playing boo sound for wrong answer!');
      playSound(wrongSoundRef, 'wrong');
      shakeRoom();
      triggerEnemyAttack();
      const newLives = lives - 1;
      setLives(newLives);
      setWrongAnswers(prev => prev + 1);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      const biteMessage = currentPuzzleData.enemy?.biteMessage || `The enemy bites you! -1 Life!`;
      if (newLives <= 0) setFeedback(`💀 ${biteMessage} You have no lives left! GAME OVER! 💀`);
      else if (newAttempts >= 2) setFeedback(`❌ Incorrect. ${biteMessage} ${currentPuzzleData.hint} (-5 XP!) Lives left: ${newLives}`);
      else setFeedback(`❌ Incorrect. ${biteMessage} ${currentPuzzleData.hint} (-5 XP!) Lives left: ${newLives}`);
      setMcSelection(null);
    }
  }, [mcSelection, currentPuzzle, gameActive, score, puzzlesCompleted, timeLeft, attempts, lives, puzzles, totalPuzzles, onScore, onComplete, saveProgressToLocalStorage, sendResultToParent, clearSavedState]);

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  const getDifficultyColor = (difficulty) => ({ Basic: '#4caf50', Intermediate: '#ff9800', Advanced: '#f44336' }[difficulty] || '#667eea');
  const currentEnemy = puzzles[currentPuzzle]?.enemy;

  if (showCongratulations) {
    const xpEarned = (correctAnswers * 10) - (wrongAnswers * 5);
    const bonusCompletionXP = 50;
    const totalXP = xpEarned + (puzzlesCompleted === totalPuzzles ? bonusCompletionXP : 0);
    return (
      <div style={styles.completionContainer}><div style={styles.completionCard}><div style={styles.trophyIcon}>🏆</div><h2 style={styles.completionTitle}>You Escaped!</h2><p style={styles.completionText}>Congratulations! You've defeated all enemies and escaped!</p><div style={styles.finalScore}><div>Final Score: {score}</div><div>Time: {formatTime(timeLeft)} left</div><div>Lives: {lives}</div><div>Accuracy: {((puzzlesCompleted / totalPuzzles) * 100).toFixed(1)}%</div><div>✅ Correct: {correctAnswers} (+{correctAnswers * 10} XP)</div><div>❌ Wrong: {wrongAnswers} (-{wrongAnswers * 5} XP)</div><div>⭐ XP: {xpEarned}</div>{puzzlesCompleted === totalPuzzles && <div>🎉 Bonus: +{bonusCompletionXP} XP</div>}<div style={{marginTop:'8px',borderTop:'1px solid rgba(255,255,255,0.2)',paddingTop:'8px',fontWeight:'bold',color:'#ffd700'}}>Total XP: {totalXP}</div></div><button onClick={() => onComplete && onComplete(true)} style={styles.continueButton}>Return to Menu</button></div></div>
    );
  }

  if (!gameActive && !showCongratulations) {
    const xpEarned = (correctAnswers * 10) - (wrongAnswers * 5);
    return (
      <div style={styles.completionContainer}><div style={styles.completionCard}><div style={styles.sadIcon}>💀</div><h2 style={styles.completionTitle}>Game Over</h2><p style={styles.completionText}>The enemies defeated you! Try again!</p><div style={styles.finalScore}><div>Final Score: {score}</div><div>Lives Lost: {3 - lives}</div><div>Accuracy: {((puzzlesCompleted / totalPuzzles) * 100).toFixed(1)}%</div><div>✅ Correct: {correctAnswers} (+{correctAnswers * 10} XP)</div><div>❌ Wrong: {wrongAnswers} (-{wrongAnswers * 5} XP)</div><div>⭐ XP: {xpEarned}</div></div><button onClick={() => { clearSavedState?.(); onComplete && onComplete(false); }} style={styles.continueButton}>Try Again</button></div></div>
    );
  }

  const currentPuzzleData = puzzles[currentPuzzle];
  const progress = ((puzzlesCompleted) / totalPuzzles) * 100;

  // Calculate positions for ultra small screen (258px width)
  // Door stays on right side, player moves from left to right
  const doorRightPosition = Math.max(5, 30 - (playerPosition * 0.25));
  const playerLeftPosition = Math.max(5, Math.min(85, 10 + (playerPosition * 0.75)));

  return (
    <div style={{...styles.container, animation: roomShake ? 'shake 0.3s ease-in-out 0s 2' : 'none'}}>
      {defeatedEnemy && (<div style={styles.enemyDefeatOverlay}><div style={styles.enemyDefeatBubble}><span style={styles.enemyDefeatEmoji}>{defeatedEnemy.enemy.emoji}</span><span style={styles.enemyDefeatText}>{defeatedEnemy.defeatMessage}</span><span style={styles.enemyDefeatXp}>+10 XP!</span></div></div>)}
      
      <div style={styles.visualRoom}>
        <div style={styles.roomWalls}>
          <div style={styles.roomWallLeft}></div><div style={styles.roomWallRight}></div><div style={styles.roomWallTop}></div><div style={styles.roomFloor}></div>
          {/* Door on RIGHT side */}
          <div style={{...styles.escapeDoor, right: `${doorRightPosition}px`, ...(escapeDoorOpen ? styles.escapeDoorOpen : {})}}>
            <div style={styles.doorFrame}>
              <div style={styles.doorPanel}>
                {escapeDoorOpen ? 
                  <div style={styles.openDoorContent}><span style={styles.openDoorText}>🚪 ESCAPE →</span></div> : 
                  <div style={styles.lockedDoorContent}><span style={styles.lockedDoorText}>🔒 LOCKED</span><span style={styles.lockedDoorSubtext}>Move closer!</span></div>
                }
              </div>
            </div>
            <div style={styles.doorKnob}></div>
          </div>
          <div style={styles.distanceIndicator}>
            <span>🚶 Distance: {Math.max(0, Math.ceil(distanceToDoor))}%</span>
            <div style={styles.distanceBar}>
              <div style={{...styles.distanceFill, width: `${playerPosition}%`}}></div>
            </div>
          </div>
        </div>
        <div style={{...styles.enemySprite, animation: enemyAttacking ? 'enemyAttack 0.3s ease-in-out' : 'float 2s ease-in-out infinite'}}>
          <div style={styles.enemyAvatar}>
            <span style={styles.enemyEmoji}>{currentEnemy?.emoji || "👾"}</span>
            <div style={styles.enemyNameTag}>{currentEnemy?.name || "Mystery Monster"}</div>
          </div>
        </div>
        {/* Player on LEFT side, moving right as progress increases */}
        <div style={{...styles.playerSprite, left: `${playerLeftPosition}%`}}>
          <div style={styles.playerAvatar}>
            <span style={styles.playerEmoji}>🧙</span>
            <div style={styles.playerNameTag}>You</div>
          </div>
        </div>
        {enemyAttacking && <div style={styles.bloodEffect}><span>💀</span></div>}
      </div>
      
      <div style={{...styles.puzzleArea, animation: correctFlash ? 'correctFlash 0.3s ease-in-out' : 'none'}}>
        <div style={styles.header}>
          <div style={styles.scoreTimeContainer}>
            <div style={styles.score}>⭐ {score}</div>
            <div style={styles.timer}>⏱️ {formatTime(timeLeft)}</div>
            <div style={styles.livesContainer}>
              <span>❤️ </span>
              {[...Array(3)].map((_, i) => <span key={i} style={{color: i < lives ? '#ff4444' : '#333'}}>{i < lives ? '❤️' : '🖤'}</span>)}
            </div>
          </div>
          <div style={styles.xpDisplay}>
            <span>⭐ XP: {xpSoFar}</span>
            <span style={styles.xpBreakdown}>(+{correctAnswers * 10}/-{wrongAnswers * 5})</span>
          </div>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${progress}%`}} />
          </div>
          <div style={styles.progressText}>Defeated: {puzzlesCompleted}/{totalPuzzles}</div>
        </div>
        <div style={styles.equationCard}>
          <div style={{...styles.difficultyBadge, backgroundColor: getDifficultyColor(currentPuzzleData.difficulty)}}>{currentPuzzleData.difficulty} • MCQ</div>
          <div style={styles.mcContainer}>
            <div style={styles.mcQuestionText}>{currentPuzzleData.question}</div>
            <div style={styles.optionsContainer}>
              {currentPuzzleData.options.map((option, idx) => { 
                const letter = String.fromCharCode(65 + idx); 
                return (
                  <button key={idx} onClick={() => setMcSelection(idx)} style={{...styles.optionButton, backgroundColor: mcSelection === idx ? '#4caf50' : '#2a2a4a', border: mcSelection === idx ? '1.5px solid #ffd93d' : '1.5px solid #4a4a6a'}}>
                    <span style={styles.optionLetter}>{letter}.</span>
                    <span style={styles.optionText}>{option}</span>
                  </button>
                ); 
              })}
            </div>
          </div>
          <div style={styles.answerContainer}>
            <button onClick={checkAnswer} style={styles.answerSubmitButton}>⚔️ DEFEAT ENEMY ⚔️</button>
          </div>
          {feedback && <div style={feedback.includes('💀') ? styles.feedbackDeath : styles.feedback}>{feedback}</div>}
          {showHint && <div style={styles.hint}><strong>💡 Hint:</strong> {currentPuzzleData.hint}</div>}
          <div style={styles.stats}>
            <div style={styles.attempts}>⚔️ Attempts: {attempts}</div>
            <div style={styles.xpStats}>✅ {correctAnswers} | ❌ {wrongAnswers}</div>
            <button onClick={() => setShowHint(!showHint)} style={styles.hintButton}>{showHint ? "Hide Hint" : "Show Hint"}</button>
          </div>
        </div>
        <div style={styles.tipsCard}>
          <h4 style={styles.tipsTitle}>📚 Tips</h4>
          <ul style={styles.tipsList}>
            <li>✓ Slope (rate) vs y-intercept (starting)</li>
            <li>✓ Parallel = same slope</li>
            <li>✓ Negative slope = decreasing</li>
            <li>⭐ +10 XP/correct, -5 XP/wrong</li>
            <li>⚠️ Wrong answer = -1 Life</li>
            <li>❤️ {lives} lives left</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// COMPLETELY REDESIGNED STYLES - All text is now readable on mobile and desktop
// Font sizes significantly increased without breaking layout
const styles = {
  container: { 
    maxWidth: '100%', 
    width: '100%', 
    margin: 0, 
    padding: '6px', 
    backgroundColor: '#1a1a2e', 
    borderRadius: '6px', 
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)', 
    boxSizing: 'border-box',
    '@media (min-width: 769px)': { maxWidth: '1000px', margin: '20px auto', padding: '20px', borderRadius: '20px' } 
  },
  enemyDefeatOverlay: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, pointerEvents: 'none', width: '85%', maxWidth: '280px' },
  enemyDefeatBubble: { backgroundColor: '#ffd93d', padding: '8px 12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 3px 12px rgba(0,0,0,0.4)', flexWrap: 'wrap', justifyContent: 'center', '@media (min-width: 769px)': { padding: '15px 25px', gap: '15px' } },
  enemyDefeatEmoji: { fontSize: '24px', '@media (min-width: 769px)': { fontSize: '36px' } },
  enemyDefeatText: { fontSize: '12px', fontWeight: 'bold', color: '#333', '@media (min-width: 769px)': { fontSize: '18px' } },
  enemyDefeatXp: { fontSize: '11px', color: '#4caf50', fontWeight: 'bold', backgroundColor: 'white', padding: '2px 6px', borderRadius: '12px', '@media (min-width: 769px)': { fontSize: '16px', padding: '4px 10px' } },
  visualRoom: { position: 'relative', backgroundColor: '#2d1b0e', borderRadius: '8px', padding: '6px', marginBottom: '10px', minHeight: '140px', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)', border: '1.5px solid #5c3a1e', overflow: 'hidden', '@media (min-width: 769px)': { padding: '20px', minHeight: '320px', borderRadius: '16px', borderWidth: '4px' } },
  roomWalls: { position: 'relative', height: '125px', '@media (min-width: 769px)': { height: '280px' } },
  roomWallLeft: { position: 'absolute', left: 0, top: 0, width: '6px', height: '100%', backgroundColor: '#8B6914', background: 'linear-gradient(180deg, #a07828 0%, #6b4c1a 100%)', borderRadius: '2px 0 0 2px', '@media (min-width: 769px)': { width: '20px' } },
  roomWallRight: { position: 'absolute', right: 0, top: 0, width: '6px', height: '100%', backgroundColor: '#8B6914', background: 'linear-gradient(180deg, #a07828 0%, #6b4c1a 100%)', borderRadius: '0 2px 2px 0', '@media (min-width: 769px)': { width: '20px' } },
  roomWallTop: { position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', backgroundColor: '#8B6914', background: 'linear-gradient(90deg, #a07828 0%, #6b4c1a 100%)', borderRadius: '2px 2px 0 0', '@media (min-width: 769px)': { height: '20px' } },
  roomFloor: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '16px', backgroundColor: '#4a2a0a', background: 'repeating-linear-gradient(45deg, #5c3612, #5c3612 8px, #6b4015 8px, #6b4015 16px)', borderRadius: '0 0 6px 6px', '@media (min-width: 769px)': { height: '40px' } },
  escapeDoor: { position: 'absolute', bottom: '16px', width: '32px', height: '55px', transition: 'all 0.5s ease', cursor: 'pointer', zIndex: 10, '@media (min-width: 769px)': { bottom: '40px', width: '80px', height: '140px' } },
  escapeDoorOpen: { transform: 'translateX(2px)', opacity: 0.9 },
  doorFrame: { width: '100%', height: '100%', backgroundColor: '#3d2b1a', border: '1px solid #8B6914', borderRadius: '3px', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.5)', position: 'relative', '@media (min-width: 769px)': { borderWidth: '3px' } },
  doorPanel: { width: '100%', height: '100%', backgroundColor: '#5c3d1e', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  lockedDoorContent: { color: '#ff6b6b', fontSize: '6px', fontWeight: 'bold', textAlign: 'center', '@media (min-width: 769px)': { fontSize: '10px' } },
  lockedDoorText: { display: 'block', fontSize: '7px', '@media (min-width: 769px)': { fontSize: '14px' } },
  lockedDoorSubtext: { display: 'block', fontSize: '5px', marginTop: '1px', color: '#aaa', '@media (min-width: 769px)': { fontSize: '8px', marginTop: '5px' } },
  openDoorContent: { color: '#4caf50', fontSize: '6px', fontWeight: 'bold', transform: 'rotate(-90deg)', whiteSpace: 'nowrap', '@media (min-width: 769px)': { fontSize: '14px' } },
  openDoorText: { display: 'inline-block' },
  doorKnob: { position: 'absolute', right: '2px', top: '50%', transform: 'translateY(-50%)', width: '3px', height: '3px', backgroundColor: '#ffd700', borderRadius: '50%', '@media (min-width: 769px)': { width: '10px', height: '10px', right: '5px' } },
  distanceIndicator: { position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.75)', padding: '2px 6px', borderRadius: '8px', fontSize: '8px', color: 'white', textAlign: 'center', zIndex: 15, whiteSpace: 'nowrap', '@media (min-width: 769px)': { bottom: '10px', padding: '8px 15px', fontSize: '12px' } },
  distanceBar: { width: '70px', height: '3px', backgroundColor: '#333', borderRadius: '2px', marginTop: '2px', overflow: 'hidden', '@media (min-width: 769px)': { width: '150px', height: '6px', marginTop: '5px' } },
  distanceFill: { height: '100%', backgroundColor: '#4caf50', transition: 'width 0.3s ease' },
  enemySprite: { position: 'absolute', left: '50%', top: '35%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 5, '@media (min-width: 769px)': { top: '50%' } },
  enemyAvatar: { backgroundColor: '#2a1a0a', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #ff4444', boxShadow: '0 0 6px rgba(255,0,0,0.5)', '@media (min-width: 769px)': { width: '80px', height: '80px', borderWidth: '3px' } },
  enemyEmoji: { fontSize: '24px', '@media (min-width: 769px)': { fontSize: '42px' } },
  enemyNameTag: { fontSize: '7px', backgroundColor: '#ff4444', padding: '1px 3px', borderRadius: '6px', marginTop: '2px', color: 'white', fontWeight: 'bold', '@media (min-width: 769px)': { fontSize: '10px', padding: '2px 8px', marginTop: '4px' } },
  playerSprite: { position: 'absolute', bottom: '18px', textAlign: 'center', zIndex: 5, transition: 'left 0.3s ease', '@media (min-width: 769px)': { bottom: '60px' } },
  playerAvatar: { backgroundColor: '#1a3a5c', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #4caf50', boxShadow: '0 0 6px rgba(76,175,80,0.5)', '@media (min-width: 769px)': { width: '60px', height: '60px', borderWidth: '3px' } },
  playerEmoji: { fontSize: '22px', '@media (min-width: 769px)': { fontSize: '32px' } },
  playerNameTag: { fontSize: '6px', backgroundColor: '#4caf50', padding: '1px 3px', borderRadius: '6px', marginTop: '2px', color: 'white', fontWeight: 'bold', '@media (min-width: 769px)': { fontSize: '8px', padding: '1px 6px', marginTop: '2px' } },
  bloodEffect: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '28px', opacity: 0.8, animation: 'fadeOut 0.5s ease-out', pointerEvents: 'none', zIndex: 20, '@media (min-width: 769px)': { fontSize: '60px' } },
  puzzleArea: { marginTop: '10px', '@media (min-width: 769px)': { marginTop: '20px' } },
  header: { marginBottom: '10px' },
  scoreTimeContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', flexWrap: 'wrap', gap: '6px', '@media (min-width: 769px)': { fontSize: '18px', marginBottom: '10px', gap: '10px' } },
  score: { color: '#ffd93d', background: 'rgba(0,0,0,0.3)', padding: '3px 8px', borderRadius: '12px', '@media (min-width: 769px)': { padding: '5px 12px', borderRadius: '20px' } },
  timer: { color: '#ff6b6b', background: 'rgba(0,0,0,0.3)', padding: '3px 8px', borderRadius: '12px', '@media (min-width: 769px)': { padding: '5px 12px' } },
  livesContainer: { color: '#ff4444', background: 'rgba(0,0,0,0.3)', padding: '3px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', '@media (min-width: 769px)': { padding: '5px 12px', gap: '5px', fontSize: '16px' } },
  xpDisplay: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '6px', padding: '4px 8px', backgroundColor: 'rgba(255,215,0,0.2)', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', color: '#ffd93d', flexWrap: 'wrap', '@media (min-width: 769px)': { gap: '10px', marginBottom: '10px', padding: '8px', fontSize: '14px' } },
  xpBreakdown: { fontSize: '9px', color: '#aaa', '@media (min-width: 769px)': { fontSize: '11px' } },
  progressBar: { width: '100%', height: '5px', backgroundColor: '#1e1e2e', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px', '@media (min-width: 769px)': { height: '8px', marginBottom: '8px' } },
  progressFill: { height: '100%', backgroundColor: '#4caf50', transition: 'width 0.3s ease' },
  progressText: { textAlign: 'center', fontSize: '10px', color: '#aaa', '@media (min-width: 769px)': { fontSize: '13px' } },
  equationCard: { backgroundColor: '#1e1e2e', borderRadius: '10px', padding: '12px', textAlign: 'center', '@media (min-width: 769px)': { padding: '30px', borderRadius: '16px' } },
  difficultyBadge: { display: 'inline-block', padding: '3px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold', marginBottom: '10px', color: '#fff', textTransform: 'uppercase', '@media (min-width: 769px)': { padding: '4px 12px', fontSize: '11px', marginBottom: '25px' } },
  mcContainer: { marginBottom: '12px' },
  mcQuestionText: { fontSize: '14px', color: '#fff', marginBottom: '12px', lineHeight: '1.4', whiteSpace: 'pre-line', textAlign: 'center', fontWeight: '500', '@media (min-width: 769px)': { fontSize: '20px', marginBottom: '25px' } },
  optionsContainer: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', '@media (min-width: 769px)': { gap: '12px', marginBottom: '20px' } },
  optionButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#2a2a4a', border: '1.5px solid #4a4a6a', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', fontSize: '12px', color: '#fff', '@media (min-width: 769px)': { gap: '15px', padding: '15px 20px', fontSize: '16px', borderRadius: '10px' } },
  optionLetter: { fontWeight: 'bold', fontSize: '13px', minWidth: '20px', color: '#ffd93d', '@media (min-width: 769px)': { fontSize: '18px', minWidth: '30px' } },
  optionText: { flex: 1, fontSize: '11px', lineHeight: '1.3', '@media (min-width: 769px)': { fontSize: '14px' } },
  answerContainer: { marginBottom: '12px', padding: '6px', backgroundColor: '#0f0f1f', borderRadius: '10px', border: '1px solid #ff9800', '@media (min-width: 769px)': { marginBottom: '25px', padding: '25px', borderRadius: '16px' } },
  answerSubmitButton: { width: '100%', padding: '10px 12px', fontSize: '12px', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', minHeight: '40px', '@media (min-width: 769px)': { padding: '18px 24px', fontSize: '18px', letterSpacing: '2px', minHeight: '60px' } },
  feedback: { padding: '8px', marginBottom: '8px', backgroundColor: '#2a2a4a', borderRadius: '8px', fontSize: '11px', lineHeight: '1.4', color: '#fff', '@media (min-width: 769px)': { padding: '12px', fontSize: '14px' } },
  feedbackDeath: { padding: '8px', marginBottom: '8px', backgroundColor: '#8b0000', borderRadius: '8px', fontSize: '11px', lineHeight: '1.4', color: '#fff', fontWeight: 'bold', '@media (min-width: 769px)': { padding: '12px', fontSize: '14px' } },
  hint: { padding: '8px', marginBottom: '8px', backgroundColor: '#ff9800', borderRadius: '8px', fontSize: '11px', color: '#fff', '@media (min-width: 769px)': { padding: '12px', fontSize: '14px' } },
  stats: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #3a3a5a', flexWrap: 'wrap', gap: '6px', '@media (min-width: 769px)': { marginTop: '15px', paddingTop: '15px', gap: '10px' } },
  attempts: { fontSize: '10px', color: '#aaa', '@media (min-width: 769px)': { fontSize: '13px' } },
  xpStats: { fontSize: '10px', color: '#ffd93d', fontWeight: 'bold', '@media (min-width: 769px)': { fontSize: '13px' } },
  hintButton: { padding: '4px 10px', fontSize: '10px', backgroundColor: '#4a6fa5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', minHeight: '28px', '@media (min-width: 769px)': { padding: '6px 14px', fontSize: '12px', minHeight: '36px' } },
  tipsCard: { backgroundColor: '#1e1e2e', borderRadius: '8px', padding: '8px', marginTop: '8px', '@media (min-width: 769px)': { padding: '18px', borderRadius: '12px', marginTop: '10px' } },
  tipsTitle: { fontSize: '11px', marginBottom: '5px', color: '#ffd93d', '@media (min-width: 769px)': { fontSize: '16px', marginBottom: '12px' } },
  tipsList: { listStyle: 'none', padding: 0, margin: 0, fontSize: '9px', lineHeight: '1.5', color: '#ccc', '@media (min-width: 769px)': { fontSize: '13px', lineHeight: '1.8' } },
  completionContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '250px', padding: '12px', '@media (min-width: 769px)': { minHeight: '400px', padding: '20px' } },
  completionCard: { backgroundColor: '#2a2a4a', borderRadius: '12px', padding: '16px', textAlign: 'center', maxWidth: '280px', width: '90%', '@media (min-width: 769px)': { padding: '35px', maxWidth: '450px', borderRadius: '20px' } },
  trophyIcon: { fontSize: '36px', marginBottom: '8px', '@media (min-width: 769px)': { fontSize: '56px', marginBottom: '15px' } },
  sadIcon: { fontSize: '36px', marginBottom: '8px', '@media (min-width: 769px)': { fontSize: '56px' } },
  completionTitle: { fontSize: '18px', marginBottom: '8px', color: '#ffd93d', '@media (min-width: 769px)': { fontSize: '28px', marginBottom: '15px' } },
  completionText: { fontSize: '11px', marginBottom: '12px', color: '#ccc', '@media (min-width: 769px)': { fontSize: '16px', marginBottom: '20px' } },
  finalScore: { backgroundColor: '#1e1e2e', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '10px', lineHeight: '1.5', '@media (min-width: 769px)': { padding: '15px', fontSize: '14px', lineHeight: '1.8' } },
  continueButton: { padding: '8px 16px', fontSize: '12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', minHeight: '36px', '@media (min-width: 769px)': { padding: '10px 25px', fontSize: '14px', minHeight: '48px' } }
};

export default EscapeRoom;