// src/games/BattleArena.jsx - FULLY RESPONSIVE with Background Music & Sound Effects
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaVolumeUp, FaVolumeMute, FaMusic } from 'react-icons/fa';

// Background Music Handler with space.mp3
class BackgroundMusicManager {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.3;
    this.useFallback = false;
  }

  initAudio() {
    if (!this.audio && !this.useFallback) {
      try {
        this.audio = new Audio('/src/games/sounds/space.mp3');
        this.audio.loop = true;
        this.audio.volume = this.isMuted ? 0 : this.volume;
        this.audio.load();
      } catch(e) {
        console.log('Could not load space.mp3, using fallback mode');
        this.useFallback = true;
      }
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
    
    if (this.useFallback) {
      this.isPlaying = true;
      return;
    }
    
    this.initAudio();
    if (this.audio) {
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isPlaying = true;
          console.log('space.mp3 background music playing');
        }).catch(e => {
          console.log('Music play failed:', e);
          this.useFallback = true;
          this.isPlaying = true;
        });
      }
    }
  }

  stopMusic() {
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch(e) {}
    }
    this.isPlaying = false;
  }

  resumeAudio() {
    if (this.audio && !this.isPlaying && !this.isMuted && !this.useFallback) {
      this.audio.play().catch(e => console.log('Resume failed:', e));
      this.isPlaying = true;
    }
  }
}

// Define enemies and questions OUTSIDE the component
const enemies = [
  { name: "Slime", health: 50, maxHealth: 50, attack: 10, defense: 2, difficulty: "Basic", points: 100, color: "#8bc34a" },
  { name: "Goblin", health: 80, maxHealth: 80, attack: 15, defense: 5, difficulty: "Basic", points: 150, color: "#cddc39" },
  { name: "Orc", health: 120, maxHealth: 120, attack: 20, defense: 8, difficulty: "Intermediate", points: 200, color: "#ff9800" },
  { name: "Troll", health: 150, maxHealth: 150, attack: 25, defense: 10, difficulty: "Intermediate", points: 250, color: "#f44336" },
  { name: "Dark Knight", health: 200, maxHealth: 200, attack: 30, defense: 15, difficulty: "Advanced", points: 350, color: "#9c27b0" },
  { name: "Dragon", health: 300, maxHealth: 300, attack: 40, defense: 20, difficulty: "Advanced", points: 500, color: "#e91e63" },
  { name: "Math Wizard", health: 250, maxHealth: 250, attack: 35, defense: 18, difficulty: "Expert", points: 450, color: "#3f51b5" },
  { name: "Equation Lord", health: 400, maxHealth: 400, attack: 50, defense: 25, difficulty: "Boss", points: 800, color: "#d32f2f" }
];

const conceptQuestions = [
  { question: "Why does slope formula compare 'change in y' over 'change in x'?", options: ["To confuse students", "To measure rate of change", "To find intercept", "To avoid graphing"], correct: 1, explanation: "Slope measures rate of change: how y changes per unit of x." },
  { question: "A salary increases steadily every year. What does this imply?", options: ["Nonlinear graph", "Linear graph", "Circular graph", "No graph"], correct: 1, explanation: "Steady increase means constant rate of change → linear graph." },
  { question: "Two workers earn money at the same rate but start with different savings. What will their graphs look like?", options: ["Intersecting", "Parallel", "Same line", "Perpendicular"], correct: 1, explanation: "Same rate = same slope, different savings = different y-intercepts → parallel lines." },
  { question: "Which situation represents y = 4x − 8?", options: ["Starts at −8, increases by 4", "Starts at 8, decreases by 4", "Starts at 4, increases by 8", "Starts at 0, increases by 4"], correct: 0, explanation: "y = mx + b: m=4 (increase by 4), b=-8 (starts at -8)." },
  { question: "Why is it important to interpret equations in real life?", options: ["To memorize formulas", "To connect math to real situations", "To avoid solving", "To make equations longer"], correct: 1, explanation: "Interpreting equations helps apply math to practical scenarios." },
  { question: "Which describes x/5 + y/10 = 1?", options: ["Intercepts at (5,0) and (0,10)", "Slope 5", "No intercept", "Vertical line"], correct: 0, explanation: "Set y=0 → x/5=1 → x=5. Set x=0 → y/10=1 → y=10." },
  { question: "What does the x-intercept represent in real life?", options: ["Starting value", "When output becomes zero", "Rate of change", "Maximum slope"], correct: 1, explanation: "x-intercept is where y=0, often the 'break-even' point." },
  { question: "Why is graphing useful?", options: ["It replaces equations", "It visualizes relationships", "It removes variables", "It simplifies nothing"], correct: 1, explanation: "Graphs make relationships visible and easier to understand." },
  { question: "Which real-life situation could produce a negative slope?", options: ["Saving money", "Spending money over time", "Growing plants", "Increasing population"], correct: 1, explanation: "Spending money decreases your balance over time → negative slope." },
  { question: "A student says: 'All linear equations are useful in real life.' Which best justifies this?", options: ["They are easy", "They model constant change", "They use x and y", "They are straight"], correct: 1, explanation: "Linear equations model many real-life situations involving constant rates." }
];

