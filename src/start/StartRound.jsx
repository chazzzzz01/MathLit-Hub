// src/menu/StartRound.jsx
import { useState, useEffect } from 'react';
import { FiClock, FiCheckCircle, FiXCircle, FiUsers, FiAlertCircle } from 'react-icons/fi';
import { classService } from '../services/classService';

function StartRound({ onClose, teamA, teamB }) {
  const [timeLeft, setTimeLeft] = useState(20);
  const [isActive, setIsActive] = useState(true);
  const [teamAnswers, setTeamAnswers] = useState({ A: null, B: null });
  const [submittedStatus, setSubmittedStatus] = useState({ A: false, B: false });
  const [roundEnded, setRoundEnded] = useState(false);
  
  const question = {
    text: "Find the equation of the line passing through (1, 2) and (5, 10)",
    answer: "y = 2x",
    explanation: "Step 1: Calculate slope (m) = (y2 - y1)/(x2 - x1) = (10 - 2)/(5 - 1) = 8/4 = 2\nStep 2: Use point-slope form: y - y1 = m(x - x1)\nStep 3: y - 2 = 2(x - 1)\nStep 4: y - 2 = 2x - 2\nStep 5: y = 2x"
  };

  // Timer countdown
  useEffect(() => {
    if (!isActive || timeLeft === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          endRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  // Simulate receiving answers from students (in real app, this would come from Supabase subscription)
  useEffect(() => {
    // This is a simulation - in production, you'd subscribe to Supabase real-time updates
    const checkForAnswers = setInterval(() => {
      // For demo purposes, we'll check localStorage for student answers
      const checkTeamAnswers = () => {
        const answers = { A: null, B: null };
        const submitted = { A: false, B: false };
        
        // Check if any student from Team A has submitted an answer
        teamA.forEach(student => {
          const savedAnswer = localStorage.getItem(`answer_${student.id}_${Date.now()}`);
          if (savedAnswer && !answers.A) {
            answers.A = savedAnswer;
            submitted.A = true;
          }
        });
        
        // Check if any student from Team B has submitted an answer
        teamB.forEach(student => {
          const savedAnswer = localStorage.getItem(`answer_${student.id}_${Date.now()}`);
          if (savedAnswer && !answers.B) {
            answers.B = savedAnswer;
            submitted.B = true;
          }
        });
        
        setTeamAnswers(answers);
        setSubmittedStatus(submitted);
      };
      
      checkTeamAnswers();
    }, 1000);
    
    return () => clearInterval(checkForAnswers);
  }, [teamA, teamB]);

  const endRound = () => {
    setIsActive(false);
    setRoundEnded(true);
  };

  const checkAnswer = (answer) => {
    if (!answer) return null;
    const normalizedAnswer = answer.trim().toLowerCase().replace(/\s/g, '');
    const normalizedCorrect = question.answer.toLowerCase().replace(/\s/g, '');
    return normalizedAnswer === normalizedCorrect;
  };

  const getTeamResult = (team) => {
    const answer = teamAnswers[team];
    if (!answer) return { status: 'no-answer', message: 'No answer submitted', correct: false };
    const isCorrect = checkAnswer(answer);
    return {
      status: isCorrect ? 'correct' : 'incorrect',
      message: isCorrect ? 'Correct!' : 'Incorrect',
      correct: isCorrect,
      answer: answer
    };
  };

  return (
    <div style={styles.modalOverlay} onClick={roundEnded ? onClose : undefined}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            🎯 Live Round in Progress
          </h2>
          {!roundEnded && (
            <button style={styles.endEarlyButton} onClick={endRound}>
              End Round Early
            </button>
          )}
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {/* Timer Section */}
        <div style={styles.timerSection}>
          <div style={styles.timerCircle}>
            <FiClock size={40} color={timeLeft < 5 ? '#ef4444' : '#3b82f6'} />
            <div style={styles.timerText}>
              <span style={styles.timerNumber}>{timeLeft}</span>
              <span style={styles.timerLabel}>seconds</span>
            </div>
          </div>
          <div style={styles.timerBar}>
            <div 
              style={{
                ...styles.timerProgress,
                width: `${(timeLeft / 20) * 100}%`,
                backgroundColor: timeLeft < 5 ? '#ef4444' : '#10b981'
              }}
            />
          </div>
          <div style={styles.timerStatus}>
            {isActive ? '⏱️ Round in progress...' : '🏁 Round ended!'}
          </div>
        </div>

        {/* Question Section */}
        <div style={styles.questionCard}>
          <h3 style={styles.questionTitle}>📝 Current Question</h3>
          <p style={styles.questionText}>{question.text}</p>
          {roundEnded && (
            <div style={styles.correctAnswerBox}>
              <strong>✅ Correct Answer:</strong> {question.answer}
            </div>
          )}
        </div>

        {/* Teams Answers Section */}
        <div style={styles.teamsContainer}>
          {/* Team A */}
          <div style={styles.teamCard('A')}>
            <div style={styles.teamHeader('A')}>
              <FiUsers size={24} />
              <h3 style={styles.teamTitle}>Team A</h3>
              <span style={styles.memberCount}>{teamA.length} members</span>
            </div>
            
            <div style={styles.answerSection}>
              <div style={styles.answerLabel}>📋 Team Answer:</div>
              <div style={styles.answerDisplay}>
                {submittedStatus.A ? (
                  <div style={styles.answerContent}>
                    <span style={styles.answerText}>{teamAnswers.A}</span>
                    {roundEnded && (
                      getTeamResult('A').correct ? 
                        <FiCheckCircle style={styles.correctIcon} /> : 
                        <FiXCircle style={styles.incorrectIcon} />
                    )}
                  </div>
                ) : (
                  <div style={styles.waitingAnswer}>
                    <FiAlertCircle size={16} />
                    <span>{isActive ? 'Waiting for answer...' : 'No answer submitted'}</span>
                  </div>
                )}
              </div>
              
              {roundEnded && submittedStatus.A && (
                <div style={getTeamResult('A').correct ? styles.feedbackCorrect : styles.feedbackIncorrect}>
                  {getTeamResult('A').correct ? 
                    '✅ Correct! Team A gets a point!' : 
                    '❌ Incorrect. The correct answer is: y = 2x'
                  }
                </div>
              )}
            </div>

            {/* Team Members List */}
            <div style={styles.membersList}>
              <strong>👥 Team Members:</strong>
              {teamA.length > 0 ? (
                teamA.map(student => (
                  <div key={student.id} style={styles.memberItem}>
                    <span>{student.name}</span>
                    <span style={styles.roleBadge(student.role)}>
                      {student.role || 'member'}
                    </span>
                  </div>
                ))
              ) : (
                <div style={styles.emptyMessage}>No members assigned</div>
              )}
            </div>
          </div>

          {/* Team B */}
          <div style={styles.teamCard('B')}>
            <div style={styles.teamHeader('B')}>
              <FiUsers size={24} />
              <h3 style={styles.teamTitle}>Team B</h3>
              <span style={styles.memberCount}>{teamB.length} members</span>
            </div>
            
            <div style={styles.answerSection}>
              <div style={styles.answerLabel}>📋 Team Answer:</div>
              <div style={styles.answerDisplay}>
                {submittedStatus.B ? (
                  <div style={styles.answerContent}>
                    <span style={styles.answerText}>{teamAnswers.B}</span>
                    {roundEnded && (
                      getTeamResult('B').correct ? 
                        <FiCheckCircle style={styles.correctIcon} /> : 
                        <FiXCircle style={styles.incorrectIcon} />
                    )}
                  </div>
                ) : (
                  <div style={styles.waitingAnswer}>
                    <FiAlertCircle size={16} />
                    <span>{isActive ? 'Waiting for answer...' : 'No answer submitted'}</span>
                  </div>
                )}
              </div>
              
              {roundEnded && submittedStatus.B && (
                <div style={getTeamResult('B').correct ? styles.feedbackCorrect : styles.feedbackIncorrect}>
                  {getTeamResult('B').correct ? 
                    '✅ Correct! Team B gets a point!' : 
                    '❌ Incorrect. The correct answer is: y = 2x'
                  }
                </div>
              )}
            </div>

            {/* Team Members List */}
            <div style={styles.membersList}>
              <strong>👥 Team Members:</strong>
              {teamB.length > 0 ? (
                teamB.map(student => (
                  <div key={student.id} style={styles.memberItem}>
                    <span>{student.name}</span>
                    <span style={styles.roleBadge(student.role)}>
                      {student.role || 'member'}
                    </span>
                  </div>
                ))
              ) : (
                <div style={styles.emptyMessage}>No members assigned</div>
              )}
            </div>
          </div>
        </div>

        {/* Round Summary (shown after round ends) */}
        {roundEnded && (
          <div style={styles.summaryCard}>
            <h3>🏆 Round Summary</h3>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryItem}>
                <strong>Team A:</strong> 
                <span style={getTeamResult('A').correct ? styles.correctText : styles.incorrectText}>
                  {getTeamResult('A').correct ? '✓ Correct' : '✗ Incorrect'}
                </span>
                {submittedStatus.A && <div style={styles.summaryAnswer}>Answer: {teamAnswers.A}</div>}
              </div>
              <div style={styles.summaryItem}>
                <strong>Team B:</strong> 
                <span style={getTeamResult('B').correct ? styles.correctText : styles.incorrectText}>
                  {getTeamResult('B').correct ? '✓ Correct' : '✗ Incorrect'}
                </span>
                {submittedStatus.B && <div style={styles.summaryAnswer}>Answer: {teamAnswers.B}</div>}
              </div>
            </div>
            <div style={styles.explanationBox}>
              <strong>📖 Solution Explanation:</strong>
              <p>{question.explanation}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.buttonContainer}>
          {roundEnded ? (
            <button style={styles.closeButtonMain} onClick={onClose}>
              Close Round
            </button>
          ) : (
            <button style={styles.waitingButton} disabled>
              Waiting for answers...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    overflow: 'auto',
    padding: '20px'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '30px',
    width: '90%',
    maxWidth: '1200px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    gap: '16px',
    flexWrap: 'wrap'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  endEarlyButton: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '32px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '0 8px'
  },
  timerSection: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '16px'
  },
  timerCircle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  timerText: {
    textAlign: 'center'
  },
  timerNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    display: 'block',
    color: '#1f2937'
  },
  timerLabel: {
    fontSize: '14px',
    color: '#6b7280'
  },
  timerBar: {
    width: '100%',
    height: '10px',
    backgroundColor: '#e5e7eb',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '12px'
  },
  timerProgress: {
    height: '100%',
    transition: 'width 1s linear',
    borderRadius: '5px'
  },
  timerStatus: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280'
  },
  questionCard: {
    backgroundColor: '#f3f4f6',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '30px'
  },
  questionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#374151'
  },
  questionText: {
    fontSize: '20px',
    fontWeight: '500',
    color: '#1f2937',
    margin: '0 0 16px 0'
  },
  correctAnswerBox: {
    backgroundColor: '#d1fae5',
    padding: '12px',
    borderRadius: '8px',
    color: '#065f46',
    marginTop: '12px'
  },
  teamsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '30px'
  },
  teamCard: (team) => ({
    backgroundColor: team === 'A' ? '#eff6ff' : '#fce7f3',
    borderRadius: '16px',
    padding: '20px',
    border: `2px solid ${team === 'A' ? '#bfdbfe' : '#fbcfe8'}`
  }),
  teamHeader: (team) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: `2px solid ${team === 'A' ? '#bfdbfe' : '#fbcfe8'}`
  }),
  teamTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    flex: 1,
    color: team === 'A' ? '#1e40af' : '#9d174d'
  },
  memberCount: {
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: 'white',
    padding: '4px 8px',
    borderRadius: '20px'
  },
  answerSection: {
    marginBottom: '20px'
  },
  answerLabel: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#4b5563'
  },
  answerDisplay: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '10px',
    marginBottom: '12px',
    minHeight: '70px'
  },
  answerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px'
  },
  answerText: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#1f2937',
    flex: 1
  },
  waitingAnswer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#9ca3af',
    fontStyle: 'italic'
  },
  correctIcon: {
    color: '#10b981',
    size: 24
  },
  incorrectIcon: {
    color: '#ef4444',
    size: 24
  },
  feedbackCorrect: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500'
  },
  feedbackIncorrect: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500'
  },
  membersList: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb'
  },
  memberItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    fontSize: '14px',
    borderBottom: '1px solid #f3f4f6'
  },
  roleBadge: (role) => ({
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '500',
    backgroundColor: role === 'analyzer' ? '#ede9fe' : role === 'checker' ? '#fed7aa' : '#d1fae5',
    color: role === 'analyzer' ? '#6d28d9' : role === 'checker' ? '#92400e' : '#065f46'
  }),
  emptyMessage: {
    textAlign: 'center',
    padding: '16px',
    color: '#9ca3af',
    fontSize: '13px'
  },
  summaryCard: {
    backgroundColor: '#fef3c7',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '16px',
    marginBottom: '16px'
  },
  summaryItem: {
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '8px'
  },
  summaryAnswer: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px'
  },
  correctText: {
    color: '#10b981',
    fontWeight: '600',
    marginLeft: '8px'
  },
  incorrectText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: '8px'
  },
  explanationBox: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '20px'
  },
  closeButtonMain: {
    padding: '12px 32px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  waitingButton: {
    padding: '12px 32px',
    backgroundColor: '#9ca3af',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'not-allowed'
  }
};

export default StartRound;