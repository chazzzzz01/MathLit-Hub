import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import SignIn from "./SignIn"
import AuthCallback from "./AuthCallback.jsx"
import LandingPage from "./LandingPage"
import Homepage from "./menu/Homepage"  
import Missions from "./menu/Missions" 
import Games from "./menu/Games" 
import Achievement from "./menu/Achievement" 
import StudentHub from "./hub/StudentHub";
import TeacherHub from "./hub/TeacherHub";
// Import your game components
import EquationEscapeRoom from "./games/EquationEscapeRoom"
import BattleArena from "./games/BattleArena"
import SpaceShooter from "./games/SpaceShooter"
import TestEnv from "./TestEnv"
import Dashboard from "./menu1/Dashboard"  
// Import the UserProvider
import { UserProvider } from "./context/UserContext"
import '/src/App.css'

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/test" element={<TestEnv />} />
          
          {/* Student hub with nested routes */}
          <Route path="/studenthub" element={<StudentHub />}>
            <Route index element={<Homepage />} />
            <Route path="homepage" element={<Homepage />} />
            <Route path="missions" element={<Missions />} />
            <Route path="games" element={<Games />} />
            <Route path="achievement" element={<Achievement />} />
          </Route>
          
          {/* Teacher hub routes */}
          <Route path="/teacherhub" element={<TeacherHub />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>
          
          {/* Game routes - These will open in new tabs/pages */}
          <Route path="/game/equation" element={<EquationEscapeRoom />} />
          <Route path="/game/battle" element={<BattleArena />} />
          <Route path="/game/spaceshooter" element={<SpaceShooter />} />
          
          {/* Catch all - redirect to home if no route matches */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App