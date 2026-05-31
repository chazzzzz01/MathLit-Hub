// src/missions/mission5.jsx - FULLY RESPONSIVE (optimized for 308x748 and all screen sizes)
// FIX: Avatar on left below Prev/Next buttons, text justified, larger readable text, no scrolling, answer confirmation popup
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Mission5({ user, userData, updateUserData, onComplete }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackAvatar, setFeedbackAvatar] = useState(null);
  const [canProceed, setCanProceed] = useState(true);
  const [showAvatarMessage, setShowAvatarMessage] = useState(true);
  const [currentAvatarMessage, setCurrentAvatarMessage] = useState("📐 Welcome! Ready to learn about X and Y Intercepts?");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRewardClaimed, setShowRewardClaimed] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [showCheckPopup, setShowCheckPopup] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [pendingStepIndex, setPendingStepIndex] = useState(null);
  const [wrongFeedback, setWrongFeedback] = useState({});

  const MISSION_ID = 5;
  const MISSION_XP = 600;

  const questions = [
    { 
      title: "Question 1: Intercept Form",
      question: "What is the standard Intercept-Form used when x-intercept (a) and y-intercept (b) are known?", 
      options: ["Ax + By = C", "x/a + y/b = 1", "y - y₁ = m(x - x₁)", "y = mx + b"], 
      correct: 1, 
      explanation: "The Intercept Form is x/a + y/b = 1, where a is x-intercept and b is y-intercept." 
    },
    { 
      title: "Question 2: Intercept Form with Given Values",
      question: "What is the Intercept Form for line with x-intercept 4 and y-intercept -2?", 
      options: ["x/4 + y/(-2) = 0", "x/4 - y/2 = 1", "x/(-2) + y/4 = 1", "4x - 2y = 1"], 
      correct: 1, 
      explanation: "Substitute a=4, b=-2 into x/a + y/b = 1 → x/4 - y/2 = 1." 
    },
    { 
      title: "Question 3: Convert to Standard Form",
      question: "Simplify x/4 + y/(-2) = 1 to Standard Form.", 
      options: ["x + 2y = 4", "x - 2y = 4", "4x - 2y = 4", "x - y = 4"], 
      correct: 1, 
      explanation: "Multiply by 4: x - 2y = 4." 
    },
    { 
      title: "Question 4: Identify Points",
      question: "Line with x-intercept 4 and y-intercept -2 passes through which points?", 
      options: ["(0,4) and (-2,0)", "(4,0) and (0,-2)", "(4,-2) and (0,0)", "(4,4) and (-2,-2)"], 
      correct: 1, 
      explanation: "x-intercept (4,0), y-intercept (0,-2)." 
    },
    { 
      title: "Question 5: Intercept Form with Positive Intercepts",
      question: "Intercept Form for x-intercept 5 and y-intercept 3?", 
      options: ["x/3 + y/5 = 1", "x/5 + y/3 = 1", "5x + 3y = 1", "x - y = 2"], 
      correct: 1, 
      explanation: "x/5 + y/3 = 1." 
    },
    { 
      title: "Question 6: Identify Form",
      question: "Which form is x - 2y = 4?", 
      options: ["Intercept Form", "Standard Form", "Slope Form", "Variable Form"], 
      correct: 1, 
      explanation: "x - 2y = 4 is Standard Form." 
    },
    { 
      title: "Question 7: Convert to Standard Form",
      question: "Convert x/5 + y/(-1) = 1 to standard form.", 
      options: ["x + 5y = 5", "x - 5y = 5", "5x - y = 5", "x - y = 1"], 
      correct: 1, 
      explanation: "Multiply by 5: x - 5y = 5." 
    },
    { 
      title: "Question 8: Convert to Intercept Form",
      question: "Which is equivalent to x - 2y = 4 in intercept form?", 
      options: ["x/4 + y/2 = 1", "x/4 + y/(-2) = 1", "x/(-4) + y/2 = 1", "x/2 + y/4 = 1"], 
      correct: 1, 
      explanation: "Intercepts: (4,0) and (0,-2) → x/4 + y/(-2) = 1." 
    },
    { 
      title: "Question 9: Negative x-intercept",
      question: "Line with x-intercept -3 and y-intercept 5?", 
      options: ["x/3 + y/5 = 1", "x/(-3) + y/5 = 1", "x/5 + y/(-3) = 1", "x + y = 2"], 
      correct: 1, 
      explanation: "x/(-3) + y/5 = 1." 
    },
    { 
      title: "Question 10: Equation from Intercepts",
      question: "Equation with intercepts (8,0) and (0,-4)?", 
      options: ["x/8 + y/4 = 1", "x/8 + y/(-4) = 1", "x/(-8) + y/4 = 1", "x + y = 4"], 
      correct: 1, 
      explanation: "x/8 + y/(-4) = 1." 
    }
  ];

  const steps = [
    { 
      title: "Mission 5: X and Y Intercepts", 
      content: (
        <div style={{wordBreak: 'break-word', textAlign: 'left'}}>
          <p style={{marginBottom: '10px', fontSize: 'clamp(12px, 4vw, 16px)', textAlign: 'justify'}}>
            <strong>X and Y Intercepts</strong> are where a line crosses the x-axis and y-axis.
          </p>
          <p style={{marginBottom: '10px', fontSize: 'clamp(12px, 4vw, 16px)', textAlign: 'justify'}}>
            The <strong>Intercept Form</strong> is: <strong>x/a + y/b = 1</strong>, where <strong>a</strong> is the x-intercept and <strong>b</strong> is the y-intercept.
          </p>
          <div style={{textAlign: 'center', margin: '10px 0', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '10px'}}>
            <img src="/image5.png" alt="X and Y Intercepts" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} 
              onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23f3f4f6'/%3E%3Cline x1='50' y1='200' x2='350' y2='50' stroke='%238b5cf6' stroke-width='3'/%3E%3Ccircle cx='50' cy='200' r='5' fill='%23ef4444'/%3E%3Ctext x='60' y='215' font-size='12' fill='%23ef4444'%3E(0,2)%3C/text%3E%3Ctext x='350' y='45' font-size='12' fill='%23ef4444'%3E(4,0)%3C/text%3E%3Ctext x='200' y='230' text-anchor='middle' fill='%23666' font-size='14'%3Ex-intercept (4,0), y-intercept (0,-2)%3C/text%3E%3C/svg%3E"; }} />
            <p style={{fontSize: 'clamp(10px, 3vw, 12px)', color: '#6b7280', marginTop: '6px', fontStyle: 'italic', textAlign: 'center'}}>Figure 1: Graph with intercepts (4,0) and (0,-2)</p>
          </div>
          <div style={{backgroundColor: '#f0f9ff', padding: 'clamp(8px, 3vw, 12px)', borderRadius: '10px', marginTop: '12px', textAlign: 'left'}}>
            <h4 style={{color: '#0369a1', marginBottom: '10px', fontSize: 'clamp(14px, 4vw, 16px)', textAlign: 'left'}}>📐 Example:</h4>
            <p style={{fontSize: 'clamp(11px, 3.5vw, 14px)', textAlign: 'justify'}}>Find equation with x-intercept <strong>4</strong> and y-intercept <strong>-2</strong>.</p>
            <div style={{backgroundColor: '#fefce8', padding: 'clamp(8px, 3vw, 10px)', borderRadius: '8px', marginTop: '8px', textAlign: 'left'}}>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 14px)', textAlign: 'justify'}}><strong>Solution:</strong> Use intercept form: x/a + y/b = 1</p>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}><strong>Step 1.</strong> a = 4, b = -2</p>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}><strong>Step 2.</strong> Substitute: x/4 + y/(-2) = 1</p>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}><strong>Step 3.</strong> Multiply by 4: x - 2y = 4</p>
              <div style={{backgroundColor: '#dcfce7', padding: '8px', borderRadius: '6px', marginTop: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: 'clamp(12px, 4vw, 14px)'}}>
                x/4 + y/(-2) = 1 &nbsp;(intercept form)<br/>
                x - 2y = 4 &nbsp;(standard form)
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
    content: "Congratulations! You've mastered X and Y Intercepts!", 
    result: "Intercept Form: x/a + y/b = 1", 
    note: "The intercept form x/a + y/b = 1 is perfect when you know both intercepts!", 
    type: "complete" 
  });

  const avatarMessages = { 
    happy: ["📐 Excellent!", "✨ Perfect!", "🌟 Great job!", "💫 You're an expert!", "📏 Intercepts are easy!", "🏆 Amazing!", "🎉 +600 XP awaits!"], 
    wrong: ["🤔 Oops! Review x/a + y/b = 1!", "💡 Almost there!", "📚 Not quite right.", "✨ Don't give up!", "🎯 Keep trying!"], 
    info: ["💡 Remember: x/a + y/b = 1!", "📈 a is x-intercept, b is y-intercept!", "🔢 Intercepts are where line crosses axes!", "✨ Convert to standard form by multiplying!"] 
  };
  
  const getRandomMessage = (type) => avatarMessages[type][Math.floor(Math.random() * avatarMessages[type].length)];

  useEffect(() => {
    const checkCompletion = async () => {
      if (user?.dbId) {
        const { data } = await supabase.from('mission_progress').select('status').eq('mission_id', MISSION_ID).eq('student_id', user.dbId).maybeSingle();
        if (data?.status === 'completed') { 
          setIsAlreadyCompleted(true); 
          setShowRewardClaimed(true); 
          setCurrentStep(steps.length - 1); 
        }
      }
    };
    checkCompletion();
  }, [user?.dbId]);

  const handleResetMission = () => setShowResetConfirm(true);
  
  const confirmReset = async () => {
    try {
      if (user?.dbId) {
        await supabase.from('mission_progress').delete().eq('mission_id', MISSION_ID).eq('student_id', user.dbId);
      }
      setCurrentStep(0); 
      setAnswers({}); 
      setWrongFeedback({});
      setShowConfetti(false); 
      setFeedbackAvatar(null);
      setCanProceed(true); 
      setShowAvatarMessage(true); 
      setShowResetConfirm(false);
      setShowRewardClaimed(false); 
      setIsAlreadyCompleted(false);
      setCurrentAvatarMessage("🔄 Mission reset! Let's start fresh! 💪");
      setTimeout(() => setShowAvatarMessage(false), 3000);
    } catch (error) {
      console.error('Error resetting mission:', error);
    }
  };
  
  const cancelReset = () => {
    setShowResetConfirm(false);
    setCurrentAvatarMessage("👍 Great choice! Let's continue!");
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
        setCurrentAvatarMessage("🎉 Complete the mission to claim your reward!");
        setShowAvatarMessage(true);
        setTimeout(() => setShowAvatarMessage(false), 3000);
      } else setShowAvatarMessage(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      const prevStep = steps[currentStep - 1];
      if (prevStep.type === 'quiz') {
        const prevAnswer = answers[currentStep - 1];
        setCanProceed(prevAnswer ? prevAnswer.isCorrect : true);
      } else setCanProceed(true);
      setFeedbackAvatar(null);
      setShowAvatarMessage(false);
    }
  };

  const saveMissionCompletion = async () => {
    if (!user?.dbId) return false;
    const { error } = await supabase.from('mission_progress').upsert({ 
      mission_id: MISSION_ID, student_id: user.dbId, status: 'completed', 
      completed_at: new Date().toISOString(), xp_earned: MISSION_XP 
    }, { onConflict: 'mission_id,student_id' });
    return !error;
  };

  const goToMissionsList = () => { if (onComplete) onComplete(); else navigate('/studenthub/missions'); };

  const handleComplete = async () => {
    if (isCompleting || isAlreadyCompleted) return;
    setIsCompleting(true); 
    setShowConfetti(true);
    setCurrentAvatarMessage(`🏆 CONGRATULATIONS! +${MISSION_XP} XP! 🎉`);
    setFeedbackAvatar('happy'); 
    setShowAvatarMessage(true);
    await saveMissionCompletion();
    const currentProgress = userData?.progress || {};
    const completedMissions = currentProgress.completedMissions || [];
    if (!completedMissions.includes(MISSION_ID) && updateUserData) {
      const newTotalXP = (userData?.xp || 0) + MISSION_XP;
      updateUserData({ 
        xp: newTotalXP, 
        progress: { ...currentProgress, missionsCompleted: (currentProgress.missionsCompleted || 0) + 1, completedMissions: [...completedMissions, MISSION_ID], lastMissionCompleted: new Date().toISOString() } 
      });
      window.dispatchEvent(new CustomEvent('xpUpdated', { detail: { newXP: newTotalXP, missionId: MISSION_ID } }));
    }
    setShowRewardClaimed(true); 
    setIsAlreadyCompleted(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    const currentAnswer = answers[currentStep];
    const wrongMsg = wrongFeedback[currentStep];

    switch (step.type) {
      case "lesson":
        return <div style={{wordBreak: 'break-word', textAlign: 'left'}}>{step.content}</div>;
      case "quiz":
        return (
          <div style={{textAlign: 'left'}}>
            <div style={{fontSize:'clamp(11px, 3.5vw, 13px)', color:'#8b5cf6', fontWeight:'bold', textAlign: 'left'}}>Question {currentStep - 1} of {questions.length}</div>
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
              <div style={{padding:'8px', backgroundColor:'#d1fae5', color:'#065f46', borderRadius:'8px', marginTop:'10px', fontSize:'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}>
                ✅ Correct! {step.explanation}
              </div>
            )}
            {currentAnswer && !currentAnswer.isCorrect && (
              <div style={{padding:'8px', backgroundColor:'#fee2e2', color:'#991b1b', borderRadius:'8px', marginTop:'10px', fontSize:'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}>
                ❌ Incorrect. {step.explanation}
              </div>
            )}
          </div>
        );
      case "complete":
        return (
          <div style={{textAlign: 'left'}}>
            {!showRewardClaimed ? (
              <>
                <p style={{fontSize:'clamp(14px, 4.5vw, 18px)', textAlign: 'justify'}}>{step.content}</p>
                <div style={{background:'#ede9fe', padding:'12px', borderRadius:'12px', margin:'12px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', flexWrap:'wrap'}}>
                  <span style={{fontSize:'clamp(20px, 6vw, 24px)'}}>📐</span>
                  <span style={{fontWeight:'bold', fontSize:'clamp(14px, 4vw, 18px)'}}>{step.result}</span>
                </div>
                <p style={{fontSize:'clamp(11px, 3.5vw, 13px)', fontStyle:'italic', textAlign: 'justify'}}>{step.note}</p>
                <div style={{background:'#ede9fe', padding:'12px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'14px'}}>
                  <span style={{fontSize:'clamp(20px, 6vw, 24px)'}}>🏆</span>
                  <span style={{fontWeight:'bold', fontSize:'clamp(14px, 4vw, 16px)'}}>+{MISSION_XP} XP!</span>
                </div>
                <button style={{width:'100%', padding:'clamp(10px, 3vw, 14px)', backgroundColor:'#8b5cf6', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', fontSize:'clamp(14px, 4vw, 16px)', textAlign: 'center'}} onClick={handleComplete} disabled={isCompleting}>
                  {isCompleting ? "Completing..." : "🎁 Claim Reward"}
                </button>
              </>
            ) : (
              <>
                <div style={{backgroundColor:'#ede9fe', padding:'12px', borderRadius:'12px', marginBottom:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', flexWrap:'wrap'}}>
                  <span style={{fontSize:'clamp(20px, 6vw, 24px)'}}>✅</span>
                  <p style={{fontSize:'clamp(12px, 4vw, 14px)', fontWeight:'bold', color:'#5b21b6', margin:0, textAlign: 'center'}}>Completed! +{MISSION_XP} XP!</p>
                </div>
                <div style={{background:'#ede9fe', padding:'12px', borderRadius:'12px', margin:'12px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', flexWrap:'wrap'}}>
                  <span style={{fontSize:'clamp(20px, 6vw, 24px)'}}>📐</span>
                  <span style={{fontWeight:'bold', fontSize:'clamp(14px, 4vw, 18px)'}}>{step.result}</span>
                </div>
                <button style={{width:'100%', padding:'clamp(10px, 3vw, 14px)', backgroundColor:'#6b7280', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', fontSize:'clamp(14px, 4vw, 16px)', textAlign: 'center'}} onClick={goToMissionsList}>
                  📋 Back to Missions
                </button>
              </>
            )}
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

  if (isAlreadyCompleted && currentStep !== steps.length - 1 && !showRewardClaimed) { 
    setTimeout(() => { setCurrentStep(steps.length - 1); setShowRewardClaimed(true); }, 100); 
    return null; 
  }

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
            🎉 +{MISSION_XP} XP! 🎉<br />X & Y Intercepts Mastered! 📐
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'16px'}}>
          <div style={{backgroundColor:'white', borderRadius:'16px', padding:'20px', maxWidth:'300px', width:'90%', textAlign:'center'}}>
            <h3 style={{fontSize:'18px', marginBottom:'10px', color:'#ef4444'}}>🔄 Reset Mission?</h3>
            <p style={{fontSize:'13px', marginBottom:'18px'}}>Reset this mission? All progress will be lost.</p>
            <div style={{display:'flex', gap:'10px', justifyContent:'center', flexDirection:'column'}}>
              <button style={{backgroundColor:'#ef4444', color:'white', padding:'10px', borderRadius:'8px', border:'none', fontWeight:'bold'}} onClick={confirmReset}>Yes, Reset</button>
              <button style={{backgroundColor:'#6b7280', color:'white', padding:'10px', borderRadius:'8px', border:'none', fontWeight:'bold'}} onClick={cancelReset}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'8px'}}>
        {!showRewardClaimed && (
          <button style={{backgroundColor:'#ef4444', color:'white', padding:'6px 12px', borderRadius:'8px', border:'none', fontSize:'clamp(10px, 3vw, 12px)', fontWeight:'bold'}} onClick={handleResetMission}>🔄 Reset</button>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{width:'100%', height:'6px', backgroundColor:'#e5e7eb', borderRadius:'3px', marginBottom:'10px', overflow:'hidden'}}>
        <div style={{height:'100%', backgroundColor:'#8b5cf6', width:`${progressPercentage}%`, transition:'width 0.3s'}} />
      </div>

      {/* XP Preview for quiz steps */}
      {steps[currentStep].type === 'quiz' && !showRewardClaimed && (
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', fontSize:'clamp(10px, 3vw, 12px)', fontWeight:'bold', color:'#8b5cf6', background:'#ede9fe', padding:'6px 10px', borderRadius:'10px', textAlign: 'left'}}>
          <span>📐 Mastered: {questionsCompleted}/{questions.length}</span>
          <span style={{color:'#d97706'}}>✨ +{MISSION_XP} XP</span>
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
        {currentStep < steps.length - 1 && steps[currentStep].type !== 'complete' && !showRewardClaimed && (
          <div style={{display:'flex', justifyContent:'space-between', gap:'10px', marginTop:'10px'}}>
            {currentStep > 0 && <button style={{backgroundColor:'#6b7280', color:'white', padding:'8px 16px', borderRadius:'8px', border:'none', fontSize:'clamp(11px, 3.5vw, 13px)', fontWeight:'bold'}} onClick={handlePrevious}>← Prev</button>}
            <button style={{
              backgroundColor:'#8b5cf6', color:'white', padding:'8px 16px', borderRadius:'8px', border:'none', fontSize:'clamp(11px, 3.5vw, 13px)', fontWeight:'bold',
              ...(steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep]) ? {backgroundColor:'#c4b5fd', opacity:0.6} : {})
            }} onClick={handleNext} disabled={steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep])}>
              Next →
            </button>
          </div>
        )}
        
        <div style={{textAlign:'center', marginTop:'10px', fontSize:'clamp(9px, 3vw, 11px)', color:'#999'}}>
          {steps[currentStep].type === 'quiz' && !showRewardClaimed ? `Q${currentStep - 1}/${questions.length}` : `Step ${currentStep + 1}/${steps.length}`}
        </div>

        {/* Avatar Section - Below buttons, left aligned (same as other missions) */}
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

export default Mission5;