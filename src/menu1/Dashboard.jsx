// src/menu/Dashboard.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FiUsers, FiBookOpen, FiTrendingUp, FiCalendar, 
  FiAward, FiClock, FiActivity, FiStar, FiPieChart,
  FiBarChart2, FiTarget, FiList, FiGrid, FiChevronDown,
  FiUser, FiCheckCircle, FiDollarSign, FiAlertCircle,
  FiMessageSquare, FiClipboard, FiCheckSquare, FiBarChart,
  FiPlusCircle, FiZap, FiCode, FiTrendingUp as FiTrending,
  FiHexagon, FiBox, FiSend, FiBell, FiEye, FiMaximize2,
  FiMinimize2, FiRefreshCw
} from 'react-icons/fi';
import { classService } from '../services/classService';
import { supabase } from '../lib/supabase';

function Dashboard() {
  const { user, userData, updateUserData, getUserXP, getUserIdentifier } = useOutletContext();
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [gameXP, setGameXP] = useState(0);
  const [totalScores, setTotalScores] = useState(0);
  const [missionProgress, setMissionProgress] = useState({
    completedMissions: [],
    totalMissions: 4,
    totalXPEarned: 0
  });
  const [gameProgress, setGameProgress] = useState({
    equation: { completed: false, highScore: 0, attempts: 0 },
    battle: { completed: false, highScore: 0, attempts: 0 },
    spaceShooter: { completed: false, highScore: 0, attempts: 0 }
  });
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    activeClasses: 0,
    averageProgress: 0,
    completionRate: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    topPerformers: [],
    classesData: [],
    dailyActivityLog: []
  });
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Modal States
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isWeeklyActivityModalOpen, setIsWeeklyActivityModalOpen] = useState(false);
  const [isClassProgressModalOpen, setIsClassProgressModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isClassPerformanceModalOpen, setIsClassPerformanceModalOpen] = useState(false);
  const [isProgressStatsModalOpen, setIsProgressStatsModalOpen] = useState(false);
  const [isTopPerformersModalOpen, setIsTopPerformersModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Announcement State
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [selectedClassForAnnouncement, setSelectedClassForAnnouncement] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState('');

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Helper Functions for Progress Calculations ---
  const calculateStudentMissionProgress = (completedMissions, totalMissions = 4) => {
    if (!completedMissions) return 0;
    const count = Array.isArray(completedMissions) ? completedMissions.length : 0;
    return totalMissions > 0 ? Math.round((count / totalMissions) * 100) : 0;
  };

  const calculateStudentGameProgress = (gameProgressData) => {
    if (!gameProgressData) return 0;
    let totalProgress = 0;
    const games = ['equation', 'battle', 'spaceShooter'];
    games.forEach(gameId => {
      const game = gameProgressData[gameId];
      if (!game) return;
      let gameProgressPercent = 0;
      const completionWeight = 0.5;
      const completionScore = game.completed ? 100 : 0;
      const maxScores = { equation: 1000, battle: 1000, spaceShooter: 1000 };
      const highScoreWeight = 0.3;
      const highScorePercent = Math.min(100, (game.highScore / maxScores[gameId]) * 100);
      const attemptsWeight = 0.2;
      const attemptsScore = Math.min(100, (game.attempts / 3) * 100);
      gameProgressPercent = (completionScore * completionWeight) + 
                           (highScorePercent * highScoreWeight) + 
                           (attemptsScore * attemptsWeight);
      totalProgress += gameProgressPercent;
    });
    return games.length > 0 ? Math.round(totalProgress / games.length) : 0;
  };

  const calculateOverallProgress = (missionPercent, gamePercent) => {
    return Math.round((missionPercent * 0.5) + (gamePercent * 0.5));
  };
  // --- End Helper Functions ---

  useEffect(() => {
    loadTeacherClasses();
  }, [user]);

  useEffect(() => {
    if (classes.length > 0 || selectedClass !== 'all') {
      loadTeacherAnalytics();
      loadStudentsData();
    }
  }, [selectedClass, classes]);

  // Load user XP, scores, and progress from all sources
  const loadUserProgress = useCallback(async () => {
    if (!user?.email) return;

    try {
      // Load mission progress from userData
      if (userData?.progress?.completedMissions) {
        setMissionProgress({
          completedMissions: userData.progress.completedMissions,
          totalMissions: 4,
          totalXPEarned: userData.xp || 0
        });
      } else {
        const savedMissions = localStorage.getItem(`completedMissions_${user.email}`);
        if (savedMissions) {
          const completed = JSON.parse(savedMissions);
          setMissionProgress(prev => ({
            ...prev,
            completedMissions: completed
          }));
        }
      }

      // Load game progress from userData or localStorage
      let gameProg = userData?.gameProgress || {};
      if (Object.keys(gameProg).length === 0) {
        const savedGames = localStorage.getItem('gameProgress');
        if (savedGames) {
          gameProg = JSON.parse(savedGames);
        }
      }
      setGameProgress(gameProg);

      // Load XP and scores
      let userXP = userData?.xp || 0;
      let userTotalScores = userData?.totalScores || 0;

      if (userXP === 0) {
        const savedXP = localStorage.getItem(`userXP_${user.email}`);
        if (savedXP && !isNaN(parseInt(savedXP))) {
          userXP = parseInt(savedXP);
        }
      }

      if (userTotalScores === 0) {
        const savedScores = localStorage.getItem(`userTotalScores_${user.email}`);
        if (savedScores && !isNaN(parseInt(savedScores))) {
          userTotalScores = parseInt(savedScores);
        } else {
          // Calculate from game progress
          userTotalScores = calculateTotalScores(gameProg);
        }
      }

      setGameXP(userXP);
      setTotalScores(userTotalScores);
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  }, [user?.email, userData]);

  const calculateTotalScores = useCallback((gameProgressData) => {
    if (!gameProgressData) return 0;
    const equationScore = gameProgressData.equation?.highScore || 0;
    const battleScore = gameProgressData.battle?.highScore || 0;
    const spaceScore = gameProgressData.spaceShooter?.highScore || 0;
    return equationScore + battleScore + spaceScore;
  }, []);

  const loadTeacherClasses = async () => {
    if (!user?.dbId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const teacherClasses = await classService.getTeacherClasses(user.dbId);
      console.log('Loaded classes:', teacherClasses);
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
          
          // Get student's game and mission progress
          let studentXP = 0;
          let studentTotalScores = 0;
          let studentCompletedMissions = [];
          let studentGameProgress = {};
          
          if (studentEmail) {
            const savedXP = localStorage.getItem(`userXP_${studentEmail}`);
            if (savedXP && !isNaN(parseInt(savedXP))) {
              studentXP = parseInt(savedXP);
            }
            
            const savedScores = localStorage.getItem(`userTotalScores_${studentEmail}`);
            if (savedScores && !isNaN(parseInt(savedScores))) {
              studentTotalScores = parseInt(savedScores);
            } else {
              // Calculate from game progress if available
              const savedGames = localStorage.getItem(`gameProgress_${studentEmail}`);
              if (savedGames) {
                const gameProg = JSON.parse(savedGames);
                studentTotalScores = calculateTotalScores(gameProg);
              }
            }
            
            const savedMissions = localStorage.getItem(`completedMissions_${studentEmail}`);
            if (savedMissions) {
              studentCompletedMissions = JSON.parse(savedMissions);
            }
            
            const savedGames = localStorage.getItem(`gameProgress_${studentEmail}`);
            if (savedGames) {
              studentGameProgress = JSON.parse(savedGames);
            }
          }
          
          // Calculate mission completion rate
          const missionCompletionRate = calculateStudentMissionProgress(studentCompletedMissions);
          
          // Calculate game completion rate
          const gameCompletionRate = calculateStudentGameProgress(studentGameProgress);
          
          // Calculate overall student progress (50% missions + 50% games) - This is the POINTS value
          const overallStudentPoints = calculateOverallProgress(missionCompletionRate, gameCompletionRate);
          
          allStudents.push({
            id: enrollment.student_id,
            name: studentName,
            email: studentEmail,
            className: classItem.name,
            classId: classItem.id,
            progress: enrollment.progress || 0,
            points: overallStudentPoints,
            xpPoints: studentXP,
            totalScores: studentTotalScores,
            missionCompletionRate: missionCompletionRate,
            gameCompletionRate: gameCompletionRate,
            completedMissions: studentCompletedMissions.length,
            totalMissions: 4,
            completedGames: Object.values(studentGameProgress).filter(g => g?.completed).length,
            totalGames: 3,
            lastActivity: enrollment.last_activity || enrollment.joined_at,
            status: enrollment.status || 'active',
            overallProgress: overallStudentPoints
          });
        }
      }
      
      allStudents.sort((a, b) => b.overallProgress - a.overallProgress);
      setStudentsList(allStudents);
      
      // Load current user's progress
      await loadUserProgress();
      
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
          weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
          dailyActivityLog: []
        }));
        setLoading(false);
        return;
      }

      let totalStudentsCount = 0;
      let totalProgressSum = 0;
      let totalClassesWithStudents = 0;
      let allStudentsData = [];
      let classesAnalytics = [];
      let allActivityData = [];

      for (const classItem of teacherClasses) {
        const students = await classService.getClassStudents(classItem.id);
        const studentsCount = students.length;
        
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
        });
      }
      
      const averageProgress = totalClassesWithStudents > 0 
        ? Math.round(totalProgressSum / totalClassesWithStudents)
        : 0;
      
      const topPerformers = allStudentsData
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 5)
        .map((student, index) => {
          let studentXP = 0;
          let studentScores = 0;
          let studentMissions = [];
          let studentGames = {};
          
          if (student.email) {
            const savedXP = localStorage.getItem(`userXP_${student.email}`);
            if (savedXP && !isNaN(parseInt(savedXP))) studentXP = parseInt(savedXP);
            const savedScores = localStorage.getItem(`userTotalScores_${student.email}`);
            if (savedScores && !isNaN(parseInt(savedScores))) studentScores = parseInt(savedScores);
            const savedMissions = localStorage.getItem(`completedMissions_${student.email}`);
            if (savedMissions) studentMissions = JSON.parse(savedMissions);
            const savedGames = localStorage.getItem(`gameProgress_${student.email}`);
            if (savedGames) studentGames = JSON.parse(savedGames);
          }
          
          let gamesCompleted = 0;
          if (studentGames) {
            if (studentGames.equation?.completed) gamesCompleted++;
            if (studentGames.battle?.completed) gamesCompleted++;
            if (studentGames.spaceShooter?.completed) gamesCompleted++;
          }
          
          const missionRate = calculateStudentMissionProgress(studentMissions);
          const gameRate = calculateStudentGameProgress(studentGames);
          const overall = calculateOverallProgress(missionRate, gameRate);
          
          return {
            rank: index + 1,
            name: student.name,
            progress: student.progress,
            className: student.className,
            points: overall,
            xpPoints: studentXP || Math.round((student.progress || 0) * 10),
            totalScores: studentScores,
            missionProgress: missionRate,
            gameProgress: gameRate,
            overallProgress: overall
          };
        });
      
      const weeklyActivity = calculateWeeklyActivity(allActivityData, totalStudentsCount);
      const dailyActivityLog = generateDailyActivityLog(allActivityData, totalStudentsCount);
      
      setAnalytics({
        totalStudents: totalStudentsCount,
        activeClasses: teacherClasses.length,
        averageProgress: averageProgress,
        completionRate: 0,
        totalMissions: 0,
        completedMissions: 0,
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

  // --- Announcement Function with Custom Auth + Supabase ---
  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      alert('Please enter both a title and message for the announcement');
      return;
    }
    
    if (!selectedClassForAnnouncement) {
      alert('Please select a class to send the announcement to');
      return;
    }

    setSendingAnnouncement(true);
    
    try {
      // Get Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      let supabaseUserId = session?.user?.id;
      
      // If no session, try to sign in with email from app user
      if (!session && user?.email) {
        console.log('No Supabase session, attempting to sign in with app user email:', user.email);
        
        // Check if user exists in Supabase by email
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();
        
        if (userError) {
          console.error('Error checking user in Supabase:', userError);
        }
        
        if (existingUser) {
          // User exists in Supabase but not authenticated - we need to sign in
          // For now, we'll use the existing user's ID from the users table
          supabaseUserId = existingUser.id;
          console.log('Found existing Supabase user:', supabaseUserId);
        } else {
          // User doesn't exist in Supabase - we need to create them or use a default
          console.warn('User not found in Supabase. Announcements require Supabase authentication.');
          throw new Error('You need to be logged into Supabase to send announcements. Please contact your administrator.');
        }
      }
      
      if (!supabaseUserId) {
        throw new Error('Cannot send announcement: No valid Supabase user ID found. Please log out and log back in.');
      }
      
      console.log('Using Supabase user ID:', supabaseUserId);
      console.log('App user dbId:', user?.dbId);
      
      // Find the class
      const targetClass = classes.find(c => String(c.id) === String(selectedClassForAnnouncement));
      
      if (!targetClass) {
        console.error('Available classes:', classes);
        throw new Error(`Class not found with ID: ${selectedClassForAnnouncement}`);
      }

      console.log('Sending announcement to class:', targetClass);

      // Prepare announcement data - use Supabase user ID from users table
      const announcementData = {
        class_id: Number(targetClass.id),
        teacher_id: supabaseUserId, // Use Supabase user ID from users table
        teacher_name: user?.name || 'Teacher',
        title: announcementTitle.trim(),
        message: announcementMessage.trim()
      };

      console.log('Announcement data:', announcementData);

      // Send to Supabase
      const result = await classService.createAnnouncement(announcementData);
      
      console.log('Announcement sent successfully:', result);
      
      // Reset form
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setSelectedClassForAnnouncement('');
      setShowAnnouncementModal(false);
      setAnnouncementSuccess(`✅ Announcement sent to "${targetClass.name}"!`);
      
      setTimeout(() => setAnnouncementSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error sending announcement:', error);
      
      let errorMessage = 'Failed to send announcement. ';
      
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        errorMessage += 'You are not authorized. Please log out and log back in.';
      } else if (error.message.includes('row-level security')) {
        errorMessage += 'Permission denied. Please contact your administrator.';
      } else if (error.message.includes('session')) {
        errorMessage += 'Your session has expired. Please log out and log back in.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSendingAnnouncement(false);
    }
  };

  // Get current user's XP and scores
  const currentUserXP = getUserXP && typeof getUserXP === 'function' ? getUserXP() : gameXP;

  // Calculate class overall progress (average of all students' overall progress)
  const classOverallProgress = studentsList.length > 0
    ? Math.round(studentsList.reduce((sum, student) => sum + (student.overallProgress || 0), 0) / studentsList.length)
    : 0;

  // Calculate class mission progress average
  const classMissionProgress = studentsList.length > 0
    ? Math.round(studentsList.reduce((sum, student) => sum + student.missionCompletionRate, 0) / studentsList.length)
    : 0;

  // Calculate class game progress average
  const classGameProgress = studentsList.length > 0
    ? Math.round(studentsList.reduce((sum, student) => sum + student.gameCompletionRate, 0) / studentsList.length)
    : 0;

  // Modal component for reusable structure
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>{title}</h3>
            <button style={styles.modalClose} onClick={onClose}>×</button>
          </div>
          <div style={styles.modalBody}>
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Full Students Table Component
  const FullStudentsTable = () => (
    <div style={styles.tableWrapper}>
      <table style={styles.studentTable}>
        <thead>
          <tr>
            <th style={styles.th}>Student</th>
            <th style={styles.th}>Points</th>
            <th style={styles.th}>XP Points</th>
            <th style={styles.th}>Scores</th>
            <th style={styles.th}>Missions</th>
            <th style={styles.th}>Games</th>
            <th style={styles.th}>Overall</th>
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
                <div style={styles.pointsCell}>
                  <span style={student.points >= 80 ? styles.pointsHigh : (student.points >= 60 ? styles.pointsMedium : styles.pointsLow)}>
                    {student.points}
                  </span>
                </div>
              </td>
              <td style={styles.td}>
                <div style={styles.xpCell}>
                  <FiZap size={14} color="#f59e0b" />
                  <span style={styles.xpValue}>{student.xpPoints}</span>
                  <span style={styles.xpLabel}>XP</span>
                </div>
              </td>
              <td style={styles.td}>
                <div style={styles.scoreCell}>
                  <span style={student.totalScores >= 800 ? styles.scoreHigh : (student.totalScores >= 500 ? styles.scoreMedium : styles.scoreLow)}>
                    {student.totalScores}
                  </span>
                </div>
              </td>
              <td style={styles.td}>
                <div style={styles.missionCell}>
                  <span style={styles.missionRate}>{student.missionCompletionRate}%</span>
                  <div style={styles.progressBarSmall}>
                    <div style={{...styles.progressFillSmall, width: `${student.missionCompletionRate}%`, backgroundColor: '#10b981'}} />
                  </div>
                  <span style={styles.smallText}>{student.completedMissions}/{student.totalMissions}</span>
                </div>
              </td>
              <td style={styles.td}>
                <div style={styles.gameCell}>
                  <span style={styles.gameRate}>{student.gameCompletionRate}%</span>
                  <div style={styles.progressBarSmall}>
                    <div style={{...styles.progressFillSmall, width: `${student.gameCompletionRate}%`, backgroundColor: '#8b5cf6'}} />
                  </div>
                  <span style={styles.smallText}>{student.completedGames}/{student.totalGames}</span>
                </div>
              </td>
              <td style={styles.td}>
                <div style={styles.progressCell}>
                  <div style={styles.progressBar}>
                    <div style={{...styles.progressFill, width: `${student.overallProgress}%`, backgroundColor: '#8b5cf6'}} />
                  </div>
                  <span style={styles.progressText}>{student.overallProgress}%</span>
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
  );

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
      {/* Modals */}
      <Modal isOpen={isStudentsModalOpen} onClose={() => setIsStudentsModalOpen(false)} title={`Students List (${studentsList.length})`}>
        <FullStudentsTable />
      </Modal>

      <Modal isOpen={isWeeklyActivityModalOpen} onClose={() => setIsWeeklyActivityModalOpen(false)} title="Weekly Activity">
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
      </Modal>

      <Modal isOpen={isClassProgressModalOpen} onClose={() => setIsClassProgressModalOpen(false)} title="Class Overall Progress">
        <div style={styles.classProgressContainer}>
          <div style={styles.classProgressRing}>
            <svg width="100" height="100" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - classOverallProgress / 100)}`}
                transform="rotate(-90 60 60)"
                strokeLinecap="round"
              />
              <text x="60" y="56" textAnchor="middle" fill="#1f2937" fontSize="16" fontWeight="bold">{classOverallProgress}%</text>
              <text x="60" y="72" textAnchor="middle" fill="#6b7280" fontSize="8">Class Avg</text>
            </svg>
          </div>
          <div style={styles.classProgressDetails}>
            <div style={styles.classDetailItem}>
              <span style={styles.classDetailLabel}>Missions Avg:</span>
              <span style={styles.classDetailValue}>{classMissionProgress}%</span>
              <div style={styles.progressBarSmall}>
                <div style={{...styles.progressFillSmall, width: `${classMissionProgress}%`, backgroundColor: '#10b981'}} />
              </div>
            </div>
            <div style={styles.classDetailItem}>
              <span style={styles.classDetailLabel}>Games Avg:</span>
              <span style={styles.classDetailValue}>{classGameProgress}%</span>
              <div style={styles.progressBarSmall}>
                <div style={{...styles.progressFillSmall, width: `${classGameProgress}%`, backgroundColor: '#f59e0b'}} />
              </div>
            </div>
            <div style={styles.classDetailItem}>
              <span style={styles.classDetailLabel}>Students:</span>
              <span style={styles.classDetailValue}>{studentsList.length}</span>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isPerformanceModalOpen} onClose={() => setIsPerformanceModalOpen(false)} title="Student Performance">
        <div style={styles.performanceSummary}>
          <div style={styles.performanceItem}>
            <span style={styles.perfDotExcellent}></span>
            <span>Excellent</span>
            <span style={styles.perfCount}>
              {studentsList.filter(s => s.overallProgress >= 80).length}
            </span>
          </div>
          <div style={styles.performanceItem}>
            <span style={styles.perfDotGood}></span>
            <span>Good</span>
            <span style={styles.perfCount}>
              {studentsList.filter(s => s.overallProgress >= 60 && s.overallProgress < 80).length}
            </span>
          </div>
          <div style={styles.performanceItem}>
            <span style={styles.perfDotAverage}></span>
            <span>Average</span>
            <span style={styles.perfCount}>
              {studentsList.filter(s => s.overallProgress < 60).length}
            </span>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isClassPerformanceModalOpen} onClose={() => setIsClassPerformanceModalOpen(false)} title="Class Performance Distribution">
        <div style={styles.distributionContainer}>
          <div style={styles.distributionList}>
            {analytics.classesData.map((classItem, idx) => (
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
      </Modal>

      <Modal isOpen={isProgressStatsModalOpen} onClose={() => setIsProgressStatsModalOpen(false)} title="Detailed Progress Stats">
        <div style={styles.progressStats}>
          <div style={styles.progressStatItem}>
            <span style={styles.progressStatLabel}>Class Overall Progress</span>
            <span style={styles.progressStatValue}>{classOverallProgress}%</span>
          </div>
          <div style={styles.progressStatItem}>
            <span style={styles.progressStatLabel}>Total Scores (All Students)</span>
            <span style={styles.progressStatValue}>
              {studentsList.reduce((sum, s) => sum + s.totalScores, 0)}
            </span>
          </div>
          <div style={styles.progressStatItem}>
            <span style={styles.progressStatLabel}>Total XP Earned</span>
            <span style={styles.progressStatValue}>
              {studentsList.reduce((sum, s) => sum + s.xpPoints, 0)}
            </span>
          </div>
          <div style={styles.progressStatItem}>
            <span style={styles.progressStatLabel}>Avg Mission Progress</span>
            <span style={styles.progressStatValue}>{classMissionProgress}%</span>
          </div>
          <div style={styles.progressStatItem}>
            <span style={styles.progressStatLabel}>Avg Game Progress</span>
            <span style={styles.progressStatValue}>{classGameProgress}%</span>
          </div>
          <div style={styles.progressStatItem}>
            <span style={styles.progressStatLabel}>Points Distribution</span>
            <span style={styles.progressStatValue}>
              80-100: {studentsList.filter(s => s.points >= 80).length} | 
              60-79: {studentsList.filter(s => s.points >= 60 && s.points < 80).length} | 
              &lt;60: {studentsList.filter(s => s.points < 60).length}
            </span>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isTopPerformersModalOpen} onClose={() => setIsTopPerformersModalOpen(false)} title="Top Performers">
        <div style={styles.topPerformersList}>
          {analytics.topPerformers.map((student) => (
            <div key={student.rank} style={styles.topPerformerItem}>
              <div style={styles.topPerformerRank}>{student.rank}</div>
              <div style={styles.topPerformerInfo}>
                <div style={styles.topPerformerName}>{student.name}</div>
                <div style={styles.topPerformerClass}>{student.className}</div>
              </div>
              <div style={styles.topPerformerScore}>
                <span style={styles.topPerformerProgress}>{student.points || student.progress} pts</span>
                <span style={styles.topPerformerXP}>⭐{student.xpPoints} XP</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Announcement Success Toast */}
      {announcementSuccess && (
        <div style={styles.successToast}>
          <FiCheckCircle size={18} />
          <span>{announcementSuccess}</span>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAnnouncementModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <FiBell size={18} /> Send Announcement
              </h3>
              <button style={styles.modalClose} onClick={() => setShowAnnouncementModal(false)}>×</button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Select Class</label>
                <select 
                  value={selectedClassForAnnouncement}
                  onChange={(e) => setSelectedClassForAnnouncement(e.target.value)}
                  style={styles.formSelect}
                >
                  <option value="">-- Select a class --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.students_count || 0} students)
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Announcement Title</label>
                <input 
                  type="text"
                  placeholder="e.g., Upcoming Quiz, Class Reminder, etc."
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  style={styles.formInput}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Message</label>
                <textarea 
                  placeholder="Write your announcement message here..."
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  style={styles.formTextarea}
                  rows={5}
                />
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button 
                style={styles.cancelButton} 
                onClick={() => setShowAnnouncementModal(false)}
              >
                Cancel
              </button>
              <button 
                style={styles.sendButton} 
                onClick={handleSendAnnouncement}
                disabled={sendingAnnouncement}
              >
                {sendingAnnouncement ? 'Sending...' : <><FiSend size={14} /> Send Announcement</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section with Welcome */}
      <div style={styles.header}>
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>Welcome back, {user?.name?.split(' ')[0] || 'Heisenberg'}</h1>
          <p style={styles.welcomeDate}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          <div style={styles.userStatsBadges}>
            <span style={styles.xpBadge}>⭐ {currentUserXP} XP</span>
            <span style={styles.scoreBadge}>🎯 {totalScores} Total Score</span>
          </div>
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

      {/* Stats Cards - Key Metrics (Courses removed) */}
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
      </div>

      {/* Students Section - Button to open modal */}
      <div style={styles.studentsSection}>
        <div style={styles.studentsCard}>
          <div style={styles.studentsCardIcon}>
            <FiUsers size={40} color="#6366f1" />
          </div>
          <div style={styles.studentsCardContent}>
            <h2 style={styles.studentsCardTitle}>Manage Students</h2>
            <p style={styles.studentsCardDesc}>
              View and manage all {studentsList.length} students in your class
            </p>
            <button 
              style={styles.viewStudentsButton}
              onClick={() => setIsStudentsModalOpen(true)}
            >
              <FiEye size={18} />
              View All Students
              <span style={styles.studentCountBadge}>{studentsList.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid - 2 Columns */}
      <div style={styles.mainGrid}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {/* Weekly Activity Chart - Collapsible on mobile */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FiActivity size={16} /> Weekly Activity
              </h3>
              {isMobile ? (
                <button style={styles.viewButton} onClick={() => setIsWeeklyActivityModalOpen(true)}>
                  <FiMaximize2 size={14} /> View
                </button>
              ) : null}
            </div>
            {!isMobile && (
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
            )}
          </div>

          {/* CLASS OVERALL PROGRESS SECTION - Collapsible on mobile */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FiTrendingUp size={16} color="#8b5cf6" /> Class Overall Progress
              </h3>
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <span style={{...styles.sectionBadge, backgroundColor: '#e0e7ff', color: '#4338ca'}}>
                  {classOverallProgress}% Average
                </span>
                {isMobile && (
                  <button style={styles.viewButton} onClick={() => setIsClassProgressModalOpen(true)}>
                    <FiMaximize2 size={14} />
                  </button>
                )}
              </div>
            </div>
            {!isMobile && (
              <div style={styles.classProgressContainer}>
                <div style={styles.classProgressRing}>
                  <svg width="100" height="100" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - classOverallProgress / 100)}`}
                      transform="rotate(-90 60 60)"
                      strokeLinecap="round"
                    />
                    <text x="60" y="56" textAnchor="middle" fill="#1f2937" fontSize="16" fontWeight="bold">{classOverallProgress}%</text>
                    <text x="60" y="72" textAnchor="middle" fill="#6b7280" fontSize="8">Class Avg</text>
                  </svg>
                </div>
                <div style={styles.classProgressDetails}>
                  <div style={styles.classDetailItem}>
                    <span style={styles.classDetailLabel}>Missions Avg:</span>
                    <span style={styles.classDetailValue}>{classMissionProgress}%</span>
                    <div style={styles.progressBarSmall}>
                      <div style={{...styles.progressFillSmall, width: `${classMissionProgress}%`, backgroundColor: '#10b981'}} />
                    </div>
                  </div>
                  <div style={styles.classDetailItem}>
                    <span style={styles.classDetailLabel}>Games Avg:</span>
                    <span style={styles.classDetailValue}>{classGameProgress}%</span>
                    <div style={styles.progressBarSmall}>
                      <div style={{...styles.progressFillSmall, width: `${classGameProgress}%`, backgroundColor: '#f59e0b'}} />
                    </div>
                  </div>
                  <div style={styles.classDetailItem}>
                    <span style={styles.classDetailLabel}>Students:</span>
                    <span style={styles.classDetailValue}>{studentsList.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Student Performance Summary - Collapsible on mobile */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FiBarChart size={16} /> Student Performance
              </h3>
              {isMobile && (
                <button style={styles.viewButton} onClick={() => setIsPerformanceModalOpen(true)}>
                  <FiMaximize2 size={14} /> View
                </button>
              )}
            </div>
            {!isMobile && (
              <div style={styles.performanceSummary}>
                <div style={styles.performanceItem}>
                  <span style={styles.perfDotExcellent}></span>
                  <span>Excellent (80-100%)</span>
                  <span style={styles.perfCount}>
                    {studentsList.filter(s => s.overallProgress >= 80).length}
                  </span>
                </div>
                <div style={styles.performanceItem}>
                  <span style={styles.perfDotGood}></span>
                  <span>Good (60-79%)</span>
                  <span style={styles.perfCount}>
                    {studentsList.filter(s => s.overallProgress >= 60 && s.overallProgress < 80).length}
                  </span>
                </div>
                <div style={styles.performanceItem}>
                  <span style={styles.perfDotAverage}></span>
                  <span>Average (&lt;60%)</span>
                  <span style={styles.perfCount}>
                    {studentsList.filter(s => s.overallProgress < 60).length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.rightColumn}>
          {/* Class Performance Distribution - Collapsible on mobile */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FiTarget size={16} /> Class Performance
              </h3>
              {isMobile && (
                <button style={styles.viewButton} onClick={() => setIsClassPerformanceModalOpen(true)}>
                  <FiMaximize2 size={14} /> View
                </button>
              )}
            </div>
            {!isMobile && (
              <div style={styles.distributionContainer}>
                <div style={styles.distributionList}>
                  {analytics.classesData.map((classItem, idx) => (
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
            )}
          </div>

          {/* Detailed Progress Stats - Collapsible on mobile */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FiPieChart size={16} /> Progress Stats
              </h3>
              {isMobile && (
                <button style={styles.viewButton} onClick={() => setIsProgressStatsModalOpen(true)}>
                  <FiMaximize2 size={14} /> View
                </button>
              )}
            </div>
            {!isMobile && (
              <div style={styles.progressStats}>
                <div style={styles.progressStatItem}>
                  <span style={styles.progressStatLabel}>Class Overall Progress</span>
                  <span style={styles.progressStatValue}>{classOverallProgress}%</span>
                </div>
                <div style={styles.progressStatItem}>
                  <span style={styles.progressStatLabel}>Total Scores (All Students)</span>
                  <span style={styles.progressStatValue}>
                    {studentsList.reduce((sum, s) => sum + s.totalScores, 0)}
                  </span>
                </div>
                <div style={styles.progressStatItem}>
                  <span style={styles.progressStatLabel}>Total XP Earned</span>
                  <span style={styles.progressStatValue}>
                    {studentsList.reduce((sum, s) => sum + s.xpPoints, 0)}
                  </span>
                </div>
                <div style={styles.progressStatItem}>
                  <span style={styles.progressStatLabel}>Avg Mission Progress</span>
                  <span style={styles.progressStatValue}>{classMissionProgress}%</span>
                </div>
                <div style={styles.progressStatItem}>
                  <span style={styles.progressStatLabel}>Avg Game Progress</span>
                  <span style={styles.progressStatValue}>{classGameProgress}%</span>
                </div>
                <div style={styles.progressStatItem}>
                  <span style={styles.progressStatLabel}>Points Distribution</span>
                  <span style={styles.progressStatValue}>
                    80-100: {studentsList.filter(s => s.points >= 80).length} | 
                    60-79: {studentsList.filter(s => s.points >= 60 && s.points < 80).length} | 
                    &lt;60: {studentsList.filter(s => s.points < 60).length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Top Performers - Collapsible on mobile */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <FiStar size={16} /> Top Performers
              </h3>
              {isMobile && (
                <button style={styles.viewButton} onClick={() => setIsTopPerformersModalOpen(true)}>
                  <FiMaximize2 size={14} /> View
                </button>
              )}
            </div>
            {!isMobile && (
              <div style={styles.topPerformersList}>
                {analytics.topPerformers.slice(0, 5).map((student) => (
                  <div key={student.rank} style={styles.topPerformerItem}>
                    <div style={styles.topPerformerRank}>{student.rank}</div>
                    <div style={styles.topPerformerInfo}>
                      <div style={styles.topPerformerName}>{student.name}</div>
                      <div style={styles.topPerformerClass}>{student.className}</div>
                    </div>
                    <div style={styles.topPerformerScore}>
                      <span style={styles.topPerformerProgress}>{student.points || student.progress} pts</span>
                      <span style={styles.topPerformerXP}>⭐{student.xpPoints} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Quick Actions</h3>
            </div>
            <div style={styles.quickActions}>
              <button style={styles.actionButton} onClick={() => setShowAnnouncementModal(true)}>
                <FiBell size={16} /> Send Announcement
              </button>
              <button 
                style={styles.actionButton} 
                onClick={() => setIsStudentsModalOpen(true)}
              >
                <FiUsers size={16} /> View Students
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
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '20px 24px',
    boxSizing: 'border-box',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    gap: '20px',
    backgroundColor: '#f9fafb',
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
    fontSize: 'clamp(20px, 5vw, 24px)',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  welcomeDate: {
    fontSize: '13px',
    color: '#6b7280',
  },
  userStatsBadges: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  xpBadge: {
    backgroundColor: '#fef3c7',
    color: '#f59e0b',
    padding: '4px 12px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '13px',
  },
  scoreBadge: {
    backgroundColor: '#d1fae5',
    color: '#059669',
    padding: '4px 12px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '13px',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
  studentsSection: {
    marginBottom: '24px',
  },
  studentsCard: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    flexWrap: 'wrap',
  },
  studentsCardIcon: {
    width: '80px',
    height: '80px',
    backgroundColor: '#e0e7ff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentsCardContent: {
    flex: 1,
  },
  studentsCardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
  },
  studentsCardDesc: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  viewStudentsButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 20px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  studentCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '2px 8px',
    borderRadius: '20px',
    fontSize: '12px',
    marginLeft: '8px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
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
    flexWrap: 'wrap',
    gap: '8px',
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
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#6366f1',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  viewAllContainer: {
    marginTop: '12px',
    textAlign: 'center',
  },
  viewAllButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#6366f1',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  chartContainer: {
    marginBottom: '8px',
    overflowX: 'auto',
  },
  barChart: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '160px',
    minWidth: '280px',
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
  classProgressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  classProgressRing: {
    display: 'flex',
    justifyContent: 'center',
  },
  classProgressDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  classDetailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  classDetailLabel: {
    fontSize: '11px',
    color: '#6b7280',
    minWidth: '70px',
  },
  classDetailValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1f2937',
    minWidth: '40px',
  },
  progressBarSmall: {
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
    flex: 1,
  },
  progressFillSmall: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  performanceSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
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
    minWidth: '800px',
  },
  th: {
    textAlign: 'left',
    padding: '12px 8px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #e5e7eb',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s',
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
  pointsCell: {
    display: 'flex',
    alignItems: 'center',
  },
  pointsHigh: {
    padding: '4px 8px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  pointsMedium: {
    padding: '4px 8px',
    backgroundColor: '#fed7aa',
    color: '#92400e',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  pointsLow: {
    padding: '4px 8px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  xpCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '600',
  },
  xpValue: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: '14px',
  },
  xpLabel: {
    fontSize: '9px',
    color: '#9ca3af',
    fontWeight: 'normal',
  },
  scoreCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap',
  },
  scoreHigh: {
    padding: '4px 8px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '600',
  },
  scoreMedium: {
    padding: '4px 8px',
    backgroundColor: '#fed7aa',
    color: '#92400e',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '600',
  },
  scoreLow: {
    padding: '4px 8px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '600',
  },
  missionCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '70px',
  },
  missionRate: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#10b981',
  },
  gameCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '70px',
  },
  gameRate: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#8b5cf6',
  },
  smallText: {
    fontSize: '9px',
    color: '#9ca3af',
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
  progressStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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
    fontSize: '13px',
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'right',
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
  topPerformerXP: {
    fontSize: '9px',
    color: '#f59e0b',
    display: 'block',
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
    width: '100%',
    justifyContent: 'center',
  },
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '20px',
    width: '90%',
    maxWidth: '95vw',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    animation: 'fadeIn 0.3s ease',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: '0',
    lineHeight: 1,
    transition: 'color 0.2s',
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    maxHeight: 'calc(90vh - 80px)',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  formTextarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
  },
  cancelButton: {
    padding: '8px 20px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    color: '#374151',
    transition: 'background-color 0.2s',
  },
  sendButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 20px',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    color: 'white',
    transition: 'background-color 0.2s',
  },
  successToast: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: 2000,
    animation: 'slideInRight 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  button:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
  }
  
  select:hover {
    border-color: #c7d2fe;
  }
  
  textarea:focus, input:focus, select:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  }
  
  .sendButton:hover {
    background-color: #4f46e5;
  }
  
  .cancelButton:hover {
    background-color: #e5e7eb;
  }
  
  .viewButton:hover {
    background-color: #e5e7eb;
    border-color: #c7d2fe;
  }
  
  .viewAllButton:hover {
    background-color: #e5e7eb;
    border-color: #c7d2fe;
  }
  
  .modalClose:hover {
    color: #ef4444;
  }
  
  .actionButton:hover {
    background-color: #e5e7eb;
    border-color: #d1d5db;
  }
  
  .viewStudentsButton:hover {
    background-color: #4f46e5;
    transform: translateY(-2px);
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

  /* Responsive Design */
  @media (max-width: 1024px) {
    .mainGrid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 16px;
    }
    .statsGrid {
      grid-template-columns: 1fr;
    }
    .header {
      flex-direction: column;
      align-items: flex-start;
    }
    .dropdownContainer {
      width: 100%;
    }
    .welcomeTitle {
      font-size: 20px;
    }
    .sectionCard {
      padding: 12px;
    }
    .modalBody {
      padding: 16px;
    }
    .modalContent {
      width: 95%;
      max-width: 95vw;
    }
    .studentTable {
      min-width: 600px;
    }
    .classProgressContainer {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .performanceSummary {
      flex-direction: column;
    }
    .studentsCard {
      flex-direction: column;
      text-align: center;
    }
    .viewStudentsButton {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .statValue {
      font-size: 22px;
    }
    .statIcon {
      width: 36px;
      height: 36px;
    }
    .sectionTitle {
      font-size: 14px;
    }
    .viewButton {
      padding: 3px 8px;
      font-size: 10px;
    }
    .studentTable {
      min-width: 500px;
    }
    .studentsCardTitle {
      font-size: 18px;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;