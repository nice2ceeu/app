import { Routes, Route } from "react-router-dom"; // remove BrowserRouter here
import AuthGuard from "./components/AuthGuard";

import Login from "./login";
import Home from "./home";
import Register from "./register";


import UserSettings from "./pages/userpages/UserSettings"
import UserQueue from "./pages/userpages/UserQueue";
import UserMessage from "./pages/userpages/UserMessage";
import UserProfile from "./pages/userpages/UserProfile";
import UserFeed from "./pages/userpages/UserFeed";

import NotFound from './NotFound'
import EmployerMessage from "./pages/employerpages/EmployerMessage";
import LaborFinder from "./pages/employerpages/LaborFinder";
import EmployerFeed from "./pages/employerpages/EmployerFeed";
import EmployerSettings from "./pages/employerpages/EmployerSettings"


import UserManagement from "./pages/adminpages/UserManagement";



function App() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────── */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ── User only ──────────────────────────────── */}
      <Route element={<AuthGuard allowedRoles={["user"]} />}>
        {/* <Route path="/user" element={<UserDashboard />} /> */}
        <Route path="/user/settings" element={<UserSettings />} />
        <Route path="/user/queue" element={<UserQueue />} />
        <Route path="/user/feeds" element={<UserFeed />} />
        <Route path="/user/myprofile" element={<UserProfile />} />
        <Route path="/user/message" element={<UserMessage />} />
      </Route>

      {/* ── Employer only ──────────────────────────── */}
      <Route element={<AuthGuard allowedRoles={["employer"]} />}>
        {/* <Route path="/employer" element={<EmployerDashboard />} /> */}
        <Route path="/employer/feeds" element={<EmployerFeed />} />
        <Route path="/employer/find" element={<LaborFinder />} />
        <Route path="/employer/message" element={<EmployerMessage />} />
        <Route path="/employer/settings" element={<EmployerSettings />} />
      </Route>

      {/* ── Admin only ─────────────────────────────── */}
      <Route element={<AuthGuard allowedRoles={["admin"]} />}>
        {/* <Route path="/admin" element={<AdminDashboard />} /> */}
        <Route path="/admin/usermanagement" element={<UserManagement />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;