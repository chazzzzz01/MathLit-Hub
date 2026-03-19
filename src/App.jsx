import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom"
import SignIn from "./SignIn"
import Homepage from "./menu/Homepage"  
import Missions from "./menu/Missions" 
import Games from "./menu/Games" 
import Achievement from "./menu/Achievement" 
import StudentHub from "./hub/StudentHub";
import TeacherHub from "./hub/TeacherHub";
import '/src/App.css'

function Home() {
  const navigate = useNavigate()

  return (
    <div style={styles.container}>
      <button 
        style={styles.button}
        onClick={() => navigate("/signin")}
      >
        Get Started
      </button>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        
        {/* Student hub with nested routes */}
        <Route path="/studenthub" element={<StudentHub />}>
          {/* Index route for /studenthub - redirects to homepage or renders default content */}
          <Route index element={<Homepage />} />
          <Route path="homepage" element={<Homepage />} />
          <Route path="missions" element={<Missions />} />
          <Route path="games" element={<Games />} />
          <Route path="achievement" element={<Achievement />} />
        </Route>
        
        {/* Teacher hub routes */}
        <Route path="/teacherhub" element={<TeacherHub />}>
          <Route index element={<Homepage />} />
          <Route path="homepage" element={<Homepage />} />
        </Route>
        
        {/* Catch all - redirect to home if no route matches */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  )
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  button: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '12px 24px',
    fontSize: '18px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }
}

export default App