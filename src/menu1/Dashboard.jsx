import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { 
  MdPeople, 
  MdAssignment, 
  MdTrendingUp, 
  MdSchool,
  MdStar,
  MdWarning,
  MdCheckCircle,
  MdTimeline,
  MdSportsEsports,
  MdEmojiEvents,
  MdInsights,
  MdPending,
  MdDone,
  MdGamepad
} from 'react-icons/md';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

function Dashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    averageProgress: 0,
    completionRate: 0,
    pendingReviews: 0,
    activeMissions: 0,
    totalGames: 0,
    achievementsEarned: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [missionsData, setMissionsData] = useState([]);
  const [gamesData, setGamesData] = useState([]);
  const [achievementsData, setAchievementsData] = useState([]);
  const [teacherFeedback, setTeacherFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Mock data - replace with actual API calls from your Student Hub
  useEffect(() => {
    // Simulate API call to fetch Student Hub data
    setTimeout(() => {
      // Overall Stats
      setStats({
        totalStudents: 45,
        activeStudents: 38,
        averageProgress: 76,
        completionRate: 84,
        pendingReviews: 12,
        activeMissions: 8,
        totalGames: 156,
        achievementsEarned: 128
      });

      // Recent Activities (from missions, games, achievements)
      setRecentActivities([
        { id: 1, student: "Emma Watson", action: "Completed Mission: JavaScript Basics", time: "2 hours ago", type: "completion", points: 500 },
        { id: 2, student: "John Smith", action: "Scored 950 in Code Challenge Game", time: "3 hours ago", type: "game", points: 950 },
        { id: 3, student: "Lisa Johnson", action: "Earned 'Quick Learner' Achievement", time: "5 hours ago", type: "achievement", points: 100 },
        { id: 4, student: "Michael Brown", action: "Started Advanced Math Mission", time: "1 day ago", type: "mission_start", points: 0 },
        { id: 5, student: "Sarah Davis", action: "Perfect Score in Quiz Master", time: "1 day ago", type: "game_achievement", points: 100 },
        { id: 6, student: "Tom Wilson", action: "Completed 5 missions in a row", time: "2 days ago", type: "streak", points: 250 },
        { id: 7, student: "Alice Chen", action: "Needs assistance with React Mission", time: "2 days ago", type: "help", points: 0 }
      ]);

      // Performance Trend Data (weekly progress)
      setPerformanceData([
        { week: 'Week 1', missions: 65, games: 70, achievements: 45, target: 70 },
        { week: 'Week 2', missions: 68, games: 72, achievements: 52, target: 72 },
        { week: 'Week 3', missions: 72, games: 75, achievements: 58, target: 74 },
        { week: 'Week 4', missions: 75, games: 78, achievements: 65, target: 76 },
        { week: 'Week 5', missions: 78, games: 82, achievements: 72, target: 78 },
        { week: 'Week 6', missions: 82, games: 85, achievements: 78, target: 80 }
      ]);

      // Subject/Mission Performance
      setSubjectData([
        { name: 'Algebra', students: 38, progress: 72, completionRate: 68 },
        { name: 'Geometry', students: 35, progress: 68, completionRate: 65 },
        { name: 'Calculus', students: 28, progress: 65, completionRate: 62 },
        { name: 'Statistics', students: 32, progress: 70, completionRate: 66 },
        { name: 'JavaScript', students: 30, progress: 75, completionRate: 70 },
        { name: 'React', students: 25, progress: 68, completionRate: 64 }
      ]);

      // Active Missions Data
      setMissionsData([
        { id: 1, title: "JavaScript Mastery", students: 12, progress: 75, difficulty: "Medium", deadline: "2024-02-15" },
        { id: 2, title: "React Fundamentals", students: 8, progress: 45, difficulty: "Hard", deadline: "2024-02-20" },
        { id: 3, title: "CSS Styling", students: 15, progress: 85, difficulty: "Easy", deadline: "2024-02-10" },
        { id: 4, title: "Python Basics", students: 10, progress: 60, difficulty: "Medium", deadline: "2024-02-18" }
      ]);

      // Games Data
      setGamesData([
        { id: 1, name: "Code Challenge", plays: 245, avgScore: 78, highScore: 950, difficulty: "Advanced" },
        { id: 2, name: "Quiz Master", plays: 189, avgScore: 72, highScore: 100, difficulty: "Intermediate" },
        { id: 3, name: "Algorithm Race", plays: 156, avgScore: 65, highScore: 88, difficulty: "Hard" },
        { id: 4, name: "Bug Hunter", plays: 203, avgScore: 70, highScore: 92, difficulty: "Intermediate" }
      ]);

      // Achievements Data
      setAchievementsData([
        { id: 1, name: "Quick Learner", earned: 28, total: 45, progress: 62, icon: "⚡" },
        { id: 2, name: "Perfect Score", earned: 15, total: 45, progress: 33, icon: "🎯" },
        { id: 3, name: "Code Warrior", earned: 12, total: 45, progress: 27, icon: "⚔️" },
        { id: 4, name: "Streak Master", earned: 8, total: 45, progress: 18, icon: "🔥" },
        { id: 5, name: "Game Champion", earned: 20, total: 45, progress: 44, icon: "🏆" }
      ]);

      // Teacher Feedback & Monitoring
      setTeacherFeedback([
        { 
          id: 1, 
          teacher: "Ms. Smith", 
          student: "Emma Watson",
          message: "Excellent progress on JavaScript missions! Keep up the great work!",
          date: "2024-01-21", 
          type: "positive",
          rating: 5
        },
        { 
          id: 2, 
          teacher: "Mr. Johnson", 
          student: "John Smith",
          message: "Great score in Code Challenge! Consider trying the Advanced level next.",
          date: "2024-01-20", 
          type: "positive",
          rating: 4
        },
        { 
          id: 3, 
          teacher: "Dr. Williams", 
          student: "Lisa Johnson",
          message: "Please review the React components section before the next mission",
          date: "2024-01-19", 
          type: "feedback",
          rating: 3
        },
        { 
          id: 4, 
          teacher: "Ms. Smith", 
          student: "Michael Brown",
          message: "Good start on Advanced Math! Need to improve problem-solving speed",
          date: "2024-01-18", 
          type: "improvement",
          rating: 3
        }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const getActivityIcon = (type) => {
    switch(type) {
      case 'completion':
        return <MdCheckCircle style={styles.activityIconSuccess} />;
      case 'achievement':
        return <MdStar style={styles.activityIconStar} />;
      case 'game':
        return <MdSportsEsports style={styles.activityIconGame} />;
      case 'game_achievement':
        return <MdEmojiEvents style={styles.activityIconGameAchievement} />;
      case 'mission_start':
        return <MdAssignment style={styles.activityIconMission} />;
      case 'streak':
        return <MdTrendingUp style={styles.activityIconStreak} />;
      case 'help':
        return <MdWarning style={styles.activityIconWarning} />;
      default:
        return <MdInsights style={styles.activityIconDefault} />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      case 'Advanced': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p>Loading Student Hub Dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Welcome Section */}
      <div style={styles.welcomeSection}>
        <h1 style={styles.welcomeTitle}>
          Welcome back, {user?.name?.split(' ')[0] || 'Teacher'}! 👋
        </h1>
        <p style={styles.welcomeSubtitle}>
          Here's your comprehensive view of missions, games, achievements, and student progress.
        </p>
      </div>

      {/* Stats Cards - Extended for Student Hub */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <MdPeople size={32} color="#2563eb" />
          </div>
          <div style={styles.statInfo}>
            <h3 style={styles.statTitle}>Total Students</h3>
            <p style={styles.statValue}>{stats.totalStudents}</p>
            <p style={styles.statSubtext}>
              {stats.activeStudents} active this week
            </p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <MdAssignment size={32} color="#10b981" />
          </div>
          <div style={styles.statInfo}>
            <h3 style={styles.statTitle}>Active Missions</h3>
            <p style={styles.statValue}>{stats.activeMissions}</p>
            <p style={styles.statSubtext}>
              {stats.completionRate}% completion rate
            </p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <MdSportsEsports size={32} color="#f59e0b" />
          </div>
          <div style={styles.statInfo}>
            <h3 style={styles.statTitle}>Games Played</h3>
            <p style={styles.statValue}>{stats.totalGames}</p>
            <p style={styles.statSubtext}>
              total game sessions
            </p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <MdEmojiEvents size={32} color="#ef4444" />
          </div>
          <div style={styles.statInfo}>
            <h3 style={styles.statTitle}>Achievements</h3>
            <p style={styles.statValue}>{stats.achievementsEarned}</p>
            <p style={styles.statSubtext}>
              earned by students
            </p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <MdTrendingUp size={32} color="#8b5cf6" />
          </div>
          <div style={styles.statInfo}>
            <h3 style={styles.statTitle}>Average Progress</h3>
            <p style={styles.statValue}>{stats.averageProgress}%</p>
            <p style={styles.statSubtext}>
              +8% from last month
            </p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <MdPending size={32} color="#f97316" />
          </div>
          <div style={styles.statInfo}>
            <h3 style={styles.statTitle}>Pending Reviews</h3>
            <p style={styles.statValue}>{stats.pendingReviews}</p>
            <p style={styles.statSubtext}>
              assignments to review
            </p>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div style={styles.chartsGrid}>
        {/* Missions & Games Performance Trend */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Missions & Games Performance</h3>
          <p style={styles.chartSubtitle}>Weekly progress comparison</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="missions" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} name="Missions" />
              <Area type="monotone" dataKey="games" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Games" />
              <Area type="monotone" dataKey="achievements" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Achievements" />
              <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} name="Target" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subject/Mission Performance */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Mission Performance by Subject</h3>
          <p style={styles.chartSubtitle}>Progress & completion rates</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="progress" fill="#2563eb" name="Progress %" />
              <Bar dataKey="completionRate" fill="#10b981" name="Completion Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Missions and Games Section */}
      <div style={styles.chartsGrid}>
        {/* Active Missions */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📋 Active Missions</h3>
          <p style={styles.chartSubtitle}>Current missions and student progress</p>
          <div style={styles.missionsList}>
            {missionsData.map(mission => (
              <div key={mission.id} style={styles.missionItem}>
                <div style={styles.missionHeader}>
                  <div style={styles.missionTitle}>
                    <MdAssignment size={20} color="#2563eb" />
                    <strong>{mission.title}</strong>
                  </div>
                  <div style={styles.missionBadge} className={`difficulty-${mission.difficulty.toLowerCase()}`}>
                    {mission.difficulty}
                  </div>
                </div>
                <div style={styles.missionDetails}>
                  <span>{mission.students} students</span>
                  <span>Due: {mission.deadline}</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{...styles.progressFill, width: `${mission.progress}%`}}></div>
                </div>
                <div style={styles.progressText}>{mission.progress}% complete</div>
              </div>
            ))}
          </div>
        </div>

        {/* Games Overview */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>🎮 Popular Games</h3>
          <p style={styles.chartSubtitle}>Game statistics and high scores</p>
          <div style={styles.gamesList}>
            {gamesData.map(game => (
              <div key={game.id} style={styles.gameItem}>
                <div style={styles.gameHeader}>
                  <MdGamepad size={20} color="#10b981" />
                  <strong>{game.name}</strong>
                  <span style={{...styles.difficultyBadge, backgroundColor: getDifficultyColor(game.difficulty)}}>
                    {game.difficulty}
                  </span>
                </div>
                <div style={styles.gameStats}>
                  <div>Plays: {game.plays}</div>
                  <div>Avg Score: {game.avgScore}</div>
                  <div>High Score: {game.highScore}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements and Teacher Feedback */}
      <div style={styles.chartsGrid}>
        {/* Achievements Distribution */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>🏆 Achievement Progress</h3>
          <p style={styles.chartSubtitle}>Student achievements earned vs total</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={achievementsData.map(a => ({ name: a.name, value: a.earned, total: a.total }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {achievementsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={styles.achievementsList}>
            {achievementsData.map(achievement => (
              <div key={achievement.id} style={styles.achievementItem}>
                <span style={styles.achievementIcon}>{achievement.icon}</span>
                <span style={styles.achievementName}>{achievement.name}</span>
                <div style={styles.miniProgressBar}>
                  <div style={{...styles.miniProgressFill, width: `${achievement.progress}%`}}></div>
                </div>
                <span style={styles.achievementCount}>{achievement.earned}/{achievement.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher Feedback & Monitoring */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>👨‍🏫 Teacher Monitoring & Feedback</h3>
          <p style={styles.chartSubtitle}>Latest observations and recommendations</p>
          <div style={styles.feedbackList}>
            {teacherFeedback.map(feedback => (
              <div key={feedback.id} style={styles.feedbackItem}>
                <div style={styles.feedbackHeader}>
                  <MdSchool size={18} color="#8b5cf6" />
                  <strong>{feedback.teacher}</strong>
                  <span style={styles.feedbackStudent}>to {feedback.student}</span>
                  <span style={styles.feedbackDate}>{feedback.date}</span>
                </div>
                <p style={styles.feedbackMessage}>{feedback.message}</p>
                <div style={styles.feedbackRating}>
                  {[...Array(5)].map((_, i) => (
                    <MdStar key={i} size={14} color={i < feedback.rating ? "#f59e0b" : "#e5e7eb"} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div style={styles.activityCard}>
        <h3 style={styles.activityTitle}>📊 Recent Student Activity</h3>
        <div style={styles.activityList}>
          {recentActivities.map(activity => (
            <div key={activity.id} style={styles.activityItem}>
              {getActivityIcon(activity.type)}
              <div style={styles.activityContent}>
                <p style={styles.activityText}>
                  <strong>{activity.student}</strong> {activity.action}
                  {activity.points > 0 && <span style={styles.pointsBadge}>+{activity.points} pts</span>}
                </p>
                <p style={styles.activityTime}>{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
  },
  loader: {
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  welcomeSection: {
    marginBottom: '32px',
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
  },
  welcomeSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
  },
  statIcon: {
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  statSubtext: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  chartSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '20px',
  },
  missionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  missionItem: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  missionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  missionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  missionBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  missionDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '4px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    transition: 'width 0.3s',
  },
  progressText: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'right',
  },
  gamesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  gameItem: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  gameHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  gameStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    fontSize: '12px',
    color: '#6b7280',
  },
  difficultyBadge: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    color: 'white',
    marginLeft: 'auto',
  },
  achievementsList: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  achievementItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
  },
  achievementIcon: {
    fontSize: '20px',
  },
  achievementName: {
    width: '100px',
    fontWeight: '500',
  },
  miniProgressBar: {
    flex: 1,
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    transition: 'width 0.3s',
  },
  achievementCount: {
    fontSize: '12px',
    color: '#6b7280',
    minWidth: '50px',
    textAlign: 'right',
  },
  feedbackList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  feedbackItem: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  feedbackHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '14px',
    flexWrap: 'wrap',
  },
  feedbackStudent: {
    color: '#6b7280',
    fontSize: '12px',
  },
  feedbackDate: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#9ca3af',
  },
  feedbackMessage: {
    fontSize: '14px',
    color: '#1f2937',
    marginBottom: '8px',
  },
  feedbackRating: {
    display: 'flex',
    gap: '2px',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  activityTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#f3f4f6',
    },
  },
  activityIconSuccess: {
    fontSize: '20px',
    color: '#10b981',
  },
  activityIconStar: {
    fontSize: '20px',
    color: '#f59e0b',
  },
  activityIconGame: {
    fontSize: '20px',
    color: '#8b5cf6',
  },
  activityIconGameAchievement: {
    fontSize: '20px',
    color: '#ef4444',
  },
  activityIconMission: {
    fontSize: '20px',
    color: '#2563eb',
  },
  activityIconStreak: {
    fontSize: '20px',
    color: '#f97316',
  },
  activityIconWarning: {
    fontSize: '20px',
    color: '#ef4444',
  },
  activityIconDefault: {
    fontSize: '20px',
    color: '#6b7280',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: '14px',
    color: '#1f2937',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  activityTime: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  pointsBadge: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
};

// Add keyframe animation for loader
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .difficulty-easy {
    background-color: #10b98120;
    color: #10b981;
  }
  
  .difficulty-medium {
    background-color: #f59e0b20;
    color: #f59e0b;
  }
  
  .difficulty-hard {
    background-color: #ef444420;
    color: #ef4444;
  }
  
  .difficulty-advanced {
    background-color: #8b5cf620;
    color: #8b5cf6;
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;