// src/missions/mission3.jsx - FULLY RESPONSIVE (optimized for 308x748 and all screen sizes)
// FIX: Avatar on left below Prev button, text justified, larger readable text, no scrolling
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Mission3({ user, userData, updateUserData, onComplete }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackAvatar, setFeedbackAvatar] = useState(null);
  const [canProceed, setCanProceed] = useState(true);
  const [showAvatarMessage, setShowAvatarMessage] = useState(true);
  const [currentAvatarMessage, setCurrentAvatarMessage] = useState("📐 Welcome! Ready to learn about Slope and a Point?");
  const [isCompleting, setIsCompleting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRewardClaimed, setShowRewardClaimed] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [showCheckPopup, setShowCheckPopup] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(null);
  const [pendingStepIndex, setPendingStepIndex] = useState(null);
  const [wrongFeedback, setWrongFeedback] = useState({});

  const MISSION_ID = 3;
  const MISSION_XP = 400;

  const questions = [
    {
      title: "Question 1: Point-Slope Form",
      question: "What is the formula of the point-slope form of a linear equation?",
      options: ["y = mx + b", "y - y₁ = m(x - x₁)", "y = x + b", "y₁ - y = m(x₁ - x)"],
      correct: 1,
      explanation: "Point-slope form uses a known slope m and a point (x₁, y₁): y - y₁ = m(x - x₁)."
    },
    {
      title: "Question 2: Slope Meaning",
      question: "What does the slope represent?",
      options: ["The y-intercept", "The highest point", "The rate of change", "The x-intercept"],
      correct: 2,
      explanation: "Slope tells how steep the line is or how y changes with respect to x."
    },
    {
      title: "Question 3: Equation with Slope 3",
      question: "What is the equation of a line with slope 3 passing through (2, -1)?",
      options: ["y - 1 = 3(x + 2)", "y + 1 = 3(x + 2)", "y - 1 = 3(x - 2)", "y + 1 = 3(x - 2)"],
      correct: 3,
      explanation: "Substitute m=3, x₁=2, y₁=-1: y - (-1) = 3(x - 2) → y + 1 = 3(x - 2)"
    },
    {
      title: "Question 4: Equation with Slope -4",
      question: "Find the equation of the line with slope -4 passing through (0, 5).",
      options: ["y - 5 = -4(x - 0)", "y + 5 = -4(x - 0)", "y - 5 = 4(x - 0)", "y + 5 = 4(x - 0)"],
      correct: 0,
      explanation: "Substitute m=-4, x₁=0, y₁=5: y - 5 = -4(x - 0)"
    },
    {
      title: "Question 5: Identify Slope",
      question: "In the equation y - 2 = 5(x - 1), what is the slope?",
      options: ["2", "1", "-5", "5"],
      correct: 3,
      explanation: "The slope is the coefficient of (x - x₁), which is 5."
    },
    {
      title: "Question 6: Positive vs Negative Slope",
      question: "How do the graphs of y - 3 = 2(x - 4) and y - 3 = -2(x - 4) differ?",
      options: ["Same line", "One increases, one decreases", "Both horizontal", "Overlap exactly"],
      correct: 1,
      explanation: "Positive slope rises from left to right; negative slope falls from left to right."
    },
    {
      title: "Question 7: Verify Equation",
      question: "Is the equation y - 5 = 3(x + 2) correct for slope 3 and point (-2, 5)?",
      options: ["No, slope wrong", "Yes, follows formula", "No, point incorrect", "Yes, but only after simplifying"],
      correct: 1,
      explanation: "x + 2 is the same as x - (-2), so it is correct for point (-2, 5)."
    },
    {
      title: "Question 8: Correct Equation",
      question: "Which is the correct equation for slope 1 and point (3, 2)?",
      options: ["y + 2 = 1(x - 3)", "y - 3 = 1(x - 2)", "y - 2 = 1(x - 3)", "y + 3 = 1(x + 2)"],
      correct: 2,
      explanation: "Substitute correctly: y - y₁ = m(x - x₁) → y - 2 = 1(x - 3)"
    },
    {
      title: "Question 9: Identify Point-Slope Form",
      question: "Which is a correct example of a point-slope equation?",
      options: ["y = 4x + 2", "y - 4 = 2(x - 1)", "y = x - 5", "y = 3x"],
      correct: 1,
      explanation: "y - 4 = 2(x - 1) is in point-slope form: y - y₁ = m(x - x₁)."
    },
    {
      title: "Question 10: Real World Application",
      question: "Which situation can be modeled using point-slope form?",
      options: ["Circle's radius changing", "Constant value not changing", "Random pattern", "Decreasing temperature at constant rate"],
      correct: 3,
      explanation: "Linear equations represent constant rate of change, which can be modeled using point-slope form."
    }
  ];

  const steps = [
    { 
      title: "📐 SLOPE AND A POINT MISSION", 
      content: "Welcome to the Slope and a Point mission! Learn how to find the equation of a line using a given slope and a point.", 
      description: "The point-slope form is: y - y₁ = m(x - x₁). Let's master this concept!", 
      type: "info" 
    },
    {
      title: "Lesson: Slope and a Point",
      content: (
        <div style={{wordBreak: 'break-word', textAlign: 'left'}}>
          <p style={{marginBottom: '10px', fontSize: 'clamp(12px, 4vw, 16px)', textAlign: 'justify'}}>
            <strong>Slope (m)</strong> and <strong>a point (x₁, y₁)</strong> can be used to find the equation of a line using the <strong>Point-Slope Form</strong>.
          </p>
          <div style={{textAlign: 'center', margin: '10px 0', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '10px'}}>
            <img src="/image.png" alt="Slope and Point Graph" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}}
              onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect width='500' height='300' fill='%23f3f4f6'/%3E%3Cline x1='100' y1='200' x2='400' y2='50' stroke='%2310b981' stroke-width='3'/%3E%3Ccircle cx='120' cy='190' r='6' fill='%23ef4444'/%3E%3Ctext x='110' y='180' font-size='12' fill='%23ef4444'%3E(1,5)%3C/text%3E%3Ctext x='250' y='280' text-anchor='middle' fill='%23666' font-size='14'%3ESlope = -2, Point (1, 5)%3C/text%3E%3C/svg%3E"; }} />
            <p style={{fontSize: 'clamp(10px, 3vw, 12px)', color: '#6b7280', marginTop: '6px', fontStyle: 'italic', textAlign: 'center'}}>Figure 1: Line with slope -2 passing through point (1, 5)</p>
          </div>
          <div style={{backgroundColor: '#f0f9ff', padding: 'clamp(8px, 3vw, 12px)', borderRadius: '10px', marginTop: '12px', textAlign: 'left'}}>
            <h4 style={{color: '#0369a1', marginBottom: '10px', fontSize: 'clamp(14px, 4vw, 16px)', textAlign: 'left'}}>📐 Example:</h4>
            <p style={{fontSize: 'clamp(11px, 3.5vw, 14px)', textAlign: 'justify'}}>Write the equation of a line with slope <strong>-2</strong> through point <strong>(1, 5)</strong>.</p>
            <div style={{backgroundColor: '#fefce8', padding: 'clamp(8px, 3vw, 10px)', borderRadius: '8px', marginTop: '8px', textAlign: 'left'}}>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 14px)', textAlign: 'justify'}}><strong>Solution:</strong> Use <strong>Point-slope Form</strong>: y - y₁ = m(x - x₁)</p>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}><strong>Step 1.</strong> m = -2, x₁ = 1, y₁ = 5</p>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}><strong>Step 2.</strong> Substitute: y - 5 = -2(x - 1)</p>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}><strong>Step 3.</strong> Distribute: y - 5 = -2x + 2</p>
              <p style={{fontSize: 'clamp(11px, 3.5vw, 13px)', textAlign: 'justify'}}><strong>Step 4.</strong> Add 5: y = -2x + 7</p>
              <div style={{backgroundColor: '#dcfce7', padding: '8px', borderRadius: '6px', marginTop: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: 'clamp(12px, 4vw, 14px)'}}>
                y = -2x + 7 &nbsp;&nbsp;or&nbsp;&nbsp; 2x + y = 7
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
    content: "Congratulations! You've mastered the Slope and a Point mission!", 
    result: "Point-Slope Form: y - y₁ = m(x - x₁)", 
    note: "The point-slope form is a powerful tool for finding linear equations!", 
    type: "complete" 
  });

  const avatarMessages = {
    happy: ["📐 Excellent!", "✨ Perfect!", "🌟 Great job!", "💫 You're an expert!", "📏 Slope is rising!", "🏆 Amazing!", "🎉 +400 XP awaits!"],
    wrong: ["🤔 Oops! Review point-slope form!", "💡 Almost there! y - y₁ = m(x - x₁)", "📚 Not quite right.", "✨ Don't give up!", "🎯 Keep trying!", "💪 Every mistake teaches us!"],
    info: ["💡 Remember: y - y₁ = m(x - x₁)!", "📐 Positive slope rises, negative falls!", "🔢 Slope m tells steepness!", "✨ Practice substituting values!"]
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
      case "info":
        return (
          <div style={{textAlign: 'left'}}>
            <p style={{fontSize: 'clamp(13px, 4vw, 16px)', lineHeight: '1.4', textAlign: 'justify'}}>{step.content}</p>
            <p style={{fontSize: 'clamp(12px, 3.5vw, 15px)', marginTop: '8px', textAlign: 'justify'}}>{step.description}</p>
            <div style={{backgroundColor: '#f3f4f6', padding: '10px', borderRadius: '10px', textAlign: 'center', marginTop: '12px'}}>
              <p style={{fontSize: 'clamp(12px, 4vw, 14px)', fontFamily: 'monospace', fontWeight: 'bold', color: '#10b981'}}>
                Point-Slope Form: y - y₁ = m(x - x₁)
              </p>
            </div>
            <div style={{display:'flex', gap:'12px', justifyContent:'center', margin:'12px 0'}}>
              <span style={{fontSize: 'clamp(24px, 8vw, 32px)'}}>📐</span>
              <span style={{fontSize: 'clamp(24px, 8vw, 32px)'}}>📏</span>
              <span style={{fontSize: 'clamp(24px, 8vw, 32px)'}}>✨</span>
            </div>
            <div style={{background:'#fef3c7', padding:'10px', borderRadius:'10px', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'6px', fontSize:'clamp(11px, 3.5vw, 14px)', textAlign: 'left'}}>
              <span>🏆 Complete all questions to earn</span>
              <span style={{fontWeight:'bold', color:'#d97706'}}>+{MISSION_XP} XP!</span>
            </div>
          </div>
        );
      case "lesson":
        return <div style={{wordBreak: 'break-word', textAlign: 'left'}}>{step.content}</div>;
      case "quiz":
        return (
          <div style={{textAlign: 'left'}}>
            <div style={{fontSize:'clamp(11px, 3.5vw, 13px)', color:'#10b981', fontWeight:'bold', textAlign: 'left'}}>Question {currentStep - 1} of {questions.length}</div>
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
                <div style={{background:'#fef3c7', padding:'12px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'14px'}}>
                  <span style={{fontSize:'clamp(20px, 6vw, 24px)'}}>🏆</span>
                  <span style={{fontWeight:'bold', fontSize:'clamp(14px, 4vw, 16px)'}}>+{MISSION_XP} XP Reward!</span>
                </div>
                <button style={{width:'100%', padding:'clamp(10px, 3vw, 14px)', backgroundColor:'#10b981', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', fontSize:'clamp(14px, 4vw, 16px)', textAlign: 'center'}} onClick={handleComplete} disabled={isCompleting}>
                  {isCompleting ? "Completing..." : "🎁 Claim Your Reward"}
                </button>
              </>
            ) : (
              <>
                <div style={{backgroundColor:'#d1fae5', padding:'12px', borderRadius:'12px', marginBottom:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', flexWrap:'wrap'}}>
                  <span style={{fontSize:'clamp(20px, 6vw, 24px)'}}>✅</span>
                  <p style={{fontSize:'clamp(12px, 4vw, 14px)', fontWeight:'bold', color:'#065f46', margin:0, textAlign: 'center'}}>Mission Completed! +{MISSION_XP} XP!</p>
                </div>
                <div style={{background:'#ede9fe', padding:'12px', borderRadius:'12px', margin:'12px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', flexWrap:'wrap'}}>
                  <span style={{fontSize:'clamp(20px, 6vw, 24px)'}}>📐</span>
                  <span style={{fontWeight:'bold', fontSize:'clamp(14px, 4vw, 18px)'}}>{step.result}</span>
                </div>
                <button style={{width:'100%', padding:'clamp(10px, 3vw, 14px)', backgroundColor:'#6b7280', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', fontSize:'clamp(14px, 4vw, 16px)', textAlign: 'center'}} onClick={goToMissionsList}>
                  📋 Back to All Missions
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
              <button style={{backgroundColor:'#10b981', color:'white', padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', fontSize:'14px'}} onClick={confirmAnswer}>Yes, Check Answer</button>
              <button style={{backgroundColor:'#6b7280', color:'white', padding:'12px', borderRadius:'10px', border:'none', fontWeight:'bold', fontSize:'14px'}} onClick={cancelAnswer}>No, Let me review</button>
            </div>
          </div>
        </div>
      )}

      {showConfetti && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
          <div style={{backgroundColor:'white', padding:'20px', borderRadius:'16px', textAlign:'center', maxWidth:'90%', fontSize:'clamp(14px, 4vw, 18px)'}}>
            🎉 +{MISSION_XP} XP! 🎉<br />Slope and a Point Mastered! 📐
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
        <div style={{height:'100%', backgroundColor:'#10b981', width:`${progressPercentage}%`, transition:'width 0.3s'}} />
      </div>

      {/* XP Preview for quiz steps */}
      {steps[currentStep].type === 'quiz' && !showRewardClaimed && (
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', fontSize:'clamp(10px, 3vw, 12px)', fontWeight:'bold', color:'#10b981', background:'#d1fae5', padding:'6px 10px', borderRadius:'10px', textAlign: 'left'}}>
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
              backgroundColor:'#10b981', color:'white', padding:'8px 16px', borderRadius:'8px', border:'none', fontSize:'clamp(11px, 3.5vw, 13px)', fontWeight:'bold',
              ...(steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep]) ? {backgroundColor:'#9ca3af', opacity:0.6} : {})
            }} onClick={handleNext} disabled={steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep])}>
              Next →
            </button>
          </div>
        )}
        
        <div style={{textAlign:'center', marginTop:'10px', fontSize:'clamp(9px, 3vw, 11px)', color:'#999'}}>
          {steps[currentStep].type === 'quiz' && !showRewardClaimed ? `Q${currentStep - 1}/${questions.length}` : `Step ${currentStep + 1}/${steps.length}`}
        </div>

        {/* Avatar Section - Below buttons, left aligned (same as mission2) */}
        <div style={{marginTop:'20px', paddingTop:'14px', borderTop:'1px solid #e5e7eb', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'12px'}}>
          {/* Speech Bubble */}
          <div style={{width:'100%', maxWidth:'280px'}}>
            {showAvatarMessage && currentAvatarMessage && !showCheckPopup && (
              <div style={{backgroundColor:'white', padding:'10px 14px', borderRadius:'20px', boxShadow:'0 2px 10px rgba(0,0,0,0.1)', border:'2px solid #10b981', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px'}}>
                <span style={{fontSize:'clamp(11px, 3.5vw, 13px)', color:'#333', flex:1, lineHeight:'1.4', textAlign: 'left'}}>{currentAvatarMessage}</span>
                <button onClick={() => setShowAvatarMessage(false)} style={{background:'none', border:'none', fontSize:'12px', color:'#999', cursor:'pointer'}}>✕</button>
              </div>
            )}
            {!showAvatarMessage && !showCheckPopup && (
              <button onClick={() => { setShowAvatarMessage(true); setCurrentAvatarMessage(getRandomMessage('info')); }} style={{borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer', backgroundColor:'#10b981', color:'white', border:'none', fontSize:'20px', display:'flex', alignItems:'center', justifyContent:'center'}}>💬</button>
            )}
          </div>
          
          {/* Avatar Image */}
          <div style={{width:'clamp(70px, 15vw, 90px)', height:'clamp(70px, 15vw, 90px)', borderRadius:'50%', overflow:'hidden', backgroundColor:'#f0f0f0', boxShadow:'0 2px 10px rgba(0,0,0,0.2)', border:'3px solid white'}}>
            <img src={getAvatarImage()} alt="Assistant" style={{width:'100%', height:'100%', objectFit:'cover'}}
              onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2310b981'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"; }} />
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

export default Mission3;