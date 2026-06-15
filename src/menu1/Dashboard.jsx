// src/menu/Dashboard.jsx - FIXED WITH PROPER XP, SCORES, AND TOP PERFORMERS SHOWING STUDENT NAMES
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
  FiMinimize2, FiRefreshCw, FiDollarSign as FiCoin
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
    monthlyActivity: [],
    yearlyActivity: [],
    topPerformers: [],
    classesData: [],
    dailyActivityLog: []
  });
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const [activityView, setActivityView] = useState('weekly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isWeeklyActivityModalOpen, setIsWeeklyActivityModalOpen] = useState(false);
  const [isClassProgressModalOpen, setIsClassProgressModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isClassPerformanceModalOpen, setIsClassPerformanceModalOpen] = useState(false);
  const [isTopPerformersModalOpen, setIsTopPerformersModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [selectedClassForAnnouncement, setSelectedClassForAnnouncement] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState('');
  const [announcementError, setAnnouncementError] = useState('');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      gameProgressPercent = (completionScore * completionWeight) + (highScorePercent * highScoreWeight) + (attemptsScore * attemptsWeight);
      totalProgress += gameProgressPercent;
    });
    return games.length > 0 ? Math.round(totalProgress / games.length) : 0;
  };

  const calculateOverallProgressFromPointsAndXP = (points, xp) => {
    const maxPoints = 1000;
    const maxXP = 2000;
    const pointsPercent = Math.min(100, Math.round((points / maxPoints) * 100));
    const xpPercent = Math.min(100, Math.round((xp / maxXP) * 100));
    return Math.round((pointsPercent * 0.4) + (xpPercent * 0.6));
  };

  const calculateTotalScores = useCallback((gameProgressData) => {
    if (!gameProgressData) return 0;
    return (gameProgressData.equation?.highScore || 0) + (gameProgressData.battle?.highScore || 0) + (gameProgressData.spaceShooter?.highScore || 0);
  }, []);

  useEffect(() => { loadTeacherClasses(); }, [user]);
  useEffect(() => { if (classes.length > 0 || selectedClass !== 'all') { loadTeacherAnalytics(); loadStudentsData(); } }, [selectedClass, classes, activityView, selectedYear]);

  const loadUserProgress = useCallback(async () => {
    if (!user?.email) return;
    try {
      if (userData?.progress?.completedMissions) {
        setMissionProgress({ completedMissions: userData.progress.completedMissions, totalMissions: 4, totalXPEarned: userData.xp || 0 });
      } else {
        const savedMissions = localStorage.getItem(`completedMissions_${user.email}`);
        if (savedMissions) setMissionProgress(prev => ({ ...prev, completedMissions: JSON.parse(savedMissions) }));
      }
      let gameProg = userData?.gameProgress || {};
      if (Object.keys(gameProg).length === 0) { const savedGames = localStorage.getItem('gameProgress'); if (savedGames) gameProg = JSON.parse(savedGames); }
      setGameProgress(gameProg);
      let userXP = userData?.xp || 0;
      let userTotalScores = userData?.totalScores || 0;
      if (userXP === 0) { const savedXP = localStorage.getItem(`userXP_${user.email}`); if (savedXP && !isNaN(parseInt(savedXP))) userXP = parseInt(savedXP); }
      if (userTotalScores === 0) { const savedScores = localStorage.getItem(`userTotalScores_${user.email}`); if (savedScores && !isNaN(parseInt(savedScores))) userTotalScores = parseInt(savedScores); else userTotalScores = calculateTotalScores(gameProg); }
      setGameXP(userXP); setTotalScores(userTotalScores);
    } catch (error) { console.error('Error loading user progress:', error); }
  }, [user?.email, userData, calculateTotalScores]);

  const loadTeacherClasses = async () => {
    if (!user?.dbId) { setLoading(false); return; }
    try { setLoading(true); const teacherClasses = await classService.getTeacherClasses(user.dbId); setClasses(teacherClasses || []); } 
    catch (error) { console.error('Error loading classes:', error); setClasses([]); } 
    finally { setLoading(false); }
  };

  const loadStudentsData = async () => {
    if (!user?.dbId) return;
    try {
      let teacherClasses = [];
      if (selectedClass === 'all') teacherClasses = await classService.getTeacherClasses(user.dbId);
      else { const singleClass = await classService.getClassById(selectedClass); teacherClasses = singleClass ? [singleClass] : []; }
      if (!teacherClasses || teacherClasses.length === 0) { setStudentsList([]); return; }
      let allStudents = [];
      
      for (const classItem of teacherClasses) {
        const students = await classService.getClassStudents(classItem.id);
        if (!students || students.length === 0) continue;
        
        for (const enrollment of students) {
          const studentUser = enrollment.users;
          let studentName = 'Student';
          let studentEmail = '';
          let studentUserId = null;
          let studentUUID = enrollment.student_id;
          
          if (studentUser) {
            studentName = studentUser.name || studentUser.email?.split('@')[0] || 'Student';
            studentEmail = studentUser.email || '';
            studentUserId = studentUser.id;
          }
          
          if (studentName === 'Student' || !studentName) {
            const { data: studentData } = await supabase
              .from('students')
              .select('name, email, user_id')
              .eq('id', enrollment.student_id)
              .maybeSingle();
            if (studentData) {
              studentName = studentData.name || 'Student';
              studentEmail = studentData.email || studentEmail;
              if (studentData.user_id && !studentUserId) studentUserId = studentData.user_id;
            }
          }
          
          if ((studentName === 'Student' || !studentName) && studentUserId) {
            const { data: userData } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', studentUserId)
              .maybeSingle();
            if (userData && userData.name) studentName = userData.name;
            if (userData && userData.email && !studentEmail) studentEmail = userData.email;
          }
          
          if (studentName && studentName !== 'Student') {
            studentName = studentName.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
          } else if (studentEmail && studentEmail.includes('@')) {
            studentName = studentEmail.split('@')[0];
            studentName = studentName.charAt(0).toUpperCase() + studentName.slice(1);
          } else {
            studentName = `Student_${enrollment.student_id?.slice(-4) || 'Unknown'}`;
          }
          
          let studentPoints = 0;
          let studentXP = 0;
          let studentTotalScores = 0;
          let studentCompletedMissions = [];
          let studentMissionsCompleted = 0;
          let studentGamesCompleted = 0;
          let studentGameProgress = {
            equation: { completed: false, highScore: 0, attempts: 0 },
            battle: { completed: false, highScore: 0, attempts: 0 },
            spaceShooter: { completed: false, highScore: 0, attempts: 0 }
          };
          
          if (studentUUID) {
            const { data: pointsData } = await supabase
              .from('student_points')
              .select('points')
              .eq('student_id', studentUUID)
              .eq('class_id', classItem.id)
              .maybeSingle();
            if (pointsData) studentPoints = pointsData.points || 0;
          }
          
          if (studentUserId) {
            const { data: xpData } = await supabase
              .from('user_xp')
              .select('xp')
              .eq('user_id', studentUserId)
              .maybeSingle();
            if (xpData) studentXP = xpData.xp || 0;
          }
          
          if (studentXP === 0 && studentEmail) {
            const savedXP = localStorage.getItem(`userXP_${studentEmail}`);
            if (savedXP && !isNaN(parseInt(savedXP))) studentXP = parseInt(savedXP);
          }
          
          if (studentUUID) {
            const { data: gameScores } = await supabase
              .from('game_scores')
              .select('game_type, score, completed')
              .eq('student_id', studentUUID);
            if (gameScores && gameScores.length > 0) {
              gameScores.forEach(score => {
                studentTotalScores += score.score || 0;
                if (score.completed) studentGamesCompleted++;
                if (score.game_type === 'equation') {
                  studentGameProgress.equation.completed = score.completed || false;
                  studentGameProgress.equation.highScore = Math.max(studentGameProgress.equation.highScore, score.score || 0);
                  studentGameProgress.equation.attempts++;
                } else if (score.game_type === 'battle') {
                  studentGameProgress.battle.completed = score.completed || false;
                  studentGameProgress.battle.highScore = Math.max(studentGameProgress.battle.highScore, score.score || 0);
                  studentGameProgress.battle.attempts++;
                } else if (score.game_type === 'spaceShooter') {
                  studentGameProgress.spaceShooter.completed = score.completed || false;
                  studentGameProgress.spaceShooter.highScore = Math.max(studentGameProgress.spaceShooter.highScore, score.score || 0);
                  studentGameProgress.spaceShooter.attempts++;
                }
              });
            }
          }
          
          if (studentTotalScores === 0 && studentEmail) {
            const savedScores = localStorage.getItem(`userTotalScores_${studentEmail}`);
            if (savedScores && !isNaN(parseInt(savedScores))) studentTotalScores = parseInt(savedScores);
          }
          
          if (studentUUID) {
            const { data: missionsData } = await supabase
              .from('student_missions')
              .select('mission_id, completed')
              .eq('student_id', studentUUID);
            if (missionsData && missionsData.length > 0) {
              studentMissionsCompleted = missionsData.filter(m => m.completed === true).length;
              studentCompletedMissions = missionsData.filter(m => m.completed === true).map(m => m.mission_id);
            }
          }
          
          if (studentMissionsCompleted === 0 && studentEmail) {
            const savedMissions = localStorage.getItem(`completedMissions_${studentEmail}`);
            if (savedMissions) {
              const missions = JSON.parse(savedMissions);
              studentMissionsCompleted = missions.length;
              studentCompletedMissions = missions;
            }
          }
          
          const missionCompletionRate = calculateStudentMissionProgress(studentCompletedMissions);
          const gameCompletionRate = calculateStudentGameProgress(studentGameProgress);
          const overallFromPointsAndXP = calculateOverallProgressFromPointsAndXP(studentPoints, studentXP);
          
          allStudents.push({
            id: enrollment.student_id,
            name: studentName,
            email: studentEmail,
            className: classItem.name,
            classId: classItem.id,
            progress: enrollment.progress || 0,
            points: studentPoints,
            xpPoints: studentXP,
            totalScores: studentTotalScores,
            missionCompletionRate: missionCompletionRate,
            gameCompletionRate: gameCompletionRate,
            completedMissions: studentMissionsCompleted,
            totalMissions: 4,
            completedGames: studentGamesCompleted,
            totalGames: 3,
            missionCount: `${studentMissionsCompleted}/4`,
            gameCount: `${studentGamesCompleted}/3`,
            lastActivity: enrollment.last_activity || enrollment.joined_at,
            status: enrollment.status || 'active',
            overallProgress: overallFromPointsAndXP
          });
        }
      }
      allStudents.sort((a, b) => b.overallProgress - a.overallProgress);
      setStudentsList(allStudents);
      await loadUserProgress();
    } catch (error) { 
      console.error('Error loading students data:', error);
    }
  };

  const collectAllActivityData = async (teacherClasses) => {
    let allActivities = [];
    for (const classItem of teacherClasses) {
      const students = await classService.getClassStudents(classItem.id);
      for (const student of students) {
        const { data: gameSessions } = await supabase
          .from('game_scores')
          .select('game_type, score, completed, created_at')
          .eq('student_id', student.student_id);
        
        if (gameSessions && gameSessions.length > 0) {
          gameSessions.forEach(session => {
            if (session.created_at) {
              allActivities.push({
                date: new Date(session.created_at),
                studentId: student.student_id,
                studentName: student.users?.name || 'Student',
                classId: classItem.id,
                className: classItem.name,
                gameType: session.game_type,
                score: session.score || 0,
                completed: session.completed || false
              });
            }
          });
        }
        
        const lastActivityDate = student.last_activity || student.joined_at;
        if (lastActivityDate) {
          allActivities.push({
            date: new Date(lastActivityDate),
            studentId: student.student_id,
            studentName: student.users?.name || 'Student',
            classId: classItem.id,
            className: classItem.name,
            gameType: 'login',
            score: 0,
            completed: true
          });
        }
      }
    }
    return allActivities;
  };

  const calculateAccurateWeeklyActivity = (activityData, totalStudents) => {
    const now = new Date();
    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
    const uniqueStudentsPerDay = [{}, {}, {}, {}, {}, {}, {}];
    
    activityData.forEach(activity => {
      const activityDate = new Date(activity.date);
      if (activityDate >= startOfWeek) {
        let dayIndex = activityDate.getDay() - 1;
        if (activityDate.getDay() === 0) dayIndex = 6;
        if (dayIndex >= 0 && dayIndex < 7) {
          if (!uniqueStudentsPerDay[dayIndex][activity.studentId]) {
            uniqueStudentsPerDay[dayIndex][activity.studentId] = true;
            weeklyActivity[dayIndex]++;
          }
        }
      }
    });
    
    if (totalStudents > 0) {
      return weeklyActivity.map(count => Math.min(100, Math.round((count / totalStudents) * 100)));
    }
    return [0, 0, 0, 0, 0, 0, 0];
  };

  const calculateMonthlyActivity = (activityData, totalStudents, year) => {
    const monthlyData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let month = 0; month < 12; month++) {
      const uniqueStudents = new Set();
      
      activityData.forEach(activity => {
        const activityDate = new Date(activity.date);
        if (activityDate.getMonth() === month && activityDate.getFullYear() === year) {
          uniqueStudents.add(activity.studentId);
        }
      });
      
      const percentage = totalStudents > 0 ? Math.min(100, Math.round((uniqueStudents.size / totalStudents) * 100)) : 0;
      monthlyData.push({
        month: month,
        monthName: monthNames[month],
        activityCount: uniqueStudents.size,
        percentage: percentage
      });
    }
    
    return monthlyData;
  };

  const calculateYearlyActivity = (activityData, totalStudents, year) => {
    const yearlyData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let month = 0; month < 12; month++) {
      const uniqueStudents = new Set();
      
      activityData.forEach(activity => {
        const activityDate = new Date(activity.date);
        if (activityDate.getMonth() === month && activityDate.getFullYear() === year) {
          uniqueStudents.add(activity.studentId);
        }
      });
      
      const percentage = totalStudents > 0 ? Math.min(100, Math.round((uniqueStudents.size / totalStudents) * 100)) : 0;
      yearlyData.push({
        month: month,
        monthName: monthNames[month],
        activityCount: uniqueStudents.size,
        percentage: percentage
      });
    }
    return yearlyData;
  };

  const loadTeacherAnalytics = async () => {
    if (!user?.dbId) { setLoading(false); return; }
    try {
      setLoading(true);
      let teacherClasses = [];
      if (selectedClass === 'all') teacherClasses = await classService.getTeacherClasses(user.dbId);
      else { const singleClass = await classService.getClassById(selectedClass); teacherClasses = singleClass ? [singleClass] : []; }
      if (!teacherClasses || teacherClasses.length === 0) { 
        setAnalytics(prev => ({ ...prev, activeClasses: 0, totalStudents: 0, averageProgress: 0, weeklyActivity: [0,0,0,0,0,0,0], monthlyActivity: [], yearlyActivity: [] })); 
        setLoading(false); 
        return; 
      }
      
      let totalStudentsCount = 0, allStudentsData = [], classesAnalytics = [];
      
      const allActivityData = await collectAllActivityData(teacherClasses);
      
      for (const classItem of teacherClasses) {
        const students = await classService.getClassStudents(classItem.id);
        const studentsCount = students.length;
        totalStudentsCount += studentsCount;
        
        let classOverallProgressSum = 0;
        let classTotalPoints = 0;
        let classTotalXP = 0;
        let classTotalScores = 0;
        let classMissionSum = 0;
        let classGameSum = 0;
        
        for (const enrollment of students) {
          const studentData = studentsList.find(s => s.id === enrollment.student_id);
          if (studentData) {
            classOverallProgressSum += studentData.overallProgress;
            classTotalPoints += studentData.points;
            classTotalXP += studentData.xpPoints;
            classTotalScores += studentData.totalScores;
            classMissionSum += studentData.missionCompletionRate;
            classGameSum += studentData.gameCompletionRate;
          } else {
            let studentPoints = 0, studentXP = 0, studentScores = 0;
            let studentMissionsCompleted = 0, studentGamesCompleted = 0;
            let studentGameProgress = { equation: { completed: false, highScore: 0, attempts: 0 }, battle: { completed: false, highScore: 0, attempts: 0 }, spaceShooter: { completed: false, highScore: 0, attempts: 0 } };
            
            const { data: pointsData } = await supabase
              .from('student_points')
              .select('points')
              .eq('student_id', enrollment.student_id)
              .eq('class_id', classItem.id)
              .maybeSingle();
            if (pointsData) studentPoints = pointsData.points || 0;
            
            let studentUserId = null;
            const { data: studentUserData } = await supabase
              .from('students')
              .select('user_id')
              .eq('id', enrollment.student_id)
              .maybeSingle();
            if (studentUserData) studentUserId = studentUserData.user_id;
            
            if (studentUserId) {
              const { data: xpData } = await supabase
                .from('user_xp')
                .select('xp')
                .eq('user_id', studentUserId)
                .maybeSingle();
              if (xpData) studentXP = xpData.xp || 0;
            }
            
            const { data: gameScores } = await supabase
              .from('game_scores')
              .select('game_type, score, completed')
              .eq('student_id', enrollment.student_id);
            if (gameScores) {
              gameScores.forEach(score => {
                studentScores += score.score || 0;
                if (score.completed) studentGamesCompleted++;
              });
            }
            
            const { data: missionsData } = await supabase
              .from('student_missions')
              .select('mission_id, completed')
              .eq('student_id', enrollment.student_id);
            if (missionsData) studentMissionsCompleted = missionsData.filter(m => m.completed === true).length;
            
            const missionRate = calculateStudentMissionProgress(studentMissionsCompleted);
            const gameRate = calculateStudentGameProgress(studentGameProgress);
            const overallFromPointsAndXP = calculateOverallProgressFromPointsAndXP(studentPoints, studentXP);
            
            classOverallProgressSum += overallFromPointsAndXP;
            classTotalPoints += studentPoints;
            classTotalXP += studentXP;
            classTotalScores += studentScores;
            classMissionSum += missionRate;
            classGameSum += gameRate;
          }
        }
        
        const classAvgOverall = studentsCount > 0 ? Math.round(classOverallProgressSum / studentsCount) : 0;
        const classAvgPoints = studentsCount > 0 ? Math.round(classTotalPoints / studentsCount) : 0;
        const classAvgXP = studentsCount > 0 ? Math.round(classTotalXP / studentsCount) : 0;
        const classAvgScores = studentsCount > 0 ? Math.round(classTotalScores / studentsCount) : 0;
        const classAvgMissions = studentsCount > 0 ? Math.round(classMissionSum / studentsCount) : 0;
        const classAvgGames = studentsCount > 0 ? Math.round(classGameSum / studentsCount) : 0;
        
        classesAnalytics.push({ 
          id: classItem.id, 
          name: classItem.name, 
          code: classItem.code, 
          studentsCount: studentsCount,
          averageProgress: classAvgOverall,
          averagePoints: classAvgPoints,
          averageXP: classAvgXP,
          averageScores: classAvgScores,
          averageMissions: classAvgMissions,
          averageGames: classAvgGames,
          totalPoints: classTotalPoints,
          totalXP: classTotalXP,
          totalScores: classTotalScores
        });
        
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
      }
      
      const weeklyActivity = calculateAccurateWeeklyActivity(allActivityData, totalStudentsCount);
      const monthlyActivity = calculateMonthlyActivity(allActivityData, totalStudentsCount, selectedYear);
      const yearlyActivity = calculateYearlyActivity(allActivityData, totalStudentsCount, selectedYear);
      
      // Build top performers with proper student names from studentsList
      const topPerformers = studentsList
        .filter(student => student && student.name && student.name !== 'Student')
        .map((student, index) => ({
          rank: index + 1,
          name: student.name,
          className: student.className,
          points: student.points || 0,
          xpPoints: student.xpPoints || 0,
          totalScores: student.totalScores || 0,
          missionProgress: student.missionCompletionRate || 0,
          gameProgress: student.gameCompletionRate || 0,
          overallProgress: student.overallProgress || 0,
          missionCount: student.missionCount || '0/4',
          gameCount: student.gameCount || '0/3'
        }))
        .sort((a, b) => b.overallProgress - a.overallProgress)
        .slice(0, 10);
      
      setAnalytics({ 
        totalStudents: totalStudentsCount, 
        activeClasses: teacherClasses.length, 
        averageProgress: classesAnalytics.length > 0 ? Math.round(classesAnalytics.reduce((sum, c) => sum + c.averageProgress, 0) / classesAnalytics.length) : 0,
        completionRate: 0, 
        totalMissions: 0, 
        completedMissions: 0, 
        weeklyActivity: weeklyActivity,
        monthlyActivity: monthlyActivity,
        yearlyActivity: yearlyActivity,
        topPerformers: topPerformers.slice(0, 5), 
        classesData: classesAnalytics,
        dailyActivityLog: allActivityData 
      });
    } catch (error) { console.error('Error loading teacher analytics:', error); }
    finally { setLoading(false); }
  };

  const renderActivityChart = () => {
    if (activityView === 'weekly') {
      return (
        <div style={styles.barChart}>
          {analytics.weeklyActivity.map((v, i) => (
            <div key={i} style={styles.barContainer}>
              <div style={styles.barLabel}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</div>
              <div style={styles.barWrapper}>
                <div style={{...styles.bar, height: `${Math.max(5, v)}%`, backgroundColor: i >= 5 ? '#f59e0b' : '#6366f1'}} />
              </div>
              <div style={styles.barValue}>{v}%</div>
            </div>
          ))}
        </div>
      );
    } else if (activityView === 'monthly') {
      const monthlyData = analytics.monthlyActivity || [];
      return (
        <div style={styles.monthlyChart}>
          <div style={styles.monthlyHeader}>
            <select 
              value={selectedYear} 
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value));
                loadTeacherAnalytics();
              }}
              style={styles.yearSelect}
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div style={styles.monthlyBars}>
            {monthlyData.map((month, i) => (
              <div key={i} style={styles.monthlyBarContainer}>
                <div style={styles.monthlyBarWrapper}>
                  <div style={{...styles.monthlyBar, height: `${Math.max(5, month.percentage)}%`, backgroundColor: '#6366f1'}} />
                </div>
                <div style={styles.monthlyBarLabel}>{month.monthName}</div>
                <div style={styles.monthlyBarValue}>{month.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      const yearlyData = analytics.yearlyActivity || [];
      return (
        <div style={styles.yearlyChart}>
          <div style={styles.yearlyHeader}>
            <select 
              value={selectedYear} 
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value));
                loadTeacherAnalytics();
              }}
              style={styles.yearSelectLarge}
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div style={styles.yearlyBars}>
            {yearlyData.map((month, i) => (
              <div key={i} style={styles.yearlyBarContainer}>
                <div style={styles.yearlyBarWrapper}>
                  <div style={{...styles.yearlyBar, height: `${Math.max(5, month.percentage)}%`, backgroundColor: '#8b5cf6'}} />
                </div>
                <div style={styles.yearlyBarLabel}>{month.monthName}</div>
                <div style={styles.yearlyBarValue}>{month.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  const renderModalActivityContent = () => {
    if (activityView === 'weekly') {
      return (
        <div style={styles.barChartLarge}>
          {analytics.weeklyActivity.map((v, i) => (
            <div key={i} style={styles.barContainerLarge}>
              <div style={styles.barLabelLarge}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</div>
              <div style={styles.barWrapperLarge}>
                <div style={{...styles.barLarge, height: `${Math.max(5, v)}%`, backgroundColor: i >= 5 ? '#f59e0b' : '#6366f1'}} />
              </div>
              <div style={styles.barValueLarge}>{v}%</div>
            </div>
          ))}
        </div>
      );
    } else if (activityView === 'monthly') {
      const monthlyData = analytics.monthlyActivity || [];
      return (
        <div style={styles.modalMonthlyChart}>
          <div style={styles.monthlyHeader}>
            <select 
              value={selectedYear} 
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value));
                loadTeacherAnalytics();
              }}
              style={styles.yearSelectLarge}
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div style={styles.monthlyBarsLarge}>
            {monthlyData.map((month, i) => (
              <div key={i} style={styles.monthlyBarContainerLarge}>
                <div style={styles.monthlyBarWrapperLarge}>
                  <div style={{...styles.monthlyBarLarge, height: `${Math.max(5, month.percentage)}%`, backgroundColor: '#6366f1'}} />
                </div>
                <div style={styles.monthlyBarLabelLarge}>{month.monthName}</div>
                <div style={styles.monthlyBarValueLarge}>{month.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      const yearlyData = analytics.yearlyActivity || [];
      return (
        <div style={styles.modalYearlyChart}>
          <div style={styles.yearlyHeader}>
            <select 
              value={selectedYear} 
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value));
                loadTeacherAnalytics();
              }}
              style={styles.yearSelectLarge}
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div style={styles.yearlyBarsLarge}>
            {yearlyData.map((month, i) => (
              <div key={i} style={styles.yearlyBarContainerLarge}>
                <div style={styles.yearlyBarWrapperLarge}>
                  <div style={{...styles.yearlyBarLarge, height: `${Math.max(5, month.percentage)}%`, backgroundColor: '#8b5cf6'}} />
                </div>
                <div style={styles.yearlyBarLabelLarge}>{month.monthName}</div>
                <div style={styles.yearlyBarValueLarge}>{month.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  const getPerformanceColor = (progress) => progress >= 80 ? '#10b981' : progress >= 60 ? '#f59e0b' : '#ef4444';
  const formatDateTime = (dateString) => { if (!dateString) return 'N/A'; const date = new Date(dateString); return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      setAnnouncementError('Please enter both a title and message');
      setTimeout(() => setAnnouncementError(''), 3000);
      return;
    }
    if (!selectedClassForAnnouncement) {
      setAnnouncementError('Please select a class');
      setTimeout(() => setAnnouncementError(''), 3000);
      return;
    }
    
    setSendingAnnouncement(true);
    setAnnouncementError('');
    
    try {
      if (!user) throw new Error('User not found. Please log in again.');
      const teacherId = user.dbId || user.id || user.sub || user.userId;
      if (!teacherId) throw new Error('Unable to get teacher ID');
      const targetClass = classes.find(c => String(c.id) === String(selectedClassForAnnouncement));
      if (!targetClass) throw new Error('Class not found');
      
      const announcementData = {
        id: Date.now(),
        class_id: targetClass.id,
        class_name: targetClass.name,
        teacher_id: teacherId,
        teacher_name: user.name || user.fullName || user.email?.split('@')[0] || 'Teacher',
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        created_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('announcements')
        .insert({
          class_id: targetClass.id,
          teacher_id: teacherId,
          teacher_name: announcementData.teacher_name,
          title: announcementData.title,
          message: announcementData.message,
          created_at: announcementData.created_at
        });
      
      if (insertError) {
        const existing = JSON.parse(localStorage.getItem('announcements') || '[]');
        existing.push(announcementData);
        localStorage.setItem('announcements', JSON.stringify(existing));
      }
      
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setSelectedClassForAnnouncement('');
      setShowAnnouncementModal(false);
      setAnnouncementSuccess(`✅ Announcement sent to "${targetClass.name}"!`);
      setTimeout(() => setAnnouncementSuccess(''), 3000);
    } catch (error) {
      console.error('Error sending announcement:', error);
      setAnnouncementError(error.message || 'Failed to send announcement');
      setTimeout(() => setAnnouncementError(''), 4000);
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>{title}</h3>
            <button style={styles.modalClose} onClick={onClose}>×</button>
          </div>
          <div style={styles.modalBody}>{children}</div>
        </div>
      </div>
    );
  };

  const FullStudentsTable = () => (
    <div style={styles.tableWrapper}>
      <table style={styles.studentTable}>
        <thead>
          <tr>
            <th style={styles.th}>Student</th>
            <th style={styles.th}>Points 🏆</th>
            <th style={styles.th}>XP ⭐</th>
            <th style={styles.th}>Scores 🎯</th>
            <th style={styles.th}>Missions 📋</th>
            <th style={styles.th}>Games 🎮</th>
            <th style={styles.th}>Overall %</th>
            <th style={styles.th}>Last Active</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {studentsList.map((student) => (
            <tr key={student.id} style={styles.tr}>
              <td style={styles.td}>
                <div style={styles.studentCell}>
                  <div style={styles.studentAvatar}>{student.name?.charAt(0) || 'S'}</div>
                  <div>
                    <div style={styles.studentName}>{student.name}</div>
                    <div style={styles.studentEmail}>{student.email}</div>
                  </div>
                </div>
              </td>
              <td style={styles.td}>
                <span style={styles.pointsValue}>{student.points || 0}</span>
              </td>
              <td style={styles.td}>
                <div style={styles.xpCell}><FiZap size={12} color="#f59e0b" />{student.xpPoints || 0}</div>
              </td>
              <td style={styles.td}>
                <span style={student.totalScores >= 800 ? styles.scoreHigh : (student.totalScores >= 500 ? styles.scoreMedium : styles.scoreLow)}>{student.totalScores || 0}</span>
              </td>
              <td style={styles.td}>
                <div>
                  <span>{student.missionCount || '0/4'}</span>
                  <div style={styles.progressBarSmall}>
                    <div style={{...styles.progressFillSmall, width: `${student.missionCompletionRate}%`, backgroundColor: '#10b981'}} />
                  </div>
                </div>
              </td>
              <td style={styles.td}>
                <div>
                  <span>{student.gameCount || '0/3'}</span>
                  <div style={styles.progressBarSmall}>
                    <div style={{...styles.progressFillSmall, width: `${student.gameCompletionRate}%`, backgroundColor: '#8b5cf6'}} />
                  </div>
                </div>
              </td>
              <td style={styles.td}>
                <div style={styles.progressCell}>
                  <div style={styles.progressBar}>
                    <div style={{...styles.progressFill, width: `${student.overallProgress}%`, backgroundColor: '#8b5cf6'}} />
                  </div>
                  <span>{student.overallProgress}%</span>
                </div>
              </td>
              <td style={styles.td}>
                <div style={styles.dateTimeCell}>
                  <FiClock size={10} />
                  <span>{formatDateTime(student.lastActivity)}</span>
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

  const classOverallProgress = studentsList.length > 0 ? Math.round(studentsList.reduce((sum, s) => sum + (s.overallProgress || 0), 0) / studentsList.length) : 0;
  const classMissionProgress = studentsList.length > 0 ? Math.round(studentsList.reduce((sum, s) => sum + s.missionCompletionRate, 0) / studentsList.length) : 0;
  const classGameProgress = studentsList.length > 0 ? Math.round(studentsList.reduce((sum, s) => sum + s.gameCompletionRate, 0) / studentsList.length) : 0;
  const totalPointsAll = studentsList.reduce((sum, s) => sum + (s.points || 0), 0);
  const totalXPAll = studentsList.reduce((sum, s) => sum + (s.xpPoints || 0), 0);
  const totalScoresAll = studentsList.reduce((sum, s) => sum + (s.totalScores || 0), 0);

  return (
    <div style={styles.container}>
      <Modal isOpen={isStudentsModalOpen} onClose={() => setIsStudentsModalOpen(false)} title={`Students (${studentsList.length})`}>
        <FullStudentsTable />
      </Modal>
      <Modal isOpen={isWeeklyActivityModalOpen} onClose={() => setIsWeeklyActivityModalOpen(false)} title={`Activity - ${activityView.charAt(0).toUpperCase() + activityView.slice(1)} View`}>
        <div style={styles.modalActivityHeader}>
          <div style={styles.viewToggleGroup}>
            <button 
              onClick={() => setActivityView('weekly')} 
              style={{...styles.viewToggle, ...(activityView === 'weekly' ? styles.viewToggleActive : {})}}
            >
              Weekly
            </button>
            <button 
              onClick={() => setActivityView('monthly')} 
              style={{...styles.viewToggle, ...(activityView === 'monthly' ? styles.viewToggleActive : {})}}
            >
              Monthly
            </button>
            <button 
              onClick={() => setActivityView('yearly')} 
              style={{...styles.viewToggle, ...(activityView === 'yearly' ? styles.viewToggleActive : {})}}
            >
              Yearly
            </button>
          </div>
        </div>
        {renderModalActivityContent()}
      </Modal>
      <Modal isOpen={isClassProgressModalOpen} onClose={() => setIsClassProgressModalOpen(false)} title="Class Progress">
        <div style={styles.classProgressContainer}>
          <div>
            <svg width="100" height="100" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#8b5cf6" strokeWidth="8" strokeDasharray={`${2*Math.PI*50}`} strokeDashoffset={`${2*Math.PI*50*(1-classOverallProgress/100)}`} transform="rotate(-90 60 60)" strokeLinecap="round"/>
              <text x="60" y="56" textAnchor="middle" fill="#1f2937" fontSize="16" fontWeight="bold">{classOverallProgress}%</text>
              <text x="60" y="72" textAnchor="middle" fill="#6b7280" fontSize="8">Avg</text>
            </svg>
          </div>
          <div>
            <div>
              <span>Missions: {classMissionProgress}%</span>
              <div style={styles.progressBarSmall}>
                <div style={{...styles.progressFillSmall, width: `${classMissionProgress}%`, backgroundColor: '#10b981'}} />
              </div>
            </div>
            <div>
              <span>Games: {classGameProgress}%</span>
              <div style={styles.progressBarSmall}>
                <div style={{...styles.progressFillSmall, width: `${classGameProgress}%`, backgroundColor: '#f59e0b'}} />
              </div>
            </div>
            <div><span>Students: {studentsList.length}</span></div>
          </div>
        </div>
      </Modal>
      <Modal isOpen={isPerformanceModalOpen} onClose={() => setIsPerformanceModalOpen(false)} title="Performance Distribution">
        <div style={styles.performanceSummary}>
          <div><span style={styles.perfDotExcellent} />Excellent (80-100%) <strong>{studentsList.filter(s => s.overallProgress >= 80).length}</strong> students</div>
          <div><span style={styles.perfDotGood} />Good (60-79%) <strong>{studentsList.filter(s => s.overallProgress >= 60 && s.overallProgress < 80).length}</strong> students</div>
          <div><span style={styles.perfDotAverage} />Average (40-59%) <strong>{studentsList.filter(s => s.overallProgress >= 40 && s.overallProgress < 60).length}</strong> students</div>
          <div><span style={styles.perfDotNeeds} />Needs Imp. (0-39%) <strong>{studentsList.filter(s => s.overallProgress < 40).length}</strong> students</div>
        </div>
        <div style={styles.performanceStudentList}>
          <h4 style={styles.performanceListTitle}>Student Details:</h4>
          {studentsList.map(student => (
            <div key={student.id} style={styles.performanceStudentItem}>
              <span style={styles.performanceStudentName}>{student.name}</span>
              <div style={styles.performanceStudentStats}>
                <span>🏆{student.points || 0}</span>
                <span>⭐{student.xpPoints || 0}</span>
                <span>🎯{student.totalScores || 0}</span>
                <span>📋{student.missionCount || '0/4'}</span>
                <span>🎮{student.gameCount || '0/3'}</span>
                <span style={{...styles.performanceStudentProgress, color: getPerformanceColor(student.overallProgress)}}>{student.overallProgress}%</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>
      <Modal isOpen={isClassPerformanceModalOpen} onClose={() => setIsClassPerformanceModalOpen(false)} title="Class Performance - Overall Progress">
        <div>
          {analytics.classesData.map((c, i) => (
            <div key={i} style={styles.classPerformanceCard}>
              <div style={styles.classPerformanceHeader}>
                <span style={styles.classPerformanceName}>{c.name}</span>
                <span style={styles.classPerformanceCount}>{c.studentsCount} students</span>
              </div>
              <div style={styles.classPerformanceStats}>
                <div style={styles.classPerformanceStat}>
                  <span style={styles.classPerformanceStatLabel}>Overall Progress</span>
                  <span style={{...styles.classPerformanceStatValue, color: getPerformanceColor(c.averageProgress)}}>{c.averageProgress}%</span>
                </div>
                <div style={styles.classPerformanceStatRow}>
                  <div style={styles.classPerformanceStatSmall}>
                    <span>🏆 Points</span>
                    <strong>{c.averagePoints}</strong>
                  </div>
                  <div style={styles.classPerformanceStatSmall}>
                    <span>⭐ XP</span>
                    <strong>{c.averageXP}</strong>
                  </div>
                  <div style={styles.classPerformanceStatSmall}>
                    <span>🎯 Scores</span>
                    <strong>{c.averageScores}</strong>
                  </div>
                </div>
                <div style={styles.classPerformanceStatRow}>
                  <div style={styles.classPerformanceStatSmall}>
                    <span>📋 Missions</span>
                    <strong>{c.averageMissions}%</strong>
                  </div>
                  <div style={styles.classPerformanceStatSmall}>
                    <span>🎮 Games</span>
                    <strong>{c.averageGames}%</strong>
                  </div>
                </div>
              </div>
              <div style={styles.classProgressBarContainer}>
                <div style={styles.classProgressBarLabel}>Class Progress</div>
                <div style={styles.classProgressBarWrapper}>
                  <div style={{...styles.classProgressFill, width: `${c.averageProgress}%`, backgroundColor: getPerformanceColor(c.averageProgress)}} />
                </div>
                <div style={styles.classProgressPercent}>{c.averageProgress}%</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
      <Modal isOpen={isTopPerformersModalOpen} onClose={() => setIsTopPerformersModalOpen(false)} title="Top Performers">
        <div>
          {analytics.topPerformers.map((s) => (
            <div key={s.rank} style={styles.topPerformerItem}>
              <div style={styles.topPerformerRank}>{s.rank}</div>
              <div style={styles.topPerformerInfo}>
                <div style={styles.topPerformerName}>{s.name}</div>
                <div style={styles.topPerformerClass}>{s.className}</div>
              </div>
              <div style={styles.topPerformerDetails}>
                <div style={styles.topPerformerStats}>
                  <span>🏆 {s.points}</span>
                  <span>⭐ {s.xpPoints}</span>
                  <span>🎯 {s.totalScores}</span>
                </div>
                <div style={styles.topPerformerProgress}>{s.overallProgress}%</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {announcementSuccess && (
        <div style={styles.successToast}>
          <FiCheckCircle size={16} />
          <span>{announcementSuccess}</span>
        </div>
      )}
      
      {announcementError && (
        <div style={styles.errorToast}>
          <FiAlertCircle size={16} />
          <span>{announcementError}</span>
        </div>
      )}

      {showAnnouncementModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAnnouncementModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}><FiBell size={16} /> Send Announcement</h3>
              <button onClick={() => setShowAnnouncementModal(false)} style={styles.modalClose}>×</button>
            </div>
            <div style={styles.modalBody}>
              <select 
                value={selectedClassForAnnouncement} 
                onChange={(e) => setSelectedClassForAnnouncement(e.target.value)} 
                style={styles.formSelect}
              >
                <option value="">-- Select Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.students_count || 0} students)</option>
                ))}
              </select>
              <input 
                type="text" 
                placeholder="Title" 
                value={announcementTitle} 
                onChange={(e) => setAnnouncementTitle(e.target.value)} 
                style={styles.formInput} 
              />
              <textarea 
                placeholder="Message" 
                value={announcementMessage} 
                onChange={(e) => setAnnouncementMessage(e.target.value)} 
                rows={4} 
                style={styles.formTextarea} 
              />
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowAnnouncementModal(false)} style={styles.cancelButton}>Cancel</button>
              <button onClick={handleSendAnnouncement} disabled={sendingAnnouncement} style={styles.sendButton}>
                {sendingAnnouncement ? 'Sending...' : <><FiSend size={14} /> Send</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <div>
          <h1 style={styles.welcomeTitle}>Welcome, {user?.name?.split(' ')[0] || 'Teacher'}!</h1>
          <p style={styles.welcomeDate}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
          <div style={styles.userStatsBadges}>
            <span style={styles.pointsBadge}>🏆 {totalPointsAll} Total Points</span>
            <span style={styles.xpBadge}>⭐ {totalXPAll} Total XP</span>
            <span style={styles.scoreBadge}>🎯 {totalScoresAll} Total Scores</span>
          </div>
        </div>
        <div style={styles.dropdownContainer}>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={styles.select}>
            <option value="all" style={styles.optionText}>All Classes ({classes.length})</option>
            {classes.map(c => (
              <option key={c.id} value={c.id} style={styles.optionText}>
                {c.name} ({c.students_count || 0})
              </option>
            ))}
          </select>
          <FiChevronDown style={styles.selectIcon} />
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FiUsers size={20} /></div>
          <div>
            <div style={styles.statValue}>{analytics.totalStudents}</div>
            <div style={styles.statLabel}>Students</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FiBookOpen size={20} /></div>
          <div>
            <div style={styles.statValue}>{analytics.activeClasses}</div>
            <div style={styles.statLabel}>Classes</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FiAward size={20} /></div>
          <div>
            <div style={styles.statValue}>{totalPointsAll}</div>
            <div style={styles.statLabel}>Total Points</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FiZap size={20} /></div>
          <div>
            <div style={styles.statValue}>{totalXPAll}</div>
            <div style={styles.statLabel}>Total XP</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FiTarget size={20} /></div>
          <div>
            <div style={styles.statValue}>{totalScoresAll}</div>
            <div style={styles.statLabel}>Total Scores</div>
          </div>
        </div>
      </div>

      <div style={styles.studentsSection}>
        <div style={styles.studentsCard}>
          <div style={styles.studentsCardIcon}><FiUsers size={32} color="#6366f1" /></div>
          <div>
            <h2 style={styles.studentsCardTitle}>Manage Students</h2>
            <p style={styles.studentsCardDesc}>{studentsList.length} students in your class</p>
            <button style={styles.viewStudentsButton} onClick={() => setIsStudentsModalOpen(true)}>
              <FiEye size={16} /> View All Students <span style={styles.studentCountBadge}>{studentsList.length}</span>
            </button>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.leftColumn}>
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}><FiActivity size={14} /> Activity Overview</h3>
              <div style={styles.viewToggleGroupSmall}>
                <button 
                  onClick={() => { setActivityView('weekly'); loadTeacherAnalytics(); }} 
                  style={{...styles.viewToggleSmall, ...(activityView === 'weekly' ? styles.viewToggleSmallActive : {})}}
                >
                  Week
                </button>
                <button 
                  onClick={() => { setActivityView('monthly'); loadTeacherAnalytics(); }} 
                  style={{...styles.viewToggleSmall, ...(activityView === 'monthly' ? styles.viewToggleSmallActive : {})}}
                >
                  Month
                </button>
                <button 
                  onClick={() => { setActivityView('yearly'); loadTeacherAnalytics(); }} 
                  style={{...styles.viewToggleSmall, ...(activityView === 'yearly' ? styles.viewToggleSmallActive : {})}}
                >
                  Year
                </button>
              </div>
              {isMobile && <button style={{...styles.viewButton, color: '#3b82f6'}} onClick={() => setIsWeeklyActivityModalOpen(true)}><FiMaximize2 size={12} /> View</button>}
            </div>
            {!isMobile && renderActivityChart()}
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}><FiTrendingUp size={14} color="#8b5cf6" /> Class Progress</h3>
              <span style={styles.sectionBadge}>{classOverallProgress}% Avg</span>
              {isMobile && <button style={{...styles.viewButton, color: '#3b82f6'}} onClick={() => setIsClassProgressModalOpen(true)}><FiMaximize2 size={12} /> View</button>}
            </div>
            {!isMobile && (
              <div style={styles.classProgressContainer}>
                <div>
                  <svg width="80" height="80" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#8b5cf6" strokeWidth="8" strokeDasharray={`${2*Math.PI*50}`} strokeDashoffset={`${2*Math.PI*50*(1-classOverallProgress/100)}`} transform="rotate(-90 60 60)" strokeLinecap="round"/>
                    <text x="60" y="56" textAnchor="middle" fill="#1f2937" fontSize="16" fontWeight="bold">{classOverallProgress}%</text>
                    <text x="60" y="72" textAnchor="middle" fill="#6b7280" fontSize="8">Avg</text>
                  </svg>
                </div>
                <div>
                  <div>
                    <span>Missions</span>
                    <span>{classMissionProgress}%</span>
                    <div style={styles.progressBarSmall}>
                      <div style={{...styles.progressFillSmall, width: `${classMissionProgress}%`, backgroundColor: '#10b981'}} />
                    </div>
                  </div>
                  <div>
                    <span>Games</span>
                    <span>{classGameProgress}%</span>
                    <div style={styles.progressBarSmall}>
                      <div style={{...styles.progressFillSmall, width: `${classGameProgress}%`, backgroundColor: '#f59e0b'}} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}><FiBarChart size={14} /> Performance Distribution</h3>
              {isMobile && <button style={{...styles.viewButton, color: '#3b82f6'}} onClick={() => setIsPerformanceModalOpen(true)}><FiMaximize2 size={12} /> View</button>}
            </div>
            {!isMobile && (
              <div style={styles.performanceSummary}>
                <div><span style={styles.perfDotExcellent} />Excellent <strong>{studentsList.filter(s => s.overallProgress >= 80).length}</strong></div>
                <div><span style={styles.perfDotGood} />Good <strong>{studentsList.filter(s => s.overallProgress >= 60 && s.overallProgress < 80).length}</strong></div>
                <div><span style={styles.perfDotAverage} />Avg <strong>{studentsList.filter(s => s.overallProgress < 60).length}</strong></div>
              </div>
            )}
          </div>
        </div>

        <div style={styles.rightColumn}>
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}><FiTarget size={14} /> Class Performance</h3>
              {isMobile && <button style={{...styles.viewButton, color: '#3b82f6'}} onClick={() => setIsClassPerformanceModalOpen(true)}><FiMaximize2 size={12} /> View</button>}
            </div>
            {!isMobile && analytics.classesData.slice(0,4).map((c, i) => (
              <div key={i} style={styles.classPerformanceCompact}>
                <div style={styles.classPerformanceCompactHeader}>
                  <span style={styles.classPerformanceCompactName}>{c.name}</span>
                  <span style={styles.classPerformanceCompactCount}>{c.studentsCount} std</span>
                </div>
                <div style={styles.classPerformanceCompactProgress}>
                  <div style={styles.classProgressBarWrapperCompact}>
                    <div style={{...styles.classProgressFillCompact, width: `${c.averageProgress}%`, backgroundColor: getPerformanceColor(c.averageProgress)}} />
                  </div>
                  <span style={styles.classPerformanceCompactPercent}>{c.averageProgress}%</span>
                </div>
                <div style={styles.classPerformanceCompactStats}>
                  <span>🏆 {c.averagePoints}</span>
                  <span>⭐ {c.averageXP}</span>
                  <span>🎯 {c.averageScores}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}><FiStar size={14} /> Top Performers</h3>
              {isMobile && <button style={{...styles.viewButton, color: '#3b82f6'}} onClick={() => setIsTopPerformersModalOpen(true)}><FiMaximize2 size={12} /> View</button>}
            </div>
            {!isMobile && analytics.topPerformers.slice(0,3).map((s) => (
              <div key={s.rank} style={styles.topPerformerItemCompact}>
                <div style={styles.topPerformerRankCompact}>{s.rank}</div>
                <div style={styles.topPerformerInfoCompact}>
                  <div style={styles.topPerformerNameCompact}>{s.name}</div>
                  <div style={styles.topPerformerClassCompact}>{s.className}</div>
                </div>
                <div style={styles.topPerformerProgressCompact}>{s.overallProgress}%</div>
              </div>
            ))}
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Quick Actions</h3>
            </div>
            <div style={styles.quickActions}>
              <button style={styles.actionButton} onClick={() => setShowAnnouncementModal(true)}>
                <FiBell size={14} style={{ color: '#3b82f6' }} /> 
                <span style={{ color: '#3b82f6', fontWeight: '500' }}>Send Announcement</span>
              </button>
              <button style={styles.actionButton} onClick={() => setIsStudentsModalOpen(true)}>
                <FiUsers size={14} style={{ color: '#3b82f6' }} /> 
                <span style={{ color: '#3b82f6', fontWeight: '500' }}>View Students</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { width: '100%', minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '12px', boxSizing: 'border-box' },
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '16px' },
  loadingSpinner: { width: '36px', height: '36px', border: '3px solid #f3f4f6', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' },
  welcomeTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '2px' },
  welcomeDate: { fontSize: '11px', color: '#6b7280' },
  userStatsBadges: { display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' },
  pointsBadge: { backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold' },
  xpBadge: { backgroundColor: '#fef3c7', color: '#f59e0b', padding: '2px 8px', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold' },
  scoreBadge: { backgroundColor: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold' },
  dropdownContainer: { minWidth: '180px', width: '100%' },
  select: { 
    width: '100%', 
    padding: '10px 32px 10px 14px', 
    fontSize: '14px', 
    fontWeight: '500',
    backgroundColor: 'white', 
    border: '1px solid #d1d5db', 
    borderRadius: '12px', 
    appearance: 'none', 
    cursor: 'pointer',
    color: '#1f2937',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  optionText: { color: '#1f2937', fontSize: '13px', fontWeight: '500', padding: '8px' },
  selectIcon: { position: 'relative', float: 'right', marginTop: '-30px', marginRight: '12px', color: '#6b7280', pointerEvents: 'none', fontSize: '16px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', marginBottom: '16px' },
  statCard: { backgroundColor: 'white', borderRadius: '14px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  statIcon: { width: '36px', height: '36px', backgroundColor: '#f3f4f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: '20px', fontWeight: '700', color: '#1f2937', lineHeight: 1.2 },
  statLabel: { fontSize: '9px', color: '#6b7280' },
  studentsSection: { marginBottom: '16px' },
  studentsCard: { backgroundColor: 'white', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  studentsCardIcon: { width: '60px', height: '60px', backgroundColor: '#e0e7ff', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  studentsCardTitle: { fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' },
  studentsCardDesc: { fontSize: '12px', color: '#6b7280', marginBottom: '8px' },
  viewStudentsButton: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', minHeight: '40px' },
  studentCountBadge: { backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '16px', fontSize: '10px', marginLeft: '6px' },
  mainGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: '16px' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionCard: { backgroundColor: 'white', borderRadius: '14px', padding: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' },
  sectionTitle: { fontSize: '13px', fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 },
  sectionBadge: { fontSize: '10px', padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '16px', color: '#6b7280' },
  viewButton: { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '10px', fontWeight: '500', cursor: 'pointer', minHeight: '32px' },
  
  viewToggleGroup: { display: 'flex', gap: '8px', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '12px' },
  viewToggle: { padding: '6px 16px', fontSize: '12px', fontWeight: '500', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent', color: '#6b7280', transition: 'all 0.2s' },
  viewToggleActive: { backgroundColor: '#6366f1', color: 'white' },
  viewToggleGroupSmall: { display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', padding: '2px', borderRadius: '8px' },
  viewToggleSmall: { padding: '4px 10px', fontSize: '10px', fontWeight: '500', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'transparent', color: '#6b7280' },
  viewToggleSmallActive: { backgroundColor: '#6366f1', color: 'white' },
  
  // Top Performers Compact Styles
  topPerformerItemCompact: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
  topPerformerRankCompact: { width: '28px', height: '28px', backgroundColor: '#e0e7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#4338ca', flexShrink: 0 },
  topPerformerInfoCompact: { flex: 1 },
  topPerformerNameCompact: { fontSize: '13px', fontWeight: '600', color: '#1f2937' },
  topPerformerClassCompact: { fontSize: '9px', color: '#9ca3af' },
  topPerformerProgressCompact: { fontSize: '14px', fontWeight: '700', color: '#10b981' },
  
  // Top Performers Modal Styles
  topPerformerItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f3f4f6' },
  topPerformerRank: { width: '32px', height: '32px', backgroundColor: '#e0e7ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#4338ca', flexShrink: 0 },
  topPerformerInfo: { flex: 1 },
  topPerformerName: { fontSize: '14px', fontWeight: '600', color: '#1f2937' },
  topPerformerClass: { fontSize: '10px', color: '#9ca3af' },
  topPerformerDetails: { textAlign: 'right' },
  topPerformerStats: { display: 'flex', gap: '8px', fontSize: '10px', color: '#6b7280', marginBottom: '4px' },
  topPerformerProgress: { fontSize: '14px', fontWeight: '700', color: '#10b981' },
  
  classPerformanceCompact: { padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  classPerformanceCompactHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  classPerformanceCompactName: { fontSize: '12px', fontWeight: '600', color: '#1f2937' },
  classPerformanceCompactCount: { fontSize: '9px', color: '#6b7280' },
  classPerformanceCompactProgress: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  classProgressBarWrapperCompact: { flex: 1, height: '4px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' },
  classProgressFillCompact: { height: '100%', borderRadius: '3px', transition: 'width 0.3s ease' },
  classPerformanceCompactPercent: { fontSize: '10px', fontWeight: '600', color: '#1f2937', minWidth: '35px' },
  classPerformanceCompactStats: { display: 'flex', gap: '10px', fontSize: '9px', color: '#6b7280' },
  
  classPerformanceCard: { backgroundColor: '#f9fafb', borderRadius: '12px', padding: '12px', marginBottom: '12px' },
  classPerformanceHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  classPerformanceName: { fontSize: '14px', fontWeight: '700', color: '#1f2937' },
  classPerformanceCount: { fontSize: '11px', color: '#6b7280' },
  classPerformanceStats: { marginBottom: '10px' },
  classPerformanceStat: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '6px 0', borderBottom: '1px solid #e5e7eb' },
  classPerformanceStatLabel: { fontSize: '11px', color: '#4b5563' },
  classPerformanceStatValue: { fontSize: '16px', fontWeight: '700' },
  classPerformanceStatRow: { display: 'flex', gap: '12px', marginBottom: '8px' },
  classPerformanceStatSmall: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px', backgroundColor: 'white', borderRadius: '8px' },
  classProgressBarContainer: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' },
  classProgressBarLabel: { fontSize: '10px', color: '#6b7280', minWidth: '60px' },
  classProgressBarWrapper: { flex: 1, height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' },
  classProgressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.3s ease' },
  classProgressPercent: { fontSize: '11px', fontWeight: '600', color: '#1f2937', minWidth: '40px', textAlign: 'right' },
  
  barChart: { display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '120px', minWidth: '240px' },
  barContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 },
  barLabel: { fontSize: '8px', fontWeight: '600', color: '#6b7280' },
  barWrapper: { width: '100%', height: '70px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  bar: { width: '20px', borderRadius: '3px', transition: 'height 0.3s ease', minHeight: '5px' },
  barValue: { fontSize: '8px', fontWeight: '600', color: '#1f2937' },
  
  monthlyChart: { width: '100%' },
  monthlyHeader: { display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'flex-end' },
  yearSelect: { padding: '4px 8px', fontSize: '11px', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: 'white' },
  yearSelectLarge: { padding: '6px 12px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white' },
  monthlyBars: { display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100px' },
  monthlyBarContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 },
  monthlyBarWrapper: { width: '100%', height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  monthlyBar: { width: '24px', borderRadius: '3px', transition: 'height 0.3s ease', minHeight: '5px' },
  monthlyBarLabel: { fontSize: '8px', fontWeight: '600', color: '#6b7280' },
  monthlyBarValue: { fontSize: '7px', color: '#6366f1', fontWeight: '500' },
  
  yearlyChart: { width: '100%' },
  yearlyHeader: { display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'flex-end' },
  yearlyBars: { display: 'flex', gap: '4px', alignItems: 'flex-end', height: '120px' },
  yearlyBarContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 },
  yearlyBarWrapper: { width: '100%', height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  yearlyBar: { width: '24px', borderRadius: '3px', transition: 'height 0.3s ease', minHeight: '5px' },
  yearlyBarLabel: { fontSize: '8px', fontWeight: '600', color: '#6b7280' },
  yearlyBarValue: { fontSize: '7px', color: '#8b5cf6', fontWeight: '500' },
  
  barChartLarge: { display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '200px', minWidth: '400px' },
  barContainerLarge: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 },
  barLabelLarge: { fontSize: '10px', fontWeight: '600', color: '#6b7280' },
  barWrapperLarge: { width: '100%', height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  barLarge: { width: '30px', borderRadius: '4px', transition: 'height 0.3s ease', minHeight: '5px' },
  barValueLarge: { fontSize: '10px', fontWeight: '600', color: '#1f2937' },
  
  modalMonthlyChart: { width: '100%' },
  monthlyBarsLarge: { display: 'flex', gap: '8px', alignItems: 'flex-end', height: '200px' },
  monthlyBarContainerLarge: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 },
  monthlyBarWrapperLarge: { width: '100%', height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  monthlyBarLarge: { width: '36px', borderRadius: '4px', transition: 'height 0.3s ease', minHeight: '5px' },
  monthlyBarLabelLarge: { fontSize: '10px', fontWeight: '600', color: '#6b7280' },
  monthlyBarValueLarge: { fontSize: '9px', color: '#6366f1', fontWeight: '500' },
  
  modalYearlyChart: { width: '100%' },
  yearlyBarsLarge: { display: 'flex', gap: '12px', alignItems: 'flex-end', height: '200px' },
  yearlyBarContainerLarge: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 },
  yearlyBarWrapperLarge: { width: '100%', height: '130px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  yearlyBarLarge: { width: '40px', borderRadius: '4px', transition: 'height 0.3s ease', minHeight: '5px' },
  yearlyBarLabelLarge: { fontSize: '10px', fontWeight: '600', color: '#6b7280' },
  yearlyBarValueLarge: { fontSize: '9px', color: '#8b5cf6', fontWeight: '600' },
  
  modalActivityHeader: { marginBottom: '16px' },
  classProgressContainer: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  performanceSummary: { display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' },
  performanceStudentList: { marginTop: '16px', maxHeight: '300px', overflowY: 'auto' },
  performanceListTitle: { fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' },
  performanceStudentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '8px' },
  performanceStudentName: { fontSize: '11px', color: '#4b5563', fontWeight: '500' },
  performanceStudentStats: { display: 'flex', gap: '8px', fontSize: '10px', flexWrap: 'wrap' },
  performanceStudentProgress: { fontSize: '10px', fontWeight: '600' },
  perfDotExcellent: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', marginRight: '4px' },
  perfDotGood: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', marginRight: '4px' },
  perfDotAverage: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1', marginRight: '4px' },
  perfDotNeeds: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', marginRight: '4px' },
  quickActions: { display: 'flex', flexDirection: 'column', gap: '8px' },
  actionButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', minHeight: '40px', width: '100%' },
  progressBarSmall: { height: '3px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' },
  progressFillSmall: { height: '100%', borderRadius: '2px', transition: 'width 0.3s ease' },
  progressCell: { display: 'flex', alignItems: 'center', gap: '6px', minWidth: '70px' },
  progressBar: { flex: 1, height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '2px', transition: 'width 0.3s ease' },
  pointsValue: { padding: '2px 6px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '6px', fontSize: '10px', fontWeight: '600' },
  dateTimeCell: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#6b7280' },
  statusActive: { display: 'inline-block', padding: '2px 6px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '9px', fontWeight: '500' },
  statusInactive: { display: 'inline-block', padding: '2px 6px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '9px', fontWeight: '500' },
  scoreHigh: { padding: '2px 6px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '9px', fontWeight: '600' },
  scoreMedium: { padding: '2px 6px', backgroundColor: '#fed7aa', color: '#92400e', borderRadius: '6px', fontSize: '9px', fontWeight: '600' },
  scoreLow: { padding: '2px 6px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '9px', fontWeight: '600' },
  xpCell: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', color: '#f59e0b' },
  studentCell: { display: 'flex', alignItems: 'center', gap: '8px' },
  studentAvatar: { width: '28px', height: '28px', backgroundColor: '#e0e7ff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', color: '#4338ca' },
  studentName: { fontSize: '11px', fontWeight: '500', color: '#1f2937' },
  studentEmail: { fontSize: '8px', color: '#9ca3af' },
  tableWrapper: { overflowX: 'auto' },
  studentTable: { width: '100%', borderCollapse: 'collapse', fontSize: '10px', minWidth: '800px' },
  th: { textAlign: 'left', padding: '8px 6px', fontSize: '9px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '8px 6px', fontSize: '10px', color: '#4b5563' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '12px' },
  modalContent: { backgroundColor: 'white', borderRadius: '16px', width: '90%', maxWidth: '95vw', maxHeight: '85vh', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' },
  modalTitle: { fontSize: '14px', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 },
  modalClose: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca3af', padding: '0', lineHeight: 1 },
  modalBody: { padding: '16px', overflowY: 'auto', maxHeight: 'calc(85vh - 60px)' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '12px 16px', borderTop: '1px solid #e5e7eb' },
  formSelect: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px' },
  formInput: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px' },
  formTextarea: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px', resize: 'vertical' },
  cancelButton: { padding: '6px 16px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', minHeight: '36px' },
  sendButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', minHeight: '36px' },
  successToast: { position: 'fixed', bottom: '16px', right: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '10px', fontSize: '12px', zIndex: 2000, animation: 'slideInRight 0.3s ease' },
  errorToast: { position: 'fixed', bottom: '16px', right: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', backgroundColor: '#ef4444', color: 'white', borderRadius: '10px', fontSize: '12px', zIndex: 2000, animation: 'slideInRight 0.3s ease' }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } 
  @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } 
  button:hover { opacity: 0.9; } 
  button:active { transform: scale(0.97); } 
  select:focus, input:focus, textarea:focus { border-color: #6366f1; outline: none; } 
  tr:hover { background-color: #f9fafb; } 
  
  @media (min-width: 769px) { 
    .dashboard-container { padding: 20px 24px; }
  }
  
  @media (min-width: 480px) { 
    .dropdown-container { width: auto; }
    .success-toast, .error-toast { left: auto; bottom: 20px; right: 20px; }
  }
  
  @media (max-width: 480px) { 
    button { minHeight: 40px; }
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .performance-student-stats { flex-wrap: wrap; }
  }
  
  select option { 
    color: #1f2937; 
    background-color: white; 
    font-size: 13px; 
    padding: 8px; 
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;