// src/missions/mission2.jsx - FULLY RESPONSIVE (No scroll required, fits any width including 100px)
// All text is justified and left-aligned, no center alignment for text content
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Mission2({ user, userData, updateUserData, onComplete, saveToDatabase }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackAvatar, setFeedbackAvatar] = useState(null);
  const [canProceed, setCanProceed] = useState(true);
  const [showAvatarMessage, setShowAvatarMessage] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [currentAvatarMessage, setCurrentAvatarMessage] = useState("🧙 Welcome, young wizard! Ready to master linear equations?");
  const [isCompleting, setIsCompleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showCheckPopup, setShowCheckPopup] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [pendingStepIndex, setPendingStepIndex] = useState(null);
  const [wrongFeedback, setWrongFeedback] = useState({});

  const questions = [
    {
      title: "Question 1: Linear Equation Definition",
      question: "What is a linear equation in two variables?",
      options: [
        "A first-degree equation whose graph is a straight line",
        "An equation with variables raised to powers greater than 1",
        "An equation whose graph is a curve",
        "An equation with no variables"
      ],
      correct: 0,
      explanation: "A linear equation has variables raised only to the first power, and its graph forms a straight line."
    },
    {
      title: "Question 2: Standard Form",
      question: "What is the standard form of a linear equation?",
      options: [
        "y = mx + b",
        "Ax + By = C",
        "x² + y² = r²",
        "y = x²"
      ],
      correct: 1,
      explanation: "The standard form is written as Ax + By = C, where A, B, and C are constants."
    },
    {
      title: "Question 3: Graph of Linear Equation",
      question: "Why is the graph of a linear equation a straight line?",
      options: [
        "Because it forms a curve",
        "Because the variables are squared",
        "Because it has no solution",
        "Because the rate of change is constant"
      ],
      correct: 3,
      explanation: "A linear equation has a constant slope (rate of change), which results in a straight line."
    },
    {
      title: "Question 4: Two Points Determine a Line",
      question: "How can two points determine a line?",
      options: [
        "They create a curve",
        "They give the slope and direction of the line",
        "They form a triangle",
        "They are not enough"
      ],
      correct: 1,
      explanation: "Two points uniquely determine a line because they allow you to compute the slope and define the line's direction."
    },
    {
      title: "Question 5: Calculate Slope",
      question: "What is the slope of the line passing through (2, 4) and (6, 8)?",
      options: ["1", "2", "-1", "4"],
      correct: 0,
      explanation: "Slope = (8-4)/(6-2) = 4/4 = 1"
    },
    {
      title: "Question 6: Equation from Two Points",
      question: "What is the equation of the line passing through (0, 3) and (4, 7)?",
      options: ["y = x + 3", "y = x - 3", "y = 2x + 3", "y = 4x + 7"],
      correct: 0,
      explanation: "Following the steps: x₁=0, y₁=3, x₂=4, y₂=7. y-3 = (7-3)/(4-0)(x-0) → y-3 = 4/4(x) → y-3 = x → y = x + 3"
    },
    {
      title: "Question 7: Comparing Slopes",
      question: "Compare the slopes of the lines through (1, 2) & (3, 6) and (2, 5) & (4, 9). What do you notice?",
      options: ["They are equal", "One is negative", "They are different", "One is zero"],
      correct: 0,
      explanation: "First slope = (6-2)/(3-1) = 4/2 = 2, Second slope = (9-5)/(4-2) = 4/2 = 2. Both slopes are equal."
    },
    {
      title: "Question 8: Parallel Lines",
      question: "Two lines pass through the points (1, 3) & (3, 7) and (2, 4) & (4, 8). What can you conclude?",
      options: [
        "The lines intersect at one point",
        "The lines are perpendicular",
        "The lines are parallel",
        "The lines are the same"
      ],
      correct: 2,
      explanation: "First line slope = (7-3)/(3-1)=4/2=2, Second line slope = (8-4)/(4-2)=4/2=2. Same slope means parallel."
    },
    {
      title: "Question 9: Verify Slope Claim",
      question: "A student claims the slope of the line through (1, 2) and (3, 4) is 1. Is the student correct?",
      options: [
        "Yes, because the slope is 1",
        "Yes, because the points are equal",
        "No, the slope is 2",
        "No, the slope is -1"
      ],
      correct: 0,
      explanation: "Slope = (4-2)/(3-1) = 2/2 = 1. The student is correct."
    },
    {
      title: "Question 10: Create Points for Equation",
      question: "If you create two ordered pairs of points that will generate the linear equation y = -x + 4, which points will you pick?",
      options: [
        "(0, 4) and (4, 0)",
        "(1, 1) and (2, 2)",
        "(0, 0) and (4, 4)",
        "(2, 4) and (4, 8)"
      ],
      correct: 0,
      explanation: "Slope = (0-4)/(4-0) = -4/4 = -1. When x=0, y=4 gives (0,4). When x=4, y=0 gives (4,0). Both satisfy y = -x + 4."
    }
  ];

  const steps = [
    {
      title: "🧙 MATH WIZARD CHALLENGE",
      content: "Welcome to the Math Wizard challenge! Answer these 10 questions about linear equations to prove your magical math skills!",
      description: "Each correct answer brings you closer to becoming a Math Wizard. Let's begin your journey!",
      type: "info"
    },
    {
      title: "LINEAR EQUATIONS - Lesson",
      content: (
        <div style={{wordBreak: 'break-word', textAlign: 'left'}}>
          <p style={{marginBottom: '10px', fontSize: 'clamp(12px, 4vw, 16px)', textAlign: 'justify'}}>
            <strong>LINEAR EQUATION</strong> is a first-degree polynomial involving two variables, and its graph forms a straight line.
          </p>
          <p style={{marginBottom: '10px', fontSize: 'clamp(12px, 4vw, 16px)', textAlign: 'justify'}}>
            Its standard form is expressed as <strong>Ax + By = C</strong>. The equation of a line can be found using different methods.
          </p>
          
          <div style={{textAlign: 'center', margin: '10px 0', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '10px'}}>
            <img 
              src="/pics.png" 
              alt="Linear Equation Graph"
              style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect width='500' height='300' fill='%23f3f4f6'/%3E%3Cline x1='100' y1='200' x2='400' y2='100' stroke='%238b5cf6' stroke-width='3'/%3E%3Ccircle cx='120' cy='190' r='6' fill='%23ef4444'/%3E%3Ctext x='110' y='180' font-size='12' fill='%23ef4444'%3E(1,2)%3C/text%3E%3Ccircle cx='380' cy='110' r='6' fill='%23ef4444'/%3E%3Ctext x='370' y='100' font-size='12' fill='%23ef4444'%3E(5,-2)%3C/text%3E%3Ctext x='250' y='280' text-anchor='middle' fill='%23666' font-size='14'%3ELine: y = -x + 3%3C/text%3E%3C/svg%3E";
              }}
            />
            <p style={{fontSize: 'clamp(10px, 3vw, 12px)', color: '#6b7280', marginTop: '6px', fontStyle: 'italic', textAlign: 'center'}}>Figure 1: Line passing through points (1, 2) and (5, -2)</p>
          </div>
          
          <div style={{backgroundColor: '#f0f9ff', padding: 'clamp(8px, 3vw, 12px)', borderRadius: '10px', marginTop: '12px', textAlign: 'left'}}>
            <h4 style={{color: '#0369a1', marginBottom: '10px', fontSize: 'clamp(14px, 4vw, 16px)', textAlign: 'left'}}>📐 Mission: Equation of a Line Using Two Points</h4>
            <p style={{fontSize: 'clamp(11px, 3.5vw, 14px)', textAlign: 'justify'}}><strong>Two points:</strong> (x₁, y₁) and (x₂, y₂)</p>
            <p style={{fontSize: 'clamp(11px, 3.5vw, 14px)', textAlign: 'justify'}}><strong>Example:</strong> Find the equation of the line through (1, 2) and (5, -2).</p>
            
            <div style={{backgroundColor: '#fefce8', padding: 'clamp(8px, 3vw, 10px)', borderRadius: '8px', marginTop: '8px', textAlign: 'left'}}>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 14px)', textAlign: 'justify'}}><strong>Solution:</strong> Use the <strong>Two-point Form</strong>:</p>
              <div style={{backgroundColor: '#e0f2fe', padding: '8px', borderRadius: '6px', margin: '8px 0', textAlign: 'center', fontSize: 'clamp(11px, 3.5vw, 14px)'}}>
                <strong>y - y₁ = (y₂ - y₁)/(x₂ - x₁) × (x - x₁)</strong>
              </div>
              
              <p style={{fontSize: 'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}><strong>Step 1.</strong> Identify points: (x₁, y₁) = (1, 2); (x₂, y₂) = (5, -2)</p>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}><strong>Step 2.</strong> Substitute: y - 2 = [(-2) - 2]/[(5) - 1] × (x - 1)</p>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}><strong>Step 3.</strong> Simplify: y - 2 = (-4)/(4) × (x - 1) → y - 2 = -1 × (x - 1)</p>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}><strong>Step 4.</strong> Distribute: y - 2 = -x + 1</p>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}><strong>Step 5.</strong> Add 2 to both sides: y = -x + 3</p>
              
              <div style={{backgroundColor: '#dcfce7', padding: '8px', borderRadius: '6px', marginTop: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: 'clamp(12px, 4vw, 14px)'}}>
                y = -x + 3 &nbsp;&nbsp;or&nbsp;&nbsp; x + y = 3
              </div>
            </div>
          </div>
        </div>
      ),
      type: "lesson"
    }
  ];

  for (let i = 0; i < questions.length; i++) {
    steps.push({ ...questions[i], type: "quiz" });
  }

  steps.push({
    title: "Mission Complete! 🎉",
    content: "Congratulations, Math Wizard! You've mastered all linear equation concepts!",
    result: "The equation is: y = -x + 3",
    note: "This line passes through the points (1, 2) and (5, -2)",
    type: "complete"
  });

  const avatarMessages = {
    happy: [
      "✨ Amazing! You're a true wizard!",
      "🧙 Perfect spell casting!",
      "🌟 Magical answer! Keep going!",
      "💫 You're mastering the arcane arts!",
      "🔮 The crystal ball shows success!",
      "📚 Excellent! One step closer!",
      "🏆 Magical performance! +250 XP awaits!"
    ],
    wrong: [
      "🤔 Oops! That's not correct. Try again!",
      "💡 Not quite right! Give it another try!",
      "📚 Hmm, that's not the answer. Keep practicing!",
      "✨ Don't give up! Try a different approach!",
      "🎯 Not this time. You can do it!"
    ],
    info: [
      "💡 Remember: Linear equations have a constant slope!",
      "🧙 A true wizard masters the standard form Ax + By = C!",
      "🔮 Two points uniquely determine a line!",
      "✨ Practice finding slope using m = (y₂-y₁)/(x₂-x₁)!"
    ]
  };

  const getRandomMessage = (type) => {
    const messages = avatarMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleResetMission = () => setShowResetConfirm(true);

  const confirmReset = async () => {
    setIsResetting(true);
    try {
      if (user?.dbId) {
        await supabase.from('mission_progress').delete().eq('mission_id', 2).eq('student_id', user.dbId);
      }
      setCurrentStep(0);
      setAnswers({});
      setWrongFeedback({});
      setShowConfetti(false);
      setFeedbackAvatar(null);
      setCanProceed(true);
      setShowAvatarMessage(true);
      setShowResetConfirm(false);
      setCurrentAvatarMessage("🔄 Mission reset! Let's start fresh! You can do this! 💪");
      setTimeout(() => setShowAvatarMessage(false), 3000);
    } catch (error) {
      console.error('Error resetting mission:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
    setCurrentAvatarMessage("👍 Great choice! Let's continue with your wizard training!");
    setShowAvatarMessage(true);
    setTimeout(() => setShowAvatarMessage(false), 2000);
  };

  const handleSelectAnswer = (stepIndex, answerIndex) => {
    setPendingAnswer(answerIndex);
    setPendingStepIndex(stepIndex);
    setShowCheckPopup(true);
    setCurrentAvatarMessage("🔍 Review your answer before confirming!");
    setShowAvatarMessage(true);
    setTimeout(() => setShowAvatarMessage(false), 2000);
  };

  const confirmAnswer = () => {
    const stepIndex = pendingStepIndex;
    const answerIndex = pendingAnswer;
    const step = steps[stepIndex];
    const isCorrect = answerIndex === step.correct;
    
    if (isCorrect) {
      setCurrentAvatarMessage(getRandomMessage('happy'));
      setFeedbackAvatar('happy');
      setCanProceed(true);
      setAnswers({ ...answers, [stepIndex]: { selected: answerIndex, isCorrect: true } });
      setWrongFeedback({ ...wrongFeedback, [stepIndex]: null });
    } else {
      setCurrentAvatarMessage(getRandomMessage('wrong'));
      setFeedbackAvatar('wrong');
      setCanProceed(false);
      setWrongFeedback({ ...wrongFeedback, [stepIndex]: "❌ Incorrect! Try again!" });
      const newAnswers = { ...answers };
      delete newAnswers[stepIndex];
      setAnswers(newAnswers);
    }
    
    setShowCheckPopup(false);
    setPendingAnswer(null);
    setPendingStepIndex(null);
    setShowAvatarMessage(true);
    setTimeout(() => setFeedbackAvatar(null), 3000);
  };

  const cancelAnswer = () => {
    setShowCheckPopup(false);
    setPendingAnswer(null);
    setPendingStepIndex(null);
    setCurrentAvatarMessage("📝 Take your time! Choose the correct answer.");
    setShowAvatarMessage(true);
    setTimeout(() => setShowAvatarMessage(false), 2000);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      if (steps[currentStep].type === 'quiz') {
        if (!answers[currentStep]) {
          setCurrentAvatarMessage("🤔 Please select a correct answer first!");
          setFeedbackAvatar('wrong');
          setShowAvatarMessage(true);
          setTimeout(() => setFeedbackAvatar(null), 2000);
          return;
        }
        if (!canProceed) {
          setCurrentAvatarMessage("📚 You need to answer correctly to continue! Try again!");
          setFeedbackAvatar('wrong');
          setShowAvatarMessage(true);
          setTimeout(() => setFeedbackAvatar(null), 2000);
          return;
        }
      }
      setCurrentStep(currentStep + 1);
      setCanProceed(true);
      setFeedbackAvatar(null);
      if (steps[currentStep + 1]?.type === 'quiz') {
        setCurrentAvatarMessage(getRandomMessage('info'));
        setShowAvatarMessage(true);
        setTimeout(() => setShowAvatarMessage(false), 3000);
      } else if (steps[currentStep + 1]?.type === 'complete') {
        setCurrentAvatarMessage("🎉 You're almost there! Complete the mission to claim your reward!");
        setShowAvatarMessage(true);
        setTimeout(() => setShowAvatarMessage(false), 3000);
      } else {
        setShowAvatarMessage(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      const prevStep = steps[currentStep - 1];
      if (prevStep.type === 'quiz') {
        const prevAnswer = answers[currentStep - 1];
        setCanProceed(prevAnswer ? prevAnswer.isCorrect : true);
      } else {
        setCanProceed(true);
      }
      setFeedbackAvatar(null);
      setShowAvatarMessage(false);
    }
  };

  const saveMissionCompletion = async () => {
    try {
      if (!user?.dbId) return false;
      const { error } = await supabase.from('mission_progress').upsert({
        mission_id: 2, student_id: user.dbId, status: 'completed',
        completed_at: new Date().toISOString(), xp_earned: 250
      }, { onConflict: 'mission_id,student_id' });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving mission:', error);
      return false;
    }
  };

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    setShowConfetti(true);
    setCurrentAvatarMessage("🏆 CONGRATULATIONS, MATH WIZARD! You've mastered all linear equation concepts! +250 XP! 🎉");
    setFeedbackAvatar('happy');
    setShowAvatarMessage(true);

    const currentProgress = userData?.progress || {};
    const completedMissions = currentProgress.completedMissions || [];
    
    if (!completedMissions.includes(2)) {
      await saveMissionCompletion();
      const newTotalXP = (userData?.xp || 0) + 250;
      if (updateUserData) {
        updateUserData({
          xp: newTotalXP,
          progress: {
            ...currentProgress,
            missionsCompleted: (currentProgress.missionsCompleted || 0) + 1,
            completedMissions: [...completedMissions, 2],
            lastMissionCompleted: new Date().toISOString()
          }
        });
      }
      window.dispatchEvent(new CustomEvent('xpUpdated', { detail: { newXP: newTotalXP, missionId: 2 } }));
    }

    setTimeout(() => {
      if (onComplete) onComplete(true);
      else navigate('/studenthub/missions');
    }, 3000);
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    const currentAnswer = answers[currentStep];
    const wrongMsg = wrongFeedback[currentStep];

    switch (step.type) {
      case "info":
        return (
          <div style={{textAlign: 'left'}}>
            <p style={{fontSize: 'clamp(13px, 4vw, 16px)', lineHeight: '1.4', textAlign: 'justify'}}>{step.content}</p>
            <p style={{fontSize: 'clamp(12px, 3.5vw, 15px)', marginTop: '8px', textAlign: 'justify'}}>{step.description}</p>
            <div style={{display:'flex', gap:'12px', justifyContent:'center', margin:'12px 0'}}>
              <span style={{fontSize: 'clamp(24px, 8vw, 32px)'}}>🧙</span>
              <span style={{fontSize: 'clamp(24px, 8vw, 32px)'}}>🔮</span>
              <span style={{fontSize: 'clamp(24px, 8vw, 32px)'}}>✨</span>
            </div>
            <div style={{background:'#fef3c7', padding:'10px', borderRadius:'10px', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'6px', fontSize:'clamp(11px, 3.5vw, 14px)', textAlign: 'left'}}>
              <span>🏆 Complete all questions to earn</span>
              <span style={{fontWeight:'bold', color:'#d97706'}}>+250 XP!</span>
            </div>
          </div>
        );
      case "lesson":
        return <div style={{wordBreak: 'break-word', textAlign: 'left'}}>{step.content}</div>;
      case "quiz":
        return (
          <div style={{textAlign: 'left'}}>
            <div style={{fontSize:'clamp(11px, 3.5vw, 13px)', color:'#8b5cf6', fontWeight:'bold', textAlign: 'left'}}>Question {currentStep-1} of {questions.length}</div>
            <p style={{fontWeight:'bold', margin:'10px 0', fontSize:'clamp(14px, 4.5vw, 18px)', textAlign: 'justify'}}>{step.question}</p>
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
              {step.options.map((option, idx) => (
                <label key={idx} style={{
                  display:'flex', alignItems:'center', padding:'clamp(6px, 2vw, 10px)', border:'1px solid #e5e7eb', borderRadius:'10px',
                  fontSize:'clamp(11px, 3.5vw, 14px)', textAlign: 'left',
                  ...(currentAnswer && currentAnswer.selected === idx && idx === step.correct ? {backgroundColor:'#d1fae5', borderColor:'#10b981'} : {}),
                  ...(currentAnswer && currentAnswer.selected === idx && idx !== step.correct ? {backgroundColor:'#fee2e2', borderColor:'#ef4444'} : {})
                }}>
                  <input type="radio" name={`q-${currentStep}`} value={idx}
                    checked={currentAnswer && currentAnswer.selected === idx}
                    onChange={() => !currentAnswer && handleSelectAnswer(currentStep, idx)}
                    disabled={currentAnswer !== undefined}
                    style={{marginRight:'10px', width:'clamp(14px, 4vw, 16px)', height:'clamp(14px, 4vw, 16px)'}} />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {wrongMsg && !currentAnswer && (
              <div style={{padding:'8px', backgroundColor:'#fee2e2', color:'#dc2626', borderRadius:'8px', marginTop:'10px', fontSize:'clamp(11px, 3.5vw, 13px)', textAlign: 'center'}}>
                {wrongMsg}
              </div>
            )}
            {currentAnswer && currentAnswer.isCorrect && (
              <div style={{padding:'8px', backgroundColor:'#d1fae5', color:'#065f46', borderRadius:'8px', marginTop:'10px', fontSize:'clamp(11px, 3.5vw, 13px)', textAlign: 'center'}}>
                ✅ Correct! Well done!
              </div>
            )}
          </div>
        );
      case "complete":
        return (
          <div style={{textAlign: 'left'}}>
            <p style={{fontSize:'clamp(14px, 4.5vw, 18px)', textAlign: 'justify'}}>{step.content}</p>
            <div style={{background:'#ede9fe', padding:'12px', borderRadius:'12px', margin:'12px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', flexWrap:'wrap'}}>
              <span style={{fontSize:'clamp(20px, 6vw, 24px)'}}>📐</span>
              <span style={{fontWeight:'bold', fontSize:'clamp(14px, 4vw, 18px)'}}>{step.result}</span>
            </div>
            <p style={{fontSize:'clamp(11px, 3.5vw, 13px)', fontStyle:'italic', textAlign: 'justify'}}>{step.note}</p>
            <div style={{background:'#fef3c7', padding:'12px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'14px'}}>
              <span style={{fontSize:'clamp(20px, 6vw, 24px)'}}>🏆</span>
              <span style={{fontWeight:'bold', fontSize:'clamp(14px, 4vw, 16px)'}}>+250 XP Earned!</span>
            </div>
            <button style={{width:'100%', padding:'clamp(10px, 3vw, 14px)', backgroundColor:'#8b5cf6', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', fontSize:'clamp(14px, 4vw, 16px)', textAlign: 'center'}} onClick={handleComplete} disabled={isCompleting}>
              {isCompleting ? "Completing..." : "Claim Your Wizard Reward"}
            </button>
          </div>
        );
      default: return null;
    }
  };

  const getAvatarImage = () => {
    if (feedbackAvatar === 'happy') return '/avatar_happy.jpg';
    if (feedbackAvatar === 'wrong') return '/avatar_wrong.jpg';
    return '/avatar_happy.jpg';
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const questionsCompleted = Object.keys(answers).filter(key => answers[key] && answers[key].isCorrect).length;

  return (
    <div style={{
      padding: '8px',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      boxSizing: 'border-box',
      width: '100%',
      overflowX: 'hidden'
    }}>
      {/* Check Answer Confirmation Popup */}
      {showCheckPopup && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000}}>
          <div style={{backgroundColor:'white', borderRadius:'20px', padding:'20px', textAlign:'center', maxWidth:'300px', width:'85%'}}>
            <div style={{fontSize:'48px'}}>🔍</div>
            <h3 style={{fontSize:'20px', margin:'10px 0'}}>Check your answer?</h3>
            <p style={{fontSize:'14px', marginBottom:'20px'}}>Are you sure you want to check if this answer is correct?</p>
            <div style={{display:'flex', gap:'12px', justifyContent:'center', flexDirection:'column'}}>
              <button style={{backgroundColor:'#8b5cf6', color:'white', padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', fontSize:'14px'}} onClick={confirmAnswer}>Yes, Check Answer</button>
              <button style={{backgroundColor:'#6b7280', color:'white', padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', fontSize:'14px'}} onClick={cancelAnswer}>No, Let me review</button>
            </div>
          </div>
        </div>
      )}

      {showConfetti && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{backgroundColor:'white', padding:'20px', borderRadius:'16px', textAlign:'center', maxWidth:'90%', fontSize:'clamp(14px, 4vw, 18px)'}}>
            🎉 Mission Complete! 🎉<br />You earned 250 XP!<br />You are now a Math Wizard! 🧙
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'16px'}}>
          <div style={{backgroundColor:'white', borderRadius:'16px', padding:'20px', maxWidth:'300px', width:'90%', textAlign:'center'}}>
            <h3 style={{fontSize:'18px', marginBottom:'10px', color:'#ef4444'}}>🔄 Reset Mission?</h3>
            <p style={{fontSize:'13px', marginBottom:'18px'}}>Are you sure you want to reset this mission? All your progress will be lost.</p>
            <div style={{display:'flex', gap:'10px', justifyContent:'center', flexDirection:'column'}}>
              <button style={{backgroundColor:'#ef4444', color:'white', padding:'10px', borderRadius:'8px', border:'none', fontWeight:'bold'}} onClick={confirmReset} disabled={isResetting}>{isResetting ? 'Resetting...' : 'Yes, Reset'}</button>
              <button style={{backgroundColor:'#6b7280', color:'white', padding:'10px', borderRadius:'8px', border:'none', fontWeight:'bold'}} onClick={cancelReset}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'8px'}}>
        <button style={{backgroundColor:'#ef4444', color:'white', padding:'6px 12px', borderRadius:'8px', border:'none', fontSize:'clamp(10px, 3vw, 12px)', fontWeight:'bold'}} onClick={handleResetMission}>🔄 Reset</button>
      </div>

      {/* Progress Bar */}
      <div style={{width:'100%', height:'6px', backgroundColor:'#e5e7eb', borderRadius:'3px', marginBottom:'10px', overflow:'hidden'}}>
        <div style={{height:'100%', backgroundColor:'#8b5cf6', width:`${progressPercentage}%`, transition:'width 0.3s'}} />
      </div>

      {/* XP Preview for quiz steps */}
      {steps[currentStep].type === 'quiz' && (
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', fontSize:'clamp(10px, 3vw, 12px)', fontWeight:'bold', color:'#8b5cf6', background:'#ede9fe', padding:'6px 10px', borderRadius:'10px', textAlign: 'left'}}>
          <span>🧙 Mastered: {questionsCompleted}/{questions.length}</span>
          <span style={{color:'#d97706'}}>✨ +250 XP</span>
        </div>
      )}

      {/* Main Card */}
      <div style={{
        backgroundColor:'white', borderRadius:'16px', padding:'clamp(12px, 4vw, 16px)', boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
        display:'flex', flexDirection:'column', width:'100%', boxSizing:'border-box', overflowX:'hidden'
      }}>
        <h2 style={{fontSize:'clamp(16px, 5vw, 20px)', marginBottom:'12px', color:'#333', textAlign: 'left'}}>{steps[currentStep].title}</h2>
        <div style={{overflowX:'hidden', wordBreak:'break-word', marginBottom:'12px'}}>
          {renderStepContent()}
        </div>
        
        {/* Navigation Buttons */}
        <div style={{display:'flex', justifyContent:'space-between', gap:'10px', marginTop:'10px'}}>
          {currentStep > 0 && <button style={{backgroundColor:'#6b7280', color:'white', padding:'8px 16px', borderRadius:'8px', border:'none', fontSize:'clamp(11px, 3.5vw, 13px)', fontWeight:'bold'}} onClick={handlePrevious}>← Prev</button>}
          {currentStep < steps.length - 1 && steps[currentStep].type !== 'complete' && (
            <button style={{
              backgroundColor:'#8b5cf6', color:'white', padding:'8px 16px', borderRadius:'8px', border:'none', fontSize:'clamp(11px, 3.5vw, 13px)', fontWeight:'bold',
              ...(steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep]) ? {backgroundColor:'#c4b5fd', opacity:0.6} : {})
            }} onClick={handleNext} disabled={steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep])}>
              Next →
            </button>
          )}
        </div>
        
        <div style={{textAlign:'center', marginTop:'10px', fontSize:'clamp(9px, 3vw, 11px)', color:'#999'}}>
          {steps[currentStep].type === 'quiz' ? `Q${currentStep-1}/${questions.length}` : `Step ${currentStep+1}/${steps.length}`}
        </div>

        {/* Avatar Section - No scroll */}
        <div style={{marginTop:'20px', paddingTop:'14px', borderTop:'1px solid #e5e7eb', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'12px'}}>
          {/* Speech Bubble */}
          <div style={{width:'100%', maxWidth:'280px'}}>
            {showAvatarMessage && currentAvatarMessage && !showCheckPopup && (
              <div style={{backgroundColor:'white', padding:'10px 14px', borderRadius:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.1)', border:'2px solid #8b5cf6', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px'}}>
                <span style={{fontSize:'clamp(11px, 3.5vw, 13px)', color:'#333', flex:1, lineHeight:'1.4', textAlign: 'left'}}>{currentAvatarMessage}</span>
                <button onClick={() => setShowAvatarMessage(false)} style={{background:'none', border:'none', fontSize:'12px', color:'#999', cursor:'pointer'}}>✕</button>
              </div>
            )}
            {!showAvatarMessage && !showCheckPopup && (
              <button onClick={() => { setShowAvatarMessage(true); setCurrentAvatarMessage(getRandomMessage('info')); }} style={{borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer', backgroundColor:'#8b5cf6', color:'white', border:'none', fontSize:'20px', display:'flex', alignItems:'center', justifyContent:'center'}}>💬</button>
            )}
          </div>
          
          {/* Avatar Image */}
          <div style={{width:'clamp(70px, 15vw, 90px)', height:'clamp(70px, 15vw, 90px)', borderRadius:'50%', overflow:'hidden', backgroundColor:'#f0f0f0', boxShadow:'0 2px 10px rgba(0,0,0,0.2)', border:'3px solid white'}}>
            <img src={getAvatarImage()} alt="Assistant" style={{width:'100%', height:'100%', objectFit:'cover'}}
              onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%238b5cf6'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"; }} />
          </div>
        </div>
      </div>

      {/* Global styles for text wrapping and no horizontal scroll */}
      <style>{`
        * {
          max-width: 100%;
          box-sizing: border-box;
        }
        body, div, p, h1, h2, h3, h4, span, button, label {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        img, svg {
          max-width: 100%;
          height: auto;
        }
        button {
          cursor: pointer;
        }
        button:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}

export default Mission2;