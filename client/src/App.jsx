import { Routes, Route } from "react-router-dom"; // remove BrowserRouter here
import AuthGuard from "./components/AuthGuard";

import Login from "./login";
import Home from "./home";
import Register from "./register";

import UserDashboard from "./pages/userpages/UserDashboard";
import AdminDashboard from "./pages/adminpages/AdminDashboard";
import EmployerDashboard from "./pages/employerpages/EmployerDashboard";
import UserSettings from "./pages/userpages/UserSettings"
import NotFound from './NotFound'

function App() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────── */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ── User only ──────────────────────────────── */}
      <Route element={<AuthGuard allowedRoles={["user"]} />}>
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/user/settings" element={<UserSettings />} />
      </Route>

      {/* ── Employer only ──────────────────────────── */}
      <Route element={<AuthGuard allowedRoles={["employer"]} />}>
        <Route path="/employer" element={<EmployerDashboard />} />
      </Route>

      {/* ── Admin only ─────────────────────────────── */}
      <Route element={<AuthGuard allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;