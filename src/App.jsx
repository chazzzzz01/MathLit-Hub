import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import SignIn from "./SignIn"
import AuthCallback from "./AuthCallback.jsx"
import LandingPage from "./LandingPage"
import Homepage from "./menu/Homepage"  
import Missions from "./menu/Missions" 
import Games from "./menu/Games" 
import Achievement from "./menu/Achievement" 
import ClassView from "./menu/ClassView"
import StudentHub from "./hub/StudentHub";
import TeacherHub from "./hub/TeacherHub";
// Import your game components
import EquationEscapeRoom from "./games/EquationEscapeRoom"
import BattleArena from "./games/BattleArena"
import SpaceShooter from "./games/SpaceShooter"
import TestEnv from "./TestEnv"
import Home from "./menu1/Home"
import Dashboard from "./menu1/Dashboard"
import Classes from "./menu1/Classes"
import Collaboration from "./menu1/Collaboration"
import CollaborationStudent from "./menu/CollaborationStudent";

// Import the UserProvider
import { UserProvider } from "./context/UserContext"
import AboutUs from "./landingmenu/aboutus";
import Mission1 from "./missions/mission1";
import Mission2 from "./missions/mission2";  
import Mission3 from "./missions/mission3";
import Mission4 from "./missions/mission4";
import '/src/App.css'

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/test" element={<TestEnv />} />
          
          {/* Student hub with nested routes */}
          <Route path="/studenthub" element={<StudentHub />}>
            <Route index element={<Homepage />} />
            <Route path="homepage" element={<Homepage />} />
            <Route path="missions" element={<Missions />} />
            <Route path="missions/1" element={<Mission1 />} />
            <Route path="missions/2" element={<Mission2 />} /> 
            <Route path="missions/3" element={<Mission3 />} />
            <Route path="missions/4" element={<Mission4 />} />
            <Route path="games" element={<Games />} />
            <Route path="achievement" element={<Achievement />} />
            <Route path="collaboration" element={<CollaborationStudent />} />
              
          </Route>
          
          {/* Teacher hub routes */}
          <Route path="/teacherhub" element={<TeacherHub />}>
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="collaboration" element={<Collaboration />} />
            <Route path="classes/:classId" element={<Classes />} />
            <Route path="students" element={<div>Students Page</div>} />
            <Route path="progress" element={<div>Progress Page</div>} />
             
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