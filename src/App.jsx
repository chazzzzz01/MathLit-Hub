import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import SignIn from "./SignIn"
import LandingPage from "./LandingPage"  // Import the new LandingPage component
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
        <Route path="/" element={<LandingPage />} />  {/* Now using LandingPage component */}
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
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  )
}

export default App