import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const EquationEscapeRoom = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('start');
  const [timeLeft, setTimeLeft] = useState(360); // 6 minutes
  const [currentPuzzle, setCurrentPuzzle] = useState(1);
  const [puzzle1Answer, setPuzzle1Answer] = useState('');
  const [puzzle2Answer, setPuzzle2Answer] = useState('');
  const [puzzle3Answer, setPuzzle3Answer] = useState('');
  const [finalEquation, setFinalEquation] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [errorFound, setErrorFound] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [message, setMessage] = useState('');
  const [puzzle4Input, setPuzzle4Input] = useState('');
  const [graphValue, setGraphValue] = useState(0);
  const [polynomialCode, setPolynomialCode] = useState(['', '', '']);
  const [polynomialAttempts, setPolynomialAttempts] = useState(3);
  const [gameResultSent, setGameResultSent] = useState(false);
  const [playTime, setPlayTime] = useState(0); // Track actual gameplay time
  const [gameStartTime, setGameStartTime] = useState(null);

  // Track play time
  useEffect(() => {
    let timer;
    if (gameState !== 'start' && gameState !== 'escaped' && gameState !== 'failed' && gameStartTime && !gameResultSent) {
      timer = setInterval(() => {
        setPlayTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, gameStartTime, gameResultSent]);

  // Function to send game result to parent window
  const sendGameResult = (completed, timeRemaining, timeSpentSeconds, puzzlesCompleted) => {
    if (gameResultSent) return;
    
    const gameResult = {
      type: 'GAME_RESULT',
      gameId: 'equation',
      completed: completed,
      timeRemaining: timeRemaining,
      timeSpent: timeSpentSeconds,
      playTime: playTime, // Actual gameplay time
      puzzlesCompleted: puzzlesCompleted,
      timestamp: new Date().toISOString(),
      stats: {
        puzzlesCompleted: puzzlesCompleted,
        totalPuzzles: 7,
        timeRemaining: timeRemaining,
        completionRate: Math.round((puzzlesCompleted / 7) * 100)
      }
    };
    
    console.log('Sending equation game result:', gameResult);
    
    if (window.opener) {
      window.opener.postMessage(gameResult, '*');
      setGameResultSent(true);
      console.log('Equation game result sent to parent window');
    } else {
      console.log('No opener window found');
    }
    
    const previousResults = localStorage.getItem('equationGameResults');
    const results = previousResults ? JSON.parse(previousResults) : [];
    results.push(gameResult);
    localStorage.setItem('equationGameResults', JSON.stringify(results));
  };

  // Timer effect
  useEffect(() => {
    let timer;
    if (gameState !== 'start' && gameState !== 'escaped' && gameState !== 'failed' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            const timeSpent = 360;
            const puzzlesCompleted = currentPuzzle - 1;
            sendGameResult(false, 0, timeSpent, puzzlesCompleted);
            setGameState('failed');
            setMessage('⏰ TIME\'S UP! You failed to escape!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, currentPuzzle]);

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const formatPlayTime = () => {
    const minutes = Math.floor(playTime / 60);
    const seconds = playTime % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const startGame = () => {
    setGameState('puzzle1');
    setTimeLeft(360);
    setCurrentPuzzle(1);
    setMessage('');
    setGameResultSent(false);
    setPlayTime(0);
    setGameStartTime(Date.now());
  };

  const checkPuzzle1 = () => {
    if (puzzle1Answer === 'x=4') {
      setGameState('puzzle2');
      setCurrentPuzzle(2);
      setMessage('🔓 First lock opened! Moving to next puzzle...');
      setPuzzle1Answer('');
    } else {
      setMessage('❌ Wrong answer! The equation should be x + 3 = 7 → x = 4');
    }
  };

  const checkPuzzle2 = () => {
    if (puzzle2Answer === '3') {
      setGameState('puzzle3');
      setCurrentPuzzle(3);
      setMessage('🔓 Second lock opened! Almost there...');
      setPuzzle2Answer('');
    } else {
      setMessage('❌ Look at where the line crosses the y-axis!');
    }
  };

  const checkPuzzle3 = () => {
    if (puzzle3Answer === '12') {
      setGameState('puzzle4');
      setCurrentPuzzle(4);
      setMessage('🔓 Third lock clicked! Keep going...');
      setPuzzle3Answer('');
    } else {
      setMessage('❌ Solve 3x + 5 = 41 carefully!');
    }
  };

  const checkPuzzle4 = () => {
    if (puzzle4Input === '2+2=5' || puzzle4Input.toLowerCase().includes('clue 1')) {
      setErrorFound(true);
      setGameState('puzzle5');
      setCurrentPuzzle(5);
      setMessage('🔓 You spotted the error! Moving on...');
      setPuzzle4Input('');
    } else {
      setMessage('❌ That\'s not the error! Look at the clues again.');
    }
  };

  const checkPuzzle5 = () => {
    if (selectedKey === 'key3') {
      setGameState('puzzle6');
      setCurrentPuzzle(6);
      setMessage('🔑 Correct key! Now decode the polynomial...');
    } else {
      setMessage('❌ Wrong key! Remember, x² = 16 has two solutions!');
    }
  };

  const checkPolynomialPuzzle = () => {
    const correctCode = ['2', '3', '1'];
    
    if (polynomialCode[0] === correctCode[0] && 
        polynomialCode[1] === correctCode[1] && 
        polynomialCode[2] === correctCode[2]) {
      setGameState('final');
      setCurrentPuzzle(7);
      setMessage('🔓 Polynomial decoded! Now create the final equation...');
      setErrorFound(true);
    } else {
      setPolynomialAttempts(prev => {
        if (prev <= 1) {
          const timeSpent = 360 - timeLeft;
          const puzzlesCompleted = currentPuzzle - 1;
          sendGameResult(false, timeLeft, timeSpent, puzzlesCompleted);
          setGameState('failed');
          setMessage('❌ Too many failed attempts! The system locked you out!');
          return 0;
        }
        setMessage(`❌ Wrong code! ${prev - 1} attempts remaining. Remember: solve the system of equations!`);
        return prev - 1;
      });
    }
  };

  const updatePolynomialDigit = (index, value) => {
    const newCode = [...polynomialCode];
    newCode[index] = value;
    setPolynomialCode(newCode);
  };

  const checkFinal = () => {
    if (finalEquation.toLowerCase() === 'e=mc^2' || finalEquation.toLowerCase() === 'e=mc2') {
      const timeSpent = 360 - timeLeft;
      const puzzlesCompleted = 7;
      sendGameResult(true, timeLeft, timeSpent, puzzlesCompleted);
      setGameState('escaped');
      setMessage('🎉 CONGRATULATIONS! You\'ve escaped the Equation Escape Room! 🎉');
    } else {
      setMessage('❌ That\'s not Einstein\'s famous equation!');
    }
  };

  const resetGame = () => {
    setGameState('start');
    setTimeLeft(360);
    setCurrentPuzzle(1);
    setPuzzle1Answer('');
    setPuzzle2Answer('');
    setPuzzle3Answer('');
    setPuzzle4Input('');
    setFinalEquation('');
    setShowHint(false);
    setErrorFound(false);
    setSelectedKey(null);
    setMessage('');
    setGraphValue(0);
    setPolynomialCode(['', '', '']);
    setPolynomialAttempts(3);
    setGameResultSent(false);
    setPlayTime(0);
    setGameStartTime(null);
  };

  const handleBackToGames = () => {
    if (gameState !== 'start' && gameState !== 'escaped' && gameState !== 'failed' && !gameResultSent && gameStartTime) {
      const timeSpent = 360 - timeLeft;
      const puzzlesCompleted = currentPuzzle - 1;
      sendGameResult(false, timeLeft, timeSpent, puzzlesCompleted);
    }
    navigate('/studenthub/games');
  };

  const updateGraph = (value) => {
    setGraphValue(value);
    const yValue = 2 * value + 3;
    setPuzzle2Answer(yValue.toString());
  };

  return (
    <div style={styles.container}>
      <button onClick={handleBackToGames} style={styles.backButton}>
        <FaArrowLeft style={styles.backIcon} />
        Back to Games
      </button>

      <div style={styles.header}>
        <h1 style={styles.title}>🧮 EQUATION ESCAPE ROOM 🧮</h1>
        {gameState !== 'start' && gameState !== 'escaped' && gameState !== 'failed' && (
          <div style={styles.timerContainer}>
            <div style={styles.timer}>⏱️ Time Left: {formatTime()}</div>
            <div style={styles.playTime}>🎮 Play Time: {formatPlayTime()}</div>
          </div>
        )}
        {message && <div style={styles.message}>{message}</div>}
      </div>

      {/* All the puzzle sections remain the same */}
      {gameState === 'start' && (
        <div style={styles.startScreen}>
          <h2 style={styles.subtitle}>Welcome to the Equation Escape Room!</h2>
          <p style={styles.text}>You have 6 minutes to solve all puzzles and escape.</p>
          <p style={styles.text}>Each puzzle unlocks a new challenge. Work quickly and carefully!</p>
          <button style={styles.startBtn} onClick={startGame}>
            🚪 START ESCAPE
          </button>
        </div>
      )}

      {gameState === 'puzzle1' && (
        <div style={styles.puzzleCard}>
          <h2 style={styles.puzzleTitle}>🔒 LOCK #1: Match the Equation</h2>
          <div style={styles.puzzleContent}>
            <p style={styles.question}>"A number plus 3 equals 7"</p>
            <p style={styles.questionSmall}>Which equation matches this statement?</p>
            
            <div style={styles.equationBox} onClick={() => setPuzzle1Answer('x=4')}>
              <input 
                type="radio" 
                name="puzzle1" 
                value="x=4" 
                checked={puzzle1Answer === 'x=4'}
                onChange={(e) => setPuzzle1Answer(e.target.value)}
                style={styles.radio}
              />
              <span style={styles.equationText}>x + 3 = 7  →  x = 4</span>
            </div>
            
            <div style={styles.equationBox} onClick={() => setPuzzle1Answer('x=10')}>
              <input 
                type="radio" 
                name="puzzle1" 
                value="x=10"
                checked={puzzle1Answer === 'x=10'}
                onChange={(e) => setPuzzle1Answer(e.target.value)}
                style={styles.radio}
              />
              <span style={styles.equationText}>x - 3 = 7  →  x = 10</span>
            </div>
            
            <div style={styles.equationBox} onClick={() => setPuzzle1Answer('x=21')}>
              <input 
                type="radio" 
                name="puzzle1" 
                value="x=21"
                checked={puzzle1Answer === 'x=21'}
                onChange={(e) => setPuzzle1Answer(e.target.value)}
                style={styles.radio}
              />
              <span style={styles.equationText}>3x = 7  →  x = 21</span>
            </div>
            
            <button 
              style={styles.unlockBtn} 
              onClick={checkPuzzle1}
              disabled={!puzzle1Answer}
            >
              🔓 TRY TO UNLOCK
            </button>
          </div>
        </div>
      )}

      {gameState === 'puzzle2' && (
        <div style={styles.puzzleCard}>
          <h2 style={styles.puzzleTitle}>🔒 LOCK #2: Interactive Graph</h2>
          <div style={styles.puzzleContent}>
            <div style={styles.graphContainer}>
              <div style={styles.graph}>
                <div style={styles.grid}>
                  <div style={styles.yAxis}></div>
                  <div style={styles.xAxis}></div>
                  <div style={styles.graphLine}></div>
                  <div style={{
                    ...styles.graphPoint,
                    left: `calc(50% + ${graphValue * 40}px)`,
                    bottom: `calc(50% + ${(2 * graphValue + 3) * 20}px)`
                  }}></div>
                </div>
              </div>
              
              <div style={styles.sliderContainer}>
                <span>Move the point: x = {graphValue}</span>
                <input 
                  type="range" 
                  min="-2" 
                  max="4" 
                  step="0.5"
                  value={graphValue}
                  onChange={(e) => updateGraph(parseFloat(e.target.value))}
                  style={styles.slider}
                />
                <span>y = 2({graphValue}) + 3 = {2 * graphValue + 3}</span>
              </div>
              
              <p style={styles.question}>What is the y-intercept? (y when x=0)</p>
              <input 
                type="number" 
                value={puzzle2Answer}
                onChange={(e) => setPuzzle2Answer(e.target.value)}
                placeholder="Enter y-intercept"
                style={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && checkPuzzle2()}
              />
            </div>
            
            <button style={styles.hintBtn} onClick={() => setShowHint(!showHint)}>
              💡 HINT
            </button>
            {showHint && (
              <div style={styles.hint}>
                The y-intercept is where the line crosses the y-axis (when x=0). Look at x=0 on the graph!
              </div>
            )}
            
            <button 
              style={styles.unlockBtn} 
              onClick={checkPuzzle2}
              disabled={!puzzle2Answer}
            >
              🔓 TRY TO UNLOCK
            </button>
          </div>
        </div>
      )}

      {gameState === 'puzzle3' && (
        <div style={styles.puzzleCard}>
          <h2 style={styles.puzzleTitle}>🔒 LOCK #3: Solve the Equation</h2>
          <div style={styles.puzzleContent}>
            <div style={styles.equationDisplay}>
              <span style={styles.bigEquation}>3x + 5 = 41</span>
            </div>
            
            <div style={styles.solveSteps}>
              <p>Step 1: 3x + 5 = 41</p>
              <p>Step 2: 3x = 41 - 5</p>
              <p>Step 3: 3x = 36</p>
              <p>Step 4: x = 36 ÷ 3</p>
            </div>
            
            <p style={styles.question}>What is the value of x?</p>
            <input 
              type="number" 
              value={puzzle3Answer}
              onChange={(e) => setPuzzle3Answer(e.target.value)}
              placeholder="Enter number"
              style={styles.input}
              onKeyPress={(e) => e.key === 'Enter' && checkPuzzle3()}
            />
            
            <button 
              style={styles.unlockBtn} 
              onClick={checkPuzzle3}
              disabled={!puzzle3Answer}
            >
              🔓 TRY TO UNLOCK
            </button>
          </div>
        </div>
      )}

      {gameState === 'puzzle4' && (
        <div style={styles.puzzleCard}>
          <h2 style={styles.puzzleTitle}>🔒 LOCK #4: Find the Error</h2>
          <div style={styles.puzzleContent}>
            <div style={styles.clues}>
              <div style={styles.clue}>📝 Clue 1: 2 + 2 = 5</div>
              <div style={styles.clue}>📝 Clue 2: 3 × 3 = 9</div>
              <div style={styles.clue}>📝 Clue 3: 10 - 4 = 6</div>
            </div>
            
            <p style={styles.question}>One clue has an error. Which one?</p>
            <p style={styles.smallText}>Type the clue with the error (e.g., "Clue 1" or "2+2=5")</p>
            
            <input 
              type="text" 
              value={puzzle4Input}
              onChange={(e) => setPuzzle4Input(e.target.value)}
              placeholder="Enter the incorrect clue"
              style={styles.input}
              onKeyPress={(e) => e.key === 'Enter' && checkPuzzle4()}
            />
            
            <button 
              style={styles.unlockBtn} 
              onClick={checkPuzzle4}
              disabled={!puzzle4Input}
            >
              🔓 CHECK ERROR
            </button>
          </div>
        </div>
      )}

      {gameState === 'puzzle5' && (
        <div style={styles.puzzleCard}>
          <h2 style={styles.puzzleTitle}>🔒 LOCK #5: Choose the Right Key</h2>
          <div style={styles.puzzleContent}>
            <p style={styles.question}>The equation x² = 16 has two solutions</p>
            
            <div style={styles.keys}>
              <button 
                style={{
                  ...styles.keyBtn,
                  ...(selectedKey === 'key1' ? styles.selectedKey : {})
                }}
                onClick={() => setSelectedKey('key1')}
              >
                🔑 Key 1: x = 4
              </button>
              
              <button 
                style={{
                  ...styles.keyBtn,
                  ...(selectedKey === 'key2' ? styles.selectedKey : {})
                }}
                onClick={() => setSelectedKey('key2')}
              >
                🔑 Key 2: x = -4
              </button>
              
              <button 
                style={{
                  ...styles.keyBtn,
                  ...(selectedKey === 'key3' ? styles.selectedKey : {})
                }}
                onClick={() => setSelectedKey('key3')}
              >
                🔑 Key 3: x = ±4 (both)
              </button>
              
              <button 
                style={{
                  ...styles.keyBtn,
                  ...(selectedKey === 'key4' ? styles.selectedKey : {})
                }}
                onClick={() => setSelectedKey('key4')}
              >
                🔑 Key 4: x = 8
              </button>
            </div>
            
            <button 
              style={styles.unlockBtn} 
              onClick={checkPuzzle5}
              disabled={!selectedKey}
            >
              🔓 TRY KEY
            </button>
          </div>
        </div>
      )}

      {gameState === 'puzzle6' && (
        <div style={styles.puzzleCard}>
          <h2 style={styles.puzzleTitle}>🔒 LOCK #6: Polynomial Decoder</h2>
          <div style={styles.puzzleContent}>
            <div style={styles.challengeBadge}>
              <span style={styles.hardBadge}>🔥 CHALLENGE MODE 🔥</span>
            </div>
            
            <p style={styles.question}>A quadratic polynomial P(x) = ax² + bx + c satisfies:</p>
            
            <div style={styles.polynomialConditions}>
              <div style={styles.conditionCard}>
                <span style={styles.conditionSymbol}>①</span>
                <span>P(1) = 6</span>
              </div>
              <div style={styles.conditionCard}>
                <span style={styles.conditionSymbol}>②</span>
                <span>P(2) = 11</span>
              </div>
              <div style={styles.conditionCard}>
                <span style={styles.conditionSymbol}>③</span>
                <span>P(3) = 18</span>
              </div>
            </div>
            
            <div style={styles.systemHint}>
              <p style={styles.hintText}>💡 System of equations:</p>
              <p style={styles.smallMono}>a + b + c = 6</p>
              <p style={styles.smallMono}>4a + 2b + c = 11</p>
              <p style={styles.smallMono}>9a + 3b + c = 18</p>
            </div>
            
            <p style={styles.question}>Find the coefficients (a, b, c) as a 3-digit code:</p>
            
            <div style={styles.codeInputContainer}>
              <input 
                type="number"
                min="0"
                max="9"
                value={polynomialCode[0]}
                onChange={(e) => updatePolynomialDigit(0, e.target.value.slice(0,1))}
                placeholder="a"
                style={styles.codeDigit}
              />
              <span style={styles.codeSeparator}>-</span>
              <input 
                type="number"
                min="0"
                max="9"
                value={polynomialCode[1]}
                onChange={(e) => updatePolynomialDigit(1, e.target.value.slice(0,1))}
                placeholder="b"
                style={styles.codeDigit}
              />
              <span style={styles.codeSeparator}>-</span>
              <input 
                type="number"
                min="0"
                max="9"
                value={polynomialCode[2]}
                onChange={(e) => updatePolynomialDigit(2, e.target.value.slice(0,1))}
                placeholder="c"
                style={styles.codeDigit}
              />
            </div>
            
            <div style={styles.attemptsCounter}>
              ⚡ Attempts remaining: {polynomialAttempts}
            </div>
            
            <button 
              style={styles.unlockBtn} 
              onClick={checkPolynomialPuzzle}
              disabled={!polynomialCode[0] || !polynomialCode[1] || !polynomialCode[2]}
            >
              🔓 DECODE POLYNOMIAL
            </button>
            
            <details style={styles.detailsHint}>
              <summary style={styles.summaryHint}>📖 Need solving strategy?</summary>
              <div style={styles.strategyContent}>
                <p>Step 1: Subtract equation 1 from equation 2 to eliminate c</p>
                <p>Step 2: Subtract equation 2 from equation 3 to eliminate c</p>
                <p>Step 3: Solve the resulting 2x2 system for a and b</p>
                <p>Step 4: Substitute back to find c</p>
              </div>
            </details>
          </div>
        </div>
      )}

      {gameState === 'final' && (
        <div style={styles.puzzleCard}>
          <h2 style={styles.puzzleTitle}>🚪 FINAL DOOR: Create the Escape Equation</h2>
          <div style={styles.puzzleContent}>
            <p style={styles.question}>Einstein's most famous equation relates energy and mass</p>
            
            <div style={styles.einsteinHint}>
              <span style={styles.bigEquation}>E = m ?</span>
            </div>
            
            <input 
              type="text" 
              value={finalEquation}
              onChange={(e) => setFinalEquation(e.target.value)}
              placeholder="Enter the complete equation (e.g., e=mc^2)"
              style={styles.finalInput}
              onKeyPress={(e) => e.key === 'Enter' && checkFinal()}
            />
            
            <button 
              style={styles.escapeBtn} 
              onClick={checkFinal}
              disabled={!finalEquation}
            >
              🚪 ATTEMPT TO ESCAPE
            </button>
          </div>
        </div>
      )}

      {gameState === 'failed' && (
        <div style={styles.endScreen}>
          <h2 style={styles.failedTitle}>💀 TIME'S UP! 💀</h2>
          <p style={styles.text}>The room remains locked...</p>
          <p style={styles.text}>Better luck next time!</p>
          <button style={styles.resetBtn} onClick={resetGame}>
            🔄 TRY AGAIN
          </button>
        </div>
      )}

      {gameState === 'escaped' && (
        <div style={styles.endScreen}>
          <h2 style={styles.successTitle}>🎉 ESCAPE SUCCESSFUL! 🎉</h2>
          <p style={styles.text}>You've solved all puzzles and escaped!</p>
          <p style={styles.text}>Time remaining: {formatTime()}</p>
          <p style={styles.text}>Play time: {formatPlayTime()}</p>
          
          <div style={styles.bonusChallenge}>
            <h3 style={styles.bonusTitle}>🏆 BONUS CHALLENGE 🏆</h3>
            <p style={styles.bonusText}>Can you solve this for extra credit?</p>
            <p style={styles.bonusEquation}>If x² + y² = 25 and x + y = 7, find x·y</p>
            <input 
              type="number" 
              placeholder="Enter product xy"
              id="bonusAnswer"
              style={styles.bonusInput}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const bonusInput = document.getElementById('bonusAnswer');
                  if (bonusInput && bonusInput.value === '12') {
                    alert('🎉 IMPRESSIVE! You solved the bonus challenge! +100 XP 🎉');
                  } else if (bonusInput) {
                    alert('Not quite! Hint: (x+y)² = x² + 2xy + y²');
                  }
                }
              }}
            />
            <button 
              style={styles.bonusBtn}
              onClick={() => {
                const bonusInput = document.getElementById('bonusAnswer');
                if (bonusInput && bonusInput.value === '12') {
                  alert('🎉 IMPRESSIVE! You solved the bonus challenge! +100 XP 🎉');
                } else if (bonusInput) {
                  alert('Not quite! Hint: (x+y)² = x² + 2xy + y²');
                }
              }}
            >
              SOLVE BONUS
            </button>
          </div>
          
          <button style={styles.resetBtn} onClick={resetGame}>
            🔄 PLAY AGAIN
          </button>
        </div>
      )}

      {gameState !== 'start' && gameState !== 'escaped' && gameState !== 'failed' && (
        <div style={styles.progress}>
          <div style={styles.progressText}>
            Puzzle {currentPuzzle}/7
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${(currentPuzzle / 7) * 100}%`
              }}
            ></div>
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
    backgroundColor: '#1a1a2e',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    color: '#fff',
    boxSizing: 'border-box',
  },
  backButton: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    backgroundColor: '#4a6fa5',
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
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  backIcon: {
    fontSize: '16px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    marginTop: '40px',
  },
  title: {
    color: '#ffd700',
    fontSize: 'clamp(20px, 5vw, 28px)',
    marginBottom: '10px',
  },
  timerContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  timer: {
    fontSize: 'clamp(18px, 4vw, 24px)',
    fontWeight: 'bold',
    color: '#ff6b6b',
    backgroundColor: '#2a2a4a',
    padding: '10px 20px',
    borderRadius: '10px',
    display: 'inline-block',
  },
  playTime: {
    fontSize: 'clamp(18px, 4vw, 24px)',
    fontWeight: 'bold',
    color: '#4caf50',
    backgroundColor: '#2a2a4a',
    padding: '10px 20px',
    borderRadius: '10px',
    display: 'inline-block',
  },
  message: {
    backgroundColor: '#4a4a6a',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '15px',
    color: '#fff',
    fontSize: 'clamp(12px, 3vw, 14px)',
  },
  startScreen: {
    textAlign: 'center',
    padding: 'clamp(30px, 8vw, 60px) clamp(20px, 5vw, 40px)',
    backgroundColor: '#2a2a4a',
    borderRadius: '15px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  subtitle: {
    color: '#ffd700',
    fontSize: 'clamp(20px, 5vw, 28px)',
    marginBottom: '20px',
  },
  text: {
    fontSize: 'clamp(14px, 4vw, 18px)',
    marginBottom: '15px',
    lineHeight: '1.5',
  },
  startBtn: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: 'clamp(12px, 3vw, 15px) clamp(30px, 8vw, 40px)',
    fontSize: 'clamp(16px, 4vw, 20px)',
    borderRadius: '25px',
    cursor: 'pointer',
    marginTop: '20px',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
  },
  puzzleCard: {
    backgroundColor: '#2a2a4a',
    borderRadius: '15px',
    padding: 'clamp(20px, 5vw, 30px)',
    marginBottom: '20px',
    maxWidth: '800px',
    margin: '0 auto 20px auto',
  },
  puzzleTitle: {
    color: '#ffd700',
    fontSize: 'clamp(18px, 4vw, 24px)',
    marginBottom: '20px',
    textAlign: 'center',
  },
  puzzleContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  question: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  questionSmall: {
    fontSize: 'clamp(12px, 3vw, 14px)',
    color: '#aaa',
    marginBottom: '15px',
  },
  equationBox: {
    backgroundColor: '#3a3a5a',
    padding: 'clamp(12px, 3vw, 15px)',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  radio: {
    width: 'clamp(16px, 4vw, 20px)',
    height: 'clamp(16px, 4vw, 20px)',
    cursor: 'pointer',
  },
  equationText: {
    fontSize: 'clamp(14px, 3.5vw, 18px)',
  },
  unlockBtn: {
    backgroundColor: '#4a6fa5',
    color: 'white',
    border: 'none',
    padding: 'clamp(12px, 3vw, 15px)',
    fontSize: 'clamp(14px, 3.5vw, 18px)',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '10px',
    fontWeight: 'bold',
  },
  hintBtn: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: 'clamp(8px, 2.5vw, 10px)',
    fontSize: 'clamp(12px, 3vw, 14px)',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  hint: {
    backgroundColor: '#ffd700',
    color: '#1a1a2e',
    padding: '12px',
    borderRadius: '5px',
    fontSize: 'clamp(12px, 3vw, 14px)',
  },
  graphContainer: {
    backgroundColor: '#3a3a5a',
    padding: 'clamp(15px, 4vw, 20px)',
    borderRadius: '8px',
  },
  graph: {
    height: 'clamp(200px, 40vh, 300px)',
    position: 'relative',
    backgroundColor: '#fff',
    marginBottom: '20px',
    overflow: 'hidden',
    borderRadius: '4px',
  },
  grid: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  yAxis: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: '#000',
  },
  xAxis: {
    position: 'absolute',
    bottom: '50%',
    left: 0,
    right: 0,
    height: '2px',
    backgroundColor: '#000',
  },
  graphLine: {
    position: 'absolute',
    width: '100%',
    height: '2px',
    backgroundColor: 'red',
    transform: 'rotate(63deg)',
    transformOrigin: 'center',
    top: '50%',
  },
  graphPoint: {
    position: 'absolute',
    width: '12px',
    height: '12px',
    backgroundColor: 'red',
    borderRadius: '50%',
    transform: 'translate(-50%, 50%)',
  },
  sliderContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    color: '#fff',
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },
  input: {
    padding: 'clamp(10px, 3vw, 12px)',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    borderRadius: '5px',
    border: '1px solid #4a6fa5',
    backgroundColor: '#3a3a5a',
    color: '#fff',
  },
  equationDisplay: {
    textAlign: 'center',
    padding: 'clamp(15px, 4vw, 20px)',
    backgroundColor: '#3a3a5a',
    borderRadius: '8px',
  },
  bigEquation: {
    fontSize: 'clamp(20px, 6vw, 32px)',
    fontWeight: 'bold',
    color: '#ffd700',
  },
  solveSteps: {
    backgroundColor: '#3a3a5a',
    padding: 'clamp(12px, 3vw, 15px)',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    lineHeight: '2',
  },
  clues: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  clue: {
    backgroundColor: '#3a3a5a',
    padding: 'clamp(12px, 3vw, 15px)',
    borderRadius: '5px',
    fontSize: 'clamp(14px, 3.5vw, 18px)',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 'clamp(11px, 2.5vw, 12px)',
    color: '#aaa',
  },
  keys: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
  },
  keyBtn: {
    backgroundColor: '#3a3a5a',
    color: '#fff',
    border: '2px solid #4a6fa5',
    padding: 'clamp(10px, 3vw, 15px)',
    fontSize: 'clamp(12px, 3vw, 14px)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  selectedKey: {
    backgroundColor: '#4CAF50',
    borderColor: '#fff',
  },
  finalInput: {
    padding: 'clamp(12px, 3vw, 15px)',
    fontSize: 'clamp(14px, 3.5vw, 18px)',
    borderRadius: '5px',
    border: '2px solid #ffd700',
    backgroundColor: '#3a3a5a',
    color: '#fff',
    textAlign: 'center',
  },
  escapeBtn: {
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: 'none',
    padding: 'clamp(12px, 3vw, 15px)',
    fontSize: 'clamp(16px, 4vw, 20px)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px',
  },
  endScreen: {
    textAlign: 'center',
    padding: 'clamp(30px, 8vw, 60px) clamp(20px, 5vw, 40px)',
    backgroundColor: '#2a2a4a',
    borderRadius: '15px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  failedTitle: {
    color: '#ff6b6b',
    fontSize: 'clamp(24px, 6vw, 32px)',
    marginBottom: '20px',
  },
  successTitle: {
    color: '#4CAF50',
    fontSize: 'clamp(24px, 6vw, 32px)',
    marginBottom: '20px',
  },
  resetBtn: {
    backgroundColor: '#4a6fa5',
    color: 'white',
    border: 'none',
    padding: 'clamp(12px, 3vw, 15px) clamp(30px, 8vw, 40px)',
    fontSize: 'clamp(14px, 3.5vw, 18px)',
    borderRadius: '25px',
    cursor: 'pointer',
    marginTop: '20px',
    fontWeight: 'bold',
  },
  progress: {
    marginTop: '20px',
    maxWidth: '800px',
    margin: '20px auto 0 auto',
  },
  progressText: {
    textAlign: 'center',
    marginBottom: '5px',
    color: '#aaa',
    fontSize: 'clamp(12px, 3vw, 14px)',
  },
  progressBar: {
    height: '10px',
    backgroundColor: '#3a3a5a',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  challengeBadge: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  hardBadge: {
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: 'clamp(12px, 3vw, 14px)',
    fontWeight: 'bold',
    display: 'inline-block',
  },
  polynomialConditions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '15px',
    marginBottom: '20px',
  },
  conditionCard: {
    backgroundColor: '#3a3a5a',
    padding: '15px',
    borderRadius: '10px',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontSize: 'clamp(14px, 3.5vw, 18px)',
  },
  conditionSymbol: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ffd700',
  },
  systemHint: {
    backgroundColor: '#2a2a4a',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  hintText: {
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#ffd700',
  },
  smallMono: {
    fontFamily: 'monospace',
    fontSize: 'clamp(12px, 3vw, 14px)',
    marginBottom: '5px',
    color: '#aaa',
  },
  codeInputContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  codeDigit: {
    width: 'clamp(60px, 15vw, 80px)',
    padding: 'clamp(12px, 3vw, 15px)',
    fontSize: 'clamp(20px, 5vw, 28px)',
    textAlign: 'center',
    borderRadius: '10px',
    border: '2px solid #ffd700',
    backgroundColor: '#3a3a5a',
    color: '#ffd700',
    fontWeight: 'bold',
  },
  codeSeparator: {
    fontSize: 'clamp(24px, 6vw, 32px)',
    fontWeight: 'bold',
    color: '#ffd700',
  },
  attemptsCounter: {
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#ff6b6b20',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: 'clamp(12px, 3vw, 14px)',
    color: '#ff6b6b',
  },
  detailsHint: {
    marginTop: '15px',
    cursor: 'pointer',
  },
  summaryHint: {
    color: '#4a6fa5',
    cursor: 'pointer',
    fontSize: 'clamp(12px, 3vw, 14px)',
  },
  strategyContent: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#3a3a5a',
    borderRadius: '5px',
    fontSize: 'clamp(11px, 2.5vw, 13px)',
    lineHeight: '1.6',
  },
  bonusChallenge: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#ffd70020',
    borderRadius: '15px',
    border: '2px solid #ffd700',
  },
  bonusTitle: {
    color: '#ffd700',
    marginBottom: '15px',
    fontSize: 'clamp(18px, 4vw, 24px)',
  },
  bonusText: {
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    marginBottom: '15px',
  },
  bonusEquation: {
    fontSize: 'clamp(18px, 5vw, 24px)',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#ffd700',
  },
  bonusInput: {
    padding: 'clamp(10px, 3vw, 12px)',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    borderRadius: '5px',
    border: '1px solid #ffd700',
    backgroundColor: '#3a3a5a',
    color: '#fff',
    textAlign: 'center',
    width: '150px',
    marginBottom: '10px',
  },
  bonusBtn: {
    backgroundColor: '#ffd700',
    color: '#1a1a2e',
    border: 'none',
    padding: 'clamp(8px, 2.5vw, 12px) clamp(20px, 5vw, 30px)',
    fontSize: 'clamp(12px, 3vw, 14px)',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginLeft: '10px',
  },
};

export default EquationEscapeRoom;