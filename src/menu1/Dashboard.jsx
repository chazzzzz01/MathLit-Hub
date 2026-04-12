import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FiUsers, FiBookOpen, FiTrendingUp, FiCalendar, 
  FiAward, FiClock, FiActivity, FiStar, FiPieChart,
  FiBarChart2, FiTarget, FiList, FiGrid, FiChevronDown,
  FiUser, FiCheckCircle, FiDollarSign, FiAlertCircle,
  FiMessageSquare, FiClipboard, FiCheckSquare, FiBarChart,
  FiPlusCircle, FiZap, FiCode, FiTrendingUp as FiTrending
} from 'react-icons/fi';
import { classService } from '../services/classService';

function Dashboard() {
  const { user, userData } = useOutletContext();
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [notes, setNotes] = useState('');
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    activeClasses: 0,
    averageProgress: 0,
    completionRate: 0,
    totalMissions: 0,
    completedMissions: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    topPerformers: [],
    classesData: [],
    dailyActivityLog: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeacherClasses();
  }, [user]);

  useEffect(() => {
    if (classes.length > 0 || selectedClass !== 'all') {
      loadTeacherAnalytics();
      loadStudentsData();
    }
  }, [selectedClass, classes]);

  const loadTeacherClasses = async () => {
    if (!user?.dbId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const teacherClasses = await classService.getTeacherClasses(user.dbId);
      setClasses(teacherClasses || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsData = async () => {
    if (!user?.dbId) return;

    try {
      let teacherClasses = [];
      if (selectedClass === 'all') {
        teacherClasses = await classService.getTeacherClasses(user.dbId);
      } else {
        const singleClass = await classService.getClassById(selectedClass);
        teacherClasses = singleClass ? [singleClass] : [];
      }

      if (!teacherClasses || teacherClasses.length === 0) {
        setStudentsList([]);
        return;
      }

      let allStudents = [];
      
      for (const classItem of teacherClasses) {
        const students = await classService.getClassStudents(classItem.id);
        if (!students || students.length === 0) continue;

        for (const enrollment of students) {
          const studentUser = enrollment.users;
          let studentName = 'Unknown Student';
          let studentEmail = '';
          
          if (studentUser) {
            studentName = studentUser.name || studentUser.email?.split('@')[0] || 'Unknown Student';
            studentEmail = studentUser.email || '';
          }
          
          const missions = await classService.getClassMissions(classItem.id);
          const studentMissions = missions.filter(m => m.assigned_to === enrollment.student_id);
          
          const completedMissions = studentMissions.filter(m => m.status === 'completed').length || 0;
          const totalMissions = studentMissions.length || 0;
          
          const allScores = studentMissions
            .filter(item => item.score)
            .map(item => item.score);
          const averageScore = allScores.length > 0 
            ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) 
            : 0;
          
          // Calculate XP points (mock data - can be adjusted based on actual data)
          const xpPoints = Math.round(enrollment.progress * 10);
          
          // Calculate games completed (mock data)
          const totalGames = Math.floor(Math.random() * 20) + 5;
          const completedGames = Math.floor((enrollment.progress / 100) * totalGames);
          
          allStudents.push({
            id: enrollment.student_id,
            name: studentName,
            email: studentEmail,
            className: classItem.name,
            classId: classItem.id,
            progress: enrollment.progress || 0,
            totalMissions: totalMissions,
            completedMissions: completedMissions,
            missionCompletionRate: totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0,
            averageScore: averageScore,
            xpPoints: xpPoints,
            totalGames: totalGames,
            completedGames: completedGames,
            gameCompletionRate: totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0,
            lastActivity: enrollment.last_activity || enrollment.joined_at,
            status: enrollment.status || 'active'
          });
        }
      }
      
      allStudents.sort((a, b) => b.progress - a.progress);
      setStudentsList(allStudents);
      
    } catch (error) {
      console.error('Error loading students data:', error);
    }
  };

  const loadTeacherAnalytics = async () => {
    if (!user?.dbId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let teacherClasses = [];
      if (selectedClass === 'all') {
        teacherClasses = await classService.getTeacherClasses(user.dbId);
      } else {
        const singleClass = await classService.getClassById(selectedClass);
        teacherClasses = singleClass ? [singleClass] : [];
      }
      
      if (!teacherClasses || teacherClasses.length === 0) {
        setAnalytics(prev => ({
          ...prev,
          activeClasses: 0,
          totalStudents: 0,
          averageProgress: 0,
          completionRate: 0,
          totalMissions: 0,
          completedMissions: 0,
          weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
          dailyActivityLog: []
        }));
        setLoading(false);
        return;
      }

      let totalStudentsCount = 0;
      let totalProgressSum = 0;
      let totalClassesWithStudents = 0;
      let totalMissionsCount = 0;
      let totalCompletedMissions = 0;
      let allStudentsData = [];
      let classesAnalytics = [];
      let allActivityData = [];

      for (const classItem of teacherClasses) {
        const students = await classService.getClassStudents(classItem.id);
        const studentsCount = students.length;
        const missions = await classService.getClassMissions(classItem.id);
        const missionsCount = missions.length;
        const completedMissionsCount = missions.filter(m => m.status === 'completed').length;
        
        for (const student of students) {
          const lastActivityDate = student.last_activity || student.joined_at;
          if (lastActivityDate) {
            allActivityData.push({
              date: new Date(lastActivityDate),
              studentId: student.student_id,
              studentName: student.users?.name,
              classId: classItem.id,
              className: classItem.name,
              progress: student.progress || 0
            });
          }
        }
        
        let classProgressSum = 0;
        students.forEach(student => {
          classProgressSum += student.progress || 0;
        });
        const classAverageProgress = studentsCount > 0 ? classProgressSum / studentsCount : 0;
        
        totalStudentsCount += studentsCount;
        if (studentsCount > 0) {
          totalProgressSum += classAverageProgress;
          totalClassesWithStudents++;
        }
        
        totalMissionsCount += missionsCount;
        totalCompletedMissions += completedMissionsCount;
        
        students.forEach(student => {
          allStudentsData.push({
            id: student.student_id,
            name: student.users?.name || 'Student',
            email: student.users?.email,
            progress: student.progress || 0,
            className: classItem.name,
            classId: classItem.id,
            lastActivity: student.last_activity
          });
        });
        
        classesAnalytics.push({
          id: classItem.id,
          name: classItem.name,
          code: classItem.code,
          studentsCount: studentsCount,
          averageProgress: Math.round(classAverageProgress),
          missionsCount: missionsCount,
          completedMissions: completedMissionsCount,
          completionRate: missionsCount > 0 ? Math.round((completedMissionsCount / missionsCount) * 100) : 0
        });
      }
      
      const averageProgress = totalClassesWithStudents > 0 
        ? Math.round(totalProgressSum / totalClassesWithStudents)
        : 0;
      
      const completionRate = totalMissionsCount > 0
        ? Math.round((totalCompletedMissions / totalMissionsCount) * 100)
        : 0;
      
      const topPerformers = allStudentsData
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 5)
        .map((student, index) => ({
          rank: index + 1,
          name: student.name,
          progress: student.progress,
          className: student.className,
          grade: getGradeFromProgress(student.progress)
        }));
      
      const weeklyActivity = calculateWeeklyActivity(allActivityData, totalStudentsCount);
      const dailyActivityLog = generateDailyActivityLog(allActivityData, totalStudentsCount);
      
      setAnalytics({
        totalStudents: totalStudentsCount,
        activeClasses: teacherClasses.length,
        averageProgress: averageProgress,
        completionRate: completionRate,
        totalMissions: totalMissionsCount,
        completedMissions: totalCompletedMissions,
        weeklyActivity: weeklyActivity,
        topPerformers: topPerformers,
        classesData: classesAnalytics,
        dailyActivityLog: dailyActivityLog
      });
      
    } catch (error) {
      console.error('Error loading teacher analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeFromProgress = (progress) => {
    if (progress >= 90) return 'A+';
    if (progress >= 80) return 'A';
    if (progress >= 70) return 'B';
    if (progress >= 60) return 'C';
    if (progress >= 50) return 'D';
    return 'F';
  };

  const calculateWeeklyActivity = (activityData, totalStudents) => {
    const now = new Date();
    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
    
    activityData.forEach(activity => {
      const activityDate = new Date(activity.date);
      if (activityDate >= startOfWeek) {
        const dayOfWeek = activityDate.getDay();
        let dayIndex = dayOfWeek - 1;
        if (dayOfWeek === 0) dayIndex = 6;
        if (dayIndex >= 0 && dayIndex < 7) {
          weeklyActivity[dayIndex]++;
        }
      }
    });
    
    if (totalStudents > 0) {
      return weeklyActivity.map(count => Math.min(100, Math.round((count / totalStudents) * 100)));
    }
    return [65, 72, 80, 78, 85, 90, 88];
  };

  const generateDailyActivityLog = (activityData, totalStudents) => {
    const logs = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const activitiesOnDay = activityData.filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate.toDateString() === date.toDateString();
      });
      
      const uniqueStudents = new Set(activitiesOnDay.map(a => a.studentId)).size;
      const activityPercentage = totalStudents > 0 ? Math.round((uniqueStudents / totalStudents) * 100) : 0;
      
      logs.push({
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        uniqueStudents: uniqueStudents,
        activityPercentage: activityPercentage
      });
    }
    
    return logs;
  };

  const getPerformanceColor = (progress) => {
    if (progress >= 80) return '#10b981';
    if (progress >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getPerformanceLabel = (progress) => {
    if (progress >= 80) return 'Excellent';
    if (progress >= 60) return 'Good';
    return 'Average';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mock data for course counts (from the image)
  const coursesInProgress = 18;
  const coursesCompleted = 23;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header Section with Welcome */}
      <div style={styles.header}>
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>Welcome back, {user?.name?.split(' ')[0] || 'Heisenberg'}</h1>
          <p style={styles.welcomeDate}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        
        {/* Class Dropdown */}
        <div style={styles.dropdownContainer}>
          <div style={styles.customSelect}>
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={styles.select}
            >
              <option value="all">All Classes ({classes.length})</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} ({classItem.students_count || 0} students)
                </option>
              ))}
            </select>
            <FiChevronDown style={styles.selectIcon} />
          </div>
        </div>
      </div>

      {/* Stats Cards - Key Metrics */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FiUsers size={20} color="#6366f1" /></div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{analytics.totalStudents}</div>
            <div style={styles.statLabel}>No of Students</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FiBookOpen size={20} color="#10b981" /></div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{analytics.activeClasses}</div>
            <div style={styles.statLabel}>No of Classes</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FiTrendingUp size={20} color="#f59e0b" /></div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{coursesInProgress}</div>
            <div style={styles.statLabel}>Course in progress</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FiAward size={20} color="#8b5cf6" /></div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{coursesCompleted}</div>
            <div style={styles.statLabel}>Course completed</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - 2 Columns */}
      <div style={styles.mainGrid}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {/* Weekly Activity Chart */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FiActivity size={16} /> Weekly Activity
              </h3>
            </div>
            <div style={styles.chartContainer}>
              <div style={styles.barChart}>
                {analytics.weeklyActivity.map((value, index) => (
                  <div key={index} style={styles.barContainer}>
                    <div style={styles.barLabel}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</div>
                    <div style={styles.barWrapper}>
                      <div style={{...styles.bar, height: `${value}%`, backgroundColor: index >= 5 ? '#f59e0b' : '#6366f1'}} />
                    </div>
                    <div style={styles.barValue}>{value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student Performance Summary */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FiBarChart size={16} /> Student Performance
              </h3>
            </div>
            <div style={styles.performanceSummary}>
              <div style={styles.performanceItem}>
                <span style={styles.perfDotExcellent}></span>
                <span>Excellent</span>
                <span style={styles.perfCount}>
                  {studentsList.filter(s => s.progress >= 80).length}
                </span>
              </div>
              <div style={styles.performanceItem}>
                <span style={styles.perfDotGood}></span>
                <span>Good</span>
                <span style={styles.perfCount}>
                  {studentsList.filter(s => s.progress >= 60 && s.progress < 80).length}
                </span>
              </div>
              <div style={styles.performanceItem}>
                <span style={styles.perfDotAverage}></span>
                <span>Average</span>
                <span style={styles.perfCount}>
                  {studentsList.filter(s => s.progress < 60).length}
                </span>
              </div>
            </div>
          </div>

          {/* Students Table - Updated with Mission, Games, XP, Scores, Progress, Date/Time, Status */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FiUsers size={16} /> Students Table
              </h3>
              <span style={styles.sectionBadge}>
                {studentsList.length} total
              </span>
            </div>
            <div style={styles.tableWrapper}>
              <table style={styles.studentTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>Student</th>
                    <th style={styles.th}>Mission</th>
                    <th style={styles.th}>Games</th>
                    <th style={styles.th}>XP Points</th>
                    <th style={styles.th}>Scores</th>
                    <th style={styles.th}>Progress</th>
                    <th style={styles.th}>Date with Time</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsList.map((student, idx) => (
                    <tr key={student.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.studentCell}>
                          <div style={styles.studentAvatar}>
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div style={styles.studentName}>{student.name}</div>
                            <div style={styles.studentEmail}>{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.missionCell}>
                          <FiCheckCircle size={12} color="#10b981" />
                          <span>{student.completedMissions}/{student.totalMissions}</span>
                          <span style={styles.smallPercent}>({student.missionCompletionRate}%)</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.gameCell}>
                          <FiCode size={12} color="#8b5cf6" />
                          <span>{student.completedGames}/{student.totalGames}</span>
                          <span style={styles.smallPercent}>({student.gameCompletionRate}%)</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.xpCell}>
                          <FiZap size={12} color="#f59e0b" />
                          <span style={styles.xpValue}>{student.xpPoints}</span>
                          <span style={styles.xpLabel}>XP</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.scoreCell}>
                          <span style={student.averageScore >= 80 ? styles.scoreHigh : styles.scoreMedium}>
                            {student.averageScore}%
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.progressCell}>
                          <div style={styles.progressBar}>
                            <div style={{...styles.progressFill, width: `${student.progress}%`}} />
                          </div>
                          <span style={styles.progressText}>{student.progress}%</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.dateTimeCell}>
                          <FiClock size={10} color="#9ca3af" />
                          <span style={styles.dateTimeText}>
                            {formatDateTime(student.lastActivity)}
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={student.status === 'active' ? styles.statusActive : styles.statusInactive}>
                          {student.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Section */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FiClipboard size={16} /> Notes
              </h3>
            </div>
            <textarea 
              style={styles.notesInput}
              placeholder="Type your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.rightColumn}>
          {/* Class Performance Distribution */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FiTarget size={16} /> Class Performance
              </h3>
            </div>
            <div style={styles.distributionContainer}>
              <div style={styles.distributionList}>
                {analytics.classesData.slice(0, 4).map((classItem, idx) => (
                  <div key={idx} style={styles.distItem}>
                    <span style={styles.distLabel}>{classItem.name}</span>
                    <div style={styles.distBar}>
                      <div style={{...styles.distFill, width: `${classItem.averageProgress}%`, backgroundColor: getPerformanceColor(classItem.averageProgress)}} />
                    </div>
                    <span style={styles.distPercent}>{classItem.averageProgress}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overall Progress Chart */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FiPieChart size={16} /> Overall Progress
              </h3>
            </div>
            <div style={styles.progressChart}>
              <div style={styles.progressCircleWrapper}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 60}`}
                    strokeDashoffset={`${2 * Math.PI * 60 * (1 - analytics.averageProgress / 100)}`}
                    transform="rotate(-90 70 70)"
                    strokeLinecap="round"
                  />
                  <text x="70" y="65" textAnchor="middle" fill="#1f2937" fontSize="20" fontWeight="bold">
                    {analytics.averageProgress}%
                  </text>
                  <text x="70" y="85" textAnchor="middle" fill="#6b7280" fontSize="10">
                    Avg Progress
                  </text>
                </svg>
              </div>
              <div style={styles.progressStats}>
                <div style={styles.progressStatItem}>
                  <span style={styles.progressStatLabel}>Completion Rate</span>
                  <span style={styles.progressStatValue}>{analytics.completionRate}%</span>
                </div>
                <div style={styles.progressStatItem}>
                  <span style={styles.progressStatLabel}>Total Missions</span>
                  <span style={styles.progressStatValue}>{analytics.totalMissions}</span>
                </div>
                <div style={styles.progressStatItem}>
                  <span style={styles.progressStatLabel}>Completed</span>
                  <span style={styles.progressStatValue}>{analytics.completedMissions}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FiStar size={16} /> Top Performers
              </h3>
            </div>
            <div style={styles.topPerformersList}>
              {analytics.topPerformers.slice(0, 3).map((student) => (
                <div key={student.rank} style={styles.topPerformerItem}>
                  <div style={styles.topPerformerRank}>{student.rank}</div>
                  <div style={styles.topPerformerInfo}>
                    <div style={styles.topPerformerName}>{student.name}</div>
                    <div style={styles.topPerformerClass}>{student.className}</div>
                  </div>
                  <div style={styles.topPerformerScore}>
                    <span style={styles.topPerformerProgress}>{student.progress}%</span>
                    <span style={styles.topPerformerGrade}>{student.grade}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Quick Actions</h3>
            </div>
            <div style={styles.quickActions}>
              <button style={styles.actionButton}>
                <FiPlusCircle size={16} /> Create New Class
              </button>
              <button style={styles.actionButton}>
                <FiCheckSquare size={16} /> Assign Mission
              </button>
              <button style={styles.actionButton}>
                <FiMessageSquare size={16} /> Send Announcement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: 'calc(100vh - 70px)',
    overflowY: 'auto',
    padding: '20px 24px',
    backgroundColor: '#f3f4f6',
    boxSizing: 'border-box',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minHeight: '400px',
    gap: '20px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  welcomeDate: {
    fontSize: '13px',
    color: '#6b7280',
  },
  dropdownContainer: {
    minWidth: '220px',
  },
  customSelect: {
    position: 'relative',
    width: '100%',
  },
  select: {
    width: '100%',
    padding: '10px 36px 10px 14px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    color: '#1f2937',
    cursor: 'pointer',
    appearance: 'none',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  selectIcon: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    pointerEvents: 'none',
    fontSize: '16px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  statIcon: {
    width: '44px',
    height: '44px',
    backgroundColor: '#f3f4f6',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '20px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionBadge: {
    fontSize: '12px',
    padding: '2px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '20px',
    color: '#6b7280',
  },
  chartContainer: {
    marginBottom: '8px',
  },
  barChart: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '160px',
  },
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
  },
  barLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#6b7280',
  },
  barWrapper: {
    width: '100%',
    height: '100px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bar: {
    width: '30px',
    borderRadius: '4px',
    transition: 'height 0.3s ease',
    minHeight: '10px',
  },
  barValue: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#1f2937',
  },
  performanceSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
  },
  performanceItem: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#374151',
    backgroundColor: '#f9fafb',
    padding: '10px',
    borderRadius: '12px',
  },
  perfDotExcellent: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  },
  perfDotGood: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#f59e0b',
  },
  perfDotAverage: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
  },
  perfCount: {
    marginLeft: 'auto',
    fontWeight: '600',
    color: '#1f2937',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  studentTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  th: {
    textAlign: 'left',
    padding: '10px 8px',
    fontSize: '10px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #f3f4f6',
  },
  tr: {
    borderBottom: '1px solid #f9fafb',
  },
  td: {
    padding: '12px 8px',
    fontSize: '12px',
    color: '#4b5563',
  },
  studentCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  studentAvatar: {
    width: '32px',
    height: '32px',
    backgroundColor: '#e0e7ff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: '#4338ca',
  },
  studentName: {
    fontWeight: '500',
    color: '#1f2937',
    fontSize: '13px',
  },
  studentEmail: {
    fontSize: '10px',
    color: '#9ca3af',
  },
  missionCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
  },
  gameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
  },
  xpCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  xpValue: {
    color: '#f59e0b',
    fontWeight: '700',
  },
  xpLabel: {
    fontSize: '9px',
    color: '#9ca3af',
    fontWeight: 'normal',
  },
  scoreCell: {
    display: 'flex',
    alignItems: 'center',
  },
  scoreHigh: {
    padding: '3px 6px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  scoreMedium: {
    padding: '3px 6px',
    backgroundColor: '#fed7aa',
    color: '#92400e',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  progressCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '90px',
  },
  progressBar: {
    flex: 1,
    height: '5px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#1f2937',
    minWidth: '35px',
  },
  dateTimeCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  dateTimeText: {
    fontSize: '10px',
    color: '#6b7280',
  },
  smallPercent: {
    fontSize: '9px',
    color: '#9ca3af',
  },
  statusActive: {
    display: 'inline-block',
    padding: '3px 8px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '500',
  },
  statusInactive: {
    display: 'inline-block',
    padding: '3px 8px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '500',
  },
  notesInput: {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    fontSize: '13px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border 0.2s',
    boxSizing: 'border-box',
  },
  distributionContainer: {
    marginBottom: '8px',
  },
  distributionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  distItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  distLabel: {
    width: '80px',
    fontSize: '12px',
    color: '#4b5563',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  distBar: {
    flex: 1,
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  distPercent: {
    width: '35px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'right',
  },
  progressChart: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  progressCircleWrapper: {
    display: 'flex',
    justifyContent: 'center',
  },
  progressStats: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  progressStatItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  progressStatLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  progressStatValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  topPerformersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  topPerformerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  topPerformerRank: {
    width: '28px',
    height: '28px',
    backgroundColor: '#e0e7ff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    color: '#4338ca',
  },
  topPerformerInfo: {
    flex: 1,
  },
  topPerformerName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1f2937',
  },
  topPerformerClass: {
    fontSize: '10px',
    color: '#9ca3af',
  },
  topPerformerScore: {
    textAlign: 'right',
  },
  topPerformerProgress: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#10b981',
    display: 'block',
  },
  topPerformerGrade: {
    fontSize: '10px',
    color: '#f59e0b',
  },
  quickActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  button:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
  }
  
  select:hover {
    border-color: #c7d2fe;
  }
  
  textarea:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  }
  
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  tr:hover {
    background-color: #f9fafb;
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;