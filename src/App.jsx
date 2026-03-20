import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import SignIn from "./SignIn"
import AuthCallback from "./AuthCallback.jsx"  // Added .jsx extension
import LandingPage from "./LandingPage"
import Homepage from "./menu/Homepage"  
import Missions from "./menu/Missions" 
import Games from "./menu/Games" 
import Achievement from "./menu/Achievement" 
import StudentHub from "./hub/StudentHub";
import TeacherHub from "./hub/TeacherHub";
import '/src/App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
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
          <Route index element={<Homepage />} />
          <Route path="homepage" element={<Homepage />} />
        </Route>
        
        {/* Catch all - redirect to home if no route matches */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  )
}

export default App