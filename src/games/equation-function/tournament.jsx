// src/games/equation-function/tournament.jsx
import React, { useState, useEffect } from 'react';

// Equation utilities needed for tournament
const equationUtils = {
  solveLinear: (a, b) => {
    if (a === 0) return b === 0 ? 'infinite' : 'no solution';
    return -b / a;
  },

  solveQuadratic: (a, b, c) => {
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return 'no real solutions';
    if (discriminant === 0) return -b / (2 * a);
    return [
      (-b + Math.sqrt(discriminant)) / (2 * a),
      (-b - Math.sqrt(discriminant)) / (2 * a)
    ];
  },

  generateSystem: () => {
    const x = Math.floor(Math.random() * 5) + 1;
    const y = Math.floor(Math.random() * 5) + 1;
    const a1 = Math.floor(Math.random() * 3) + 1;
    const b1 = Math.floor(Math.random() * 3) + 1;
    const c1 = a1 * x + b1 * y;
    const a2 = Math.floor(Math.random() * 3) + 1;
    const b2 = Math.floor(Math.random() * 3) + 1;
    const c2 = a2 * x + b2 * y;
    
    return {
      equations: [`${a1}x + ${b1}y = ${c1}`, `${a2}x + ${b2}y = ${c2}`],
      solution: { x, y }
    };
  }
};

