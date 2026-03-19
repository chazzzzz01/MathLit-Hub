// src/games/BattleArena.jsx
import React, { useState, useEffect, useCallback } from 'react';

const BattleArena = () => {
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

  // Generate random equation based on type
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

  // Start new game
  const startGame = () => {
    setGameState('playing');
    setPlayerHP(100);
    setEnemyHP(enemies[selectedEnemy].hp);
    setPlayerMana(50);
    setScore(0);
    setCombo(0);
    setBattleLog(['Battle started! Solve equations to attack!']);
    setCurrentEquation(generateEquation());
    setTurn('player');
  };

  // Handle player attack
  const handleAttack = () => {
    if (!currentEquation || turn !== 'player') return;
    
    const numAnswer = parseFloat(userAnswer);
    
    if (isNaN(numAnswer)) {
      setFeedback('❌ Enter a number!');
      return;
    }
    
    if (numAnswer === currentEquation.answer) {
      // Correct answer
      const damage = 15 + (combo * 5);
      const manaGain = 5;
      const newEnemyHP = Math.max(0, enemyHP - damage);
      const newMana = Math.min(100, playerMana + manaGain);
      
      setEnemyHP(newEnemyHP);
      setPlayerMana(newMana);
      setCombo(combo + 1);
      setScore(score + 10 * (combo + 1));
      
      addBattleLog(`🎯 Correct! Dealt ${damage} damage! Combo x${combo + 1}!`);
      
      if (newEnemyHP <= 0) {
        setGameState('victory');
        addBattleLog('🎉 Victory! Enemy defeated!');
        setScore(score + 500);
      } else {
        setTurn('enemy');
        setFeedback('✅ Correct! Enemy takes damage!');
      }
    } else {
      // Wrong answer
      const missDamage = 5;
      const newPlayerHP = Math.max(0, playerHP - missDamage);
      setPlayerHP(newPlayerHP);
      setCombo(0);
      
      addBattleLog(`❌ Wrong answer! Took ${missDamage} damage!`);
      
      if (newPlayerHP <= 0) {
        setGameState('gameOver');
        addBattleLog('💀 Game Over...');
      } else {
        setFeedback(`❌ Wrong! The answer was ${currentEquation.answer}`);
      }
    }
    
    setUserAnswer('');
    
    // Generate new equation for next turn
    setTimeout(() => {
      if (gameState === 'playing') {
        setCurrentEquation(generateEquation());
      }
    }, 1000);
  };

  // Enemy turn
  useEffect(() => {
    if (turn === 'enemy' && gameState === 'playing' && enemyHP > 0) {
      const timer = setTimeout(() => {
        // Enemy attacks
        const enemyAttack = Math.floor(Math.random() * 15) + 5;
        const newPlayerHP = Math.max(0, playerHP - enemyAttack);
        setPlayerHP(newPlayerHP);
        
        addBattleLog(`👾 Enemy attacks for ${enemyAttack} damage!`);
        
        if (newPlayerHP <= 0) {
          setGameState('gameOver');
          addBattleLog('💀 Game Over...');
        } else {
          setTurn('player');
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [turn, gameState, enemyHP, playerHP]);

  // Add message to battle log
  const addBattleLog = (message) => {
    setBattleLog(prev => [message, ...prev].slice(0, 5));
  };

  // Use special attack
  const useSpecialAttack = (attack) => {
    if (playerMana < attack.manaCost) {
      setFeedback('❌ Not enough mana!');
      return;
    }
    
    setPlayerMana(playerMana - attack.manaCost);
    setCurrentEquation(generateEquation(attack.equationType));
    setFeedback(`⚡ ${attack.name} activated! Solve to unleash!`);
  };

  // Game menu component
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

  // Game over screen
  const GameOver = () => (
    <div style={styles.gameOverContainer}>
      <h1>💀 GAME OVER 💀</h1>
      <p>Final Score: {score}</p>
      <button style={styles.menuButton} onClick={() => setGameState('menu')}>
        Back to Menu
      </button>
    </div>
  );

  // Victory screen
  const VictoryScreen = () => (
    <div style={styles.victoryContainer}>
      <h1>🎉 VICTORY! 🎉</h1>
      <p>You defeated {enemies[selectedEnemy].name}!</p>
      <p>Final Score: {score}</p>
      <button style={styles.menuButton} onClick={() => setGameState('menu')}>
        Next Battle
      </button>
    </div>
  );

  // Main game UI
  const GamePlay = () => (
    <div style={styles.gameContainer}>
      {/* Battlefield */}
      <div style={styles.battlefield}>
        {/* Player */}
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
            <div style={{...styles.hpFill, width: `${playerHP}%`}} />
          </div>
        </div>

        <div style={styles.vs}>VS</div>

        {/* Enemy */}
        <div style={styles.characterCard}>
          <div style={styles.characterHeader}>
            <span style={styles.avatar}>{enemies[selectedEnemy].avatar}</span>
            <div>
              <h3>{enemies[selectedEnemy].name}</h3>
              <div>❤️ HP: {enemyHP}</div>
            </div>
          </div>
          <div style={styles.hpBar}>
            <div style={{...styles.hpFill, width: `${(enemyHP/enemies[selectedEnemy].maxHp)*100}%`}} />
          </div>
        </div>
      </div>

      {/* Battle Log */}
      <div style={styles.battleLog}>
        {battleLog.map((log, i) => (
          <div key={i} style={styles.logEntry}>{log}</div>
        ))}
      </div>

      {/* Equation Arena */}
      <div style={styles.equationArena}>
        <div style={styles.equationBox}>
          <h2>Solve to Attack!</h2>
          <div style={styles.equation}>{currentEquation?.text}</div>
          <div style={styles.inputArea}>
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAttack()}
              placeholder="Enter answer"
              style={styles.input}
              disabled={turn !== 'player'}
            />
            <button 
              onClick={handleAttack}
              style={styles.attackButton}
              disabled={turn !== 'player'}
            >
              ⚔️ Attack
            </button>
          </div>
          {feedback && <div style={styles.feedback}>{feedback}</div>}
        </div>

        {/* Special Attacks */}
        <div style={styles.specialAttacks}>
          <h3>Special Attacks:</h3>
          <div style={styles.attackGrid}>
            {player.attacks.map((attack, index) => (
              <button
                key={index}
                style={styles.specialButton}
                onClick={() => useSpecialAttack(attack)}
                disabled={turn !== 'player' || playerMana < attack.manaCost}
              >
                <div>{attack.name}</div>
                <small>{attack.manaCost} MP</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Score */}
      <div style={styles.scoreBoard}>
        Score: {score}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {gameState === 'menu' && <GameMenu />}
      {gameState === 'playing' && <GamePlay />}
      {gameState === 'gameOver' && <GameOver />}
      {gameState === 'victory' && <VictoryScreen />}
    </div>
  );
};

// Styles
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '10px'
  },
  menuContainer: {
    textAlign: 'center',
    padding: '40px'
  },
  title: {
    fontSize: '3em',
    marginBottom: '20px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
  },
  subtitle: {
    fontSize: '1.2em',
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
    padding: '15px 40px',
    fontSize: '1.5em',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s'
  },
  tutorial: {
    marginTop: '40px',
    padding: '20px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '10px',
    textAlign: 'left'
  },
  gameContainer: {
    padding: '20px'
  },
  battlefield: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: '20px',
    alignItems: 'center',
    marginBottom: '30px'
  },
  characterCard: {
    background: 'rgba(255,255,255,0.1)',
    padding: '20px',
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
    fontSize: '3em'
  },
  stats: {
    fontSize: '0.9em',
    marginTop: '5px'
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
    fontSize: '2em',
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
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  equationArena: {
    background: 'rgba(255,255,255,0.1)',
    padding: '30px',
    borderRadius: '10px',
    marginBottom: '20px'
  },
  equationBox: {
    textAlign: 'center'
  },
  equation: {
    fontSize: '3em',
    margin: '20px 0',
    fontFamily: 'monospace'
  },
  inputArea: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '15px'
  },
  input: {
    padding: '10px 15px',
    fontSize: '1.2em',
    border: 'none',
    borderRadius: '5px',
    width: '150px'
  },
  attackButton: {
    padding: '10px 30px',
    fontSize: '1.2em',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  feedback: {
    fontSize: '1.2em',
    marginTop: '10px'
  },
  specialAttacks: {
    marginTop: '20px'
  },
  attackGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
    marginTop: '10px'
  },
  specialButton: {
    padding: '10px',
    background: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  scoreBoard: {
    textAlign: 'center',
    fontSize: '1.5em',
    padding: '10px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '5px'
  },
  gameOverContainer: {
    textAlign: 'center',
    padding: '100px 20px'
  },
  victoryContainer: {
    textAlign: 'center',
    padding: '100px 20px'
  },
  menuButton: {
    padding: '15px 30px',
    fontSize: '1.2em',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '20px'
  }
};

export default BattleArena;