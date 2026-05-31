// src/menu/Missions.jsx - FULLY RESPONSIVE (optimized for 308x748 and all screen sizes)
// FIX: Avatar made larger and text bubble text bigger with more spacing from corners
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import Mission2 from '../missions/mission2';
import Mission3 from '../missions/mission3';
import Mission4 from '../missions/mission4';
import Mission5 from '../missions/mission5';
import { supabase } from '../lib/supabase';

function Missions() {
  const { user, userData, updateUserData } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMessage, setShowMessage] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [selectedMission, setSelectedMission] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const [localCompletedMissions, setLocalCompletedMissions] = useState([]);
  const [localTotalXP, setLocalTotalXP] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const messages = [
    "👋 Hey there! Ready for some missions?",
    "✨ You're doing amazing!",
    "🎯 Complete missions to earn XP!",
    "💪 Keep up the great work!",
    "🌟 You're on fire today!",
    "🌸 You got this!",
    "💖 Proud of your progress!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Check URL params for direct mission access
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const missionParam = params.get('mission');
    if (missionParam) {
      const missionId = parseInt(missionParam);
      if (missionId >= 2 && missionId <= 5) {
        setSelectedMission(missionId);
      }
    }
  }, [location]);

  // Sync local state with userData and fetch from database
  useEffect(() => {
    if (userData?.progress?.completedMissions) {
      setLocalCompletedMissions(userData.progress.completedMissions);
    }
    if (userData?.xp !== undefined) {
      setLocalTotalXP(userData.xp);
    }
    
    // Fetch completed missions from database
    if (user?.dbId) {
      fetchCompletedMissionsFromDatabase();
    }
  }, [userData, user?.dbId]);

  // Fetch completed missions from mission_progress table
  const fetchCompletedMissionsFromDatabase = async () => {
    try {
      if (!user?.dbId) return;
      
      const { data, error } = await supabase
        .from('mission_progress')
        .select('mission_id, xp_earned')
        .eq('student_id', user.dbId)
        .eq('status', 'completed');
      
      if (error) {
        console.error('Error fetching missions from database:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const completedIds = data.map(item => item.mission_id);
        const totalXP = data.reduce((sum, item) => sum + (item.xp_earned || 0), 0);
        
        setLocalCompletedMissions(completedIds);
        setLocalTotalXP(totalXP);
        
        // Update localStorage
        if (user?.email) {
          localStorage.setItem(`userXP_${user.email}`, totalXP.toString());
          localStorage.setItem('userXP', totalXP.toString());
        }
        
        console.log('Completed missions from DB:', completedIds, 'Total XP:', totalXP);
      }
    } catch (error) {
      console.error('Error in fetchCompletedMissionsFromDatabase:', error);
    }
  };

  // Save mission completion to database
  const saveMissionCompletionToDatabase = async (missionId, xpEarned) => {
    try {
      if (!user?.dbId) return false;
      
      // Check if already exists
      const { data: existing, error: checkError } = await supabase
        .from('mission_progress')
        .select('id')
        .eq('mission_id', missionId)
        .eq('student_id', user.dbId)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing mission:', checkError);
      }
      
      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('mission_progress')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            xp_earned: xpEarned,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('mission_progress')
          .insert({
            mission_id: missionId,
            student_id: user.dbId,
            status: 'completed',
            completed_at: new Date().toISOString(),
            xp_earned: xpEarned,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
      
      console.log(`Mission ${missionId} saved to database with ${xpEarned} XP`);
      return true;
      
    } catch (error) {
      console.error('Error saving mission to database:', error);
      return false;
    }
  };

  const handleMissionClick = (missionId) => {
    // Check if mission is already completed
    if (localCompletedMissions.includes(missionId)) {
      setLockMessage(`You have already completed ${missions.find(m => m.id === missionId)?.title}!`);
      setShowLockModal(true);
      return;
    }
    
    // Check if mission is locked (progressive unlocking)
    if (missionId === 3 && !isMission2Completed()) {
      setLockMessage("Complete Mission 2 (Math Wizard) first to unlock the Slope and a Point mission!");
      setShowLockModal(true);
      return;
    }
    if (missionId === 4 && !isMission3Completed()) {
      setLockMessage("Complete Mission 3 (Slope and a Point) first to unlock the Slope and y-intercept mission!");
      setShowLockModal(true);
      return;
    }
    if (missionId === 5 && !isMission4Completed()) {
      setLockMessage("Complete Mission 4 (Slope and y-intercept) first to unlock the X and Y Form mission!");
      setShowLockModal(true);
      return;
    }
    setSelectedMission(missionId);
  };

  // Handle back from mission - can accept nextMissionId to open next mission directly
  const handleBackToMissions = async (nextMissionId = null) => {
    if (nextMissionId) {
      // Open the next mission directly
      setSelectedMission(nextMissionId);
      return;
    }
    
    setSelectedMission(null);
    
    // Refresh data from database
    setIsLoading(true);
    await fetchCompletedMissionsFromDatabase();
    
    // Also refresh userData if updateUserData is available
    if (updateUserData && user?.dbId) {
      // Fetch fresh user data
      const { data: freshUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.dbId)
        .maybeSingle();
      
      if (freshUser) {
        updateUserData({
          ...userData,
          xp: freshUser.xp || localTotalXP,
          progress: freshUser.progress || { completedMissions: localCompletedMissions }
        });
      }
    }
    
    setIsLoading(false);
  };

  const closeLockModal = () => {
    setShowLockModal(false);
    setLockMessage("");
  };

  // Reset all progress function
  const handleResetProgress = () => {
    setShowResetConfirm(true);
  };

  const confirmResetProgress = async () => {
    if (!user?.dbId) {
      alert("User not found. Please sign in again.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Delete all mission progress from database
      const { error: deleteError } = await supabase
        .from('mission_progress')
        .delete()
        .eq('student_id', user.dbId);
      
      if (deleteError) {
        console.error('Error deleting mission progress:', deleteError);
      }
      
      // Reset user progress in database (users table)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          xp: 0,
          progress: {
            missionsCompleted: 0,
            completedMissions: [],
            lastMissionCompleted: null,
            totalXP: 0
          }
        })
        .eq('id', user.dbId);
      
      if (updateError) {
        console.error('Error updating user:', updateError);
      }
      
      // Update localStorage
      if (updateUserData) {
        updateUserData({
          xp: 0,
          progress: {
            missionsCompleted: 0,
            completedMissions: [],
            lastMissionCompleted: null,
            totalXP: 0
          }
        });
      }
      
      // Reset local state
      setLocalCompletedMissions([]);
      setLocalTotalXP(0);
      
      // Clear localStorage XP
      if (user?.email) {
        localStorage.setItem(`userXP_${user.email}`, '0');
        localStorage.setItem('userXP', '0');
      }
      
      setShowResetConfirm(false);
      setShowMessage(true);
      setMessageIndex(0);
      
      alert("✅ Your progress has been reset successfully!");
      
    } catch (error) {
      console.error('Error resetting progress:', error);
      alert("Failed to reset progress. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelResetProgress = () => {
    setShowResetConfirm(false);
  };

  // Check mission completion status
  const isMission2Completed = () => localCompletedMissions.includes(2);
  const isMission3Completed = () => localCompletedMissions.includes(3);
  const isMission4Completed = () => localCompletedMissions.includes(4);
  const isMission5Completed = () => localCompletedMissions.includes(5);

  const missions = [
    { id: 2, title: "Math Wizard", description: "Master linear equation concepts with 10 challenging questions", xp: 250, locked: false },
    { id: 3, title: "Slope and a Point", description: "Learn to find equation of a line using slope and a point", xp: 400, locked: !isMission2Completed() },
    { id: 4, title: "Slope and y-intercept", description: "Learn to find equation of a line using slope and y-intercept", xp: 500, locked: !isMission3Completed() },
    { id: 5, title: "X and Y Intercepts", description: "Learn to find equation of a line using intercepts", xp: 600, locked: !isMission4Completed() },
  ];

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading missions...</p>
      </div>
    );
  }

  // If a mission is selected, show the mission component
  if (selectedMission === 2) {
    return (
      <Mission2 
        user={user}
        userData={userData}
        updateUserData={updateUserData}
        onComplete={handleBackToMissions}
        saveToDatabase={saveMissionCompletionToDatabase}
      />
    );
  }

  if (selectedMission === 3) {
    return (
      <Mission3 
        user={user}
        userData={userData}
        updateUserData={updateUserData}
        onComplete={handleBackToMissions}
        saveToDatabase={saveMissionCompletionToDatabase}
      />
    );
  }

  if (selectedMission === 4) {
    return (
      <Mission4 
        user={user}
        userData={userData}
        updateUserData={updateUserData}
        onComplete={handleBackToMissions}
        saveToDatabase={saveMissionCompletionToDatabase}
      />
    );
  }

  if (selectedMission === 5) {
    return (
      <Mission5 
        user={user}
        userData={userData}
        updateUserData={updateUserData}
        onComplete={handleBackToMissions}
        saveToDatabase={saveMissionCompletionToDatabase}
      />
    );
  }

  return (
    <div style={styles.container}>
      {/* Lock Modal */}
      {showLockModal && (
        <div style={styles.modalOverlay} onClick={closeLockModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}>{lockMessage.includes("already completed") ? "✅" : "🔒"}</div>
            <h3 style={styles.modalTitle}>{lockMessage.includes("already completed") ? "Mission Already Completed!" : "Mission Locked!"}</h3>
            <p style={styles.modalText}>{lockMessage}</p>
            <div style={styles.modalButtons}>
              <button style={styles.modalCloseBtn} onClick={closeLockModal}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalIcon}>⚠️</div>
            <h3 style={styles.modalTitle}>Reset All Progress?</h3>
            <p style={styles.modalText}>
              This action will permanently erase all your mission progress, including:
            </p>
            <ul style={styles.modalList}>
              <li>✓ Completed missions</li>
              <li>✓ Earned XP points</li>
              <li>✓ Mission answers</li>
            </ul>
            <p style={styles.modalWarning}>This action cannot be undone!</p>
            <div style={styles.modalButtons}>
              <button style={styles.confirmResetBtn} onClick={confirmResetProgress} disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Yes, Reset Everything'}
              </button>
              <button style={styles.cancelResetBtn} onClick={cancelResetProgress}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.headerRow}>
        <div style={styles.headerText}>
          <h1 style={styles.title}>🎯 Your Missions</h1>
          <p style={styles.subtitle}>
            Complete missions to earn XP, {user?.name?.split(' ')[0] || 'Student'}!
          </p>
        </div>
        <button style={styles.resetProgressButton} onClick={handleResetProgress}>
          🔄 Reset
        </button>
      </div>

      <div style={styles.missionsGrid}>
        {missions.map(mission => (
          <div
            key={mission.id}
            style={{
              ...styles.missionCard,
              ...(localCompletedMissions.includes(mission.id) ? styles.completedMission : {}),
              ...(mission.locked && !localCompletedMissions.includes(mission.id) ? styles.lockedMission : {})
            }}
          >
            <div style={styles.missionHeader}>
              <h3 style={styles.missionTitle}>
                {localCompletedMissions.includes(mission.id) && '✅ '}
                {mission.locked && !localCompletedMissions.includes(mission.id) && '🔒 '}
                {mission.title}
              </h3>
              <span style={styles.xpBadge}>+{mission.xp}</span>
            </div>

            <p style={styles.missionDescription}>{mission.description}</p>

            {localCompletedMissions.includes(mission.id) ? (
              <div style={styles.completedBadge}>✓ Completed</div>
            ) : (
              <button
                style={{
                  ...styles.completeButton,
                  ...(mission.locked ? styles.lockedButton : {})
                }}
                onClick={() => handleMissionClick(mission.id)}
                disabled={mission.locked}
              >
                {mission.locked ? '🔒 Locked' : 'Start'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={styles.statsCard}>
        <h3 style={styles.statsTitle}>Your Progress</h3>
        <div style={styles.progressStats}>
          <div style={styles.statItem}>
            <span style={styles.statEmoji}>📋</span>
            <div>
              <p style={styles.statLabel}>Missions Completed</p>
              <p style={styles.statValue}>{localCompletedMissions.length} / {missions.length}</p>
            </div>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statEmoji}>⭐</span>
            <div>
              <p style={styles.statLabel}>Total XP Earned</p>
              <p style={styles.statValue}>{localTotalXP} XP</p>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div style={styles.progressBarContainer}>
          <div style={styles.progressBarLabel}>
            <span>Overall Progress</span>
            <span>{Math.round((localCompletedMissions.length / missions.length) * 100)}%</span>
          </div>
          <div style={styles.progressBarTrack}>
            <div 
              style={{
                ...styles.progressBarFill,
                width: `${(localCompletedMissions.length / missions.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* XP Breakdown Card */}
      <div style={styles.xpBreakdownCard}>
        <h3 style={styles.statsTitle}>🏆 XP Breakdown</h3>
        <div style={styles.xpBreakdownList}>
          {missions.map(mission => (
            <div key={mission.id} style={styles.xpBreakdownItem}>
              <div style={styles.xpBreakdownLeft}>
                <span style={styles.xpBreakdownIcon}>
                  {localCompletedMissions.includes(mission.id) ? '✅' : '⭕'}
                </span>
                <span style={styles.xpBreakdownName}>{mission.title}</span>
              </div>
              <div style={styles.xpBreakdownRight}>
                <span style={styles.xpBreakdownValue}>
                  {localCompletedMissions.includes(mission.id) ? `+${mission.xp}` : 'Not done'}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={styles.xpBreakdownTotal}>
          <span>Total XP Available</span>
          <span style={styles.xpBreakdownTotalValue}>
            {missions.reduce((sum, m) => sum + m.xp, 0)} XP
          </span>
        </div>
      </div>

      {/* Floating Assistant - LARGER AVATAR with bigger text and more spacing from corner */}
      <div style={styles.avatarContainer}>
        <div style={styles.bubbleContainer}>
          {showMessage ? (
            <div style={styles.speechBubble}>
              <span style={styles.bubbleText}>{messages[messageIndex]}</span>
              <button onClick={() => setShowMessage(false)} style={styles.closeBubble}>
                ✕
              </button>
            </div>
          ) : (
            <button onClick={() => setShowMessage(true)} style={styles.reopenBubble}>
              💬
            </button>
          )}
        </div>

        {/* LARGER AVATAR - SIGNIFICANTLY INCREASED SIZE */}
        <div style={styles.avatarWrapper}>
          <img
            src="/avatar_happy.jpg"
            alt="Learning Assistant"
            style={styles.avatarImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%232563eb'/%3E%3Ccircle cx='35' cy='40' r='5' fill='white'/%3E%3Ccircle cx='65' cy='40' r='5' fill='white'/%3E%3Cpath d='M35 60 Q50 75 65 60' stroke='white' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
            }}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '12px',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    position: 'relative',
    boxSizing: 'border-box',
    width: '100%',
    '@media (min-width: 769px)': { 
      padding: '20px'
    },
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    gap: '16px',
    padding: '20px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    '@media (min-width: 769px)': {
      width: '50px',
      height: '50px',
      borderWidth: '4px',
    },
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '16px',
    '@media (min-width: 769px)': {
      marginBottom: '20px',
      gap: '15px',
    },
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: '20px',
    color: '#333',
    marginBottom: '4px',
    '@media (min-width: 769px)': {
      fontSize: '32px',
      marginBottom: '10px',
    },
  },
  subtitle: {
    fontSize: '11px',
    color: '#666',
    '@media (min-width: 769px)': {
      fontSize: '16px',
    },
  },
  resetProgressButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '8px 14px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
    minHeight: '40px',
    '@media (min-width: 769px)': {
      padding: '10px 20px',
      fontSize: '14px',
      gap: '8px',
    },
  },
  missionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
    '@media (min-width: 769px)': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
  },
  missionCard: {
    backgroundColor: 'white',
    padding: '14px',
    borderRadius: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '@media (min-width: 769px)': {
      padding: '20px',
    },
  },
  completedMission: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #22c55e',
  },
  lockedMission: {
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    opacity: 0.8,
  },
  missionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '6px',
    '@media (min-width: 769px)': {
      marginBottom: '10px',
    },
  },
  missionTitle: {
    fontSize: '15px',
    color: '#333',
    margin: 0,
    '@media (min-width: 769px)': {
      fontSize: '20px',
    },
  },
  xpBadge: {
    backgroundColor: '#f59e0b',
    color: 'white',
    padding: '3px 8px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: 'bold',
    '@media (min-width: 769px)': {
      padding: '4px 12px',
      fontSize: '12px',
    },
  },
  missionDescription: {
    color: '#666',
    fontSize: '11px',
    marginBottom: '12px',
    lineHeight: '1.4',
    '@media (min-width: 769px)': {
      fontSize: '14px',
      marginBottom: '15px',
      lineHeight: '1.5',
    },
  },
  completeButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '8px',
    border: 'none',
    borderRadius: '8px',
    width: '100%',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    minHeight: '40px',
    '@media (min-width: 769px)': {
      padding: '10px 20px',
      fontSize: '14px',
    },
  },
  lockedButton: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  completedBadge: {
    backgroundColor: '#22c55e',
    color: 'white',
    padding: '8px',
    textAlign: 'center',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (min-width: 769px)': {
      padding: '10px 20px',
      fontSize: '14px',
    },
  },
  statsCard: {
    backgroundColor: 'white',
    padding: '14px',
    borderRadius: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    marginBottom: '12px',
    '@media (min-width: 769px)': {
      padding: '20px',
      marginBottom: '20px',
    },
  },
  statsTitle: {
    fontSize: '15px',
    color: '#333',
    marginBottom: '12px',
    '@media (min-width: 769px)': {
      fontSize: '18px',
      marginBottom: '15px',
    },
  },
  progressStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
    '@media (min-width: 769px)': {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: '12px',
      marginBottom: '20px',
    },
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    '@media (min-width: 769px)': {
      gap: '12px',
    },
  },
  statEmoji: {
    fontSize: '20px',
    '@media (min-width: 769px)': {
      fontSize: '24px',
    },
  },
  statLabel: {
    fontSize: '10px',
    color: '#999',
    marginBottom: '2px',
    '@media (min-width: 769px)': {
      fontSize: '12px',
    },
  },
  statValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    '@media (min-width: 769px)': {
      fontSize: '16px',
    },
  },
  progressBarContainer: {
    marginTop: '12px',
  },
  progressBarLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#666',
    marginBottom: '4px',
    '@media (min-width: 769px)': {
      fontSize: '12px',
      marginBottom: '5px',
    },
  },
  progressBarTrack: {
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
    '@media (min-width: 769px)': {
      height: '8px',
    },
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  xpBreakdownCard: {
    backgroundColor: 'white',
    padding: '14px',
    borderRadius: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    marginBottom: '100px', // Increased to make room for avatar
    '@media (min-width: 769px)': {
      padding: '20px',
      marginBottom: '120px',
    },
    '@media (max-width: 480px)': {
      marginBottom: '90px',
    },
  },
  xpBreakdownList: {
    marginBottom: '12px',
  },
  xpBreakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
    '@media (min-width: 769px)': {
      padding: '10px 0',
    },
  },
  xpBreakdownLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '@media (min-width: 769px)': {
      gap: '10px',
    },
  },
  xpBreakdownIcon: {
    fontSize: '13px',
    '@media (min-width: 769px)': {
      fontSize: '16px',
    },
  },
  xpBreakdownName: {
    fontSize: '11px',
    color: '#374151',
    '@media (min-width: 769px)': {
      fontSize: '14px',
    },
  },
  xpBreakdownRight: {
    textAlign: 'right',
  },
  xpBreakdownValue: {
    fontSize: '10px',
    fontWeight: '500',
    color: '#f59e0b',
    '@media (min-width: 769px)': {
      fontSize: '13px',
    },
  },
  xpBreakdownTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '10px',
    marginTop: '6px',
    borderTop: '2px solid #e5e7eb',
    fontWeight: 'bold',
    '@media (min-width: 769px)': {
      paddingTop: '12px',
      marginTop: '8px',
    },
  },
  xpBreakdownTotalValue: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#f59e0b',
    '@media (min-width: 769px)': {
      fontSize: '18px',
    },
  },
  // AVATAR CONTAINER - More spacing from corners (not too close to edge)
  avatarContainer: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 1000,
    '@media (min-width: 769px)': {
      bottom: '40px',
      right: '40px',
    },
    '@media (max-width: 480px)': {
      bottom: '20px',
      right: '20px',
    },
  },
  bubbleContainer: {
    marginRight: '15px',
    marginBottom: '12px',
    '@media (min-width: 769px)': {
      marginRight: '20px',
      marginBottom: '15px',
    },
    '@media (max-width: 480px)': {
      marginRight: '10px',
      marginBottom: '8px',
    },
  },
  speechBubble: {
    backgroundColor: 'white',
    padding: '10px 14px',
    borderRadius: '18px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
    animation: 'bubblePop 0.3s ease-out',
    maxWidth: '220px',
    position: 'relative',
    border: '2px solid #2563eb',
    '@media (min-width: 769px)': {
      padding: '14px 20px',
      borderRadius: '24px',
      maxWidth: '300px',
    },
    '@media (max-width: 480px)': {
      padding: '8px 12px',
      maxWidth: '170px',
    },
  },
  bubbleText: {
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.4',
    fontWeight: '500',
    '@media (min-width: 769px)': {
      fontSize: '18px',
      lineHeight: '1.5',
    },
    '@media (max-width: 480px)': {
      fontSize: '12px',
    },
  },
  closeBubble: {
    marginLeft: '8px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: '12px',
    color: '#999',
    padding: '2px 4px',
    '@media (min-width: 769px)': {
      marginLeft: '12px',
      fontSize: '16px',
    },
  },
  reopenBubble: {
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    fontSize: '20px',
    marginRight: '15px',
    marginBottom: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (min-width: 769px)': {
      width: '50px',
      height: '50px',
      fontSize: '24px',
      marginRight: '20px',
      marginBottom: '15px',
    },
    '@media (max-width: 480px)': {
      width: '36px',
      height: '36px',
      fontSize: '18px',
      marginRight: '12px',
      marginBottom: '10px',
    },
  },
  // LARGER AVATAR - SIGNIFICANTLY INCREASED SIZE with good spacing
  avatarWrapper: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    overflow: 'hidden',
    animation: 'float 3s ease-in-out infinite',
    backgroundColor: '#f0f0f0',
    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
    border: '4px solid white',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
    },
    '@media (min-width: 769px)': {
      width: '160px',
      height: '160px',
      borderWidth: '5px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
    },
    '@media (max-width: 480px)': {
      width: '100px',
      height: '100px',
      borderWidth: '3px',
    },
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
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
    animation: 'fadeIn 0.2s',
    padding: '16px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '18px',
    maxWidth: '90%',
    width: '320px',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    animation: 'bounce 0.3s',
    '@media (min-width: 769px)': {
      padding: '25px',
      maxWidth: '400px',
    },
  },
  modalIcon: {
    fontSize: '36px',
    marginBottom: '8px',
    '@media (min-width: 769px)': {
      fontSize: '48px',
      marginBottom: '10px',
    },
  },
  modalTitle: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#ef4444',
    '@media (min-width: 769px)': {
      fontSize: '22px',
      marginBottom: '15px',
    },
  },
  modalText: {
    fontSize: '12px',
    color: '#555',
    marginBottom: '12px',
    lineHeight: '1.4',
    '@media (min-width: 769px)': {
      fontSize: '14px',
      marginBottom: '15px',
      lineHeight: '1.5',
    },
  },
  modalList: {
    textAlign: 'left',
    marginBottom: '12px',
    paddingLeft: '18px',
    color: '#666',
    fontSize: '11px',
    '@media (min-width: 769px)': {
      marginBottom: '15px',
      fontSize: '13px',
    },
  },
  modalWarning: {
    fontSize: '10px',
    color: '#ef4444',
    fontWeight: 'bold',
    marginBottom: '16px',
    padding: '6px',
    backgroundColor: '#fee2e2',
    borderRadius: '8px',
    '@media (min-width: 769px)': {
      fontSize: '12px',
      marginBottom: '20px',
      padding: '8px',
    },
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexDirection: 'column',
    '@media (min-width: 481px)': {
      flexDirection: 'row',
      gap: '15px',
    },
  },
  modalCloseBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '8px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    minHeight: '40px',
    '@media (min-width: 769px)': {
      padding: '10px 24px',
      fontSize: '14px',
    },
  },
  confirmResetBtn: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    minHeight: '40px',
    '@media (min-width: 769px)': {
      padding: '10px 20px',
      fontSize: '14px',
    },
  },
  cancelResetBtn: {
    backgroundColor: '#6b7280',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    minHeight: '40px',
    '@media (min-width: 769px)': {
      padding: '10px 20px',
      fontSize: '14px',
    },
  },
};

// Add animations
const styleSheet = document.createElement("style");
styleSheet.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
  }
  @keyframes bubblePop {
    0% { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes bounce {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); opacity: 1; }
  }
  .resetProgressButton:hover {
    background-color: #dc2626;
  }
  .confirmResetBtn:hover {
    background-color: #dc2626;
  }
  .cancelResetBtn:hover {
    background-color: #5a6268;
  }
  .modalCloseBtn:hover {
    background-color: #1e4db9;
  }
  .completeButton:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  /* Touch optimizations for small screens */
  @media (max-width: 480px) {
    button, .missionCard {
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    button:active, .missionCard:active {
      transform: scale(0.98);
      transition: transform 0.05s ease;
    }
  }
  
  /* Specific optimizations for 308px width */
  @media (max-width: 340px) {
    .title {
      font-size: 16px !important;
    }
    .subtitle {
      font-size: 9px !important;
    }
    .missionTitle {
      font-size: 12px !important;
    }
    .xpBadge {
      font-size: 8px !important;
      padding: 2px 6px !important;
    }
    .missionDescription {
      font-size: 9px !important;
    }
    .statsTitle {
      font-size: 13px !important;
    }
    .avatarWrapper {
      width: 85px !important;
      height: 85px !important;
    }
    .speechBubble {
      max-width: 150px !important;
    }
    .bubbleText {
      font-size: 11px !important;
    }
    .avatarContainer {
      bottom: 15px !important;
      right: 15px !important;
    }
  }
`;

if (!document.querySelector('#missions-styles')) {
  styleSheet.id = 'missions-styles';
  document.head.appendChild(styleSheet);
}

export default Missions;