// Equation Solver Tournament
export const EquationTournament = ({ onComplete }) => {
  const [tournamentStage, setTournamentStage] = useState('qualifying');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [currentEquation, setCurrentEquation] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [tournamentWins, setTournamentWins] = useState(0);

  const opponents = [
    { name: 'Algebra Bot', difficulty: 1, equations: 3 },
    { name: 'Equation Master', difficulty: 2, equations: 5 },
    { name: 'Math Champion', difficulty: 3, equations: 7 },
    { name: 'The Professor', difficulty: 4, equations: 10 }
  ];

  useEffect(() => {
    if (tournamentStage === 'playing') {
      generateEquation();
    }
  }, [currentMatch, tournamentStage]);

  const generateEquation = () => {
    const opponent = opponents[currentMatch];
    const difficulty = opponent.difficulty;
    const types = ['linear', 'quadratic', 'system'];
    const type = types[Math.min(difficulty - 1 + Math.floor(Math.random() * 2), 2)];
    
    let equation;
    switch(type) {
      case 'linear':
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 20) - 10;
        equation = {
          text: `${a}x + ${b} = 0`,
          solution: equationUtils.solveLinear(a, b),
          type: 'linear'
        };
        break;
      case 'quadratic':
        const a2 = Math.floor(Math.random() * 4) + 1;
        const b2 = Math.floor(Math.random() * 10) - 5;
        const c2 = Math.floor(Math.random() * 10) - 5;
        equation = {
          text: `${a2}x² + ${b2}x + ${c2} = 0`,
          solution: equationUtils.solveQuadratic(a2, b2, c2),
          type: 'quadratic'
        };
        break;
      default:
        const system = equationUtils.generateSystem();
        equation = {
          text: `${system.equations[0]}\n${system.equations[1]}`,
          solution: `x = ${system.solution.x}, y = ${system.solution.y}`,
          type: 'system'
        };
    }
    setCurrentEquation(equation);
  };

  const checkAnswer = () => {
    let correct = false;
    const solution = currentEquation.solution;
    
    if (Array.isArray(solution)) {
      const answers = userAnswer.split(',').map(s => parseFloat(s.trim()));
      correct = answers.length === solution.length && 
                answers.every((ans, i) => Math.abs(ans - solution[i]) < 0.01);
    } else if (typeof solution === 'number') {
      correct = Math.abs(parseFloat(userAnswer) - solution) < 0.01;
    } else if (typeof solution === 'string') {
      correct = userAnswer.toLowerCase().replace(/\s/g, '') === solution.toLowerCase().replace(/\s/g, '');
    }
    
    if (correct) {
      setPlayerScore(prev => prev + 1);
      setMessage('✓ Correct!');
      
      if (playerScore + 1 >= opponents[currentMatch].equations) {
        setTournamentWins(prev => prev + 1);
        if (currentMatch + 1 < opponents.length) {
          setMessage(`🎉 You defeated ${opponents[currentMatch].name}! Next opponent incoming!`);
          setTimeout(() => {
            setCurrentMatch(prev => prev + 1);
            setPlayerScore(0);
            setOpponentScore(0);
            setMessage('');
          }, 2000);
        } else {
          setMessage(`🏆 TOURNAMENT CHAMPION! You've conquered all opponents! 🏆`);
          setTournamentStage('completed');
          if (onComplete) onComplete(tournamentWins + 1);
        }
      } else {
        generateEquation();
      }
    } else {
      setOpponentScore(prev => prev + 1);
      setMessage(`✗ Wrong! The correct answer is ${solution}`);
      
      if (opponentScore + 1 >= opponents[currentMatch].equations) {
        setMessage(`💀 You lost to ${opponents[currentMatch].name}! Game Over!`);
        setTournamentStage('failed');
      } else {
        generateEquation();
      }
    }
    
    setUserAnswer('');
    setTimeout(() => {
      if (message !== '🎉 You defeated...' && message !== '🏆 TOURNAMENT...') {
        setMessage('');
      }
    }, 2000);
  };

  const startTournament = () => {
    setTournamentStage('playing');
    setCurrentMatch(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setTournamentWins(0);
  };

  return (
    <div style={tournamentStyles.container}>
      {tournamentStage === 'qualifying' && (
        <div style={tournamentStyles.startScreen}>
          <h3>🏆 Equation Solving Tournament 🏆</h3>
          <p>Face off against increasingly difficult opponents!</p>
          <p>Each opponent gives you {opponents[0].equations} equations to solve</p>
          <p>Beat them all to become champion!</p>
          <button onClick={startTournament} style={tournamentStyles.startBtn}>
            Enter Tournament
          </button>
        </div>
      )}
      
      {tournamentStage === 'playing' && (
        <>
          <div style={tournamentStyles.header}>
            <h4>vs {opponents[currentMatch].name}</h4>
            <div style={tournamentStyles.score}>
              <span>You: {playerScore}</span>
              <span>vs</span>
              <span>Opponent: {opponentScore}</span>
            </div>
            <div>Need {opponents[currentMatch].equations} correct answers to win!</div>
          </div>
          
          <div style={tournamentStyles.equation}>
            <pre style={tournamentStyles.equationText}>{currentEquation?.text}</pre>
          </div>
          
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Enter solution"
            style={tournamentStyles.input}
            onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
          />
          
          <button onClick={checkAnswer} style={tournamentStyles.submitBtn}>
            Submit Answer
          </button>
          
          {message && <div style={tournamentStyles.message}>{message}</div>}
        </>
      )}
      
      {(tournamentStage === 'completed' || tournamentStage === 'failed') && (
        <div style={tournamentStyles.endScreen}>
          {tournamentStage === 'completed' ? (
            <>
              <h3 style={tournamentStyles.winTitle}>🏆 TOURNAMENT VICTORY! 🏆</h3>
              <p>You've proven your equation-solving skills!</p>
              <p>Defeated {tournamentWins} opponents</p>
            </>
          ) : (
            <>
              <h3 style={tournamentStyles.loseTitle}>💀 Tournament Defeat 💀</h3>
              <p>Better luck next time!</p>
            </>
          )}
          <button onClick={startTournament} style={tournamentStyles.restartBtn}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

const tournamentStyles = {
  container: {
    backgroundColor: '#2a2a4a',
    borderRadius: '15px',
    padding: '20px',
    marginTop: '20px',
  },
  startScreen: {
    textAlign: 'center',
    padding: '20px',
  },
  startBtn: {
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '15px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  score: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    fontSize: '18px',
    margin: '10px 0',
  },
  equation: {
    textAlign: 'center',
    margin: '20px 0',
  },
  equationText: {
    fontSize: '20px',
    backgroundColor: '#3a3a5a',
    padding: '20px',
    borderRadius: '8px',
    display: 'inline-block',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    borderRadius: '5px',
    border: '1px solid #ffd700',
    backgroundColor: '#3a3a5a',
    color: 'white',
    width: '250px',
    margin: '10px auto',
    display: 'block',
  },
  submitBtn: {
    backgroundColor: '#ffd700',
    color: '#1a1a2e',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'block',
    margin: '10px auto',
  },
  message: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#4a6fa5',
    borderRadius: '5px',
    textAlign: 'center',
  },
  endScreen: {
    textAlign: 'center',
    padding: '20px',
  },
  winTitle: {
    color: '#4CAF50',
    fontSize: '24px',
    marginBottom: '15px',
  },
  loseTitle: {
    color: '#ff6b6b',
    fontSize: '24px',
    marginBottom: '15px',
  },
  restartBtn: {
    backgroundColor: '#4a6fa5',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '15px',
  },
};