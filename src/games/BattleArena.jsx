import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const BattleArena = () => {
  const navigate = useNavigate();
  
  // Game state
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameOver, victory
  const [playerHP, setPlayerHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(100);
  const [playerMana, setPlayerMana] = useState(50);
  const [currentEquation, setCurrentEquation] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [turn, setTurn] = useState('player'); // player, enemy
  const [combo, setCombo] = useState(0);
  const [selectedEnemy, setSelectedEnemy] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [battleLog, setBattleLog] = useState([]);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameResultSent, setGameResultSent] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [currentEnemyIndex, setCurrentEnemyIndex] = useState(0);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);

  // Enemy types
  const enemies = [
    {
      name: 'Goblin Mathler',
      hp: 100,
      maxHp: 100,
      avatar: '👺',
      difficulty: 'easy',
      attacks: ['Quick Subtract', 'Division Dash'],
      equationTypes: ['addition', 'subtraction']
    },
    {
      name: 'Algebra Knight',
      hp: 120,
      maxHp: 120,
      avatar: '⚔️',
      difficulty: 'medium',
      attacks: ['Multiplication Strike', 'Equation Slash'],
      equationTypes: ['multiplication', 'division']
    },
    {
      name: 'Calculus Dragon',
      hp: 150,
      maxHp: 150,
      avatar: '🐉',
      difficulty: 'hard',
      attacks: ['Quadratic Fire', 'Variable Breath'],
      equationTypes: ['algebra', 'quadratic']
    }
  ];

  // Player character
  const player = {
    name: 'Math Wizard',
    avatar: '🧙',
    level: 1,
    attacks: [
      { name: 'Basic Math', damage: 10, manaCost: 0, equationType: 'basic' },
      { name: 'Algebra Blast', damage: 20, manaCost: 15, equationType: 'algebra' },
      { name: 'Geometry Shield', damage: 15, manaCost: 10, equationType: 'geometry' },
      { name: 'Calculus Fury', damage: 30, manaCost: 25, equationType: 'calculus' }
    ]
  };

  // Function to send game result to parent window
  const sendGameResult = (completed, finalScore, timeSpentSeconds, stats) => {
    if (gameResultSent) return;
    
    const accuracy = stats.totalAnswers > 0 
      ? Math.round((stats.correctAnswers / stats.totalAnswers) * 100) 
      : 0;
    
    const gameResult = {
      type: 'GAME_RESULT',
      gameId: 'battle',
      completed: completed,
      score: finalScore,
      timeSpent: timeSpentSeconds,
      timestamp: new Date().toISOString(),
      stats: {
        correctAnswers: stats.correctAnswers,
        totalAnswers: stats.totalAnswers,
        accuracy: accuracy,
        maxCombo: stats.maxCombo,
        enemiesDefeated: stats.enemiesDefeated,
        enemyType: enemies[selectedEnemy]?.name || 'Unknown',
        totalEnemies: enemies.length
      }
    };
    
    console.log('Sending game result:', gameResult);
    
    if (window.opener) {
      window.opener.postMessage(gameResult, '*');
      setGameResultSent(true);
      console.log('Game result sent to parent window');
    } else {
      console.log('No opener window found');
    }
    
    const previousResults = localStorage.getItem('battleGameResults');
    const results = previousResults ? JSON.parse(previousResults) : [];
    results.push(gameResult);
    localStorage.setItem('battleGameResults', JSON.stringify(results));
  };

  const handleBackToGames = () => {
    if (gameState === 'playing' && !gameResultSent && gameStartTime) {
      const currentTimeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
      sendGameResult(false, score, currentTimeSpent, {
        correctAnswers,
        totalAnswers,
        maxCombo,
        enemiesDefeated
      });
    }
    navigate('/studenthub/games');
  };

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && gameStartTime && !gameResultSent) {
      timer = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, gameStartTime, gameResultSent]);

  const generateEquation = (type = 'random') => {
    const types = ['addition', 'subtraction', 'multiplication', 'division', 'algebra'];
    const selectedType = type === 'random' ? types[Math.floor(Math.random() * types.length)] : type;
    
    let equation, answer;
    
    switch(selectedType) {
      case 'addition':
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        equation = `${a} + ${b} = ?`;
        answer = a + b;
        break;
      case 'subtraction':
        const x = Math.floor(Math.random() * 30) + 10;
        const y = Math.floor(Math.random() * x);
        equation = `${x} - ${y} = ?`;
        answer = x - y;
        break;
      case 'multiplication':
        const m = Math.floor(Math.random() * 12) + 1;
        const n = Math.floor(Math.random() * 12) + 1;
        equation = `${m} × ${n} = ?`;
        answer = m * n;
        break;
      case 'division':
        const divisor = Math.floor(Math.random() * 10) + 1;
        const quotient = Math.floor(Math.random() * 10) + 1;
        const dividend = divisor * quotient;
        equation = `${dividend} ÷ ${divisor} = ?`;
        answer = quotient;
        break;
      case 'algebra':
        const coeff = Math.floor(Math.random() * 5) + 2;
        const const_ = Math.floor(Math.random() * 10) + 1;
        const sol = Math.floor(Math.random() * 10) + 1;
        equation = `${coeff}x + ${const_} = ${coeff * sol + const_}`;
        answer = sol;
        break;
      default:
        equation = '2 + 2 = ?';
        answer = 4;
    }
    
    return { text: equation, answer, type: selectedType };
  };

  const startGame = () => {
    setGameState('playing');
    setPlayerHP(100);
    setEnemyHP(enemies[selectedEnemy].hp);
    setPlayerMana(50);
    setScore(0);
    setCombo(0);
    setCorrectAnswers(0);
    setTotalAnswers(0);
    setMaxCombo(0);
    setEnemiesDefeated(0);
    setCurrentEnemyIndex(selectedEnemy);
    setIsWaitingForNext(false);
    setBattleLog(['Battle started! Solve equations to attack!']);
    setCurrentEquation(generateEquation());
    setTurn('player');
    setGameStartTime(Date.now());
    setGameResultSent(false);
    setTimeSpent(0);
    setUserAnswer('');
    setFeedback('');
  };

  const handleAttack = () => {
    if (!currentEquation || turn !== 'player' || isWaitingForNext) return;
    
    const numAnswer = parseFloat(userAnswer);
    setTotalAnswers(prev => prev + 1);
    setIsWaitingForNext(true);
    
    if (isNaN(numAnswer)) {
      setFeedback('❌ Enter a number!');
      setIsWaitingForNext(false);
      return;
    }
    
    if (numAnswer === currentEquation.answer) {
      setCorrectAnswers(prev => prev + 1);
      const damage = 15 + (combo * 5);
      const manaGain = 5;
      const newEnemyHP = Math.max(0, enemyHP - damage);
      const newMana = Math.min(100, playerMana + manaGain);
      
      setEnemyHP(newEnemyHP);
      setPlayerMana(newMana);
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      const newScore = score + 10 * newCombo;
      setScore(newScore);
      
      addBattleLog(`🎯 Correct! Dealt ${damage} damage! Combo x${newCombo}!`);
      
      if (newEnemyHP <= 0) {
        const newEnemiesDefeated = enemiesDefeated + 1;
        setEnemiesDefeated(newEnemiesDefeated);
        const bonusScore = 500;
        setScore(prevScore => prevScore + bonusScore);
        addBattleLog(`🎉 Victory! ${enemies[currentEnemyIndex].name} defeated! +${bonusScore} bonus!`);
        
        if (currentEnemyIndex === enemies.length - 1) {
          const finalTimeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
          const finalScore = newScore + bonusScore;
          sendGameResult(true, finalScore, finalTimeSpent, {
            correctAnswers: correctAnswers + 1,
            totalAnswers: totalAnswers + 1,
            maxCombo: newCombo,
            enemiesDefeated: newEnemiesDefeated
          });
          setGameState('victory');
        } else {
          const nextEnemyIndex = currentEnemyIndex + 1;
          setCurrentEnemyIndex(nextEnemyIndex);
          setEnemyHP(enemies[nextEnemyIndex].hp);
          addBattleLog(`⚔️ New challenger appears: ${enemies[nextEnemyIndex].name}!`);
          setTurn('enemy');
          setTimeout(() => {
            setIsWaitingForNext(false);
          }, 1000);
        }
      } else {
        setTurn('enemy');
        setFeedback('✅ Correct! Enemy takes damage!');
        setTimeout(() => {
          setIsWaitingForNext(false);
        }, 1000);
      }
    } else {
      const missDamage = 5;
      const newPlayerHP = Math.max(0, playerHP - missDamage);
      setPlayerHP(newPlayerHP);
      setCombo(0);
      
      addBattleLog(`❌ Wrong answer! Took ${missDamage} damage!`);
      
      if (newPlayerHP <= 0) {
        const finalTimeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
        sendGameResult(false, score, finalTimeSpent, {
          correctAnswers,
          totalAnswers: totalAnswers + 1,
          maxCombo,
          enemiesDefeated
        });
        setGameState('gameOver');
        addBattleLog('💀 Game Over...');
      } else {
        setFeedback(`❌ Wrong! The answer was ${currentEquation.answer}`);
        setTimeout(() => {
          setIsWaitingForNext(false);
        }, 1500);
      }
    }
    
    setUserAnswer('');
    
    setTimeout(() => {
      if (gameState === 'playing' && turn !== 'player') {
        setCurrentEquation(generateEquation());
      }
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && turn === 'player' && !isWaitingForNext) {
      handleAttack();
    }
  };

  useEffect(() => {
    if (turn === 'enemy' && gameState === 'playing' && enemyHP > 0 && playerHP > 0 && !isWaitingForNext) {
      const timer = setTimeout(() => {
        const enemyAttack = Math.floor(Math.random() * 15) + 5;
        const newPlayerHP = Math.max(0, playerHP - enemyAttack);
        setPlayerHP(newPlayerHP);
        
        addBattleLog(`👾 ${enemies[currentEnemyIndex].name} attacks for ${enemyAttack} damage!`);
        
        if (newPlayerHP <= 0) {
          const finalTimeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
          sendGameResult(false, score, finalTimeSpent, {
            correctAnswers,
            totalAnswers,
            maxCombo,
            enemiesDefeated
          });
          setGameState('gameOver');
          addBattleLog('💀 Game Over...');
        } else {
          setTurn('player');
          setCurrentEquation(generateEquation());
          setFeedback('');
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [turn, gameState, enemyHP, playerHP, currentEnemyIndex, isWaitingForNext]);

  const addBattleLog = (message) => {
    setBattleLog(prev => [message, ...prev].slice(0, 5));
  };

  const useSpecialAttack = (attack) => {
    if (playerMana < attack.manaCost || turn !== 'player' || isWaitingForNext) {
      setFeedback('❌ Not enough mana or not your turn!');
      return;
    }
    
    setPlayerMana(playerMana - attack.manaCost);
    setCurrentEquation(generateEquation(attack.equationType));
    setFeedback(`⚡ ${attack.name} activated! Solve to unleash!`);
  };

  const GameMenu = () => (
    <div style={styles.menuContainer}>
      <h1 style={styles.title}>📐 Math Battle Arena 🧮</h1>
      <p style={styles.subtitle}>Defeat enemies using your math skills!</p>
      
      <div style={styles.characterSelect}>
        <h3>Select Enemy:</h3>
        <div style={styles.enemyGrid}>
          {enemies.map((enemy, index) => (
            <button
              key={index}
              style={{
                ...styles.enemyCard,
                ...(selectedEnemy === index ? styles.selectedEnemy : {})
              }}
              onClick={() => setSelectedEnemy(index)}
            >
              <span style={styles.enemyAvatar}>{enemy.avatar}</span>
              <div>
                <strong>{enemy.name}</strong>
                <div>HP: {enemy.hp}</div>
                <div style={styles.difficulty[enemy.difficulty]}>
                  {enemy.difficulty.toUpperCase()}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <button style={styles.startButton} onClick={startGame}>
        ⚔️ Start Battle ⚔️
      </button>
      
      {showTutorial && (
        <div style={styles.tutorial}>
          <h3>📚 How to Play:</h3>
          <p>🟢 Solve the equation correctly to attack!</p>
          <p>🔵 Build combos for more damage!</p>
          <p>🟡 Use special attacks with mana!</p>
          <p>🟠 Watch out for enemy counterattacks!</p>
          <button onClick={() => setShowTutorial(false)}>Got it!</button>
        </div>
      )}
    </div>
  );

  const GameOver = () => {
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    
    return (
      <div style={styles.endScreen}>
        <h1 style={styles.failedTitle}>💀 GAME OVER 💀</h1>
        <p style={styles.text}>Final Score: {score}</p>
        <p style={styles.text}>Time: {Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, '0')}</p>
        <p style={styles.text}>Accuracy: {accuracy}% ({correctAnswers}/{totalAnswers})</p>
        <p style={styles.text}>Max Combo: x{maxCombo}</p>
        <p style={styles.text}>Enemies Defeated: {enemiesDefeated}/{enemies.length}</p>
        <button style={styles.menuButton} onClick={() => setGameState('menu')}>
          Back to Menu
        </button>
      </div>
    );
  };

  const VictoryScreen = () => {
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 100;
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    
    return (
      <div style={styles.endScreen}>
        <h1 style={styles.successTitle}>🎉 VICTORY! 🎉</h1>
        <p style={styles.text}>You defeated all enemies!</p>
        <p style={styles.text}>Final Score: {score}</p>
        <p style={styles.text}>Time: {minutes}:{seconds.toString().padStart(2, '0')}</p>
        <p style={styles.text}>Accuracy: {accuracy}% ({correctAnswers}/{totalAnswers})</p>
        <p style={styles.text}>Max Combo: x{maxCombo}</p>
        <p style={styles.text}>Enemies Defeated: {enemiesDefeated}/{enemies.length}</p>
        <button style={styles.menuButton} onClick={() => setGameState('menu')}>
          Play Again
        </button>
      </div>
    );
  };

  const GamePlay = () => {
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 100;
    const progress = ((currentEnemyIndex) / enemies.length) * 100 + ((enemies[currentEnemyIndex].maxHp - enemyHP) / enemies[currentEnemyIndex].maxHp) * (100 / enemies.length);
    
    return (
      <div style={styles.gameContainer}>
        <div style={styles.progressBarContainer}>
          <div style={styles.progressText}>
            Progress: {Math.floor(progress)}% - Enemy {currentEnemyIndex + 1}/{enemies.length}
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${Math.min(100, progress)}%`
              }}
            />
          </div>
        </div>

        <div style={styles.battlefield}>
          <div style={styles.characterCard}>
            <div style={styles.characterHeader}>
              <span style={styles.avatar}>{player.avatar}</span>
              <div>
                <h3>{player.name}</h3>
                <div style={styles.stats}>
                  <div>❤️ HP: {playerHP}</div>
                  <div>💙 MP: {playerMana}</div>
                  <div>✨ Combo: x{combo}</div>
                </div>
              </div>
            </div>
            <div style={styles.hpBar}>
              <div style={{...styles.hpFill, width: `${Math.max(0, playerHP)}%`}} />
            </div>
          </div>

          <div style={styles.vs}>VS</div>

          <div style={styles.characterCard}>
            <div style={styles.characterHeader}>
              <span style={styles.avatar}>{enemies[currentEnemyIndex].avatar}</span>
              <div>
                <h3>{enemies[currentEnemyIndex].name}</h3>
                <div>❤️ HP: {Math.max(0, enemyHP)}</div>
                <div style={styles.difficulty[enemies[currentEnemyIndex].difficulty]}>
                  {enemies[currentEnemyIndex].difficulty.toUpperCase()}
                </div>
              </div>
            </div>
            <div style={styles.hpBar}>
              <div style={{...styles.hpFill, width: `${(Math.max(0, enemyHP)/enemies[currentEnemyIndex].maxHp)*100}%`, background: '#f44336'}} />
            </div>
          </div>
        </div>

        <div style={styles.statsSummary}>
          <div>⏱️ Time: {Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, '0')}</div>
          <div>📊 Accuracy: {accuracy}%</div>
          <div>🎯 Correct: {correctAnswers}</div>
          <div>❌ Wrong: {totalAnswers - correctAnswers}</div>
          <div>⚡ Max Combo: x{maxCombo}</div>
          <div>🏆 Score: {score}</div>
        </div>

        <div style={styles.battleLog}>
          {battleLog.map((log, i) => (
            <div key={i} style={styles.logEntry}>{log}</div>
          ))}
        </div>

        <div style={styles.equationArena}>
          <div style={styles.equationBox}>
            <h2>Solve to Attack!</h2>
            <div style={styles.equation}>{currentEquation?.text}</div>
            <div style={styles.inputArea}>
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter answer"
                style={styles.input}
                disabled={turn !== 'player' || isWaitingForNext}
                autoFocus
              />
              <button 
                onClick={handleAttack}
                style={styles.attackButton}
                disabled={turn !== 'player' || isWaitingForNext}
              >
                ⚔️ Attack
              </button>
            </div>
            {feedback && <div style={styles.feedback}>{feedback}</div>}
          </div>

          <div style={styles.specialAttacks}>
            <h3>Special Attacks:</h3>
            <div style={styles.attackGrid}>
              {player.attacks.map((attack, index) => (
                <button
                  key={index}
                  style={styles.specialButton}
                  onClick={() => useSpecialAttack(attack)}
                  disabled={turn !== 'player' || playerMana < attack.manaCost || isWaitingForNext}
                >
                  <div>{attack.name}</div>
                  <small>{attack.manaCost} MP</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <button onClick={handleBackToGames} style={styles.backButton}>
        <FaArrowLeft style={styles.backIcon} />
        Back to Games
      </button>
      
      {gameState === 'menu' && <GameMenu />}
      {gameState === 'playing' && <GamePlay />}
      {gameState === 'gameOver' && <GameOver />}
      {gameState === 'victory' && <VictoryScreen />}
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
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
    transition: 'background-color 0.3s',
    backdropFilter: 'blur(10px)',
  },
  backIcon: {
    fontSize: '16px',
  },
  menuContainer: {
    textAlign: 'center',
    padding: 'clamp(30px, 8vw, 60px) clamp(20px, 5vw, 40px)',
    maxWidth: '800px',
    margin: '40px auto 0 auto',
  },
  title: {
    fontSize: 'clamp(28px, 8vw, 48px)',
    marginBottom: '20px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
  },
  subtitle: {
    fontSize: 'clamp(14px, 4vw, 18px)',
    marginBottom: '40px'
  },
  characterSelect: {
    marginBottom: '30px'
  },
  enemyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginTop: '20px'
  },
  enemyCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    background: 'rgba(255,255,255,0.1)',
    border: '2px solid transparent',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  selectedEnemy: {
    border: '2px solid gold',
    background: 'rgba(255,215,0,0.2)'
  },
  enemyAvatar: {
    fontSize: '2.5em'
  },
  difficulty: {
    easy: { color: '#4caf50' },
    medium: { color: '#ff9800' },
    hard: { color: '#f44336' }
  },
  startButton: {
    padding: 'clamp(12px, 3vw, 15px) clamp(30px, 8vw, 40px)',
    fontSize: 'clamp(18px, 4vw, 24px)',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
  },
  tutorial: {
    marginTop: '40px',
    padding: '20px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '10px',
    textAlign: 'left'
  },
  gameContainer: {
    padding: 'clamp(15px, 4vw, 20px)',
    maxWidth: '1000px',
    margin: '40px auto 0 auto',
  },
  progressBarContainer: {
    marginBottom: '20px',
  },
  progressText: {
    fontSize: 'clamp(12px, 3vw, 14px)',
    marginBottom: '5px',
    textAlign: 'center',
  },
  progressBar: {
    height: '10px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.3s ease',
  },
  battlefield: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: '20px',
    alignItems: 'center',
    marginBottom: '20px'
  },
  characterCard: {
    background: 'rgba(255,255,255,0.1)',
    padding: 'clamp(15px, 4vw, 20px)',
    borderRadius: '10px',
    backdropFilter: 'blur(10px)'
  },
  characterHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '10px'
  },
  avatar: {
    fontSize: 'clamp(2em, 8vw, 3em)'
  },
  stats: {
    fontSize: 'clamp(12px, 3vw, 14px)',
    marginTop: '5px'
  },
  statsSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '10px',
    background: 'rgba(0,0,0,0.3)',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '15px',
    textAlign: 'center',
    fontSize: 'clamp(12px, 3vw, 14px)'
  },
  hpBar: {
    width: '100%',
    height: '10px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '5px',
    overflow: 'hidden'
  },
  hpFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
    transition: 'width 0.3s'
  },
  vs: {
    fontSize: 'clamp(1.5em, 6vw, 2em)',
    fontWeight: 'bold'
  },
  battleLog: {
    background: 'rgba(0,0,0,0.3)',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '20px',
    minHeight: '100px'
  },
  logEntry: {
    padding: '5px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    fontSize: 'clamp(12px, 3vw, 14px)'
  },
  equationArena: {
    background: 'rgba(255,255,255,0.1)',
    padding: 'clamp(20px, 5vw, 30px)',
    borderRadius: '10px',
    marginBottom: '20px'
  },
  equationBox: {
    textAlign: 'center'
  },
  equation: {
    fontSize: 'clamp(2em, 8vw, 3em)',
    margin: '20px 0',
    fontFamily: 'monospace'
  },
  inputArea: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  input: {
    padding: 'clamp(8px, 2.5vw, 10px) clamp(12px, 3vw, 15px)',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    border: 'none',
    borderRadius: '5px',
    width: 'clamp(120px, 30vw, 150px)'
  },
  attackButton: {
    padding: 'clamp(8px, 2.5vw, 10px) clamp(20px, 5vw, 30px)',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  feedback: {
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    marginTop: '10px'
  },
  specialAttacks: {
    marginTop: '20px'
  },
  attackGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px',
    marginTop: '10px'
  },
  specialButton: {
    padding: 'clamp(8px, 2.5vw, 10px)',
    background: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    fontSize: 'clamp(12px, 3vw, 14px)',
  },
  endScreen: {
    textAlign: 'center',
    padding: 'clamp(40px, 10vw, 80px) clamp(20px, 5vw, 40px)',
    maxWidth: '800px',
    margin: '40px auto 0 auto',
  },
  failedTitle: {
    fontSize: 'clamp(32px, 8vw, 48px)',
    color: '#ff6b6b',
    marginBottom: '20px',
  },
  successTitle: {
    fontSize: 'clamp(32px, 8vw, 48px)',
    color: '#4CAF50',
    marginBottom: '20px',
  },
  text: {
    fontSize: 'clamp(16px, 4vw, 20px)',
    marginBottom: '15px',
  },
  menuButton: {
    padding: 'clamp(12px, 3vw, 15px) clamp(30px, 8vw, 40px)',
    fontSize: 'clamp(14px, 3.5vw, 18px)',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '20px'
  }
};

export default BattleArena;