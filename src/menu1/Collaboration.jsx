// src/menu/Collaboration.jsx - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FiBookOpen, FiChevronDown, FiUsers, FiUser, FiMail, FiRefreshCw, 
  FiStar, FiUserCheck, FiUserX, FiUserPlus, FiPlay,
  FiClock, FiAward, FiTrendingUp, FiPieChart, FiBarChart2, FiCalendar,
  FiCheckCircle, FiXCircle, FiActivity, FiTarget, FiPlus, FiAward as FiTrophy
} from 'react-icons/fi';
import { classService } from '../services/classService';
import StartRound from '../menu1/StartRound';
import { supabase } from '../lib/supabase';

function Collaboration() {
  const { user } = useOutletContext();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoundView, setShowRoundView] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [removingStudent, setRemovingStudent] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('teams');
  const [studentPoints, setStudentPoints] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [pointsLastUpdated, setPointsLastUpdated] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);
  const [showPointsToast, setShowPointsToast] = useState(null);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsSmallMobile(width <= 480);
      setIsTablet(width > 480 && width <= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load classes for teacher
  const loadClasses = async () => {
    if (!user?.dbId) return;
    
    try {
      setLoading(true);
      const teacherClasses = await classService.getTeacherClasses(user.dbId);
      setClasses(teacherClasses);
      console.log('📋 Loaded teacher classes:', teacherClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.dbId) {
      loadClasses();
    }
  }, [user?.dbId]);

  // Load student points from database
  const loadStudentPoints = async (classId) => {
    try {
      console.log('📊 Loading student points for class:', classId);
      
      const { data: pointsData, error } = await supabase
        .from('student_points')
        .select('student_id, points, updated_at')
        .eq('class_id', classId);
      
      if (error) {
        console.error('Error loading student points:', error);
        return {};
      }
      
      const pointsMap = {};
      pointsData?.forEach(point => {
        pointsMap[point.student_id] = point.points || 0;
      });
      
      console.log('📊 Loaded points for', Object.keys(pointsMap).length, 'students');
      return pointsMap;
    } catch (error) {
      console.error('Error in loadStudentPoints:', error);
      return {};
    }
  };

  // Load students for the selected class with their team assignments and points
  const loadStudents = async (classId) => {
    setLoadingStudents(true);
    setError(null);
    
    try {
      console.log('📋 Loading students for class:', classId);
      
      // Get students from class_students
      const { data: classStudentsData, error: classStudentsError } = await supabase
        .from('class_students')
        .select(`
          student_id,
          joined_at,
          students (
            id,
            name,
            email,
            user_id
          )
        `)
        .eq('class_id', classId);
      
      if (classStudentsError) throw classStudentsError;
      
      console.log('📋 Class students data:', classStudentsData);
      
      // Get team assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('team_assignments')
        .select('*')
        .eq('class_id', classId);
      
      if (assignmentsError) throw assignmentsError;
      console.log('📋 Team assignments:', assignments);
      
      // Load points from student_points table
      const pointsMap = await loadStudentPoints(classId);
      console.log('📋 Student points loaded:', pointsMap);
      
      const assignmentMap = {};
      assignments?.forEach(assignment => {
        assignmentMap[assignment.student_id] = {
          team: assignment.team,
          role: assignment.role,
          assignmentId: assignment.id
        };
      });
      
      // Build student list
      const studentList = await Promise.all((classStudentsData || []).map(async (enrollment) => {
        const studentId = enrollment.student_id;
        const studentRecord = enrollment.students;
        
        let studentName = 'Student';
        let studentEmail = '';
        
        if (studentRecord) {
          studentName = studentRecord.name || 'Student';
          studentEmail = studentRecord.email || '';
          
          // Get user data if available
          if (studentRecord.user_id) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', studentRecord.user_id)
              .maybeSingle();
            
            if (userData && !userError) {
              studentName = userData.name || studentName;
              studentEmail = userData.email || studentEmail;
            }
          }
        }
        
        // Clean up the name
        if (!studentName || studentName === 'User' || studentName === '' || studentName === 'Student') {
          if (studentEmail && studentEmail.includes('@')) {
            studentName = studentEmail.split('@')[0];
          } else {
            studentName = `Student_${studentId.slice(-4)}`;
          }
        }
        
        // Capitalize first letter of each word
        studentName = studentName.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        
        // Get points from pointsMap (default to 0)
        const points = pointsMap[studentId] || 0;
        
        return {
          id: studentId,
          name: studentName,
          email: studentEmail,
          joined_at: enrollment.joined_at,
          team: assignmentMap[studentId]?.team || null,
          role: assignmentMap[studentId]?.role || null,
          assignmentId: assignmentMap[studentId]?.assignmentId || null,
          points: points
        };
      }));
      
      // Sort students by points (highest first) for each team
      const teamAStudents = studentList.filter(s => s.team === 'A').sort((a, b) => b.points - a.points);
      const teamBStudents = studentList.filter(s => s.team === 'B').sort((a, b) => b.points - a.points);
      const unassignedStudents = studentList.filter(s => !s.team).sort((a, b) => b.points - a.points);
      
      // Combine back with sorted order
      const sortedStudentList = [...teamAStudents, ...teamBStudents, ...unassignedStudents];
      setStudents(sortedStudentList);
      
      // Update points map state
      const pointsMapState = {};
      sortedStudentList.forEach(student => {
        pointsMapState[student.id] = student.points;
      });
      setStudentPoints(pointsMapState);
      
      console.log('📋 Final student list:', sortedStudentList.length, 'students');
      
      // Calculate team totals
      const teamATotal = teamAStudents.reduce((sum, s) => sum + (s.points || 0), 0);
      const teamBTotal = teamBStudents.reduce((sum, s) => sum + (s.points || 0), 0);
      console.log('📊 Team A total points:', teamATotal);
      console.log('📊 Team B total points:', teamBTotal);
      
      setPointsLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Failed to load students. Please try again.');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Refresh all data
  const refreshAll = async () => {
    if (selectedClass) {
      setRefreshing(true);
      await loadStudents(selectedClass.id);
      await loadGameHistory(selectedClass.id);
      setRefreshing(false);
      
      setShowPointsToast({ message: 'Points and data refreshed!', type: 'success' });
      setTimeout(() => setShowPointsToast(null), 3000);
    }
  };

  // Load game history for the selected class
  const loadGameHistory = async (classId) => {
    setLoadingHistory(true);
    try {
      const { data: sessions, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('class_id', classId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!sessions || sessions.length === 0) {
        setGameHistory([]);
        return;
      }
      
      const history = sessions.map((session, index) => {
        const roundNumber = sessions.length - index;
        const teamAResult = session.round_results?.A || { correct: false };
        const teamBResult = session.round_results?.B || { correct: false };
        
        return {
          id: session.id,
          date: session.created_at,
          roundNumber: roundNumber,
          teamAScore: teamAResult.correct ? 1 : 0,
          teamBScore: teamBResult.correct ? 1 : 0,
          winner: teamAResult.correct && teamBResult.correct ? 'Tie' : 
                  teamAResult.correct ? 'A' : 
                  teamBResult.correct ? 'B' : 'None',
          teamAAnswer: session.team_answers?.A || 'No answer',
          teamBAnswer: session.team_answers?.B || 'No answer',
          question: session.current_question?.text || 'Unknown'
        };
      });
      
      setGameHistory(history);
      console.log('📜 Loaded game history:', history.length, 'rounds');
    } catch (error) {
      console.error('Error loading game history:', error);
      setGameHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleClassSelect = async (classItem) => {
    setSelectedClass(classItem);
    setShowDropdown(false);
    await loadStudents(classItem.id);
    await loadGameHistory(classItem.id);
  };

  const saveStudentAssignment = async (student, team, role) => {
    if (!selectedClass?.id) {
      alert('No class selected');
      return false;
    }
    
    setSavingAssignment(true);
    try {
      const { data: existing } = await supabase
        .from('team_assignments')
        .select('id')
        .eq('student_id', student.id)
        .eq('class_id', selectedClass.id)
        .maybeSingle();
      
      let result;
      if (existing) {
        const { error } = await supabase
          .from('team_assignments')
          .update({ team, role, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        result = !error;
      } else {
        const { error } = await supabase
          .from('team_assignments')
          .insert({
            student_id: student.id,
            class_id: selectedClass.id,
            team,
            role
          });
        result = !error;
      }
      
      if (result) {
        await loadStudents(selectedClass.id);
        return true;
      } else {
        throw new Error('Failed to save assignment');
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert(`Failed to save assignment: ${error.message || 'Please try again.'}`);
      return false;
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleRemoveFromTeam = async (student) => {
    if (!selectedClass?.id) {
      alert('No class selected');
      return;
    }
    
    setRemovingStudent(true);
    try {
      const { error } = await supabase
        .from('team_assignments')
        .delete()
        .eq('student_id', student.id)
        .eq('class_id', selectedClass.id);
      
      if (error) throw error;
      
      await loadStudents(selectedClass.id);
      setShowRemoveConfirm(null);
    } catch (error) {
      console.error('Error removing student from team:', error);
      alert(`Failed to remove student: ${error.message || 'Please try again.'}`);
    } finally {
      setRemovingStudent(false);
    }
  };

  const handleAssignTeam = (student) => {
    setSelectedStudent(student);
    setSelectedTeam(student.team || null);
    setSelectedRole(student.role || null);
    setShowAssignModal(true);
  };

  const handleTeamAndRoleSelect = async () => {
    if (!selectedTeam || !selectedRole) {
      alert('Please select both a team and a role');
      return;
    }
    
    const success = await saveStudentAssignment(selectedStudent, selectedTeam, selectedRole);
    
    if (success) {
      setShowAssignModal(false);
      setSelectedStudent(null);
      setSelectedTeam(null);
      setSelectedRole(null);
    }
  };

  const handleStartRound = () => {
    if (teamAStudents.length === 0 && teamBStudents.length === 0) {
      alert('Please assign at least one student to a team before starting a round');
      return;
    }
    setShowRoundView(true);
  };

  const handleBackToCollaboration = async () => {
    setShowRoundView(false);
    if (selectedClass) {
      await loadStudents(selectedClass.id);
      await loadGameHistory(selectedClass.id);
    }
  };

  const getRoleInfo = (role) => {
    switch(role) {
      case 'analyzer':
        return { icon: <FiUserCheck size={isSmallMobile ? 8 : 12} />, label: 'Analyzer', color: '#6b21a5', bgColor: '#f3e8ff' };
      case 'checker':
        return { icon: <FiUserX size={isSmallMobile ? 8 : 12} />, label: 'Checker', color: '#b45309', bgColor: '#fffbeb' };
      case 'solver':
        return { icon: <FiUserPlus size={isSmallMobile ? 8 : 12} />, label: 'Solver', color: '#065f46', bgColor: '#ecfdf5' };
      default:
        return { icon: <FiUser size={isSmallMobile ? 8 : 12} />, label: 'Member', color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const teamAStudents = students.filter(s => s.team === 'A');
  const teamBStudents = students.filter(s => s.team === 'B');
  const unassignedStudents = students.filter(s => !s.team);

  const teamATotalPoints = teamAStudents.reduce((sum, s) => sum + (studentPoints[s.id] || 0), 0);
  const teamBTotalPoints = teamBStudents.reduce((sum, s) => sum + (studentPoints[s.id] || 0), 0);
  const topStudent = students.length > 0 ? [...students].sort((a, b) => (b.points || 0) - (a.points || 0))[0] : null;

  const calculateStats = () => {
    if (gameHistory.length === 0) return null;
    
    const totalGames = gameHistory.length;
    const teamAWins = gameHistory.filter(g => g.winner === 'A').length;
    const teamBWins = gameHistory.filter(g => g.winner === 'B').length;
    const ties = gameHistory.filter(g => g.winner === 'Tie').length;
    
    const avgTeamAScore = gameHistory.reduce((sum, g) => sum + g.teamAScore, 0) / totalGames;
    const avgTeamBScore = gameHistory.reduce((sum, g) => sum + g.teamBScore, 0) / totalGames;
    const totalProblems = gameHistory.reduce((sum, g) => sum + g.teamAScore + g.teamBScore, 0);
    
    return {
      totalGames,
      teamAWins,
      teamBWins,
      ties,
      avgTeamAScore: avgTeamAScore.toFixed(1),
      avgTeamBScore: avgTeamBScore.toFixed(1),
      totalProblems,
      winRateA: totalGames > 0 ? ((teamAWins / totalGames) * 100).toFixed(1) : 0,
      winRateB: totalGames > 0 ? ((teamBWins / totalGames) * 100).toFixed(1) : 0
    };
  };

  const stats = calculateStats();

  // Responsive values
  const containerPadding = isSmallMobile ? '12px 8px' : (isMobile ? '16px 12px' : '20px 24px');
  const headerMarginBottom = isSmallMobile ? '16px' : (isMobile ? '20px' : '24px');
  const statsGridColumns = isSmallMobile ? '1fr' : (isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))');
  const statsGridGap = isSmallMobile ? '8px' : '12px';
  const splitLayoutDirection = isMobile ? 'column' : 'row';
  const splitLayoutGap = isSmallMobile ? '12px' : (isMobile ? '16px' : '24px');
  const teamsWrapperDirection = isMobile ? 'column' : 'row';
  const teamsWrapperGap = isSmallMobile ? '10px' : (isMobile ? '12px' : '16px');
  const modalWidth = isSmallMobile ? '95%' : (isMobile ? '90%' : '80%');
  const modalMaxWidth = isSmallMobile ? '350px' : (isMobile ? '400px' : '460px');
  const studentActionsWrap = isSmallMobile ? 'wrap' : 'nowrap';
  const studentItemPadding = isSmallMobile ? '10px' : '12px';
  const fontSizeSmall = isSmallMobile ? '11px' : (isMobile ? '12px' : '13px');
  const fontSizeMedium = isSmallMobile ? '13px' : (isMobile ? '14px' : '16px');
  const fontSizeLarge = isSmallMobile ? '16px' : (isMobile ? '20px' : '24px');

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading classes...</p>
      </div>
    );
  }

  if (showRoundView) {
    return (
      <div style={styles.roundViewContainer}>
        <div style={styles.backButtonContainer}>
          <button onClick={handleBackToCollaboration} style={styles.backButton}>
            ← Back to Collaboration
          </button>
        </div>
        <StartRound 
          onClose={handleBackToCollaboration}
          teamA={teamAStudents}
          teamB={teamBStudents}
          classId={selectedClass?.id}
          className={selectedClass?.name}
          onPointsAwarded={refreshAll}
        />
      </div>
    );
  }

  return (
    <div style={{...styles.container, padding: containerPadding}}>
      {showPointsToast && (
        <div style={styles.toastNotification}>
          <FiCheckCircle size={16} />
          <span>{showPointsToast.message}</span>
        </div>
      )}

      <div style={{...styles.header, marginBottom: headerMarginBottom, flexDirection: isSmallMobile ? 'column' : 'row', alignItems: isSmallMobile ? 'stretch' : 'center'}}>
        <div style={styles.headerLeft}>
          <h1 style={{...styles.mainTitle, fontSize: fontSizeLarge}}>Collaboration Hub</h1>
          {!isSmallMobile && <p style={styles.subtitle}>Manage teams, track performance, and start collaborative rounds</p>}
        </div>
        <div style={styles.headerRight}>
          <div style={styles.classSelectorWrapper}>
            <div style={styles.customDropdown}>
              <button 
                style={styles.dropdownButton}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div style={styles.dropdownButtonContent}>
                  {selectedClass ? (
                    <>
                      <FiBookOpen size={isSmallMobile ? 12 : (isMobile ? 14 : 18)} color="#6366f1" />
                      <span style={styles.selectedClassName}>{selectedClass.name}</span>
                    </>
                  ) : (
                    <span style={styles.placeholderText}>Select a class</span>
                  )}
                </div>
                <FiChevronDown size={isSmallMobile ? 14 : (isMobile ? 16 : 20)} style={{
                  transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }} />
              </button>
              
              {showDropdown && (
                <div style={styles.dropdownMenu}>
                  {classes.length === 0 ? (
                    <div style={styles.emptyDropdown}>
                      <p>No classes available</p>
                    </div>
                  ) : (
                    classes.map((classItem) => (
                      <div
                        key={classItem.id}
                        style={{
                          ...styles.dropdownItem,
                          ...(selectedClass?.id === classItem.id ? styles.dropdownItemSelected : {})
                        }}
                        onClick={() => handleClassSelect(classItem)}
                      >
                        <div style={styles.dropdownItemContent}>
                          <FiBookOpen size={isSmallMobile ? 10 : (isMobile ? 12 : 16)} color="#6b7280" />
                          <span style={styles.dropdownItemName}>{classItem.name}</span>
                        </div>
                        <span style={styles.studentCount}>
                          <FiUsers size={isSmallMobile ? 8 : (isMobile ? 10 : 12)} /> {classItem.students_count || 0}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!selectedClass ? (
        <div style={styles.emptyClassState}>
          <div style={styles.emptyClassIcon}>📚</div>
          <h3 style={styles.emptyClassTitle}>No Class Selected</h3>
          <p style={styles.emptyClassText}>Select a class from the dropdown above to start managing teams and viewing game history.</p>
        </div>
      ) : (
        <>
          {/* Points Dashboard */}
          <div style={{...styles.pointsDashboard, marginBottom: '20px'}}>
            <div style={styles.pointsCard}>
              <div style={styles.pointsCardLeft}>
                <div style={styles.pointsIcon}>
                  <FiAward size={24} color="#f59e0b" />
                </div>
                <div>
                  <span style={styles.pointsLabel}>Total Points Awarded</span>
                  <span style={styles.pointsValue}>{teamATotalPoints + teamBTotalPoints}</span>
                </div>
              </div>
              <div style={styles.pointsCardRight}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <FiUsers size={16} color="#6366f1" />
                  <div>
                    <span style={styles.teamPointsLabel}>Team A Total</span>
                    <span style={styles.teamPointsValue}>{teamATotalPoints}</span>
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <FiUsers size={16} color="#ef4444" />
                  <div>
                    <span style={styles.teamPointsLabel}>Team B Total</span>
                    <span style={styles.teamPointsValue}>{teamBTotalPoints}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {stats && stats.totalGames > 0 && (
            <div style={{...styles.statsGrid, gridTemplateColumns: statsGridColumns, gap: statsGridGap}}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}><FiActivity /></div>
                <div style={styles.statContent}>
                  <span style={styles.statValue}>{stats.totalGames}</span>
                  <span style={styles.statLabel}>Total Rounds</span>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}><FiTrendingUp /></div>
                <div style={styles.statContent}>
                  <span style={styles.statValue}>{stats.totalProblems}</span>
                  <span style={styles.statLabel}>Problems Solved</span>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}><FiTarget /></div>
                <div style={styles.statContent}>
                  <span style={styles.statValue}>{stats.winRateA}% / {stats.winRateB}%</span>
                  <span style={styles.statLabel}>Win Rate (A / B)</span>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}><FiAward /></div>
                <div style={styles.statContent}>
                  <span style={styles.statValue}>{stats.avgTeamAScore} / {stats.avgTeamBScore}</span>
                  <span style={styles.statLabel}>Avg Score (A / B)</span>
                </div>
              </div>
            </div>
          )}

          <div style={{...styles.tabContainer, flexWrap: isSmallMobile ? 'wrap' : 'nowrap'}}>
            <button 
              style={{...styles.tabButton, ...(activeTab === 'teams' ? styles.tabActive : {}), fontSize: fontSizeSmall, padding: isSmallMobile ? '6px 12px' : (isMobile ? '8px 16px' : '10px 20px')}}
              onClick={() => setActiveTab('teams')}
            >
              <FiUsers size={isSmallMobile ? 12 : (isMobile ? 14 : 16)} />
              {!isMobile && `Team Management (${students.length} students)`}
              {(isMobile && !isSmallMobile) && `Teams (${students.length})`}
              {isSmallMobile && `${students.length}`}
            </button>
            <button 
              style={{...styles.tabButton, ...(activeTab === 'history' ? styles.tabActive : {}), fontSize: fontSizeSmall, padding: isSmallMobile ? '6px 12px' : (isMobile ? '8px 16px' : '10px 20px')}}
              onClick={() => setActiveTab('history')}
            >
              <FiClock size={isSmallMobile ? 12 : (isMobile ? 14 : 16)} />
              {!isMobile && `Game History (${gameHistory.length})`}
              {(isMobile && !isSmallMobile) && `History (${gameHistory.length})`}
              {isSmallMobile && `${gameHistory.length}`}
            </button>
          </div>

          {activeTab === 'teams' ? (
            <div style={{...styles.splitLayout, flexDirection: splitLayoutDirection, gap: splitLayoutGap}}>
              <div style={{...styles.leftSide, minWidth: isMobile ? '100%' : '350px'}}>
                <div style={{...styles.teamsWrapper, flexDirection: teamsWrapperDirection, gap: teamsWrapperGap}}>
                  {/* Team A Container */}
                  <div style={styles.teamContainerA}>
                    <div style={styles.teamHeaderA}>
                      <div style={styles.teamIcon}>⚡</div>
                      <h3 style={{...styles.teamTitle, fontSize: fontSizeMedium}}>Team A</h3>
                      <span style={styles.teamCount}>{teamAStudents.length}</span>
                      <span style={{...styles.teamPointsTotal, backgroundColor: '#d1fae5', color: '#065f46'}}>
                        <FiStar size={10} /> {teamATotalPoints} total pts
                      </span>
                    </div>
                    <div style={styles.teamMembersList}>
                      {teamAStudents.length === 0 ? (
                        <div style={styles.emptyTeam}>
                          <p>No members assigned yet</p>
                        </div>
                      ) : (
                        teamAStudents.map((student) => {
                          const roleInfo = getRoleInfo(student.role);
                          const points = studentPoints[student.id] || student.points || 0;
                          return (
                            <div key={student.id} style={{...styles.teamMemberItem, flexDirection: isSmallMobile ? 'column' : 'row', textAlign: isSmallMobile ? 'center' : 'left'}}>
                              <div style={styles.teamMemberAvatar}>
                                {student.name?.charAt(0) || 'S'}
                              </div>
                              <div style={{...styles.teamMemberInfo, textAlign: isSmallMobile ? 'center' : 'left'}}>
                                <div style={{...styles.teamMemberName, fontSize: fontSizeSmall}}>
                                  {student.name}
                                </div>
                                {!isSmallMobile && student.email && (
                                  <div style={styles.teamMemberEmail}>
                                    <FiMail size={10} />
                                    <span>{student.email}</span>
                                  </div>
                                )}
                                <div style={{...styles.roleBadge, backgroundColor: roleInfo.bgColor, color: roleInfo.color, margin: isSmallMobile ? '4px auto' : '0'}}>
                                  {roleInfo.icon}
                                  <span>{roleInfo.label}</span>
                                </div>
                                <div style={{...styles.memberPointsModern, margin: isSmallMobile ? '4px auto' : '0'}}>
                                  <FiStar size={12} color="#f59e0b" />
                                  <strong style={{fontSize: '14px'}}>{points}</strong> points
                                </div>
                              </div>
                              <button 
                                style={styles.removeButton}
                                onClick={() => setShowRemoveConfirm(student)}
                                disabled={removingStudent}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Team B Container */}
                  <div style={styles.teamContainerB}>
                    <div style={styles.teamHeaderB}>
                      <div style={styles.teamIcon}>🔥</div>
                      <h3 style={{...styles.teamTitle, fontSize: fontSizeMedium}}>Team B</h3>
                      <span style={styles.teamCount}>{teamBStudents.length}</span>
                      <span style={{...styles.teamPointsTotal, backgroundColor: '#fee2e2', color: '#991b1b'}}>
                        <FiStar size={10} /> {teamBTotalPoints} total pts
                      </span>
                    </div>
                    <div style={styles.teamMembersList}>
                      {teamBStudents.length === 0 ? (
                        <div style={styles.emptyTeam}>
                          <p>No members assigned yet</p>
                        </div>
                      ) : (
                        teamBStudents.map((student) => {
                          const roleInfo = getRoleInfo(student.role);
                          const points = studentPoints[student.id] || student.points || 0;
                          return (
                            <div key={student.id} style={{...styles.teamMemberItem, flexDirection: isSmallMobile ? 'column' : 'row', textAlign: isSmallMobile ? 'center' : 'left'}}>
                              <div style={styles.teamMemberAvatar}>
                                {student.name?.charAt(0) || 'S'}
                              </div>
                              <div style={{...styles.teamMemberInfo, textAlign: isSmallMobile ? 'center' : 'left'}}>
                                <div style={{...styles.teamMemberName, fontSize: fontSizeSmall}}>
                                  {student.name}
                                </div>
                                {!isSmallMobile && student.email && (
                                  <div style={styles.teamMemberEmail}>
                                    <FiMail size={10} />
                                    <span>{student.email}</span>
                                  </div>
                                )}
                                <div style={{...styles.roleBadge, backgroundColor: roleInfo.bgColor, color: roleInfo.color, margin: isSmallMobile ? '4px auto' : '0'}}>
                                  {roleInfo.icon}
                                  <span>{roleInfo.label}</span>
                                </div>
                                <div style={{...styles.memberPointsModern, margin: isSmallMobile ? '4px auto' : '0'}}>
                                  <FiStar size={12} color="#f59e0b" />
                                  <strong style={{fontSize: '14px'}}>{points}</strong> points
                                </div>
                              </div>
                              <button 
                                style={styles.removeButton}
                                onClick={() => setShowRemoveConfirm(student)}
                                disabled={removingStudent}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
                
                <button style={{...styles.startButton, fontSize: fontSizeMedium}} onClick={handleStartRound}>
                  <FiPlay size={isSmallMobile ? 14 : (isMobile ? 16 : 20)} />
                  Start New Round
                </button>
              </div>

              <div style={{...styles.rightSide, minWidth: isMobile ? '100%' : '350px'}}>
                <div style={styles.studentsCard}>
                  <div style={{...styles.studentsHeader, flexDirection: isSmallMobile ? 'column' : 'row', alignItems: isSmallMobile ? 'stretch' : 'center'}}>
                    <h3 style={{...styles.cardTitle, fontSize: fontSizeMedium}}>
                      <FiUsers size={isSmallMobile ? 14 : (isMobile ? 16 : 20)} />
                      All Students ({students.length})
                    </h3>
                    <div style={styles.headerButtons}>
                      {pointsLastUpdated && !isSmallMobile && (
                        <span style={styles.lastUpdated}>
                          Updated: {pointsLastUpdated.toLocaleTimeString()}
                        </span>
                      )}
                      <button onClick={refreshAll} style={styles.refreshButton} title="Refresh students and points">
                        <FiRefreshCw size={isSmallMobile ? 12 : (isMobile ? 14 : 16)} className={refreshing ? 'spin' : ''} />
                      </button>
                    </div>
                  </div>

                  {loadingStudents ? (
                    <div style={styles.loadingStudents}>
                      <div style={styles.smallSpinner}></div>
                      <p>Loading students...</p>
                    </div>
                  ) : error ? (
                    <div style={styles.errorState}>
                      <p style={styles.errorText}>{error}</p>
                      <button onClick={refreshAll} style={styles.retryButton}>
                        Try Again
                      </button>
                    </div>
                  ) : students.length === 0 ? (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>📭</div>
                      <p style={styles.emptyText}>No students enrolled yet</p>
                      <p style={styles.emptySubtext}>Share the class code to invite students</p>
                    </div>
                  ) : (
                    <div style={styles.studentsList}>
                      {teamAStudents.map((student) => {
                        const roleInfo = getRoleInfo(student.role);
                        const points = studentPoints[student.id] || student.points || 0;
                        return (
                          <div key={student.id} style={{...styles.studentItemAssignedA, padding: studentItemPadding, flexDirection: isSmallMobile ? 'column' : 'row', textAlign: isSmallMobile ? 'center' : 'left'}}>
                            <div style={{...styles.studentAvatar, margin: isSmallMobile ? '0 auto' : '0'}}>
                              {student.name?.charAt(0) || 'S'}
                            </div>
                            <div style={{...styles.studentInfo, textAlign: isSmallMobile ? 'center' : 'left'}}>
                              <div style={{...styles.studentName, fontSize: fontSizeSmall}}>{student.name}</div>
                              {!isSmallMobile && student.email && (
                                <div style={styles.studentDetail}>
                                  <FiMail size={12} />
                                  <span>{student.email}</span>
                                </div>
                              )}
                              <div style={{...styles.roleBadgeSmall, backgroundColor: roleInfo.bgColor, color: roleInfo.color, margin: isSmallMobile ? '4px auto' : '0'}}>
                                {roleInfo.icon}
                                <span>{roleInfo.label}</span>
                              </div>
                              <div style={{...styles.studentPointsDisplay, margin: isSmallMobile ? '8px auto' : '0'}}>
                                <FiStar size={12} color="#f59e0b" />
                                <strong style={{fontSize: '14px'}}>{points}</strong> points
                              </div>
                            </div>
                            <div style={{...styles.studentActions, justifyContent: isSmallMobile ? 'center' : 'flex-start', flexWrap: studentActionsWrap, gap: '6px'}}>
                              <div style={styles.teamBadgeA}>Team A</div>
                              <button style={styles.reassignButton} onClick={() => handleAssignTeam(student)}>Edit</button>
                              <button style={styles.removeSmallButton} onClick={() => setShowRemoveConfirm(student)} disabled={removingStudent}>×</button>
                            </div>
                          </div>
                        );
                      })}
                      
                      {teamBStudents.map((student) => {
                        const roleInfo = getRoleInfo(student.role);
                        const points = studentPoints[student.id] || student.points || 0;
                        return (
                          <div key={student.id} style={{...styles.studentItemAssignedB, padding: studentItemPadding, flexDirection: isSmallMobile ? 'column' : 'row', textAlign: isSmallMobile ? 'center' : 'left'}}>
                            <div style={{...styles.studentAvatar, margin: isSmallMobile ? '0 auto' : '0'}}>
                              {student.name?.charAt(0) || 'S'}
                            </div>
                            <div style={{...styles.studentInfo, textAlign: isSmallMobile ? 'center' : 'left'}}>
                              <div style={{...styles.studentName, fontSize: fontSizeSmall}}>{student.name}</div>
                              {!isSmallMobile && student.email && (
                                <div style={styles.studentDetail}>
                                  <FiMail size={12} />
                                  <span>{student.email}</span>
                                </div>
                              )}
                              <div style={{...styles.roleBadgeSmall, backgroundColor: roleInfo.bgColor, color: roleInfo.color, margin: isSmallMobile ? '4px auto' : '0'}}>
                                {roleInfo.icon}
                                <span>{roleInfo.label}</span>
                              </div>
                              <div style={{...styles.studentPointsDisplay, margin: isSmallMobile ? '8px auto' : '0'}}>
                                <FiStar size={12} color="#f59e0b" />
                                <strong style={{fontSize: '14px'}}>{points}</strong> points
                              </div>
                            </div>
                            <div style={{...styles.studentActions, justifyContent: isSmallMobile ? 'center' : 'flex-start', flexWrap: studentActionsWrap, gap: '6px'}}>
                              <div style={styles.teamBadgeB}>Team B</div>
                              <button style={styles.reassignButton} onClick={() => handleAssignTeam(student)}>Edit</button>
                              <button style={styles.removeSmallButton} onClick={() => setShowRemoveConfirm(student)} disabled={removingStudent}>×</button>
                            </div>
                          </div>
                        );
                      })}
                      
                      {unassignedStudents.map((student) => {
                        const points = studentPoints[student.id] || student.points || 0;
                        return (
                          <div key={student.id} style={{...styles.studentItem, padding: studentItemPadding, flexDirection: isSmallMobile ? 'column' : 'row', textAlign: isSmallMobile ? 'center' : 'left'}}>
                            <div style={{...styles.studentAvatar, margin: isSmallMobile ? '0 auto' : '0'}}>
                              {student.name?.charAt(0) || 'S'}
                            </div>
                            <div style={{...styles.studentInfo, textAlign: isSmallMobile ? 'center' : 'left'}}>
                              <div style={{...styles.studentName, fontSize: fontSizeSmall}}>{student.name}</div>
                              {!isSmallMobile && student.email && (
                                <div style={styles.studentDetail}>
                                  <FiMail size={12} />
                                  <span>{student.email}</span>
                                </div>
                              )}
                              <div style={{...styles.studentPointsDisplay, margin: isSmallMobile ? '8px auto' : '0'}}>
                                <FiStar size={12} color="#f59e0b" />
                                <strong style={{fontSize: '14px'}}>{points}</strong> points
                              </div>
                            </div>
                            <div style={{...styles.studentActions, justifyContent: isSmallMobile ? 'center' : 'flex-start', width: isSmallMobile ? '100%' : 'auto'}}>
                              <button style={styles.assignButton} onClick={() => handleAssignTeam(student)} disabled={savingAssignment}>
                                <FiPlus size={12} /> Assign
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.historyContainer}>
              {loadingHistory ? (
                <div style={styles.loadingHistory}>
                  <div style={styles.smallSpinner}></div>
                  <p>Loading game history...</p>
                </div>
              ) : gameHistory.length === 0 ? (
                <div style={styles.emptyHistory}>
                  <div style={styles.emptyIcon}>🎮</div>
                  <h4>No Game History Yet</h4>
                  <p>Start your first round to see game history here!</p>
                </div>
              ) : (
                <>
                  {stats && (
                    <div style={{...styles.summaryCards, gridTemplateColumns: statsGridColumns, gap: statsGridGap}}>
                      <div style={styles.summaryCard}>
                        <FiBarChart2 size={isSmallMobile ? 14 : (isMobile ? 16 : 20)} color="#6366f1" />
                        <div>
                          <div style={styles.summaryLabel}>Total Rounds</div>
                          <div style={styles.summaryValue}>{stats.totalGames}</div>
                        </div>
                      </div>
                      <div style={styles.summaryCard}>
                        <FiBarChart2 size={isSmallMobile ? 14 : (isMobile ? 16 : 20)} color="#ec4899" />
                        <div>
                          <div style={styles.summaryLabel}>Team A Wins</div>
                          <div style={styles.summaryValue}>{stats.teamAWins}</div>
                        </div>
                      </div>
                      <div style={styles.summaryCard}>
                        <FiPieChart size={isSmallMobile ? 14 : (isMobile ? 16 : 20)} color="#10b981" />
                        <div>
                          <div style={styles.summaryLabel}>Team B Wins</div>
                          <div style={styles.summaryValue}>{stats.teamBWins}</div>
                        </div>
                      </div>
                      <div style={styles.summaryCard}>
                        <FiPieChart size={isSmallMobile ? 14 : (isMobile ? 16 : 20)} color="#f59e0b" />
                        <div>
                          <div style={styles.summaryLabel}>Ties</div>
                          <div style={styles.summaryValue}>{stats.ties}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={styles.historyTimeline}>
                    <h3 style={{...styles.historyTitle, fontSize: fontSizeMedium}}>
                      <FiClock size={isSmallMobile ? 12 : (isMobile ? 14 : 18)} />
                      Round History
                    </h3>
                    <div style={styles.timelineList}>
                      {gameHistory.map((game) => (
                        <div key={game.id} style={{...styles.historyItem, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : '20px'}}>
                          <div style={styles.historyDate}>
                            <FiCalendar size={isSmallMobile ? 8 : (isMobile ? 10 : 14)} />
                            <span>{new Date(game.date).toLocaleDateString()}</span>
                            {!isMobile && <span style={styles.historyTime}>{new Date(game.date).toLocaleTimeString()}</span>}
                          </div>
                          <div style={styles.historyContent}>
                            <div style={{...styles.roundNumber, fontSize: fontSizeSmall}}>Round #{game.roundNumber}</div>
                            <div style={{...styles.questionPreview, fontSize: fontSizeSmall}}>Question: {game.question.substring(0, isMobile ? 30 : 60)}...</div>
                            <div style={{...styles.scoreContainer, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center'}}>
                              <div style={styles.teamAScore}>
                                <span style={styles.teamALabel}>Team A</span>
                                <span style={styles.scoreValue}>{game.teamAScore > 0 ? '✓ Correct' : '✗ Incorrect'}</span>
                              </div>
                              <div style={styles.vsDivider}>VS</div>
                              <div style={styles.teamBScore}>
                                <span style={styles.teamBLabel}>Team B</span>
                                <span style={styles.scoreValue}>{game.teamBScore > 0 ? '✓ Correct' : '✗ Incorrect'}</span>
                              </div>
                            </div>
                            <div style={styles.gameDetails}>
                              <span style={{
                                ...styles.winnerBadge,
                                backgroundColor: game.winner === 'A' ? '#ecfdf5' : game.winner === 'B' ? '#fef2f2' : '#fef3c7',
                                color: game.winner === 'A' ? '#10b981' : game.winner === 'B' ? '#ef4444' : '#d97706'
                              }}>
                                {game.winner === 'A' && <FiCheckCircle size={12} />}
                                {game.winner === 'B' && <FiXCircle size={12} />}
                                {game.winner === 'Tie' && <FiActivity size={12} />}
                                {game.winner === 'A' ? 'Team A Won' : game.winner === 'B' ? 'Team B Won' : game.winner === 'Tie' ? 'Tie' : 'No Winner'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {showAssignModal && selectedStudent && (
        <div style={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
          <div style={{...styles.modal, width: modalWidth, maxWidth: modalMaxWidth, padding: isSmallMobile ? '16px' : (isMobile ? '20px' : '28px')}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{...styles.modalTitle, fontSize: fontSizeMedium}}>Assign {selectedStudent.name}</h3>
            <p style={{...styles.modalSubtitle, fontSize: fontSizeSmall}}>
              <FiStar size={12} color="#f59e0b" /> Current points: <strong>{selectedStudent.points || 0}</strong>
            </p>
            
            <div style={styles.modalSection}>
              <label style={{...styles.modalLabel, fontSize: fontSizeSmall}}>Select Team:</label>
              <div style={{...styles.teamOptions, flexDirection: isMobile ? 'column' : 'row'}}>
                <button style={{...styles.teamOptionButton, ...(selectedTeam === 'A' ? styles.teamOptionSelectedA : {}), fontSize: fontSizeSmall}} onClick={() => setSelectedTeam('A')}>⚡ Team A</button>
                <button style={{...styles.teamOptionButton, ...(selectedTeam === 'B' ? styles.teamOptionSelectedB : {}), fontSize: fontSizeSmall}} onClick={() => setSelectedTeam('B')}>🔥 Team B</button>
              </div>
            </div>

            <div style={styles.modalSection}>
              <label style={{...styles.modalLabel, fontSize: fontSizeSmall}}>Select Role:</label>
              <div style={{...styles.roleOptions, flexDirection: isMobile ? 'column' : 'row'}}>
                <button style={{...styles.roleOptionButton, ...(selectedRole === 'analyzer' ? styles.roleOptionAnalyzer : {}), fontSize: fontSizeSmall}} onClick={() => setSelectedRole('analyzer')}>
                  <FiUserCheck size={isSmallMobile ? 10 : (isMobile ? 12 : 16)} /> Analyzer
                </button>
                <button style={{...styles.roleOptionButton, ...(selectedRole === 'checker' ? styles.roleOptionChecker : {}), fontSize: fontSizeSmall}} onClick={() => setSelectedRole('checker')}>
                  <FiUserX size={isSmallMobile ? 10 : (isMobile ? 12 : 16)} /> Checker
                </button>
                <button style={{...styles.roleOptionButton, ...(selectedRole === 'solver' ? styles.roleOptionSolver : {}), fontSize: fontSizeSmall}} onClick={() => setSelectedRole('solver')}>
                  <FiUserPlus size={isSmallMobile ? 10 : (isMobile ? 12 : 16)} /> Solver
                </button>
              </div>
            </div>

            <div style={{...styles.modalActions, flexDirection: isMobile ? 'column' : 'row'}}>
              <button style={styles.cancelModalButton} onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button style={styles.confirmModalButton} onClick={handleTeamAndRoleSelect} disabled={savingAssignment}>
                {savingAssignment ? 'Saving...' : 'Assign Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowRemoveConfirm(null)}>
          <div style={{...styles.modal, width: modalWidth, maxWidth: modalMaxWidth, padding: isSmallMobile ? '16px' : (isMobile ? '20px' : '28px')}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{...styles.modalTitle, fontSize: fontSizeMedium}}>Remove from Team</h3>
            <p style={{...styles.modalSubtitle, fontSize: fontSizeSmall}}>
              Remove <strong>{showRemoveConfirm.name}</strong> from their team?
              <br />
              <FiStar size={12} color="#f59e0b" /> Has <strong>{showRemoveConfirm.points || 0}</strong> points
            </p>
            
            <div style={{...styles.modalActions, flexDirection: isMobile ? 'column' : 'row', marginTop: '20px'}}>
              <button style={styles.cancelModalButton} onClick={() => setShowRemoveConfirm(null)} disabled={removingStudent}>Cancel</button>
              <button style={{...styles.confirmModalButton, backgroundColor: '#ef4444'}} onClick={() => handleRemoveFromTeam(showRemoveConfirm)} disabled={removingStudent}>
                {removingStudent ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    margin: 0,
    boxSizing: 'border-box',
  },
  roundViewContainer: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '20px 24px',
    margin: 0,
    boxSizing: 'border-box',
  },
  backButtonContainer: {
    maxWidth: '1400px',
    margin: '0 auto 20px auto',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    color: '#475569',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  toastNotification: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#10b981',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: 2000,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
    flexWrap: 'wrap',
    gap: '20px',
  },
  headerLeft: { flex: 1 },
  headerRight: { display: 'flex', alignItems: 'center' },
  mainTitle: { fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: '8px 0 0 0' },
  classSelectorWrapper: { minWidth: '200px', width: '100%' },
  customDropdown: { position: 'relative', width: '100%' },
  dropdownButton: { width: '100%', padding: '10px 16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  dropdownButtonContent: { display: 'flex', alignItems: 'center', gap: '10px' },
  selectedClassName: { fontSize: '14px', fontWeight: '500', color: '#0f172a' },
  placeholderText: { color: '#94a3b8', fontSize: '14px' },
  dropdownMenu: { position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: '300px', overflowY: 'auto' },
  dropdownItem: { padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' },
  dropdownItemSelected: { backgroundColor: '#eef2ff' },
  dropdownItemContent: { display: 'flex', alignItems: 'center', gap: '10px' },
  dropdownItemName: { fontSize: '14px', fontWeight: '500', color: '#0f172a' },
  studentCount: { fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' },
  emptyDropdown: { padding: '30px', textAlign: 'center', color: '#64748b' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '20px' },
  loadingSpinner: { width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  smallSpinner: { width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  emptyClassState: { textAlign: 'center', padding: '40px 20px', backgroundColor: 'white', borderRadius: '24px', maxWidth: '600px', margin: '0 auto' },
  emptyClassIcon: { fontSize: '48px', marginBottom: '20px' },
  emptyClassTitle: { fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' },
  emptyClassText: { fontSize: '14px', color: '#64748b' },
  pointsDashboard: { maxWidth: '1400px', margin: '0 auto 24px auto' },
  pointsCard: { background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  pointsCardLeft: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  pointsIcon: { width: '48px', height: '48px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pointsLabel: { fontSize: '11px', color: '#92400e', display: 'block' },
  pointsValue: { fontSize: '28px', fontWeight: '700', color: '#d97706', lineHeight: 1 },
  pointsCardRight: { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' },
  teamPointsLabel: { fontSize: '10px', color: '#64748b', display: 'block' },
  teamPointsValue: { fontSize: '18px', fontWeight: '700', color: '#6366f1' },
  statsGrid: { display: 'grid', gap: '16px', maxWidth: '1400px', margin: '0 auto 32px auto' },
  statCard: { backgroundColor: 'white', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #e2e8f0' },
  statIcon: { width: '40px', height: '40px', backgroundColor: '#eef2ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: '20px' },
  statContent: { display: 'flex', flexDirection: 'column' },
  statValue: { fontSize: '20px', fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: '11px', color: '#64748b', marginTop: '4px' },
  tabContainer: { display: 'flex', gap: '8px', maxWidth: '1400px', margin: '0 auto 24px auto', borderBottom: '1px solid #e2e8f0' },
  tabButton: { backgroundColor: 'transparent', border: 'none', borderRadius: '10px 10px 0 0', fontWeight: '500', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  tabActive: { color: '#6366f1', borderBottom: '2px solid #6366f1', backgroundColor: '#eef2ff' },
  splitLayout: { display: 'flex', gap: '24px', maxWidth: '1400px', margin: '0 auto' },
  leftSide: { flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
  rightSide: { flex: 1.2 },
  studentsCard: { backgroundColor: 'white', borderRadius: '20px', padding: '16px', border: '1px solid #e2e8f0', minHeight: '500px' },
  cardTitle: { fontWeight: '600', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  studentsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  headerButtons: { display: 'flex', alignItems: 'center', gap: '12px' },
  lastUpdated: { fontSize: '11px', color: '#94a3b8' },
  refreshButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: '#64748b' },
  teamsWrapper: { display: 'flex', gap: '16px' },
  teamContainerA: { flex: 1, backgroundColor: '#f0fdf4', borderRadius: '16px', padding: '12px', border: '1px solid #bbf7d0' },
  teamContainerB: { flex: 1, backgroundColor: '#fef2f2', borderRadius: '16px', padding: '12px', border: '1px solid #fecaca' },
  teamHeaderA: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #bbf7d0', color: '#166534', flexWrap: 'wrap' },
  teamHeaderB: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #fecaca', color: '#991b1b', flexWrap: 'wrap' },
  teamIcon: { fontSize: '16px' },
  teamTitle: { fontWeight: '600', margin: 0 },
  teamCount: { backgroundColor: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: '#475569' },
  teamPointsTotal: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' },
  teamMembersList: { maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
  teamMemberItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', backgroundColor: 'white', borderRadius: '12px' },
  teamMemberAvatar: { width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#475569', flexShrink: 0 },
  teamMemberInfo: { flex: 1 },
  teamMemberName: { fontWeight: '600', color: '#0f172a', marginBottom: '2px' },
  teamMemberEmail: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64748b', marginBottom: '4px' },
  roleBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '500', width: 'fit-content' },
  memberPointsModern: { display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px', padding: '4px 10px', backgroundColor: '#fef3c7', borderRadius: '12px', fontSize: '12px', fontWeight: '600', color: '#d97706' },
  removeButton: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', width: '30px', height: '30px' },
  removeSmallButton: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' },
  emptyTeam: { textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '12px' },
  startButton: { width: '100%', padding: '12px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  studentsList: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto' },
  studentItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' },
  studentItemAssignedA: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' },
  studentItemAssignedB: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' },
  studentAvatar: { width: '40px', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#475569', flexShrink: 0 },
  studentInfo: { flex: 1, minWidth: '120px' },
  studentName: { fontWeight: '600', color: '#0f172a', marginBottom: '2px' },
  studentDetail: { fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' },
  roleBadgeSmall: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '14px', fontSize: '10px', fontWeight: '500', width: 'fit-content' },
  studentPointsDisplay: { display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px', padding: '4px 12px', backgroundColor: '#fef3c7', borderRadius: '12px', fontSize: '13px', fontWeight: '600', color: '#d97706' },
  studentActions: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  assignButton: { padding: '6px 14px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  reassignButton: { padding: '5px 12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '500', cursor: 'pointer' },
  teamBadgeA: { padding: '4px 12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  teamBadgeB: { padding: '4px 12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyText: { fontSize: '14px', color: '#64748b', marginBottom: '6px' },
  emptySubtext: { fontSize: '12px', color: '#94a3b8' },
  loadingStudents: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px' },
  errorState: { textAlign: 'center', padding: '60px 20px' },
  errorText: { fontSize: '14px', color: '#ef4444', marginBottom: '12px' },
  retryButton: { padding: '8px 16px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' },
  historyContainer: { maxWidth: '1400px', margin: '0 auto' },
  loadingHistory: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' },
  emptyHistory: { textAlign: 'center', padding: '80px 20px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0' },
  summaryCards: { display: 'grid', gap: '16px', marginBottom: '32px' },
  summaryCard: { backgroundColor: 'white', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #e2e8f0' },
  summaryLabel: { fontSize: '10px', color: '#64748b' },
  summaryValue: { fontSize: '18px', fontWeight: '700', color: '#0f172a' },
  historyTimeline: { backgroundColor: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0' },
  historyTitle: { fontWeight: '600', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
  timelineList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  historyItem: { display: 'flex', gap: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' },
  historyDate: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', minWidth: '80px' },
  historyTime: { fontSize: '10px', color: '#94a3b8' },
  historyContent: { flex: 1 },
  roundNumber: { fontWeight: '600', color: '#6366f1', marginBottom: '6px' },
  questionPreview: { fontSize: '12px', color: '#64748b', marginBottom: '10px', fontStyle: 'italic' },
  scoreContainer: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '12px', flexWrap: 'wrap' },
  teamAScore: { display: 'flex', alignItems: 'center', gap: '8px' },
  teamBScore: { display: 'flex', alignItems: 'center', gap: '8px' },
  teamALabel: { fontSize: '12px', fontWeight: '500', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '12px' },
  teamBLabel: { fontSize: '12px', fontWeight: '500', color: '#991b1b', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '12px' },
  scoreValue: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
  vsDivider: { fontSize: '12px', fontWeight: '600', color: '#94a3b8' },
  gameDetails: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' },
  winnerBadge: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '500', padding: '4px 12px', borderRadius: '20px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', borderRadius: '24px', maxWidth: '460px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalTitle: { fontWeight: '600', color: '#0f172a', marginBottom: '8px', textAlign: 'center' },
  modalSubtitle: { color: '#64748b', textAlign: 'center', marginBottom: '24px' },
  modalSection: { marginBottom: '24px' },
  modalLabel: { display: 'block', fontWeight: '500', color: '#475569', marginBottom: '12px' },
  teamOptions: { display: 'flex', gap: '12px' },
  teamOptionButton: { flex: 1, padding: '10px', border: '2px solid #e2e8f0', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white' },
  teamOptionSelectedA: { backgroundColor: '#f0fdf4', borderColor: '#22c55e', color: '#166534' },
  teamOptionSelectedB: { backgroundColor: '#fef2f2', borderColor: '#ef4444', color: '#991b1b' },
  roleOptions: { display: 'flex', gap: '12px' },
  roleOptionButton: { flex: 1, padding: '8px', border: '2px solid #e2e8f0', borderRadius: '10px', fontWeight: '500', cursor: 'pointer', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  roleOptionAnalyzer: { backgroundColor: '#f3e8ff', borderColor: '#a855f7', color: '#6b21a5' },
  roleOptionChecker: { backgroundColor: '#fffbeb', borderColor: '#f59e0b', color: '#b45309' },
  roleOptionSolver: { backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#065f46' },
  modalActions: { display: 'flex', gap: '12px', marginTop: '8px' },
  cancelModalButton: { flex: 1, padding: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '500', cursor: 'pointer' },
  confirmModalButton: { flex: 1, padding: '10px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '500', cursor: 'pointer' },
};

// Add global styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .spin { animation: spin 1s linear infinite; }
  
  /* Responsive styles */
  @media (max-width: 768px) {
    .team-member-item { flex-direction: column !important; text-align: center !important; }
    .team-member-info { text-align: center !important; }
    .student-item, .student-item-assigned-a, .student-item-assigned-b { flex-direction: column !important; text-align: center !important; }
    .student-avatar { margin: 0 auto !important; }
    .student-info { text-align: center !important; }
    .student-points-display { margin: 8px auto !important; }
    .student-actions { justify-content: center !important; width: 100% !important; }
    .history-item { flex-direction: column !important; }
    .score-container { flex-direction: column !important; align-items: flex-start !important; }
    .team-options, .role-options { flex-direction: column !important; }
  }
  
  @media (max-width: 480px) {
    .team-member-avatar, .student-avatar { width: 50px !important; height: 50px !important; margin: 0 auto 8px auto !important; font-size: 18px !important; }
    .team-member-name, .student-name { font-size: 14px !important; }
    .role-badge, .student-points-badge { font-size: 10px !important; }
    .points-value { font-size: 24px !important; }
    .stat-value { font-size: 16px !important; }
  }
`;
document.head.appendChild(styleSheet);

export default Collaboration;