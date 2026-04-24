// src/menu/Collaboration.jsx
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FiBookOpen, FiChevronDown, FiUsers, FiUser, FiMail, FiRefreshCw, 
  FiStar, FiUserCheck, FiUserX, FiUserPlus, FiPlay,
  FiClock, FiAward, FiTrendingUp, FiPieChart, FiBarChart2, FiCalendar,
  FiCheckCircle, FiXCircle, FiActivity, FiTarget, FiPlus
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
  const [gameHistory, setGameHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('teams');
  const [studentPoints, setStudentPoints] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [pointsLastUpdated, setPointsLastUpdated] = useState(null);

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

  // Load students for the selected class with their team assignments
  const loadStudents = async (classId) => {
    setLoadingStudents(true);
    setError(null);
    
    try {
      console.log('📋 Loading students for class:', classId);
      
      // Get students from classService (now returns with real Google user data)
      const studentsData = await classService.getClassStudents(classId);
      console.log('📋 Raw students data from service:', studentsData);
      
      // Get team assignments
      const assignments = await classService.getClassTeamAssignments(classId);
      console.log('📋 Team assignments:', assignments);
      
      const assignmentMap = {};
      assignments.forEach(assignment => {
        assignmentMap[assignment.student_id] = {
          team: assignment.team,
          role: assignment.role
        };
      });
      
      // Build student list with proper user data (name and email from Google Auth)
      const studentList = studentsData.map(enrollment => {
        const userData = enrollment.users || {};
        
        // Use the real Google name and email
        let studentName = userData.name || 'Student';
        let studentEmail = userData.email || '';
        
        // Fix any remaining placeholder names
        if (studentName === 'User' || studentName === '' || studentName === 'Student') {
          studentName = studentEmail?.split('@')[0] || 'Student';
        }
        
        return {
          id: enrollment.student_id,
          name: studentName,
          email: studentEmail,
          joined_at: enrollment.joined_at,
          team: assignmentMap[enrollment.student_id]?.team || null,
          role: assignmentMap[enrollment.student_id]?.role || null,
          avatar_url: userData.avatar_url,
          points: enrollment.points || 0
        };
      });
      
      setStudents(studentList);
      
      // Create points map
      const pointsMap = {};
      studentList.forEach(student => {
        pointsMap[student.id] = student.points;
      });
      setStudentPoints(pointsMap);
      
      console.log('📋 Final student list:', studentList.length, 'students');
      console.log('📋 Student names and emails (from Google):', studentList.map(s => ({ 
        name: s.name, 
        email: s.email, 
        points: s.points, 
        team: s.team 
      })));
      
      setPointsLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Failed to load students. Please try again.');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Load points for students
  const loadStudentPoints = async (classId) => {
    try {
      const { data, error } = await supabase
        .from('student_points')
        .select('*')
        .eq('class_id', classId);
      
      if (error) {
        console.error('Error loading points:', error);
        return;
      }
      
      const pointsMap = {};
      if (data && data.length > 0) {
        data.forEach(point => {
          pointsMap[point.student_id] = point.points;
        });
      }
      
      setStudentPoints(pointsMap);
      setPointsLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading student points:', error);
    }
  };

  // Refresh all data
  const refreshAll = async () => {
    if (selectedClass) {
      setRefreshing(true);
      await loadStudents(selectedClass.id);
      await loadGameHistory(selectedClass.id);
      setRefreshing(false);
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
      const result = await classService.assignStudentToTeam(selectedClass.id, student.id, team, role);
      if (result) {
        return true;
      } else {
        throw new Error('No result returned from server');
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert(`Failed to save assignment: ${error.message || 'Please try again.'}`);
      return false;
    } finally {
      setSavingAssignment(false);
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
      setStudents(students.map(s => 
        s.id === selectedStudent.id 
          ? { ...s, team: selectedTeam, role: selectedRole }
          : s
      ));
      setShowAssignModal(false);
      setSelectedStudent(null);
      setSelectedTeam(null);
      setSelectedRole(null);
    }
  };

  const handleRemoveFromTeam = async (studentId) => {
    if (!selectedClass?.id) return;
    
    try {
      await classService.removeStudentFromTeam(selectedClass.id, studentId);
      setStudents(students.map(s => 
        s.id === studentId 
          ? { ...s, team: null, role: null }
          : s
      ));
    } catch (error) {
      console.error('Error removing student from team:', error);
      alert('Failed to remove student from team. Please try again.');
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
        return { icon: <FiUserCheck size={12} />, label: 'Analyzer', color: '#8b5cf6', bgColor: '#f3e8ff' };
      case 'checker':
        return { icon: <FiUserX size={12} />, label: 'Checker', color: '#f59e0b', bgColor: '#fffbeb' };
      case 'solver':
        return { icon: <FiUserPlus size={12} />, label: 'Solver', color: '#10b981', bgColor: '#ecfdf5' };
      default:
        return { icon: null, label: '', color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const teamAStudents = students.filter(s => s.team === 'A');
  const teamBStudents = students.filter(s => s.team === 'B');
  const unassignedStudents = students.filter(s => !s.team);

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
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.mainTitle}>Collaboration Hub</h1>
          <p style={styles.subtitle}>Manage teams, track performance, and start collaborative rounds</p>
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
                      <FiBookOpen size={18} color="#6366f1" />
                      <span style={styles.selectedClassName}>{selectedClass.name}</span>
                    </>
                  ) : (
                    <span style={styles.placeholderText}>Select a class</span>
                  )}
                </div>
                <FiChevronDown size={20} style={{
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
                          <FiBookOpen size={16} color="#6b7280" />
                          <span style={styles.dropdownItemName}>{classItem.name}</span>
                        </div>
                        <span style={styles.studentCount}>
                          <FiUsers size={12} /> {classItem.students_count || 0}
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
          {/* Stats Dashboard */}
          {stats && stats.totalGames > 0 && (
            <div style={styles.statsGrid}>
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

          {/* Tab Navigation */}
          <div style={styles.tabContainer}>
            <button 
              style={{...styles.tabButton, ...(activeTab === 'teams' ? styles.tabActive : {})}}
              onClick={() => setActiveTab('teams')}
            >
              <FiUsers size={16} />
              Team Management ({students.length} students)
            </button>
            <button 
              style={{...styles.tabButton, ...(activeTab === 'history' ? styles.tabActive : {})}}
              onClick={() => setActiveTab('history')}
            >
              <FiClock size={16} />
              Game History ({gameHistory.length})
            </button>
          </div>

          {/* Main Content Area - Teams Tab */}
          {activeTab === 'teams' ? (
            <div style={styles.splitLayout}>
              {/* Left Side - Teams Containers */}
              <div style={styles.leftSide}>
                <div style={styles.teamsWrapper}>
                  {/* Team A Container */}
                  <div style={styles.teamContainerA}>
                    <div style={styles.teamHeaderA}>
                      <div style={styles.teamIcon}>⚡</div>
                      <h3 style={styles.teamTitle}>Team A</h3>
                      <span style={styles.teamCount}>{teamAStudents.length}</span>
                    </div>
                    <div style={styles.teamMembersList}>
                      {teamAStudents.length === 0 ? (
                        <div style={styles.emptyTeam}>
                          <p>No members assigned yet</p>
                        </div>
                      ) : (
                        teamAStudents.map((student) => {
                          const roleInfo = getRoleInfo(student.role);
                          const points = studentPoints[student.id] || 0;
                          return (
                            <div key={student.id} style={styles.teamMemberItem}>
                              <div style={styles.teamMemberAvatar}>
                                {student.name?.charAt(0) || 'S'}
                              </div>
                              <div style={styles.teamMemberInfo}>
                                <div style={styles.teamMemberName}>{student.name}</div>
                                {student.email && (
                                  <div style={styles.teamMemberEmail}>
                                    <FiMail size={10} />
                                    <span>{student.email}</span>
                                  </div>
                                )}
                                <div style={{...styles.roleBadge, backgroundColor: roleInfo.bgColor, color: roleInfo.color}}>
                                  {roleInfo.icon}
                                  <span>{roleInfo.label}</span>
                                </div>
                                <div style={styles.studentPointsBadge}>
                                  <FiStar size={10} color="#f59e0b" /> {points} pts
                                </div>
                              </div>
                              <button 
                                style={styles.removeButton}
                                onClick={() => handleRemoveFromTeam(student.id)}
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
                      <h3 style={styles.teamTitle}>Team B</h3>
                      <span style={styles.teamCount}>{teamBStudents.length}</span>
                    </div>
                    <div style={styles.teamMembersList}>
                      {teamBStudents.length === 0 ? (
                        <div style={styles.emptyTeam}>
                          <p>No members assigned yet</p>
                        </div>
                      ) : (
                        teamBStudents.map((student) => {
                          const roleInfo = getRoleInfo(student.role);
                          const points = studentPoints[student.id] || 0;
                          return (
                            <div key={student.id} style={styles.teamMemberItem}>
                              <div style={styles.teamMemberAvatar}>
                                {student.name?.charAt(0) || 'S'}
                              </div>
                              <div style={styles.teamMemberInfo}>
                                <div style={styles.teamMemberName}>{student.name}</div>
                                {student.email && (
                                  <div style={styles.teamMemberEmail}>
                                    <FiMail size={10} />
                                    <span>{student.email}</span>
                                  </div>
                                )}
                                <div style={{...styles.roleBadge, backgroundColor: roleInfo.bgColor, color: roleInfo.color}}>
                                  {roleInfo.icon}
                                  <span>{roleInfo.label}</span>
                                </div>
                                <div style={styles.studentPointsBadge}>
                                  <FiStar size={10} color="#f59e0b" /> {points} pts
                                </div>
                              </div>
                              <button 
                                style={styles.removeButton}
                                onClick={() => handleRemoveFromTeam(student.id)}
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
                
                {/* Start Round Button */}
                <button style={styles.startButton} onClick={handleStartRound}>
                  <FiPlay size={20} />
                  Start New Round
                </button>
              </div>

              {/* Right Side - All Students List */}
              <div style={styles.rightSide}>
                <div style={styles.studentsCard}>
                  <div style={styles.studentsHeader}>
                    <h3 style={styles.cardTitle}>
                      <FiUsers size={20} />
                      All Students ({students.length})
                    </h3>
                    <div style={styles.headerButtons}>
                      {pointsLastUpdated && (
                        <span style={styles.lastUpdated}>
                          Updated: {pointsLastUpdated.toLocaleTimeString()}
                        </span>
                      )}
                      <button onClick={refreshAll} style={styles.refreshButton} title="Refresh students">
                        <FiRefreshCw size={16} className={refreshing ? 'spin' : ''} />
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
                      {/* Unassigned Students */}
                      {unassignedStudents.map((student) => {
                        const points = studentPoints[student.id] || 0;
                        return (
                          <div key={student.id} style={styles.studentItem}>
                            <div style={styles.studentAvatar}>
                              {student.name?.charAt(0) || 'S'}
                            </div>
                            <div style={styles.studentInfo}>
                              <div style={styles.studentName}>{student.name}</div>
                              {student.email && (
                                <div style={styles.studentDetail}>
                                  <FiMail size={12} />
                                  <span>{student.email}</span>
                                </div>
                              )}
                              <div style={styles.studentPointsDisplay}>
                                <FiStar size={10} color="#f59e0b" /> {points} points
                              </div>
                            </div>
                            <div style={styles.studentActions}>
                              <button 
                                style={styles.assignButton} 
                                onClick={() => handleAssignTeam(student)}
                                disabled={savingAssignment}
                              >
                                <FiPlus size={12} />
                                Assign
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Team A Students */}
                      {teamAStudents.map((student) => {
                        const roleInfo = getRoleInfo(student.role);
                        const points = studentPoints[student.id] || 0;
                        return (
                          <div key={student.id} style={styles.studentItemAssignedA}>
                            <div style={styles.studentAvatar}>
                              {student.name?.charAt(0) || 'S'}
                            </div>
                            <div style={styles.studentInfo}>
                              <div style={styles.studentName}>{student.name}</div>
                              {student.email && (
                                <div style={styles.studentDetail}>
                                  <FiMail size={12} />
                                  <span>{student.email}</span>
                                </div>
                              )}
                              <div style={styles.studentPointsDisplay}>
                                <FiStar size={10} color="#f59e0b" /> {points} points
                              </div>
                            </div>
                            <div style={styles.studentActions}>
                              <div style={styles.teamBadgeA}>Team A</div>
                              <div style={{...styles.roleBadgeSmall, backgroundColor: roleInfo.bgColor, color: roleInfo.color}}>
                                {roleInfo.icon}
                                <span>{roleInfo.label}</span>
                              </div>
                              <button 
                                style={styles.reassignButton} 
                                onClick={() => handleAssignTeam(student)}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Team B Students */}
                      {teamBStudents.map((student) => {
                        const roleInfo = getRoleInfo(student.role);
                        const points = studentPoints[student.id] || 0;
                        return (
                          <div key={student.id} style={styles.studentItemAssignedB}>
                            <div style={styles.studentAvatar}>
                              {student.name?.charAt(0) || 'S'}
                            </div>
                            <div style={styles.studentInfo}>
                              <div style={styles.studentName}>{student.name}</div>
                              {student.email && (
                                <div style={styles.studentDetail}>
                                  <FiMail size={12} />
                                  <span>{student.email}</span>
                                </div>
                              )}
                              <div style={styles.studentPointsDisplay}>
                                <FiStar size={10} color="#f59e0b" /> {points} points
                              </div>
                            </div>
                            <div style={styles.studentActions}>
                              <div style={styles.teamBadgeB}>Team B</div>
                              <div style={{...styles.roleBadgeSmall, backgroundColor: roleInfo.bgColor, color: roleInfo.color}}>
                                {roleInfo.icon}
                                <span>{roleInfo.label}</span>
                              </div>
                              <button 
                                style={styles.reassignButton} 
                                onClick={() => handleAssignTeam(student)}
                              >
                                Edit
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
            /* Game History Section */
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
                    <div style={styles.summaryCards}>
                      <div style={styles.summaryCard}>
                        <FiBarChart2 size={20} color="#6366f1" />
                        <div>
                          <div style={styles.summaryLabel}>Total Rounds</div>
                          <div style={styles.summaryValue}>{stats.totalGames}</div>
                        </div>
                      </div>
                      <div style={styles.summaryCard}>
                        <FiBarChart2 size={20} color="#ec4899" />
                        <div>
                          <div style={styles.summaryLabel}>Team A Wins</div>
                          <div style={styles.summaryValue}>{stats.teamAWins}</div>
                        </div>
                      </div>
                      <div style={styles.summaryCard}>
                        <FiPieChart size={20} color="#10b981" />
                        <div>
                          <div style={styles.summaryLabel}>Team B Wins</div>
                          <div style={styles.summaryValue}>{stats.teamBWins}</div>
                        </div>
                      </div>
                      <div style={styles.summaryCard}>
                        <FiPieChart size={20} color="#f59e0b" />
                        <div>
                          <div style={styles.summaryLabel}>Ties</div>
                          <div style={styles.summaryValue}>{stats.ties}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={styles.historyTimeline}>
                    <h3 style={styles.historyTitle}>
                      <FiClock size={18} />
                      Round History
                    </h3>
                    <div style={styles.timelineList}>
                      {gameHistory.map((game) => (
                        <div key={game.id} style={styles.historyItem}>
                          <div style={styles.historyDate}>
                            <FiCalendar size={14} />
                            <span>{new Date(game.date).toLocaleDateString()}</span>
                            <span style={styles.historyTime}>{new Date(game.date).toLocaleTimeString()}</span>
                          </div>
                          <div style={styles.historyContent}>
                            <div style={styles.roundNumber}>Round #{game.roundNumber}</div>
                            <div style={styles.questionPreview}>Question: {game.question.substring(0, 60)}...</div>
                            <div style={styles.scoreContainer}>
                              <div style={styles.teamAScore}>
                                <span style={styles.teamALabel}>Team A</span>
                                <span style={styles.scoreValue}>{game.teamAScore > 0 ? '✓ Correct' : '✗ Incorrect'}</span>
                                {game.teamAAnswer && <span style={styles.answerPreview}>Answer: {game.teamAAnswer}</span>}
                              </div>
                              <div style={styles.vsDivider}>VS</div>
                              <div style={styles.teamBScore}>
                                <span style={styles.teamBLabel}>Team B</span>
                                <span style={styles.scoreValue}>{game.teamBScore > 0 ? '✓ Correct' : '✗ Incorrect'}</span>
                                {game.teamBAnswer && <span style={styles.answerPreview}>Answer: {game.teamBAnswer}</span>}
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

      {/* Assign Team Modal */}
      {showAssignModal && selectedStudent && (
        <div style={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Assign {selectedStudent.name}</h3>
            <p style={styles.modalSubtitle}>{selectedStudent.email}</p>
            
            <div style={styles.modalSection}>
              <label style={styles.modalLabel}>Select Team:</label>
              <div style={styles.teamOptions}>
                <button 
                  style={{...styles.teamOptionButton, ...(selectedTeam === 'A' ? styles.teamOptionSelectedA : {})}} 
                  onClick={() => setSelectedTeam('A')}
                >
                  ⚡ Team A
                </button>
                <button 
                  style={{...styles.teamOptionButton, ...(selectedTeam === 'B' ? styles.teamOptionSelectedB : {})}} 
                  onClick={() => setSelectedTeam('B')}
                >
                  🔥 Team B
                </button>
              </div>
            </div>

            <div style={styles.modalSection}>
              <label style={styles.modalLabel}>Select Role:</label>
              <div style={styles.roleOptions}>
                <button 
                  style={{...styles.roleOptionButton, ...(selectedRole === 'analyzer' ? styles.roleOptionAnalyzer : {})}} 
                  onClick={() => setSelectedRole('analyzer')}
                >
                  <FiUserCheck size={16} />
                  Analyzer
                </button>
                <button 
                  style={{...styles.roleOptionButton, ...(selectedRole === 'checker' ? styles.roleOptionChecker : {})}} 
                  onClick={() => setSelectedRole('checker')}
                >
                  <FiUserX size={16} />
                  Checker
                </button>
                <button 
                  style={{...styles.roleOptionButton, ...(selectedRole === 'solver' ? styles.roleOptionSolver : {})}} 
                  onClick={() => setSelectedRole('solver')}
                >
                  <FiUserPlus size={16} />
                  Solver
                </button>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelModalButton} onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button 
                style={styles.confirmModalButton} 
                onClick={handleTeamAndRoleSelect}
                disabled={savingAssignment}
              >
                {savingAssignment ? 'Saving...' : 'Assign Student'}
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
    padding: '32px 24px',
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
    transition: 'all 0.2s',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto 32px auto',
    flexWrap: 'wrap',
    gap: '20px',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '8px 0 0 0',
  },
  classSelectorWrapper: {
    minWidth: '260px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    gap: '20px',
    backgroundColor: '#f8fafc',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyClassState: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: 'white',
    borderRadius: '24px',
    maxWidth: '600px',
    margin: '0 auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  emptyClassIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  emptyClassTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '8px',
  },
  emptyClassText: {
    fontSize: '14px',
    color: '#64748b',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    maxWidth: '1400px',
    margin: '0 auto 32px auto',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    backgroundColor: '#eef2ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6366f1',
    fontSize: '24px',
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    maxWidth: '1400px',
    margin: '0 auto 24px auto',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0',
  },
  tabButton: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px 10px 0 0',
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#6366f1',
    borderBottom: '2px solid #6366f1',
    backgroundColor: '#eef2ff',
  },
  splitLayout: {
    display: 'flex',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    flexWrap: 'wrap',
  },
  leftSide: {
    flex: '1',
    minWidth: '350px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightSide: {
    flex: '1.2',
    minWidth: '350px',
  },
  studentsCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    minHeight: '500px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  studentsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  headerButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  lastUpdated: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  refreshButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    color: '#64748b',
    transition: 'all 0.2s',
  },
  teamsWrapper: {
    display: 'flex',
    flexDirection: 'row',
    gap: '16px',
  },
  teamContainerA: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #bbf7d0',
  },
  teamContainerB: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #fecaca',
  },
  teamHeaderA: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #bbf7d0',
    color: '#166534',
  },
  teamHeaderB: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #fecaca',
    color: '#991b1b',
  },
  teamIcon: {
    fontSize: '18px',
  },
  teamTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    flex: 1,
  },
  teamCount: {
    backgroundColor: 'white',
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
  },
  teamMembersList: {
    maxHeight: '350px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  teamMemberItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '12px',
  },
  teamMemberAvatar: {
    width: '32px',
    height: '32px',
    backgroundColor: '#f1f5f9',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    color: '#475569',
    flexShrink: 0,
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '2px',
  },
  teamMemberEmail: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    color: '#64748b',
    marginBottom: '4px',
  },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '500',
    width: 'fit-content',
  },
  studentPointsBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
    fontSize: '10px',
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    padding: '2px 6px',
    borderRadius: '10px',
  },
  roleBadgeSmall: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '14px',
    fontSize: '10px',
    fontWeight: '500',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#ef4444',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  emptyTeam: {
    textAlign: 'center',
    padding: '30px',
    color: '#94a3b8',
    fontSize: '12px',
  },
  startButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.2s',
  },
  customDropdown: {
    position: 'relative',
    width: '100%',
  },
  dropdownButton: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dropdownButtonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  selectedClassName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#0f172a',
  },
  placeholderText: {
    color: '#94a3b8',
    fontSize: '14px',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
    zIndex: 1000,
    maxHeight: '300px',
    overflowY: 'auto',
  },
  dropdownItem: {
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  dropdownItemSelected: {
    backgroundColor: '#eef2ff',
  },
  dropdownItemContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dropdownItemName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#0f172a',
  },
  studentCount: {
    fontSize: '12px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  emptyDropdown: {
    padding: '30px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '13px',
  },
  studentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  studentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  studentItemAssignedA: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f0fdf4',
    borderRadius: '12px',
    border: '1px solid #bbf7d0',
  },
  studentItemAssignedB: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#fef2f2',
    borderRadius: '12px',
    border: '1px solid #fecaca',
  },
  studentAvatar: {
    width: '40px',
    height: '40px',
    backgroundColor: '#e2e8f0',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    color: '#475569',
    flexShrink: 0,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '2px',
  },
  studentDetail: {
    fontSize: '11px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  studentPointsDisplay: {
    fontSize: '11px',
    color: '#f59e0b',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
    backgroundColor: '#fef3c7',
    padding: '2px 8px',
    borderRadius: '12px',
    width: 'fit-content',
  },
  studentActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  assignButton: {
    padding: '6px 14px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  reassignButton: {
    padding: '5px 12px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  teamBadgeA: {
    padding: '4px 12px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
  },
  teamBadgeB: {
    padding: '4px 12px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '6px',
  },
  emptySubtext: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  loadingStudents: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: '12px',
  },
  smallSpinner: {
    width: '30px',
    height: '30px',
    border: '3px solid #e2e8f0',
        borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  errorText: {
    fontSize: '14px',
    color: '#ef4444',
    marginBottom: '12px',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  historyContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  loadingHistory: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    gap: '16px',
  },
  emptyHistory: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: 'white',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
  },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    border: '1px solid #e2e8f0',
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#64748b',
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
  },
  historyTimeline: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid #e2e8f0',
  },
  historyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  historyItem: {
    display: 'flex',
    gap: '20px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
  },
  historyDate: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    minWidth: '80px',
    fontSize: '12px',
    color: '#64748b',
  },
  historyTime: {
    fontSize: '10px',
    color: '#94a3b8',
  },
  historyContent: {
    flex: 1,
  },
  roundNumber: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: '6px',
  },
  questionPreview: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '10px',
    fontStyle: 'italic',
  },
  answerPreview: {
    fontSize: '10px',
    color: '#94a3b8',
    marginLeft: '8px',
  },
  scoreContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  teamAScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  teamBScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  teamALabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#166534',
    backgroundColor: '#dcfce7',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  teamBLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  scoreValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
  },
  vsDivider: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
  },
  gameDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '12px',
  },
  winnerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '500',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '28px',
    width: '90%',
    maxWidth: '460px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '8px',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: '24px',
  },
  modalSection: {
    marginBottom: '24px',
  },
  modalLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    marginBottom: '12px',
  },
  teamOptions: {
    display: 'flex',
    gap: '12px',
  },
  teamOptionButton: {
    flex: 1,
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    backgroundColor: 'white',
    transition: 'all 0.2s',
  },
  teamOptionSelectedA: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
    color: '#166534',
  },
  teamOptionSelectedB: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    color: '#991b1b',
  },
  roleOptions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  roleOptionButton: {
    flex: 1,
    padding: '10px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  roleOptionAnalyzer: {
    backgroundColor: '#f3e8ff',
    borderColor: '#a855f7',
    color: '#6b21a5',
  },
  roleOptionChecker: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
    color: '#b45309',
  },
  roleOptionSolver: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
    color: '#065f46',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  cancelModalButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  confirmModalButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .spin {
    animation: spin 1s linear infinite;
  }
  
  @media (max-width: 768px) {
    .teams-wrapper {
      flex-direction: column;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Collaboration;