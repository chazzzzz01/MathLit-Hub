// src/missions/mission2.jsx
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

  // Questions with correct answers randomized in different positions
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
      question: "Two lines pass through the points (1, 3) & (3, 7) and (2, 4) & (4, 8). What can you conclude about the two lines?",
      options: [
        "The lines intersect at one point",
        "The lines are perpendicular",
        "The lines are parallel",
        "The lines are the same"
      ],
      correct: 2,
      explanation: "First line slope = (7-3)/(3-1)=4/2=2, Second line slope = (8-4)/(4-2)=4/2=2. Both lines have the same slope, which means they are parallel."
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
      explanation: "Slope = (0-4)/(4-0) = -4/4 = -1. When x=0, y=4 gives (0,4). When x=4, y=0 gives (4,0). Both points satisfy y = -x + 4."
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
        <div>
          <p style={{ marginBottom: '15px', fontSize: '14px', color: '#555' }}>
            <strong>LINEAR EQUATION</strong> is a first-degree polynomial involving two variables, and its graph forms a straight line.
          </p>
          <p style={{ marginBottom: '15px', fontSize: '14px', color: '#555' }}>
            Its standard form is expressed as <strong>Ax + By = C</strong>. The equation of a line can be found using different methods, such as Two given points, a Slope with a Point, or a Slope-Intercept Form and the x- and y-Intercepts.
          </p>
          
          {/* Main Graph Image */}
          <div style={styles.imageContainer}>
            <img 
              src="/pics.png" 
              alt="Linear Equation Graph"
              style={styles.lessonImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect width='500' height='300' fill='%23f3f4f6'/%3E%3Cline x1='100' y1='200' x2='400' y2='100' stroke='%238b5cf6' stroke-width='3'/%3E%3Ccircle cx='120' cy='190' r='6' fill='%23ef4444'/%3E%3Ctext x='110' y='180' font-size='12' fill='%23ef4444'%3E(1,2)%3C/text%3E%3Ccircle cx='380' cy='110' r='6' fill='%23ef4444'/%3E%3Ctext x='370' y='100' font-size='12' fill='%23ef4444'%3E(5,-2)%3C/text%3E%3Ctext x='250' y='280' text-anchor='middle' fill='%23666' font-size='14'%3ELine: y = -x + 3%3C/text%3E%3C/svg%3E";
              }}
            />
            <p style={styles.imageCaption}>Figure 1: Line passing through points (1, 2) and (5, -2)</p>
          </div>
          
          <div style={styles.exampleBox}>
            <h4 style={styles.exampleTitle}>📐 Mission: Equation of a Line Using Two Points</h4>
            <p><strong>Two points:</strong> (x₁, y₁) and (x₂, y₂)</p>
            <p><strong>Example:</strong> Find the equation of the line that passes through the points (1, 2) and (5, -2).</p>
            
            <div style={styles.solutionBox}>
              <p><strong>Solution:</strong> Since two points are given (1, 2) and (5, -2), we will use the <strong>Two-point Form</strong> defined as:</p>
              <div style={styles.formulaBox}>
                <strong>y - y₁ = (y₂ - y₁)/(x₂ - x₁) × (x - x₁)</strong>
              </div>
              
              <p><strong>Step 1. Identify (x₁, y₁) and (x₂, y₂) using the given two points (1, 2) and (5, -2).</strong></p>
              <p>✓ x₁ = 1 and y₁ = 2 ; x₂ = 5 and y₂ = -2</p>
              
              {/* pic1.png - Step 1 Image */}
              <div style={styles.imageContainer}>
                <img 
                  src="/pic1.png" 
                  alt="Step 1: Identifying points (1,2) and (5,-2)"
                  style={styles.stepImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f0f9ff'/%3E%3Ctext x='200' y='80' text-anchor='middle' font-size='16' fill='%23333'%3EStep 1: Identify Points%3C/text%3E%3Ctext x='200' y='110' text-anchor='middle' font-size='14' fill='%23666'%3E(x₁, y₁) = (1, 2)%3C/text%3E%3Ctext x='200' y='130' text-anchor='middle' font-size='14' fill='%23666'%3E(x₂, y₂) = (5, -2)%3C/text%3E%3C/svg%3E";
                  }}
                />
                <p style={styles.imageCaption}>Step 1: Identifying the coordinates of the two points</p>
              </div>
              
              <p><strong>Step 2. Substitute these values into the formula:</strong></p>
              <div style={styles.formulaBox}>
                y - (2) = [(-2) - (2)]/[(5) - (1)] × (x - (1))
              </div>
              
              {/* pic2.png - Step 2 Image */}
              <div style={styles.imageContainer}>
                <img 
                  src="/pic2.png" 
                  alt="Step 2: Substituting values into the formula"
                  style={styles.stepImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f0f9ff'/%3E%3Ctext x='200' y='60' text-anchor='middle' font-size='16' fill='%23333'%3EStep 2: Substitute Values%3C/text%3E%3Ctext x='200' y='90' text-anchor='middle' font-size='13' fill='%238b5cf6'%3Ey - y₁ = (y₂ - y₁)/(x₂ - x₁) × (x - x₁)%3C/text%3E%3Ctext x='200' y='115' text-anchor='middle' font-size='13' fill='%23666'%3Ey - (2) = ((-2) - (2))/((5) - (1)) × (x - (1))%3C/text%3E%3C/svg%3E";
                  }}
                />
                <p style={styles.imageCaption}>Step 2: Substituting x₁=1, y₁=2, x₂=5, y₂=-2 into the formula</p>
              </div>
              
              <p><strong>Step 3. Simplify:</strong></p>
              <div style={styles.formulaBox}>
                y - (2) = (-4)/(4) × (x - (1))
              </div>
              
              {/* pic3.png - Step 3 Image */}
              <div style={styles.imageContainer}>
                <img 
                  src="/pic3.png" 
                  alt="Step 3: Simplifying the slope"
                  style={styles.stepImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f0f9ff'/%3E%3Ctext x='200' y='60' text-anchor='middle' font-size='16' fill='%23333'%3EStep 3: Simplify%3C/text%3E%3Ctext x='200' y='90' text-anchor='middle' font-size='13' fill='%238b5cf6'%3Ey - 2 = (-4)/(4) × (x - 1)%3C/text%3E%3Ctext x='200' y='115' text-anchor='middle' font-size='13' fill='%23666'%3Ey - 2 = -1 × (x - 1)%3C/text%3E%3Ctext x='200' y='140' text-anchor='middle' font-size='13' fill='%23666'%3Ey - 2 = -x + 1%3C/text%3E%3C/svg%3E";
                  }}
                />
                <p style={styles.imageCaption}>Step 3: Simplifying (-2-2) = -4 and (5-1) = 4, then dividing</p>
              </div>
              
              <p><strong>Step 4. Apply Distributive property:</strong></p>
              <div style={styles.formulaBox}>
                y - 2 = -x + 1
              </div>
              
              <p><strong>Step 5. Apply Addition Property of Equality:</strong></p>
              <div style={styles.formulaBox}>
                y - 2 + 2 = -x + 1 + 2<br/>
                y = -x + 3
              </div>
              
              <p><strong>Thus, the equation of the line that passes through the points (1, 2) and (5, -2) is:</strong></p>
              <div style={styles.resultBox}>
                y = -x + 3 &nbsp;&nbsp;or&nbsp;&nbsp; x + y = 3 (standard form)
              </div>
            </div>
          </div>
        </div>
      ),
      type: "lesson"
    }
  ];

  // Add quiz steps dynamically from questions array
  for (let i = 0; i < questions.length; i++) {
    steps.push({
      ...questions[i],
      type: "quiz"
    });
  }

  // Add complete step
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
      "📚 Excellent! One step closer to wizardry!",
      "🏆 Magical performance! +250 XP awaits!"
    ],
    wrong: [
      "🤔 Oops! Let's review the linear equation concept!",
      "💡 Almost there! Try casting the spell again!",
      "📚 Not quite right. Check your understanding!",
      "✨ Don't give up! Practice makes perfect!",
      "🎯 Keep trying! The magic is within you!",
      "💪 Every wizard makes mistakes! Try again!",
      "🌟 Focus your magical energy!"
    ],
    info: [
      "💡 Remember: Linear equations have a constant slope!",
      "🧙 A true wizard masters the standard form Ax + By = C!",
      "🔮 Two points uniquely determine a line!",
      "✨ Practice finding slope using the formula m = (y₂-y₁)/(x₂-x₁)!",
      "📚 Keep practicing your linear equation skills!"
    ]
  };

  const getRandomMessage = (type) => {
    const messages = avatarMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleResetMission = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    setIsResetting(true);
    
    try {
      // Delete mission progress from database
      if (user?.dbId) {
        const { error } = await supabase
          .from('mission_progress')
          .delete()
          .eq('mission_id', 2)
          .eq('student_id', user.dbId);
        
        if (error) {
          console.error('Error resetting mission in database:', error);
        }
      }
      
      // Reset local state
      setCurrentStep(0);
      setAnswers({});
      setShowConfetti(false);
      setFeedbackAvatar(null);
      setCanProceed(true);
      setShowAvatarMessage(true);
      setShowResetConfirm(false);
      setCurrentAvatarMessage("🔄 Mission reset! Let's start fresh! You can do this! 💪");
      
      setTimeout(() => {
        setShowAvatarMessage(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error resetting mission:', error);
      setCurrentAvatarMessage("❌ Failed to reset. Please try again!");
    } finally {
      setIsResetting(false);
    }
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
    setCurrentAvatarMessage("👍 Great choice! Let's continue with your wizard training!");
    setShowAvatarMessage(true);
    setTimeout(() => {
      setShowAvatarMessage(false);
    }, 2000);
  };

  const handleAnswer = (stepIndex, answerIndex) => {
    const step = steps[stepIndex];
    const isCorrect = answerIndex === step.correct;
    
    const messageType = isCorrect ? 'happy' : 'wrong';
    const randomMessage = getRandomMessage(messageType);
    setCurrentAvatarMessage(randomMessage);
    
    setFeedbackAvatar(isCorrect ? 'happy' : 'wrong');
    setCanProceed(isCorrect);
    setShowAvatarMessage(true);
    
    setAnswers({
      ...answers,
      [stepIndex]: {
        selected: answerIndex,
        isCorrect: isCorrect
      }
    });
    
    setTimeout(() => {
      setFeedbackAvatar(null);
    }, 3000);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      if (steps[currentStep].type === 'quiz') {
        if (!answers[currentStep]) {
          setCurrentAvatarMessage("🤔 Please select an answer first!");
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

  // Save mission completion to database and update XP
  const saveMissionCompletion = async () => {
    try {
      console.log('Saving mission 2 completion to database...');
      
      // Check if already saved
      const { data: existing, error: checkError } = await supabase
        .from('mission_progress')
        .select('id')
        .eq('mission_id', 2)
        .eq('student_id', user?.dbId)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing mission:', checkError);
      }
      
      if (!existing) {
        // Insert new record
        const { error: insertError } = await supabase
          .from('mission_progress')
          .insert({
            mission_id: 2,
            student_id: user?.dbId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            xp_earned: 250,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error inserting mission progress:', insertError);
          return false;
        }
      } else {
        // Update existing record
        const { error: updateError } = await supabase
          .from('mission_progress')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            xp_earned: 250,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (updateError) {
          console.error('Error updating mission progress:', updateError);
          return false;
        }
      }
      
      console.log('Mission 2 saved to database successfully!');
      return true;
      
    } catch (error) {
      console.error('Error in saveMissionCompletion:', error);
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
    const currentMissionsCompleted = currentProgress.missionsCompleted || 0;
    const currentTotalXP = userData?.xp || 0;
    
    // Check if mission is already completed
    if (!completedMissions.includes(2)) {
      const newTotalXP = currentTotalXP + 250;
      const newMissionsCompleted = currentMissionsCompleted + 1;
      
      // Save to database
      const savedToDB = await saveMissionCompletion();
      
      if (savedToDB) {
        console.log('✅ Mission 2 saved to database with 250 XP');
      } else {
        console.warn('⚠️ Failed to save to database, but continuing with local update');
      }
      
      // Update local state and context
      if (updateUserData) {
        updateUserData({
          xp: newTotalXP,
          progress: {
            ...currentProgress,
            missionsCompleted: newMissionsCompleted,
            completedMissions: [...completedMissions, 2],
            lastMissionCompleted: new Date().toISOString(),
            totalXP: newTotalXP
          }
        });
      }
      
      // Update localStorage
      if (user?.email) {
        const currentStoredXP = parseInt(localStorage.getItem(`userXP_${user.email}`) || '0');
        localStorage.setItem(`userXP_${user.email}`, (currentStoredXP + 250).toString());
        localStorage.setItem('userXP', (currentStoredXP + 250).toString());
      }
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('xpUpdated', { 
        detail: { newXP: newTotalXP, missionId: 2, xpEarned: 250 }
      }));
      
      // Dispatch classDeleted event to trigger refresh in Missions component
      window.dispatchEvent(new CustomEvent('classDeleted', {
        detail: { classId: 'mission2', timestamp: Date.now() }
      }));
    }
    
    // Navigate back to missions after 3 seconds
    setTimeout(() => {
      if (onComplete) {
        onComplete(true);
      } else {
        navigate('/studenthub/missions');
      }
    }, 3000);
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    const currentAnswer = answers[currentStep];

    switch (step.type) {
      case "info":
        return (
          <div style={styles.infoContent}>
            <p style={styles.contentText}>{step.content}</p>
            <p style={styles.descriptionText}>{step.description}</p>
            <div style={styles.wizardContainer}>
              <div style={styles.wizardBadge}>🧙</div>
              <div style={styles.wizardBadge}>🔮</div>
              <div style={styles.wizardBadge}>✨</div>
            </div>
            <div style={styles.rewardPreview}>
              <span>🏆 Complete all questions to earn</span>
              <span style={styles.rewardPreviewAmount}>+250 XP!</span>
            </div>
          </div>
        );
      
      case "lesson":
        return (
          <div style={styles.lessonContent}>
            {step.content}
          </div>
        );

      case "quiz":
        return (
          <div style={styles.quizContent}>
            <div style={styles.equationNumber}>
              Question {currentStep - 1} of {questions.length}
            </div>
            <p style={styles.questionText}>{step.question}</p>
            <div style={styles.optionsContainer}>
              {step.options.map((option, idx) => (
                <label 
                  key={idx} 
                  style={{
                    ...styles.optionLabel,
                    ...(currentAnswer && currentAnswer.selected === idx && idx === step.correct ? styles.correctOption : {}),
                    ...(currentAnswer && currentAnswer.selected === idx && idx !== step.correct ? styles.wrongOption : {})
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${currentStep}`}
                    value={idx}
                    checked={currentAnswer && currentAnswer.selected === idx}
                    onChange={() => handleAnswer(currentStep, idx)}
                    style={styles.radio}
                  />
                  <span style={styles.optionText}>{option}</span>
                </label>
              ))}
            </div>
            {currentAnswer && (
              <div style={currentAnswer.isCorrect ? styles.correctFeedback : styles.incorrectFeedback}>
                {currentAnswer.isCorrect ? 
                  `✅ Correct! ${step.explanation}` : 
                  `❌ Incorrect. ${step.explanation}`}
              </div>
            )}
          </div>
        );

      case "complete":
        return (
          <div style={styles.completeContent}>
            <p style={styles.completeText}>{step.content}</p>
            <div style={styles.resultBox}>
              <span style={styles.resultIcon}>📐</span>
              <span style={styles.resultText}>{step.result}</span>
            </div>
            <p style={styles.noteText}>{step.note}</p>
            <div style={styles.rewardBox}>
              <span style={styles.rewardIcon}>🏆</span>
              <span style={styles.rewardText}>+250 XP Earned!</span>
            </div>
            <button 
              style={styles.finishButton} 
              onClick={handleComplete} 
              disabled={isCompleting}
            >
              {isCompleting ? "Completing..." : "Claim Your Wizard Reward"}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const getAvatarImage = () => {
    if (feedbackAvatar === 'happy') return '/avatar_happy.jpg';
    if (feedbackAvatar === 'wrong') return '/avatar_wrong.jpg';
    return '/avatar_happy.jpg';
  };

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const questionsCompleted = Object.keys(answers).filter(key => answers[key] && answers[key].isCorrect).length;
  const XP_REWARD = 250;
  const totalQuestions = questions.length;

  return (
    <div style={styles.container}>
      {showConfetti && (
        <div style={styles.confettiOverlay}>
          <div style={styles.confettiMessage}>
            🎉 Mission Complete! 🎉
            <br />
            You earned 250 XP!
            <br />
            You are now a Math Wizard! 🧙
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>🔄 Reset Mission?</h3>
            <p style={styles.modalText}>Are you sure you want to reset this mission? All your progress will be lost.</p>
            <div style={styles.modalButtons}>
              <button 
                style={styles.confirmResetBtn} 
                onClick={confirmReset}
                disabled={isResetting}
              >
                {isResetting ? 'Resetting...' : 'Yes, Reset'}
              </button>
              <button style={styles.cancelResetBtn} onClick={cancelReset}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={styles.headerRow}>
        <button style={styles.resetButton} onClick={handleResetMission} title="Reset Mission">
          🔄 Reset Mission
        </button>
      </div>

      <div style={styles.progressBar}>
        <div 
          style={{
            ...styles.progressFill,
            width: `${progressPercentage}%`
          }}
        />
      </div>

      {steps[currentStep].type === 'quiz' && (
        <div style={styles.equationProgress}>
          <span>🧙 Questions Mastered: {questionsCompleted}/{totalQuestions}</span>
          <span style={styles.xpPreview}>✨ +{XP_REWARD} XP upon completion</span>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={styles.title}>{steps[currentStep].title}</h2>
        
        <div style={styles.scrollableContent}>
          {renderStepContent()}
        </div>
        
        <div style={styles.buttonContainer}>
          {currentStep > 0 && (
            <button style={styles.prevButton} onClick={handlePrevious}>
              ← Previous
            </button>
          )}
          
          {currentStep < steps.length - 1 && steps[currentStep].type !== 'complete' && (
            <button 
              style={{
                ...styles.nextButton,
                ...(steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep]) ? styles.disabledButton : {})
              }}
              onClick={handleNext}
              disabled={steps[currentStep].type === 'quiz' && (!canProceed || !answers[currentStep])}
            >
              Next →
            </button>
          )}
        </div>
        
        <div style={styles.stepIndicator}>
          {steps[currentStep].type === 'quiz' 
            ? `Question ${currentStep - 1} of ${totalQuestions}` 
            : `Step ${currentStep + 1} of ${steps.length}`}
        </div>
      </div>

      {/* Avatar Assistant at Bottom */}
      <div style={styles.avatarContainer}>
        <div style={styles.bubbleContainer}>
          {showAvatarMessage && currentAvatarMessage && (
            <div style={styles.speechBubble}>
              <span style={styles.bubbleText}>{currentAvatarMessage}</span>
              <button 
                onClick={() => setShowAvatarMessage(false)} 
                style={styles.closeBubble}
              >
                ✕
              </button>
            </div>
          )}
          {!showAvatarMessage && (
            <button 
              onClick={() => {
                setShowAvatarMessage(true);
                setCurrentAvatarMessage(getRandomMessage('info'));
              }} 
              style={styles.reopenBubble}
            >
              💬
            </button>
          )}
        </div>

        <div style={styles.avatarWrapper}>
          <img
            src={getAvatarImage()}
            alt="Learning Assistant"
            style={styles.avatarImage}
            onError={(e) => {
              e.target.onerror = null;
              if (feedbackAvatar === 'happy') {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%232563eb'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
              } else if (feedbackAvatar === 'wrong') {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23ef4444'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 70 L65 70' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
              } else {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%232563eb'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    flexDirection: 'column',
  },
  
  headerRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '10px',
  },
  
  resetButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    marginBottom: '10px',
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    transition: 'width 0.3s ease',
    borderRadius: '4px',
  },
  
  equationProgress: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#8b5cf6',
    padding: '8px 12px',
    backgroundColor: '#ede9fe',
    borderRadius: '8px',
  },
  
  xpPreview: {
    color: '#d97706',
    fontSize: '12px',
  },
  
  rewardPreview: {
    marginTop: '20px',
    padding: '12px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  rewardPreviewAmount: {
    fontWeight: 'bold',
    color: '#d97706',
    fontSize: '18px',
  },
  
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '25px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 200px)',
    overflow: 'hidden',
  },
  
  scrollableContent: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '10px',
    marginBottom: '15px',
  },
  
  title: {
    fontSize: '24px',
    color: '#333',
    textAlign: 'center',
    marginBottom: '15px',
    flexShrink: 0,
  },
  
  infoContent: {
    textAlign: 'center',
    padding: '15px',
  },
  
  lessonContent: {
    padding: '15px',
    lineHeight: '1.6',
  },
  
  contentText: {
    fontSize: '15px',
    color: '#666',
    lineHeight: '1.5',
    marginBottom: '12px',
  },
  
  descriptionText: {
    fontSize: '15px',
    color: '#555',
    lineHeight: '1.5',
    marginBottom: '12px',
    fontWeight: '500',
  },
  
  wizardContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '20px',
  },
  
  wizardBadge: {
    fontSize: '40px',
  },
  
  quizContent: {
    padding: '5px',
  },
  
  equationNumber: {
    fontSize: '14px',
    color: '#8b5cf6',
    fontWeight: 'bold',
    marginBottom: '15px',
    textAlign: 'center',
  },
  
  questionText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px',
  },
  
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px',
  },
  
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  correctOption: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  
  wrongOption: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  
  radio: {
    marginRight: '10px',
    cursor: 'pointer',
  },
  
  optionText: {
    fontSize: '13px',
    color: '#333',
  },
  
  correctFeedback: {
    padding: '10px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    marginTop: '10px',
    fontSize: '13px',
  },
  
  incorrectFeedback: {
    padding: '10px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    marginTop: '10px',
    fontSize: '13px',
  },
  
  completeContent: {
    textAlign: 'center',
    padding: '15px',
  },
  
  completeText: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '20px',
  },
  
  resultBox: {
    backgroundColor: '#ede9fe',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  
  resultIcon: {
    fontSize: '28px',
  },
  
  resultText: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#6d28d9',
  },
  
  noteText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
    fontStyle: 'italic',
  },
  
  rewardBox: {
    backgroundColor: '#fef3c7',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  
  rewardIcon: {
    fontSize: '28px',
  },
  
  rewardText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#d97706',
  },
  
  finishButton: {
    backgroundColor: '#8b5cf6',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background 0.2s',
  },
  
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '15px',
    gap: '10px',
    flexShrink: 0,
  },
  
  prevButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '8px 18px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  
  nextButton: {
    backgroundColor: '#8b5cf6',
    color: 'white',
    padding: '8px 18px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  
  disabledButton: {
    backgroundColor: '#c4b5fd',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  
  stepIndicator: {
    textAlign: 'center',
    marginTop: '12px',
    fontSize: '12px',
    color: '#999',
    flexShrink: 0,
  },
  
  avatarContainer: {
    position: 'fixed',
    bottom: '15px',
    right: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    zIndex: 100,
  },
  
  bubbleContainer: {
    marginBottom: '8px',
    marginRight: '5px',
  },
  
  speechBubble: {
    backgroundColor: 'white',
    padding: '8px 12px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxWidth: '220px',
    position: 'relative',
    border: '2px solid #8b5cf6',
  },
  
  bubbleText: {
    fontSize: '12px',
    color: '#333',
    lineHeight: '1.4',
  },
  
  closeBubble: {
    marginLeft: '8px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: '11px',
    color: '#999',
    padding: '2px 4px',
  },
  
  reopenBubble: {
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    cursor: 'pointer',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    fontSize: '18px',
    marginRight: '5px',
    marginBottom: '5px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'all 0.2s',
  },
  
  avatarWrapper: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    border: '3px solid white',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  
  confettiOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  
  confettiMessage: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '16px',
    fontSize: '20px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '25px',
    maxWidth: '350px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  },
  
  modalTitle: {
    fontSize: '20px',
    marginBottom: '12px',
    color: '#ef4444',
  },
  
  modalText: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  
  confirmResetBtn: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '8px 18px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  
  cancelResetBtn: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '8px 18px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  
  exampleBox: {
    backgroundColor: '#f0f9ff',
    padding: '20px',
    borderRadius: '12px',
    marginTop: '15px',
    border: '1px solid #bae6fd',
  },
  
  exampleTitle: {
    color: '#0369a1',
    marginBottom: '15px',
    fontSize: '18px',
  },
  
  solutionBox: {
    backgroundColor: '#fefce8',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '10px',
    fontSize: '14px',
    border: '1px solid #fde047',
  },
  
  formulaBox: {
    backgroundColor: '#e0f2fe',
    padding: '12px',
    borderRadius: '6px',
    margin: '10px 0',
    fontFamily: 'monospace',
    fontSize: '14px',
    textAlign: 'center',
    border: '1px solid #7dd3fc',
  },
  
  resultBox: {
    backgroundColor: '#dcfce7',
    padding: '12px',
    borderRadius: '6px',
    marginTop: '10px',
    textAlign: 'center',
    fontWeight: 'bold',
    border: '1px solid #86efac',
  },
  
  imageContainer: {
    textAlign: 'center',
    margin: '15px 0',
    padding: '10px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  
  lessonImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
  },
  
  stepImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
  },
  
  imageCaption: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '8px',
    fontStyle: 'italic',
  }
};

// Add animations to document
const styleSheet = document.createElement("style");
styleSheet.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes bounce {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes bubblePop {
    0% { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  button:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .optionLabel:hover {
    background-color: #f3f4f6;
    border-color: #8b5cf6;
  }
  
  .avatarWrapper:hover {
    transform: scale(1.05);
  }
  
  .resetButton:hover {
    background-color: #dc2626;
  }
  
  .confirmResetBtn:hover {
    background-color: #dc2626;
  }
  
  .cancelResetBtn:hover {
    background-color: #5a6268;
  }
  
  .finishButton:hover:not(:disabled) {
    background-color: #7c3aed;
    transform: translateY(-2px);
  }
  
  .scrollableContent::-webkit-scrollbar {
    width: 6px;
  }
  
  .scrollableContent::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .scrollableContent::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  
  .scrollableContent::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

if (!document.querySelector('#mission2-styles')) {
  styleSheet.id = 'mission2-styles';
  document.head.appendChild(styleSheet);
}

export default Mission2;