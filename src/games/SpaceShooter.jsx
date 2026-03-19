// src/games/SpaceShooter.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';

const SpaceShooter = () => {
  const canvasRef = useRef(null);

  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [targetEquation, setTargetEquation] = useState(null);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  const gameRef = useRef({
    player: { x: 380, y: 550, width: 40, height: 40 },
    bullets: [],
    enemies: [],
    particles: [],
    keys: {},
    frame: 0,
    lastShot: 0,
    gameActive: false,
    lastNumberUpdate: 0 // Add this to track number updates
  });

  // ------------------ EQUATION ------------------
  const generateEquation = useCallback(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { equation: `${a} + ${b}`, answer: a + b, type: 'addition' };
  }, []);

  const generateWrongAnswers = (correct) => {
    const arr = [];
    while (arr.length < 3) {
      let w = correct + (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 5) + 1);
      if (w > 0 && !arr.includes(w)) arr.push(w);
    }
    return arr;
  };

  const createEnemy = useCallback(() => {
    if (!targetEquation) return null;

    const wrong = generateWrongAnswers(targetEquation.answer);
    const isCorrect = Math.random() < 0.3;

    return {
      x: Math.random() * 700,
      y: Math.random() * 100,
      width: 80,
      height: 60,
      speed: 1 + Math.random(),
      direction: 1,
      equation: targetEquation.equation,
      answer: isCorrect ? targetEquation.answer : wrong[Math.floor(Math.random() * 3)],
      isCorrect,
      // Add these properties for number visibility control
      numberVisible: false,
      showNumberTimer: 0
    };
  }, [targetEquation]);

  // ------------------ INIT ------------------
  const initLevel = useCallback(() => {
    const game = gameRef.current;

    game.enemies = [];
    game.bullets = [];

    const eq = generateEquation();
    setTargetEquation(eq);

    for (let i = 0; i < 5 + level; i++) {
      const e = createEnemy();
      if (e) game.enemies.push(e);
    }
  }, [level, generateEquation, createEnemy]);

  const startGame = () => {
    const game = gameRef.current;

    game.gameActive = true;
    game.player = { x: 380, y: 550, width: 40, height: 40 };
    game.bullets = [];
    game.enemies = [];
    game.keys = {};
    game.lastShot = 0;
    game.lastNumberUpdate = 0;

    setScore(0);
    setLevel(1);
    setGameState('playing');

    setTimeout(initLevel, 0);
  };

  // ------------------ SHOOT ------------------
  const shoot = () => {
    const game = gameRef.current;
    const now = Date.now();

    if (now - game.lastShot < 250) return;

    game.bullets.push({
      x: game.player.x + 18,
      y: game.player.y - 20,
      width: 4,
      height: 10,
      speed: 8
    });

    game.lastShot = now;
  };

  // ------------------ UPDATE ------------------
  const updateGame = useCallback(() => {
    const game = gameRef.current;
    if (!game.gameActive) return;

    const now = Date.now();

    // Update number visibility - make numbers appear one by one
    if (now - game.lastNumberUpdate > 500) { // Show a new number every 500ms
      const invisibleEnemies = game.enemies.filter(e => !e.numberVisible);
      if (invisibleEnemies.length > 0) {
        const randomIndex = Math.floor(Math.random() * invisibleEnemies.length);
        const enemyToReveal = invisibleEnemies[randomIndex];
        const enemyIndex = game.enemies.findIndex(e => e === enemyToReveal);
        if (enemyIndex !== -1) {
          game.enemies[enemyIndex].numberVisible = true;
        }
      }
      game.lastNumberUpdate = now;
    }

    // movement
    if (game.keys['ArrowLeft']) game.player.x -= 6;
    if (game.keys['ArrowRight']) game.player.x += 6;

    game.player.x = Math.max(0, Math.min(760, game.player.x));

    // shooting
    if (game.keys['Space']) shoot();

    // bullets
    game.bullets = game.bullets.filter(b => {
      b.y -= b.speed;
      return b.y > -20;
    });

    // enemies
    game.enemies.forEach(e => {
      e.x += e.speed * e.direction;
      if (e.x <= 0 || e.x >= 720) e.direction *= -1;
      e.y += 0.3;
    });

    // collision
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
          if (e.answer === targetEquation.answer) {
            setScore(s => s + 100);
            setFeedback({ message: 'Correct!', type: 'success' });
          } else {
            setScore(s => Math.max(0, s - 25));
            setFeedback({ message: 'Wrong!', type: 'error' });
          }

          game.bullets.splice(bi, 1);
          game.enemies.splice(ei, 1);
          break;
        }
      }
    }

    // next level
    if (game.enemies.length === 0) {
      setLevel(l => l + 1);
      setTimeout(initLevel, 1000);
    }

    // game over
    if (game.enemies.some(e => e.y > 560)) {
      game.gameActive = false;
      setGameState('gameOver');
    }
  }, [targetEquation, initLevel]);

  // ------------------ DRAW ------------------
  const drawGame = useCallback((ctx) => {
    const game = gameRef.current;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 800, 600);

    // player
    ctx.fillStyle = 'cyan';
    ctx.fillRect(game.player.x, game.player.y, 40, 20);

    // bullets
    ctx.fillStyle = 'yellow';
    game.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

    // enemies
    game.enemies.forEach(e => {
      ctx.fillStyle = 'red';
      ctx.fillRect(e.x, e.y, e.width, e.height);
      
      // Only show number if it's visible
      if (e.numberVisible) {
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(e.answer, e.x + 30, e.y + 35);
      } else {
        // Show a question mark for hidden numbers
        ctx.fillStyle = 'yellow';
        ctx.font = '20px Arial';
        ctx.fillText('?', e.x + 35, e.y + 35);
      }
    });

    // Show feedback message
    if (feedback.message) {
      ctx.fillStyle = feedback.type === 'success' ? 'green' : 'red';
      ctx.font = '24px Arial';
      ctx.fillText(feedback.message, 350, 100);
      
      // Clear feedback after 1 second
      setTimeout(() => setFeedback({ message: '', type: '' }), 1000);
    }

    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Level: ${level}`, 10, 40);

    if (targetEquation) {
      ctx.fillText(`Target: ${targetEquation.equation}`, 300, 20);
    }
  }, [score, level, targetEquation, feedback]);

  // ------------------ LOOP ------------------
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

  // ------------------ KEY FIX ------------------
  useEffect(() => {
    const down = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        gameRef.current.keys['Space'] = true;
      } else {
        gameRef.current.keys[e.key] = true;
      }
    };

    const up = (e) => {
      if (e.code === 'Space') {
        gameRef.current.keys['Space'] = false;
      } else {
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

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} width={800} height={600} className="border" />

      {gameState === 'menu' && (
        <button 
          onClick={startGame}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Start Game
        </button>
      )}

      {gameState === 'gameOver' && (
        <div className="mt-4 text-center">
          <h2 className="text-xl mb-2">Game Over</h2>
          <button 
            onClick={startGame}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default SpaceShooter;