const BattleArena = ({ 
  onComplete, 
  onScore, 
  challengeScore, 
  sendGameResult,
  onGameStateUpdate,
  savedGameState,
  clearSavedState,
  isSfxMuted = false,
  isMusicMuted = false
}) => {
  // Background music instance
  const backgroundMusic = useRef(null);
  
  // Sound effect refs
  const soundsRef = useRef({});
  
  // Music control states
  const [musicMuted, setMusicMuted] = useState(isMusicMuted);
  const [sfxMuted, setSfxMuted] = useState(isSfxMuted);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [showMusicNote, setShowMusicNote] = useState(false);
  
  // ===== ALL STATE DECLARATIONS =====
  const [currentEnemyIndex, setCurrentEnemyIndex] = useState(() => savedGameState?.currentEnemyIndex ?? 0);
  const [enemyHealth, setEnemyHealth] = useState(() => savedGameState?.enemyHealth ?? enemies[0].health);
  const [playerHealth, setPlayerHealth] = useState(() => savedGameState?.playerHealth ?? 200);
  const [score, setScore] = useState(() => savedGameState?.challengeScore ?? (challengeScore || 0));
  const [feedback, setFeedback] = useState(() => savedGameState?.feedback || '');
  const [gameActive, setGameActive] = useState(() => savedGameState?.gameActive ?? true);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [attacksCount, setAttacksCount] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [defenseMode, setDefenseMode] = useState(false);
  const [powerUps, setPowerUps] = useState(() => savedGameState?.powerUps ?? { heal: 2, doubleDamage: 1, shield: 1 });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => savedGameState?.currentQuestionIndex ?? 0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);

  // Current values derived from state
  const currentEnemy = enemies[currentEnemyIndex];
  const isBoss = currentEnemy?.difficulty === 'Boss';
  const isLastEnemy = currentEnemyIndex === enemies.length - 1;
  const currentQuestion = conceptQuestions[currentQuestionIndex];

  // Load saved preferences
  useEffect(() => {
    const savedMusicMute = localStorage.getItem('battleMusicMuted');
    const savedSfxMute = localStorage.getItem('battleSfxMuted');
    const savedVolume = localStorage.getItem('battleMusicVolume');
    
    if (savedMusicMute !== null) setMusicMuted(savedMusicMute === 'true');
    if (savedSfxMute !== null) setSfxMuted(savedSfxMute === 'true');
    if (savedVolume !== null) {
      const vol = parseFloat(savedVolume);
      setMusicVolume(vol);
      if (backgroundMusic.current) backgroundMusic.current.setVolume(vol);
    }
  }, []);

  // ===== HELPER FUNCTIONS =====
  const getHealthBarColor = (health, maxHealth) => { 
    const p = (health / maxHealth) * 100; 
    return p > 60 ? '#4caf50' : p > 30 ? '#ff9800' : '#f44336'; 
  };

  // Toggle music function
  const toggleMusic = () => {
    const newMuteState = !musicMuted;
    setMusicMuted(newMuteState);
    localStorage.setItem('battleMusicMuted', newMuteState);
    if (backgroundMusic.current) backgroundMusic.current.setMuted(newMuteState);
    
    setShowMusicNote(true);
    setTimeout(() => setShowMusicNote(false), 1000);
  };

  const toggleSoundEffects = () => {
    const newMuteState = !sfxMuted;
    setSfxMuted(newMuteState);
    localStorage.setItem('battleSfxMuted', newMuteState);
  };

  const handleMusicVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setMusicVolume(newVolume);
    if (backgroundMusic.current) backgroundMusic.current.setVolume(newVolume);
    localStorage.setItem('battleMusicVolume', newVolume);
  };

  // Safe sound playback function
  const playSound = useCallback((soundKey) => {
    if (sfxMuted) return;
    const sound = soundsRef.current[soundKey];
    if (sound) {
      try {
        sound.currentTime = 0;
        sound.play().catch(e => console.log(`Sound ${soundKey} play failed:`, e));
      } catch(e) {
        console.log(`Sound ${soundKey} error:`, e);
      }
    }
  }, [sfxMuted]);
  
  // Resume audio on user interaction
  const resumeAudio = useCallback(() => {
    if (backgroundMusic.current) {
      backgroundMusic.current.resumeAudio();
    }
  }, []);

  const sendResultToParent = useCallback((completed, finalScore) => {
    const accuracy = attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0;
    const gameResult = { type: 'GAME_RESULT', gameId: 'battle', completed, score: finalScore, timeSpent: 0, stats: { finalScore, totalEnemies: enemies.length, enemiesDefeated: currentEnemyIndex + (completed ? 1 : 0), accuracy, attacksMade: attacksCount, correctAnswers, wrongAnswers, powerUpsUsed: { heals: 2 - powerUps.heal, doubleDamage: 1 - powerUps.doubleDamage, shield: 1 - powerUps.shield } } };
    if (window.parent !== window) window.parent.postMessage(gameResult, '*');
    if (window.opener) window.opener.postMessage(gameResult, '*');
    if (sendGameResult) sendGameResult(completed, finalScore, 0, currentEnemyIndex + (completed ? 1 : 0), gameResult.stats);
  }, [enemies.length, currentEnemyIndex, attacksCount, correctAnswers, wrongAnswers, powerUps, sendGameResult]);

  const saveProgressToLocalStorage = useCallback((completed, finalScore) => {
    try {
      const existingProgress = localStorage.getItem('gameProgress');
      let progress = existingProgress ? JSON.parse(existingProgress) : { equation: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 }, battle: { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 }, spaceShooter: {} };
      const currentBattle = progress.battle || { completed: false, highScore: 0, attempts: 0, bestTime: null, lastPlayed: null, lastScore: 0 };
      const newHighScore = Math.max(currentBattle.highScore || 0, finalScore || 0);
      progress.battle = { ...currentBattle, completed: completed || currentBattle.completed, highScore: newHighScore, lastScore: finalScore, attempts: (currentBattle.attempts || 0) + 1, lastPlayed: new Date().toISOString(), lastGameStats: { enemiesDefeated: currentEnemyIndex + (completed ? 1 : 0), totalEnemies: enemies.length, finalScore, accuracy: attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0, correctAnswers, wrongAnswers } };
      localStorage.setItem('gameProgress', JSON.stringify(progress));
    } catch (error) { console.error('Error saving to localStorage:', error); }
  }, [enemies.length, currentEnemyIndex, attacksCount, correctAnswers, wrongAnswers]);

  const usePowerUp = (type) => {
    if (powerUps[type] > 0 && !waitingForNext) {
      setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
      if (type === 'heal') { 
        setPlayerHealth(prev => Math.min(prev + 50, 200)); 
        setFeedback("💚 Heal! +50 HP");
        playSound('heal');
      }
      else if (type === 'doubleDamage') { 
        setDefenseMode(false); 
        setFeedback("⚡ Double damage active!");
        playSound('powerUp');
      }
      else if (type === 'shield') { 
        setDefenseMode(true); 
        setFeedback("🛡️ Shield active! 50% reduction!");
        playSound('powerUp');
      }
    } else if (powerUps[type] === 0) setFeedback(`No ${type} power-ups left!`);
  };

  const handleQuizAnswer = (optionIndex) => {
    if (selectedOption !== null || waitingForNext) return;
    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correct;
    
    if (window.parent !== window) window.parent.postMessage({ type: 'XP_UPDATE', gameId: 'battle', xpChange: isCorrect ? 15 : -5, isCorrect, correctAnswer: currentQuestion.options[currentQuestion.correct], userAnswer: currentQuestion.options[optionIndex], question: currentQuestion.question }, '*');
    
    setAttacksCount(prev => prev + 1);
    
    if (isCorrect) {
      playSound('correct');
      setCorrectAnswers(prev => prev + 1);
      let damage = currentEnemy ? currentEnemy.attack : 25;
      const doubleDamageActive = powerUps.doubleDamage === 0;
      if (doubleDamageActive) { 
        damage *= 2; 
        setFeedback(`🔥 CRITICAL! ${damage} damage! +15 XP!`);
        setPowerUps(prev => ({ ...prev, doubleDamage: 1 }));
        playSound('attack');
      }
      else setFeedback(`✅ CORRECT! ${damage} damage! +15 XP! ${currentQuestion.explanation}`);
      
      const newEnemyHealth = Math.max(0, enemyHealth - damage);
      setEnemyHealth(newEnemyHealth);
      const pointsEarned = (currentEnemy ? currentEnemy.points : 100) * (doubleDamageActive ? 2 : 1);
      const newScore = score + pointsEarned;
      setScore(newScore);
      if (onScore) onScore(newScore);
      
      if (newEnemyHealth <= 0) {
        playSound('enemyDefeat');
        setFeedback(prev => `${prev}\n🎉 Defeated ${currentEnemy.name}! +${pointsEarned} points!`);
        
        if (isLastEnemy) {
          setGameActive(false); 
          setShowCongratulations(true);
          playSound('victory');
          saveProgressToLocalStorage(true, newScore);
          sendResultToParent(true, newScore);
          if (onComplete) onComplete(true);
          if (clearSavedState) clearSavedState();
          return;
        } else {
          setWaitingForNext(true);
          setTimeout(() => {
            const nextIndex = currentEnemyIndex + 1;
            setCurrentEnemyIndex(nextIndex);
            setEnemyHealth(enemies[nextIndex].health);
            if (currentQuestionIndex + 1 < conceptQuestions.length) setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null); setShowExplanation(false);
            setFeedback(`New enemy: ${enemies[nextIndex].name}!`);
            setWaitingForNext(false);
          }, 2000);
          return;
        }
      }
      
      setWaitingForNext(true);
      setTimeout(() => {
        if (currentQuestionIndex + 1 < conceptQuestions.length) { 
          setCurrentQuestionIndex(prev => prev + 1); 
          setSelectedOption(null); 
          setShowExplanation(false); 
          setWaitingForNext(false); 
          setFeedback(""); 
        }
        else {
          setQuizCompleted(true);
          const bonusPoints = 500;
          const finalScore = score + pointsEarned + bonusPoints;
          setScore(finalScore);
          if (onScore) onScore(finalScore);
          setFeedback(`🎉 Quiz Complete! +${bonusPoints} bonus!`);
          playSound('victory');
          setGameActive(false); 
          setShowCongratulations(true);
          saveProgressToLocalStorage(true, finalScore);
          sendResultToParent(true, finalScore);
          if (onComplete) onComplete(true);
          if (clearSavedState) clearSavedState();
        }
      }, 2500);
    } else {
      playSound('wrong');
      setWrongAnswers(prev => prev + 1);
      let enemyDamage = currentEnemy ? Math.max(8, currentEnemy.attack) : 20;
      if (defenseMode) { 
        enemyDamage = Math.floor(enemyDamage / 2); 
        setFeedback(`❌ INCORRECT! Counter-attack ${enemyDamage} damage (shielded)! -5 XP!`); 
        setDefenseMode(false); 
      }
      else setFeedback(`❌ INCORRECT! Correct: ${currentQuestion.options[currentQuestion.correct]}. ${currentEnemy.name} deals ${enemyDamage} damage! -5 XP!`);
      
      const newPlayerHealth = Math.max(0, playerHealth - enemyDamage);
      setPlayerHealth(newPlayerHealth);
      
      if (newPlayerHealth <= 0) {
        setGameActive(false);
        setFeedback("💀 Game Over!");
        playSound('gameOver');
        saveProgressToLocalStorage(false, score);
        sendResultToParent(false, score);
        if (onComplete) onComplete(false);
        return;
      }
      
      setWaitingForNext(true);
      setTimeout(() => {
        if (currentQuestionIndex + 1 < conceptQuestions.length) { 
          setCurrentQuestionIndex(prev => prev + 1); 
          setSelectedOption(null); 
          setShowExplanation(false); 
          setWaitingForNext(false); 
          setFeedback(""); 
        }
        else { 
          setCurrentQuestionIndex(0); 
          setSelectedOption(null); 
          setShowExplanation(false); 
          setWaitingForNext(false); 
          setFeedback("📚 New questions! Keep fighting!"); 
        }
      }, 2500);
    }
    setShowExplanation(true);
  };

  // ===== ALL USE EFFECTS =====
  
  // Initialize background music
  useEffect(() => {
    backgroundMusic.current = new BackgroundMusicManager();
    backgroundMusic.current.setMuted(musicMuted);
    backgroundMusic.current.setVolume(musicVolume);
    
    return () => {
      if (backgroundMusic.current) {
        backgroundMusic.current.stopMusic();
      }
    };
  }, []);
  
  // Handle music playback based on game state
  useEffect(() => {
    if (backgroundMusic.current) {
      backgroundMusic.current.setMuted(musicMuted);
      
      if (gameActive && !showCongratulations && !musicMuted) {
        backgroundMusic.current.startMusic();
      } else {
        backgroundMusic.current.stopMusic();
      }
    }
  }, [gameActive, showCongratulations, musicMuted]);
  
  // Update volume when changed
  useEffect(() => {
    if (backgroundMusic.current) {
      backgroundMusic.current.setVolume(musicVolume);
    }
  }, [musicVolume]);
  
  // Initialize sound effects safely
  useEffect(() => {
    const soundPath = '/src/games/sounds/';
    const soundFiles = {
      correct: 'clap.mp3',
      wrong: 'boo.mp3',
      victory: 'victory.mp3',
      gameOver: 'game-over.mp3',
      powerUp: 'powerup.mp3',
      enemyDefeat: 'enemy-defeat.mp3',
      attack: 'attack.mp3',
      heal: 'heal.mp3'
    };
    
    Object.entries(soundFiles).forEach(([key, file]) => {
      try {
        const audio = new Audio(`${soundPath}${file}`);
        audio.volume = 0.6;
        audio.load();
        soundsRef.current[key] = audio;
      } catch(e) {
        console.log(`Could not load ${file}, using fallback`);
        soundsRef.current[key] = null;
      }
    });
    
    return () => {
      Object.values(soundsRef.current).forEach(audio => {
        if (audio) {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch(e) {}
        }
      });
    };
  }, []);

  useEffect(() => {
    if (onGameStateUpdate && gameActive && !showCongratulations && !quizCompleted) {
      onGameStateUpdate({ currentEnemyIndex, enemyHealth, playerHealth, challengeScore: score, feedback, gameActive, powerUps, attacksCount, correctAnswers, wrongAnswers, defenseMode, currentQuestionIndex, selectedOption, showExplanation, quizCompleted, waitingForNext });
    }
  });

  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'SCORE_UPDATE', gameId: 'battle', score: score, stats: { currentEnemy: currentEnemyIndex, playerHealth, enemyHealth, attacksMade: attacksCount, correctAnswers, wrongAnswers, accuracy: attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0 } }, '*');
    }
  });

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'REQUEST_SCORE') {
        window.parent.postMessage({ type: 'SCORE_UPDATE', gameId: 'battle', score: score, stats: { currentEnemy: currentEnemyIndex, playerHealth, enemyHealth, attacksMade: attacksCount, correctAnswers, wrongAnswers, accuracy: attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0 } }, '*');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [score, currentEnemyIndex, playerHealth, enemyHealth, attacksCount, correctAnswers, wrongAnswers]);

  // ===== RENDER LOGIC =====
  if (showCongratulations) {
    const xpEarned = (correctAnswers * 15) - (wrongAnswers * 5);
    const bonusCompletionXP = quizCompleted ? 150 : 100;
    return (
      <div style={styles.completionContainer} onClick={resumeAudio}>
        {/* Music Controls */}
        <div style={styles.musicControls}>
          <button onClick={toggleMusic} style={styles.musicButton} title={musicMuted ? "Unmute Music" : "Mute Music"}>
            {musicMuted ? <FaVolumeMute /> : <FaMusic />}
          </button>
          <button onClick={toggleSoundEffects} style={styles.musicButton} title={sfxMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}>
            {sfxMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={musicVolume}
            onChange={handleMusicVolumeChange}
            style={styles.volumeSlider}
            title="Music Volume"
          />
        </div>
        {showMusicNote && <div style={styles.musicNoteAnimation}>🎵</div>}
        <div style={styles.completionCard}>
          <div style={styles.trophyIcon}>🏆</div>
          <h2 style={styles.completionTitle}>{quizCompleted ? "Quiz Master!" : "Victory!"}</h2>
          <p style={styles.completionText}>{quizCompleted ? "You mastered all math concepts!" : "You conquered all enemies!"}</p>
          <div style={styles.finalScore}>
            <div>Final Score: {score}</div>
            <div>Attacks: {attacksCount}</div>
            <div>✅ Correct: {correctAnswers} (+{correctAnswers * 15} XP)</div>
            <div>❌ Wrong: {wrongAnswers} (-{wrongAnswers * 5} XP)</div>
            <div>Accuracy: {attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0}%</div>
            <div>⭐ XP: {xpEarned}</div>
            <div>🎉 Bonus: +{bonusCompletionXP} XP</div>
            <div style={{marginTop:'8px',borderTop:'1px solid rgba(255,255,255,0.2)',paddingTop:'8px',fontWeight:'bold',color:'#ffd700'}}>Total XP: {xpEarned + bonusCompletionXP}</div>
          </div>
          <button onClick={() => onComplete && onComplete(true)} style={styles.continueButton}>Return to Menu</button>
        </div>
      </div>
    );
  }

  if (!gameActive && !showCongratulations) {
    const xpEarned = (correctAnswers * 15) - (wrongAnswers * 5);
    return (
      <div style={styles.completionContainer} onClick={resumeAudio}>
        {/* Music Controls */}
        <div style={styles.musicControls}>
          <button onClick={toggleMusic} style={styles.musicButton} title={musicMuted ? "Unmute Music" : "Mute Music"}>
            {musicMuted ? <FaVolumeMute /> : <FaMusic />}
          </button>
          <button onClick={toggleSoundEffects} style={styles.musicButton} title={sfxMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}>
            {sfxMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={musicVolume}
            onChange={handleMusicVolumeChange}
            style={styles.volumeSlider}
            title="Music Volume"
          />
        </div>
        {showMusicNote && <div style={styles.musicNoteAnimation}>🎵</div>}
        <div style={styles.completionCard}>
          <div style={styles.sadIcon}>💀</div>
          <h2 style={styles.completionTitle}>Game Over</h2>
          <p style={styles.completionText}>You were defeated! Try again!</p>
          <div style={styles.finalScore}>
            <div>Final Score: {score}</div>
            <div>Enemies: {currentEnemyIndex}/{enemies.length}</div>
            <div>✅ Correct: {correctAnswers} (+{correctAnswers * 15} XP)</div>
            <div>❌ Wrong: {wrongAnswers} (-{wrongAnswers * 5} XP)</div>
            <div>Accuracy: {attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(1) : 0}%</div>
            <div>⭐ XP: {xpEarned}</div>
          </div>
          <button onClick={() => { clearSavedState?.(); onComplete && onComplete(false); }} style={styles.continueButton}>Try Again</button>
        </div>
      </div>
    );
  }

  // Make sure currentEnemy exists before rendering
  if (!currentEnemy) {
    return <div style={styles.container}>Loading...</div>;
  }

  const playerHealthPercent = (playerHealth / 200) * 100;
  const enemyHealthPercent = (enemyHealth / currentEnemy.maxHealth) * 100;

  return (
    <div style={styles.container} onClick={resumeAudio}>
      {/* Music Controls - Same as EquationEscapeRoom */}
      <div style={styles.musicControls}>
        <button onClick={toggleMusic} style={styles.musicButton} title={musicMuted ? "Unmute Music" : "Mute Music"}>
          {musicMuted ? <FaVolumeMute /> : <FaMusic />}
        </button>
        <button onClick={toggleSoundEffects} style={styles.musicButton} title={sfxMuted ? "Unmute Sound Effects" : "Mute Sound Effects"}>
          {sfxMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={musicVolume}
          onChange={handleMusicVolumeChange}
          style={styles.volumeSlider}
          title="Music Volume"
        />
      </div>
      
      {showMusicNote && <div style={styles.musicNoteAnimation}>🎵</div>}

      <div style={styles.header}>
        <div style={styles.scoreDisplay}>⭐ {score}</div>
        <div style={styles.enemyCount}>
          {currentEnemyIndex + 1}/{enemies.length}
          {isBoss && <span style={styles.bossBadge}>BOSS</span>}
        </div>
      </div>
      
      <div style={styles.battleArena}>
        <div style={styles.enemySection}>
          <div style={{...styles.enemyCard, backgroundColor: currentEnemy.color}}>
            <div style={styles.enemyName}>{currentEnemy.name}</div>
            <div style={styles.enemyDifficulty}>{currentEnemy.difficulty}</div>
            <div style={styles.healthBarContainer}>
              <div style={styles.healthBarLabel}>❤️ {enemyHealth}/{currentEnemy.maxHealth}</div>
              <div style={styles.healthBar}>
                <div style={{...styles.healthFill, width: `${enemyHealthPercent}%`, backgroundColor: getHealthBarColor(enemyHealth, currentEnemy.maxHealth)}} />
              </div>
            </div>
          </div>
        </div>
        
        <div style={styles.vsDivider}>❓</div>
        
        <div style={styles.playerSection}>
          <div style={styles.playerCard}>
            <div style={styles.playerName}>You</div>
            <div style={styles.healthBarContainer}>
              <div style={styles.healthBarLabel}>❤️ {playerHealth}/200</div>
              <div style={styles.healthBar}>
                <div style={{...styles.healthFill, width: `${playerHealthPercent}%`, backgroundColor: getHealthBarColor(playerHealth, 200)}} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={styles.mathChallenge}>
        <div style={styles.equationBox}>
          <div style={styles.equationText}>{currentQuestion?.question}</div>
          <div style={styles.optionsGrid}>
            {currentQuestion?.options.map((opt, idx) => (
              <button 
                key={idx} 
                onClick={() => handleQuizAnswer(idx)} 
                disabled={selectedOption !== null || waitingForNext} 
                style={{
                  ...styles.optionButton, 
                  backgroundColor: selectedOption === idx ? (idx === currentQuestion.correct ? '#4caf50' : '#f44336') : (selectedOption !== null && idx === currentQuestion.correct ? '#4caf50' : 'rgba(255,255,255,0.15)'),
                  cursor: (selectedOption !== null || waitingForNext) ? 'default' : 'pointer',
                  opacity: (selectedOption !== null || waitingForNext) && idx !== currentQuestion.correct && idx !== selectedOption ? 0.6 : 1
                }}
              >
                {String.fromCharCode(65 + idx)}. {opt}
                {selectedOption === idx && (idx === currentQuestion.correct ? " ✓" : " ✗")}
              </button>
            ))}
          </div>
          {waitingForNext && <div style={styles.waitingMessage}>⏳ Next...</div>}
          {feedback && <div style={styles.feedback}>{feedback}</div>}
        </div>
      </div>
      
      <div style={styles.powerUpsSection}>
        <h3 style={styles.powerUpsTitle}>💪 POWER-UPS</h3>
        <div style={styles.powerUpsContainer}>
          <button onClick={() => usePowerUp('heal')} style={{...styles.powerUpButton, backgroundColor: '#4caf50'}} disabled={powerUps.heal === 0 || waitingForNext}>
            💚 Heal {powerUps.heal > 0 ? `(${powerUps.heal})` : '(Used)'}
          </button>
          <button onClick={() => usePowerUp('doubleDamage')} style={{...styles.powerUpButton, backgroundColor: '#ff9800'}} disabled={powerUps.doubleDamage === 0 || waitingForNext}>
            ⚡ 2x Dmg {powerUps.doubleDamage > 0 ? `(${powerUps.doubleDamage})` : '(Used)'}
          </button>
          <button onClick={() => usePowerUp('shield')} style={{...styles.powerUpButton, backgroundColor: '#2196f3'}} disabled={powerUps.shield === 0 || waitingForNext}>
            🛡️ Shield {powerUps.shield > 0 ? `(${powerUps.shield})` : '(Used)'}
          </button>
        </div>
      </div>
      
      <div style={styles.statsDisplay}>
        <div>Q: {currentQuestionIndex + 1}/{conceptQuestions.length}</div>
        <div>✅ {correctAnswers} (+{correctAnswers * 15})</div>
        <div>❌ {wrongAnswers} (-{wrongAnswers * 5})</div>
        <div>📊 {attacksCount > 0 ? ((correctAnswers / attacksCount) * 100).toFixed(0) : 0}%</div>
        <div>⚔️ {attacksCount}</div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '100%', width: '100%', margin: 0, padding: '12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#fff', boxSizing: 'border-box', position: 'relative', '@media (min-width: 769px)': { maxWidth: '1200px', margin: '20px auto', padding: '20px', borderRadius: '20px' } },
  musicControls: { 
    position: 'absolute', 
    top: '12px', 
    right: '12px', 
    display: 'flex', 
    gap: '8px', 
    alignItems: 'center', 
    zIndex: 1001, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    padding: '6px 12px', 
    borderRadius: '20px', 
    backdropFilter: 'blur(5px)', 
    '@media (min-width: 769px)': { top: '20px', right: '20px', padding: '8px 16px', gap: '12px' } 
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
    transition: 'all 0.3s', 
    '&:hover': { transform: 'scale(1.05)' }, 
    '@media (min-width: 769px)': { width: '40px', height: '40px', fontSize: '18px' } 
  },
  volumeSlider: { 
    width: '60px', 
    height: '3px', 
    cursor: 'pointer', 
    backgroundColor: '#667eea', 
    borderRadius: '3px', 
    '@media (min-width: 769px)': { width: '80px' } 
  },
  musicNoteAnimation: { 
    position: 'fixed', 
    top: '50%', 
    left: '50%', 
    transform: 'translate(-50%, -50%)', 
    fontSize: '60px', 
    animation: 'musicNote 1s ease-out', 
    pointerEvents: 'none', 
    zIndex: 2000, 
    '@media (min-width: 769px)': { fontSize: '100px' } 
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '10px', marginBottom: '15px', flexWrap: 'wrap', gap: '8px', '@media (min-width: 769px)': { padding: '15px 20px', marginBottom: '20px' } },
  scoreDisplay: { fontSize: '16px', fontWeight: 'bold', color: '#ffd700', '@media (min-width: 769px)': { fontSize: '24px' } },
  enemyCount: { fontSize: '11px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', '@media (min-width: 769px)': { fontSize: '16px', gap: '8px' } },
  bossBadge: { backgroundColor: '#f44336', padding: '2px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: 'bold', '@media (min-width: 769px)': { padding: '3px 8px', fontSize: '12px' } },
  battleArena: { display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', '@media (min-width: 768px)': { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '15px', alignItems: 'center' } },
  enemySection: { textAlign: 'center' },
  enemyCard: { padding: '12px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', '@media (min-width: 769px)': { padding: '20px', borderRadius: '16px' } },
  enemyName: { fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', '@media (min-width: 769px)': { fontSize: '32px', marginBottom: '8px' } },
  enemyDifficulty: { fontSize: '9px', marginBottom: '10px', opacity: 0.9, '@media (min-width: 769px)': { fontSize: '14px', marginBottom: '15px' } },
  playerSection: { textAlign: 'center' },
  playerCard: { background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', padding: '12px', borderRadius: '12px', '@media (min-width: 769px)': { padding: '20px', borderRadius: '16px' } },
  playerName: { fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', '@media (min-width: 769px)': { fontSize: '32px', marginBottom: '15px' } },
  vsDivider: { fontSize: '28px', fontWeight: 'bold', color: '#ffd700', textAlign: 'center', '@media (min-width: 769px)': { fontSize: '48px' } },
  healthBarContainer: { width: '100%' },
  healthBarLabel: { fontSize: '10px', marginBottom: '3px', fontWeight: 'bold', '@media (min-width: 769px)': { fontSize: '14px', marginBottom: '5px' } },
  healthBar: { width: '100%', height: '18px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden', '@media (min-width: 769px)': { height: '25px', borderRadius: '12px' } },
  healthFill: { height: '100%', transition: 'width 0.3s ease', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', '@media (min-width: 769px)': { fontSize: '12px', borderRadius: '12px' } },
  mathChallenge: { marginBottom: '15px' },
  equationBox: { background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)', backdropFilter: 'blur(10px)', padding: '15px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)', '@media (min-width: 769px)': { padding: '30px', borderRadius: '16px' } },
  equationText: { fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', wordBreak: 'break-word', lineHeight: 1.4, '@media (min-width: 769px)': { fontSize: '28px', marginBottom: '25px' } },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' },
  optionButton: { padding: '10px 12px', fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', textAlign: 'left', minHeight: '44px', '@media (min-width: 769px)': { padding: '14px 20px', fontSize: '16px', borderRadius: '12px' } },
  waitingMessage: { marginTop: '12px', padding: '8px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '8px', fontSize: '11px', color: '#ffd700', textAlign: 'center', '@media (min-width: 769px)': { marginTop: '20px', padding: '12px', fontSize: '14px' } },
  feedback: { marginTop: '12px', padding: '8px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '11px', color: '#ffd700', whiteSpace: 'pre-line', fontWeight: 'bold', wordBreak: 'break-word', '@media (min-width: 769px)': { marginTop: '20px', padding: '12px', fontSize: '14px' } },
  powerUpsSection: { backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', marginBottom: '12px', '@media (min-width: 769px)': { padding: '20px', marginBottom: '15px' } },
  powerUpsTitle: { fontSize: '13px', marginBottom: '10px', color: '#ffd700', textAlign: 'center', '@media (min-width: 769px)': { fontSize: '18px', marginBottom: '15px' } },
  powerUpsContainer: { display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' },
  powerUpButton: { padding: '8px 12px', fontSize: '10px', fontWeight: 'bold', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', minHeight: '40px', '@media (min-width: 769px)': { padding: '10px 20px', fontSize: '14px' } },
  statsDisplay: { display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '10px', fontSize: '9px', flexWrap: 'wrap', gap: '8px', '@media (min-width: 769px)': { padding: '12px 20px', fontSize: '14px' } },
  completionContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', padding: '16px', position: 'relative' },
  completionCard: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '20px', textAlign: 'center', maxWidth: '320px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', '@media (min-width: 769px)': { borderRadius: '20px', padding: '40px', maxWidth: '450px' } },
  trophyIcon: { fontSize: '48px', marginBottom: '12px', '@media (min-width: 769px)': { fontSize: '80px', marginBottom: '20px' } },
  sadIcon: { fontSize: '48px', marginBottom: '12px', '@media (min-width: 769px)': { fontSize: '80px', marginBottom: '20px' } },
  completionTitle: { fontSize: '22px', marginBottom: '10px', color: '#ffd700', '@media (min-width: 769px)': { fontSize: '36px', marginBottom: '15px' } },
  completionText: { fontSize: '12px', marginBottom: '15px', color: '#fff', '@media (min-width: 769px)': { fontSize: '16px', marginBottom: '20px' } },
  finalScore: { backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', marginBottom: '15px', fontSize: '11px', lineHeight: '1.6', color: '#fff', '@media (min-width: 769px)': { padding: '15px', marginBottom: '20px', fontSize: '14px', lineHeight: '1.8' } },
  continueButton: { padding: '10px 20px', fontSize: '13px', backgroundColor: '#ffd700', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', minHeight: '44px', '@media (min-width: 769px)': { padding: '12px 30px', fontSize: '16px' } }
};

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `@keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.05)}} @keyframes bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}} @keyframes musicNote { 0% { transform: translate(-50%, -50%) scale(0.5) rotate(0deg); opacity: 1; } 100% { transform: translate(-50%, -150%) scale(1.5) rotate(20deg); opacity: 0; } } button:hover:not(:disabled){opacity:0.9} button:active:not(:disabled){transform:scale(0.97)} @media (max-width:480px){button{min-height:44px}} @media (max-width:360px){.scoreDisplay{font-size:14px!important}.enemyName{font-size:14px!important}.equationText{font-size:13px!important}.optionButton{font-size:9px!important;padding:8px!important}} input[type="range"] { -webkit-appearance: none; background: #667eea; outline: none; } input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #ffd93d; cursor: pointer; } @media (min-width: 769px) { input[type="range"]::-webkit-slider-thumb { width: 16px; height: 16px; } }`;
  document.head.appendChild(styleSheet);
}

export default BattleArena;